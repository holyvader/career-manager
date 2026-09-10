import { resolve4, resolve6 } from 'node:dns/promises';
import type { JobOfferContentSource } from '../contentSource';
import {
  decodeHtml,
  type ExtractedJobPosting,
  extractJobPosting,
} from '../importing/extractJobPosting';

const ALLOWED_HOSTS = new Set([
  'linkedin.com',
  'www.linkedin.com',
  'nofluffyjobs.com',
  'www.nofluffyjobs.com',
  'pracuj.pl',
  'www.pracuj.pl',
  'justjoin.it',
  'www.justjoin.it',
]);

const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;

// The single source of truth for "is this URL one of the four supported job
// boards" - reused to revalidate every redirect hop too, so the allowlist
// can't silently drift between the initial check and later ones.
export function validateJobOfferUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') {
    return null;
  }
  if (!ALLOWED_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }
  return url;
}

const PRIVATE_V4_RANGES: [number[], number][] = [
  [[10, 0, 0, 0], 8],
  [[172, 16, 0, 0], 12],
  [[192, 168, 0, 0], 16],
  [[127, 0, 0, 0], 8],
  [[169, 254, 0, 0], 16],
  [[0, 0, 0, 0], 8],
  [[100, 64, 0, 0], 10],
];

function ipv4ToInt(octets: number[]): number {
  return octets.reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
}

function isPrivateV4(addr: string): boolean {
  const octets = addr.split('.').map(Number);
  if (octets.length !== 4 || octets.some((n) => Number.isNaN(n))) {
    return false;
  }
  const addrInt = ipv4ToInt(octets);
  return PRIVATE_V4_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (addrInt & mask) === (ipv4ToInt(base) & mask);
  });
}

function isPrivateV6(addr: string): boolean {
  const lower = addr.toLowerCase();
  return (
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80') ||
    lower.startsWith('::ffff:')
  );
}

// Defense-in-depth, not a complete fix: fetch() re-resolves DNS itself after
// this check and there's no hook to pin the connection to the exact address
// verified here, so a TOCTOU window exists in principle. For a fixed
// allowlist of large SaaS providers this mainly guards against environment
// misconfiguration (e.g. a stray /etc/hosts entry), not a determined
// attacker controlling one of these domains' DNS.
export async function hasOnlyPublicAddresses(
  hostname: string,
): Promise<boolean> {
  const [v4, v6] = await Promise.all([
    resolve4(hostname).catch(() => [] as string[]),
    resolve6(hostname).catch(() => [] as string[]),
  ]);
  const addresses = [...v4, ...v6];
  if (!addresses.length) {
    return false;
  }
  return addresses.every((addr) => !isPrivateV4(addr) && !isPrivateV6(addr));
}

// Content-Length alone is not a trustworthy size guard - it can be absent
// (chunked encoding), and it reflects the compressed wire size while Bun's
// fetch auto-decompresses gzip/br before this code sees the bytes, so a
// small reported length can still decompress into a huge buffer. Reading
// via the stream reader and cancelling it mid-flight actually stops the
// download rather than merely stopping accumulation after the fact.
async function readBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) {
    return new Uint8Array(0);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel('response exceeded max size');
      throw new Error('Response exceeded max size');
    }
    chunks.push(value);
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function fetchHtmlWithLimits(startUrl: URL): Promise<string | null> {
  let currentUrl = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const sizeController = new AbortController();
    const signal = AbortSignal.any([
      AbortSignal.timeout(FETCH_TIMEOUT_MS),
      sizeController.signal,
    ]);

    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal,
      headers: {
        // Identify honestly rather than spoofing a browser UA - LinkedIn's
        // bot detection doesn't meaningfully key off UA string alone (TLS/JS
        // fingerprinting, login walls), so spoofing buys little there, and
        // the other three sites are SEO-oriented and generally serve
        // server-rendered HTML to any well-behaved client.
        'user-agent': 'CareerManagerBot/1.0',
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,pl;q=0.8',
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return null;
      }
      const nextUrl = new URL(location, currentUrl);
      if (
        nextUrl.protocol !== 'https:' ||
        !ALLOWED_HOSTS.has(nextUrl.hostname.toLowerCase())
      ) {
        return null;
      }
      if (!(await hasOnlyPublicAddresses(nextUrl.hostname))) {
        return null;
      }
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) {
      return null;
    }
    const contentType = response.headers.get('content-type');
    if (!contentType?.toLowerCase().startsWith('text/html')) {
      return null;
    }

    const bytes = await readBodyWithLimit(response, MAX_RESPONSE_BYTES).catch(
      () => null,
    );
    if (!bytes) {
      return null;
    }
    return decodeHtml(bytes, contentType);
  }

  return null; // exceeded MAX_REDIRECTS
}

export async function fetchJobOfferContent(
  input: string,
): Promise<ExtractedJobPosting | null> {
  const url = validateJobOfferUrl(input);
  if (!url) {
    return null;
  }
  if (!(await hasOnlyPublicAddresses(url.hostname))) {
    return null;
  }
  const html = await fetchHtmlWithLimits(url);
  if (html === null) {
    return null;
  }
  return extractJobPosting(html);
}

export const jobBoardContentSource: JobOfferContentSource = {
  fetchContent: fetchJobOfferContent,
};

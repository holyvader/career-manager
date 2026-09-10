import { load } from 'cheerio';

const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10_000;
const MAX_JSON_LD_DEPTH = 10;

export interface ExtractedJobPosting {
  title: string | null;
  content: string | null;
}

// Response.text() always decodes as UTF-8 per the Fetch spec, but two of the
// four target sites are Polish and may declare windows-1250/iso-8859-2 -
// naively trusting UTF-8 would corrupt ą/ć/ę/ł/ń/ó/ś/ź/ż. Sniff the real
// charset from the Content-Type header, falling back to a <meta charset>
// scan of the first ~1KB (matches how browsers sniff when the header omits it).
export function decodeHtml(
  bytes: Uint8Array,
  contentType: string | null,
): string {
  let charset = contentType
    ?.match(/charset=([^;]+)/i)?.[1]
    ?.trim()
    .toLowerCase();
  if (!charset) {
    const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
    charset = head
      .match(/<meta[^>]+charset=["']?([\w-]+)/i)?.[1]
      ?.toLowerCase();
  }
  try {
    return new TextDecoder(charset ?? 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

// schema.org's `description` field may itself contain HTML - strip it down
// to plain text so raw markup never leaves the backend (the frontend renders
// this as a plain React child, but returning genuine plain text is the
// honest contract for this API regardless).
export function htmlToPlainText(html: string): string {
  const $fragment = load(html);
  return $fragment
    .root()
    .text()
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface JobPostingFields {
  title?: string;
  description?: string;
}

function findJobPosting(node: unknown, depth = 0): JobPostingFields | null {
  if (depth > MAX_JSON_LD_DEPTH) {
    return null;
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item, depth + 1);
      if (found) {
        return found;
      }
    }
    return null;
  }
  if (typeof node !== 'object' || node === null) {
    return null;
  }

  const obj = node as Record<string, unknown>;
  const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
  if (
    types.some((t) => typeof t === 'string' && t.toLowerCase() === 'jobposting')
  ) {
    return {
      title: typeof obj.title === 'string' ? obj.title : undefined,
      description:
        typeof obj.description === 'string' ? obj.description : undefined,
    };
  }
  if (Array.isArray(obj['@graph'])) {
    const found = findJobPosting(obj['@graph'], depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}

function extractFromJsonLd(
  $: ReturnType<typeof load>,
): JobPostingFields | null {
  for (const el of $('script[type="application/ld+json"]').toArray()) {
    const raw = $(el).contents().text();
    if (!raw?.trim()) {
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      continue; // skip malformed blocks, keep scanning the rest of the page
    }
    const found = findJobPosting(parsed);
    if (found) {
      return found;
    }
  }
  return null;
}

function extractFromOpenGraph(
  $: ReturnType<typeof load>,
): JobPostingFields | null {
  const title = $('meta[property="og:title"]').attr('content');
  const description = $('meta[property="og:description"]').attr('content');
  if (!title && !description) {
    return null;
  }
  return { title, description };
}

function normalize(
  value: string | undefined | null,
  maxLength: number,
): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, maxLength);
}

// Some sites' own OG/JSON-LD metadata is broken and leaks an unresolved
// i18n key instead of real text (observed live: justjoin.it serving
// `og:description="legacy.seo.description"`). A real description always has
// at least one space; a bare dotted identifier with no whitespace never is.
function looksLikePlaceholder(value: string): boolean {
  return /^[\w-]+(\.[\w-]+)+$/.test(value);
}

function normalizeContent(
  value: string | undefined | null,
  maxLength: number,
): string | null {
  const normalized = normalize(value, maxLength);
  if (normalized && looksLikePlaceholder(normalized)) {
    return null;
  }
  return normalized;
}

// Priority chain: structured schema.org JobPosting data (most reliable,
// used by these job boards for Google/LinkedIn job-search SEO) -> Open
// Graph meta tags -> the bare <title> tag. Each step is only consulted if
// the previous one produced nothing.
export function extractJobPosting(html: string): ExtractedJobPosting {
  const $ = load(html);

  const jsonLd = extractFromJsonLd($);
  if (jsonLd?.title || jsonLd?.description) {
    return {
      title: normalize(jsonLd.title, MAX_TITLE_LENGTH),
      content: normalizeContent(
        jsonLd.description ? htmlToPlainText(jsonLd.description) : null,
        MAX_CONTENT_LENGTH,
      ),
    };
  }

  const openGraph = extractFromOpenGraph($);
  if (openGraph?.title || openGraph?.description) {
    return {
      title: normalize(openGraph.title, MAX_TITLE_LENGTH),
      content: normalizeContent(openGraph.description, MAX_CONTENT_LENGTH),
    };
  }

  return {
    title: normalize($('title').text(), MAX_TITLE_LENGTH),
    content: null,
  };
}

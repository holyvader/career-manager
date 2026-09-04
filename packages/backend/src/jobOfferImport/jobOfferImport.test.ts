import { describe, expect, it } from 'bun:test';
import { extractJobPosting } from './extractJobPosting';
import { validateJobOfferUrl } from './fetchJobOfferContent';

describe('validateJobOfferUrl', () => {
  it('accepts a valid https URL on an allowlisted host', () => {
    const url = validateJobOfferUrl('https://www.justjoin.it/offers/some-job');
    expect(url).not.toBeNull();
    expect(url?.hostname).toBe('www.justjoin.it');
  });

  it('rejects http (wrong scheme)', () => {
    expect(validateJobOfferUrl('http://pracuj.pl/oferta/123')).toBeNull();
  });

  it('rejects a subdomain-confusion attempt', () => {
    expect(validateJobOfferUrl('https://evil-linkedin.com/jobs/1')).toBeNull();
    expect(validateJobOfferUrl('https://linkedin.com.evil.com/jobs/1')).toBeNull();
  });

  it('rejects an IP-literal host', () => {
    expect(validateJobOfferUrl('https://192.168.1.1/jobs/1')).toBeNull();
  });

  it('rejects a malformed URL string', () => {
    expect(validateJobOfferUrl('not a url')).toBeNull();
  });

  it('rejects a host that is not one of the four supported job boards', () => {
    expect(validateJobOfferUrl('https://example.com/jobs/1')).toBeNull();
  });
});

describe('extractJobPosting', () => {
  it('extracts title/description from a JobPosting JSON-LD block', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          { "@type": "JobPosting", "title": "Senior Engineer", "description": "Build things." }
        </script>
      </head></html>
    `;
    expect(extractJobPosting(html)).toEqual({
      title: 'Senior Engineer',
      content: 'Build things.',
    });
  });

  it('finds a JobPosting nested inside an @graph array', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          { "@graph": [
            { "@type": "WebPage" },
            { "@type": "JobPosting", "title": "Backend Dev", "description": "Ship APIs." }
          ] }
        </script>
      </head></html>
    `;
    expect(extractJobPosting(html)).toEqual({
      title: 'Backend Dev',
      content: 'Ship APIs.',
    });
  });

  it('matches when @type is an array containing JobPosting', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">
          { "@type": ["Thing", "JobPosting"], "title": "Data Analyst", "description": "Crunch data." }
        </script>
      </head></html>
    `;
    expect(extractJobPosting(html)).toEqual({
      title: 'Data Analyst',
      content: 'Crunch data.',
    });
  });

  it('skips a malformed JSON-LD block and falls back to Open Graph tags', () => {
    const html = `
      <html><head>
        <script type="application/ld+json">{ not valid json </script>
        <meta property="og:title" content="Frontend Engineer" />
        <meta property="og:description" content="React all day." />
      </head></html>
    `;
    expect(extractJobPosting(html)).toEqual({
      title: 'Frontend Engineer',
      content: 'React all day.',
    });
  });

  it('treats an unresolved i18n key in og:description as no content (observed live on justjoin.it)', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Senior Software Developer (GoLang)" />
        <meta property="og:description" content="legacy.seo.description" />
      </head></html>
    `;
    expect(extractJobPosting(html)).toEqual({
      title: 'Senior Software Developer (GoLang)',
      content: null,
    });
  });

  it('falls back to the bare <title> tag when nothing else is found', () => {
    const html = '<html><head><title>Just a title</title></head></html>';
    expect(extractJobPosting(html)).toEqual({
      title: 'Just a title',
      content: null,
    });
  });
});

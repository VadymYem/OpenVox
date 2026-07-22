import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Google Analytics bootstrap', () => {
  it('contains the AuthorChe GA4 measurement tag in the production HTML template', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('https://www.googletagmanager.com/gtag/js?id=G-6LN7QL6SP2');
    expect(html).toContain("gtag('config', 'G-6LN7QL6SP2')");
  });
});

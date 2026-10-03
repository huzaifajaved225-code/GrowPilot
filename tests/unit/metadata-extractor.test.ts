import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";
import { extractMetadata } from "@/ai-core/tools/schema-builder/metadata-extractor";
import { detectStructuredData } from "@/ai-core/tools/schema-builder/structured-data-detector";

describe("Metadata Extractor", () => {
  it("extracts title", () => {
    const $ = cheerio.load("<html><head><title>My Page</title></head><body></body></html>");
    const meta = extractMetadata($, "https://example.com");
    expect(meta.title).toBe("My Page");
  });

  it("extracts meta description", () => {
    const $ = cheerio.load(
      '<html><head><meta name="description" content="A test page"></head><body></body></html>',
    );
    const meta = extractMetadata($, "https://example.com");
    expect(meta.description).toBe("A test page");
  });

  it("extracts canonical URL", () => {
    const $ = cheerio.load(
      '<html><head><link rel="canonical" href="https://example.com/page"></head><body></body></html>',
    );
    const meta = extractMetadata($, "https://example.com");
    expect(meta.canonical).toBe("https://example.com/page");
  });

  it("extracts language", () => {
    const $ = cheerio.load('<html lang="en"><head></head><body></body></html>');
    const meta = extractMetadata($, "https://example.com");
    expect(meta.language).toBe("en");
  });

  it("extracts headings", () => {
    const $ = cheerio.load(
      "<html><body><h1>Main Title</h1><h2>Sub 1</h2><h3>Sub 2</h3></body></html>",
    );
    const meta = extractMetadata($, "https://example.com");
    expect(meta.headings.h1).toEqual(["Main Title"]);
    expect(meta.headings.h2).toEqual(["Sub 1"]);
    expect(meta.headings.h3).toEqual(["Sub 2"]);
  });

  it("extracts Open Graph metadata", () => {
    const html = `<html><head>
            <meta property="og:title" content="OG Title">
            <meta property="og:description" content="OG Desc">
            <meta property="og:image" content="https://example.com/img.jpg">
            <meta property="og:url" content="https://example.com/page">
            <meta property="og:type" content="website">
        </head><body></body></html>`;
    const $ = cheerio.load(html);
    const meta = extractMetadata($, "https://example.com");
    expect(meta.openGraph.ogTitle).toBe("OG Title");
    expect(meta.openGraph.ogDescription).toBe("OG Desc");
    expect(meta.openGraph.ogImage).toBe("https://example.com/img.jpg");
    expect(meta.openGraph.ogType).toBe("website");
  });

  it("extracts JSON-LD structured data", () => {
    const html = `<html><head>
            <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Test"}</script>
        </head><body></body></html>`;
    const $ = cheerio.load(html);
    const schemas = detectStructuredData($);
    expect(schemas.length).toBe(1);
    expect(schemas[0]!.type).toBe("json-ld");
    expect(schemas[0]!.schemaType).toBe("Organization");
    expect(schemas[0]!.valid).toBe(true);
  });

  it("handles malformed JSON-LD gracefully", () => {
    const html = `<html><head>
            <script type="application/ld+json">{invalid json}</script>
        </head><body></body></html>`;
    const $ = cheerio.load(html);
    const schemas = detectStructuredData($);
    expect(schemas.length).toBe(1);
    expect(schemas[0]!.valid).toBe(false);
    expect(schemas[0]!.parseError).toBeTruthy();
  });

  it("extracts phone from tel: links", () => {
    const $ = cheerio.load('<html><body><a href="tel:+1234567890">Call us</a></body></html>');
    const meta = extractMetadata($, "https://example.com");
    expect(meta.contact.phone).toBe("+1234567890");
  });

  it("extracts email from mailto: links", () => {
    const $ = cheerio.load('<html><body><a href="mailto:info@example.com">Email</a></body></html>');
    const meta = extractMetadata($, "https://example.com");
    expect(meta.contact.email).toBe("info@example.com");
  });

  it("extracts social profile links", () => {
    const html = `<html><body>
            <a href="https://twitter.com/example">Twitter</a>
            <a href="https://linkedin.com/company/example">LinkedIn</a>
            <a href="https://example.com/about">About</a>
        </body></html>`;
    const $ = cheerio.load(html);
    const meta = extractMetadata($, "https://example.com");
    expect(meta.socialProfiles.length).toBe(2);
  });

  it("returns null for missing metadata", () => {
    const $ = cheerio.load("<html><body><p>Hello</p></body></html>");
    const meta = extractMetadata($, "https://example.com");
    expect(meta.title).toBeNull();
    expect(meta.description).toBeNull();
    expect(meta.canonical).toBeNull();
  });
});

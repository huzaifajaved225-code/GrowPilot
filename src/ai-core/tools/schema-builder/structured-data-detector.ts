/**
 * Detects existing structured data on a page: JSON-LD, Microdata, RDFa.
 * Parses all script[type="application/ld+json"] blocks, safely handles
 * malformed JSON, and identifies @type and @context.
 */

import type { CheerioAPI } from "cheerio";
import type { ExistingStructuredData } from "@/ai-core/tools/schema-builder/types";

/**
 * Detects all existing structured data on the page.
 */
export function detectStructuredData($: CheerioAPI): ExistingStructuredData[] {
  const results: ExistingStructuredData[] = [];

  // JSON-LD
  detectJsonLd($, results);

  // Microdata (itemscope)
  detectMicrodata($, results);

  // RDFa (vocab="https://schema.org")
  detectRdfa($, results);

  return results;
}

function detectJsonLd($: CheerioAPI, results: ExistingStructuredData[]): void {
  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).html()?.trim();
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      // Handle @graph arrays
      const items = Array.isArray(parsed)
        ? parsed
        : parsed["@graph"] && Array.isArray(parsed["@graph"])
          ? (parsed["@graph"] as Record<string, unknown>[])
          : [parsed];

      for (const item of items) {
        if (typeof item !== "object" || item === null) continue;
        const schemaType = extractSchemaType(item);
        const context = typeof item["@context"] === "string" ? item["@context"] : null;

        results.push({
          type: "json-ld",
          raw: JSON.stringify(item).slice(0, 2000),
          schemaType,
          context,
          valid: true,
          parseError: null,
        });
      }
    } catch (error) {
      results.push({
        type: "json-ld",
        raw: raw.slice(0, 2000),
        schemaType: null,
        context: null,
        valid: false,
        parseError: error instanceof Error ? error.message : "Parse error",
      });
    }
  });
}

function detectMicrodata($: CheerioAPI, results: ExistingStructuredData[]): void {
  $("[itemscope]").each((_i, el) => {
    const itemType = $(el).attr("itemtype") || null;
    const schemaType = itemType ? itemType.replace("https://schema.org/", "").replace("http://schema.org/", "") : null;

    results.push({
      type: "microdata",
      raw: $.html(el).slice(0, 2000),
      schemaType,
      context: itemType?.includes("schema.org") ? "https://schema.org" : null,
      valid: true,
      parseError: null,
    });
  });
}

function detectRdfa($: CheerioAPI, results: ExistingStructuredData[]): void {
  $("[vocab]").each((_i, el) => {
    const vocab = $(el).attr("vocab") || "";
    if (vocab.includes("schema.org")) {
      results.push({
        type: "rdfa",
        raw: $.html(el).slice(0, 2000),
        schemaType: null,
        context: vocab || "https://schema.org",
        valid: true,
        parseError: null,
      });
    }
  });
}

function extractSchemaType(item: Record<string, unknown>): string | null {
  const type = item["@type"];
  if (typeof type === "string") return type;
  if (Array.isArray(type) && type.length > 0 && typeof type[0] === "string") return type[0];
  return null;
}
/**
 * JSON-LD / Schema.org validation.
 * Validates structure, required fields, recognized types, and
 * recommended properties without claiming Google approval.
 */

import type { SchemaValidationResult } from "@/ai-core/tools/schema-builder/types";


const KNOWN_SCHEMA_TYPES: ReadonlySet<string> = new Set([
  "Organization", "LocalBusiness", "Restaurant", "Store", "Service",
  "Product", "SoftwareApplication", "Article", "Person", "WebSite", "WebPage",
  "BlogPosting", "NewsArticle", "Event", "FAQPage", "HowTo", "BreadcrumbList",
  "Review", "AggregateRating", "Offer", "Place", "PostalAddress", "ImageObject",
  "VideoObject", "SearchAction", "ContactPoint",
]);

/**
 * Recommended properties per schema type.
 * Missing these generates warnings, not errors.
 */
const RECOMMENDED_PROPERTIES: Record<string, string[]> = {
  Organization: ["name", "url", "logo"],
  LocalBusiness: ["name", "url", "telephone", "address"],
  Restaurant: ["name", "url", "telephone", "address", "servesCuisine"],
  Store: ["name", "url", "telephone", "address"],
  Product: ["name", "description", "image", "offers"],
  Service: ["name", "description", "provider"],
  SoftwareApplication: ["name", "description", "applicationCategory", "operatingSystem"],
  Article: ["headline", "author", "datePublished", "image"],
  Person: ["name", "jobTitle"],
  WebSite: ["name", "url"],
  WebPage: ["name", "description", "url"],
};

/**
 * Validates a generated JSON-LD object.
 */
export function validateSchema(schema: Record<string, unknown>): SchemaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRecommended: string[] = [];

  // 1. Valid JSON (already guaranteed if we got here, but check structure)
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    return {
      valid: false,
      errors: ["Schema must be a JSON object"],
      warnings: [],
      missingRecommendedProperties: [],
    };
  }

  // 2. @context exists
  const context = schema["@context"];
  if (!context) {
    errors.push("Missing @context property");
  } else if (typeof context === "string" && !context.includes("schema.org")) {
    warnings.push("@context does not reference schema.org");
  }

  // 3. @type exists
  const type = schema["@type"];
  if (!type) {
    errors.push("Missing @type property");
  } else if (typeof type === "string" && !KNOWN_SCHEMA_TYPES.has(type)) {
    warnings.push("Unrecognized Schema.org type: " + type);
  }

  // 4. Check for obviously wrong values
  if (typeof schema["name"] === "string" && schema["name"].length === 0) {
    errors.push("name property is empty");
  }
  if (typeof schema["url"] === "string") {
    try {
      new URL(schema["url"]);
    } catch {
      errors.push("url property is not a valid URL");
    }
  }

  // 5. Check recommended properties
  if (typeof type === "string" && RECOMMENDED_PROPERTIES[type]) {
    for (const prop of RECOMMENDED_PROPERTIES[type]!) {
      if (!(prop in schema)) {
        missingRecommended.push(prop);
      }
    }
  }

  // 6. Check for duplicate/conflicting fields
  if (schema["address"] && schema["location"] && typeof schema["address"] === "string" && typeof schema["location"] === "string") {
    warnings.push("Both address and location are specified as strings, which may be conflicting");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRecommendedProperties: missingRecommended,
  };
}

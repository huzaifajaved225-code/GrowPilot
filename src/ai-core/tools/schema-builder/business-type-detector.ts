/**
 * Deterministic + AI-assisted business type detection.
 * Uses page signals (existing schema, headings, contact info, content keywords)
 * to classify the website into a Schema.org type.
 */

import type {
  ExtractedMetadata,
  ExistingStructuredData,
  BusinessTypeDetection,
  SchemaType,
} from "@/ai-core/tools/schema-builder/types";

/**
 * Keyword patterns that strongly indicate each business type.
 * Order matters: more specific types first.
 */
const TYPE_KEYWORDS: Record<SchemaType, string[]> = {
  Restaurant: ["menu", "reservation", "dining", "cuisine", "chef", "restaurant", "food order"],
  LocalBusiness: ["local business", "near me", "serving", "locally owned", "in-store"],
  Store: ["shop", "store", "cart", "add to cart", "buy now", "product", "ecommerce"],
  Product: ["product", "price", "sku", "brand", "review", "rating", "in stock"],
  SoftwareApplication: ["software", "app", "download", "saas", "platform", "api", "dashboard"],
  Article: ["article", "blog", "posted by", "published", "author", "reading time"],
  Person: ["cv", "resume", "portfolio", "freelancer", "consultant", "about me"],
  Organization: ["organization", "company", "team", "about us", "our mission", "careers"],
  Service: ["service", "solution", "consulting", "we offer", "our services"],
  WebSite: ["website", "homepage", "welcome", "get started"],
  WebPage: ["page", "section", "content"],
};

/**
 * Deterministic business type detection based on page signals.
 * Returns the detected type with confidence and evidence.
 */
export function detectBusinessTypeDeterministic(
  metadata: ExtractedMetadata,
  existingSchema: ExistingStructuredData[],
): BusinessTypeDetection {
  // 1. If existing JSON-LD has a clear @type, use it
  for (const schema of existingSchema) {
    if (schema.valid && schema.schemaType) {
      const normalizedType = schema.schemaType as SchemaType;
      const knownTypes: SchemaType[] = [
        "Restaurant",
        "LocalBusiness",
        "Store",
        "Organization",
        "Product",
        "SoftwareApplication",
        "Article",
        "Person",
      ];
      if (knownTypes.includes(normalizedType)) {
        return {
          type: normalizedType,
          confidence: 0.95,
          signals: ["Existing JSON-LD @type: " + schema.schemaType],
          method: "deterministic",
        };
      }
    }
  }

  // 2. Score each type based on keyword matches
  const allText = [
    metadata.title ?? "",
    metadata.description ?? "",
    ...metadata.headings.h1,
    ...metadata.headings.h2,
    metadata.textContent.slice(0, 2000),
  ]
    .join(" ")
    .toLowerCase();

  let bestType: SchemaType = "Organization";
  let bestScore = 0;
  const signals: string[] = [];

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    let score = 0;
    const matched: string[] = [];
    for (const kw of keywords) {
      if (allText.includes(kw)) {
        score++;
        matched.push(kw);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type as SchemaType;
      signals.length = 0;
      signals.push("Keywords detected: " + matched.join(", "));
    }
  }

  // 3. Additional signals from contact data
  if (metadata.contact.openingHours.length > 0) {
    if (bestType !== "Restaurant" && bestType !== "Store") {
      signals.push("Opening hours detected");
    }
  }
  if (metadata.contact.phone) {
    signals.push("Phone number detected");
  }
  if (metadata.contact.address) {
    signals.push("Physical address detected");
  }

  // Confidence based on how many signals matched
  const confidence = Math.min(0.95, 0.4 + bestScore * 0.1 + (signals.length > 2 ? 0.2 : 0));

  return {
    type: bestType,
    confidence: Math.round(confidence * 100) / 100,
    signals,
    method: "deterministic",
  };
}

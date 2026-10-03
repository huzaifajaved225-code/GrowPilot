/**
 * Search Readability analysis.
 * Checks signals that indicate how readable a page is for search engines.
 * Produces a GrowPilot analysis score (NOT a Google score).
 */

import type {
  ExtractedMetadata,
  ExistingStructuredData,
  ReadabilityCheck,
  ReadabilityResult,
} from "@/ai-core/tools/schema-builder/types";

/**
 * Analyzes a page's search readability based on extracted metadata
 * and structured data.
 */
export function analyzeReadability(
  metadata: ExtractedMetadata,
  existingSchema: ExistingStructuredData[],
): ReadabilityResult {
  const checks: ReadabilityCheck[] = [];

  // 1. Title exists
  checks.push({
    id: "title",
    label: "Page title",
    passed: metadata.title !== null && metadata.title.length > 0,
    detail: metadata.title
      ? "Title found: " + metadata.title.slice(0, 60)
      : "No page title detected",
  });

  // 2. Meta description
  checks.push({
    id: "description",
    label: "Meta description",
    passed: metadata.description !== null && metadata.description.length >= 50,
    detail: metadata.description
      ? "Description found (" + metadata.description.length + " chars)"
      : "No meta description or too short",
  });

  // 3. Canonical URL
  checks.push({
    id: "canonical",
    label: "Canonical URL",
    passed: metadata.canonical !== null,
    detail: metadata.canonical ? "Canonical URL set" : "No canonical URL detected",
  });

  // 4. H1 exists
  checks.push({
    id: "h1",
    label: "H1 heading",
    passed: metadata.headings.h1.length > 0,
    detail:
      metadata.headings.h1.length > 0
        ? metadata.headings.h1.length + " H1 heading(s) found"
        : "No H1 heading detected",
  });

  // 5. Meaningful text content
  const textLength = metadata.textContent.trim().length;
  checks.push({
    id: "content",
    label: "Page content",
    passed: textLength > 300,
    detail:
      textLength > 300
        ? "Page has " + textLength + " characters of text content"
        : "Very little text content detected (" + textLength + " chars)",
  });

  // 6. Robots meta (should not be noindex)
  const isNoIndex = metadata.robots?.toLowerCase().includes("noindex") ?? false;
  checks.push({
    id: "robots",
    label: "Indexable",
    passed: !isNoIndex,
    detail: isNoIndex ? "Page has noindex directive" : "Page appears indexable by search engines",
  });

  // 7. Structured data exists
  const hasSchema = existingSchema.some((s) => s.valid);
  checks.push({
    id: "structured-data",
    label: "Structured data",
    passed: hasSchema,
    detail: hasSchema
      ? existingSchema.length + " structured data block(s) found"
      : "No valid structured data detected",
  });

  // 8. Business identity clear
  const hasIdentity =
    metadata.contact.businessName !== null ||
    metadata.openGraph.ogTitle !== null ||
    metadata.headings.h1.length > 0;
  checks.push({
    id: "identity",
    label: "Business identity",
    passed: hasIdentity,
    detail: hasIdentity ? "Business/organization identity detected" : "No clear business identity",
  });

  // 9. Contact info discoverable
  const hasContact =
    metadata.contact.phone !== null ||
    metadata.contact.email !== null ||
    metadata.contact.address !== null;
  checks.push({
    id: "contact",
    label: "Contact information",
    passed: hasContact,
    detail: hasContact ? "Contact information found" : "No contact information detected",
  });

  // 10. Open Graph consistency
  const hasOg = metadata.openGraph.ogTitle !== null && metadata.openGraph.ogDescription !== null;
  checks.push({
    id: "og-consistency",
    label: "Open Graph metadata",
    passed: hasOg,
    detail: hasOg ? "Open Graph title and description set" : "Incomplete Open Graph metadata",
  });

  // 11. Social profiles
  checks.push({
    id: "social",
    label: "Social profiles",
    passed: metadata.socialProfiles.length > 0,
    detail:
      metadata.socialProfiles.length > 0
        ? metadata.socialProfiles.length + " social profile link(s) found"
        : "No social profile links detected",
  });

  // 12. Language set
  checks.push({
    id: "language",
    label: "Page language",
    passed: metadata.language !== null,
    detail: metadata.language
      ? "Language set: " + metadata.language
      : "No language attribute on <html>",
  });

  // Calculate score
  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return { score, checks };
}

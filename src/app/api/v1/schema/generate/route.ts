import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError } from "@/lib/errors/app-error";
import { bootstrapAICore, sharedPromptManager } from "@/ai-core/bootstrap/register-agents";
import { AIEngine } from "@/ai-core/engine/ai-engine";
import type { SchemaAgentInput, SchemaAgentOutput } from "@/ai-core/agents/schema-agent";
import type { OrganizationId, SessionId, UserId } from "@/ai-core/types/common.types";

import { fetchWebsite, parseHtml } from "@/ai-core/tools/schema-builder/website-fetcher";
import { extractMetadata } from "@/ai-core/tools/schema-builder/metadata-extractor";
import { detectStructuredData } from "@/ai-core/tools/schema-builder/structured-data-detector";
import { detectBusinessTypeDeterministic } from "@/ai-core/tools/schema-builder/business-type-detector";
import { validateSchema } from "@/ai-core/tools/schema-builder/schema-validator";
import { analyzeReadability } from "@/ai-core/tools/schema-builder/readability-analyzer";
import { validateUrl } from "@/ai-core/tools/schema-builder/url-validator";
import { PromptRole } from "@/ai-core/types/prompt.types";
import { nowIso } from "@/ai-core/utils/date-utils";
import type { SchemaType, SchemaGenerateResponse } from "@/ai-core/tools/schema-builder/types";

const schemaRequestSchema = z.object({
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  businessType: z
    .enum([
      "auto",
      "Organization",
      "LocalBusiness",
      "Restaurant",
      "Store",
      "Service",
      "Product",
      "SoftwareApplication",
      "Article",
      "Person",
    ])
    .default("auto"),
});

/**
 * POST /api/v1/schema/generate
 *
 * Full pipeline: URL validation -> fetch -> extract -> detect business type
 * -> generate schema via AI -> validate -> readability analysis.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const userId = session.user.id;
    const organizationId = session.user.activeOrganizationId;

    const body = await request.json();
    const parsed = schemaRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten(),
          },
        },
        { status: 422 },
      );
    }

    const { url: rawUrl, businessType: requestedType } = parsed.data;

    // 1. SSRF-safe URL validation
    const urlValidation = validateUrl(rawUrl);
    if (!urlValidation.valid || !urlValidation.url) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "INVALID_URL",
            message: urlValidation.error ?? "Invalid URL",
          },
        },
        { status: 400 },
      );
    }

    // 2. Fetch the website
    const fetchResult = await fetchWebsite(urlValidation.url);

    // 3. Parse HTML and extract metadata
    const $ = parseHtml(fetchResult.html);
    const metadata = extractMetadata($, fetchResult.finalUrl);

    // 4. Detect existing structured data
    const existingSchema = detectStructuredData($);

    // 5. Determine business type
    let businessType;
    if (requestedType !== "auto") {
      businessType = {
        type: requestedType as SchemaType,
        confidence: 1.0,
        signals: ["User selected: " + requestedType],
        method: "deterministic" as const,
      };
    } else {
      businessType = detectBusinessTypeDeterministic(metadata, existingSchema);
    }

    // 6. Prepare metadata summary for AI
    const metadataSummary = JSON.stringify(
      {
        title: metadata.title,
        description: metadata.description,
        headings: metadata.headings,
        openGraph: metadata.openGraph,
        contact: metadata.contact,
        socialProfiles: metadata.socialProfiles,
        textExcerpt: metadata.textContent.slice(0, 2000),
      },
      null,
      2,
    );

    const existingSchemaSummary = existingSchema
      .filter((s) => s.valid)
      .map((s) => s.raw)
      .join("\n");

    // 7. Identify missing information
    const missingInformation: string[] = [];
    if (!metadata.contact.phone) missingInformation.push("phone number");
    if (!metadata.contact.email) missingInformation.push("email address");
    if (!metadata.contact.address) missingInformation.push("physical address");
    if (!metadata.contact.logo) missingInformation.push("logo image");
    if (!metadata.description) missingInformation.push("meta description");
    if (metadata.headings.h1.length === 0) missingInformation.push("H1 heading");
    if (metadata.socialProfiles.length === 0) missingInformation.push("social media profiles");
    if (metadata.contact.openingHours.length === 0) missingInformation.push("opening hours");

    // 8. Bootstrap AI Core and run Schema Agent
    bootstrapAICore();
    registerSchemaPrompts();

    const engine = new AIEngine({ promptManager: sharedPromptManager });

    const agentInput: SchemaAgentInput = {
      url: fetchResult.finalUrl,
      businessType: businessType.type,
      extractedMetadata: metadataSummary,
      existingSchema: existingSchemaSummary || "No existing structured data found",
      missingInformation,
    };

    let generatedSchema: Record<string, unknown>;
    try {
      const engineResult = await engine.run<SchemaAgentInput, SchemaAgentOutput>({
        agentId: "schema-agent",
        identity: {
          organizationId: (organizationId ?? "anonymous") as OrganizationId,
          userId: userId as UserId,
          sessionId: ("schema-" + Date.now()) as SessionId,
        },
        payload: agentInput,
      });
      generatedSchema = engineResult.result.generatedSchema;
    } catch {
      // Fallback: generate a basic schema from extracted data alone
      generatedSchema = generateFallbackSchema(businessType.type, metadata, fetchResult.finalUrl);
    }

    // 9. Validate the generated schema
    const validation = validateSchema(generatedSchema);

    // 10. Analyze readability
    const readability = analyzeReadability(metadata, existingSchema);

    // 11. Build response
    const responseData: SchemaGenerateResponse = {
      url: fetchResult.finalUrl,
      businessType,
      website: {
        title: metadata.title,
        description: metadata.description,
        canonical: metadata.canonical,
        headings: metadata.headings,
        contact: metadata.contact,
        socialProfiles: metadata.socialProfiles,
      },
      existingSchema,
      generatedSchema,
      validation,
      readability,
      missingInformation,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Fallback schema generation when AI is unavailable.
 * Builds a basic JSON-LD from extracted metadata alone.
 */
function generateFallbackSchema(
  type: SchemaType,
  metadata: ReturnType<typeof extractMetadata>,
  url: string,
): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
  };

  if (metadata.title) schema["name"] = metadata.title;
  if (metadata.description) schema["description"] = metadata.description;
  schema["url"] = url;
  if (metadata.contact.logo) schema["logo"] = metadata.contact.logo;
  if (metadata.contact.phone) schema["telephone"] = metadata.contact.phone;
  if (metadata.contact.email) schema["email"] = metadata.contact.email;
  if (metadata.socialProfiles.length > 0) schema["sameAs"] = metadata.socialProfiles;

  if (metadata.contact.address || metadata.contact.city || metadata.contact.country) {
    const address: Record<string, unknown> = { "@type": "PostalAddress" };
    if (metadata.contact.address) address["streetAddress"] = metadata.contact.address;
    if (metadata.contact.city) address["addressLocality"] = metadata.contact.city;
    if (metadata.contact.country) address["addressCountry"] = metadata.contact.country;
    if (metadata.contact.postalCode) address["postalCode"] = metadata.contact.postalCode;
    schema["address"] = address;
  }

  return schema;
}

/**
 * Registers schema-generation prompt templates if not already registered.
 */
function registerSchemaPrompts(): void {
  const registeredTemplates = sharedPromptManager.listTemplates();

  if (!registeredTemplates.has("schema-generation.system")) {
    sharedPromptManager.registerTemplate({
      key: "schema-generation.system",
      version: 1,
      role: PromptRole.SYSTEM,
      content:
        "You are GrowPilot's Schema.org structured data generator. You generate JSON-LD " +
        "from verified webpage evidence. NEVER invent business facts. If information is " +
        "missing, omit the property and report it in omittedProperties. Use only " +
        "https://schema.org as @context. Generate clean, valid JSON-LD with only " +
        "evidence-supported properties. Do not create fake ratings, reviews, prices, " +
        "addresses, phone numbers, awards, or credentials.",
      requiredVariables: [],
      createdAt: nowIso(),
      metadata: { source: "schema-builder" },
    });
  }

  if (!registeredTemplates.has("schema-generation.user")) {
    sharedPromptManager.registerTemplate({
      key: "schema-generation.user",
      version: 1,
      role: PromptRole.USER,
      content:
        "Generate JSON-LD structured data for this website:\n\n" +
        "URL: {{websiteUrl}}\n" +
        "Detected business type: {{businessType}}\n\n" +
        "Extracted metadata:\n{{extractedMetadata}}\n\n" +
        "Existing structured data:\n{{existingSchema}}\n\n" +
        "Missing information: {{missingInformation}}\n\n" +
        "Generate the most appropriate JSON-LD schema based ONLY on the evidence above.",
      requiredVariables: [
        "websiteUrl",
        "businessType",
        "extractedMetadata",
        "existingSchema",
        "missingInformation",
      ],
      createdAt: nowIso(),
      metadata: { source: "schema-builder" },
    });
  }
}

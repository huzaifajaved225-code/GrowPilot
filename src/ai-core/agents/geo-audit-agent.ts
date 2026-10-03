import { BaseAgent } from "@/ai-core/agents/base-agent";
import { AgentError } from "@/ai-core/errors/agent-error";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentDescriptor, AgentInput } from "@/ai-core/types/agent.types";
import type { AgentId } from "@/ai-core/types/common.types";
import { z } from "zod";

/**
 * Severity levels for GEO issues identified by the audit agent.
 */
export type GeoIssueSeverity = "critical" | "high" | "medium" | "low";

/**
 * A single GEO issue identified during an audit.
 */
export interface GeoIssue {
  /** How severe this issue is for AI engine visibility. */
  readonly severity: GeoIssueSeverity;
  /** The category of GEO issue (e.g. "structured-data", "entity-understanding"). */
  readonly category: string;
  /** Short title for the issue. */
  readonly title: string;
  /** Human-readable description of the issue found. */
  readonly description: string;
  /** Specific, actionable recommendation to fix the issue. */
  readonly recommendation: string;
}

/**
 * An actionable GEO opportunity for improving AI engine visibility.
 */
export interface GeoOpportunity {
  /** Short title for the opportunity. */
  readonly title: string;
  /** Description of the opportunity and its potential impact. */
  readonly description: string;
  /** Specific recommendation to capitalize on the opportunity. */
  readonly recommendation: string;
}

/**
 * Input shape for the {@link GeoAuditAgent}.
 */
export interface GeoAuditAgentInput {
  /** The URL to audit. */
  readonly url: string;
  /** The business name for context in the audit. */
  readonly businessName: string;
  /** Serialized site data to analyze (e.g. HTML summary, metadata, content). */
  readonly siteData: string;
  /** Comma-separated focus areas for the audit (e.g. "ai-visibility,entity-understanding"). */
  readonly focusAreas: string;
}

/**
 * Output shape for the {@link GeoAuditAgent}.
 */
export interface GeoAuditAgentOutput {
  /** Overall GEO score from 0-100. */
  readonly score: number;
  /** Executive summary of the GEO audit findings. */
  readonly summary: string;
  /** List of issues found, sorted by severity. */
  readonly issues: readonly GeoIssue[];
  /** Optional list of actionable GEO opportunities. */
  readonly opportunities?: readonly GeoOpportunity[];
}

/** Zod schema for validating GeoAuditAgent input. */
const geoAuditInputSchema = z.object({
  url: z.string().min(1, "url must be a non-empty string").url("url must be a valid URL"),
  businessName: z.string().min(1, "businessName must be a non-empty string"),
  siteData: z.string().min(1, "siteData must be a non-empty string"),
  focusAreas: z.string().min(1, "focusAreas must be a non-empty string"),
});

/** Zod schema for validating a single GEO issue from the AI response. */
const geoIssueSchema = z.object({
  severity: z.enum(["critical", "high", "medium", "low"]),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  recommendation: z.string().min(1),
});

/** Zod schema for validating a single GEO opportunity from the AI response. */
const geoOpportunitySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  recommendation: z.string().min(1),
});

/** Zod schema for validating the AI's structured response. */
const geoAuditResponseSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  issues: z.array(geoIssueSchema),
  opportunities: z.array(geoOpportunitySchema).optional(),
});

/**
 * The system prompt template key for GEO audits.
 * Registered during bootstrap alongside the agent.
 */
const GEO_AUDIT_SYSTEM_PROMPT_KEY = "geo-audit.system";

/**
 * The user prompt template key for GEO audits.
 * Registered during bootstrap alongside the agent.
 */
const GEO_AUDIT_USER_PROMPT_KEY = "geo-audit.user";

/**
 * Instructions appended to the user prompt to enforce structured JSON output.
 */
const JSON_OUTPUT_INSTRUCTION = `

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "score": <number 0-100>,
  "summary": "<string>",
  "issues": [
    {
      "severity": "<critical|high|medium|low>",
      "category": "<string>",
      "title": "<string>",
      "description": "<string>",
      "recommendation": "<string>"
    }
  ],
  "opportunities": [
    {
      "title": "<string>",
      "description": "<string>",
      "recommendation": "<string>"
    }
  ]
}`;

/**
 * GrowPilot's GEO (Generative Engine Optimization) audit agent. Evaluates
 * how well a business/website is positioned to appear in AI-generated answers
 * and generative search systems (ChatGPT, Gemini, Perplexity, etc.).
 *
 * Extends {@link BaseAgent}, uses registered prompt templates,
 * validates input with Zod, and produces structured, predictable output.
 *
 * The agent delegates AI generation to the ProviderManager through the
 * execution context's `providerManager`, respecting timeout/retry/cancellation
 * behavior. It never directly imports Gemini/OpenAI/Anthropic SDKs.
 *
 * Malformed AI output is handled safely: if the AI returns invalid JSON
 * or JSON that doesn't match the expected schema, the agent throws an
 * {@link AgentError} with a descriptive message rather than returning
 * partial/incorrect data.
 */
export class GeoAuditAgent extends BaseAgent<GeoAuditAgentInput, GeoAuditAgentOutput> {
  public readonly descriptor: AgentDescriptor = {
    id: "geo-audit-agent" as AgentId,
    name: "GEO Audit Agent",
    description:
      "Evaluates how well a website is optimized for AI-generated answers and generative search engines",
    version: "1.0.0",
    tags: ["geo", "audit", "ai-visibility", "business-growth"],
  };

  /**
   * Constructs a new GeoAuditAgent with default configuration.
   */
  public constructor() {
    super();
  }

  /**
   * Validates the input against the Zod schema.
   */
  public override async validate(
    input: AgentInput<GeoAuditAgentInput>,
    _context: IExecutionContext,
  ): Promise<void> {
    const result = geoAuditInputSchema.safeParse(input.payload);
    if (!result.success) {
      throw new AgentError(
        "Invalid GeoAuditAgent input: " + result.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { code: "VALIDATION_ERROR" },
        false,
      );
    }
  }

  /**
   * Renders the GEO audit prompts, sends them to the AI provider via
   * the execution context's provider manager, and parses the structured
   * response.
   */
  public override async run(
    input: AgentInput<GeoAuditAgentInput>,
    context: IExecutionContext,
  ): Promise<GeoAuditAgentOutput> {
    const { url, businessName, siteData, focusAreas } = input.payload;

    // Render the system prompt using the registered template.
    const systemPrompt = context.prompts.render(GEO_AUDIT_SYSTEM_PROMPT_KEY, { businessName });

    // Render the user prompt using the registered template, appending JSON instructions.
    const userPrompt = context.prompts.render(GEO_AUDIT_USER_PROMPT_KEY, {
      websiteUrl: url,
      siteData,
      focusAreas,
    });

    // Build the messages array for the provider request.
    const messages = [
      { role: "system" as const, content: systemPrompt.content },
      { role: "user" as const, content: userPrompt.content + JSON_OUTPUT_INSTRUCTION },
    ];

    // Delegate to the provider manager through the context.
    const response = await this.generateText(
      {
        model: "gemini-3.6-flash",
        messages,
        temperature: 0.3,
      },
      context,
    );

    // Parse the AI response as structured JSON.
    return this.parseAuditResponse(response.text);
  }

  /**
   * Parses the AI's text response into a validated {@link GeoAuditAgentOutput}.
   * Handles malformed JSON and schema validation failures gracefully.
   *
   * @param rawText - The raw text response from the AI provider.
   * @returns The validated GEO audit output.
   * @throws {AgentError} If the response cannot be parsed or fails validation.
   */
  private parseAuditResponse(rawText: string): GeoAuditAgentOutput {
    // Attempt to extract JSON from the response. The AI might wrap it in markdown.
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AgentError(
        "GeoAuditAgent received a response with no JSON object",
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new AgentError(
        "GeoAuditAgent received malformed JSON in response",
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    const validationResult = geoAuditResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      throw new AgentError(
        "GeoAuditAgent response failed schema validation: " +
          validationResult.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    return validationResult.data;
  }
}
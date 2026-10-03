import { BaseAgent } from "@/ai-core/agents/base-agent";
import { AgentError } from "@/ai-core/errors/agent-error";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentDescriptor, AgentInput } from "@/ai-core/types/agent.types";
import type { AgentId } from "@/ai-core/types/common.types";
import { z } from "zod";

/**
 * Severity levels for SEO issues identified by the audit agent.
 */
export type SeoIssueSeverity = "critical" | "warning" | "info";

/**
 * A single SEO issue identified during an audit.
 */
export interface SeoIssue {
  /** How severe this issue is for the site's SEO performance. */
  readonly severity: SeoIssueSeverity;
  /** The category of SEO issue (e.g. "technical", "content", "performance"). */
  readonly category: string;
  /** Human-readable description of the issue found. */
  readonly description: string;
  /** Specific, actionable recommendation to fix the issue. */
  readonly recommendation: string;
}

/**
 * Input shape for the {@link SeoAuditAgent}.
 */
export interface SeoAuditAgentInput {
  /** The URL to audit. */
  readonly url: string;
  /** The business name for context in the audit. */
  readonly businessName: string;
  /** Serialized site data to analyze (e.g. HTML summary, metadata, content). */
  readonly siteData: string;
  /** Comma-separated focus areas for the audit (e.g. "technical,content"). */
  readonly focusAreas: string;
}

/**
 * Output shape for the {@link SeoAuditAgent}.
 */
export interface SeoAuditAgentOutput {
  /** Overall SEO score from 0-100. */
  readonly score: number;
  /** List of issues found, sorted by severity. */
  readonly issues: readonly SeoIssue[];
  /** Executive summary of the audit findings. */
  readonly summary: string;
}

/** Zod schema for validating SeoAuditAgent input. */
const seoAuditInputSchema = z.object({
  url: z.string().min(1, "url must be a non-empty string").url("url must be a valid URL"),
  businessName: z.string().min(1, "businessName must be a non-empty string"),
  siteData: z.string().min(1, "siteData must be a non-empty string"),
  focusAreas: z.string().min(1, "focusAreas must be a non-empty string"),
});

/** Zod schema for validating a single SEO issue from the AI response. */
const seoIssueSchema = z.object({
  severity: z.enum(["critical", "warning", "info"]),
  category: z.string().min(1),
  description: z.string().min(1),
  recommendation: z.string().min(1),
});

/** Zod schema for validating the AI's structured response. */
const seoAuditResponseSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(seoIssueSchema),
  summary: z.string().min(1),
});

/**
 * The system prompt template key for SEO audits.
 * Must match a template registered in the built-in prompt library.
 */
const SEO_AUDIT_SYSTEM_PROMPT_KEY = "seo-audit.system";

/**
 * The user prompt template key for SEO audits.
 * Must match a template registered in the built-in prompt library.
 */
const SEO_AUDIT_USER_PROMPT_KEY = "seo-audit.user";

/**
 * Instructions appended to the user prompt to enforce structured JSON output.
 */
const JSON_OUTPUT_INSTRUCTION = `

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "score": <number 0-100>,
  "issues": [
    {
      "severity": "<critical|warning|info>",
      "category": "<string>",
      "description": "<string>",
      "recommendation": "<string>"
    }
  ],
  "summary": "<string>"
}`;

/**
 * GrowPilot's first real business-growth agent. Extends {@link BaseAgent},
 * uses the existing prompt templates (`seo-audit.system`, `seo-audit.user`),
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
export class SeoAuditAgent extends BaseAgent<SeoAuditAgentInput, SeoAuditAgentOutput> {
  public readonly descriptor: AgentDescriptor = {
    id: "seo-audit-agent" as AgentId,
    name: "SEO Audit Agent",
    description: "Analyzes website data and produces a scored SEO audit with prioritized issues",
    version: "1.0.0",
    tags: ["seo", "audit", "business-growth"],
  };

  /**
   * Constructs a new SeoAuditAgent with default configuration.
   */
  public constructor() {
    super();
  }

  /**
   * Validates the input against the Zod schema.
   */
  public override async validate(
    input: AgentInput<SeoAuditAgentInput>,
    _context: IExecutionContext,
  ): Promise<void> {
    const result = seoAuditInputSchema.safeParse(input.payload);
    if (!result.success) {
      throw new AgentError(
        "Invalid SeoAuditAgent input: " + result.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { code: "VALIDATION_ERROR" },
        false,
      );
    }
  }

  /**
   * Renders the SEO audit prompts, sends them to the AI provider via
   * the execution context's provider manager, and parses the structured
   * response.
   */
  public override async run(
    input: AgentInput<SeoAuditAgentInput>,
    context: IExecutionContext,
  ): Promise<SeoAuditAgentOutput> {
    const { url, businessName, siteData, focusAreas } = input.payload;

    // Render the system prompt using the registered template.
    const systemPrompt = context.prompts.render(SEO_AUDIT_SYSTEM_PROMPT_KEY, { businessName });

    // Render the user prompt using the registered template, appending JSON instructions.
    const userPrompt = context.prompts.render(SEO_AUDIT_USER_PROMPT_KEY, {
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
   * Parses the AI's text response into a validated {@link SeoAuditAgentOutput}.
   * Handles malformed JSON and schema validation failures gracefully.
   *
   * @param rawText - The raw text response from the AI provider.
   * @returns The validated audit output.
   * @throws {AgentError} If the response cannot be parsed or fails validation.
   */
  private parseAuditResponse(rawText: string): SeoAuditAgentOutput {
    // Attempt to extract JSON from the response. The AI might wrap it in markdown.
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AgentError(
        "SeoAuditAgent received a response with no JSON object",
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
        "SeoAuditAgent received malformed JSON in response",
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    const validationResult = seoAuditResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      throw new AgentError(
        "SeoAuditAgent response failed schema validation: " +
          validationResult.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    return validationResult.data;
  }
}

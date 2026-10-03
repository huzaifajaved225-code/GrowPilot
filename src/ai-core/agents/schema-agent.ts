/**
 * Schema Agent â€” generates evidence-based JSON-LD structured data
 * using the existing GrowPilot AI Core provider abstraction.
 * Never invents business facts; omits properties when evidence is missing.
 */

import { BaseAgent } from "@/ai-core/agents/base-agent";
import { AgentError } from "@/ai-core/errors/agent-error";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentDescriptor, AgentInput } from "@/ai-core/types/agent.types";
import type { AgentId } from "@/ai-core/types/common.types";
import { z } from "zod";
import type { SchemaType } from "@/ai-core/tools/schema-builder/types";

export interface SchemaAgentInput {
  readonly url: string;
  readonly businessType: SchemaType;
  readonly extractedMetadata: string;
  readonly existingSchema: string;
  readonly missingInformation: readonly string[];
}

export interface SchemaAgentOutput {
  readonly generatedSchema: Record<string, unknown>;
  readonly reasoning: string;
  readonly omittedProperties: readonly string[];
}

const schemaAgentInputSchema = z.object({
  url: z.string().min(1),
  businessType: z.string().min(1),
  extractedMetadata: z.string().min(1),
  existingSchema: z.string(),
  missingInformation: z.array(z.string()),
});

const schemaAgentResponseSchema = z.object({
  generatedSchema: z.record(z.unknown()),
  reasoning: z.string(),
  omittedProperties: z.array(z.string()),
});

const SCHEMA_SYSTEM_PROMPT_KEY = "schema-generation.system";
const SCHEMA_USER_PROMPT_KEY = "schema-generation.user";

const JSON_OUTPUT_INSTRUCTION = `

Respond ONLY with a valid JSON object in this exact format (no markdown, no explanation):
{
  "generatedSchema": {
    "@context": "https://schema.org",
    "@type": "<SchemaType>",
    ...only evidence-supported properties...
  },
  "reasoning": "<brief explanation of type choice and included properties>",
  "omittedProperties": ["<property>", "..."]
}`;

export class SchemaAgent extends BaseAgent<SchemaAgentInput, SchemaAgentOutput> {
  public readonly descriptor: AgentDescriptor = {
    id: "schema-agent" as AgentId,
    name: "Schema Generation Agent",
    description: "Generates evidence-based JSON-LD structured data from website metadata",
    version: "1.0.0",
    tags: ["schema", "json-ld", "structured-data", "seo"],
  };

  public constructor() {
    super();
  }

  public override async validate(
    input: AgentInput<SchemaAgentInput>,
    _context: IExecutionContext,
  ): Promise<void> {
    const result = schemaAgentInputSchema.safeParse(input.payload);
    if (!result.success) {
      throw new AgentError(
        "Invalid SchemaAgent input: " + result.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { code: "VALIDATION_ERROR" },
        false,
      );
    }
  }

  public override async run(
    input: AgentInput<SchemaAgentInput>,
    context: IExecutionContext,
  ): Promise<SchemaAgentOutput> {
    const { url, businessType, extractedMetadata, existingSchema, missingInformation } =
      input.payload;

    const systemPrompt = context.prompts.render(SCHEMA_SYSTEM_PROMPT_KEY, {});
    const userPrompt = context.prompts.render(SCHEMA_USER_PROMPT_KEY, {
      websiteUrl: url,
      businessType,
      extractedMetadata,
      existingSchema,
      missingInformation: missingInformation.join(", ") || "none detected",
    });

    const messages = [
      { role: "system" as const, content: systemPrompt.content },
      { role: "user" as const, content: userPrompt.content + JSON_OUTPUT_INSTRUCTION },
    ];

    const response = await this.generateText(
      {
        model: "gemini-3.6-flash",
        messages,
        temperature: 0.2,
      },
      context,
    );

    return this.parseResponse(response.text);
  }

  private parseResponse(rawText: string): SchemaAgentOutput {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AgentError(
        "SchemaAgent received a response with no JSON object",
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
        "SchemaAgent received malformed JSON in response",
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    const validationResult = schemaAgentResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      throw new AgentError(
        "SchemaAgent response failed schema validation: " +
          validationResult.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    return validationResult.data;
  }
}

import { BaseAgent } from "@/ai-core/agents/base-agent";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import { ProviderError } from "@/lib/ai/provider-error";
import { AI_PROVIDER_CONFIG } from "@/lib/ai/provider-config";
import type { AgentInput, AgentDescriptor } from "@/ai-core/types/agent.types";
import type { AgentId } from "@/ai-core/types/common.types";
import { z } from "zod";

/**
 * Input shape for the {@link GeneralAgent}.
 */
export interface GeneralAgentInput {
  /** The text prompt to send to the AI provider. */
  readonly prompt: string;
  /** Optional model override (defaults to the provider's default model). */
  readonly model?: string;
  /** Optional system message to prepend to the conversation. */
  readonly systemMessage?: string;
  /** Optional temperature override. */
  readonly temperature?: number;
}

/**
 * Output shape for the {@link GeneralAgent}.
 */
export interface GeneralAgentOutput {
  /** The generated text from the provider. */
  readonly text: string;
  /** The model that produced the response. */
  readonly model: string;
  /** The provider that served the request. */
  readonly providerId: string;
}

/** Zod schema for validating GeneralAgent input at runtime. */
const generalAgentInputSchema = z.object({
  prompt: z.string().min(1, "prompt must be a non-empty string"),
  model: z.string().min(1).optional(),
  systemMessage: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

/**
 * A minimal reference agent that demonstrates the AI Core to Provider
 * integration. Extends {@link BaseAgent}, uses the provider manager
 * through the execution context, and returns typed output.
 *
 * This is NOT a production business agent. It exists solely to prove
 * that the DI bridge works end-to-end: an agent can receive a prompt,
 * call the provider manager via the execution context, and return the
 * result.
 */
export class GeneralAgent extends BaseAgent<GeneralAgentInput, GeneralAgentOutput> {
  public readonly descriptor: AgentDescriptor = {
    id: "general-agent" as AgentId,
    name: "General Agent",
    description: "Minimal reference agent for AI provider integration testing",
    version: "1.0.0",
    tags: ["general", "reference"],
  };

  /**
   * Constructs a new GeneralAgent with default configuration.
   */
  public constructor() {
    super();
  }

  /**
   * Validates the input against the Zod schema.
   */
  public override async validate(
    input: AgentInput<GeneralAgentInput>,
    _context: IExecutionContext,
  ): Promise<void> {
    const result = generalAgentInputSchema.safeParse(input.payload);
    if (!result.success) {
      throw new ProviderError(
        "Invalid GeneralAgent input: " + result.error.issues.map((i) => i.message).join(", "),
        AI_PROVIDER_CONFIG.defaultProvider,
        { code: "VALIDATION_ERROR", statusCode: 400 },
      );
    }
  }

  /**
   * Sends the prompt to the AI provider via the execution context's
   * provider manager and returns the typed response.
   */
  public override async run(
    input: AgentInput<GeneralAgentInput>,
    context: IExecutionContext,
  ): Promise<GeneralAgentOutput> {
    const { prompt, model, systemMessage, temperature } = input.payload;

    const messages = [
      ...(systemMessage ? [{ role: "system" as const, content: systemMessage }] : []),
      { role: "user" as const, content: prompt },
    ];

    const response = await this.generateText(
      {
        model: model ?? "gemini-3.6-flash",
        messages,
        temperature,
      },
      context,
    );

    return {
      text: response.text,
      model: response.model,
      providerId: AI_PROVIDER_CONFIG.defaultProvider as string,
    };
  }
}

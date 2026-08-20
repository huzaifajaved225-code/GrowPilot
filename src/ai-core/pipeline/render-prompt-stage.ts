import { PromptError } from "@/ai-core/errors/prompt-error";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import type { PromptVariables } from "@/ai-core/types/prompt.types";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/** Scratchpad key under which the rendered system prompt is stored for the target agent to read. */
export const RENDERED_SYSTEM_PROMPT_SCRATCHPAD_KEY = "ai-core.renderedSystemPrompt";

/** Naming convention used to look up an agent's default system prompt template. */
function systemPromptKeyFor(agentId: string): string {
  return `${agentId}-system`;
}

/**
 * Fifth stage of the {@link ExecutionPipeline}: `RENDER_PROMPT`.
 * Attempts to render each agent's conventionally-named default system
 * prompt (`"<agentId>-system"`) using the request's payload as
 * interpolation variables, storing the result in the context's
 * scratchpad for the target agent to read during its own `prepare`/`run`
 * phases. Not every agent registers a system-prompt template — this
 * stage treats a `PromptError.notFound` as expected and simply skips
 * pre-rendering, leaving agents free to render their own prompts
 * on-demand via `context.prompts.render(...)` inside `run()` instead.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class RenderPromptStage<TPayload, TResult>
  implements IPipelineStage<PipelinePayload<TPayload, TResult>, PipelinePayload<TPayload, TResult>>
{
  /** @inheritdoc */
  public readonly name = PipelineStageName.RENDER_PROMPT;

  /**
   * Renders the target agent's default system prompt, if registered.
   *
   * @param input - The pipeline payload produced by {@link LoadMemoryStage}.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified.
   * @throws {PromptError} If a template is registered but fails to render for a reason other than "not found" (e.g. missing required variables).
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    const templateKey = systemPromptKeyFor(input.agentId);

    try {
      const variables = toPromptVariables(input.input.payload);
      const rendered = context.prompts.render(templateKey, variables);

      context.scratchpad.set(RENDERED_SYSTEM_PROMPT_SCRATCHPAD_KEY, rendered);
      context.logger.debug("Rendered default system prompt", {
        agentId: input.agentId,
        templateKey,
        templateVersion: rendered.templateVersion,
      });
    } catch (error) {
      if (error instanceof PromptError && error.statusCode === 404) {
        context.logger.debug("No default system prompt registered for agent; skipping", {
          agentId: input.agentId,
          templateKey,
        });
        return input;
      }

      throw error;
    }

    return input;
  }
}

/**
 * Best-effort conversion of an arbitrary agent payload into a flat
 * {@link PromptVariables} map — only primitive-valued top-level fields
 * are forwarded, since prompt templates only support primitive
 * interpolation. Non-primitive fields (nested objects/arrays) are
 * intentionally omitted rather than stringified, since a template that
 * needs them should declare and receive them explicitly via the
 * agent's own `run()`-time render call instead.
 *
 * @param payload - The agent's raw input payload.
 * @returns A flat map of primitive-valued fields suitable for template interpolation.
 */
function toPromptVariables(payload: unknown): PromptVariables {
  if (typeof payload !== "object" || payload === null) return {};

  const variables: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      variables[key] = value;
    }
  }

  return variables;
}

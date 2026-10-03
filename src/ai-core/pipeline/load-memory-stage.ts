import { MemoryError } from "@/ai-core/errors/memory-error";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { MemoryScope } from "@/ai-core/types/memory.types";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/** Scratchpad key under which recalled session memory is stored for later stages/agents. */
export const SESSION_MEMORY_SCRATCHPAD_KEY = "ai-core.sessionMemory";
/** Scratchpad key under which recalled conversation memory is stored for later stages/agents. */
export const CONVERSATION_MEMORY_SCRATCHPAD_KEY = "ai-core.conversationMemory";

/**
 * Fourth stage of the {@link ExecutionPipeline}: `LOAD_MEMORY`.
 * Preloads this request's session-scoped memory and (if a conversation
 * id is present on the identity) conversation-scoped memory into the
 * execution context's `scratchpad`, so both {@link RenderPromptStage}
 * and the target agent's own lifecycle methods can read prior context
 * without each independently re-querying the memory subsystem.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class LoadMemoryStage<TPayload, TResult>
  implements IPipelineStage<PipelinePayload<TPayload, TResult>, PipelinePayload<TPayload, TResult>>
{
  /** @inheritdoc */
  public readonly name = PipelineStageName.LOAD_MEMORY;

  /**
   * Loads session and (optionally) conversation memory into the
   * context's scratchpad.
   *
   * @param input - The pipeline payload produced by {@link ValidationStage}.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified.
   * @throws {MemoryError} If the underlying memory adapter fails to read.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    const { identity } = input.input;

    try {
      const sessionHistory = await context.memory.session(identity.sessionId).recallAll();
      context.scratchpad.set(SESSION_MEMORY_SCRATCHPAD_KEY, sessionHistory);

      if (identity.conversationId) {
        const conversationHistory = await context.memory
          .conversation(identity.conversationId)
          .recallAll();
        context.scratchpad.set(CONVERSATION_MEMORY_SCRATCHPAD_KEY, conversationHistory);
      }

      context.logger.debug("Memory loaded for request", {
        agentId: input.agentId,
        sessionId: identity.sessionId,
        conversationId: identity.conversationId ?? null,
      });

      return input;
    } catch (error) {
      if (error instanceof MemoryError) throw error;

      throw new MemoryError(
        `Failed to load memory for session "${identity.sessionId}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        MemoryScope.SESSION,
      );
    }
  }
}

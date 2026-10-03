import { AgentError } from "@/ai-core/errors/agent-error";
import { MemoryError } from "@/ai-core/errors/memory-error";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { MemoryScope } from "@/ai-core/types/memory.types";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/**
 * A single stored turn — the input and output of one completed agent
 * execution — as persisted into session/conversation memory by this
 * stage. Distinct from {@link AgentInput}/{@link AgentOutput} so the
 * memory record's shape doesn't couple directly to those pipeline
 * types.
 */
export interface StoredTurn {
  readonly requestId: string;
  readonly agentId: string;
  readonly payload: unknown;
  readonly result: unknown;
  readonly durationMs: number;
  readonly timestamp: string;
}

/**
 * Eighth stage of the {@link ExecutionPipeline}: `STORE_MEMORY`.
 * Persists the completed request/response turn into both session-scoped
 * and (when a conversation id is present) conversation-scoped memory,
 * so subsequent requests in the same session/conversation can recall it
 * via {@link LoadMemoryStage}. Runs only after {@link ExecuteAgentStage}
 * has produced a result — if the agent failed, the pipeline never
 * reaches this stage, so no partial/failed turn is ever persisted.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class StoreMemoryStage<TPayload, TResult> implements IPipelineStage<
  PipelinePayload<TPayload, TResult>,
  PipelinePayload<TPayload, TResult>
> {
  /** @inheritdoc */
  public readonly name = PipelineStageName.STORE_MEMORY;

  /**
   * Writes the completed turn to session and conversation memory.
   *
   * @param input - The pipeline payload produced by {@link CallToolsStage}, with `result` populated.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified.
   * @throws {AgentError} If `result` is missing (indicates a pipeline configuration error — stages ran out of order).
   * @throws {MemoryError} If the underlying memory adapter fails to write.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    if (!input.result) {
      throw new AgentError(
        `Cannot store memory for agent "${input.agentId}": no result was produced`,
        input.agentId,
      );
    }

    const { identity, requestId, payload } = input.input;
    const turn: StoredTurn = {
      requestId,
      agentId: input.agentId,
      payload,
      result: input.result.result,
      durationMs: input.result.durationMs,
      timestamp: new Date().toISOString(),
    };

    try {
      await context.memory.session(identity.sessionId).remember(`turn:${requestId}`, turn);

      if (identity.conversationId) {
        await context.memory
          .conversation(identity.conversationId)
          .remember(`turn:${requestId}`, turn);
      }

      context.logger.debug("Stored completed turn in memory", {
        agentId: input.agentId,
        requestId,
      });

      return input;
    } catch (error) {
      if (error instanceof MemoryError) throw error;

      throw new MemoryError(
        `Failed to store turn for request "${requestId}": ${
          error instanceof Error ? error.message : String(error)
        }`,
        MemoryScope.SESSION,
      );
    }
  }
}

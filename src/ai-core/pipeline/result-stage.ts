import { AgentError } from "@/ai-core/errors/agent-error";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/**
 * Final stage of the {@link ExecutionPipeline}: `RESULT`. Performs one
 * last integrity check — a populated `result` — before the
 * {@link AIEngine} hands the output back to its caller, then logs
 * completion. Exists as its own stage (rather than folding this check
 * into {@link StoreMemoryStage}) so the trace has an explicit final
 * entry marking successful completion, distinct from the memory-write
 * step.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class ResultStage<TPayload, TResult>
  implements IPipelineStage<PipelinePayload<TPayload, TResult>, PipelinePayload<TPayload, TResult>>
{
  /** @inheritdoc */
  public readonly name = PipelineStageName.RESULT;

  /**
   * Verifies a result is present and logs pipeline completion.
   *
   * @param input - The pipeline payload produced by {@link StoreMemoryStage}.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified.
   * @throws {AgentError} If `result` is missing.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    if (!input.result) {
      throw new AgentError(
        `Pipeline completed without producing a result for agent "${input.agentId}"`,
        input.agentId,
      );
    }

    context.logger.info("Pipeline execution completed", {
      agentId: input.agentId,
      requestId: input.input.requestId,
      durationMs: input.result.durationMs,
    });

    return input;
  }
}

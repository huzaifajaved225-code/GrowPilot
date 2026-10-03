import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/**
 * First stage of the {@link ExecutionPipeline}: `INPUT`. Performs no
 * business validation (that belongs to {@link ValidationStage} and to
 * the target agent's own `validate()` hook) — its sole responsibility
 * is to record that a request has entered the pipeline and make the
 * initial payload available to every later stage unmodified, giving
 * observability tooling a single, reliable "request received" trace
 * entry to anchor on.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class InputStage<TPayload, TResult> implements IPipelineStage<
  PipelinePayload<TPayload, TResult>,
  PipelinePayload<TPayload, TResult>
> {
  /** @inheritdoc */
  public readonly name = PipelineStageName.INPUT;

  /**
   * Logs receipt of the request and passes the payload through
   * unmodified.
   *
   * @param input - The initial pipeline payload.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    context.logger.debug("Pipeline received request", {
      agentId: input.agentId,
      requestId: input.input.requestId,
    });

    return input;
  }
}

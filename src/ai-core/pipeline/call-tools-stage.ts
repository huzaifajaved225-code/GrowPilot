import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import type { ToolInput, ToolOutput } from "@/ai-core/types/tool.types";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/**
 * Scratchpad key an agent may push {@link ToolInput} entries onto during
 * `run()` when it wants a tool invoked as a deferred, post-execution
 * step rather than awaited inline (e.g. a non-blocking notification or
 * analytics-tracking tool call that shouldn't add to the agent's own
 * latency). Most tool calls should simply be awaited directly via
 * `context.tools.invoke(...)` inside `run()`; this queue exists for the
 * minority that shouldn't block the agent's primary result.
 */
export const PENDING_TOOL_CALLS_SCRATCHPAD_KEY = "ai-core.pendingToolCalls";

/** Scratchpad key this stage writes the results of any flushed deferred tool calls to. */
export const DEFERRED_TOOL_RESULTS_SCRATCHPAD_KEY = "ai-core.deferredToolResults";

/**
 * Seventh stage of the {@link ExecutionPipeline}: `CALL_TOOLS`. Flushes
 * any tool invocations the target agent queued (rather than awaited
 * inline) during its `run()` phase by pushing {@link ToolInput} entries
 * onto {@link PENDING_TOOL_CALLS_SCRATCHPAD_KEY}. Invokes each through
 * the shared {@link IExecutionContext.tools} registry — which uniformly
 * applies permission checks, input/output validation, timeout, and
 * retry — and records every result back onto the scratchpad for
 * {@link StoreMemoryStage} and the final result to reference.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class CallToolsStage<TPayload, TResult> implements IPipelineStage<
  PipelinePayload<TPayload, TResult>,
  PipelinePayload<TPayload, TResult>
> {
  /** @inheritdoc */
  public readonly name = PipelineStageName.CALL_TOOLS;

  /**
   * Invokes every deferred tool call the agent queued, in order.
   *
   * @param input - The pipeline payload produced by {@link ExecuteAgentStage}.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified (results are recorded on the scratchpad).
   * @throws {ToolError} If a queued tool call fails permission checks, validation, or exhausts its retries.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    const pendingCalls =
      (context.scratchpad.get(PENDING_TOOL_CALLS_SCRATCHPAD_KEY) as
        ToolInput<unknown>[] | undefined) ?? [];

    if (pendingCalls.length === 0) {
      return input;
    }

    context.logger.debug("Flushing deferred tool calls", {
      agentId: input.agentId,
      count: pendingCalls.length,
    });

    const results: ToolOutput<unknown>[] = [];

    for (const toolInput of pendingCalls) {
      const result = await context.tools.invoke(toolInput);
      results.push(result);
    }

    context.scratchpad.set(DEFERRED_TOOL_RESULTS_SCRATCHPAD_KEY, results);
    context.scratchpad.delete(PENDING_TOOL_CALLS_SCRATCHPAD_KEY);

    return input;
  }
}

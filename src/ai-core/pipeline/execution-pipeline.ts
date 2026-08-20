import { AgentError } from "@/ai-core/errors/agent-error";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { IAgentRegistry } from "@/ai-core/interfaces/registry.interface";
import { CallToolsStage } from "@/ai-core/pipeline/call-tools-stage";
import { ExecuteAgentStage } from "@/ai-core/pipeline/execute-agent-stage";
import { InputStage } from "@/ai-core/pipeline/input-stage";
import { LoadMemoryStage } from "@/ai-core/pipeline/load-memory-stage";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { RenderPromptStage } from "@/ai-core/pipeline/render-prompt-stage";
import { ResultStage } from "@/ai-core/pipeline/result-stage";
import { StoreMemoryStage } from "@/ai-core/pipeline/store-memory-stage";
import { ValidationStage } from "@/ai-core/pipeline/validation-stage";
import type { AgentOutput } from "@/ai-core/types/agent.types";
import { elapsedMs, nowMs } from "@/ai-core/utils/date-utils";

/** A pipeline stage specialized to the shared {@link PipelinePayload} shape used by `ExecutionPipeline`. */
type Stage<TPayload, TResult> = IPipelineStage<
  PipelinePayload<TPayload, TResult>,
  PipelinePayload<TPayload, TResult>
>;

/**
 * Executes the fixed, ordered sequence of pipeline stages defined by
 * the AI Core architecture:
 *
 * `INPUT -> VALIDATION -> LOAD_MEMORY -> RENDER_PROMPT -> EXECUTE_AGENT
 * -> CALL_TOOLS -> STORE_MEMORY -> RESULT`
 *
 * Implements the Chain of Responsibility pattern: each stage receives
 * the payload produced by the previous stage and hands its own output
 * to the next, with `ExecutionPipeline` itself responsible only for
 * ordering, timing, and tracing — never for any stage's business logic.
 * Timing and success/failure of every stage is recorded via
 * {@link IExecutionContext.recordTrace}, giving every execution a
 * complete, replayable {@link PipelineTraceEntry} history regardless of
 * where it failed.
 *
 * The stage list itself is open for extension (new stages can be
 * inserted, e.g. a caching stage before `EXECUTE_AGENT`) without
 * modifying `ExecutionPipeline`'s own code — an application of the
 * Open/Closed Principle.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class ExecutionPipeline<TPayload = unknown, TResult = unknown> {
  /**
   * @param stages - The ordered list of stages this pipeline executes. Use {@link createDefaultPipeline} for the standard 8-stage configuration.
   */
  constructor(private readonly stages: readonly Stage<TPayload, TResult>[]) {}

  /**
   * Runs every configured stage in order against the initial payload,
   * threading the shared execution context through each one and
   * recording a trace entry per stage regardless of outcome.
   *
   * @param initialPayload - The starting pipeline payload (agent id + raw agent input).
   * @param context - The shared, request-scoped execution context.
   * @returns The completed {@link AgentOutput} produced by the target agent.
   * @throws {AgentError} If the pipeline completes without any stage producing a result.
   * @throws {Error} Whatever error the failing stage itself throws (propagated after being traced).
   */
  public async run(
    initialPayload: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<AgentOutput<TResult>> {
    let payload = initialPayload;

    for (const stage of this.stages) {
      const startedAt = nowMs();

      try {
        payload = await stage.execute(payload, context);

        context.recordTrace({
          stage: stage.name,
          startedAt,
          durationMs: elapsedMs(startedAt),
          success: true,
        });
      } catch (error) {
        context.recordTrace({
          stage: stage.name,
          startedAt,
          durationMs: elapsedMs(startedAt),
          success: false,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        throw error;
      }
    }

    if (!payload.result) {
      throw new AgentError(
        `Pipeline completed for agent "${payload.agentId}" without producing a result`,
        payload.agentId,
      );
    }

    return payload.result;
  }
}

/**
 * Builds the standard, production {@link ExecutionPipeline} configured
 * with all 8 stages in the architecture-defined order. The single
 * external dependency every stage needs beyond the shared
 * {@link IExecutionContext} — the {@link IAgentRegistry} used by
 * `EXECUTE_AGENT` — is injected here, keeping every individual stage
 * class free of any registry/singleton knowledge of its own.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 * @param agentRegistry - The registry used to resolve the target agent during the `EXECUTE_AGENT` stage.
 * @returns A fully-configured `ExecutionPipeline` ready to `run()`.
 */
export function createDefaultPipeline<TPayload = unknown, TResult = unknown>(
  agentRegistry: IAgentRegistry,
): ExecutionPipeline<TPayload, TResult> {
  return new ExecutionPipeline<TPayload, TResult>([
    new InputStage<TPayload, TResult>(),
    new ValidationStage<TPayload, TResult>(),
    new LoadMemoryStage<TPayload, TResult>(),
    new RenderPromptStage<TPayload, TResult>(),
    new ExecuteAgentStage<TPayload, TResult>(agentRegistry),
    new CallToolsStage<TPayload, TResult>(),
    new StoreMemoryStage<TPayload, TResult>(),
    new ResultStage<TPayload, TResult>(),
  ]);
}

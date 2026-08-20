import type { AgentId, Metadata, RequestId } from "@/ai-core/types/common.types";

/**
 * The ordered stages of the AI Core execution pipeline, as defined in
 * the architecture spec:
 *
 * `INPUT -> VALIDATION -> LOAD_MEMORY -> RENDER_PROMPT -> EXECUTE_AGENT
 * -> CALL_TOOLS -> STORE_MEMORY -> RESULT`
 *
 * Each stage is implemented as an {@link IPipelineStage} and executed in
 * this order by the {@link ExecutionPipeline}.
 */
export enum PipelineStageName {
  INPUT = "INPUT",
  VALIDATION = "VALIDATION",
  LOAD_MEMORY = "LOAD_MEMORY",
  RENDER_PROMPT = "RENDER_PROMPT",
  EXECUTE_AGENT = "EXECUTE_AGENT",
  CALL_TOOLS = "CALL_TOOLS",
  STORE_MEMORY = "STORE_MEMORY",
  RESULT = "RESULT",
}

/**
 * A single entry in a pipeline's execution trace — one per stage that
 * ran, recorded regardless of success or failure for observability.
 */
export interface PipelineTraceEntry {
  readonly stage: PipelineStageName;
  readonly startedAt: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly errorMessage?: string;
}

/**
 * Summary metadata describing a completed (or failed) pipeline run.
 */
export interface PipelineExecutionSummary {
  readonly requestId: RequestId;
  readonly agentId: AgentId;
  readonly totalDurationMs: number;
  readonly trace: readonly PipelineTraceEntry[];
  readonly metadata: Metadata;
}

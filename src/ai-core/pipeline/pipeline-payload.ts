import type { AgentId, Metadata } from "@/ai-core/types/common.types";
import type { AgentInput, AgentOutput } from "@/ai-core/types/agent.types";

/**
 * The single mutable payload object threaded through every stage of the
 * {@link ExecutionPipeline}. Rather than each stage transforming the
 * data into an entirely new shape (which would require a distinct
 * generic type per stage transition), every stage receives and returns
 * this same `PipelinePayload`, progressively filling in optional fields
 * as the request moves through
 * `INPUT -> VALIDATION -> LOAD_MEMORY -> RENDER_PROMPT -> EXECUTE_AGENT
 * -> CALL_TOOLS -> STORE_MEMORY -> RESULT`. This keeps every stage
 * independently testable and reorderable while satisfying
 * {@link IPipelineStage}'s `TIn`/`TOut` generic contract with a single,
 * consistent type.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export interface PipelinePayload<TPayload = Metadata, TResult = Metadata> {
  /** The identifier of the agent this request targets. */
  readonly agentId: AgentId;
  /** The original, immutable agent input for this request. */
  readonly input: AgentInput<TPayload>;
  /** Populated by {@link ExecuteAgentStage} once the agent has run. */
  result?: AgentOutput<TResult>;
}

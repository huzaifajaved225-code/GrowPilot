import type { AgentInput, AgentOutput, ExecutionIdentity } from "@/ai-core/types/agent.types";
import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Parameters for a single {@link IAIEngine.run} invocation.
 *
 * @typeParam TPayload - The shape of the agent-specific input payload.
 */
export interface RunAgentOptions<TPayload = Metadata> {
  /** The identifier of the agent to execute, as registered in the {@link AgentRegistry}. */
  readonly agentId: string;
  /** The tenant/user/session identity this execution runs under. */
  readonly identity: ExecutionIdentity;
  /** The agent-specific input payload. */
  readonly payload: TPayload;
  /** Additional metadata forwarded through the pipeline. */
  readonly metadata?: Metadata;
}

/**
 * Top-level contract for the AI Core Engine's public entry point.
 * Implemented by {@link AIEngine} — this is the single interface the
 * rest of GrowPilot (API routes, server actions, background jobs)
 * should depend on to execute any registered agent, without needing to
 * know about the registry, pipeline, or memory/tool subsystems
 * underneath.
 */
export interface IAIEngine {
  /**
   * Executes a registered agent end-to-end through the full pipeline
   * (validation, memory load, prompt render, agent execution, tool
   * calls, memory store) and returns its result.
   *
   * @typeParam TPayload - The shape of the agent-specific input payload.
   * @typeParam TResult - The shape of the agent-specific result payload.
   * @param options - The agent to run, the identity context, and the input payload.
   * @returns The completed agent output, including timing and audit metadata.
   * @throws {AgentError} If the requested agent is not registered or fails during execution.
   * @throws {ValidationError} If the input fails validation.
   */
  run<TPayload = Metadata, TResult = Metadata>(
    options: RunAgentOptions<TPayload>,
  ): Promise<AgentOutput<TResult>>;
}

/**
 * Re-exported for convenience so callers constructing engine input
 * don't need a separate import from `agent.types` in the common case.
 */
export type { AgentInput };

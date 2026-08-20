import { AIError } from "@/ai-core/errors/ai-error";
import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Thrown when an agent fails during any lifecycle phase
 * (`validate`/`prepare`/`run`/`finalize`), when an agent cannot be
 * located in the {@link AgentRegistry}, or when an agent violates its
 * own execution contract (e.g. exceeds its configured timeout).
 */
export class AgentError extends AIError {
  /** The identifier of the agent that raised this error, if known. */
  public readonly agentId?: string;

  /**
   * @param message - Human-readable error message.
   * @param agentId - The agent identifier associated with this failure.
   * @param details - Arbitrary structured debugging details.
   * @param retryable - Whether re-invoking the agent may succeed. Defaults to `false`.
   */
  constructor(message: string, agentId?: string, details: Metadata = {}, retryable = false) {
    super(message, "AGENT_ERROR", 500, { agentId, ...details }, retryable);
    this.agentId = agentId;
  }

  /**
   * Creates an {@link AgentError} for the case where no agent is
   * registered under the requested identifier.
   *
   * @param agentId - The agent identifier that was requested.
   * @returns A new `AgentError` with a 404-equivalent status code.
   */
  public static notFound(agentId: string): AgentError {
    const error = new AgentError(`Agent "${agentId}" is not registered`, agentId);
    return Object.assign(error, { statusCode: 404 });
  }

  /**
   * Creates an {@link AgentError} for the case where an agent execution
   * exceeded its configured timeout.
   *
   * @param agentId - The agent identifier that timed out.
   * @param timeoutMs - The configured timeout, in milliseconds.
   * @returns A new, retryable `AgentError`.
   */
  public static timeout(agentId: string, timeoutMs: number): AgentError {
    return new AgentError(
      `Agent "${agentId}" exceeded its execution timeout of ${timeoutMs}ms`,
      agentId,
      { timeoutMs },
      true,
    );
  }
}

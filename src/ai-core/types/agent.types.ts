import type {
  AgentId,
  ConversationId,
  Metadata,
  OrganizationId,
  RequestId,
  SessionId,
  UserId,
} from "@/ai-core/types/common.types";
import type { RenderedPrompt } from "@/ai-core/types/prompt.types";

/**
 * Lifecycle status of a single agent execution. Consumed by observability
 * tooling and by the {@link AIEngine} to short-circuit downstream stages
 * when an execution has already failed.
 */
export enum AgentExecutionStatus {
  PENDING = "PENDING",
  VALIDATING = "VALIDATING",
  PREPARING = "PREPARING",
  RUNNING = "RUNNING",
  FINALIZING = "FINALIZING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * Identity metadata describing a registered agent, independent of any
 * single execution. Returned by {@link IAgentRegistry.listAgents} for
 * introspection/admin UIs.
 */
export interface AgentDescriptor {
  /** Unique, stable identifier for this agent (e.g. "seo-audit-agent"). */
  readonly id: AgentId;
  /** Human-readable display name. */
  readonly name: string;
  /** Short description of what the agent does, shown in admin tooling. */
  readonly description: string;
  /** Semantic version of the agent implementation. */
  readonly version: string;
  /** Free-form tags used for discovery/filtering (e.g. ["seo", "audit"]). */
  readonly tags: readonly string[];
}

/**
 * Immutable configuration supplied to an agent at construction time.
 * Distinct from per-request {@link AgentInput} — config describes how
 * the agent should generally behave; input describes what to do on
 * this specific invocation.
 */
export interface AgentConfig {
  /** Maximum wall-clock time (ms) an execution may take before aborting. */
  readonly timeoutMs: number;
  /** Number of automatic retries on transient failure. */
  readonly maxRetries: number;
  /** Names of tools this agent is permitted to invoke. */
  readonly allowedTools: readonly string[];
  /** Arbitrary agent-specific configuration values. */
  readonly metadata: Metadata;
}

/**
 * The tenant/user/session identity an execution runs under. Threaded
 * through the entire pipeline so every stage (memory, prompts, tools,
 * logging) can scope its behavior and data access correctly.
 */
export interface ExecutionIdentity {
  readonly organizationId: OrganizationId;
  readonly userId: UserId;
  readonly sessionId: SessionId;
  readonly conversationId?: ConversationId;
}

/**
 * The input payload handed to an agent for a single execution.
 *
 * @typeParam TPayload - The shape of the agent-specific input payload.
 */
export interface AgentInput<TPayload = Metadata> {
  /** Unique identifier for this specific execution request. */
  readonly requestId: RequestId;
  /** Identity context (tenant/user/session) this execution runs under. */
  readonly identity: ExecutionIdentity;
  /** The agent-specific payload (e.g. { url: string } for an SEO audit). */
  readonly payload: TPayload;
  /** Additional metadata forwarded verbatim through the pipeline. */
  readonly metadata: Metadata;
}

/**
 * The output payload returned by a successful agent execution.
 *
 * @typeParam TResult - The shape of the agent-specific result payload.
 */
export interface AgentOutput<TResult = Metadata> {
  /** The request this output corresponds to. */
  readonly requestId: RequestId;
  /** The agent-specific result payload. */
  readonly result: TResult;
  /** The rendered prompt(s) used to produce this result, for auditability. */
  readonly promptsUsed: readonly RenderedPrompt[];
  /** Names of tools invoked during this execution, in call order. */
  readonly toolsInvoked: readonly string[];
  /** Wall-clock duration of the full execution, in milliseconds. */
  readonly durationMs: number;
  /** Additional result metadata (token usage, model name, etc.). */
  readonly metadata: Metadata;
}

/**
 * Mutable execution context passed through every stage of an agent's
 * lifecycle (`validate` -> `prepare` -> `run` -> `finalize`). Distinct
 * from the engine-level {@link IExecutionContext}, which wraps this plus
 * shared services (logger, memory manager, tool registry).
 *
 * @typeParam TPayload - The shape of the agent-specific input payload.
 */
export interface AgentExecutionState<TPayload = Metadata> {
  readonly input: AgentInput<TPayload>;
  status: AgentExecutionStatus;
  readonly startedAt: number;
  readonly promptsUsed: RenderedPrompt[];
  readonly toolsInvoked: string[];
  readonly workingMemory: Map<string, unknown>;
}

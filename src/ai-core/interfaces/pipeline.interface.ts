import type { ILogger } from "@/ai-core/interfaces/logger.interface";
import type { IMemoryManager } from "@/ai-core/interfaces/memory.interface";
import type { IPromptManager } from "@/ai-core/interfaces/prompt.interface";
import type { IToolRegistry } from "@/ai-core/interfaces/tool.interface";
import type { ExecutionIdentity } from "@/ai-core/types/agent.types";
import type { Metadata, RequestId } from "@/ai-core/types/common.types";
import type { PipelineStageName, PipelineTraceEntry } from "@/ai-core/types/pipeline.types";
import type { AIProviderRequest, AIProviderResponse, ProviderId } from "@/lib/ai/provider.types";

/**
 * Minimal contract for an AI provider manager — the gateway agents use to
 * call LLM providers. Defined in ai-core so the execution context can
 * reference it without importing the concrete `ProviderManager` from
 * `@/lib/ai`, keeping the dependency direction clean.
 *
 * The concrete {@link ProviderManager} from `@/lib/ai` satisfies this
 * interface structurally.
 */
export interface IAIProviderManager {
  generateText(request: AIProviderRequest, providerOverride?: ProviderId): Promise<AIProviderResponse>;
}

/**
 * The shared, request-scoped context threaded through every stage of
 * the {@link ExecutionPipeline} and every phase of an agent's lifecycle.
 * Constructed once per request by the {@link AIEngine} via dependency
 * injection, giving every downstream consumer (agents, tools, pipeline
 * stages) access to the same logger, memory manager, prompt manager,
 * provider manager, and tool registry without needing to import
 * singletons directly — this is what makes the whole engine
 * unit-testable.
 */
export interface IExecutionContext {
  /** The unique identifier for this execution request. */
  readonly requestId: RequestId;
  /** The tenant/user/session identity this execution runs under. */
  readonly identity: ExecutionIdentity;
  /** Request-scoped logger, pre-bound with `requestId` and identity context. */
  readonly logger: ILogger;
  /** The memory façade used to load/store state across all scopes. */
  readonly memory: IMemoryManager;
  /** The prompt manager used to render templates for this request. */
  readonly prompts: IPromptManager;
  /** The tool registry used to invoke tools during this request. */
  readonly tools: IToolRegistry;
  /** The AI provider manager used to call LLM providers with timeout, retry, and fallback. */
  readonly providerManager: IAIProviderManager;
  /** Mutable, request-scoped key/value bag for passing data between pipeline stages. */
  readonly scratchpad: Map<string, unknown>;
  /** Accumulated trace entries for every pipeline stage executed so far. */
  readonly trace: PipelineTraceEntry[];

  /**
   * Records a completed (or failed) pipeline stage into this context's
   * trace, used to build the final {@link PipelineExecutionSummary}.
   *
   * @param entry - The trace entry describing the stage that just ran.
   */
  recordTrace(entry: PipelineTraceEntry): void;
}

/**
 * Contract for a single stage in the {@link ExecutionPipeline}. Each
 * stage receives the current context plus the running payload from the
 * previous stage and returns the payload for the next stage — a
 * classic pipeline/chain-of-responsibility shape that keeps each stage
 * independently testable and lets the pipeline be reconfigured (stages
 * added/removed/reordered) without touching stage implementations.
 *
 * @typeParam TIn - The shape of data this stage receives.
 * @typeParam TOut - The shape of data this stage produces for the next stage.
 */
export interface IPipelineStage<TIn, TOut> {
  /** The stage name, used for tracing and error attribution. */
  readonly name: PipelineStageName;

  /**
   * Executes this stage's logic.
   *
   * @param input - The payload produced by the previous stage.
   * @param context - The shared, request-scoped execution context.
   * @returns The payload to hand to the next stage.
   */
  execute(input: TIn, context: IExecutionContext): Promise<TOut>;
}

/**
 * Immutable snapshot metadata describing an execution context at
 * construction time, used by the {@link AIEngine} to build a new
 * {@link IExecutionContext} via its dependency container.
 */
export interface ExecutionContextOptions {
  readonly requestId: RequestId;
  readonly identity: ExecutionIdentity;
  readonly logger: ILogger;
  readonly memory: IMemoryManager;
  readonly prompts: IPromptManager;
  readonly tools: IToolRegistry;
  readonly providerManager: IAIProviderManager;
  readonly metadata?: Metadata;
}
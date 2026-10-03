import type { IAIProviderManager } from "@/ai-core/interfaces/pipeline.interface";
import type { ILogger } from "@/ai-core/interfaces/logger.interface";
import type { IMemoryManager } from "@/ai-core/interfaces/memory.interface";
import type {
  ExecutionContextOptions,
  IExecutionContext,
} from "@/ai-core/interfaces/pipeline.interface";
import type { IPromptManager } from "@/ai-core/interfaces/prompt.interface";
import type { IToolRegistry } from "@/ai-core/interfaces/tool.interface";
import type { ExecutionIdentity } from "@/ai-core/types/agent.types";
import type { Metadata, RequestId } from "@/ai-core/types/common.types";
import type { PipelineTraceEntry } from "@/ai-core/types/pipeline.types";

/**
 * Concrete, per-request implementation of {@link IExecutionContext}.
 * Constructed exactly once per {@link AIEngine.run} invocation (see
 * {@link AIEngine}) via dependency injection of the shared logger,
 * memory manager, prompt manager, tool registry, and provider manager,
 * so every pipeline stage and every agent lifecycle phase for a single
 * request shares one consistent view of these services, a fresh
 * `scratchpad`, and a fresh `trace` — nothing here is a process-wide
 * singleton, which is what makes the whole engine safe to run
 * concurrently across many in-flight requests and easy to unit test
 * with fakes substituted for any one dependency.
 */
export class ExecutionContext implements IExecutionContext {
  /** @inheritdoc */
  public readonly requestId: RequestId;
  /** @inheritdoc */
  public readonly identity: ExecutionIdentity;
  /** @inheritdoc */
  public readonly logger: ILogger;
  /** @inheritdoc */
  public readonly memory: IMemoryManager;
  /** @inheritdoc */
  public readonly prompts: IPromptManager;
  /** @inheritdoc */
  public readonly tools: IToolRegistry;
  /** @inheritdoc */
  public readonly providerManager: IAIProviderManager;
  /** @inheritdoc */
  public readonly scratchpad: Map<string, unknown>;
  /** @inheritdoc */
  public readonly trace: PipelineTraceEntry[];

  private readonly metadata: Metadata;

  /**
   * @param options - The request identity, shared services, and optional metadata this context wraps.
   */
  constructor(options: ExecutionContextOptions) {
    this.requestId = options.requestId;
    this.identity = options.identity;
    this.memory = options.memory;
    this.prompts = options.prompts;
    this.tools = options.tools;
    this.providerManager = options.providerManager;
    this.metadata = options.metadata ?? {};
    this.scratchpad = new Map<string, unknown>();
    this.trace = [];

    // Bind requestId/identity onto every subsequent log entry emitted
    // through this context, so no downstream caller needs to remember
    // to pass them manually on every call.
    this.logger = options.logger.child({
      requestId: this.requestId,
      organizationId: options.identity.organizationId,
      userId: options.identity.userId,
      sessionId: options.identity.sessionId,
    });
  }

  /** @inheritdoc */
  public recordTrace(entry: PipelineTraceEntry): void {
    this.trace.push(entry);
  }

  /**
   * Returns the metadata this context was constructed with, merged with
   * any caller-supplied overrides. Exposed as a method rather than a
   * public field so future call sites can extend it (e.g. redacting
   * sensitive keys) without changing the {@link IExecutionContext}
   * interface.
   *
   * @param overrides - Additional metadata to merge on top of this context's own.
   * @returns The merged metadata map.
   */
  public getMetadata(overrides: Metadata = {}): Metadata {
    return { ...this.metadata, ...overrides };
  }
}
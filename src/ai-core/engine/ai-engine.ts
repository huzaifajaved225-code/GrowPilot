import { AgentRegistry } from "@/ai-core/registry/agent-registry";
import { resolveAICoreConfig, type AICoreConfig } from "@/ai-core/config/ai-config";
import { ExecutionContext } from "@/ai-core/engine/execution-context";
import type { IAIEngine, RunAgentOptions } from "@/ai-core/interfaces/engine.interface";
import type { ILogger } from "@/ai-core/interfaces/logger.interface";
import type { IMemoryManager } from "@/ai-core/interfaces/memory.interface";
import type { IAIProviderManager } from "@/ai-core/interfaces/pipeline.interface";
import type { IPromptManager } from "@/ai-core/interfaces/prompt.interface";
import type { IAgentRegistry } from "@/ai-core/interfaces/registry.interface";
import type { IToolRegistry } from "@/ai-core/interfaces/tool.interface";
import { MemoryManager } from "@/ai-core/memory/memory-manager";
import { createDefaultPipeline } from "@/ai-core/pipeline/execution-pipeline";
import { PromptManager } from "@/ai-core/prompts/prompt-manager";
import { ToolRegistry } from "@/ai-core/tools/tool-registry";
import type { AgentId, DeepPartial, Metadata } from "@/ai-core/types/common.types";
import type { AgentInput, AgentOutput } from "@/ai-core/types/agent.types";
import { generateRequestId } from "@/ai-core/utils/id-generator";
import { defaultLogger } from "@/ai-core/utils/logger";

import { ProviderManager } from "@/lib/ai/provider-manager";

/**
 * Constructor dependencies for {@link AIEngine}. Every dependency is
 * optional and falls back to a sensible production default — this is
 * the Dependency Injection seam that makes the engine unit-testable:
 * a test can construct `new AIEngine({ agentRegistry: fakeRegistry })`
 * and substitute exactly the one collaborator it needs to control,
 * without needing to mock the entire module graph.
 */
export interface AIEngineOptions {
  /** Partial engine configuration; unset fields fall back to {@link DEFAULT_AI_CORE_CONFIG}. */
  readonly config?: DeepPartial<AICoreConfig>;
  /** Agent catalog. Defaults to the process-wide {@link AgentRegistry} singleton. */
  readonly agentRegistry?: IAgentRegistry;
  /** Tool catalog. Defaults to the process-wide {@link ToolRegistry} singleton. */
  readonly toolRegistry?: IToolRegistry;
  /** Prompt template manager. Defaults to a fresh {@link PromptManager} instance. */
  readonly promptManager?: IPromptManager;
  /** Memory façade. Defaults to a fresh {@link MemoryManager} configured from `config.memory`. */
  readonly memoryManager?: IMemoryManager;
  /** AI provider manager. Defaults to the process-wide `ProviderManager` singleton (lazy-imported to avoid circular deps). */
  readonly providerManager?: IAIProviderManager;
  /** Root logger every request-scoped logger is derived from. Defaults to {@link defaultLogger}. */
  readonly logger?: ILogger;
}

/**
 * The central AI Engine — the single class the rest of GrowPilot
 * depends on to execute any registered agent. Responsible for exactly
 * the concerns laid out in the architecture spec:
 *
 * - **Request lifecycle**: generates a unique {@link RequestId} per
 *   call and drives it from receipt through to completed/failed.
 * - **Context creation**: builds one fresh {@link ExecutionContext} per
 *   request (see {@link ExecutionContext}), never reusing state across
 *   requests.
 * - **Dependency injection**: every subsystem (agent registry, tool
 *   registry, prompt manager, memory manager, provider manager,
 *   logger) is injected via {@link AIEngineOptions} rather than reached
 *   for as a bare import, with production-sensible singleton defaults.
 * - **Execution pipeline**: delegates the actual
 *   `INPUT -> ... -> RESULT` sequencing to {@link ExecutionPipeline},
 *   built once via {@link createDefaultPipeline}.
 * - **Result/error handling**: normalizes every failure into the AI
 *   Core's typed error hierarchy before it escapes `run()`, and logs
 *   both success and failure with structured, correlatable context.
 *
 * `AIEngine` itself contains no agent-specific or tool-specific logic —
 * per the Open/Closed Principle, new agents and tools extend the
 * system by registering into {@link AgentRegistry}/{@link ToolRegistry}
 * without requiring any change to this class.
 */
export class AIEngine implements IAIEngine {
  private static instance: AIEngine | undefined;

  /** The agent catalog this engine resolves agents from. */
  public readonly agentRegistry: IAgentRegistry;
  /** The tool catalog available to every agent executed by this engine. */
  public readonly toolRegistry: IToolRegistry;
  /** The prompt template manager available to every agent executed by this engine. */
  public readonly promptManager: IPromptManager;
  /** The memory façade available to every agent executed by this engine. */
  public readonly memoryManager: IMemoryManager;
  /** The AI provider manager available to every agent executed by this engine. */
  public readonly providerManager: IAIProviderManager;

  private readonly logger: ILogger;
  private readonly config: AICoreConfig;

  /**
   * @param options - Optional overrides for configuration and every injected subsystem.
   */
  constructor(options: AIEngineOptions = {}) {
    this.config = resolveAICoreConfig(options.config);
    this.logger = (options.logger ?? defaultLogger).child({ component: "AIEngine" });

    this.agentRegistry = options.agentRegistry ?? AgentRegistry.getInstance();
    this.toolRegistry = options.toolRegistry ?? ToolRegistry.getInstance();
    this.promptManager = options.promptManager ?? new PromptManager();
    this.memoryManager =
      options.memoryManager ??
      new MemoryManager({
        sessionTtlMs: this.config.memory.sessionTtlMs,
        conversationTtlMs: this.config.memory.conversationTtlMs,
        queryLimit: this.config.memory.queryLimit,
      });
    this.providerManager = options.providerManager ?? AIEngine.defaultProviderManager();
  }

  /**
   * Returns the process-wide singleton `AIEngine` instance, creating it
   * with default (singleton-backed) dependencies on first access. Use
   * this from API routes, server actions, and background jobs; construct
   * `new AIEngine({...})` directly wherever isolated dependencies are
   * needed (tests, or a deliberately sandboxed execution environment).
   *
   * @param options - Only consulted the first time this is called in a process; ignored on subsequent calls.
   * @returns The shared singleton instance.
   */
  public static getInstance(options?: AIEngineOptions): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine(options);
    }
    return AIEngine.instance;
  }

  /**
   * Resets the process-wide singleton, forcing the next
   * {@link AIEngine.getInstance} call to construct a fresh instance.
   * Intended for test teardown only.
   */
  public static resetInstance(): void {
    AIEngine.instance = undefined;
  }

  /** @inheritdoc */
  public async run<TPayload = Metadata, TResult = Metadata>(
    options: RunAgentOptions<TPayload>,
  ): Promise<AgentOutput<TResult>> {
    const requestId = generateRequestId();

    const context = new ExecutionContext({
      requestId,
      identity: options.identity,
      logger: this.logger,
      memory: this.memoryManager,
      prompts: this.promptManager,
      tools: this.toolRegistry,
      providerManager: this.providerManager,
      metadata: options.metadata,
    });

    const agentInput: AgentInput<TPayload> = {
      requestId,
      identity: options.identity,
      payload: options.payload,
      metadata: options.metadata ?? {},
    };

    const pipeline = createDefaultPipeline<TPayload, TResult>(this.agentRegistry);

    context.logger.info("AI Engine run started", { agentId: options.agentId });

    try {
      const result = await pipeline.run(
        { agentId: options.agentId as AgentId, input: agentInput },
        context,
      );

      context.logger.info("AI Engine run completed", {
        agentId: options.agentId,
        durationMs: result.durationMs,
        stageCount: context.trace.length,
      });

      return result;
    } catch (error) {
      context.logger.error("AI Engine run failed", {
        agentId: options.agentId,
        errorMessage: error instanceof Error ? error.message : String(error),
        stageCount: context.trace.length,
        failedStage: context.trace.at(-1)?.stage ?? null,
      });

      throw error;
    }
  }

  /**
   * Lazy-imports the concrete `ProviderManager` singleton to avoid a
   * static circular dependency between `@/ai-core` and `@/lib/ai`.
   * Called once during construction when no explicit `providerManager`
   * is injected.
   */
  private static defaultProviderManager(): IAIProviderManager {
    return ProviderManager.getInstance();
  }
}
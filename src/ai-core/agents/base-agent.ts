import { AgentError } from "@/ai-core/errors/agent-error";
import type { IAgent } from "@/ai-core/interfaces/agent.interface";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import {
  AgentExecutionStatus,
  type AgentConfig,
  type AgentDescriptor,
  type AgentExecutionState,
  type AgentInput,
  type AgentOutput,
} from "@/ai-core/types/agent.types";
import type { Metadata } from "@/ai-core/types/common.types";
import { AI_CORE_DEFAULTS } from "@/ai-core/utils/constants";
import { elapsedMs, nowMs } from "@/ai-core/utils/date-utils";
import { withRetry, withTimeout } from "@/ai-core/utils/helpers";
import type { AIProviderRequest, AIProviderResponse } from "@/lib/ai/provider.types";

/**
 * Fully-resolved {@link AgentConfig}, produced by merging a subclass's
 * partial overrides onto the engine-wide agent defaults from
 * {@link AI_CORE_DEFAULTS}. Kept as its own type so `BaseAgent`'s
 * constructor signature reads clearly.
 */
function resolveAgentConfig(overrides?: Partial<AgentConfig>): AgentConfig {
  return {
    timeoutMs: overrides?.timeoutMs ?? AI_CORE_DEFAULTS.AGENT_TIMEOUT_MS,
    maxRetries: overrides?.maxRetries ?? AI_CORE_DEFAULTS.AGENT_MAX_RETRIES,
    allowedTools: overrides?.allowedTools ?? [],
    metadata: overrides?.metadata ?? {},
  };
}

/**
 * Abstract base class every concrete GrowPilot AI agent must extend.
 * Implements the Template Method pattern: {@link BaseAgent.execute}
 * orchestrates the fixed lifecycle —
 * `validate -> prepare -> run -> finalize` — applying a uniform
 * timeout and retry policy around it, while each lifecycle phase is a
 * protected hook a subclass overrides only where it needs custom
 * behavior. `validate`, `prepare`, and `finalize` all have permissive
 * no-op defaults; `run` is the one phase every subclass must implement,
 * since it's the agent's actual reason for existing.
 *
 * Subclasses should never override `execute` itself — doing so would
 * bypass the timeout/retry/error-normalization guarantees the engine
 * relies on for every agent uniformly.
 *
 * @typeParam TPayload - The shape of this agent's input payload.
 * @typeParam TResult - The shape of this agent's result payload.
 *
 * @example
 * ```ts
 * interface SeoAuditPayload { readonly url: string }
 * interface SeoAuditResult { readonly score: number; readonly issues: string[] }
 *
 * class SeoAuditAgent extends BaseAgent<SeoAuditPayload, SeoAuditResult> {
 *   public readonly descriptor: AgentDescriptor = {
 *     id: "seo-audit-agent" as AgentId,
 *     name: "SEO Audit Agent",
 *     description: "Crawls a URL and produces a scored SEO audit",
 *     version: "1.0.0",
 *     tags: ["seo", "audit"],
 *   };
 *
 *   protected async run(
 *     input: AgentInput<SeoAuditPayload>,
 *     context: IExecutionContext,
 *   ): Promise<SeoAuditResult> {
 *     const prompt = context.prompts.render("seo-audit-system", { url: input.payload.url });
 *     // ... call a model provider, invoke tools via context.tools.invoke(...), etc.
 *     return { score: 87, issues: ["Missing meta description"] };
 *   }
 * }
 * ```
 */
export abstract class BaseAgent<TPayload = Metadata, TResult = Metadata>
  implements IAgent<TPayload, TResult>
{
  /** Static identity metadata for this agent. Every concrete agent must define its own. */
  public abstract readonly descriptor: AgentDescriptor;

  /** Fully-resolved execution configuration for this agent instance. */
  protected readonly config: AgentConfig;

  /**
   * @param configOverrides - Partial execution config overriding the engine-wide agent defaults.
   */
  protected constructor(configOverrides?: Partial<AgentConfig>) {
    this.config = resolveAgentConfig(configOverrides);
  }

  /**
   * Validates the incoming input before any work begins. Default
   * implementation is a permissive no-op; override to enforce a schema
   * (typically via a Zod `parse` call that throws a
   * {@link ValidationError} on failure). Must not mutate shared state.
   *
   * @param _input - The raw input for this execution.
   * @param _context - The shared execution context (memory, tools, logger).
   */
  public async validate(_input: AgentInput<TPayload>, _context: IExecutionContext): Promise<void> {
    // Intentionally permissive by default — subclasses override to enforce a schema.
  }

  /**
   * Prepares everything the agent needs to run: loading memory,
   * rendering prompts, resolving configuration. Default implementation
   * is a no-op; override when preparation work is needed ahead of
   * `run`.
   *
   * @param _input - The raw input for this execution.
   * @param _context - The shared execution context (memory, tools, logger).
   */
  public async prepare(_input: AgentInput<TPayload>, _context: IExecutionContext): Promise<void> {
    // Intentionally empty by default — subclasses override to prefetch state.
  }

  /**
   * Executes the agent's core logic and produces a result. Every
   * concrete agent must implement this method — it is the one lifecycle
   * phase with no meaningful default.
   *
   * @param input - The raw input for this execution.
   * @param context - The shared execution context (memory, tools, logger).
   * @returns The agent-specific result payload.
   */
  public abstract run(input: AgentInput<TPayload>, context: IExecutionContext): Promise<TResult>;

  /**
   * Performs any cleanup/persistence after `run` completes successfully
   * (e.g. writing to memory, emitting metrics). Default implementation
   * is a no-op. Not invoked if `run` throws.
   *
   * @param _input - The raw input for this execution.
   * @param _result - The result produced by `run`.
   * @param _context - The shared execution context (memory, tools, logger).
   */
  public async finalize(
    _input: AgentInput<TPayload>,
    _result: TResult,
    _context: IExecutionContext,
  ): Promise<void> {
    // Intentionally empty by default — subclasses override to persist results.
  }


  /**
   * Convenience helper that delegates an AI text-generation request to the
   * provider manager available through the execution context. Concrete
   * agents call this from their run() method instead of importing
   * ProviderManager directly, preserving the dependency-injection
   * pattern the engine enforces.
   *
   * The provider manager applies timeout, retry, and fallback
   * transparently, so agents never need to implement those concerns
   * themselves.
   *
   * @param request - The model, messages, and generation parameters.
   * @param context - The shared execution context (provides the provider manager).
   * @returns The normalized provider response.
   * @throws {ProviderError} If all providers in the chain are exhausted.
   */
  protected generateText(
    request: AIProviderRequest,
    context: IExecutionContext,
  ): Promise<AIProviderResponse> {
    return context.providerManager.generateText(request);
  }
  /**
   * Orchestrates the full lifecycle (`validate` -> `prepare` -> `run` ->
   * `finalize`) for a single execution, applying this agent's configured
   * timeout and retry policy uniformly around the `prepare` + `run`
   * phases (validation failures and finalize failures are never
   * retried — retrying a validation failure can never succeed, and
   * retrying `finalize` risks duplicate side effects).
   *
   * @param input - The raw input for this execution.
   * @param context - The shared execution context (memory, tools, logger).
   * @returns The full execution output, including timing and audit metadata.
   * @throws {AgentError} If validation, preparation, execution, or finalization fails.
   */
  public async execute(
    input: AgentInput<TPayload>,
    context: IExecutionContext,
  ): Promise<AgentOutput<TResult>> {
    const agentLogger = context.logger.child({ agentId: this.descriptor.id });
    const state: AgentExecutionState<TPayload> = {
      input,
      status: AgentExecutionStatus.PENDING,
      startedAt: nowMs(),
      promptsUsed: [],
      toolsInvoked: [],
      workingMemory: new Map<string, unknown>(),
    };

    try {
      state.status = AgentExecutionStatus.VALIDATING;
      agentLogger.debug("Agent validation starting", { requestId: input.requestId });
      await this.validate(input, context);

      state.status = AgentExecutionStatus.PREPARING;
      agentLogger.debug("Agent preparation starting", { requestId: input.requestId });
      await this.prepare(input, context);

      state.status = AgentExecutionStatus.RUNNING;
      agentLogger.info("Agent run starting", { requestId: input.requestId });

      const result = await withRetry(
        () =>
          withTimeout(this.run(input, context), this.config.timeoutMs, () =>
            AgentError.timeout(this.descriptor.id, this.config.timeoutMs),
          ),
        {
          maxRetries: this.config.maxRetries,
          backoffMs: 200,
          shouldRetry: (error) => error instanceof AgentError && error.retryable,
        },
      );

      state.status = AgentExecutionStatus.FINALIZING;
      await this.finalize(input, result, context);

      state.status = AgentExecutionStatus.COMPLETED;
      const durationMs = elapsedMs(state.startedAt);

      agentLogger.info("Agent execution completed", {
        requestId: input.requestId,
        durationMs,
      });

      return {
        requestId: input.requestId,
        result,
        promptsUsed: state.promptsUsed,
        toolsInvoked: state.toolsInvoked,
        durationMs,
        metadata: this.config.metadata,
      };
    } catch (error) {
      state.status = AgentExecutionStatus.FAILED;

      const normalizedError =
        error instanceof AgentError
          ? error
          : new AgentError(
              `Agent "${this.descriptor.id}" failed: ${error instanceof Error ? error.message : String(error)}`,
              this.descriptor.id,
              { cause: error instanceof Error ? error.message : String(error) },
            );

      agentLogger.error("Agent execution failed", {
        requestId: input.requestId,
        errorCode: normalizedError.code,
        errorMessage: normalizedError.message,
      });

      throw normalizedError;
    }
  }
}

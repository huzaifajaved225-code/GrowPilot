import { ToolError } from "@/ai-core/errors/tool-error";
import type { ITool, IToolRegistry } from "@/ai-core/interfaces/tool.interface";
import type { ToolDescriptor, ToolExecutionConfig, ToolInput, ToolOutput } from "@/ai-core/types/tool.types";
import { AI_CORE_DEFAULTS } from "@/ai-core/utils/constants";
import { elapsedMs, nowMs } from "@/ai-core/utils/date-utils";
import { withRetry, withTimeout } from "@/ai-core/utils/helpers";
import type { ILogger } from "@/ai-core/interfaces/logger.interface";
import { defaultLogger } from "@/ai-core/utils/logger";

/**
 * A registered tool entry — the tool instance plus any per-tool
 * execution config override (falls back to the registry's default
 * config for fields not overridden).
 */
interface ToolRegistration {
  readonly tool: ITool;
  readonly config: ToolExecutionConfig;
}

/**
 * Determines whether the caller's granted permissions satisfy every
 * permission a tool requires.
 *
 * @param required - The permission scopes the tool declares as required.
 * @param granted - The permission scopes the caller has been granted.
 * @returns `true` if every required permission is present in `granted`.
 */
function hasRequiredPermissions(required: readonly string[], granted: readonly string[]): boolean {
  const grantedSet = new Set(granted);
  return required.every((permission) => grantedSet.has(permission));
}

/**
 * Central, fully-working implementation of {@link IToolRegistry}.
 * Implements the Singleton pattern (see {@link ToolRegistry.getInstance})
 * so every agent in a process shares one governed tool catalog, while
 * still allowing isolated instances to be constructed directly for
 * testing. Every `invoke()` call uniformly applies: existence check,
 * permission check, input validation, timeout enforcement, retry with
 * exponential backoff, and output validation — regardless of which
 * concrete tool is being called.
 */
export class ToolRegistry implements IToolRegistry {
  private static instance: ToolRegistry | undefined;

  private readonly tools = new Map<string, ToolRegistration>();
  private readonly defaultConfig: ToolExecutionConfig;
  private readonly logger: ILogger;

  /**
   * @param defaultConfig - Fallback execution config applied to tools registered without their own override.
   * @param logger - Logger used for invocation-lifecycle diagnostics.
   */
  constructor(defaultConfig?: Partial<ToolExecutionConfig>, logger: ILogger = defaultLogger) {
    this.defaultConfig = {
      timeoutMs: defaultConfig?.timeoutMs ?? AI_CORE_DEFAULTS.TOOL_TIMEOUT_MS,
      maxRetries: defaultConfig?.maxRetries ?? AI_CORE_DEFAULTS.TOOL_MAX_RETRIES,
      retryBackoffMs: defaultConfig?.retryBackoffMs ?? AI_CORE_DEFAULTS.TOOL_RETRY_BACKOFF_MS,
    };
    this.logger = logger.child({ component: "ToolRegistry" });
  }

  /**
   * Returns the process-wide singleton `ToolRegistry` instance, creating
   * it on first access. Use this for the shared, production tool catalog;
   * construct `new ToolRegistry()` directly in tests that need isolation.
   *
   * @returns The shared singleton instance.
   */
  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Resets the process-wide singleton, forcing the next
   * {@link ToolRegistry.getInstance} call to create a fresh instance.
   * Intended for test teardown only.
   */
  public static resetInstance(): void {
    ToolRegistry.instance = undefined;
  }

  /** @inheritdoc */
  public registerTool(tool: ITool, configOverride?: Partial<ToolExecutionConfig>): void {
    const toolId = tool.descriptor.id;

    if (this.tools.has(toolId)) {
      throw new ToolError(`Tool "${toolId}" is already registered`, toolId);
    }

    this.tools.set(toolId, {
      tool,
      config: { ...this.defaultConfig, ...configOverride },
    });

    this.logger.debug("Tool registered", { toolId, name: tool.descriptor.name });
  }

  /** @inheritdoc */
  public unregisterTool(toolId: string): void {
    this.tools.delete(toolId);
    this.logger.debug("Tool unregistered", { toolId });
  }

  /** @inheritdoc */
  public getTool(toolId: string): ITool {
    const registration = this.tools.get(toolId);

    if (!registration) {
      throw ToolError.notFound(toolId);
    }

    return registration.tool;
  }

  /** @inheritdoc */
  public listTools(): readonly ToolDescriptor[] {
    return [...this.tools.values()].map((registration) => registration.tool.descriptor);
  }

  /**
   * Determines whether a tool is currently registered.
   *
   * @param toolId - The identifier to check.
   * @returns `true` if a tool is registered under `toolId`.
   */
  public hasTool(toolId: string): boolean {
    return this.tools.has(toolId);
  }

  /** @inheritdoc */
  public async invoke<TInput, TOutput>(input: ToolInput<TInput>): Promise<ToolOutput<TOutput>> {
    const registration = this.tools.get(input.toolId);

    if (!registration) {
      throw ToolError.notFound(input.toolId);
    }

    const { tool, config } = registration;
    const { descriptor } = tool;

    if (!hasRequiredPermissions(descriptor.requiredPermissions, input.permissionContext.grantedPermissions)) {
      throw ToolError.permissionDenied(descriptor.id, descriptor.requiredPermissions);
    }

    await tool.validateInput(input.payload);

    const startedAt = nowMs();
    let retryCount = 0;

    const output = await withRetry(
      async () => {
        return withTimeout(
          tool.execute(input.payload) as Promise<TOutput>,
          config.timeoutMs,
          () => ToolError.timeout(descriptor.id, config.timeoutMs),
        );
      },
      {
        maxRetries: config.maxRetries,
        backoffMs: config.retryBackoffMs,
        shouldRetry: (error) => {
          retryCount += 1;
          // A timeout is retryable; a validation failure from the tool
          // itself should never be blindly retried.
          return error instanceof ToolError && error.retryable;
        },
      },
    ).catch((error: unknown) => {
      throw ToolError.retriesExhausted(descriptor.id, retryCount + 1, error);
    });

    await tool.validateOutput(output);

    this.logger.info("Tool invocation completed", {
      toolId: descriptor.id,
      durationMs: elapsedMs(startedAt),
      retryCount,
    });

    return {
      toolId: descriptor.id as ToolOutput["toolId"],
      result: output,
      durationMs: elapsedMs(startedAt),
      retryCount,
      metadata: input.metadata,
    };
  }
}

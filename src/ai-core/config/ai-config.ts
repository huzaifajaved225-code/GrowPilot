import { AI_CORE_DEFAULTS } from "@/ai-core/utils/constants";
import type { DeepPartial } from "@/ai-core/types/common.types";
import type { LogLevel } from "@/ai-core/utils/logger";

/**
 * Full, resolved configuration for a single {@link AIEngine} instance.
 * Every field has a sensible default (see {@link DEFAULT_AI_CORE_CONFIG})
 * so the engine can be constructed with `new AIEngine()` in development,
 * while production call sites override only what they need to via
 * {@link resolveAICoreConfig}.
 */
export interface AICoreConfig {
  /** Default execution config applied to agents that don't override it. */
  readonly agent: {
    readonly timeoutMs: number;
    readonly maxRetries: number;
  };
  /** Default execution config applied to tools that don't override it. */
  readonly tool: {
    readonly timeoutMs: number;
    readonly maxRetries: number;
    readonly retryBackoffMs: number;
  };
  /** Default retention policy for memory scopes that don't override it. */
  readonly memory: {
    readonly sessionTtlMs: number;
    readonly conversationTtlMs: number;
    readonly queryLimit: number;
  };
  /** Logging configuration for the engine's root logger. */
  readonly logging: {
    readonly minLevel: LogLevel;
  };
}

/**
 * The engine's built-in defaults, sourced from {@link AI_CORE_DEFAULTS}
 * so there is exactly one place (`utils/constants.ts`) that defines the
 * literal default values, and one place (this file) that shapes them
 * into the structured {@link AICoreConfig} the rest of the engine
 * consumes.
 */
export const DEFAULT_AI_CORE_CONFIG: AICoreConfig = Object.freeze({
  agent: Object.freeze({
    timeoutMs: AI_CORE_DEFAULTS.AGENT_TIMEOUT_MS,
    maxRetries: AI_CORE_DEFAULTS.AGENT_MAX_RETRIES,
  }),
  tool: Object.freeze({
    timeoutMs: AI_CORE_DEFAULTS.TOOL_TIMEOUT_MS,
    maxRetries: AI_CORE_DEFAULTS.TOOL_MAX_RETRIES,
    retryBackoffMs: AI_CORE_DEFAULTS.TOOL_RETRY_BACKOFF_MS,
  }),
  memory: Object.freeze({
    sessionTtlMs: AI_CORE_DEFAULTS.SESSION_MEMORY_TTL_MS,
    conversationTtlMs: AI_CORE_DEFAULTS.CONVERSATION_MEMORY_TTL_MS,
    queryLimit: AI_CORE_DEFAULTS.MEMORY_QUERY_LIMIT,
  }),
  logging: Object.freeze({
    minLevel: "info",
  }),
});

/**
 * Merges a caller-supplied partial configuration onto
 * {@link DEFAULT_AI_CORE_CONFIG}, producing a fully-resolved
 * {@link AICoreConfig}. Used by {@link AIEngine}'s constructor so every
 * downstream subsystem (registries, memory manager, pipeline) can depend
 * on a complete, non-optional config object.
 *
 * @param overrides - A partial configuration; any omitted field falls back to its default.
 * @returns A fully-resolved `AICoreConfig`.
 */
export function resolveAICoreConfig(overrides: DeepPartial<AICoreConfig> = {}): AICoreConfig {
  return {
    agent: { ...DEFAULT_AI_CORE_CONFIG.agent, ...overrides.agent },
    tool: { ...DEFAULT_AI_CORE_CONFIG.tool, ...overrides.tool },
    memory: { ...DEFAULT_AI_CORE_CONFIG.memory, ...overrides.memory },
    logging: { ...DEFAULT_AI_CORE_CONFIG.logging, ...overrides.logging },
  };
}

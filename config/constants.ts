/**
 * -----------------------------------------------------------------------------
 * GrowPilot AI Core
 * File: config/constants.ts
 * -----------------------------------------------------------------------------
 * Centralized constants for the AI Core Engine.
 *
 * Keeping constants in one place avoids magic strings and simplifies
 * maintenance across the platform.
 * -----------------------------------------------------------------------------
 */

export const AI_CORE_VERSION = "1.0.0";

export const AI_CORE_NAME = "GrowPilot AI Core";

export const DEFAULT_AGENT_TIMEOUT_MS = 30_000;

export const DEFAULT_TOOL_TIMEOUT_MS = 15_000;

export const DEFAULT_MEMORY_LIMIT = 100;

export const DEFAULT_PROMPT_VERSION = "v1";

export const MAX_RETRY_ATTEMPTS = 3;

export const RETRY_DELAY_MS = 1_000;

export const DEFAULT_LOGGER_NAMESPACE = "growpilot-ai";

/**
 * Supported execution environments.
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  TEST: "test",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;

/**
 * Supported AI providers.
 */
export const AI_PROVIDERS = {
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  GEMINI: "gemini",
  GROQ: "groq",
  OLLAMA: "ollama",
} as const;

/**
 * Agent execution lifecycle.
 */
export const AGENT_STATUS = {
  IDLE: "idle",
  VALIDATING: "validating",
  PREPARING: "preparing",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

/**
 * Memory scopes.
 */
export const MEMORY_SCOPE = {
  SESSION: "session",
  CONVERSATION: "conversation",
  USER: "user",
  VECTOR: "vector",
} as const;

/**
 * Prompt types.
 */
export const PROMPT_TYPE = {
  SYSTEM: "system",
  USER: "user",
  ASSISTANT: "assistant",
} as const;

/**
 * Tool execution status.
 */
export const TOOL_STATUS = {
  READY: "ready",
  RUNNING: "running",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

/**
 * Common metadata keys.
 */
export const METADATA_KEYS = {
  TENANT_ID: "tenantId",
  USER_ID: "userId",
  SESSION_ID: "sessionId",
  TRACE_ID: "traceId",
  REQUEST_ID: "requestId",
} as const;

/**
 * Default pagination values.
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

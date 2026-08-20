/**
 * Central, immutable constants shared across the AI Core Engine.
 * Individual modules may override these via {@link AICoreConfig} but
 * should fall back to these values when no override is supplied.
 */
export const AI_CORE_DEFAULTS = Object.freeze({
  /** Default per-agent execution timeout, in milliseconds. */
  AGENT_TIMEOUT_MS: 30_000,
  /** Default number of automatic retries for a failed agent execution. */
  AGENT_MAX_RETRIES: 1,
  /** Default per-tool execution timeout, in milliseconds. */
  TOOL_TIMEOUT_MS: 15_000,
  /** Default number of automatic retries for a failed tool invocation. */
  TOOL_MAX_RETRIES: 2,
  /** Default base backoff delay between tool retries, in milliseconds. */
  TOOL_RETRY_BACKOFF_MS: 250,
  /** Default time-to-live for session-scoped memory records, in milliseconds (30 minutes). */
  SESSION_MEMORY_TTL_MS: 30 * 60 * 1000,
  /** Default time-to-live for conversation-scoped memory records, in milliseconds (7 days). */
  CONVERSATION_MEMORY_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  /** Default maximum number of memory records returned from a single query. */
  MEMORY_QUERY_LIMIT: 50,
});

/** Regex matching `{{variableName}}` placeholders inside prompt templates. */
export const PROMPT_VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;

/** Reserved metadata keys the engine writes automatically; agents/tools must not overwrite these. */
export const RESERVED_METADATA_KEYS = Object.freeze([
  "requestId",
  "agentId",
  "sessionId",
  "userId",
  "organizationId",
] as const);

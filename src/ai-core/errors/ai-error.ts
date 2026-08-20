import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Base class for every custom error thrown within the AI Core Engine.
 * Carries a stable machine-readable `code`, an HTTP-style `statusCode`
 * for API boundary translation, and arbitrary `details` for debugging —
 * mirroring the `AppError` convention used elsewhere in GrowPilot so API
 * routes can handle both with one error mapper.
 *
 * Subclasses ({@link AgentError}, {@link PromptError}, {@link ToolError},
 * {@link MemoryError}, {@link ValidationError}) should be used instead of
 * this class directly wherever a more specific error type applies.
 */
export class AIError extends Error {
  /** Stable, machine-readable error code (e.g. "AGENT_EXECUTION_FAILED"). */
  public readonly code: string;
  /** HTTP-equivalent status code for API boundary translation. */
  public readonly statusCode: number;
  /** Arbitrary structured details useful for debugging or client display. */
  public readonly details: Metadata;
  /** Whether the operation that raised this error is safe to retry. */
  public readonly retryable: boolean;

  /**
   * @param message - Human-readable error message.
   * @param code - Stable machine-readable error code.
   * @param statusCode - HTTP-equivalent status code. Defaults to 500.
   * @param details - Arbitrary structured debugging details. Defaults to `{}`.
   * @param retryable - Whether the failed operation may be safely retried. Defaults to `false`.
   */
  constructor(
    message: string,
    code: string,
    statusCode = 500,
    details: Metadata = {},
    retryable = false,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.retryable = retryable;
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Serializes this error into a plain object safe for logging or
   * returning across an API boundary — never leaks the raw stack trace
   * to clients.
   *
   * @returns A JSON-serializable representation of this error.
   */
  public toJSON(): Metadata {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      retryable: this.retryable,
    };
  }
}

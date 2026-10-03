import { AIError } from "@/ai-core/errors/ai-error";
import type { Metadata } from "@/ai-core/types/common.types";
import type { MemoryScope } from "@/ai-core/types/memory.types";

/**
 * Thrown when a memory read, write, or query operation fails — whether
 * due to an adapter connectivity issue, a serialization failure, or an
 * invalid scope/key combination.
 */
export class MemoryError extends AIError {
  /** The memory scope associated with this failure, if known. */
  public readonly scope?: MemoryScope;

  /**
   * @param message - Human-readable error message.
   * @param scope - The memory scope associated with this failure.
   * @param details - Arbitrary structured debugging details.
   * @param retryable - Whether retrying the operation may succeed. Defaults to `true`
   * (most memory failures are transient adapter/connectivity issues).
   */
  constructor(message: string, scope?: MemoryScope, details: Metadata = {}, retryable = true) {
    super(
  message,
  "MEMORY_ERROR",
  500,
  {
    ...(scope !== undefined ? { scope } : {}),
    ...details,
  },
  retryable,
);
    this.scope = scope;
  }

  /**
   * Creates a {@link MemoryError} for an adapter that is not configured
   * for the requested scope.
   *
   * @param scope - The memory scope that has no adapter bound.
   * @returns A new, non-retryable `MemoryError`.
   */
  public static adapterNotConfigured(scope: MemoryScope): MemoryError {
    const error = new MemoryError(`No memory adapter is configured for scope "${scope}"`, scope, {}, false);
    return Object.assign(error, { statusCode: 500 });
  }

  /**
   * Creates a {@link MemoryError} for a record that failed to
   * serialize/deserialize.
   *
   * @param scope - The memory scope being read or written.
   * @param key - The record key that failed to (de)serialize.
   * @param cause - The underlying error.
   * @returns A new, non-retryable `MemoryError`.
   */
  public static serializationFailed(scope: MemoryScope, key: string, cause: unknown): MemoryError {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    return new MemoryError(
      `Failed to (de)serialize memory record "${key}" in scope "${scope}": ${causeMessage}`,
      scope,
      { key, cause: causeMessage },
      false,
    );
  }
}

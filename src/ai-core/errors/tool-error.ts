import { AIError } from "@/ai-core/errors/ai-error";
import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Thrown when a tool cannot be located, fails permission checks, fails
 * input/output validation, exceeds its timeout, or exhausts its retry
 * budget during invocation via the {@link ToolRegistry}.
 */
export class ToolError extends AIError {
  /** The identifier of the tool that raised this error, if known. */
  public readonly toolId?: string;

  /**
   * @param message - Human-readable error message.
   * @param toolId - The tool identifier associated with this failure.
   * @param details - Arbitrary structured debugging details.
   * @param retryable - Whether re-invoking the tool may succeed. Defaults to `false`.
   */
  constructor(message: string, toolId?: string, details: Metadata = {}, retryable = false) {
    super(message, "TOOL_ERROR", 500, { toolId, ...details }, retryable);
    this.toolId = toolId;
  }

  /**
   * Creates a {@link ToolError} for the case where no tool is registered
   * under the requested identifier.
   *
   * @param toolId - The tool identifier that was requested.
   * @returns A new `ToolError` with a 404-equivalent status code.
   */
  public static notFound(toolId: string): ToolError {
    const error = new ToolError(`Tool "${toolId}" is not registered`, toolId);
    return Object.assign(error, { statusCode: 404 });
  }

  /**
   * Creates a {@link ToolError} for a caller lacking the permissions a
   * tool requires.
   *
   * @param toolId - The tool identifier being invoked.
   * @param requiredPermissions - The permission scopes the tool requires.
   * @returns A new `ToolError` with a 403-equivalent status code.
   */
  public static permissionDenied(toolId: string, requiredPermissions: readonly string[]): ToolError {
    const error = new ToolError(
      `Missing required permissions to invoke tool "${toolId}": ${requiredPermissions.join(", ")}`,
      toolId,
      { requiredPermissions },
    );
    return Object.assign(error, { statusCode: 403 });
  }

  /**
   * Creates a {@link ToolError} for an invocation that exceeded its
   * configured timeout.
   *
   * @param toolId - The tool identifier that timed out.
   * @param timeoutMs - The configured timeout, in milliseconds.
   * @returns A new, retryable `ToolError`.
   */
  public static timeout(toolId: string, timeoutMs: number): ToolError {
    return new ToolError(
      `Tool "${toolId}" exceeded its execution timeout of ${timeoutMs}ms`,
      toolId,
      { timeoutMs },
      true,
    );
  }

  /**
   * Creates a {@link ToolError} for an invocation that exhausted its
   * configured retry budget.
   *
   * @param toolId - The tool identifier that failed.
   * @param attempts - The number of attempts made before giving up.
   * @param cause - The underlying error from the final attempt.
   * @returns A new `ToolError` describing the exhausted retries.
   */
  public static retriesExhausted(toolId: string, attempts: number, cause: unknown): ToolError {
    const causeMessage = cause instanceof Error ? cause.message : String(cause);
    return new ToolError(
      `Tool "${toolId}" failed after ${attempts} attempt(s): ${causeMessage}`,
      toolId,
      { attempts, cause: causeMessage },
    );
  }
}

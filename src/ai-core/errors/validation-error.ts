import { AIError } from "@/ai-core/errors/ai-error";
import type { Metadata } from "@/ai-core/types/common.types";

/**
 * A single field-level validation issue, matching the shape produced by
 * Zod's `flatten()`/`issues` so validation errors from the AI Core
 * Engine compose cleanly with the rest of GrowPilot's Zod-based
 * validation.
 */
export interface ValidationIssue {
  readonly path: readonly (string | number)[];
  readonly message: string;
}

/**
 * Thrown when agent input/output, tool input/output, or prompt
 * variables fail schema validation. Always carries the specific
 * {@link ValidationIssue} list so callers (and API error handlers)
 * can surface field-level feedback rather than a single opaque message.
 */
export class ValidationError extends AIError {
  /** The individual field-level issues that caused validation to fail. */
  public readonly issues: readonly ValidationIssue[];

  /**
   * @param message - Human-readable summary error message.
   * @param issues - The individual field-level validation issues.
   * @param details - Additional arbitrary structured debugging details.
   */
  constructor(message: string, issues: readonly ValidationIssue[], details: Metadata = {}) {
    super(
      message,
      "VALIDATION_ERROR",
      422,
      {
        issues: issues.map((issue) => ({
          path: [...issue.path],
          message: issue.message,
        })),
        ...details,
      },
      false,
    );

    this.issues = issues;
  }

  /**
   * Creates a {@link ValidationError} from a single failing field,
   * convenient for hand-rolled checks that don't go through a full Zod
   * schema.
   *
   * @param path - The field path that failed validation.
   * @param message - Description of why the field failed validation.
   * @returns A new `ValidationError` with a single issue.
   */
  public static forField(path: string, message: string): ValidationError {
    return new ValidationError(`Validation failed: ${message}`, [{ path: [path], message }]);
  }
}

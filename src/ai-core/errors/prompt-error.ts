import { AIError } from "@/ai-core/errors/ai-error";
import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Thrown when a prompt template cannot be found, fails variable
 * interpolation, or fails validation (missing required variables,
 * malformed template syntax).
 */
export class PromptError extends AIError {
  /** The template key associated with this failure, if known. */
  public readonly templateKey?: string;

  /**
   * @param message - Human-readable error message.
   * @param templateKey - The prompt template key associated with this failure.
   * @param details - Arbitrary structured debugging details.
   */
  constructor(
    message: string,
    templateKey?: string,
    details: Metadata = {},
  ) {
    super(
      message,
      "PROMPT_ERROR",
      500,
      {
        ...(templateKey !== undefined ? { templateKey } : {}),
        ...details,
      },
      false,
    );

    this.templateKey = templateKey;
  }

  /**
   * Creates a {@link PromptError} for a template lookup miss.
   *
   * @param templateKey - The requested template key.
   * @param version - The requested version, if a specific one was requested.
   * @returns A new `PromptError` with a 404-equivalent status code.
   */
  public static notFound(
    templateKey: string,
    version?: number,
  ): PromptError {
    const suffix =
      version !== undefined ? ` (version ${version})` : "";

    const error = new PromptError(
      `Prompt template "${templateKey}"${suffix} was not found`,
      templateKey,
    );

    return Object.assign(error, { statusCode: 404 });
  }

  /**
   * Creates a {@link PromptError} for missing required template variables.
   *
   * @param templateKey - The prompt template key being rendered.
   * @param missingVariables - The list of required variable names that were not supplied.
   * @returns A new `PromptError` with a 422-equivalent status code.
   */
  public static missingVariables(
    templateKey: string,
    missingVariables: readonly string[],
  ): PromptError {
    const error = new PromptError(
      `Prompt template "${templateKey}" is missing required variables: ${missingVariables.join(", ")}`,
      templateKey,
      {
        missingVariables: [...missingVariables],
      },
    );

    return Object.assign(error, { statusCode: 422 });
  }
}

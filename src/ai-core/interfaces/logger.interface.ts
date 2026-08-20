import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Contract for a structured logger. The concrete {@link Logger} class
 * implements this interface; modules should depend on `ILogger` rather
 * than the concrete class so alternate implementations (e.g. a test
 * spy/mock logger) can be substituted via dependency injection.
 */
export interface ILogger {
  /**
   * Creates a new logger that merges `additionalContext` into every
   * entry it subsequently emits.
   *
   * @param additionalContext - Extra structured fields bound to the new child logger.
   * @returns A new `ILogger` carrying the merged context.
   */
  child(additionalContext: Metadata): ILogger;

  /**
   * Logs a debug-level entry.
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  debug(message: string, context?: Metadata): void;

  /**
   * Logs an info-level entry.
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  info(message: string, context?: Metadata): void;

  /**
   * Logs a warn-level entry.
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  warn(message: string, context?: Metadata): void;

  /**
   * Logs an error-level entry.
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  error(message: string, context?: Metadata): void;
}

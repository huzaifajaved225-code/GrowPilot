import type { ILogger } from "@/ai-core/interfaces/logger.interface";
import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Supported log severity levels, ordered from most to least verbose
 * suppression: `debug` logs everything, `error` logs only errors.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * A single structured log entry emitted by the {@link Logger}. Every
 * field is stable and machine-parseable so entries can be shipped to a
 * log aggregator (e.g. pino transport, Datadog, CloudWatch) without a
 * custom parser.
 */
export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly context: Metadata;
}

/**
 * A pluggable log sink — the destination structured entries are written
 * to. The default {@link ConsoleLogSink} writes JSON to stdout/stderr;
 * production deployments can supply an alternate sink (e.g. one that
 * forwards to Sentry or a log aggregator) without changing any calling
 * code.
 */
export interface ILogSink {
  /**
   * Writes a single structured log entry to this sink.
   *
   * @param entry - The structured log entry to persist/emit.
   */
  write(entry: LogEntry): void;
}

/**
 * Default {@link ILogSink} implementation — emits newline-delimited JSON
 * to the console, using `console.error`/`console.warn` for their
 * respective levels so platform log collectors correctly bucket
 * severity.
 */
export class ConsoleLogSink implements ILogSink {
  /** @inheritdoc */
  public write(entry: LogEntry): void {
    const serialized = JSON.stringify(entry);

    switch (entry.level) {
      case "error":
        console.error(serialized);
        return;
      case "warn":
        console.warn(serialized);
        return;
      default:
        console.log(serialized);
    }
  }
}

/**
 * Enterprise structured logger used throughout the AI Core Engine.
 * Supports level-based filtering, structured (not string-concatenated)
 * context, and `child()` binding so a request-scoped logger can be
 * created once per execution and passed down through the pipeline
 * carrying `requestId`/`agentId`/etc. automatically on every entry.
 */
export class Logger implements ILogger {
  private readonly minLevelWeight: number;

  /**
   * @param sink - The destination log entries are written to.
   * @param context - Structured context automatically merged into every entry emitted by this logger.
   * @param minLevel - The minimum severity level that will be emitted; lower-severity calls are dropped.
   */
  constructor(
    private readonly sink: ILogSink = new ConsoleLogSink(),
    private readonly context: Metadata = {},
    private readonly minLevel: LogLevel = "info",
  ) {
    this.minLevelWeight = LOG_LEVEL_WEIGHT[minLevel];
  }

  /**
   * Creates a new `Logger` that merges `additionalContext` into every
   * entry it emits, in addition to this logger's existing context.
   * Use this to bind request-scoped fields (`requestId`, `agentId`,
   * `sessionId`) once at the start of an execution.
   *
   * @param additionalContext - Extra structured fields to merge into every subsequent log entry.
   * @returns A new `Logger` instance; the parent logger is left unmodified.
   */
  public child(additionalContext: Metadata): Logger {
    return new Logger(this.sink, { ...this.context, ...additionalContext }, this.minLevel);
  }

  /**
   * Logs a debug-level entry. Use for verbose, developer-facing detail
   * that should be disabled in production (`minLevel` set to `info` or
   * higher).
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  public debug(message: string, context: Metadata = {}): void {
    this.emit("debug", message, context);
  }

  /**
   * Logs an info-level entry. Use for normal operational events
   * (execution started/completed, cache hit, etc.).
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  public info(message: string, context: Metadata = {}): void {
    this.emit("info", message, context);
  }

  /**
   * Logs a warn-level entry. Use for recoverable, unexpected conditions
   * (a retry occurred, a fallback path was taken).
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  public warn(message: string, context: Metadata = {}): void {
    this.emit("warn", message, context);
  }

  /**
   * Logs an error-level entry. Use for failures that aborted an
   * operation. Pass the caught error's message/stack via `context`
   * rather than string-concatenating it into `message`.
   *
   * @param message - Human-readable log message.
   * @param context - Additional structured fields for this entry only.
   */
  public error(message: string, context: Metadata = {}): void {
    this.emit("error", message, context);
  }

  private emit(level: LogLevel, message: string, context: Metadata): void {
    if (LOG_LEVEL_WEIGHT[level] < this.minLevelWeight) return;

    this.sink.write({
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context, ...context },
    });
  }
}

/**
 * Shared, module-level default logger instance. Modules within
 * `ai-core` that don't receive a logger via dependency injection may
 * fall back to this instance; anything executing within a specific
 * request should prefer the request-scoped logger created via
 * {@link Logger.child} in {@link ExecutionContext}.
 */
export const defaultLogger = new Logger();

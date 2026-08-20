import type { DeepPartial } from "@/ai-core/types/common.types";

/**
 * Races a promise against a timeout, rejecting with the supplied error
 * if the timeout elapses first. Used by the {@link ToolRegistry} and
 * {@link AIEngine} to enforce per-invocation execution time limits.
 *
 * @typeParam T - The resolved type of the wrapped promise.
 * @param promise - The operation to bound with a timeout.
 * @param timeoutMs - Maximum time, in milliseconds, to wait before rejecting.
 * @param onTimeout - Factory producing the error to reject with if the timeout elapses.
 * @returns A promise that resolves/rejects with `promise`'s outcome, or rejects with `onTimeout()` if the timeout elapses first.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutHandle = setTimeout(() => reject(onTimeout()), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

/**
 * Options controlling {@link withRetry} behavior.
 */
export interface RetryOptions {
  /** Maximum number of retry attempts after the initial attempt. */
  readonly maxRetries: number;
  /** Base delay, in milliseconds, used for exponential backoff between attempts. */
  readonly backoffMs: number;
  /** Predicate deciding whether a given error should trigger a retry. Defaults to always retrying. */
  readonly shouldRetry?: (error: unknown) => boolean;
}

/**
 * Executes `operation`, retrying with exponential backoff on failure up
 * to `maxRetries` additional attempts. Used by the {@link ToolRegistry}
 * to implement per-tool retry logic without duplicating backoff math in
 * every tool implementation.
 *
 * @typeParam T - The resolved type of the operation.
 * @param operation - A factory producing the promise to attempt; called once per attempt.
 * @param options - Retry configuration (max attempts, backoff, retry predicate).
 * @returns The resolved value of the first successful attempt.
 * @throws The error from the final attempt if all attempts fail.
 */
export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions): Promise<T> {
  const { maxRetries, backoffMs, shouldRetry = () => true } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt || !shouldRetry(error)) {
        throw error;
      }

      const delay = backoffMs * 2 ** attempt;
      await sleep(delay);
    }
  }

  // Unreachable — the loop above always either returns or throws — but
  // kept for exhaustive type-checking of the function's return path.
  throw lastError;
}

/**
 * Resolves after the given number of milliseconds. A thin wrapper
 * around `setTimeout` for use in `async`/`await` retry/backoff logic.
 *
 * @param ms - Number of milliseconds to wait.
 * @returns A promise that resolves once the delay has elapsed.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Recursively merges `override` onto `base`, returning a new object
 * without mutating either input. Used to merge caller-supplied
 * `DeepPartial<AgentConfig>` overrides onto an agent's default
 * configuration.
 *
 * @typeParam T - The shape of the object being merged.
 * @param base - The base object providing default values.
 * @param override - A partial object whose defined values take precedence over `base`.
 * @returns A new, fully-merged object of type `T`.
 */
export function deepMerge<T extends Record<string, unknown>>(base: T, override: DeepPartial<T>): T {
  const result: Record<string, unknown> = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    const overrideValue = override[key];
    const baseValue = base[key];

    if (overrideValue === undefined) continue;

    if (isPlainObject(overrideValue) && isPlainObject(baseValue)) {
      result[key as string] = deepMerge(
        baseValue as Record<string, unknown>,
        overrideValue as DeepPartial<Record<string, unknown>>,
      );
    } else {
      result[key as string] = overrideValue;
    }
  }

  return result as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Asserts that `condition` is truthy, narrowing the type accordingly.
 * Throws the supplied error if the condition does not hold — used
 * throughout the pipeline for defensive invariant checks that indicate
 * a programming error rather than an expected failure mode.
 *
 * @param condition - The condition to assert.
 * @param error - The error to throw if `condition` is falsy.
 */
export function assertInvariant(condition: unknown, error: Error): asserts condition {
  if (!condition) {
    throw error;
  }
}

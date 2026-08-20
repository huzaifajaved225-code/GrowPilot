/**
 * Returns the current time as Unix epoch milliseconds. Centralized so
 * the AI Core Engine has a single seam for mocking time in tests.
 *
 * @returns The current Unix epoch time, in milliseconds.
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Returns the current time as an ISO-8601 timestamp string, used for
 * structured log entries and audit metadata.
 *
 * @returns The current time formatted as an ISO-8601 string.
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Computes the absolute expiry timestamp for a record given a
 * time-to-live in milliseconds, relative to the current time.
 *
 * @param ttlMs - Time-to-live in milliseconds.
 * @returns The Unix epoch millisecond timestamp at which the record expires.
 */
export function computeExpiryMs(ttlMs: number): number {
  return nowMs() + ttlMs;
}

/**
 * Determines whether a previously computed expiry timestamp has passed.
 *
 * @param expiresAt - The Unix epoch millisecond expiry timestamp, or `undefined` for a record that never expires.
 * @returns `true` if `expiresAt` is defined and has already passed.
 */
export function isExpired(expiresAt: number | undefined): boolean {
  if (expiresAt === undefined) return false;
  return nowMs() >= expiresAt;
}

/**
 * Measures the elapsed duration, in milliseconds, since a starting
 * timestamp produced by {@link nowMs}.
 *
 * @param startedAtMs - The Unix epoch millisecond timestamp the operation started at.
 * @returns The elapsed duration in milliseconds.
 */
export function elapsedMs(startedAtMs: number): number {
  return nowMs() - startedAtMs;
}

/**
 * Formats a millisecond duration as a short human-readable string (e.g.
 * "850ms", "3.2s"), used in log messages and admin/debug UIs.
 *
 * @param durationMs - The duration to format, in milliseconds.
 * @returns A short human-readable duration string.
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

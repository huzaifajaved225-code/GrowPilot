import { MemoryError } from "@/ai-core/errors/memory-error";
import type { IMemoryAdapter } from "@/ai-core/interfaces/memory.interface";
import type {
  MemoryQueryOptions,
  MemoryRecord,
  MemoryWriteOptions,
  MemoryScope,
} from "@/ai-core/types/memory.types";
import { computeExpiryMs, isExpired, nowMs } from "@/ai-core/utils/date-utils";

/**
 * Internal key combining a {@link MemoryScope} and record key into a
 * single map key, since a single process-wide map backs every scope in
 * this adapter.
 */
function compositeKey(scope: MemoryQueryOptions["scope"], key: string): string {
  return `${scope}::${key}`;
}

/**
 * Fully-working, process-local implementation of {@link IMemoryAdapter}.
 * Used as the default backend for {@link MemoryManager} in development
 * and testing, and as the reference implementation new adapters (Redis,
 * database) should behave identically to from the caller's perspective.
 *
 * Not suitable for multi-instance production deployments (state is not
 * shared across processes) — swap in {@link RedisMemoryAdapter} or
 * {@link DatabaseMemoryAdapter} for those environments.
 */
export class InMemoryAdapter<TValue = unknown> implements IMemoryAdapter<TValue> {
  private readonly store = new Map<string, MemoryRecord<TValue>>();

  /** @inheritdoc */
  public async set(options: MemoryWriteOptions<TValue>): Promise<void> {
    const { scope, key, value, ttlMs, metadata = {} } = options;

    try {
      const record: MemoryRecord<TValue> = {
        key,
        scope,
        value,
        createdAt: nowMs(),
        expiresAt: ttlMs !== undefined ? computeExpiryMs(ttlMs) : undefined,
        metadata,
      };

      this.store.set(compositeKey(scope, key), record);
    } catch (cause) {
      throw MemoryError.serializationFailed(scope, key, cause);
    }
  }

  /** @inheritdoc */
  public async get(
    scope: MemoryQueryOptions["scope"],
    key: string,
  ): Promise<MemoryRecord<TValue> | null> {
    const record = this.store.get(compositeKey(scope, key));

    if (!record) return null;

    if (isExpired(record.expiresAt)) {
      this.store.delete(compositeKey(scope, key));
      return null;
    }

    return record;
  }

  /** @inheritdoc */
  public async query(options: MemoryQueryOptions): Promise<readonly MemoryRecord<TValue>[]> {
    const { scope, keyPrefix, limit } = options;

    const matches: MemoryRecord<TValue>[] = [];

    for (const [compositeMapKey, record] of this.store.entries()) {
      if (!compositeMapKey.startsWith(`${scope}::`)) continue;
      if (isExpired(record.expiresAt)) {
        this.store.delete(compositeMapKey);
        continue;
      }
      if (keyPrefix !== undefined && !record.key.startsWith(keyPrefix)) continue;

      matches.push(record);
    }

    matches.sort((a, b) => b.createdAt - a.createdAt);

    return limit !== undefined ? matches.slice(0, limit) : matches;
  }

  /** @inheritdoc */
  public async delete(scope: MemoryQueryOptions["scope"], key: string): Promise<void> {
    this.store.delete(compositeKey(scope, key));
  }

  /** @inheritdoc */
  public async clear(scope: MemoryQueryOptions["scope"], keyPrefix?: string): Promise<void> {
    for (const [compositeMapKey, record] of this.store.entries()) {
      if (!compositeMapKey.startsWith(`${scope}::`)) continue;
      if (keyPrefix !== undefined && !record.key.startsWith(keyPrefix)) continue;

      this.store.delete(compositeMapKey);
    }
  }

  /**
   * Returns the number of live (non-expired) records currently held,
   * optionally filtered to a single scope. Exposed for tests and
   * diagnostics only — not part of {@link IMemoryAdapter}.
   *
   * @param scope - If supplied, count only records within this scope.
   * @returns The number of live records matching the filter.
   */
  public size(scope?: MemoryScope): number {
    let count = 0;
    for (const [compositeMapKey, record] of this.store.entries()) {
      if (isExpired(record.expiresAt)) continue;
      if (scope !== undefined && !compositeMapKey.startsWith(`${scope}::`)) continue;
      count += 1;
    }
    return count;
  }
}

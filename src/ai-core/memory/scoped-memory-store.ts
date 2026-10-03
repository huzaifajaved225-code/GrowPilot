import type { IMemoryAdapter, IScopedMemoryStore } from "@/ai-core/interfaces/memory.interface";
import type { MemoryScope } from "@/ai-core/types/memory.types";

/**
 * Builds the namespaced key prefix for a scoped store — e.g. a session
 * store for `sess_abc123` writes keys as `sess_abc123:<key>` so multiple
 * sessions' records never collide within the same underlying adapter.
 *
 * @param namespace - The scope-specific identifier (session/conversation/user id).
 * @param key - The caller-supplied record key, relative to this namespace.
 * @returns The fully-namespaced key to store in the underlying adapter.
 */
function namespacedKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

/**
 * Generic, fully-working implementation of {@link IScopedMemoryStore},
 * used to build every concrete scoped store ({@link ISessionMemory},
 * {@link IConversationMemory}, {@link IUserMemory}) on top of a single
 * shared {@link IMemoryAdapter} — implementing the Adapter pattern so
 * the storage backend (in-memory, Redis, database) is fully decoupled
 * from the scoping/namespacing behavior implemented here.
 *
 * @typeParam TValue - The shape of values this store persists.
 */
export class ScopedMemoryStore<TValue = unknown> implements IScopedMemoryStore<TValue> {
  /**
   * @param adapter - The underlying persistence adapter this store delegates to.
   * @param scope - The logical {@link MemoryScope} this store operates within.
   * @param namespace - The scope-specific identifier (e.g. a session id) that isolates this store's records from others in the same scope.
   * @param defaultTtlMs - Optional default TTL applied to writes that don't specify their own.
   */
  constructor(
    private readonly adapter: IMemoryAdapter<TValue>,
    private readonly scope: MemoryScope,
    private readonly namespace: string,
    private readonly defaultTtlMs?: number,
  ) {}

  /** @inheritdoc */
  public async remember(key: string, value: TValue, ttlMs?: number): Promise<void> {
    await this.adapter.set({
      scope: this.scope,
      key: namespacedKey(this.namespace, key),
      value,
      ttlMs: ttlMs ?? this.defaultTtlMs,
    });
  }

  /** @inheritdoc */
  public async recall(key: string): Promise<TValue | null> {
    const record = await this.adapter.get(this.scope, namespacedKey(this.namespace, key));
    return record ? record.value : null;
  }

  /** @inheritdoc */
  public async recallAll(limit?: number): Promise<readonly TValue[]> {
    const records = await this.adapter.query({
      scope: this.scope,
      keyPrefix: `${this.namespace}:`,
      limit,
    });
    return records.map((record) => record.value);
  }

  /** @inheritdoc */
  public async forget(key: string): Promise<void> {
    await this.adapter.delete(this.scope, namespacedKey(this.namespace, key));
  }

  /** @inheritdoc */
  public async forgetAll(): Promise<void> {
    await this.adapter.clear(this.scope, `${this.namespace}:`);
  }
}

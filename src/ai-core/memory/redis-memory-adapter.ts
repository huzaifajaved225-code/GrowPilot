import { MemoryError } from "@/ai-core/errors/memory-error";
import type { IRedisMemoryAdapter } from "@/ai-core/interfaces/memory.interface";
import type {
  MemoryQueryOptions,
  MemoryRecord,
  MemoryWriteOptions,
} from "@/ai-core/types/memory.types";

/**
 * Constructor options for {@link RedisMemoryAdapter}. Deliberately kept
 * as a plain connection descriptor (not a live client instance) so this
 * file has zero dependency on any specific Redis client library — the
 * concrete client is injected by whichever call site actually wires up
 * `ioredis`/`node-redis` in a later phase.
 */
export interface RedisMemoryAdapterOptions {
  /** Redis connection string, e.g. `process.env.REDIS_URL`. */
  readonly connectionUrl: string;
  /** Optional key prefix namespacing this adapter's records within a shared Redis instance. */
  readonly keyPrefix?: string;
}

/**
 * Redis-backed implementation of {@link IMemoryAdapter}, intended for
 * `MemoryScope.SESSION` and `MemoryScope.CONVERSATION` data in
 * multi-instance production deployments where {@link InMemoryAdapter}'s
 * process-local state would not be shared across serverless invocations.
 *
 * This is an **interface-only seam** per the architecture spec: the
 * class is fully wired into the {@link IMemoryAdapter} contract and can
 * be registered with {@link MemoryManager} today, but every method
 * throws a clearly-labeled {@link MemoryError} until a real Redis client
 * (e.g. `ioredis`) is connected in `connect()`. This keeps the seam
 * type-safe and swappable without shipping a fake/mocked backend that
 * could silently be mistaken for real persistence.
 */
export class RedisMemoryAdapter implements IRedisMemoryAdapter {
  private connected = false;

  /**
   * @param options - Connection configuration for the underlying Redis client.
   */
  constructor(private readonly options: RedisMemoryAdapterOptions) {}

  /**
   * Establishes the underlying Redis connection. Must be called (and
   * awaited) before any read/write method is used.
   *
   * @throws {MemoryError} Always, until a concrete Redis client is wired up in a later phase.
   */
  public async connect(): Promise<void> {
    throw new MemoryError(
      `RedisMemoryAdapter has no concrete Redis client wired up yet. ` +
        `Connect a real client (e.g. ioredis) using "${this.options.connectionUrl}" to implement this adapter.`,
      undefined,
      { operation: "connect" },
      false,
    );
  }

  /** @inheritdoc */
  public isConnected(): boolean {
    return this.connected;
  }

  /** @inheritdoc */
  public async set(options: MemoryWriteOptions): Promise<void> {
    this.assertConnected(options.scope);
    throw this.notImplemented("set");
  }

  /** @inheritdoc */
  public async get(scope: MemoryQueryOptions["scope"], _key: string): Promise<MemoryRecord | null> {
    this.assertConnected(scope);
    throw this.notImplemented("get");
  }

  /** @inheritdoc */
  public async query(options: MemoryQueryOptions): Promise<readonly MemoryRecord[]> {
    this.assertConnected(options.scope);
    throw this.notImplemented("query");
  }

  /** @inheritdoc */
  public async delete(scope: MemoryQueryOptions["scope"], _key: string): Promise<void> {
    this.assertConnected(scope);
    throw this.notImplemented("delete");
  }

  /** @inheritdoc */
  public async clear(scope: MemoryQueryOptions["scope"], _keyPrefix?: string): Promise<void> {
    this.assertConnected(scope);
    throw this.notImplemented("clear");
  }

  private assertConnected(scope: MemoryQueryOptions["scope"]): void {
    if (!this.connected) {
      throw MemoryError.adapterNotConfigured(scope);
    }
  }

  private notImplemented(operation: string): MemoryError {
    return new MemoryError(
      `RedisMemoryAdapter.${operation}() has no concrete Redis client wired up yet. ` +
        `Connect a real client (e.g. ioredis) using "${this.options.connectionUrl}" to implement this adapter.`,
      undefined,
      { operation },
      false,
    );
  }
}

import { MemoryError } from "@/ai-core/errors/memory-error";
import type { IDatabaseMemoryAdapter } from "@/ai-core/interfaces/memory.interface";
import type {
  MemoryQueryOptions,
  MemoryRecord,
  MemoryWriteOptions,
} from "@/ai-core/types/memory.types";

/**
 * Constructor options for {@link DatabaseMemoryAdapter}. Kept as a plain
 * descriptor (not a live Prisma client) so `ai-core` has zero compile-time
 * dependency on `@/lib/db/prisma` — the concrete client is injected by
 * the call site that wires this adapter up in a later phase, keeping the
 * AI Core Engine independently testable and framework-agnostic.
 */
export interface DatabaseMemoryAdapterOptions {
  /** Logical table/collection name this adapter persists records under. */
  readonly tableName: string;
}

/**
 * Relational-database-backed implementation of {@link IMemoryAdapter},
 * intended for `MemoryScope.USER` — long-retention data (preferences,
 * brand voice settings) that should survive well beyond a single Redis
 * TTL window and be queryable alongside the rest of GrowPilot's
 * Postgres data.
 *
 * This is an **interface-only seam** per the architecture spec: fully
 * typed against {@link IMemoryAdapter}, registrable with
 * {@link MemoryManager} today, but every method throws a clearly-labeled
 * {@link MemoryError} until a concrete Prisma-backed model/table is
 * introduced in a later phase.
 */
export class DatabaseMemoryAdapter implements IDatabaseMemoryAdapter {
  private connected = false;

  /**
   * @param options - Table/collection configuration for the underlying persistence layer.
   */
  constructor(private readonly options: DatabaseMemoryAdapterOptions) {}

  /** @inheritdoc */
  public isConnected(): boolean {
    return this.connected;
  }

  /** @inheritdoc */
  public async set(options: MemoryWriteOptions): Promise<void> {
    throw this.notImplemented("set", options.scope);
  }

  /** @inheritdoc */
  public async get(scope: MemoryQueryOptions["scope"], _key: string): Promise<MemoryRecord | null> {
    throw this.notImplemented("get", scope);
  }

  /** @inheritdoc */
  public async query(options: MemoryQueryOptions): Promise<readonly MemoryRecord[]> {
    throw this.notImplemented("query", options.scope);
  }

  /** @inheritdoc */
  public async delete(scope: MemoryQueryOptions["scope"], _key: string): Promise<void> {
    throw this.notImplemented("delete", scope);
  }

  /** @inheritdoc */
  public async clear(scope: MemoryQueryOptions["scope"], _keyPrefix?: string): Promise<void> {
    throw this.notImplemented("clear", scope);
  }

  private notImplemented(operation: string, scope: MemoryQueryOptions["scope"]): MemoryError {
    return new MemoryError(
      `DatabaseMemoryAdapter.${operation}() has no concrete database table wired up yet. ` +
        `Introduce a Prisma model backing table "${this.options.tableName}" to implement this adapter.`,
      scope,
      { operation, tableName: this.options.tableName },
      false,
    );
  }
}

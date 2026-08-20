import type {
  MemoryQueryOptions,
  MemoryRecord,
  MemoryWriteOptions,
  VectorMemoryQuery,
  VectorMemoryResult,
} from "@/ai-core/types/memory.types";

/**
 * Low-level persistence contract a concrete memory backend must
 * satisfy. Scoped memory stores ({@link ISessionMemory},
 * {@link IConversationMemory}, {@link IUserMemory}) are built on top of
 * an `IMemoryAdapter` rather than talking to a backend directly, so the
 * backend (Redis, Postgres, in-memory) can be swapped without touching
 * calling code.
 *
 * @typeParam TValue - The default value shape this adapter persists; individual calls may specialize further.
 */
export interface IMemoryAdapter<TValue = unknown> {
  /**
   * Persists a single memory record.
   *
   * @param options - The scope, key, value, and optional TTL/metadata to write.
   */
  set(options: MemoryWriteOptions<TValue>): Promise<void>;

  /**
   * Reads a single memory record by exact key.
   *
   * @param scope - The memory scope to read from.
   * @param key - The exact record key.
   * @returns The stored record, or `null` if not found or expired.
   */
  get(scope: MemoryQueryOptions["scope"], key: string): Promise<MemoryRecord<TValue> | null>;

  /**
   * Queries multiple records within a scope, optionally filtered by key
   * prefix and bounded by a result limit.
   *
   * @param options - Scope, optional key prefix, and optional result limit.
   * @returns Matching records, most-recently-written first.
   */
  query(options: MemoryQueryOptions): Promise<readonly MemoryRecord<TValue>[]>;

  /**
   * Deletes a single memory record.
   *
   * @param scope - The memory scope to delete from.
   * @param key - The exact record key to remove.
   */
  delete(scope: MemoryQueryOptions["scope"], key: string): Promise<void>;

  /**
   * Deletes every record within a scope matching an optional key prefix.
   * Used to clear an entire session/conversation's memory at once.
   *
   * @param scope - The memory scope to clear.
   * @param keyPrefix - If supplied, only records whose key starts with this prefix are removed.
   */
  clear(scope: MemoryQueryOptions["scope"], keyPrefix?: string): Promise<void>;
}

/**
 * Adapter contract specifically for a Redis-backed memory store.
 * Extends {@link IMemoryAdapter} with nothing additional at the type
 * level today — the distinct interface exists so the
 * {@link MemoryManager} can be configured with a Redis adapter for
 * session-scoped data and a different adapter for longer-lived scopes,
 * while both satisfy the same base contract for interchangeability.
 *
 * Concrete Redis connection logic is intentionally NOT implemented
 * here — this is an interface-only seam per the architecture spec, to
 * be fulfilled by a real adapter once a Redis client is wired up.
 */
export interface IRedisMemoryAdapter extends IMemoryAdapter {
  /** Indicates the adapter is connected and ready to serve requests. */
  isConnected(): boolean;
}

/**
 * Adapter contract specifically for a relational-database-backed memory
 * store (e.g. Postgres via Prisma), used for durable, longer-retention
 * scopes such as {@link MemoryScope.USER}.
 *
 * Concrete database logic is intentionally NOT implemented here — this
 * is an interface-only seam per the architecture spec.
 */
export interface IDatabaseMemoryAdapter extends IMemoryAdapter {
  /** Indicates the adapter's underlying connection pool is healthy. */
  isConnected(): boolean;
}

/**
 * A single scoped memory store — a thin, ergonomic wrapper around an
 * {@link IMemoryAdapter} pre-bound to one {@link MemoryScope} and one
 * namespace (e.g. a specific session ID), so calling code doesn't need
 * to repeat the scope/namespace on every call.
 *
 * @typeParam TValue - The default value shape this store persists.
 */
export interface IScopedMemoryStore<TValue = unknown> {
  /**
   * Writes a value under `key` within this store's bound scope/namespace.
   *
   * @param key - The record key, relative to this store's namespace.
   * @param value - The value to persist.
   * @param ttlMs - Optional time-to-live in milliseconds.
   */
  remember(key: string, value: TValue, ttlMs?: number): Promise<void>;

  /**
   * Reads a value by key within this store's bound scope/namespace.
   *
   * @param key - The record key, relative to this store's namespace.
   * @returns The stored value, or `null` if not found or expired.
   */
  recall(key: string): Promise<TValue | null>;

  /**
   * Lists all values within this store's bound scope/namespace.
   *
   * @param limit - Maximum number of records to return, most-recent-first.
   * @returns The stored values.
   */
  recallAll(limit?: number): Promise<readonly TValue[]>;

  /**
   * Removes a single value by key within this store's namespace.
   *
   * @param key - The record key to forget.
   */
  forget(key: string): Promise<void>;

  /**
   * Removes every value within this store's bound scope/namespace.
   */
  forgetAll(): Promise<void>;
}

/**
 * Marker interface for session-scoped memory — short-lived state tied
 * to a single active session (e.g. in-flight form state, the last few
 * turns of context).
 */
export type ISessionMemory<TValue = unknown> = IScopedMemoryStore<TValue>;

/**
 * Marker interface for conversation-scoped memory — state that persists
 * for the life of a conversation thread (e.g. full chat history).
 */
export type IConversationMemory<TValue = unknown> = IScopedMemoryStore<TValue>;

/**
 * Marker interface for user-scoped memory — state that persists across
 * all of a user's sessions and conversations (e.g. long-term
 * preferences, brand voice settings).
 */
export type IUserMemory<TValue = unknown> = IScopedMemoryStore<TValue>;

/**
 * Contract for semantic/embedding-based memory recall. Interface-only
 * per the architecture spec — a concrete implementation (e.g. pgvector,
 * Pinecone, Qdrant) is deferred to a later phase.
 *
 * @typeParam TValue - The shape of the payload associated with each stored vector.
 */
export interface IVectorMemoryAdapter<TValue = unknown> {
  /**
   * Stores a value alongside its embedding vector for later semantic
   * recall.
   *
   * @param key - A unique key for this vector record.
   * @param embedding - The embedding vector representing `value`.
   * @param value - The payload to associate with this vector.
   * @param metadata - Optional metadata usable as a query-time filter.
   */
  upsert(key: string, embedding: readonly number[], value: TValue, metadata?: Record<string, unknown>): Promise<void>;

  /**
   * Finds the nearest-neighbor vectors to a query embedding.
   *
   * @param query - The query embedding, result count, optional filter, and minimum score.
   * @returns Matching records ordered by descending similarity score.
   */
  query(query: VectorMemoryQuery): Promise<readonly VectorMemoryResult<TValue>[]>;

  /**
   * Removes a single vector record by key.
   *
   * @param key - The record key to remove.
   */
  delete(key: string): Promise<void>;
}

/**
 * Top-level façade the rest of the AI Core Engine depends on for all
 * memory access — composes the individual scoped stores and the vector
 * adapter behind a single entry point, per the Facade pattern, so the
 * {@link ExecutionPipeline} only needs one dependency to load/store
 * memory across every scope.
 */
export interface IMemoryManager {
  /**
   * Returns a session-scoped store namespaced to a specific session.
   *
   * @param sessionId - The session identifier to scope this store to.
   * @returns A memory store bound to that session.
   */
  session<TValue = unknown>(sessionId: string): ISessionMemory<TValue>;

  /**
   * Returns a conversation-scoped store namespaced to a specific
   * conversation.
   *
   * @param conversationId - The conversation identifier to scope this store to.
   * @returns A memory store bound to that conversation.
   */
  conversation<TValue = unknown>(conversationId: string): IConversationMemory<TValue>;

  /**
   * Returns a user-scoped store namespaced to a specific user.
   *
   * @param userId - The user identifier to scope this store to.
   * @returns A memory store bound to that user.
   */
  user<TValue = unknown>(userId: string): IUserMemory<TValue>;

  /**
   * Returns the vector memory adapter for semantic recall, if one has
   * been configured.
   *
   * @returns The configured vector memory adapter, or `null` if none is configured.
   */
  vector<TValue = unknown>(): IVectorMemoryAdapter<TValue> | null;
}

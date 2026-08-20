import type { Metadata } from "@/ai-core/types/common.types";

/**
 * The logical scope a memory record belongs to. Each scope typically
 * maps to a different retention policy and backing store:
 *
 * - `SESSION` — cleared when the user's session ends (Redis, short TTL).
 * - `CONVERSATION` — persists for the life of a conversation thread.
 * - `USER` — persists across all of a user's sessions/conversations.
 * - `VECTOR` — semantic/embedding-based recall, not chronological.
 */
export enum MemoryScope {
  SESSION = "SESSION",
  CONVERSATION = "CONVERSATION",
  USER = "USER",
  VECTOR = "VECTOR",
}

/**
 * A single stored memory record.
 *
 * @typeParam TValue - The shape of the stored value.
 */
export interface MemoryRecord<TValue = unknown> {
  /** Namespaced key uniquely identifying this record within its scope. */
  readonly key: string;
  /** The scope this record was written under. */
  readonly scope: MemoryScope;
  /** The stored value itself. */
  readonly value: TValue;
  /** Unix epoch milliseconds when this record was written. */
  readonly createdAt: number;
  /** Unix epoch milliseconds after which this record is considered expired, if any. */
  readonly expiresAt?: number;
  /** Additional metadata (source agent, importance score, etc.). */
  readonly metadata: Metadata;
}

/**
 * Parameters for writing a memory record.
 *
 * @typeParam TValue - The shape of the value being stored.
 */
export interface MemoryWriteOptions<TValue = unknown> {
  readonly scope: MemoryScope;
  readonly key: string;
  readonly value: TValue;
  /** Time-to-live in milliseconds; omit for records that never expire on their own. */
  readonly ttlMs?: number;
  readonly metadata?: Metadata;
}

/**
 * Parameters for querying memory records within a scope.
 */
export interface MemoryQueryOptions {
  readonly scope: MemoryScope;
  /** Key prefix to filter by (e.g. all keys under "conversation:123:"). */
  readonly keyPrefix?: string;
  /** Maximum number of records to return, most-recent-first. */
  readonly limit?: number;
}

/**
 * A query against {@link IVectorMemoryAdapter} for semantic recall.
 */
export interface VectorMemoryQuery {
  /** The embedding vector to search against. */
  readonly embedding: readonly number[];
  /** Maximum number of nearest-neighbor results to return. */
  readonly topK: number;
  /** Optional metadata filter applied before similarity ranking. */
  readonly filter?: Metadata;
  /** Minimum cosine-similarity score (0-1) for a result to be included. */
  readonly minScore?: number;
}

/**
 * A single semantic search result from {@link IVectorMemoryAdapter}.
 *
 * @typeParam TValue - The shape of the stored payload associated with the vector.
 */
export interface VectorMemoryResult<TValue = unknown> {
  readonly key: string;
  readonly value: TValue;
  /** Cosine similarity score between the query embedding and this record, 0-1. */
  readonly score: number;
  readonly metadata: Metadata;
}

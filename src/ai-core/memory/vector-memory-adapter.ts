import type { IVectorMemoryAdapter } from "@/ai-core/interfaces/memory.interface";
import type { VectorMemoryQuery, VectorMemoryResult } from "@/ai-core/types/memory.types";
import type { Metadata } from "@/ai-core/types/common.types";

interface VectorEntry<TValue> {
  readonly embedding: readonly number[];
  readonly value: TValue;
  readonly metadata: Metadata;
}

/**
 * Computes cosine similarity between two equal-length embedding
 * vectors, returning a score in `[-1, 1]` (in practice `[0, 1]` for
 * typical normalized text embeddings).
 *
 * @param a - The first embedding vector.
 * @param b - The second embedding vector.
 * @returns The cosine similarity between `a` and `b`.
 */
function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const aValue = a[i] ?? 0;
    const bValue = b[i] ?? 0;
    dotProduct += aValue * bValue;
    magnitudeA += aValue * aValue;
    magnitudeB += bValue * bValue;
  }

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

/**
 * Applies a metadata equality filter to a candidate record — every
 * key/value pair in `filter` must match exactly for the candidate to
 * pass.
 *
 * @param metadata - The candidate record's metadata.
 * @param filter - The filter supplied on the query.
 * @returns `true` if every filter key matches the candidate's metadata.
 */
function matchesFilter(metadata: Metadata, filter?: Metadata): boolean {
  if (!filter) return true;
  return Object.entries(filter).every(([key, value]) => metadata[key] === value);
}

/**
 * Fully-working, process-local implementation of
 * {@link IVectorMemoryAdapter}, using brute-force cosine similarity over
 * an in-memory map. Suitable for development and low-volume production
 * use; swap in a dedicated vector database (pgvector, Pinecone, Qdrant)
 * behind the same interface once semantic recall needs to scale beyond
 * a single process's memory.
 *
 * @typeParam TValue - The shape of the payload associated with each stored vector.
 */
export class InMemoryVectorAdapter<TValue = unknown> implements IVectorMemoryAdapter<TValue> {
  private readonly store = new Map<string, VectorEntry<TValue>>();

  /** @inheritdoc */
  public async upsert(
    key: string,
    embedding: readonly number[],
    value: TValue,
    metadata: Metadata = {},
  ): Promise<void> {
    this.store.set(key, { embedding, value, metadata });
  }

  /** @inheritdoc */
  public async query(query: VectorMemoryQuery): Promise<readonly VectorMemoryResult<TValue>[]> {
    const { embedding, topK, filter, minScore = 0 } = query;

    const scored: VectorMemoryResult<TValue>[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (!matchesFilter(entry.metadata, filter)) continue;

      const score = cosineSimilarity(embedding, entry.embedding);
      if (score < minScore) continue;

      scored.push({ key, value: entry.value, score, metadata: entry.metadata });
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }

  /** @inheritdoc */
  public async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Returns the number of vectors currently stored. Exposed for tests
   * and diagnostics only — not part of {@link IVectorMemoryAdapter}.
   *
   * @returns The number of stored vector records.
   */
  public size(): number {
    return this.store.size;
  }
}

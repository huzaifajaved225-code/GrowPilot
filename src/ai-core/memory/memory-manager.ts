import type {
  IConversationMemory,
  IMemoryAdapter,
  IMemoryManager,
  ISessionMemory,
  IUserMemory,
  IVectorMemoryAdapter,
} from "@/ai-core/interfaces/memory.interface";
import { InMemoryAdapter } from "@/ai-core/memory/in-memory-adapter";
import { ScopedMemoryStore } from "@/ai-core/memory/scoped-memory-store";
import { MemoryScope } from "@/ai-core/types/memory.types";
import { AI_CORE_DEFAULTS } from "@/ai-core/utils/constants";

/**
 * Constructor options for {@link MemoryManager}, allowing each logical
 * scope to be backed by a different {@link IMemoryAdapter} — e.g. Redis
 * for `SESSION`/`CONVERSATION` and a database adapter for `USER` — while
 * defaulting every scope to {@link InMemoryAdapter} for development and
 * testing when no adapter is supplied. This follows the Strategy pattern:
 * `MemoryManager` is indifferent to which concrete adapter strategy
 * backs each scope.
 */
export interface MemoryManagerOptions {
  /** Adapter backing `MemoryScope.SESSION` reads/writes. Defaults to a fresh {@link InMemoryAdapter}. */
  readonly sessionAdapter?: IMemoryAdapter;
  /** Adapter backing `MemoryScope.CONVERSATION` reads/writes. Defaults to a fresh {@link InMemoryAdapter}. */
  readonly conversationAdapter?: IMemoryAdapter;
  /** Adapter backing `MemoryScope.USER` reads/writes. Defaults to a fresh {@link InMemoryAdapter}. */
  readonly userAdapter?: IMemoryAdapter;
  /** Adapter powering semantic recall. When omitted, {@link MemoryManager.vector} returns `null`. */
  readonly vectorAdapter?: IVectorMemoryAdapter | null;
  /** Default TTL (ms) applied to session-scoped writes that don't specify their own. */
  readonly sessionTtlMs?: number;
  /** Default TTL (ms) applied to conversation-scoped writes that don't specify their own. */
  readonly conversationTtlMs?: number;
  /** Default result limit applied to `recallAll()` queries that don't specify their own. */
  readonly queryLimit?: number;
}

/**
 * Top-level façade implementation of {@link IMemoryManager} — the single
 * dependency the rest of the AI Core Engine (agents, tools, pipeline
 * stages) needs to load and persist state across every memory scope.
 * Implements the Facade pattern over the individual scoped stores and
 * the vector adapter, and caches one {@link ScopedMemoryStore} per
 * namespace so repeated calls for the same session/conversation/user
 * within a single request reuse the same store instance.
 */
export class MemoryManager implements IMemoryManager {
  private readonly sessionAdapter: IMemoryAdapter;
  private readonly conversationAdapter: IMemoryAdapter;
  private readonly userAdapter: IMemoryAdapter;
  private readonly vectorAdapterInstance: IVectorMemoryAdapter | null;

  private readonly sessionTtlMs: number;
  private readonly conversationTtlMs: number;

  private readonly sessionStores = new Map<string, ISessionMemory>();
  private readonly conversationStores = new Map<string, IConversationMemory>();
  private readonly userStores = new Map<string, IUserMemory>();

  /**
   * @param options - Per-scope adapter overrides and default TTL/query-limit configuration.
   */
  constructor(options: MemoryManagerOptions = {}) {
    this.sessionAdapter = options.sessionAdapter ?? new InMemoryAdapter();
    this.conversationAdapter = options.conversationAdapter ?? new InMemoryAdapter();
    this.userAdapter = options.userAdapter ?? new InMemoryAdapter();
    this.vectorAdapterInstance = options.vectorAdapter ?? null;

    this.sessionTtlMs = options.sessionTtlMs ?? AI_CORE_DEFAULTS.SESSION_MEMORY_TTL_MS;
    this.conversationTtlMs =
      options.conversationTtlMs ?? AI_CORE_DEFAULTS.CONVERSATION_MEMORY_TTL_MS;
  }

  /** @inheritdoc */
  public session<TValue = unknown>(sessionId: string): ISessionMemory<TValue> {
    return this.getOrCreate(
      this.sessionStores,
      sessionId,
      () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic-store cache keyed by string id across differing TValue instantiations
        new ScopedMemoryStore<any>(
          this.sessionAdapter,
          MemoryScope.SESSION,
          sessionId,
          this.sessionTtlMs,
        ),
    ) as ISessionMemory<TValue>;
  }

  /** @inheritdoc */
  public conversation<TValue = unknown>(conversationId: string): IConversationMemory<TValue> {
    return this.getOrCreate(
      this.conversationStores,
      conversationId,
      () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic-store cache keyed by string id across differing TValue instantiations
        new ScopedMemoryStore<any>(
          this.conversationAdapter,
          MemoryScope.CONVERSATION,
          conversationId,
          this.conversationTtlMs,
        ),
    ) as IConversationMemory<TValue>;
  }

  /** @inheritdoc */
  public user<TValue = unknown>(userId: string): IUserMemory<TValue> {
    return this.getOrCreate(
      this.userStores,
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic-store cache keyed by string id across differing TValue instantiations
      () => new ScopedMemoryStore<any>(this.userAdapter, MemoryScope.USER, userId, undefined),
    ) as IUserMemory<TValue>;
  }

  /** @inheritdoc */
  public vector<TValue = unknown>(): IVectorMemoryAdapter<TValue> | null {
    return this.vectorAdapterInstance as IVectorMemoryAdapter<TValue> | null;
  }

  private getOrCreate<TStore>(
    cache: Map<string, TStore>,
    namespace: string,
    factory: () => TStore,
  ): TStore {
    const existing = cache.get(namespace);
    if (existing) return existing;

    const created = factory();
    cache.set(namespace, created);
    return created;
  }
}

import type { IAIProvider } from "@/lib/ai/provider.interface";
import type { AIProviderRequest, AIProviderResponse, ProviderId } from "@/lib/ai/provider.types";
import { KNOWN_PROVIDERS } from "@/lib/ai/provider.types";
import { ProviderError } from "@/lib/ai/provider-error";
import { AI_PROVIDER_CONFIG, type AIProviderConfig } from "@/lib/ai/provider-config";
import { GeminiAdapter } from "@/lib/ai/gemini-adapter";
import { withRetry, withTimeout } from "@/ai-core/utils/helpers";
import { defaultLogger } from "@/ai-core/utils/logger";
import type { ILogger } from "@/ai-core/interfaces/logger.interface";

/**
 * Options for constructing a {@link ProviderManager}. All fields are
 * optional — defaults come from {@link AI_PROVIDER_CONFIG}.
 */
export interface ProviderManagerOptions {
  readonly config?: AIProviderConfig;
  readonly logger?: ILogger;
  /** Override the adapter registry for testing. */
  readonly providers?: ReadonlyMap<ProviderId, IAIProvider>;
}

/**
 * The AI Gateway — the single entry point agents and API routes use to
 * call any AI provider. Handles:
 *
 * - **Provider resolution** by id, falling back to the configured
 *   default when no override is supplied.
 * - **Timeout** — every provider call is bounded by
 *   `config.requestTimeoutMs` via the existing `withTimeout` helper.
 * - **Retry** — transient failures (rate limits, 5xx, network errors)
 *   are retried with exponential backoff via `withRetry`.
 * - **Fallback** — when the primary provider is exhausted, the manager
 *   walks the `fallbackProviders` chain automatically.
 * - **Cancellation** — honours `AbortSignal` on the request.
 * - **Structured errors** — every failure is a {@link ProviderError},
 *   never a raw `fetch` or vendor error.
 */
export class ProviderManager {
  private static instance: ProviderManager | undefined;

  private readonly config: AIProviderConfig;
  private readonly logger: ILogger;
  private readonly providers: ReadonlyMap<ProviderId, IAIProvider>;

  constructor(options: ProviderManagerOptions = {}) {
    this.config = options.config ?? AI_PROVIDER_CONFIG;
    this.logger = (options.logger ?? defaultLogger).child({ component: "ProviderManager" });

    if (options.providers) {
      this.providers = options.providers;
    } else {
      this.providers = ProviderManager.buildDefaultProviders(this.config);
    }
  }

  /**
   * Returns the process-wide singleton instance, constructing it on
   * first access with the default configuration.
   */
  public static getInstance(options?: ProviderManagerOptions): ProviderManager {
    if (!ProviderManager.instance) {
      ProviderManager.instance = new ProviderManager(options);
    }
    return ProviderManager.instance;
  }

  /** Resets the singleton — for test teardown only. */
  public static resetInstance(): void {
    ProviderManager.instance = undefined;
  }

  /**
   * Generates text using the specified (or default) provider, with
   * automatic timeout, retry, and fallback.
   *
   * @param request - The model, messages, and generation parameters.
   * @param providerOverride - Optional provider id to use instead of the default.
   * @returns The normalized provider response.
   * @throws {ProviderError} If all providers in the chain are exhausted.
   */
  public async generateText(
    request: AIProviderRequest,
    providerOverride?: ProviderId,
  ): Promise<AIProviderResponse> {
    const chain = this.buildProviderChain(providerOverride);
    const attempted: ProviderId[] = [];
    let lastErrorMessage = "";

    for (const providerId of chain) {
      const provider = this.providers.get(providerId);

      if (!provider) {
        this.logger.warn("Provider not registered, skipping", { providerId });
        continue;
      }

      if (!provider.isAvailable()) {
        this.logger.warn("Provider not configured, skipping", { providerId });
        continue;
      }

      attempted.push(providerId);

      try {
        const response = await this.callWithReliability(provider, request);
        return response;
      } catch (error) {
        lastErrorMessage = error instanceof Error ? error.message : String(error);
        const isRetryable = error instanceof ProviderError && error.retryable;

        this.logger.warn("Provider failed, trying next fallback", {
          providerId,
          errorMessage: lastErrorMessage,
          isRetryable,
        });
      }
    }

    throw ProviderError.allProvidersFailed(
      attempted.length > 0 ? attempted : chain,
      lastErrorMessage || "No providers available",
    );
  }

  /**
   * Wraps a single provider call with timeout and retry using the
   * existing AI Core helpers.
   */
  private async callWithReliability(
    provider: IAIProvider,
    request: AIProviderRequest,
  ): Promise<AIProviderResponse> {
    const providerLogger = this.logger.child({ providerId: provider.id });

    return withRetry(
      () =>
        withTimeout(provider.generateText(request), this.config.requestTimeoutMs, () =>
          ProviderError.unavailable(provider.id),
        ),
      {
        maxRetries: this.config.maxRetriesPerProvider,
        backoffMs: this.config.retryBackoffMs,
        shouldRetry: (error) => {
          if (error instanceof ProviderError && error.retryable) {
            providerLogger.warn("Retrying provider call", {
              providerId: provider.id,
              errorCode: error.code,
            });
            return true;
          }
          return false;
        },
      },
    );
  }

  /**
   * Builds the ordered provider chain: primary first, then fallbacks.
   * Deduplicates entries so a provider is never tried twice.
   */
  private buildProviderChain(providerOverride?: ProviderId): ProviderId[] {
    const primary = providerOverride ?? this.config.defaultProvider;
    const chain: ProviderId[] = [primary];

    for (const fb of this.config.fallbackProviders) {
      if (!chain.includes(fb)) {
        chain.push(fb);
      }
    }

    return chain;
  }

  /**
   * Constructs the default provider adapter map from the configuration's
   * API keys. Adapters whose keys are `undefined` are still registered
   * but `isAvailable()` returns `false`, so they are transparently
   * skipped during fallback.
   */
  private static buildDefaultProviders(
    config: AIProviderConfig,
  ): ReadonlyMap<ProviderId, IAIProvider> {
    const map = new Map<ProviderId, IAIProvider>();
    map.set(KNOWN_PROVIDERS.GEMINI, new GeminiAdapter(config.apiKeys[KNOWN_PROVIDERS.GEMINI]));
    return map;
  }
}

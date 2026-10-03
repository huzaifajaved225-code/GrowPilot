import { AIError } from "@/ai-core/errors/ai-error";
import type { Metadata } from "@/ai-core/types/common.types";
import type { ProviderId } from "@/lib/ai/provider.types";

/**
 * Thrown when an AI provider call fails — covers authentication errors,
 * rate limits, network timeouts, and unexpected server errors. Carries
 * the originating {@link ProviderId} so the {@link ProviderManager} can
 * decide whether to retry on the same provider or fail over to a
 * fallback.
 */
export class ProviderError extends AIError {
  /** The provider that raised this error. */
  public readonly providerId: ProviderId;
  /** The HTTP status code returned by the provider, if available. */
  public readonly httpStatus?: number;

  constructor(
    message: string,
    providerId: ProviderId,
    options: {
      readonly code?: string;
      readonly statusCode?: number;
      readonly httpStatus?: number;
      readonly details?: Metadata;
      readonly retryable?: boolean;
    } = {},
  ) {
    super(
      message,
      options.code ?? "PROVIDER_ERROR",
      options.statusCode ?? 502,
      { providerId, ...options.details },
      options.retryable ?? false,
    );
    this.providerId = providerId;
    this.httpStatus = options.httpStatus;
  }

  /** Provider returned a 429 — caller should back off and retry. */
  public static rateLimited(providerId: ProviderId, retryAfterMs?: number): ProviderError {
    return new ProviderError(
      `Provider "${providerId}" rate-limited the request`,
      providerId,
      {
        code: "PROVIDER_RATE_LIMITED",
        httpStatus: 429,
        retryable: true,
        details: retryAfterMs !== undefined ? { retryAfterMs } : {},
      },
    );
  }

  /** Provider rejected the API key or credentials. */
  public static unauthorized(providerId: ProviderId): ProviderError {
    return new ProviderError(
      `Provider "${providerId}" rejected the API credentials`,
      providerId,
      { code: "PROVIDER_UNAUTHORIZED", httpStatus: 401, statusCode: 401 },
    );
  }

  /** Provider is unreachable or returned a 5xx error. */
  public static unavailable(providerId: ProviderId, httpStatus?: number): ProviderError {
    return new ProviderError(
      `Provider "${providerId}" is unavailable`,
      providerId,
      {
        code: "PROVIDER_UNAVAILABLE",
        httpStatus,
        statusCode: 503,
        retryable: true,
      },
    );
  }

  /** Provider response could not be parsed into the expected shape. */
  public static malformedResponse(providerId: ProviderId, reason: string): ProviderError {
    return new ProviderError(
      `Provider "${providerId}" returned a malformed response: ${reason}`,
      providerId,
      { code: "PROVIDER_MALFORMED_RESPONSE" },
    );
  }

  /** Provider is not configured or its API key is missing. */
  public static notConfigured(providerId: ProviderId): ProviderError {
    return new ProviderError(
      `Provider "${providerId}" is not configured — check environment variables`,
      providerId,
      { code: "PROVIDER_NOT_CONFIGURED", statusCode: 500 },
    );
  }

  /** All providers in the fallback chain have been exhausted. */
  public static allProvidersFailed(providerIds: readonly ProviderId[], lastError: string): ProviderError {
    return new ProviderError(
      `All AI providers failed: ${lastError}`,
      providerIds[0] ?? ("unknown" as ProviderId),
      {
        code: "ALL_PROVIDERS_FAILED",
        statusCode: 503,
        details: { attemptedProviders: [...providerIds] },
      },
    );
  }
}
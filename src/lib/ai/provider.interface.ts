import type { AIProviderRequest, AIProviderResponse, ProviderId } from "@/lib/ai/provider.types";

/**
 * The contract every AI provider adapter must satisfy. Implemented by
 * {@link GeminiAdapter} (and future OpenAI/Anthropic adapters); the
 * {@link ProviderManager} depends on this interface so agents never
 * import a vendor SDK directly.
 *
 * Every method must throw a {@link ProviderError} on failure rather
 * than returning a vendor-specific error object — this keeps the error
 * surface uniform across the entire abstraction.
 */
export interface IAIProvider {
  /** Stable, unique identifier for this provider (e.g. "gemini"). */
  readonly id: ProviderId;

  /** Human-readable display name for logging and admin UIs. */
  readonly name: string;

  /**
   * Whether this adapter is currently usable — typically checks that
   * its API key is configured. The {@link ProviderManager} calls this
   * before attempting a request so it can skip unconfigured providers
   * in a fallback chain without raising a noisy error.
   */
  isAvailable(): boolean;

  /**
   * Sends a chat-completion / text-generation request to the provider
   * and returns the normalized response. Must honour
   * {@link AIProviderRequest.signal} when supplied so the caller can
   * cancel an in-flight request.
   *
   * @param request - The model, messages, and generation parameters.
   * @returns The generated text, usage metadata, and provider response.
   * @throws {ProviderError} On authentication, rate-limit, network, or parse failure.
   */
  generateText(request: AIProviderRequest): Promise<AIProviderResponse>;
}
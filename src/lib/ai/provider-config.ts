import { z } from "zod";
import { KNOWN_PROVIDERS, providerId, type ProviderId } from "@/lib/ai/provider.types";

/**
 * Zod-validated AI provider configuration. Sourced from environment
 * variables via {@link env} so no API key or setting is ever hard-coded
 * in application source.
 */
export interface AIProviderConfig {
  /** The default provider to use when no override is supplied. */
  readonly defaultProvider: ProviderId;
  /** Ordered list of fallback providers tried when the primary fails. */
  readonly fallbackProviders: readonly ProviderId[];
  /** Per-request timeout (ms) applied to every provider call. */
  readonly requestTimeoutMs: number;
  /** Maximum retries per provider attempt before trying the next fallback. */
  readonly maxRetriesPerProvider: number;
  /** Base exponential backoff delay (ms) between retries. */
  readonly retryBackoffMs: number;
  /** API keys keyed by provider id — never log these values. */
  readonly apiKeys: Readonly<Record<string, string | undefined>>;
}

const providerConfigSchema = z.object({
  defaultProvider: z.string().default("gemini"),
  fallbackProviders: z
    .string()
    .default("")
    .transform((val) =>
      val
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  requestTimeoutMs: z.coerce.number().int().min(1000).default(30_000),
  maxRetriesPerProvider: z.coerce.number().int().min(0).max(5).default(1),
  retryBackoffMs: z.coerce.number().int().min(0).default(500),
});

/**
 * Resolves and validates the AI provider configuration from environment
 * variables. Called once at module load time — import
 * {@link AI_PROVIDER_CONFIG} rather than calling this directly.
 */
function resolveProviderConfig(): AIProviderConfig {
  const parsed = providerConfigSchema.safeParse({
    defaultProvider: process.env.AI_DEFAULT_PROVIDER,
    fallbackProviders: process.env.AI_FALLBACK_PROVIDERS,
    requestTimeoutMs: process.env.AI_PROVIDER_TIMEOUT_MS,
    maxRetriesPerProvider: process.env.AI_PROVIDER_MAX_RETRIES,
    retryBackoffMs: process.env.AI_PROVIDER_RETRY_BACKOFF_MS,
  });

  if (!parsed.success) {
    console.error(
      "Invalid AI provider configuration:",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    );
    throw new Error("Invalid AI provider configuration");
  }

  return Object.freeze({
    defaultProvider: providerId(parsed.data.defaultProvider),
    fallbackProviders: parsed.data.fallbackProviders.map(providerId),
    requestTimeoutMs: parsed.data.requestTimeoutMs,
    maxRetriesPerProvider: parsed.data.maxRetriesPerProvider,
    retryBackoffMs: parsed.data.retryBackoffMs,
    apiKeys: Object.freeze({
      [KNOWN_PROVIDERS.GEMINI]: process.env.GEMINI_API_KEY,
      [KNOWN_PROVIDERS.OPENAI]: process.env.OPENAI_API_KEY,
      [KNOWN_PROVIDERS.ANTHROPIC]: process.env.ANTHROPIC_API_KEY,
    }),
  });
}

/**
 * The process-wide, validated AI provider configuration. Import this
 * constant rather than reading `process.env` directly.
 */
export const AI_PROVIDER_CONFIG: AIProviderConfig = resolveProviderConfig();
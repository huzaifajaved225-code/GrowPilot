import type { IAIProvider } from "@/lib/ai/provider.interface";
import type { AIProviderRequest, AIProviderResponse } from "@/lib/ai/provider.types";
import { KNOWN_PROVIDERS, type ProviderId } from "@/lib/ai/provider.types";
import { ProviderError } from "@/lib/ai/provider-error";

/** Base URL for the Gemini Generative Language REST API. */
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Maps Gemini HTTP error codes to structured {@link ProviderError}
 * factory calls. Gemini returns standard HTTP status codes.
 */
function errorFromStatus(status: number, body: string): ProviderError {
  const pid = KNOWN_PROVIDERS.GEMINI;
  if (status === 401 || status === 403) return ProviderError.unauthorized(pid);
  if (status === 429) return ProviderError.rateLimited(pid);
  if (status >= 500) return ProviderError.unavailable(pid, status);
  return new ProviderError(`Gemini API returned ${status}: ${body.slice(0, 200)}`, pid, {
    httpStatus: status,
    code: "PROVIDER_ERROR",
    details: { providerKeyStatus: "configured" },
  });
}

/**
 * Gemini provider adapter — communicates with Google's Generative
 * Language REST API using the native `fetch` API. Zero third-party
 * dependencies beyond the Node.js built-in `fetch`.
 *
 * Implements {@link IAIProvider} so the {@link ProviderManager} can
 * use it interchangeably with other adapters.
 */
export class GeminiAdapter implements IAIProvider {
  public readonly id: ProviderId = KNOWN_PROVIDERS.GEMINI;
  public readonly name = "Google Gemini";

  /** @param apiKey - The Gemini API key. Must not be logged or exposed. */
  constructor(private readonly apiKey: string | undefined) {}

  /** @inheritdoc */
  public isAvailable(): boolean {
    return typeof this.apiKey === "string" && this.apiKey.length > 0;
  }

  /** @inheritdoc */
  public async generateText(request: AIProviderRequest): Promise<AIProviderResponse> {
    if (!this.isAvailable()) {
      throw ProviderError.notConfigured(KNOWN_PROVIDERS.GEMINI);
    }

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(request.model)}:generateContent?key=${this.apiKey}`;

    const body = JSON.stringify({
      contents: request.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      systemInstruction: (() => {
        const sys = request.messages.find((m) => m.role === "system");
        return sys ? { parts: [{ text: sys.content }] } : undefined;
      })(),
      generationConfig: {
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {}),
        ...(request.maxTokens !== undefined ? { maxOutputTokens: request.maxTokens } : {}),
      },
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: request.signal,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ProviderError(
          "Gemini request was cancelled by the caller",
          KNOWN_PROVIDERS.GEMINI,
          { code: "PROVIDER_CANCELLED", retryable: true },
        );
      }
      throw ProviderError.unavailable(KNOWN_PROVIDERS.GEMINI);
    }

    const responseBody = await response.text();

    if (!response.ok) {
      throw errorFromStatus(response.status, responseBody);
    }

    let parsed: {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
      modelVersion?: string;
    };

    try {
      parsed = JSON.parse(responseBody);
    } catch {
      throw ProviderError.malformedResponse(KNOWN_PROVIDERS.GEMINI, "Invalid JSON");
    }

    const text = parsed.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    if (!text && (!parsed.candidates || parsed.candidates.length === 0)) {
      throw ProviderError.malformedResponse(KNOWN_PROVIDERS.GEMINI, "No candidates in response");
    }

    return {
      text,
      model: parsed.modelVersion ?? request.model,
      usage: parsed.usageMetadata
        ? {
            promptTokens: parsed.usageMetadata.promptTokenCount ?? 0,
            completionTokens: parsed.usageMetadata.candidatesTokenCount ?? 0,
            totalTokens: parsed.usageMetadata.totalTokenCount ?? 0,
          }
        : undefined,
      metadata: { finishReason: "stop" },
    };
  }
}

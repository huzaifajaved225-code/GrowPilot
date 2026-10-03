import type { Metadata } from "@/ai-core/types/common.types";

/**
 * Branded identifier for an AI provider (e.g. "gemini", "openai").
 * Used by the {@link ProviderManager} to resolve the correct adapter
 * from its registry.
 */
export type ProviderId = string & { readonly __brand: "ProviderId" };

/** Convenience factory — casts a plain string to a {@link ProviderId}. */
export function providerId(id: string): ProviderId {
  return id as ProviderId;
}

/** Well-known provider identifiers used across GrowPilot. */
export const KNOWN_PROVIDERS = {
  GEMINI: providerId("gemini"),
  OPENAI: providerId("openai"),
  ANTHROPIC: providerId("anthropic"),
} as const;

/**
 * A single chat message sent to an AI provider. Role is restricted to
 * the standard three values every major provider supports.
 */
export interface ChatMessage {
  readonly role: "system" | "user" | "assistant";
  readonly content: string;
}

/**
 * Input for a text-generation request. Kept intentionally minimal so
 * every adapter (Gemini, OpenAI, Anthropic) can satisfy it without
 * provider-specific extensions leaking into the abstraction.
 */
export interface AIProviderRequest {
  /** The model identifier (e.g. "gemini-2.0-flash", "gpt-4o-mini"). */
  readonly model: string;
  /** Ordered conversation messages. */
  readonly messages: readonly ChatMessage[];
  /** Sampling temperature (0.0-2.0). Lower = more deterministic. */
  readonly temperature?: number;
  /** Maximum tokens to generate in the response. */
  readonly maxTokens?: number;
  /** Optional AbortSignal for caller-driven cancellation. */
  readonly signal?: AbortSignal;
}

/**
 * The successful response from a text-generation call. Contains the
 * generated text plus lightweight usage metadata every provider
 * returns, so callers can track cost without inspecting raw responses.
 */
export interface AIProviderResponse {
  /** The generated text content. */
  readonly text: string;
  /** The model that actually produced the response. */
  readonly model: string;
  /** Token usage breakdown, if the provider returned it. */
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
  /** Arbitrary provider-specific metadata. */
  readonly metadata: Metadata;
}
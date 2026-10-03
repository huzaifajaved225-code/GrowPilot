/**
 * AI Provider Abstraction Layer — the single import surface for all
 * AI provider interactions in GrowPilot.
 *
 * Agents and API routes should use:
 * ```ts
 * import { ProviderManager, type AIProviderRequest } from "@/lib/ai";
 * ```
 */
export * from "@/lib/ai/provider.types";
export * from "@/lib/ai/provider.interface";
export * from "@/lib/ai/provider-error";
export * from "@/lib/ai/provider-config";
export * from "@/lib/ai/gemini-adapter";
export * from "@/lib/ai/provider-manager";
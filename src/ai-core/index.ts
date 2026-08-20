/**
 * GrowPilot AI Core Engine — public entry point.
 *
 * This module is the single import surface the rest of GrowPilot
 * (API routes, server actions, background jobs) should use to reach
 * anything in `src/ai-core`. Internal cross-module imports within
 * `ai-core` itself use direct paths (e.g.
 * `@/ai-core/errors/agent-error`) to avoid circular-barrel issues, but
 * external consumers should prefer:
 *
 * ```ts
 * import { AIEngine, BaseAgent, BaseTool, AgentError } from "@/ai-core";
 * ```
 *
 * Typical usage from an API route or server action:
 *
 * ```ts
 * import { AIEngine } from "@/ai-core";
 *
 * const engine = AIEngine.getInstance();
 *
 * const output = await engine.run({
 *   agentId: "seo-audit-agent",
 *   identity: { organizationId, userId, sessionId },
 *   payload: { url: "https://example.com" },
 * });
 * ```
 */

// Types — branded ids, Result/DeepReadonly/DeepPartial utility types, JSON types.
export * from "@/ai-core/types";

// Interfaces — the contracts every concrete implementation satisfies.
export * from "@/ai-core/interfaces";

// Errors — the full typed error hierarchy (AIError and its subclasses).
export * from "@/ai-core/errors";

// Utilities — id generation, date helpers, constants, retry/timeout helpers, the logger.
export * from "@/ai-core/utils";

// Configuration — AICoreConfig, defaults, and the config resolver.
export * from "@/ai-core/config";

// Memory layer — MemoryManager, scoped stores, and the pluggable adapters.
export * from "@/ai-core/memory";

// Prompt system — PromptManager, the template renderer, and the reusable prompt library.
export * from "@/ai-core/prompts";

// Tool framework — BaseTool and the governed ToolRegistry.
export * from "@/ai-core/tools";

// Agent framework — BaseAgent, the class every concrete GrowPilot agent extends.
export * from "@/ai-core/agents";

// Agent registry — the catalog concrete agents register into.
export * from "@/ai-core/registry";

// Execution pipeline — the 8-stage INPUT -> ... -> RESULT pipeline and its stages.
export * from "@/ai-core/pipeline";

// Engine — ExecutionContext and the central AIEngine class.
export * from "@/ai-core/engine";

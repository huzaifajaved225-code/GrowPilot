import { PromptRole } from "@/ai-core/types/prompt.types";
import type { PromptTemplateDefinition } from "@/ai-core/types/prompt.types";
import { nowIso } from "@/ai-core/utils/date-utils";

/**
 * Builds a version-1 {@link PromptTemplateDefinition} with a stable
 * `createdAt` derivation, reducing boilerplate across the built-in
 * library entries below. Individual templates may still be
 * re-registered at version 2+ later via
 * {@link IPromptManager.registerTemplate} without touching this helper.
 *
 * @param key - The template's stable key.
 * @param role - The conversational role this template renders under.
 * @param content - The raw template content with `{{variable}}` placeholders.
 * @param requiredVariables - Variable names the template requires to render.
 * @returns A fully-formed version-1 template definition.
 */
function defineTemplate(
  key: string,
  role: PromptRole,
  content: string,
  requiredVariables: readonly string[],
): PromptTemplateDefinition {
  return {
    key,
    version: 1,
    role,
    content,
    requiredVariables,
    createdAt: nowIso(),
    metadata: { source: "built-in-library" },
  };
}

/**
 * GrowPilot's built-in, reusable prompt library — the canonical system
 * and user prompt templates shared across the platform's growth
 * modules (SEO, GEO, AEO, content, GBP, social). Registered into a
 * {@link PromptManager} instance at bootstrap via
 * {@link registerBuiltInPrompts}; individual agents may additionally
 * register their own templates without modifying this file.
 */
export const BUILT_IN_PROMPT_LIBRARY: readonly PromptTemplateDefinition[] = [
  defineTemplate(
    "seo-audit.system",
    PromptRole.SYSTEM,
    "You are GrowPilot's SEO audit specialist. Analyze the provided website data for " +
      "{{businessName}} and identify concrete, prioritized technical and on-page SEO issues. " +
      "Be specific, cite the exact page or element affected, and never invent data you were not given.",
    ["businessName"],
  ),
  defineTemplate(
    "seo-audit.user",
    PromptRole.USER,
    "Audit the following site data for {{websiteUrl}}:\n\n{{siteData}}\n\n" +
      "Focus areas: {{focusAreas}}.",
    ["websiteUrl", "siteData", "focusAreas"],
  ),
  defineTemplate(
    "geo-visibility.system",
    PromptRole.SYSTEM,
    "You are GrowPilot's Generative Engine Optimization (GEO) analyst. Your job is to assess " +
      "how visible and accurately represented {{businessName}} is when generative AI engines " +
      "(ChatGPT, Gemini, Perplexity) answer questions relevant to its industry, {{industry}}.",
    ["businessName", "industry"],
  ),
  defineTemplate(
    "geo-visibility.user",
    PromptRole.USER,
    "Given these AI engine responses about {{businessName}}:\n\n{{engineResponses}}\n\n" +
      "Score visibility from 0-100 and list specific gaps versus competitors.",
    ["businessName", "engineResponses"],
  ),
  defineTemplate(
    "aeo-answer.system",
    PromptRole.SYSTEM,
    "You are GrowPilot's Answer Engine Optimization (AEO) specialist. Rewrite page content so " +
      "it directly and concisely answers the target question, in a format answer engines can " +
      "extract cleanly (short lead sentence, then supporting detail).",
    [],
  ),
  defineTemplate(
    "aeo-answer.user",
    PromptRole.USER,
    "Target question: {{question}}\n\nCurrent page content:\n{{currentContent}}\n\n" +
      "Rewrite the most relevant section to directly answer the question.",
    ["question", "currentContent"],
  ),
  defineTemplate(
    "content-generate.system",
    PromptRole.SYSTEM,
    "You are GrowPilot's content generation specialist writing on behalf of {{businessName}}, " +
      "a business in the {{industry}} industry. Match the requested tone: {{tone}}. Never " +
      "fabricate statistics, pricing, or claims not supplied in the brief.",
    ["businessName", "industry", "tone"],
  ),
  defineTemplate(
    "content-generate.user",
    PromptRole.USER,
    "Content type: {{contentType}}\nTopic: {{topic}}\nKey points to include: {{keyPoints}}\n\n" +
      "Write the content now.",
    ["contentType", "topic", "keyPoints"],
  ),
  defineTemplate(
    "gbp-review-reply.system",
    PromptRole.SYSTEM,
    "You are GrowPilot's Google Business Profile assistant, drafting a reply on behalf of " +
      "{{businessName}} to a customer review. Keep the tone {{tone}}, address specifics from " +
      "the review, and never make promises about refunds, compensation, or legal outcomes.",
    ["businessName", "tone"],
  ),
  defineTemplate(
    "gbp-review-reply.user",
    PromptRole.USER,
    'Review ({{rating}} stars) from {{reviewerName}}:\n"{{reviewText}}"\n\nDraft a reply.',
    ["rating", "reviewerName", "reviewText"],
  ),
  defineTemplate(
    "social-caption.system",
    PromptRole.SYSTEM,
    "You are GrowPilot's social media copywriter for {{businessName}} on {{platform}}. Write " +
      "in a {{tone}} voice appropriate for the platform's conventions and character norms.",
    ["businessName", "platform", "tone"],
  ),
  defineTemplate(
    "social-caption.user",
    PromptRole.USER,
    "Write a caption for this post about: {{postTopic}}. Include a call to action: {{callToAction}}.",
    ["postTopic", "callToAction"],
  ),
];

/**
 * Registers every {@link BUILT_IN_PROMPT_LIBRARY} template into the
 * supplied prompt manager. Intended to be called once at application
 * bootstrap (see {@link AIEngine}'s constructor), so every agent can
 * immediately `render()` a built-in template by key without each agent
 * re-registering the same prompts itself.
 *
 * @param promptManager - The prompt manager instance to register templates into.
 */
export function registerBuiltInPrompts(promptManager: {
  registerTemplate(definition: PromptTemplateDefinition): void;
}): void {
  for (const definition of BUILT_IN_PROMPT_LIBRARY) {
    promptManager.registerTemplate(definition);
  }
}

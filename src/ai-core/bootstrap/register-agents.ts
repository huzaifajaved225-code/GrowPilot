import { AgentRegistry } from "@/ai-core/registry/agent-registry";
import { SeoAuditAgent } from "@/ai-core/agents/seo-audit-agent";
import { GeoAuditAgent } from "@/ai-core/agents/geo-audit-agent";
import { SchemaAgent } from "@/ai-core/agents/schema-agent";
import { GeneralAgent } from "@/ai-core/agents/general-agent";
import { LeadQualificationAgent } from "@/ai-core/agents/lead-qualification-agent";
import { registerBuiltInPrompts } from "@/ai-core/prompts/prompt-library";
import { PromptManager } from "@/ai-core/prompts/prompt-manager";
import { PromptRole } from "@/ai-core/types/prompt.types";
import { nowIso } from "@/ai-core/utils/date-utils";

/**
 * Tracks whether the AI Core bootstrap has already run in this process,
 * preventing duplicate agent registrations and prompt template registrations
 * when called from multiple entry points.
 */
let bootstrapped = false;

/**
 * Registers all built-in agents and prompt templates into the shared
 * singleton registries. Safe to call multiple times; subsequent calls
 * are no-ops.
 */
export function bootstrapAICore(): void {
    if (bootstrapped) return;
    bootstrapped = true;

    const registry = AgentRegistry.getInstance();

    if (!registry.hasAgent("seo-audit-agent")) {
        registry.registerAgent("seo-audit-agent", () => new SeoAuditAgent());
    }

    if (!registry.hasAgent("geo-audit-agent")) {
        registry.registerAgent("geo-audit-agent", () => new GeoAuditAgent());
    }

    if (!registry.hasAgent("schema-agent")) {
        registry.registerAgent("schema-agent", () => new SchemaAgent());
    }

    if (!registry.hasAgent("general-agent")) {
        registry.registerAgent("general-agent", () => new GeneralAgent());
    }

    if (!registry.hasAgent("lead-qualification-agent")) {
        registry.registerAgent("lead-qualification-agent", () => new LeadQualificationAgent());
    }

    // Register built-in prompt templates into a shared PromptManager.
    registerBuiltInPrompts(sharedPromptManager);

    // Register GEO audit prompt templates
    const registeredTemplates = sharedPromptManager.listTemplates();

    if (!registeredTemplates.has("geo-audit.system")) {
        sharedPromptManager.registerTemplate({
            key: "geo-audit.system",
            version: 1,
            role: PromptRole.SYSTEM,
            content:
                "You are GrowPilot's Generative Engine Optimization (GEO) analyst. Analyze " +
                "the provided website data for {{businessName}} and evaluate how well it is " +
                "optimized for visibility in AI-generated answers and generative search engines " +
                "(ChatGPT, Gemini, Perplexity, etc.). Assess structured data markup, entity " +
                "clarity, content authority, citation potential, and AI-readability. Be specific, " +
                "cite exact elements, and never invent data you were not given.",
            requiredVariables: ["businessName"],
            createdAt: nowIso(),
            metadata: { source: "built-in-library" },
        });
    }

    if (!registeredTemplates.has("geo-audit.user")) {
        sharedPromptManager.registerTemplate({
            key: "geo-audit.user",
            version: 1,
            role: PromptRole.USER,
            content:
                "Analyze the following website for GEO readiness:\n\nURL: {{websiteUrl}}\n\n" +
                "Site data:\n{{siteData}}\n\nFocus areas: {{focusAreas}}.\n\n" +
                "Score the overall GEO readiness from 0-100, identify specific issues with " +
                "severity levels (critical, high, medium, low), and list actionable opportunities " +
                "to improve visibility in AI-generated answers.",
            requiredVariables: ["websiteUrl", "siteData", "focusAreas"],
            createdAt: nowIso(),
            metadata: { source: "built-in-library" },
        });
    }

    if (!registeredTemplates.has("lead-qualification.system")) {
        sharedPromptManager.registerTemplate({
            key: "lead-qualification.system",
            version: 1,
            role: PromptRole.SYSTEM,
            content:
                "You are GrowPilot's expert B2B Lead Qualification & Growth Specialist. " +
                "Analyze the prospect business and evaluate how viable and high-potential they are as a client. " +
                "Assess their digital presence opportunity, market positioning, and growth potential. " +
                "Assign a score from 0-100, a status tier ('HOT' for 80-100, 'WARM' for 50-79, 'COLD' for 0-49), " +
                "an opportunity summary, detailed AI insight, recommended GrowPilot service, " +
                "and a suggested next action. Never invent unsupported facts about the business.",
            requiredVariables: [],
            createdAt: nowIso(),
            metadata: { source: "built-in-library" },
        });
    }

    if (!registeredTemplates.has("lead-qualification.user")) {
        sharedPromptManager.registerTemplate({
            key: "lead-qualification.user",
            version: 1,
            role: PromptRole.USER,
            content:
                "Evaluate the following candidate lead:\n\n" +
                "Business Name: {{businessName}}\n" +
                "Industry: {{industry}}\n" +
                "Location: {{location}}\n" +
                "Target Customer: {{targetCustomer}}\n" +
                "Website: {{website}}\n" +
                "Description/Context: {{description}}\n\n" +
                "Required JSON format:\n" +
                "{\n" +
                '  "score": <number 0-100>,\n' +
                '  "status": "HOT" | "WARM" | "COLD",\n' +
                '  "opportunity": "<concise description of growth gap/need>",\n' +
                '  "aiInsight": "<clear justification for score & digital presence analysis>",\n' +
                '  "recommendedService": "<specific service e.g. SEO Audit & Optimization, Generative Engine Optimization, Local GBP, Social Media Growth>",\n' +
                '  "nextAction": "<actionable next step e.g. Send personalized outreach message>"\n' +
                "}",
            requiredVariables: ["businessName", "industry", "location"],
            createdAt: nowIso(),
            metadata: { source: "built-in-library" },
        });
    }
}

export function isAICoreBootstrapped(): boolean {
    return bootstrapped;
}

export function resetAICoreBootstrap(): void {
    bootstrapped = false;
}

export const sharedPromptManager = new PromptManager();
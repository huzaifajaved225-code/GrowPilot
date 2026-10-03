import { describe, it, expect, beforeEach } from "vitest";
import { GeoAuditAgent } from "@/ai-core/agents/geo-audit-agent";
import type { GeoAuditAgentInput } from "@/ai-core/agents/geo-audit-agent";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentInput } from "@/ai-core/types/agent.types";
import type { IAIProviderManager } from "@/ai-core/interfaces/pipeline.interface";
import { PromptManager } from "@/ai-core/prompts/prompt-manager";
import { PromptRole } from "@/ai-core/types/prompt.types";
import { nowIso } from "@/ai-core/utils/date-utils";
import type { AIProviderRequest, AIProviderResponse } from "@/lib/ai/provider.types";

/**
 * Creates a mock AI provider manager that returns a canned response.
 */
function createMockProviderManager(responseText: string): IAIProviderManager {
    return {
        async generateText(_request: AIProviderRequest): Promise<AIProviderResponse> {
            return {
                text: responseText,
                model: "mock-model",
                usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
                metadata: {},
            };
        },
    };
}

/**
 * Creates a mock execution context with a PromptManager (with GEO prompts registered)
 * and a mock provider manager.
 */
function createMockContext(responseText: string): IExecutionContext {
    const promptManager = new PromptManager();

    // Register GEO audit prompts
    promptManager.registerTemplate({
        key: "geo-audit.system",
        version: 1,
        role: PromptRole.SYSTEM,
        content: "You are GrowPilot's GEO analyst for {{businessName}}.",
        requiredVariables: ["businessName"],
        createdAt: nowIso(),
        metadata: { source: "test" },
    });
    promptManager.registerTemplate({
        key: "geo-audit.user",
        version: 1,
        role: PromptRole.USER,
        content: "Analyze {{websiteUrl}} for GEO. Site: {{siteData}}. Focus: {{focusAreas}}.",
        requiredVariables: ["websiteUrl", "siteData", "focusAreas"],
        createdAt: nowIso(),
        metadata: { source: "test" },
    });

    return {
        requestId: "test-request-id",
        logger: {
            debug: () => {},
            info: () => {},
            warn: () => {},
            error: () => {},
            child: () => ({
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {},
                child: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }),
            }),
        },
        memory: {
            getSession: async () => ({ entries: [] }),
            addSessionEntry: async () => {},
            getConversation: async () => ({ messages: [] }),
            addConversationMessage: async () => {},
            getWorkingMemory: async () => ({}),
            setWorkingMemory: async () => {},
            clearSession: async () => {},
        },
        prompts: promptManager,
        tools: {
            registerTool: () => {},
            getTool: () => { throw new Error("Not implemented"); },
            listTools: () => [],
            hasTool: () => false,
            invoke: async () => { throw new Error("Not implemented"); },
        },
        providerManager: createMockProviderManager(responseText),
        metadata: {},
        trace: [],
        identity: {
            organizationId: "test-org" as any,
            userId: "test-user" as any,
            sessionId: "test-session" as any,
        },
    } as unknown as IExecutionContext;
}

/**
 * Creates a valid AgentInput for the GeoAuditAgent.
 */
function createMockInput(overrides?: Partial<GeoAuditAgentInput>): AgentInput<GeoAuditAgentInput> {
    return {
        requestId: "test-request-id" as any,
        identity: {
            organizationId: "test-org" as any,
            userId: "test-user" as any,
            sessionId: "test-session" as any,
        },
        payload: {
            url: "https://example.com",
            businessName: "Test Business",
            siteData: "<html><head><title>Test</title></head><body>Content</body></html>",
            focusAreas: "ai-visibility,entity-understanding",
            ...overrides,
        },
        metadata: {},
    };
}

/**
 * A valid GEO audit JSON response from the AI provider.
 */
const validAuditResponse = JSON.stringify({
    score: 65,
    summary: "The site has moderate GEO readiness but needs improvement in structured data and entity clarity.",
    issues: [
        {
            severity: "critical",
            category: "structured-data",
            title: "Missing Schema.org Markup",
            description: "No structured data markup found on the homepage.",
            recommendation: "Add Schema.org JSON-LD markup for your organization and primary offerings.",
        },
        {
            severity: "high",
            category: "entity-understanding",
            title: "Unclear Business Entity",
            description: "The AI cannot clearly identify what the business does from the homepage.",
            recommendation: "Add a clear, concise business description in the hero section.",
        },
        {
            severity: "medium",
            category: "content-authority",
            title: "Thin Content on Key Topics",
            description: "Key service pages have less than 300 words of content.",
            recommendation: "Expand service pages with detailed, authoritative content.",
        },
        {
            severity: "low",
            category: "citations",
            title: "No External References",
            description: "Content lacks citations to authoritative sources.",
            recommendation: "Add references to industry data, studies, or standards.",
        },
    ],
    opportunities: [
        {
            title: "FAQ Section for AI Extraction",
            description: "Adding an FAQ section would increase chances of AI engines citing your content.",
            recommendation: "Create a comprehensive FAQ page addressing common industry questions.",
        },
        {
            title: "Knowledge Panel Optimization",
            description: "Your business could benefit from a knowledge panel presence.",
            recommendation: "Ensure consistent NAP data across major directories and Wikipedia.",
        },
    ],
});

describe("GeoAuditAgent", () => {
    let agent: GeoAuditAgent;

    beforeEach(() => {
        agent = new GeoAuditAgent();
    });

    describe("descriptor", () => {
        it("has the correct identity metadata", () => {
            expect(agent.descriptor.id).toBe("geo-audit-agent");
            expect(agent.descriptor.name).toBe("GEO Audit Agent");
            expect(agent.descriptor.version).toBe("1.0.0");
            expect(agent.descriptor.tags).toContain("geo");
            expect(agent.descriptor.tags).toContain("audit");
            expect(agent.descriptor.tags).toContain("ai-visibility");
        });
    });

    describe("validate", () => {
        it("accepts valid input", async () => {
            const input = createMockInput();
            const context = createMockContext(validAuditResponse);
            await expect(agent.validate(input, context)).resolves.toBeUndefined();
        });

        it("rejects empty url", async () => {
            const input = createMockInput({ url: "" });
            const context = createMockContext(validAuditResponse);
            await expect(agent.validate(input, context)).rejects.toThrow(/Invalid GeoAuditAgent input/);
        });

        it("rejects invalid url format", async () => {
            const input = createMockInput({ url: "not-a-url" });
            const context = createMockContext(validAuditResponse);
            await expect(agent.validate(input, context)).rejects.toThrow(/url must be a valid URL/);
        });

        it("rejects empty businessName", async () => {
            const input = createMockInput({ businessName: "" });
            const context = createMockContext(validAuditResponse);
            await expect(agent.validate(input, context)).rejects.toThrow(/Invalid GeoAuditAgent input/);
        });

        it("rejects empty siteData", async () => {
            const input = createMockInput({ siteData: "" });
            const context = createMockContext(validAuditResponse);
            await expect(agent.validate(input, context)).rejects.toThrow(/Invalid GeoAuditAgent input/);
        });

        it("rejects empty focusAreas", async () => {
            const input = createMockInput({ focusAreas: "" });
            const context = createMockContext(validAuditResponse);
            await expect(agent.validate(input, context)).rejects.toThrow(/Invalid GeoAuditAgent input/);
        });
    });

    describe("run", () => {
        it("produces structured output from valid AI response", async () => {
            const input = createMockInput();
            const context = createMockContext(validAuditResponse);

            const result = await agent.run(input, context);

            expect(result.score).toBe(65);
            expect(result.issues).toHaveLength(4);
            expect(result.issues[0]!.severity).toBe("critical");
            expect(result.issues[0]!.category).toBe("structured-data");
            expect(result.issues[0]!.title).toContain("Schema.org");
            expect(result.issues[1]!.severity).toBe("high");
            expect(result.issues[2]!.severity).toBe("medium");
            expect(result.issues[3]!.severity).toBe("low");
            expect(result.summary).toContain("moderate GEO readiness");
            expect(result.opportunities).toHaveLength(2);
            expect(result.opportunities![0]!.title).toContain("FAQ");
        });

        it("uses the registered prompt templates", async () => {
            const input = createMockInput();
            const context = createMockContext(validAuditResponse);

            const result = await agent.run(input, context);
            expect(result).toBeDefined();
            expect(result.score).toBeGreaterThanOrEqual(0);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it("throws AgentError when AI returns non-JSON text", async () => {
            const input = createMockInput();
            const context = createMockContext("This is not JSON at all, just plain text.");

            await expect(agent.run(input, context)).rejects.toThrow(/no JSON object/);
        });

        it("throws AgentError when AI returns malformed JSON", async () => {
            const input = createMockInput();
            const context = createMockContext('{ "score": 50, "issues": [invalid] }');

            await expect(agent.run(input, context)).rejects.toThrow(/malformed JSON/);
        });

        it("throws AgentError when AI response fails schema validation", async () => {
            const input = createMockInput();
            const badSchemaResponse = JSON.stringify({
                score: "not a number",
                summary: "test",
                issues: [],
            });
            const context = createMockContext(badSchemaResponse);

            await expect(agent.run(input, context)).rejects.toThrow(/schema validation/);
        });

        it("throws AgentError when issues array contains invalid severity", async () => {
            const input = createMockInput();
            const badSeverityResponse = JSON.stringify({
                score: 50,
                summary: "test",
                issues: [{ severity: "extreme", category: "test", title: "test", description: "test", recommendation: "test" }],
            });
            const context = createMockContext(badSeverityResponse);

            await expect(agent.run(input, context)).rejects.toThrow(/schema validation/);
        });

        it("handles AI response with score at boundaries", async () => {
            const input = createMockInput();

            // Score of 0 (minimum).
            const zeroResponse = JSON.stringify({ score: 0, summary: "Very poor GEO", issues: [] });
            const contextZero = createMockContext(zeroResponse);
            const resultZero = await agent.run(input, contextZero);
            expect(resultZero.score).toBe(0);

            // Score of 100 (maximum).
            const hundredResponse = JSON.stringify({ score: 100, summary: "Perfect GEO", issues: [] });
            const contextHundred = createMockContext(hundredResponse);
            const resultHundred = await agent.run(input, contextHundred);
            expect(resultHundred.score).toBe(100);
        });

        it("handles AI response with JSON wrapped in markdown code blocks", async () => {
            const input = createMockInput();
            const markdownWrapped = "```json\n" + validAuditResponse + "\n```";
            const context = createMockContext(markdownWrapped);

            const result = await agent.run(input, context);
            expect(result.score).toBe(65);
            expect(result.issues).toHaveLength(4);
        });

        it("handles response without opportunities field", async () => {
            const input = createMockInput();
            const noOppResponse = JSON.stringify({
                score: 50,
                summary: "Moderate",
                issues: [{ severity: "medium", category: "test", title: "Test", description: "Desc", recommendation: "Fix" }],
            });
            const context = createMockContext(noOppResponse);

            const result = await agent.run(input, context);
            expect(result.score).toBe(50);
            expect(result.opportunities).toBeUndefined();
        });
    });
});
import { describe, it, expect, beforeEach } from "vitest";
import { SeoAuditAgent } from "@/ai-core/agents/seo-audit-agent";
import type { SeoAuditAgentInput } from "@/ai-core/agents/seo-audit-agent";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentInput } from "@/ai-core/types/agent.types";
import type { IAIProviderManager } from "@/ai-core/interfaces/pipeline.interface";
import { PromptManager } from "@/ai-core/prompts/prompt-manager";
import { registerBuiltInPrompts } from "@/ai-core/prompts/prompt-library";
import type { AIProviderRequest, AIProviderResponse } from "@/lib/ai/provider.types";
import type { OrganizationId, RequestId, SessionId, UserId } from "@/ai-core/types/common.types";

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
 * Creates a mock execution context with a real PromptManager (with built-in
 * prompts registered) and a mock provider manager.
 */
function createMockContext(responseText: string): IExecutionContext {
  const promptManager = new PromptManager();
  registerBuiltInPrompts(promptManager);

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
      getTool: () => {
        throw new Error("Not implemented");
      },
      listTools: () => [],
      hasTool: () => false,
      invoke: async () => {
        throw new Error("Not implemented");
      },
    },
    providerManager: createMockProviderManager(responseText),
    metadata: {},
    trace: [],
    identity: {
      organizationId: "test-org" as OrganizationId,
      userId: "test-user" as UserId,
      sessionId: "test-session" as SessionId,
    },
  } as unknown as IExecutionContext;
}

/**
 * Creates a valid AgentInput for the SeoAuditAgent.
 */
function createMockInput(overrides?: Partial<SeoAuditAgentInput>): AgentInput<SeoAuditAgentInput> {
  return {
    requestId: "test-request-id" as RequestId,
    identity: {
      organizationId: "test-org" as OrganizationId,
      userId: "test-user" as UserId,
      sessionId: "test-session" as SessionId,
    },
    payload: {
      url: "https://example.com",
      businessName: "Test Business",
      siteData: "<html><head><title>Test</title></head><body>Content</body></html>",
      focusAreas: "technical,content",
      ...overrides,
    },
    metadata: {},
  };
}

/**
 * A valid SEO audit JSON response from the AI provider.
 */
const validAuditResponse = JSON.stringify({
  score: 72,
  issues: [
    {
      severity: "critical",
      category: "technical",
      description: "Missing meta description on homepage",
      recommendation: "Add a descriptive meta description tag to the homepage",
    },
    {
      severity: "warning",
      category: "content",
      description: "H1 tag is missing from the homepage",
      recommendation: "Add a single H1 tag with relevant keywords",
    },
    {
      severity: "info",
      category: "performance",
      description: "Images lack alt attributes",
      recommendation: "Add descriptive alt text to all images",
    },
  ],
  summary:
    "The site has basic SEO foundations but needs improvement in meta tags and heading structure.",
});

describe("SeoAuditAgent", () => {
  let agent: SeoAuditAgent;

  beforeEach(() => {
    agent = new SeoAuditAgent();
  });

  describe("descriptor", () => {
    it("has the correct identity metadata", () => {
      expect(agent.descriptor.id).toBe("seo-audit-agent");
      expect(agent.descriptor.name).toBe("SEO Audit Agent");
      expect(agent.descriptor.version).toBe("1.0.0");
      expect(agent.descriptor.tags).toContain("seo");
      expect(agent.descriptor.tags).toContain("audit");
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
      await expect(agent.validate(input, context)).rejects.toThrow(/Invalid SeoAuditAgent input/);
    });

    it("rejects invalid url format", async () => {
      const input = createMockInput({ url: "not-a-url" });
      const context = createMockContext(validAuditResponse);
      await expect(agent.validate(input, context)).rejects.toThrow(/url must be a valid URL/);
    });

    it("rejects empty businessName", async () => {
      const input = createMockInput({ businessName: "" });
      const context = createMockContext(validAuditResponse);
      await expect(agent.validate(input, context)).rejects.toThrow(/Invalid SeoAuditAgent input/);
    });

    it("rejects empty siteData", async () => {
      const input = createMockInput({ siteData: "" });
      const context = createMockContext(validAuditResponse);
      await expect(agent.validate(input, context)).rejects.toThrow(/Invalid SeoAuditAgent input/);
    });

    it("rejects empty focusAreas", async () => {
      const input = createMockInput({ focusAreas: "" });
      const context = createMockContext(validAuditResponse);
      await expect(agent.validate(input, context)).rejects.toThrow(/Invalid SeoAuditAgent input/);
    });
  });

  describe("run", () => {
    it("produces structured output from valid AI response", async () => {
      const input = createMockInput();
      const context = createMockContext(validAuditResponse);

      const result = await agent.run(input, context);

      expect(result.score).toBe(72);
      expect(result.issues).toHaveLength(3);
      expect(result.issues[0]!.severity).toBe("critical");
      expect(result.issues[0]!.category).toBe("technical");
      expect(result.issues[0]!.description).toContain("meta description");
      expect(result.issues[1]!.severity).toBe("warning");
      expect(result.issues[2]!.severity).toBe("info");
      expect(result.summary).toContain("SEO foundations");
    });

    it("uses the registered prompt templates", async () => {
      const input = createMockInput();
      const context = createMockContext(validAuditResponse);

      // The run should not throw - prompts are registered.
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
      // Valid JSON but wrong schema (score is a string, not a number).
      const badSchemaResponse = JSON.stringify({
        score: "not a number",
        issues: [],
        summary: "test",
      });
      const context = createMockContext(badSchemaResponse);

      await expect(agent.run(input, context)).rejects.toThrow(/schema validation/);
    });

    it("throws AgentError when issues array contains invalid severity", async () => {
      const input = createMockInput();
      const badSeverityResponse = JSON.stringify({
        score: 50,
        issues: [
          { severity: "extreme", category: "test", description: "test", recommendation: "test" },
        ],
        summary: "test",
      });
      const context = createMockContext(badSeverityResponse);

      await expect(agent.run(input, context)).rejects.toThrow(/schema validation/);
    });

    it("handles AI response with score at boundaries", async () => {
      const input = createMockInput();

      // Score of 0 (minimum).
      const zeroResponse = JSON.stringify({ score: 0, issues: [], summary: "Very poor" });
      const contextZero = createMockContext(zeroResponse);
      const resultZero = await agent.run(input, contextZero);
      expect(resultZero.score).toBe(0);

      // Score of 100 (maximum).
      const hundredResponse = JSON.stringify({ score: 100, issues: [], summary: "Perfect" });
      const contextHundred = createMockContext(hundredResponse);
      const resultHundred = await agent.run(input, contextHundred);
      expect(resultHundred.score).toBe(100);
    });

    it("handles AI response with JSON wrapped in markdown code blocks", async () => {
      const input = createMockInput();
      const markdownWrapped = "```json\n" + validAuditResponse + "\n```";
      const context = createMockContext(markdownWrapped);

      const result = await agent.run(input, context);
      expect(result.score).toBe(72);
      expect(result.issues).toHaveLength(3);
    });
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { SchemaAgent } from "@/ai-core/agents/schema-agent";
import type { SchemaAgentInput } from "@/ai-core/agents/schema-agent";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentInput } from "@/ai-core/types/agent.types";
import type { IAIProviderManager } from "@/ai-core/interfaces/pipeline.interface";
import { PromptManager } from "@/ai-core/prompts/prompt-manager";
import type { AIProviderRequest, AIProviderResponse } from "@/lib/ai/provider.types";
import { PromptRole } from "@/ai-core/types/prompt.types";
import type { OrganizationId, RequestId, SessionId, UserId } from "@/ai-core/types/common.types";

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

function createMockContext(responseText: string): IExecutionContext {
  const promptManager = new PromptManager();
  promptManager.registerTemplate({
    key: "schema-generation.system",
    version: 1,
    role: PromptRole.SYSTEM,
    content: "Generate JSON-LD for {{businessType}}",
    requiredVariables: [],
    createdAt: new Date().toISOString(),
    metadata: {},
  });
  promptManager.registerTemplate({
    key: "schema-generation.user",
    version: 1,
    role: PromptRole.USER,
    content:
      "URL: {{websiteUrl}} Type: {{businessType}} Data: {{extractedMetadata}} Existing: {{existingSchema}} Missing: {{missingInformation}}",
    requiredVariables: [
      "websiteUrl",
      "businessType",
      "extractedMetadata",
      "existingSchema",
      "missingInformation",
    ],
    createdAt: new Date().toISOString(),
    metadata: {},
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
      getTool: () => {
        throw new Error("NI");
      },
      listTools: () => [],
      hasTool: () => false,
      invoke: async () => {
        throw new Error("NI");
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

function createMockInput(overrides?: Partial<SchemaAgentInput>): AgentInput<SchemaAgentInput> {
  return {
    requestId: "test-request-id" as RequestId,
    identity: {
      organizationId: "test-org" as OrganizationId,
      userId: "test-user" as UserId,
      sessionId: "test-session" as SessionId,
    },
    payload: {
      url: "https://example.com",
      businessType: "Organization",
      extractedMetadata: '{"title":"Test","description":"A test page"}',
      existingSchema: "No existing structured data found",
      missingInformation: ["phone number", "email address"],
      ...overrides,
    },
    metadata: {},
  };
}

const validResponse = JSON.stringify({
  generatedSchema: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Test Corp",
    url: "https://example.com",
  },
  reasoning: "Organization type based on extracted metadata",
  omittedProperties: ["telephone", "address"],
});

describe("SchemaAgent", () => {
  let agent: SchemaAgent;

  beforeEach(() => {
    agent = new SchemaAgent();
  });

  describe("descriptor", () => {
    it("has correct identity", () => {
      expect(agent.descriptor.id).toBe("schema-agent");
      expect(agent.descriptor.version).toBe("1.0.0");
      expect(agent.descriptor.tags).toContain("schema");
    });
  });

  describe("validate", () => {
    it("accepts valid input", async () => {
      const input = createMockInput();
      const context = createMockContext(validResponse);
      await expect(agent.validate(input, context)).resolves.toBeUndefined();
    });

    it("rejects empty url", async () => {
      const input = createMockInput({ url: "" });
      const context = createMockContext(validResponse);
      await expect(agent.validate(input, context)).rejects.toThrow(/Invalid SchemaAgent input/);
    });
  });

  describe("run", () => {
    it("produces structured schema output", async () => {
      const input = createMockInput();
      const context = createMockContext(validResponse);
      const result = await agent.run(input, context);
      expect(result.generatedSchema["@context"]).toBe("https://schema.org");
      expect(result.generatedSchema["@type"]).toBe("Organization");
      expect(result.reasoning).toBeTruthy();
      expect(result.omittedProperties).toContain("telephone");
    });

    it("throws when AI returns non-JSON", async () => {
      const input = createMockInput();
      const context = createMockContext("This is not JSON");
      await expect(agent.run(input, context)).rejects.toThrow(/no JSON object/);
    });

    it("throws when AI returns malformed JSON", async () => {
      const input = createMockInput();
      const context = createMockContext('{ "generatedSchema": {invalid} }');
      await expect(agent.run(input, context)).rejects.toThrow(/malformed JSON/);
    });

    it("throws when response fails schema validation", async () => {
      const input = createMockInput();
      const badResponse = JSON.stringify({ wrong: "schema" });
      const context = createMockContext(badResponse);
      await expect(agent.run(input, context)).rejects.toThrow(/schema validation/);
    });

    it("does not hallucinate data", async () => {
      const input = createMockInput();
      const response = JSON.stringify({
        generatedSchema: { "@context": "https://schema.org", "@type": "Restaurant", name: "Test" },
        reasoning: "Test",
        omittedProperties: ["telephone", "address", "servesCuisine"],
      });
      const context = createMockContext(response);
      const result = await agent.run(input, context);
      expect(result.generatedSchema).not.toHaveProperty("aggregateRating");
      expect(result.generatedSchema).not.toHaveProperty("review");
    });
  });
});

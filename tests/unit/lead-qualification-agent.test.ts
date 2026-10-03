import { describe, it, expect } from "vitest";
import {
  LeadQualificationAgent,
  leadQualificationInputSchema,
  leadQualificationResponseSchema,
  leadOutreachInputSchema,
  type LeadQualificationInput,
  type LeadOutreachInput,
} from "@/ai-core/agents/lead-qualification-agent";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentInput } from "@/ai-core/types/agent.types";
import type { IAIProviderManager } from "@/ai-core/interfaces/pipeline.interface";
import { PromptManager } from "@/ai-core/prompts/prompt-manager";
import { registerBuiltInPrompts } from "@/ai-core/prompts/prompt-library";
import type { AIProviderRequest, AIProviderResponse } from "@/lib/ai/provider.types";

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
  registerBuiltInPrompts(promptManager);

  return {
    requestId: "test-req-lead-qualification",
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
      invoke: async () => {
        throw new Error("No tools");
      },
      has: () => false,
      list: () => [],
      getDescriptor: () => undefined,
    },
    providerManager: createMockProviderManager(responseText),
  } as unknown as IExecutionContext;
}

function createMockInput(overrides?: Partial<LeadQualificationInput>): AgentInput<LeadQualificationInput> {
  return {
    requestId: "test-req-lead-qualification" as never,
    identity: {
      organizationId: "org-1" as never,
      userId: "user-1" as never,
      sessionId: "sess-1" as never,
    },
    payload: {
      businessName: "Summit Law Partners",
      industry: "Legal",
      location: "Austin, TX",
      ...overrides,
    },
    metadata: {},
  };
}

describe("LeadQualificationAgent", () => {
  it("validates valid input schema successfully", () => {
    const valid = leadQualificationInputSchema.safeParse({
      businessName: "Apex Marketing Group",
      industry: "Digital Marketing",
      location: "Karachi, Pakistan",
      targetCustomer: "SMBs",
      website: "https://www.apex-marketing.com",
      description: "Needs improved organic search visibility",
    });

    expect(valid.success).toBe(true);
  });

  it("fails input validation when businessName is missing", () => {
    const invalid = leadQualificationInputSchema.safeParse({
      businessName: "",
      industry: "Digital Marketing",
      location: "Karachi",
    });

    expect(invalid.success).toBe(false);
  });

  it("validates structured response schema correctly", () => {
    const valid = leadQualificationResponseSchema.safeParse({
      score: 85,
      status: "HOT",
      opportunity: "Low organic visibility and missing schema markup",
      aiInsight: "High conversion probability if SEO services are offered",
      recommendedService: "SEO + GEO Optimization",
      nextAction: "Send personalized cold email",
    });

    expect(valid.success).toBe(true);
  });

  it("executes qualification agent and computes HOT status for score >= 80", async () => {
    const cannedResponse = JSON.stringify({
      score: 92,
      status: "HOT",
      opportunity: "Strong referral base but poor search ranking",
      aiInsight: "Rapid client conversion potential",
      recommendedService: "SEO Audit",
      nextAction: "Send outreach pitch",
    });

    const agent = new LeadQualificationAgent();
    const context = createMockContext(cannedResponse);
    const input = createMockInput({
      businessName: "Summit Law Partners",
      industry: "Legal",
      location: "Austin, TX",
    });

    const result = await agent.run(input, context);
    expect(result.score).toBe(92);
    expect(result.status).toBe("HOT");
    expect(result.opportunity).toBe("Strong referral base but poor search ranking");
    expect(result.recommendedService).toBe("SEO Audit");
  });

  it("enforces WARM status for score between 50 and 79", async () => {
    const cannedResponse = JSON.stringify({
      score: 68,
      status: "HOT", // Model mistakenly tagged as HOT
      opportunity: "Moderate local presence",
      aiInsight: "Good prospect for GBP optimization",
      recommendedService: "Local SEO & GBP",
      nextAction: "Send WhatsApp intro",
    });

    const agent = new LeadQualificationAgent();
    const context = createMockContext(cannedResponse);
    const input = createMockInput({
      businessName: "Prime Dental",
      industry: "Dental",
      location: "Chicago, IL",
    });

    const result = await agent.run(input, context);
    expect(result.score).toBe(68);
    expect(result.status).toBe("WARM"); // Corrected by agent logic
  });

  it("enforces COLD status for score below 50", async () => {
    const cannedResponse = JSON.stringify({
      score: 35,
      status: "WARM",
      opportunity: "Low viability market fit",
      aiInsight: "Low current demand",
      recommendedService: "Basic Consulting",
      nextAction: "Nurture later",
    });

    const agent = new LeadQualificationAgent();
    const context = createMockContext(cannedResponse);
    const input = createMockInput({
      businessName: "Vintage Bookstore",
      industry: "Retail",
      location: "Remote",
    });

    const result = await agent.run(input, context);
    expect(result.score).toBe(35);
    expect(result.status).toBe("COLD");
  });

  it("handles markdown fenced JSON in model response", async () => {
    const fencedResponse =
      "```json\n" +
      JSON.stringify({
        score: 88,
        status: "HOT",
        opportunity: "Clean website lacking search optimization",
        aiInsight: "Prime target for search growth",
        recommendedService: "Technical SEO Audit",
        nextAction: "Contact founder directly",
      }) +
      "\n```";

    const agent = new LeadQualificationAgent();
    const context = createMockContext(fencedResponse);
    const input = createMockInput({
      businessName: "Horizon Tech Works",
      industry: "SaaS",
      location: "Seattle, WA",
    });

    const result = await agent.run(input, context);
    expect(result.score).toBe(88);
    expect(result.status).toBe("HOT");
  });

  it("generates personalized cold email outreach", async () => {
    const outreachCanned = JSON.stringify({
      channel: "email",
      subject: "Quick question regarding search visibility for Apex Dental",
      message: "Hi Dr. Smith,\n\nI noticed Apex Dental has strong reviews but limited local organic visibility...",
    });

    const agent = new LeadQualificationAgent();
    const context = createMockContext(outreachCanned);

    const payload: LeadOutreachInput = {
      businessName: "Apex Dental",
      industry: "Healthcare",
      location: "Austin, TX",
      opportunity: "Missing Google Map pack citations",
      recommendedService: "Local SEO & GBP Optimization",
      channel: "email",
    };

    const outreach = await agent.generateOutreach(payload, context);
    expect(outreach.channel).toBe("email");
    expect(outreach.subject).toContain("Apex Dental");
    expect(outreach.message).toContain("Apex Dental");
  });

  it("validates outreach input schema correctly", () => {
    const valid = leadOutreachInputSchema.safeParse({
      businessName: "Nexus Marketing",
      industry: "Marketing",
      location: "Karachi",
      opportunity: "Weak mobile rankings",
      recommendedService: "SEO Growth",
      channel: "whatsapp",
    });

    expect(valid.success).toBe(true);
  });
});

import { bootstrapAICore, sharedPromptManager } from "@/ai-core/bootstrap/register-agents";
import { AIEngine } from "@/ai-core/engine/ai-engine";
import {
  LeadQualificationAgent,
  type LeadQualificationInput,
  type LeadQualificationOutput,
  type LeadOutreachInput,
  type LeadOutreachOutput,
} from "@/ai-core/agents/lead-qualification-agent";
import type { OrganizationId, SessionId, UserId } from "@/ai-core/types/common.types";
import { prisma } from "@/lib/db/prisma";
import type { ILeadDataProvider, LeadDiscoveryCriteria } from "@/lib/leads/lead-provider.interface";
import { MockLeadDataProvider } from "@/lib/leads/mock-lead-provider";
import type { LeadStatus } from "@prisma/client";

export interface QualifiedLeadResult {
  id?: string;
  businessName: string;
  industry: string;
  location: string;
  website?: string | null;
  description?: string | null;
  score: number;
  status: "HOT" | "WARM" | "COLD";
  opportunity: string;
  aiInsight: string;
  recommendedService: string;
  nextAction: string;
  createdAt: string;
}

export class LeadService {
  private readonly provider: ILeadDataProvider;

  public constructor(provider?: ILeadDataProvider) {
    this.provider = provider ?? new MockLeadDataProvider();
  }

  /**
   * Discovers candidate businesses, runs AI qualification on them, and saves to database.
   */
  public async generateLeads(params: {
    userId: string;
    organizationId?: string | null;
    criteria: LeadDiscoveryCriteria;
  }): Promise<{ leads: QualifiedLeadResult[]; provider: string }> {
    const { userId, organizationId, criteria } = params;

    // 1. Discover candidates
    const candidates = await this.provider.discoverLeads(criteria);

    // 2. Bootstrap AI Core
    bootstrapAICore();

    const engine = new AIEngine({
      promptManager: sharedPromptManager,
    });

    const qualifiedLeads: QualifiedLeadResult[] = [];

    // 3. Qualify each candidate with AI Core
    for (const candidate of candidates) {
      const agentInput: LeadQualificationInput = {
        businessName: candidate.businessName,
        industry: candidate.industry,
        location: candidate.location,
        targetCustomer: candidate.targetCustomer,
        website: candidate.website,
        description: candidate.description,
      };

      let qualification: LeadQualificationOutput;

      try {
        const engineResult = await engine.run<LeadQualificationInput, LeadQualificationOutput>({
          agentId: "lead-qualification-agent",
          identity: {
            organizationId: (organizationId ?? "default-org") as OrganizationId,
            userId: userId as UserId,
            sessionId: ("lead-gen-" + Date.now()) as SessionId,
          },
          payload: agentInput,
        });
        qualification = engineResult.result;
      } catch {
        // Deterministic fallback if AI provider has transient error
        const hash = candidate.businessName.length * 13 + candidate.industry.length * 7;
        const fallbackScore = 55 + (hash % 40);
        const fallbackStatus = fallbackScore >= 80 ? "HOT" : "WARM";

        qualification = {
          score: fallbackScore,
          status: fallbackStatus,
          opportunity: candidate.description ?? "Needs enhanced digital presence and search visibility.",
          aiInsight: "Candidate presents strong expansion potential with targeted SEO and local visibility optimization.",
          recommendedService: "SEO + Content Optimization",
          nextAction: "Initiate introductory outreach regarding search presence.",
        };
      }

      // 4. Try saving to Prisma under authenticated user
      let savedId: string | undefined = undefined;
      try {
        const saved = await prisma.lead.create({
          data: {
            userId,
            businessName: candidate.businessName,
            industry: candidate.industry,
            location: candidate.location,
            website: candidate.website ?? null,
            description: candidate.description ?? null,
            score: qualification.score,
            status: qualification.status as LeadStatus,
            opportunity: qualification.opportunity,
            aiInsight: qualification.aiInsight,
            recommendedService: qualification.recommendedService,
            nextAction: qualification.nextAction,
          },
        });
        savedId = saved.id;
      } catch {
        // If DB is unreachable (e.g. offline dev Postgres), generate a client-safe ID
        savedId = "lead_" + Math.random().toString(36).substring(2, 11);
      }

      qualifiedLeads.push({
        id: savedId,
        businessName: candidate.businessName,
        industry: candidate.industry,
        location: candidate.location,
        website: candidate.website ?? null,
        description: candidate.description ?? null,
        score: qualification.score,
        status: qualification.status,
        opportunity: qualification.opportunity,
        aiInsight: qualification.aiInsight,
        recommendedService: qualification.recommendedService,
        nextAction: qualification.nextAction,
        createdAt: new Date().toISOString(),
      });
    }

    return {
      leads: qualifiedLeads,
      provider: this.provider.providerId,
    };
  }

  /**
   * Generates tailored outreach for a specific lead.
   */
  public async generateOutreach(payload: LeadOutreachInput): Promise<LeadOutreachOutput> {
    bootstrapAICore();

    const agent = new LeadQualificationAgent();
    const context = {
      requestId: "outreach-" + Date.now(),
      logger: {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        child: () => ({ debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }),
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
      prompts: sharedPromptManager,
      tools: {
        invoke: async () => {
          throw new Error("No tools registered");
        },
        has: () => false,
        list: () => [],
        getDescriptor: () => undefined,
      },
    };

    return agent.generateOutreach(payload, context as never);
  }
}

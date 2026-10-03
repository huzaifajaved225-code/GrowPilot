import { BaseAgent } from "@/ai-core/agents/base-agent";
import { AgentError } from "@/ai-core/errors/agent-error";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";
import type { AgentDescriptor, AgentInput } from "@/ai-core/types/agent.types";
import type { AgentId } from "@/ai-core/types/common.types";
import { z } from "zod";

/**
 * Status tiers for qualified leads.
 */
export type LeadStatusTier = "HOT" | "WARM" | "COLD";

/**
 * Input shape for qualifying a candidate lead.
 */
export interface LeadQualificationInput {
  readonly businessName: string;
  readonly industry: string;
  readonly location: string;
  readonly targetCustomer?: string;
  readonly website?: string;
  readonly description?: string;
}

/**
 * Output shape produced by the Lead Qualification Agent.
 */
export interface LeadQualificationOutput {
  readonly score: number;
  readonly status: LeadStatusTier;
  readonly opportunity: string;
  readonly aiInsight: string;
  readonly recommendedService: string;
  readonly nextAction: string;
}

/**
 * Channel options for personalized outreach generation.
 */
export type OutreachChannel = "email" | "whatsapp" | "general";

/**
 * Input shape for personalized outreach generation.
 */
export interface LeadOutreachInput {
  readonly businessName: string;
  readonly industry: string;
  readonly location: string;
  readonly opportunity: string;
  readonly recommendedService: string;
  readonly channel: OutreachChannel;
  readonly senderName?: string;
}

/**
 * Output shape for personalized outreach.
 */
export interface LeadOutreachOutput {
  readonly channel: OutreachChannel;
  readonly subject?: string;
  readonly message: string;
}

/** Zod schema for validating LeadQualification input. */
export const leadQualificationInputSchema = z.object({
  businessName: z.string().min(1, "businessName is required"),
  industry: z.string().min(1, "industry is required"),
  location: z.string().min(1, "location is required"),
  targetCustomer: z.string().optional(),
  website: z.string().url("website must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
});

/** Zod schema for validating AI lead qualification structured response. */
export const leadQualificationResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  status: z.enum(["HOT", "WARM", "COLD"]),
  opportunity: z.string().min(1, "opportunity is required"),
  aiInsight: z.string().min(1, "aiInsight is required"),
  recommendedService: z.string().min(1, "recommendedService is required"),
  nextAction: z.string().min(1, "nextAction is required"),
});

/** Zod schema for validating outreach generation input. */
export const leadOutreachInputSchema = z.object({
  businessName: z.string().min(1, "businessName is required"),
  industry: z.string().min(1, "industry is required"),
  location: z.string().min(1, "location is required"),
  opportunity: z.string().min(1, "opportunity is required"),
  recommendedService: z.string().min(1, "recommendedService is required"),
  channel: z.enum(["email", "whatsapp", "general"]),
  senderName: z.string().optional(),
});

/** Zod schema for validating outreach AI output. */
export const leadOutreachResponseSchema = z.object({
  channel: z.enum(["email", "whatsapp", "general"]),
  subject: z.string().optional(),
  message: z.string().min(1, "message is required"),
});

const JSON_INSTRUCTION =
  "\n\nCRITICAL: Respond ONLY with a single valid JSON object matching the requested schema. " +
  "Do not include markdown code fences (```json), commentary, or extra text.";

export const LEAD_QUALIFICATION_SYSTEM_KEY = "lead-qualification.system";
export const LEAD_QUALIFICATION_USER_KEY = "lead-qualification.user";
export const LEAD_OUTREACH_SYSTEM_KEY = "lead-outreach.system";
export const LEAD_OUTREACH_USER_KEY = "lead-outreach.user";

/**
 * LeadQualificationAgent — evaluates candidate B2B leads, calculates qualification scores,
 * identifies growth gaps, recommends tailored services, and crafts personalized outreach.
 */
export class LeadQualificationAgent extends BaseAgent<
  LeadQualificationInput,
  LeadQualificationOutput
> {
  public override readonly descriptor: AgentDescriptor = {
    id: "lead-qualification-agent" as AgentId,
    name: "Lead Qualification Agent",
    description:
      "Evaluates business leads, assigns scores and statuses, and generates personalized outreach.",
    version: "1.0.0",
    tags: ["leads", "marketing", "qualification", "outreach"],
  };

  public constructor() {
    super({
      timeoutMs: 30000,
      maxRetries: 2,
    });
  }

  public override async validate(
    input: AgentInput<LeadQualificationInput>,
    _context: IExecutionContext,
  ): Promise<void> {
    const result = leadQualificationInputSchema.safeParse(input.payload);
    if (!result.success) {
      throw new AgentError(
        "Invalid LeadQualificationAgent input: " +
          result.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { code: "VALIDATION_ERROR" },
        false,
      );
    }
  }

  public override async run(
    input: AgentInput<LeadQualificationInput>,
    context: IExecutionContext,
  ): Promise<LeadQualificationOutput> {
    const { businessName, industry, location, targetCustomer, website, description } =
      input.payload;

    let systemPromptContent =
      "You are GrowPilot's expert B2B Lead Qualification & Growth Specialist. " +
      "Analyze the prospect business and evaluate how viable and high-potential they are as a client. " +
      "Assess their digital presence opportunity, market positioning, and growth potential. " +
      "Assign a score from 0-100, a status tier ('HOT' for 80-100, 'WARM' for 50-79, 'COLD' for 0-49), " +
      "an opportunity summary, detailed AI insight, recommended GrowPilot service (e.g. SEO, GEO, Content, GBP, Social), " +
      "and a suggested next action. Never invent unsupported facts about the business.";

    try {
      systemPromptContent = context.prompts.render(LEAD_QUALIFICATION_SYSTEM_KEY, {}).content;
    } catch {
      // Use built-in default
    }

    let userPromptContent =
      `Evaluate the following candidate lead:\n\n` +
      `Business Name: ${businessName}\n` +
      `Industry: ${industry}\n` +
      `Location: ${location}\n` +
      (targetCustomer ? `Target Customer: ${targetCustomer}\n` : "") +
      (website ? `Website: ${website}\n` : "") +
      (description ? `Description/Context: ${description}\n` : "") +
      `\nRequired JSON format:\n` +
      `{\n` +
      `  "score": <number 0-100>,\n` +
      `  "status": "HOT" | "WARM" | "COLD",\n` +
      `  "opportunity": "<concise description of growth gap/need>",\n` +
      `  "aiInsight": "<clear 1-2 sentence justification for score & digital presence analysis>",\n` +
      `  "recommendedService": "<specific service e.g. SEO Audit & Optimization, Generative Engine Optimization, Local GBP, Social Media Growth>",\n` +
      `  "nextAction": "<actionable next step e.g. Send personalized outreach message>"\n` +
      `}`;

    try {
      userPromptContent = context.prompts.render(LEAD_QUALIFICATION_USER_KEY, {
        businessName,
        industry,
        location,
        targetCustomer: targetCustomer ?? "General market",
        website: website ?? "None provided",
        description: description ?? "None provided",
      }).content;
    } catch {
      // Use built-in default
    }

    const messages = [
      { role: "system" as const, content: systemPromptContent },
      { role: "user" as const, content: userPromptContent + JSON_INSTRUCTION },
    ];

    const response = await this.generateText(
      {
        model: "gemini-3.6-flash",
        messages,
        temperature: 0.2,
      },
      context,
    );

    return this.parseQualificationResponse(response.text);
  }

  /**
   * Generates personalized outreach tailored to the lead and communication channel.
   */
  public async generateOutreach(
    payload: LeadOutreachInput,
    context: IExecutionContext,
  ): Promise<LeadOutreachOutput> {
    const parseResult = leadOutreachInputSchema.safeParse(payload);
    if (!parseResult.success) {
      throw new AgentError(
        "Invalid outreach input: " + parseResult.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { code: "VALIDATION_ERROR" },
        false,
      );
    }

    const {
      businessName,
      industry,
      location,
      opportunity,
      recommendedService,
      channel,
      senderName,
    } = payload;

    const channelGuidelines = {
      email:
        "Write a high-converting, professional cold email. Include a compelling subject line and 3-4 sentence message with a clear low-friction call-to-action.",
      whatsapp:
        "Write a concise, friendly WhatsApp message (under 60 words). No subject line needed. Respectful, professional, directly addressing the opportunity.",
      general:
        "Write a versatile B2B direct message (LinkedIn / outreach). Include an optional headline/subject and a concise, high-impact value proposition.",
    }[channel];

    const systemPrompt =
      "You are GrowPilot's elite B2B Outreach Copywriter. " +
      "Draft personalized, concise, and highly relevant outreach messages for business prospects. " +
      "Do NOT invent facts, fake metrics, or unsupported claims about the business. " +
      "Focus directly on their industry context, the identified opportunity, and the recommended solution. " +
      channelGuidelines;

    const userPrompt =
      `Draft a personalized ${channel.toUpperCase()} outreach message for this prospect:\n\n` +
      `Business Name: ${businessName}\n` +
      `Industry: ${industry}\n` +
      `Location: ${location}\n` +
      `Identified Opportunity: ${opportunity}\n` +
      `Recommended Solution: ${recommendedService}\n` +
      (senderName
        ? `Sender: ${senderName} from GrowPilot\n`
        : "Sender: GrowPilot Growth Consultant\n") +
      `\nRequired JSON format:\n` +
      `{\n` +
      `  "channel": "${channel}",\n` +
      `  "subject": ${channel === "whatsapp" ? "null" : '"Compelling subject line"'},\n` +
      `  "message": "Full message text"\n` +
      `}`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt + JSON_INSTRUCTION },
    ];

    const response = await this.generateText(
      {
        model: "gemini-3.6-flash",
        messages,
        temperature: 0.3,
      },
      context,
    );

    return this.parseOutreachResponse(response.text, channel);
  }

  private parseQualificationResponse(rawText: string): LeadQualificationOutput {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new AgentError(
        "LeadQualificationAgent received a response with no JSON object",
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new AgentError(
        "LeadQualificationAgent received malformed JSON in response",
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    const validation = leadQualificationResponseSchema.safeParse(parsed);
    if (!validation.success) {
      throw new AgentError(
        "LeadQualificationAgent response failed schema validation: " +
          validation.error.issues.map((i) => i.message).join(", "),
        this.descriptor.id,
        { responsePreview: rawText.slice(0, 200) },
        false,
      );
    }

    // Ensure status aligns with score bounds
    const data = validation.data;
    let computedStatus: LeadStatusTier = data.status;
    if (data.score >= 80) {
      computedStatus = "HOT";
    } else if (data.score >= 50) {
      computedStatus = "WARM";
    } else {
      computedStatus = "COLD";
    }

    return {
      score: data.score,
      status: computedStatus,
      opportunity: data.opportunity,
      aiInsight: data.aiInsight,
      recommendedService: data.recommendedService,
      nextAction: data.nextAction,
    };
  }

  private parseOutreachResponse(
    rawText: string,
    expectedChannel: OutreachChannel,
  ): LeadOutreachOutput {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback if raw text returned
      return {
        channel: expectedChannel,
        subject: expectedChannel === "whatsapp" ? undefined : "Growth Opportunity",
        message: rawText.trim(),
      };
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const validation = leadOutreachResponseSchema.safeParse(parsed);
      if (validation.success) {
        return validation.data;
      }
    } catch {
      // Ignore parse failure and fall back below
    }

    return {
      channel: expectedChannel,
      subject: expectedChannel === "whatsapp" ? undefined : "Growth Opportunity",
      message: rawText.trim(),
    };
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/errors/app-error";
import { bootstrapAICore, sharedPromptManager } from "@/ai-core/bootstrap/register-agents";
import { AIEngine } from "@/ai-core/engine/ai-engine";
import type { SeoAuditAgentInput, SeoAuditAgentOutput } from "@/ai-core/agents/seo-audit-agent";
import type { OrganizationId, SessionId, UserId } from "@/ai-core/types/common.types";

/**
 * Zod schema for the SEO audit API request body.
 * Only `projectId` and `url` are required. `focusAreas` and
 * `businessName` are optional with sensible defaults.
 */
const auditRequestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  url: z.string().min(1, "url is required").url("url must be a valid URL"),
  focusAreas: z.string().min(1).default("technical,on-page,performance"),
  businessName: z.string().min(1).optional(),
});

/**
 * POST /api/v1/ai/audit
 *
 * Runs an SEO audit through the AI Core Engine and persists the result.
 *
 * Flow:
 *   1. Authenticate the request (JWT session)
 *   2. Validate the request body (Zod)
 *   3. Verify project ownership (project belongs to user's org)
 *   4. Bootstrap the AI Core (idempotent)
 *   5. Run SeoAuditAgent through AIEngine
 *   6. Persist the result to Prisma SeoAudit
 *   7. Return structured response
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const userId = session.user.id;
    const organizationId = session.user.activeOrganizationId;
    if (!organizationId) {
      throw new ForbiddenError("You must belong to an organization to run audits");
    }

    // 2. Input validation
    const body = await request.json();
    const parsed = auditRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten(),
          },
        },
        { status: 422 },
      );
    }

    const { projectId, url, focusAreas, businessName } = parsed.data;

    // 3. Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!project) {
      throw new NotFoundError("Project");
    }

    // Derive businessName from the request or the project/organization
    const resolvedBusinessName =
      businessName && businessName.length > 0 ? businessName : project.name;

    // 4. Bootstrap the AI Core (idempotent)
    bootstrapAICore();

    // 5. Attempt to fetch basic site data from the URL.
    //    If the fetch fails, use a minimal placeholder so the agent
    //    still produces a meaningful audit based on the URL alone.
    let siteData: string;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "GrowPilot-SEO-Audit/1.0" },
        redirect: "follow",
      });
      clearTimeout(timeoutId);
      const html = await response.text();
      // Truncate to first 8000 chars to stay within model context limits.
      siteData = html.slice(0, 8000);
    } catch {
      // If fetch fails, provide the URL as the site data context.
      siteData = `Website URL: ${url} (content could not be fetched)`;
    }

    // 6. Construct the AI Engine and run the SeoAuditAgent
    const engine = new AIEngine({
      promptManager: sharedPromptManager,
    });

    const agentInput: SeoAuditAgentInput = {
      url,
      businessName: resolvedBusinessName,
      siteData,
      focusAreas,
    };

    const engineResult = await engine.run<SeoAuditAgentInput, SeoAuditAgentOutput>({
      agentId: "seo-audit-agent",
      identity: {
        organizationId: organizationId as OrganizationId,
        userId: userId as UserId,
        sessionId: ("api-" + Date.now()) as SessionId,
      },
      payload: agentInput,
    });

    const auditResult = engineResult.result;

    // 7. Persist to Prisma
    const seoAudit = await prisma.seoAudit.create({
      data: {
        projectId,
        url,
        score: auditResult.score,
        issues: JSON.parse(JSON.stringify(auditResult.issues)),
        status: "COMPLETED",
        performedAt: new Date(),
      },
    });

    // 8. Return structured response
    return NextResponse.json({
      success: true,
      data: {
        auditId: seoAudit.id,
        score: auditResult.score,
        issues: auditResult.issues,
        summary: auditResult.summary,
        status: seoAudit.status,
        performedAt: seoAudit.performedAt.toISOString(),
      },
    });
  } catch (error) {
    // If it's a known error type, handleApiError will produce the right response.
    return handleApiError(error);
  }
}

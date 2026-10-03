import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError, NotFoundError, ForbiddenError } from "@/lib/errors/app-error";
import { bootstrapAICore, sharedPromptManager } from "@/ai-core/bootstrap/register-agents";
import { AIEngine } from "@/ai-core/engine/ai-engine";
import type { GeoAuditAgentInput, GeoAuditAgentOutput } from "@/ai-core/agents/geo-audit-agent";
import type { OrganizationId, SessionId, UserId } from "@/ai-core/types/common.types";

/**
 * Zod schema for the GEO audit API request body.
 * `projectId` and `url` are required. `focusAreas` and
 * `businessName` are optional with sensible defaults.
 */
const geoAuditRequestSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  url: z.string().min(1, "url is required").url("url must be a valid URL"),
  focusAreas: z
    .array(z.string().min(1))
    .min(1, "At least one focus area is required")
    .default([
      "ai-visibility",
      "entity-understanding",
      "content-authority",
      "citations",
      "structured-data",
    ]),
  businessName: z.string().min(1).optional(),
});

/**
 * POST /api/v1/ai/geo-audit
 *
 * Runs a GEO audit through the AI Core Engine and persists the result.
 *
 * Flow:
 *   1. Authenticate the request (JWT session)
 *   2. Validate the request body (Zod)
 *   3. Verify project ownership (project belongs to user's org)
 *   4. Bootstrap the AI Core (idempotent)
 *   5. Run GeoAuditAgent through AIEngine
 *   6. Persist the result to Prisma GeoInsight
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
      throw new ForbiddenError("You must belong to an organization to run GEO audits");
    }

    // 2. Input validation
    const body = await request.json();
    const parsed = geoAuditRequestSchema.safeParse(body);
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

    // Derive businessName from the request or the project
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
        headers: { "User-Agent": "GrowPilot-GEO-Audit/1.0" },
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

    // 6. Construct the AI Engine and run the GeoAuditAgent
    const engine = new AIEngine({
      promptManager: sharedPromptManager,
    });

    const focusAreasString = focusAreas.join(",");

    const agentInput: GeoAuditAgentInput = {
      url,
      businessName: resolvedBusinessName,
      siteData,
      focusAreas: focusAreasString,
    };

    const engineResult = await engine.run<GeoAuditAgentInput, GeoAuditAgentOutput>({
      agentId: "geo-audit-agent",
      identity: {
        organizationId: organizationId as OrganizationId,
        userId: userId as UserId,
        sessionId: ("api-geo-" + Date.now()) as SessionId,
      },
      payload: agentInput,
    });

    const auditResult = engineResult.result;

    // 7. Persist to Prisma GeoInsight
    //    Store score in visibilityScore, full audit data in mentions JSON.
    const geoInsight = await prisma.geoInsight.create({
      data: {
        projectId,
        aiEngine: "OTHER",
        visibilityScore: auditResult.score,
        mentions: JSON.parse(
          JSON.stringify({
            summary: auditResult.summary,
            issues: auditResult.issues,
            opportunities: auditResult.opportunities ?? [],
          }),
        ),
        checkedAt: new Date(),
      },
    });

    // 8. Return structured response
    return NextResponse.json({
      success: true,
      data: {
        insightId: geoInsight.id,
        score: auditResult.score,
        summary: auditResult.summary,
        issues: auditResult.issues,
        opportunities: auditResult.opportunities ?? [],
        performedAt: geoInsight.checkedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError } from "@/lib/errors/app-error";
import type { LeadStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const getLeadsQuerySchema = z.object({
  status: z.enum(["HOT", "WARM", "COLD"]).optional(),
  search: z.string().optional(),
  sortBy: z.enum(["score", "createdAt", "businessName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * GET /api/leads
 *
 * Retrieves the authenticated user's leads with filters, search, and summary metrics.
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const parsed = getLeadsQuerySchema.safeParse(queryParams);

    if (!parsed.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 422 },
      );
    }

    const { status, search, sortBy, sortOrder, limit, page } = parsed.data;
    const skip = (page - 1) * limit;

    try {
      const whereClause: {
        userId: string;
        status?: LeadStatus;
        OR?: Array<{
          businessName?: { contains: string; mode: "insensitive" };
          industry?: { contains: string; mode: "insensitive" };
          location?: { contains: string; mode: "insensitive" };
        }>;
      } = {
        userId,
      };

      if (status) {
        whereClause.status = status as LeadStatus;
      }

      if (search && search.trim().length > 0) {
        whereClause.OR = [
          { businessName: { contains: search.trim(), mode: "insensitive" } },
          { industry: { contains: search.trim(), mode: "insensitive" } },
          { location: { contains: search.trim(), mode: "insensitive" } },
        ];
      }

      const [leads, totalCount, hotCount, warmCount, coldCount, allUserLeads] = await Promise.all([
        prisma.lead.findMany({
          where: whereClause,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.lead.count({ where: whereClause }),
        prisma.lead.count({ where: { userId, status: "HOT" } }),
        prisma.lead.count({ where: { userId, status: "WARM" } }),
        prisma.lead.count({ where: { userId, status: "COLD" } }),
        prisma.lead.findMany({
          where: { userId },
          select: { score: true },
        }),
      ]);

      const avgScore =
        allUserLeads.length > 0
          ? Math.round(allUserLeads.reduce((acc, curr) => acc + curr.score, 0) / allUserLeads.length)
          : 0;

      return NextResponse.json({
        success: true,
        data: {
          leads,
          pagination: {
            total: totalCount,
            page,
            limit,
            totalPages: Math.ceil(totalCount / limit) || 1,
          },
          summary: {
            totalLeads: allUserLeads.length,
            hotLeads: hotCount,
            warmLeads: warmCount,
            coldLeads: coldCount,
            averageScore: avgScore,
          },
        },
      });
    } catch {
      // If database is offline in dev environment, return empty list gracefully
      return NextResponse.json({
        success: true,
        data: {
          leads: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 1,
          },
          summary: {
            totalLeads: 0,
            hotLeads: 0,
            warmLeads: 0,
            coldLeads: 0,
            averageScore: 0,
          },
        },
      });
    }
  } catch (error) {
    return handleApiError(error);
  }
}

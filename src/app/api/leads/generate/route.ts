import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError } from "@/lib/errors/app-error";
import { LeadService } from "@/lib/leads/lead-service";

export const dynamic = "force-dynamic";

const generateLeadsSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  location: z.string().min(1, "Location is required"),
  targetCustomer: z.string().optional(),
  website: z.string().url("Website must be a valid URL").optional().or(z.literal("")),
  count: z.coerce.number().int().min(1).max(30).default(10),
});

/**
 * POST /api/leads/generate
 *
 * Generates and qualifies leads based on industry, location, and target customer.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const parsed = generateLeadsSchema.safeParse(body);

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

    const { industry, location, targetCustomer, website, count } = parsed.data;

    const leadService = new LeadService();
    const result = await leadService.generateLeads({
      userId: session.user.id,
      organizationId: session.user.activeOrganizationId,
      criteria: {
        industry,
        location,
        targetCustomer,
        website: website || undefined,
        count,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        leads: result.leads,
        count: result.leads.length,
        provider: result.provider,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

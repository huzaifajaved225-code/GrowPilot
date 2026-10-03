import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError } from "@/lib/errors/app-error";
import { LeadService } from "@/lib/leads/lead-service";

export const dynamic = "force-dynamic";

const outreachRequestSchema = z.object({
  businessName: z.string().min(1, "businessName is required"),
  industry: z.string().min(1, "industry is required"),
  location: z.string().min(1, "location is required"),
  opportunity: z.string().min(1, "opportunity is required"),
  recommendedService: z.string().min(1, "recommendedService is required"),
  channel: z.enum(["email", "whatsapp", "general"]),
  senderName: z.string().optional(),
});

/**
 * POST /api/leads/outreach
 *
 * Generates personalized, professional outreach copy across Email, WhatsApp, or General outreach channels.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const body = await request.json();
    const parsed = outreachRequestSchema.safeParse(body);

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

    const leadService = new LeadService();
    const result = await leadService.generateOutreach({
      ...parsed.data,
      senderName: parsed.data.senderName || session.user.name || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

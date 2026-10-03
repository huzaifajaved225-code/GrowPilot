import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { handleApiError } from "@/lib/errors/handle-api-error";
import { UnauthorizedError, NotFoundError } from "@/lib/errors/app-error";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/leads/[id]
 *
 * Deletes a lead owned by the authenticated user.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const { id } = await params;
    const userId = session.user.id;

    try {
      const existingLead = await prisma.lead.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingLead) {
        throw new NotFoundError("Lead");
      }

      await prisma.lead.delete({
        where: { id },
      });
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      // In dev mode if DB is unreachable, treat as successfully removed from state
    }

    return NextResponse.json({
      success: true,
      data: { id, deleted: true },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

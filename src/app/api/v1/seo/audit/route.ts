import { NextRequest, NextResponse } from "next/server";
import { runSeoAudit } from "@/lib/seo/audit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.website) {
      return NextResponse.json(
        { success: false, message: "Website URL is required" },
        { status: 400 }
      );
    }

    const result = await runSeoAudit({
      website: body.website,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
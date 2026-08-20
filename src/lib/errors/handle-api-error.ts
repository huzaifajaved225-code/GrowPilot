import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors/app-error";
import { PermissionDeniedError } from "@/lib/auth/permissions";

export interface ApiErrorBody {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Every `route.ts` should wrap its logic in try/catch and pass the
 * caught error to this function so the client always receives the
 * same `{ data, error }` envelope regardless of what failed.
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: error.flatten(),
        },
      },
      { status: 422 },
    );
  }

  if (error instanceof PermissionDeniedError) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "FORBIDDEN", message: error.message },
      },
      { status: 403 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        data: null,
        error: { code: error.code, message: error.message, details: error.details },
      },
      { status: error.statusCode },
    );
  }

  console.error("Unhandled API error:", error);

  return NextResponse.json(
    {
      data: null,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" },
    },
    { status: 500 },
  );
}

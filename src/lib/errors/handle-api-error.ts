import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/lib/errors/app-error";
import { AIError } from "@/ai-core/errors/ai-error";
import { PermissionDeniedError } from "@/lib/auth/permissions";

/** Detail keys that must never reach the client — redacted from every error response. */
const SENSITIVE_DETAIL_KEYS = new Set([
  "apikey",
  "api_key",
  "secret",
  "token",
  "password",
  "authorization",
  "credential",
  "credentials",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
]);

function sanitizeErrorDetails(details: unknown): unknown {
  if (details === null || details === undefined) return details;
  if (Array.isArray(details)) return details.map(sanitizeErrorDetails);
  if (typeof details === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      if (SENSITIVE_DETAIL_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeErrorDetails(value);
      }
    }
    return sanitized;
  }
  return details;
}

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

  if (error instanceof AIError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: sanitizeErrorDetails(error.details),
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: error.code,
          message: error.message,
          details: sanitizeErrorDetails(error.details),
        },
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

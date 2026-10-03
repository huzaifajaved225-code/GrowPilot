import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Single source of truth for environment variables. Importing from
 * "@/lib/env" instead of using `process.env` directly guarantees every
 * value is present and correctly typed before the app boots — an
 * invalid or missing variable throws at startup, not at 2am in prod.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  AUTH_SECRET: isProduction
    ? z.string().min(1, "AUTH_SECRET is required in production")
    : z.string().min(1).default("growpilot-dev-secret-key-at-least-32-chars-long"),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),

  EMAIL_FROM: z.string().regex(/^(?:.+<.+@.+>|\S+@\S+)$/).optional(),
  RESEND_API_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  REDIS_URL: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
  AI_DEFAULT_PROVIDER: z.string().optional(),
  AI_FALLBACK_PROVIDERS: z.string().optional(),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().min(1000).optional(),
  AI_PROVIDER_MAX_RETRIES: z.coerce.number().int().min(0).max(5).optional(),
  AI_PROVIDER_RETRY_BACKOFF_MS: z.coerce.number().int().min(0).optional(),

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.flatten().fieldErrors;
    console.error("❌ Invalid environment variables:", JSON.stringify(formatted, null, 2));
    throw new Error("Invalid environment variables. Check the log above and your .env file.");
  }

  return parsed.data;
}

export const env = loadEnv();

import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

/**
 * Prisma must be instantiated once and reused across hot-reloads in
 * development, and across invocations of the same serverless function
 * in production, otherwise every reload/invocation opens a fresh
 * connection pool and quickly exhausts Postgres connections.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

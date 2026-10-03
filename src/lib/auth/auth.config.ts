import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

import { env } from "@/lib/env";

/**
 * Edge-compatible Auth.js configuration. Kept separate from `auth.ts`
 * (which adds the Prisma adapter and Credentials provider) so this
 * object alone can be imported by `middleware.ts`, which runs on the
 * Edge runtime and cannot use the Prisma Node client.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/verify-email",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname } = request.nextUrl;

      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/seo") ||
        pathname.startsWith("/geo") ||
        pathname.startsWith("/aeo") ||
        pathname.startsWith("/content") ||
        pathname.startsWith("/analytics") ||
        pathname.startsWith("/gbp") ||
        pathname.startsWith("/social") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/team") ||
        pathname.startsWith("/billing") ||
        pathname.startsWith("/settings");

      if (isProtectedRoute) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;

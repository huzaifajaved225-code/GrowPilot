import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - static files (_next/static, _next/image, favicon.ico)
     * - public assets
     * - API auth routes (handled internally by Auth.js)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

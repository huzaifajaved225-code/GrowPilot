import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/lib/auth/auth.config";
import { prisma } from "@/lib/db/prisma";
import type { OrgRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      globalRole: "USER" | "SUPERADMIN";
      activeOrganizationId: string | null;
      activeOrganizationRole: OrgRole | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    globalRole: "USER" | "SUPERADMIN";
    activeOrganizationId: string | null;
    activeOrganizationRole: OrgRole | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            memberships: {
              orderBy: { joinedAt: "asc" },
              take: 1,
            },
          },
        });

        token.globalRole = dbUser?.globalRole ?? "USER";
        token.activeOrganizationId = dbUser?.memberships[0]?.organizationId ?? null;
        token.activeOrganizationRole = dbUser?.memberships[0]?.role ?? null;
      }

      // Allow the client to request an organization switch via `update()`.
      if (trigger === "update" && session?.activeOrganizationId) {
        const membership = await prisma.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: token.id,
              organizationId: session.activeOrganizationId as string,
            },
          },
        });

        if (membership) {
          token.activeOrganizationId = membership.organizationId;
          token.activeOrganizationRole = membership.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.globalRole = token.globalRole;
      session.user.activeOrganizationId = token.activeOrganizationId;
      session.user.activeOrganizationRole = token.activeOrganizationRole;
      return session;
    },
  },
});

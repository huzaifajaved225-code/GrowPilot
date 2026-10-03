import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

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

  interface User {
    globalRole?: "USER" | "SUPERADMIN";
    activeOrganizationId?: string | null;
    activeOrganizationRole?: OrgRole | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    globalRole?: "USER" | "SUPERADMIN";
    activeOrganizationId?: string | null;
    activeOrganizationRole?: OrgRole | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(authConfig.providers ?? []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.emailVerified) return null;

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          globalRole: user.globalRole,
        };
      },
    }),
  ],
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
      if (
        trigger === "update" &&
        session &&
        typeof session === "object" &&
        "activeOrganizationId" in session
      ) {
        const activeOrgId = (session as { activeOrganizationId?: string | null }).activeOrganizationId;
        if (activeOrgId && typeof token.id === "string") {
          const membership = await prisma.membership.findUnique({
            where: {
              userId_organizationId: {
                userId: token.id,
                organizationId: activeOrgId,
              },
            },
          });

          if (membership) {
            token.activeOrganizationId = membership.organizationId;
            token.activeOrganizationRole = membership.role;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        if (typeof token.id === "string") {
          session.user.id = token.id;
        }
        session.user.globalRole = (token.globalRole as "USER" | "SUPERADMIN") ?? "USER";
        session.user.activeOrganizationId = (token.activeOrganizationId as string | null) ?? null;
        session.user.activeOrganizationRole = (token.activeOrganizationRole as OrgRole | null) ?? null;
      }
      return session;
    },
  },
});

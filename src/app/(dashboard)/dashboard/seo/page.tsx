import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { SeoAuditPanel } from "@/components/seo/seo-audit-panel";
import { Search } from "lucide-react";

/**
 * SEO Audit page — server component that fetches the user's projects
 * and passes them to the client-side audit panel.
 *
 * Rendered inside the dashboard layout (sidebar + header).
 */
export default async function SeoAuditPage(): Promise<React.JSX.Element> {
  const session = await auth();

  let projects: { id: string; name: string; websiteUrl: string }[] = [];

  if (session?.user?.activeOrganizationId) {
    projects = await prisma.project.findMany({
      where: {
        organizationId: session.user.activeOrganizationId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        websiteUrl: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          SEO Audit
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          SEO Audit
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Analyze your website for SEO issues and get actionable recommendations.
        </p>
      </div>

      {/* Audit Panel */}
      <SeoAuditPanel projects={projects} />
    </div>
  );
}

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { GeoAuditPanel } from "@/components/geo/geo-audit-panel";
import { Globe } from "lucide-react";

/**
 * GEO Audit page — server component that fetches the user's projects
 * and passes them to the client-side GEO audit panel.
 *
 * Rendered inside the dashboard layout (sidebar + header).
 */
export default async function GeoAuditPage(): Promise<React.JSX.Element> {
  const session = await auth();

  let projects: { id: string; name: string; websiteUrl: string; industry: string | null }[] = [];

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
        industry: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="h-4 w-4" />
          GEO Audit
        </div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          GEO Audit
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Evaluate how well your website is optimized for AI-generated answers
          and generative search engines.
        </p>
      </div>

      {/* Audit Panel */}
      <GeoAuditPanel projects={projects} />
    </div>
  );
}

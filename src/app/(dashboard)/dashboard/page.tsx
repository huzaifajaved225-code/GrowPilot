import {
  Activity,
  ArrowUpRight,
  Bot,
  Globe,
  Lightbulb,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

/* ──────────────────────────────────────────────
   Data fetching — real data from Prisma models
   ────────────────────────────────────────────── */

async function getDashboardData(organizationId: string) {
  const [projects, latestSeoAudit, latestGeoInsight, recentActivity] = await Promise.all([
    // All active projects for this org
    prisma.project.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, name: true, websiteUrl: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Latest completed SEO audit score across all org projects
    prisma.seoAudit.findFirst({
      where: {
        project: { organizationId },
        status: "COMPLETED",
        score: { not: null },
      },
      select: { score: true, performedAt: true },
      orderBy: { performedAt: "desc" },
    }),

    // Latest GEO insight visibility score across all org projects
    prisma.geoInsight.findFirst({
      where: {
        project: { organizationId },
        visibilityScore: { not: null },
      },
      select: { visibilityScore: true, checkedAt: true },
      orderBy: { checkedAt: "desc" },
    }),

    // Recent audits + insights for the activity feed
    prisma.seoAudit.findMany({
      where: {
        project: { organizationId },
        status: "COMPLETED",
      },
      select: {
        id: true,
        url: true,
        score: true,
        performedAt: true,
      },
      orderBy: { performedAt: "desc" },
      take: 5,
    }),
  ]);

  return { projects, latestSeoAudit, latestGeoInsight, recentActivity };
}

/* ──────────────────────────────────────────────
   Page component
   ────────────────────────────────────────────── */

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await auth();
  const orgId = session?.user?.activeOrganizationId;

  // Only fetch real data when the user has an active organization
  const data = orgId ? await getDashboardData(orgId) : null;

  const seoScore = data?.latestSeoAudit?.score ?? null;
  const geoScore = data?.latestGeoInsight?.visibilityScore ?? null;
  const projectCount = data?.projects.length ?? 0;
  const projectName = data?.projects[0]?.name ?? null;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Header ── */}
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            AI Growth Operating System
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome to GrowPilot</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {projectName
              ? `Managing growth for ${projectName}.`
              : "Turn your business data into an intelligent growth strategy powered by AI."}
          </p>
        </div>

        <Link href="/dashboard/seo">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Sparkles className="h-4 w-4" />
            Grow My Business
          </button>
        </Link>
      </div>

      {/* ── Metrics ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Growth Score"
          value={seoScore !== null ? String(seoScore) : "—"}
          icon={TrendingUp}
          hint={seoScore === null ? "Run an audit" : undefined}
        />
        <MetricCard
          title="SEO Score"
          value={seoScore !== null ? String(seoScore) : "—"}
          icon={Search}
          hint={seoScore === null ? "No audits yet" : undefined}
        />
        <MetricCard
          title="AI Visibility"
          value={geoScore !== null ? String(geoScore) : "—"}
          icon={Globe}
          hint={geoScore === null ? "No insights yet" : undefined}
        />
        <MetricCard
          title="Projects"
          value={String(projectCount)}
          icon={Lightbulb}
          hint={projectCount === 0 ? "Add a project" : undefined}
        />
      </div>

      {/* ── Main content ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* AI Agents */}
        <section className="rounded-xl border border-border bg-card shadow-sm lg:col-span-2">
          <div className="border-b border-border p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">AI Growth Command Center</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your AI growth agents are ready.
                </p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600">
                System Ready
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
            <AgentCard
              name="SEO Agent"
              description="Technical SEO and keyword opportunities"
              icon={Search}
              href="/dashboard/seo"
            />
            <AgentCard
              name="GEO Agent"
              description="AI search visibility optimization"
              icon={Globe}
              href="/dashboard/geo"
            />
            <AgentCard
              name="Schema Agent"
              description="Structured data & rich results"
              icon={Target}
              href="/dashboard/schema"
            />
            <AgentCard
              name="AEO Agent"
              description="Answer engine optimization"
              icon={Sparkles}
              disabled
            />
          </div>
        </section>

        {/* Activity */}
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Activity className="h-5 w-5" />
              AI Activity
            </h2>
          </div>

          <div className="space-y-5 p-4 sm:p-6">
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((audit) => (
                <div key={audit.id} className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      SEO audit — score {audit.score ?? "pending"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{audit.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {audit.performedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity. Run your first audit to see results here.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* ── Quick Actions ── */}
      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6">
          <Link href="/dashboard/seo">
            <QuickAction icon={Search} title="Run SEO Audit" />
          </Link>
          <Link href="/dashboard/geo">
            <QuickAction icon={Globe} title="Analyze GEO" />
          </Link>
          <Link href="/dashboard/schema">
            <QuickAction icon={Target} title="Schema Builder" />
          </Link>
          <button
            type="button"
            disabled
            className="flex h-16 cursor-not-allowed items-center gap-3 rounded-lg border border-border px-4 text-left text-sm font-medium text-muted-foreground/50"
          >
            <Bot className="h-5 w-5" />
            Ask GrowPilot — Coming soon
          </button>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Bot className="h-5 w-5 text-primary" />
              Ready to grow your business?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Let GrowPilot analyze your business and create a growth strategy.
            </p>
          </div>
          <Link href="/dashboard/seo">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Start AI Growth Analysis
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────── */

function MetricCard({
  title,
  value,
  icon: Icon,
  hint,
}: {
  title: string;
  value: string;
  icon: typeof Search;
  hint?: string;
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AgentCard({
  name,
  description,
  icon: Icon,
  href,
  disabled = false,
}: {
  name: string;
  description: string;
  icon: typeof Search;
  href?: string;
  disabled?: boolean;
}): React.JSX.Element {
  const content = (
    <div
      className={
        disabled
          ? "rounded-xl border border-border p-4 opacity-50"
          : "rounded-xl border border-border p-4 transition hover:bg-muted/50"
      }
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <span
          className={
            disabled
              ? "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              : "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600"
          }
        >
          {disabled ? "Soon" : "Ready"}
        </span>
      </div>
      <h3 className="mt-4 font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );

  if (disabled || !href) return content;
  return <Link href={href}>{content}</Link>;
}

function QuickAction({
  icon: Icon,
  title,
}: {
  icon: typeof Search;
  title: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="flex h-16 w-full items-center gap-3 rounded-lg border border-border px-4 text-left text-sm font-medium transition hover:bg-muted"
    >
      <Icon className="h-5 w-5 text-primary" />
      {title}
    </button>
  );
}

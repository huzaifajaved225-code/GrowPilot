"use client";

import * as React from "react";
import { Globe, AlertTriangle, AlertCircle, Info, CheckCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
  industry?: string | null;
}

interface GeoIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  recommendation: string;
}

interface GeoOpportunity {
  title: string;
  description: string;
  recommendation: string;
}

interface GeoAuditResult {
  insightId: string;
  score: number;
  summary: string;
  issues: GeoIssue[];
  opportunities: GeoOpportunity[];
  performedAt: string;
}

interface GeoAuditPanelProps {
  projects: Project[];
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10", label: "Critical" },
  high: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-500/10", label: "High" },
  medium: { icon: Info, color: "text-amber-600", bg: "bg-amber-500/10", label: "Medium" },
  low: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-500/10", label: "Low" },
};

const FOCUS_AREA_OPTIONS = [
  { value: "ai-visibility", label: "AI Visibility" },
  { value: "entity-understanding", label: "Entity Understanding" },
  { value: "content-authority", label: "Content Authority" },
  { value: "citations", label: "Citations" },
  { value: "structured-data", label: "Structured Data" },
];

export function GeoAuditPanel({ projects }: GeoAuditPanelProps): React.JSX.Element {
  const [selectedProjectId, setSelectedProjectId] = React.useState(projects[0]?.id ?? "");
  const [url, setUrl] = React.useState(projects[0]?.websiteUrl ?? "");
  const [businessName, setBusinessName] = React.useState("");
  const [focusAreas, setFocusAreas] = React.useState<string[]>([
    "ai-visibility",
    "entity-understanding",
    "content-authority",
    "citations",
    "structured-data",
  ]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<GeoAuditResult | null>(null);

  // Update URL when project changes
  React.useEffect(() => {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (project) {
      setUrl(project.websiteUrl);
    }
  }, [selectedProjectId, projects]);

  function toggleFocusArea(area: string): void {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area],
    );
  }

  async function handleSubmit(): Promise<void> {
    if (!selectedProjectId || !url || focusAreas.length === 0) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/ai/geo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          url,
          focusAreas,
          ...(businessName.trim() ? { businessName: businessName.trim() } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "GEO audit failed. Please try again.");
      }

      if (data.success && data.data) {
        setResult(data.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Globe className="h-5 w-5" />
          Run GEO Audit
        </h2>

        <div className="space-y-4">
          {/* Project Selector */}
          {projects.length > 0 ? (
            <div>
              <label htmlFor="geo-project-select" className="mb-1.5 block text-sm font-medium">
                Project
              </label>
              <select
                id="geo-project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* URL Input */}
          <div>
            <label htmlFor="geo-url" className="mb-1.5 block text-sm font-medium">
              Website URL
            </label>
            <Input
              id="geo-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Business Name Input */}
          <div>
            <label htmlFor="geo-business-name" className="mb-1.5 block text-sm font-medium">
              Business Name (optional)
            </label>
            <Input
              id="geo-business-name"
              type="text"
              placeholder="Your business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Focus Areas */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Focus Areas</label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREA_OPTIONS.map((area) => (
                <button
                  key={area.value}
                  type="button"
                  onClick={() => toggleFocusArea(area.value)}
                  disabled={isLoading}
                  className={
                    focusAreas.includes(area.value)
                      ? "rounded-full border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      : "rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                  }
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedProjectId || !url || focusAreas.length === 0}
            isLoading={isLoading}
          >
            {isLoading ? "Running GEO Audit..." : "Start GEO Audit"}
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error ? (
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">GEO Audit Failed</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Results */}
      {result ? (
        <div className="space-y-4">
          {/* Score Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">GEO Audit Results</h3>
                <p className="text-sm text-muted-foreground">
                  Completed at {new Date(result.performedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    result.score >= 80
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : result.score >= 60
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }
                >
                  {result.score >= 80
                    ? "Strong"
                    : result.score >= 60
                      ? "Needs Improvement"
                      : "Poor"}
                </Badge>
                <span className="text-3xl font-bold">{result.score}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
            </div>

            {/* Summary */}
            <p className="mt-4 text-sm text-muted-foreground">{result.summary}</p>
          </Card>

          {/* Issues */}
          {result.issues.length > 0 ? (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold">Issues ({result.issues.length})</h3>
              <div className="space-y-3">
                {result.issues.map((issue, index) => {
                  const config = severityConfig[issue.severity];
                  const Icon = config.icon;
                  return (
                    <div key={index} className="flex gap-3 rounded-lg border border-border p-4">
                      <div className={`rounded-lg p-2 ${config.bg}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className={config.bg + " " + config.color} variant="outline">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{issue.category}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold">{issue.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{issue.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          <CheckCircle className="mr-1 inline h-3 w-3" />
                          {issue.recommendation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <p className="text-center text-sm text-muted-foreground">
                No issues found. Your site has strong GEO fundamentals!
              </p>
            </Card>
          )}

          {/* Opportunities */}
          {result.opportunities && result.opportunities.length > 0 ? (
            <Card className="p-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Opportunities ({result.opportunities.length})
              </h3>
              <div className="space-y-3">
                {result.opportunities.map((opp, index) => (
                  <div key={index} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold">{opp.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{opp.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <CheckCircle className="mr-1 inline h-3 w-3" />
                      {opp.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* No Projects State */}
      {projects.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-sm text-muted-foreground">
            No projects found. Create a project first to run GEO audits.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

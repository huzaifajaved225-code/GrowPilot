"use client";

import * as React from "react";
import { Search, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  websiteUrl: string;
}

interface SeoIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  description: string;
  recommendation: string;
}

interface AuditResult {
  auditId: string;
  score: number;
  issues: SeoIssue[];
  summary: string;
  status: string;
  performedAt: string;
}

interface SeoAuditPanelProps {
  projects: Project[];
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10", label: "Critical" },
  warning: { icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-500/10", label: "Warning" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-500/10", label: "Info" },
};

export function SeoAuditPanel({ projects }: SeoAuditPanelProps): React.JSX.Element {
  const [selectedProjectId, setSelectedProjectId] = React.useState(projects[0]?.id ?? "");
  const [url, setUrl] = React.useState(projects[0]?.websiteUrl ?? "");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<AuditResult | null>(null);

  // Update URL when project changes
  React.useEffect(() => {
    const project = projects.find((p) => p.id === selectedProjectId);
    if (project) {
      setUrl(project.websiteUrl);
    }
  }, [selectedProjectId, projects]);

  async function handleSubmit(): Promise<void> {
    if (!selectedProjectId || !url) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/v1/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          url,
          focusAreas: "technical,on-page,performance",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Audit failed. Please try again.");
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
          <Search className="h-5 w-5" />
          Run SEO Audit
        </h2>

        <div className="space-y-4">
          {/* Project Selector */}
          {projects.length > 0 ? (
            <div>
              <label htmlFor="project-select" className="mb-1.5 block text-sm font-medium">
                Project
              </label>
              <select
                id="project-select"
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
            <label htmlFor="audit-url" className="mb-1.5 block text-sm font-medium">
              Website URL
            </label>
            <Input
              id="audit-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !selectedProjectId || !url}
            isLoading={isLoading}
          >
            {isLoading ? "Running Audit..." : "Start SEO Audit"}
          </Button>
        </div>
      </Card>

      {/* Error State */}
      {error ? (
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Audit Failed</h3>
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
                <h3 className="text-lg font-semibold">SEO Audit Results</h3>
                <p className="text-sm text-muted-foreground">
                  Completed at {new Date(result.performedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    result.score >= 80
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : result.score >= 50
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "bg-red-500/10 text-red-700 dark:text-red-400"
                  }
                >
                  {result.score >= 80 ? "Good" : result.score >= 50 ? "Needs Work" : "Poor"}
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
              <h3 className="mb-4 text-lg font-semibold">
                Issues ({result.issues.length})
              </h3>
              <div className="space-y-3">
                {result.issues.map((issue, index) => {
                  const config = severityConfig[issue.severity];
                  const Icon = config.icon;
                  return (
                    <div
                      key={index}
                      className="flex gap-3 rounded-lg border border-border p-4"
                    >
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
                        <p className="mt-1.5 text-sm font-medium">{issue.description}</p>
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
                No issues found. Your site looks great!
              </p>
            </Card>
          )}
        </div>
      ) : null}

      {/* No Projects State */}
      {projects.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-sm text-muted-foreground">
            No projects found. Create a project first to run SEO audits.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
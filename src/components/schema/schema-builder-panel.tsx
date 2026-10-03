"use client";

import * as React from "react";
import {
  Code, AlertTriangle, CheckCircle, Copy, RefreshCw,
  Globe, BarChart3, Shield, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type AnalysisStatus =
  | "idle" | "validating" | "crawling" | "extracting"
  | "analyzing" | "generating" | "validating-schema" | "completed" | "failed";

interface SchemaResult {
  url: string;
  businessType: { type: string; confidence: number; signals: string[]; method: string };
  website: {
    title: string | null; description: string | null; canonical: string | null;
    headings: { h1: string[]; h2: string[]; h3: string[] };
    contact: Record<string, unknown>; socialProfiles: string[];
  };
  existingSchema: { type: string; schemaType: string | null; valid: boolean; parseError: string | null }[];
  generatedSchema: Record<string, unknown>;
  validation: { valid: boolean; errors: string[]; warnings: string[]; missingRecommendedProperties: string[] };
  readability: { score: number; checks: { id: string; label: string; passed: boolean; detail: string }[] };
  missingInformation: string[];
}

const STATUS_MESSAGES: Record<AnalysisStatus, string> = {
  idle: "",
  validating: "Validating URL...",
  crawling: "Securely fetching your webpage...",
  extracting: "Extracting structured data...",
  analyzing: "Analyzing business signals...",
  generating: "Generating schema recommendations...",
  "validating-schema": "Validating generated JSON-LD...",
  completed: "Analysis complete",
  failed: "Analysis failed",
};

const BUSINESS_TYPES = [
  { label: "Auto Detect", value: "auto" },
  { label: "Organization", value: "Organization" },
  { label: "Local Business", value: "LocalBusiness" },
  { label: "Restaurant", value: "Restaurant" },
  { label: "Store", value: "Store" },
  { label: "Service", value: "Service" },
  { label: "Product / E-commerce", value: "Product" },
  { label: "Software / SaaS", value: "SoftwareApplication" },
  { label: "Article / Blog", value: "Article" },
  { label: "Person", value: "Person" },
];

interface SchemaBuilderPanelProps {
  isAuthenticated: boolean;
}

export function SchemaBuilderPanel({ isAuthenticated }: SchemaBuilderPanelProps): React.JSX.Element {
  const [url, setUrl] = React.useState("");
  const [businessType, setBusinessType] = React.useState("auto");
  const [status, setStatus] = React.useState<AnalysisStatus>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<SchemaResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  async function handleSubmit(): Promise<void> {
    if (!url) return;
    if (!isAuthenticated) {
      setError("Please sign in to use the Schema Builder.");
      return;
    }

    setStatus("validating");
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      setStatus("crawling");
      const response = await fetch("/api/v1/schema/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, businessType }),
      });

      setStatus("generating");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message ?? "Schema generation failed");
      }

      if (data.success && data.data) {
        setStatus("completed");
        setResult(data.data);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }

  async function handleCopy(): Promise<void> {
    if (!result) return;
    const jsonLd = JSON.stringify(result.generatedSchema, null, 2);
    try {
      await navigator.clipboard.writeText(jsonLd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = jsonLd;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isLoading = status !== "idle" && status !== "completed" && status !== "failed";

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Globe className="h-5 w-5" />
          Analyze Website
        </h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="schema-url" className="mb-1.5 block text-sm font-medium">
              Website URL
            </label>
            <Input
              id="schema-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="schema-type" className="mb-1.5 block text-sm font-medium">
              Business Type
            </label>
            <select
              id="schema-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              disabled={isLoading}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {BUSINESS_TYPES.map((bt) => (
                <option key={bt.value} value={bt.value}>{bt.label}</option>
              ))}
            </select>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading || !url} isLoading={isLoading}>
            {isLoading ? STATUS_MESSAGES[status] : "Analyze Website"}
          </Button>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium">{STATUS_MESSAGES[status]}</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds...</p>
            </div>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">Analysis Failed</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Business Type + Readability Score */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" /> Detected Business Type
              </div>
              <p className="text-2xl font-bold">{result.businessType.type}</p>
              <p className="text-sm text-muted-foreground">
                Confidence: {Math.round(result.businessType.confidence * 100)}% ({result.businessType.method})
              </p>
              {result.businessType.signals.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {result.businessType.signals.map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" /> Search Readability
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{result.readability.score}</span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">GrowPilot analysis score</p>
              <div className="mt-2 space-y-1">
                {result.readability.checks.map((check) => (
                  <div key={check.id} className="flex items-center gap-2 text-xs">
                    {check.passed ? (
                      <CheckCircle className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                    )}
                    <span>{check.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Existing Structured Data */}
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Code className="h-4 w-4" /> Existing Structured Data
            </h3>
            {result.existingSchema.length > 0 ? (
              <div className="space-y-2">
                {result.existingSchema.map((schema, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border border-border p-2 text-sm">
                    <Badge variant="outline">{schema.type}</Badge>
                    {schema.schemaType && <span className="font-medium">{schema.schemaType}</span>}
                    {schema.valid ? (
                      <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Valid</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Malformed</Badge>
                    )}
                    {schema.parseError && <span className="text-xs text-red-500">{schema.parseError}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No existing structured data detected.</p>
            )}
          </Card>

          {/* Missing Information */}
          {result.missingInformation.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4" /> Missing Information
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missingInformation.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{item}</Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Adding this information to your website would improve your structured data.
              </p>
            </Card>
          )}

          {/* Schema Validation */}
          <Card className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Shield className="h-4 w-4" /> Schema Validation
            </h3>
            {result.validation.valid ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle className="h-4 w-4" /> Generated schema is valid
              </div>
            ) : (
              <div className="space-y-1">
                {result.validation.errors.map((err, i) => (
                  <p key={i} className="text-sm text-red-600">{err}</p>
                ))}
              </div>
            )}
            {result.validation.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.validation.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-600">{w}</p>
                ))}
              </div>
            )}
            {result.validation.missingRecommendedProperties.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  Missing recommended: {result.validation.missingRecommendedProperties.join(", ")}
                </p>
              </div>
            )}
          </Card>

          {/* Generated JSON-LD */}
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Code className="h-4 w-4" /> Recommended JSON-LD
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="mr-1 h-3 w-3" />
                  {copied ? "Copied!" : "Copy JSON-LD"}
                </Button>
              </div>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs leading-relaxed">
              <code>{JSON.stringify(result.generatedSchema, null, 2)}</code>
            </pre>
          </Card>

          {/* Disclaimer */}
          <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                GrowPilot generates structured data based on information publicly available on your website.
                Adding schema does not guarantee higher rankings, featured snippets, or AI Overview inclusion.
                This is a GrowPilot analysis score, not a Google score.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
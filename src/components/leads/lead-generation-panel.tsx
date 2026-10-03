"use client";

import * as React from "react";
import {
  Search,
  Sparkles,
  Download,
  Mail,
  MessageSquare,
  Share2,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Flame,
  SunMedium,
  Snowflake,
  TrendingUp,
  Building2,
  MapPin,
  Target,
  RefreshCw,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils/cn";

export interface LeadItem {
  id: string;
  businessName: string;
  industry: string;
  location: string;
  website?: string | null;
  description?: string | null;
  score: number;
  status: "HOT" | "WARM" | "COLD";
  opportunity?: string | null;
  aiInsight?: string | null;
  recommendedService?: string | null;
  nextAction?: string | null;
  createdAt: string;
}

interface SummaryStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
}

interface LeadGenerationPanelProps {
  userEmail?: string | null;
}

export function LeadGenerationPanel({
  userEmail: _userEmail,
}: LeadGenerationPanelProps): React.JSX.Element {
  // Generator form state
  const [industry, setIndustry] = React.useState("Digital Marketing Agency");
  const [location, setLocation] = React.useState("Karachi, Pakistan");
  const [targetCustomer, setTargetCustomer] = React.useState("Small and medium businesses");
  const [website, setWebsite] = React.useState("");
  const [count, setCount] = React.useState(10);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // Leads list & stats
  const [leads, setLeads] = React.useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Filters & sorting
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "HOT" | "WARM" | "COLD">("ALL");
  const [sortBy, setSortBy] = React.useState<"score-desc" | "score-asc" | "newest">("score-desc");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 8;

  // Outreach modal state
  const [activeOutreachLead, setActiveOutreachLead] = React.useState<LeadItem | null>(null);
  const [outreachChannel, setOutreachChannel] = React.useState<"email" | "whatsapp" | "general">(
    "email",
  );
  const [isGeneratingOutreach, setIsGeneratingOutreach] = React.useState(false);
  const [outreachSubject, setOutreachSubject] = React.useState<string>("");
  const [outreachMessage, setOutreachMessage] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  // Deleting state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  // Fetch initial leads
  const fetchLeads = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/leads?limit=100");
      if (!res.ok) {
        throw new Error("Failed to load leads");
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data.leads)) {
        setLeads(json.data.leads);
      }
    } catch {
      // Graceful fallback for initial load if offline
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Compute summary stats
  const summary: SummaryStats = React.useMemo(() => {
    const totalLeads = leads.length;
    const hotLeads = leads.filter((l) => l.status === "HOT").length;
    const warmLeads = leads.filter((l) => l.status === "WARM").length;
    const coldLeads = leads.filter((l) => l.status === "COLD").length;
    const averageScore =
      totalLeads > 0 ? Math.round(leads.reduce((sum, l) => sum + l.score, 0) / totalLeads) : 0;

    return { totalLeads, hotLeads, warmLeads, coldLeads, averageScore };
  }, [leads]);

  // Handle lead generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry.trim() || !location.trim()) {
      setErrorMessage("Please enter both an Industry and a Location.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/leads/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: industry.trim(),
          location: location.trim(),
          targetCustomer: targetCustomer.trim() || undefined,
          website: website.trim() || undefined,
          count,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to generate leads.");
      }

      const generated: LeadItem[] = json.data.leads;
      setLeads((prev) => [...generated, ...prev]);
      setCurrentPage(1);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "An unexpected error occurred during lead generation.";
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle delete lead
  const handleDeleteLead = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/leads/${id}`, { method: "DELETE" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      if (activeOutreachLead?.id === id) {
        setActiveOutreachLead(null);
      }
    } catch {
      // Local removal on failure
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  // Open outreach modal & generate copy
  const handleOpenOutreach = async (
    lead: LeadItem,
    channel: "email" | "whatsapp" | "general" = "email",
  ) => {
    setActiveOutreachLead(lead);
    setOutreachChannel(channel);
    setIsGeneratingOutreach(true);
    setOutreachSubject("");
    setOutreachMessage("");
    setCopied(false);

    try {
      const res = await fetch("/api/leads/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: lead.businessName,
          industry: lead.industry,
          location: lead.location,
          opportunity: lead.opportunity || "Growth opportunities in local market",
          recommendedService: lead.recommendedService || "Digital Growth Optimization",
          channel,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setOutreachSubject(json.data.subject || "");
        setOutreachMessage(json.data.message || "");
      } else {
        throw new Error("Failed to generate outreach");
      }
    } catch {
      // Fallback templates if network or provider error
      if (channel === "whatsapp") {
        setOutreachMessage(
          `Hi ${lead.businessName} team! I came across your business in ${lead.location}. ` +
            `We noticed an opportunity in ${lead.recommendedService || "digital presence"} that could significantly boost your customer acquisition. ` +
            `Would you be open to a quick 2-minute overview?`,
        );
      } else {
        setOutreachSubject(`Growth opportunity for ${lead.businessName}`);
        setOutreachMessage(
          `Hi Team,\n\nI was reviewing businesses in the ${lead.industry} space in ${lead.location} and noticed ${lead.businessName}.\n\n` +
            `Opportunity identified: ${lead.opportunity || "Enhancing search ranking and generative engine visibility"}.\n\n` +
            `We help businesses like yours implement ${lead.recommendedService || "tailored growth strategies"} to capture high-intent inquiries.\n\n` +
            `Are you open to a brief 5-minute chat this week?\n\nBest regards,\nGrowPilot Growth Team`,
        );
      }
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Change channel in outreach modal
  const handleChangeChannel = (channel: "email" | "whatsapp" | "general") => {
    if (activeOutreachLead) {
      handleOpenOutreach(activeOutreachLead, channel);
    }
  };

  // Copy outreach message to clipboard
  const handleCopyOutreach = async () => {
    const textToCopy =
      outreachChannel !== "whatsapp" && outreachSubject
        ? `Subject: ${outreachSubject}\n\n${outreachMessage}`
        : outreachMessage;

    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // CSV Export
  const handleExportCsv = () => {
    if (leads.length === 0) return;

    const headers = [
      "Business Name",
      "Industry",
      "Location",
      "Website",
      "Lead Score",
      "Lead Status",
      "Opportunity",
      "Recommended Service",
      "AI Insight",
      "Next Action",
    ];

    const escapeCsv = (str: string | number | null | undefined) => {
      if (str === null || str === undefined) return '""';
      const escaped = String(str).replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = leads.map((lead) => [
      escapeCsv(lead.businessName),
      escapeCsv(lead.industry),
      escapeCsv(lead.location),
      escapeCsv(lead.website || ""),
      escapeCsv(lead.score),
      escapeCsv(lead.status),
      escapeCsv(lead.opportunity || ""),
      escapeCsv(lead.recommendedService || ""),
      escapeCsv(lead.aiInsight || ""),
      escapeCsv(lead.nextAction || ""),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `growpilot-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort leads
  const filteredLeads = React.useMemo(() => {
    let list = [...leads];

    if (statusFilter !== "ALL") {
      list = list.filter((l) => l.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          l.industry.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          (l.opportunity && l.opportunity.toLowerCase().includes(q)),
      );
    }

    list.sort((a, b) => {
      if (sortBy === "score-desc") return b.score - a.score;
      if (sortBy === "score-asc") return a.score - b.score;
      if (sortBy === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    return list;
  }, [leads, statusFilter, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / pageSize) || 1;
  const paginatedLeads = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  return (
    <div className="space-y-8">
      {/* ── Summary Stats Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="border-border/60 shadow-sm transition-all hover:shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {summary.totalLeads}
              </span>
              <span className="text-xs text-muted-foreground">in database</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5 shadow-sm transition-all hover:shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-red-600 dark:text-red-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Hot Leads</span>
              <Flame className="h-4 w-4" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-red-700 dark:text-red-300">
                {summary.hotLeads}
              </span>
              <span className="text-xs text-red-600/80 dark:text-red-400/80">Score ≥ 80</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5 shadow-sm transition-all hover:shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Warm Leads</span>
              <SunMedium className="h-4 w-4" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                {summary.warmLeads}
              </span>
              <span className="text-xs text-amber-600/80 dark:text-amber-400/80">Score 50-79</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 bg-sky-500/5 shadow-sm transition-all hover:shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-sky-600 dark:text-sky-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Cold Leads</span>
              <Snowflake className="h-4 w-4" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-sky-700 dark:text-sky-300">
                {summary.coldLeads}
              </span>
              <span className="text-xs text-sky-600/80 dark:text-sky-400/80">Score &lt; 50</span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 border-border/60 shadow-sm transition-all hover:shadow sm:col-span-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold uppercase tracking-wider">Average Score</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {summary.averageScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Lead Generator Input Card ── */}
      <Card className="border-border/80 shadow-md">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Target Market Discovery
              </CardTitle>
              <CardDescription>
                Configure your target parameters. GrowPilot AI will discover candidate businesses,
                evaluate their market viability, and score their lead potential.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label
                  htmlFor="industry"
                  className="text-xs font-semibold uppercase text-muted-foreground"
                >
                  Industry / Niche *
                </Label>
                <Input
                  id="industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Digital Marketing Agency, Dental Clinic, Legal Firm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-xs font-semibold uppercase text-muted-foreground"
                >
                  Location *
                </Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Karachi, Pakistan or Austin, TX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="targetCustomer"
                  className="text-xs font-semibold uppercase text-muted-foreground"
                >
                  Target Customer
                </Label>
                <Input
                  id="targetCustomer"
                  value={targetCustomer}
                  onChange={(e) => setTargetCustomer(e.target.value)}
                  placeholder="e.g. Small and medium businesses"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-2">
                <Label
                  htmlFor="website"
                  className="text-xs font-semibold uppercase text-muted-foreground"
                >
                  Reference Website / Competitor (Optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="count"
                  className="text-xs font-semibold uppercase text-muted-foreground"
                >
                  Number of Leads
                </Label>
                <select
                  id="count"
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value={5}>5 Leads</option>
                  <option value={10}>10 Leads (Recommended)</option>
                  <option value={20}>20 Leads</option>
                  <option value={30}>30 Leads</option>
                </select>
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span>AI qualification powered by GrowPilot AI Core</span>
              </div>
              <Button type="submit" disabled={isGenerating} className="min-w-[170px] shadow-sm">
                {isGenerating ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Analyzing Leads...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Leads
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Results Section ── */}
      <div className="space-y-4">
        {/* Results Header Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <span>Discovered Leads</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {filteredLeads.length}
              </span>
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prioritized leads ranked by AI opportunity and qualification score.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={leads.length === 0}
              className="gap-2 text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchLeads}
              disabled={isLoading}
              className="h-9 w-9 p-0"
              title="Refresh list"
            >
              <RefreshCw
                className={cn("h-4 w-4 text-muted-foreground", isLoading && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, industry, or location..."
              className="h-9 pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs">
              {(["ALL", "HOT", "WARM", "COLD"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "rounded px-2.5 py-1 font-medium transition-colors",
                    statusFilter === st
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {st === "ALL" ? "All" : st}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="score-desc">Highest Score</option>
                <option value="score-asc">Lowest Score</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Table & Cards View ── */}
        {isLoading && leads.length === 0 ? (
          <Card className="p-12 text-center">
            <Spinner className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading leads database...</p>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card className="border-dashed p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Target className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No leads found</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "ALL"
                ? "No leads matched your filter criteria. Try clearing search terms or selecting 'All'."
                : "No leads found yet. Enter your target market above and generate your first qualified lead list."}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3">Business</th>
                    <th className="px-3 py-3.5">Industry &amp; Location</th>
                    <th className="px-3 py-3.5 text-center">Lead Score</th>
                    <th className="px-3 py-3.5">AI Opportunity &amp; Insight</th>
                    <th className="px-3 py-3.5">Recommended Service</th>
                    <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLeads.map((lead) => (
                    <tr key={lead.id} className="transition-colors hover:bg-muted/20">
                      <td className="py-4 pl-4 pr-3 align-top">
                        <div className="font-semibold text-foreground">{lead.businessName}</div>
                        {lead.website ? (
                          <a
                            href={lead.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <span className="max-w-[160px] truncate">
                              {lead.website.replace(/^https?:\/\//, "")}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <div className="font-medium text-foreground">{lead.industry}</div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{lead.location}</span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-center align-top">
                        <div className="inline-flex flex-col items-center">
                          <div
                            className={cn(
                              "shadow-xs flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold",
                              lead.status === "HOT"
                                ? "border border-red-500/30 bg-red-500/15 text-red-600"
                                : lead.status === "WARM"
                                  ? "border border-amber-500/30 bg-amber-500/15 text-amber-600"
                                  : "border border-sky-500/30 bg-sky-500/15 text-sky-600",
                            )}
                          >
                            {lead.score}
                          </div>
                          <span
                            className={cn(
                              "mt-1 text-[10px] font-bold uppercase tracking-wider",
                              lead.status === "HOT"
                                ? "text-red-600"
                                : lead.status === "WARM"
                                  ? "text-amber-600"
                                  : "text-sky-600",
                            )}
                          >
                            {lead.status}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-xs px-3 py-4 align-top">
                        <p className="line-clamp-2 text-xs font-medium text-foreground">
                          {lead.opportunity || "Growth potential in local market."}
                        </p>
                        {lead.aiInsight ? (
                          <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                            &quot;{lead.aiInsight}&quot;
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-4 align-top">
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-xs text-primary"
                        >
                          {lead.recommendedService || "SEO + GEO Growth"}
                        </Badge>
                        {lead.nextAction ? (
                          <div className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                            {lead.nextAction}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-4 pl-3 pr-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenOutreach(lead, "email")}
                            className="gap-1 text-xs font-medium"
                          >
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            Outreach
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                            disabled={deletingId === lead.id}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete lead"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid grid-cols-1 gap-3 lg:hidden">
              {paginatedLeads.map((lead) => (
                <Card key={lead.id} className="shadow-xs border-border">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-base font-semibold text-foreground">
                          {lead.businessName}
                        </h4>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{lead.industry}</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" />
                            {lead.location}
                          </span>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          lead.status === "HOT"
                            ? "border border-red-500/30 bg-red-500/15 text-red-600"
                            : lead.status === "WARM"
                              ? "border border-amber-500/30 bg-amber-500/15 text-amber-600"
                              : "border border-sky-500/30 bg-sky-500/15 text-sky-600",
                        )}
                      >
                        {lead.score}
                      </div>
                    </div>

                    {lead.opportunity ? (
                      <div className="rounded-md bg-muted/40 p-2.5 text-xs">
                        <div className="font-semibold text-foreground">Opportunity:</div>
                        <p className="mt-0.5 text-muted-foreground">{lead.opportunity}</p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-1">
                      <Badge variant="outline" className="text-[11px]">
                        {lead.recommendedService || "SEO Growth"}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenOutreach(lead, "email")}
                          className="h-8 gap-1 text-xs"
                        >
                          <Mail className="h-3.5 w-3.5 text-primary" />
                          Outreach
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                          disabled={deletingId === lead.id}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 ? (
              <div className="flex items-center justify-between pt-3">
                <div className="text-xs text-muted-foreground">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length}{" "}
                  leads
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-xs font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Outreach Modal / Dialog ── */}
      {activeOutreachLead ? (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in fade-in-0 zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border bg-muted/20 p-4 sm:p-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">
                    Personalized Outreach — {activeOutreachLead.businessName}
                  </h3>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  AI-crafted outreach pitch tailored to their specific industry, location, and
                  growth opportunity.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOutreachLead(null)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Channel Tabs */}
            <div className="flex gap-2 border-b border-border bg-muted/30 px-4 pt-3 sm:px-6">
              <button
                type="button"
                onClick={() => handleChangeChannel("email")}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                  outreachChannel === "email"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Mail className="h-4 w-4" />
                Cold Email
              </button>
              <button
                type="button"
                onClick={() => handleChangeChannel("whatsapp")}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                  outreachChannel === "whatsapp"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp Message
              </button>
              <button
                type="button"
                onClick={() => handleChangeChannel("general")}
                className={cn(
                  "flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors",
                  outreachChannel === "general"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Share2 className="h-4 w-4" />
                General Outreach (LinkedIn/DM)
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 p-4 sm:p-6">
              {isGeneratingOutreach ? (
                <div className="py-12 text-center">
                  <Spinner className="mx-auto h-7 w-7 text-primary" />
                  <p className="mt-2 text-sm font-medium text-muted-foreground">
                    Personalizing outreach for {activeOutreachLead.businessName}...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outreachChannel !== "whatsapp" && outreachSubject ? (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        Subject Line
                      </Label>
                      <Input
                        value={outreachSubject}
                        onChange={(e) => setOutreachSubject(e.target.value)}
                        className="text-sm font-medium"
                      />
                    </div>
                  ) : null}

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Message Content
                    </Label>
                    <textarea
                      value={outreachMessage}
                      onChange={(e) => setOutreachMessage(e.target.value)}
                      rows={outreachChannel === "whatsapp" ? 4 : 8}
                      className="w-full rounded-md border border-input bg-background p-3 text-sm leading-relaxed ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-border bg-muted/10 p-4 sm:p-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleChangeChannel(outreachChannel)}
                disabled={isGeneratingOutreach}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isGeneratingOutreach && "animate-spin")} />
                Regenerate Pitch
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveOutreachLead(null)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopyOutreach}
                  disabled={isGeneratingOutreach || !outreachMessage}
                  className="gap-1.5 text-xs shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Message
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

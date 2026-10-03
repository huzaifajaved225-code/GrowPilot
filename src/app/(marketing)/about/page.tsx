import type { Metadata } from "next";
import Link from "next/link";
import {
  Brain, Target, Rocket, BarChart3, Shield, Eye, Lightbulb,
  Layers, Users, DollarSign, Settings, Scale,
  TrendingUp, Search, PenTool, Share2, Globe, Sparkles,
  ArrowRight, CheckCircle2, Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About GrowPilot | AI Business Operating System",
  description:
    "Learn how GrowPilot is building an AI Business Operating System to help businesses understand, prioritize, execute, automate, and continuously improve.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const marketingFocusAreas = [
  { icon: Globe, label: "Website & SEO" },
  { icon: Search, label: "Search Visibility" },
  { icon: Layers, label: "Structured Data & Schema" },
  { icon: Brain, label: "AI-search Visibility" },
  { icon: Lightbulb, label: "Content Intelligence" },
  { icon: PenTool, label: "Content Creation" },
  { icon: Share2, label: "Social Media" },
  { icon: Globe, label: "Business Presence" },
  { icon: TrendingUp, label: "Growth Opportunities" },
  { icon: BarChart3, label: "Performance Monitoring" },
  { icon: Sparkles, label: "AI-powered Recommendations" },
  { icon: Zap, label: "Growth Workflows" },
];

const stages = [
  {
    num: "01",
    title: "Understand",
    description:
      "Analyze available business, website, content, marketing, and performance signals.",
    icon: Eye,
  },
  {
    num: "02",
    title: "Prioritize",
    description:
      "Identify important problems and opportunities and determine what deserves attention first.",
    icon: Target,
  },
  {
    num: "03",
    title: "Execute",
    description:
      "Turn insights into practical actions, content, workflows, and optimization tasks.",
    icon: Rocket,
  },
  {
    num: "04",
    title: "Measure",
    description:
      "Track changes and outcomes so businesses can understand what worked and what needs improvement.",
    icon: BarChart3,
  },
];

const aiPrinciples = [
  {
    title: "Context",
    description:
      "AI should understand the business and the situation before making recommendations.",
    icon: Brain,
  },
  {
    title: "Evidence",
    description:
      "AI should use available data and observable signals rather than inventing facts.",
    icon: Eye,
  },
  {
    title: "Control",
    description:
      "Businesses should remain in control of important decisions and actions.",
    icon: Shield,
  },
  {
    title: "Persistence",
    description:
      "Relevant business context and historical outcomes should inform future workflows where appropriate.",
    icon: Layers,
  },
  {
    title: "Measurement",
    description:
      "Actions should connect to measurable outcomes whenever possible.",
    icon: BarChart3,
  },
  {
    title: "Human Oversight",
    description:
      "AI should assist people with decisions and execution while humans remain responsible for consequential decisions.",
    icon: Users,
  },
];

const roadmapPhases = [
  { phase: 1, label: "Marketing & Growth", icon: TrendingUp, current: true },
  { phase: 2, label: "Sales", icon: DollarSign, current: false },
  { phase: 3, label: "Customer Support", icon: Users, current: false },
  { phase: 4, label: "Operations", icon: Settings, current: false },
  { phase: 5, label: "Finance", icon: DollarSign, current: false },
  { phase: 6, label: "Human Resources", icon: Users, current: false },
  { phase: 7, label: "Procurement & Supply Chain", icon: Layers, current: false },
  { phase: 8, label: "Legal & Compliance", icon: Scale, current: false },
  { phase: 9, label: "Analytics & Management", icon: BarChart3, current: false },
];

const missionGoals = [
  "Understand better",
  "Decide faster",
  "Execute smarter",
  "Automate responsibly",
  "Measure continuously",
  "Grow sustainably",
];

const expansionDepartments = [
  "Sales",
  "Customer Support",
  "Operations",
  "Finance",
  "Human Resources",
  "Procurement & Supply Chain",
  "Legal & Compliance",
  "Analytics & Management",
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AboutPage(): React.JSX.Element {
  return (
    <div className="flex flex-col">
      {/* -- HERO -------------------------------------------------- */}
      <section className="container flex flex-col items-center gap-6 py-24 text-center sm:py-32">
        <Badge variant="outline" className="gap-1 px-3 py-1 text-xs">
          <Sparkles className="h-3 w-3" />
          AI Business Operating System
        </Badge>
        <h1 className="font-heading max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Building the AI Operating System for Modern Businesses
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          GrowPilot is an AI-powered Business Operating System designed to help
          businesses understand what is happening, identify what matters, take
          action, automate repetitive work, and continuously improve.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/login">
              Start Growing
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">Explore GrowPilot</Link>
          </Button>
        </div>
      </section>

      {/* -- THE PROBLEM ------------------------------------------- */}
      <section className="border-t border-border bg-muted/40">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Businesses Have Too Many Tools — But No Connected Intelligence
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Modern businesses rely on different tools for marketing, sales,
                customer support, operations, finance, HR, analytics, and other
                functions.
              </p>
              <p className="font-medium text-foreground">
                The problem isn&apos;t a lack of software. The problem is
                fragmentation.
              </p>
            </div>
          </div>
          <div className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2">
            {[
              "Data is scattered across platforms",
              "Workflows are disconnected",
              "Teams switch between tools constantly",
              "Important insights get lost",
              "Business owners don\u2019t know what to prioritize next",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-lg border border-border bg-background p-3 text-sm"
              >
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-3xl space-y-4 text-center">
            <p className="text-muted-foreground">
              GrowPilot is being built to solve this problem.
            </p>
            <p className="text-muted-foreground">
              Instead of becoming another disconnected tool, GrowPilot aims to
              become an intelligent operating layer that connects business
              information, AI intelligence, workflows, and measurable outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* -- OUR VISION -------------------------------------------- */}
      <section className="border-t border-border">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              One AI. One Business. One Connected Operating System.
            </h2>
            <p className="text-muted-foreground">
              Our long-term vision is to build an AI Business Operating System
              capable of supporting the major functions of a business through
              connected intelligence and workflows.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Rocket className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold">
                    GrowPilot starts with
                  </h3>
                </div>
                <p className="text-lg font-semibold text-primary">
                  Marketing &amp; Growth
                </p>
              </Card>
              <Card className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold">
                    Then expands toward
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expansionDepartments.map((dept) => (
                    <Badge key={dept} variant="secondary" className="text-xs">
                      {dept}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              The ultimate goal is to allow different business functions to work
              with shared context instead of operating as isolated systems.
            </p>
          </div>
        </div>
      </section>

      {/* -- WHERE WE START ---------------------------------------- */}
      <section className="border-t border-border bg-muted/40">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Starting With Marketing &amp; Growth
            </h2>
            <p className="text-muted-foreground">
              Every business needs visibility, customers, and measurable growth.
              That&apos;s why GrowPilot starts with Marketing &amp; Growth.
            </p>
            <p className="text-muted-foreground">
              The initial platform focuses on helping businesses understand and
              improve areas such as:
            </p>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {marketingFocusAreas.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-primary/20 bg-primary/5 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              GrowPilot treats traditional search optimization, answer
              visibility, and AI-search visibility as connected parts of a
              broader{" "}
              <span className="font-medium text-foreground">
                Search Visibility
              </span>{" "}
              strategy.
            </p>
          </div>
        </div>
      </section>

      {/* -- HOW GROWPILOT WORKS ----------------------------------- */}
      <section className="border-t border-border">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              From Intelligence to Action
            </h2>
          </div>
          <div className="mx-auto mt-12 max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.num} className="relative">
                    <Card className="flex h-full flex-col p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="font-heading text-2xl font-bold text-primary/30">
                          {stage.num}
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <h3 className="font-heading text-lg font-semibold">
                        {stage.title}
                      </h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">
                        {stage.description}
                      </p>
                    </Card>
                    {idx < stages.length - 1 && (
                      <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                        <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {stages.map((s, i) => (
                <span key={s.num} className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{s.title}</span>
                  {i < stages.length - 1 && (
                    <span className="text-muted-foreground/50">&rarr;</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- AI PHILOSOPHY ----------------------------------------- */}
      <section className="border-t border-border bg-muted/40">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              AI With Context, Control, and Accountability
            </h2>
          </div>
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiPrinciples.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-heading font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* -- PRODUCT PHILOSOPHY ------------------------------------ */}
      <section className="border-t border-border">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              We Don&apos;t Want to Build Another Collection of AI Tools.
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                There are already thousands of AI tools that generate content,
                analyze data, answer questions, and automate individual tasks.
              </p>
              <p className="font-medium text-foreground">
                GrowPilot&apos;s ambition is different.
              </p>
              <p>We want to connect intelligence with execution.</p>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-2xl">
            <Card className="p-6">
              <p className="text-center text-sm text-muted-foreground">
                Instead of asking users to constantly move information between
                disconnected tools, GrowPilot is being designed to understand
                the business context and help move from:
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {["Data", "Insight", "Decision", "Action", "Measurement"].map(
                  (step, i, arr) => (
                    <span key={step} className="flex items-center gap-2">
                      <Badge variant="outline" className="px-3 py-1">
                        {step}
                      </Badge>
                      {i < arr.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      )}
                    </span>
                  ),
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* -- LONG-TERM ROADMAP ------------------------------------- */}
      <section className="border-t border-border bg-muted/40">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              From Growth Platform to Business Operating System
            </h2>
            <p className="text-sm text-muted-foreground">
              Long-term product direction and roadmap. Not all phases are
              currently available.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-3xl">
            <div className="relative space-y-0">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border sm:left-1/2 sm:-translate-x-px" />
              {roadmapPhases.map(({ phase, label, icon: Icon, current }) => (
                <div
                  key={phase}
                  className={`relative flex items-center gap-4 py-3 ${
                    phase % 2 === 0
                      ? "sm:flex-row-reverse sm:text-right"
                      : "sm:flex-row"
                  }`}
                >
                  <div className="absolute left-5 sm:left-1/2 -translate-x-1/2 z-10">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                        current
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background"
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 ${
                          current ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="ml-16 sm:ml-0 sm:w-1/2 sm:px-8">
                    <div
                      className={`flex items-center gap-2 ${
                        phase % 2 === 0
                          ? "sm:justify-end"
                          : "sm:justify-start"
                      }`}
                    >
                      <Badge
                        variant={current ? "default" : "outline"}
                        className="text-xs"
                      >
                        Phase {phase}
                      </Badge>
                      <span
                        className={`text-sm font-medium ${
                          current ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </span>
                      {current && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* -- OUR MISSION ------------------------------------------- */}
      <section className="border-t border-border">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Make Intelligent Business Operations Accessible
            </h2>
            <p className="text-muted-foreground">
              Our mission is to make powerful business intelligence and
              responsible AI-driven execution accessible to businesses of every
              size.
            </p>
            <p className="text-muted-foreground">We want businesses to:</p>
          </div>
          <div className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {missionGoals.map((goal) => (
              <div
                key={goal}
                className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{goal}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- FINAL VISION ------------------------------------------ */}
      <section className="border-t border-border bg-muted/40">
        <div className="container py-20 sm:py-24">
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              The Future Is Not Another AI Tool.
            </h2>
            <p className="font-heading text-xl font-semibold text-primary sm:text-2xl">
              It&apos;s an AI Operating System for the Business.
            </p>
            <div className="space-y-4 text-muted-foreground">
              <p>
                GrowPilot is being built toward a future where AI can help
                businesses understand their operations, coordinate workflows,
                discover opportunities, automate repetitive work, and support
                better decisions across departments.
              </p>
              <div className="grid gap-4 pt-4 sm:grid-cols-2">
                <Card className="p-4 text-left">
                  <p className="text-sm font-medium">People remain in control.</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Humans are responsible for consequential decisions.
                  </p>
                </Card>
                <Card className="p-4 text-left">
                  <p className="text-sm font-medium">
                    AI provides the intelligence layer.
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Connecting data, insights, workflows, and execution.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -- FINAL CTA --------------------------------------------- */}
      <section className="border-t border-border">
        <div className="container flex flex-col items-center gap-6 py-20 text-center sm:py-24">
          <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Your Business Deserves an Operating System for Growth.
          </h2>
          <p className="max-w-xl text-lg text-muted-foreground">
            GrowPilot is building it.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/login">
                Start Growing
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">Explore the Platform</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

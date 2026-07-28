"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  Sparkles,
  FileText,
  BarChart3,
  FolderKanban,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const stats = [
    { title: "SEO Score", value: "0%", color: "text-cyan-400" },
    { title: "GEO Score", value: "0%", color: "text-green-400" },
    { title: "AEO Score", value: "0%", color: "text-orange-400" },
    { title: "Projects", value: "0", color: "text-pink-400" },
    { title: "AI Tasks", value: "0", color: "text-purple-400" },
    { title: "Content", value: "0", color: "text-blue-400" },
  ];

  const tools = [
    {
      title: "SEO Agent",
      href: "/dashboard/seo",
      icon: <Search className="h-8 w-8 text-cyan-400" />,
    },
    {
      title: "GEO Agent",
      href: "/dashboard/geo",
      icon: <Globe className="h-8 w-8 text-green-400" />,
    },
    {
      title: "AEO Agent",
      href: "/dashboard/aeo",
      icon: <Sparkles className="h-8 w-8 text-purple-400" />,
    },
    {
      title: "Content AI",
      href: "/dashboard/content",
      icon: <FileText className="h-8 w-8 text-pink-400" />,
    },
    {
      title: "Analytics",
      href: "/dashboard/analytics",
      icon: <BarChart3 className="h-8 w-8 text-orange-400" />,
    },
    {
      title: "Projects",
      href: "/dashboard/projects",
      icon: <FolderKanban className="h-8 w-8 text-blue-400" />,
    },
  ];


  async function runAudit() {
    if (!website) {
      alert("Please enter website URL");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/seo/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          website,
        }),
      });

      const data = await response.json();

      setAuditResult(data.data);

    } catch (error) {
      console.error(error);
      alert("Audit failed");

    } finally {
      setLoading(false);
    }
  }


  return (
    <main className="space-y-8">


      {/* Hero Section */}

      <section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-black p-8">

        <div className="max-w-4xl">

          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-2xl font-bold text-slate-950">
              GP
            </div>

            <div>

              <h1 className="text-4xl font-bold text-white">
                GrowPilot Dashboard
              </h1>

              <p className="mt-2 text-slate-400">
                AI-Powered SEO, GEO, AEO, Content Automation and Business Growth Platform.
              </p>

            </div>

          </div>


          <div className="mt-8 flex flex-col gap-4 sm:flex-row">

            <input
              type="text"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-500"
            />


            <button
              onClick={runAudit}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Run AI Audit
                </>
              )}

            </button>

          </div>

        </div>

      </section>



      {/* Audit Result */}

      {auditResult && (
        <section className="rounded-2xl border border-cyan-500 bg-slate-900 p-6">

          <h2 className="mb-4 text-2xl font-bold text-cyan-400">
            Audit Result
          </h2>

          <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-green-400">
            {JSON.stringify(auditResult, null, 2)}
          </pre>

        </section>
      )}



      {/* Stats Cards */}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
          >

            <p className="text-sm text-slate-400">
              {stat.title}
            </p>

            <h3 className={`mt-2 text-4xl font-bold ${stat.color}`}>
              {stat.value}
            </h3>

          </div>
        ))}

      </section>



      {/* AI Tools */}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {tools.map((tool) => (

          <Link
            key={tool.title}
            href={tool.href}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-500"
          >

            {tool.icon}

            <h3 className="mt-4 text-xl font-bold text-white">
              {tool.title}
            </h3>

          </Link>

        ))}

      </section>


    </main>
  );
}
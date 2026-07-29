 "use client";

import Image from "next/image";

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
 const [auditResult, setAuditResult] = useState<unknown>(null);

  const stats = [
    { title: "SEO Score", value: "0%", color: "text-cyan-400" },
    { title: "GEO Score", value: "0%", color: "text-green-400" },
    { title: "AEO Score", value: "0%", color: "text-orange-400" },
    { title: "Projects", value: "0", color: "text-pink-400" },
    { title: "AI Tasks", value: "0", color: "text-purple-400" },
    { title: "Content", value: "0", color: "text-blue-400" },
  ];


 const runAudit = async () => {
  if (!website.trim()) {
    alert("Please enter a website URL");
    return;
  }

  setLoading(true);

  try {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setAuditResult({
      website,
      seoScore: 95,
      geoScore: 91,
      aeoScore: 89,
      status: "Success",
      message: "AI Audit completed successfully.",
    });
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
  return (
    <main className="space-y-8">


      {/* Hero Section */}

     

<section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-black p-8">

  <div className="max-w-4xl">

    <div className="flex items-center gap-4">

      <Image
        src="/logo.png"
        alt="GrowPilot Logo"
        width={64}
        height={64}
        priority
        className="rounded-2xl"
      />

      <div>

        <h1 className="text-4xl font-bold text-white">
          GrowPilot Dashboard
               width={64}


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

<section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

  {stats.map((item) => (

    <div
      key={item.title}
      className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-500"
    >

      <p className="text-sm text-slate-400">
        {item.title}
      </p>

      <h2 className={`mt-3 text-4xl font-bold ${item.color}`}>
        {item.value}
      </h2>

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
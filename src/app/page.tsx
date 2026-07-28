import Link from "next/link";
import {
  Search,
  FileText,
  BarChart3,
  Globe,
  Sparkles,
  FolderKanban,
} from "lucide-react";

export default function DashboardPage() {
  const stats = [
    { title: "SEO Score", value: "0%", color: "text-cyan-400" },
    { title: "GEO Visibility", value: "0%", color: "text-green-400" },
    { title: "AEO Opportunities", value: "0", color: "text-orange-400" },
    { title: "AI Tasks Today", value: "0", color: "text-purple-400" },
    { title: "Projects", value: "0", color: "text-pink-400" },
    { title: "Content Created", value: "0", color: "text-blue-400" },
  ];

  const tools = [
    {
      title: "SEO Agent",
      description: "Analyze and optimize your website.",
      icon: <Search className="h-8 w-8 text-cyan-400" />,
      href: "/dashboard/seo",
    },
    {
      title: "GEO Agent",
      description: "Optimize for AI search engines.",
      icon: <Globe className="h-8 w-8 text-green-400" />,
      href: "/dashboard/geo",
    },
    {
      title: "AEO Agent",
      description: "Dominate Answer Engine results.",
      icon: <Sparkles className="h-8 w-8 text-purple-400" />,
      href: "/dashboard/aeo",
    },
    {
      title: "Content AI",
      description: "Generate blogs & marketing content.",
      icon: <FileText className="h-8 w-8 text-pink-400" />,
      href: "/dashboard/content",
    },
    {
      title: "Analytics",
      description: "Track business performance.",
      icon: <BarChart3 className="h-8 w-8 text-orange-400" />,
      href: "/dashboard/analytics",
    },
    {
      title: "Projects",
      description: "Manage GrowPilot projects.",
      icon: <FolderKanban className="h-8 w-8 text-blue-400" />,
      href: "/dashboard/projects",
    },
  ];

  return (
    <main className="space-y-8">

      {/* Hero */}
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-black p-8">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="max-w-3xl">

            <div className="mb-5 flex items-center gap-4">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500 text-2xl font-bold text-slate-950 shadow-lg">
                GP
              </div>

              <div>
                <h1 className="text-4xl font-bold text-white">
                  Welcome to GrowPilot
                </h1>

                <p className="mt-2 text-slate-400">
                  Create your first project and start using AI-powered
                  SEO, GEO, AEO, Content Generation, Analytics and
                  Business Automation.
                </p>
              </div>

            </div>

            <div className="mt-8 flex flex-wrap gap-4">

              <button className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
                Run AI Audit
              </button>

              <button className="rounded-xl border border-slate-700 px-6 py-3 hover:bg-slate-800">
                Generate Content
              </button>

              <button className="rounded-xl border border-slate-700 px-6 py-3 hover:bg-slate-800">
                View Analytics
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* Stats */}

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

        {stats.map((item) => (

          <div
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 hover:border-cyan-500 transition"
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

      <section>

        <h2 className="mb-6 text-3xl font-bold">
          AI Tools
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

          {tools.map((tool) => (

            <Link
              key={tool.title}
              href={tool.href}
              className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-500 hover:-translate-y-1"
            >

              {tool.icon}

              <h3 className="mt-4 text-xl font-semibold">
                {tool.title}
              </h3>

              <p className="mt-2 text-slate-400">
                {tool.description}
              </p>

            </Link>

          ))}

        </div>

      </section>

    </main>
  );
}
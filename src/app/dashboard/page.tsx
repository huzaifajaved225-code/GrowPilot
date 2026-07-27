import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold">🚀 GrowPilot Dashboard</h1>

      <p className="mt-3 text-gray-400">
        Welcome to the GrowPilot AI Platform.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">🤖 SEO Agent</h2>
          <p className="mt-2 text-gray-400">
            Analyze and optimize your website.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">🌍 GEO Agent</h2>
          <p className="mt-2 text-gray-400">
            Optimize your business for AI search engines.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">❓ AEO Agent</h2>
          <p className="mt-2 text-gray-400">
            Improve answer engine visibility.
          </p>
        </div>
      </div>
    </main>
  );
}
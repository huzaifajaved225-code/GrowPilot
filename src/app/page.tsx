import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-black to-slate-900 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-6 text-center">

        <span className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          🚀 AI Business Automation Platform
        </span>

        <h1 className="mt-8 text-5xl font-extrabold leading-tight md:text-7xl">
          GrowPilot
        </h1>

        <p className="mt-6 max-w-3xl text-lg text-gray-300 md:text-2xl">
          AI-powered platform that automates SEO, GEO, AEO, Social Media,
          Marketing, Sales and Business Growth — all in one place.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-green-500 px-8 py-4 text-lg font-semibold transition hover:bg-green-600"
          >
            Get Started
          </Link>

          <button className="rounded-xl border border-white/20 px-8 py-4 text-lg transition hover:bg-white/10">
            Watch Demo
          </button>
        </div>
      </div>
    </main>
  );
}
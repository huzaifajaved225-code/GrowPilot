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
          <button className="rounded-xl bg-green-500 px-8 py-4 text-lg font-semibold transition hover:bg-green-600">
            Get Started
          </button>

          <button className="rounded-xl border border-white/20 px-8 py-4 text-lg transition hover:bg-white/10">
            Watch Demo
          </button>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-bold">🤖 AI SEO</h3>
            <p className="mt-3 text-gray-400">
              Automatically optimize your website for Google and AI search.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-bold">📈 Marketing Automation</h3>
            <p className="mt-3 text-gray-400">
              Generate content, schedule posts and manage campaigns with AI.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-xl font-bold">💼 Business Dashboard</h3>
            <p className="mt-3 text-gray-400">
              Track leads, sales and analytics from one smart dashboard.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
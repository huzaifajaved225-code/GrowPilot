import Link from "next/link";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const menu = [
    { name: "Dashboard", href: "/dashboard", icon: "🏠" },
    { name: "SEO Agent", href: "/dashboard/seo", icon: "🤖" },
    { name: "GEO Agent", href: "/dashboard/geo", icon: "🌍" },
    { name: "AEO Agent", href: "/dashboard/aeo", icon: "❓" },
    { name: "Content AI", href: "/dashboard/content", icon: "✍️" },
    { name: "Social Planner", href: "/dashboard/social", icon: "📱" },
    { name: "Analytics", href: "/dashboard/analytics", icon: "📊" },
    { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
    { name: "Profile", href: "/dashboard/profile", icon: "👤" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">
      <aside className="w-72 border-r border-slate-800 bg-slate-900 p-6">
        <h1 className="mb-8 text-3xl font-bold text-cyan-400">
          🚀 GrowPilot
        </h1>

        <nav className="space-y-2">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-4 py-3 transition hover:bg-slate-800"
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-8">
          <h2 className="text-xl font-semibold">
            GrowPilot Dashboard
          </h2>

          <button className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400">
            AI Assistant
          </button>
        </header>

        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-800 bg-slate-900 p-6 transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h1 className="mb-8 text-3xl font-bold text-cyan-400">
          🚀 GrowPilot
        </h1>

        <nav className="space-y-2">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className="block rounded-lg px-4 py-3 transition hover:bg-slate-800"
            >
              {item.icon} {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 md:px-8">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 rounded-md p-2 hover:bg-slate-800 lg:hidden"
            >
              ☰
            </button>

            <h2 className="text-lg font-semibold md:text-xl">
              GrowPilot Dashboard
            </h2>
          </div>

          <button className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 md:px-4">
            AI Assistant
          </button>
        </header>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
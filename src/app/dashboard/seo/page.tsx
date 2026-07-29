"use client";

import Image from "next/image";
import{useState} from "react";
import Link from "next/link";
export default function SEOPage() {
  return (
    <main className="space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-white">
          🔍 SEO Agent
        </h1>

        <p className="mt-2 text-slate-400">
          Analyze your website and improve your search engine rankings.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <h2 className="mb-6 text-2xl font-semibold">
          Website Information
        </h2>

        <div className="grid gap-5">

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Website URL
            </label>

            <input
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Target Country
            </label>

            <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
              <option>Pakistan</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
              <option>UAE</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Target Language
            </label>

            <select className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3">
              <option>English</option>
              <option>Urdu</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Focus Keywords
            </label>

            <input
              type="text"
              placeholder="digital marketing, seo agency"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </div>

          <Image
  src="/logo.png"
  alt="GrowPilot Logo"
  width={48}
  height={48}
  className="object-contain"
  priority
/>

        </div>

      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-slate-400">SEO Score</p>
          <h3 className="mt-2 text-4xl font-bold text-cyan-400">0%</h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-slate-400">Issues</p>
          <h3 className="mt-2 text-4xl font-bold text-red-400">0</h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-slate-400">Warnings</p>
          <h3 className="mt-2 text-4xl font-bold text-yellow-400">0</h3>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-slate-400">Suggestions</p>
          <h3 className="mt-2 text-4xl font-bold text-green-400">0</h3>
        </div>

      </section>

      <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900 p-8 text-center">

        <h2 className="text-2xl font-semibold">
          No Audit Yet
        </h2>

        <p className="mt-3 text-slate-400">
          Enter your website URL and click
          <strong> Run SEO Audit </strong>
          to generate your first SEO report.
        </p>

      </section>

    </main>
  );
}
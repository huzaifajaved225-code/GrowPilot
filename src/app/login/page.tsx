"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">

        <h1 className="text-3xl font-bold text-white">
          Welcome Back
        </h1>

        <p className="mt-2 text-slate-400">
          Login to your GrowPilot account.
        </p>

        <form className="mt-8 space-y-5">

          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
          />

          <button
            className="w-full rounded-xl bg-cyan-500 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Login
          </button>

        </form>

        <div className="mt-6 flex justify-between text-sm">

          <Link
            href="/forgot-password"
            className="text-cyan-400 hover:underline"
          >
            Forgot Password?
          </Link>

          <Link
            href="/register"
            className="text-cyan-400 hover:underline"
          >
            Create Account
          </Link>

        </div>

      </div>
    </main>
  );
}
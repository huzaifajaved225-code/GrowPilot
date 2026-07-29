"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle,
  Bot,
  Globe,
  Search,
  BarChart3,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#030712] text-white">

      {/* ================= NAVBAR ================= */}

      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <div className="flex items-center gap-3">

            <Image
              src="/logo.png"
              alt="GrowPilot"
              width={44}
              height={44}
            />

            <span className="text-2xl font-bold text-cyan-400">
              GrowPilot
            </span>

          </div>

          <nav className="hidden gap-8 lg:flex">

            <a href="#features" className="hover:text-cyan-400">
              Features
            </a>

            <a href="#pricing" className="hover:text-cyan-400">
              Pricing
            </a>

            <a href="#about" className="hover:text-cyan-400">
              About
            </a>

            <a href="#contact" className="hover:text-cyan-400">
              Contact
            </a>

          </nav>

          <div className="flex gap-3">

            <Link
              href="/login"
              className="rounded-xl border border-slate-700 px-5 py-2 hover:border-cyan-400"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="rounded-xl bg-cyan-500 px-5 py-2 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Get Started
            </Link>

          </div>

        </div>
      </header>

      {/* ================= HERO ================= */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-600/10" />

        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 lg:flex-row">

          <div className="flex-1">

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300">

              <Sparkles className="h-4 w-4" />

              AI Powered Business Growth Platform

            </div>

            <h1 className="max-w-3xl text-6xl font-extrabold leading-tight">

              Grow Your Business

              <span className="block text-cyan-400">
                With AI Agents
              </span>

            </h1>

            <p className="mt-8 max-w-2xl text-xl leading-8 text-slate-400">

              GrowPilot helps businesses dominate SEO, GEO, AEO,
              Content Marketing, Analytics and AI Automation from
              one dashboard.

            </p>

            <div className="mt-10 flex flex-wrap gap-4">

              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-bold text-slate-950 hover:bg-cyan-400"
              >
                Launch Dashboard

                <ArrowRight className="h-5 w-5" />

              </Link>

              <Link
                href="#features"
                className="rounded-2xl border border-slate-700 px-8 py-4 hover:border-cyan-400"
              >
                Explore Features
              </Link>

            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">

              <div className="flex items-center gap-2">

                <CheckCircle className="text-green-400" />

                AI SEO

              </div>

              <div className="flex items-center gap-2">

                <CheckCircle className="text-green-400" />

                GEO

              </div>

              <div className="flex items-center gap-2">

                <CheckCircle className="text-green-400" />

                AEO

              </div>

            </div>

          </div>

          <div className="mt-16 flex-1 lg:mt-0 lg:pl-16">

            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8 shadow-2xl">

              <Image
                src="/dashboard-preview.png"
                alt="Dashboard Preview"
                width={900}
                height={650}
                className="rounded-2xl"
              />

            </div>

          </div>

        </div>

      </section>
      {/* ================= AI AGENTS ================= */}

<section className="mx-auto max-w-7xl px-6 py-24">

<h2 className="text-center text-4xl font-bold text-white">
Meet Your AI Team
</h2>

<p className="mt-4 text-center text-slate-400">
GrowPilot provides multiple AI agents working together to grow your business automatically.
</p>

<div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

<div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8 hover:border-cyan-500 transition">
<div className="text-5xl">🔍</div>
<h3 className="mt-6 text-2xl font-bold">SEO AI</h3>
<p className="mt-3 text-slate-400">
Complete SEO audits, keyword research, technical optimization and ranking improvements.
</p>
</div>

<div className="rounded-3xl border border-green-500/20 bg-slate-900 p-8 hover:border-green-500 transition">
<div className="text-5xl">🌍</div>
<h3 className="mt-6 text-2xl font-bold">GEO AI</h3>
<p className="mt-3 text-slate-400">
Optimize your business for ChatGPT, Gemini, Claude and Perplexity.
</p>
</div>

<div className="rounded-3xl border border-purple-500/20 bg-slate-900 p-8 hover:border-purple-500 transition">
<div className="text-5xl">❓</div>
<h3 className="mt-6 text-2xl font-bold">AEO AI</h3>
<p className="mt-3 text-slate-400">
Become the answer shown inside AI search engines and voice assistants.
</p>
</div>

<div className="rounded-3xl border border-pink-500/20 bg-slate-900 p-8 hover:border-pink-500 transition">
<div className="text-5xl">✍️</div>
<h3 className="mt-6 text-2xl font-bold">Content AI</h3>
<p className="mt-3 text-slate-400">
Generate blogs, Facebook posts, LinkedIn posts, emails and marketing content instantly.
</p>
</div>

<div className="rounded-3xl border border-orange-500/20 bg-slate-900 p-8 hover:border-orange-500 transition">
<div className="text-5xl">📈</div>
<h3 className="mt-6 text-2xl font-bold">Analytics AI</h3>
<p className="mt-3 text-slate-400">
Track visitors, rankings, growth, conversions and business performance.
</p>
</div>

<div className="rounded-3xl border border-blue-500/20 bg-slate-900 p-8 hover:border-blue-500 transition">
<div className="text-5xl">🤖</div>
<h3 className="mt-6 text-2xl font-bold">Automation AI</h3>
<p className="mt-3 text-slate-400">
Automate repetitive marketing tasks and save hundreds of hours every month.
</p>
</div>

</div>

</section>

      {/* ================= TRUST ================= */}

      <section className="border-y border-slate-800 bg-slate-900/40">

        <div className="mx-auto max-w-7xl px-6 py-12">

          <p className="text-center text-slate-400">

            Trusted Technology Stack

          </p>

          <div className="mt-8 grid grid-cols-2 gap-8 text-center md:grid-cols-6">

            <h3>OpenAI</h3>

            <h3>Claude</h3>

            <h3>Google</h3>

            <h3>Perplexity</h3>

            <h3>Next.js</h3>

            <h3>Vercel</h3>

          </div>

        </div>

      </section>
      {/* ================= HOW IT WORKS ================= */}

<section className="bg-slate-950 py-24">

<div className="mx-auto max-w-7xl px-6">

<h2 className="text-center text-4xl font-bold text-white">
How GrowPilot Works
</h2>

<div className="mt-20 grid gap-8 md:grid-cols-5">

<div className="text-center">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 text-3xl font-bold text-black">
1
</div>
<h3 className="mt-5 text-xl font-bold">
Connect Website
</h3>
</div>

<div className="text-center">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 text-3xl font-bold text-black">
2
</div>
<h3 className="mt-5 text-xl font-bold">
AI Audit
</h3>
</div>

<div className="text-center">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 text-3xl font-bold text-black">
3
</div>
<h3 className="mt-5 text-xl font-bold">
Generate Strategy
</h3>
</div>

<div className="text-center">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 text-3xl font-bold text-black">
4
</div>
<h3 className="mt-5 text-xl font-bold">
Auto Optimization
</h3>
</div>

<div className="text-center">
<div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500 text-3xl font-bold text-black">
5
</div>
<h3 className="mt-5 text-xl font-bold">
Business Growth
</h3>
</div>

</div>

</div>

</section>

{/* ================= FEATURES ================= */}

<section className="mx-auto max-w-7xl px-6 py-20">

  <div className="text-center">

    <h2 className="text-5xl font-bold text-white">
      Everything Your Business Needs
    </h2>

    <p className="mt-4 text-lg text-slate-400">
      GrowPilot combines AI, SEO, GEO, AEO and Business Automation into one platform.
    </p>

  </div>

  <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

    {[
      {
        icon: "🚀",
        title: "AI SEO Audit",
        desc: "Analyze any website and receive complete SEO recommendations."
      },
      {
        icon: "🌍",
        title: "GEO Optimization",
        desc: "Rank inside ChatGPT, Gemini, Claude and AI search engines."
      },
      {
        icon: "❓",
        title: "AEO",
        desc: "Optimize answers for voice assistants and AI assistants."
      },
      {
        icon: "✍️",
        title: "AI Content",
        desc: "Generate blogs, captions, product descriptions and marketing copy."
      },
      {
        icon: "📊",
        title: "Analytics",
        desc: "Track website growth, traffic and business performance."
      },
      {
        icon: "⚡",
        title: "Automation",
        desc: "Automate your business tasks using AI Agents."
      },
    ].map((feature) => (

      <div
        key={feature.title}
        className="rounded-3xl border border-slate-800 bg-slate-900 p-8 transition duration-300 hover:-translate-y-2 hover:border-cyan-500"
      >

        <div className="text-5xl">
          {feature.icon}
        </div>

        <h3 className="mt-6 text-2xl font-bold text-white">
          {feature.title}
        </h3>

        <p className="mt-4 text-slate-400">
          {feature.desc}
        </p>

      </div>

    ))}

  </div>

</section>

      {/* ================= STATS ================= */}

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-20 md:grid-cols-4">

        {[
          ["25+", "AI Tools"],
          ["100+", "SEO Checks"],
          ["50+", "Automation Flows"],
          ["24/7", "AI Assistant"],
        ].map(([value, label]) => (

          <div
            key={label}
            className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center"
          >

            <h2 className="text-5xl font-bold text-cyan-400">
              {value}
            </h2>

            <p className="mt-3 text-slate-400">
              {label}
            </p>

          </div>

        ))}

      </section>

     {/* ================= PRICING ================= */}

<section className="mx-auto max-w-7xl px-6 py-24">

  <div className="text-center">

    <h2 className="text-5xl font-bold text-white">
      Simple Pricing
    </h2>

    <p className="mt-4 text-lg text-slate-400">
      Start free and upgrade when your business grows.
    </p>

  </div>

  <div className="mt-16 grid gap-8 lg:grid-cols-3">

    {/* Free */}

    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

      <h3 className="text-3xl font-bold text-white">
        Starter
      </h3>

      <p className="mt-4 text-5xl font-bold text-cyan-400">
        Free
      </p>

      <ul className="mt-8 space-y-4 text-slate-300">

        <li>✔ 1 Project</li>
        <li>✔ SEO Audit</li>
        <li>✔ AI Content Generator</li>
        <li>✔ Basic Analytics</li>

      </ul>

      <button className="mt-10 w-full rounded-xl bg-slate-800 py-3 font-semibold hover:bg-slate-700">
        Get Started
      </button>

    </div>

    {/* Pro */}

    <div className="relative rounded-3xl border-2 border-cyan-500 bg-slate-900 p-8 shadow-2xl shadow-cyan-500/20">

      <span className="absolute right-6 top-6 rounded-full bg-cyan-500 px-4 py-1 text-sm font-bold text-slate-950">
        Most Popular
      </span>

      <h3 className="text-3xl font-bold text-white">
        Pro
      </h3>

      <p className="mt-4 text-5xl font-bold text-cyan-400">
        $19
        <span className="text-lg text-slate-400">
          /month
        </span>
      </p>

      <ul className="mt-8 space-y-4 text-slate-300">

        <li>✔ Unlimited Projects</li>
        <li>✔ SEO + GEO + AEO</li>
        <li>✔ AI Blog Generator</li>
        <li>✔ Social Planner</li>
        <li>✔ Analytics Dashboard</li>

      </ul>

      <button className="mt-10 w-full rounded-xl bg-cyan-500 py-3 font-bold text-slate-950 hover:bg-cyan-400">
        Start Free Trial
      </button>

    </div>

    {/* Business */}

    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

      <h3 className="text-3xl font-bold text-white">
        Business
      </h3>

      <p className="mt-4 text-5xl font-bold text-cyan-400">
        Custom
      </p>

      <ul className="mt-8 space-y-4 text-slate-300">

        <li>✔ Team Members</li>
        <li>✔ API Access</li>
        <li>✔ AI Automation</li>
        <li>✔ Priority Support</li>
        <li>✔ Enterprise Features</li>

      </ul>

      <button className="mt-10 w-full rounded-xl bg-slate-800 py-3 font-semibold hover:bg-slate-700">
        Contact Sales
      </button>

    </div>

  </div>

</section>
{/* ================= ABOUT US ================= */}

<section className="mx-auto max-w-7xl px-6 py-24">

  <div className="grid items-center gap-16 lg:grid-cols-2">

    <div>

      <span className="rounded-full bg-cyan-500/10 px-4 py-2 text-cyan-400">
        About GrowPilot
      </span>

      <h2 className="mt-6 text-5xl font-bold text-white">
        AI-Powered Growth Platform for Modern Businesses
      </h2>

      <p className="mt-6 text-lg leading-8 text-slate-400">
        GrowPilot is an all-in-one AI platform designed to help startups,
        agencies and businesses grow faster using Artificial Intelligence.
      </p>

      <p className="mt-4 text-lg leading-8 text-slate-400">
        From SEO, GEO, AEO and AI Content Generation to Social Media
        Automation, Analytics and Business Intelligence, GrowPilot brings
        everything into one modern dashboard.
      </p>

      <button className="mt-8 rounded-xl bg-cyan-500 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-400">
        Learn More
      </button>

    </div>

    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-10">

      <div className="space-y-8">

        <div>
          <h3 className="text-3xl font-bold text-cyan-400">
            🚀 Our Mission
          </h3>

          <p className="mt-3 text-slate-400">
            Empower every business with AI tools that increase visibility,
            automate marketing and drive sustainable growth.
          </p>
        </div>

        <div>
          <h3 className="text-3xl font-bold text-cyan-400">
            🌍 Our Vision
          </h3>

          <p className="mt-3 text-slate-400">
            Become the world's leading AI Business Growth Platform trusted by
            startups, agencies and enterprises.
          </p>
        </div>

      </div>

    </div>

  </div>

</section>
{/* ================= TESTIMONIALS ================= */}

<section className="mx-auto max-w-7xl px-6 py-24">

  <div className="text-center">

    <h2 className="text-5xl font-bold text-white">
      Trusted by Businesses
    </h2>

    <p className="mt-4 text-lg text-slate-400">
      Businesses use GrowPilot to grow faster with AI.
    </p>

  </div>

  <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

    {[
      {
        name: "Sarah Johnson",
        company: "Digital Agency",
        review:
          "GrowPilot completely transformed our SEO workflow. The AI tools saved us hours every week."
      },
      {
        name: "Ahmed Khan",
        company: "E-commerce Brand",
        review:
          "The GEO and AI Content features helped us increase our online visibility dramatically."
      },
      {
        name: "Michael Brown",
        company: "Startup Founder",
        review:
          "One dashboard for SEO, content, analytics and automation. Exactly what we needed."
      }
    ].map((item) => (

      <div
        key={item.name}
        className="rounded-3xl border border-slate-800 bg-slate-900 p-8 hover:border-cyan-500 transition"
      >

        <div className="text-5xl">
          ⭐⭐⭐⭐⭐
        </div>

        <p className="mt-6 text-slate-300 italic">
          "{item.review}"
        </p>

        <div className="mt-8">

          <h3 className="font-bold text-white">
            {item.name}
          </h3>

          <p className="text-slate-500">
            {item.company}
          </p>

        </div>

      </div>

    ))}

  </div>

</section>
{/* ================= FAQ ================= */}

<section className="mx-auto max-w-7xl px-6 py-24">

  <div className="text-center">

    <h2 className="text-5xl font-bold text-white">
      Frequently Asked Questions
    </h2>

    <p className="mt-4 text-lg text-slate-400">
      Everything you need to know about GrowPilot.
    </p>

  </div>

  <div className="mx-auto mt-16 max-w-4xl space-y-6">

    {[
      {
        q: "What is GrowPilot?",
        a: "GrowPilot is an AI-powered business growth platform that combines SEO, GEO, AEO, AI Content, Analytics and Marketing Automation."
      },
      {
        q: "Who can use GrowPilot?",
        a: "Startups, Agencies, Freelancers, E-commerce Stores and Enterprises can all use GrowPilot."
      },
      {
        q: "Does GrowPilot support AI SEO?",
        a: "Yes. GrowPilot is built around AI SEO, GEO, AEO and AI-powered content generation."
      },
      {
        q: "Can I start for free?",
        a: "Yes. You can start with the free plan and upgrade anytime."
      }
    ].map((item) => (

      <div
        key={item.q}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
      >

        <h3 className="text-xl font-bold text-cyan-400">
          {item.q}
        </h3>

        <p className="mt-3 text-slate-400">
          {item.a}
        </p>

      </div>

    ))}

  </div>

</section>
{/* ================= FOOTER ================= */}

<footer className="border-t border-slate-800 bg-slate-950">

  <div className="mx-auto max-w-7xl px-6 py-16">

    <div className="grid gap-10 md:grid-cols-4">

      <div>

        <h3 className="text-3xl font-bold text-cyan-400">
          GrowPilot
        </h3>

        <p className="mt-4 text-slate-400">
          AI-Powered Business Growth Platform for SEO, GEO, AEO and Marketing Automation.
        </p>

      </div>

      <div>

        <h4 className="font-bold text-white">
          Product
        </h4>

        <ul className="mt-4 space-y-2 text-slate-400">
          <li>SEO</li>
          <li>GEO</li>
          <li>AEO</li>
          <li>Analytics</li>
        </ul>

      </div>

      <div>

        <h4 className="font-bold text-white">
          Company
        </h4>

        <ul className="mt-4 space-y-2 text-slate-400">
          <li>About</li>
          <li>Pricing</li>
          <li>Contact</li>
          <li>Blog</li>
        </ul>

      </div>

      <div>

        <h4 className="font-bold text-white">
          Follow Us
        </h4>

        <ul className="mt-4 space-y-2 text-slate-400">
          <li>LinkedIn</li>
          <li>Facebook</li>
          <li>Instagram</li>
          <li>X (Twitter)</li>
        </ul>

      </div>

    </div>

    <div className="mt-12 border-t border-slate-800 pt-8 text-center text-slate-500">

      © 2026 GrowPilot. All Rights Reserved.

    </div>

  </div>

</footer>

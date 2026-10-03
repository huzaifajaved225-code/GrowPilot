# GrowPilot — Phase 1: Project Foundation

**AI-Powered Business Growth Platform** — SEO, GEO, AEO, AI Content, Analytics, Website Audits, Google Business Profile Management, Social Media Planning.

Stack: Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Prisma ORM · PostgreSQL · Auth.js · Zod · React Hook Form · Framer Motion · Recharts · Vercel

---

## 1. Complete Folder Structure

```
growpilot/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── commit-msg
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
│   ├── icons/
│   ├── images/
│   └── og/
├── src/
│   ├── app/
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── pricing/page.tsx
│   │   │   └── about/page.tsx
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── reset-password/page.tsx
│   │   │   └── verify-email/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── seo/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── keywords/page.tsx
│   │   │   │   ├── audits/page.tsx
│   │   │   │   └── [auditId]/page.tsx
│   │   │   ├── geo/
│   │   │   │   └── page.tsx
│   │   │   ├── aeo/
│   │   │   │   └── page.tsx
│   │   │   ├── content/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── generate/page.tsx
│   │   │   │   └── [contentId]/page.tsx
│   │   │   ├── analytics/page.tsx
│   │   │   ├── gbp/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [locationId]/page.tsx
│   │   │   ├── social/
│   │   │   │   ├── page.tsx
│   │   │   │   └── calendar/page.tsx
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [projectId]/page.tsx
│   │   │   ├── team/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   └── settings/
│   │   │       ├── page.tsx
│   │   │       ├── profile/page.tsx
│   │   │       └── integrations/page.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx
│   │   │   ├── admin/page.tsx
│   │   │   ├── admin/users/page.tsx
│   │   │   ├── admin/organizations/page.tsx
│   │   │   └── admin/billing/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── v1/
│   │   │   │   ├── seo/
│   │   │   │   │   ├── audits/route.ts
│   │   │   │   │   ├── audits/[id]/route.ts
│   │   │   │   │   └── keywords/route.ts
│   │   │   │   ├── geo/route.ts
│   │   │   │   ├── aeo/route.ts
│   │   │   │   ├── content/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── generate/route.ts
│   │   │   │   │   └── [id]/route.ts
│   │   │   │   ├── analytics/route.ts
│   │   │   │   ├── gbp/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   └── [id]/route.ts
│   │   │   │   ├── social/
│   │   │   │   │   ├── posts/route.ts
│   │   │   │   │   └── posts/[id]/route.ts
│   │   │   │   ├── projects/route.ts
│   │   │   │   ├── organizations/route.ts
│   │   │   │   ├── billing/
│   │   │   │   │   ├── checkout/route.ts
│   │   │   │   │   └── webhook/route.ts
│   │   │   │   └── users/route.ts
│   │   │   └── webhooks/
│   │   │       ├── stripe/route.ts
│   │   │       └── google/route.ts
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── loading.tsx
│   ├── components/
│   │   ├── ui/                     # primitive design-system components
│   │   ├── layout/                 # shells: sidebar, topbar, footer
│   │   ├── dashboard/               # dashboard widgets/charts
│   │   ├── forms/                   # composed RHF+Zod forms
│   │   ├── seo/
│   │   ├── content/
│   │   ├── social/
│   │   ├── marketing/
│   │   └── shared/
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth.config.ts
│   │   │   ├── auth.ts
│   │   │   └── permissions.ts
│   │   ├── db/
│   │   │   └── prisma.ts
│   │   ├── validations/             # zod schemas grouped by domain
│   │   ├── ai/                      # AI provider clients & prompt templates
│   │   ├── integrations/            # Google, Stripe, social APIs
│   │   ├── utils/
│   │   ├── constants/
│   │   └── errors/
│   ├── server/
│   │   ├── services/                # business logic layer
│   │   ├── repositories/            # Prisma data-access layer
│   │   └── jobs/                    # background/queue jobs
│   ├── hooks/
│   ├── types/
│   ├── config/
│   │   ├── site.ts
│   │   └── nav.ts
│   ├── styles/
│   └── middleware.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 2. Architecture Diagram (Clean Architecture, layered)

```
┌───────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                            │
│  app/(marketing|auth|dashboard|admin) + components/            │
│  - Server Components (data display) + Client Components (forms)│
└───────────────────────┬──────────────────────────────────────┘
                         │ calls
┌───────────────────────▼──────────────────────────────────────┐
│  API LAYER — app/api/v1/**/route.ts                            │
│  - Auth guard → Zod validation → Service call → Response       │
└───────────────────────┬──────────────────────────────────────┘
                         │ invokes
┌───────────────────────▼──────────────────────────────────────┐
│  SERVICE LAYER — server/services/*                              │
│  - Business logic, orchestration, AI calls, external APIs      │
└───────────────────────┬──────────────────────────────────────┘
                         │ uses
┌───────────────────────▼──────────────────────────────────────┐
│  REPOSITORY LAYER — server/repositories/*                       │
│  - All Prisma queries isolated here (no raw Prisma in services)│
└───────────────────────┬──────────────────────────────────────┘
                         │ queries
┌───────────────────────▼──────────────────────────────────────┐
│  DATA LAYER — PostgreSQL (Prisma schema)                        │
└──────────────────────────────────────────────────────────────┘

Cross-cutting: lib/auth (Auth.js), lib/errors (typed error classes),
middleware.ts (route protection + rate limiting), server/jobs (queue
workers for audits, AI generation, social scheduling).
```

Dependency rule: presentation → API → services → repositories → DB. Never skip a layer, never call Prisma directly from a route handler or component.

---

## 3. Database Planning (PostgreSQL via Prisma)

Core entities:

- **User** — id, email, name, image, password(hash, nullable for OAuth), role(enum: OWNER/ADMIN/MEMBER/SUPERADMIN), emailVerified, createdAt
- **Organization** — id, name, slug, plan(enum: FREE/PRO/AGENCY/ENTERPRISE), stripeCustomerId, createdAt
- **Membership** — userId, organizationId, role(enum: OWNER/ADMIN/MEMBER), joinedAt (composite key)
- **Project** — id, organizationId, name, websiteUrl, industry, createdAt
- **SeoAudit** — id, projectId, url, score, issues(Json), performedAt, status(enum)
- **Keyword** — id, projectId, term, searchVolume, difficulty, position, trackedAt
- **ContentPiece** — id, projectId, title, type(enum: BLOG/SOCIAL/GBP/META), body, status(enum: DRAFT/REVIEW/PUBLISHED), aiGenerated(bool), createdBy
- **GeoInsight** — id, projectId, aiEngine(enum: CHATGPT/GEMINI/PERPLEXITY/OTHER), visibilityScore, mentions(Json), checkedAt
- **AeoQuestion** — id, projectId, question, currentAnswer, optimizedAnswer, sourcePage
- **GbpLocation** — id, projectId, googleLocationId, name, address, rating, reviewCount, syncedAt
- **SocialAccount** — id, organizationId, platform(enum: FACEBOOK/INSTAGRAM/LINKEDIN/X/TIKTOK), accessTokenEnc, refreshTokenEnc, expiresAt
- **SocialPost** — id, projectId, socialAccountId, content, mediaUrls(Json), scheduledAt, status(enum: DRAFT/SCHEDULED/PUBLISHED/FAILED)
- **AnalyticsSnapshot** — id, projectId, source(enum: GA4/GSC/GBP), metrics(Json), capturedAt
- **Subscription** — id, organizationId, stripeSubscriptionId, status, currentPeriodEnd
- **AuditLog** — id, organizationId, userId, action, entityType, entityId, metadata(Json), createdAt
- **Invitation** — id, organizationId, email, role, token, expiresAt

Design rules:

- Every business table carries `organizationId` for multi-tenant isolation (row-level scoping enforced in repository layer, never trusted from client).
- Soft deletes (`deletedAt`) on Project, ContentPiece, SocialPost.
- All monetary/plan logic references `Subscription`, never inferred from `Organization.plan` alone (source of truth = Stripe webhook).
- JSON columns used only for semi-structured, non-queried payloads (audit issues, metrics); anything filtered/sorted gets a real column.

---

## 4. Complete Routing Structure

| Route Group                                                                          | Purpose                                 | Access                         |
| ------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------ |
| `/(marketing)`                                                                       | Public landing, pricing, about          | Public                         |
| `/(auth)/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` | Auth flows                              | Public                         |
| `/(dashboard)/dashboard`                                                             | Org home, KPI overview                  | Authenticated                  |
| `/(dashboard)/seo/*`                                                                 | Audits, keyword tracking                | Authenticated, project-scoped  |
| `/(dashboard)/geo`                                                                   | Generative Engine Optimization insights | Authenticated                  |
| `/(dashboard)/aeo`                                                                   | Answer Engine Optimization              | Authenticated                  |
| `/(dashboard)/content/*`                                                             | AI content generation & library         | Authenticated                  |
| `/(dashboard)/analytics`                                                             | GA4/GSC dashboards                      | Authenticated                  |
| `/(dashboard)/gbp/*`                                                                 | Google Business Profile management      | Authenticated                  |
| `/(dashboard)/social/*`                                                              | Social calendar & scheduling            | Authenticated                  |
| `/(dashboard)/projects/*`                                                            | Project (client site) management        | Authenticated                  |
| `/(dashboard)/team`                                                                  | Org member management                   | OWNER/ADMIN                    |
| `/(dashboard)/billing`                                                               | Subscription management                 | OWNER                          |
| `/(dashboard)/settings/*`                                                            | Profile & integrations                  | Authenticated                  |
| `/(admin)/admin/*`                                                                   | Platform-level admin                    | SUPERADMIN only                |
| `/api/v1/*`                                                                          | REST resource endpoints                 | Session or API-key             |
| `/api/webhooks/*`                                                                    | Inbound provider webhooks               | Signature-verified, no session |

Route protection is enforced centrally in `middleware.ts` (session check + role check by path prefix), not per-page.

---

## 5. Authentication Planning (Auth.js)

- **Providers**: Credentials (email+password, bcrypt hash), Google OAuth. Extendable to Microsoft/GitHub later.
- **Session strategy**: JWT sessions (stateless, scales on Vercel serverless) with a `sub`, `role`, `organizationId`, `plan` embedded in the token via `jwt` callback, refreshed from DB on each sign-in and on a rolling interval.
- **Multi-tenancy**: A user can belong to multiple organizations (Membership table); active organization stored in session, switchable via a org-switcher that re-issues the JWT.
- **RBAC**: Four roles — SUPERADMIN (platform), OWNER, ADMIN, MEMBER (org-level). Permission matrix defined in `lib/auth/permissions.ts` as a pure function `can(role, action, resource)`, checked in both middleware (route-level) and service layer (action-level) — never trust the client.
- **Email verification**: required before dashboard access; token-based, expiring links.
- **Password reset**: signed, single-use, time-limited tokens (30 min).
- **API-key auth**: separate scheme for programmatic `/api/v1/*` access (agency integrations), hashed keys stored per-organization, checked in an API middleware wrapper distinct from the session-based one.
- **CSRF**: handled by Auth.js for auth routes; state-changing API routes double-check `Origin` header.

---

## 6. Dashboard Planning

- **Shell**: persistent sidebar (nav grouped by module: SEO, GEO, AEO, Content, Analytics, GBP, Social, Team, Billing) + topbar (org switcher, project switcher, notifications, user menu).
- **Home (`/dashboard`)**: KPI cards (visibility score, traffic trend, audit health, content pipeline), a Recharts trend chart, recent activity feed, quick-action buttons per module.
- **Module pages**: consistent pattern — filter/toolbar row → primary data view (table or chart) → detail drawer/page for a single record.
- **State**: Server Components fetch initial data; client-side mutations go through Server Actions or `/api/v1` + optimistic UI where it matters (e.g., drag-reorder social calendar).
- **Empty/loading/error states**: every module ships all three explicitly (no bare spinners), using shared components from `components/shared`.
- **Responsiveness**: sidebar collapses to icon rail ≤1024px, bottom nav on mobile for the 5 primary modules.

---

## 7. API Planning

- Versioned under `/api/v1/**`, one `route.ts` per resource, REST verbs (GET/POST/PATCH/DELETE) per Next.js route handlers.
- Every handler: `auth()` session check → org/role authorization → Zod `safeParse` on input → call service → typed JSON response → centralized error handler mapping to HTTP status.
- Standard response envelope: `{ data, error, meta }` with `meta.pagination` (cursor-based) on list endpoints.
- Rate limiting per organization/API key at the middleware layer (token bucket, backed by Redis in production).
- Webhooks (`/api/webhooks/stripe`, `/api/webhooks/google`) verify signatures before touching the DB and are idempotent (dedup by provider event id).
- OpenAPI schema generated from the Zod schemas (`lib/validations`) for external/agency API consumers in a later phase.

---

## 8. Component Structure

- `components/ui/` — unstyled-to-branded primitives (Button, Input, Select, Dialog, Table, Card, Badge, Tabs) — no business logic, fully reusable, prop-driven, built with Tailwind + minimal Framer Motion for micro-interactions.
- `components/layout/` — Sidebar, Topbar, OrgSwitcher, ProjectSwitcher, MobileNav.
- `components/forms/` — composed forms wiring React Hook Form + Zod resolvers to `ui/` primitives (e.g., `ContentGenerateForm`, `ProjectCreateForm`).
- `components/dashboard/`, `components/seo/`, `components/content/`, `components/social/` — domain widgets (charts, audit issue lists, keyword tables, calendar grid) composed from `ui/`.
- `components/marketing/` — landing page sections, isolated from dashboard bundle (code-split by route group automatically via App Router).
- Naming: PascalCase component files matching the exported component name; one component per file; colocated `*.test.tsx` when behavior warrants unit tests.

---

## 9. Folder Naming Conventions

- Route groups: `(lowercase-with-parens)`, dynamic segments: `[camelCaseId]`.
- Feature folders: kebab-case (`social-calendar`, not `socialCalendar`).
- Component files: PascalCase (`AuditScoreCard.tsx`).
- Non-component TS files (services, utils, hooks): camelCase (`seoAuditService.ts`, `useProjectSwitcher.ts`).
- Zod schema files: `<domain>.schema.ts` (e.g., `project.schema.ts`).
- Types: `<domain>.types.ts` under `src/types/`.
- One export style per module: named exports everywhere except Next.js special files (`page.tsx`, `layout.tsx`, `route.ts`) which require default exports as mandated by the framework.

---

## 10. Coding Standards

- Strict TypeScript (`strict: true`, no `any` without an explicit `// eslint-disable` justification comment).
- ESLint (`next/core-web-vitals` + `@typescript-eslint/recommended`) + Prettier, enforced via Husky pre-commit + lint-staged.
- Conventional Commits (`feat:`, `fix:`, `chore:`...), enforced by commitlint in `.husky/commit-msg`.
- All async boundaries (API routes, Server Actions, services) return a discriminated-union `Result<T>` type rather than throwing across layer boundaries; only the outermost handler translates errors to HTTP.
- No business logic inside route handlers or React components — they orchestrate, services decide.
- Every Zod schema is the single source of truth for both runtime validation and inferred TypeScript types (`z.infer`), never hand-duplicated interfaces.
- Absolute imports via `@/*` path alias, no deep relative `../../../` chains.

---

## 11. Security Standards

- All secrets in environment variables, never committed; `.env.example` documents required keys with no real values.
- Passwords hashed with bcrypt (cost factor 12+); OAuth tokens for integrations (Google, social platforms) encrypted at rest (AES-256-GCM) before storing in `SocialAccount`.
- Row-level multi-tenant isolation enforced in the repository layer: every query filters by the session's `organizationId`, never accepts a client-supplied org id as the source of truth.
- Input validation with Zod on every API boundary; output encoding handled by React by default (no `dangerouslySetInnerHTML` without sanitization).
- CSP headers, `X-Frame-Options`, `X-Content-Type-Options` set in `next.config.ts` headers.
- Rate limiting + brute-force lockout on auth endpoints.
- Audit logging (`AuditLog` table) for all sensitive mutations (billing changes, role changes, member removal, integration connects).
- Dependency scanning (GitHub Dependabot) + `npm audit` in CI.

---

## 12. Performance Strategy

- Server Components by default; `"use client"` only where interactivity is required (forms, charts, drag-drop calendar).
- Streaming + `loading.tsx` per route segment for perceived performance on data-heavy pages (analytics, audits).
- Database: composite indexes on every `(organizationId, createdAt)` and `(projectId, status)` pattern used by list views; connection pooling via Prisma + PgBouncer in production.
- Caching: `unstable_cache`/route-level `revalidate` for semi-static data (pricing, marketing pages); Redis cache for expensive AI/analytics aggregations.
- Image optimization via `next/image`; font optimization via `next/font`.
- Background jobs (AI content generation, audits, social publishing) run off the request thread via a queue (BullMQ/Redis or Vercel Cron + queue table), so API responses stay fast and jobs are retried on failure.
- Bundle analysis (`@next/bundle-analyzer`) in CI to catch regressions.

---

## 13. Deployment Strategy

- **Hosting**: Vercel (Next.js-native), Preview Deployments per PR.
- **Database**: managed PostgreSQL (Neon/Supabase/RDS) with pooled connection string for serverless; Prisma Migrate run in CI before deploy, not at runtime.
- **CI/CD** (`.github/workflows/ci.yml`): install → typecheck → lint → unit tests → build, on every PR. `deploy.yml`: on merge to `main`, run migrations then trigger Vercel production deploy.
- **Environments**: `local` → `.env.local`; `preview` → Vercel preview env vars; `production` → Vercel production env vars + secrets manager.
- **Background workers**: deployed separately (Railway/Fly.io or Vercel Cron for lighter jobs) since long-running queue consumers don't fit serverless functions.
- **Monitoring**: Vercel Analytics + Sentry for error tracking, structured logging (pino) shipped to a log sink.
- **Rollback**: Vercel instant rollback to prior deployment; DB migrations written to be backward-compatible (expand/contract pattern) so a code rollback never requires a DB rollback.

---

## 14. Future AI Module Planning

- `lib/ai/` will house provider-agnostic clients (Anthropic/OpenAI) behind a common interface, so content generation, GEO visibility checks, and AEO answer optimization all go through one abstraction — swappable per organization plan tier.
- Planned modules: **AI Content Generator** (blog/social/meta, brand-voice aware), **GEO Visibility Scanner** (queries ChatGPT/Gemini/Perplexity for brand mentions), **AEO Answer Optimizer** (rewrites page content to directly answer target questions), **AI Website Auditor** (crawls + scores + prioritizes fixes), **AI Social Copilot** (caption + hashtag + scheduling suggestions), **GBP AI Responder** (drafts review replies).
- All AI outputs stored with `aiGenerated: true` provenance and a human-approval step before publishing (ContentPiece.status flow: DRAFT → REVIEW → PUBLISHED).
- Prompt templates versioned in `lib/ai/prompts/` so output quality changes are auditable and rollback-able independent of app deploys.

---

**File placement summary**: this document itself is a planning artifact (not part of the repo tree) — save it in your project's `/docs/architecture/phase-1-foundation.md` for the team's reference.

---

Ready for Phase 2?

# GrowPilot

AI-powered business growth platform — SEO, GEO (Generative Engine Optimization), AEO (Answer
Engine Optimization), AI content generation, analytics, website audits, Google Business Profile
management, and social media planning, in one multi-tenant dashboard.

> This repository currently contains the **project foundation** (Phase 1 architecture + Phase 2
> tooling/scaffolding). Authentication flows, dashboard modules, and AI features are delivered in
> subsequent phases. See `/docs/architecture/phase-1-foundation.md` for the full architecture
> reference.

## Tech Stack

| Layer            | Technology                                         |
| ---------------- | -------------------------------------------------- |
| Framework        | Next.js 15 (App Router), React 19, TypeScript      |
| Styling          | Tailwind CSS, tailwindcss-animate, Framer Motion   |
| Data             | PostgreSQL, Prisma ORM                             |
| Auth             | Auth.js (Credentials + Google OAuth), JWT sessions |
| Forms/Validation | React Hook Form, Zod                               |
| Charts           | Recharts                                           |
| Tooling          | ESLint, Prettier, Husky, lint-staged, commitlint   |
| CI/CD            | GitHub Actions, Docker, Vercel                     |

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16 (or Docker)
- (Optional) Redis, for caching/queues

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/growpilot.git
cd growpilot
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in at minimum: `DATABASE_URL`, `AUTH_SECRET` (generate with `openssl rand -base64 32`),
`NEXT_PUBLIC_APP_URL`.

### 3. Start PostgreSQL (Docker)

```bash
docker compose up -d postgres redis
```

Or point `DATABASE_URL` at your own Postgres instance.

### 4. Set up the database

```bash
npm run db:push      # sync schema for local development
npm run db:seed       # create a demo organization + user
```

For production-style migrations instead of `db:push`, use:

```bash
npm run db:migrate           # creates + applies a new migration locally
npm run db:migrate:deploy    # applies existing migrations (CI/production)
```

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Script                            | Description                          |
| --------------------------------- | ------------------------------------ |
| `npm run dev`                     | Start the dev server (Turbopack)     |
| `npm run build`                   | Production build                     |
| `npm run start`                   | Start the production server          |
| `npm run lint` / `lint:fix`       | Lint the codebase                    |
| `npm run format` / `format:check` | Prettier format / check              |
| `npm run typecheck`               | TypeScript project check, no emit    |
| `npm test` / `test:watch`         | Run unit tests (Vitest)              |
| `npm run db:generate`             | Generate Prisma client               |
| `npm run db:push`                 | Push schema to DB without migrations |
| `npm run db:migrate`              | Create + apply a dev migration       |
| `npm run db:migrate:deploy`       | Apply migrations (CI/CD)             |
| `npm run db:seed`                 | Seed demo data                       |
| `npm run db:studio`               | Open Prisma Studio                   |

## Project Structure

```
src/
├── app/            # App Router routes (marketing, auth, dashboard, admin, api)
├── components/     # ui/ (primitives), layout/, forms/, and domain component folders
├── lib/            # auth, db, validations, ai, integrations, utils, errors
├── server/         # services/ (business logic), repositories/ (Prisma access), jobs/
├── hooks/          # shared React hooks
├── types/          # shared TypeScript types
└── config/         # site config, nav config, fonts
prisma/
├── schema.prisma   # multi-tenant data model
└── seed.ts         # demo data seed script
```

Full rationale for this structure — clean architecture layering, naming conventions, security and
performance standards — is documented in `/docs/architecture/phase-1-foundation.md`.

## Docker

```bash
# Production-style build and run
docker compose up -d --build

# Local development with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Prisma Studio (optional tools profile)
docker compose --profile tools up -d studio
```

## Git Hooks

Husky runs on install (`npm run prepare`):

- **pre-commit** — runs `lint-staged` (ESLint + Prettier on staged files)
- **commit-msg** — enforces Conventional Commits via commitlint

## CI/CD

- `.github/workflows/ci.yml` — install, typecheck, lint, test, build on every PR and push
- `.github/workflows/deploy.yml` — runs Prisma migrations then deploys to Vercel on merge to `main`

Required GitHub repository secrets for deployment: `VERCEL_TOKEN`, `VERCEL_ORG_ID`,
`VERCEL_PROJECT_ID`, `DATABASE_URL`.

## Security Notes

- All secrets are environment-driven; never commit `.env`.
- Environment variables are validated at boot via Zod (`src/lib/env.ts`) — the app refuses to start
  with missing/invalid config.
- Multi-tenant data isolation is enforced at the repository layer by `organizationId`, never
  trusted from client input.
- See the full security standards section in the Phase 1 architecture document.

## License

Proprietary — all rights reserved.

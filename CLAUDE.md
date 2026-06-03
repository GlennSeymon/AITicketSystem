# AI Ticket Management System

## Project Overview

A full-stack AI-powered support ticket system replacing Freshdesk for an online programming course business. Classifies incoming emails, drafts AI responses using a knowledge base, and provides a human agent dashboard for review and approval.

See `projectScope.md` for requirements, `tech-stack.md` for stack decisions, and `implementation-plan.md` for the phased build plan.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + MUI (port 3000)
- **Backend:** Express + TypeScript + Bun (port 3001)
- **Database:** PostgreSQL 16 + pgvector (Docker)
- **ORM:** Prisma 7
- **Auth:** Better Auth (email/password, database sessions)
- **AI:** Anthropic Claude API (Haiku for classification/summaries, Sonnet for drafting/polish)
- **Embeddings:** @xenova/transformers — local, no API key required
- **Email:** Postmark (inbound webhook + outbound)

## Project Structure

```
aiTicketSystem/
├── core/                     # @repo/core — Zod schemas shared by frontend + backend
│   └── src/
│       ├── index.ts
│       └── schemas/          # One file per resource (e.g. users.ts, tickets.ts)
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express entry point
│   │   ├── seed.ts           # Dev database seed (admin + agent via Better Auth API)
│   │   ├── seed.test.ts      # E2E test seed (direct Prisma inserts, pre-seeded sessions)
│   │   ├── routes/           # Route handlers
│   │   ├── services/         # ai.ts, email.ts, kb.ts, embeddings.ts
│   │   └── middleware/       # auth, validation
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.test             # Test environment (DB port 5434, backend port 3002)
│   └── prisma.config.ts      # Prisma 7 datasource config
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # QueryClientProvider + ReactQueryDevtools
│   │   └── App.tsx
│   └── vite.config.ts        # /api proxy → localhost:${API_PORT:-3001}; fs.allow: ['..'] for @repo/core
├── e2e/
│   └── global-setup.ts       # Runs migrations + seed.test.ts before Playwright tests
├── playwright.config.ts       # Playwright E2E config
├── docker-compose.yml        # pgvector/pgvector:pg16 (dev :5433, test :5434)
└── .env.example
```

## Dev Commands

```bash
# Start both apps (from root)
bun run dev:backend       # Express on :3001 with --watch
bun run dev:frontend      # Vite on :3000

# Database (from backend/)
bun run db:migrate        # prisma migrate dev
bun run db:seed           # bun src/seed.ts

# Docker
docker compose up -d          # Start dev PostgreSQL on port 5433
docker compose up db-test -d  # Start test PostgreSQL on port 5434

# Component tests (from root)
bun run test:components   # Vitest run (headless, single pass)

# E2E tests (from root) — dev servers can stay running; tests use ports 3001+3002
bun run test:e2e          # Headless Playwright run
bun run test:e2e:ui       # Interactive Playwright UI

# Writing E2E tests — use the e2e-test-writer agent:
# "use e2e-test-writer to write tests for <feature>"
```

## Authentication

Better Auth handles all auth. Key files:

- `backend/src/auth.ts` — Better Auth instance (Prisma adapter, email/password only, **sign-up disabled**)
- `backend/src/require-auth.ts` — `requireAuth` Express middleware; attaches `req.user` and `req.session`
- `frontend/src/lib/authClient.ts` — `authClient` (Better Auth React client)

**Backend wiring:**
- All Better Auth endpoints are mounted at `app.all('/api/auth/*', toNodeHandler(auth))`
- Protect routes with `requireAuth`: `router.get('/example', requireAuth, handler)`
- Protect admin-only routes with both: `router.post('/example', requireAuth, requireAdmin, handler)`
- `requireAuth` rejects unauthenticated requests (401) and deactivated accounts (403)
- `requireAdmin` rejects non-admin users (403); always chain after `requireAuth`
- Access the session user via `req.user` (typed as Better Auth's user with `role` and `isActive` fields)

**Middleware files:**
- `backend/src/require-auth.ts` — session validation + `isActive` check
- `backend/src/require-admin.ts` — role check (`ADMIN` only)

**Middleware mounting order in `index.ts` (must not change):**
1. Auth rate limiter (`/api/auth/sign-in`, 10 req/15 min) — **production only** (`NODE_ENV === 'production'`)
2. Better Auth handler (`/api/auth/*`)
3. Postmark webhook (when implemented — needs raw body, must come before `express.json()`)
4. `express.json({ limit: '100kb' })`
5. All other routes

**Frontend wiring:**
- Session state: `const { data, isPending } = authClient.useSession()`
- Sign in: `authClient.signIn.email({ email, password })`
- Sign out: `authClient.signOut()`
- `ProtectedRoute` component redirects unauthenticated users to `/login`
- `AdminRoute` component redirects non-admins to `/` — nest inside `ProtectedRoute`
- `authClient` uses `inferAdditionalFields` plugin so `data.user.role` and `data.user.isActive` are typed

**Role values** match the Prisma enum and are always uppercase: `'ADMIN'` and `'AGENT'`.

**Creating users programmatically** — Better Auth uses scrypt (`salt:hash` hex format), not bcrypt. Use `(await auth.$context).password.hash(pw)` to generate a compatible hash. Never use `Bun.password.hash` or bcrypt directly.

**No custom auth endpoints** — do not add `/api/auth/login` or `/api/auth/me` routes; Better Auth provides these automatically under `/api/auth/*`.

## Component Tests

Component tests use **Vitest** + **React Testing Library** and live alongside the components they test (`*.test.tsx`).

**Infrastructure files:**
- `frontend/vite.config.ts` — Vitest config (`environment: 'jsdom'`, `clearMocks: true`, `setupFiles`)
- `frontend/src/test/setup.ts` — imports `@testing-library/jest-dom` matchers, stubs `window.matchMedia` / `ResizeObserver` for MUI, and calls `afterEach(cleanup)` (required — RTL v16 does not auto-cleanup without Vitest globals enabled)
- `frontend/src/test/renderWithProviders.tsx` — wrap any component with `QueryClientProvider`; returns `{ user, ...renderResult }` where `user` is a pre-configured `userEvent` instance

**Writing tests:**
- Mock service modules at the top of the file: `vi.mock('../services/users')`
- Use `renderWithProviders(<MyPage />)` and destructure `user` for interactions
- Prefer `findBy*` (async) when waiting for data to load; use `within(dialog)` to scope queries to open dialogs
- MUI-specific: `Switch` has `role="switch"` not `role="checkbox"`; query Chips by their label text

**Key library IDs for context7:**
- React Testing Library: `/testing-library/testing-library-docs`
- Vitest: `/vitest-dev/vitest`

## E2E Tests

Use the **`e2e-test-writer`** agent to write or update Playwright tests — it has full context on the test infrastructure, session injection patterns, MUI selectors, and POM conventions.

Invoke it with: `use e2e-test-writer to write tests for <feature>`

The agent handles: auth fixtures, Page Object Models, `data-testid` placement, and DB state management. See `.claude/agents/e2e-test-writer.md` for its full instructions.

## Key Conventions

- All API routes are prefixed `/api/`
- Frontend proxies `/api/*` to the backend via Vite — no CORS config needed
- Prisma 7: datasource URL lives in `prisma.config.ts`, not `schema.prisma`
- MUI v9: do not use the `sx` prop for styling. Use `styled()` components instead
- Bun runs TypeScript natively — no tsc or ts-node needed
- **Frontend HTTP calls use the shared Axios instance** from `frontend/src/lib/api.ts` — never use raw `axios` or `fetch` directly. The instance includes a 401 interceptor that redirects to `/login` on session expiry
- **API functions live in `frontend/src/services/`** — one file per backend resource (e.g. `users.ts`, `tickets.ts`). Use `extractError` from `src/lib/api.ts` to surface server error messages in mutations
- **Use Zod for all data validation** — validate request bodies in backend route handlers and parse/validate API responses on the frontend where needed. Resolve the Zod library ID via context7 before use.
- **Shared Zod schemas live in `@repo/core`** — any schema used by both frontend and backend goes in `core/src/schemas/`. Import as `import { mySchema } from '@repo/core'`. Schemas used only on one side stay local. The shared package uses `peerDependencies` for Zod so consumers provide it. Each schema file also exports `z.infer` types with domain names (e.g. `CreateUserInput`, `UpdateUserInput`) — import these instead of re-inferring locally.

## Documentation

Always use **context7** to fetch up-to-date documentation before writing code for any library. Do not rely on training data for library APIs.

```
# Resolve a library ID first, then query docs
mcp__context7__resolve-library-id  →  mcp__context7__query-docs
```

Key library IDs for this project:
- Bun: `/llmstxt/bun_llms_txt`
- Prisma: resolve via context7 before use (Prisma 7 has breaking changes from v5)
- MUI: resolve via context7 (v9 has breaking changes from v5)
- Express: resolve via context7
- TanStack Query: resolve via context7

## Environment Variables

Copy `backend/.env.example` (or root `.env.example`) to `backend/.env` and fill in:

```
DATABASE_URL="postgresql://helpdesk:helpdesk@localhost:5433/tickets"
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3001"
POSTMARK_TOKEN="..."
ANTHROPIC_API_KEY="..."
ADMIN_EMAIL="..."
ADMIN_PASSWORD="..."
AGENT_EMAIL="..."
AGENT_PASSWORD="..."
PORT=3001
```

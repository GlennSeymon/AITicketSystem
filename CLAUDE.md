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
- **Email:** Inbound webhook (`POST /api/webhooks/inbound-email`); auth via `x-webhook-secret` header or `?secret=` query param; outbound via Postmark (future)

## Project Structure

```
aiTicketSystem/
├── core/                     # @repo/core — Zod schemas shared by frontend + backend
│   ├── tsconfig.json         # Required for IDE TypeScript resolution
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

# E2E tests (from root) — stop dev backend first (test frontend takes port 3001)
bun run test:e2e          # Headless Playwright run
bun run test:e2e:ui       # Interactive Playwright UI — open http://localhost:8080 in your Windows browser (WSL2)

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
3. `express.json({ limit: '100kb' })`
4. All other routes (`/api/tickets`, `/api/webhooks`, `/api/users`, …)

**Frontend wiring:**
- Session state: `const { data, isPending } = authClient.useSession()`
- Sign in: `authClient.signIn.email({ email, password })`
- Sign out: `authClient.signOut()`
- `ProtectedRoute` component redirects unauthenticated users to `/login`
- `AdminRoute` component redirects non-admins to `/` — nest inside `ProtectedRoute`
- `authClient` uses `inferAdditionalFields` plugin so `data.user.role` and `data.user.isActive` are typed

**Role values** match the Prisma enum and are always uppercase. Use `Role.ADMIN` / `Role.AGENT` (imported from `@repo/core`) — never hardcode the strings.

**Creating users programmatically** — Better Auth uses scrypt (`salt:hash` hex format), not bcrypt. Use `(await auth.$context).password.hash(pw)` to generate a compatible hash. Never use `Bun.password.hash` or bcrypt directly.

**No custom auth endpoints** — do not add `/api/auth/login` or `/api/auth/me` routes; Better Auth provides these automatically under `/api/auth/*`.

## Component Tests

Component tests use **Vitest** + **React Testing Library** and live alongside the components they test (`*.test.tsx`).

**Infrastructure files:**
- `frontend/vite.config.ts` — Vitest config (`environment: 'jsdom'`, `clearMocks: true`, `setupFiles`)
- `frontend/src/test/setup.ts` — imports `@testing-library/jest-dom` matchers, stubs `window.matchMedia` / `ResizeObserver` for MUI, and calls `afterEach(cleanup)` (required — RTL v16 does not auto-cleanup without Vitest globals enabled)
- `frontend/src/test/renderWithProviders.tsx` — wraps any component with `MemoryRouter` + `QueryClientProvider`; returns `{ user, ...renderResult }` where `user` is a pre-configured `userEvent` instance. The `MemoryRouter` is required because any page that renders a `<Link>` will throw without Router context.

**Writing tests:**
- Mock service modules at the top of the file using a path relative to the test file: `vi.mock('../../services/users')`
- Use `renderWithProviders(<MyPage />)` and destructure `user` for interactions
- Prefer `findBy*` (async) when waiting for data to load; use `within(dialog)` to scope queries to open dialogs
- MUI-specific: `Switch` has `role="switch"` not `role="checkbox"`; query Chips by their label text
- MUI `Select` requires explicit `id` and `labelId` on the `Select`/`InputLabel` pair for `getByLabel` to resolve it in tests. When the visual label is a separate Typography (not an InputLabel), add a visually-hidden `SrOnlyLabel` (sr-only styled InputLabel) with an `id`, and set `labelId` on the Select to match — this gives the combobox an accessible name so tests can use `getByRole('combobox', { name: 'Field name' })`. Never use `display: none` for this, as it removes the element from the accessibility tree and breaks aria-labelledby resolution. Use `visuallyHidden` from `@mui/utils` to define the style: `const SrOnlyLabel = styled(InputLabel)(visuallyHidden)` — install `@mui/utils` explicitly (`bun add @mui/utils` in `frontend/`) as it is a transitive dep that Vitest cannot resolve without an explicit entry in `package.json`.
- When fully mocking `react-router-dom` (e.g. `vi.mock('react-router-dom', () => ({ useParams, useNavigate }))`), include a passthrough `MemoryRouter` in the factory — otherwise `renderWithProviders` (which imports `MemoryRouter` from the same module) will receive `undefined`: `MemoryRouter: ({ children }: { children: ReactNode }) => <>{children}</>`. If the component under test renders a `Link`, also add a passthrough to the mock factory: `Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={String(to)}>{children}</a>`
- Avoid `getByText(/partialName/)` when the same text appears in multiple elements (e.g. a header field and a message bubble). Use a regex that matches a unique combination: `getByText(/Alice Tester.*alice@example\.com/)`
- Add `noValidate` to every `<form>` so react-hook-form/Zod owns all validation — without it, browsers block submit on `type="email"` inputs before react-hook-form fires
- The `ResizeObserver` stub in `setup.ts` must be a `class` (not an arrow function) so MUI `TextareaAutosize` can call `new ResizeObserver(...)` without throwing

**Component vs E2E split:**
- **Component tests** — anything testable in isolation: rendering states (loading, error, empty), table/list display, dialog open/close, form validation, mutation calls, cancel behaviour
- **E2E tests** — only what requires the full stack: auth redirects, role-based routing, cross-page navigation, full create-then-list flows that depend on real network + DB

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
- **Prisma migrations with pgvector** — `prisma migrate dev` fails because the shadow database cannot create the `vector` extension (requires superuser). Use this workflow instead:
  1. `bunx prisma db push` — applies schema changes directly to the dev DB
  2. `bunx prisma generate` — regenerates the client
  3. Create the migration SQL file manually under `prisma/migrations/<timestamp>_<name>/migration.sql`
  4. `bunx prisma migrate resolve --applied <name>` — marks it as applied in the migration history
- **DB table naming** — all Prisma models must have an explicit `@@map("lowerCamelCase")` directive. Without it, Prisma defaults to the model name (PascalCase) as the table name, which is inconsistent with the Better Auth tables (`user`, `session`, etc.).
- **Renaming DB objects** — when renaming a Prisma model, enum, or table, run the SQL rename manually first (`ALTER TABLE "Old" RENAME TO "new"` / `ALTER TYPE "Old" RENAME TO "new"`), then `db push` + `generate`, then create and resolve a migration file as above.
- **TypeScript: prefer `interface` over `type` for object shapes** — use `interface` for any plain object contract (API responses, component props, service types). Reserve `type` for unions, intersections, mapped types, and aliases of non-object shapes. `type` is still correct for Zod-inferred types (`type Foo = z.infer<typeof fooSchema>`) and for types derived via utility types (`type UpdateFoo = Partial<Pick<Foo, 'a' | 'b'>>`).
- **TypeScript: use utility types to avoid repeating fields** — when a request type is a subset or partial of a response type, derive it rather than relisting fields: `interface CreateFoo extends Pick<Foo, 'name' | 'role'> { password: string }` and `type UpdateFoo = Partial<Pick<Foo, 'name' | 'role' | 'isActive'>>`. Write-only fields like `password` must not appear on the response interface — they belong only on the request type.
- **TypeScript: passwords are write-only** — never include `password` on a response interface (e.g. `User`). It belongs only on the create/update request type.
- MUI v9: do not use the `sx` prop for styling. Use `styled()` components instead
- **Single responsibility for components** — each component should do one thing: display data, own mutations, or control page layout — not all three. Page-level components compose smaller focused components rather than mixing data fetching, editing logic, and layout in one place.
- **Shared layout components** live in `frontend/src/components/layout.ts` — import `PageContainer` (padded `Container`) and `PageHeader` (flex row, space-between) from there rather than redefining them per page
- **`BackLink`** lives in `frontend/src/components/BackLink.tsx` — use `<BackLink to='/path'>Label</BackLink>` for back navigation on detail pages; the arrow icon is included by the component
- **Navigation uses links, not buttons** — use React Router `Link` (via `BackLink` or `styled(Link)`) for navigating to a known URL. Reserve `Button` for actions. Links give users right-click → open in new tab and correct browser history behaviour that `onClick(() => navigate(...))` does not.
- **Responsive two-column layout** — use a `styled(Grid)` container with two `Grid size={{ xs: 12, sm: 6 }}` items (stacks to 1 col on mobile, 2 on `sm`+); put a `Stack direction='column' spacing={2}` inside each item for vertical field stacking
- **MUI v9 + react-hook-form `TextField`**: `inputRef` is removed — pass the Controller `ref` via `slotProps={{ htmlInput: { ref } }}`. Use `helperText={errors.field?.message ?? ' '}` only when the form has room to spare; omit the `?? ' '` fallback in height-constrained dialogs (the fallback reserves ~23px per field even when there is no error). Always check context7 (`/websites/mui_material-ui`) before writing MUI form code.
- Bun runs TypeScript natively — no tsc or ts-node needed
- **Frontend HTTP calls use the shared Axios instance** from `frontend/src/lib/api.ts` — never use raw `axios` or `fetch` directly. The instance includes a 401 interceptor that redirects to `/login` on session expiry
- **API functions live in `frontend/src/services/`** — one file per backend resource (e.g. `users.ts`, `tickets.ts`). Use `extractError` from `src/lib/api.ts` to surface server error messages in mutations
- **Use Zod for all data validation** — validate request bodies in backend route handlers and parse/validate API responses on the frontend where needed. Resolve the Zod library ID via context7 before use.
- **Shared Zod schemas live in `@repo/core`** — any schema used by both frontend and backend goes in `core/src/schemas/`. Import as `import { mySchema } from '@repo/core'`. Schemas used only on one side stay local. The shared package uses `peerDependencies` for Zod so consumers provide it. Each schema file also exports `z.infer` types with domain names (e.g. `CreateUserInput`, `UpdateUserInput`) — import these instead of re-inferring locally. Each schema file also exports **enum constant objects** derived from its Zod enums (e.g. `Role`, `TicketStatus`, `TicketCategory`). Always import and use these instead of hardcoding string values — backend uses Prisma-generated enums for the same purpose, frontend uses the core exports.
- **Never use `.default()` in shared schemas** — Zod's `.default()` splits the schema into mismatched input/output types, which breaks `zodResolver` in react-hook-form with a type error on the `resolver` prop. Apply defaults in the form's `defaultValues` instead.
- **Inline optimistic edit pattern** — For inline-editable fields (Select that fires on change), use a local state variable initialised to `''` and a dedicated `useMutation` per field. Set local state immediately before calling `mutate()`, then derive the displayed value as `mutation.isPending ? localValue : serverValue`. Use separate mutations per field so one field's pending state never masks another field's current value.
- **Displaying enum values** — Database enums are stored uppercase (`OPEN`, `TECHNICAL`). Display them in title case using `toTitleCase()` from `src/lib/format.ts`. The Select `value` prop stays as the uppercase enum string; only the `MenuItem` label uses title case.

## Documentation

**Always fetch context7 docs before writing any library code.** Do not rely on training data — APIs change between major versions and training data is often stale. This is a required step, not optional.

```
# Required workflow for any library usage:
mcp__context7__resolve-library-id  →  mcp__context7__query-docs
```

This applies to every library in this project: MUI, Prisma, Better Auth, react-hook-form, TanStack Query, Zod, Express, Bun, Postmark, and any others. Query with a specific question (e.g. "TextField error helperText react-hook-form Controller ref MUI v9") rather than just a library name.

Key library IDs for this project:
- Bun: `/llmstxt/bun_llms_txt`
- Prisma: resolve via context7 before use (Prisma 7 has breaking changes from v5)
- MUI: `/websites/mui_material-ui` (v9 has breaking changes from v5)
- Express: resolve via context7
- TanStack Query: resolve via context7

## Environment Variables

Copy `backend/.env.example` (or root `.env.example`) to `backend/.env` and fill in:

```
DATABASE_URL="postgresql://helpdesk:helpdesk@localhost:5433/tickets"
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="http://localhost:3001"
ANTHROPIC_API_KEY="..."
ADMIN_EMAIL="..."
ADMIN_PASSWORD="..."
AGENT_EMAIL="..."
AGENT_PASSWORD="..."
PORT=3001
WEBHOOK_SECRET="..."
```

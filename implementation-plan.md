# Implementation Plan — AI Ticket Management System

## Stack Summary
- **Frontend:** React 18 + TypeScript + Vite + MUI
- **Backend:** Node.js + TypeScript + Express + Prisma
- **Database:** PostgreSQL + pgvector
- **Auth:** express-session + connect-pg-simple + bcrypt
- **AI:** Anthropic Claude API (Haiku for classification/summaries, Sonnet for drafting/polish)
- **Embeddings:** @xenova/transformers (local, free, no API key)
- **Email:** Postmark (inbound webhook + outbound sending)

---

## Phase 1 — Project Foundation

**Goal:** Runnable skeleton with both apps connected to a database.

- [ ] Create monorepo folder structure (`/frontend`, `/backend`)
- [ ] Scaffold backend: `npm init`, TypeScript config, `ts-node-dev`, Express app with a `GET /health` endpoint
- [ ] Scaffold frontend: `npm create vite` (React + TypeScript), install MUI, TanStack Query
- [ ] `docker-compose.yml` with PostgreSQL 16 + pgvector extension enabled
- [ ] `.env.example` listing all required env vars (`DATABASE_URL`, `SESSION_SECRET`, `POSTMARK_TOKEN`, `ANTHROPIC_API_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- [ ] `prisma init`, configure `DATABASE_URL`, confirm connection

---

## Phase 2 — Database Schema

**Goal:** All tables defined and migrated; pgvector ready for KB embeddings.

- [ ] `User` model: `id`, `email`, `passwordHash`, `role` (ADMIN | AGENT), `isActive`, `createdAt`
- [ ] `Session` table: raw SQL migration (connect-pg-simple format, not Prisma-managed)
- [ ] `Ticket` model: `id`, `subject`, `body`, `fromEmail`, `fromName`, `postmarkMessageId`, `status` (OPEN | RESOLVED | CLOSED), `category` (GENERAL | TECHNICAL | REFUND | UNCATEGORISED), `aiDraft`, `aiSummary`, `createdAt`, `updatedAt`
- [ ] `Message` model: `id`, `ticketId`, `body`, `direction` (INBOUND | OUTBOUND), `createdAt`
- [ ] `KBArticle` model: `id`, `title`, `content`, `embedding Unsupported("vector(384)")`, `createdAt`, `updatedAt`
- [ ] Run `prisma migrate dev` — initial migration
- [ ] Seed script: creates first admin user from `ADMIN_EMAIL` + `ADMIN_PASSWORD` env vars

---

## Phase 3 — Authentication

**Goal:** Login/logout working; all routes protected by role.

**Backend**
- [ ] Install and configure `express-session` + `connect-pg-simple` + `bcrypt`
- [ ] `POST /api/auth/login` — verify credentials, create session
- [ ] `POST /api/auth/logout` — destroy session
- [ ] `GET /api/auth/me` — return current user or 401
- [ ] `requireAuth` middleware — rejects unauthenticated requests with 401
- [ ] `requireAdmin` middleware — rejects non-admin sessions with 403

**Frontend**
- [ ] `AuthContext` — stores current user, exposes `login` / `logout`
- [ ] Login page — MUI `Card` with email + password fields
- [ ] Protected route wrapper — redirects to `/login` if unauthenticated
- [ ] On app load, call `GET /api/auth/me` to rehydrate auth state

---

## Phase 4 — Ticket Ingestion & Core API

**Goal:** Emails arrive as tickets; full CRUD API in place.

**Backend**
- [ ] `POST /api/webhooks/postmark` — parse inbound payload, create `Ticket` + initial `Message`
- [ ] Thread detection — match `References` / `In-Reply-To` headers to existing `postmarkMessageId`; append as new `Message` instead of creating a new ticket
- [ ] `GET /api/tickets` — list tickets; support `?status=` and `?category=` query params
- [ ] `GET /api/tickets/:id` — full ticket detail including messages
- [ ] `PATCH /api/tickets/:id` — update `status` and/or `category`
- [ ] `POST /api/tickets/:id/messages` — agent adds an internal note

**Frontend**
- [ ] Ticket list page — MUI `Table` with subject, status, category, date columns
- [ ] Ticket detail page — email body, message thread, metadata panel

---

## Phase 5 — Ticket Management UI

**Goal:** Agents can fully work a ticket from the UI.

- [ ] Filter bar on ticket list — `status` and `category` dropdowns; reset button
- [ ] Status badge component — colour-coded (orange = open, green = resolved, grey = closed)
- [ ] Status update control on ticket detail (button group or dropdown)
- [ ] Category label on ticket detail with override dropdown
- [ ] Loading skeletons for ticket list and detail
- [ ] Empty state for ticket list when no results match filters
- [ ] App shell — MUI `Drawer` sidebar navigation + main content area

---

## Phase 6 — AI Classification

**Goal:** Every new ticket is automatically categorised by Claude.

- [ ] `backend/src/services/ai.ts` — `classifyTicket(subject, body)`: calls Claude Haiku, returns `GENERAL | TECHNICAL | REFUND`
- [ ] Invoke `classifyTicket` in the Postmark webhook handler; persist result to `Ticket.category`
- [ ] `POST /api/tickets/:id/classify` — manually re-trigger classification
- [ ] Re-classify button on ticket detail UI

---

## Phase 7 — Knowledge Base

**Goal:** Admins can build the KB; semantic search powers AI responses.

- [ ] Install `@xenova/transformers`; create `backend/src/services/embeddings.ts` — `generateEmbedding(text)` uses `Xenova/all-MiniLM-L6-v2` (384-dim, ~25MB, downloaded once)
- [ ] `backend/src/services/kb.ts` — `searchKB(query, limit)`: generate query embedding → pgvector cosine-similarity query against `KBArticle.embedding`
- [ ] `POST /api/kb` (admin) — create article, generate and store embedding
- [ ] `GET /api/kb` — list all articles
- [ ] `GET /api/kb/:id` — single article
- [ ] `PUT /api/kb/:id` (admin) — update article, regenerate embedding
- [ ] `DELETE /api/kb/:id` (admin) — delete article
- [ ] KB management page (admin only) — MUI `DataGrid`, create/edit form in a `Dialog`

---

## Phase 8 — AI Response Drafting

**Goal:** Every ticket gets an AI-drafted reply, ready for agent review.

- [ ] `backend/src/services/ai.ts` — `draftResponse(ticket, kbArticles[])`: calls Claude Sonnet with ticket content + KB context, returns a natural-language reply draft
- [ ] On ticket creation: generate ticket embedding → `searchKB` → `draftResponse` → persist to `Ticket.aiDraft`
- [ ] `POST /api/tickets/:id/draft` — regenerate AI draft on demand
- [ ] AI draft panel on ticket detail — read-only display with a "Regenerate draft" button

---

## Phase 9 — Response Approval & Sending

**Goal:** Agent approves draft → email sent to customer → ticket resolved.

- [ ] `backend/src/services/email.ts` — `sendReply(to, subject, body, inReplyTo)`: calls Postmark outbound API
- [ ] `POST /api/tickets/:id/send` — sends the current draft (or a provided body), creates outbound `Message`, sets `status` to RESOLVED
- [ ] Agent can edit the AI draft inline before sending (editable `TextField` pre-filled with `aiDraft`)
- [ ] "Send & Resolve" button on ticket detail — calls send endpoint, redirects to ticket list

---

## Phase 10 — Polish Feature

**Goal:** Agent writes a rough reply; AI refines tone and wording.

- [ ] `backend/src/services/ai.ts` — `polishResponse(draft)`: calls Claude Sonnet, returns a polished version of the agent's draft
- [ ] `POST /api/tickets/:id/polish` — accepts `{ draft: string }`, returns `{ polished: string }`
- [ ] "Polish" button next to the reply `TextField` — replaces textarea content with polished version

---

## Phase 11 — AI Summaries

**Goal:** Agents can scan a ticket instantly via a short AI-written summary.

- [ ] `backend/src/services/ai.ts` — `summariseTicket(subject, body)`: calls Claude Haiku, returns a 2–3 sentence summary
- [ ] Generate summary on ticket creation; persist to `Ticket.aiSummary`
- [ ] `POST /api/tickets/:id/summarise` — regenerate on demand
- [ ] Summary displayed at the top of the ticket detail page (MUI `Alert`)

---

## Phase 12 — User Management

**Goal:** Admin can create and deactivate agent accounts.

- [ ] `POST /api/users` (admin) — create agent with email + temporary password
- [ ] `GET /api/users` (admin) — list all users
- [ ] `PATCH /api/users/:id` (admin) — toggle `isActive`
- [ ] `PATCH /api/users/:id/password` — agent changes their own password
- [ ] User management page (admin only) — MUI `Table`, create user `Dialog`, active/inactive toggle

---

## Phase 13 — Dashboard & Stats

**Goal:** Agents and admins see system-wide ticket health at a glance.

- [ ] `GET /api/stats` — return ticket counts grouped by `status` and by `category`
- [ ] Dashboard page — MUI stat cards (open / resolved / closed totals)
- [ ] Breakdown table or bar chart by category (MUI X Charts)
- [ ] Dashboard is the default landing page after login

---

## Phase 14 — Hardening

**Goal:** Production-ready error handling, validation, and UX polish.

- [ ] Global Express error-handling middleware — consistent `{ error: string }` JSON responses
- [ ] Zod validation on all request bodies in backend routes
- [ ] React error boundary wrapping the main app
- [ ] MUI `Snackbar` toast notifications for success and error actions
- [ ] Confirm `Dialog` before destructive actions (close ticket, delete KB article)
- [ ] Rate-limit `POST /api/webhooks/postmark` to prevent abuse
- [ ] Verify all admin-only routes return 403 for agent sessions

---

## Build Order Rationale

Phases 1–5 establish the foundation (infra → schema → auth → data in → basic UI). Phases 6–11 layer AI features on top and can be tackled in any order once Phase 5 is stable. Phases 12–13 add admin tooling. Phase 14 hardening can be applied incrementally throughout.

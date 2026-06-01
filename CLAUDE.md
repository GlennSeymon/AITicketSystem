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
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express entry point
│   │   ├── routes/           # Route handlers
│   │   ├── services/         # ai.ts, email.ts, kb.ts, embeddings.ts
│   │   └── middleware/       # auth, validation
│   ├── prisma/
│   │   └── schema.prisma
│   └── prisma.config.ts      # Prisma 7 datasource config
├── frontend/
│   ├── src/
│   │   ├── main.tsx          # QueryClientProvider + ReactQueryDevtools
│   │   └── App.tsx
│   └── vite.config.ts        # /api proxy → localhost:3001
├── docker-compose.yml        # pgvector/pgvector:pg16
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
docker compose up -d      # Start PostgreSQL on port 5433
```

## Key Conventions

- All API routes are prefixed `/api/`
- Frontend proxies `/api/*` to the backend via Vite — no CORS config needed
- Prisma 7: datasource URL lives in `prisma.config.ts`, not `schema.prisma`
- MUI v9: do not use the `sx` prop for styling. Use `styled()` components instead
- Bun runs TypeScript natively — no tsc or ts-node needed

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
PORT=3001
```

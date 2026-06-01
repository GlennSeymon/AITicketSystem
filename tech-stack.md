# Tech Stack — AI Ticket Management System

## Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Components + Styling | MUI (Material UI) |
| Data fetching | TanStack Query (React Query) |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |

## Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Validation | Zod |
| ORM | Prisma |
| Auth | express-session + connect-pg-simple + bcrypt |

## Database

| Layer | Technology |
|---|---|
| Primary DB | PostgreSQL |
| Vector search | pgvector (PostgreSQL extension) |

## AI

| Layer | Technology |
|---|---|
| Provider | Anthropic Claude API |
| Classification | claude-haiku-4-5 (fast, low cost) |
| Response drafting + Polish | claude-sonnet-4-6 |
| SDK | @anthropic-ai/sdk (TypeScript) |

## Email

| Layer | Technology |
|---|---|
| Inbound + Outbound | Postmark |

## Infrastructure

| Layer | Technology |
|---|---|
| Containerisation | Docker + docker-compose |
| Hosting | TBD |

## Architecture

```
Customer email
     │
     ▼
Postmark inbound webhook
     │
     ▼
Express API ──► PostgreSQL (tickets, users, KB)
     │               │
     │          pgvector (KB embeddings)
     │
     ▼
Anthropic Claude API
  • Classify ticket (claude-haiku-4-5)
  • KB semantic search → draft response (claude-sonnet-4-6)
  • Polish endpoint (claude-sonnet-4-6)
     │
     ▼
React Agent Dashboard (MUI)
  • Shared ticket queue
  • AI draft shown per ticket
  • Approve / edit / Polish
  • Admin: user management
     │
     ▼
Postmark outbound → Customer email
```

## Project Structure

```
aiTicketSystem/
├── frontend/              (Vite + React + TypeScript)
│   ├── src/
│   └── package.json
├── backend/               (Express + TypeScript)
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── ai.ts      (Claude API calls)
│   │   │   ├── email.ts   (Postmark)
│   │   │   └── kb.ts      (KB search via pgvector)
│   │   ├── middleware/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
└── docker-compose.yml     (PostgreSQL + app services)
```

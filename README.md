# AI Ticket Management System

An AI-powered support ticket system for an online programming course business. It replaces a manual Freshdesk workflow by automatically classifying incoming emails, drafting personalised responses using a knowledge base, and providing a human agent dashboard for review and approval.

> This project was built using [Claude Code](https://claude.ai/code) as part of the [Code with Mosh — Claude Code for Professional Developers](https://codewithmosh.com/p/claude-code) course.

## Features

- **Email ingestion** — Receives support emails via Brevo inbound parsing and creates tickets
- **AI classification** — Automatically categorises tickets (General, Technical, Refund) using GPT-5 Nano via a background job queue
- **AI auto-resolution** — New tickets are assigned to an AI agent that attempts to resolve them from the knowledge base; falls back to the human agent queue if no answer is found
- **AI response drafting** — Drafts a reply from the knowledge base using GPT-5 Nano
- **Human approval workflow** — Agents review and approve AI drafts before any email is sent
- **Polish feature** — Agents can write a rough reply and have the AI refine the tone and wording (streamed live)
- **AI summaries** — On-demand one-paragraph ticket summaries for fast scanning (streamed live)
- **Knowledge base** — Markdown file (`backend/knowledge-base.md`) that the AI reads to resolve and draft responses
- **User management** — Admin creates and manages agent accounts
- **Metrics dashboard** — Total tickets, open tickets, AI resolution rate, average resolution time, and a 30-day ticket volume chart
- **Dark mode** — Light/dark theme toggle persisted to `localStorage`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + MUI v9 + React Router 7 |
| Backend | Express + TypeScript + Bun |
| Database | PostgreSQL 16 + pgvector extension |
| ORM | Prisma 7 |
| Auth | Better Auth (email/password, database sessions) |
| AI | OpenAI API via Vercel AI SDK (`gpt-5-nano`) |
| Queue | pg-boss (PostgreSQL-backed job queue) |
| Email | Brevo (inbound parsing + transactional HTTP API) |
| Error tracking | Sentry (frontend + backend, proxied tunnel) |

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com) (for PostgreSQL)
- OpenAI API key
- [Brevo](https://www.brevo.com) account (for inbound email parsing and outbound transactional email)
- [Sentry](https://sentry.io) project (optional — for error tracking)

## Getting Started

**1. Clone and install dependencies**

```bash
git clone https://github.com/GlennSeymon/AITicketSystem.git
cd AITicketSystem
bun install
```

**2. Configure environment variables**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and fill in your credentials:

```
DATABASE_URL="postgresql://helpdesk:helpdesk@localhost:5433/tickets"
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:3001"
BETTER_AUTH_TRUSTED_ORIGINS="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-admin-password"
AGENT_EMAIL="agent@example.com"
AGENT_PASSWORD="your-agent-password"
PORT=3001
WEBHOOK_SECRET="your-webhook-secret"
OPENAI_API_KEY="your-openai-key"
BREVO_API_KEY="your-brevo-api-key"
BREVO_FROM_EMAIL="support@yourdomain.com"
SENTRY_DSN="your-sentry-dsn"           # optional
SENTRY_ENVIRONMENT="development"       # optional
```

For Sentry frontend events, create `frontend/.env`:

```
VITE_SENTRY_DSN="your-sentry-dsn"        # optional
VITE_SENTRY_ENVIRONMENT="development"    # optional
```

**3. Start the database**

```bash
docker compose up -d
```

**4. Run database migrations and seed users**

```bash
bun run db:migrate
bun run db:seed
```

The seed creates an admin user, a human agent, and the internal AI agent (`ai@ticketsystem.internal`).

**5. Start the development servers**

```bash
# In separate terminals (or use a process manager)
bun run dev:backend    # http://localhost:3001
bun run dev:frontend   # http://localhost:3000
```

## Project Structure

```
AITicketSystem/
├── core/                     # Shared Zod schemas + types (@repo/core)
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express entry point
│   │   ├── constants.ts      # Shared constants (AI_AGENT_EMAIL, etc.)
│   │   ├── queue.ts          # pg-boss job queue setup
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # classifyTicket, autoResolve, email
│   │   └── middleware/       # Auth, validation
│   ├── prisma/
│   │   └── schema.prisma
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── vite.config.ts
├── e2e/                      # Playwright end-to-end tests
├── docker-compose.yml
└── .env.example
```

## Ticket Workflow

```
Incoming email (Brevo inbound webhook)
        │
        ▼
  Ticket created → assigned to AI agent (status: NEW)
        │
        ▼
  pg-boss queues classification job
        │
        ▼
  Auto-classify category (GPT-5 Nano) → status: PROCESSING
        │
        ▼
  KB lookup + draft response attempt (GPT-5 Nano + knowledge-base.md)
        │
        ├─── Resolved → reply sent via Brevo, status: RESOLVED (AI agent stays assigned)
        │
        └─── No match → status: OPEN, unassigned (enters human agent queue)
                │
                ▼
          Agent reviews → edits or polishes reply → approves
                │
                ▼
          Email sent to customer (Brevo transactional HTTP API)
                │
                ▼
          Ticket marked Resolved / Closed
```

## User Roles

| Role | Permissions |
|---|---|
| Admin | Full access; creates and manages agent accounts; edits `knowledge-base.md` directly |
| Agent | Views ticket queue; reviews and sends AI-drafted responses |

## Ticket Statuses

- **New** — just arrived, queued for AI processing
- **Processing** — AI is attempting auto-resolution
- **Open** — ready for human agent review
- **Resolved** — resolved by AI or human agent
- **Closed** — confirmed closed, no further action needed

## API

All endpoints are prefixed `/api/`. The Vite dev server proxies `/api/*` to the backend, so no CORS configuration is required in development.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Health check |
| `GET` | `/api/tickets` | Agent | List tickets (filterable, sortable, paginated) |
| `POST` | `/api/tickets` | Agent | Create a ticket manually |
| `GET` | `/api/tickets/stats` | Agent | Aggregate metrics (totals, AI rate, avg resolution time) |
| `GET` | `/api/tickets/daily` | Agent | Daily ticket counts for the last 30 days |
| `GET` | `/api/tickets/:id` | Agent | Get a single ticket with replies |
| `PATCH` | `/api/tickets/:id` | Agent | Update status, category, or assignee |
| `POST` | `/api/tickets/:id/replies` | Agent | Add a reply and send outbound email |
| `POST` | `/api/tickets/:id/summarise` | Agent | Stream an AI summary for the ticket |
| `POST` | `/api/tickets/polish-reply` | Agent | Stream a polished version of a draft reply |
| `GET` | `/api/agents` | Agent | List assignable agents (excludes AI agent) |
| `GET` | `/api/users` | Admin | List all users |
| `POST` | `/api/users` | Admin | Create a user |
| `PATCH` | `/api/users/:id` | Admin | Update name, role, or active status |
| `DELETE` | `/api/users/:id` | Admin | Soft-delete a user (sets `isActive: false`) |
| `POST` | `/api/webhooks/inbound-email` | Secret | Brevo inbound email webhook |

## License

This project is licensed under the [MIT License](LICENSE).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

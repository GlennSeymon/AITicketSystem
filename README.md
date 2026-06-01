# AI Ticket Management System

An AI-powered support ticket system for an online programming course business. It replaces a manual Freshdesk workflow by automatically classifying incoming emails, drafting personalised responses using a knowledge base, and providing a human agent dashboard for review and approval.

## Features

- **Email ingestion** — Receives support emails via Postmark webhooks and creates tickets
- **AI classification** — Automatically categorises tickets (General, Technical, Refund) using Claude Haiku
- **AI response drafting** — Searches a knowledge base semantically and drafts a reply using Claude Sonnet
- **Human approval workflow** — Agents review and approve AI drafts before any email is sent
- **Polish feature** — Agents can write a rough reply and have Claude refine the tone and wording
- **AI summaries** — One-paragraph ticket summaries for fast scanning
- **Knowledge base management** — Admins build and maintain KB articles; semantic search powered by local embeddings
- **User management** — Admin creates and manages agent accounts
- **Dashboard** — Ticket queue with filtering by status and category, plus stats overview

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + MUI |
| Backend | Express + TypeScript + Bun |
| Database | PostgreSQL 16 + pgvector |
| ORM | Prisma 7 |
| Auth | express-session + connect-pg-simple + bcrypt |
| AI | Anthropic Claude API (Haiku + Sonnet) |
| Embeddings | @xenova/transformers (local, no API key) |
| Email | Postmark |

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com) (for PostgreSQL)
- Anthropic API key
- Postmark account (for email ingestion/sending)

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
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tickets"
SESSION_SECRET="your-secret-here"
POSTMARK_TOKEN="your-postmark-token"
ANTHROPIC_API_KEY="your-anthropic-key"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-admin-password"
PORT=3001
```

**3. Start the database**

```bash
docker compose up -d
```

**4. Run database migrations and seed the admin user**

```bash
bun run db:migrate
bun run db:seed
```

**5. Start the development servers**

```bash
# In separate terminals (or use a process manager)
bun run dev:backend    # http://localhost:3001
bun run dev:frontend   # http://localhost:3000
```

## Project Structure

```
AITicketSystem/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express entry point
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # ai.ts, email.ts, kb.ts, embeddings.ts
│   │   └── middleware/       # Auth, validation
│   ├── prisma/
│   │   └── schema.prisma
│   └── prisma.config.ts
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── vite.config.ts
├── docker-compose.yml
├── implementation-plan.md
├── projectScope.md
└── tech-stack.md
```

## Ticket Workflow

```
Incoming email (Postmark webhook)
        │
        ▼
  Auto-classify (Claude Haiku)
        │
        ▼
  KB semantic search + draft response (Claude Sonnet)
        │
        ▼
  Agent reviews draft → edits if needed → approves
        │
        ▼
  Email sent to customer (Postmark)
        │
        ▼
  Ticket marked Resolved
```

## User Roles

| Role | Permissions |
|---|---|
| Admin | Full access; creates and manages agent accounts; manages knowledge base |
| Agent | Views ticket queue; reviews and sends AI-drafted responses |

## Ticket Statuses

- **Open** — received, awaiting response
- **Resolved** — response sent to customer
- **Closed** — confirmed closed, no further action needed

## API

All endpoints are prefixed `/api/`. The Vite dev server proxies `/api/*` to the backend, so no CORS configuration is required in development.

Health check: `GET /api/health`

## License

This project is licensed under the [MIT License](LICENSE).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

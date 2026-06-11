-- Reconcile ticket and reply schemas with the current Prisma model.
-- Several changes were applied to the dev DB via `prisma db push` but were
-- never captured in the migration history:
--   - ticket.assignedAgentId column (added for agent assignment)
--   - ticket.id type: TEXT → SERIAL INTEGER
--   - reply.ticketId type: TEXT → INTEGER (FK to ticket.id)
--   - ticket.category: NOT NULL → nullable
--   - ticket.status default: 'OPEN' → 'NEW'
--   - ticket.fromName: nullable → NOT NULL
-- All DO blocks check current state first, so this migration is safe to
-- run on both a fresh Railway DB and a local dev DB that is already correct.

-- 1. Add assignedAgentId if it does not already exist
ALTER TABLE "ticket" ADD COLUMN IF NOT EXISTS "assignedAgentId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ticket_assignedAgentId_fkey'
    ) THEN
        ALTER TABLE "ticket" ADD CONSTRAINT "ticket_assignedAgentId_fkey"
            FOREIGN KEY ("assignedAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 2. Create (or replace) the ticket stats function
CREATE OR REPLACE FUNCTION get_ticket_stats(ai_agent_email TEXT)
RETURNS TABLE (
    total_tickets      BIGINT,
    open_tickets       BIGINT,
    resolved_by_ai     BIGINT,
    ai_resolution_pct  NUMERIC,
    avg_resolution_ms  DOUBLE PRECISION
)
LANGUAGE sql
STABLE
AS $$
    WITH ai_id AS (
        SELECT id FROM "user"
        WHERE email = ai_agent_email AND "isActive" = true
        LIMIT 1
    )
    SELECT
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE t.status = 'OPEN')::BIGINT,
        COUNT(*) FILTER (
            WHERE t.status = 'RESOLVED'
              AND t."assignedAgentId" = (SELECT id FROM ai_id)
        )::BIGINT,
        CASE WHEN COUNT(*) > 0 THEN
            ROUND(
                COUNT(*) FILTER (
                    WHERE t.status = 'RESOLVED'
                      AND t."assignedAgentId" = (SELECT id FROM ai_id)
                )::NUMERIC / COUNT(*)::NUMERIC * 1000
            ) / 10
        ELSE 0::NUMERIC END,
        EXTRACT(EPOCH FROM AVG(t."resolvedAt" - t."createdAt")) * 1000
    FROM "ticket" t
$$;

-- 3. Convert ticket.id from TEXT to SERIAL INTEGER and reply.ticketId to INTEGER.
--    Skipped when ticket.id is already an integer type (local dev DB).
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ticket' AND column_name = 'id') = 'text' THEN

        -- Drop the FK from reply that references ticket.id
        ALTER TABLE "reply" DROP CONSTRAINT IF EXISTS "Message_ticketId_fkey";
        ALTER TABLE "reply" DROP CONSTRAINT IF EXISTS "Reply_ticketId_fkey";
        ALTER TABLE "reply" DROP CONSTRAINT IF EXISTS "reply_ticketId_fkey";

        -- Drop the old TEXT primary key and replace with SERIAL
        ALTER TABLE "ticket" DROP CONSTRAINT IF EXISTS "Ticket_pkey";
        ALTER TABLE "ticket" DROP CONSTRAINT IF EXISTS "ticket_pkey";
        ALTER TABLE "ticket" DROP COLUMN "id";
        ALTER TABLE "ticket" ADD COLUMN "id" SERIAL NOT NULL;
        ALTER TABLE "ticket" ADD CONSTRAINT "ticket_pkey" PRIMARY KEY ("id");

        -- Convert reply.ticketId to INTEGER (table is empty on a fresh DB)
        ALTER TABLE "reply" ALTER COLUMN "ticketId" TYPE INTEGER USING 0;

        -- Restore the FK
        ALTER TABLE "reply" ADD CONSTRAINT "reply_ticketId_fkey"
            FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- 4. Make ticket.category nullable (was NOT NULL DEFAULT 'UNCATEGORISED' in init migration)
DO $$
BEGIN
    IF (SELECT is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ticket' AND column_name = 'category') = 'NO' THEN
        ALTER TABLE "ticket" ALTER COLUMN "category" DROP DEFAULT;
        ALTER TABLE "ticket" ALTER COLUMN "category" DROP NOT NULL;
    END IF;
END $$;

-- 5. Update ticket.status default from 'OPEN' to 'NEW' (idempotent)
ALTER TABLE "ticket" ALTER COLUMN "status" SET DEFAULT 'NEW'::"TicketStatus";

-- 6. Ensure ticket.fromName is NOT NULL (was nullable in init migration)
DO $$
BEGIN
    IF (SELECT is_nullable FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'ticket' AND column_name = 'fromName') = 'YES' THEN
        UPDATE "ticket" SET "fromName" = '' WHERE "fromName" IS NULL;
        ALTER TABLE "ticket" ALTER COLUMN "fromName" SET NOT NULL;
    END IF;
END $$;

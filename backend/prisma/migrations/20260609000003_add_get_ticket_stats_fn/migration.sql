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

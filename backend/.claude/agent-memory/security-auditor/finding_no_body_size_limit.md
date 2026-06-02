---
name: finding_no_body_size_limit
description: express.json() has no size limit configured — defaults to 100kb but should be explicit; future webhook handler needs its own raw body parser
metadata:
  type: project
---

`backend/src/index.ts` uses `app.use(express.json())` with no `limit` option. Express defaults to 100kb which is reasonable, but:
1. It should be explicit for auditability
2. The Postmark inbound webhook (when implemented) will need a separate raw body parser to verify HMAC signatures — applying `express.json()` globally before the webhook route will break signature verification

**Fix:** `app.use(express.json({ limit: '100kb' }))` for the API, and mount the webhook route before `express.json()` (similar to how Better Auth is mounted before it).

**How to apply:** When the Postmark webhook route is implemented, ensure it has its own body parser and is mounted before the global `express.json()` middleware.

---
name: finding_me_endpoint_session_leak
description: /api/me returns the full session object including the session token to the client
metadata:
  type: project
---

`GET /api/me` in `backend/src/index.ts` line 19 responds with `{ user: req.user, session: req.session }`.

The `session` object from Better Auth includes the raw session `token` field (the same token stored in the `session` table). Returning this in the API response means the token is accessible to JavaScript and would appear in browser devtools network tab.

**Why it matters:** The Vite proxy makes this accessible to any JS on the frontend origin. If an XSS vulnerability is introduced later, the session token is trivially exfiltrable.

**Fix:** Strip the token before sending. Return only safe session metadata (expiresAt, userId, etc.), or drop `session` from the response entirely — the frontend already gets session data from `authClient.useSession()`.

**How to apply:** Flag any `/api/me`-style endpoint that returns the raw session object. Recommend returning only `{ user: req.user }`.

---
name: finding_no_rate_limiting
description: No rate limiting middleware anywhere in the backend — login endpoint and future webhook endpoints are unprotected from brute force
metadata:
  type: project
---

No `express-rate-limit` or equivalent is installed or configured anywhere in the backend. Better Auth's `/api/auth/sign-in/email` endpoint is exposed without any throttling.

Priority targets when adding rate limiting:
1. `/api/auth/sign-in/email` — brute force credential stuffing
2. Future Postmark inbound webhook — spam/DoS
3. Future AI endpoints — cost amplification attacks

**How to apply:** When adding any route that touches auth, email, or AI APIs, flag the absence of rate limiting as a HIGH finding.

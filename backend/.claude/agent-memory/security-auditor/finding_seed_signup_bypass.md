---
name: finding_seed_signup_bypass
description: seed.ts uses auth.api.signUpEmail() which bypasses disableSignUp — this is intentional for seeding but is a pattern to be aware of
metadata:
  type: project
---

`backend/src/seed.ts` calls `auth.api.signUpEmail()` directly on the server-side API. The `disableSignUp: true` config in `auth.ts` only disables the public HTTP endpoint — server-side API calls can still create users.

This is intentional and correct for seeding. However, it means any backend code with access to the `auth` object can create users regardless of the `disableSignUp` flag.

**How to apply:** If a route is ever added that creates users (e.g., admin inviting a new agent), verify it uses `requireAdmin` and is not accidentally exposed publicly. The `disableSignUp` flag is NOT a complete user-creation barrier at the code level.

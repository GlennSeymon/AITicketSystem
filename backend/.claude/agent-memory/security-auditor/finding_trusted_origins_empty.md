---
name: finding_trusted_origins_empty
description: BETTER_AUTH_TRUSTED_ORIGINS fallback to empty array [] could misconfigure CSRF protection if env var is missing
metadata:
  type: project
---

`backend/src/auth.ts` line 7: `trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? []`

If the environment variable is not set, Better Auth receives `trustedOrigins: []`. The exact behavior (whether Better Auth uses a safe default or becomes permissive/broken) depends on the Better Auth version. An empty array could mean "no origins trusted" (overly restrictive, breaks login) or "all origins trusted" (too permissive). Either way, silently failing is dangerous.

**Fix:** Fail fast if the env var is missing in non-test environments, or provide a documented safe default:

```typescript
trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') 
  ?? (process.env.NODE_ENV === 'production' ? (() => { throw new Error('BETTER_AUTH_TRUSTED_ORIGINS required in production') })() : ['http://localhost:3000']),
```

**How to apply:** Flag any auth config that silently degrades when required env vars are absent.

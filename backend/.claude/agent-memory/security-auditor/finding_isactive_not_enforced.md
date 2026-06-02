---
name: finding_isactive_not_enforced
description: isActive flag on the user model is never checked in requireAuth — deactivated users retain session access
metadata:
  type: project
---

`backend/src/require-auth.ts` calls `auth.api.getSession()` and checks only whether a session exists. It does not inspect `session.user.isActive`.

If an admin deactivates a user (sets `isActive = false`), their existing sessions remain valid until they naturally expire. The `requireAuth` middleware will continue to grant access.

**Fix:** Add an `isActive` check after session validation:

```typescript
if (!session.user.isActive) {
  res.status(403).json({ error: 'Account deactivated' });
  return;
}
```

**How to apply:** Always verify this check is present whenever `requireAuth` is modified. The `isActive` field exists in the Better Auth additionalFields config with `input: false`, so it can be trusted as server-set.

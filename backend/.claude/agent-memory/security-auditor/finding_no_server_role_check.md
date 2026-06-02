---
name: finding_no_server_role_check
description: No requireAdmin middleware exists; role enforcement is client-side only via AdminRoute.tsx
metadata:
  type: project
---

As of 2026-06-02 (Phase 3 complete), there is no `requireAdmin` or equivalent server-side middleware. `AdminRoute.tsx` checks `data.user.role === 'ADMIN'` purely in the browser.

Currently there are no admin-only API routes, so the impact is limited. But as Phase 4+ adds ticket management, user management APIs etc., any admin-only operation must have a server-side role check.

**Pattern to implement when needed:**

```typescript
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  next();
};
// Usage: router.post('/users', requireAuth, requireAdmin, handler)
```

**How to apply:** Flag any route that performs privileged operations (user management, system config, etc.) that lacks both `requireAuth` AND `requireAdmin`.

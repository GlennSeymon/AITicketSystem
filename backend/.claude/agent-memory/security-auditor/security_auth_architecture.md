---
name: security_auth_architecture
description: Better Auth config, requireAuth middleware, role model, existing controls, and known security gaps as of Phase 3 completion
metadata:
  type: project
---

## Auth Stack (as audited 2026-06-02)

- Better Auth with Prisma adapter (PostgreSQL)
- `disableSignUp: true` in emailAndPassword config — public registration blocked
- `trustedOrigins` read from `BETTER_AUTH_TRUSTED_ORIGINS` env var (comma-split); falls back to `[]` if unset
- `role` (ADMIN|AGENT enum) and `isActive` (boolean) are additionalFields with `input: false` — clients cannot set them at sign-up
- `requireAuth` middleware calls `auth.api.getSession()` on every request, validates session from DB
- Sessions stored in `session` table with `expiresAt`; Better Auth handles token rotation
- No custom auth endpoints — all auth under `/api/auth/*` via `toNodeHandler(auth)`

## Role Model
- Roles stored in `user.role` (Prisma enum: ADMIN, AGENT)
- `AdminRoute.tsx` client component checks `data.user.role === 'ADMIN'` — UI-only guard
- NO server-side `requireAdmin` middleware exists yet (Phase 4+ work)

## Known Security Gaps (findings from 2026-06-02 audit)
- `isActive` field is stored but never checked in `requireAuth` — deactivated users retain full access
- `/api/me` returns `req.session` object including the session token
- No rate limiting anywhere in the backend
- No body size limit on `express.json()`
- `trustedOrigins` empty-array fallback behavior needs verification against Better Auth CSRF handling
- Seed script's `signUpEmail` server-side call bypasses `disableSignUp` (intentional for seeding, but note it works)

## Files
- `backend/src/auth.ts` — Better Auth instance
- `backend/src/require-auth.ts` — `requireAuth` middleware
- `backend/src/index.ts` — route mounting
- `frontend/src/components/ProtectedRoute.tsx` — client auth guard
- `frontend/src/components/AdminRoute.tsx` — client role guard (ADMIN only)
- `frontend/src/lib/authClient.ts` — Better Auth React client

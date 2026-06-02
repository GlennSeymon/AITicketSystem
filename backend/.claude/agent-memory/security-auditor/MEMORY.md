# Security Auditor Memory Index

- [Auth/authz architecture](security_auth_architecture.md) — Better Auth config, requireAuth middleware, role model, and known gaps
- [Session data exposure in /api/me](finding_me_endpoint_session_leak.md) — /api/me leaks full session token to client
- [isActive not enforced in requireAuth](finding_isactive_not_enforced.md) — Deactivated users can still authenticate
- [Seed script uses signUpEmail with signUp disabled](finding_seed_signup_bypass.md) — Seed bypasses disableSignUp via server-side API; intentional but noted
- [trustedOrigins falls back to empty array](finding_trusted_origins_empty.md) — Missing env var silently allows no trusted origins (auth CSRF protection may fail)
- [No rate limiting on auth or any endpoint](finding_no_rate_limiting.md) — No rate limiting middleware present anywhere in backend
- [No body size limit on express.json()](finding_no_body_size_limit.md) — DoS risk from large JSON payloads
- [No server-side role enforcement exists yet](finding_no_server_role_check.md) — AdminRoute is client-side only; no backend requireAdmin middleware
- [Admin credentials weak in .env.example](finding_weak_example_creds.md) — .env.example has change-me passwords; actual .env has same weak admin password

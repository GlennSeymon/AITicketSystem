---
name: finding_weak_example_creds
description: .env.example uses change-me passwords; actual backend/.env has the same weak placeholder admin/agent credentials
metadata:
  type: project
---

`backend/.env` (not committed to git, confirmed) contains:
- `ADMIN_PASSWORD="change-me"` — weak placeholder, same as .env.example
- `AGENT_PASSWORD="change-me"` — same

These are development credentials seeded into the database. If the seed was run with these values, the admin account has a trivially guessable password.

**How to apply:** In future audits, verify whether the seed has been run and whether credentials have been rotated from .env.example values. Flag as LOW for dev environments, HIGH for staging/production.

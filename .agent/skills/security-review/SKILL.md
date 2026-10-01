---
name: security-review
description: Audit code against the security requirements in PROJECT_SPEC.md section 9
---
Checklist: webhook signature + raw body + idempotency, server-side pricing only,
amount/currency verification, CORS allowlist, rate limits, zod .strict() validation,
helmet/hpp, log redaction, RLS on all tables, no secrets in the frontend bundle, no IDOR.
Output a table: requirement | status | evidence (file:line) | fix needed.
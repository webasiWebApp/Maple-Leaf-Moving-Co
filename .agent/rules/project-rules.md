---
trigger: always_on
---

# Project Rules: Mapleleaf Moving Co

1. Always read /PROJECT_SPEC.md before any task. It is the single source of truth.
2. Work on ONE phase at a time (spec section 13). Never start the next phase without my approval.
3. Security (spec section 9) is mandatory. Never take a price, currency, or amount from the client.
4. Secrets only in Backend/.env. Never use VITE_ for secrets. Never print or commit keys.
5. Stripe TEST mode only. Never use live keys.
6. Money is integer cents. Validate every input with zod.
7. Do not change files outside the current phase's scope.
8. If the spec is unclear or a decision is missing (spec section 12), ask me instead of guessing.
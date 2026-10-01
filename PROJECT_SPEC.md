# Mapleleaf Moving Co: Express Backend, Stripe Checkout, Security & Policy Pages

> **Audience:** an AI coding agent (Claude Code / Cursor / Lovable). Follow the phases in order. Do not skip the security requirements: security is the top priority of this system.
> **Legend:** ✅ = confirmed by owner. ⚠️ = assumption made by the spec author; keep it unless the owner overrides it (see §12).

---

## 1. Goal

When a visitor submits the **homepage "Instant estimate" form**, they are redirected to **Stripe-hosted Checkout** and pay the **full, fixed, binding price** (+13% HST). Payment is confirmed server-side by webhook. All server logic moves out of the frontend into a new **Express backend**. Add legal policy pages.

## 2. Confirmed Decisions ✅

| Topic | Decision |
| :-- | :-- |
| Backend | Express becomes the **full backend**: quotes, bookings/orders, contact form, Stripe. Frontend only calls its REST API. |
| Database & Auth | **Keep Supabase** (Postgres + Auth). Express verifies Supabase JWTs for the portal. Only Express uses the service-role key. |
| Payment amount | **Full price**, one fixed binding price, **no overage**. |
| Tax | **+13% Ontario HST** added on top at checkout. Currency **CAD**. |
| Checkout UI | **Stripe-hosted Checkout** (redirect). No card data ever touches our servers. |
| Who can pay | **Guests**, no account required. Name/email/phone collected at checkout. |
| Hero form | Submit goes **straight to Stripe**. Price computed from only 4 fields: *from, to, home size, date* + default assumptions (§6). |
| Refunds | Full refund **48+ h** before move; **50%** within 48 h; **none** on move day. |
| After payment | Stripe receipt + confirmation email to customer + alert email to owner. No admin dashboard. |
| Policy pages | Refund & Cancellation, Privacy, Terms & Conditions, Cookie policy. |

---

## 3. Target Folder Structure

```
main-folder/
├── Frontend/          # existing TanStack Start app (rename from `frontend/` if needed, use `git mv`)
└── Backend/           # NEW Express API (replace the empty express-generator boilerplate)
    ├── src/
    │   ├── server.ts            # bootstrap, listen
    │   ├── app.ts               # express app, middleware order
    │   ├── config/env.ts        # zod-validated env, fail fast on boot
    │   ├── middleware/          # security, rateLimit, validate, auth, errorHandler
    │   ├── routes/              # checkout.ts, webhooks.ts, contact.ts, quotes.ts, orders.ts, maps.ts, health.ts
    │   ├── services/            # pricing (quote-engine), stripe, maps, email, orders
    │   ├── lib/                 # supabaseAdmin.ts, logger.ts, tokens.ts
    │   └── emails/              # HTML templates
    ├── tests/                   # vitest
    ├── .env.example
    ├── package.json
    └── tsconfig.json
```

Delete the old generator files (`bin/www`, `app.js`, `routes/index.js`, `views/`, `public/`, jade/pug, Express 4.16).

## 4. Install Express (Phase 0)

```bash
cd Backend
npm init -y
npm i express@5 cors helmet express-rate-limit zod stripe @supabase/supabase-js \
      jose pino pino-http dotenv resend hpp
npm i -D typescript tsx @types/node @types/express @types/cors vitest supertest @types/supertest
```

- Node ≥ 20, TypeScript strict mode.
- Scripts: `dev` (`tsx watch src/server.ts`), `build` (`tsc`), `start` (`node dist/server.js`), `test` (`vitest run`).
- Express 5 is stable; do not use Express 4.16.
- ⚠️ Email provider: **Resend** (swap-able behind `services/email.ts`).

---

## 5. Target Flow (Instant Estimate → Payment)

```
Hero form submit
  → POST /api/checkout/instant   { from, to, homeSize, date, consentTerms:true, turnstileToken }
      Express: validate (zod) → verify bot token → distance via Google Maps (server-side)
             → compute price with server pricing engine (client NEVER sends an amount)
             → insert quote + order (status = pending_payment) in Supabase
             → create Stripe Checkout Session (mode=payment, CAD)
      ← { url }
  → Frontend does window.location.assign(url)
Stripe Checkout (collects email, phone, name, terms consent, card)
  → Stripe POSTs webhook  → POST /api/webhooks/stripe (raw body, signature verified)
      Express: idempotently mark order paid, save customer details, send 2 emails
  → Customer redirected to  /checkout/success?order=<uuid>   (or /checkout/cancelled)
      Success page calls GET /api/orders/:id/status → shows "Paid / Processing"
```

**Golden rule:** the order becomes *paid* **only** from the verified webhook, never from the success URL.

### Stripe Session parameters
- `mode: 'payment'`, `currency: 'cad'`, `client_reference_id: order.id`, `metadata: { order_id }`.
- Line items (built server-side, `unit_amount` in cents): **"Moving service (fixed price)"** = subtotal, **"HST (13%)"** = `round(subtotal × 0.13)`. Alternative: Stripe Tax if owner enables it; keep the same net total.
- `phone_number_collection: { enabled: true }`, customer email collected by Checkout.
- `consent_collection: { terms_of_service: 'required' }` (requires the Terms URL in the Stripe Dashboard → Public details).
- `expires_at`: now + 30 min. `success_url` / `cancel_url` from server config (never from client input).
- Send an **Idempotency-Key** (`order.id`) on `sessions.create`.

---

## 6. Pricing (Server-Authoritative)

1. Move `Frontend/src/lib/quote-engine.ts` logic into `Backend/src/services/pricing.ts` (pure functions, unit-tested). The backend is the **single source of truth**. The frontend must call `POST /api/quotes/preview` for any displayed price instead of keeping its own copy (prevents drift).
2. Existing rules to preserve: crew rates ($139/$189/$239 per hour by volume), 3-hour minimum, $90 truck fee, first 30 km free then $1.60/km, stairs time, +15% peak days, arrival-window multipliers, flexible-date discount.
3. ⚠️ **Hero defaults** (only 4 inputs are collected, the rest is assumed): volume from home-size table already in the engine; **no stairs**; **midday arrival window**; **dates not flexible**; **no special items**. Store the assumptions in `orders.pricing_snapshot` (JSONB) together with `engine_version`.
4. The price is **binding** ✅. Show the assumptions plainly in the Terms and on the pre-redirect UI (one line under the button: *"Fixed price based on the details you entered. See Terms."*).
5. Server-side validation: date must be in the future (minimum lead time configurable, default 24 h), addresses non-empty and ≤ 200 chars, home size ∈ enum, max distance sanity cap (reject absurd routes).

---

## 7. API Endpoints

| Method & Path | Auth | Purpose |
| :-- | :-- | :-- |
| `GET /api/health` | none | liveness |
| `GET /api/maps/autocomplete?q=` | none, rate-limited | proxies Google Places (key stays server-side) |
| `POST /api/quotes/preview` | none, rate-limited | returns price breakdown for the form/wizard |
| `POST /api/checkout/instant` | none, rate-limited, bot-check | hero flow → returns Stripe URL |
| `POST /api/webhooks/stripe` | Stripe signature | source of truth for payment state |
| `GET /api/orders/:id/status` | unguessable UUID | minimal status only (`pending/paid/expired`), **no PII** |
| `POST /api/contact` | none, rate-limited, bot-check | stores in `contact_messages`, emails owner |
| `GET /api/portal/*` | Supabase JWT | existing "My move" data (quotes/bookings) |

Also port the existing `booking.functions.ts` (quote save, booking accept) and `maps.functions.ts` to Express routes, then delete those server functions from the frontend.

⚠️ **The `/quote` wizard's final step should use the same full-payment Stripe flow** (via the same session-creation service, with the wizard's richer inputs) so there is one payment model, replacing the 15%-deposit path. See §12.

---

## 8. Database (Supabase migration)

New migration in `Frontend/supabase/migrations/` (or move the folder to `Backend/` and note it in the README):

- **`orders`**: `id uuid pk`, `quote_id`, `status` (`pending_payment|paid|expired|failed|cancelled|refunded|partially_refunded`), `subtotal_cents`, `tax_cents`, `total_cents`, `currency='cad'`, `stripe_session_id unique`, `stripe_payment_intent_id`, `customer_name`, `customer_email`, `customer_phone`, `move_date`, `pricing_snapshot jsonb`, `terms_version`, `terms_accepted_at`, `created_at`, `paid_at`.
- **`stripe_events`**: `event_id text pk`, `type`, `received_at`, `processed_at` (idempotency: skip duplicates).
- **`order_events`**: audit log (created, paid, email_sent, refunded…).
- **`contact_messages`**: `id`, `name`, `email`, `topic`, `message`, `ip_hash`, `created_at`.
- **RLS:** enable on all new tables with **no anon/authenticated policies** (only the service-role key in Express can access them).
- **Tighten existing tables:** drop the policy letting `anon` insert into `quotes`; quotes are now created only by Express.
- Money is always **integer cents**.

---

## 9. 🔒 Security Requirements (Highest Priority)

### Payments
- Never accept a price, currency, or product from the client. Build everything server-side.
- Card data never touches us (Stripe-hosted Checkout, PCI SAQ-A scope).
- Webhook: use `express.raw({ type: 'application/json' })` **only** on that route, verify with `stripe.webhooks.constructEvent` and `STRIPE_WEBHOOK_SECRET`; reject on failure with 400. Store `event.id` in `stripe_events` before processing; ignore duplicates. Handle: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`.
- On `completed`, verify `payment_status === 'paid'` **and** that `amount_total` equals the stored `orders.total_cents` and currency is CAD. Mismatch → flag order, alert owner, do not confirm.
- Use a **restricted** Stripe API key where possible; never expose the secret key; start in **test mode**.

### API hardening
- `helmet()` (with HSTS), `hpp()`, `app.disable('x-powered-by')`, JSON body limit ≈ 10 kb (raw webhook exempt), `trust proxy` set correctly behind the host.
- **CORS allowlist** of the exact frontend origin(s) from env. No `*`.
- **Rate limits:** strict on `/checkout/instant`, `/contact`, `/maps/*`, `/quotes/preview` (per IP); global default too.
- **Validate every input with zod** (types, lengths, enums); reject unknown keys (`.strict()`).
- **Bot protection** on public forms: Cloudflare Turnstile (or hCaptcha) + a hidden honeypot field on the contact form.
- Central error handler: never leak stack traces or internals; return generic messages + a request id.
- Structured logging (pino) with **redaction** of emails, phones, tokens, headers. Never log card or secret data.
- Auth for portal routes: verify the Supabase JWT (signature, `exp`, `aud`) in middleware; authorise by `user_id` on every query (no IDOR). Order status endpoint returns non-sensitive fields only.
- Escape/encode all user content placed in emails (prevent HTML injection). Use parameterised access via the Supabase client only.

### Secrets & config
- All secrets in `Backend/.env` (never `VITE_*`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET`.
- Validate env at boot (`config/env.ts`); crash if anything is missing.
- Commit only `.env.example`. **Verify `.gitignore` covers all `.env` files; if any were ever committed, rotate those keys.**
- Restrict the Google Maps key (server key by IP; browser key by HTTP referrer + API scope).

### Frontend / transport
- HTTPS only; HSTS. Set security headers on the frontend host: **CSP** (allow `js.stripe.com`/`checkout.stripe.com` only if embedding later, Google Fonts, Supabase, the API origin), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- Frontend `VITE_*` may contain **only** the Supabase URL/anon key and API URL, never secrets.
- Run `npm audit` in CI; pin versions; enable Dependabot.

### Data protection
- Collect the minimum PII; document retention in the Privacy Policy. Hash IPs stored for abuse control. Enable Supabase backups.

---

## 10. Frontend Tasks

1. Add `src/lib/api.ts` (typed fetch wrapper using `VITE_API_URL`, handles errors and timeouts).
2. **Hero form** (`routes/index.tsx`): add the required **Terms consent checkbox** (links to `/terms` and `/refund-policy`) and Turnstile widget; on submit call `POST /api/checkout/instant`, show loading/error states, then `window.location.assign(url)`. Remove the fake "Thanks! We'll call you…" state.
3. New routes: `/checkout/success`, `/checkout/cancelled`. Success page polls `/api/orders/:id/status` (max ~30 s) until `paid`.
4. Contact form → `POST /api/contact` with success/error UI.
5. Replace TanStack server functions (`booking.functions.ts`, `maps.functions.ts`) with API calls.
6. Use `PageShell`/`SiteHeader`/`SiteFooter` on the homepage too; add "My move" link; **footer links to all policy pages**.
7. Cookie notice banner (see §11).
8. Fix known audit issues if time allows: missing maple background assets (restore or remove descriptors).

---

## 11. Policy Pages

Routes: `/refund-policy`, `/privacy`, `/terms`, `/cookies`. Shared layout, versioned (`TERMS_VERSION`, "Last updated" date). Fill placeholders `[LIKE THIS]` with the real legal business name, etc. Business data known: 207 Weston Road, Toronto, ON M6N 4Z3 · 416 737 7674 · hi@mapleleafmovingco.com.

> ⚠️ These are drafting templates, **not legal advice**. Recommend review by a Canadian lawyer before launch.

**Refund & Cancellation Policy** ✅
- Full refund if cancelled **≥ 48 hours** before the scheduled move start.
- **50%** refund if cancelled **< 48 hours** before.
- **No refund** on move day / no-show.
- Time measured in **America/Toronto**, from the start of the chosen arrival window.
- How to cancel (email/phone), refund goes to the original payment method, typically 5–10 business days; HST refunded proportionally; rescheduling rules `[decide]`; company cancellation → full refund.

**Terms & Conditions / Service Agreement**
- Parties, services, **fixed binding price and exactly what it covers** (based on home size, distance, no stairs, midday window, standard items), what is excluded/handled by re-quote *before* the move `[owner to decide]`, access requirements, prohibited/hazardous items, payment via Stripe, HST, cancellation (link), liability limits and damage claim procedure `[with insurance details]`, force majeure, disputes, governing law: **Ontario, Canada**, changes to terms, contact.

**Privacy Policy** (PIPEDA + CASL)
- Data collected (name, email, phone, addresses, move details, payment metadata; **card data is handled only by Stripe**), purposes, legal basis/consent, processors (**Stripe, Supabase, Google Maps, Resend, Cloudflare Turnstile, Google Fonts**), retention, security measures, cross-border processing, user rights (access, correction, deletion, withdraw consent), cookies link, breach handling, privacy contact.

**Cookie Policy**
- Categories: strictly necessary (auth/session, security), functional, analytics `[only if added]`. Table of actual cookies/storage used. Non-essential items load only after consent; banner with Accept/Reject and a way to change the choice later. If only essential storage is used, a short notice suffices.

**Consent record:** store `terms_version` and `terms_accepted_at` in `orders` (and rely on Stripe's `consent_collection`).

---

## 12. Assumptions to Confirm ⚠️

1. The `/quote` wizard also moves to full-price Stripe payment (replacing the 15% deposit flow).
2. Hero defaults: no stairs, midday window, not flexible, standard items. Because the price is **binding with no overage**, an under-quote is the owner's loss. Consider a modest buffer or explicit scope exclusions in the Terms.
3. Resend for email; Cloudflare Turnstile for bot protection.
4. **Refunds are issued manually from the Stripe Dashboard** by the owner (no admin UI). Optional later: a signed-link self-service cancel endpoint that computes the 100/50/0% tier and calls `stripe.refunds.create` with an idempotency key. Note that Stripe does not return its processing fees on refunds.
5. Guest orders have no portal access. Optional later: link orders to an account by verified email.

---

## 13. Implementation Phases (Checklist)

**Phase 0: Setup**
- [x] Replace `Backend/` boilerplate with Express 5 + TS (§4); `/api/health` works
- [x] `env.ts` validation, `.env.example`, `.gitignore` verified, exposed keys rotated

**Phase 1: Security baseline**
- [x] helmet, hpp, CORS allowlist, rate limits, body limits, zod validation helper, error handler, pino redaction

**Phase 2: Pricing & data**
- [x] `pricing.ts` ported + Vitest tests (crew sizing, 3 h minimum, peak dates, distance, HST rounding)
- [x] Supabase migration (§8), RLS locked, anon quote-insert policy dropped
- [x] Maps proxy + `/api/quotes/preview`

**Phase 3: Stripe**
- [x] `/api/checkout/instant` creating order + Session (server-side amounts)
- [x] Webhook with signature check, idempotency, amount verification, status transitions
- [x] Emails: customer confirmation + owner alert (include order id, route, date, phone, amount)
- [x] Test with Stripe CLI (`stripe listen --forward-to localhost:PORT/api/webhooks/stripe`) and test cards (success, decline, 3DS, expired session)

**Phase 4: Frontend**
- [ ] `api.ts`, hero form → Stripe redirect, success/cancelled pages, contact form, portal + wizard on API
- [ ] Remove old server functions; consistent header/footer

**Phase 5: Policies**
- [ ] Four policy pages + footer links + cookie banner + Stripe Dashboard Terms URL set

**Phase 6: Hardening & release**
- [ ] `npm audit`, dependency pinning, CSP verified in browser, HTTPS/HSTS on hosting
- [ ] Stripe **live** keys + live webhook endpoint configured; end-to-end test with a real small charge, then refund it
- [ ] README: run instructions, env vars, deploy notes

## 14. Acceptance Criteria

- Submitting the hero form with valid data lands on a Stripe Checkout page showing the correct subtotal + HST in CAD.
- Tampering with request bodies cannot change the charged amount.
- A completed payment marks the order `paid` **once**, even if the webhook is delivered twice; both emails are sent.
- An invalid webhook signature returns 400 and changes nothing.
- Abandoned or expired sessions never mark orders paid.
- No secrets appear in the frontend bundle, git history, or logs.
- Public endpoints are rate-limited; CORS rejects unknown origins.
- All four policy pages are reachable from the footer and Stripe's Terms link.
- Contact form messages are stored and emailed to the owner.
- `npm test` passes for the pricing engine and webhook handler.
# Stripe Integration TODO

> Single source of truth for remaining Stripe setup steps.
> Scenario A applied - existing Checkout Session call found and updated.

---

## Values to Replace

**Files containing placeholders:**
- backend/src/routes/checkout.ts
- backend/.env

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| `TURNSTILE_SECRET` | empty (bypassed in dev) | Cloudflare Turnstile Secret Key. Required in production. |
| `SUPABASE_SERVICE_ROLE_KEY` | empty | Supabase service_role key from Project Settings > API. |
| `RESEND_API_KEY` | empty | Resend API key from resend.com |
| `FRONTEND_URL` | http://localhost:3000 | Your production domain e.g. https://mapleleafmovingco.com |
| Terms of Service URL | not set | Set in Stripe Dashboard > Settings > Public details |

---

## Configured Parameters (Checkout Studio)

**File:** backend/src/routes/checkout.ts

| Parameter | Value |
|-----------|-------|
| ui_mode | hosted_page (Stripe SDK >= 21.0.0) |
| billing_address_collection | auto |
| phone_number_collection.enabled | true |
| automatic_tax.enabled | false |
| allow_promotion_codes | false |
| submit_type | auto |
| mode | payment (one-time charge) |
| currency | cad |

---

## Setup and Next Steps

### 1. Fill in backend/.env

```
STRIPE_SECRET_KEY=sk_test_...        # set
STRIPE_WEBHOOK_SECRET=whsec_...      # set
SUPABASE_URL=https://...             # set
SUPABASE_SERVICE_ROLE_KEY=...        # MISSING
GOOGLE_MAPS_API_KEY=...              # set
RESEND_API_KEY=re_...                # MISSING
TURNSTILE_SECRET=...                 # MISSING (bypassed in dev)
FRONTEND_URL=http://localhost:3000   # set for dev
```

### 2. Stripe Dashboard

- [ ] Settings > Public details > set Terms of Service URL to https://yoursite.com/terms
- [ ] Confirm Test Mode is ON
- [ ] Create Webhook at https://yourbackend.com/api/webhooks/stripe for:
  - checkout.session.completed
  - checkout.session.async_payment_succeeded
  - checkout.session.async_payment_failed
  - checkout.session.expired
  - charge.refunded

### 3. Test with Stripe CLI

```bash
stripe listen --forward-to localhost:5000/api/webhooks/stripe
```

Test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

### 4. Flow

User fills hero form (from, to, homeSize, date) + checks Terms
  -> POST /api/checkout/instant
  -> Backend: validate > price server-side (CAD + 13% HST) > insert order > create Stripe Session
  <- { url }
  -> window.location.assign(url) -> Stripe Checkout
  -> Stripe webhook -> mark order paid -> send emails
  -> Redirect to /checkout/success?order=<uuid>

### 5. TODO: Missing Frontend Pages

Routes /checkout/success and /checkout/cancelled still need to be created (Phase 4).
Stripe will redirect to a 404 without them.

### 6. Go Live

- [ ] Swap sk_test_ for sk_live_ in STRIPE_SECRET_KEY
- [ ] Update STRIPE_WEBHOOK_SECRET to live webhook secret
- [ ] Set FRONTEND_URL to production domain
- [ ] Set TURNSTILE_SECRET to production Turnstile secret
- [ ] npm audit in both frontend/ and backend/
- [ ] End-to-end test with real small charge, then refund it

---

## Resources

- https://docs.stripe.com
- https://docs.stripe.com/testing
- https://docs.stripe.com/stripe-cli
- https://support.stripe.com

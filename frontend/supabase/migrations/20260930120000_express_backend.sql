-- Drop anon policy on quotes
DROP POLICY IF EXISTS "quotes_public_insert" ON public.quotes;
REVOKE INSERT ON public.quotes FROM anon;

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES public.quotes ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  subtotal_cents INT NOT NULL,
  tax_cents INT NOT NULL,
  total_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  move_date DATE NOT NULL,
  pricing_snapshot JSONB NOT NULL,
  terms_version TEXT,
  terms_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- RLS for orders (service_role only)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.orders TO service_role;
-- No policies for anon or authenticated so only service_role can access

-- Create stripe_events table
CREATE TABLE public.stripe_events (
  event_id TEXT NOT NULL PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- RLS for stripe_events (service_role only)
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.stripe_events TO service_role;

-- Create order_events table
CREATE TABLE public.order_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for order_events (service_role only)
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.order_events TO service_role;

-- Create contact_messages table
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT,
  message TEXT NOT NULL,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for contact_messages (service_role only)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.contact_messages TO service_role;

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";

const quoteSchema = z.object({
  reference: z.string().min(4).max(24),
  fromAddress: z.string().min(4).max(300),
  toAddress: z.string().min(4).max(300),
  distanceKm: z.number().nullable(),
  durationMin: z.number().nullable(),
  homeSize: z.string().min(1).max(80),
  inventory: z.record(z.number().int().min(0).max(100)),
  addOns: z.array(z.string().max(80)).max(20),
  stairsFrom: z.string().max(40),
  stairsTo: z.string().max(40),
  moveDate: z.string().min(1).max(20),
  flexibleDates: z.boolean(),
  arrivalWindow: z.string().min(1).max(40),
  crewSize: z.number().int().min(1).max(10),
  estimatedHours: z.number().min(0).max(100),
  priceLowCents: z.number().int().min(0),
  priceHighCents: z.number().int().min(0),
  depositCents: z.number().int().min(0),
  contactName: z.string().min(2).max(120),
  contactEmail: z.string().email().max(200),
  contactPhone: z.string().min(7).max(40),
  notes: z.string().max(2000),
});

type QuoteData = z.infer<typeof quoteSchema>;

function quoteRow(data: QuoteData, userId: string | null) {
  return {
    user_id: userId,
    reference: data.reference,
    from_address: data.fromAddress,
    to_address: data.toAddress,
    distance_km: data.distanceKm,
    duration_min: data.durationMin,
    home_size: data.homeSize,
    inventory: data.inventory as Json,
    add_ons: data.addOns,
    stairs_from: data.stairsFrom,
    stairs_to: data.stairsTo,
    move_date: data.moveDate,
    flexible_dates: data.flexibleDates,
    arrival_window: data.arrivalWindow,
    crew_size: data.crewSize,
    estimated_hours: data.estimatedHours,
    price_low_cents: data.priceLowCents,
    price_high_cents: data.priceHighCents,
    deposit_cents: data.depositCents,
    contact_name: data.contactName,
    contact_email: data.contactEmail,
    contact_phone: data.contactPhone,
    notes: data.notes || null,
    status: "quoted",
  };
}

function createPublicClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) throw new Error("Quote saving is unavailable.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
}

export const submitGuestQuote = createServerFn({ method: "POST" })
  .validator((data) => quoteSchema.parse(data))
  .handler(async ({ data }) => {
    const { data: saved, error } = await createPublicClient().from("quotes").insert(quoteRow(data, null)).select("id, reference").single();
    if (error) throw new Error("We couldn't save your quote. Please call 416 737 7674.");
    return saved;
  });

export const submitMemberQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => quoteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: saved, error } = await context.supabase.from("quotes").insert(quoteRow(data, context.userId)).select("id, reference").single();
    if (error) throw new Error("We couldn't save your quote. Please try again.");
    return saved;
  });

export const getMyMoveData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [quotesResult, bookingsResult] = await Promise.all([
      context.supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      context.supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    ]);
    if (quotesResult.error || bookingsResult.error) throw new Error("Your move details couldn't be loaded.");
    return { quotes: quotesResult.data, bookings: bookingsResult.data };
  });

const bookingSchema = z.object({ quoteId: z.string().uuid(), agreementName: z.string().min(2).max(120) });

export const confirmBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => bookingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: quote, error: quoteError } = await context.supabase.from("quotes").select("*").eq("id", data.quoteId).eq("user_id", context.userId).single();
    if (quoteError || !quote?.move_date || !quote.arrival_window) throw new Error("This quote cannot be booked.");
    const { data: booking, error } = await context.supabase.from("bookings").insert({
      user_id: context.userId,
      quote_id: quote.id,
      reference: quote.reference,
      move_date: quote.move_date,
      arrival_window: quote.arrival_window,
      crew_size: quote.crew_size,
      price_low_cents: quote.price_low_cents,
      price_high_cents: quote.price_high_cents,
      deposit_cents: quote.deposit_cents,
      deposit_status: "pending",
      agreement_name: data.agreementName,
      agreement_signed_at: new Date().toISOString(),
      status: "awaiting_deposit",
    }).select("id, reference").single();
    if (error) throw new Error("Your booking could not be confirmed.");
    await context.supabase.from("booking_events").insert({ booking_id: booking.id, user_id: context.userId, label: "Booking requested", detail: "Agreement accepted; deposit is pending." });
    await context.supabase.from("quotes").update({ status: "booked" }).eq("id", quote.id);
    return booking;
  });

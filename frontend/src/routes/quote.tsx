import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronLeft, ChevronRight, LoaderCircle, MapPin, Minus, Plus, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/site-shell";
import { useAuth } from "@/hooks/useAuth";
import { submitGuestQuote, submitMemberQuote } from "@/lib/booking.functions";
import { getRouteDistance, suggestAddresses } from "@/lib/maps.functions";
import { ADD_ONS, ARRIVAL_WINDOWS, calculateQuote, HOME_SIZES, INVENTORY_CATALOG, makeReference, money, peakLabel, STAIRS_OPTIONS } from "@/lib/quote-engine";

// Map homepage homeSizeIndex (0-4) → quote engine HOME_SIZES id
const INDEX_TO_SIZE_ID = ["studio", "1bed", "2bed", "3bed", "office"] as const;
// Map homepage add-on labels → quote engine ids
const LABEL_TO_ADDON_ID: Record<string, string> = {
  Packing: "packing",
  Piano: "piano",
  Storage: "storage",
};

export const Route = createFileRoute("/quote")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: typeof search.from === "string" ? search.from : "",
    to: typeof search.to === "string" ? search.to : "",
    homeSizeIndex: typeof search.homeSizeIndex === "string" ? search.homeSizeIndex : "",
    moveDate: typeof search.moveDate === "string" ? search.moveDate : "",
    addOns: typeof search.addOns === "string" ? search.addOns : "",
  }),
  head: () => ({ meta: [
    { title: "Instant Moving Quote | Mapleleaf Moving Co" },
    { name: "description", content: "Build a detailed Toronto moving estimate, choose your date and arrival window, and request your booking online." },
    { property: "og:title", content: "Instant Moving Quote | Mapleleaf Moving Co" },
    { property: "og:description", content: "Plan your GTA move with a detailed instant estimate and online scheduling." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: QuotePage,
});

type FormState = { from: string; to: string; homeSizeId: string; items: Record<string, number>; addOns: string[]; stairsFrom: string; stairsTo: string; moveDate: string; arrivalWindow: string; flexibleDates: boolean; contactName: string; contactEmail: string; contactPhone: string; notes: string };
const initial: FormState = { from: "", to: "", homeSizeId: "1bed", items: {}, addOns: [], stairsFrom: "elevator", stairsTo: "elevator", moveDate: "", arrivalWindow: "midday", flexibleDates: false, contactName: "", contactEmail: "", contactPhone: "", notes: "" };
const steps = ["Route", "Inventory", "Schedule", "Details"];

function QuotePage() {
  const search = Route.useSearch();

  // Seed initial state from homepage quick-estimate params
  const seedHomeSizeId = INDEX_TO_SIZE_ID[Number(search.homeSizeIndex) || 2] ?? "2bed";
  const seedAddOns = search.addOns
    ? search.addOns.split(",").map((l) => LABEL_TO_ADDON_ID[l] ?? l).filter(Boolean)
    : [];
  const seedSize = HOME_SIZES.find((s) => s.id === seedHomeSizeId);

  const [form, setForm] = useState<FormState>({
    ...initial,
    from: search.from || initial.from,
    to: search.to || initial.to,
    homeSizeId: seedHomeSizeId,
    items: seedSize?.preset ?? {},
    addOns: seedAddOns,
    moveDate: search.moveDate || initial.moveDate,
  });
  const [step, setStep] = useState(0);
  const [distance, setDistance] = useState<{ distanceKm: number | null; driveMinutes: number | null }>({ distanceKm: null, driveMinutes: null });
  const [routeBusy, setRouteBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedRef, setSavedRef] = useState("");
  const [suggestions, setSuggestions] = useState<{ placeId: string; description: string }[]>([]);
  const [suggestingFor, setSuggestingFor] = useState<"from" | "to" | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const routeFn = useServerFn(getRouteDistance);
  const suggestFn = useServerFn(suggestAddresses);
  const guestFn = useServerFn(submitGuestQuote);
  const memberFn = useServerFn(submitMemberQuote);

  const estimate = useMemo(() => calculateQuote({ homeSizeId: form.homeSizeId, items: form.items, addOns: form.addOns, stairsFrom: form.stairsFrom, stairsTo: form.stairsTo, distanceKm: distance.distanceKm, driveMinutes: distance.driveMinutes, moveDate: form.moveDate, arrivalWindow: form.arrivalWindow, flexibleDates: form.flexibleDates }), [form, distance]);
  const rooms = [...new Set(INVENTORY_CATALOG.map((item) => item.room))];
  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((old) => ({ ...old, [key]: value }));

  async function lookupRoute() {
    if (form.from.length < 4 || form.to.length < 4) return;
    setRouteBusy(true); setError("");
    try { setDistance(await routeFn({ data: { from: form.from, to: form.to } })); }
    catch { setError("We couldn't check the route right now. Your estimate uses a typical local drive time."); }
    finally { setRouteBusy(false); }
  }
  async function lookupSuggestions(field: "from" | "to", value: string) {
    patch(field, value); setSuggestingFor(field);
    if (value.length < 3) { setSuggestions([]); return; }
    try { setSuggestions(await suggestFn({ data: { input: value, sessionToken: crypto.randomUUID() } })); } catch { setSuggestions([]); }
  }
  function chooseAddress(value: string) { if (suggestingFor) patch(suggestingFor, value); setSuggestions([]); setSuggestingFor(null); }
  function setHomeSize(id: string) { const size = HOME_SIZES.find((item) => item.id === id); patch("homeSizeId", id); patch("items", size?.preset ?? {}); }
  function validStep() { if (step === 0) return form.from.length >= 4 && form.to.length >= 4 && form.homeSizeId; if (step === 2) return form.moveDate && form.arrivalWindow; if (step === 3) return form.contactName.length >= 2 && form.contactEmail.includes("@") && form.contactPhone.length >= 7; return true; }
  async function next() { setError(""); if (!validStep()) { setError("Please complete the required details before continuing."); return; } if (step === 0) await lookupRoute(); if (step < 3) setStep((value) => value + 1); }
  async function submit() {
    if (!validStep()) { setError("Please complete your contact details."); return; }
    setSaving(true); setError("");
    const reference = makeReference();
    const payload = { reference, fromAddress: form.from, toAddress: form.to, distanceKm: distance.distanceKm, durationMin: distance.driveMinutes, homeSize: form.homeSizeId, inventory: form.items, addOns: form.addOns, stairsFrom: form.stairsFrom, stairsTo: form.stairsTo, moveDate: form.moveDate, flexibleDates: form.flexibleDates, arrivalWindow: form.arrivalWindow, crewSize: estimate.crew, estimatedHours: estimate.hours, priceLowCents: estimate.lowCents, priceHighCents: estimate.highCents, depositCents: estimate.depositCents, contactName: form.contactName, contactEmail: form.contactEmail, contactPhone: form.contactPhone, notes: form.notes };
    try { const saved = user ? await memberFn({ data: payload }) : await guestFn({ data: payload }); setSavedRef(saved.reference); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Your quote could not be saved."); }
    finally { setSaving(false); }
  }

  if (savedRef) return <PageShell lightHeader><main className="mx-auto max-w-3xl px-4 py-16 md:py-24"><section className="border border-border bg-card p-8 text-center shadow-xl md:p-12"><div className="mx-auto flex size-14 items-center justify-center rounded-full bg-maple text-primary-foreground"><Check className="size-7"/></div><p className="mt-6 text-sm font-semibold uppercase text-maple">Quote {savedRef}</p><h1 className="mt-2 font-display text-4xl text-brand">Your move request is saved.</h1><p className="mx-auto mt-4 max-w-xl text-muted-foreground">We’ll review the details and contact you. Your calculated deposit is {money(estimate.depositCents)}, but online deposit collection is not active yet.</p><div className="mt-8 flex flex-wrap justify-center gap-3">{user ? <Button onClick={() => navigate({ to: "/portal" })}>Open my move</Button> : <Button asChild><Link to="/auth" search={{ next: "/portal" }}>Create account to manage it</Link></Button>}<Button asChild variant="outline"><Link to="/">Back home</Link></Button></div></section></main></PageShell>;

  return <PageShell lightHeader><main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
    <div className="mb-8 max-w-3xl"><p className="text-sm font-bold uppercase text-maple">Instant Toronto moving estimate</p><h1 className="mt-2 font-display text-4xl text-brand md:text-5xl">Plan your move, room by room.</h1><p className="mt-3 text-muted-foreground">Build an accurate estimate, choose a time, and save your request in a few focused steps.</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="border border-border bg-card p-5 shadow-xl md:p-8">
        <ol className="mb-8 grid grid-cols-4 gap-2">{steps.map((label, index) => <li key={label} className={`border-b-4 pb-2 text-xs font-semibold ${index <= step ? "border-maple text-maple" : "border-border text-muted-foreground"}`}>{index + 1}. {label}</li>)}</ol>
        {step === 0 && <div className="space-y-6"><div className="grid gap-5 md:grid-cols-2">{(["from", "to"] as const).map((field) => <label key={field} className="relative block text-sm font-semibold text-foreground">{field === "from" ? "Pickup address" : "Destination address"}<div className="relative mt-2"><MapPin className="absolute left-3 top-3.5 size-4 text-maple"/><input value={form[field]} onChange={(e) => lookupSuggestions(field, e.target.value)} onBlur={() => setTimeout(() => setSuggestions([]), 150)} placeholder={field === "from" ? "123 Queen St W, Toronto" : "New address"} className="w-full border border-input bg-background py-3 pl-10 pr-3 font-normal outline-none focus:border-maple"/>{suggestingFor === field && suggestions.length > 0 && <div className="absolute z-20 mt-1 w-full border border-border bg-card shadow-xl">{suggestions.map((item) => <button type="button" key={item.placeId} onMouseDown={() => chooseAddress(item.description)} className="block w-full border-b border-border px-3 py-3 text-left text-sm font-normal hover:bg-muted">{item.description}</button>)}</div>}</div></label>)}</div><div><p className="text-sm font-semibold">Home size</p><div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{HOME_SIZES.map((size) => <Button type="button" variant={form.homeSizeId === size.id ? "default" : "outline"} key={size.id} onClick={() => setHomeSize(size.id)} className={form.homeSizeId === size.id ? "bg-maple hover:bg-maple-deep" : ""}>{size.label}</Button>)}</div></div>{distance.distanceKm !== null && <p className="bg-muted p-3 text-sm"><strong>{distance.distanceKm} km</strong> · about {distance.driveMinutes} minutes driving</p>}</div>}
        {step === 1 && <div className="space-y-7"><div><h2 className="font-display text-2xl text-brand">What are we moving?</h2><p className="text-sm text-muted-foreground">Your home-size selection preloads a typical inventory. Adjust any item.</p></div>{rooms.map((room) => <div key={room}><h3 className="mb-2 text-sm font-bold uppercase text-maple">{room}</h3><div className="grid gap-2 md:grid-cols-2">{INVENTORY_CATALOG.filter((item) => item.room === room).map((item) => { const count = form.items[item.id] ?? 0; return <div key={item.id} className="flex min-h-12 items-center justify-between border border-border bg-background px-3"><span className="text-sm">{item.label}</span><div className="flex items-center gap-2"><Button type="button" size="icon" variant="ghost" aria-label={`Remove ${item.label}`} onClick={() => patch("items", { ...form.items, [item.id]: Math.max(0, count - 1) })}><Minus/></Button><span className="w-5 text-center text-sm font-bold">{count}</span><Button type="button" size="icon" variant="ghost" aria-label={`Add ${item.label}`} onClick={() => patch("items", { ...form.items, [item.id]: count + 1 })}><Plus/></Button></div></div>})}</div></div>)}</div>}
        {step === 2 && <div className="space-y-7"><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-semibold">Move date<input type="date" value={form.moveDate} min={new Date().toISOString().slice(0,10)} onChange={(e) => patch("moveDate", e.target.value)} className="mt-2 w-full border border-input bg-background p-3"/>{form.moveDate && <span className="mt-2 block text-xs font-bold text-maple">{peakLabel(form.moveDate)}</span>}</label><label className="flex items-center gap-3 border border-border bg-background p-4 text-sm"><input type="checkbox" checked={form.flexibleDates} onChange={(e) => patch("flexibleDates", e.target.checked)} className="size-5 accent-maple"/><span><strong className="block">My dates are flexible</strong><span className="text-muted-foreground">Save 5% when we can shift the date.</span></span></label></div><div><p className="text-sm font-semibold">Arrival window</p><div className="mt-2 grid gap-2 md:grid-cols-3">{ARRIVAL_WINDOWS.map((window) => <Button type="button" variant={form.arrivalWindow === window.id ? "default" : "outline"} className={`h-auto whitespace-normal py-3 ${form.arrivalWindow === window.id ? "bg-maple hover:bg-maple-deep" : ""}`} key={window.id} onClick={() => patch("arrivalWindow", window.id)}><span>{window.label}<small className="block font-normal opacity-70">{window.note}</small></span></Button>)}</div></div><div className="grid gap-5 md:grid-cols-2">{(["stairsFrom", "stairsTo"] as const).map((key) => <label key={key} className="text-sm font-semibold">{key === "stairsFrom" ? "Pickup access" : "Destination access"}<select value={form[key]} onChange={(e) => patch(key, e.target.value)} className="mt-2 w-full border border-input bg-background p-3 font-normal">{STAIRS_OPTIONS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></label>)}</div><div><p className="text-sm font-semibold">Extra services</p><div className="mt-2 grid gap-2 md:grid-cols-2">{ADD_ONS.map((addOn) => <label key={addOn.id} className="flex items-start gap-3 border border-border bg-background p-3"><input type="checkbox" checked={form.addOns.includes(addOn.id)} onChange={() => patch("addOns", form.addOns.includes(addOn.id) ? form.addOns.filter((id) => id !== addOn.id) : [...form.addOns, addOn.id])} className="mt-1 size-4 accent-maple"/><span className="text-sm"><strong className="block">{addOn.label}</strong><span className="text-xs text-muted-foreground">{addOn.description}</span></span></label>)}</div></div></div>}
        {step === 3 && <div className="space-y-5"><div><h2 className="font-display text-2xl text-brand">Where should we send your quote?</h2><p className="text-sm text-muted-foreground">No payment is taken when you submit.</p></div><div className="grid gap-5 md:grid-cols-2"><label className="text-sm font-semibold">Full name<input value={form.contactName} onChange={(e) => patch("contactName", e.target.value)} className="mt-2 w-full border border-input bg-background p-3 font-normal"/></label><label className="text-sm font-semibold">Phone<input type="tel" value={form.contactPhone} onChange={(e) => patch("contactPhone", e.target.value)} className="mt-2 w-full border border-input bg-background p-3 font-normal"/></label></div><label className="block text-sm font-semibold">Email<input type="email" value={form.contactEmail} onChange={(e) => patch("contactEmail", e.target.value)} className="mt-2 w-full border border-input bg-background p-3 font-normal"/></label><label className="block text-sm font-semibold">Anything else we should know?<textarea value={form.notes} onChange={(e) => patch("notes", e.target.value)} rows={4} className="mt-2 w-full border border-input bg-background p-3 font-normal"/></label><div className="flex gap-3 bg-muted p-4 text-sm"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-maple"/><p>Your details are used only to prepare and manage your move. The final price is confirmed after our team reviews access and inventory.</p></div></div>}
        {error && <p role="alert" className="mt-5 border-l-4 border-maple bg-maple/10 p-3 text-sm text-maple-deep">{error}</p>}
        <div className="mt-8 flex justify-between"><Button variant="outline" disabled={step === 0 || saving} onClick={() => setStep((value) => value - 1)}><ChevronLeft/>Back</Button>{step < 3 ? <Button onClick={next} disabled={routeBusy}>{routeBusy ? <LoaderCircle className="animate-spin"/> : <>Continue<ChevronRight/></>}</Button> : <Button onClick={submit} disabled={saving} className="bg-maple hover:bg-maple-deep">{saving ? <><LoaderCircle className="animate-spin"/>Saving</> : "Save quote request"}</Button>}</div>
      </section>
      <aside className="sticky top-4 border border-border bg-brand p-6 text-cream shadow-xl"><p className="text-xs font-bold uppercase text-amber">Live estimate</p><p className="mt-2 font-display text-4xl">{money(estimate.lowCents)}–{money(estimate.highCents)}</p><p className="mt-1 text-sm text-cream/65">Crew of {estimate.crew} · about {estimate.hours} hours</p><div className="my-5 h-px bg-cream/15"/><div className="space-y-2 text-sm">{estimate.lines.map((line) => <div className="flex justify-between gap-4" key={line.label}><span className="text-cream/70">{line.label}</span><strong>{money(line.cents)}</strong></div>)}</div><div className="my-5 h-px bg-cream/15"/><div className="flex justify-between"><span>Deposit at booking</span><strong className="text-amber">{money(estimate.depositCents)}</strong></div><p className="mt-3 text-xs leading-relaxed text-cream/60">Deposit payment is currently pending activation. You can still save and schedule your move request.</p></aside>
    </div>
  </main></PageShell>;
}

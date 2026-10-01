import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, Package, Phone, Truck, Warehouse } from "lucide-react";
import { api } from "@/lib/api";
import truckStreet from "@/assets/truck-street.jpg";

import crewLoading from "@/assets/crew-loading.jpg";
import crewSofa from "@/assets/crew-sofa.jpg";
import crewStairs from "@/assets/crew-stairs.jpg";
import crewAppliance from "@/assets/crew-appliance.jpg";
import condoTruck from "@/assets/condo-truck.jpg";
import logo from "@/assets/mapleleaf-moving-wordmark-transparent.png";
import storageUnits from "@/assets/storage-units.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Mapleleaf Moving Co | Toronto Moving Company",
      },
      {
        name: "description",
        content:
          "A licensed and insured Toronto moving company. Local, intercity, packing, and storage services across the GTA. Get your free quote today.",
      },
      {
        property: "og:title",
        content: "Mapleleaf Moving Co | Toronto Moving Company",
      },
      {
        property: "og:description",
        content:
          "A licensed and insured Toronto moving company. Local, intercity, packing, and storage services across the GTA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const homeSizes = [
  { id: "studio",  label: "Studio",                base: 320 },
  { id: "1bed",    label: "1 bedroom apartment",   base: 400 },
  { id: "2bed",    label: "2 bedroom apartment",   base: 480 },
  { id: "3bed",    label: "3 bedroom house",        base: 650 },
  { id: "office",  label: "Office / commercial",   base: 720 },
];

const addOns = [
  { label: "Packing", value: 120 },
  { label: "Piano", value: 180 },
  { label: "Storage", value: 90 },
];

function Index() {
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [homeSizeIndex, setHomeSizeIndex] = useState(2);
  const [moveDate, setMoveDate] = useState("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [consentTerms, setConsentTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const base = homeSizes[homeSizeIndex]?.base ?? 0;
  const addOnTotal = addOns
    .filter((a) => selectedAddOns.includes(a.label))
    .reduce((sum, a) => sum + a.value, 0);
  const low = base + addOnTotal;
  const high = Math.round(low * 1.25);

  const toggleAddOn = (label: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fromAddress.trim() || !toAddress.trim()) {
      setFormError("Please enter both pickup and destination addresses.");
      return;
    }
    if (!moveDate) {
      setFormError("Please select a move date.");
      return;
    }
    if (!consentTerms) {
      setFormError("Please accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      const homeSize = homeSizes[homeSizeIndex]?.id ?? "2bed";
      const result = await api.post("/checkout/instant", {
        from: fromAddress.trim(),
        to: toAddress.trim(),
        homeSize,
        date: moveDate,
        consentTerms: true,
        // Turnstile token is bypassed in dev (empty string handled by backend when TURNSTILE_SECRET is unset)
        turnstileToken: "dev-bypass",
      });
      if (result?.url) {
        window.location.assign(result.url);
      } else {
        setFormError("Could not create checkout session. Please try again.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="site-wallpaper min-h-screen text-foreground" style={{ backgroundImage: `linear-gradient(oklch(0.96 0.015 85 / 88%), oklch(0.96 0.015 85 / 88%))` }}>
      {/* Nav */}
      <header className="border-b border-ink/10 px-6 py-5 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="min-w-0">
            <img src={logo} alt="Maple Leaf Moving Co" className="h-auto w-64 object-contain md:w-72" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-ink/70 md:flex">
            <a
              href="#services"
              className="transition-colors hover:text-amber"
            >
              Services
            </a>
            <Link to="/quote" className="transition-colors hover:text-maple">
              Pricing
            </Link>
            <Link to="/quote" className="transition-colors hover:text-maple">
              How it works
            </Link>
            <Link to="/contact" className="transition-colors hover:text-amber">
              Contact
            </Link>
          </nav>
          <Link
            to="/quote"
            className="rounded-md bg-maple px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-maple-deep"
          >
            Get a quote
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink/70 md:justify-end">
          <a
            href="tel:+14167377674"
            className="flex items-center gap-1.5 transition-colors hover:text-amber"
          >
            <Phone className="size-4 text-amber" strokeWidth={2} />
            416 737 7674
          </a>
          <a
            href="mailto:hi@mapleleafmovingco.com"
            className="flex items-center gap-1.5 transition-colors hover:text-amber"
          >
            <Mail className="size-4 text-amber" strokeWidth={2} />
            hi@mapleleafmovingco.com
          </a>
        </div>
      </header>

      {/* Hero: quote tool as signature feature */}
      <section
        id="quote"
        className="grid items-start gap-10 px-6 pb-10 pt-12 md:px-12 md:pt-16 lg:grid-cols-12"
      >
        <div className="lg:col-span-5">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-amber">
            Toronto, ON · Licensed &amp; Insured
          </p>
          <h1 className="font-display text-5xl leading-[1.02] text-brand md:text-6xl">
            Move day,
            <br />
            <span className="italic text-amber">without</span> the{" "}
            <span className="italic">chaos.</span>
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-ink/70">
            From Etobicoke to East York, our crew packs, lifts and delivers with
            care. Get an instant estimate in under a minute.
          </p>
          <div className="mt-8 flex items-center gap-5">
            <div className="text-sm">
              <p className="font-display text-3xl font-semibold text-brand">
                4.9<span className="text-amber">★</span>
              </p>
              <p className="text-ink/50">1,200+ local moves</p>
            </div>
            <div className="h-10 w-px bg-ink/15"></div>
            <div className="text-sm">
              <p className="font-display text-3xl font-semibold text-brand">
                12
              </p>
              <p className="text-ink/50">years on the road</p>
            </div>
          </div>
        </div>

        {/* Quote tool */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-ink/5 bg-card p-6 shadow-[0_20px_50px_-20px_rgba(18,38,28,0.35)] md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-brand">
                Instant estimate
              </h2>
              <span className="rounded-full bg-amber/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber">
                No obligation
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/50">
                    From
                  </label>
                  <input
                    type="text"
                    value={fromAddress}
                    onChange={(e) => setFromAddress(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm text-ink transition focus:border-amber focus:outline-none"
                    placeholder="Current address"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/50">
                    To
                  </label>
                  <input
                    type="text"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm text-ink transition focus:border-amber focus:outline-none"
                    placeholder="New address"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/50">
                    Home size
                  </label>
                  <select
                    value={homeSizeIndex}
                    onChange={(e) => setHomeSizeIndex(Number(e.target.value))}
                    className="w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm text-ink focus:border-amber focus:outline-none"
                  >
                    {homeSizes.map((size, index) => (
                      <option key={size.label} value={index}>
                        {size.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/50">
                    Move date
                  </label>
                  <input
                    type="date"
                    value={moveDate}
                    onChange={(e) => setMoveDate(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 bg-sand/40 px-4 py-3 text-sm text-ink focus:border-amber focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {addOns.map((addOn) => (
                  <button
                    key={addOn.label}
                    type="button"
                    onClick={() => toggleAddOn(addOn.label)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selectedAddOns.includes(addOn.label)
                         ? "border-maple/20 bg-maple/10 text-maple-deep"
                        : "border-ink/10 bg-cream text-ink/70 hover:border-ink/20"
                    }`}
                  >
                    {addOn.label}
                  </button>
                ))}
              </div>

              {/* Terms consent */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="consentTerms"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-0.5 size-4 accent-maple"
                />
                <span className="text-xs leading-relaxed text-ink/60">
                  I agree to the{" "}
                  <Link to="/terms" className="underline hover:text-amber">Terms &amp; Conditions</Link>
                  {" "}and{" "}
                  <Link to="/refund-policy" className="underline hover:text-amber">Refund Policy</Link>.
                  Fixed price based on the details entered. See Terms.
                </span>
              </label>

              {formError && (
                <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-brand px-5 py-4 text-cream">
                <div>
                  <p className="text-xs uppercase tracking-wider text-cream/60">
                    Estimated range
                  </p>
                  <p className="font-display text-2xl font-semibold">
                    ${low} – ${high}
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-md bg-maple px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-maple-deep disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <><Loader2 className="size-4 animate-spin" /> Redirecting…</>
                  ) : (
                    "Confirm & book"
                  )}
                </button>
              </div>
            </form>


          </div>
        </div>
      </section>

      {/* Hero photo band */}
      <section className="px-6 pb-14 md:px-12">
        <div className="relative">
          <img
            src={truckStreet}
            alt="Mapleleaf Moving Co truck parked on a tree-lined Toronto street"
            className="h-72 w-full object-cover md:h-[26rem]"
            loading="lazy"
          />
          <p className="absolute bottom-4 left-5 rounded-full bg-cream/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
            Our crew, on a Toronto street near you
          </p>
        </div>
      </section>

      {/* Services */}
      <section
        id="services"
        className="border-t border-ink/10 px-6 py-14 md:px-12"
      >
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl text-brand md:text-4xl">
            What we handle
          </h2>
          <p className="hidden max-w-xs text-sm text-ink/50 md:block">
            Flat, honest pricing for every kind of move across the GTA.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="overflow-hidden rounded-2xl border border-ink/5 bg-sand/50">
            <img
              src={condoTruck}
              alt="Moving truck outside a Toronto condo building"
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <div className="p-7">
              <Truck className="size-8 text-brand" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-xl text-brand">
                Local &amp; intercity
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Apartments, houses and offices moved within Toronto and to any
                Ontario city, fully tracked.
              </p>
              <p className="mt-4 text-sm font-semibold text-amber">
                from $95/hr
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/5 bg-sand/50">
            <img
              src={crewSofa}
              alt="Two movers carefully wrapping and packing a living room"
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <div className="p-7">
              <Package className="size-8 text-brand" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-xl text-brand">
                Packing &amp; unpacking
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Supplies, labeling and careful wrapping included — you just
                point to the boxes.
              </p>
              <p className="mt-4 text-sm font-semibold text-amber">
                from $60/hr
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-ink/5 bg-sand/50">
            <img
              src={storageUnits}
              alt="Clean corridor of orange self-storage units used for Mapleleaf Moving Co storage"
              className="h-44 w-full object-cover"
              loading="lazy"
            />
            <div className="p-7">
              <Warehouse className="size-8 text-brand" strokeWidth={1.5} />
              <h3 className="mt-4 font-display text-xl text-brand">
                Secure storage
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">
                Clean, climate-minded units for short or long stays between
                your two addresses.
              </p>
              <p className="mt-4 text-sm font-semibold text-amber">
                from $45/mo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery band */}
      <section className="border-t border-ink/10 px-6 py-14 md:px-12">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-3xl text-brand md:text-4xl">
            The crew at work
          </h2>
          <p className="hidden max-w-xs text-sm text-ink/50 md:block">
            Careful hands, every step of the way — from walk-ups to high-rises.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <img
            src={crewLoading}
            alt="Movers loading boxes onto a truck liftgate"
            className="h-64 w-full rounded-2xl object-cover"
            loading="lazy"
          />
          <img
            src={crewStairs}
            alt="Two movers carrying a wrapped sofa down a staircase"
            className="h-64 w-full rounded-2xl object-cover object-right"
            loading="lazy"
          />
          <img
            src={crewAppliance}
            alt="Movers wheeling a washing machine into a kitchen"
            className="h-64 w-full rounded-2xl object-cover object-right sm:col-span-2 lg:col-span-1"
            loading="lazy"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col items-center justify-between gap-4 bg-brand px-6 py-8 text-cream/80 md:flex-row md:px-12">
        <p className="font-display text-sm">
          Mapleleaf Moving Co — Toronto, Ontario
        </p>
        <div className="flex flex-col items-center gap-1 text-xs text-cream/70 md:flex-row md:gap-4">
          <a
            href="tel:+14167377674"
            className="transition-colors hover:text-cream"
          >
            416 737 7674
          </a>
          <span className="hidden text-cream/40 md:inline">·</span>
          <a
            href="mailto:hi@mapleleafmovingco.com"
            className="transition-colors hover:text-cream"
          >
            hi@mapleleafmovingco.com
          </a>
        </div>
        <p className="text-xs text-cream/50">
          Serving the GTA since 2009 · Licensed &amp; insured
        </p>
      </footer>
    </div>
  );
}

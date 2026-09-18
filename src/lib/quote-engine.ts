// Pricing engine shared by the quote wizard and the booking summary.
// All money values are in cents to avoid float drift.

export type InventoryItem = {
  id: string;
  label: string;
  room: string;
  /** cubic feet */
  volume: number;
  /** minutes of crew handling time per unit */
  minutes: number;
};

export const INVENTORY_CATALOG: InventoryItem[] = [
  { id: "bed-queen", label: "Bed (queen/king)", room: "Bedroom", volume: 65, minutes: 22 },
  { id: "bed-single", label: "Bed (single/double)", room: "Bedroom", volume: 45, minutes: 16 },
  { id: "dresser", label: "Dresser", room: "Bedroom", volume: 35, minutes: 12 },
  { id: "wardrobe", label: "Wardrobe / armoire", room: "Bedroom", volume: 50, minutes: 20 },
  { id: "sofa-3", label: "Sofa (3 seat)", room: "Living room", volume: 55, minutes: 20 },
  { id: "sofa-sectional", label: "Sectional", room: "Living room", volume: 90, minutes: 34 },
  { id: "armchair", label: "Armchair", room: "Living room", volume: 25, minutes: 8 },
  { id: "tv", label: "TV + stand", room: "Living room", volume: 20, minutes: 10 },
  { id: "bookcase", label: "Bookcase", room: "Living room", volume: 30, minutes: 12 },
  { id: "dining-table", label: "Dining table", room: "Dining room", volume: 40, minutes: 18 },
  { id: "dining-chair", label: "Dining chair", room: "Dining room", volume: 8, minutes: 3 },
  { id: "fridge", label: "Fridge", room: "Kitchen", volume: 60, minutes: 26 },
  { id: "washer", label: "Washer / dryer", room: "Kitchen", volume: 45, minutes: 24 },
  { id: "boxes-small", label: "Small boxes", room: "Boxes", volume: 3, minutes: 1.5 },
  { id: "boxes-large", label: "Large boxes", room: "Boxes", volume: 6, minutes: 2.5 },
  { id: "desk", label: "Desk", room: "Office", volume: 30, minutes: 12 },
  { id: "filing", label: "Filing cabinet", room: "Office", volume: 18, minutes: 8 },
  { id: "piano-upright", label: "Upright piano", room: "Specialty", volume: 70, minutes: 55 },
  { id: "gym", label: "Treadmill / gym gear", room: "Specialty", volume: 40, minutes: 26 },
  { id: "bike", label: "Bicycle", room: "Specialty", volume: 12, minutes: 5 },
];

export type HomeSize = {
  id: string;
  label: string;
  /** starting inventory volume in cubic feet */
  volume: number;
  crew: number;
  /** default item counts pre-loaded into the inventory step */
  preset: Record<string, number>;
};

export const HOME_SIZES: HomeSize[] = [
  {
    id: "studio",
    label: "Studio / bachelor",
    volume: 300,
    crew: 2,
    preset: { "bed-single": 1, "sofa-3": 1, dresser: 1, "boxes-small": 12, "boxes-large": 4 },
  },
  {
    id: "1bed",
    label: "1 bedroom",
    volume: 450,
    crew: 2,
    preset: { "bed-queen": 1, "sofa-3": 1, dresser: 1, tv: 1, "boxes-small": 18, "boxes-large": 6 },
  },
  {
    id: "2bed",
    label: "2 bedroom",
    volume: 700,
    crew: 3,
    preset: {
      "bed-queen": 1,
      "bed-single": 1,
      "sofa-3": 1,
      dresser: 2,
      "dining-table": 1,
      "dining-chair": 4,
      tv: 1,
      "boxes-small": 26,
      "boxes-large": 10,
    },
  },
  {
    id: "3bed",
    label: "3 bedroom house",
    volume: 1100,
    crew: 3,
    preset: {
      "bed-queen": 2,
      "bed-single": 1,
      "sofa-sectional": 1,
      dresser: 3,
      "dining-table": 1,
      "dining-chair": 6,
      fridge: 1,
      washer: 1,
      tv: 2,
      "boxes-small": 40,
      "boxes-large": 16,
    },
  },
  {
    id: "office",
    label: "Office / commercial",
    volume: 900,
    crew: 4,
    preset: { desk: 6, filing: 4, bookcase: 3, "boxes-large": 24, "boxes-small": 20 },
  },
];

export type AddOn = {
  id: string;
  label: string;
  description: string;
  /** flat cents, or per-hour cents when perHour is true */
  cents: number;
  perHour?: boolean;
};

export const ADD_ONS: AddOn[] = [
  { id: "packing", label: "Full packing", description: "Boxes, tape, labels and wrapping by our crew", cents: 6000, perHour: true },
  { id: "unpacking", label: "Unpacking", description: "We unpack and take the empties away", cents: 4500, perHour: true },
  { id: "supplies", label: "Packing supplies", description: "Boxes, paper, tape delivered before move day", cents: 12000 },
  { id: "piano", label: "Piano / safe handling", description: "Specialty gear and an extra set of hands", cents: 22000 },
  { id: "appliance", label: "Appliance disconnect", description: "Washer, dryer and fridge disconnect + reconnect", cents: 9500 },
  { id: "storage", label: "30 days storage", description: "Clean, monitored unit between addresses", cents: 18000 },
  { id: "junk", label: "Junk removal", description: "One truckload of anything you're not taking", cents: 15000 },
  { id: "insurance", label: "Extended valuation", description: "Coverage above the standard 60¢/lb", cents: 9000 },
];

export const ARRIVAL_WINDOWS = [
  { id: "am", label: "Morning · 8–10am", note: "Most popular", multiplier: 1.05 },
  { id: "midday", label: "Midday · 11am–1pm", note: "Flexible", multiplier: 1 },
  { id: "pm", label: "Afternoon · 2–4pm", note: "Best value", multiplier: 0.95 },
];

export const STAIRS_OPTIONS = [
  { id: "elevator", label: "Elevator / ground floor", minutes: 0 },
  { id: "1flight", label: "1 flight of stairs", minutes: 25 },
  { id: "2flights", label: "2 flights", minutes: 45 },
  { id: "3plus", label: "3+ flights", minutes: 75 },
];

export const CREW_RATE_CENTS: Record<number, number> = {
  2: 13900,
  3: 18900,
  4: 23900,
};

const TRUCK_FEE_CENTS = 9000;
const LONG_HAUL_PER_KM_CENTS = 160;
const FREE_KM = 30;
const MIN_HOURS = 3;

export type QuoteInput = {
  homeSizeId: string;
  items: Record<string, number>;
  addOns: string[];
  stairsFrom: string;
  stairsTo: string;
  distanceKm: number | null;
  driveMinutes: number | null;
  moveDate: string;
  arrivalWindow: string;
  flexibleDates: boolean;
};

export type QuoteBreakdown = {
  volume: number;
  crew: number;
  hours: number;
  labourCents: number;
  truckCents: number;
  distanceCents: number;
  addOnCents: number;
  peakMultiplier: number;
  windowMultiplier: number;
  flexDiscountCents: number;
  lowCents: number;
  highCents: number;
  depositCents: number;
  lines: { label: string; cents: number }[];
};

export function isPeakDate(date: string): boolean {
  if (!date) return false;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  const dom = d.getDate();
  const lastDom = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const monthEnd = dom >= lastDom - 2 || dom <= 1;
  return day === 6 || day === 0 || monthEnd;
}

export function peakLabel(date: string): string {
  if (!date) return "";
  return isPeakDate(date) ? "Peak day" : "Off-peak day";
}

export function calculateQuote(input: QuoteInput): QuoteBreakdown {
  const size = HOME_SIZES.find((s) => s.id === input.homeSizeId) ?? HOME_SIZES[1]!;

  let volume = 0;
  let minutes = 0;
  for (const [id, count] of Object.entries(input.items)) {
    const item = INVENTORY_CATALOG.find((i) => i.id === id);
    if (!item || !count) continue;
    volume += item.volume * count;
    minutes += item.minutes * count;
  }
  if (volume === 0) {
    volume = size.volume;
    minutes = size.volume * 0.42;
  }

  const stairs =
    (STAIRS_OPTIONS.find((s) => s.id === input.stairsFrom)?.minutes ?? 0) +
    (STAIRS_OPTIONS.find((s) => s.id === input.stairsTo)?.minutes ?? 0);

  const crew = volume > 950 ? 4 : volume > 520 ? 3 : size.crew;
  const drive = input.driveMinutes ?? 35;

  const rawHours = (minutes / crew + stairs + drive + 20) / 60;
  const hours = Math.max(MIN_HOURS, Math.round(rawHours * 2) / 2);

  const rate = CREW_RATE_CENTS[crew] ?? CREW_RATE_CENTS[3]!;
  const labourCents = Math.round(rate * hours);

  const extraKm = Math.max(0, (input.distanceKm ?? 18) - FREE_KM);
  const distanceCents = Math.round(extraKm * LONG_HAUL_PER_KM_CENTS);

  let addOnCents = 0;
  for (const id of input.addOns) {
    const addOn = ADD_ONS.find((a) => a.id === id);
    if (!addOn) continue;
    addOnCents += addOn.perHour ? Math.round(addOn.cents * hours) : addOn.cents;
  }

  const peakMultiplier = isPeakDate(input.moveDate) ? 1.15 : 1;
  const windowMultiplier =
    ARRIVAL_WINDOWS.find((w) => w.id === input.arrivalWindow)?.multiplier ?? 1;

  const subtotal = Math.round(
    (labourCents + TRUCK_FEE_CENTS + distanceCents) * peakMultiplier * windowMultiplier +
      addOnCents,
  );
  const flexDiscountCents = input.flexibleDates ? Math.round(subtotal * 0.05) : 0;
  const lowCents = subtotal - flexDiscountCents;
  const highCents = Math.round(lowCents * 1.18);
  const depositCents = Math.max(10000, Math.round(lowCents * 0.15 / 500) * 500);

  const lines = [
    { label: `Crew of ${crew} · ${hours} hrs @ ${money(rate)}/hr`, cents: labourCents },
    { label: "Truck & equipment", cents: TRUCK_FEE_CENTS },
    ...(distanceCents > 0
      ? [{ label: `Long haul (${Math.round(extraKm)} km beyond ${FREE_KM} km)`, cents: distanceCents }]
      : []),
    ...(addOnCents > 0 ? [{ label: "Extra services", cents: addOnCents }] : []),
    ...(peakMultiplier > 1
      ? [{ label: "Peak day (weekend / month end)", cents: Math.round((labourCents + TRUCK_FEE_CENTS + distanceCents) * (peakMultiplier - 1)) }]
      : []),
    ...(flexDiscountCents > 0 ? [{ label: "Flexible dates discount", cents: -flexDiscountCents }] : []),
  ];

  return {
    volume: Math.round(volume),
    crew,
    hours,
    labourCents,
    truckCents: TRUCK_FEE_CENTS,
    distanceCents,
    addOnCents,
    peakMultiplier,
    windowMultiplier,
    flexDiscountCents,
    lowCents,
    highCents,
    depositCents,
    lines,
  };
}

export function money(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  return `${sign}$${(Math.abs(cents) / 100).toLocaleString("en-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function makeReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MLM-${out}`;
}

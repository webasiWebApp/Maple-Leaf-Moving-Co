import { describe, it, expect } from 'vitest';
import { calculateQuote, isPeakDate } from '../src/services/pricing';

describe('Pricing Service', () => {
  it('should enforce a 3 hour minimum', () => {
    const quote = calculateQuote({
      homeSizeId: 'studio',
      items: {},
      addOns: [],
      stairsFrom: 'elevator',
      stairsTo: 'elevator',
      distanceKm: 10,
      driveMinutes: 20,
      moveDate: '2026-10-15',
      arrivalWindow: 'midday',
      flexibleDates: false
    });
    expect(quote.hours).toBe(3);
    expect(quote.crew).toBe(2);
  });

  it('should calculate peak date correctly', () => {
    // 2026-10-31 is a Saturday and month end
    expect(isPeakDate('2026-10-31')).toBe(true);
    // 2026-10-15 is a Thursday mid-month
    expect(isPeakDate('2026-10-15')).toBe(false);
  });

  it('should apply distance over 30km', () => {
    const quote = calculateQuote({
      homeSizeId: 'studio',
      items: {},
      addOns: [],
      stairsFrom: 'elevator',
      stairsTo: 'elevator',
      distanceKm: 50,
      driveMinutes: 60,
      moveDate: '2026-10-15',
      arrivalWindow: 'midday',
      flexibleDates: false
    });
    // 50km - 30km = 20km * 1.60 = 3200 cents
    expect(quote.distanceCents).toBe(3200);
  });

  it('should calculate tax (13% HST) correctly', () => {
    const quote = calculateQuote({
      homeSizeId: 'studio',
      items: {},
      addOns: [],
      stairsFrom: 'elevator',
      stairsTo: 'elevator',
      distanceKm: 10,
      driveMinutes: 20,
      moveDate: '2026-10-15',
      arrivalWindow: 'midday',
      flexibleDates: false
    });
    
    const subtotal = quote.subtotalCents;
    const expectedTax = Math.round(subtotal * 0.13);
    expect(quote.taxCents).toBe(expectedTax);
    expect(quote.totalCents).toBe(subtotal + expectedTax);
  });
});

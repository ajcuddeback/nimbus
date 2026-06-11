import { MoonPhaseService } from './moon-phase.service';
import { MoonPhase } from '../models/moonPhase.enum';

const LUNAR_CYCLE_DAYS = 29.530588853;
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);
const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

function dateAtCycleDays(daysAfterReferenceNewMoon: number): Date {
  return new Date(REFERENCE_NEW_MOON_MS + daysAfterReferenceNewMoon * MILLISECONDS_PER_DAY);
}

describe('MoonPhaseService', () => {
  let service: MoonPhaseService;

  beforeEach(() => {
    service = new MoonPhaseService();
  });

  it('returns a cycle fraction of 0 at the reference new moon', () => {
    expect(service.getCycleFraction(dateAtCycleDays(0))).toBeCloseTo(0, 5);
  });

  it('wraps back to a new moon after one whole cycle', () => {
    const fraction = service.getCycleFraction(dateAtCycleDays(LUNAR_CYCLE_DAYS));
    const distanceFromNewMoon = Math.min(fraction, 1 - fraction);
    expect(distanceFromNewMoon).toBeCloseTo(0, 5);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS))).toBe(MoonPhase.NEW_MOON);
  });

  it('identifies the principal phases at their exact cycle positions', () => {
    expect(service.getPhase(dateAtCycleDays(0))).toBe(MoonPhase.NEW_MOON);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.25))).toBe(MoonPhase.FIRST_QUARTER);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.5))).toBe(MoonPhase.FULL_MOON);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.75))).toBe(MoonPhase.THIRD_QUARTER);
  });

  it('identifies the principal phases near (not exactly at) their instants', () => {
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.5 + 1))).toBe(MoonPhase.FULL_MOON);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.5 - 1))).toBe(MoonPhase.FULL_MOON);
  });

  it('identifies the intermediate phases between principal phases', () => {
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.125))).toBe(MoonPhase.WAXING_CRESCENT);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.375))).toBe(MoonPhase.WAXING_GIBBOUS);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.625))).toBe(MoonPhase.WANING_GIBBOUS);
    expect(service.getPhase(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.875))).toBe(MoonPhase.WANING_CRESCENT);
  });

  it('handles dates before the reference new moon', () => {
    expect(service.getPhase(dateAtCycleDays(-LUNAR_CYCLE_DAYS * 0.5))).toBe(MoonPhase.FULL_MOON);
  });

  it('provides a display name for the current phase', () => {
    expect(service.getPhaseName(dateAtCycleDays(LUNAR_CYCLE_DAYS * 0.5))).toBe('Full Moon');
  });
});

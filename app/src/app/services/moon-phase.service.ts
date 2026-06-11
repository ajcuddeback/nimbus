import { Injectable } from '@angular/core';
import { MoonPhase } from '../models/moonPhase.enum';

/** Mean length of the synodic month (new moon to new moon), in days. */
const LUNAR_CYCLE_DAYS = 29.530588853;

/** A well-documented reference new moon: 2000-01-06 18:14 UTC. */
const REFERENCE_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * The eight phases in cycle order, so that `Math.round(fraction * 8) % 8`
 * maps a cycle fraction to the phase whose window it falls in.
 */
const PHASES_IN_CYCLE_ORDER: readonly MoonPhase[] = [
  MoonPhase.NEW_MOON,
  MoonPhase.WAXING_CRESCENT,
  MoonPhase.FIRST_QUARTER,
  MoonPhase.WAXING_GIBBOUS,
  MoonPhase.FULL_MOON,
  MoonPhase.WANING_GIBBOUS,
  MoonPhase.THIRD_QUARTER,
  MoonPhase.WANING_CRESCENT,
];

const PHASE_DISPLAY_NAMES: Record<MoonPhase, string> = {
  [MoonPhase.NEW_MOON]: 'New Moon',
  [MoonPhase.WAXING_CRESCENT]: 'Waxing Crescent',
  [MoonPhase.FIRST_QUARTER]: 'First Quarter',
  [MoonPhase.WAXING_GIBBOUS]: 'Waxing Gibbous',
  [MoonPhase.FULL_MOON]: 'Full Moon',
  [MoonPhase.WANING_GIBBOUS]: 'Waning Gibbous',
  [MoonPhase.THIRD_QUARTER]: 'Third Quarter',
  [MoonPhase.WANING_CRESCENT]: 'Waning Crescent',
};

@Injectable({ providedIn: 'root' })
export class MoonPhaseService {
  /**
   * Position in the synodic cycle as a fraction in [0, 1):
   * 0 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = third quarter.
   */
  getCycleFraction(date: Date = new Date()): number {
    const daysSinceReference = (date.getTime() - REFERENCE_NEW_MOON_MS) / MILLISECONDS_PER_DAY;
    const fraction = (daysSinceReference / LUNAR_CYCLE_DAYS) % 1;
    return fraction < 0 ? fraction + 1 : fraction;
  }

  /**
   * The named phase for a date. The four principal phases (new, quarters, full)
   * are instants, so each phase is treated as a 1/8-cycle window centered on it.
   */
  getPhase(date: Date = new Date()): MoonPhase {
    const phaseIndex = Math.round(this.getCycleFraction(date) * 8) % 8;
    return PHASES_IN_CYCLE_ORDER[phaseIndex];
  }

  getPhaseName(date: Date = new Date()): string {
    return PHASE_DISPLAY_NAMES[this.getPhase(date)];
  }
}

// src/foraging/scoring.ts
//
// AUDIT_FIX (Foraging audit · D-01, P0 · ship-blocking).
//
// Prior state: ForagingApp.tsx and NodePanel.tsx each had their own
// version of "how likely is this species here right now" math.
//
//   ForagingApp userInsight (for the "Growing around you" panel):
//     seasonMult   = inSeason ? 1.20 : 0.55
//     distPenalty  = max(0.5, 1 - km / 250)
//     weatherBonus = fungal ? rainBoost : 0
//     score        = min(1, base * seasonMult * distPenalty + weatherBonus)
//
//   NodePanel per-species bar (for the tapped-node detail panel):
//     adj = inSeason ? min(1, base * 1.25) : base * 0.45
//
// Same conceptual question, two different formulas. Meaning the
// "Rose Petals in Boreal Mycelial Field" chip you saw in the
// side-panel showed a slightly different number than the same
// species in the "Growing around you" list. The audit's fix:
// ONE scoring module, imported by both.
//
// This module is that module. Existing behaviour preserved for the
// ForagingApp path (the more refined formula wins). NodePanel path
// converges to the shared formula — the display drifts slightly
// (1.20/0.55 instead of 1.25/0.45) so both panels finally show
// the same species at the same strength. Consumers pass what they
// have; defaults keep the function useful in either context.

import type { SpeciesEntry, Season } from '../types/EcoNode';

/**
 * Score a species for a location + moment. Returns a value in [0, 1]
 * that consumers should convert to a LIKELIHOOD BAND for display
 * (see NodePanel `bandFor`) rather than expose as a raw percentage
 * (audit fix S-02).
 *
 * @param opts.base          h.probability from the catalog (0..1)
 * @param opts.inSeason      true when the current season overlaps peak_season
 * @param opts.distanceKm    Haversine km from user to node (default 0 = local)
 * @param opts.weatherBoost  additive multiplier from rain/weather (0 default)
 */
export interface ScoreOpts {
  base: number;
  inSeason: boolean;
  distanceKm?: number;
  weatherBoost?: number;
}

export function scoreSpecies({ base, inSeason, distanceKm = 0, weatherBoost = 0 }: ScoreOpts): number {
  const seasonMult   = inSeason ? 1.20 : 0.55;
  const distPenalty  = distanceKm > 0 ? Math.max(0.5, 1 - distanceKm / 250) : 1;
  return Math.min(1, base * seasonMult * distPenalty + weatherBoost);
}

/**
 * Convenience: does the species' peak_season overlap ANY of the
 * seasons the user is currently viewing? Both consumers needed
 * this predicate; extracted here so it stays in sync.
 */
export function isSpeciesInSeason(sp: SpeciesEntry, activeSeasons: Season[]): boolean {
  return sp.peak_season.some(s => activeSeasons.includes(s));
}

/**
 * Rain-boost step function — pulled out of ForagingApp so the
 * numbers live in one place. Fungal species get a boost after
 * meaningful recent rain (≥ 10mm over 10 days is a light boost,
 * ≥ 25mm is a strong boost).
 */
export function rainBoostFor(totalRain10dMm: number): number {
  if (totalRain10dMm > 25) return 0.25;
  if (totalRain10dMm > 10) return 0.10;
  return 0;
}

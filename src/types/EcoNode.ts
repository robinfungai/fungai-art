export type HabitatType =
  | 'birch_edge'
  | 'pine_heath'
  | 'wetland'
  | 'deadwood_zone'
  | 'boreal_forest'
  | 'meadow'
  | 'coastal'
  | 'tropical_forest'
  | 'mountain_forest'
  | 'mediterranean'
  | 'ancient_forest'
  | 'jungle_edge';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * AUDIT_FIX (Foraging audit · S-01, P0 · ship-blocking).
 *
 * Prior schema exposed `edible: boolean` alone. NodePanel rendered a
 * green "edible" chip beside any species where that flag was true.
 * A user could read "edible ✓" for a mushroom that has a lethal
 * lookalike — because the schema had no way to REQUIRE the caution
 * data to be present before the chip rendered.
 *
 * Fix (per the audit's recommended shape): every SpeciesEntry that
 * wants to show the edible chip MUST also carry:
 *   · confusableWith  — the species names an identifier could
 *                       mistake this for (empty array = deliberately
 *                       audited and cleared: no lookalikes exist)
 *   · toxicityClass   — the risk class of the WORST realistic
 *                       lookalike, so the chip can visually
 *                       escalate ("edible · lethal lookalike")
 *
 * Both fields are optional at the type level (to keep existing data
 * compiling) but NodePanel gates the chip on BOTH being populated.
 * A species with `edible: true` and no confusableWith/toxicityClass
 * NOW SHOWS NOTHING — the safest possible default while the data
 * gets audited species-by-species.
 */
export type ToxicityClass =
  | 'none'      // deliberately audited: no toxic lookalikes exist
  | 'mild'      // GI upset, no lasting harm
  | 'severe'    // hospitalisation-level
  | 'lethal';   // organ failure / death

export interface SpeciesEntry {
  name: string;
  probability: number; // 0–1 base probability
  peak_season: Season[];
  edible?: boolean;
  medicinal?: boolean;
  note?: string;
  /** Names an identifier might mistake this for. `[]` = audited-clear. */
  confusableWith?: string[];
  /** Risk class of the worst realistic lookalike. */
  toxicityClass?: ToxicityClass;
}

export interface EcoNode {
  id: string;
  region: string;
  location: string;
  nodeType: HabitatType;
  coordinates: [number, number]; // [lng, lat]
  species: SpeciesEntry[];
  medicinal: string[];
  folklore: string[];
  moisture: number; // 0–1
  altitude?: number; // meters
  best_season: Season[];
  extraction_notes?: string;
  lore?: string;
}

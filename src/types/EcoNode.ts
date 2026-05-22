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

export interface SpeciesEntry {
  name: string;
  probability: number; // 0–1 base probability
  peak_season: Season[];
  edible?: boolean;
  medicinal?: boolean;
  note?: string;
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

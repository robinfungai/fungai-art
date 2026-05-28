// Vild Mad — Danish open foraging knowledge & observation atlas (vildmad.dk)
// Curated by Nordic Food Lab / NOMA et al. Plant identification, season &
// habitat windows for Denmark + southern Scandinavia.
// These observation clusters are manually placed approximations from the
// Vild Mad species pages and field-trip galleries (CC-BY where shown).

export interface VildMadObs {
  herb: string;       // Danish name
  latin: string;      // Latin name
  count: number;
  region: string;     // Region label
  points: [number, number][]; // [lng, lat]
}

export const VILDMAD_OBS: VildMadObs[] = [

  // ── HYLDEBLOMST (Sambucus nigra) — elderflower
  {
    herb: 'Hyldeblomst', latin: 'Sambucus nigra', count: 95, region: 'Sjælland & Jylland',
    points: [
      // Zealand / Copenhagen surrounds
      [12.42, 55.78], [12.10, 55.62], [12.65, 55.85], [11.92, 55.45],
      // Jutland east
      [10.18, 56.22], [9.95, 55.85], [10.55, 56.45],
      // Funen
      [10.35, 55.38], [10.62, 55.48],
    ],
  },

  // ── STRANDKÅL (Crambe maritima) — sea kale, classic Danish coastal foraging
  {
    herb: 'Strandkål', latin: 'Crambe maritima', count: 62, region: 'Danish coast',
    points: [
      // North Zealand coast
      [12.20, 56.05], [12.48, 56.10], [11.85, 55.95],
      // Jutland west coast
      [8.15, 56.45], [8.45, 56.85], [8.05, 56.12],
      // Bornholm
      [14.85, 55.18], [15.12, 55.22],
    ],
  },

  // ── RAMSLØG (Allium ursinum) — wild garlic, classic Vild Mad spring herb
  {
    herb: 'Ramsløg', latin: 'Allium ursinum', count: 140, region: 'Danish beech forests',
    points: [
      // Zealand beech forests
      [12.22, 55.82], [12.05, 55.68], [11.78, 55.55],
      // Jutland east beech
      [10.05, 56.18], [9.88, 55.95], [10.32, 56.42],
      // Funen
      [10.35, 55.42], [10.18, 55.28],
      // South Zealand
      [11.62, 55.22], [12.05, 55.05],
    ],
  },

  // ── KARSE (Lepidium / Barbarea) — winter cress, year-round Vild Mad pick
  {
    herb: 'Vinterkarse', latin: 'Barbarea vulgaris', count: 78, region: 'All Denmark',
    points: [
      [12.32, 55.72], [10.22, 56.28], [11.85, 55.68],
      [9.92, 55.78], [10.62, 55.42], [8.92, 56.12],
    ],
  },

  // ── HAVTORN (Hippophae rhamnoides) — sea buckthorn, autumn Vild Mad classic
  {
    herb: 'Havtorn', latin: 'Hippophae rhamnoides', count: 88, region: 'Danish dunes',
    points: [
      // Jutland west coast dunes
      [8.12, 56.48], [8.05, 56.92], [8.32, 57.22], [8.45, 56.18],
      // Bornholm coast
      [14.92, 55.25], [15.05, 55.15],
      // North Zealand
      [12.22, 56.08], [12.42, 56.05],
    ],
  },

  // ── HASSEL (Corylus avellana) — hazel
  {
    herb: 'Hassel', latin: 'Corylus avellana', count: 70, region: 'Danish mixed forests',
    points: [
      [10.15, 56.18], [11.92, 55.62], [10.42, 55.48],
      [12.18, 55.85], [9.92, 56.05],
    ],
  },
];

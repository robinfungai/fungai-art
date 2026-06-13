// ════════════════════════════════════════════════════════════════
// Fungai Art · The Covenant Constraints
// ════════════════════════════════════════════════════════════════
// Canonical source of truth for the 64-axis framework that governs
// every herb, every formula, every recommendation at Fungai Art and
// New Tyme Tonics. The web page at /covenant/ is the human-readable
// manifesto; this file is the machine-readable mirror that Mixology,
// the Herbal Engine, the future AI layer, and the data schema all
// import from.
//
// Architecture:
//   • LAYERS     — six lenses (Biological / Human / Environmental /
//                  Behavioural / Ethical / Covenant)
//   • AXES       — sixty-four numbered evaluation surfaces, each
//                  partitioned into one of the six layers
//   • STAGES     — five development pipeline phases (Identification
//                  → Chemistry → Biology → Human Impact → Covenant)
//   • SIM_LEVELS — five-rung simulation roadmap (Molecular →
//                  Cellular → Organ → Digital Twin → Covenant-of-
//                  Consciousness)
//
// Companion file: herbConstraints.ts encodes the *defensive* layer
// (the 22 user-state flags that filter herbs OUT). This file encodes
// the *constructive* layer that scores how a herb or formula
// CONTRIBUTES across the 64 axes. Two complementary lenses, not one
// replacing the other.
// ════════════════════════════════════════════════════════════════

// ── 1. Layers ───────────────────────────────────────────────────

export type CovenantLayerId =
  | 'biological'
  | 'human'
  | 'environmental'
  | 'behavioural'
  | 'ethical'
  | 'covenant';

export interface CovenantLayer {
  id: CovenantLayerId;
  roman: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
  name: string;
  range: [number, number];
  description: string;
}

export const COVENANT_LAYERS: readonly CovenantLayer[] = [
  {
    id: 'biological',
    roman: 'I',
    name: 'Biological',
    range: [1, 12],
    description:
      'Active compounds, pharmacology, metabolism, dose-response, half-life, ' +
      'receptor binding, long-term effects, toxicity thresholds.',
  },
  {
    id: 'human',
    roman: 'II',
    name: 'Human',
    range: [13, 24],
    description:
      'Age, sex, weight, genetic polymorphisms, existing conditions, current ' +
      'medications, allergies, baseline state, microbiome.',
  },
  {
    id: 'environmental',
    roman: 'III',
    name: 'Environmental',
    range: [25, 36],
    description:
      'Source organism identity, growing region, soil quality, harvest method, ' +
      'contaminants, processing, sustainability, traceability.',
  },
  {
    id: 'behavioural',
    roman: 'IV',
    name: 'Behavioural',
    range: [37, 48],
    description:
      'Sleep, diet, stress, hydration, activity, sun exposure, social rhythm, ' +
      'substance use, screen time, breath, recovery.',
  },
  {
    id: 'ethical',
    roman: 'V',
    name: 'Ethical',
    range: [49, 58],
    description:
      'Informed consent, realistic expectations, dependency risk, transparency, ' +
      'disclosure, stop conditions, monitoring access, exit dignity.',
  },
  {
    id: 'covenant',
    roman: 'VI',
    name: 'Covenant',
    range: [59, 64],
    description:
      'Autonomy, flourishing contribution, dignity preserved, relationship to ' +
      'nature, lineage respect, generational impact.',
  },
] as const;

// ── 2. The 64 Axes ──────────────────────────────────────────────

/** An axis is one evaluation surface — a column in the herb DB, a
 *  filter in the Engine, a check in the practitioner conversation. */
export interface CovenantAxis {
  /** Canonical number (1–64). Stable across the whole app. */
  n: number;
  /** Which layer this axis lives in. */
  layer: CovenantLayerId;
  /** Short title, used in UI chips. */
  title: string;
  /** One-line description of what this axis evaluates. */
  description: string;
  /** Suggested score range. `null` = qualitative only. */
  scoreRange?: [number, number] | null;
}

export const COVENANT_AXES: readonly CovenantAxis[] = [
  // ── I. Biological (1–12) ────────────────────────────────────
  { n: 1,  layer: 'biological', title: 'Active compound identity',
    description: 'Which molecules are actually doing the work. Named, characterised, isolated where possible.' },
  { n: 2,  layer: 'biological', title: 'Pharmacological mechanism',
    description: 'Receptor binding, enzyme modulation, ion-channel activity. How the molecule talks to the cell.' },
  { n: 3,  layer: 'biological', title: 'Metabolic pathway',
    description: 'Which enzymes process it (CYP450 family etc.). Which metabolites it becomes downstream.' },
  { n: 4,  layer: 'biological', title: 'Bioavailability',
    description: 'How much of the ingested dose actually reaches the target tissue. Extraction matters here.',
    scoreRange: [0, 100] },
  { n: 5,  layer: 'biological', title: 'Half-life',
    description: 'How long until the compound is at half its peak. Determines dosing rhythm.' },
  { n: 6,  layer: 'biological', title: 'Dose-response curve',
    description: 'Linear, hormetic, or inverted-U. Where the threshold sits.' },
  { n: 7,  layer: 'biological', title: 'Receptor affinity',
    description: 'How tightly the compound binds, how selectively, how reversibly.' },
  { n: 8,  layer: 'biological', title: 'Long-term effects',
    description: 'What happens at month three, year one, decade two.' },
  { n: 9,  layer: 'biological', title: 'Tolerance development',
    description: 'Does the body adapt? Down-regulation, up-regulation.' },
  { n: 10, layer: 'biological', title: 'Withdrawal profile',
    description: 'What happens when use stops. Rebound effects. Discontinuation timeline.' },
  { n: 11, layer: 'biological', title: 'Synergistic cascades',
    description: 'How combinations within the same biomass interact — whole-organism effect.' },
  { n: 12, layer: 'biological', title: 'Toxicity threshold',
    description: 'The dose at which damage begins. Acute and cumulative.' },

  // ── II. Human (13–24) ───────────────────────────────────────
  { n: 13, layer: 'human', title: 'Age',
    description: 'Developmental, adult, geriatric. Liver clearance and receptor density vary across the lifespan.' },
  { n: 14, layer: 'human', title: 'Sex and hormonal state',
    description: 'Menstrual cycle, pregnancy, andropause, menopause — all change pharmacokinetics.' },
  { n: 15, layer: 'human', title: 'Body composition',
    description: 'Weight, lean mass, fat distribution. Lipophilic compounds partition differently.' },
  { n: 16, layer: 'human', title: 'Genetic polymorphisms',
    description: 'CYP2D6, CYP3A4, COMT, MTHFR. Tenfold variation in metabolism is common.' },
  { n: 17, layer: 'human', title: 'Existing conditions',
    description: 'Comorbidities reshape every risk-benefit calculation.' },
  { n: 18, layer: 'human', title: 'Current medications',
    description: 'The single largest source of catastrophic interactions. Cross-checked against every constituent.' },
  { n: 19, layer: 'human', title: 'Allergy and sensitivity history',
    description: 'Asteraceae, salicylates, sulphites. Cross-reactivities map across plant families.' },
  { n: 20, layer: 'human', title: 'Microbiome state',
    description: 'Gut bacteria transform many compounds. Some metabolites only exist with the right bacteria.' },
  { n: 21, layer: 'human', title: 'Mental health history',
    description: 'Personal and family. Mood-acting herbs require different consent thresholds.' },
  { n: 22, layer: 'human', title: 'Reproductive context',
    description: 'Trying to conceive, pregnant, breastfeeding. Uterine stimulants, abortifacients, transfer-risk.' },
  { n: 23, layer: 'human', title: 'Baseline biomarkers',
    description: 'Resting heart rate, blood pressure, sleep architecture, HRV, fasting glucose.' },
  { n: 24, layer: 'human', title: 'Subjective state',
    description: 'Self-reported pain, mood, energy, clarity. The reason they are here.' },

  // ── III. Environmental (25–36) ──────────────────────────────
  { n: 25, layer: 'environmental', title: 'Source organism identity',
    description: 'Species, strain, sub-variety. Verified by morphology and ideally by DNA sequencing.' },
  { n: 26, layer: 'environmental', title: 'Growing region',
    description: 'Wild vs cultivated, latitude, altitude, ecological community. Chemistry varies with terroir.' },
  { n: 27, layer: 'environmental', title: 'Soil and substrate',
    description: 'Mineral profile, microbial community, organic content. The plant is a soil expression.' },
  { n: 28, layer: 'environmental', title: 'Growing conditions',
    description: 'Sun, rainfall, season, stress events. Stressed plants make different compounds.' },
  { n: 29, layer: 'environmental', title: 'Harvest method and timing',
    description: 'Lunar timing, time of day, plant lifecycle stage.' },
  { n: 30, layer: 'environmental', title: 'Contaminants',
    description: 'Heavy metals, pesticides, microbial load, aflatoxins, radionuclides. Tested per batch.' },
  { n: 31, layer: 'environmental', title: 'Processing method',
    description: 'Drying, milling, extraction solvent and temperature, calcination protocol.' },
  { n: 32, layer: 'environmental', title: 'Storage stability',
    description: 'Light, oxygen, moisture, temperature. Oxidation timelines per compound class.' },
  { n: 33, layer: 'environmental', title: 'Batch traceability',
    description: 'From specific patch of forest to specific bottle, with chain of custody.' },
  { n: 34, layer: 'environmental', title: 'Sustainability of source',
    description: 'Population health of the species in the region. Embargo overharvested zones.' },
  { n: 35, layer: 'environmental', title: 'Ethical sourcing',
    description: 'Indigenous land rights, fair compensation, traditional protocol respect.' },
  { n: 36, layer: 'environmental', title: 'Lifecycle accounting',
    description: 'From bud to ash — closed-loop spagyrics. Nothing discarded; everything transmuted.' },

  // ── IV. Behavioural (37–48) ─────────────────────────────────
  { n: 37, layer: 'behavioural', title: 'Sleep architecture',
    description: 'Duration, latency, REM, deep, fragmentation. The base on which every recovery system depends.' },
  { n: 38, layer: 'behavioural', title: 'Diet pattern',
    description: 'Macros, micros, meal timing, fasting windows. What the gut is actually receiving.' },
  { n: 39, layer: 'behavioural', title: 'Stress load',
    description: 'Acute and chronic. HPA-axis state. Cortisol curve shape.' },
  { n: 40, layer: 'behavioural', title: 'Hydration',
    description: 'Volume and mineral content. Affects clearance and concentration of every compound.' },
  { n: 41, layer: 'behavioural', title: 'Physical activity',
    description: 'Type, intensity, frequency. Movement changes liver and kidney clearance.' },
  { n: 42, layer: 'behavioural', title: 'Sun and light exposure',
    description: 'Circadian anchor. Vitamin D status. UVB exposure to skin.' },
  { n: 43, layer: 'behavioural', title: 'Social rhythm',
    description: 'Isolation, community, intimacy. Vagal tone reads social safety.' },
  { n: 44, layer: 'behavioural', title: 'Substance use',
    description: 'Alcohol, caffeine, nicotine, cannabis, recreational. Each has an interaction map.' },
  { n: 45, layer: 'behavioural', title: 'Screen and information load',
    description: 'Blue light, attention fragmentation, news cortisol. Modern environmental factors.' },
  { n: 46, layer: 'behavioural', title: 'Breath patterns',
    description: 'Nasal vs mouth, depth, pace. CO2 tolerance. Autonomic state.' },
  { n: 47, layer: 'behavioural', title: 'Recovery practice',
    description: 'Sauna, cold, breath work, meditation, time in nature. The counterweight to stress.' },
  { n: 48, layer: 'behavioural', title: 'Work and purpose',
    description: 'Sense of meaning. Daily-effort coherence. The unmentioned factor in long-horizon health.' },

  // ── V. Ethical (49–58) ──────────────────────────────────────
  { n: 49, layer: 'ethical', title: 'Informed consent',
    description: 'The human knows what is in the bottle, what it is likely to do, what it may do, and what the unknowns are.' },
  { n: 50, layer: 'ethical', title: 'Realistic expectations',
    description: 'No miracle claims. Expected outcome stated with uncertainty range.' },
  { n: 51, layer: 'ethical', title: 'Dependency risk disclosure',
    description: 'Whether the formula creates or breaks dependency. Stated openly.' },
  { n: 52, layer: 'ethical', title: 'Transparency of process',
    description: 'How it was made, by whom, with what. No black boxes.' },
  { n: 53, layer: 'ethical', title: 'Stop conditions',
    description: 'The signals that say "discontinue and consult." Pre-stated, not improvised.' },
  { n: 54, layer: 'ethical', title: 'Monitoring access',
    description: 'A way to track the effect over time. Journaling, biomarkers, follow-up.' },
  { n: 55, layer: 'ethical', title: 'Side-effect education',
    description: 'Common, uncommon, severe. What to recognise, what to do.' },
  { n: 56, layer: 'ethical', title: 'Off-label clarity',
    description: 'Where traditional use exceeds modern evidence, the gap is stated.' },
  { n: 57, layer: 'ethical', title: 'Exit dignity',
    description: 'No long-term lock-ins. No emotional coercion to continue.' },
  { n: 58, layer: 'ethical', title: 'Pricing honesty',
    description: 'Price reflects cost and care. No exploitation of vulnerability.' },

  // ── VI. Covenant (59–64) ────────────────────────────────────
  { n: 59, layer: 'covenant', title: 'Autonomy',
    description: 'The intervention increases the human capacity to act for themselves, not reliance on the supplier.' },
  { n: 60, layer: 'covenant', title: 'Flourishing contribution',
    description: 'Beyond symptom reduction — does this make the life more whole?' },
  { n: 61, layer: 'covenant', title: 'Dignity preserved',
    description: 'The framing treats the human as protagonist of their own healing.' },
  { n: 62, layer: 'covenant', title: 'Lineage and cultural respect',
    description: 'Traditions credited, supported, not appropriated.' },
  { n: 63, layer: 'covenant', title: 'Relationship to nature',
    description: 'Does using this reconnect to the ecosystem — or sever the link further?' },
  { n: 64, layer: 'covenant', title: 'Generational impact',
    description: 'Effect on children, grandchildren, downstream ecology. The hundred-year question.' },
] as const;

// Sanity check: 64 axes, 6 layers, partition adds up correctly.
// Throws at module load if anyone breaks the canonical layout.
if (COVENANT_AXES.length !== 64) {
  throw new Error(`Covenant axes drift: expected 64, got ${COVENANT_AXES.length}`);
}

// ── 3. Five-stage development pipeline ──────────────────────────

export interface CovenantStage {
  n: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  description: string;
  /** Axes typically resolved at this stage. */
  clearsAxes: readonly number[];
}

export const COVENANT_STAGES: readonly CovenantStage[] = [
  {
    n: 1,
    name: 'Identification',
    tagline: 'species · strain · source · harvest',
    description:
      'Before anything else: what exactly is this organism? Species verified, ' +
      'strain noted, source documented, harvest method and timing recorded.',
    clearsAxes: [25, 26, 29, 33],
  },
  {
    n: 2,
    name: 'Chemistry',
    tagline: 'compounds · stability · extraction',
    description:
      'Active compounds named, characterised, quantified. Stability under planned ' +
      'processing established. Extraction method selected.',
    clearsAxes: [1, 4, 31, 32],
  },
  {
    n: 3,
    name: 'Biology',
    tagline: 'mechanism · target tissues · metabolism',
    description:
      'What the compounds do once inside. Receptor binding, enzyme interactions, ' +
      'metabolic fate, half-life. Long-term effects modelled.',
    clearsAxes: [2, 3, 5, 6, 7, 8, 9, 10, 12],
  },
  {
    n: 4,
    name: 'Human impact',
    tagline: 'benefits · risks · contraindications',
    description:
      'The formula meets the specific human. Existing conditions, medications, ' +
      'allergies, microbiome, mental-health context, baseline biomarkers.',
    clearsAxes: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  },
  {
    n: 5,
    name: 'Covenant evaluation',
    tagline: 'autonomy · flourishing · relationship',
    description:
      'Does this increase sovereignty? Reduce suffering without creating dependency? ' +
      'Maintain dignity? Honour lineage? Rebuild the relationship to nature?',
    clearsAxes: [49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64],
  },
] as const;

// ── 4. Five-rung simulation roadmap ─────────────────────────────

export interface CovenantSimLevel {
  n: 1 | 2 | 3 | 4 | 5;
  name: string;
  tagline: string;
  description: string;
}

export const COVENANT_SIM_LEVELS: readonly CovenantSimLevel[] = [
  {
    n: 1,
    name: 'Molecular simulation',
    tagline: 'compounds · receptors · enzymes',
    description: 'Binding, enzyme interactions, metabolism, degradation pathways.',
  },
  {
    n: 2,
    name: 'Cellular simulation',
    tagline: 'neurons · immune · liver · microbiome',
    description:
      'Each compound modelled against a population of cell types. Gut-bacterial ' +
      'transformation makes some metabolites visible that empirical research takes years to find.',
  },
  {
    n: 3,
    name: 'Organ simulation',
    tagline: 'brain · liver · kidneys · immune · endocrine',
    description:
      'Cascading effects become visible — inflammation drop → sleep improvement → ' +
      'hormone regulation → recovery shift → immune set-point change. Full chain in one pass.',
  },
  {
    n: 4,
    name: 'Digital twin',
    tagline: 'per-person predictive model',
    description:
      'Not a generic human. This human. Genetics, age, weight, medical history, diet, ' +
      'current medications, lifestyle. A personalised model that can be perturbed before the first dose.',
  },
  {
    n: 5,
    name: 'Covenant-of-consciousness simulation',
    tagline: 'sovereignty · dependency risk · long-term flourishing',
    description:
      'The objective function changes from "maximise symptom reduction" to "maximise human ' +
      'flourishing while minimising harm and preserving autonomy." This is where the framework becomes unique.',
  },
] as const;

// ── 5. Per-herb / per-formula scoring shape ─────────────────────
// Optional — herbs are not required to carry these to remain valid.
// As curation deepens, fill in the relevant axes for each herb.

/** Qualitative grade from A (best) to F (worst). */
export type CovenantGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/** One axis worth of evidence for one herb. */
export interface AxisEvaluation {
  axis: number;             // 1..64 — maps into COVENANT_AXES
  grade?: CovenantGrade;
  score?: number;           // 0..100 where higher = more aligned
  note?: string;            // free-text rationale or citation
  evidenceLevel?: 'A' | 'B' | 'C' | 'D' | 'E'; // RCT → expert opinion → tradition
}

/** Per-herb covenant block. Attach to herbs in herbs.ts as `covenant`. */
export interface HerbCovenantProfile {
  evaluations?: AxisEvaluation[];
  /** Quick layer-level summary; computed from evaluations when present. */
  layerGrades?: Partial<Record<CovenantLayerId, CovenantGrade>>;
  /** Free-text covenant rationale for practitioner reading. */
  rationale?: string;
  /** Last review date in ISO format. */
  reviewedAt?: string;
  reviewedBy?: string;
}

// ── 6. Public query helpers ─────────────────────────────────────

export function axisByN(n: number): CovenantAxis | undefined {
  return COVENANT_AXES.find(a => a.n === n);
}

export function axesByLayer(layer: CovenantLayerId): CovenantAxis[] {
  return COVENANT_AXES.filter(a => a.layer === layer);
}

export function layerByN(n: number): CovenantLayer | undefined {
  return COVENANT_LAYERS.find(l => n >= l.range[0] && n <= l.range[1]);
}

/** Aggregate a per-axis evaluation list into per-layer grades. Used by
 *  the herb DB and by the formula builder. Trivial averaging for now;
 *  replace with weighted scoring once evidence levels are richer. */
export function rollUpToLayerGrades(
  evaluations: AxisEvaluation[],
): Partial<Record<CovenantLayerId, CovenantGrade>> {
  const gradeToScore: Record<CovenantGrade, number> = { A: 4, B: 3, C: 2, D: 1, F: 0 };
  const scoreToGrade = (s: number): CovenantGrade =>
    s >= 3.5 ? 'A' : s >= 2.5 ? 'B' : s >= 1.5 ? 'C' : s >= 0.5 ? 'D' : 'F';
  const buckets: Partial<Record<CovenantLayerId, number[]>> = {};
  for (const e of evaluations) {
    const layer = layerByN(e.axis)?.id;
    if (!layer) continue;
    const score = e.score != null ? e.score / 25 : e.grade ? gradeToScore[e.grade] : null;
    if (score == null) continue;
    (buckets[layer] = buckets[layer] || []).push(score);
  }
  const out: Partial<Record<CovenantLayerId, CovenantGrade>> = {};
  for (const layer in buckets) {
    const xs = buckets[layer as CovenantLayerId]!;
    if (!xs.length) continue;
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
    out[layer as CovenantLayerId] = scoreToGrade(avg);
  }
  return out;
}

/** Score a multi-herb formula by combining herb-level evaluations.
 *  Returns the lowest grade across herbs (a formula is no stronger
 *  than its weakest constituent on any axis). */
export function rollUpFormulaGrades(
  herbProfiles: HerbCovenantProfile[],
): Partial<Record<CovenantLayerId, CovenantGrade>> {
  const gradeOrder: CovenantGrade[] = ['A', 'B', 'C', 'D', 'F'];
  const rank = (g: CovenantGrade) => gradeOrder.indexOf(g);
  const out: Partial<Record<CovenantLayerId, CovenantGrade>> = {};
  for (const layer of COVENANT_LAYERS) {
    let worst: CovenantGrade | undefined;
    for (const p of herbProfiles) {
      const g = p.layerGrades?.[layer.id];
      if (!g) continue;
      if (!worst || rank(g) > rank(worst)) worst = g;
    }
    if (worst) out[layer.id] = worst;
  }
  return out;
}

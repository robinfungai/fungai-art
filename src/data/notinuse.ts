 // Herb Interface
export interface Herb {
  id: number;
  name: string;
  botanical: string;
  tcm_meridians: string[];
  tcm_element: string;
  energetics: string[];
  primary_functions: string[];
  secondary_benefits: string[];
  pharmacology?: string;
  flavor_profile: string;
  contraindications: string[];
  herb_to_herb_synergy?: string[];
  herb_to_herb_caution?: string[];
  herb_to_drug_interactions?: string[];
  herb_interactions: string[];
  dosage_range: string;
  spiritual_layer: string;
  best_preparation: string;
  caution_level: 'LOW' | 'LOW-MEDIUM' | 'MEDIUM' | 'MEDIUM-HIGH' | 'HIGH' | 'VERY HIGH';
  safe_pregnancy: boolean | null;
  status?: string;
}


// Protocol Interface
export interface Protocol {
  id: number;
  name: string;
  tagline: string;
  herbs_in_protocol: Array<{ name: string; ratio: string; drops?: string }>;
  energetic_profile: string;
  body_pattern_match: string[];
  organ_focus_match: string[];
  spiritual_qualities: string[];
  lifestyle_fit: string[];
  ritual_framing: string;
  preparation: string;
  dosage: string;
  caution_level: 'LOW' | 'MEDIUM' | 'HIGH';
  safety_notes: string;
  contraindications: string[];
  personalization_template: string;
}

export const HERBS: Herb[] = [
    
 id: 102,
  name: 'Bobinsana',
  botanical: 'Calliandra angustifolia (root/bark)',
  tcm_meridians: ['Heart', 'Liver', 'Spleen'],
  tcm_element: 'Fire + Water',
  energetics: ['Warm', 'Slightly Moist', 'Heart-opening', 'Grounding'],
  primary_functions: [
    'Serotonin and dopamine modulation for emotional support',
    'Vision and dream enhancement',
    'Gentle cardiovascular tonic',
    'Supports emotional release in grief and heartbreak',
    'Mild aphrodisiac and sensory enhancer',
  ],
  secondary_benefits: [
    'Gentle nervous system support',
    'Consciousness expansion in ceremonial use',
    'Spiritual connection and heart-centering',
    'Mild psychoactive properties at higher doses',
  ],
  pharmacology:
    'Contains tannins, volatile oils and likely alkaloids; traditional and anecdotal use suggests serotonergic and dopaminergic activity, gentle cardiovascular effects and visionary properties.',
  flavor_profile: 'Astringent, earthy, slightly bitter, woody',
  contraindications: [
    'Pregnancy (traditional contraceptive use—avoid)',
    'Breastfeeding (insufficient safety data)',
    'Use of SSRIs or SNRIs (theoretical serotonin syndrome risk)',
    'Use of MAOIs (theoretical serotonergic interaction)',
    'Hypotension or tendency to low blood pressure',
    'History of psychotic disorders (visionary effects—use with caution)',
    'Known heart conditions without practitioner supervision',
  ],
  herb_to_herb_synergy: [
    'Rose, Hawthorn and Motherwort for heart-opening formulas',
    'Passionflower and Lemon Balm for emotional nervous system support',
  ],
  herb_to_herb_caution: [
    'Other serotonergic herbs such as St. John’s Wort or high-dose Rhodiola',
    'Stimulating herbs that may contribute to overstimulation',
  ],
  herb_to_drug_interactions: [
    'SSRIs and SNRIs with theoretical serotonin syndrome risk',
    'MAOIs with potential serotonergic interaction',
    'Antihypertensive medications due to additive blood pressure lowering',
    'Cardiac medications where additional cardiac effects are undesired',
  ],
  herb_interactions: [
    'Synergy: Rose, Hawthorn, Motherwort, Passionflower, Lemon Balm',
    'Caution: other serotonergic herbs and stimulants',
    'Drug interactions: SSRIs, SNRIs, MAOIs, antihypertensives, cardiac meds',
  ],
  dosage_range:
    'Decoction of 2–4 g dried root simmered 20 minutes, 1–2× daily; tincture 20–40 drops, 1–2× daily; higher ceremonial doses (5–10 g) only with experienced guidance.',
  spiritual_layer:
    'Amazonian “plant teacher of the heart” that opens the heart centre, softens emotional armour and facilitates visionary states, teaching that healing flows through the heart.',
  best_preparation:
    'Traditional decoction simmered ~20 minutes; tincture for convenient daily use; ceremonial tea at higher doses only in an experienced ceremonial context.',
  caution_level: 'MEDIUM-HIGH',
  safe_pregnancy: false,
  status:
    'Avoid in pregnancy, breastfeeding and uncontrolled psychotic disorders; use with caution alongside SSRIs, SNRIs, MAOIs, hypotension and cardiac conditions; higher doses reserved for ceremonial use with guidance.',
},
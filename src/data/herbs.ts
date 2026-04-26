// Herb Interface
// 1. THE INTERFACES (The Blueprint)
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

// 2. THE DATA START (The Container)
// Note: We only say "export const HERBS" ONCE.
export const HERBS: Herb[] = [
  // ─────────────────────────────────────────────
  // BILBERRY
  // ─────────────────────────────────────────────
  {
    id: 201,
    name: 'Bilberry',
    botanical: 'Vaccinium myrtillus (ripe berry)',
    tcm_meridians: ['Liver', 'Kidney', 'Heart'],
    tcm_element: 'Water + Wood',
    energetics: ['Neutral', 'Slightly Cool', 'Sweet', 'Sour', 'Astringent', 'Vasoprotective'],
    primary_functions: [
      'Retinoprotection — anthocyanins shield retinal cells from light-induced oxidative damage',
      'Eye strain and VDT fatigue relief — improves ciliary muscle function and accommodative strain',
      'Microvascular strengthening — reduces capillary fragility and improves venous tone',
      'Cardiometabolic antioxidant — modestly improves lipids and glucose via polyphenol action',
      'GI astringent — traditional dried berry use for diarrhea via tannin and antimicrobial action',
    ],
    secondary_benefits: [
      'Endothelial protection and NO bioavailability support',
      'Anti-inflammatory via reduction of IL-1β and VEGF in retinal tissue',
      'General antioxidant and free radical scavenging across tissues',
      'Hepatoprotective polyphenol support',
    ],
    pharmacology:
      'Rich in anthocyanins (cyanidin, delphinidin glycosides — among highest of any berry), proanthocyanidins, flavonols (quercetin, myricetin) and phenolic acids; protects retina from light-induced damage, strengthens capillary walls, reduces lipid peroxidation, modulates inflammatory cytokines (IL-1β, VEGF) and improves endothelial NO bioavailability. Evidence grade B+ for VDT eye strain (multiple RCTs); C for night vision in healthy eyes (rigorous RCTs negative).',
    flavor_profile: 'Sweet, sour, astringent, intensely berry-forward and deeply pigmented',
    contraindications: [
      'Generally very safe at food and supplement doses — food-like safety profile',
      'Anticoagulants / antiplatelets: theoretical platelet effect at very high doses — caution with stacked vascular agents',
      'Hypoglycemic medications: anthocyanins may modestly lower glucose — monitor in tightly controlled diabetics',
      'Pregnancy and lactation: food use safe; high-dose standardized extracts — keep moderate and short-term',
    ],
    herb_to_herb_synergy: [
      'Bacopa and Gotu Kola in cognitive and visual neuroprotection stacks',
      'Aronia berry for amplified cardiometabolic polyphenol protocol',
      'Rosemary for combined cerebral circulation and retinal antioxidant support',
    ],
    herb_to_herb_caution: [
      'Other anticoagulant herbs (Ginkgo, Garlic, Angelica) — combined vascular effect at high doses',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets — theoretical additive effect at high polyphenol doses',
      'Hypoglycemic medications — modest glucose-lowering; monitor',
    ],
    herb_interactions: [
      'Synergy: Bacopa, Gotu Kola, Aronia, Rosemary',
      'Caution: stacked anticoagulant herbs at high doses',
      'Drug interactions: anticoagulants (theoretical), hypoglycemics (monitor glucose)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Standardized extract providing 40–160 mg anthocyanins daily for eye and vascular support. Food use: 50–150 g fresh or frozen berries daily. Effects develop over 6–12 weeks of consistent use.',
    spiritual_layer:
      'Bilberry is the small, dark forest seer — a berry of quiet protection and patient vision. She grows close to the earth in northern woodlands, concentrating centuries of light into deep pigment. She teaches that vision is sustained not by force but by consistent nourishment, and that the clearest sight comes when we protect what is delicate and fragile in ourselves. She whispers: See clearly. Gently. Your inner and outer vision are worth tending.',
    best_preparation:
      'Tincture for daily ritual use. Standardized extract (25% anthocyanins) for targeted eye strain and vascular protocols. Fresh or frozen berries as a daily food medicine. Combines beautifully with Bacopa and Rosemary for a brain-eye vision stack.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Very safe food-like herb. Excellent for screen workers, visual fatigue, microvascular support and cardiometabolic polyphenol protocols. Effects cumulative over 6–12 weeks. No significant drug interactions at typical doses.',
  },

  // ─────────────────────────────────────────────
  // ANGELICA (DONG QUAI)
  // ─────────────────────────────────────────────
  {
    id: 202,
    name: 'Angelica (Dong Quai)',
    botanical: 'Angelica sinensis (root — 2–3 year matured)',
    tcm_meridians: ['Heart', 'Liver', 'Spleen', 'Pericardium'],
    tcm_element: 'Wood + Fire',
    energetics: ['Warm', 'Moist', 'Sweet', 'Aromatic', 'Blood-Moving', 'Blood-Tonifying', 'Regulating'],
    primary_functions: [
      'Blood tonification — ferulic acid, iron and folate nourish red blood cells and restore depleted blood quality',
      'Menstrual regulation — normalises both heavy and light flow through blood-moving vasodilatory action',
      'Dysmenorrhea relief — ligustilide vasodilation plus ferulic acid anti-inflammatory reduce cramping',
      'Circulation enhancement — smooth muscle relaxation improves blood flow to pelvic and peripheral regions',
      'Post-haemorrhage recovery — intensive blood repletion after miscarriage, heavy bleeding or surgery',
    ],
    secondary_benefits: [
      'Cardiovascular support via improved vascular endothelial function',
      'Neuroprotection — butylphthalide and ferulic acid cross BBB; cognitive aging support',
      'Immune modulation via polysaccharides (secondary)',
      'Warm extremities support — Raynaud\'s phenomenon and cold circulation',
    ],
    pharmacology:
      'Primary bioactives: ferulic acid (0.1–0.3%; anti-inflammatory, vascular endothelial NO support), ligustilide (0.3–0.7% volatile phthalide; vasodilation, uterine antispasmodic, distinctive aromatic signature), butylphthalide (neuroprotective), flavonoids (apigenin, luteolin), bioavailable iron and folate. Paradoxical menstrual effect — normalises both heavy AND light flow through blood-moving action: unblocks stagnation so whether flow was excessive or inadequate, movement restores balance.',
    flavor_profile: 'Warm, sweet, aromatic and earthy — distinctive ligustilide signature',
    contraindications: [
      'WARFARIN — ABSOLUTE AVOID: documented significant INR elevation and serious bleeding cases; absolute contraindication',
      'Other anticoagulants (aspirin, clopidogrel, dabigatran, apixaban) — additive antiplatelet effect; monitor bleeding risk',
      'First trimester pregnancy — uterine stimulation risk; emmenagogue activity; miscarriage risk; AVOID',
      'Breastfeeding — insufficient modern data; traditional use suggests OK; consult provider if uncertain',
      'Heavy menstrual bleeding (menorrhagia) — blood-moving action may initially increase flow in first cycle before normalising',
      'Bleeding disorders — antiplatelet and anticoagulant actions problematic',
    ],
    herb_to_herb_synergy: [
      'Vitex — hormonal regulation complement; comprehensive cycle support',
      'Cramp Bark — synergistic antispasmodic and anti-inflammatory for dysmenorrhea',
      'Ginger — warming and circulation-enhancing; excellent pairing for cold extremities',
      'Ginkgo — combined circulation enhancement for Raynaud\'s and poor peripheral flow',
      "Lady's Mantle — tissue tonification (Lady's Mantle) plus blood movement (Angelica) for comprehensive menstrual support",
    ],
    herb_to_herb_caution: [
      'Ginkgo, Garlic, Turmeric (high dose) — all have antiplatelet activity; avoid stacking if on anticoagulant medications',
      'Other phytoestrogenic herbs in hormone-sensitive conditions',
    ],
    herb_to_drug_interactions: [
      'Warfarin — ABSOLUTE AVOID (documented serious bleeding; INR elevation confirmed)',
      'Other anticoagulants and antiplatelets (aspirin, clopidogrel) — additive effect',
      'Diabetes medications — improved circulation may affect glucose metabolism; monitor',
    ],
    herb_interactions: [
      "Synergy: Vitex, Cramp Bark, Ginger, Ginkgo, Lady's Mantle",
      'Caution: Ginkgo, Garlic, high-dose Turmeric (additive anticoagulation)',
      'Drug interactions: Warfarin (ABSOLUTE AVOID — serious bleeding documented), other anticoagulants (monitor), diabetes meds (monitor glucose)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Decoction: 1–2 slices dried root per 250 ml, simmer 15–20 minutes, 2–3× daily (optimal extraction of aromatic and mineral compounds). Effects cumulative — noticeable cycle improvement in 1–2 cycles; full regulation over 2–3 cycles.',
    spiritual_layer:
      '"Dang gui" — go back, return to order. Angelica is the treasure of women\'s herbalism, ancient and devoted to the sacred rhythm of the menstrual cycle. She teaches that blood is powerful, that cycles are not pathology to suppress but wisdom to honour. She moves what has become stuck, nourishes what has been depleted, and restores natural flow with warmth and sweetness. She whispers: My cycle is sacred. My blood is powerful. My body is wise. I honour my rhythm.',
    best_preparation:
      'Decoction preferred — simmering 15–20 minutes extracts aromatic phthalides and minerals most fully; warm liquid enhances circulatory effects. Tincture for convenient daily use. Always confirm NOT on warfarin before use. Pairs beautifully with Vitex and Cramp Bark for comprehensive cycle support.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'CRITICAL: Absolute contraindication with warfarin (documented serious bleeding). Avoid first trimester. Otherwise excellent blood tonic and menstrual regulator with 2000+ years of use. Monitor during first cycle in heavy bleeders (blood-moving may initially increase then normalise flow). Effects improve over 2–3 menstrual cycles.',
  },

  // ─────────────────────────────────────────────
  // ARONIA BERRY
  // ─────────────────────────────────────────────
  {
    id: 203,
    name: 'Aronia Berry',
    botanical: 'Aronia melanocarpa (ripe berry)',
    tcm_meridians: ['Heart', 'Liver', 'Spleen', 'Stomach'],
    tcm_element: 'Water + Earth',
    energetics: ['Neutral', 'Slightly Cool', 'Very Astringent', 'Sour', 'Protective', 'Dense'],
    primary_functions: [
      'Cardiometabolic polyphenol powerhouse — blood pressure, LDL and triglyceride reduction',
      'Endothelial and myocardial protection — improved cardiac function markers in metabolic syndrome',
      'Glycaemic modulation — improved glucose tolerance and insulin sensitivity',
      'Hepatoprotection — reduces oxidative stress and fatty liver changes in metabolic syndrome',
      'Global antioxidant and anti-inflammatory support across cardiovascular and metabolic tissue',
    ],
    secondary_benefits: [
      'Prebiotic modulation via tannins and polyphenols supporting gut microbiota diversity',
      'Vascular integrity support via anthocyanin and proanthocyanidin action',
      'Adjunctive NAFLD support alongside dietary and lifestyle changes',
      'Recovery tonic — dense polyphenol nourishment for oxidative stress recovery',
    ],
    pharmacology:
      'Exceptionally rich in anthocyanins (cyanidin-3-galactoside predominant — among highest concentration of any berry), proanthocyanidins, flavonols and phenolic acids. Mechanisms: improved NO bioavailability, reduced oxidative stress, anti-inflammatory cytokine modulation, AMPK activation, improved insulin signalling and gut microbiota modulation. Human systematic review (17 studies) shows improvements in LDL, blood pressure and cardiometabolic markers particularly at 6–12 week durations in those with metabolic disease.',
    flavor_profile: 'Intensely astringent, sour, slightly bitter — characteristically "chokeberry" tannic',
    contraindications: [
      'Generally well tolerated — food-like safety profile',
      'Hypotension or multiple antihypertensives — monitor blood pressure; may compound lowering',
      'Anticoagulants / antiplatelets — high polyphenol intake; caution at very high doses with multiple vascular agents',
      'GI sensitivity — high tannin juice may cause mild GI upset; start low',
    ],
    herb_to_herb_synergy: [
      'Bilberry for amplified eye, vascular and cardiometabolic polyphenol support',
      'Dandelion root for combined liver and cardiometabolic protocol',
      'Astragalus for foundational immune and cardiovascular resilience stack',
    ],
    herb_to_herb_caution: [
      'Stacked antihypertensive herbs (Hawthorn, Olive Leaf) — monitor blood pressure carefully',
      'Other anticoagulant herbs at high combined doses',
    ],
    herb_to_drug_interactions: [
      'Antihypertensive medications — additive blood pressure lowering; monitor',
      'Hypoglycaemic medications — modest glucose improvement; coordinate',
      'Anticoagulants — high polyphenol load; monitor at very high doses',
    ],
    herb_interactions: [
      'Synergy: Bilberry, Dandelion, Astragalus',
      'Caution: stacked antihypertensives, multiple anticoagulant herbs',
      'Drug interactions: antihypertensives (monitor BP), hypoglycaemics (monitor glucose), anticoagulants (monitor at high dose)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Fresh or frozen berries: 30–100 g daily. Juice: 100–200 ml daily. Standardized extract providing 50–300 mg anthocyanins daily. Best at 8–12 weeks minimum for cardiometabolic effects.',
    spiritual_layer:
      'Aronia is the dense, protective shield berry — dark, astringent, concentrated with the pigment of deep forests and northern patience. She teaches that dense, consistent nourishment steadily shifts the trajectory of cardiometabolic health — that small, potent daily acts accumulate into profound protection. She whispers: My heart and vessels are protected. I steadily nourish my blood and metabolism with deep, dark vitality.',
    best_preparation:
      'Juice (100–200 ml daily) for cardiometabolic protocols — most studied form. Tincture for daily ritual convenience. Fresh or frozen berries as food medicine. Pairs well with Bilberry for a comprehensive berry polyphenol protocol. Best alongside dietary shifts (reduced refined carbs and sugar).',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Very safe, food-like berry herb. Excellent for cardiometabolic resilience, blood pressure and lipid support, hepatoprotection and antioxidant protocols. Effects develop over 6–12 weeks. Monitor blood pressure if on antihypertensives.',
  },

  // ─────────────────────────────────────────────
  // ASHWAGANDHA
  // ─────────────────────────────────────────────
  {
    id: 103,
    name: 'Ashwagandha',
    botanical: 'Withania somnifera (root — 2–3 year matured, standardised to 5% withanolides)',
    tcm_meridians: ['Kidney', 'Spleen', 'Heart'],
    tcm_element: 'Earth + Fire',
    energetics: ['Warm', 'Dry', 'Grounding', 'Nourishing', 'Tonifying', 'Yang-Activating'],
    primary_functions: [
      'HPA axis adaptogenic modulation — true cortisol adaptation (not suppression); stress resilience restoration',
      'GABAergic anxiolytic — GABA-A receptor binding; anxiety reduction without tolerance development',
      'Thyroid modulation — increases T3/T4 (beneficial hypothyroid; DANGEROUS hyperthyroid — screening critical)',
      'Testosterone enhancement — LH stimulation and cortisol reduction yields 15–20% testosterone increase',
      'Neuroprotection — reduces β-amyloid and tau pathology; increases BDNF; cognitive aging prevention',
    ],
    secondary_benefits: [
      'Sleep quality improvement — gentle, non-groggy; cumulative over weeks',
      'Muscle building, recovery and body composition support',
      'Immune resilience — balanced adaptation (not overstimulation)',
      'Mood and vitality restoration — comprehensive rasayana rejuvenative',
    ],
    pharmacology:
      'Primary bioactives: withanolides (5% in standardised extract; steroidal lactones — HPA axis modulation via HSP70 expression, GABA-A receptor binding, testosterone enhancement via LH, neuroprotection via β-amyloid reduction and BDNF increase, thyroid T3/T4 upregulation). Supporting: alkaloids (mood/neurological), polysaccharides (immune modulation). 100+ RCTs; Grade A for stress resilience and anxiolytic; Grade B+ for sleep and testosterone; Grade A (caution) for thyroid.',
    flavor_profile: 'Bitter, earthy, warming — characteristic Solanaceae signature',
    contraindications: [
      'Hyperthyroidism / Graves disease — ABSOLUTELY CONTRAINDICATED: increases T3/T4; documented thyrotoxicosis cases',
      'Autoimmune diseases (lupus, RA, MS, Hashimoto\'s) — ABSOLUTELY CONTRAINDICATED: stimulates Th1/Th17; triggers flares',
      'Immunosuppressants (organ transplant) — ABSOLUTELY CONTRAINDICATED: immune stimulation counteracts immunosuppression; rejection risk',
      'Hypothyroidism on levothyroxine — MONITOR TSH every 4–6 weeks; may increase T3/T4 beyond optimal; medication adjustment likely',
      'Pregnancy — AVOID: uterine stimulation risk; traditional abortifacient; insufficient modern safety data',
      'Breastfeeding — AVOID: withanolides may transfer to milk; insufficient data',
      'Diabetes medications — MONITOR glucose: improves insulin sensitivity; hypoglycaemia risk',
      'Benzodiazepines and sedatives — CAUTION: additive CNS depression; reduce doses',
    ],
    herb_to_herb_synergy: [
      'Holy Basil and Rhodiola — adaptogenic stress resilience stack (monitor for overstimulation)',
      'Reishi and Oatstraw — grounding, nourishing, deeply balancing formula',
      'Astragalus — combined immune and stress resilience (non-stimulating pairing)',
    ],
    herb_to_herb_caution: [
      'Stimulant herbs (Guarana, high-dose Rhodiola, Coffee) — overstimulation risk',
      'Other immune-stimulating herbs (Echinacea, Elderberry) — AVOID if autoimmune disease',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — AVOID (transplant rejection risk)',
      'Thyroid medications (levothyroxine) — MONITOR TSH; dose adjustment likely',
      'Diabetes medications — MONITOR glucose; hypoglycaemia risk',
      'Benzodiazepines and sedatives — reduce doses; additive CNS depression',
      'Tamoxifen and hormone-sensitive drugs — theoretical; consult oncologist',
    ],
    herb_interactions: [
      'Synergy: Holy Basil, Rhodiola, Reishi, Oatstraw, Astragalus',
      'Caution: Guarana, high-dose Rhodiola, other immune-stimulating herbs in autoimmunity',
      'Drug interactions: immunosuppressants (AVOID), levothyroxine (MONITOR TSH), diabetes meds (MONITOR), benzodiazepines (reduce dose), Tamoxifen (consult oncologist)',
    ],
    dosage_range:
      'Tincture: 40–80 drops, 2–3× daily. Standardised extract (5% withanolides): 300–600 mg daily in divided doses. Cycling protocol recommended: 8–12 weeks on, 2–4 weeks off. Effects noticeable 4–8 weeks; peak 8–12 weeks.',
    spiritual_layer:
      '"Ashva" (horse) + "gandha" (smell) — the strength and scent of a stallion. Ashwagandha is a rasayana — a rejuvenative that tonifies all seven dhatus (body tissues). She teaches that deep strength does not come from force or stimulation, but from rooted stability and patient adaptation. She is the great grounder — steady, nourishing, adaptable. She whispers: I am resilient. I am grounded. Stress flows through me without sticking. My vitality is stable. I am whole.',
    best_preparation:
      'Standardised extract (5% withanolides) most researched and reliable. Tincture for flexible daily use. Traditional root powder with warm milk or ghee for rasayana protocol. Always cycle: 8–12 weeks on, 2–4 weeks off. Screen for thyroid, autoimmune and immunosuppressant status before recommending.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'CRITICAL screening required: absolute contraindication in hyperthyroidism, autoimmune disease and immunosuppressants. Avoid in pregnancy. Otherwise exceptional adaptogen with 100+ RCTs. Effects develop over 4–12 weeks. Cycling protocol recommended. One of the most researched herbs in the world for stress resilience, anxiety and vitality.',
  },

  // ─────────────────────────────────────────────
  // ASTRAGALUS
  // ─────────────────────────────────────────────
  {
    id: 204,
    name: 'Astragalus',
    botanical: 'Astragalus membranaceus (root — Huang Qi)',
    tcm_meridians: ['Spleen', 'Lung', 'Kidney', 'Heart'],
    tcm_element: 'Earth + Metal',
    energetics: ['Warm', 'Sweet', 'Tonifying', 'Protective', 'Immune-Supporting', 'Wei-Qi-Strengthening'],
    primary_functions: [
      'Balanced immune enhancement — polysaccharides strengthen T-cells, NK cells and macrophages WITHOUT overstimulation',
      'Wei Qi protection — strengthens defensive energy; pathogen entry resistance and barrier immunity',
      'Illness prevention — seasonal and year-round infection resistance building',
      'Post-illness recovery — rebuilds qi foundations; speeds immune recovery after serious illness',
      'Mild adaptogenic stress resilience — HPA axis modulation; gentle vitality restoration',
    ],
    secondary_benefits: [
      'Foundational qi tonification — safe indefinite long-term use; cumulative vitality building',
      'Athlete immune support — mitigates immune suppression from intense training',
      'Adjunctive cancer recovery support — immune restoration during and after chemotherapy',
      'Anti-inflammatory via flavonoids; antioxidant support',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (40–50% in standardised extract; astragalans — enhance CD4+, CD8+, NK cells, macrophages and interferon-γ; BALANCED activation, not overstimulation), astragaloside IV (saponin; stress adaptation, emerging neuroprotection research), trace minerals (selenium, zinc — immune cofactors), flavonoids (antioxidant, anti-inflammatory). Key distinction from Echinacea: balanced modulation without hyperactivation — suitable for long-term foundational use. 150+ studies; Grade A for immune enhancement.',
    flavor_profile: 'Slightly sweet, mildly earthy — pleasantly mild as decoction',
    contraindications: [
      'Autoimmune diseases — THEORETICAL CAUTION: balanced immune enhancement (not overstimulation like Echinacea); many autoimmune patients use safely; recommend 2–4 week trial with monitoring for flare',
      'Immunosuppressants (organ transplant) — consult transplant team; low documented risk but coordinate',
      'No other significant contraindications — Grade A safety with 2000+ years use',
    ],
    herb_to_herb_synergy: [
      'Reishi and Shiitake mushrooms — triple immune and qi support; foundational pairing',
      'Ginseng — foundational qi tonification powerhouse; complementary',
      'Holy Basil and Ashwagandha — adaptogenic and immune stack',
      'Schizandra — endurance, stress resilience and immune foundation',
    ],
    herb_to_herb_caution: [
      'Other immune-stimulating herbs in transplant patients or those on immunosuppressants',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — theoretical concern; consult medical team; low documented risk',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Reishi, Shiitake, Ginseng, Holy Basil, Ashwagandha, Schizandra',
      'Caution: immune-stimulating herbs in immunosuppressed patients',
      'Drug interactions: immunosuppressants (consult team); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 60–90 drops, 2–3× daily. Decoction: 2–3 g dried root per 250 ml, simmer 15–20 minutes, 2–3× daily (optimal polysaccharide extraction). Standardised extract (40–50% polysaccharides): 300–400 mg, 2–3× daily. Safe indefinite long-term use — foundational herb; cycles optional.',
    spiritual_layer:
      'Huang Qi — Yellow Energy. Astragalus is the foundational qi tonifier — building strength from root, not forcing activation. She teaches that deep immunity is cultivated through patient nourishment, that protective energy is built through consistency, not intensity. She is the guardian who tends the gates quietly, building resilience day by day. She whispers: My immunity is strong. I am protected. I recover swiftly. My foundational qi is nourished. I am resilient and whole.',
    best_preparation:
      'Decoction as primary traditional form — simmering optimises polysaccharide extraction. Tincture less efficient for polysaccharide extraction but adequate. Standardised extract for concentrated dosing. Safe to use year-round indefinitely as foundational immune herb. Pairs exceptionally with medicinal mushrooms (Reishi, Shiitake) for a complete immune intelligence protocol.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety — one of the most extensively researched immune herbs (150+ studies). Safe indefinite long-term use. Non-stimulating; suitable as foundational daily herb. Theoretical autoimmune caution (trial 2–4 weeks, monitor). Exceptional for illness prevention, post-illness recovery and foundational immune building.',
  },

  // ─────────────────────────────────────────────
  // BACOPA
  // ─────────────────────────────────────────────
  {
    id: 4,
    name: 'Bacopa',
    botanical: 'Bacopa monnieri (aerial parts — Brahmi)',
    tcm_meridians: ['Heart', 'Spleen', 'Kidney'],
    tcm_element: 'Water + Fire',
    energetics: ['Cool', 'Moist', 'Slightly Bitter', 'Memory-Enhancing', 'Consciousness-Expanding', 'Calming'],
    primary_functions: [
      'BDNF stimulation — bacosides directly stimulate brain-derived neurotrophic factor; synaptic fertiliser',
      'Memory enhancement and learning — long-term potentiation (LTP) support; information retention and recall',
      'Acetylcholine enhancement — increases cognitive neurotransmitter critical for memory and attention',
      'Anxiolytic without sedation — mild GABA modulation produces paradoxical calm-clarity state',
      'Antioxidant neuroprotection — flavonoids protect neural tissue from oxidative damage; cognitive aging prevention',
    ],
    secondary_benefits: [
      'Student and exam preparation — enhanced information encoding and recall under pressure',
      'Post-illness brain fog recovery — BDNF stimulation supports neuronal repair (post-COVID, chemotherapy)',
      'Dementia and Alzheimer\'s prevention — emerging research on β-amyloid reduction',
      'Cerebral blood flow enhancement — brain oxygenation support',
    ],
    pharmacology:
      'Primary bioactives: bacosides A and B (20–50% in standardised extract; steroidal saponins — stimulate BDNF, enhance LTP, increase acetylcholine), bacopaside I (memory enhancement, antioxidant). Supporting: flavonoids (neuroprotective antioxidant), alkaloids (mild GABA activity), polysaccharides (immune secondary). Fat-soluble — requires dietary fat for optimal absorption. Cumulative herb: minimum 4–8 weeks before effects evident. Grade B+ for memory enhancement and cognitive clarity; Grade A for safety (3000+ years Ayurvedic use).',
    flavor_profile: 'Slightly bitter, herbaceous, cooling and mildly astringent',
    contraindications: [
      'Bradycardia (slow heart rate) — may further slow heart rate; rare but documented; monitor',
      'GI sensitivity — take with meals and a fat source to prevent nausea on empty stomach',
      'Pregnancy — limited modern data; traditional Ayurvedic use suggests generally safe; consult provider',
      'Avoid evening use — mild stimulating effect may delay sleep onset',
    ],
    herb_to_herb_synergy: [
      'Ginkgo — cerebral circulation plus memory nourishment; excellent cognitive pairing',
      'Rosemary — acetylcholinesterase inhibition plus BDNF; complementary cognitive mechanisms',
      'Gotu Kola — both BDNF-enhancing adaptogens; powerful neuroprotection stack',
      'Bilberry — antioxidant neuroprotection and visual-cognitive support',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions documented',
    ],
    herb_to_drug_interactions: [
      'Thyroid medications — theoretical interaction; monitor thyroid function',
      'Minimal other drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Ginkgo, Rosemary, Gotu Kola, Bilberry',
      'Caution: None significant',
      'Drug interactions: thyroid medications (monitor); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 60–90 drops, 2× daily with meals and a fat source (bacosides fat-soluble; absorption requires dietary fat). Standardised extract (20% bacosides): 300–600 mg daily with food. Always take morning or afternoon — not evening (mildly stimulating). Minimum 4–8 weeks to notice effects; benefits deepen over months.',
    spiritual_layer:
      '"Brahmi" — related to Brahma, creator consciousness. Bacopa teaches that memory is consciousness itself; that accessing deep knowing requires nourishing the synapses. She grows in wetland margins — between worlds, between states — teaching us to be the bridge between deep memory and present awareness. She whispers: Your mind is capable of vast learning. Memory is not mechanical retrieval but consciousness accessing its own depths. Trust the process of remembering.',
    best_preparation:
      'Standardised extract (20% bacosides) most researched and reliable. Always take with meals and dietary fat (coconut oil, nut butter, ghee) for bacoside absorption. Tincture for convenient daily use — still take with food. Combine with Ginkgo and Rosemary for a comprehensive cognitive trinity. Minimum 4–8 week commitment before assessing effects.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety — 3000+ years Ayurvedic use with excellent safety profile. No dependence, tolerance or withdrawal. Exceptional for memory, learning, cognitive clarity and neuroprotection. Fat-soluble — must take with meals. Effects cumulative over 4–12 weeks. Long-term indefinite use safe and beneficial.',
  },

  // ─────────────────────────────────────────────
  // BARBERRY
  // ─────────────────────────────────────────────
  {
    id: 205,
    name: 'Barberry',
    botanical: 'Berberis vulgaris (root bark and stem bark)',
    tcm_meridians: ['Liver', 'Gallbladder', 'Stomach', 'Large Intestine'],
    tcm_element: 'Wood + Metal',
    energetics: ['Cooling', 'Very Bitter', 'Astringent', 'Antimicrobial', 'Boundary-Setting', 'Liver-Clearing'],
    primary_functions: [
      'Gut antimicrobial — berberine broad-spectrum antimicrobial against bacteria, fungi and protozoa',
      'Metabolic regulation — berberine lowers glucose, HbA1c, LDL and triglycerides (AMPK activation)',
      'Hepatobiliary support — stimulates bile flow; hepatoprotective; liver-gut-skin axis clearing',
      'Dysbiosis and SIBO support — berberine modulates gut microbiota and reduces bacterial overgrowth',
      'Anti-inflammatory — downregulates pro-inflammatory cytokines; reduces oxidative stress',
    ],
    secondary_benefits: [
      'Liver-skin axis support — improved gut-liver function reduces skin flares in eczema and psoriasis',
      'Cholagogue and digestive bitter — stimulates digestive secretions and fat digestion',
      'Antifungal support including Candida',
      'Potential antitumour immune modulation (emerging research)',
    ],
    pharmacology:
      'Primary bioactive: berberine (major isoquinoline alkaloid — broad antimicrobial, hypoglycaemic via AMPK activation, hypolipidaemic, anti-diarrhoeal, hepatoprotective, anti-inflammatory). Supporting alkaloids: palmatine, berbamine, jatrorrhizine. Berberine compared to metformin in glucose-lowering in clinical trials. IMPORTANT: Dose and duration-dependent toxicity documented in animal models (GI ulceration, immunotoxicity, neurotoxicity, cardiotoxicity at high doses). Position as practitioner-level herb — short-term cycling protocols, not casual daily tonic.',
    flavor_profile: 'Intensely bitter, cooling, astringent — characteristic berberine yellow pigment',
    contraindications: [
      'Pregnancy — ABSOLUTELY AVOID: uterine contractions; teratogenic potential in animal studies; maternal toxin risk',
      'Breastfeeding — AVOID: berberine in breast milk; neonatal kernicterus risk',
      'Neonates — AVOID: bilirubin displacement and kernicterus risk',
      'G6PD deficiency — use with caution; jaundice risk',
      'Long-term continuous high-dose use — limit to 4–8 weeks maximum without break; toxicity documented at prolonged high doses',
      'CYP450-metabolised drugs — berberine inhibits CYP enzymes; interactions with cyclosporine, some statins and others; space by 2+ hours',
    ],
    herb_to_herb_synergy: [
      'Oregano and Thyme in intensive antimicrobial and dysbiosis protocols',
      'Milk Thistle and Dandelion in liver-gut axis clearing protocols',
      'Gentian and Artichoke for robust digestive bitter blends',
    ],
    herb_to_herb_caution: [
      'Other CYP450-inhibiting herbs (Kava, St. John\'s Wort) in complex polypharmacy',
      'Other strong uterine stimulants',
    ],
    herb_to_drug_interactions: [
      'CYP450 substrates — berberine inhibits CYP enzymes; space by 2+ hours; consult prescriber',
      'P-glycoprotein and drug transporter interactions — may affect absorption and clearance',
      'Diabetes medications — additive glucose lowering; monitor closely',
      'Gut motility effects — may decrease drug absorption if taken simultaneously; space by 2 hours',
    ],
    herb_interactions: [
      'Synergy: Oregano, Thyme, Milk Thistle, Dandelion, Gentian, Artichoke',
      'Caution: CYP450-inhibiting herbs in polypharmacy; strong uterine stimulants',
      'Drug interactions: CYP450 substrates (consult prescriber), diabetes meds (monitor), P-gp substrates (space doses)',
    ],
    dosage_range:
      'Tincture: 1–2 ml (20–40 drops), 2–3× daily SHORT-TERM ONLY. Decoction: 1–2 g dried bark per 250 ml, simmer 10–15 minutes, 1–3× daily. Standardised berberine: 500 mg 2–3× daily for metabolic protocols (8–12 weeks with monitoring). Maximum continuous use: 4–8 weeks; then break. Not for casual daily tonification.',
    spiritual_layer:
      'Barberry is the sharp, yellow, boundary-setting bitter — cooling the fire, cutting through excess, infection and metabolic stagnation with clear, decisive action. She teaches that clarity and health sometimes require saying no: to excess sugar, to pathogens, to inflammatory patterns. She supports the liver to process what life brings with clean, discerning power. She whispers: I release excess and heat with clarity. My liver and gut are clear, cool and strong. I maintain bright boundaries in my body and life.',
    best_preparation:
      'Position as a practitioner-level clinical herb rather than a daily tonic. Short-term cycling protocols (4–8 weeks maximum). Tincture or standardised berberine for metabolic protocols. Always screen for pregnancy, breastfeeding, neonates, CYP450 drug interactions before recommending. Pair with demulcents (marshmallow, slippery elm) to protect mucosa during antimicrobial protocols.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'CRITICAL: Absolute contraindication in pregnancy, breastfeeding and neonates. CYP450 drug interaction screening essential. Short-term cycling protocols only (4–8 weeks maximum). Strong clinical herb for gut infections, metabolic syndrome and liver-skin axis — but practitioner-level use. Not a casual daily tonic.',
  },

  // ─────────────────────────────────────────────
  // BARLEY
  // ─────────────────────────────────────────────
  {
    id: 206,
    name: 'Barley',
    botanical: 'Hordeum vulgare (grain, bran and young barley grass)',
    tcm_meridians: ['Spleen', 'Stomach', 'Liver'],
    tcm_element: 'Earth + Wood',
    energetics: ['Neutral', 'Slightly Cool', 'Moistening', 'Nourishing', 'Grounding', 'Stabilising'],
    primary_functions: [
      'LDL cholesterol reduction — β-glucan forms viscous intestinal gel; entraps bile acids and cholesterol; forces hepatic cholesterol clearance',
      'Glycaemic modulation — β-glucan slows gastric emptying and carbohydrate absorption; blunts postprandial glucose and insulin peaks',
      'Prebiotic gut support — β-glucan and arabinoxylans feed beneficial bacteria; increases SCFA production',
      'Barley grass antioxidant — saponarin, chlorophyll, vitamins and minerals support oxidative stress reduction',
      'Cardiovascular risk reduction — combined LDL, glucose and anti-inflammatory effects; EFSA-recognised health claim',
    ],
    secondary_benefits: [
      'Satiety and weight management support via fibre-driven fullness',
      'Bowel regularity via soluble and insoluble fibre content',
      'Hepatoprotective effects — barley grass and phenolics reduce liver oxidative stress markers',
      'Broad mineral and micronutrient nourishment (barley grass: vitamins A, C, K; magnesium, iron, GABA)',
    ],
    pharmacology:
      'Primary bioactives: β-glucan (soluble high-molecular-weight polysaccharide; viscous gel formation in GI tract; LDL lowering via bile acid sequestration — EFSA health claim recognised at 3g/day; glycaemic modulation via delayed gastric emptying). Barley grass: saponarin (flavone glucoside; antidiabetic, antioxidant), chlorophyll, tocotrienols, GABA, vitamins A/C/K. Grade A- for LDL lowering; Grade B+ for glycaemic control; Grade B for prebiotic and gut health.',
    flavor_profile: 'Grain: mild, slightly sweet and nutty. Barley grass: green, grassy, mildly earthy',
    contraindications: [
      'Coeliac disease — ABSOLUTELY AVOID: barley contains gluten (hordein); contraindicated in coeliac disease',
      'Non-coeliac gluten sensitivity — AVOID or use with caution; assess individual tolerance',
      'Wheat allergy — AVOID',
      'IBS and FODMAP sensitivity — high fermentable fibre may exacerbate symptoms; start very low and titrate slowly',
      'Advanced kidney disease — high potassium and phosphorus; monitor',
      'Diabetes medications — barley improves glycaemic control; coordinate medication adjustments to avoid hypoglycaemia',
    ],
    herb_to_herb_synergy: [
      'Aronia Berry for amplified cardiometabolic and antioxidant protocol',
      'Dandelion root for combined liver, digestive and metabolic support',
      'Milk Thistle for hepatoprotective and lipid-modulating stack',
    ],
    herb_to_herb_caution: [
      'Other high-fibre herbs — stacked fibre load may cause GI discomfort; titrate gradually',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — improved glycaemic control; coordinate to avoid hypoglycaemia',
      'Statins — additive LDL benefit (complementary rather than harmful)',
      'General: viscous fibre may slightly reduce absorption of oral medications if taken simultaneously; space by 1–2 hours',
    ],
    herb_interactions: [
      'Synergy: Aronia, Dandelion, Milk Thistle',
      'Caution: stacked high-fibre herbs (GI comfort); titrate',
      'Drug interactions: diabetes meds (coordinate), statins (additive benefit), oral medications (space by 1–2 hours)',
    ],
    dosage_range:
      'Barley grain: 1–2 servings daily (approx 60–100 g cooked or 30 g dry) providing ~3 g β-glucan for cholesterol and glycaemic benefits. Barley grass powder: 2–6 g daily in water, juice or smoothie. Effects develop over 6–12 weeks of consistent daily use.',
    spiritual_layer:
      'Barley is one of humanity\'s oldest cultivated grains — a grounding staple ally of stability and slow release. She teaches that consistency over intensity is the path to lasting health; that daily, steady nourishment quietly reshapes cardiovascular and metabolic fate far more than occasional extremes. She is the patient farmer\'s wisdom, the long horizon, the daily bread of healing. She whispers: I nourish myself with steady, grounding foods. My blood sugars and fats move in smooth, balanced rhythms.',
    best_preparation:
      'Whole cooked barley grain for food-medicine use — soups, stews, porridges. Barley grass powder in smoothies or water for antioxidant and micronutrient support. β-glucan concentrate for targeted cholesterol protocols. Position primarily as food-medicine rather than tincture. Screen for gluten status before recommending.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Very safe food-medicine for gluten-tolerant individuals. EFSA-recognised health claim for LDL lowering. Excellent for cardiometabolic support, glycaemic smoothing, gut microbiota and general nutritive nourishment. Screen for coeliac, gluten sensitivity and IBS. Effects cumulative over 6–12 weeks.',
  },
  // ============================================================
  // BATCH 02 — Herbs converted from monographs
  // Ready to merge into src/data/herbsAndProtocols.ts
  // ============================================================

  // ─────────────────────────────────────────────
  // BLUE LOTUS
  // ─────────────────────────────────────────────
  {
    id: 126,
    name: 'Blue Lotus',
    botanical: 'Nymphaea caerulea (petals and leaves)',
    tcm_meridians: ['Heart', 'Pericardium', 'Third Eye'],
    tcm_element: 'Water + Fire',
    energetics: ['Cool', 'Moist', 'Dreamlike', 'Consciousness-Shifting', 'Portal-Opening', 'Heart-Opening'],
    primary_functions: [
      'Dream lucidity and vividness — nuciferine dopamine + acetylcholine modulation enhances REM access and dream recall',
      'Subtle consciousness expansion — non-hallucinogenic shift toward symbolic perception, intuitive knowing and dream-logic',
      'Anxiety and restlessness relief — paradoxical calm-openness via linalool anxiolytic and dopamine confidence',
      'Heart-centre opening — apomorphine promotes oxytocin release; pericardium emotional barriers soften',
      'Meditation deepening — shifts brainwaves toward theta states (4–8 Hz); enhances hypnagogic and liminal consciousness',
    ],
    secondary_benefits: [
      'Creative inspiration through dream-logic and symbolic thinking access',
      'Shamanic journeying and inner vision work via hypnagogic state facilitation',
      'Emotional barrier dissolution and self-compassion cultivation',
      'Sensory enhancement and vivid perception in safe ceremonial contexts',
    ],
    pharmacology:
      'Primary psychoactive alkaloids: nuciferine (0.05–0.15%; mild dopamine D1/D2 agonist; acetylcholine modulation — NOT hallucinogenic; shifts consciousness toward dream-logic and symbolic perception without visual distortion), apomorphine (trace 0.01–0.03%; promotes oxytocin release; heart-opening), dihydronuciferine (synergistic isomer). Supporting: linalool + aromatic volatiles (mild anxiolytic, limbic activation), flavonoids (quercetin, kaempferol; GABA modulation, neuroprotection), terpenes (myrcene — mild sedation; pinene — subtle stimulation). Effects develop 30–60 minutes; peak 1–2 hours; baseline return 4–6 hours. Not for daily use — 2–3 times weekly maximum for dreamwork.',
    flavor_profile: 'Delicate, slightly floral, aquatic and gently sweet with subtle aromatic complexity',
    contraindications: [
      'Psychotic conditions (schizophrenia, psychosis history) — ABSOLUTELY CONTRAINDICATED: consciousness shifts may trigger or exacerbate psychotic episodes',
      'Severe untreated depression — AVOID: consciousness-deepening may intensify depressive rumination',
      'Pregnancy — AVOID: traditional abortifacient use; alkaloid safety data insufficient; consult provider',
      'Breastfeeding — AVOID: alkaloids may transfer to breast milk; infant safety unknown',
      'Operating machinery or driving — AVOID: non-ordinary states impair judgment; last dose 4+ hours before operating',
      'Bipolar disorder — CAUTION: monitor for mood destabilisation during consciousness-shifting states',
      'Severe anxiety disorders — CAUTION: ego-loosening can initially feel destabilising; start very low in safe setting',
    ],
    herb_to_herb_synergy: [
      'Mugwort — visionary dreaming synergy; enhanced dream vividness and symbolic access',
      'Calea Zacatachichi — triple dream intensity; powerful combination for experienced users only',
      'Passionflower — consciousness opening plus emotional calm; balanced effect for heart-centred work',
      'Reishi — dream depth and spiritual integration; excellent for sleep and dreamwork protocols',
    ],
    herb_to_herb_caution: [
      'Other psychoactive or dream-enhancing herbs at combined high doses — potentiation risk; experienced users only',
      'CNS depressants (alcohol, benzodiazepines, high-dose Valerian) — additive consciousness-altering effects; unpredictable',
    ],
    herb_to_drug_interactions: [
      'Sedatives and CNS depressants — additive effects; avoid combination',
      'Antidepressants and psychiatric medications — monitor mood; consult prescriber',
      'Generally well-tolerated; monitor first use carefully in safe, supported setting',
    ],
    herb_interactions: [
      'Synergy: Mugwort, Calea, Passionflower, Reishi',
      'Caution: other psychoactive or dream herbs at high combined doses; CNS depressants',
      'Drug interactions: sedatives (additive), psychiatric medications (monitor mood), generally minimal',
    ],
    dosage_range:
      'Tincture: 10–20 drops in warm water, 30–60 minutes before bed or meditation. Ceremonial infusion: 2–4 g dried petals steeped 10–15 minutes (not boiling — preserves alkaloids). Use 2–3 times weekly maximum for dreamwork; avoid daily use to prevent tolerance. Evening use only.',
    spiritual_layer:
      'Blue Lotus rises from primordial waters — the ancient Egyptian sacred flower, keeper of the dreaming eye and gateway between worlds. She has opened the visions of pharaohs, priests and meditators across three thousand years. Not a psychedelic — she does not shatter the world; she dissolves the membrane between waking and dreaming, between rational and intuitive, between the seen and the imagined. She teaches that your subconscious speaks in symbols, that your dreams hold medicine, that the third eye is not something to force open but to invite. She whispers: Enter the dream. Your soul speaks in symbols. The answers live beneath the surface of the ordinary mind. Listen deeply.',
    best_preparation:
      'Ceremonial infusion with mindful preparation and clear intention — the intention-setting ritual enhances effects. Tincture in warm water for convenient use. Fresh petals preferred over dried when available (more aromatic alkaloid compounds). Journal dreams immediately upon waking for integration. Use in safe, quiet, dark space with 2–4 hours free. Combine with Mugwort or Passionflower for enhanced dreamwork protocols.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Absolute contraindication in psychosis and breastfeeding. Avoid in pregnancy. Not for daily use. Exceptional for intentional dreamwork, meditation deepening, heart-opening and consciousness exploration when used with clear intention, proper setting and integration practices. Effects 30–60 min onset; 4–6 hours duration.',
  },

  // ─────────────────────────────────────────────
  // CALAMUS
  // ─────────────────────────────────────────────
  {
    id: 207,
    name: 'Calamus',
    botanical: 'Acorus calamus (rhizome — Sweet Flag, Rat Root)',
    tcm_meridians: ['Heart', 'Kidney', 'Spleen'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Pungent', 'Aromatic', 'Spirit-Opening', 'Consciousness-Expanding', 'Cognitively-Activating'],
    primary_functions: [
      'Consciousness expansion and spirit opening — traditional Ayurvedic, Chinese and Native American cognitive-spiritual herb',
      'Meditation deepening — aromatic volatile compounds support altered awareness and inner stillness',
      'Cognitive support — traditional memory and mental clarity (limited modern RCT evidence)',
      'Digestive bitter — aromatic bitters support digestive secretion and carminative relief',
      'Grounding aromatherapy — rhizome aroma used for centering and presence practices',
    ],
    secondary_benefits: [
      'Mild antispasmodic for digestive cramping',
      'Traditional fever support (secondary use)',
      'Spiritual ceremony and meditation preparation across multiple traditions',
    ],
    pharmacology:
      'PRIMARY SAFETY CONCERN: β-Asarone (0.4–12% depending on variety; dose-dependent neurotoxin — tremors, coordination loss, convulsions and potential permanent nerve damage at elevated or chronic doses). Asian variety = higher β-asarone (4–12%); North American variety = lower (0.4–1%). EU regulatory maximum: 0.5 g/day total. BANNED in USA as food additive. Traditional consciousness and cognitive claims are largely anecdotal with limited modern RCT support. Neurotoxicity concern significantly outweighs traditional benefits for modern use. Safer alternatives exist for all indications (Blue Lotus, Mugwort for consciousness; Bacopa, Ginkgo for cognition).',
    flavor_profile: 'Warm, pungent, sweet-aromatic and distinctly medicinal — characteristic essential oil signature',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: potential teratogen; β-asarone safety data lacking; strict avoidance recommended',
      'Breastfeeding — ABSOLUTELY CONTRAINDICATED: β-asarone transfer to milk; infant safety unknown',
      'Seizure disorders — CONTRAINDICATED: β-asarone lowers seizure threshold; consult neurologist',
      'Neurological conditions (Parkinson\'s, tremor, neuropathy) — CONTRAINDICATED: increased neurotoxicity risk',
      'Liver disease — CAUTION/AVOID: hepatic metabolism impaired; toxicity risk increases',
      'Kidney disease — CAUTION/AVOID: renal clearance impaired; toxicity risk increases',
      'Daily or long-term use — NOT RECOMMENDED: cumulative neurotoxicity; no safe chronic use established',
      'Asian variety — higher risk than North American variety; always verify origin',
    ],
    herb_to_herb_synergy: [
      'Traditionally paired with other Ayurvedic meditation herbs; however safer alternatives are recommended',
    ],
    herb_to_herb_caution: [
      'Other CNS-active herbs — cumulative neurological effects unpredictable',
      'Anticonvulsant herbs — β-asarone lowers seizure threshold; avoid combination',
    ],
    herb_to_drug_interactions: [
      'Anticonvulsant medications — β-asarone may lower seizure threshold and antagonise treatment',
      'Hepatically metabolised drugs — impaired liver metabolism; interaction risk',
      'CNS medications generally — monitor for additive or unpredictable effects',
    ],
    herb_interactions: [
      'Synergy: minimal safe modern synergistic use recommended',
      'Caution: other CNS-active herbs, anticonvulsant herbs',
      'Drug interactions: anticonvulsants (contraindicated), hepatic medications (monitor), CNS drugs (caution)',
    ],
    dosage_range:
      'EU regulatory maximum: 0.5 g/day total. Conservative safe dose: 0.2–0.5 g dried North American variety, occasionally (weekly or less). NOT for daily or long-term use. Safer alternatives strongly recommended for all applications.',
    spiritual_layer:
      'Calamus is an ancient spirit-opening herb — used in Ayurvedic meditation, Chinese medicine and Native American ceremony for millennia. Sweet Flag grows at the margins of water and land, teaching liminality, the crossing of thresholds, the sweetness found at boundaries. She holds real wisdom and real history. But she also carries a shadow — the neurotoxic β-asarone that at higher doses turns her gift into harm. She teaches discernment: that ancient wisdom and modern safety must both be honoured, that tradition does not automatically mean safe, that a plant\'s power can cut both ways. She whispers: Honour my history. But choose wisely. Safer doorways exist.',
    best_preparation:
      'For those who choose to use: North American variety only (lower β-asarone); maximum 0.5 g per occasion; infrequent ceremonial use only (monthly at most). Decoction: simmer 0.3–0.5 g dried rhizome 5–10 minutes. Strong recommendation: consider Blue Lotus or Mugwort as safer consciousness alternatives, and Bacopa or Ginkgo as safer cognitive alternatives.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'RESTRICTED HERB — neurotoxicity concern (β-asarone) dominates modern safety analysis. Banned as food additive in USA; restricted in EU (max 0.5 g/day). Absolute contraindication in pregnancy, breastfeeding and seizure disorders. Not for daily or long-term use. Traditional wisdom is real, but safer alternatives exist for all applications. Use only with full awareness of neurotoxicity risk and regulatory status.',
  },

  // ─────────────────────────────────────────────
  // BLACK CUMIN
  // ─────────────────────────────────────────────
  {
    id: 208,
    name: 'Black Cumin',
    botanical: 'Nigella sativa (seed and cold-pressed seed oil)',
    tcm_meridians: ['Lung', 'Spleen', 'Liver'],
    tcm_element: 'Metal + Earth',
    energetics: ['Warm', 'Dry', 'Bitter', 'Immune-Boosting', 'Respiratory-Supporting', 'Antioxidant'],
    primary_functions: [
      'Immune activation — thymoquinone enhances immune cell function and infection resistance',
      'Potent antioxidant — thymoquinone free-radical scavenging comparable to turmeric (Grade B+)',
      'Systemic anti-inflammatory — thymoquinone suppresses inflammatory pathways; joint and systemic support',
      'Respiratory support — volatile oil and thymoquinone provide bronchial clearing and sinus support',
      'Neuroprotection — thymoquinone brain health and cognitive aging support (cumulative)',
    ],
    secondary_benefits: [
      'Constitutional immune strengthening over 4–8 weeks of consistent use',
      'Anti-aging cellular protection through antioxidant action',
      'Digestive support as warming bitter',
      'Traditional "cure for everything except death" — 3000+ years Middle Eastern and South Asian use',
    ],
    pharmacology:
      'Primary bioactive: thymoquinone (0.5–1.5%; signature compound responsible for most health benefits — immune cell activation, potent antioxidant comparable to turmeric, anti-inflammatory via NF-κB suppression, neuroprotective). Supporting: volatile oil (0.4–0.5%; respiratory antimicrobial, bronchial support), polyphenols and flavonoids (antioxidant, anti-inflammatory), fixed oil (30–40%; nutritive carrier). 400+ studies on thymoquinone. Immune effects: acute illness support plus cumulative constitutional strengthening over 4–8 weeks. Grade A safety; Grade B immune; Grade B+ antioxidant.',
    flavor_profile: 'Warm, slightly peppery, bitter and aromatic — distinctive thymoquinone signature',
    contraindications: [
      'Pregnancy — LIKELY SAFE at culinary doses (traditional use extensive); consult prenatal provider for supplement doses',
      'Breastfeeding — LIKELY SAFE at culinary doses; consult provider for concentrated forms',
      'Bleeding disorders — mild anticoagulant properties; monitor; consult provider',
      'Anticoagulant medications — mild additive blood-thinning; monitor; generally manageable',
    ],
    herb_to_herb_synergy: [
      'Astragalus — triple immune support stack (thymoquinone + polysaccharides + wei-qi protection)',
      'Turmeric — amplified antioxidant and anti-inflammatory protocol',
      'Elderflower or Elderberry — comprehensive immune activation formula',
      'Ginger — warming respiratory and antimicrobial synergy',
    ],
    herb_to_herb_caution: [
      'Other mild anticoagulant herbs (Ginkgo, Garlic, Angelica) at high combined doses — monitor bleeding',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets — mild additive effect; monitor; generally manageable',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Astragalus, Turmeric, Elderflower, Ginger',
      'Caution: stacked anticoagulant herbs at high doses',
      'Drug interactions: anticoagulants (mild monitor); otherwise minimal',
    ],
    dosage_range:
      'Whole seeds: 1–2 teaspoons (5–10 g) daily chewed or in food. Cold-pressed oil: 1–2 teaspoons (5–10 ml) daily — most concentrated form. Tincture: 30–60 drops, 1–2× daily. Safe indefinite daily use; effects cumulative over 4–8 weeks for constitutional immune strengthening.',
    spiritual_layer:
      'Black Cumin carries 3000 years of Middle Eastern and South Asian healing wisdom — seeds small enough to hold between two fingers, dense with ancient protective power. In Islamic tradition she is "cure for everything except death" — not as hyperbole but as testimony to the breadth of her healing gifts. She teaches that potency can live in small things, that immune strength is cultivated through consistency, that tradition carries truth when it endures across millennia. She whispers: My immunity is strong. I am protected. I am resilient. My cells are shielded. I am whole and blessed.',
    best_preparation:
      'Cold-pressed oil is most concentrated and potent (highest thymoquinone). Whole seeds for daily food integration — pleasant, simple, sustainable. Both forms effective. Oil can be taken straight, added to salads or blended into tonics. Seeds can be chewed, added to food or steeped as tea. Excellent foundational herb to pair with other immune formulas.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety — 3000+ years traditional use; 400+ modern studies. Excellent for immune support, antioxidant protection and anti-inflammatory support. Safe indefinite daily use. Versatile food-medicine integration. Minimal contraindications. One of the most historically validated herbs in the world.',
  },

  // ─────────────────────────────────────────────
  // BLACK WALNUT
  // ─────────────────────────────────────────────
  {
    id: 209,
    name: 'Black Walnut',
    botanical: 'Juglans nigra (green hull — outer casing)',
    tcm_meridians: ['Large Intestine', 'Liver', 'Spleen'],
    tcm_element: 'Metal + Earth',
    energetics: ['Cool', 'Dry', 'Bitter', 'Antiparasitic', 'Antimicrobial', 'Antifungal', 'Detoxifying'],
    primary_functions: [
      'Antiparasitic — juglone directly eliminates intestinal parasites; traditional specialist anti-parasitic herb',
      'Broad-spectrum antimicrobial — juglone and tannins eliminate pathogenic bacteria while preserving beneficial flora',
      'Antifungal — juglone eliminates Candida and other fungal overgrowth',
      'Detoxification support — promotes elimination pathways and bowel movement as part of cleansing protocols',
      'Iodine content — trace iodine provides mild thyroid and antimicrobial support',
    ],
    secondary_benefits: [
      'Gut flora rebalancing following parasite or pathogen clearance',
      'Digestive recovery post-parasitic burden',
      'Energy restoration as parasitic load decreases',
    ],
    pharmacology:
      'Primary bioactive: juglone (naphthoquinone; 0.1–0.5% fresh hull — PRIMARY antiparasitic compound; direct action against protozoans, some helminths, bacteria and fungi; also stains dark). Supporting: tannins (5–20%; antimicrobial, astringent, antiparasitic synergy), iodine (trace 30–50 mcg per hull; thyroid and antimicrobial support), volatile compounds (aromatic, antimicrobial). SPECIALIST HERB: requires professional protocol design, parasite confirmation before use, bowel support during use and beneficial flora rebuild post-protocol. NOT for casual daily tonification.',
    flavor_profile: 'Bitter, astringent, intensely tannic and dark — characteristic juglone signature',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: juglone abortifacient properties documented historically; miscarriage risk',
      'Breastfeeding — AVOID: theoretical juglone transfer; infant safety not established',
      'Casual self-diagnosed parasite concerns — requires professional confirmation (stool test or clinical assessment) before use',
      'Casual daily tonification — NOT appropriate; specialist protocol herb only',
      'Loose stools during use are EXPECTED and part of the elimination process — not a reason to stop but requires bowel support',
    ],
    herb_to_herb_synergy: [
      'Wormwood and Cloves — classic antiparasitic trio; complementary mechanisms for comprehensive parasite elimination protocols',
      'Oregano — intensive antimicrobial and dysbiosis-clearing combination',
      'Probiotics and prebiotic herbs (Burdock, Astragalus) — essential post-protocol beneficial flora rebuild',
    ],
    herb_to_herb_caution: [
      'Avoid combining with other strong uterine stimulants',
    ],
    herb_to_drug_interactions: [
      'Generally minimal documented drug interactions',
      'Iodine content — monitor if on thyroid medications',
    ],
    herb_interactions: [
      'Synergy: Wormwood, Cloves, Oregano (antiparasitic trio); Burdock, Astragalus (post-protocol rebuild)',
      'Caution: uterine stimulants',
      'Drug interactions: thyroid medications (iodine content; monitor); otherwise minimal',
    ],
    dosage_range:
      'Tincture (fresh hull — most potent): 10–30 drops, 2–3× daily during professional 4–6 week parasite protocol. NOT for casual indefinite use. Always part of a designed protocol including bowel support and post-protocol flora rebuild.',
    spiritual_layer:
      'Black Walnut is the defender of the inner terrain — a North American guardian whose dark hull teaches the power of protection and elimination. She carries centuries of Native American wisdom about maintaining a clean, defended internal environment. Juglone stains everything it touches dark — a reminder that her medicine leaves a mark, that real cleansing is not subtle. She teaches that boundaries matter, that the body has a right to be free of unwanted invaders, that elimination is a sacred act of self-respect. She whispers: My body is clean. I am protected. I am clear. My digestion is strong. I am defended and free.',
    best_preparation:
      'Fresh hull tincture preferred for highest juglone concentration. Always part of a professional antiparasitic protocol. Typical structure: 4–6 weeks dosing, often combined with Wormwood and Cloves; bowel support throughout; probiotics and Burdock for flora rebuild after completing protocol. Requires professional herbalist design and monitoring. Warn about expected loose stools and juglone staining.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'SPECIALIST HERB — professional protocol required. Absolute contraindication in pregnancy. Not for casual self-care. Requires parasite confirmation before use. Powerful antiparasitic and antimicrobial in the right context with proper professional guidance. Expected loose stools are part of the elimination process.',
  },

  // ─────────────────────────────────────────────
  // BLADDERWRACK
  // ─────────────────────────────────────────────
  {
    id: 210,
    name: 'Bladderwrack',
    botanical: 'Fucus vesiculosus (whole dried thallus — Atlantic seaweed)',
    tcm_meridians: ['Kidney', 'Spleen'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Moist', 'Salty', 'Mineral-Dense', 'Tonifying', 'Thyroid-Supporting'],
    primary_functions: [
      'Thyroid support — highest natural iodine source (2–5%); supports T3/T4 synthesis in hypothyroid states',
      'Metabolic enhancement — iodine-driven thyroid improvement increases metabolic rate and energy',
      'Comprehensive mineral nutrition — potassium, calcium, magnesium, iron and trace minerals in bioavailable form',
      'Immune activation — fucoidan polysaccharides enhance NK cells and macrophages',
      'Cognitive support — iodine essential for brain development and neurological function',
    ],
    secondary_benefits: [
      'Mild anticoagulant via fucoidan (theoretical; monitor with anticoagulants)',
      'Gut health via alginic acid (soluble fibre; mineral chelation; prebiotic effects)',
      'Traditional Scottish and Irish food medicine — centuries of safe dietary use',
      'Adjunctive support for cold sensitivity and low basal temperature',
    ],
    pharmacology:
      'Primary bioactive: iodine (2–5% — highest of any natural food; essential for thyroid hormone T3/T4 synthesis; metabolic regulation). Supporting: fucoidan (5–10% polysaccharide; NK cell and macrophage enhancement; mild anticoagulant; anti-inflammatory), alginic acid (soluble fibre; mineral chelation; gut health), comprehensive minerals (K, Ca, Mg, Fe + trace minerals). CRITICAL SAFETY: absolute contraindication in hyperthyroidism and Graves\' disease (iodine increases hormone production). Sourcing critical — seaweeds bioaccumulate heavy metals; third-party testing essential.',
    flavor_profile: 'Salty, mineral, marine and characteristically oceanic',
    contraindications: [
      'Hyperthyroidism — ABSOLUTELY CONTRAINDICATED: iodine increases thyroid hormone production; dangerous in hyperthyroid states',
      'Graves\' disease — ABSOLUTELY CONTRAINDICATED: iodine-sensitive condition; may severely worsen',
      'Thyroiditis — AVOID: iodine-sensitive inflammatory thyroid condition',
      'Heavy metal contamination risk — SOURCING CRITICAL: third-party heavy metal testing (lead, cadmium, arsenic) essential; only verified clean sources',
      'Iodine allergy or sensitivity — AVOID',
      'Advanced kidney disease — CAUTION: high potassium and mineral content; consult nephrologist',
      'Hypothyroidism on levothyroxine — MONITOR TSH every 6–8 weeks: iodine may increase hormone levels; medication adjustment likely needed',
      'Warfarin — MONITOR INR: fucoidan mild anticoagulant; minimal risk but document',
    ],
    herb_to_herb_synergy: [
      'Selenium (Brazil nut, Astragalus) — thyroid enzyme cofactor; optimal thyroid support pairing',
      'Nettle — comprehensive mineral and nutritive support stack',
      'Ashwagandha — combined metabolic and thyroid support (both increase T3/T4; combined monitoring essential)',
    ],
    herb_to_herb_caution: [
      'Other iodine-rich herbs or supplements — cumulative iodine overload risk; monitor total intake',
      'Ashwagandha in combination — both increase thyroid hormones; TSH monitoring critical',
    ],
    herb_to_drug_interactions: [
      'Levothyroxine and thyroid medications — monitor TSH; iodine may increase hormone levels; dose adjustment likely',
      'Warfarin and anticoagulants — fucoidan mild additive effect; monitor INR',
      'Diabetes medications — possible modest metabolic interaction; monitor glucose',
    ],
    herb_interactions: [
      'Synergy: Selenium, Nettle (thyroid and mineral support)',
      'Caution: other iodine sources (cumulative overload), Ashwagandha (both thyroid-active; monitor carefully)',
      'Drug interactions: levothyroxine (MONITOR TSH), warfarin (monitor INR), diabetes meds (monitor glucose)',
    ],
    dosage_range:
      'Dried seaweed: 1–3 g daily as culinary addition to soups, salads or tea. Powder capsules: 500–1000 mg, 2–3× daily. Safe long-term as food medicine when sourced from tested, clean Atlantic waters. TSH monitoring every 6–8 weeks if on thyroid medication.',
    spiritual_layer:
      'Bladderwrack is the ocean\'s gift — carrying the mineral wisdom of saltwater depths, the ancient knowledge of tides and deep nourishment. She teaches that foundational nutrition comes from elemental sources, that minerals are the earth\'s love made tangible, that the sea holds medicines older than memory. For those who live disconnected from the ocean, she brings its medicine inland — the salty, mineral, grounding vitality of deep waters. She whispers: I am mineral-rich. My thyroid is balanced. My metabolism is steady and strong. I am nourished by earth and ocean. My energy is vital.',
    best_preparation:
      'Culinary integration most sustainable — add to soups, broths, salads or seaweed noodles for daily food-medicine use. Powder in capsules for targeted thyroid and mineral protocols. Always verify sourcing (third-party heavy metal testing non-negotiable). Screen for hyperthyroidism before recommending. Monitor TSH if on thyroid medication.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: null,
    status:
      'Excellent food-medicine for hypothyroid support, mineral nutrition, metabolic enhancement and immune support when from verified clean sources. CRITICAL: absolute contraindication in hyperthyroidism and Graves\' disease. Sourcing and heavy metal testing non-negotiable. TSH monitoring essential if on thyroid medication.',
  },

  // ─────────────────────────────────────────────
  // BLUEBERRY
  // ─────────────────────────────────────────────
  {
    id: 211,
    name: 'Blueberry',
    botanical: 'Vaccinium corymbosum / Vaccinium angustifolium (ripe berry)',
    tcm_meridians: ['Liver', 'Kidney', 'Heart'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Moist', 'Sweet', 'Nourishing', 'Protective', 'Memory-Enhancing'],
    primary_functions: [
      'BDNF stimulation — anthocyanins cross blood-brain barrier and increase brain-derived neurotrophic factor; synaptic strengthening',
      'Memory enhancement — long-term potentiation (LTP) support; improved information retention and recall',
      'Brain-specific antioxidant protection — anthocyanins uniquely accumulate in hippocampus and frontal cortex',
      'Neuroprotection — reduces β-amyloid and tau aggregation; neuroinflammation prevention; Alzheimer\'s risk reduction',
      'Cerebral vascular enhancement — improves endothelial function and microcirculation to brain tissue',
    ],
    secondary_benefits: [
      'Systemic antioxidant — highest ORAC score among berries; cardiovascular and cellular protection',
      'Vision and macular support — retinal antioxidant protection',
      'Longevity promotion — pterostilbene (resveratrol-like); caloric restriction mimic',
      'Anti-inflammatory and cardiovascular support across body systems',
    ],
    pharmacology:
      'Primary bioactives: anthocyanins (30–40% at peak ripeness; malvidin, delphinidin, cyanidin — UNIQUE property: cross blood-brain barrier and accumulate specifically in hippocampus and frontal cortex; stimulate BDNF, enhance LTP, reduce β-amyloid and tau, improve cerebral blood flow). Supporting: pterostilbene (resveratrol-like longevity compound), flavonoids (quercetin, kaempferol; antioxidant), vitamin C. BBB-crossing is the key distinction from most other antioxidants. Grade B+ for memory and cognitive aging; Grade A for antioxidant capacity and safety. Effects cumulative: 4–8 weeks minimum; deeper over 8–12+ weeks.',
    flavor_profile: 'Sweet, slightly tart, gently fruity and deeply nourishing — quintessential food-medicine',
    contraindications: [
      'Warfarin — MODEST CAUTION: vitamin K content may have minor additive effect; monitor INR',
      'Diabetes medications — MONITOR: anthocyanins may enhance insulin sensitivity; modest hypoglycaemia risk',
      'Rare salicylate sensitivity — minimal risk; very uncommon',
      'Generally one of the safest substances available — food source with centuries of traditional use',
    ],
    herb_to_herb_synergy: [
      'Bacopa and Ginkgo — brain trinity: antioxidant nourishment (Blueberry) + memory (Bacopa) + circulation (Ginkgo)',
      'Bilberry — amplified retinal and microvascular anthocyanin protection',
      'Ginger and Turmeric — systemic antioxidant and anti-inflammatory stack',
      'Hawthorn — combined cardiovascular and antioxidant heart support',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions — one of the safest herbs available',
    ],
    herb_to_drug_interactions: [
      'Warfarin — monitor INR (modest vitamin K; usually manageable)',
      'Diabetes medications — monitor blood sugar (may enhance insulin sensitivity)',
      'Minimal other interactions; food-source safety profile',
    ],
    herb_interactions: [
      'Synergy: Bacopa, Ginkgo, Bilberry, Ginger, Turmeric, Hawthorn',
      'Caution: None significant',
      'Drug interactions: warfarin (modest monitor INR), diabetes meds (monitor glucose); otherwise minimal',
    ],
    dosage_range:
      'Fresh or frozen berries: 1/2–1 cup (150–300 g) daily — most bioavailable form. Freeze-dried powder: 10–20 g daily. Tincture: 30–60 drops, 2–3× daily. Food use is preferred — enjoyable, sustainable, highest compliance. Effects cumulative over 4–8 weeks minimum.',
    spiritual_layer:
      'Blueberries are gifts from the wild — small, profound, abundant. In Indigenous traditions across North America, wild berries represent survival, abundance and gratitude — medicine that grows freely, available to all. She is perhaps the most democratic of healers: no ceremony required, no special preparation, just daily presence and consistency. She teaches that the body heals through gentle, consistent nourishment; that simplicity + persistence = profound medicine. The deepest healing often comes not from dramatic interventions but from daily gifts. She whispers: My mind is clear. My memory is strong. I learn easily. Nature feeds me wisely. I am abundantly nourished.',
    best_preparation:
      'Fresh or frozen berries as daily food — morning smoothie, eaten plain or mixed into meals. Freeze-dried powder for convenience and concentrated dosing. Avoid excessive heat (destroys anthocyanins). Organic preferred. Pairs beautifully with Bacopa and Ginkgo for a comprehensive brain-nourishment protocol. Excellent for all ages — particularly valuable for aging brains and developing brains alike.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety — food-source herb with centuries of traditional use and extensive modern research. Exceptional for memory, cognitive aging prevention, neuroprotection and general antioxidant support. BBB-crossing anthocyanins make this uniquely valuable as a brain herb. Safe for all ages including pregnancy. Effects cumulative over 4–12 weeks.',
  },

  // ─────────────────────────────────────────────
  // BOBINSANA
  // ─────────────────────────────────────────────
  {
    id: 102,
    name: 'Bobinsana',
    botanical: 'Calliandra angustifolia (root and bark — Amazonian)',
    tcm_meridians: ['Heart', 'Liver', 'Spleen'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Slightly Moist', 'Heart-Opening', 'Grounding', 'Consciousness-Expanding'],
    primary_functions: [
      'Emotional heart opening — dissolves emotional armour; facilitates grief processing and heartbreak healing',
      'Serotonin and dopamine modulation — proposed alkaloid-mediated monoamine activity (traditional evidence; limited modern pharmacology)',
      'Cardiovascular heart tonic — gentle heart tissue support; heart-centering and mild vasodilation',
      'Mood support and elevation — cumulative mood improvement over weeks of consistent use',
      'Visionary and dream enhancement — consciousness expansion in ceremonial context (traditional Amazonian use)',
    ],
    secondary_benefits: [
      'Grief and trauma integration when combined with therapeutic support',
      'Mild aphrodisiac and sensory enhancement',
      'Nervous system calming in heart-centred protocols',
      'Spiritual connection and heart-centring in ceremonial use',
    ],
    pharmacology:
      'Active compounds largely uncharacterised in modern literature. Traditional and anecdotal reports suggest alkaloid-mediated serotonergic and dopaminergic activity (5-HT receptor interaction; monoamine modulation). Contains tannins (astringent; antioxidant) and volatile oils (mood-modulating). Traditional "plant teacher of the heart" in Amazonian shamanic tradition — used for emotional opening, grief work and visionary states. Research grade C — traditional evidence extensive; modern pharmacology limited. Serotonergic activity proposed but not confirmed. Visionary properties at higher ceremonial doses with experienced facilitation only.',
    flavor_profile: 'Astringent, earthy, slightly bitter and woody with subtle sweetness',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: traditional contraceptive and uterine-stimulating use; miscarriage risk',
      'Breastfeeding — AVOID: alkaloid transfer unknown; insufficient safety data',
      'Uncontrolled psychotic disorders — AVOID: consciousness-altering effects may destabilise',
      'SSRIs and SNRIs — CAUTION: theoretical serotonin syndrome risk (low probability but real); monitor mood; consult psychiatrist',
      'MAOIs — LIKELY CONTRAINDICATED: serotonin syndrome risk (serious); consult psychiatrist; likely avoid',
      'Hypotension — CAUTION: vasodilation may lower blood pressure further; monitor',
      'Cardiac conditions — CAUTION: gentle heart effects; consult cardiologist if existing heart disease',
    ],
    herb_to_herb_synergy: [
      'Rose, Hawthorn and Motherwort — heart-opening emotional support formula; complementary heart meridian herbs',
      'Passionflower and Lemon Balm — emotional nervous system soothing combined with heart opening',
      'Reishi — dream depth and spiritual integration',
    ],
    herb_to_herb_caution: [
      'St. John\'s Wort, high-dose Rhodiola, 5-HTP — other serotonergic herbs; avoid stacking or extreme caution',
      'Stimulant herbs (Guarana, Coffee) — may cause overstimulation',
    ],
    herb_to_drug_interactions: [
      'SSRIs and SNRIs — theoretical serotonin syndrome (monitor carefully; dose conservatively; consult psychiatrist)',
      'MAOIs — likely contraindicated (serotonin syndrome risk)',
      'Antihypertensives — additive blood pressure lowering; monitor',
      'Cardiac medications — consult cardiologist if combining',
    ],
    herb_interactions: [
      'Synergy: Rose, Hawthorn, Motherwort, Passionflower, Lemon Balm, Reishi',
      'Caution: St. John\'s Wort, other serotonergic herbs, Guarana (stimulant stacking)',
      'Drug interactions: SSRIs/SNRIs (monitor; consult psychiatrist), MAOIs (likely avoid), antihypertensives (monitor BP)',
    ],
    dosage_range:
      'Tincture: 20–40 drops, 1–2× daily for daily emotional support. Decoction: 2–4 g dried root per 250 ml, simmer 20 minutes, 1–2× daily. Ceremonial use (higher doses 5–10 g) requires experienced facilitation and psychological preparation. Daily use: periodic breaks (1 week per month) recommended.',
    spiritual_layer:
      'Bobinsana is the "plant teacher of the heart" in Amazonian tradition — an ancient wisdom keeper growing along riverbanks, rooted in water and earth, flowering in soft pink. She teaches that the heart is the seat of all healing; that consciousness expands through heart opening, not through force or breaking but through softening. She dissolves the armour we build to survive, creating space for grief to flow, for love to re-enter, for the sacred vulnerability that is the mark of a truly open life. She whispers: My heart opens. My armour softens. My grief flows. My emotions are sacred. My heart knows. I am emotionally alive.',
    best_preparation:
      'Decoction for traditional emotional support and daily use. Tincture for convenience. Best combined with therapeutic support (counselling, grief work) for deep emotional processing. Ceremonial visionary work requires experienced facilitation and integration practices. Ethical sourcing from sustainable wild-crafted sources critical.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'Absolute contraindication in pregnancy. SSRIs/SNRIs require careful monitoring and psychiatric consultation. Exceptional for emotional heart-opening, grief processing and heart-centred consciousness work in appropriate contexts with proper support. Traditional evidence rich; modern pharmacology limited. Research grade C.',
  },

  // ─────────────────────────────────────────────
  // BROADLEAF PLANTAIN
  // ─────────────────────────────────────────────
  {
    id: 104,
    name: 'Broadleaf Plantain',
    botanical: 'Plantago major (leaf — aerial parts)',
    tcm_meridians: ['Lung', 'Kidney', 'Liver'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Moist', 'Slightly Astringent', 'Demulcent', 'Cooling', 'Vulnerary'],
    primary_functions: [
      'Topical vulnerary — fresh leaf poultice for rapid relief of bites, stings, burns, minor cuts and splinters',
      'Respiratory demulcent — soothes hot, raw, irritated respiratory mucosa; reduces cough and hemoptysis',
      'Mucosal protector — anti-ulcer and GI demulcent for gastritis, peptic ulcers and irritable bowel',
      'Anti-inflammatory — iridoid glycosides (aucubin, catalpol) reduce inflammatory mediators in tissue',
      'Antimicrobial — leaf extracts show antibacterial activity; supports respiratory and urinary tract infections',
    ],
    secondary_benefits: [
      'Urinary tract cooling and mild haemostatic support for hot inflamed urinary conditions',
      'Dual astringent-demulcent action — balances diarrhea and constipation depending on preparation',
      'Wound healing acceleration via mucilage, tannins and iridoid combination',
      'Traditional Persian medicine use for hemoptysis, asthma and tuberculosis (adjunctive)',
    ],
    pharmacology:
      'Key constituents: mucilage and polysaccharides (demulcent; mucosal protection), iridoid glycosides — aucubin and catalpol (anti-inflammatory; hepatoprotective; antimicrobial in multiple models), tannins (astringent; haemostatic; tissue-tightening), flavonoids and phenolic acids (antioxidant; anti-inflammatory; antimicrobial). Dual action: mucilage coats and soothes WHILE tannins tighten and reduce exudation — provides balanced mucosal action. "White man\'s footprint" — spread with European colonisation across temperate regions worldwide; cosmopolitan sidewalk weed with profound medicinal action.',
    flavor_profile: 'Mild, slightly salty-green, gently bitter-astringent — pleasant as tea',
    contraindications: [
      'Rare hypersensitivity — nausea, vomiting, diarrhea, dermatitis or anaphylaxis at high or prolonged doses (rare)',
      'Plantaginaceae allergy — uncommon but possible; discontinue if reaction',
      'Seed use (bulk laxative) — treat as separate preparation; requires copious water; can cause obstruction without adequate hydration',
      'High-dose use in pregnancy — leaf tea at nutritive doses generally safe; high-dose therapeutic use: practitioner-guided',
    ],
    herb_to_herb_synergy: [
      'Calendula — topical wound-healing salves and infused oils',
      'Mullein and Licorice — respiratory formula for raw, irritated cough',
      'Marshmallow root — amplified mucosal demulcent protection',
      'Nettle — combined mineral and anti-inflammatory support',
      'Thyme — respiratory antimicrobial and expectorant partner',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions for leaf use',
    ],
    herb_to_drug_interactions: [
      'Mucilage may slow absorption of oral medications if taken simultaneously — space by 1–2 hours',
      'Mild haemostatic effect — theoretical minor interaction with anticoagulants at high doses',
    ],
    herb_interactions: [
      'Synergy: Calendula, Mullein, Licorice, Marshmallow, Nettle, Thyme',
      'Caution: None significant for leaf',
      'Drug interactions: oral medications (space by 1–2 hours); anticoagulants (mild haemostatic; monitor at high doses)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Infusion: 2–4 g dried leaf per 250 ml, steep 10–15 minutes, 2–3× daily. Fresh leaf poultice applied directly for topical wound and bite first aid — most potent acute use. Infused oil or salve for ongoing wound and skin support.',
    spiritual_layer:
      'Plantain is the first-aid weed — the quiet street-level guardian that appears wherever humans tread, offering cooling protection exactly when life burns, stings or chafes. "White man\'s footprint" is her colonial name, but her wisdom predates it — she has grown where people walk since long before memory, a living reminder that medicine is close, accessible and democratic. She teaches that relief can be simple and near, that the most profound healing is often gentle and immediate, that soothing the irritated places — in body and in life — requires cooling, moistening and gently containing rather than force. She whispers: Soothe the irritated places. Relief is nearer than you think. Protection can be simple.',
    best_preparation:
      'Fresh leaf poultice is the most powerful acute preparation — crush or chew fresh leaf and apply directly to bites, stings or wounds; refresh every 30–60 minutes. Infusion for internal respiratory and GI use. Infused oil or salve for ongoing skin healing. Tincture for convenient daily use. Pairs classically with Mullein and Licorice for respiratory formulas.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Very safe food-medicine herb. Excellent topical first-aid vulnerary and internal respiratory and mucosal soother. Rare hypersensitivity possible. Seed preparations require separate careful handling. Leaf use safe for all populations at standard doses.',
  },

  // ─────────────────────────────────────────────
  // BURDOCK
  // ─────────────────────────────────────────────
  {
    id: 212,
    name: 'Burdock',
    botanical: 'Arctium lappa (root — Gobo)',
    tcm_meridians: ['Liver', 'Spleen', 'Stomach', 'Large Intestine'],
    tcm_element: 'Earth + Metal',
    energetics: ['Cool', 'Dry', 'Sweet', 'Blood-Purifying', 'Tonifying', 'Detoxifying', 'Grounding'],
    primary_functions: [
      'Prebiotic microbiome feeding — inulin (30–50% of dried root) selectively feeds Bifidobacteria and Lactobacillus',
      'Liver detoxification support — chlorogenic acid, caffeic acid and arctiin support phase I and phase II pathways',
      'Anti-inflammatory — arctiin sesquiterpene lactone reduces TNF-α, IL-6 and NF-κB; skin and GI inflammation',
      'Foundational mineral nutrition — dense bioavailable minerals (K, Ca, Mg, Fe, Zn, Cr)',
      'Dysbiosis healing — prebiotic action restores gut flora balance; improves gut barrier and reduces endotoxin',
    ],
    secondary_benefits: [
      'Inflammatory skin support — acne, eczema and psoriasis via internal detoxification and anti-inflammatory action',
      'Traditional "blood purification" — liver support clears circulating metabolites',
      'Post-illness mineral repletion and vitality restoration',
      'Candida overgrowth normalisation through beneficial bacteria restoration',
    ],
    pharmacology:
      'Primary bioactives: inulin (30–50% — selective prebiotic; fermented by beneficial bacteria to produce butyrate; strengthens gut barrier; reduces endotoxin; dysbiosis heals), arctiin (sesquiterpene lactone; anti-inflammatory via NF-κB inhibition; liver support), chlorogenic acid and caffeic acid (polyphenols; antioxidant; liver phase I/II support), minerals (K, Ca, Mg, Fe, Zn, Cr; bioavailable; foundational nutrition). Japanese culinary staple (Gobo) — food-medicine with centuries of safe use. Grade A for prebiotic action and mineral content; Grade B+ for dysbiosis healing; Grade A safety.',
    flavor_profile: 'Earthy, slightly sweet and mildly bitter — pleasant as decoction or culinary ingredient',
    contraindications: [
      'Diabetes medications — inulin lowers blood sugar; may potentiate medications; hypoglycaemia risk; monitor glucose',
      'Diuretics — electrolyte monitoring recommended when combining; ensure adequate potassium',
      'Asteraceae allergy — rare cross-reactivity possible (same family as ragweed)',
      'Pregnancy — traditional culinary use suggests safety; supplement doses: consult provider',
    ],
    herb_to_herb_synergy: [
      'Dandelion root — combined liver, digestive and detoxification support',
      'Nettle — mineral powerhouse trinity for deep nutritive nourishment',
      'Oatstraw — mineral-rich and calming; excellent nutritive trio',
      'Milk Thistle — comprehensive liver support and hepatoprotection',
      'Astragalus — immune and microbiome combined foundational protocol',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions — food-like safety profile',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — inulin glucose-lowering; monitor blood sugar; dose adjustment possible',
      'Diuretics — electrolyte monitoring; ensure adequate potassium',
      'No other significant drug interactions; culinary staple safety profile',
    ],
    herb_interactions: [
      'Synergy: Dandelion, Nettle, Oatstraw, Milk Thistle, Astragalus',
      'Caution: None significant',
      'Drug interactions: diabetes meds (monitor glucose), diuretics (monitor electrolytes); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 60–90 drops, 2–3× daily. Decoction: 1–2 tsp dried sliced root per 250 ml, simmer 15–20 minutes, 2–3× daily (optimal for mineral and inulin extraction). Cold overnight infusion: 2–3 tsp in cold water soaked 8+ hours (best for inulin preservation). Culinary use as Gobo: 2–3 times weekly in soups and stir-fries. Safe indefinite long-term use.',
    spiritual_layer:
      'Burdock is the deep nourisher — her roots go down into dark earth, pulling up mineral wisdom from depths that sunlight never reaches. She is the teacher of foundational nourishment, of feeding what feeds you (your microbiome), of healing from the inside out. The bur that clings to clothing inspired Velcro — even her seed dispersal holds a teaching about connection and being carried forward. She teaches that true strength comes from rootedness, from tending the invisible world beneath the surface — the bacterial allies who digest our food, protect our gut and communicate with our immune system. She whispers: I am rooted. I am nourished. My foundations are strong. My bacterial allies feed me. I heal from inside out.',
    best_preparation:
      'Decoction most efficient for mineral and inulin extraction — simmer 15–20 minutes. Cold overnight infusion optimal for inulin extraction. Culinary use as Gobo is most sustainable long-term approach. Tincture less efficient for minerals but convenient. Combine with Nettle and Dandelion for a comprehensive liver-microbiome-mineral foundation protocol.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety — Japanese culinary staple with centuries of use. Excellent for microbiome health, dysbiosis healing, liver support and foundational mineral nutrition. Safe indefinite long-term use. Monitor blood sugar if on diabetes medications. One of the most versatile foundational herbs available.',
  },

  // ─────────────────────────────────────────────
  // BUTCHER'S BROOM
  // ─────────────────────────────────────────────
  {
    id: 213,
    name: "Butcher's Broom",
    botanical: 'Ruscus aculeatus (rhizome and root — standardised to ruscogenins)',
    tcm_meridians: ['Liver', 'Spleen', 'Kidney'],
    tcm_element: 'Wood + Water',
    energetics: ['Neutral', 'Slightly Warming', 'Bitter', 'Astringent', 'Venotonic', 'Structuring'],
    primary_functions: [
      'Chronic venous insufficiency (CVI) — alpha-adrenergic venoconstriction reduces venous pooling, leg heaviness, cramping and ankle oedema',
      'Varicose vein support — ruscogenins tighten lax venous smooth muscle; reduces venous capacity',
      'Haemorrhoid relief — venotonic and capillary-protective action on haemorrhoidal plexus',
      'Capillary protection — reduces capillary permeability and improves lymphatic drainage',
      'Orthostatic hypotension adjunct — venoconstrictive properties reduce venous pooling on standing',
    ],
    secondary_benefits: [
      'Leg volume reduction and decreased ankle circumference in CVI (clinical trial documented)',
      'Microcirculation and lymphatic drainage support',
      'Potential adjunct in venous stasis and long-haul travel leg protocols',
    ],
    pharmacology:
      'Primary bioactives: steroidal saponins — ruscogenin and neoruscogenin (alpha-adrenergic agonists; directly activate postjunctional α1 and α2 receptors in venous smooth muscle; stimulate noradrenaline release at vascular wall; venoconstriction and reduced venous capacity). Supporting: flavonoids, phytosterols. Multiple double-blind RCTs demonstrate improvement in CVI symptoms. One RCT suggests superiority to rutoside in CVI. EMA and ESCOP-listed herb. Grade B+ for CVI; Grade B for haemorrhoids; Grade B+ safety at standard doses.',
    flavor_profile: 'Bitter, slightly acrid — not typically used as tea; standardised extract the primary form',
    contraindications: [
      'URGENT MEDICAL REFERRAL — sudden unilateral leg swelling, skin inflammation, ulcers or cardiac/renal insufficiency presenting with leg oedema: DO NOT self-treat; seek immediate medical care (possible DVT, heart failure)',
      'Cardiac or renal insufficiency with leg oedema — physician evaluation mandatory; do not self-treat with Ruscus',
      'Pregnancy — limited data; vasoconstrictive and adrenergic actions; avoid unless under medical supervision',
      'Uncontrolled hypertension — theoretical alpha-adrenergic vasoconstriction may affect BP; monitor',
      'Diabetes medications — coordination may be needed for any metabolic effects',
    ],
    herb_to_herb_synergy: [
      'Horse Chestnut — combined venotonic and capillary-stabilising action; excellent CVI pairing',
      'Gotu Kola — connective tissue and vascular integrity support',
      'Hawthorn — cardiovascular and vascular tone support',
      'Bilberry and Aronia — combined capillary-protective polyphenol stack',
    ],
    herb_to_herb_caution: [
      'Other vasoactive herbs — cumulative vascular effects; monitor blood pressure',
      'Other alpha-agonist herbs — additive venoconstrictive effects',
    ],
    herb_to_drug_interactions: [
      'Vasoactive drugs (alpha agonists/antagonists, antihypertensives) — monitor BP and symptoms',
      'No strong CYP450 metabolic interactions documented',
    ],
    herb_interactions: [
      'Synergy: Horse Chestnut, Gotu Kola, Hawthorn, Bilberry, Aronia',
      'Caution: other vasoactive herbs (monitor BP)',
      'Drug interactions: antihypertensives and vasoactive drugs (monitor); otherwise minimal',
    ],
    dosage_range:
      'Standardised extract providing approximately 7–11 mg ruscogenins daily (typically 150–300 mg dry extract, 2–3 capsules daily). Minimum 12 weeks for CVI clinical benefit. Best combined with compression stockings and regular movement.',
    spiritual_layer:
      'Butcher\'s Broom is a structural, upright ally — the helper who restores the body\'s capacity to stand up internally when heaviness pulls downward. She grows as a stiff, spiny evergreen shrub — compact, persistent, structurally resilient — teaching that the vessels and channels of the body need elastic integrity, not just force, to do their work. She teaches that circulation is not about pushing harder but about restoring the responsive tone of the structures that hold and return. She whispers: My veins and vessels are strong and responsive. I release heaviness and stagnation from my legs and pelvis. I stand upright, supported from within.',
    best_preparation:
      'Standardised extract (ruscogenins-standardised) is the primary modern form — crude decoctions less reliable. Always combine with compression stockings and daily movement for CVI. Screen for urgent red flags (DVT, heart failure, renal insufficiency) before recommending. Combine with Horse Chestnut and Gotu Kola for a comprehensive venous integrity protocol.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Evidence-based venotonic herb with EMA monograph and multiple RCTs. Excellent for CVI, varicose veins and haemorrhoids. CRITICAL: screen for urgent DVT, heart failure and renal insufficiency red flags before recommending. Standardised extract required for reliable ruscogenin dosing. Minimum 12 weeks for full benefit.',
  },

  // ─────────────────────────────────────────────
  // BUTTERBUR
  // ─────────────────────────────────────────────
  {
    id: 214,
    name: 'Butterbur',
    botanical: 'Petasites hybridus (root and rhizome — PA-FREE extract only)',
    tcm_meridians: ['Liver', 'Lung', 'Heart'],
    tcm_element: 'Wood + Metal',
    energetics: ['Slightly Cool', 'Slightly Dry', 'Bitter-Aromatic', 'Antispasmodic', 'Anti-Allergic'],
    primary_functions: [
      'Migraine prevention — petasin and isopetasin inhibit leukotrienes, prostaglandins and TRPA1; reduces attack frequency (multiple RCTs)',
      'Allergic rhinitis — as effective as cetirizine in seasonal hay fever without sedation (clinical trial evidence)',
      'Bronchial antispasmodic — leukotriene and calcium-channel modulation supports asthma and bronchial spasm relief',
      'Vascular smooth muscle relaxation — reduces vasospasm associated with migraine pathophysiology',
      'Anti-inflammatory — systemic leukotriene and prostaglandin inhibition across respiratory and vascular tissues',
    ],
    secondary_benefits: [
      'Hay fever and seasonal pollen allergy support — sneezing, nasal congestion, itchy eyes',
      'Cat dander and environmental allergen reactivity reduction',
      'Traditional antispasmodic for urinary and GI spasm (secondary)',
    ],
    pharmacology:
      'CRITICAL SAFETY: crude Petasites contains pyrrolizidine alkaloids (PAs) — hepatotoxic compounds; internal use of crude herb is CONTRAINDICATED. PA-FREE standardised extract is the ONLY safe internal form. Primary bioactives in PA-free extract: petasin and isopetasin (sesquiterpene esters; TRPA1 desensitisation; leukotriene and prostaglandin inhibition; vascular smooth muscle relaxation). Multiple RCTs for migraine prevention (50–75 mg PA-free extract twice daily) and allergic rhinitis (comparable to cetirizine). Grade B+ for migraine prophylaxis; Grade B+ for allergic rhinitis; Grade C+ for bronchial spasm.',
    flavor_profile: 'Bitter-aromatic — standardised extract form; not used as tea or tincture from crude herb',
    contraindications: [
      'CRUDE HERB — ABSOLUTELY CONTRAINDICATED INTERNALLY: pyrrolizidine alkaloids are hepatotoxic; only PA-free standardised extract safe for internal use',
      'Liver disease or hepatotoxic medications — AVOID or use only with close monitoring; even PA-free extracts warrant liver caution',
      'Pregnancy — AVOID: insufficient safety data for internal use',
      'Breastfeeding — AVOID: safety data insufficient',
      'Children — PA-free extract only; under medical supervision only in paediatric migraine or allergy',
    ],
    herb_to_herb_synergy: [
      'Feverfew — combined migraine prevention protocol (complementary mechanisms)',
      'Nettle leaf — enhanced allergic rhinitis and seasonal allergy support',
      'Elderflower — amplified allergic rhinitis and respiratory anti-inflammatory action',
    ],
    herb_to_herb_caution: [
      'Other hepatotoxic herbs — additive liver burden; avoid combination',
      'Other leukotriene or antihistamine herbs — monitor for additive effects',
    ],
    herb_to_drug_interactions: [
      'Antihistamines and leukotriene antagonists — complementary and potentially additive benefit',
      'Hepatotoxic medications — avoid combination even with PA-free extract',
      'No strong CYP450 interactions documented for PA-free extract',
    ],
    herb_interactions: [
      'Synergy: Feverfew, Nettle Leaf, Elderflower',
      'Caution: other hepatotoxic herbs (avoid combination)',
      'Drug interactions: hepatotoxic medications (avoid), antihistamines (complementary); otherwise minimal',
    ],
    dosage_range:
      'PA-FREE standardised extract ONLY: 50–75 mg twice daily with meals for migraine prevention (minimum 3–4 months). Allergic rhinitis: similar dosing during pollen season. NEVER use crude herb internally. Always verify PA-free certification on product label.',
    spiritual_layer:
      'Butterbur grows in damp, shaded riverbanks and marshy places — a large-leaved cooling plant whose giant leaves once wrapped butter to keep it fresh in summer, giving her English name. She is a cooling, calming presence in hot, reactive, hypersensitive conditions — the oversensitive nervous system, the reactive airway, the head that throbs with migraine heat. She teaches that sensitivity itself is not the problem; the problem is when the alarm system becomes chronically over-triggered. She helps reset the threshold. She whispers: My nervous system recalibrates. My airways open with ease. The reactive patterns soften. I am no longer held hostage by my own hypersensitivity.',
    best_preparation:
      'PA-free standardised extract is the only appropriate internal preparation. Verify PA-free certification on every product. Preventive use — minimum 3–4 months before assessing migraine benefit. Best combined with Feverfew for a comprehensive migraine prevention protocol. Always screen for liver disease before recommending.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'CRITICAL: PA-free standardised extract ONLY — crude herb internally is hepatotoxic and absolutely contraindicated. Evidence-based herb for migraine prevention and allergic rhinitis when PA-free certified extract is used. Liver caution even with PA-free extract. Excellent for practitioners managing migraine and seasonal allergy protocols.',
  },
  // ============================================================
  // BATCH 03 — 20 herbs converted from monographs
  // Ready to merge into src/data/herbsAndProtocols.ts
  // ============================================================

  // ─────────────────────────────────────────────
  // DAMIANA
  // ─────────────────────────────────────────────
  {
    id: 215,
    name: 'Damiana',
    botanical: 'Turnera diffusa (leaf — aerial parts)',
    tcm_meridians: ['Liver', 'Kidney', 'Heart'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Dry', 'Stimulating', 'Sensory-Enhancing', 'Confidence-Building', 'Pleasure-Promoting'],
    primary_functions: [
      'Sexual vitality and arousal — volatile oils and alkaloids increase blood flow to genitals and enhance tactile sensation',
      'Confidence and embodied presence — sacral activation removes psychological blocks to desire and social ease',
      'Paradoxical calm-stimulation — mild sympathomimetic activation without agitation or jitteriness',
      'Mood elevation and social confidence — dopamine modulation; embodied charisma and authentic expression',
      'Nervous system activation for tired, dull, withdrawn states — restores functional energy without overstimulation',
    ],
    secondary_benefits: [
      'Mild anxiolytic via flavonoid GABA modulation — paradoxical calm alongside stimulation',
      'Traditional respiratory tonic and mild expectorant',
      'Digestive bitter and carminative for sluggish digestion',
      'Sacred sexuality and creativity activation in ceremonial contexts',
    ],
    pharmacology:
      'Primary bioactives: alkaloids (damianin and related compounds — mild sympathomimetic; dopamine and norepinephrine modulation; chemistry still being characterised), volatile oils (0.5–1%; cineole, thymol, pinene, cymene — vasodilation, sensory nerve activation, aromatic mood modulation), flavonoids (quercetin, apigenin 1–2%; anxiolytic via GABA modulation), tannins (3–5%; astringent, antioxidant). 400+ years traditional use. Modern research 40+ studies on sexual function, mood and anxiety. Mechanism: removes psychological blocks to desire through anxiety reduction and confidence increase rather than forcing pharmacological arousal.',
    flavor_profile: 'Warm, slightly peppery, mildly bitter and aromatically distinctive',
    contraindications: [
      'Pregnancy — CAUTION: traditional uterine stimulant associations; consult prenatal provider; avoid concentrated medicinal doses',
      'Breastfeeding — CAUTION: limited safety data; consult provider',
      'Diabetes medications — volatile compounds may affect blood sugar; monitor glucose',
      'Iron absorption — tannins may reduce absorption; separate from iron supplements by 1–2 hours',
      'Generally very safe at standard doses',
    ],
    herb_to_herb_synergy: [
      'Catuaba — combined Amazonian and Mexican sexual vitality synergy; complementary alkaloid profiles',
      'Ashwagandha — adaptogenic grounding plus sexual confidence; testosterone and arousal support',
      'Muira Puama — traditional sexual tonic combination; complementary mechanisms',
      'Rose and Hawthorn — heart-opening and sensual embodiment protocol',
      'Ginkgo — enhanced peripheral circulation amplifying sexual blood flow effects',
    ],
    herb_to_herb_caution: [
      'Other sympathomimetic herbs at high combined doses — potential overstimulation',
      'Other uterine-stimulating herbs in pregnancy context',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — potential blood sugar modulation; monitor',
      'Iron supplements — tannins reduce absorption; space by 1–2 hours',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Catuaba, Ashwagandha, Muira Puama, Rose, Hawthorn, Ginkgo',
      'Caution: stimulating herbs at high combined doses',
      'Drug interactions: diabetes meds (monitor), iron supplements (space doses); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 1–2× daily. Tea: 1–2 g dried leaves steeped 10 minutes, 1–2× daily. Best taken 1–2 hours before desired effect for acute use. For cumulative baseline: consistent daily use 2–4 weeks.',
    spiritual_layer:
      'Damiana is the Mexican sacred sexuality herb — 400 years of indigenous and colonial tradition celebrating the arousal of life force itself. She grows in dry, sun-drenched Mexican hillsides, concentrating the heat and fire of her landscape into leaves that warm from the inside out. She teaches that sexuality is sacred, that confidence is embodied not performed, that pleasure is medicine not indulgence. She activates the sacral centre — the seat of creativity, desire and authentic power. She whispers: You are magnetic. You are alive in your body. Your desire is sacred. Your pleasure is medicine. Step into your power.',
    best_preparation:
      'Tincture for consistent daily use. Tea for ritual preparation 1–2 hours before. Works most powerfully when combined with intention and embodiment practice. Pairs beautifully with Catuaba for a comprehensive sexual vitality protocol, and with Rose or Hawthorn for heart-centred sensual work.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Very safe at standard doses with 400+ years traditional use. Excellent for sexual vitality, confidence, embodied presence and mood elevation. Caution in pregnancy. Moderate evidence base; traditional use extensive. Effects develop over 2–4 weeks of consistent use with cumulative baseline improvement.',
  },

  // ─────────────────────────────────────────────
  // DANDELION ROOT
  // ─────────────────────────────────────────────
  {
    id: 107,
    name: 'Dandelion Root',
    botanical: 'Taraxacum officinale (root — preferred over leaf for medicinal use)',
    tcm_meridians: ['Liver', 'Stomach', 'Lung'],
    tcm_element: 'Wood + Earth',
    energetics: ['Cool', 'Dry', 'Bitter', 'Cleansing', 'Detoxifying', 'Liver-Moving', 'Foundational'],
    primary_functions: [
      'Liver detoxification — bitter sesquiterpenes stimulate bile production; supports phase I and phase II enzyme pathways',
      'Prebiotic microbiome feeding — inulin (2–10% root) selectively feeds Bifidobacterium and Lactobacillus',
      'Digestive bitters — stimulates HCl, digestive enzymes and bile; activates entire digestive chain',
      'Potassium-rich diuretic — richest herbal potassium source; supports kidney function and electrolyte balance',
      'Blood sugar regulation support — inulin modulates glucose absorption; improves insulin sensitivity',
    ],
    secondary_benefits: [
      'Antiviral polyphenols — chicoric acid and caffeic acid support viral infection prevention',
      'Gallbladder and bile flow support — choleretic action improves fat digestion',
      'Nutritive mineral density — calcium, iron, magnesium, zinc plus vitamins A and C',
      'Digestible protein content — rare in herbs; supports amino acid intake',
      'Traditional "blood purifier" — liver support clears circulating metabolites',
    ],
    pharmacology:
      'Primary bioactives: bitter sesquiterpenes (0.5–1%; choleretic — stimulate bile production and phase I/II liver detoxification via hepatocyte activation), inulin (2–10% in roots; prebiotic; feeds Bifidobacteria and Lactobacillus; FOS fermentation produces butyrate; strengthens gut barrier; reduces endotoxin), polyphenols (chicoric acid, caffeic acid 1–2%; antioxidant, antiviral, neuroprotective), potassium (richest herbal source; kidney and electrolyte support), vitamins A and C, digestible protein. 5000+ years of traditional use across TCM, Ayurveda and European herbalism. Grade A for prebiotic action and mineral content; Grade B+ for liver detoxification support.',
    flavor_profile: 'Intensely bitter, earthy and slightly warming — archetypal digestive bitter',
    contraindications: [
      'Bile duct obstruction or active gallstones — choleretic herbs provoke contraction; AVOID',
      'Asteraceae allergy — cross-reactivity possible (ragweed); caution',
      'Diuretics — potassium-rich diuretic action; monitor electrolytes and fluid balance',
      'Diabetes medications — inulin and bitter compounds may lower blood sugar; monitor glucose',
      'Warfarin — vitamin K in leaf form may affect INR; root less concern but monitor',
      'Lithium — diuretic action may alter lithium clearance; monitor levels',
    ],
    herb_to_herb_synergy: [
      'Burdock root — combined liver, detoxification and prebiotic powerhouse',
      'Milk Thistle — comprehensive hepatoprotective and detoxification stack',
      'Nettle — mineral nutrition and anti-inflammatory synergy',
      'Artichoke and Gentian — robust digestive bitter blend',
      'Aronia and Bilberry — cardiometabolic and antioxidant combined protocol',
    ],
    herb_to_herb_caution: [
      'Other potassium-depleting diuretics — monitor electrolyte balance',
      'Other strong bitters in very sensitive digestion — may cause overstimulation',
    ],
    herb_to_drug_interactions: [
      'Bile duct medications — choleretic synergy; monitor',
      'Diabetes medications — additive blood sugar lowering; monitor glucose',
      'Diuretic drugs — additive diuresis and electrolyte shifts; monitor',
      'Warfarin — modest vitamin K interaction (leaf form primarily); monitor INR',
      'Lithium — diuretic effect may alter clearance; monitor levels',
    ],
    herb_interactions: [
      'Synergy: Burdock, Milk Thistle, Nettle, Artichoke, Gentian',
      'Caution: potassium-depleting diuretics, gallbladder obstruction',
      'Drug interactions: diabetes meds, diuretics, warfarin (monitor), lithium (monitor)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Decoction: 1–2 tsp dried root per 250 ml, simmer 15 minutes, 2–3× daily. Roasted root as traditional coffee substitute (medicinal food-medicine). Safe long-term indefinite use as foundational herb.',
    spiritual_layer:
      'Dandelion is the indestructible yellow sun of the garden — what gardeners call a weed is what healers call a teacher. She grows through concrete and returns after every attempt at removal, teaching resilience, adaptation and the power of persistence. Her taproot goes deep, pulling up minerals from soil layers other plants cannot reach — a teacher of accessing nourishment from depth. She teaches that the most powerful medicine is often the most overlooked, that resilience is grown in adversity, that even the most broken ground can produce gold. She whispers: I clear what is stuck. I feed what is depleted. I move the stagnant liver. I am resilient and everywhere. I am available to you.',
    best_preparation:
      'Roasted root as daily coffee substitute — most pleasant and sustainable for long-term use. Decoction most efficient for bitter and mineral extraction. Tincture for convenient daily dosing. Raw fresh root most potent. Screen for gallstones and bile duct obstruction before recommending. Pairs powerfully with Burdock and Milk Thistle for a comprehensive liver-microbiome protocol.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A safety — 5000+ years traditional use globally. Absolute contraindication with bile duct obstruction and active gallstones. Otherwise foundational food-medicine herb excellent for liver detoxification, digestive bitters, microbiome support and mineral nutrition. Safe indefinite long-term use.',
  },

  // ─────────────────────────────────────────────
  // ELDERBERRY
  // ─────────────────────────────────────────────
  {
    id: 216,
    name: 'Elderberry',
    botanical: 'Sambucus nigra / Sambucus canadensis (ripe berries only — never raw or unripe)',
    tcm_meridians: ['Lung', 'Spleen'],
    tcm_element: 'Metal + Earth',
    energetics: ['Cool', 'Slightly Moistening', 'Sweet-Tart', 'Dispersing', 'Antiviral', 'Protective'],
    primary_functions: [
      'Antiviral — anthocyanins block influenza hemagglutinin surface proteins; inhibit viral entry and replication',
      'Cold and flu duration reduction — clinical trials show reduced duration and severity when taken early',
      'Balanced immune modulation — polysaccharides and polyphenols modulate cytokines without overstimulation',
      'Wei Qi protection — strengthens respiratory mucosal defence at the body\'s surface boundary',
      'Antioxidant and anti-inflammatory — anthocyanins and flavonols reduce oxidative stress and inflammatory markers',
    ],
    secondary_benefits: [
      'Capillary stabilisation via anthocyanin and rutin action on vascular walls',
      'Recovery support — reduces post-viral fatigue and supports restoration',
      'Children-friendly immune support — syrup form palatable and gentle',
      'Gentle nutritive — vitamin C, potassium, polyphenols in food-like quantities',
    ],
    pharmacology:
      'Primary bioactives: anthocyanins (cyanidin-3-glucoside, cyanidin-3-sambubioside — potent antioxidants; block viral hemagglutinin; modulate IL-1β, TNF-α, IL-6), flavonols (quercetin, rutin, isoquercitrin — antioxidant, mast-cell modulating, antiviral synergy), phenolic acids (chlorogenic, caffeic — antioxidant, anti-inflammatory), polysaccharides (immune-modulating; macrophage and cytokine balance). CRITICAL SAFETY: raw or unripe berries and ALL other parts (leaves, stems, bark, unripe fruit) contain cyanogenic glycoside sambunigrin — toxic; only fully ripe cooked or properly processed berries safe. Grade B+ for influenza duration reduction; Grade B for immune modulation.',
    flavor_profile: 'Deep berry sweet-tart, rich and slightly tannic when fully ripe',
    contraindications: [
      'RAW OR UNRIPE BERRIES — ABSOLUTELY NEVER USE: cyanogenic glycoside sambunigrin causes nausea, vomiting and potentially serious toxicity; only fully ripe, properly cooked or processed berries',
      'ALL OTHER PLANT PARTS (leaves, stems, bark, root) — TOXIC: sambunigrin present; absolutely avoid',
      'Autoimmune diseases — immune modulation may potentially influence autoimmune activity; use with caution and consult provider',
      'Immunosuppressants — immune-modulating activity; theoretical interaction; consult prescriber',
      'Pregnancy — insufficient safety data for therapeutic doses; food amounts likely safe; consult provider',
    ],
    herb_to_herb_synergy: [
      'Echinacea — acute infection synergy (Echinacea acute activation + Elderberry antiviral); use together at first sign of illness',
      'Black Cumin — immune activation and antiviral; complementary mechanisms',
      'Astragalus — foundational immune support combined with acute antiviral protection',
      'Ginger and Cinnamon — warming antimicrobial and antiviral syrup formulas',
    ],
    herb_to_herb_caution: [
      'Other immune-stimulating herbs in autoimmune conditions — cumulative immune activation',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — theoretical immune-modulating interaction; consult prescriber',
      'Diabetes medications — anthocyanins may modestly affect glucose; monitor',
      'Diuretics — modest diuretic action; electrolyte monitoring',
    ],
    herb_interactions: [
      'Synergy: Echinacea, Black Cumin, Astragalus, Ginger, Cinnamon',
      'Caution: immune-stimulating herbs in autoimmune conditions',
      'Drug interactions: immunosuppressants (consult), diabetes meds (monitor), diuretics (monitor)',
    ],
    dosage_range:
      'Tincture (from properly processed ripe berries): 30–60 drops, 2–3× daily. Syrup: 1–2 tablespoons daily (adults); 1 teaspoon daily (children). At first sign of illness: double dose for first 48 hours then return to standard. Effects best when started early in illness.',
    spiritual_layer:
      'Elderberry is the "medicine chest" of Hippocrates — the old country medicine that preceded every pharmaceutical cold remedy by millennia. She is the grandmother hedge plant, the protective boundary of the European farmstead, her dark berries appearing like clustered stars in autumn. She teaches flexible, intelligent boundaries — able to respond to viral stress at the body\'s surface while remaining permeable for connection. Her medicine lives at the threshold — between inside and outside, between vulnerable and defended. She whispers: I guard your respiratory boundaries with wisdom. I respond to threat without becoming rigid. I am the ancient medicine of the hedgerow, available and generous.',
    best_preparation:
      'Syrup (cooked ripe berries with honey) — most traditional, most palatable for all ages, most studied form. Tincture from properly processed ripe berries for convenient daily use. Always ensure fully ripe, properly cooked or processed berries. Never use raw, unripe berries or any other plant part.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Safe when fully ripe berries are properly processed. CRITICAL: raw or unripe berries are toxic. Excellent food-medicine for cold and flu prevention and treatment. Start at first sign of illness for maximum benefit. Generally safe and food-like at standard syrup/tincture doses. Autoimmune caution.',
  },

  // ─────────────────────────────────────────────
  // CALEA ZACATACHICHI
  // ─────────────────────────────────────────────
  {
    id: 132,
    name: 'Calea Zacatachichi',
    botanical: 'Calea zacatachichi / Calea ternifolia (aerial parts, leaves and flowering tops)',
    tcm_meridians: ['Heart', 'Third Eye', 'Pericardium'],
    tcm_element: 'Fire + Metal',
    energetics: ['Cool', 'Dry', 'Intensely Bitter', 'Consciousness-Altering', 'Oneiric', 'Dream-Opening'],
    primary_functions: [
      'REM sleep architecture modulation — sesquiterpene lactones increase REM density, duration and dream vividness',
      'Dream lucidity enhancement — optimal neurochemical conditions for lucid dreaming; improved dream recall',
      'Consciousness bridge — retains observing awareness within dream state; liminal state facilitation',
      'Hypnagogic state enhancement — enriches falling-asleep threshold imagery and intuitive insight access',
      'Visionary and shamanic journeying support — traditional Chontal Mazatec ceremonial plant teacher',
    ],
    secondary_benefits: [
      'Creativity and problem-solving access through dream-logic and symbolic thinking',
      'Intuitive clarity and non-rational knowing during integration after use',
      'Mild digestive bitter and gastrointestinal antimicrobial (secondary traditional use)',
      'Mild anti-inflammatory and antioxidant via flavonoids and phenolic compounds',
    ],
    pharmacology:
      'Primary bioactives: sesquiterpene lactones (0.2–0.6%; germacranolides including zexbrevin, budlein A — REM sleep modulators; increase acetylcholine relative to monoamine tone during REM; extend REM episodes and increase rapid eye movement density; primary mechanism for lucidity and vividness effects). Supporting: monoterpenes (limonene, α-pinene, β-myrcene, camphene — volatile dream-state modulators), flavonoids (antioxidant, neuroprotective), phenolic compounds (chlorogenic, caffeic acids — antioxidant, anti-inflammatory), tannins (astringent, antimicrobial). NOT a classical psychedelic — does not produce visual hallucinations, ego dissolution or overwhelming sensory intensity; rather, subtly enhances dream consciousness and symbolic perception. Traditional Chontal Mazatec use for centuries.',
    flavor_profile: 'Intensely bitter, earthy and distinctly unpleasant — traditionally masked in preparations',
    contraindications: [
      'Psychotic disorders or psychosis history — ABSOLUTELY CONTRAINDICATED: consciousness shifts may trigger or exacerbate psychotic episodes',
      'Bipolar disorder with mania risk — dream intensification may destabilise; AVOID',
      'Dissociative disorders or dissociation history — consciousness-altering effects contraindicated',
      'Major depressive episodes with suicidal ideation — dream intensification may deepen introspection; AVOID without therapeutic support',
      'Pregnancy — insufficient safety data; AVOID',
      'Breastfeeding — insufficient safety data; AVOID',
      'Sleep apnoea or severe sleep disorders — REM modulation may worsen conditions',
      'Acute trauma or PTSD without therapeutic support — dream intensification may overwhelm',
    ],
    herb_to_herb_synergy: [
      'Mugwort — amplified visionary dreaming; classic dream synergy pairing',
      'Blue Lotus — enhanced dream vividness and heart-centred consciousness exploration',
      'Passionflower — gentle emotional ease during dream work',
      'Reishi — dream depth and spiritual integration',
    ],
    herb_to_herb_caution: [
      'Other dream-enhancing herbs at combined high doses — potentiation risk; experienced users only',
      'CNS depressants — additive consciousness-altering effects; monitor',
    ],
    herb_to_drug_interactions: [
      'Sedatives and CNS depressants — additive consciousness-altering effects',
      'Antipsychotics — potential complex interactions requiring monitoring',
      'Psychiatric medications — awareness and professional supervision required',
    ],
    herb_interactions: [
      'Synergy: Mugwort, Blue Lotus, Passionflower, Reishi',
      'Caution: other dream herbs at combined high doses; CNS depressants',
      'Drug interactions: sedatives, CNS depressants, antipsychotics (professional supervision)',
    ],
    dosage_range:
      'Tincture: 10–20 drops in warm water, 30–60 minutes before bed. Tea: 1–2 g dried herb steeped 10–15 minutes, ceremonially consumed before bed. Use 2–3 times weekly maximum; avoid daily habituation. Evening and bedtime use only.',
    spiritual_layer:
      'Calea Zacatachichi is the dream master\'s herb — "leaf of god" in Chontal Mazatec, used by indigenous healers of Oaxaca and Chiapas for generations to receive guidance through dreams. She teaches that dreams are not random noise but medicine, guidance and truth encoded in the language of symbols. She is the consciousness bridge — the herb that teaches the waking mind to remain awake while the body sleeps, to witness the dream from within. Her bitterness is deliberate: this is serious medicine, requiring respect, preparation and integration. She whispers: Your dreams are not random. Listen deeply. Your soul speaks in symbols. The answers live in the dream. I am the key.',
    best_preparation:
      'Ceremonial tea with clear intention setting before bed — intention shapes the dream trajectory. Tincture in warm water for convenient preparation. Journal dreams immediately upon waking for integration. Use in safe, quiet sleeping environment. Combine with Mugwort for amplified dream protocols.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Absolute contraindication in psychosis, bipolar disorder, dissociative disorders and severe depression without therapeutic support. Not for daily use. Excellent for intentional dream work, lucid dreaming and visionary exploration when used with proper psychiatric screening, clear intention and integration practices.',
  },

  // ─────────────────────────────────────────────
  // CARDAMOM
  // ─────────────────────────────────────────────
  {
    id: 217,
    name: 'Cardamom',
    botanical: 'Elettaria cardamomum (seeds within dried pods — Queen of Spices)',
    tcm_meridians: ['Lung', 'Spleen', 'Stomach', 'Large Intestine'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Aromatic', 'Pungent', 'Slightly Sweet', 'Qi-Moving', 'Damp-Resolving', 'Heart-Opening'],
    primary_functions: [
      'Digestive carminative and antispasmodic — 1,8-cineole and α-terpinyl acetate relax GI smooth muscle and reduce gas and cramping',
      'Respiratory expectorant — 1,8-cineole (eucalyptol) supports bronchodilation, expectoration and phlegm clearance',
      'Cardiometabolic modulation — clinical trials (3 g/day) show improved blood pressure, lipids and glycaemic parameters',
      'Nausea relief — warming aromatic oils soothe gastric hypermotility and settle digestion',
      'Heart-opening aromatic — sattvic Ayurvedic quality; uplifts mood, clears heaviness and supports prana',
    ],
    secondary_benefits: [
      'Breath freshener and oral antimicrobial via volatile oil action',
      'Anti-inflammatory and antioxidant via phenolic compounds and flavonoids',
      'Metabolic energy regulation — preclinical data on mitochondrial oxidative metabolism',
      'Traditional chai and Middle Eastern spice with centuries of safe food-medicine use',
    ],
    pharmacology:
      'Primary bioactives: essential oil (2–8% in seeds; dominated by 1,8-cineole/eucalyptol — bronchodilatory, mucolytic, anti-inflammatory, antimicrobial; α-terpinyl acetate — antispasmodic, characteristic sweet-spicy aroma; limonene, linalool, sabinene — carminative, antioxidant), phenolic compounds and flavonoids (antioxidant, anti-inflammatory; cardiometabolic and endothelial benefit). Clinical RCT evidence: 3 g/day cardamom for 12 weeks showed decreased systolic and diastolic BP, improved insulin resistance, reduced hs-CRP, improved triglycerides. Ayurvedic "Queen of Spices" — 3000+ years use. Balances Vata and Kapha; sattvic and prana-enhancing.',
    flavor_profile: 'Sweet, pungent, warm and eucalyptus-citrus aromatic — distinctively complex and uplifting',
    contraindications: [
      'Active peptic ulcers or GERD — warming aromatic oils may aggravate in high doses; use with food',
      'High Pitta constitution — warming nature may aggravate in hot, inflamed constitutions',
      'Gallstones — choleretic action; mild caution; consult provider',
      'Generally very safe — food-spice safety profile at typical doses',
    ],
    herb_to_herb_synergy: [
      'Ginger and Cinnamon — triple warming digestive and cardiometabolic spice protocol',
      'Fennel and Peppermint — comprehensive digestive carminative formula',
      'Cloves — warming antimicrobial and digestive spice combination',
      'Ashwagandha — warming nourishing adaptogenic rasayana blend',
    ],
    herb_to_herb_caution: [
      'Other warming spices at high combined doses in hot, inflamed constitutions',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — cardiometabolic improvement may affect glucose; monitor',
      'Antihypertensives — blood pressure effects at 3 g/day; monitor BP',
      'No significant drug interactions at culinary doses',
    ],
    herb_interactions: [
      'Synergy: Ginger, Cinnamon, Fennel, Peppermint, Cloves, Ashwagandha',
      'Caution: other warming spices in hot constitutions',
      'Drug interactions: diabetes meds and antihypertensives at medicinal doses (monitor); culinary doses minimal interaction',
    ],
    dosage_range:
      'Tincture: 20–40 drops, 2–3× daily. Culinary use: 1–3 pods or 1/4–1/2 teaspoon seeds daily in food and tea — pleasant, sustainable food-medicine. Medicinal dose: up to 3 g seeds daily for cardiometabolic protocols (with monitoring). Crush pods fresh before steeping for maximum volatile oil release.',
    spiritual_layer:
      'Cardamom is the Queen of Spices — 3000 years of Ayurvedic reverence for her sattvic, prana-enhancing nature. She grows in the misty forests of the Western Ghats, her pods ripening slowly to perfection. She is a heart-opener — warming without aggravating, uplifting without overstimulating, clearing heaviness while protecting the mucosa. In Ayurveda she is considered "good for the mind and heart" — precisely because she is both warming and sweet, both activating and grounding. She teaches that true warmth opens rather than burns, that the heart can be bright and calm simultaneously. She whispers: I warm your heart and clear your mind. My sweetness uplifts. My warmth opens. I am the queen who serves.',
    best_preparation:
      'Freshly crushed pods steeped in hot milk or tea — most aromatic and effective traditional form. Whole pods used in cooking. Tincture for convenient daily use. Combine with Ginger and Cinnamon for a warming spice trinity. Excellent in chai protocols and tonic elixirs.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety — 3000+ years culinary and Ayurvedic use. Excellent for digestive support, respiratory clearing, cardiometabolic modulation and mood elevation. Safe food-medicine for most populations. Minor caution with active GERD/ulcers and high Pitta constitution.',
  },

  // ─────────────────────────────────────────────
  // CATUABA
  // ─────────────────────────────────────────────
  {
    id: 218,
    name: 'Catuaba',
    botanical: 'Anemopaegma mirandum (bark — sustainably wild-crafted Amazonian)',
    tcm_meridians: ['Kidney', 'Liver', 'Heart'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Dry', 'Stimulating', 'Arousal-Promoting', 'Energy-Building', 'Confidence-Activating'],
    primary_functions: [
      'Sexual vitality and arousal — catuabine alkaloids provide mild sympathomimetic activation; increased blood flow to sexual organs',
      'Sexual endurance and performance — sustained sympathetic tone supports sexual stamina without fatigue',
      'Mood elevation and confidence — dopamine and norepinephrine modulation; uplifting and embodied presence',
      'Energy building — warming, activating effect without agitation or jitteriness',
      'Traditional Amazonian aphrodisiac — 400+ years indigenous use; regional reputation as the "Viagra of the Amazon"',
    ],
    secondary_benefits: [
      'Antioxidant neuroprotection via flavonoids — cognitive and neural protection',
      'Antimicrobial via tannins — gut health and infection resistance support',
      'Post-illness energy restoration — warming, stimulating properties support recovery',
      'Emotional lightness and social ease as secondary benefit',
    ],
    pharmacology:
      'Primary bioactives: alkaloids (catuabine and related catecholamine-like compounds 0.5–1%; mild sympathomimetic — sustained dopamine and norepinephrine modulation; NOT adrenaline-like spike; stimulating without agitation; sexual arousal and confidence activation), flavonoids (antioxidant 2–3%; neuroprotective; anti-inflammatory), tannins (astringent 3–5%; antimicrobial; tissue support), volatile oils (warming aromatic compounds; mood-lifting). 400+ years Amazonian indigenous traditional use. Modern research 15+ studies. Chemistry still being fully characterised. Sustainability concern: wild-harvested from Amazon; support sustainably sourced products.',
    flavor_profile: 'Warm, earthy, slightly bitter and aromatically distinctive',
    contraindications: [
      'Pregnancy — CAUTION: alkaloid content; consult prenatal provider; likely avoid therapeutic doses',
      'Breastfeeding — CAUTION: alkaloid transfer theoretical; consult provider',
      'Cardiovascular conditions — mild sympathomimetic; consult cardiologist if significant heart disease',
      'Severe anxiety or agitation — stimulating nature may exacerbate; assess individual response',
      'Sustainability: support only sustainably wild-crafted or cultivated sources; wild-harvesting threatens Amazonian populations',
    ],
    herb_to_herb_synergy: [
      'Damiana — combined Amazonian-Mexican sexual vitality protocol; complementary alkaloid profiles',
      'Muira Puama — traditional Amazonian sexual tonic combination; powerful synergy',
      'Ashwagandha — grounding adaptogenic plus sexual confidence and testosterone support',
      'Maca — comprehensive sexual vitality and hormonal support stack',
      'Ginkgo — enhanced peripheral circulation amplifying blood flow effects',
    ],
    herb_to_herb_caution: [
      'Other stimulant herbs at high combined doses — overstimulation risk',
      'Other sympathomimetic herbs — cumulative cardiovascular effects; monitor',
    ],
    herb_to_drug_interactions: [
      'Cardiovascular medications — mild sympathomimetic; monitor with prescriber',
      'Stimulant medications — potential additive effects; monitor',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Damiana, Muira Puama, Ashwagandha, Maca, Ginkgo',
      'Caution: stimulant herbs at high combined doses; cardiovascular herb stacking',
      'Drug interactions: cardiovascular meds (monitor), stimulant meds (monitor); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 20–40 drops, 1–2× daily. Decoction: 1–2 g dried bark per 250 ml, simmer 15 minutes, 1–2× daily. Best taken 1–2 hours before desired acute effect. Cumulative baseline improvement over 2–4 weeks of consistent use.',
    spiritual_layer:
      'Catuaba is the Amazonian tree of awakened masculine vitality — 400 years of indigenous reverence for the bark that ignites dormant life force. She grows in the deep Amazon as a woody climber, her bark concentrating the forest\'s vital power into concentrated alkaloids that warm from the inside. She teaches that sexual vitality is not separate from spiritual power — that the same life force that animates sexuality also animates creativity, courage and authentic presence. She is not about performance but about awakening. She whispers: Your vitality is not lost, only sleeping. I warm the embers. Your fire returns. Your confidence rises. You are alive in your body.',
    best_preparation:
      'Tincture from sustainably sourced bark for convenient daily use. Decoction for traditional preparation. Always verify sustainable sourcing. Pairs powerfully with Damiana for a comprehensive sexual vitality protocol. Best taken consistently over 2–4 weeks for cumulative baseline improvement rather than acute single-dose use.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Generally safe with 400+ years traditional use. Excellent for sexual vitality, confidence and energy building. Caution in pregnancy and with cardiovascular conditions. Sustainability: wild-harvested Amazonian herb — support sustainably sourced products only. Effects cumulative over 2–4 weeks.',
  },

  // ─────────────────────────────────────────────
  // CAYENNE
  // ─────────────────────────────────────────────
  {
    id: 219,
    name: 'Cayenne',
    botanical: 'Capsicum annuum (dried fruit — potency measured in Scoville Heat Units)',
    tcm_meridians: ['Heart', 'Spleen', 'Liver'],
    tcm_element: 'Fire',
    energetics: ['Very Warm', 'Very Dry', 'Moving', 'Penetrating', 'Activating', 'Transforming', 'Fierce'],
    primary_functions: [
      'Circulation catalyst — capsaicin TRPV1 receptor agonism causes genuine thermogenesis and vasodilation',
      'Topical analgesic — TRPV1 desensitisation depletes Substance P; effective for chronic musculoskeletal and neuropathic pain',
      'Metabolic activation — sympathetic stimulation increases oxygen consumption, ATP production and metabolic rate',
      'Digestive fire ignition — stimulates HCl, digestive enzymes and bile; carminative and warming',
      'Cardiovascular protective — improves blood flow, reduces platelet aggregation and supports vascular health',
    ],
    secondary_benefits: [
      'Antioxidant and anti-inflammatory via carotenoids (β-carotene, lycopene) and flavonoids',
      'Vitamin C — high content supports immune function and antioxidant defence',
      'Weight management support — thermogenic calorie expenditure increase (modest)',
      'Cold extremities and Raynaud\'s support through circulatory activation',
    ],
    pharmacology:
      'Primary bioactive: capsaicinoids (0.05–0.3%; capsaicin 70–90% of total — binds TRPV1 receptors; triggers genuine metabolic heat increase via mitochondrial uncoupling; vasodilation; simultaneous dual mechanism for analgesia: acute activation then TRPV1 desensitisation depletes Substance P over 3–7 days of topical application), carotenoids (β-carotene, α-carotene, lycopene — antioxidant, tissue protection), flavonoids (quercetin, luteolin — anti-inflammatory, antioxidant), vitamins C and B. 5000+ years Mesoamerican traditional use; 300+ modern studies. Topical cream (0.025–0.075% capsaicin) is evidence-based for arthritis and neuropathic pain.',
    flavor_profile: 'Intensely hot, pungent and warming — heat intensity varies by Scoville rating',
    contraindications: [
      'GI ulcers, active GERD or irritable bowel syndrome — internal capsaicin aggravates inflamed mucosa; avoid internal use or use with extreme caution',
      'Topical use near eyes, broken skin or mucous membranes — AVOID: intense irritation and pain',
      'Pregnancy — high doses as potential uterine stimulant; culinary amounts likely safe; therapeutic doses: consult provider',
      'ACE inhibitor medications — capsaicin may cause or worsen cough (synergistic effect)',
      'Aspirin and antiplatelets — mild additive antiplatelet effect; monitor',
      'Blood thinners — mild anticoagulant activity; monitor',
    ],
    herb_to_herb_synergy: [
      'Ginger — combined circulatory warming and digestive fire activation',
      'Turmeric and Black Pepper — anti-inflammatory and metabolic synergy',
      'Devil\'s Claw — warming plus anti-inflammatory for musculoskeletal pain protocols',
      'Cinnamon — metabolic activation and warming spice stack',
    ],
    herb_to_herb_caution: [
      'Other warming stimulants at high combined doses — potential GI irritation and overstimulation',
      'Other anticoagulant herbs — cumulative blood-thinning effect',
    ],
    herb_to_drug_interactions: [
      'ACE inhibitors — may increase cough; monitor',
      'Anticoagulants and antiplatelets — mild additive effect; monitor',
      'Diabetes medications — metabolic activation may affect glucose; monitor',
      'Theophylline — may increase absorption; monitor',
    ],
    herb_interactions: [
      'Synergy: Ginger, Turmeric, Black Pepper, Devil\'s Claw, Cinnamon',
      'Caution: GI-irritating herbs in sensitive individuals; anticoagulant herb stacking',
      'Drug interactions: ACE inhibitors (cough), anticoagulants (monitor), diabetes meds (monitor)',
    ],
    dosage_range:
      'Tincture: 5–20 drops in warm water, 1–2× daily (start very low and titrate). Culinary: gradual integration into food. Topical cream (0.025–0.075% capsaicin): apply 3–4× daily for 3–7 days for analgesic desensitisation. Internal: always with food to minimise GI irritation.',
    spiritual_layer:
      'Cayenne is the fierce fire teacher — 5000 years of Mesoamerican reverence for the fruit that transforms, ignites and catalyses. She is not subtle. She demands that you wake up, that you activate, that you move what has become stuck and frozen. She is the herb for times when gentleness has failed, when the cold has gone too deep, when the circulation needs to be commanded rather than coaxed. She teaches that transformation sometimes requires fierce medicine, that fire can heal what warmth cannot reach, that activation is a form of love when directed wisely. She whispers: Wake up. Circulate. Move the frozen places. Your body can generate its own fire. I show you how.',
    best_preparation:
      'Topical capsaicin cream for musculoskeletal and neuropathic pain — most evidence-based application. Internal as culinary spice — most sustainable and pleasant. Tincture in warm water for circulatory and metabolic protocols. Always start low internally and titrate to tolerance. Never use near eyes or broken skin.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Very safe at culinary doses with 5000+ years use. Topical capsaicin cream evidence-based for arthritis and neuropathic pain. Internal medicinal doses: caution with GI conditions. Avoid near mucous membranes and eyes. Excellent for circulation, metabolism, pain and digestive fire when used appropriately.',
  },

  // ─────────────────────────────────────────────
  // CHAMOMILE
  // ─────────────────────────────────────────────
  {
    id: 128,
    name: 'Chamomile',
    botanical: 'Matricaria chamomilla (German) / Chamaemelum nobile (Roman) (flower heads)',
    tcm_meridians: ['Spleen', 'Stomach', 'Liver', 'Heart'],
    tcm_element: 'Earth + Fire',
    energetics: ['Warm', 'Moist', 'Sweet', 'Gentle', 'Soothing', 'Nervine-Tonifying'],
    primary_functions: [
      'Nervous system soothing via apigenin GABA-A receptor modulation — gentle calm without sedation or dependence',
      'Sleep quality improvement — mild anxiolytic and parasympathetic activation supports sleep onset and depth',
      'Digestive anti-inflammatory and antispasmodic — soothes gastritis, IBS, cramping and colic',
      'Anxiety and nervous tension relief — foundational nervine safe for continuous daily long-term use',
      'Anti-inflammatory via azulene, bisabolol and flavonoids — systemic and topical tissue support',
    ],
    secondary_benefits: [
      'Menstrual cramp relief through antispasmodic and anti-inflammatory action',
      'Skin healing — topical anti-inflammatory for eczema, dermatitis and wound support',
      'Immune modulation via polysaccharides and antioxidant flavonoids',
      'Mood elevation and emotional ease through gentle nervine action',
      'Fever support — mild antipyretic action in acute illness',
    ],
    pharmacology:
      'Primary bioactives: apigenin (GABA-A receptor ligand — primary anxiolytic mechanism; NOT direct agonist like benzodiazepines; modulates without dependency or tolerance), bisabolol and matricin/chamazulene (anti-inflammatory; wound healing; tissue regeneration), azulene (distinctive blue in steam-distilled oil; anti-inflammatory; antipruritic), flavonoids (quercetin, luteolin; antioxidant; anti-inflammatory), polysaccharides (immune-modulating). Grade A evidence for anxiety, sleep and digestive support. German Commission E monograph. Safe for all ages including pregnancy and breastfeeding. Apigenin produces gentle calm distinctly different from pharmaceutical anxiolytics — no sedation, dependence or cognitive impairment.',
    flavor_profile: 'Sweet, apple-like, gently warm and very palatable — one of the most pleasant medicinal herbs',
    contraindications: [
      'Rare Asteraceae allergy — cross-reactivity with ragweed; patch test if ragweed-allergic; discontinue if reaction',
      'No other significant contraindications — safe in pregnancy and breastfeeding',
      'Warfarin — theoretical coumarin interaction at very high doses; standard tea doses negligible concern',
    ],
    herb_to_herb_synergy: [
      'Passionflower and Lemon Balm — comprehensive anxiety and nervine protocol',
      'Lavender — sleep and emotional ease stack',
      'Fennel and Peppermint — digestive cramping and IBS relief formula',
      'Valerian — deeper sleep support when chamomile insufficient alone',
      'Rose — heart-opening and emotional ease blends',
    ],
    herb_to_herb_caution: [
      'No known herb-to-herb cautions — safe with all herbs',
    ],
    herb_to_drug_interactions: [
      'Warfarin — very high doses theoretical coumarin interaction; standard tea doses negligible',
      'Benzodiazepines — mild additive GABAergic effect; usually complementary not problematic',
      'No other clinically significant drug interactions at standard doses',
    ],
    herb_interactions: [
      'Synergy: Passionflower, Lemon Balm, Lavender, Fennel, Peppermint, Valerian, Rose',
      'Caution: None known',
      'Drug interactions: warfarin at very high doses (negligible at standard tea); benzodiazepines (mild additive — usually beneficial)',
    ],
    dosage_range:
      'Tincture: 20–40 drops, 2–4× daily including before bed. Tea: 2–4 g dried flower per 250 ml, steep 5–10 minutes, 2–4× daily. Safe for continuous long-term use. For children: half adult dose. For infants with colic: dilute tea, small amounts under paediatric guidance.',
    spiritual_layer:
      'Chamomile is the gentle healer — the ancient medicine of ease and childhood comfort, the grandmother tea of every European tradition. She is the Sun\'s flower that calms rather than activates, warms rather than burns, grounds rather than sedates. She has been soothing nervous systems since before memory — in medieval monastery gardens, on farmhouse windowsills, in mother\'s cupboards across centuries. She teaches that rest is productive, that gentleness is strength, that the nervous system remembers safety and can be taught it again with patient, consistent care. She whispers: You are safe to rest. Your body knows how to heal. Gentleness is enough. Let the tension dissolve.',
    best_preparation:
      'Fresh or dried flower infusion as daily tea — most pleasant, most traditional, most safe for long-term use. Honey enhances the soothing effect. Blended with Passionflower for enhanced sleep support. Topical poultice or compress for skin healing. Tincture for convenient dosing.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety and efficacy — clinically proven safe and effective for anxiety, sleep, digestion and immune support. Suitable for all ages including pregnancy, breastfeeding and infants under guidance. No significant contraindications or drug interactions at standard doses. One of the most universally well-tolerated herbs in the world.',
  },

  // ─────────────────────────────────────────────
  // DEVIL'S CLAW
  // ─────────────────────────────────────────────
  {
    id: 220,
    name: "Devil's Claw",
    botanical: 'Harpagophytum procumbens (dried secondary tuberous roots)',
    tcm_meridians: ['Liver', 'Kidney', 'Spleen'],
    tcm_element: 'Wood + Water',
    energetics: ['Cool', 'Bitter', 'Anti-inflammatory', 'Analgesic', 'Drying', 'Damp-Resolving'],
    primary_functions: [
      'Osteoarthritis analgesia — harpagoside and harpagide inhibit COX-2, LOX and TNF-α; pain reduction comparable to low-dose NSAIDs in trials',
      'Chronic low back pain relief — multiple RCTs show moderate benefit for pain and functional improvement',
      'Anti-inflammatory modulation — iridoid glycosides reduce inflammatory markers and joint swelling',
      'Digestive bitter — stimulates digestive secretions; traditional choleretic and hepatic tonic',
      'Possible chondroprotective effects — preliminary in vitro data on cartilage metabolism protection',
    ],
    secondary_benefits: [
      'Potential reduction in NSAID requirement for joint pain management',
      'Gout support through anti-inflammatory and mild uricosuric action',
      'Tendon and connective tissue anti-inflammatory support',
      'Traditional "desert joint medicine" from Kalahari healing traditions',
    ],
    pharmacology:
      'Primary bioactives: iridoid glycosides — harpagoside (primary active, 2.7% in standardised extract), harpagide, procumbide (anti-inflammatory via COX-2 and LOX inhibition, TNF-α reduction; analgesic through peripheral and possibly central mechanisms). Supporting: phenolic acids and flavonoids (antioxidant), triterpenes (anti-inflammatory). Multiple clinical trials and observational studies: 600–1200 mg extract (standardised to 2.7% harpagoside) comparable to low-dose NSAIDs for OA and low back pain. Grade B+ for OA and chronic back pain analgesia. Sustainability concern: correct species identification and sustainable harvesting from Kalahari region essential.',
    flavor_profile: 'Intensely bitter — characteristic iridoid glycoside signature',
    contraindications: [
      'Gastric or duodenal ulcers — bitter and irritant; may aggravate; AVOID or use with extreme caution',
      'Severe gastritis — same concern as ulcers; assess individually',
      'Gallstones — increases bile flow; theoretical provocation risk; caution',
      'Pregnancy — insufficient safety data; AVOID',
      'Breastfeeding — insufficient data; AVOID',
      'Cardiovascular disease — some concerns about blood pressure and heart rate changes at high doses; monitor',
    ],
    herb_to_herb_synergy: [
      'Turmeric and Boswellia — comprehensive anti-inflammatory joint protocol; complementary mechanisms',
      'Ginger — warming anti-inflammatory synergy for cold-pattern joint pain',
      'Cayenne — combined circulation and analgesia for musculoskeletal support',
      'Cat\'s Claw — combined anti-inflammatory and immune-modulating action',
    ],
    herb_to_herb_caution: [
      'Other COX-inhibiting herbs at high combined doses in GI-sensitive individuals',
      'Other blood pressure-affecting herbs with cardiovascular disease',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets — theoretical anti-inflammatory activity increases bleeding risk; monitor',
      'Hypoglycaemic medications — one trial suggested possible blood glucose effects; monitor in diabetics',
      'Antihypertensives — possible blood pressure effects at high doses; monitor',
    ],
    herb_interactions: [
      'Synergy: Turmeric, Boswellia, Ginger, Cayenne, Cat\'s Claw',
      'Caution: GI-sensitive individuals with multiple bitter/COX-inhibiting herbs',
      'Drug interactions: anticoagulants (monitor), hypoglycaemics (monitor), antihypertensives at high doses (monitor)',
    ],
    dosage_range:
      'Standardised extract: 600–1200 mg (standardised to approximately 50–100 mg harpagoside) per day in divided doses, 2–3× daily. Decoction: 1–2 tsp cut root per 250 ml, simmer 15–20 minutes, 2–3× daily. Minimum 8 weeks for full therapeutic assessment. Best combined with movement, anti-inflammatory diet and complementary herbs.',
    spiritual_layer:
      'Devil\'s Claw grows in the Kalahari desert, its distinctive hooked seed pods designed to cling and be carried — the plant that disperses through attachment, that travels by holding on. She carries Kalahari healing wisdom: the medicine of releasing the grinding grip of chronic pain, of untwisting what has become locked and immobile. She teaches that long-standing pain can be eased by patient, steady cooling and untwisting — that what has calcified and hardened can soften again. She whispers: The grip of pain loosens. My joints remember how to move with ease. The inflammatory fire cools. I find space within what was locked.',
    best_preparation:
      'Standardised extract for reliable harpagoside content — most important for therapeutic dosing. Best as part of a comprehensive anti-inflammatory strategy including movement therapy, weight management and dietary changes. Screen for GI ulcers and gallstones before recommending. Minimum 8 weeks before full benefit assessment.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Evidence-based herb for OA and chronic low back pain. Grade B+ for analgesia — multiple RCTs show benefit comparable to low-dose NSAIDs. Contraindicated in GI ulcers, pregnancy and active gallstones. Monitor cardiovascular status at higher doses. Minimum 8–12 weeks for therapeutic assessment.',
  },

  // ─────────────────────────────────────────────
  // ECHINACEA
  // ─────────────────────────────────────────────
  {
    id: 221,
    name: 'Echinacea',
    botanical: 'Echinacea purpurea (aerial parts + root) / Echinacea angustifolia (root — most potent)',
    tcm_meridians: ['Lung', 'Spleen', 'Heart'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Dry', 'Bitter', 'Stimulating', 'Immune-Activating', 'Acute-Responsive'],
    primary_functions: [
      'Acute cold and flu duration reduction — 100+ RCTs confirm 1–2 day reduction when started within 12–24 hours of symptoms',
      'Rapid immune overstimulation — alkamides and polysaccharides dramatically enhance macrophages, NK cells, interferon-γ and TNF-α within hours',
      'Symptom severity reduction — reduces sore throat, cough, fatigue and body ache severity during acute illness',
      'Upper respiratory infection support — adjunctive acute antimicrobial via polysaccharide macrophage activation',
      'Early intervention specialist — efficacy critically dependent on starting within 12–24 hours of first symptoms',
    ],
    secondary_benefits: [
      'Short-term immune support during high exposure periods (sick contacts)',
      'Post-infection recovery support for 1–2 weeks maximum',
      'Topical antimicrobial for wound care (E. purpurea aerial parts)',
    ],
    pharmacology:
      'Primary bioactives: alkamides (echinacein, isobutylamides 0.05–0.3%; bioavailable; immune stimulation via interferon and TNF-α; marker of quality — peppery tingling taste indicates presence), polysaccharides (arabinogalactans 10–20%; dramatically activate macrophages, NK cells, T-cells, interferon-γ — OVERSTIMULATING compared to Astragalus balanced enhancement). KEY DISTINCTION: Echinacea OVERSTIMULATES (acute boost above baseline) while Astragalus BALANCES (foundational strengthening without overshoot). CRITICAL: efficacy depends on timing — start within 12–24 hours; delayed use is minimally effective. TOLERANCE develops with continuous use; NOT for daily prevention or long-term.',
    flavor_profile: 'Bitter with distinctive peppery-pungent tingling (alkamide quality marker)',
    contraindications: [
      'Autoimmune diseases (RA, lupus, MS, Hashimoto\'s) — ABSOLUTELY CONTRAINDICATED: immune overstimulation triggers flares; documented adverse effects',
      'Immunosuppressants (organ transplant) — ABSOLUTELY CONTRAINDICATED: counteracts immunosuppression; rejection risk',
      'Ragweed or Asteraceae allergy — CONTRAINDICATED: significant cross-reactivity; allergic reaction risk',
      'Daily use or prevention — CONTRAINDICATED: tolerance develops; becomes ineffective acutely; immune exhaustion possible',
      'Long-term use — NOT RECOMMENDED: overstimulation; tolerance; use Astragalus instead for foundational immune support',
      'Pregnancy — AVOID concentrated forms: mixed safety data',
      'Breastfeeding — CAUTION: insufficient data',
    ],
    herb_to_herb_synergy: [
      'Elderberry — combined acute antiviral and immune activation at first sign of illness',
      'Black Cumin — complementary immune mechanisms during acute infection',
      'Ginger and Elderflower — warming antimicrobial and antiviral acute infection formula',
    ],
    herb_to_herb_caution: [
      'Astragalus — DO NOT COMBINE: conflicting mechanisms (Echinacea overstimulates; Astragalus balances); choose one',
      'Other immune-stimulating herbs in autoimmune patients — cumulative overstimulation',
      'Ginseng, high-dose mushrooms — excessive combined immune activation',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — ABSOLUTELY CONTRAINDICATED: counteracts immunosuppression; transplant rejection risk',
      'CYP450 substrate drugs — theoretical minor interaction; generally not clinically significant at standard doses',
    ],
    herb_interactions: [
      'Synergy: Elderberry, Black Cumin, Ginger, Elderflower (acute illness protocols)',
      'Caution: DO NOT combine with Astragalus; avoid in autoimmune patients with immune-stimulating herbs',
      'Drug interactions: immunosuppressants (ABSOLUTELY CONTRAINDICATED); otherwise minimal',
    ],
    dosage_range:
      'Tincture (fresh plant — most potent): 60–90 drops every 1–2 hours for first 12–24 hours at onset, then 3–4× daily for 5–10 days total. MAXIMUM 7–10 days continuous use. NEVER for daily prevention. Start within 12–24 hours of first symptoms for efficacy.',
    spiritual_layer:
      'Echinacea is the warrior herb — Purple Coneflower, native American sacred plant whose bold purple flowers face the sun with fierce confidence. She is not subtle and she is not for every day. She is the defender who steps forward when the boundary has been breached, the immune warrior called up in an acute moment of need. She teaches that fierce protection is temporary — that the warrior cannot always be at full activation, that rest is required between battles. She is for the acute moment only. She whispers: I am strong. My immune is fierce. I fight infection. I recover swiftly. Then rest — I am acute-only medicine.',
    best_preparation:
      'Fresh plant tincture most potent (highest alkamide and polysaccharide concentration). TIMING IS EVERYTHING: start at first symptom, within 12–24 hours. Use intensively for first 24 hours, then standard dosing for 5–10 days. Never use preventively or daily. Screen for autoimmune, immunosuppression and Asteraceae allergy before recommending.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A evidence for cold duration reduction (100+ RCTs). ACUTE USE ONLY — 7–10 days maximum. Absolute contraindication in autoimmune disease, immunosuppression and Asteraceae allergy. Timing-critical: start within 12–24 hours. Never for daily prevention or long-term use. Use Astragalus for foundational immune support instead.',
  },

  // ─────────────────────────────────────────────
  // CALENDULA (UPDATED)
  // ─────────────────────────────────────────────
  {
    id: 106,
    name: 'Calendula',
    botanical: 'Calendula officinalis (flower heads — petals only)',
    tcm_meridians: ['Heart', 'Liver'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Dry', 'Stimulating', 'Healing', 'Radiant', 'Lymph-Moving'],
    primary_functions: [
      'Topical wound healing — carotenoids stimulate fibroblasts (collagen synthesis), angiogenesis and re-epithelialisation',
      'Skin anti-inflammatory — soothes eczema, dermatitis, sunburn and inflamed skin conditions',
      'Lymphatic movement — polysaccharides activate macrophages; improve lymphatic drainage and reduce lymph stagnation',
      'Topical antimicrobial — volatile oils prevent wound infection; broad-spectrum antibacterial activity',
      'Scar tissue reduction — collagen remodelling and tissue regeneration with consistent topical use',
    ],
    secondary_benefits: [
      'Capillary strengthening — flavonoids improve microcirculation and vascular integrity',
      'Internal lymphatic and immune support — tea or tincture for systemic lymphatic movement',
      'Anti-inflammatory for internal use — digestive and systemic inflammation support',
      'Vascular support — capillary resilience and skin health',
    ],
    pharmacology:
      'Primary bioactives: carotenoids (lutein, zeaxanthin, β-carotene 30–40%; antioxidant; anti-inflammatory; fibroblast stimulation), flavonoids (isorhamnetin, quercetin, kaempferol 10–15%; antioxidant; anti-inflammatory; vascular support), polysaccharides (macrophage activation; lymphatic stimulation; immune enhancement), volatile oils (2–3%; antimicrobial; wound healing support). German Commission E monograph for wound healing. Grade A topical wound healing; Grade B+ skin inflammation; Grade B lymphatic support. CRITICAL: ragweed allergy screening essential (Asteraceae cross-reactivity).',
    flavor_profile: 'Slightly bitter, warm and gently aromatic — pleasant as infusion',
    contraindications: [
      'Ragweed or Asteraceae allergy — CRITICAL: significant cross-reactivity; patch test before topical use; AVOID if strongly ragweed-allergic',
      'Internal use in pregnancy — THEORETICAL uterine-stimulating activity; topical use safe throughout; internal avoid',
      'Breastfeeding — topical safe; internal limited data; caution',
      'Immunosuppressants — polysaccharides partially stimulate immune function; theoretical interaction; monitor',
    ],
    herb_to_herb_synergy: [
      'Broadleaf Plantain — powerful topical wound-healing duo; complementary vulnerary mechanisms',
      'Comfrey — topical wound healing (external use only — avoid internal Comfrey)',
      'Cleavers and Red Root — internal lymphatic support formula',
      'Turmeric and Ginger — anti-inflammatory and immune support stack',
    ],
    herb_to_herb_caution: [
      'Immune-stimulating herbs in autoimmune conditions — polysaccharide immune activation',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — theoretical partial counteraction via macrophage activation; monitor',
      'Topical use has minimal systemic absorption; interaction risk very low',
    ],
    herb_interactions: [
      'Synergy: Plantain, Comfrey (external), Cleavers, Red Root, Turmeric, Ginger',
      'Caution: immune-stimulating herbs in autoimmune contexts',
      'Drug interactions: immunosuppressants (internal — monitor); topical interaction risk negligible',
    ],
    dosage_range:
      'Topical: infused oil or salve applied 2–3× daily to wounds, eczema or scarring. Tincture topical application for acute wounds. Internal tincture: 30–60 drops, 2–3× daily for lymphatic support (with ragweed allergy screen). Tea: 1–2 tsp dried flowers steeped 10 minutes, 2–3× daily for internal use.',
    spiritual_layer:
      'Calendula is the Sun\'s flower — radiant, warm, opening. Medieval herbalists dedicated her to the Virgin Mary ("Calendar" = Marian festival dates), recognising in her golden brightness a quality of divine warmth and healing grace. She opens toward the sun and closes with evening — a daily practice of expansion and drawing in. She teaches that healing flows through warmth, light and opening to transformation; that scars — physical and emotional — can be remodelled into integrated wisdom rather than fixed wounds. She whispers: My skin heals. My wounds close. Scars become wisdom. I am warm and radiant. I open to transformation. I am whole.',
    best_preparation:
      'Infused oil (dried flowers in carrier oil steeped 2–4 weeks) most studied and effective topical form. Salve for portable wound-healing application. Tincture for internal lymphatic use. Screen for ragweed allergy before recommending. Topical use primary; internal use emerging but less studied.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A topical wound healing — German Commission E monograph. Excellent first-aid herb and skin regeneration specialist. CRITICAL: ragweed allergy screening before topical use. Internal use safe at standard doses when ragweed allergy excluded. Pregnancy: topical safe throughout; internal therapeutic doses avoid.',
  },

  // ─────────────────────────────────────────────
  // CARAWAY
  // ─────────────────────────────────────────────
  {
    id: 222,
    name: 'Caraway',
    botanical: 'Carum carvi (dried fruits — seeds)',
    tcm_meridians: ['Spleen', 'Stomach', 'Lung', 'Large Intestine'],
    tcm_element: 'Earth + Fire',
    energetics: ['Warm', 'Dry', 'Pungent', 'Aromatic', 'Carminative', 'Spasmolytic'],
    primary_functions: [
      'Digestive carminative — d-carvone and d-limonene relax GI smooth muscle; relieves gas, colic and bloating',
      'GI antispasmodic — reduces intestinal cramping and hypermotility; IBS and functional dyspepsia support',
      'Infant colic support — traditional gripe water preparation; topical abdominal application',
      'Mild expectorant — respiratory aromatic support for catarrh and productive cough with cold-damp pattern',
      'Traditional galactagogue — used in lactation blends (fennel, anise, fenugreek, caraway)',
    ],
    secondary_benefits: [
      'Mild antimicrobial via volatile oil action — d-carvone and limonene inhibit pathogenic bacteria and fungi',
      'Appetite stimulation for sluggish digestion and reduced appetite',
      'Traditional bread and sauerkraut spice — centuries of European food-medicine integration',
      'Anti-inflammatory and antioxidant via flavonoids and phenolic compounds',
    ],
    pharmacology:
      'Primary bioactives: essential oil (3–7% in fruits; d-carvone up to ~60% of oil — spasmolytic, carminative, antimicrobial; d-limonene ~20–30% — carminative, mild cholagogue, antimicrobial). Mechanism: GI smooth muscle relaxation independent of dose in some models — highly potent antispasmodic component. Traditional European and Middle Eastern carminative for flatulence, colic and infant digestive discomfort. Food-level safety at seed doses. Essential oil more potent: not for internal use in children, pregnancy or lactation.',
    flavor_profile: 'Warm, sweet-spicy, anise-like and distinctively aromatic — pleasant culinary spice',
    contraindications: [
      'Essential oil internal use in pregnancy — NOT RECOMMENDED: emmenagogue potential at high doses; seed tea safe',
      'Essential oil internal use in children under 18 — NOT RECOMMENDED: seed preparations safe with appropriate doses',
      'Essential oil internal use in breastfeeding — NOT RECOMMENDED: volatile oil potency; seed tea likely safe',
      'Apiaceae (parsley/carrot family) allergy — rare cross-reactivity; discontinue if reaction',
      'High-dose essential oil — can cause nausea, vomiting and CNS symptoms at excessive doses',
    ],
    herb_to_herb_synergy: [
      'Fennel and Peppermint — digestive carminative tea trinity',
      'Chamomile — combined antispasmodic and nervine digestive support',
      'Ginger — warming digestive activation and carminative synergy',
      'Anise — traditional infant colic blend',
    ],
    herb_to_herb_caution: [
      'No known significant herb-to-herb cautions at seed doses',
    ],
    herb_to_drug_interactions: [
      'No major drug interactions documented at seed doses',
      'Essential oil: theoretical interactions via increased GI motility affecting drug absorption',
    ],
    herb_interactions: [
      'Synergy: Fennel, Peppermint, Chamomile, Ginger, Anise',
      'Caution: None significant at seed doses',
      'Drug interactions: Minimal at seed doses; essential oil may affect drug absorption timing',
    ],
    dosage_range:
      'Adults: 1.5–6 g crushed seeds infused in 150 ml hot water, steeped 10–15 minutes, up to 3× daily. Infants (6–12 months): 0.06–1 g/day in appropriate liquid preparations (paediatric guidance). Essential oil (adults only): 0.15–0.3 ml/day maximum, avoid internally in pregnancy, lactation and under 18. Topical: 2% caraway oil in carrier applied to abdomen for infant colic.',
    spiritual_layer:
      'Caraway is the warm kitchen ally — a seed of comfort and release that has seasoned European bread, cheese and sauerkraut for centuries while quietly settling the digestion that processes them. She is the herb that turns heaviness into ease, stagnation into gentle movement, the knotted belly into softening comfort. She teaches that small aromatic seeds can shift the entire quality of digestion — that consistent, daily warming support prevents the stagnation that occasional dramatic interventions cannot fully resolve. She whispers: I digest life with warmth and ease. The knots unwind. Heaviness becomes movement. Comfort replaces tension.',
    best_preparation:
      'Fresh crushed seeds (crush just before steeping) as infusion — most aromatic and effective. Classic digestive tea with fennel and peppermint. Topical 2% oil in carrier for infant colic abdominal massage. Culinary integration in bread, cheese and fermented vegetables as sustainable daily food-medicine.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A- safety — widespread culinary use with low toxicity. Excellent reliable carminative for gas, bloating, colic and IBS-type symptoms. Essential oil requires careful dosing and is not for internal use in pregnancy, lactation or children. Seed/tea preparations safe for most populations including infants with appropriate dosing guidance.',
  },

  // ─────────────────────────────────────────────
  // CAT'S CLAW
  // ─────────────────────────────────────────────
  {
    id: 223,
    name: "Cat's Claw",
    botanical: 'Uncaria tomentosa (inner bark — sustainably harvested Peruvian Amazon)',
    tcm_meridians: ['Spleen', 'Liver', 'Kidney'],
    tcm_element: 'Earth + Wood',
    energetics: ['Warm', 'Bitter', 'Immune-Tonifying', 'Anti-Inflammatory', 'Detoxifying', 'DNA-Protective'],
    primary_functions: [
      'Balanced immune activation — oxindole alkaloids stimulate white blood cell proliferation and immune function',
      'Systemic anti-inflammatory — oxindole alkaloids and polyphenols reduce pro-inflammatory cytokines and NF-κB',
      'Arthritis and joint support — anti-inflammatory and immune-modulating action reduces joint pain and improves mobility',
      'DNA protective — alkaloids and polyphenols show preliminary DNA repair support and cellular integrity protection',
      'Detoxification support — polyphenols support phase I/II liver detoxification pathways',
    ],
    secondary_benefits: [
      'Constitutional immune strengthening over 4–8 weeks of consistent use',
      'Post-illness immune recovery — rebuilds immune baseline after serious infection',
      'Antioxidant cellular protection via polyphenol and tannin content',
      'Traditional longevity herb — centuries of Peruvian Amazon indigenous use for vitality and immunity',
    ],
    pharmacology:
      'Primary bioactives: oxindole alkaloids (POA, TOA and related compounds 0.3–0.8%; specific immune stimulation of white blood cell proliferation; anti-inflammatory via cytokine inhibition; preliminary DNA repair support), phenolic compounds and polyphenols (3–5%; antioxidant; anti-inflammatory), glycosides and additional immune modulators. 200+ modern studies. Sustainability CRITICAL: wild-harvested from Peru Amazon — overharvesting threatens populations; support cultivated or sustainably certified sources only.',
    flavor_profile: 'Bitter, woody and earthy — characteristic alkaloid signature',
    contraindications: [
      'Pregnancy — CAUTION: alkaloid content; uterine effects possible; consult prenatal provider; likely avoid therapeutic doses',
      'Breastfeeding — CAUTION: alkaloid transfer possible; consult provider',
      'Autoimmune disorders — immune stimulation may overstimulate autoimmune activity; consult provider; assess carefully',
      'Immunosuppressants (organ transplant) — immune activation may antagonise immunosuppression; consult prescriber',
      'SUSTAINABILITY: Wild-harvested from Peru Amazon — always support cultivated or sustainably certified sources',
    ],
    herb_to_herb_synergy: [
      'Astragalus — combined foundational and activating immune support stack',
      'Turmeric and Ginger — triple anti-inflammatory protocol for joint and systemic inflammation',
      'Black Cumin — immune tonification and antioxidant synergy',
      'Reishi and Shiitake mushrooms — comprehensive immune intelligence protocol',
    ],
    herb_to_herb_caution: [
      'Other immune-stimulating herbs in autoimmune patients — cumulative overstimulation',
      'Echinacea — both immune-stimulating; generally choose one or alternate rather than combine long-term',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — immune activation may antagonise; consult prescriber',
      'Blood pressure medications — alkaloid effects on blood pressure; monitor',
      'No other significant drug interactions well documented',
    ],
    herb_interactions: [
      'Synergy: Astragalus, Turmeric, Ginger, Black Cumin, Reishi, Shiitake',
      'Caution: immune-stimulating herbs in autoimmune; Echinacea (both stimulating — choose one for long-term)',
      'Drug interactions: immunosuppressants (consult), BP medications (monitor); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 20–40 drops, 1–2× daily. Decoction: 1–3 g dried inner bark, simmered 10–15 minutes, 1–2× daily. Effects cumulative over 4–8 weeks for immune and anti-inflammatory benefit. Safe long-term with sustainability awareness.',
    spiritual_layer:
      'Cat\'s Claw is the jungle warrior — a woody Amazonian climber whose distinctive claw-shaped thorns grip the forest canopy as it ascends toward light. She carries centuries of Peruvian indigenous wisdom about immune strength, survival and the fierce intelligence of the jungle. She teaches that deep immune activation is not aggression but connection — connecting to earth\'s healing intelligence, the immune wisdom of the rainforest itself. Her sustainability challenge is part of her teaching: we must protect what protects us. She whispers: My immunity is fierce. My body defends itself. I am connected to earth\'s healing. I protect what is wild within me and without.',
    best_preparation:
      'Decoction for traditional water extraction of alkaloids and polyphenols. Tincture for convenient daily dosing. Always verify sustainable sourcing — cultivated or certified sustainable only. Combine with Turmeric and Ginger for a comprehensive joint and immune anti-inflammatory protocol.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B immune activation and anti-inflammatory evidence with 200+ studies and centuries traditional use. Safe long-term with appropriate screening. SUSTAINABILITY CONCERN: wild-harvested Amazon herb — support cultivated sources only. Autoimmune and immunosuppressant caution. Effects cumulative over 4–8 weeks.',
  },

  // ─────────────────────────────────────────────
  // VITEX (CHASTE TREE)
  // ─────────────────────────────────────────────
  {
    id: 224,
    name: 'Vitex (Chaste Tree)',
    botanical: 'Vitex agnus-castus (dried berries)',
    tcm_meridians: ['Liver', 'Spleen', 'Uterus'],
    tcm_element: 'Wood + Earth',
    energetics: ['Neutral', 'Slightly Cool', 'Bitter', 'Pungent', 'Aromatic', 'Cycle-Regulating'],
    primary_functions: [
      'Pituitary dopaminergic modulation — diterpenes bind D2 receptors; reduce elevated prolactin and normalise luteal phase',
      'PMS and PMDD symptom relief — breast tenderness, irritability, mood swings and headaches; multiple RCTs confirmed',
      'Hyperprolactinaemia support — normalises prolactin, restores GnRH pulsatility, supports corpus luteum progesterone',
      'Menstrual cycle regulation — amenorrhoea and oligomenorrhoea where stress and elevated prolactin are factors',
      'PCOS adjunct — lowers elevated testosterone and normalises cycles in some PCOS presentations',
    ],
    secondary_benefits: [
      'Cyclic mastalgia (breast tenderness) relief — primary traditional indication with strong modern evidence',
      'Perimenopausal cyclic PMS and mood support',
      'Fertility support through restored ovulation in luteal phase defect',
      'Traditional "monk\'s pepper" — centuries of use for menstrual and reproductive regulation',
    ],
    pharmacology:
      'Primary bioactives: diterpenes (rotundifuran and related — dopamine D2 receptor agonists at pituitary; reduce prolactin secretion from anterior pituitary; normalise luteal phase progesterone; dose-dependent effects — low doses may increase prolactin, higher doses decrease), flavonoids (casticin, vitexin — antioxidant; receptor signalling modulation), essential oil and iridoids (minor roles). Dose-dependent endocrine effects: higher doses (20–40 mg standardised extract) are standard for PMS/prolactin work. Multiple RCTs: up to 93% of women reporting PMS improvement in some trials. Minimum 3 months for full effect.',
    flavor_profile: 'Bitter, pungent and aromatic — characteristic Mediterranean shrub',
    contraindications: [
      'Established pregnancy — NOT RECOMMENDED once pregnancy confirmed; stop at positive test; theoretical hormonal modulation',
      'Hormone-sensitive cancers (breast, uterine) — modulates oestrogen/progesterone balance; avoid without oncology approval',
      'Dopamine agonists (bromocriptine, cabergoline) — may blunt or amplify effects; coordinate with prescriber',
      'Dopamine antagonists (antipsychotics) — D2 agonism may counteract therapeutic effect; coordinate with psychiatrist',
      'Adolescents — hormonal axis still developing; use only under practitioner supervision',
      'Hormonal contraceptives — theoretical interaction; data mixed; most clinicians allow concurrent use with monitoring',
    ],
    herb_to_herb_synergy: [
      "Lady's Mantle — tissue tonification complement to hormonal regulation; comprehensive menstrual support",
      'Angelica (Dong Quai) — blood-moving and hormonal regulation combined women\'s cycle protocol',
      'Raspberry Leaf — uterine toning and cycle support stack',
      'Ashwagandha — adaptogenic HPA axis support combined with HPO axis modulation',
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic herbs — cumulative hormonal effects; monitor carefully',
      'Other prolactin-affecting herbs — unclear interactions; assess individually',
    ],
    herb_to_drug_interactions: [
      'Dopamine agonists (bromocriptine, cabergoline, levodopa) — may interfere with or amplify effects',
      'Antipsychotics (dopamine antagonists) — D2 agonism may counteract therapeutic effect; coordinate with psychiatrist',
      'Hormonal contraceptives — theoretical interaction; monitor cycles and symptoms',
    ],
    herb_interactions: [
      "Synergy: Lady's Mantle, Angelica, Raspberry Leaf, Ashwagandha",
      'Caution: other phytoestrogenic herbs (cumulative hormonal effects)',
      'Drug interactions: dopamine agonists and antagonists (coordinate with prescriber), hormonal contraceptives (monitor)',
    ],
    dosage_range:
      'Standardised extract: 20–40 mg daily once in the morning. Traditional tincture 1:5: 1–5 ml once daily morning. Minimum 3 months continuous use before full assessment; may continue 6–12 months. Take continuously through all cycle phases (not just luteal) for PMS and cycle regulation.',
    spiritual_layer:
      'Vitex is the cycle harmoniser — the Mediterranean shrub whose peppery berries were traditionally used by monks to dampen libido (hence "chaste tree") but whose deeper gift is rhythmic regulation, restoring the sacred dance of the menstrual cycle where stress, prolactin and hormonal chaos have disrupted it. She teaches that regulation is liberation — that reclaiming regular ovulation, clear phases and predictable cycles frees energy for creativity, insight and embodied life rather than monthly battle with one\'s own hormones. She whispers: My hormones move in wise rhythmic patterns. I release what distorts my cycle. My body\'s timing aligns with my deeper life rhythm. My cycle is restored.',
    best_preparation:
      'Standardised extract (20–40 mg) once daily in morning — most researched and reliable form. Traditional tincture for flexible dosing. Mandatory screening: confirm not pregnant; screen for dopamine-related medications and prolactinoma under endocrine care; ask about hormone-sensitive cancers. Minimum 3 months before assessing full benefit.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ evidence for PMS/PMDD and hyperprolactinaemia. Multiple RCTs confirm efficacy. CRITICAL screening: confirm not pregnant; discontinue at positive pregnancy test; screen for dopamine medications and hormone-sensitive cancers. Minimum 3 months for full assessment. Excellent targeted herb for specific hormonal patterns.',
  },

  // ─────────────────────────────────────────────
  // CHICKWEED
  // ─────────────────────────────────────────────
  {
    id: 225,
    name: 'Chickweed',
    botanical: 'Stellaria media (aerial parts — fresh or dried)',
    tcm_meridians: ['Lung', 'Liver', 'Spleen'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Moist', 'Mild', 'Salty-Green', 'Demulcent', 'Anti-Itch', 'Lymph-Moving'],
    primary_functions: [
      'Skin anti-itch and vulnerary — saponins, mucilage and anti-inflammatory compounds calm itching and irritation in eczema, psoriasis and rashes',
      'Demulcent anti-ulcer — mucilage and anti-inflammatory action protect gastric mucosa and support healing in gastritis and peptic ulcers',
      'Cooling and moistening — refrigerant action for hot, inflamed, hypersensitive tissues inside and out',
      'Lymph and damp-heat modulator — gently moves lymph, reduces heat-swollen glands and clears damp accumulation',
      'Mild diuretic and urinary soother — increases urine output and soothes urinary tract in hot, irritated states',
    ],
    secondary_benefits: [
      'Rich mineral and vitamin C content — iron, calcium, magnesium; nutritive spring tonic',
      'Free-radical scavenging antioxidant via flavonoids and phenolic compounds',
      'Traditional spring "cleansing" herb — cooling, lymph-moving protocol with nettle, cleavers and dandelion',
      'Topical wash or compress for bites, stings and hot rashes',
    ],
    pharmacology:
      'Primary bioactives: saponins (contribute to expectorant, anti-inflammatory and mild detergent penetrant effects; high intake may cause GI upset), flavonoids (luteolin, apigenin, rutin — antioxidant, anti-inflammatory, mast-cell modulating), mucilage and polysaccharides (demulcent; soothing to mucous membranes and skin; anti-ulcer effects), minerals and vitamins (iron, calcium, magnesium, vitamin C — nutritive tonic). Anti-inflammatory and anti-ulcer effects confirmed in vitro and in vivo models. Grade B- anti-inflammatory; Grade B- anti-ulcer; Grade A- safety at moderate doses.',
    flavor_profile: 'Mild, salty-green, slightly sweet — pleasant as fresh food or gentle tea',
    contraindications: [
      'Pregnancy — medicinal doses: AVOID (some sources advise against); food-level use generally acceptable; consult provider',
      'Kidney disease or on diuretics — mild diuretic action; electrolyte monitoring recommended',
      'Caryophyllaceae family allergy — rare (carnation/pink family); discontinue if reaction',
      'Excessive consumption — high saponin load from overconsumption can cause nausea, vomiting and diarrhea; avoid mega-infusions (>6 cups/day)',
    ],
    herb_to_herb_synergy: [
      'Nettle and Cleavers — spring tonic lymph and mineral clearing formula',
      'Dandelion — combined cooling detoxification and lymphatic protocol',
      'Marshmallow and Calendula — comprehensive mucosal demulcent and healing stack',
      'Corn silk and Marshmallow — urinary cooling and soothing formula',
    ],
    herb_to_herb_caution: [
      'Other diuretics — additive diuresis; monitor electrolytes and blood pressure',
    ],
    herb_to_drug_interactions: [
      'Diuretics — additive effects; monitor electrolytes and blood pressure',
      'Antihypertensives — mild additive BP-lowering; monitor',
      'No major CYP or anticoagulant interactions documented',
    ],
    herb_interactions: [
      'Synergy: Nettle, Cleavers, Dandelion, Marshmallow, Calendula, Corn Silk',
      'Caution: other diuretics (electrolyte monitoring)',
      'Drug interactions: diuretics (monitor), antihypertensives (mild additive; monitor); otherwise minimal',
    ],
    dosage_range:
      'Fresh food: handful of leaves in salads, pestos or smoothies daily in season. Tea: 1–5 g dried herb, steep 10–15 minutes, up to 3× daily. Tincture: 6–30 ml daily divided. Topical: fresh poultice for bites and rashes; salve for chronic eczema and psoriasis itch; compress for heat rashes and burns.',
    spiritual_layer:
      'Chickweed is the playful cooling maiden — the tiny star herb (Stellaria = star) that creeps softly across disturbed and garden ground, soothing irritation and bringing levity wherever heat and stuck patterns have accumulated. She is the weed that appears wherever the earth has been turned and treated harshly, offering cooling medicine for the very conditions that created her habitat. She teaches that irritation and burning — on the skin, in the gut, in emotions — can be resolved through gentle moistening, playfulness and release rather than suppression or force. She whispers: I cool and soften where life has inflamed me. My skin, gut and lymph flow are soothed and free. Irritation dissolves into ease.',
    best_preparation:
      'Fresh plant as food is most pleasant and bioavailable — seasonal salads and pestos. Salve for chronic eczema and psoriasis itch — most effective topical application. Tea for internal cooling and GI support. Topical fresh poultice for acute bites, stings and hot rashes — immediate and accessible first aid.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A- safety at moderate doses. Excellent cooling, demulcent, anti-itch herb for hot skin and mucosal conditions. Safe food-medicine for most populations. Avoid excessive consumption (saponin-related GI upset). Medicinal doses in pregnancy: consult provider. Kidney disease: electrolyte monitoring.',
  },

  // ─────────────────────────────────────────────
  // CHILCUAGUE
  // ─────────────────────────────────────────────
  {
    id: 226,
    name: 'Chilcuague',
    botanical: 'Heliopsis longipes (root — Aztec Golden Root)',
    tcm_meridians: ['Stomach', 'Spleen', 'Lung'],
    tcm_element: 'Fire + Earth',
    energetics: ['Hot', 'Stimulating', 'Pungent', 'Numbing', 'Sialagogue', 'Antimicrobial'],
    primary_functions: [
      'Oral analgesic and local anaesthetic — affinin alkamide creates intense tingling then transient numbness; traditional toothache and gum pain relief',
      'Oral antimicrobial — antifungal and antibacterial against oral pathogens including Candida',
      'Digestive stimulant — pungent compounds stimulate salivation and gastric secretions; sialagogue action',
      'Antifungal — in vitro antifungal properties against Candida and oral fungal pathogens',
      'Respiratory support — reflex secretomotor effects via increased salivation and mucosa circulation',
    ],
    secondary_benefits: [
      'Appetite stimulation — pre-meal digestive activation through salivary and gastric secretion stimulation',
      'Traditional Mexican ethnobotanical insect repellent',
      'Sore throat support — antimicrobial and locally anaesthetic action',
      'External antifungal for superficial skin fungal conditions',
    ],
    pharmacology:
      'Primary bioactive: affinin (isobutylamide alkamide — principal pungent and anaesthetic component; creates strong tingling, salivation, transient numbness and local analgesia alongside antimicrobial and antifungal effects). Related alkamides and essential oil constituents contribute. Traditional Mexican Aztec herb used for toothache and oral infections. Modern toxicology limited; traditional use suggests good safety at low topical and small internal doses. Very pungent and intense: always start at lowest possible dose.',
    flavor_profile: 'Strongly pungent, intensely tingling and transiently numbing — immediately distinctive',
    contraindications: [
      'High doses — can irritate or burn mucosa; always start with tiny amounts',
      'Severely inflamed, ulcerated or hypersensitive mucosa — strong pungent may aggravate active lesions',
      'Pregnancy — insufficient data; avoid or keep to very small topical doses',
      'Children — use with caution and only tiny topical doses if at all',
      'Internally at high doses — limited systemic safety data; primarily topical and low-dose oral use',
    ],
    herb_to_herb_synergy: [
      'Cloves — complementary local anaesthetic and antimicrobial oral health formula',
      'Sage and Calendula — oral antimicrobial and healing gargle',
      'Thyme — respiratory antimicrobial and oral health protocol',
    ],
    herb_to_herb_caution: [
      'Other very pungent herbs at high combined doses — mucosal irritation risk',
    ],
    herb_to_drug_interactions: [
      'Theoretically may increase absorption of co-administered substances via increased mucosal blood flow',
      'Otherwise minimal drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Cloves, Sage, Calendula, Thyme (oral health formulas)',
      'Caution: other pungent herbs at high combined doses',
      'Drug interactions: minimal; theoretical absorption enhancement via mucosal circulation',
    ],
    dosage_range:
      'Tincture: 1–10 drops at a time, up to several times daily (LOW DOSE HERB — very potent at tiny doses). Topical: 1–5 drops in a little water as swish/gargle for oral infections; spit out. Chewed root: tiny piece until tingling begins. NOT for high-dose internal use.',
    spiritual_layer:
      'Chilcuague is the Aztec golden root — a low-dose, high-impact pungent that announces itself immediately and completely. She is the teacher of presence: it is impossible to be absent when Chilcuague is in your mouth. She teaches that some medicines work through intensity and immediacy rather than subtlety and accumulation — that awakening can be sharp and precise rather than gradual. She is the traditional Mexican oral healer, the pre-colonial dentist\'s companion. She whispers: Feel this. Be present. Your mouth awakens. Your digestion stirs. Your awareness sharpens to this moment.',
    best_preparation:
      'Tincture in drop doses — most controlled and predictable delivery. Swish/gargle preparation for oral antimicrobial use. Tiny piece of dried root chewed for immediate toothache relief. Combine 1–3 drops with Clove and Sage for a powerful oral health gargle formula.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Traditional Mexican ethnobotanical with limited modern safety data at systemic doses. Excellent for oral pain, gum infection and digestive stimulation when used in low, topical doses. Not for high-dose internal use. Always start with smallest possible amount — highly potent at tiny doses.',
  },

  // ─────────────────────────────────────────────
  // CINNAMON
  // ─────────────────────────────────────────────
  {
    id: 227,
    name: 'Cinnamon',
    botanical: 'Cinnamomum verum (Ceylon/true — preferred) / Cinnamomum cassia (inner bark)',
    tcm_meridians: ['Spleen', 'Stomach', 'Kidney', 'Heart'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warming to Hot', 'Sweet', 'Pungent', 'Aromatic', 'Slightly Astringent', 'Circulatory-Stimulating'],
    primary_functions: [
      'Digestive warming and carminative — cinnamaldehyde stimulates digestion, resolves cold-damp patterns and reduces gas',
      'Blood sugar modulation — cassia polyphenols improve insulin receptor signalling; modest RCT evidence for glucose and lipid reduction',
      'Circulatory stimulant — warming, vasodilatory action supports cold constitutions and poor peripheral circulation',
      'Antimicrobial and antifungal — cinnamaldehyde significant activity against bacteria and fungi',
      'Anti-inflammatory and antioxidant — phenolic compounds and procyanidins reduce oxidative stress',
    ],
    secondary_benefits: [
      'Traditional dysmenorrhoea support — warming and antispasmodic for cold-pattern menstrual cramping',
      'Metabolic syndrome adjunct — combined glucose, lipid and anti-inflammatory effects',
      'Cold and flu warming support — part of warming antimicrobial winter formula',
      'Mood and comfort — hearth spice; limbic warmth and emotional comfort',
    ],
    pharmacology:
      'Primary bioactives: cinnamaldehyde (main aromatic aldehyde; antimicrobial, vasodilatory, insulin signalling modulator), eugenol (especially leaf oil; analgesic, antimicrobial), polyphenols (procyanidins, catechins; insulin-sensitising, antioxidant). CRITICAL SAFETY for cassia: coumarin content (~0.5 mg/g bark average; some samples up to 2+ mg/g) — hepatotoxic at high chronic doses; EFSA TDI = 0.1 mg/kg/day coumarin. C. verum (Ceylon cinnamon) has dramatically lower coumarin (<0.04 mg/g) — preferred for long-term medicinal use. 1–2 g/day cassia for 3 months generally safe; >6 g/day long-term may exceed coumarin TDI and stress liver in susceptible individuals.',
    flavor_profile: 'Warm, sweet, aromatic, slightly pungent and spicy — quintessential hearth spice',
    contraindications: [
      'Liver disease — coumarin (cassia) hepatotoxicity risk elevated; prefer C. verum or avoid cassia medicinal doses',
      'Pregnancy — culinary amounts fine; high medicinal doses: traditional emmenagogue concern; avoid therapeutic cassia doses',
      'Anticoagulants and antiplatelets — mild additive bleeding risk; monitor',
      'Diabetes medications — blood sugar lowering effect; monitor glucose and coordinate medication adjustments',
      'Coumarin sensitivity — use C. verum exclusively for long-term protocols',
    ],
    herb_to_herb_synergy: [
      'Ginger and Cardamom — warming digestive and cardiometabolic spice trinity',
      'Cloves — warming antimicrobial and digestive spice combination',
      'Berberine (Barberry) — combined glucose and lipid modulation for metabolic syndrome',
      'Turmeric — anti-inflammatory and metabolic synergy',
    ],
    herb_to_herb_caution: [
      'Other blood-thinning herbs at high combined doses — anticoagulant stacking',
      'Other hepatotoxic herbs with cassia form — cumulative coumarin liver burden',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — additive blood sugar lowering; monitor and adjust',
      'Anticoagulants — mild additive effect; monitor INR',
      'Hepatotoxic medications with cassia — cumulative coumarin liver burden; prefer C. verum',
    ],
    herb_interactions: [
      'Synergy: Ginger, Cardamom, Cloves, Berberine, Turmeric',
      'Caution: anticoagulant herbs stacked; hepatotoxic herbs with cassia form',
      'Drug interactions: diabetes meds (monitor glucose), anticoagulants (monitor INR), hepatotoxic meds with cassia (prefer verum)',
    ],
    dosage_range:
      'Culinary: 0.5–2 g daily in food and tea — widely safe for most populations. Medicinal cassia for glycaemic support: 1–2 g/day for 3 months (monitor liver function in at-risk individuals). Prefer C. verum for long-term daily use. Tincture: 20–40 drops, 2–3× daily.',
    spiritual_layer:
      'Cinnamon is the hearth spice — the warmth that awakens digestion, circulation and emotional comfort. She is ancient trade, ancient medicine and ancient comfort: written in the oldest texts of Ayurveda, TCM and European herbalism as the warming companion for cold constitutions, sluggish digestion and the chill of winter. She teaches that warmth must be proportionate — healing when wisely measured, potentially damaging when excessive. Like the hearth fire itself, she requires tending and calibration. She whispers: I welcome gentle, proportionate warmth into my system. My digestion, blood and mood are warmed but not inflamed. I calibrate warmth with wisdom.',
    best_preparation:
      'C. verum (Ceylon cinnamon) preferred for long-term daily use — dramatically lower coumarin than cassia. Culinary integration most sustainable. Medicinal cassia for targeted 3-month glycaemic protocols with liver function monitoring in at-risk patients. Tincture for convenient dosing. Combine with Ginger and Cardamom for warming tonic formulas.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Safe and effective warming digestive and metabolic spice. C. verum preferred for long-term use (low coumarin). Cassia safe at 1–2 g/day for 3 months for glycaemic support. High cassia doses long-term may exceed coumarin TDI — liver monitoring in at-risk individuals. Grade B evidence for glycaemic control; Grade B+ for digestive carminative action.',
  },

  // ─────────────────────────────────────────────
  // CLOVES
  // ─────────────────────────────────────────────
  {
    id: 228,
    name: 'Cloves',
    botanical: 'Syzygium aromaticum (dried flower buds)',
    tcm_meridians: ['Stomach', 'Spleen', 'Kidney'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Dry', 'Pungent', 'Digestive-Warming', 'Antimicrobial', 'Antiparasitic', 'Dental-Numbing'],
    primary_functions: [
      'Dental pain relief — eugenol local anaesthetic action; traditional and evidence-based toothache and gum pain relief',
      'Broad-spectrum antimicrobial — eugenol and polyphenols against bacteria, fungi and parasites',
      'Digestive warming and carminative — essential oil stimulates digestive fire and reduces gas and bloating',
      'Antiparasitic — eugenol component in classic antiparasitic trio with Black Walnut and Wormwood',
      'Anti-inflammatory — eugenol and polyphenols reduce inflammatory cytokines and support tissue comfort',
    ],
    secondary_benefits: [
      'Oral antimicrobial rinse — prevents dental pathogen adhesion and supports gum health',
      'Antioxidant — polyphenols scavenge free radicals; cellular protection',
      'Evening warming ritual — warm milk with cloves and honey for digestive support and sleep warmth',
      'Culinary integration — safe indefinite food-medicine use in cooking',
    ],
    pharmacology:
      'Primary bioactive: essential oil (12–20%; eugenol 80–90% — local anaesthetic via TRPV1 and other mechanisms; antimicrobial against bacteria, fungi and parasites; anti-inflammatory via COX inhibition; dental use validated by modern research). Supporting: polyphenols and tannins (antioxidant 3–5%; antimicrobial synergy). 200+ modern studies. Centuries Indonesian and global culinary and medicinal use. ESSENTIAL OIL IS CONCENTRATED: drop doses only, always diluted topically; internal neat oil causes mucosal irritation.',
    flavor_profile: 'Extremely warm, intensely spicy-sweet and aromatic — unmistakable eugenol signature',
    contraindications: [
      'Essential oil neat topical — AVOID: causes mucosal and skin irritation; always dilute in carrier oil',
      'Essential oil internal undiluted — AVOID: highly concentrated; mucosal burning; not for casual internal use',
      'Pregnancy — culinary doses safe; large medicinal doses: consult provider; uterine-stimulating associations at high doses',
      'Breastfeeding — culinary doses safe; consult provider for concentrated forms',
      'Bleeding disorders — mild anticoagulant activity; monitor with anticoagulants',
    ],
    herb_to_herb_synergy: [
      'Black Walnut and Wormwood — classic antiparasitic trio; 4–6 week professional protocols',
      'Ginger and Cinnamon — triple warming digestive and antimicrobial spice combination',
      'Sage and Calendula — oral health and antimicrobial gargle formula',
      'Oregano and Thyme — intensive antimicrobial and gut health protocol',
    ],
    herb_to_herb_caution: [
      'Other anticoagulant herbs at high combined doses — additive blood-thinning effect',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets — mild additive effect; monitor at higher doses',
      'No other clinically significant interactions at culinary doses',
    ],
    herb_interactions: [
      'Synergy: Black Walnut, Wormwood (antiparasitic); Ginger, Cinnamon (digestive warming); Sage, Calendula (oral health)',
      'Caution: anticoagulant herbs at high combined doses',
      'Drug interactions: anticoagulants (monitor at medicinal doses); culinary doses minimal interaction',
    ],
    dosage_range:
      'Culinary: 2–5 whole cloves or 0.5–1 g powder daily in food and tea — safe indefinite use. Tincture: 20–40 drops, 1–2× daily. Dental topical: 1–2 drops clove oil diluted in carrier oil, applied to affected area. Antiparasitic protocol: 1–2 g alongside Black Walnut and Wormwood — professional protocol only.',
    spiritual_layer:
      'Cloves carry the warmth of the Spice Islands — Indonesian maritime trading history condensed into tiny dried flower buds that contain more warmth than their size suggests. She teaches that great potency can live in small things, that warming and antimicrobial action can coexist with pleasure and culinary delight, that medicine can be delicious. The original global trade routes formed around her and her Spice Island siblings — evidence that humanity has always sought warming, protecting, aromatic medicines. She whispers: I warm your fire. I protect your warmth. I cleanse from within. I ease your pain. I am the ancient spice of healing and pleasure.',
    best_preparation:
      'Whole dried buds steeped in warm milk or tea — most pleasant and aromatic. Culinary integration for sustainable daily food-medicine. Essential oil (diluted) for topical dental application — most evidence-based acute use. Antiparasitic trio (with Black Walnut and Wormwood) requires professional protocol design.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety at culinary doses. Excellent antimicrobial, dental analgesic, warming digestive and antiparasitic herb. Essential oil must be diluted and dosed carefully. Safe indefinite use in food-spice form. Antiparasitic protocols require professional design. One of the most versatile and pleasant food-medicines available.',
  },

  // ─────────────────────────────────────────────
  // COCA LEAF — ETHNOBOTANICAL REFERENCE ONLY
  // ─────────────────────────────────────────────
  {
    id: 229,
    name: 'Coca Leaf',
    botanical: 'Erythroxylum coca / E. novogranatense (leaf — Andean traditional)',
    tcm_meridians: ['Spleen', 'Kidney', 'Heart'],
    tcm_element: 'Fire + Water',
    energetics: ['Mildly Warm', 'Stimulating', 'Hunger-Suppressing', 'Altitude-Adapted'],
    primary_functions: [
      'Altitude sickness (soroche) support — traditional Andean use for headache, fatigue and nausea at high altitude',
      'Fatigue and labour endurance — sustained energy for physical work at altitude without extreme stimulant profile',
      'Mild CNS stimulant and mood brightening — gentle wakefulness and hunger suppression at traditional doses',
      'Digestive tonic — nausea, sluggish digestion and stomach discomfort relief',
      'Mild pain and mood support — traditional context within Andean cultural practice',
    ],
    secondary_benefits: [
      'Nutritive — vitamins, minerals (notably calcium), flavonoids in whole leaf',
      'Cultural and ceremonial — central to Andean reciprocity ceremonies and community practice',
    ],
    pharmacology:
      'Primary constituents: tropane alkaloids (cocaine ~0.5–1% by dry weight; cinnamoylcocaine; truxillines — slower absorption in whole leaf creates very different profile from refined cocaine; WHO ECDD review notes low toxicity and weak dependence liability in traditional leaf use). Supporting: flavonoids, vitamins, minerals. LEGAL STATUS CRITICAL: Schedule I under 1961 Single Convention; illegal or highly restricted outside Andean countries. App recommendation: for users outside legal traditional practice contexts, this herb CANNOT be recommended or sourced. ETHICAL CONCERNS: global cocaine demand drives Amazonian deforestation and regional violence; non-traditional demand feeds illicit supply chains.',
    flavor_profile: 'Mild, faintly tea-like and slightly bitter — very gentle at traditional doses',
    contraindications: [
      'LEGAL STATUS — CRITICAL: Schedule I internationally; illegal in most countries outside Andean traditional contexts; this app cannot recommend or facilitate use outside legal traditional contexts',
      'Cardiovascular disease and hypertension — mild stimulant and vasoconstrictor; avoid',
      'Anxiety and insomnia — stimulant may worsen',
      'Pregnancy — tropane alkaloid source; avoid',
      'Substance use disorders — stimulant effects; controversial in addiction history contexts',
      'ETHICAL: non-traditional demand supports illicit cocaine trade and Amazonian deforestation; non-Andean use carries significant ethical concerns',
    ],
    herb_to_herb_synergy: [
      'No active synergistic recommendations — legal and ethical constraints prevent recommendation',
    ],
    herb_to_herb_caution: [
      'Stimulants — additive effects',
      'MAOIs and antidepressants — enhanced monoamine elevation',
    ],
    herb_to_drug_interactions: [
      'Stimulant medications — additive effects',
      'Cardiac medications — unpredictable HR/BP changes',
      'MAOIs — theoretically enhanced monoamine elevation',
    ],
    herb_interactions: [
      'Synergy: None recommended outside legal traditional Andean context',
      'Caution: stimulants, MAOIs, cardiac medications',
      'Drug interactions: stimulants, cardiac meds, MAOIs',
    ],
    dosage_range:
      'ETHNOBOTANICAL REFERENCE ONLY — no dosage recommendations outside legal Andean traditional context. Traditional: leaf chewing with alkaline ash; mate de coca (1–2 g leaves in hot water). App does not recommend, source or dose coca leaf outside legal traditional practice.',
    spiritual_layer:
      'Coca is the Andean teacher of reciprocity and work — a plant that has sustained highland peoples in relationship with mountain, labour and community for millennia. She represents the profound difference between a plant in its whole, traditional context and its industrially refined alkaloid: cocaine is not coca, just as morphine is not the poppy. She teaches that context defines medicine, that traditional relationship with a plant is categorically different from extractive pharmaceutical use, that how something is prepared, dosed and integrated culturally determines whether it heals or harms. She asks: Do you honour the original relationship, or extract only the intensity?',
    best_preparation:
      'ETHNOBOTANICAL REFERENCE ONLY. This monograph exists for educational completeness. The app does not recommend, facilitate or provide dosing guidance for coca leaf use outside legally sanctioned Andean traditional contexts.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'ETHNOBOTANICAL REFERENCE ONLY — not an active tincture recommendation. Schedule I internationally. Illegal outside Andean countries. Ethical concerns: non-traditional demand supports illicit cocaine supply chains. Educational context only.',
  },

  // ─────────────────────────────────────────────
  // CRANBERRY
  // ─────────────────────────────────────────────
  {
    id: 230,
    name: 'Cranberry',
    botanical: 'Vaccinium macrocarpon (ripe berries — PAC-standardised extract preferred)',
    tcm_meridians: ['Kidney', 'Bladder'],
    tcm_element: 'Water',
    energetics: ['Cool', 'Dry', 'Slightly Astringent', 'Protective', 'Cleansing', 'Urinary-Guardian'],
    primary_functions: [
      'UTI prevention — A-type PAC linkages (unique to cranberry) prevent E. coli P-fimbriae adhesion to uroepithelial cells',
      'Recurrent UTI prevention — most researched and evidence-based application; 40+ RCTs',
      'Urine acidification — quinic acid metabolises to hippuric acid; creates antimicrobial urine pH',
      'Urinary tract protection — persistent daily use maintains anti-adhesion barrier against bacterial colonisation',
      'Acute UTI adjunct — higher PAC dosing alongside antibiotic treatment to accelerate bacterial clearance',
    ],
    secondary_benefits: [
      'Oral health — PAC mechanism prevents dental bacteria adhesion similarly to UTI prevention',
      'Cardiovascular antioxidant — anthocyanins provide secondary systemic antioxidant protection',
      'Anti-inflammatory — polyphenol action reduces systemic inflammatory markers',
      'Traditional Indigenous North American food-medicine — centuries of urinary and nutritive use',
    ],
    pharmacology:
      'PRIMARY ACTIVE: A-type proanthocyanidins (PACs — UNIQUE to cranberry; not found in other berries; A-type PAC linkages specifically block E. coli P-fimbriae adhesion receptors on uroepithelial cells; bacteria cannot colonise and are flushed in urine). Supporting: quinic acid (urine acidification via hippuric acid conversion), anthocyanins (antioxidant, anti-inflammatory; secondary benefit), benzoic acid (natural antimicrobial). PAC CONTENT CRITICAL: minimum 36 mg PACs daily for efficacy — most commercial cranberry products significantly underdosed (<20 mg PACs); always verify standardisation. CRITICAL SAFETY: warfarin interaction — significantly increases INR; documented serious bleeding cases.',
    flavor_profile: 'Intensely tart, slightly sweet and characteristically berry-astringent',
    contraindications: [
      'Warfarin — ABSOLUTELY AVOID or intensive INR monitoring: documented significant INR elevation and serious bleeding cases; consult anticoagulation specialist',
      'Antiplatelet medications (aspirin, clopidogrel) — additive antiplatelet effect; monitor bleeding risk',
      'Kidney stones (oxalate-prone) — cranberry high in oxalates; moderate use and ensure adequate hydration',
      'Gastric ulcers or GERD — high acidity may irritate; consume with meals; avoid if severe',
      'Diabetes medications — anthocyanins may enhance insulin sensitivity; monitor glucose',
      'PAC content verification MANDATORY — minimum 36 mg PACs daily; many products ineffective; always verify standardisation',
    ],
    herb_to_herb_synergy: [
      'D-Mannose — different mechanism (blocks E. coli adhesion via different pathway); complementary UTI prevention',
      'Nettle — mineral support and urinary health combined protocol',
      'Uva Ursi — stronger antimicrobial for acute UTI support (short-term only; use separately)',
      'Lingonberry — similar PAC mechanism; complementary when combined at reduced individual doses',
    ],
    herb_to_herb_caution: [
      'Ginkgo, Garlic, Angelica (high-dose) — cumulative antiplatelet effect; particularly dangerous with Warfarin',
      'Uva Ursi combined — overlap in mechanisms; generally use separately rather than combined long-term',
    ],
    herb_to_drug_interactions: [
      'Warfarin — CRITICAL: significantly increases INR; serious bleeding documented; ABSOLUTELY AVOID or intensive INR monitoring',
      'Antiplatelets (aspirin, clopidogrel) — additive antiplatelet; monitor bleeding',
      'Diabetes medications — anthocyanin insulin sensitisation; monitor glucose',
    ],
    herb_interactions: [
      'Synergy: D-Mannose, Nettle, Lingonberry',
      'Caution: anticoagulant herbs with Warfarin (CRITICAL); Uva Ursi (use separately)',
      'Drug interactions: Warfarin (CRITICAL — avoid or intensive INR monitoring), antiplatelets (monitor), diabetes meds (monitor glucose)',
    ],
    dosage_range:
      'Standardised extract: minimum 36–72 mg PACs daily for prevention; 72–108 mg daily for acute UTI adjunct support. Fresh or frozen berries: 1/2 cup daily (verify PAC content by variety). ALWAYS verify PAC content on label — most commercial products are ineffective. Long-term safe for prevention.',
    spiritual_layer:
      'Cranberry is the sentinel of the wetlands — a persistent, protective berry that thrives in harsh, acidic bogs, enduring where other plants cannot. Indigenous North American peoples recognised her as a guardian herb centuries before modern science discovered her unique A-type PAC mechanism. She teaches that prevention through awareness and consistent protection is power — that the best medicine is often the daily ritual that keeps the threat from gaining foothold rather than the dramatic intervention after invasion. She whispers: I am protected. My urinary passages are clear. I am vigilant. I prevent before I must treat. My body is a guarded fortress.',
    best_preparation:
      'PAC-standardised extract (verified minimum 36 mg PACs) is most reliable and researched form — most commercial cranberry products are ineffective. Fresh or frozen berries for daily food use when PAC content verified. ALWAYS screen for Warfarin before recommending. Combine with D-Mannose for complementary anti-adhesion mechanisms. Consistent daily use more important than dose timing.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A evidence for UTI prevention (40+ RCTs). PAC content verification non-negotiable (minimum 36 mg daily). CRITICAL: Warfarin absolute contraindication or intensive INR monitoring. Kidney stone caution. Excellent UTI specialist herb when quality product used consistently.',
  },
  // ============================================================
  // BATCH 04 — 20 herbs converted from monographs
  // Ready to merge into src/data/herbsAndProtocols.ts
  // ============================================================

  // ─────────────────────────────────────────────
  // ICELAND MOSS
  // ─────────────────────────────────────────────
  {
    id: 231,
    name: 'Iceland Moss',
    botanical: 'Cetraria islandica (whole dried lichen thallus)',
    tcm_meridians: ['Lung', 'Stomach'],
    tcm_element: 'Metal + Earth',
    energetics: ['Cool', 'Slightly Bitter', 'Sweet', 'Demulcent', 'Dryness-Soothing', 'Mildly Tonic'],
    primary_functions: [
      'Demulcent respiratory support — lichenan and isolichenan polysaccharides coat and protect dry, irritated throat and upper airways',
      'Dry cough and hoarseness relief — mucilaginous polysaccharides reduce cough reflex and soothe tickling throat',
      'Gastroprotective — demulcent polysaccharides plus lichen acids protect gastric mucosa; useful for gastritis, reflux and ulcers',
      'Mild antimicrobial — lichen acids (cetraric acid, fumarprotocetraric acid) show antibiotic-like activity against respiratory and GI pathogens',
      'Immunomodulatory — polysaccharides stimulate aspects of innate immunity in experimental models',
    ],
    secondary_benefits: [
      'Unique dual demulcent-and-bitter profile — soothes while simultaneously toning digestion and appetite',
      'Nutritive tonic in harsh climates — traditional arctic food-medicine supporting resilience under stress',
      'Elderly and post-illness mucosal fragility support — protective lining for chronically irritated tissue',
      'EMA-registered traditional herbal medicinal product in EU for dry cough and throat irritation',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides — lichenan and isolichenan (strong demulcent; protective mucous-like layer on oral, pharyngeal and gastric mucosa; immunomodulatory in experimental models), lichen acids — cetraric acid and fumarprotocetraric acid (antimicrobial; bitter; anti-inflammatory; unique to lichens). Unusual combination: demulcent coating PLUS bitter tonic simultaneously — rare in herbal medicine. EMA traditional monograph; Grade B+ demulcent respiratory and GI. Arctic lichen; symbiosis of fungus and alga.',
    flavor_profile: 'Slightly bitter, mucilaginous when soaked — distinctive arctic mineral character',
    contraindications: [
      'Known lichen allergy — rare; discontinue if rash or GI upset',
      'Severe autoimmune conditions — theoretical caution from immunostimulant polysaccharides; clinical significance unclear',
      'No other significant contraindications — Grade A- safety with long-standing traditional and food use',
    ],
    herb_to_herb_synergy: [
      'Thyme — expectorant and antimicrobial combined with Iceland Moss demulcent for comprehensive respiratory formula',
      'Licorice (DGL) — enhanced mucosal protection for gastritis and reflux protocols',
      'Marshmallow root — amplified demulcent GI and respiratory protection',
      'Mullein — respiratory mucosa support and soothing combined protocol',
    ],
    herb_to_herb_caution: [
      'No known herb-to-herb cautions at typical doses',
    ],
    herb_to_drug_interactions: [
      'None well documented; minimal interaction risk at typical doses',
    ],
    herb_interactions: [
      'Synergy: Thyme, Licorice, Marshmallow, Mullein',
      'Caution: None known',
      'Drug interactions: None documented; minimal risk',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–4× daily. Decoction: 1–2 tsp cut lichen simmered 10–20 minutes, 2–4× daily. Cold maceration (maximum demulcent): 1–2 tbsp lichen in 500 ml cold water soaked several hours; drink in divided doses. Syrup or lozenges for acute throat irritation. Safe for weeks to months of use.',
    spiritual_layer:
      'Iceland Moss grows on bare arctic rock where almost nothing else can survive — a lichen, which is not one organism but two living as one (fungus and alga in symbiosis). She teaches that the harshest environments can be survived through relationship, through the building of protective inner coatings, through finding nourishment in the most elemental places. She is the inner lining itself — teaching that we can grow a protective layer in harsh conditions so that exposure does not equal damage. She whispers: My inner surfaces are protected. I soften friction. I allow healing in harsh conditions. I grow strong at the edges of what is livable.',
    best_preparation:
      'Cold maceration for maximum demulcent effect (dry cough and throat). Warm decoction for combined demulcent-bitter effect (gastritis and reflux). Syrup or lozenges for convenient acute throat use. Combine with Thyme and Marshmallow for a comprehensive respiratory and mucosal protocol.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A- safety — EMA-registered traditional herbal medicinal product in EU. Excellent for dry cough, hoarseness, throat irritation, gastritis and mucosal fragility. Unique demulcent-plus-bitter profile. Safe for weeks to months. Minimal contraindications.',
  },

  // ─────────────────────────────────────────────
  // ELDERFLOWER
  // ─────────────────────────────────────────────
  {
    id: 232,
    name: 'Elderflower',
    botanical: 'Sambucus nigra (flowers — fresh or dried; different from elderberry)',
    tcm_meridians: ['Lung', 'Liver', 'Kidney'],
    tcm_element: 'Metal + Water',
    energetics: ['Cool', 'Moist', 'Immune-Boosting', 'Antiviral', 'Respiratory-Supporting', 'Fever-Reducing'],
    primary_functions: [
      'Immune activation — sambucyanin anthocyanin and quercetin stimulate white blood cell proliferation and antiviral defence',
      'Antiviral support — flavonoids inhibit viral replication; documented activity against influenza, COVID-19 and rhinovirus',
      'Fever reduction — diaphoretic action promotes gentle sweating; flavonoids and volatile oils support temperature regulation',
      'Respiratory support — volatile oils and tannins provide antimicrobial respiratory tract support and congestion relief',
      'Antioxidant defence — potent free-radical scavenging via rutin, quercetin and sambucyanin',
    ],
    secondary_benefits: [
      'Seasonal prevention — excellent fall and winter cold and flu season herb',
      'Children-friendly — pleasant-tasting cordial form makes it accessible for all ages',
      'Anti-inflammatory — quercetin and flavonols reduce inflammatory cytokines systemically',
      '1000+ years European herbalism tradition — beloved country medicine from Hippocrates onward',
    ],
    pharmacology:
      'Primary bioactives: flavonoids — rutin, quercetin, sambucyanin (2–3%; immune stimulation; antiviral — sambucyanin signature anthocyanin with documented antiviral properties including COVID-19 era research), volatile oils (0.1–0.3%; antimicrobial; respiratory support; fever diaphoresis), polyphenols (1–2%; antioxidant; antiviral; neuroprotective), vitamin C (trace in fresh flowers). 1000+ years European herbalism. 150+ modern studies. Grade B immune and antiviral; Grade A safety.',
    flavor_profile: 'Delicately floral, slightly sweet and very pleasant — one of the most palatable medicinal herbs',
    contraindications: [
      'Pregnancy — safe; traditional use supports immune health during pregnancy; consult provider for concentrated forms',
      'Breastfeeding — safe; traditional use supports immune milk quality',
      'Diabetes — possible blood sugar effects; monitor if diabetic (theoretical; likely safe)',
      'Autoimmune diseases — immune modulation; use with caution; consult provider',
      'Immunosuppressants — theoretical interaction; consult prescriber',
    ],
    herb_to_herb_synergy: [
      'Echinacea — combined acute antiviral and immune activation during illness',
      'Elderberry (fruit) — flower and berry combination for comprehensive Sambucus immune protocol',
      'Astragalus — foundational immune plus acute antiviral combined protocol',
      'Ginger and Cinnamon — warming immune and antimicrobial winter formula',
      'Plantain and Mullein — comprehensive respiratory formula',
    ],
    herb_to_herb_caution: [
      'Other immune-stimulating herbs in autoimmune conditions — cumulative immune activation',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — theoretical immune modulation interaction; consult prescriber',
      'Diabetes medications — monitor glucose (theoretical blood sugar effect)',
      'Generally safe; minimal documented interactions',
    ],
    herb_interactions: [
      'Synergy: Echinacea, Elderberry, Astragalus, Ginger, Cinnamon, Plantain, Mullein',
      'Caution: immune-stimulating herbs in autoimmune conditions',
      'Drug interactions: immunosuppressants (consult), diabetes meds (monitor); otherwise minimal',
    ],
    dosage_range:
      'Tincture (fresh flowers — most potent): 20–40 drops, 1–3× daily. Dried flower infusion: 2–4 g steeped 5–10 minutes, 1–3× daily. Elderflower cordial diluted: 1–2 tablespoons daily. Intensify during illness (double dose first 48 hours). Safe long-term indefinite use.',
    spiritual_layer:
      'Elderflower is the elder\'s gift — delicate white flower clusters that appear in early summer on the same shrub that bears dark autumn berries, teaching the unity of gentle and fierce medicine. She is the "medicine chest of the country people" — the herb Hippocrates called first among all. Her flowers are the most approachable aspect of the elder: white, fragrant, cooling, generous. She teaches that immunity is not aggression but wisdom — the body\'s capacity to recognise what belongs and what does not, to respond intelligently rather than reactively. She whispers: My immunity is strong and wise. I am resilient. My defences are intelligent. I am protected by ancient medicine.',
    best_preparation:
      'Fresh flower infusion (most potent — preserves volatile oils and vitamin C). Elderflower cordial for children and daily maintenance. Dried flower tea for convenient year-round use. Combines beautifully with Elderberry for a comprehensive Elder protocol. Safe and pleasant enough for daily long-term preventive use.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety — 1000+ years traditional use. Excellent for immune activation, antiviral support, fever management and respiratory health. Safe in pregnancy and breastfeeding. Pleasant tasting — high compliance for all ages. Excellent seasonal prevention herb.',
  },

  // ─────────────────────────────────────────────
  // EPHEDRA — SAFETY REFERENCE ONLY
  // ─────────────────────────────────────────────
  {
    id: 233,
    name: 'Ephedra (Ma Huang)',
    botanical: 'Ephedra sinica (aerial stem) — BANNED/RESTRICTED — NOT FOR RECOMMENDATION',
    tcm_meridians: ['Lung', 'Heart', 'Kidney'],
    tcm_element: 'Fire + Metal',
    energetics: ['Very Warm', 'Dry', 'Acrid', 'Strongly-Stimulating', 'Respiratory-Opening'],
    primary_functions: [
      'SAFETY REFERENCE ONLY — NOT for consumer recommendation',
      'Bronchodilation — ephedrine alkaloids open airways dramatically (also increases cardiac workload dangerously)',
      'CNS stimulation — most powerful herbal stimulant; matches amphetamine mechanism',
      'Cardiovascular stress — increases heart rate, blood pressure and cardiac workload',
      'Historical TCM respiratory and energy herb — 5000+ years traditional use before modern safety recognition',
    ],
    secondary_benefits: [
      'THERE ARE NO RECOMMENDABLE BENEFITS — safer alternatives exist for all indications',
      'Eucalyptus for respiratory opening without cardiac risk',
      'Guayusa or Guarana for energy without cardiac risk',
      'Elderflower for immune-respiratory without cardiac risk',
    ],
    pharmacology:
      'BANNED/RESTRICTED WORLDWIDE. Ephedra sinica: ephedrine (0.5–2.5%) and pseudoephedrine — potent sympathomimetic; adenosine receptor antagonism; direct adrenergic receptor activation. Documented adverse effects: tachycardia, elevated BP, arrhythmias, myocardial infarction, death. FDA banned 2004 (USA); EU restricted/banned. Deaths documented in athletes and weight-loss users. Safety grade F — unacceptable risk profile. Ephedra nevadensis and viridis (North American varieties) are legal but contain minimal ephedrine and have limited efficacy; safer alternatives are still preferred.',
    flavor_profile: 'Acrid, pungent and astringent — characteristic ephedrine signature',
    contraindications: [
      'BANNED/RESTRICTED IN MOST COUNTRIES — DO NOT RECOMMEND',
      'Hypertension — ABSOLUTELY CONTRAINDICATED: BP elevation documented',
      'Any cardiac condition — ABSOLUTELY CONTRAINDICATED: arrhythmias, MI and death documented',
      'Anxiety disorder — ABSOLUTELY CONTRAINDICATED: severe anxiety trigger',
      'Thyroid conditions — ABSOLUTELY CONTRAINDICATED: dangerous metabolic acceleration',
      'Pregnancy and breastfeeding — ABSOLUTELY CONTRAINDICATED: teratogenic risk',
      'Stimulant medications — ABSOLUTELY CONTRAINDICATED: dangerous combined overstimulation',
      'Anyone — safer alternatives exist for every indication; do not recommend',
    ],
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [
      'DO NOT COMBINE WITH ANY HERB — banned/restricted; no recommendation context',
    ],
    herb_to_drug_interactions: [
      'DANGEROUS with all cardiovascular medications',
      'DANGEROUS with stimulant medications',
      'DANGEROUS with MAOIs and antidepressants',
    ],
    herb_interactions: [
      'Synergy: None — do not recommend',
      'Caution: All herbs — banned; no recommendation context',
      'Drug interactions: Dangerous with cardiovascular, stimulant and psychiatric medications',
    ],
    dosage_range:
      'NO DOSAGE RECOMMENDATIONS. Banned/restricted. If patient asks: "Ephedra sinica is banned/restricted in [country] due to documented cardiac adverse effects and deaths. I recommend safer alternatives: Eucalyptus for respiratory support, Elderflower for immune-respiratory support."',
    spiritual_layer:
      'Ephedra carries a cautionary wisdom — the teacher of danger and human hubris. She is ancient TCM medicine that served its purpose in a different era before modern pharmacology revealed the cardiac risks of isolated ephedrine alkaloids. She teaches that powerful does not mean safe, that traditional does not automatically mean appropriate for modern use, that wisdom sometimes means recognising when a plant\'s gifts have been superseded by safer alternatives. She whispers: Honour my history. Choose wisely. The safer door exists.',
    best_preparation:
      'NOT FOR RECOMMENDATION. Reference herb only for educational context. Always redirect to safer alternatives.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'BANNED/RESTRICTED — DO NOT RECOMMEND. Ephedra sinica banned USA (2004 FDA), restricted/banned EU and many countries. Documented deaths from cardiac adverse effects. Grade F safety. Always redirect to safer alternatives for respiratory (Eucalyptus), energy (Guayusa/Guarana) and immune-respiratory (Elderflower) support.',
  },

  // ─────────────────────────────────────────────
  // EUCALYPTUS
  // ─────────────────────────────────────────────
  {
    id: 234,
    name: 'Eucalyptus',
    botanical: 'Eucalyptus globulus (Blue Gum — leaves and essential oil)',
    tcm_meridians: ['Lung', 'Liver'],
    tcm_element: 'Metal + Wood',
    energetics: ['Cool', 'Dry', 'Respiratory-Opening', 'Antimicrobial', 'Antiviral', 'Decongestant'],
    primary_functions: [
      'Respiratory opening — eucalyptol (1,8-cineole 50–90% of essential oil) is among the fastest-acting natural bronchodilators and mucolytics',
      'Decongestant — direct sinus and nasal passage clearing within 15–30 minutes of inhalation',
      'Antimicrobial — eucalyptol provides broad-spectrum antibacterial activity against respiratory pathogens',
      'Antiviral — polyphenols and terpenes support respiratory antiviral defence',
      'Mucolytic — clears and mobilises mucus; makes cough productive',
    ],
    secondary_benefits: [
      'Sleep quality via nighttime breathing ease in diffuser',
      'Anti-inflammatory via polyphenols — reduces respiratory mucosal inflammation',
      'Antioxidant via polyphenols and tannins',
      'Topical chest rub for transdermal and inhalation dual respiratory effect',
    ],
    pharmacology:
      'Primary bioactive: essential oil (1–3% in fresh leaves; 70–90% eucalyptol/1,8-cineole in concentrated oil — bronchodilatory, mucolytic, decongestant, antimicrobial, anti-inflammatory; one of the most potent natural respiratory opening compounds). Supporting: polyphenols (antioxidant, antiviral, anti-inflammatory), tannins (astringent, antimicrobial, respiratory lining protection). 200+ studies; Grade A respiratory opening and decongestant; Grade B antimicrobial and antiviral. ESSENTIAL OIL CAUTION: very concentrated — drop doses only; never ingest undiluted; inhalation is the primary and safest route.',
    flavor_profile: 'Intensely cool, minty, medicinal and powerfully aromatic — unmistakable eucalyptol signature',
    contraindications: [
      'Children under 6 years — AVOID essential oil: respiratory hypersensitivity; diluted leaf infusion may be used with caution',
      'Asthma — CAUTION: eucalyptol may trigger bronchospasm in some individuals; start cautiously and monitor response',
      'Pregnancy — AVOID essential oil internal or high-dose inhalation; leaf infusion likely safe; consult provider',
      'Breastfeeding — AVOID essential oil; leaf infusion likely safe',
      'Seizure disorders — AVOID essential oil: rare theoretical seizure risk',
      'Essential oil undiluted — NEVER ingest undiluted: mucosal burning and toxicity; always dilute topically; inhalation only for neat oil',
    ],
    herb_to_herb_synergy: [
      'Broadleaf Plantain — soothing demulcent combined with Eucalyptus opening; comprehensive respiratory formula',
      'Ginger — warming antimicrobial synergy for colds and respiratory infections',
      'Thyme — combined antimicrobial and expectorant respiratory formula',
      'Elderflower — antiviral and immune respiratory combined protocol',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions at leaf doses',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented at typical doses',
      'Essential oil CYP450 theoretical interaction at high doses — minimal at standard inhalation',
    ],
    herb_interactions: [
      'Synergy: Plantain, Ginger, Thyme, Elderflower',
      'Caution: None significant at leaf doses',
      'Drug interactions: Minimal at standard doses',
    ],
    dosage_range:
      'Inhalation (most potent): 2–5 drops essential oil in diffuser or steam bowl, 2–4× daily during congestion. Leaf infusion: 2–4 g dried leaves steeped 5–10 minutes, 1–3× daily. Chest rub: 10 drops essential oil diluted in 30 ml carrier oil, applied 1–2× daily. Never ingest undiluted essential oil.',
    spiritual_layer:
      'Eucalyptus carries the strength and clarity of Australian forests — 700+ species evolved over millions of years in a continent of fire and resilience. She teaches that clear breathing is the foundation of clear consciousness, that respiratory freedom is the doorway to full presence. The Aboriginal peoples of Australia knew her medicine long before Western herbalism discovered it. She clears what has become congested and clouded, opens what has closed, makes space for the breath of life to flow freely. She whispers: Breathe clearly. Open your airways. Clarity is your birthright. My breath is the forest\'s breath. I am the medicine of clear seeing.',
    best_preparation:
      'Diffuser inhalation — most potent and safest route (direct respiratory impact, no GI absorption concerns). Chest rub for transdermal plus inhalation dual effect. Leaf infusion for gentler daily internal use. Screen for asthma sensitivity before recommending. Children under 6: leaf infusion only.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A respiratory opening and decongestant efficacy. 200+ years Australian and global use. Excellent for acute respiratory congestion, sinusitis and antimicrobial respiratory support. Essential oil requires careful dosing — inhalation safest. Children under 6: avoid essential oil. Asthma: caution and monitor.',
  },

  // ─────────────────────────────────────────────
  // EYEBRIGHT
  // ─────────────────────────────────────────────
  {
    id: 235,
    name: 'Eyebright',
    botanical: 'Euphrasia officinalis / E. rostkoviana (aerial parts)',
    tcm_meridians: ['Liver', 'Lung', 'Stomach'],
    tcm_element: 'Wood + Metal',
    energetics: ['Cool', 'Dry', 'Bitter', 'Astringent', 'Anticatarrhal', 'Mucosal-Toning'],
    primary_functions: [
      'Conjunctivitis and ocular catarrh — astringent tannins and anti-inflammatory iridoids reduce redness, tearing, discharge and itching',
      'Allergic eye symptoms and hayfever — cooling anti-inflammatory astringent for hypersensitive ocular and nasal mucosa',
      'Upper respiratory anticatarrhal — addresses the full catarrhal arc: eyes, sinuses, nasopharynx, Eustachian tubes',
      'Sinusitis and chronic catarrh — reduces sinus discharge, postnasal drip and sinus headache',
      'Eye strain and visual fatigue — traditional use for VDT overuse and reading strain',
    ],
    secondary_benefits: [
      'Catarrhal deafness (serous otitis media) — traditional use for Eustachian tube congestion',
      'Mild antimicrobial via flavonoids and phenolic acids',
      'Anti-inflammatory systemically via iridoid glycosides and flavonoids',
      'Traditional measles catarrhal phase support (historical use)',
    ],
    pharmacology:
      'Primary bioactives: iridoid glycosides — aucubin and catalpol (anti-inflammatory; mucosa-protective), flavonoids — luteolin, apigenin, quercetin derivatives (antioxidant, anti-allergic, anti-inflammatory), tannins (astringent; reduce secretion; tone capillaries and mucosa), phenolic acids and volatile compounds (antioxidant, antimicrobial). CRITICAL SAFETY NOTE: DIY home-made eye washes are considered likely unsafe due to microbial contamination risk — only commercial sterile eye drop preparations are appropriate for direct eye contact.',
    flavor_profile: 'Bitter, astringent and slightly pungent — characteristic mucosal toning signature',
    contraindications: [
      'DIY/home-made eye preparations — LIKELY UNSAFE: microbial contamination risk; only commercial sterile eye drops appropriate for direct eye contact',
      'Serious eye symptoms (pain, photophobia, vision changes, corneal opacity, trauma) — URGENT MEDICAL REFERRAL: eyebright alone is not appropriate',
      'Pregnancy and lactation — avoid high medicinal doses internally; food-level amounts likely acceptable; consult provider',
      'Children — safety of herbal eye drops not well established; commercial sterile preparations only; consult paediatrician',
      'Rare allergic reactions — discontinue if redness or irritation worsens',
    ],
    herb_to_herb_synergy: [
      'Nettle and Chamomile — allergic conjunctivitis and hayfever eyes internal formula',
      'Goldenrod, Elderflower and Yarrow — chronic sinusitis and upper respiratory catarrhal protocol',
      'Bilberry — combined retinal antioxidant and mucosal support',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions documented',
    ],
    herb_to_drug_interactions: [
      'None well documented; topical use minimal systemic interaction risk',
    ],
    herb_interactions: [
      'Synergy: Nettle, Chamomile, Goldenrod, Elderflower, Yarrow, Bilberry',
      'Caution: None significant',
      'Drug interactions: None documented; topical interaction risk negligible',
    ],
    dosage_range:
      'Internal tincture: 2–6 ml, 3× daily. Infusion: 2–4 g dried herb steeped 10–15 minutes, up to 3× daily. Topical (STERILE COMMERCIAL ONLY): 1 drop per eye 3–5× daily for acute conjunctivitis. NEVER use DIY home-made preparations in eyes.',
    spiritual_layer:
      'Eyebright is the clarifier of perception — cooling inflamed, watery vision so that both physical sight and inner insight become sharper and less clouded by irritation. She grows as a tiny semi-parasitic plant drawing nutrients from grasses, teaching that some medicine is found at the margins, in the relationship between things. She teaches that how we see the world depends on the state of our tissues and nerves: when swollen and irritated, perception is distorted; when cooled and toned, we see with balanced clarity. She whispers: My sight is clear and calm. The tissues of my eyes and sinuses are cooled and toned. I soften irritation and see the world with balanced clarity.',
    best_preparation:
      'Internal infusion or tincture combined with commercial sterile eye drops for topical application. NEVER recommend DIY eye preparations. Screen for serious eye disease indicators (pain, photophobia, vision changes) before recommending — urgent medical referral if present. Combine with Nettle and Chamomile for allergic hayfever eye protocol.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade C+ for conjunctivitis symptom relief (limited trials but strong tradition). Safe internally at standard doses. CRITICAL: Only commercial sterile preparations for ophthalmic use — DIY eye washes are likely unsafe. Refer serious eye symptoms to ophthalmology immediately.',
  },

  // ─────────────────────────────────────────────
  // FADOGIA — SAFETY REFERENCE ONLY
  // ─────────────────────────────────────────────
  {
    id: 236,
    name: 'Fadogia',
    botanical: 'Fadogia agrestis (stem and root — West African)',
    tcm_meridians: ['Kidney', 'Liver'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Yang-Driving', 'Potentially Damaging to Liver and Kidney'],
    primary_functions: [
      'SAFETY REFERENCE ONLY — NOT RECOMMENDED: no human clinical trials; animal toxicity documented',
      'Purported testosterone boosting (animals only — no human RCT evidence)',
      'Purported libido and sexual function enhancement (animals only)',
      'Traditional West African use for pain and fever (limited evidence)',
    ],
    secondary_benefits: [
      'NO RECOMMENDABLE BENEFITS — safer evidence-based alternatives exist for all purported indications',
      'Safer testosterone support: Ashwagandha (Grade A), Tongkat Ali, Maca, lifestyle optimisation',
      'Safer libido support: Damiana, Catuaba, Muira Puama (all traditional, better safety profiles)',
    ],
    pharmacology:
      'GRADE E — NOT RECOMMENDED. Active compounds incompletely characterised (saponins, alkaloids with unclear structure and pharmacodynamics). Human evidence: NONE — no human RCTs or well-designed clinical trials. Animal toxicity: documented structural liver cell damage, kidney nephron damage, adverse prostate and testicular changes including reduced sperm count and motility at subchronic doses. No safe human dose currently evidence-based. Popular online as "testosterone booster" despite absence of human safety or efficacy data.',
    flavor_profile: 'Bitter and astringent — characteristic alkaloid signature',
    contraindications: [
      'DO NOT RECOMMEND — no human safety data; significant animal toxicity',
      'Pre-existing liver conditions — documented hepatocellular damage in animals',
      'Pre-existing kidney conditions — documented nephron damage in animals',
      'Fertility concerns — animal data show negative effects on sperm count and motility',
      'Hepatotoxic or nephrotoxic medications — unknown but potentially significant interactions',
      'Anyone seeking testosterone support — safer alternatives exist with actual human evidence',
    ],
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [
      'DO NOT COMBINE — not recommended; redirect to safer alternatives',
    ],
    herb_to_drug_interactions: [
      'Unknown — liver and kidney toxicity suggests potential interactions with hepatically and renally cleared drugs',
      'DO NOT RECOMMEND alongside any medications without extensive safety data',
    ],
    herb_interactions: [
      'Synergy: None — do not recommend',
      'Caution: All — redirect to Ashwagandha, Tongkat Ali or Maca for testosterone support',
      'Drug interactions: Unknown but potentially significant via liver/kidney toxicity',
    ],
    dosage_range:
      'NO DOSAGE RECOMMENDATIONS. Not recommended. If patient asks: redirect to evidence-based testosterone and vitality support — Ashwagandha (Grade A evidence, 100+ RCTs), Tongkat Ali (Grade B), Maca (Grade B), lifestyle optimisation (sleep, resistance training, zinc, vitamin D).',
    spiritual_layer:
      'Fadogia embodies the temptation of the shortcut — the allure of quick hormonal results without the groundwork of genuine nourishment and lifestyle. She teaches the same lesson all shortcut herbs teach: if the path to power bypasses nourishment, patience and time, the body pays later. Real vitality is built, not hacked.',
    best_preparation:
      'NOT FOR RECOMMENDATION. Redirect to safer evidence-based alternatives for all purported benefits.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'GRADE E — NOT RECOMMENDED. No human RCTs; significant animal organ toxicity (liver, kidney, reproductive organs). Popular online marketing without scientific basis. Always redirect to safer evidence-based alternatives: Ashwagandha, Tongkat Ali, Maca for testosterone and vitality support.',
  },

  // ─────────────────────────────────────────────
  // FENNEL
  // ─────────────────────────────────────────────
  {
    id: 237,
    name: 'Fennel',
    botanical: 'Foeniculum vulgare (dried ripe fruits — seeds)',
    tcm_meridians: ['Liver', 'Kidney', 'Spleen', 'Stomach'],
    tcm_element: 'Wood + Water',
    energetics: ['Warm', 'Sweet', 'Aromatic', 'Slightly Pungent', 'Carminative', 'Spasmolytic', 'Gently Phytoestrogenic'],
    primary_functions: [
      'Digestive carminative — anethole and fenchone relax GI smooth muscle; premier herb for gas, bloating and cramping',
      'GI antispasmodic — reduces intestinal spasm; IBS, colic and functional dyspepsia support',
      'Phytoestrogenic endocrine modulation — anethole-like compounds gently influence oestrogen signalling; menstrual and menopausal support',
      'Galactagogue — increases milk flow in breastfeeding; traditional use confirmed in small trials',
      'Respiratory support — mild expectorant and antispasmodic for upper respiratory catarrh',
    ],
    secondary_benefits: [
      'Appetite stimulation for sluggish digestion and post-illness recovery',
      'Antioxidant and hepatoprotective via flavonoids and coumarins',
      'Traditional infant colic support — dilute tea in age-appropriate doses',
      'Mediterranean food-medicine with centuries of safe culinary and medicinal integration',
    ],
    pharmacology:
      'Primary bioactives: essential oil (anethole up to 60%; estragole; fenchone; limonene — carminative, antispasmodic, mild phytoestrogenic, antimicrobial). Flavonoids (coumarins; antioxidant; hepatoprotective). Phytoestrogenic mechanism: anethole-like compounds bind oestrogen receptors or modulate oestrogen signalling; used for menstrual irregularities, menopausal symptoms and PCOS in some traditions. Estragole note: potential carcinogenicity at very high exposures — not a concern at culinary and typical therapeutic doses. Grade B+ carminative; Grade B endocrine modulation.',
    flavor_profile: 'Sweet, anise-like, aromatic and gently warm — quintessential Mediterranean digestive spice',
    contraindications: [
      'Oestrogen-sensitive cancers (breast, uterine, ovarian) — CAUTION with high-dose long-term therapeutic use; culinary amounts generally acceptable',
      'Apiaceae family allergy (celery, carrot, parsley) — potential cross-reactivity; discontinue if reaction',
      'Infants — very dilute short-term use only; avoid essential oil internally; estragole concern at high infant doses',
      'Hormone therapies and tamoxifen — theoretical phytoestrogenic interaction; monitor',
    ],
    herb_to_herb_synergy: [
      'Chamomile and Caraway — digestive carminative and antispasmodic trinity',
      'Peppermint — IBS and functional GI cramping combined formula',
      'Ginger — warming digestive activation and carminative synergy',
      "Vitex and Lady's Mantle — women's hormonal and menstrual combined support",
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic herbs in oestrogen-sensitive conditions — cumulative oestrogenic effect',
    ],
    herb_to_drug_interactions: [
      'Hormonal therapies (OCPs, HRT) and tamoxifen — theoretical phytoestrogenic interaction; monitor',
      'No other clinically significant drug interactions at typical doses',
    ],
    herb_interactions: [
      "Synergy: Chamomile, Caraway, Peppermint, Ginger, Vitex, Lady's Mantle",
      'Caution: other phytoestrogenic herbs in oestrogen-sensitive conditions',
      'Drug interactions: hormonal therapies (monitor); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 2–4 ml, 2–3× daily. Infusion: 1–2 tsp lightly crushed seeds per 250 ml, steeped 10–15 minutes, 1–3× daily. Chew seeds after meals as a pleasant digestive aid. Safe long-term in culinary doses.',
    spiritual_layer:
      'Fennel is the gentle hearth-fire of the Mediterranean — a tall, feathery plant with golden umbels that has seasoned food and medicine across centuries of Mediterranean culture. She teaches that comfort and flow replace gripping and stagnation; that the digestive fire, when gently tended rather than forced, transforms nourishment into vitality. She is the herb of sweet warm digestive ease, the feminine endocrine balancer, the mother\'s milk supporter. She whispers: Warmth and flow return to my centre. I digest life with ease. My body knows how to process and transform what I receive.',
    best_preparation:
      'Freshly crushed seeds steeped as tea — most aromatic and effective. Chewed seeds after meals for immediate digestive support. Tincture for convenient daily use. Screen oestrogen-sensitive conditions before recommending therapeutic doses. Pairs classically with Chamomile and Caraway for a comprehensive digestive formula.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ safety — widely used as food with excellent culinary safety record. Excellent digestive carminative and gentle phytoestrogenic herb. Screen oestrogen-sensitive conditions for therapeutic doses. Infant use: dilute, short-term, age-appropriate only. Effects develop over days to weeks.',
  },

  // ─────────────────────────────────────────────
  // GARLIC
  // ─────────────────────────────────────────────
  {
    id: 238,
    name: 'Garlic',
    botanical: 'Allium sativum (bulb cloves — fresh-crushed for antimicrobial use)',
    tcm_meridians: ['Spleen', 'Lung', 'Heart', 'Stomach'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Pungent', 'Acrid', 'Stimulating', 'Antimicrobial', 'Moving'],
    primary_functions: [
      'Broad-spectrum antimicrobial — allicin (fresh-crushed only) is potent bactericidal, fungicidal and virucidal; MUST be fresh for efficacy',
      'Cardiovascular support — ajoene and polysulfides provide modest cholesterol reduction (10–15% LDL) and BP lowering (5–10 mmHg)',
      'Immune activation — polysulfides (survive cooking) enhance NK cells, macrophages and T-cell function',
      'Antiplatelet — ajoene reduces platelet aggregation; mild blood-thinning without pharmaceutical anticoagulation',
      'Traditional antiparasitic — anthelmintic activity via allicin; traditional parasite elimination support',
    ],
    secondary_benefits: [
      'Anti-inflammatory via polysulfides and organosulfides',
      'Digestive warming and antimicrobial for gut dysbiosis',
      'Food-medicine integration — 3000+ years culinary and medicinal tradition worldwide',
      'Black garlic (fermented) — enhanced bioavailability, odour-free form for those who cannot tolerate fresh',
    ],
    pharmacology:
      'PRIMARY CRITICAL DISTINCTION: Allicin (sulfur compound) does NOT exist in intact garlic — crushing triggers alliinase enzyme to produce allicin. Allicin is destroyed by heat (>60°C), time (>15 min air exposure) or stomach acid. MUST be fresh-crushed and consumed within 10–15 minutes for antimicrobial efficacy. Cooked garlic retains polysulfides (immune and cardiovascular benefit) but loses allicin (antimicrobial). Ajoene (antiplatelet) forms from allicin in stomach and survives better. 500+ studies; 3000+ years traditional use. Odour is the efficacy marker — no odour = no allicin = no antimicrobial potency.',
    flavor_profile: 'Pungently warm, acrid and intensely aromatic — odour is the quality marker; stronger odour = more allicin',
    contraindications: [
      'Warfarin — MONITOR INR: ajoene additive antiplatelet effect; documented INR increase; consult anticoagulation specialist',
      'Antiplatelet medications (aspirin, clopidogrel) — additive antiplatelet effect; monitor bleeding risk',
      'Bleeding disorders — antiplatelet properties increase bleeding risk; use with caution',
      'Diabetes medications — modest hypoglycaemic effect; may potentiate; monitor blood sugar',
      'Fresh garlic with GI ulcers or GERD — pungent and warming; consume with meals; avoid if severe ulcer',
      'Breastfeeding — garlic taste and odour transfer to breast milk; infant may reject breast; limit',
      'Sulfur sensitivity — rare; caution if sulfur-sensitive',
    ],
    herb_to_herb_synergy: [
      'Hawthorn and CoQ10 — triple cardiovascular support stack',
      'Astragalus and mushrooms — combined immune activation protocol',
      'Ginger — warming antimicrobial and circulatory synergy',
      'Oregano and Thyme — intensive antimicrobial protocol for gut and respiratory',
    ],
    herb_to_herb_caution: [
      'Ginkgo, Angelica (high dose), Turmeric (high dose) — cumulative antiplatelet effect; stacking increases bleeding risk',
      'Other antiplatelet herbs with Warfarin — dangerous combination',
    ],
    herb_to_drug_interactions: [
      'Warfarin — INR increase; monitor closely; consult anticoagulation specialist',
      'Antiplatelet drugs (aspirin, clopidogrel) — additive bleeding risk; monitor',
      'Diabetes medications — modest glucose-lowering; monitor blood sugar',
      'Saquinavir and some antiretrovirals — garlic may reduce blood levels; consult prescriber',
    ],
    herb_interactions: [
      'Synergy: Hawthorn, CoQ10, Astragalus, Ginger, Oregano, Thyme',
      'Caution: antiplatelet herbs at combined high doses (bleeding risk)',
      'Drug interactions: Warfarin (monitor INR), antiplatelets (monitor), diabetes meds (monitor glucose), saquinavir (consult)',
    ],
    dosage_range:
      'Fresh cloves (antimicrobial): 1–3 cloves daily, crushed, consumed within 10–15 minutes of crushing — MUST be raw. Cooked garlic (immune/cardiovascular — allicin not required): 2–3 cloves daily indefinitely. Aged garlic extract (odour-free, cardiovascular/immune): 600–1200 mg daily. Tincture: 30–60 drops, 2–3× daily.',
    spiritual_layer:
      'Garlic is the warrior\'s plant — pungent, powerful, fiercely protective. Three thousand years of human tradition from ancient Egypt to medieval plague remedies to modern immunology confirm her as one of the most reliable antimicrobial allies the plant world offers. She teaches that fierce protection can be simple and accessible, that the most powerful medicine is often found in the kitchen rather than the laboratory, that odour — which so many would erase — is itself the mark of her power. She whispers: I am protected. My immunity is fierce. Infection cannot take hold. My heart is strong. I am guarded by ancient medicine.',
    best_preparation:
      'Fresh-crushed cloves consumed immediately — mandatory for antimicrobial use (allicin). Cooking is fine for immune and cardiovascular use. Odour = efficacy marker for allicin. Screen for Warfarin and antiplatelet medications before recommending. Aged garlic extract for odour-intolerant or Warfarin users needing cardiovascular benefits.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ safety — 3000+ years food-medicine with excellent traditional record. Excellent antimicrobial (fresh-crushed), cardiovascular and immune herb. Warfarin screening essential. Antimicrobial use requires fresh preparation — cooking destroys allicin. One of the most versatile and evidence-supported herbs in the world.',
  },

  // ─────────────────────────────────────────────
  // GINKGO
  // ─────────────────────────────────────────────
  {
    id: 239,
    name: 'Ginkgo',
    botanical: 'Ginkgo biloba (leaf only — standardised to 24% flavones, 6% terpene lactones)',
    tcm_meridians: ['Heart', 'Liver', 'Kidney'],
    tcm_element: 'Metal + Water',
    energetics: ['Cool', 'Dry', 'Ascending', 'Circulation-Promoting', 'Memory-Supporting', 'Precision-Enhancing'],
    primary_functions: [
      'Cerebral blood flow enhancement — ginkgolides (PAF antagonism) gently thin blood and improve microcirculation to brain',
      'Memory and cognitive support — particularly age-related cognitive decline where cerebral hypoperfusion is a factor',
      'PAF antagonism — reduces platelet aggregation via a different mechanism to aspirin; gentle blood-thinning',
      'Antioxidant neuroprotection — flavones and bilobalide protect neural tissue from oxidative damage',
      'Peripheral circulation enhancement — benefits for Raynaud\'s phenomenon, claudication and cold extremities',
    ],
    secondary_benefits: [
      'Tinnitus and vestibular support — circulation to inner ear',
      'Visual field improvement — microcirculation to optic nerve',
      'Adjunctive stroke prevention via antiplatelet and antioxidant mechanisms',
      'Long-term cognitive aging protection — cumulative neuroprotective investment',
    ],
    pharmacology:
      'Primary bioactives: ginkgo flavones (24% standardised; quercetin, kaempferol and related flavonols — antioxidant, vascular effects, blood viscosity reduction), terpene lactones (6% standardised — ginkgolides A/B/C: PAF antagonists that reduce platelet clumping and improve microcirculation; bilobalide: neuroprotective, reduces neuroinflammation). 2000+ years TCM use; German Commission E monograph; 200+ million years as a species — the "living fossil." Grade B+ memory and cognitive function; Grade A antiplatelet activity (also the key interaction risk). CRITICAL: stop 2 weeks before surgery.',
    flavor_profile: 'Mildly bitter and slightly astringent as tea — primarily used as standardised extract',
    contraindications: [
      'Warfarin and anticoagulants — SERIOUS INTERACTION RISK: additive antiplatelet effect; documented bleeding cases; INR monitoring essential; many sources recommend AVOIDING combination; consult cardiologist',
      'Aspirin (high-dose) and antiplatelets (clopidogrel) — additive antiplatelet; monitor bleeding risk',
      'Surgery — STOP 2 WEEKS BEFORE: bleeding risk during anaesthesia; inform surgeon and anaesthesiologist',
      'Bleeding disorders (haemophilia) — AVOID: antiplatelet properties dangerous',
      'MAOIs — theoretical interaction; consult prescriber',
      'Poor-quality preparations — ginkgolic acid in low-quality extracts causes allergic dermatitis; always use standardised quality brands',
    ],
    herb_to_herb_synergy: [
      'Bacopa — cerebral circulation (Ginkgo) plus memory nourishment (Bacopa); excellent cognitive pairing',
      'Rosemary — acetylcholinesterase inhibition plus circulation; complementary cognitive mechanisms',
      'Blueberry — antioxidant neuroprotection and cerebral blood flow; comprehensive brain trinity',
      'Gotu Kola — venous and capillary integrity combined with cerebral circulation',
    ],
    herb_to_herb_caution: [
      'Garlic, Angelica, high-dose Turmeric, high-dose Fish Oil — cumulative antiplatelet effect; stacking increases bleeding risk significantly',
    ],
    herb_to_drug_interactions: [
      'Warfarin — AVOID or intensive INR monitoring: documented bleeding increase',
      'Antiplatelets (aspirin, clopidogrel) — additive; monitor bleeding',
      'Surgery medications — stop 2 weeks before procedure',
      'MAOIs — theoretical interaction; consult',
    ],
    herb_interactions: [
      'Synergy: Bacopa, Rosemary, Blueberry, Gotu Kola',
      'Caution: antiplatelet herbs at combined doses (Garlic, Angelica, Turmeric — bleeding risk)',
      'Drug interactions: Warfarin (AVOID or intensive monitoring), antiplatelets (monitor), surgery (stop 2 weeks prior)',
    ],
    dosage_range:
      'Standardised extract (24% flavones, 6% terpene lactones): 120–240 mg daily in divided doses (40–80 mg, 2–3× daily). Minimum 4–8 weeks for effects; 8–12 weeks for full cognitive benefit. Safe long-term indefinite use when anticoagulant status screened.',
    spiritual_layer:
      'Ginkgo is the ancient survivor — 200 million years old, unchanged through ice ages, asteroids and mass extinctions, the sole surviving species of its entire family. She stood at the edges of Hiroshima and grew back first. She teaches that resilience is not rigidity but flexibility, that survival comes through adaptability, that the mind — like Ginkgo herself — can regenerate and clarify even after long periods of stress. Her forked leaves hold two truths at once, teaching duality held in balance. She whispers: My mind is clear. My blood flows freely. I am resilient. I adapt. Ancient wisdom guides me. I survive and thrive.',
    best_preparation:
      'Standardised extract (24%/6%) is essential for reliable dosing — quality matters critically with Ginkgo. Anticoagulant screening non-negotiable before recommending. Stop 2 weeks before any surgery. Combine with Bacopa and Blueberry for a comprehensive cognitive nourishment and circulation protocol.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ evidence for cognitive support and circulation. German Commission E monograph. CRITICAL: Warfarin interaction — avoid or intensive INR monitoring. Stop 2 weeks pre-surgery. Standardised extract essential. Minimum 4–8 weeks for cognitive benefit. One of the most researched herbs in the world.',
  },

  // ─────────────────────────────────────────────
  // GINSENG
  // ─────────────────────────────────────────────
  {
    id: 240,
    name: 'Ginseng',
    botanical: 'Panax ginseng (Asian — most potent) / Panax quinquefolius (American — milder) (root)',
    tcm_meridians: ['Spleen', 'Lung', 'Heart'],
    tcm_element: 'Earth + Fire',
    energetics: ['Warm', 'Moist', 'Sweet', 'Tonifying', 'Qi-Activating', 'Yang-Enhancing', 'Adaptogenic'],
    primary_functions: [
      'Balanced adaptogenic stress response — ginsenosides contain both stimulating (Rg1) and sedating (Rb1) compounds; true HPA axis adaptation not suppression',
      'Energy and physical endurance — increases glucose mobilisation, ATP production and reduces fatigue perception',
      'Sexual function enhancement — increased NO production; improved penile blood flow; erectile function support',
      'Immune activation — balanced polysaccharide enhancement of NK cells, macrophages and T-cells without overstimulation',
      'Cognitive enhancement — improved memory, neurotransmitter synthesis (dopamine, acetylcholine) and neuroprotection',
    ],
    secondary_benefits: [
      'Blood sugar regulation — improves insulin sensitivity; 10–20% reduction documented',
      'Post-illness vitality restoration — foundational qi rebuilding after serious illness',
      'Longevity investment — 4000+ years TCM as ultimate rasayana-equivalent qi tonifier',
      'Testosterone and masculine vitality support via NO and androgenic mechanisms',
    ],
    pharmacology:
      'Primary bioactives: ginsenosides (saponins/panaxosides 2–3%; 40+ varieties — unique: contains BOTH stimulating Rg1 AND sedating Rb1 compounds in balanced ratio creating true adaptation; increases heat shock proteins, enhances stress resilience), polysaccharides (β-glucans; immune activation). KEY DISTINCTION from Ashwagandha: Ginseng is more immediately activating and energising; Ashwagandha is more deeply grounding and sedating. Korean Red Ginseng (steamed and aged) most potent — increases ginsenoside concentration 40%+. 200+ studies; Grade A adaptogenic; Grade A energy and endurance; Grade B+ sexual function. Cycling protocol: 8–12 weeks on, 2–4 weeks off.',
    flavor_profile: 'Bitter, slightly sweet and warming — characteristic ginsenoside signature; Korean Red distinctively stronger',
    contraindications: [
      'Stimulant sensitivity — CAUTION: may cause jitteriness, insomnia and anxiety in sensitive individuals; start at 0.5 g and titrate',
      'Hypertension — MONITOR blood pressure: mild stimulating properties may elevate; generally manageable with antihypertensives but monitor',
      'Insomnia — MORNING USE ONLY: take in morning only; evening use disrupts sleep',
      'Diabetes medications — MONITOR blood sugar: improves insulin sensitivity; may potentiate hypoglycaemia; medication adjustment likely',
      'Anticoagulants — MINIMAL RISK but monitor: theoretical antiplatelet activity; limited documented evidence',
      'Oestrogen-sensitive conditions (breast cancer history) — CAUTION: possible mild oestrogenic activity; consult oncologist',
      'Pregnancy — AVOID: insufficient modern safety data; some sources caution',
      'Breastfeeding — CAUTION: insufficient data on concentrated forms',
    ],
    herb_to_herb_synergy: [
      'Astragalus — combined foundational qi tonification and immune support',
      'Eleuthero (Siberian Ginseng) — synergistic adaptogenic resilience stack',
      'Schizandra — endurance, Jing and adaptogenic combined protocol',
      'Reishi — foundational qi and spiritual depth combined',
    ],
    herb_to_herb_caution: [
      'Stimulant herbs (Guarana, Rhodiola, Coffee) — cumulative overstimulation risk; moderate carefully',
      'Sedative herbs (Valerian, Passionflower) — contradictory stimulating vs. sedating; inefficient combination',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — improved insulin sensitivity; monitor and adjust',
      'Warfarin — minimal but monitor antiplatelet activity',
      'Hypertensive medications — mild stimulation may affect BP control; monitor',
      'MAOIs — theoretical interaction; consult',
    ],
    herb_interactions: [
      'Synergy: Astragalus, Eleuthero, Schizandra, Reishi',
      'Caution: stimulant herbs (overstimulation); sedative herbs (contradictory)',
      'Drug interactions: diabetes meds (monitor), Warfarin (minimal, monitor), antihypertensives (monitor), MAOIs (consult)',
    ],
    dosage_range:
      'Asian/Korean Red: 1–3 g daily in standardised extract (2–3% ginsenosides). American: 1–3 g daily (milder). Standardised extract: 200–400 mg daily. Tincture: 40–80 drops, 2–3× daily. CYCLING: 8–12 weeks on, 2–4 weeks off. Morning use only. Full benefit at 8–12 weeks.',
    spiritual_layer:
      '"Panax" from Greek "pan" (all) + "akos" (cure) — the all-healer. "Root of man" — the human-shaped root that Chinese medicine has revered for 4000 years as the supreme qi tonifier, the plant that gives back what life takes away. She teaches that foundational strength takes time, that deep nourishment is transformation, that patience builds vitality that cannot be rushed. She is the elder of adaptogens — ancient, potent, patient. She whispers: I am vital. My energy is strong. I am resilient. My qi flows freely. I am restored. Ancient wisdom rebuilds me.',
    best_preparation:
      'Korean Red Ginseng (standardised extract) for maximum potency. American Ginseng for sensitive individuals. Morning use only. Cycling protocol (8–12 weeks on, 2–4 weeks off). Screen for stimulant sensitivity, hypertension, diabetes, oestrogen-sensitive conditions before recommending.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade A adaptogenic and energy evidence (200+ studies). Excellent for qi tonification, stress resilience, energy, cognitive and sexual function. Morning use essential. Cycling protocol recommended. Screen for stimulant sensitivity. 4000+ years traditional use. One of the most researched herbs in the world.',
  },

  // ─────────────────────────────────────────────
  // GOJI BERRY
  // ─────────────────────────────────────────────
  {
    id: 241,
    name: 'Goji Berry',
    botanical: 'Lycium barbarum / Lycium chinense (dried ripe berries — Wolfberry, Gou Qi Zi)',
    tcm_meridians: ['Liver', 'Kidney', 'Lung'],
    tcm_element: 'Water + Metal',
    energetics: ['Neutral', 'Slightly Warming', 'Sweet', 'Mildly Sour', 'Blood-Nourishing', 'Yin-Tonifying', 'Eye-Brightening'],
    primary_functions: [
      'Liver and Kidney yin and blood tonification — LBP polysaccharides plus carotenoids nourish the foundational yin-blood axis',
      'Vision and retinal support — zeaxanthin and lutein provide macular pigment protection; antioxidant retinal defence',
      'Antioxidant and anti-aging — LBPs increase antioxidant enzyme activity; reduce lipid peroxidation across tissues',
      'Metabolic support — improved glucose tolerance, insulin sensitivity and lipid modulation in animal and some human studies',
      'Immune modulation — LBP polysaccharides enhance macrophage, NK and T-cell function',
    ],
    secondary_benefits: [
      'Neuroprotective and cognitive — improved neuronal survival; reduced β-amyloid damage in animal models',
      'Anti-fatigue and stress resilience — subjective well-being and fatigue resistance improvement in small trials',
      'Traditional longevity herb — 2000+ years TCM longevity and vitality formulas',
      'Pleasant food-medicine — eaten as sweet dried berries in soups, teas and porridges; high compliance',
    ],
    pharmacology:
      'Primary bioactives: Lycium barbarum polysaccharides — LBPs (major bioactives; immunomodulatory; antioxidant; neuroprotective; hypoglycaemic), carotenoids — zeaxanthin and lutein (retinal protective pigments; macular pigment density support), flavonoids, phenolic acids, betaines, vitamins C and B, minerals. Grade A- safety (no known toxicity; decades food use); Grade B+ antioxidant and anti-aging; Grade B- vision; Grade B- metabolic. WARFARIN CAUTION: case reports of elevated INR.',
    flavor_profile: 'Sweet, mildly sour and gently fruity — pleasant and very palatable as dried berry snack',
    contraindications: [
      'Warfarin — CAUTION: case reports of elevated INR; monitor INR and consult anticoagulation specialist',
      'Solanaceae allergy — rare cross-reactivity possible (goji is in the nightshade family)',
      'Pregnancy and lactation — food-level use traditional and safe; high-dose extracts: consult provider',
      'Generally very safe — no intrinsic toxicity identified; food-like safety profile',
    ],
    herb_to_herb_synergy: [
      'Bilberry — combined retinal and microvascular antioxidant protection',
      'Jujube and Schizandra — traditional TCM yin-blood and sleep support formula',
      'Barley and green tea — metabolic support and antioxidant daily protocol',
      'Astragalus — foundational qi and blood combined tonification',
    ],
    herb_to_herb_caution: [
      'Other anticoagulant herbs with Warfarin — cumulative INR effects',
    ],
    herb_to_drug_interactions: [
      'Warfarin — monitor INR: case reports of elevated INR; consult clinician',
      'Narrow therapeutic index drugs — theoretical CYP/P-gp modulation (limited data; monitor)',
    ],
    herb_interactions: [
      'Synergy: Bilberry, Jujube, Schizandra, Barley, Green Tea, Astragalus',
      'Caution: anticoagulant herbs with Warfarin',
      'Drug interactions: Warfarin (monitor INR), narrow TI drugs (theoretical; monitor)',
    ],
    dosage_range:
      'Dried berries: 10–30 g daily as snack or in tea and soups (primary food-medicine use). Decoction: 10–20 g simmered in 500 ml water, divided over the day. Extract: equivalent to 6–15 g dried fruit daily. Safe long-term continuous use as food.',
    spiritual_layer:
      'Goji is the gentle blood-brightener — a sweet red berry that nourishes deep reserves while keeping sight clear and spirits buoyant. Two thousand years of Chinese longevity medicine and countless grandmothers\' soups are its testimony. She teaches that profound change often comes from small, consistent, pleasant inputs rather than heroic interventions — that the daily handful of sweet red berries nourishing yin, brightening eyes, and supporting blood is as powerful as any complex formula. She whispers: I nourish my blood and essence gently every day. My eyes, nerves and heart are sustained by steady sweetness. Longevity arises from consistent, loving care.',
    best_preparation:
      'Dried berries as daily food — eaten plain, in soups, teas and porridges. Most sustainable, most enjoyable, highest compliance form. Decoction combined with Jujube and Schizandra for traditional yin-blood and sleep formula. Screen for Warfarin before recommending therapeutic doses.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A- safety — no known toxicity; traditional food-medicine. Excellent as daily blood and yin tonic, retinal support and metabolic adjunct. Warfarin case reports — monitor INR. Pleasant and accessible for long-term use. Food-level doses safe for all populations.',
  },

  // ─────────────────────────────────────────────
  // GOTU KOLA (UPDATED)
  // ─────────────────────────────────────────────
  {
    id: 108,
    name: 'Gotu Kola',
    botanical: 'Centella asiatica (aerial parts — Brahmi, Asiatic Pennywort)',
    tcm_meridians: ['Heart', 'Liver', 'Kidney', 'Spleen'],
    tcm_element: 'Water + Wood',
    energetics: ['Cool', 'Moist', 'Bitter', 'Nourishing', 'Mind-Clarifying', 'Neuroplasticity-Enhancing'],
    primary_functions: [
      'Cognitive enhancement — asiatic and madecassic acid increase BDNF and stimulate dendritic arborisation; neuroplasticity support',
      'Memory and learning — enhanced synaptic transmission; improved information retention and recall',
      'Venous insufficiency — triterpenoids strengthen vein walls via collagen I and III induction; reduce capillary permeability',
      'Wound healing and collagen synthesis — fibroblast stimulation and angiogenesis via asiaticoside',
      'Mild anxiolytic without sedation — modest GABA modulation produces calm alertness unique among cognitive herbs',
    ],
    secondary_benefits: [
      'Anti-inflammatory systemically via triterpenoids and flavonoids',
      'Connective tissue and skin elasticity support',
      'Varicose vein improvement — vein wall integrity and tone',
      'Ayurvedic "Herb of Enlightenment" — 5000+ years traditional cognitive and spiritual use',
    ],
    pharmacology:
      'Primary bioactives: pentacyclic triterpenoids — asiatic acid and madecassic acid (0.5–1% each; BDNF stimulation; dendritic arborisation — brain cell branching for neuroplasticity; collagen I/III synthesis for vein wall strengthening), asiaticoside (0.2–0.5%; antioxidant; anti-inflammatory; skin healing), flavonoids (antioxidant; neuroprotective). CRITICAL: CYP2C9, 2C19 and 3A4 inhibition — increases blood levels of many medications. Must screen all medications for CYP450 metabolism before recommending. Rare hepatotoxicity cases: caution in liver disease. Grade B+ cognitive; Grade B+ venous insufficiency; Grade A (caution) CYP450 interaction.',
    flavor_profile: 'Slightly bitter, earthy and mildly sweet as tea — pleasant when combined with other herbs',
    contraindications: [
      'CYP2C9, 2C19 and 3A4 substrate drugs — CRITICAL: Gotu Kola inhibits multiple CYP450 enzymes; increases blood levels of warfarin, statins, SSRIs, omeprazole, many others; CONSULT PHARMACIST before combining with any medications',
      'Liver disease — rare hepatotoxicity cases reported; CAUTION; monitor liver enzymes',
      'Pregnancy — insufficient modern safety data; traditional Ayurvedic use limited; CAUTION/AVOID therapeutic doses',
      'Breastfeeding — insufficient data; CAUTION',
      'Sedatives and CNS depressants — mild additive effect from GABA activity; monitor; reduce doses if combining',
    ],
    herb_to_herb_synergy: [
      "Lion's Mane and Bacopa — cognitive trinity: neuroplasticity (Gotu Kola) + NGF (Lion's Mane) + BDNF/LTP (Bacopa)",
      'Hawthorn and Horse Chestnut — venous integrity and cardiovascular circulation combined',
      'Bilberry — combined capillary protection and cognitive neuroprotection',
    ],
    herb_to_herb_caution: [
      'CYP450-inhibiting herbs (Kava, St. John\'s Wort) — compound CYP450 inhibition; drug interaction risk increases',
      'Sedative herbs (Valerian, Passionflower) — additive CNS depression; monitor',
    ],
    herb_to_drug_interactions: [
      'CYP2C9/2C19/3A4 substrates — CRITICAL: Warfarin, statins, SSRIs, anticonvulsants, many others (CONSULT PHARMACIST)',
      'Benzodiazepines and sedatives — mild additive CNS depression',
      'Lithium — fluid handling changes may alter clearance; monitor levels',
    ],
    herb_interactions: [
      "Synergy: Lion's Mane, Bacopa, Hawthorn, Horse Chestnut, Bilberry",
      'Caution: CYP450-inhibiting herbs (compound interaction risk); sedative herbs (additive)',
      'Drug interactions: CYP2C9/2C19/3A4 substrates (CRITICAL — consult pharmacist), benzodiazepines (monitor), lithium (monitor)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Standardised extract (60% asiaticoside): 250–500 mg, 2× daily. Tea: 1–2 tsp dried herb per 250 ml, steeped 10–15 minutes, 2–3× daily. Cycling: 3 months on, 2–4 weeks off recommended. Minimum 4–8 weeks for cognitive effects.',
    spiritual_layer:
      'Gotu Kola is the "Herb of Enlightenment" in Buddhist tradition — the herb that Sri Lankan legend says elephants (the longest-lived animals) eat for their wisdom and longevity. She grows at the margins of water and land, in the liminal zone between worlds — fitting for a herb that teaches the mind to be present at the edge of knowing and not-knowing. She teaches that clarity comes through nourishment, that the mind blooms when consistently tended, that insight is not seized but allowed to arise through patient cultivation. She whispers: My mind is clear. I learn easily. I remember. My circulation flows freely. I am calm and alert. I am enlightened.',
    best_preparation:
      'Standardised extract for reliable cognitive and venous dosing. Tea for daily ritual use. CYP450 screening non-negotiable — consult pharmacist before combining with medications. Combine with Bacopa and Lion\'s Mane for comprehensive cognitive nourishment protocol.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ cognitive and venous insufficiency evidence (100+ studies). CRITICAL: CYP450 inhibition — pharmacist consultation mandatory if on medications. Liver caution. Excellent herb when screened appropriately. Minimum 4–8 weeks for cognitive benefit. Cycling recommended.',
  },

  // ─────────────────────────────────────────────
  // GROUND IVY
  // ─────────────────────────────────────────────
  {
    id: 242,
    name: 'Ground Ivy',
    botanical: 'Glechoma hederacea (aerial parts — Gill-over-the-ground, Alehoof)',
    tcm_meridians: ['Lung', 'Spleen', 'Kidney', 'Liver'],
    tcm_element: 'Metal + Earth',
    energetics: ['Warming', 'Drying', 'Aromatic', 'Slightly Bitter', 'Pungent', 'Anticatarrhal'],
    primary_functions: [
      'Anticatarrhal for sinuses, ears and lungs — aromatic oils and astringent tannins dry and clear excess mucus from ENT and bronchial passages',
      'Chronic sinus catarrh and glue ear — loosens and drains stubborn mucus accumulation in sinuses and Eustachian tubes',
      'Mild expectorant — promotes clearance of thick respiratory mucus in chronic bronchitis patterns',
      'Digestive bitter carminative — stimulates digestion and clears GI mucus in cold-damp digestive patterns',
      'Mild diuretic and urinary drainage — supports kidney and urinary tract drainage',
    ],
    secondary_benefits: [
      'Antimicrobial via polyphenols and volatile oils',
      'Antioxidant — strong free-radical scavenging in vitro',
      'Traditional "alehoof" brewing herb — centuries of European folk medicine and culinary use',
      'Gentle hepatic support in some traditions',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (monoterpenes; expectorant, aromatic, antimicrobial), polyphenols and flavonoids (potent antioxidant and antimicrobial in vitro), tannins (astringent; mucosal toning). In vitro data show strong antioxidant activity and dose-dependent cytotoxicity at higher concentrations in HepG2 liver cells — suggesting both therapeutic potential and need for moderation. Traditional formula component rather than standalone primary herb.',
    flavor_profile: 'Aromatic, minty-resinous, slightly bitter and pungent — distinctive Lamiaceae character',
    contraindications: [
      'Pregnancy — AVOID medicinal doses: some sources explicitly advise against; food-level amounts likely acceptable; consult provider',
      'Liver disease or hepatotoxic medications — CAUTION: in vitro cytotoxicity in liver cells at higher concentrations; avoid high-dose or prolonged use',
      'Children — moderate tea doses only with practitioner oversight; avoid high doses due to cytotoxic signals',
      'Lamiaceae allergy — possible; discontinue if rash or respiratory symptoms',
      'Toxic to horses and some livestock when grazed in large amounts — relevant for farm context',
    ],
    herb_to_herb_synergy: [
      'Elderflower, Yarrow and Peppermint — classic chronic sinus catarrh formula',
      'Thyme and Mullein — chronic bronchitis with dampness protocol',
      'Caraway and Gentian — cold-damp sluggish digestive formula',
      'Goldenrod and Nettle — urinary drainage and detoxification',
    ],
    herb_to_herb_caution: [
      'Hepatotoxic herbs — avoid combining with Ground Ivy in liver disease (cumulative cytotoxic concern)',
    ],
    herb_to_drug_interactions: [
      'Hepatotoxic medications — avoid high-dose Ground Ivy combination (cumulative liver concern)',
      'No other well-documented drug interactions',
    ],
    herb_interactions: [
      'Synergy: Elderflower, Yarrow, Peppermint, Thyme, Mullein, Caraway',
      'Caution: hepatotoxic herbs in liver disease',
      'Drug interactions: hepatotoxic medications (avoid combination); otherwise minimal',
    ],
    dosage_range:
      'Tincture: 5–10 ml, up to 3× daily (1:5). Infusion: 2–4 g dried herb per cup, up to 3× daily. Duration: 2–6 weeks for catarrh episodes; lower doses intermittently for chronic patterns. Use as formula component rather than standalone.',
    spiritual_layer:
      'Ground Ivy is the creeping, clearing ally — she threads through dense undergrowth and stuck spaces, gently lifting and drying hidden accumulations. The old "alehoof" name reminds us she was trusted enough to preserve and clarify beer before hops replaced her — a testament to both her antimicrobial properties and her place in daily European life. She teaches that we should attend to the lingering, low-grade congestion before it hardens — that the subtle accumulations in sinuses, ears, gut and emotional body require regular gentle clearing. She whispers: Stagnant residues in my head, chest and gut are gently cleared. I breathe and think more freely. I attend to the subtle before it becomes the stuck.',
    best_preparation:
      'Formula component combined with other respiratory and digestive herbs. Infusion or tincture for 2–6 week courses during catarrh episodes. Screen for liver disease and pregnancy before recommending. Avoid high or prolonged doses.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Traditional European anticatarrhal herb with strong folk medicine heritage. Good formula component for chronic sinus, ear and bronchial catarrh. Caution with liver disease and high doses (in vitro cytotoxicity at elevated concentrations). Pregnancy: avoid medicinal doses. Best as part of multi-herb respiratory formula.',
  },

  // ─────────────────────────────────────────────
  // GUARANA (UPDATED)
  // ─────────────────────────────────────────────
  {
    id: 109,
    name: 'Guarana',
    botanical: 'Paullinia cupana (seed — highest caffeine of any plant)',
    tcm_meridians: ['Heart', 'Spleen', 'Kidney Yang'],
    tcm_element: 'Fire',
    energetics: ['Very Warm', 'Dry', 'Stimulating', 'Potent', 'Activating', 'Warrior-Energy'],
    primary_functions: [
      'Acute mental energy and focus — highest natural caffeine (3–5%); adenosine receptor blockade; dopamine and norepinephrine increase',
      'Physical endurance — reduces perceived exertion; psychological stamina enhancement',
      'Thermogenic metabolism — increases metabolic rate 3–11%; stimulates fat oxidation',
      'Sympathetic nervous system activation — full-body arousal for acute demand situations',
      'Traditional Amazonian warrior energy — 1000+ years indigenous use for hunting stamina and endurance',
    ],
    secondary_benefits: [
      'Mood elevation via dopamine and theobromine',
      'Appetite suppression during acute demand periods',
      'Paired with L-Theanine for smoother stimulation without jitteriness',
    ],
    pharmacology:
      'Primary bioactives: caffeine (3–5% — highest of any plant; exceeds coffee 1–2%, tea 0.5–3%; adenosine receptor antagonist; dopamine/norepinephrine stimulation), theobromine (0.5–1%; milder stimulant; mood elevation), theophylline (minor; bronchodilation), saponins (mild adaptogenic-like modulation of pure caffeine effect). ACUTE USE ONLY — tolerance develops with daily use; dependency/addiction risk with chronic use. NOT for daily supplementation. Safer as occasional tool for specific high-demand situations.',
    flavor_profile: 'Bitter, earthy, woody and distinctly stimulating — characteristic high-caffeine signature',
    contraindications: [
      'Hypertension — ABSOLUTELY CONTRAINDICATED: caffeine elevates BP; dangerous',
      'Anxiety disorders — ABSOLUTELY CONTRAINDICATED: stimulant triggers and worsens anxiety; panic risk',
      'Insomnia — ABSOLUTELY CONTRAINDICATED: very stimulating; prevents sleep even with morning use',
      'Heart conditions (arrhythmia, palpitations) — ABSOLUTELY CONTRAINDICATED: tachycardia and arrhythmia risk',
      'Stimulant medications (ADHD meds, amphetamines) — ABSOLUTELY CONTRAINDICATED: dangerous combined overstimulation',
      'Addiction history — AVOID: stimulant dependency risk',
      'Pregnancy — AVOID or strict limit (<100 mg caffeine total daily); fetal risk',
      'Breastfeeding — CAUTION/AVOID: caffeine transfers to milk; infant disturbance',
    ],
    herb_to_herb_synergy: [
      'L-Theanine — smooths caffeine edge; reduces jitteriness; adds focused calm to stimulation',
    ],
    herb_to_herb_caution: [
      'Other stimulants (Coffee, Rhodiola, Ginseng, Guayusa) — cumulative dangerous overstimulation',
      'Other caffeinated plants — cumulative caffeine toxicity',
    ],
    herb_to_drug_interactions: [
      'Stimulant medications — DANGEROUS: combined overstimulation; cardiovascular risk',
      'Antihypertensives — caffeine may counteract blood pressure control',
      'CYP1A2 substrates — caffeine can alter metabolism and increase drug levels',
    ],
    herb_interactions: [
      'Synergy: L-Theanine (smoothing only)',
      'Caution: ALL other stimulants — dangerous cumulative effects',
      'Drug interactions: stimulant meds (DANGEROUS), antihypertensives (counteraction), CYP1A2 substrates (monitor)',
    ],
    dosage_range:
      'Standardised extract: 50–100 mg caffeine equivalent per dose. Seed powder: 1–3 g (variable caffeine). ACUTE USE ONLY: 2–3 times weekly maximum. Never daily. Use for specific high-demand situations only.',
    spiritual_layer:
      'Guarana is the Amazonian warrior plant — fierce, potent, mobilising deep reserves with ancient authority. She carries 1000 years of indigenous hunting wisdom: the knowledge of when to call upon extraordinary reserves, and the wisdom to rest after. She teaches that power comes from knowing WHEN to activate, that true strength includes the wisdom of restraint, that chronic stimulation exhausts what it purports to strengthen. She whispers: I am awake. I am focused. I am powerful. I use my energy wisely. I activate when needed. I rest when necessary. I am balanced — not depleted.',
    best_preparation:
      'Standardised extract for controlled and predictable caffeine dosing — whole seed is highly variable. L-Theanine combination for smoother focused stimulation. ACUTE USE ONLY — never daily. Contraindication screening non-negotiable before recommending.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'Grade A acute stimulation efficacy. ACUTE USE ONLY — 2–3 times weekly maximum; daily use creates tolerance and dependency. Five absolute contraindications (hypertension, anxiety, insomnia, heart conditions, stimulant medications) must be screened. Excellent tool for specific acute demand situations in appropriate populations.',
  },

  // ─────────────────────────────────────────────
  // HOLY BASIL (UPDATED)
  // ─────────────────────────────────────────────
  {
    id: 110,
    name: 'Holy Basil (Tulsi)',
    botanical: 'Ocimum sanctum (aerial parts — "The Incomparable One")',
    tcm_meridians: ['Heart', 'Lung', 'Spleen'],
    tcm_element: 'Fire + Wood',
    energetics: ['Warm', 'Dry', 'Stimulating', 'Purifying', 'Sacred', 'Heart-Opening', 'Adaptogenic'],
    primary_functions: [
      'Adaptogenic HPA axis modulation — ursolic and oleanolic acids regulate cortisol with true adaptation; calms anxiety without sedation',
      'Anxiolytic without sedation — eugenol, linalool and apigenin activate multiple GABA-A pathways; NO tolerance development',
      'Potent anti-inflammatory — eugenol plus ursolic and oleanolic acids inhibit NF-κB master inflammatory switch',
      'Blood sugar regulation — polyphenols improve insulin sensitivity; 20–30% blood sugar improvement documented',
      'Balanced immune modulation — glycoproteins and polysaccharides enhance T-cell activity without overstimulation',
    ],
    secondary_benefits: [
      'Cognitive and memory support through adaptogenic effects and circulation',
      'Traditional fever-reducing and antipyretic actions',
      'Respiratory support as mild expectorant and antimicrobial',
      'Heart-opening and spiritual elevation — 5000+ years Hindu sacred plant (Lakshmi, Krishna)',
    ],
    pharmacology:
      'Primary bioactives: eugenol (up to 40% volatile oil; anti-inflammatory NF-κB inhibition; anxiolytic GABA-A-like; analgesic; antimicrobial), ursolic and oleanolic acids (triterpenoids 0.5–2%; adaptogenic HPA modulation; NF-κB inhibition; anti-inflammatory), linalool and carvacrol (volatile; anxiolytic terpenes; antimicrobial), apigenin and luteolin (flavonoids; GABA-A binding; antioxidant; neuroprotection), glycoproteins and polysaccharides (balanced immune modulation; T-cell enhancement). 100+ studies; Grade B+ adaptogenic; Grade B+ anxiolytic without sedation; Grade B+ anti-inflammatory. CRITICAL: thyroid and diabetes medication monitoring.',
    flavor_profile: 'Peppery, clove-like, warm and pleasantly aromatic — distinctly Tulsi',
    contraindications: [
      'Hypothyroidism on levothyroxine — MONITOR TSH every 4–6 weeks: may alter T4 levels; medication adjustment likely needed',
      'Diabetes medications — MONITOR blood sugar: improves insulin sensitivity; hypoglycaemia risk; medication adjustment likely',
      'Anticoagulants and antiplatelets — THEORETICAL: rare antiplatelet activity; monitor; document',
      'Pregnancy — high-dose concentrated forms: traditional abortifacient associations; culinary tea amounts safe; consult provider',
      'Breastfeeding — tea generally safe; concentrated forms: consult provider',
      'Immunosuppressants — T-cell enhancement may partially counteract; monitor if transplant',
      'Bleeding disorders — rare antiplatelet activity; caution',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha and Rhodiola — triple adaptogenic stress resilience stack',
      'Lemon Balm and Passionflower — comprehensive anxiolytic and nervous system protocol',
      'Ginger and Turmeric — anti-inflammatory and immune support stack',
      'Astragalus — combined immune modulation and stress resilience',
    ],
    herb_to_herb_caution: [
      'Stimulant herbs (Guarana, high-dose Rhodiola) — contradictory adaptogenic vs. stimulant; monitor for overstimulation',
      'Sedative herbs — monitor for excessive sedation (unusual with Holy Basil but possible)',
    ],
    herb_to_drug_interactions: [
      'Levothyroxine — MONITOR TSH: may alter thyroid hormone levels; dose adjustment likely',
      'Diabetes medications — MONITOR glucose: improves insulin sensitivity; hypoglycaemia risk',
      'Anticoagulants and antiplatelets — rare antiplatelet activity; monitor and document',
      'Immunosuppressants — T-cell enhancement; monitor if transplant',
    ],
    herb_interactions: [
      'Synergy: Ashwagandha, Rhodiola, Lemon Balm, Passionflower, Ginger, Turmeric, Astragalus',
      'Caution: stimulant herbs (monitor overstimulation)',
      'Drug interactions: levothyroxine (MONITOR TSH), diabetes meds (MONITOR glucose), anticoagulants (monitor), immunosuppressants (monitor)',
    ],
    dosage_range:
      'Fresh leaf tea: 5–10 fresh leaves steeped 5–10 minutes, 2–3× daily — most potent and pleasant. Dried leaf tea: 1–2 tsp, 2–3× daily. Tincture: 30–60 drops, 2–3× daily. Standardised extract: 300–600 mg, 2× daily. Cycling: 8–12 weeks on, 2–4 weeks off.',
    spiritual_layer:
      'Tulsi — "the incomparable one" — is perhaps the most revered herb in Ayurvedic and Hindu tradition. She is dedicated to Lakshmi and Krishna; every traditional Indian household keeps a Tulsi plant as a living sacred presence. She is sattvic — pure, clarity-producing, consciousness-elevating. She teaches that the sacred lives in the everyday, that daily ritual transforms ordinary action into medicine for the soul, that reverence elevates health and health elevates reverence. She whispers: I am resilient. I am calm and clear. My heart is open. I am sacred and whole. I am elevated and grounded simultaneously. I am at peace with what is.',
    best_preparation:
      'Fresh leaf tea is optimal — most potent, most aromatic, most sacred in preparation. Cycling protocol (8–12 weeks on, 2–4 weeks off). Thyroid and diabetes medication monitoring mandatory. Combine with Ashwagandha and Rhodiola for a powerful adaptogenic stress resilience stack.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ adaptogenic and anxiolytic evidence (100+ studies). CRITICAL monitoring: TSH if on levothyroxine; blood sugar if on diabetes medications. 5000+ years sacred traditional use. Excellent for stress resilience, anxiety without sedation, anti-inflammation and immune modulation. Cycling recommended.',
  },

  // ─────────────────────────────────────────────
  // HOPS
  // ─────────────────────────────────────────────
  {
    id: 243,
    name: 'Hops',
    botanical: 'Humulus lupulus (strobiles — female cones)',
    tcm_meridians: ['Heart', 'Liver', 'Spleen'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Bitter', 'Heavy', 'Sedating', 'Grounding', 'Sleep-Inducing'],
    primary_functions: [
      'Potent sleep promotion — humulone bitter acids act as positive GABA-A modulators; reduce sleep latency and improve non-REM sleep depth',
      'Anxiolytic and nervous tension relief — GABA-A modulation quiets mental chatter, restlessness and somatic agitation',
      'Sedative nervine for wired-but-tired states — heavy, grounding sedative for sympathetic overdrive with underlying fatigue',
      'Bitter digestive — stimulates gastric secretions and bile; appetite activation; GI motility improvement',
      'Mild phytoestrogen — 8-prenylnaringenin and related prenylflavonoids; potential for menopausal symptom and hot flush support',
    ],
    secondary_benefits: [
      'Anxiety combined with insomnia — most effective nervine for the wired-but-exhausted pattern',
      'Combined with Valerian for enhanced sleep quality — classic evidence-based pairing',
      'Post-work mental unwind — "turns the volume down" on CNS after demanding day',
      'Traditional beer-making ingredient — "alehoof" history before widespread hop adoption',
    ],
    pharmacology:
      'Primary bioactives: bitter acids — α-acids (humulone, cohumulone) and β-acids (lupulone) — GABA-A positive modulators promoting non-REM sleep; prenylated flavonoids — xanthohumol, isoxanthohumol, 8-prenylnaringenin (antioxidant; strong phytoestrogen in vitro); essential oils — myrcene, humulene, caryophyllene, linalool (relaxant, spasmolytic). MOOD CAVEAT: "hops depression" — prolonged or high-dose use can deepen low mood in melancholic or depressive individuals; prioritise lighter nervines in baseline depression. Grade B+ sleep promotion; Grade B anxiolytic; Grade B bitter digestive.',
    flavor_profile: 'Intensely bitter, earthy, resinous and distinctive — characteristic brewing signature',
    contraindications: [
      'Depression or low mood — CAUTION/AVOID prolonged or high-dose use: "hops depression" — can deepen melancholic and depressive mood; monitor closely; prioritise lighter nervines',
      'Oestrogen-sensitive cancers (breast, uterine, ovarian) — AVOID: strong phytoestrogenic activity; 8-prenylnaringenin among most potent phytoestrogens identified',
      'Endometriosis and fibroids — CAUTION: phytoestrogenic activity; assess individually',
      'Pregnancy — TRADITIONALLY CONTRAINDICATED: uterine and hormonal concerns plus sedative action; AVOID',
      'Breastfeeding — INSUFFICIENT DATA: sedative and phytoestrogenic exposure to infant; AVOID or use only with specialist guidance',
      'Operating machinery or driving — AVOID after dosing: significant CNS depressant effects; impairs psychomotor performance',
    ],
    herb_to_herb_synergy: [
      'Valerian — powerful sleep synergy; most researched combination for sleep latency and quality',
      'Passionflower — combined GABA modulation; enhanced anxiolytic and sleep protocol',
      'Ashwagandha — deep HPA and GABA support combined with fast-acting sedation',
      'Holy Basil (Tulsi) — lightens emotional tone of Hops blend; counteracts heaviness',
      'Hawthorn — heart-centric rest and repair combined with Hops sedative',
      'Skullcap — non-sedating daytime anxiety plus Hops night sedation; day-night protocol',
    ],
    herb_to_herb_caution: [
      'Valerian — additive deep sedation; use caution with driving or machinery even the following morning',
      'Other CNS depressants — cumulative; monitor',
    ],
    herb_to_drug_interactions: [
      'Benzodiazepines, z-drugs, opioids — ADDITIVE sedation and psychomotor impairment; reduce doses; monitor',
      'Alcohol — markedly increased CNS depression; avoid combination',
      'Hormone therapies and SERMs — phytoestrogenic interaction; monitor',
      'Sedating antihistamines — enhanced drowsiness',
    ],
    herb_interactions: [
      'Synergy: Valerian, Passionflower, Ashwagandha, Holy Basil, Hawthorn, Skullcap',
      'Caution: Valerian (deep sedation — morning driving caution); all CNS depressants',
      'Drug interactions: benzodiazepines (additive — reduce doses), alcohol (avoid), hormone therapies (monitor), antihistamines (enhanced drowsiness)',
    ],
    dosage_range:
      'Tincture: 1–3 ml (20–60 drops), 30–60 minutes before bed for sleep. Calming or digestive: 0.5–1 ml before dinner. Tea: 0.5–1 tsp dried strobiles per 250 ml, covered steep 10–15 minutes, 1–2× daily. Evening use only for sedative purposes.',
    spiritual_layer:
      'Hops is the grounding sedative — the herb that helps the body "stand down" after battle, that signals to the activated nervous system that the threat has passed and rest is now permitted. She is heavy, earthy, bitter — medicine that makes no pretence of subtlety, that announces her arrival with unmistakable weight. She teaches that rest is not weakness but recovery, that the body cannot always be at full activation, that the nervous system requires periods of genuine downregulation to heal and regenerate. She whispers: The tension releases. The mental chatter quiets. You have done enough today. Your body knows how to rest. Let the weight of the day be laid down.',
    best_preparation:
      'Evening use only for sedative purposes. Tincture in 65% ethanol for best bitter acid extraction. Classic combination with Valerian for sleep — most evidence-based pairing. Screen for depression and oestrogen-sensitive conditions before recommending. Short-term use preferred for acute insomnia; monitor mood with longer use.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ sleep and anxiolytic evidence. Excellent for wired-but-tired patterns, stress-related insomnia and nervous tension with underlying fatigue. CRITICAL: avoid in depression (hops depression risk); avoid in oestrogen-sensitive conditions; avoid in pregnancy. Evening use only. Best combined with Valerian for sleep protocols.',
  },

  // ─────────────────────────────────────────────
  // HORSETAIL
  // ─────────────────────────────────────────────
  {
    id: 244,
    name: 'Horsetail',
    botanical: 'Equisetum arvense (sterile aerial shoots — "Living Fossil")',
    tcm_meridians: ['Kidney', 'Bladder', 'Lung'],
    tcm_element: 'Water + Metal',
    energetics: ['Cool', 'Drying', 'Astringent', 'Mineral-Rich', 'Diuretic', 'Structurally-Tonifying'],
    primary_functions: [
      'Diuretic urinary flushing — EMA-recognised; standardised extract clinically comparable to hydrochlorothiazide for urine volume increase',
      'Bone and connective tissue support — silica (5–8% dry weight) promotes collagen synthesis and matrix mineralisation',
      'Hair, nail and skin structural support — silica provides collagen cross-linking and structural integrity throughout connective tissue',
      'Anti-inflammatory and antioxidant — flavonoids (quercetin, kaempferol, apigenin) and phenolic acids reduce oxidative stress',
      'Urinary tract gravel and minor infection adjunct — urinary flushing action supports renal gravel clearance',
    ],
    secondary_benefits: [
      'Smooth muscle relaxant and vascular effects — potential for post-traumatic oedema and microcirculation support',
      'Mild immunomodulatory — T-cell and monocyte modulation in vitro',
      'Ancient living fossil — unchanged for 300 million years; carries primordial mineral wisdom',
      'EMA traditional herbal medicinal product — EU registered for urinary flushing',
    ],
    pharmacology:
      'Primary bioactives: silica and silicic acid (5–8% dry weight; both soluble and insoluble forms; promotes collagen synthesis and matrix mineralisation; supports bone microarchitecture; connective tissue trophic effect on hair, nails, tendons), flavonoids (quercetin, kaempferol, apigenin derivatives; antioxidant; mild diuretic; vasoprotective), phenolic acids (caffeic, ferulic, p-coumaric; antioxidant; anti-inflammatory), saponins and triterpenoids (diuretic; vascular effects). THIAMINASE NOTE: enzyme that degrades thiamine (B1); less concern when properly dried or cooked and at moderate therapeutic doses; caution with long-term high-dose use in thiamine-deficient individuals.',
    flavor_profile: 'Mild, slightly bitter and astringent — pleasant as tea when combined with other herbs',
    contraindications: [
      'Oedema from cardiac or renal insufficiency — REFER TO PHYSICIAN: do not self-treat with herbal diuretics; may indicate serious pathology',
      'Kidney disease — caution with diuretic action; renal monitoring if ongoing use',
      'Thiamine (B1) deficiency — thiaminase enzyme risk with prolonged high-dose use; ensure adequate B vitamin status',
      'Pregnancy — limited safety data; EMA advises avoiding during pregnancy; consult provider',
      'Concurrent diuretic medications — additive diuresis; electrolyte monitoring essential',
      'Nicotine sensitivity (trace alkaloids) — extremely rare; discontinue if reaction',
    ],
    herb_to_herb_synergy: [
      'Nettle Leaf — combined potassium-sparing diuretic and mineral support; classic pairing',
      'Dandelion Leaf — complementary diuretic and urinary support protocol',
      'Calcium, vitamin D and amino acid combination — amplified bone density support',
      'Marshmallow root — urinary soothing combined with flushing action',
    ],
    herb_to_herb_caution: [
      'Other diuretic herbs — cumulative diuresis; electrolyte monitoring essential',
      'Potassium-depleting diuretics — horsetail does not spare potassium like Dandelion; monitor electrolytes',
    ],
    herb_to_drug_interactions: [
      'Diuretic medications — additive diuresis; electrolyte monitoring (especially potassium)',
      'Lithium — diuretic action may alter clearance; monitor lithium levels',
      'Diabetes medications — modest blood sugar effects; monitor',
    ],
    herb_interactions: [
      'Synergy: Nettle Leaf, Dandelion Leaf, Marshmallow Root, Calcium/vitamin D combination',
      'Caution: other diuretics (cumulative); potassium-depleting combinations (monitor electrolytes)',
      'Drug interactions: diuretics (monitor electrolytes), lithium (monitor levels), diabetes meds (monitor glucose)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 2–3× daily. Infusion: 1–2 tsp dried herb per 250 ml, steeped 10–15 minutes, 2–3× daily. Standardised extract (900 mg/day used in clinical trial comparable to hydrochlorothiazide). Safe for weeks to months of use with electrolyte awareness.',
    spiritual_layer:
      'Horsetail is one of the oldest living plants on Earth — a 300 million year old lineage that survived mass extinctions, glaciations and continental drift unchanged. She is the "living fossil" — teaching structural integrity through deep time, resilience through consistency, the building of inner scaffolding that outlasts all apparent catastrophe. She carries the mineral memory of ancient seas in her silica-dense stems. She teaches that true structural strength is built slowly, mineral by mineral, over time — that bones, connective tissue and boundaries are cultivated through patient, consistent nourishment. She whispers: My structure is strong. I am built to last. My bones and tissues are mineralised with ancient wisdom. I stand upright through time.',
    best_preparation:
      'Infusion for gentle daily use. Standardised extract for targeted urinary flushing protocols. Combine with Nettle and Dandelion Leaf for a comprehensive urinary and mineral formula. Screen for cardiac/renal oedema, diuretic medications and thiamine status before recommending.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'EMA-registered traditional herbal medicinal product for urinary flushing. Grade B+ diuretic; Grade B bone and connective tissue support. Screen for serious oedema causes before recommending. Electrolyte monitoring with concurrent diuretics. Safe for weeks to months at standard doses.',
  },

  // ─────────────────────────────────────────────
  // GUAYUSA
  // ─────────────────────────────────────────────
  {
    id: 245,
    name: 'Guayusa',
    botanical: 'Ilex guayusa (leaves — Ecuadorian Amazon)',
    tcm_meridians: ['Heart', 'Liver', 'Kidney'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Dry', 'Highly Stimulating', 'Consciousness-Elevating', 'Lucidity-Enhancing'],
    primary_functions: [
      'Extreme mental energy and wakefulness — highest natural caffeine concentration (2.5–3.5%); longer duration than coffee',
      'Mental clarity and cognitive enhancement — caffeine plus polyphenols sharpen thinking and focus acutely',
      'Lucid dreaming facilitation — traditional Amazonian preparation before sleep raises consciousness baseline during REM',
      'Antioxidant neuroprotection — chlorogenic acid and polyphenols provide free-radical scavenging',
      'Mood elevation via dopamine and theobromine — sustained positive affect alongside stimulation',
    ],
    secondary_benefits: [
      'Physical endurance via adenosine blockade and fatigue perception reduction',
      'Traditional Quechua and Shuar morning ceremony herb — 1000+ years indigenous Amazonian use',
      'Sustainable and indigenous fair-trade cultivated supply chain — ethical sourcing available',
      'Smoother stimulation profile than coffee due to theobromine and polyphenol modulation (anecdotal)',
    ],
    pharmacology:
      'Primary bioactives: caffeine (2.5–3.5% by dried weight — exceeds coffee 1–2% and most teas; highest confirmed natural caffeine concentration; adenosine receptor antagonist; dopamine/norepinephrine stimulation), polyphenols — chlorogenic acid (1–3%; antioxidant; neuroprotective; metabolic support), theobromine (minor; smoother secondary stimulant; mood elevation), volatile aromatic compounds (minor psychoactive properties). Lucid dreaming mechanism: high caffeine baseline during first part of sleep may paradoxically increase dream consciousness during REM rebound in second half (traditional preparation: consumed 4–5 hours before sleep). STIMULANT HERB: same contraindication screening as Guarana required.',
    flavor_profile: 'Bitter, astringent, herbaceous and distinctly caffeinated — less harsh than coffee with grassy-herbal notes',
    contraindications: [
      'Hypertension — ABSOLUTELY CONTRAINDICATED: caffeine elevates BP',
      'Anxiety disorders — ABSOLUTELY CONTRAINDICATED: extreme stimulant; triggers and worsens anxiety',
      'Insomnia — CONTRAINDICATED for daytime energy use if sleep is compromised; lucid dreaming protocol uses specific timing (4–5 hours before bed)',
      'Heart conditions — ABSOLUTELY CONTRAINDICATED: tachycardia and arrhythmia risk',
      'Stimulant medications — ABSOLUTELY CONTRAINDICATED: dangerous combined overstimulation',
      'Pregnancy — LIMIT strictly or AVOID: fetal caffeine risk',
      'Evening use for wakefulness — AVOID: use lucid dreaming protocol (4–5 hours before bed) or morning only',
    ],
    herb_to_herb_synergy: [
      'L-Theanine — smooths stimulation; reduces jitteriness; adds focused calm',
      'Blue Lotus or Mugwort (for lucid dreaming protocol only) — enhanced consciousness and dream vividness when combined with traditional timing',
    ],
    herb_to_herb_caution: [
      'Other stimulant herbs (Guarana, Coffee, Rhodiola) — cumulative overstimulation; dangerous',
    ],
    herb_to_drug_interactions: [
      'Stimulant medications — DANGEROUS: combined overstimulation',
      'Antihypertensives — caffeine may counteract blood pressure control',
      'CYP1A2 substrates — caffeine alters metabolism; monitor drug levels',
    ],
    herb_interactions: [
      'Synergy: L-Theanine (smoothing); Blue Lotus/Mugwort (lucid dreaming protocol only)',
      'Caution: ALL other stimulants — dangerous',
      'Drug interactions: stimulant meds (DANGEROUS), antihypertensives (counteraction), CYP1A2 substrates (monitor)',
    ],
    dosage_range:
      'Energy/cognitive: 2–4 g dried leaves steeped 5–10 minutes, morning to midday only. Lucid dreaming protocol (traditional): 2–4 g consumed approximately 4–5 hours before intended sleep time, combined with intention setting. ACUTE USE: 2–3 times weekly maximum — not daily.',
    spiritual_layer:
      'Guayusa is the consciousness-elevating plant of the Ecuadorian Amazon — the Quechua and Shuar peoples\' pre-dawn ceremony herb, drunk before sunrise as hunters prepare their awareness and their dreams simultaneously. She carries a unique teaching: that consciousness can bridge waking and dreaming, that clarity and lucidity can be cultivated across both states. She is the herb of the liminal hours — the pre-dawn, the threshold between night and day, the hypnagogic space where dreams and waking overlap. She whispers: I am awake in my dreams. My consciousness is clear across all states. I navigate inner and outer worlds with awareness and intention.',
    best_preparation:
      'Morning tea for energy and cognitive clarity. Traditional lucid dreaming protocol: steeped 4–5 hours before intended sleep (specific timing essential). Contraindication screening identical to Guarana required. Not for daily use — tolerance develops.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'Excellent for acute mental energy, cognitive clarity and lucid dreaming protocols. Same contraindication profile as Guarana (hypertension, anxiety, heart conditions, stimulant medications are absolute contraindications). Unique lucid dreaming application when used with traditional timing. Not for daily use.',
  },

  // ─────────────────────────────────────────────
  // HAWTHORN
  // ─────────────────────────────────────────────
  {
    id: 246,
    name: 'Hawthorn',
    botanical: 'Crataegus spp. (leaf with flower — Crataegus folium cum flore; also berries)',
    tcm_meridians: ['Heart', 'Pericardium', 'Spleen', 'Liver'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Moist', 'Sweet', 'Heart-Opening', 'Tonifying', 'Nourishing', 'Emotionally-Supportive'],
    primary_functions: [
      'Positive inotropic — quercetin and hyperoside increase cardiac contractility through improved cardiomyocyte calcium handling; heart beats more efficiently',
      'Vasodilation and blood pressure reduction — flavonoids enhance endothelial NO production; gentle cumulative BP lowering',
      'Antioxidant cardiovascular protection — OPC proanthocyanidins scavenge free radicals in cardiac and vascular tissue',
      'Endothelial function improvement — vascular lining health; atherosclerosis risk reduction',
      'Emotional heart opening — traditional and anecdotal evidence for grief processing, emotional vulnerability and heart-centred presence',
    ],
    secondary_benefits: [
      'Chinese Hawthorn (Shan Zha) digestive use — promotes bile flow and fat digestion',
      'Peripheral circulation improvement for cold extremities and Raynaud\'s',
      'Mild anxiolytic via vitexin and isovitexin GABA activity',
      'Post-cardiac event recovery adjunct under medical supervision',
    ],
    pharmacology:
      'Primary bioactives: flavonoids — quercetin (positive inotrope; increases cardiac contractility via improved calcium handling and cellular energy metabolism; NOT stimulatory — increases efficiency not rate), hyperoside (cardiac contractility; vascular effects; neuroprotective), vitexin and isovitexin (cardiovascular support; mild anxiolytic via GABA activity), OPC proanthocyanidins (1–3%; antioxidant more potent than vitamin C; vascular wall integrity; endothelial health). Multiple clinical trials; German Commission E monograph; SPICE and WS1442 standardised extract studies. Minimum 8 weeks for cardiovascular benefit; peak benefit 3–6 months. Grade B+ positive inotropic; Grade B+ antioxidant cardiovascular; Grade A safety.',
    flavor_profile: 'Gently sweet, slightly tart and warmly floral — pleasant as tea or tincture',
    contraindications: [
      'Serious heart disease — use under medical supervision and alongside (not replacing) pharmaceutical cardiac medications',
      'Cardiac glycosides (digoxin) — potential additive positive inotropic effect; consult cardiologist; dose adjustment may be needed',
      'Antihypertensive medications — additive BP-lowering; monitor blood pressure and coordinate with prescriber',
      'Pregnancy — insufficient modern safety data; traditional use exists; consult provider',
      'Note: Hawthorn is generally very safe; most concern is about ensuring medical supervision in serious cardiac disease, not about the herb itself being dangerous',
    ],
    herb_to_herb_synergy: [
      'Rose — combined heart-opening emotional and physical cardiovascular support',
      'Linden — gentle heart calming and vasodilatory synergy',
      'Motherwort — cardiotonic and emotional heart-opening combined protocol',
      'Garlic and CoQ10 — comprehensive cardiovascular protection stack',
      'Ginkgo — peripheral and cerebral circulation combined enhancement',
    ],
    herb_to_herb_caution: [
      'Cardiac glycoside herbs (Foxglove, Lily of the Valley) — additive inotropic effects; professional supervision required',
    ],
    herb_to_drug_interactions: [
      'Cardiac glycosides (digoxin) — additive positive inotropic; consult cardiologist; monitor heart rate and rhythm',
      'Antihypertensive medications — additive BP-lowering; monitor and coordinate',
      'Phosphodiesterase inhibitors (Viagra, Cialis) — both vasodilatory; monitor for hypotension',
      'Nitrates — both vasodilatory; monitor for hypotension',
    ],
    herb_interactions: [
      'Synergy: Rose, Linden, Motherwort, Garlic, CoQ10, Ginkgo',
      'Caution: cardiac glycoside herbs (additive inotropic — professional supervision)',
      'Drug interactions: digoxin (monitor — additive inotropic), antihypertensives (monitor BP), PDE5 inhibitors (monitor hypotension), nitrates (monitor hypotension)',
    ],
    dosage_range:
      'Tincture: 40–80 drops, 2–3× daily. Standardised extract (WS1442 or equivalent): 300–600 mg, 2–3× daily. Tea: 1–2 tsp dried leaf and flower per 250 ml, steeped 10–15 minutes, 2–3× daily. Minimum 8 weeks before assessing cardiovascular benefit; peak benefit at 3–6 months of consistent use.',
    spiritual_layer:
      'Hawthorn is the heart herb above all others — the thorned guardian of the emotional heart as much as the physical one. In Celtic tradition she is the May tree, the tree of Beltane, the threshold guardian between worlds. Her thorns protect; her flowers open. She teaches that real cardiac strength requires vulnerability, that the open heart is not the weak heart but the most resilient one — the one that can receive love and give it without breaking. She teaches that grief is not weakness but the price of love, and that moving through grief opens the heart to greater capacity. She whispers: Your heart is strong enough to be open. Real strength is vulnerability. I strengthen you from the inside as I open you to connection.',
    best_preparation:
      'Standardised extract for cardiovascular protocols — most reliable dosing. Tea as daily ritual for emotional and preventive use. Medical supervision essential if significant cardiac history. Minimum 8 weeks — this is a slow, cumulative herb. Combine with Linden and Rose for heart-centred emotional and physical protocol.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A safety; Grade B+ cardiovascular efficacy. German Commission E monograph. One of the safest and most evidence-supported cardiovascular herbs. Medical supervision important if on cardiac medications. Minimum 8 weeks for benefit. Profound emotional and physical heart herb — one of the most beloved in Western herbal tradition.',
  },

  // ─────────────────────────────────────────────
  // HORNY GOAT WEED
  // ─────────────────────────────────────────────
  {
    id: 247,
    name: 'Horny Goat Weed',
    botanical: 'Epimedium grandiflorum (aerial parts — Yin Yang Huo)',
    tcm_meridians: ['Kidney', 'Liver', 'Ming Men'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Tonifying', 'Sexual-Fire-Activating', 'Yang-Boosting', 'Circulation-Enhancing', 'Essence-Nourishing'],
    primary_functions: [
      'Sexual function and erectile support — icariin PDE5 inhibition (identical mechanism to sildenafil/Viagra) increases cGMP and penile blood flow',
      'Vasodilation and circulation — systemic vascular dilation improving blood flow throughout body',
      'Bone density support — polysaccharides support osteoblast activation and bone remodelling',
      'Energy and endurance — warm, tonifying Yang energy; reduces fatigue and increases stamina baseline',
      'Traditional Yang tonification — "Yin Yang Huo" (herbal fire for yang); 2000+ years TCM foundational herb',
    ],
    secondary_benefits: [
      'Female sexual health — improved vaginal engorgement and lubrication via vascular mechanism',
      'Osteoporosis prevention adjunct — cumulative bone remodelling support',
      'Neuroprotection — flavonoids and phenolics; cognitive aging support',
      'Testosterone modulation — mixed evidence; likely indirect via vasodilation and confidence rather than direct hormonal',
    ],
    pharmacology:
      'Primary bioactive: icariin (0.5–1%; flavonol glycoside; IDENTICAL mechanism to sildenafil/Viagra — PDE5 inhibitor; increases cGMP → sustained vasodilation → improved erectile blood flow). Other flavonoids (apigenin, luteolin — antioxidant, anti-inflammatory, vascular support), polysaccharides (10–15%; bone cell modulation; immune support), volatile oils (warming, aromatic). CRITICAL: same PDE5 inhibition mechanism as Viagra means IDENTICAL contraindications — cardiovascular screening essential; cardiac disease, nitrates and antihypertensives require medical consultation. Grade B human evidence for erectile function (multiple RCTs); Grade A mechanism (PDE5 inhibition confirmed).',
    flavor_profile: 'Slightly bitter and aromatic with warming herbal character',
    contraindications: [
      'Nitrates (nitroglycerin, isosorbide) — ABSOLUTELY CONTRAINDICATED: combined PDE5 inhibition plus nitrates causes dangerous hypotension; documented risk; same contraindication as Viagra',
      'Serious cardiovascular disease — MEDICAL CONSULTATION REQUIRED: PDE5 inhibition affects cardiac load; risk in unstable angina, recent MI, heart failure',
      'Antihypertensive medications — MONITOR BP: additive vasodilation; risk of hypotension; coordinate with prescriber',
      'Anticoagulants — icariin mild anticoagulant activity; monitor with Warfarin',
      'Hormone-sensitive cancers — limited data on phytoestrogenic effects; consult oncologist',
      'Pregnancy — AVOID: insufficient safety data; androgenic effects',
      'Arrhythmias — CAUTION: PDE5 inhibition may affect cardiac rhythm in susceptible individuals',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha — grounding adaptogenic Yang support combined with PDE5 vasodilation',
      'Tongkat Ali — combined testosterone and erectile support; complementary mechanisms',
      'Maca — comprehensive sexual vitality, hormonal and vascular combined protocol',
      'Ginkgo — enhanced peripheral and penile circulation; vascular synergy',
      'Damiana and Catuaba — complete sexual vitality formula across multiple mechanisms',
    ],
    herb_to_herb_caution: [
      'Nitrate-containing herbs — ABSOLUTELY AVOID combining: dangerous hypotension (same as drug interaction)',
      'Other vasodilatory herbs at high combined doses — monitor blood pressure',
    ],
    herb_to_drug_interactions: [
      'Nitrates (nitroglycerin, isosorbide) — ABSOLUTELY CONTRAINDICATED: severe hypotension risk; identical to Viagra contraindication',
      'Antihypertensive medications — additive BP lowering; monitor; coordinate with prescriber',
      'Warfarin and anticoagulants — icariin mild anticoagulant; monitor INR',
      'Other PDE5 inhibitors (Viagra, Cialis, Levitra) — AVOID: additive PDE5 inhibition; unpredictable hypotension',
    ],
    herb_interactions: [
      'Synergy: Ashwagandha, Tongkat Ali, Maca, Ginkgo, Damiana, Catuaba',
      'Caution: nitrate-containing herbs (ABSOLUTELY AVOID), other vasodilatory herbs (monitor BP)',
      'Drug interactions: Nitrates (ABSOLUTELY CONTRAINDICATED), antihypertensives (monitor), Warfarin (monitor INR), other PDE5 inhibitors (AVOID)',
    ],
    dosage_range:
      'Tincture: 30–60 drops, 1–2× daily. Standardised extract (icariin-standardised): 500–1500 mg daily. Decoction: 1–2 g dried aerial parts per 250 ml, simmered 15 minutes. Cumulative baseline improvement over 2–4 weeks. Acute effect 1–2 hours.',
    spiritual_layer:
      '"Yin Yang Huo" — literally "herbal fire for yang." Epimedium teaches the integration of masculine activation with deeper nourishment, of sexual fire with constitutional essence. The famous name comes from a goat herder who noticed his goats\' dramatically increased sexual activity after grazing on this plant — folk observation confirmed two millennia later by molecular pharmacology. She teaches that sexual vitality is not separate from overall vitality, that the same fire that animates sexuality also animates creativity, courage and authentic power. She whispers: My constitutional fire awakens. My circulation opens. My confidence rises from deep roots. I am awake in my body and vital in my expression.',
    best_preparation:
      'Icariin-standardised extract for reliable PDE5 inhibition dosing. Cardiovascular screening essential (nitrates and cardiac disease are absolute contraindications — identical screening to pharmaceutical PDE5 inhibitors). Combine with Ashwagandha and Maca for a comprehensive sexual vitality protocol.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'Grade B human evidence for erectile function; Grade A mechanism (PDE5 inhibition confirmed). CRITICAL: Nitrate absolute contraindication (same as Viagra). Medical consultation required for cardiovascular disease. Antihypertensive medication monitoring essential. Excellent natural erectile and sexual vitality herb when appropriately screened.',
  },
  // ============================================================
  // BATCH 05 — 7 herbs converted from monographs
  // Ready to merge into src/data/herbsAndProtocols.ts
  // ============================================================

  // ─────────────────────────────────────────────
  // MORINGA
  // ─────────────────────────────────────────────
  {
    id: 248,
    name: 'Moringa',
    botanical: 'Moringa oleifera (leaf — Drumstick Tree, Miracle Tree)',
    tcm_meridians: ['Spleen', 'Lung', 'Liver', 'Kidney'],
    tcm_element: 'Earth + Wood',
    energetics: ['Warm', 'Tonifying', 'Nutritive', 'Energy-Building', 'Anti-Inflammatory', 'Blood-Nourishing'],
    primary_functions: [
      'Supreme nutritive tonification — most nutrient-dense food on Earth; complete amino acid profile (all 9 essential); comprehensive micronutrient repletion',
      'True nourishment-based energy — B vitamins, iron and complete protein support cellular ATP production without stimulation or depletion',
      'Anti-inflammatory — quercetin, kaempferol and polyphenols reduce systemic inflammatory cytokines',
      'Antioxidant defence — exceptional carotenoid, vitamin C, flavonoid and polyphenol density; potent free-radical scavenging',
      'Blood sugar stabilisation — chlorogenic acid and dietary fibre support stable post-meal glucose; alpha-glucosidase inhibition',
    ],
    secondary_benefits: [
      'Blood pressure support — high potassium (15,000+ mg per 100 g dried) plus quercetin support vascular health',
      'Bone density — calcium (2000+ mg per 100 g dried; exceeds dairy) plus magnesium and trace minerals',
      'Immune foundation — vitamin A and C, zinc and polyphenols provide nutritional immune infrastructure',
      'Post-illness and athletic recovery — complete amino acid profile plus minerals support tissue repair and electrolyte repletion',
    ],
    pharmacology:
      'Exceptional nutrient profile: complete protein (25–30% dry leaf, all 9 essential amino acids), vitamins A (8000+ IU/100 g), C (250 mg/100 g), full B-complex, calcium (2000+ mg/100 g dried), iron (28 mg/100 g), magnesium (422 mg/100 g), potassium (15,000+ mg/100 g), zinc, selenium; flavonoids — quercetin, kaempferol, rutin (1–3%; anti-inflammatory); polyphenols — chlorogenic acid (3–5%; blood sugar modulation; antioxidant); sulforaphane precursor (glucosinolates — antioxidant; emerging cancer-preventive); dietary fibre (7–8% dry leaf; prebiotic; glycaemic stabilisation). 300+ studies. 5000+ years Ayurvedic use. Grade A nutritive; Grade B anti-inflammatory and blood sugar support.',
    flavor_profile: 'Slightly bitter, peppery and green with mild mustard-like notes — characteristic glucosinolate signature',
    contraindications: [
      'Thyroid medications (levothyroxine) — trace goitrogenic compounds: MONITOR TSH; theoretical interaction; consult prescriber; generally safe at food doses',
      'Pregnancy — traditionally safe throughout; Ayurvedic use throughout pregnancy; consult provider for high therapeutic doses',
      'Breastfeeding — SAFE; traditionally used as galactagogue to support milk production',
      'Otherwise: Grade A safety — 5000+ years global use as food-medicine with no documented toxicity',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha and Ginseng — combined adaptogenic and nutritive tonification protocol',
      'Turmeric and Ginger — synergistic anti-inflammatory stack',
      'Cinnamon and Gymnema — metabolic and blood sugar combined support',
      'Astragalus — foundational immune plus comprehensive nutritional support',
    ],
    herb_to_herb_caution: [
      'No known herb-to-herb cautions — safe with all herbs',
    ],
    herb_to_drug_interactions: [
      'Thyroid medications — trace goitrogens; monitor TSH; consult prescriber',
      'Diabetes medications — blood sugar-lowering effect; monitor glucose if on hypoglycaemics',
      'No other significant interactions documented',
    ],
    herb_interactions: [
      'Synergy: Ashwagandha, Ginseng, Turmeric, Ginger, Cinnamon, Astragalus',
      'Caution: None significant',
      'Drug interactions: thyroid meds (monitor TSH), diabetes meds (monitor glucose); otherwise minimal',
    ],
    dosage_range:
      'Dried leaf powder: 1–2 teaspoons (5–10 g) in water, smoothie or food, 1–2× daily. Fresh leaf infusion: young leaves steeped 5–10 minutes, 1–2× daily. Tincture: 20–40 drops, 1–2× daily. Safe indefinite daily use — treat as nutritive food-medicine foundation.',
    spiritual_layer:
      'Moringa grows in tropical and subtropical soils that other trees would struggle with, providing complete nourishment from leaves alone — the "Miracle Tree" name earned by feeding malnourished communities across Africa and South Asia. She is the great nourisher, the teacher that true vitality flows from thorough nutrition rather than stimulation, that the body\'s deepest intelligence activates when given what it actually needs. She asks not to be taken dramatically but consistently — a teaspoon of green powder in the morning, day after day, quietly rebuilding what modern living erodes. She whispers: Eat fully. Nourish deeply. Your body deserves complete nutrition. I am whole food medicine. I am the tree of life.',
    best_preparation:
      'Dried leaf powder mixed into morning smoothie or stirred into water — most convenient, most sustainable, longest shelf life. Fresh leaf tea for maximum vitamin C. Universal recommendation: safe for all populations indefinitely. The simplest protocol is also the best: one teaspoon daily, forever.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A nutritive safety — 5000+ years Ayurvedic and African use. Most nutrient-dense commonly available plant on Earth. Excellent foundational daily food-medicine for all populations. Safe in pregnancy and breastfeeding. Only caution: thyroid medication monitoring for trace goitrogens.',
  },

  // ─────────────────────────────────────────────
  // MOTHERWORT
  // ─────────────────────────────────────────────
  {
    id: 249,
    name: 'Motherwort',
    botanical: 'Leonurus cardiaca (aerial parts — flowering tops)',
    tcm_meridians: ['Heart', 'Liver', 'Uterus / Chong Mai', 'Pericardium'],
    tcm_element: 'Fire + Wood',
    energetics: ['Warm', 'Dry', 'Bitter', 'Stimulating', 'Heart-Courageous', 'Emotionally-Moving', 'Uterine-Tonifying'],
    primary_functions: [
      'Cardiotonic support — leonurine alkaloid increases cardiac contractility (positive inotropic) and lowers excessive heart rate (negative chronotropic); improves cardiac efficiency without stimulation',
      'Anxiety with palpitations — dual action: physical heart strengthening plus GABAergic nervous system calming eliminates the fear-palpitation feedback loop',
      'Emotional courage and heart opening — Fire element activation facilitates vulnerability, grief processing and boundary-setting from strength not fear',
      'Menstrual regulation — leonurine mild emmenagogue; stimulates uterine contractions; promotes menstrual flow; regulates delayed or scanty cycles over 3–6 months',
      'PMS support — antispasmodic, emotional tension relief and nervous system grounding for agitation, cramping and premenstrual anxiety',
    ],
    secondary_benefits: [
      'Postpartum uterine involution — traditional weeks 2–12 postpartum herb for tissue recovery and emotional stabilisation',
      'Daytime-appropriate nervine — not sedating; stimulating yet grounding; suitable for work hours',
      'Menstrual cramping relief — iridoid glycoside antispasmodic action plus TCM "moving Qi"',
      '1000+ years European women\'s herb — documented across medieval herbals as maternal, menstrual and cardiac support',
    ],
    pharmacology:
      'Primary bioactive: leonurine (alkaloid 0.05–0.3%; positive inotropic; negative chronotropic; mild uterine stimulant/emmenagogue). Supporting: iridoid glycosides — leonuride, galiridoside (0.2–0.5%; cardioprotective; antispasmodic; anti-inflammatory), flavonoids — rutin, hyperoside, quercetin, kaempferol (0.5–1.5%; antioxidant; vascular support; blood-brain barrier penetration), tannins (5–9%; astringent; antimicrobial; grounding), volatile oils — linalool (0.1–0.3%; mild GABAergic; calming). Grade B cardiovascular; Grade B palpitations; Grade C+ menstrual regulation; Grade A safety.',
    flavor_profile: 'Intensely bitter and slightly acrid — leonurine signature; traditional medicine character',
    contraindications: [
      'Pregnancy (first trimester) — AVOID: leonurine mild emmenagogue; uterine stimulation risk; miscarriage potential',
      'Heavy menstrual bleeding (menorrhagia) — CAUTION/AVOID: uterine stimulation may worsen excess flow',
      'Breastfeeding — generally safe (traditional postpartum herb); monitor infant for sedation (linalool transfer); continue if no adverse effects',
      'Cardiac arrhythmias or severe cardiac instability — USE ONLY WITH MEDICAL SUPERVISION: leonurine cardiac effects require cardiologist awareness',
      'Thyroid hyperthyroidism — CAUTION: possible minor goitrogenic activity (unconfirmed); monitor if thyroid disorder',
      'Strong cardiac herbs (Digitalis, Convallaria) — DO NOT COMBINE without medical coordination',
    ],
    herb_to_herb_synergy: [
      'Hawthorn — comprehensive cardiovascular and emotional heart support; the defining cardiac duo',
      'Lemon Balm and Lavender — anxiety with palpitations triple protocol',
      "Vitex and Lady's Mantle — women's menstrual trinity: hormonal (Vitex) + tissue (Lady's Mantle) + uterine stimulation and emotional (Motherwort)",
      'Rose and Hawthorn — emotional opening and cardiovascular strength combined',
      'Mugwort — menstrual regulation and cycle support (potentiated emmenagogue pairing; use lower individual doses)',
    ],
    herb_to_herb_caution: [
      'Strong uterine stimulants (Blue Cohosh, Pennyroyal at high doses) — combined stimulation may be excessive; use lower individual doses if pairing',
      'Cardiac glycoside plants (Foxglove, Lily of the Valley) — DO NOT COMBINE without medical supervision',
    ],
    herb_to_drug_interactions: [
      'Cardiac medications (beta-blockers, calcium channel blockers, digoxin, antiarrhythmics) — MONITOR: leonurine cardiac effects may interact; consult cardiologist; dose adjustment possibly needed',
      'Hormonal contraceptives and HRT — monitor cycle regularity; theoretical emmenagogue interaction',
      'MAOIs — theoretical weak monoamine interaction (unconfirmed); consult prescriber',
    ],
    herb_interactions: [
      'Synergy: Hawthorn, Lemon Balm, Lavender, Vitex, Rose, Mugwort',
      'Caution: strong uterine stimulants (reduce combined doses); cardiac glycoside plants (no combination without supervision)',
      'Drug interactions: cardiac medications (monitor — consult cardiologist), hormonal therapies (monitor), MAOIs (consult)',
    ],
    dosage_range:
      'Tincture: 20–40 drops (1–2 ml), 2–3× daily. Tea: 1–2 g dried herb steeped 10–15 minutes, 2–3× daily. Daytime appropriate. Follicular phase preferred for menstrual regulation work. For acute PMS: increase to 3× daily starting 5–7 days before expected period.',
    spiritual_layer:
      'Motherwort embodies the fierce mother archetype — the paradox of supreme tenderness held alongside unwavering strength. Her name is her teaching: the mother\'s heart must be strong enough to feel deeply while remaining stable under pressure. She is Fire (courage, passion, activation) grounded in Earth (stability, presence, love). For 1000 years, she has been the herb women reach for when they need to feel braver, when they need to say no from love rather than fear, when they need their heart to be both open and protected. She whispers: Your heart is stronger than you know. Feel deeply and stand firm. Tenderness and strength are the same.',
    best_preparation:
      'Tincture for reliable leonurine extraction and convenient dosing. Fresh-herb tincture at peak bloom for highest potency. Cycle-aware timing: follicular phase for menstrual regulation; throughout cycle for heart and anxiety support. Postpartum use: weeks 2–12 after bleeding stabilises. Pairs definitively with Hawthorn for comprehensive heart medicine.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A safety with appropriate screening. Grade B cardiovascular and palpitation evidence. Absolute contraindication in first trimester. Menorrhagia caution. Excellent as long-term foundational herb for women\'s reproductive, cardiac and emotional work. Daytime appropriate. Cumulative benefit over 2–4 weeks, full menstrual tonification over 3–6 months.',
  },

  // ─────────────────────────────────────────────
  // KRATOM — SAFETY REFERENCE ONLY
  // ─────────────────────────────────────────────
  {
    id: 250,
    name: 'Kratom',
    botanical: 'Mitragyna speciosa (leaf — Southeast Asian — ADDICTION RISK — NOT FOR RECOMMENDATION)',
    tcm_meridians: ['Liver', 'Spleen', 'Heart'],
    tcm_element: 'Wood + Earth + Fire',
    energetics: ['Warm', 'Bitter', 'Pain-Relieving', 'Opioid-Like', 'Dependency-Creating'],
    primary_functions: [
      'SAFETY REFERENCE ONLY — NOT FOR CONSUMER RECOMMENDATION: opioid-like addiction risk',
      'Pain relief via opioid receptor agonism (mitragynine and 7-hydroxymitragynine) — potent acute analgesia comparable to mild opioids',
      'CNS stimulation (low dose) or sedation/euphoria (high dose) — dose-dependent opioid-like effects',
      'Physiological dependency develops within 2–8 weeks of regular use — identical pattern to pharmaceutical opioid analgesics',
      'Withdrawal syndrome on cessation — anxiety, insomnia, muscle aches, sweating, depression, pain rebound lasting 5–10 days',
    ],
    secondary_benefits: [
      'NO RECOMMENDABLE BENEFITS — safer non-addictive alternatives exist for every indication',
      "Safer pain relief: Devil's Claw (Grade B+; no addiction), Black Cumin (pain + immune; no addiction), Ginger (pain; no addiction)",
      'If client already using: harm reduction and addiction medicine referral protocol only',
    ],
    pharmacology:
      'GRADE D — NOT RECOMMENDED FOR CONSUMER USE. Primary alkaloids: mitragynine (1–2%) and 7-hydroxymitragynine (0.01–0.2%) — bind opioid receptors (mu, delta, kappa); identical opioid-like mechanism to pharmaceutical analgesics. Dose-dependent: low doses (1–5 g) stimulating; high doses (15+ g) sedating with euphoria — the high-dose euphoria is the primary addiction driver. Tolerance develops in 1–4 weeks of regular use; physiological dependency in 2–8 weeks; withdrawal syndrome (similar to opioid withdrawal: 5–10 days) upon cessation. Legal status varies by country; legal but controversial in many jurisdictions.',
    flavor_profile: 'Bitter and earthy — characteristic alkaloid signature',
    contraindications: [
      'DO NOT RECOMMEND FOR CONSUMER SELF-CARE — addiction risk unacceptable',
      'Addiction or substance use disorder history — ABSOLUTELY CONTRAINDICATED: high predisposition to opioid-like dependency',
      'Pain management — NOT APPROPRIATE: safer non-addictive alternatives exist; addiction risk outweighs benefit',
      'Mental health conditions — CAUTION: linked to anxiety and depression worsening; consult psychiatrist',
      'Pregnancy and breastfeeding — ABSOLUTELY CONTRAINDICATED: alkaloid safety unknown',
      'Liver disease — CAUTION: rare hepatotoxicity reports documented',
      'Seizure disorders — CAUTION: theoretical risk',
      'CNS depressants (alcohol, benzodiazepines, opioids) — DANGEROUS: additive sedation; respiratory depression risk',
    ],
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [
      'DO NOT COMBINE with any herb — not a recommended herb; if client using, refer to addiction medicine',
      'CNS depressants — DANGEROUS additive sedation',
    ],
    herb_to_drug_interactions: [
      'Opioid medications — DANGEROUS: additive opioid-like effects; addiction compounds',
      'CNS depressants (benzodiazepines, alcohol) — DANGEROUS: additive sedation; respiratory depression',
      'Psychiatric medications — complex interactions; consult prescriber',
      'Liver-metabolised drugs — hepatic CYP450 inhibition possible; drug level changes',
    ],
    herb_interactions: [
      'Synergy: None — do not recommend',
      'Caution: ALL interactions dangerous given opioid-like profile',
      'Drug interactions: opioids (DANGEROUS), CNS depressants (DANGEROUS), psychiatric meds (complex), hepatically metabolised drugs (monitor)',
    ],
    dosage_range:
      "NO DOSAGE RECOMMENDATIONS FOR CONSUMER USE. If client already using: (1) Assess addiction severity — how long, daily doses, withdrawal attempts. (2) Refer to addiction medicine specialist. (3) Dose stabilisation and gradual supervised taper — NEVER abrupt cessation (withdrawal severe). (4) Replace with non-addictive pain relief alternatives: Devil's Claw, Black Cumin, Ginger. (5) Psychological support for recovery.",
    spiritual_layer:
      'Kratom carries the cautionary teaching of potency\'s shadow — the seductive promise of pain relief and euphoria that extracts compound interest from the body\'s systems over time. She teaches the ancient lesson that true healing is sustainable, that relief sought through neurological override rather than genuine repair leaves the door open for dependency. The opioid receptors she activates are the same ones through which the body registers love, belonging and safety — and chronic activation of these pathways through external means gradually erodes the capacity to feel them through life itself. She whispers: Honour your body\'s natural reward systems. Choose sustainable healing. I am not for regular use.',
    best_preparation:
      'NOT FOR RECOMMENDATION. Addiction medicine reference only. If asked by a client, provide non-addictive alternatives and offer to help find appropriate professional support.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      "GRADE D — DO NOT RECOMMEND FOR CONSUMER SELF-CARE. Opioid-like addiction risk (physiological dependency in 2–8 weeks; withdrawal syndrome documented). No consumer wellness protocols. Safer pain relief alternatives: Devil's Claw, Black Cumin, Ginger. If client already using: addiction medicine referral + harm reduction protocol only.",
  },

  // ─────────────────────────────────────────────
  // LADY'S MANTLE (UPDATED)
  // ─────────────────────────────────────────────
  {
    id: 105,
    name: "Lady's Mantle",
    botanical: 'Alchemilla vulgaris / A. xanthochlora (aerial parts — leaves; "Little Alchemist")',
    tcm_meridians: ['Spleen', 'Liver', 'Uterus / Chong Mai'],
    tcm_element: 'Earth + Wood',
    energetics: ['Cool', 'Dry', 'Astringent', 'Tonifying', 'Grounding', 'Patient', 'Restorative'],
    primary_functions: [
      'Uterine tonification — tannins (6–10% gallotannins and ellagitannins) provide astringent tissue toning; improves uterine structural integrity and contractile efficiency over months of use',
      'Menstrual regulation — improved uterine tone enables more regular and efficient menstrual contractions; normalises heavy or irregular cycles',
      'Haemostatic — astringent tannins plus flavonoids tighten capillaries and reduce vascular permeability; reduces excessive menstrual bleeding',
      'Postpartum recovery — accelerates uterine involution; reduces lochia; supports tissue healing in weeks 2–12 postpartum',
      'Connective tissue tonification — astringent action strengthens vascular integrity and collagen throughout the body; varicose veins, haemorrhoids and easy bruising',
    ],
    secondary_benefits: [
      'Anti-inflammatory via salicylic acid (natural aspirin-like compound) and quercetin, rutin and kaempferol',
      'Digestive astringency — tones digestive mucosa; diarrhoea and loose stool support',
      'Antimicrobial via tannin broad-spectrum activity',
      'Named for the Virgin Mary\'s protective mantle — "little alchemist" for dew collected in magical leaf cups; 1000+ years European women\'s herb',
    ],
    pharmacology:
      'Primary bioactive: tannins (6–10% gallotannins and ellagitannins; astringent tissue tonification; haemostasis via capillary tightening; antimicrobial). Supporting: flavonoids — quercetin, rutin, kaempferol, luteolin (2–4%; antioxidant; anti-inflammatory; vascular support), phenolic acids — chlorogenic, caffeic, ellagic (antioxidant; anti-inflammatory), salicylic acid (trace; COX-2 inhibition; analgesic), trace minerals (calcium, magnesium, iron, manganese; connective tissue cofactors). Grade B uterine tonification, haemostasis and menstrual regulation; Grade A+ safety.',
    flavor_profile: 'Mildly astringent, slightly bitter and pleasantly grassy — tannin quality marker',
    contraindications: [
      'Pregnancy (first trimester) — CONSULT PROVIDER: some herbalists advise caution in very early pregnancy (no documented adverse effects; theoretical caution); generally safe from second trimester',
      'Iron deficiency — TIMING CONSIDERATION (not contraindication): tannins reduce iron absorption; separate Lady\'s Mantle from iron supplements by 1–2 hours',
      'Breastfeeding — SAFE: historically postpartum herb; no documented adverse effects',
      'High tannin sensitivity — EXTREMELY RARE: mild GI upset; discontinue if sensitivity occurs',
      'Otherwise: Grade A+ safety — suitable for all ages and populations including children and elderly',
    ],
    herb_to_herb_synergy: [
      "Vitex — hormonal regulation (Vitex) plus tissue tonification (Lady's Mantle); the definitive women's cycle pairing",
      "Motherwort — uterine stimulation and emotional support (Motherwort) plus tissue toning and haemostasis (Lady's Mantle); add Raspberry Leaf for the full reproductive trinity",
      'Raspberry Leaf — both tonifying astringents; powerful postpartum and menstrual dual protocol',
      "Shepherd's Purse — enhanced acute haemostatic support for heavy bleeding",
      'Gotu Kola — connective tissue and nerve support for pelvic floor and tissue repair work',
      'Nettle — comprehensive mineral replenishment and postpartum nourishment',
    ],
    herb_to_herb_caution: [
      'No known herb-to-herb cautions — safe with all herbs',
    ],
    herb_to_drug_interactions: [
      'No known drug interactions — safe with all medications',
      'No CYP450 interactions documented',
      'Iron supplements — separate by 1–2 hours (tannin absorption interference)',
    ],
    herb_interactions: [
      "Synergy: Vitex, Motherwort, Raspberry Leaf, Shepherd's Purse, Gotu Kola, Nettle",
      'Caution: None — safe with all herbs',
      'Drug interactions: None documented; iron supplements (space by 1–2 hours)',
    ],
    dosage_range:
      'Tea: 2–4 g dried leaf steeped 10–15 minutes (longer steep extracts more tannins), 2–3× daily. Tincture: 20–40 drops (1–2 ml), 2–3× daily. Safe indefinite long-term daily use — effects cumulative; minimum 2–4 menstrual cycles before assessing full benefit. Luteal phase emphasis (5–7 days before and through menstruation) for heavy bleeding support.',
    spiritual_layer:
      'Lady\'s Mantle is the gentle grandmother — patient, consistent, foundational. Named for the Virgin Mary\'s protective cloak, she represents gentle protection and the slow work of restoration. She collects dew in her cupped leaves each morning — a daily practice of receiving, of gathering, of patient accumulation. She teaches that deep healing is slow work, that consistency matters more than intensity, that what life and time have worn thin can be rebuilt through patient, repeated attention. She is not dramatic but she is transformative, working cycle by cycle to rebuild uterine tissue, tone blood vessels, and return the body to its natural order. She whispers: You will be restored. Trust the slow repair. I am with you in the patient work, cycle by cycle.',
    best_preparation:
      'Tea (infusion) is preferred — water extraction is most efficient for tannins. Longer steep (10–15 minutes) extracts more tannins. Pair definitively with Vitex for hormonal plus tissue approach to menstrual regulation. Postpartum: begin week 2–3 after initial heavy bleeding stabilises; continue 4–12 weeks alongside Raspberry Leaf and Nettle.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A+ safety — one of the safest herbs in Western herbal tradition; suitable for all ages and populations. Grade B evidence for uterine tonification, haemostasis and menstrual regulation. Requires patience: 2–4 cycles minimum for assessment; 6–12 months for full tonification. Foundational, irreplaceable women\'s reproductive herb.',
  },

  // ─────────────────────────────────────────────
  // LAVENDER
  // ─────────────────────────────────────────────
  {
    id: 251,
    name: 'Lavender',
    botanical: 'Lavandula angustifolia (flowers and aerial parts; essential oil)',
    tcm_meridians: ['Heart', 'Liver', 'Lung'],
    tcm_element: 'Metal + Fire',
    energetics: ['Cool', 'Moist', 'Aromatic', 'Dual GABA + Glutamate', 'Calm-Alert', 'Balancing'],
    primary_functions: [
      'Dual-pathway anxiolytic — linalool enhances GABA and simultaneously reduces glutamate; produces relaxed alertness without sedation or cognitive impairment (unique among nervines)',
      'Parasympathetic activation — linalool plus linalyl acetate shift nervous system toward rest-and-digest while maintaining sympathetic alertness (the calm-alert paradox)',
      'Tension headache and muscle relaxation — linalyl acetate antispasmodic relaxes both skeletal and smooth muscle; topical plus internal synergy for cervicogenic and tension headaches',
      'Sleep quality — removes anxiety barriers to natural sleep onset without suppressing REM or sleep architecture',
      'Daytime-appropriate nervine — maintains full cognitive function while reducing anxiety; safe at work, while driving, during parenting',
    ],
    secondary_benefits: [
      'Antimicrobial — linalool and 1,8-cineole broad-spectrum antibacterial and antifungal; topical wound healing',
      'Anti-inflammatory — linalyl acetate and cineole COX-2 inhibition; systemic inflammatory marker reduction',
      'Neuroprotection — rosmarinic acid and flavonoids cross blood-brain barrier; acetylcholinesterase inhibition; neuroinflammation reduction',
      '2000+ years cross-cultural use — ancient Greek, Roman and medieval herbalism for anxiety, sleep and wound healing',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (0.5–3%; linalool 25–50% — primary anxiolytic, GABA enhancement and glutamate reduction; linalyl acetate 10–45% — antispasmodic, anti-inflammatory, anxiolytic potentiator; camphor 0.5–3% — slight sympathetic tone preventing complete sedation; 1,8-cineole 1–5% — respiratory, anti-inflammatory, mild stimulant; beta-caryophyllene 1–3% — anti-inflammatory, CB2 agonist). Supporting: flavonoids — chrysoeriol, luteolin (0.5–1.5%; antioxidant; neuroprotective), polyphenols — rosmarinic and caffeic acids (blood-brain barrier penetration; neuroprotective), coumarins — herniarin, umbelliferone (mild antispasmodic). KEY DISTINCTION from chamomile: Lavender = dual GABA + glutamate (calm-alert); Chamomile = partial GABA agonist (gentle calm); Valerian = full GABA modulation (sedating). Grade A anxiolytic; Grade B+ sleep; Grade A safety.',
    flavor_profile: 'Floral, sweet, slightly herbaceous and distinctively aromatic — pleasant and universally accessible',
    contraindications: [
      'Essential oil undiluted on skin — ALWAYS dilute to 2–3% in carrier oil; never apply neat (irritation risk)',
      'Pregnancy first trimester — CAUTION with high-dose essential oil; tea and tincture are safer; generally regarded as safe after first trimester',
      'Infants under 6 months — avoid essential oil (immature detoxification); diluted tea is safe',
      'Essential oil internally undiluted — AVOID: mucous membrane irritation; use tincture or tea instead',
      'Otherwise: Grade A safety — suitable for all ages, all populations, all medications',
    ],
    herb_to_herb_synergy: [
      'Chamomile and Lemon Balm — triple gentle nervine (all GABA-enhancing, complementary mechanisms); comprehensive anxiety and sleep formula',
      'Passionflower — enhanced sleep support; deeper relaxation; additive manageable effect',
      'Rose and Hawthorn — heart-opening emotional ease trio',
      'Rosemary — balances lavender\'s cooling with circulatory warming; enhanced "calm alert"',
      'Peppermint (topical) — synergistic headache relief; cooling and tension release',
      'Valerian — additive sedation for serious insomnia (reduce Valerian dose when combining)',
    ],
    herb_to_herb_caution: [
      'Valerian at high combined doses — additive sedation; monitor and reduce Valerian dose',
    ],
    herb_to_drug_interactions: [
      'Benzodiazepines — THEORETICAL mild additive GABAergic effect (different mechanism); generally safe; monitor if combining high doses',
      'No CYP450 interactions; no protein binding competition; no absorption interference documented',
      'Safe with all medications — no drug interactions confirmed',
    ],
    herb_interactions: [
      'Synergy: Chamomile, Lemon Balm, Passionflower, Rose, Hawthorn, Rosemary',
      'Caution: Valerian at high combined doses (monitor sedation)',
      'Drug interactions: benzodiazepines (mild theoretical additive; generally safe); otherwise NONE — safe with all medications',
    ],
    dosage_range:
      'Tea: 1–2 g dried flowers per 250 ml, steeped 5–10 minutes, 1–3× daily. Tincture: 20–40 drops, 2–4× daily or as needed. Essential oil aromatic: 2–5 drops on diffuser, pillow or tissue — fastest effect (seconds to minutes). Essential oil topical (diluted 2–3%): massage to temples, neck and shoulders for tension headaches. Never ingest essential oil undiluted.',
    spiritual_layer:
      'Lavender is the harmoniser, the herb of paradox resolved — she teaches the nervous system that calm and clarity are not opposites, that rest and awareness coexist, that one can be fully present without being fully activated. In Metal element terms, she is the boundary herb: strengthening the membrane between self and the world so that what comes in can be processed without overwhelming, and what goes out reflects genuine presence rather than reactivity. Her two-thousand-year track record across every major healing tradition speaks to something fundamental about human nervous systems and the medicine they need. She whispers: Peace does not mean sleep. You can be calm and awake. You can be open and safe. You can hold both clarity and rest. Ease is your birthright.',
    best_preparation:
      'Aromatic inhalation (essential oil on tissue or diffuser) for acute anxiety — fastest route, seconds to minutes. Daily tea for foundational anxiety baseline. Diluted topical oil plus internal tincture for tension headaches. Safe as a daily indefinite foundation herb for all populations. No drug screening necessary.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A anxiolytic evidence (multiple RCTs; 30–40% anxiety reduction; comparable to benzodiazepines for mild anxiety). Grade A safety — 2000+ years global use. Universal nervine: daytime appropriate, all ages, all medications. The defining "calm-alert" herb. No drug interactions confirmed.',
  },

  // ─────────────────────────────────────────────
  // LEMON BALM
  // ─────────────────────────────────────────────
  {
    id: 252,
    name: 'Lemon Balm',
    botanical: 'Melissa officinalis (leaves — "Melissa")',
    tcm_meridians: ['Liver', 'Heart', 'Pericardium'],
    tcm_element: 'Metal + Wood',
    energetics: ['Cool', 'Moist', 'Gentle', 'Calming without Sedation', 'Mood-Uplifting', 'Viral-Protective'],
    primary_functions: [
      'Nervous system soothing without sedation — volatile oils, rosmarinic acid and flavonoids enhance GABAergic tone without direct receptor agonism; paradoxical calm-clarity effect',
      'Antiviral for HSV and EBV — rosmarinic acid inhibits herpes simplex virus replication and blocks viral attachment to cells; topical plus internal protocol for cold sores',
      'Mood elevation — citral, limonene and monoamine modulation produce simultaneous calm and uplift; emotional lightness without overstimulation',
      'Anxiety-driven insomnia — calms racing mind; removes anxiety barriers to sleep onset; supports deeper sleep quality',
      'Heart calming — palpitations, emotional safety, grief processing; opens the pericardial protective space',
    ],
    secondary_benefits: [
      'Digestive carminative — volatile oils relax GI smooth muscle; gas, bloating and cramping relief',
      'Mood support in mild depression — monoamine reuptake inhibition; emotional heaviness eases',
      'German Commission E monograph for nervous restlessness and sleep disturbance',
      'Safe in pregnancy and breastfeeding — food-herb tradition; 2000+ years European use',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (0.03–0.3%; citral, geranial, neral, limonene, linalool — GABA modulation; uplifting aromatherapeutic effects), rosmarinic acid (phenolic acid 3–5%; PRIMARY ANTIVIRAL — inhibits HSV replication and viral attachment; potent antioxidant; acetylcholinesterase inhibition; anti-inflammatory), flavonoids — luteolin, apigenin, hesperidin (1–2%; GABA modulation; anxiolytic; neuroprotective), tannins (trace; antiviral; antimicrobial), triterpenes — β-caryophyllene (endocannabinoid modulation; anxiolytic). Paradoxical effect: calming + uplifting simultaneously via GABA enhancement plus monoamine modulation. Grade B anxiety; Grade B viral support (HSV); Grade A safety.',
    flavor_profile: 'Fresh, lemon-scented, gently sweet and brightening — one of the most pleasantly aromatic medicinal herbs',
    contraindications: [
      'Thyroid conditions (hypothyroidism) — MONITOR: historical concern about thyrotropin suppression; monitor TSH with regular high-dose use; consult provider',
      'Pregnancy — SAFE: gentle, soothing, traditionally used; tea and tincture appropriate',
      'Breastfeeding — SAFE: mild and supportive; no documented adverse effects',
      'No significant contraindications or drug interactions — Grade A safety profile',
    ],
    herb_to_herb_synergy: [
      'Passionflower — excellent sleep synergy; dual nervine GABA support',
      'Valerian — triple sleep formula (Lemon Balm + Passionflower + Valerian)',
      'St. John\'s Wort — mood and viral support combined; complementary mechanisms',
      'Chamomile — dual gentle soothing nervine for anxiety and digestive ease',
      'Lavender — triple gentle nervine formula (Lavender + Lemon Balm + Chamomile)',
      'Motherwort — anxiety with palpitations combined protocol',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions — safe with all herbs',
    ],
    herb_to_drug_interactions: [
      'No known drug interactions — safe with all medications',
      'Thyroid medications — monitor TSH with high-dose regular use (theoretical concern)',
      'Sedatives and psychiatric medications — generally safe and compatible; mild additive calming is usually beneficial not problematic',
    ],
    herb_interactions: [
      'Synergy: Passionflower, Valerian, St. John\'s Wort, Chamomile, Lavender, Motherwort',
      'Caution: None significant',
      'Drug interactions: None confirmed; thyroid meds (monitor TSH with high-dose use); sedatives (mild additive — usually beneficial)',
    ],
    dosage_range:
      'Tincture (fresh herb most potent for viral use): 20–40 drops, 2–4× daily. Tea: 2–4 g dried herb per 250 ml, steeped 5–10 minutes, 2–3× daily. Topical (cold sores): fresh herb juice or cooled strong tea applied 3–4× daily plus internal tincture simultaneously. Safe indefinite daily use.',
    spiritual_layer:
      'Lemon Balm opens the heart\'s window to lightness — she is the herb of paradox, producing calm and joy simultaneously rather than forcing a choice between them. Her name "Melissa" means bee in Greek, and her flowers are beloved by bees: she carries the quality of sweet, purposeful industry combined with the ease of a creature that finds nourishment everywhere it lands. She is the gentle guardian of ease, teaching the nervous system that safety and openness can coexist, that the heart can be calm without being closed, bright without being agitated. She whispers: You are safe. Your heart is open. Breathe. Release. Feel light. I am the sweetness at the centre of the nervous system\'s storm.',
    best_preparation:
      'Fresh herb tincture for maximum viral support (highest rosmarinic acid). Daily tea for nervine and mood foundation. Cold sore protocol: topical fresh herb simultaneous with internal tincture (synergistic). Safe in all populations including pregnancy, breastfeeding, children. No drug interaction screening required.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety — German Commission E monograph. Food herb tradition with excellent safety record. Grade B anxiety and viral support (HSV). Unique paradoxical calm-uplift effect. Safe in pregnancy and breastfeeding. No drug interactions confirmed. Excellent everyday nervine for all populations.',
  },

  // ─────────────────────────────────────────────
  // LINDEN
  // ─────────────────────────────────────────────
  {
    id: 253,
    name: 'Linden',
    botanical: 'Tilia cordata / Tilia europaea (flowers with bracts)',
    tcm_meridians: ['Heart', 'Liver', 'Spleen'],
    tcm_element: 'Water + Fire',
    energetics: ['Cool', 'Moist', 'Sweet', 'Gentle', 'Soothing', 'Heart-Centering', 'Non-Sedating'],
    primary_functions: [
      'Non-sedating anxiolytic — quercetin and kaempferol flavonoids provide gentle GABA modulation without CNS suppression; calm alertness maintained',
      'Gentle sleep support — mucilage soothes nervous system; flavonoids remove anxiety barriers to natural sleep without forcing or suppressing architecture',
      'Heart opening and emotional facilitation — facilitates vulnerability, grief processing and emotional opening at the nervous system\'s own pace',
      'Diaphoretic fever support — promotes gentle sweating; particularly valued for childhood fevers and acute illness',
      'Mild cardiovascular support — gentle vasodilatory effect; mild blood pressure regulation through flavonoid action',
    ],
    secondary_benefits: [
      'Neuroprotection via flavonoid antioxidant and anti-inflammatory action',
      'Children\'s nervine — pleasant taste, excellent safety, deep traditional use for anxiety, sleep and fever',
      'Benzodiazepine tapering support — provides gentle GABA support as pharmaceuticals are reduced',
      'Sacred Germanic and Nordic tree of love and protection — 1000+ years European tradition as village gathering tree and heart herb',
    ],
    pharmacology:
      'Primary bioactives: flavonoids (2–3%; quercetin, kaempferol, isorhamnetin — gentle GABA modulation WITHOUT direct CNS suppression; anxiolytic without sedation), volatile oils (0.1–0.5%; eugenol-like compounds, linalool — anxiolytic, calming, mood-altering), mucilage (demulcent; soothes nervous system and respiratory tract; supports gentle sleep), tannins (trace; astringent; mild antimicrobial). KEY DISTINCTION: flavonoid anxiolytic mechanism differs fundamentally from benzodiazepines or Valerian — works at neuronal level to reduce anxiety signals without suppressing overall CNS activity; nervous system remains alert and functional. Grade B+ non-sedating anxiolytic; Grade B sleep quality; Grade A safety.',
    flavor_profile: 'Delicately sweet, honey-like and gently floral — one of the most pleasant medicinal teas',
    contraindications: [
      'Low blood pressure (hypotension) — MONITOR: mild vasodilatory effect could further lower already-low BP; generally safe with awareness',
      'Sedative medications — MONITOR mild additive calming (usually benign; can support benzodiazepine tapering)',
      'Antihypertensive medications — mild additive BP-lowering; monitor; may allow dose reduction with prescriber support',
      'Otherwise: Grade A safety — suitable for all populations including children, elderly, pregnant, breastfeeding',
    ],
    herb_to_herb_synergy: [
      'Hawthorn — the heart herb pairing: Linden emotional opening plus Hawthorn cardiovascular strength',
      'Rose Petals — heart-opening emotional ease and self-compassion formula',
      'Passionflower and Chamomile — gentle non-forcing sleep and anxiety triple protocol',
      'Motherwort — emotional courage (Motherwort) combined with emotional ease (Linden); complementary heart medicines',
      'Lavender — dual non-sedating anxiolytic protocol for daytime anxiety management',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions — safe with all herbs; tends to enhance rather than conflict',
    ],
    herb_to_drug_interactions: [
      'Antihypertensives — mild additive BP-lowering; monitor blood pressure',
      'Benzodiazepines — mild additive calming; often beneficial in tapering protocols',
      'No CYP450 interactions; no protein binding competition; no absorption interference documented',
    ],
    herb_interactions: [
      'Synergy: Hawthorn, Rose, Passionflower, Chamomile, Motherwort, Lavender',
      'Caution: None significant — enhances rather than conflicts',
      'Drug interactions: antihypertensives (monitor BP), benzodiazepines (mild additive — usually beneficial for tapering); otherwise minimal',
    ],
    dosage_range:
      'Tea: 1–2 tsp dried flowers steeped 5–15 minutes (longer steep extracts more mucilage and flavonoids), 2–3× daily. Tincture: 30–60 drops, 2–3× daily. Children\'s fever: 1–2 tsp flowers steeped 5–10 minutes, given warm 3–4× daily during acute fever. Safe indefinite daily use — effects improve and deepen over months of consistent use.',
    spiritual_layer:
      'Linden is the tree of love — in Germanic and Nordic traditions she is sacred to Freya, the goddess of love; village assemblies were held beneath her canopy; she is the tree where judgements of the heart were made. Her sweetness is not passive: it is the active, generous sweetness of a tree that has stood for centuries providing shade, medicine, food for bees and sanctuary for communities. She teaches that gentleness is strength, that cooling someone\'s fever with loving care is as effective as forcing relief, that emotional opening need not be traumatic. She teaches that one can arrive at vulnerability gradually, safely, at the nervous system\'s own pace. She whispers: I am gently held. My heart can open safely. Ease comes naturally. Gentleness is my strength.',
    best_preparation:
      'Longer steep (10–15 minutes) for full mucilage extraction — most soothing and complete preparation. Evening ritual tea for sleep. Daytime tea for anxiety management while maintaining full function. The definitive gentle nervine for children, elderly and sensitive individuals. No drug interaction screening necessary. Combines definitively with Hawthorn for the heart herb protocol.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety — universally safe; all populations, all ages, all medications. Grade B+ non-sedating anxiolytic evidence. Unique quality: maintains full alertness and cognitive function while reducing anxiety. Gets better with long-term consistent use. Excellent children\'s herb. The most gentle and universally applicable nervine in Western herbal tradition.',
  },
  // ============================================================
  // BATCH 06 — 20 herbs converted from monographs
  // Ready to merge into src/data/herbsAndProtocols.ts
  // ============================================================

  // ─────────────────────────────────────────────
  // JASMINE (already in batch_03 as id:215 area — new id here)
  // ─────────────────────────────────────────────
  {
    id: 254,
    name: 'Jasmine',
    botanical: 'Jasminum officinale / Jasminum sambac (flowers — harvested at dusk)',
    tcm_meridians: ['Heart', 'Liver', 'Kidney'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Aromatic', 'Heart-Opening', 'Spirit-Calming', 'Joy-Promoting', 'Sleep-Supporting'],
    primary_functions: [
      'Heart-centre opening — 200+ aromatic compounds in essential oil activate olfactory limbic system (amygdala, hippocampus); profound emotional and spiritual opening',
      'Mood elevation and joy — linalool, methyl anthranilate and indole compounds lift mood and promote pleasure; antidepressant-like effect',
      'Sleep support — linalool-rich aromatic relaxation eases sleep onset; emotional ease facilitates rest',
      'Aphrodisiac and sensuality — traditional night-blooming aromatic; indole compounds provide animalic pheromone-like qualities',
      'Spiritual and emotional connection — centuries of Persian, Indian and Middle Eastern ceremonial flower medicine',
    ],
    secondary_benefits: [
      'Antioxidant and anti-inflammatory via trace flavonoids (rutin and others)',
      'Anxiety reduction via aromatic linalool pathway',
      'Social and intimate confidence as secondary effect of emotional opening',
      'Aromatic ritual value — transforms medicine compliance into sensory ceremony',
    ],
    pharmacology:
      'Primary bioactives: essential oil (0.1–0.3%; one of most complex essential oils with 200+ aromatic compounds; benzyl acetate, linalool, methyl anthranilate, indole, skatole — mood-lifting, emotionally opening, limbic activating). Supporting: flavonoids — rutin (trace; antioxidant; anti-inflammatory), volatile indole compounds (aromatic; pheromone-like theoretical effect). Mechanism: olfactory aromatherapy (smell → limbic system activation) bypasses intellectual resistance and opens emotional centres directly. Grade C emotional opening and sleep support; Grade A safety. CAUTION: pregnancy uterine stimulation tradition — avoid during pregnancy.',
    flavor_profile: 'Intoxicatingly sweet, floral and complex — fresh flowers most aromatic; dried retain characteristic jasmine essence',
    contraindications: [
      'Pregnancy — AVOID: traditional uterine-stimulating associations; insufficient modern data; consult prenatal provider',
      'Breastfeeding — LIKELY SAFE: limited data; consult provider',
      'Otherwise: Grade A safety — centuries traditional use with no documented toxicity',
    ],
    herb_to_herb_synergy: [
      'Rose — dual emotional heart opening; complementary aromatic pairing',
      'Damiana — pleasure, confidence and sensuality combined protocol for intimacy',
      'Lemon Balm — gentle calm and clarity with jasmine heart opening',
      'Passionflower — enhanced sleep and emotional ease combined',
    ],
    herb_to_herb_caution: [
      'Other uterine-stimulating herbs in pregnancy context — avoid combination',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented',
      'Minimal systemic absorption from flower tea; interaction risk very low',
    ],
    herb_interactions: [
      'Synergy: Rose, Damiana, Lemon Balm, Passionflower',
      'Caution: uterine-stimulating herbs in pregnancy',
      'Drug interactions: None documented',
    ],
    dosage_range:
      'Fresh flower infusion: 5–10 fresh flowers steeped 5–10 minutes, 1–2× daily (evening optimal). Dried flower infusion: 2–4 g steeped 5–10 minutes, 1–2× daily. Tincture (fresh flowers): 15–30 drops, 1–2× daily. Aroma is the primary therapeutic vehicle — fresh flowers offer the most profound aromatic experience.',
    spiritual_layer:
      'Jasmine is the night-blooming flower — she opens in darkness when most flowers close, teaching that beauty happens in surrender, not effort, and that vulnerability blossoms in the tender hours. For centuries in Persia, India and the Middle East she has been the flower of spiritual ceremony, love and the sacred feminine. Her fragrance is said to dissolve the armour around the heart without force — gently, inevitably, through the olfactory gateway that bypasses rational resistance and speaks directly to the limbic soul. She teaches that fragrance is essence, that emotion is truth, that opening the heart is not dangerous but liberating. She whispers: My heart is open. I am joyful. I am vulnerable. I am beautiful. Beauty happens in the dark.',
    best_preparation:
      'Fresh flowers harvested at dusk (peak aromatic oil concentration) steeped in hot water — most potent and most ceremonially meaningful. Aromatic engagement is primary: slow sensory attention to scent, colour, taste and warmth transforms medicine into ritual. Evening use optimal for sleep and emotional opening.',
    caution_level: 'LOW',
    safe_pregnancy: false,
    status:
      'Grade A safety — centuries traditional use. Grade C emotional opening evidence (aromatherapy plausible mechanism; limited RCTs). Avoid in pregnancy. Excellent for emotional opening, mood elevation, sleep support and sensual pleasure. Aroma is the primary therapeutic vehicle.',
  },

  // ─────────────────────────────────────────────
  // JUNIPER
  // ─────────────────────────────────────────────
  {
    id: 255,
    name: 'Juniper',
    botanical: 'Juniperus communis (ripe cone-berries — short-term use only)',
    tcm_meridians: ['Kidney', 'Bladder', 'Lung', 'Spleen'],
    tcm_element: 'Water + Metal + Fire',
    energetics: ['Warm', 'Pungent', 'Aromatic', 'Drying', 'Diuretic', 'Carminative'],
    primary_functions: [
      'Diuretic urinary flushing — terpinen-4-ol and essential oils increase urinary volume; EMA-assessed primary action is water diuresis',
      'Digestive carminative — aromatic essential oils (α-pinene, limonene) reduce gas and stimulate gastric secretions; bloating and dyspepsia in cold-damp patterns',
      'Short-term urinary tract support — traditional urinary antiseptic; antimicrobial activity of essential oil against urinary pathogens',
      'Warming circulation — aromatic drying quality warms cold stagnation patterns in lower burner',
      'Traditional gin flavouring herb — centuries European food-medicine integration',
    ],
    secondary_benefits: [
      'Antimicrobial in vitro — essential oil activity against bacteria, fungi and viruses',
      'Antioxidant via flavonoids and polyphenols',
      'Traditional rheumatism support via warming circulatory action',
      'Ritual purification smoke — traditional fumigant and ceremonial cleansing herb',
    ],
    pharmacology:
      'Primary bioactives: essential oil (0.5–3%; α-pinene, sabinene, myrcene, limonene, terpinen-4-ol — diuretic via increased glomerular filtration; carminative; antimicrobial; counterirritant). Supporting: flavonoids and polyphenols (antioxidant; anti-inflammatory), sugars, organic acids, tannins. EMA traditional monograph: primary action is water diuresis; urinary antiseptic claim considered secondary and disputed. DURATION LIMIT: maximum 2–4 weeks due to renal irritation risk with prolonged use.',
    flavor_profile: 'Aromatic, piney, resinous and slightly bitter — characteristic gin juniper signature',
    contraindications: [
      'Kidney disease (nephritis, serious renal disorders) — CONTRAINDICATED: juniper may irritate kidney parenchyma',
      'Pregnancy — AVOID: traditionally considered emmenagogue and abortifacient at higher doses',
      'Breastfeeding — AVOID medicinal doses: insufficient safety data',
      'Long-term use (>4 weeks) — NOT RECOMMENDED: renal irritation risk accumulates',
      'Diuretic medications — CAUTION: additive diuresis and electrolyte effects; monitor',
      'Nephrotoxic medications — CAUTION: theoretical additive renal risk',
    ],
    herb_to_herb_synergy: [
      'Marshmallow and Corn Silk — demulcent mucosal protection combined with juniper diuretic flushing',
      'Fennel and Ginger — digestive carminative formula for cold-damp bloating',
      'Goldenrod and Uva Ursi — urinary antimicrobial and flushing combined short-term protocol',
    ],
    herb_to_herb_caution: [
      'Other diuretic herbs — additive diuresis; electrolyte monitoring',
      'Other nephrotoxic or kidney-stressing herbs — avoid combination in kidney-sensitive individuals',
    ],
    herb_to_drug_interactions: [
      'Diuretic medications — additive effects; monitor hydration and electrolytes',
      'Nephrotoxic drugs — theoretical risk; avoid combination',
      'Diabetes medications — monitor glucose (mild metabolic effects possible)',
    ],
    herb_interactions: [
      'Synergy: Marshmallow, Corn Silk, Fennel, Ginger, Goldenrod',
      'Caution: other diuretics (cumulative); nephrotoxic herbs (avoid stacking)',
      'Drug interactions: diuretics (monitor), nephrotoxic drugs (avoid), diabetes meds (monitor)',
    ],
    dosage_range:
      'Tea: 2–3 g freshly crushed berries per 150 ml, steeped 10–15 minutes, 2–3× daily — MAXIMUM 2–4 weeks. Tincture: 1–2 ml, 2–3× daily for digestive use. Always combine with high fluid intake. Duration cap is non-negotiable.',
    spiritual_layer:
      'Juniper is the cleansing fire and clear waters — one of the oldest ritual plants in the Northern Hemisphere, burned as purifying smoke from Scandinavia to Tibet, its smoke used to clear spaces of stagnant or harmful energies. She teaches that purification is powerful and necessary but must be time-limited and respectful of the organs that do the clearing — the kidney and bladder are not filters to be permanently flushed but living organs requiring gentleness after the work is done. She whispers: I release what I no longer need and honour the vessels that carry my waters. Purification is powerful. Duration matters.',
    best_preparation:
      'Freshly crushed berries steeped in hot water — crushing releases the essential oils that carry both the flavour and the therapeutic action. Always use high fluid intake alongside. Combine with marshmallow or corn silk to protect mucosal surfaces during flushing. Hard duration cap: 2–4 weeks maximum.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ short-term diuretic and carminative. EMA traditional herbal medicinal product for urinary flushing. HARD LIMIT: 2–4 weeks maximum due to renal irritation risk. Contraindicated in kidney disease. Avoid in pregnancy. Short-term, well-hydrated, demulcent-supported use only.',
  },

  // ─────────────────────────────────────────────
  // KANNA
  // ─────────────────────────────────────────────
  {
    id: 256,
    name: 'Kanna',
    botanical: 'Sceletium tortuosum (fermented dried leaves — traditional Khoi preparation)',
    tcm_meridians: ['Heart', 'Liver', 'Spleen'],
    tcm_element: 'Fire + Earth',
    energetics: ['Cool', 'Mood-Lifting', 'Anxiety-Relieving', 'Spirit-Calming', 'Social-Connecting', 'Pleasure-Enhancing'],
    primary_functions: [
      'Mood elevation via serotonin reuptake inhibition — mesembrine alkaloid mechanism similar to SSRIs but natural and gentler',
      'Anxiety relief — serotonin support combined with direct anxiolytic action; calm accessible within 15–30 minutes',
      'Social connection enhancement — uniquely elevates comfort in social situations and pleasure in shared presence',
      'Pleasure enhancement — heightens sensory and emotional pleasure; increases life satisfaction',
      'Natural SSRI-like alternative — fermented Sceletium as gentler, non-pharmaceutical mood support',
    ],
    secondary_benefits: [
      'Neuroprotection via polyphenol antioxidant activity',
      'Non-addictive mood support — no tolerance or dependency development',
      'Centuries of Khoi Southern African traditional use for mood and social ceremony',
      'Cumulative baseline mood improvement over 1–2 weeks of consistent use',
    ],
    pharmacology:
      'Primary bioactives: alkaloids — mesembrine and analogues (0.1–0.8%; serotonin reuptake inhibition — similar mechanism to SSRIs; natural and gentler; mood elevation, anxiety relief, social ease), polyphenols and tannins (antioxidant; mood support), volatile aromatic compounds (social enhancement). Fermented preparation (traditional Khoi sun-drying and fermentation) concentrates alkaloids — use lower doses (0.5–1 g fermented = 1–2 g unfermented). Grade B mood and anxiety evidence; Grade B safety (serotonin monitoring required). Centuries traditional use from the Khoi people of South Africa.',
    flavor_profile: 'Moderately bitter with herbal and slightly fermented character — traditional preparation distinctively earthy',
    contraindications: [
      'SSRIs and SNRIs — MONITOR: serotonin syndrome risk (theoretical — unlikely at normal doses but possible); CONSULT PRESCRIBER before combining',
      'MAOIs — CONTRAINDICATED: serotonin syndrome risk',
      'Bipolar disorder — CAUTION: mood-elevating properties may trigger mania; consult prescriber',
      'Pregnancy — CAUTION: serotonin-active alkaloids; consult provider; likely avoid',
      'Breastfeeding — CAUTION: alkaloid transfer possible; consult provider; likely avoid or minimal use',
    ],
    herb_to_herb_synergy: [
      'Passionflower and Lemon Balm — comprehensive mood, anxiety and relaxation triple protocol',
      'St. John\'s Wort — mood and serotonin combined support (monitor serotonin load)',
      'Rose — emotional ease, pleasure and heart-opening combined',
    ],
    herb_to_herb_caution: [
      'St. John\'s Wort — both serotonergic; monitor for combined serotonin effects',
      'Other mood-elevating herbs in bipolar disorder — cumulative mania risk',
    ],
    herb_to_drug_interactions: [
      'SSRIs and SNRIs — MONITOR: serotonin syndrome risk; consult prescriber',
      'MAOIs — CONTRAINDICATED: serotonin syndrome',
      'Psychiatric medications generally — awareness and prescriber consultation recommended',
    ],
    herb_interactions: [
      'Synergy: Passionflower, Lemon Balm, Rose',
      'Caution: St. John\'s Wort (combined serotonin — monitor); other mood elevators in bipolar',
      'Drug interactions: SSRIs/SNRIs (MONITOR — consult prescriber), MAOIs (CONTRAINDICATED), psychiatric meds (consult)',
    ],
    dosage_range:
      'Fermented leaf infusion: 0.5–1 g per 250 ml, steeped 5–10 minutes, 1–2× daily (fermented is more concentrated). Dried leaf infusion: 1–2 g, steeped 5–10 minutes, 1–3× daily. Tincture: 20–30 drops, 1–3× daily. Standardised extract: 200–400 mg (mesembrine-standardised), 1–2× daily. Morning or afternoon optimal.',
    spiritual_layer:
      'Kanna carries the social and emotional wisdom of the Khoi people of South Africa — a succulent that has been used for centuries in ceremony, in preparation for difficult conversations, in the facilitation of community and connection. She teaches that mood is not fixed, that pleasure is medicine, that connection with others is a valid therapeutic pathway. The Khoi understood something that Western psychiatry has only recently begun to articulate: that serotonin is not just neurochemistry but a felt sense of belonging and safety in the world. She whispers: Your mood is valid. Your pleasure is worthy. Your connection is sacred. Your joy heals. Community heals. You are whole.',
    best_preparation:
      'Fermented leaf (traditional Khoi preparation) for highest alkaloid concentration and most authentic effect. Standardised mesembrine extract for most reliable dosing. Screen for SSRIs, SNRIs, MAOIs and bipolar disorder before recommending. Not for pregnancy or breastfeeding without professional guidance.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B mood and anxiety evidence (mesembrine SSRI-like mechanism confirmed; RCTs emerging). CRITICAL: SSRI/SNRI serotonin monitoring; MAOI absolute contraindication; bipolar disorder consult. Non-addictive; no tolerance. Safe long-term for appropriate populations. Natural serotonin-supporting alternative.',
  },

  // ─────────────────────────────────────────────
  // KAVA KAVA
  // ─────────────────────────────────────────────
  {
    id: 257,
    name: 'Kava Kava',
    botanical: 'Piper methysticum (peeled rhizome — noble cultivar, root only, never aerial parts)',
    tcm_meridians: ['Heart', 'Liver', 'Kidney'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Peppery', 'Numbing', 'Anxiolytic', 'Sedative', 'Muscle-Relaxant'],
    primary_functions: [
      'Potent anxiolytic — kavalactones modulate GABA-A receptors at distinct non-benzodiazepine sites; multiple RCTs show significant generalised anxiety reduction',
      'Muscle relaxation — voltage-gated channel interaction produces skeletal and smooth muscle relaxation',
      'Sleep promotion — sedative GABAergic action supports sleep onset and maintenance',
      'Mild analgesia — kavalactone CNS modulation provides mild analgesic effects',
      'Traditional Pacific ceremonial herb — centuries of Polynesian, Melanesian and Micronesian use for social and spiritual purposes',
    ],
    secondary_benefits: [
      'Dopamine and serotonin reuptake modulation contributing to anxiolytic effect',
      'CB1 modulation as secondary mechanism',
      'MAO-B inhibition at ceremonial doses',
      'Traditional Pacific community bonding and social relaxation',
    ],
    pharmacology:
      'Primary bioactives: kavalactones — kavain, dihydrokavain, methysticin, dihydromethysticin, yangonin, desmethoxyyangonin (responsible for CNS effects via GABA-A modulation at non-benzodiazepine sites; voltage-gated Na+/Ca2+ channel interaction; mild MAO-B inhibition; dopamine and serotonin effects). Minor alkaloids and flavokavains A, B, C (suspected contributors to hepatotoxicity). HEPATOTOXICITY RISK: WHO and national regulators have documented dozens of liver injury cases including acute liver failure and transplant; risk factors include ethanol/acetone extracts, aerial parts use, high doses, alcohol use and genetic susceptibility; incidence low but real. PREPARATION MATTERS: traditional aqueous cold-water maceration of noble-cultivar peeled root only appears safest.',
    flavor_profile: 'Peppery, numbing, slightly bitter and mildly earthy — distinctive kava signature; numbing sensation in mouth is bioactivity marker',
    contraindications: [
      'Pre-existing liver disease or abnormal LFTs — ABSOLUTELY CONTRAINDICATED: hepatotoxicity risk',
      'Alcohol abuse or heavy regular consumption — ABSOLUTELY CONTRAINDICATED: compounds hepatotoxicity risk',
      'Concurrent hepatotoxic medications (high-dose acetaminophen, isoniazid, certain TKIs) — CONTRAINDICATED',
      'Pregnancy and lactation — CONTRAINDICATED',
      'CNS depressants (benzodiazepines, barbiturates, alcohol, opioids) — ADDITIVE sedation; significant psychomotor impairment',
      'Use beyond 3 months continuously — NOT RECOMMENDED: limit to short-term with liver monitoring',
      'Ethanol or acetone extracts — PREFER traditional aqueous cold-water maceration only',
      'Aerial parts (leaves, stems) — NEVER USE: associated with higher hepatotoxicity risk',
    ],
    herb_to_herb_synergy: [
      'Passionflower — gentle GABA support for moderate anxiety where kava is too strong',
      'Linden and Chamomile — safer nervine alternatives as default before considering kava',
    ],
    herb_to_herb_caution: [
      'All sedative herbs — additive CNS depression; reduce doses of both',
      'All hepatotoxic herbs — cumulative liver risk; avoid combination',
    ],
    herb_to_drug_interactions: [
      'CNS depressants — ADDITIVE sedation and psychomotor impairment; monitor',
      'Hepatotoxic medications — cumulative liver toxicity risk; AVOID combination',
      'CYP450 inhibition — kava may inhibit several CYP enzymes; drug level changes possible',
    ],
    herb_interactions: [
      'Synergy: None actively recommended — Kava is a restricted herb; safer nervines preferred as default',
      'Caution: ALL sedative herbs (additive); ALL hepatotoxic herbs (cumulative liver risk)',
      'Drug interactions: CNS depressants (additive — monitor), hepatotoxic meds (AVOID), CYP450 substrates (monitor drug levels)',
    ],
    dosage_range:
      'Traditional aqueous kava (cold-water maceration of noble-cultivar peeled root powder): 60–250 mg kavalactones per session. Standardised extract: 60–120 mg total kavalactones per day (maximum 240 mg/day short-term). MAXIMUM 3 months continuous use with breaks and liver function monitoring. Liver function tests (ALT, AST) before and during use recommended.',
    spiritual_layer:
      'Kava is the sacred drink of the Pacific — prepared and shared in ceremony across Polynesia, Melanesia and Micronesia for thousands of years as a vehicle for honest conversation, community bonding and spiritual connection. She teaches that the social body needs lubrication, that speaking difficult truths is easier when the muscles of defensiveness are relaxed, that the village council benefits from collective calming. Modern Western use has mostly stripped the ceremonial context that made traditional kava so sustainable — high doses, isolation, alcohol extracts and aerial parts rather than the root of noble cultivars. She whispers: I am medicine in context. The ceremony matters. Respect the limits. Honour the liver that processes your experience. Bring me back to community.',
    best_preparation:
      'Traditional aqueous cold-water maceration of noble-cultivar peeled root only — this preparation appears safest based on available evidence. Liver function screening (ALT, AST) before use. Safer nervines (Passionflower, Linden, Lemon Balm, Oatstraw) offered as first-line alternatives; kava reserved for informed consent, short-term anxiolytic use with monitoring.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade B+ anxiolytic efficacy (multiple RCTs). Grade B+ hepatotoxic risk (low incidence but serious — liver injury, failure and transplant cases documented). RESTRICTED HERB: mandatory liver screening; 3-month maximum; no alcohol; noble-cultivar aqueous root preparation only; never aerial parts or ethanol extracts. Safer nervines are first-line default.',
  },

  // ─────────────────────────────────────────────
  // LICORICE ROOT
  // ─────────────────────────────────────────────
  {
    id: 258,
    name: 'Licorice Root',
    botanical: 'Glycyrrhiza glabra / G. uralensis (root — two forms: whole root and DGL)',
    tcm_meridians: ['Spleen', 'Lung', 'Heart', 'Stomach'],
    tcm_element: 'Earth + Metal',
    energetics: ['Neutral to Slightly Warm', 'Sweet', 'Moistening', 'Harmonising', 'Tonifying', 'Anti-Spasmodic'],
    primary_functions: [
      'Demulcent and anti-ulcer — coats and soothes GI and respiratory mucosa; DGL form preferred for long-term GI use (minimal mineralocorticoid risk)',
      'Formula harmoniser — TCM "peacemaker" herb; smooths and moderates other herbs in formulas; enhances palatability and synergy',
      'Antitussive and expectorant — soothes dry spasmodic cough; moistens respiratory mucosa; used in respiratory formulas',
      'Anti-inflammatory — downregulates COX, LOX and pro-inflammatory cytokines; glycyrrhizin-based hepatoprotection',
      'Hepatoprotective and antiviral — glycyrrhizin preparations used clinically for chronic hepatitis in Japan and China',
    ],
    secondary_benefits: [
      'Adrenal support at small doses for low BP and stress-related fatigue (short-term only)',
      'Antispasmodic via flavonoids for smooth muscle cramping',
      'Immunomodulatory via polysaccharides',
      'TCM "Gan Cao" — present in over half of classical Chinese formulas as harmonising agent',
    ],
    pharmacology:
      'Primary bioactives: glycyrrhizin (glycyrrhizic acid 2–15%; saponin glycoside; metabolised to glycyrrhetinic acid; PRIMARY SAFETY CONCERN — inhibits 11β-HSD2 enzyme; cortisol stimulates mineralocorticoid receptors → pseudoaldosteronism: sodium/water retention, potassium loss, hypertension, oedema), flavonoids — liquiritin, isoliquiritin, glabridin (anti-inflammatory, antioxidant, antispasmodic), polysaccharides (immunomodulatory, demulcent). TWO FORMS: (1) whole root — contains glycyrrhizin; dose-dependent cardiovascular and electrolyte risk; maximum 4–6 weeks at >3 g/day; (2) DGL (deglycyrrhizinated licorice) — glycyrrhizin removed; GI and respiratory use with minimal systemic risk. Pseudoaldosteronism threshold: >100 mg/day glycyrrhizin for >6 weeks in typical adults; sensitive individuals may react lower.',
    flavor_profile: 'Sweet, warming and distinctively liquorice-like — one of the most recognisable herbal flavours',
    contraindications: [
      'WHOLE ROOT — Hypertension (uncontrolled) — CONTRAINDICATED: glycyrrhizin elevates BP',
      'WHOLE ROOT — Cardiovascular disease (heart failure, arrhythmias, coronary disease) — CONTRAINDICATED',
      'WHOLE ROOT — Kidney disease — CONTRAINDICATED: impaired fluid and electrolyte handling',
      'WHOLE ROOT — Hypokalemia or on loop/thiazide diuretics or corticosteroids — CONTRAINDICATED',
      'WHOLE ROOT — Pregnancy (high dose or chronic) — AVOID: BP and electrolyte concerns',
      'WHOLE ROOT — Duration >4–6 weeks at >3 g/day — DOSE LIMIT: monitor BP and electrolytes',
      'DGL — generally safe for longer-term GI use; minimal systemic risk; monitor complex cases',
    ],
    herb_to_herb_synergy: [
      'Marshmallow and Iceland Moss — combined demulcent respiratory and GI protection',
      'Mullein and Thyme — respiratory formula harmoniser and demulcent backbone',
      'Meadowsweet — dual GI protective and anti-inflammatory protocol',
      'Chamomile — gentle GI soothing combined with licorice demulcent action',
    ],
    herb_to_herb_caution: [
      'Other BP-elevating herbs (e.g., high-dose liquorice combinations) — cumulative mineralocorticoid risk',
      'Other hepatotoxic herbs — licorice actually hepatoprotective but avoid confusing roles',
    ],
    herb_to_drug_interactions: [
      'Antihypertensives — whole root may counteract BP-lowering effect; monitor',
      'Diuretics — additive hypokalemia and volume changes; electrolyte monitoring',
      'Corticosteroids — potentiates mineralocorticoid effects; increased oedema and hypertension risk',
      'Digoxin — hypokalaemia from whole root increases digoxin toxicity risk',
    ],
    herb_interactions: [
      'Synergy: Marshmallow, Iceland Moss, Mullein, Thyme, Meadowsweet, Chamomile',
      'Caution: other BP-elevating herbs with whole root',
      'Drug interactions: antihypertensives (monitor), diuretics (electrolyte monitoring), corticosteroids (cumulative mineralocorticoid), digoxin (hypokalaemia risk)',
    ],
    dosage_range:
      'WHOLE ROOT: 1–3 g/day dried root maximum for short-term use (≤4–6 weeks); decoction: 1–2 tsp per 250 ml simmered 10–20 minutes. DGL (preferred for GI): 380–760 mg chewable tablets 20 minutes before meals; safe for extended use under supervision. Screen for all contraindications before recommending whole root.',
    spiritual_layer:
      'Licorice is the sweet harmoniser with a hidden edge — the formula peacemaker in TCM who smooths conflict between herbs and within the system itself. She teaches that kindness and sweetness are powerful medicines but become harmful when they exceed appropriate measure or prevent necessary confrontation. The ancient Chinese medicine principle "Gan Cao moderates all medicines" reflects wisdom about healthy mediation: a genuine harmoniser does not suppress or ignore conflict but transforms it into cooperation. At excessive doses she "steals water" — a teaching that even the most generous, harmonising personality must maintain its own electrolyte balance. She whispers: I offer sweetness in balance. I support harmony without abandoning my own stability. Sweetness is medicine in the right dose.',
    best_preparation:
      'DGL for long-term GI use — all the demulcent and anti-inflammatory benefit without the cardiovascular risk. Whole root for short-term respiratory formulas (4–6 weeks maximum; screen contraindications). As formula harmoniser in teas and blends — 5–15% of formula composition is traditional.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: null,
    status:
      'Grade A- anti-ulcer mucosal protection (especially DGL). Grade B+ hepatoprotective. CRITICAL safety distinction: DGL vs. whole root. Whole root: well-documented dose-dependent pseudoaldosteronism risk; maximum 4–6 weeks; contraindicated in hypertension, CV disease, kidney disease, diuretics, corticosteroids. DGL: safe for extended GI use.',
  },

  // ─────────────────────────────────────────────
  // LINGONBERRY
  // ─────────────────────────────────────────────
  {
    id: 259,
    name: 'Lingonberry',
    botanical: 'Vaccinium vitis-idaea (ripe berries — Cowberry, Nordic staple food)',
    tcm_meridians: ['Kidney', 'Bladder', 'Liver'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Moist', 'Slightly Astringent', 'Nourishing', 'Protective', 'Metabolically-Supporting'],
    primary_functions: [
      'UTI prevention — A-type PACs prevent E. coli P-fimbriae adhesion to uroepithelial cells; more potent than cranberry in clinical comparison',
      'Metabolic and blood sugar regulation — anthocyanins improve insulin sensitivity and blood glucose; superior to cranberry in direct comparison studies',
      'Antioxidant defence — highest ORAC capacity among common berries; systemic free-radical protection',
      'Broad-spectrum antimicrobial — PACs plus benzoic acid provide direct antibacterial and antifungal activity beyond the anti-adhesion mechanism',
      'Urinary tract nourishment — kidney and bladder essence support in traditional Scandinavian food-medicine',
    ],
    secondary_benefits: [
      'Anti-inflammatory — anthocyanins reduce systemic inflammatory markers',
      'Cardiovascular antioxidant protection via resveratrol and anthocyanins',
      'Acidification of urine via benzoic acid contributing to antimicrobial environment',
      'Pleasant food-medicine — traditional Scandinavian staple eaten daily as jam, fresh or frozen; high compliance',
    ],
    pharmacology:
      'Primary bioactives: PACs (proanthocyanidins 35–45%; A-type linkage similar to cranberry but different structure; more potent anti-adhesion; broader antimicrobial spectrum than cranberry), anthocyanins (30–40%; antioxidant; anti-inflammatory; vascular support; metabolic health — superior to cranberry in clinical blood sugar comparisons), resveratrol (caloric restriction mimic; longevity-promoting), benzoic acid (natural antimicrobial; urine acidification). Grade B+ UTI prevention; Grade B+ metabolic health; Grade A antioxidant; Grade A safety.',
    flavor_profile: 'Tart, slightly sweet and pleasantly berry-like — traditional Scandinavian jam classic; less acidic than cranberry',
    contraindications: [
      'Warfarin — MONITOR INR: low vitamin K content; minimal but real risk at large quantities; monitor',
      'Diabetes medications — MONITOR blood sugar: improves insulin sensitivity; medication adjustment possible',
      'Kidney stones (oxalate-prone) — MODERATE USE: moderate oxalate content; adequate hydration essential',
      'Salicylate sensitivity — RARE: high salicylate content; avoid if known sensitivity',
      'Otherwise: Grade A food safety — traditional Scandinavian staple consumed daily for centuries',
    ],
    herb_to_herb_synergy: [
      'Cranberry — complementary PAC mechanisms; both UTI-preventive; excellent combination at reduced individual doses',
      'Nettle — mineral tonification plus urinary protection combined protocol',
      'D-Mannose — different anti-adhesion mechanism; powerful UTI prevention stack',
      'Turmeric and Ginger — anti-inflammatory and metabolic synergy',
    ],
    herb_to_herb_caution: [
      'Other anticoagulant herbs with Warfarin — cumulative INR effects; monitor',
    ],
    herb_to_drug_interactions: [
      'Warfarin — monitor INR (minimal vitamin K; low risk but document)',
      'Diabetes medications — monitor blood sugar (insulin sensitisation effect)',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Cranberry, Nettle, D-Mannose, Turmeric, Ginger',
      'Caution: anticoagulant herbs with Warfarin (monitor)',
      'Drug interactions: Warfarin (monitor INR), diabetes meds (monitor glucose); otherwise minimal',
    ],
    dosage_range:
      'Fresh or frozen berries: ¼–½ cup daily for UTI prevention. Unsweetened juice: 100–200 ml daily (must be unsweetened). Standardised PAC extract: 300–600 mg daily. Safe indefinite daily use as food-medicine.',
    spiritual_layer:
      'Lingonberry is the treasure of Northern forests — small, hardy, brilliant red against the snow and rock, adapting to soil conditions where most plants struggle. The Scandinavian peoples preserved her for winter in jars of jam, understanding instinctively what pharmacology has now confirmed: that consistent, daily, pleasant consumption of her bright berries maintains the integrity of the urinary passages and nourishes something fundamental in the body\'s relationship to the cold, the clean, the northern. She teaches resilience through simplicity, health through ancestral foods, protection through patient daily practice rather than dramatic intervention. She whispers: I am protected. My waters flow freely. I am nourished by ancient wisdom. The north sustains me.',
    best_preparation:
      'Frozen berries eaten daily — most sustainable, most pleasant, highest compliance form. Standardised PAC extract for intensive UTI prevention protocols. Less acidic than cranberry — better tolerated by sensitive stomachs. Screen for Warfarin and diabetes medications before recommending intensive doses.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety — traditional food with no documented toxicity. Grade B+ UTI prevention (superior to cranberry). Grade B+ metabolic health. Warfarin and diabetes medication monitoring only significant cautions. Excellent daily food-medicine foundation for urinary and metabolic health.',
  },

  // ─────────────────────────────────────────────
  // LOBELIA — RESTRICTED PRACTITIONER HERB
  // ─────────────────────────────────────────────
  {
    id: 260,
    name: 'Lobelia (Indian Tobacco)',
    botanical: 'Lobelia inflata (aerial parts — RESTRICTED — practitioner-only herb)',
    tcm_meridians: ['Lung', 'Heart', 'Stomach'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm', 'Acrid', 'Pungent', 'Dispersing', 'Bronchodilatory', 'Narrow Therapeutic Window'],
    primary_functions: [
      'RESTRICTED PRACTITIONER-ONLY HERB — not for consumer self-recommendation',
      'Historical bronchodilator — lobeline binds nicotinic acetylcholine receptors; low doses provide bronchial smooth muscle relaxation at a steep toxicity curve',
      'Historical expectorant — carotid body stimulation increases respiratory depth and cough productivity',
      'Neuromuscular relaxant — "rescue" herb in Thomsonian and Eclectic traditions for acute muscular spasm',
      'Nicotine dependence research interest — dopamine modulation; clinical trials limited by adverse effects',
    ],
    secondary_benefits: [
      'Safer alternatives exist for every traditional indication: Mullein and Thyme for respiratory; Eucalyptus for bronchodilation; NAC for expectoration',
      'Historical only: intentional emesis (not acceptable modern practice)',
      'Historical only: smoking cessation support (insufficient efficacy in clinical trials)',
    ],
    pharmacology:
      'Primary bioactives: pyridine alkaloids (0.2–0.4%; lobeline as primary compound — binds nAChRs with complex agonist/antagonist effects; low doses: mild autonomic ganglia stimulation and increased respiration; higher doses: desensitisation and CNS/autonomic depression). Steep toxicity curve: nausea and burning at 0.5 mg lobeline in human study; tachycardia, bradycardia, hypertension, hypotension, confusion, stupor, coma and death documented at higher doses. "Likely unsafe" by mouth per mainstream safety references at anything beyond very small amounts. Toxicity grade A (clear evidence). Bronchodilator grade C (historical; overshadowed by toxicity and better alternatives).',
    flavor_profile: 'Acrid, pungent, sharp and unpleasant — characteristic nicotinic alkaloid signature',
    contraindications: [
      'General consumer use — NOT RECOMMENDED: narrow therapeutic window; "likely unsafe" at anything beyond micro-doses; safer alternatives exist for all indications',
      'Pregnancy and breastfeeding — ABSOLUTELY CONTRAINDICATED: risk of severe vomiting, cardiovascular and CNS toxicity',
      'Children — ABSOLUTELY CONTRAINDICATED: increased sensitivity',
      'Cardiovascular disease (ischemic, arrhythmias, uncontrolled BP) — ABSOLUTELY CONTRAINDICATED',
      'Seizure disorders — ABSOLUTELY CONTRAINDICATED: lowers seizure threshold',
      'GI disease (peptic ulcer, IBD, severe GERD) — CONTRAINDICATED: emetic and irritant activity',
      'Liver or kidney disease — CONTRAINDICATED: decreased clearance; higher toxicity',
      'CNS stimulants and sympathomimetics — DANGEROUS: convulsions and severe autonomic reactions',
      'CNS depressants — DANGEROUS: additive CNS and respiratory depression',
    ],
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [
      'CNS stimulants — dangerous autonomic reactions',
      'CNS depressants — dangerous additive respiratory depression',
      'Cardiac medications — destabilise rhythm and BP',
    ],
    herb_to_drug_interactions: [
      'Cardiac medications (beta-blockers, antiarrhythmics, digoxin) — dangerous destabilisation',
      'CNS stimulants and sympathomimetics — convulsion risk',
      'CNS depressants, opioids, anaesthetics — additive respiratory depression',
      'Nicotine/varenicline/bupropion — unpredictable nicotinic receptor interactions',
    ],
    herb_interactions: [
      'Synergy: None — not for consumer recommendation',
      'Caution: ALL combinations dangerous given narrow therapeutic window',
      'Drug interactions: cardiac meds (dangerous), CNS stimulants (dangerous), CNS depressants (dangerous)',
    ],
    dosage_range:
      'NOT FOR CONSUMER RECOMMENDATION. If shown at all: "Historically used as a very strong bronchodilator but modern evidence and toxicity concerns mean it is rarely appropriate for self-use. Specialist-guided contexts only, if at all." Redirect to: Mullein (demulcent respiratory), Thyme (expectorant), Eucalyptus (bronchodilatory), Iceland Moss (throat) as safer respiratory alternatives.',
    spiritual_layer:
      'Lobelia is the threshold herb — used historically in moments of respiratory crisis and acute muscular spasm where the system needed a forced reset. She teaches that power without precision is danger, that some medicines are too strong for casual or routine use, that they require a precise context, skill and respect — or else they cause more harm than help. The thin line between medicine and poison is her teaching. She whispers: I reserve strong forces for true emergencies. I honour the thin line between medicine and poison. I choose clarity and safety in how I free my breath.',
    best_preparation:
      'NOT FOR CONSUMER RECOMMENDATION. Redirect to safer respiratory alternatives. Reference herb only for historical and educational context.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'RESTRICTED PRACTITIONER-ONLY HERB. Likely unsafe for internal consumer use. Narrow therapeutic window with documented toxicity at moderate doses. Multiple absolute contraindications. Safer alternatives exist for all indications. Not for consumer self-care app recommendation.',
  },

  // ─────────────────────────────────────────────
  // LUCERNE (ALFALFA)
  // ─────────────────────────────────────────────
  {
    id: 261,
    name: 'Lucerne (Alfalfa)',
    botanical: 'Medicago sativa (leaf and aerial parts — deep-rooted mineral accumulator)',
    tcm_meridians: ['Spleen', 'Liver', 'Kidney'],
    tcm_element: 'Earth + Water',
    energetics: ['Neutral', 'Slightly Cool', 'Mildly Moistening', 'Mild', 'Sweet-Grassy', 'Nutritive'],
    primary_functions: [
      'Nutritive remineralisation — concentrates calcium, magnesium, iron, potassium, trace minerals and vitamin K from deep soil; "green food" foundational tonic',
      'Cardiometabolic support — saponins and fibre support LDL reduction and lipid profile improvement; mild blood sugar modulation',
      'Gentle digestive tonic — fibre-rich, mildly bitter; supports digestive atony, mild constipation and liver-gallbladder bile flow',
      'Phytoestrogenic women\'s health support — isoflavones and coumestans provide gentle hormonal modulation for menopausal transitions and bone density',
      'Convalescent and post-depletion rebuilding — ideal for atrophied, under-nourished or overworked constitutions needing sustained gentle rebuilding',
    ],
    secondary_benefits: [
      'Protein and essential amino acids in notable quantities for a herb',
      'Chlorophyll-rich alkalising green tonic',
      'Pairs naturally with Nettle, Oatstraw, Yellow Dock and Moringa as foundational nutrient base',
      'Traditional animal feed and human tonic across many cultures — "father of all foods" (Arabic origin of "alfalfa")',
    ],
    pharmacology:
      'Key constituents: proteins and essential amino acids, vitamins — K (high), C, B-complex, provitamin A carotenoids, minerals — calcium, magnesium, iron, potassium and trace minerals, saponins and coumarins, phytoestrogens — isoflavones and coumestans, chlorophyll. Grade B cardiometabolic; Grade C+ phytoestrogenic endocrine modulation. SAFETY CAUTIONS: L-canavanine in alfalfa sprouts (not the leaf herb) has rare reports of exacerbating SLE; high vitamin K content may interfere with Warfarin INR; phytoestrogen content warrants caution in oestrogen-receptor-positive cancers.',
    flavor_profile: 'Mild, green and slightly sweet-grassy — pleasant and food-like; minimal bitterness',
    contraindications: [
      'SLE (lupus) or autoimmune disease flare — CAUTION: L-canavanine (primarily in sprouts; less in dried leaf herb) may exacerbate lupus-like symptoms; avoid high long-term doses in active autoimmune',
      'Warfarin and anticoagulants — MONITOR INR: high vitamin K may interfere with INR control; coordinate with prescriber',
      'Hormone-sensitive cancers (oestrogen-receptor-positive) — CAUTION: phytoestrogen content; individualise based on oncology guidance',
      'Pregnancy and lactation — moderate food-like amounts safe; high-dose supplements require practitioner guidance',
    ],
    herb_to_herb_synergy: [
      'Nettle, Oatstraw and Moringa — foundational nutrient base "green trinity" for mineral and protein rebuilding',
      'Red Clover and Vitex — gentle phytoestrogenic and menopausal support blends',
      'Dandelion and Burdock — digestive tonic and liver-gallbladder support combined',
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic herbs in oestrogen-sensitive conditions — cumulative oestrogenic effect',
    ],
    herb_to_drug_interactions: [
      'Warfarin — HIGH vitamin K content; interferes with INR; coordinate with prescriber',
      'Immunosuppressants — theoretical immune modulation interaction',
      'Diabetes medications — mild blood sugar effects; monitor',
    ],
    herb_interactions: [
      'Synergy: Nettle, Oatstraw, Moringa, Red Clover, Vitex, Dandelion',
      'Caution: other phytoestrogenic herbs in oestrogen-sensitive conditions',
      'Drug interactions: Warfarin (MONITOR INR), immunosuppressants (theoretical), diabetes meds (monitor)',
    ],
    dosage_range:
      'Infusion: 2–4 g dried leaf per 250 ml, steeped 10–20 minutes, 1–3× daily. Tincture: 2–5 ml, 1–3× daily. Powder: 1–5 g/day in smoothies or food. Long-term low-dose daily use typical — treat as food rather than short-course medicine.',
    spiritual_layer:
      'Lucerne (Alfalfa) is named from the Arabic "al-fac-facah" — "father of all foods" — a name reflecting her extraordinary capacity to concentrate nourishment from deep in the earth. Her roots reach 20 feet or more into the soil, accessing mineral layers unavailable to most plants, accumulating what they find into leaves that humans then consume. She is a teacher of deep nourishment, of the patient work of reaching down for sustenance rather than accepting only what the surface provides. She is not dramatic — a quiet, green, nourishing presence — but her consistency over months and years rebuilds what depletion has eroded. She whispers: Nourishment comes from depth. Patient, daily, gentle accumulation builds what dramatic interventions cannot.',
    best_preparation:
      'Daily infusion as part of a mineral tonic green tea blend with Nettle and Oatstraw. Powder in smoothies for convenient daily integration. Treat as food — long-term, low-dose, consistent. Screen for Warfarin, lupus/autoimmune and oestrogen-sensitive cancers before recommending.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B cardiometabolic; Grade A- food safety. Excellent quiet background herb for long-term nutritive rebuilding. Key cautions: Warfarin (INR), SLE/autoimmune (L-canavanine), oestrogen-sensitive cancers (phytoestrogens). Best as part of mineral tonic blend rather than standalone primary herb.',
  },

  // ─────────────────────────────────────────────
  // MACA
  // ─────────────────────────────────────────────
  {
    id: 262,
    name: 'Maca',
    botanical: 'Lepidium meyenii (root/tuber — all-gender sexual vitality and energy)',
    tcm_meridians: ['Kidney', 'Spleen'],
    tcm_element: 'Water + Earth',
    energetics: ['Warm', 'Nutritive', 'Sexual-Vitality-Supporting', 'Energy-Building', 'Hormone-Balancing', 'Endurance-Enhancing'],
    primary_functions: [
      'All-gender sexual vitality support — alkaloids and glucosinolates enhance arousal, sexual response and satisfaction across male and female physiology',
      'Hormonal homeostasis — glucosinolates support hormone balance (not artificial hormone increase but natural balancing)',
      'Energy and endurance — polysaccharides plus B vitamins and minerals support sustained energy and stamina without stimulant mechanism',
      'Nutritive tonification — food-like root vegetable providing complete amino acids, B vitamins, iron, zinc and phytosterol precursors',
      'Cumulative sexual and hormonal benefit — 4–12 weeks for full baseline improvement; not acute',
    ],
    secondary_benefits: [
      'Menstrual regularity support through hormonal homeostasis',
      'Menopausal symptom adjunct via hormonal balance mechanism',
      'Fertility potential support (indirect via sexual function and hormonal health)',
      'Mood and well-being improvement as secondary benefit of overall vitality improvement',
    ],
    pharmacology:
      'Primary bioactives: alkaloids (multiple 0.1–0.5%; sexual function support; phytosterol precursors; mood-lifting; energy), glucosinolates (Brassica family compounds; hormone-balancing; sexual function support; UNIQUE to Maca), polysaccharides and complete amino acids (nutritive tonification; endurance), B vitamins, iron, zinc (zinc = critical for male sexual health and testosterone function). Mechanism: supports hormonal homeostasis (not artificial hormone increase) via phytosterol precursors and glucosinolates. All-gender benefit. Grade B sexual vitality; Grade B energy; Grade B hormone balance; Grade A safety (food-like). 200+ studies; centuries Andean traditional use.',
    flavor_profile: 'Earthy, slightly sweet and subtly caramel-like — pleasant and versatile in smoothies and foods',
    contraindications: [
      'Pregnancy — LIKELY SAFE as food; consult prenatal provider for therapeutic doses',
      'Breastfeeding — LIKELY SAFE; consult provider',
      'Hormone-sensitive conditions (oestrogen-receptor-positive cancers) — MONITOR: hormone-balancing properties; consult provider; generally safe as hormone-supporting not hormone-increasing',
      'Otherwise: Grade A food safety — root vegetable with no documented toxicity',
    ],
    herb_to_herb_synergy: [
      'Muira Puama — classical Amazonian-Andean sexual vitality combination; complementary mechanisms',
      'Damiana and Catuaba — comprehensive multi-mechanism sexual vitality protocol',
      'Ginseng — adaptogenic energy combined with Maca nutritive sexual vitality',
      'Ashwagandha — HPA axis grounding combined with Maca Jing nourishment',
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic herbs in oestrogen-sensitive conditions — cumulative oestrogenic concern',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented',
      'Hormone therapies — monitor (theoretical phytosterol interaction; generally safe)',
    ],
    herb_interactions: [
      'Synergy: Muira Puama, Damiana, Catuaba, Ginseng, Ashwagandha',
      'Caution: phytoestrogenic herbs in oestrogen-sensitive conditions',
      'Drug interactions: None significant documented',
    ],
    dosage_range:
      'Dried root powder: 1–3 g daily in smoothie, water or food. Gelatinised form: 1–3 g daily (more bioavailable; easier to digest). Safe indefinite daily use. Cumulative benefit: 4–12 weeks for sexual vitality and hormonal balance effects.',
    spiritual_layer:
      'Maca grows high in the Andes at 4000+ metres above sea level — in the harshest, most oxygen-depleted agricultural environment on Earth, where almost nothing else will grow. The Andean peoples have cultivated her there for over 3000 years, understanding that a plant that survives and thrives in such conditions must carry an extraordinary vitality. She teaches that true energy is rooted in deep nutrition and hormonal harmony, not in stimulation and depletion, that sustainability matters more than intensity, that sexual vitality is a reflection of overall constitutional health. She is nourishment that has been concentrated and distilled by altitude, cold and hardship into something quietly powerful. She whispers: My vitality is nourished from the roots. My sexuality is vibrant. My hormones are balanced. I am strong in harsh conditions. I endure.',
    best_preparation:
      'Powder in morning smoothie — most convenient and sustainable. Gelatinised form for better digestibility. All-gender positioning: benefits arousal, desire and sexual response across all genders and orientations. Minimum 4–12 weeks for full benefit. Food-like herb: safe indefinitely.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A food safety (root vegetable; centuries traditional use). Grade B sexual vitality and hormone balance evidence (200+ studies). All-gender sexual vitality support. Cumulative 4–12 weeks for full benefit. Minimal contraindications. Excellent daily food-medicine foundation.',
  },

  // ─────────────────────────────────────────────
  // MACA NEGRA (BLACK MACA)
  // ─────────────────────────────────────────────
  {
    id: 263,
    name: 'Maca Negra (Black Maca)',
    botanical: 'Lepidium meyenii var. negra (black tuber — male-specific vitality)',
    tcm_meridians: ['Kidney', 'Liver'],
    tcm_element: 'Water + Wood',
    energetics: ['Warm', 'Strongly Tonifying', 'Yang-Strengthening', 'Virility-Enhancing', 'Male-Sexual-Vitality-Supporting'],
    primary_functions: [
      'Male sexual vitality — higher alkaloid concentration (0.2–0.6%) and zinc content in black variety specifically supports erectile function and male sexual confidence',
      'Yang and physical strength — tonifies constitutional Yang energy; strengthens physical vitality and masculine presence',
      'Testosterone health support — concentrated glucosinolates and zinc support testosterone balance (not artificial increase)',
      'Physical stamina and endurance — polysaccharide tonification for sustained physical and sexual performance',
      'Male sexual confidence — comprehensive virility support distinguishes black variety from general-purpose yellow/red maca',
    ],
    secondary_benefits: [
      'Cognitive support — emerging research on black maca and memory; higher concentration profile may benefit brain function',
      'Bone density — emerging research specific to black variety',
      'Post-exertion recovery — Yang tonification supports athletic recovery',
    ],
    pharmacology:
      'Same root species as Maca (Lepidium meyenii) but black/dark variety is traditionally distinguished and modern research supports higher alkaloid concentration (0.2–0.6% vs. 0.1–0.5% yellow), higher zinc concentration and more potent testosterone-supporting glucosinolate profile. Male-specific positioning based on colour-specific traditional use and emerging variety-specific research (30+ studies on maca varieties). Grade B male sexual vitality; Grade C+ testosterone support (emerging); Grade A food safety.',
    flavor_profile: 'Earthy, slightly sweet and subtly more intense than yellow maca — same pleasant versatility',
    contraindications: [
      'Prostate conditions (prostate cancer history) — MONITOR: testosterone-supporting properties; consult provider; generally safe (hormone-balancing not increasing) but verify with oncologist',
      'Pregnancy — AVOID: male-specific Yang-tonifying herb; not appropriate during pregnancy',
      'Breastfeeding — consult provider',
      'Otherwise: Grade A food safety',
    ],
    herb_to_herb_synergy: [
      'Muira Puama — Amazonian male vitality combined with Andean black Maca; classical male sexual vitality pairing',
      'Ginseng (Korean Red) — ultimate male Jing and Yang tonification combined',
      'Horny Goat Weed — PDE5 vasodilation (HGW) combined with nutritive vitality (Maca Negra)',
      'Ashwagandha — HPA grounding with Yang tonification comprehensive male vitality stack',
    ],
    herb_to_herb_caution: [
      'Other testosterone-supporting herbs in prostate cancer context — cumulative androgenic concern; consult oncologist',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented',
      'Testosterone therapies — theoretical additive effect; monitor if on exogenous testosterone',
    ],
    herb_interactions: [
      'Synergy: Muira Puama, Korean Red Ginseng, Horny Goat Weed, Ashwagandha',
      'Caution: testosterone herbs in prostate cancer (consult oncologist)',
      'Drug interactions: None significant; testosterone therapy (monitor if applicable)',
    ],
    dosage_range:
      'Dried black root powder: 2–4 g daily (slightly higher than yellow maca due to more concentrated profile). Gelatinised form preferred for digestibility. Morning use optimal (Yang-tonifying, energy-lifting). Cumulative benefit: 4–12 weeks for male sexual vitality and strength effects.',
    spiritual_layer:
      'Maca Negra is the black variety — in Andean tradition the dark tubers carry the most Yang, the most concentrated masculine vitality. She is the teacher of confident, grounded masculine sexuality: not performance anxiety, not forced aggression, but a quiet, rooted virility that comes from constitutional depth rather than surface stimulation. She teaches that male sexuality is not separate from physical strength and emotional confidence, that the same vital force that animates sexuality also animates creativity, courage and authentic masculine presence. She is nourishment distilled to its Yang essence. She whispers: Your sexual vitality is rooted in constitutional depth. Your strength is real. Your confidence is earned. You are whole in your masculinity.',
    best_preparation:
      'Black root powder in morning smoothie or warm milk. Combine with Muira Puama for classical sexual vitality pairing. Screen prostate cancer history before recommending. Minimum 4–12 weeks for cumulative benefit.',
    caution_level: 'LOW',
    safe_pregnancy: false,
    status:
      'Grade A food safety (root vegetable). Grade B male sexual vitality (emerging variety-specific research). Prostate cancer history: consult oncologist (testosterone-supporting but not -increasing). Minimum 4–12 weeks for full benefit. Male-specific Yang tonification and sexual vitality herb.',
  },

  // ─────────────────────────────────────────────
  // MARJORAM
  // ─────────────────────────────────────────────
  {
    id: 264,
    name: 'Marjoram (Sweet Marjoram)',
    botanical: 'Origanum majorana (flowering aerial parts — sweet marjoram)',
    tcm_meridians: ['Spleen', 'Stomach', 'Lung'],
    tcm_element: 'Earth + Fire',
    energetics: ['Warming', 'Aromatic', 'Slightly Drying', 'Carminative', 'Antispasmodic', 'Mild Nervine'],
    primary_functions: [
      'Digestive carminative — aromatic volatile oils reduce GI spasm, relieve bloating and gas; EU traditional monograph indication for mild spasmodic GI complaints',
      'Antispasmodic — smooth muscle relaxation for digestive cramping and spasm',
      'Mild expectorant and respiratory support — aromatic oils support catarrh clearance and simple coughs',
      'Nervine for tension — warming, aromatic nervine for tension headaches and mild nervous stress',
      'Kitchen-level spice medicine — Mediterranean culinary tradition; gentle enough for regular food use',
    ],
    secondary_benefits: [
      'Antimicrobial — essential oil shows broad antibacterial and antifungal activity in vitro',
      'Anti-inflammatory and antioxidant via essential oil constituents',
      'Mild emmenagogue — warming and gently stimulating to menstrual flow in cold-stagnant patterns',
      'EU traditional herbal medicinal product for GI and respiratory use',
    ],
    pharmacology:
      'Traditional indications recognised in EU monograph: mild spasmodic GI complaints (bloating, gas) and coughs. Essential oil shows antimicrobial, antioxidant, anti-inflammatory and some anticancer activities in vitro and animal models. Food amounts safe; medicinal short-term possibly safe; long-term high-dose considered possibly unsafe (theoretical issues). Pregnancy caution: emmenagogue and uterine-stimulating tradition — essential oil not for pregnancy or lactation; most sources avoid internal medicinal doses in pregnancy. Surgery: discontinue medicinal doses ≥2 weeks before due to possible bleeding risk.',
    flavor_profile: 'Sweet, warm and subtly floral-aromatic — gentler and sweeter than oregano; classic Mediterranean culinary herb',
    contraindications: [
      'Pregnancy — AVOID essential oil and medicinal doses: emmenagogue and uterine-stimulating tradition',
      'Breastfeeding — AVOID essential oil; food amounts likely safe',
      'Children — medicinal doses NOT recommended; culinary use safe',
      'Surgery — DISCONTINUE medicinal doses ≥2 weeks before: possible bleeding risk',
      'Long-term high-dose use — possibly unsafe: theoretical carcinogenicity concerns at excessive doses',
    ],
    herb_to_herb_synergy: [
      'Chamomile and Caraway — gentle digestive carminative and antispasmodic triple formula',
      'Thyme and Mullein — mild respiratory catarrh support',
      'Lavender — combined nervine for tension headaches',
    ],
    herb_to_herb_caution: [
      'Other uterine-stimulating herbs in pregnancy — avoid combination',
      'Other anticoagulant herbs near surgery — cumulative bleeding risk',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants — mild potential bleeding risk; discontinue medicinal doses 2 weeks before surgery; monitor with Warfarin',
      'No other significant documented drug interactions at culinary doses',
    ],
    herb_interactions: [
      'Synergy: Chamomile, Caraway, Thyme, Mullein, Lavender',
      'Caution: uterine-stimulating herbs in pregnancy; anticoagulant herbs near surgery',
      'Drug interactions: anticoagulants (mild risk — discontinue pre-surgery); culinary doses minimal',
    ],
    dosage_range:
      'Infusion: 1–2 g dried herb per cup, up to 3× daily for short-term GI and respiratory use. Culinary use: safe indefinitely. Topical: commercial preparations around nostrils for catarrh (pharmacopoeial use). Duration: short-term for medicinal use; culinary amounts indefinitely safe.',
    spiritual_layer:
      'Marjoram is the gentle Mediterranean warmth — a kitchen herb that has flavoured the soups, stews and breads of Mediterranean civilisations for millennia while quietly also warming cold, cramped bellies and tense shoulders. She is not the dramatic healer but the consistent comforter — the herb that makes food more digestible, winter soups more warming, and everyday life fractionally more easeful. She teaches that gentle, regular, culinary medicine is often more sustainable than heroic intervention. The kitchen is a pharmacy. She whispers: Warmth and ease come in small doses, daily. The spice in your soup is medicine. Comfort is healing.',
    best_preparation:
      'Gentle infusion for GI and respiratory complaints. Culinary integration as spice in food for sustainable daily use. Avoid medicinal doses in pregnancy. Short-term medicinal use only; culinary amounts indefinitely safe.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'EU traditional herbal medicinal product. Grade B carminative and antispasmodic. Food amounts safe indefinitely. Medicinal short-term doses possibly safe; long-term high-dose avoid. Pregnancy: avoid medicinal doses and essential oil. Excellent gentle culinary-medicine herb for mild GI and respiratory complaints.',
  },

  // ─────────────────────────────────────────────
  // MEADOWSWEET
  // ─────────────────────────────────────────────
  {
    id: 265,
    name: 'Meadowsweet',
    botanical: 'Filipendula ulmaria (aerial parts — flowers and leaves — "Queen of the Meadow")',
    tcm_meridians: ['Stomach', 'Liver', 'Spleen'],
    tcm_element: 'Earth + Metal',
    energetics: ['Cool', 'Dry', 'Gentle', 'Soothing', 'Anti-Inflammatory', 'GI-Protecting'],
    primary_functions: [
      'Gentle digestive antacid — natural salicylates reduce gastric acid excess while tannins simultaneously protect stomach lining; opposite of NSAIDs which irritate',
      'Salicylate analgesia without gastric irritation — aspirin precursor herb providing mild pain relief (headaches, muscle, joint, period pain) with stomach protection',
      'NSAID alternative — gentle, sustainable pain and inflammation management without cumulative GI damage',
      'Anti-inflammatory — COX inhibition (salicylates) plus cytokine reduction (flavonoids) for systemic and joint inflammation',
      'Stomach demulcent — tannins coat and protect gastric mucosa; ulcer healing support',
    ],
    secondary_benefits: [
      'Fever reduction — diaphoretic salicylate sweating action; traditional pre-aspirin febrifuge',
      'Joint and connective tissue support — anti-inflammatory plus connective tissue resilience',
      'Vanilla-like aromatic compounds — mild mood-lifting and comforting aromatic quality',
      'Aspirin precursor — salicylic acid isolated from Meadowsweet ("Spiraea" = source of "aspirin" name)',
    ],
    pharmacology:
      'Primary bioactives: salicylates (0.5–1%; methyl salicylate, salicylic acid — COX inhibition analgesic and anti-inflammatory; UNIQUE dual action: also reduces gastric acid excess AND protects stomach lining via tannin demulcency — opposite of pharmaceutical aspirin and NSAIDs which damage GI mucosa), flavonoids — spiraein and quercetin (2–3%; antioxidant; anti-inflammatory; mild GABA modulation), tannins (5–10%; gastric mucosal protection; astringent; antimicrobial), volatile oils (vanilla-like; mood-lifting). Historical significance: salicylic acid isolated from Meadowsweet was precursor to aspirin synthesis. Grade B digestive and anti-inflammatory; Grade A safety.',
    flavor_profile: 'Sweet, vanilla-like aroma with slightly bitter salicylate taste — one of the most pleasantly aromatic medicinal herbs; high compliance',
    contraindications: [
      'Aspirin sensitivity (salicylate allergy) — AVOID: salicylate content present; monitor response in salicylate-sensitive individuals (rare)',
      'Bleeding disorders — CAUTION: mild antiplatelet properties; monitor',
      'Warfarin — MONITOR INR: mild additive antiplatelet; coordinate with prescriber',
      'Chronic NSAID users — COORDINATE: can taper NSAIDs alongside meadowsweet (safer replacement); consult prescriber',
      'Otherwise: Grade A safety — medieval to modern use with no serious adverse events',
    ],
    herb_to_herb_synergy: [
      'Ginger and Turmeric — triple anti-inflammatory pain relief stack',
      'Chamomile and Licorice — comprehensive gentle GI soothing and protection formula',
      'Marshmallow — enhanced mucosal demulcent and gastric protection',
      "Devil's Claw — joint pain and OA anti-inflammatory combined protocol",
    ],
    herb_to_herb_caution: [
      'Other salicylate-containing herbs in aspirin-sensitive individuals',
      'Anticoagulant herbs — cumulative antiplatelet effect; monitor',
    ],
    herb_to_drug_interactions: [
      'NSAIDs — additive anti-inflammatory; may allow NSAID dose reduction; consult prescriber',
      'Warfarin — mild antiplatelet; monitor INR',
      'Aspirin — both salicylate sources; additive; coordinate dose changes with prescriber',
    ],
    herb_interactions: [
      "Synergy: Ginger, Turmeric, Chamomile, Licorice, Marshmallow, Devil's Claw",
      'Caution: other salicylate herbs in aspirin-sensitive; anticoagulant herbs (monitor)',
      'Drug interactions: NSAIDs (additive — coordinate), Warfarin (monitor INR), Aspirin (additive — coordinate)',
    ],
    dosage_range:
      'Tincture (fresh herb most potent): 20–40 drops, 2–3× daily (after meals optimal for GI benefit). Infusion: 2–4 g dried herb steeped 10–15 minutes, 2–3× daily. Safe indefinite long-term use as NSAID alternative. Distinctive vanilla aroma makes compliance pleasant.',
    spiritual_layer:
      'Meadowsweet is the gentle healer — the queen of the meadow who grows in damp lowlands and riverbanks, offering her cream-coloured flowers as a scent of sweetness and healing. She was the sacred herb of the druids, one of three most honoured plants. She teaches that pain can be met with gentleness, that inflammation need not be fought with harsh pharmaceutical force, that the wisdom of the body\'s healing response deserves support rather than suppression. Her discovery as the source of aspirin was simultaneously a triumph and a tragedy — the chemical was isolated and stripped of the tannins that protected the stomach, creating a drug that healed with one hand and damaged with the other. She reminds us: the whole plant knows something the extracted chemical has forgotten. She whispers: I am comfortable. My body is at ease. I heal with kindness. The whole is wiser than the part.',
    best_preparation:
      'Fresh herb tincture for maximum potency. Tea for pleasant daily GI and pain support — the vanilla aroma makes this an enjoyable daily medicine. After-meals dosing for acid and GI benefit. Screen for aspirin sensitivity and Warfarin before recommending. Excellent NSAID alternative for long-term sustainable pain management.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A safety — medieval and modern use with no serious adverse events. Grade B digestive and anti-inflammatory evidence. The defining "stomach-safe pain relief" herb. NSAID alternative with added GI protection. Aspirin sensitivity caution. Warfarin monitoring. Safe long-term daily use.',
  },

  // ─────────────────────────────────────────────
  // MILK THISTLE
  // ─────────────────────────────────────────────
  {
    id: 266,
    name: 'Milk Thistle',
    botanical: 'Silybum marianum (seeds — standardised 70–80% silymarin)',
    tcm_meridians: ['Liver', 'Gallbladder'],
    tcm_element: 'Wood',
    energetics: ['Cool', 'Dry', 'Bitter', 'Moving', 'Detoxifying', 'Hepatoprotective'],
    primary_functions: [
      'Hepatoprotection — silymarin complex binds liver cell membranes; blocks toxin entry; prevents hepatotoxicity from drugs, alcohol, chemicals and mushroom poisoning',
      'Liver regeneration — stimulates hepatocyte protein synthesis; accelerates liver cell regeneration after damage',
      'Liver-specific antioxidant — scavenges free radicals specifically in hepatic tissue; reduces lipid peroxidation',
      'Anti-inflammatory for liver — reduces TNF-α and IL-6 in liver tissue; prevents fibrosis development',
      'Hepatitis support and drug-induced liver injury recovery — clinical evidence across multiple causes of liver damage',
    ],
    secondary_benefits: [
      'Post-chemotherapy liver recovery — used during and after hepatotoxic oncology treatment (with oncologist coordination)',
      'Preventive liver maintenance — long-term foundational liver protection',
      'German Commission E official monograph — evidence-based Western phytomedicine',
      '300+ clinical studies — one of the most researched herbs in the world',
    ],
    pharmacology:
      'Primary bioactive: silymarin complex (1–4% of seeds; flavonolignans — silybins A+B, isosilybin, silydianin; hepatoprotective via three mechanisms: (1) membrane-binding toxin blockade, (2) hepatocyte protein synthesis stimulation for regeneration, (3) liver-specific antioxidant and anti-inflammatory). Standardised extract (70–80% silymarin) is most reliable form. German Commission E monograph. 300+ studies. Grade A hepatoprotection; Grade A liver regeneration; Grade A safety. CAUTION: Ragweed and Asteraceae allergy (cross-reactivity); rare theoretical oestrogenic activity.',
    flavor_profile: 'Mildly bitter — seeds can be ground and used as food (related to artichoke family)',
    contraindications: [
      'Ragweed or Asteraceae allergy — cross-reactivity possible; patch test if ragweed-allergic',
      'Oestrogen-sensitive conditions — THEORETICAL: rare reports of oestrogenic activity; consult if concerned',
      'Pregnancy — generally considered safe; consult provider for therapeutic doses',
      'Otherwise: Grade A safety — one of the safest herbs in the world with centuries food and medicinal use',
    ],
    herb_to_herb_synergy: [
      'Dandelion Root and Burdock Root — comprehensive liver detoxification and microbiome triple protocol',
      'Turmeric and Ginger — combined liver anti-inflammatory and antioxidant stack',
      'Artichoke Leaf — choleretic plus hepatoprotective combined liver support',
      'Schisandra — comprehensive liver adaptogen and hepatoprotective combined',
    ],
    herb_to_herb_caution: [
      'No known herb-to-herb cautions',
    ],
    herb_to_drug_interactions: [
      'Hepatotoxic medications — silymarin may protect against drug-induced liver injury; coordinate with prescriber during chemotherapy or other hepatotoxic treatment',
      'CYP450 substrates — minor silymarin CYP modulation; generally not clinically significant at standard doses',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: Dandelion Root, Burdock, Turmeric, Ginger, Artichoke, Schisandra',
      'Caution: None known',
      'Drug interactions: hepatotoxic meds (coordinate — silymarin protective); CYP450 (minor; generally not significant)',
    ],
    dosage_range:
      'Standardised extract (70–80% silymarin): 200–400 mg, 2–3× daily (most researched and reliable form). Seed powder: 1–2 tsp (3–6 g), 1–2× daily. Tincture: 60–90 drops, 2–3× daily. Safe long-term indefinite preventive use; 8–12+ weeks for recovery from acute liver damage.',
    spiritual_layer:
      'Milk Thistle is Mary\'s Thistle — the white-veined, spiny-leaved plant of legend whose milk-white markings are said to be drops from the Virgin\'s milk as she nursed the infant Jesus. She is the guardian, the fierce protector with thorns on the outside and medicine within. She teaches that protection and regeneration are the same impulse — the thorns protect what the silymarin repairs. She stands at the liver, our primary detoxification organ, our metabolic gatekeeper, and says: nothing passes here that should not pass. The liver regenerates; the damage is recoverable; the body knows how to repair itself when supported. She whispers: My liver is protected. I am detoxifying. I heal. My body heals itself. Damage is recoverable.',
    best_preparation:
      'Standardised 70–80% silymarin extract — most researched, most reliable, most efficient. Seed powder for food integration. Screen for Asteraceae allergy. No significant drug interactions make this one of the most universally applicable herbs. Start preventively for anyone on hepatotoxic medications.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A hepatoprotection, liver regeneration and liver damage recovery (300+ studies; German Commission E monograph). One of the most researched herbs in the world. Grade A safety. Universally applicable liver guardian. No significant drug interactions. Safe long-term.',
  },

  // ─────────────────────────────────────────────
  // MUGWORT
  // ─────────────────────────────────────────────
  {
    id: 267,
    name: 'Mugwort',
    botanical: 'Artemisia vulgaris (leaves and flowering tops — "Mother of Herbs")',
    tcm_meridians: ['Liver', 'Spleen', 'Kidney'],
    tcm_element: 'Fire + Wood',
    energetics: ['Warm', 'Dry', 'Bitter', 'Aromatic', 'Qi-Moving', 'Blood-Activating', 'Dream-Enhancing'],
    primary_functions: [
      'Menstrual regulation and cramp relief — flavonoid estrogenic support plus spasmolytic volatile oils ease dysmenorrhoea and oligomenorrhoea in cold-stagnant patterns',
      'Digestive bitter tonic — sesquiterpene lactones stimulate gastric and bile secretion; aromatic oils reduce GI spasm; cold-damp sluggish digestion',
      'Dream enhancement — thujone and volatile oils modulate GABAergic systems; traditional and user-reported vivid, symbolic and lucid dreaming',
      'Warming circulation and channel opening — aromatic oils and coumarins warm cold stagnation patterns; pelvic circulation and Raynaud-like cold',
      'Traditional moxa herb — dried Mugwort burned near acupoints for channel warming in TCM practice',
    ],
    secondary_benefits: [
      'Antimicrobial — essential oils show broad in vitro antibacterial and antifungal activity',
      'Anti-inflammatory and antioxidant via flavonoids and sesquiterpene lactones',
      'Liver support — phenolic acids support liver phase I/II processing',
      '"Mother of Herbs" — 2000+ years in European, TCM and Ayurvedic traditions for women\'s health, digestion and dreams',
    ],
    pharmacology:
      'Primary bioactives: essential oil (0.2–1.5%; thujone often 10–50% of oil — neuroactive GABA-modulating constituent; antimicrobial; spasmolytic; contributes to dream enhancement), sesquiterpene lactones — vulgarin, psilostachyin (bitter tonic; anti-inflammatory; digestive stimulant), flavonoids — quercetin derivatives, luteolin (antioxidant; antispasmodic; mild estrogenic modulation). Supporting: phenolic acids (hepatoprotective; anti-inflammatory), coumarins — esculin, scopoletin (mild anticoagulant; spasmolytic), monoterpenes. CYCLIC USE: best used in cycles due to thujone content — not for continuous high-dose long-term use.',
    flavor_profile: 'Balsamic, aromatic, slightly bitter and warming — distinctive Artemisia character; strong and pleasant when fresh',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: emmenagogue and uterine stimulant; recognised by traditional and pharmacological sources; HARD BLOCK',
      'Trying to conceive or uncertain pregnancy — STRONG CAUTION: recommend alternatives',
      'Asteraceae family allergy (ragweed, chrysanthemum) — AVOID: cross-reactivity risk including contact dermatitis, respiratory allergy and possible anaphylaxis',
      'Epilepsy or seizure disorders — AVOID HIGH DOSES: thujone is GABA-modulating neurotoxin in excess; may lower seizure threshold',
      'Breastfeeding — CAUTION: thujone-containing herbs avoided or professional supervision only',
      'Long-term high-dose continuous use — NOT RECOMMENDED: thujone accumulation risk; use in cycles',
    ],
    herb_to_herb_synergy: [
      'Ginger — enhanced warming and circulation; excellent for cold uterine and digestive patterns',
      'Raspberry Leaf and Cramp Bark — comprehensive menstrual support formula',
      'Linden and Skullcap — integrates dreamwork with nervous system regulation',
      'Calea Zacatachichi — amplified visionary dreaming protocol (experienced users; cycling essential)',
    ],
    herb_to_herb_caution: [
      'Other strong emmenagogues (Black Cohosh, Blue Cohosh) in heavy menses — combined stimulation may be excessive',
      'Other thujone-rich Artemisia species (Wormwood, Tarragon) — cumulative thujone; avoid at high doses or long-term',
      'CNS depressants — additive neuroactive effects',
    ],
    herb_to_drug_interactions: [
      'CNS depressants and neuroactive drugs — additive CNS effects; monitor',
      'Anticoagulants (Warfarin) — coumarins have mild anticoagulant activity; monitor INR',
      'Emmenagogue drugs — additive uterine stimulation risk',
    ],
    herb_interactions: [
      'Synergy: Ginger, Raspberry Leaf, Cramp Bark, Linden, Skullcap, Calea Zacatachichi',
      'Caution: strong emmenagogues (cumulative); other Artemisia (cumulative thujone); CNS depressants',
      'Drug interactions: CNS depressants (additive), Warfarin (monitor INR), emmenagogue drugs (additive)',
    ],
    dosage_range:
      'Tea: 0.5–2 g dried herb per 250 ml, steeped covered 10–15 minutes, 1–3× daily. Lower range for dreamwork (0.5–1 g evening); higher for digestion and menstrual use (1.5–2 g). Tincture: 2–4 ml, 1–3× daily. CYCLIC USE: several weeks on, then a break. Dream protocol: 7 nights on, at least 7 nights off.',
    spiritual_layer:
      'Mugwort is the lunar, liminal herb — guardian of the gates between waking and dreaming, between the conscious and unconscious, between the body and the spirit. She is "Mother of Herbs" — the sacred plant of Artemis, goddess of the moon, the hunt and the wildness of life. She has been used by midwives, dreamers, seers and those crossing rites of passage for 2000+ years across European, Asian and Ayurvedic traditions. She teaches that dreams are not random noise but a guidance system for the soul — that when we honour our dreams and our cycles, we reclaim exiled parts of ourselves and walk more clearly aligned with our deep inner knowing. She whispers: My dreams are wise. My cycles are sacred. I listen to the messages of my body and my subconscious. I walk between worlds with protection, clarity and courage.',
    best_preparation:
      'Covered infusion (preserves volatile oils) for evening dreamwork at low dose. Cycle-based protocols: menstrual work in luteal phase; digestive bitters before meals; dreamwork in 7-night cycles with breaks. HARD BLOCK in pregnancy — no exceptions. Screen Asteraceae allergy and seizure history.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: false,
    status:
      'Grade B digestive and menstrual evidence. Grade C dream enhancement (traditional and anecdotal; plausible neuroactive basis). Grade A pregnancy risk (emmenagogue — HARD BLOCK). Cyclic use essential (thujone). Asteraceae allergy and seizure screening mandatory. Excellent menstrual, digestive and dreamwork herb in appropriate populations.',
  },

  // ─────────────────────────────────────────────
  // MULLEIN
  // ─────────────────────────────────────────────
  {
    id: 268,
    name: 'Mullein',
    botanical: 'Verbascum thapsus (leaf and flower — "Grandmother Herb")',
    tcm_meridians: ['Lung', 'Kidney', 'Spleen'],
    tcm_element: 'Metal + Water',
    energetics: ['Cool', 'Moist', 'Sweet', 'Demulcent', 'Expectorant', 'Clearing', 'Tonifying'],
    primary_functions: [
      'Demulcent cough soothing — mucilage (5–10% dried leaf) physically coats inflamed respiratory mucosa; immediate relief of dry irritating cough; throat protection',
      'Expectorant — saponins (3–5%) lower surface tension of respiratory secretions; thin and mobilise mucus for productive clearance',
      'Respiratory anti-inflammatory — verbascoside (iridoid glycoside 0.5–1%) reduces TNF-α and IL-6 in airway tissue; cumulative healing',
      'Long-term respiratory tonification — baseline respiratory function improves with months of consistent use; chronic bronchitis and cough frequency reduction',
      'Children\'s respiratory herb — safe, effective, pleasant (especially flower preparation); universally accessible',
    ],
    secondary_benefits: [
      'Lymphatic and immune support — saponins stimulate macrophage and NK cell activation; barrier immunity support',
      'Topical earache relief — Mullein-infused oil (flowers in carrier) applied in ear canal; traditional anti-inflammatory for acute earache',
      'Smoking cessation support — soothes and supports healing of irritated respiratory tissue as lungs recover from smoking',
      'Grade A safety for all populations including children, pregnancy and breastfeeding',
    ],
    pharmacology:
      'Primary bioactives: mucilage (5–10% dried leaf; polysaccharides forming demulcent protective coating on inflamed mucous membranes), saponins (3–5%; lower surface tension of respiratory secretions; expectorant; antimicrobial; mild immune stimulation), verbascoside (iridoid glycoside 0.5–1%; anti-inflammatory via TNF-α and IL-6 reduction; antioxidant; neuroprotective), flavonoids (1–2%; antioxidant; anti-inflammatory). PREPARATION NOTE: tea/infusion is superior to tincture for demulcent action — mucilage is water-soluble and requires water extraction (not alcohol). Warm tea enhances demulcent coating effect. Grade B+ demulcent; Grade B expectorant; Grade B+ anti-inflammatory; Grade A safety.',
    flavor_profile: 'Mild, slightly sweet and pleasantly herbaceous — among the most palatable medicinal herbs; flower preparation gentler and more pleasant than leaf',
    contraindications: [
      'Rare Scrophulariaceae family allergy — very rare; discontinue if rash or respiratory sensitivity occurs',
      'Oral medication timing — mucilage may theoretically slow absorption if taken simultaneously; space oral medications 2+ hours from Mullein tea',
      'Otherwise: Grade A safety — suitable for all ages and populations',
    ],
    herb_to_herb_synergy: [
      'Thyme — expectorant and antimicrobial combined with Mullein demulcent; classic respiratory pairing',
      'Licorice Root — dual demulcent protection for throat and airways',
      'Plantain Leaf — respiratory anti-inflammatory and demulcent synergy',
      'Ginger — warming antimicrobial balances Mullein\'s cooling demulcent; comprehensive respiratory formula',
      'Elecampane — tonic expectorant paired with Mullein demulcent for chronic respiratory rebuilding',
    ],
    herb_to_herb_caution: [
      'No herb-to-herb cautions — safe with all herbs; tends to enhance and support',
    ],
    herb_to_drug_interactions: [
      'No known drug interactions — safe with all medications',
      'Respiratory medications — safe combination; Mullein supports rather than conflicts',
    ],
    herb_interactions: [
      'Synergy: Thyme, Licorice, Plantain, Ginger, Elecampane',
      'Caution: None — universally safe',
      'Drug interactions: None documented; safe with all medications',
    ],
    dosage_range:
      'Tea (leaf — optimal demulcent): 1–2 tsp dried leaf steeped 10–15 minutes (longer = more mucilage), 3–4× daily for acute conditions. Tea (flower — gentler): 1 tsp dried flowers steeped 5–10 minutes. Long-term tonification: 1–2× daily indefinitely. Infused oil (flowers in carrier): 1–2 drops in ear canal for earache. Warm preparation essential — cold tea loses demulcent benefit.',
    spiritual_layer:
      'Mullein is the grandmother of herbs — tall, sturdy, generous, unflinching, standing by roadsides and mountain edges and marginal places offering her velvety leaves freely to anyone who passes. Her dried second-year flowering stalk was used as a torch across ancient Europe and Asia — light-bringer from the margins of civilisation. She teaches that strength and gentleness are not opposites: her tall stalk (structural strength) and her soft velvety leaves (the gentlest touch in the plant world) coexist in the same plant. She teaches that standing by someone in their suffering — without fixing or forcing — is deepest medicine; she soothes the cough not by suppressing it but by providing comfort while the body heals itself. She whispers: My breath is clear. My voice is strong. I stand tall. I speak truth. My throat opens. My lungs expand. I am heard.',
    best_preparation:
      'Long-steep leaf tea (10–15 minutes, warm, covered) — mucilage requires time and water; this is the superior preparation. Flower tea for children and sensitive individuals. No drug screening necessary. Safe for all populations. Earache infused oil for topical use.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety — universally safe; all populations including children, pregnancy and breastfeeding. Grade B+ demulcent and anti-inflammatory evidence. Tea superior to tincture. No drug interactions. One of the most universally applicable and gently powerful herbs for respiratory health.',
  },

  // ─────────────────────────────────────────────
  // MUIRA PUAMA
  // ─────────────────────────────────────────────
  {
    id: 269,
    name: 'Muira Puama',
    botanical: 'Ptychopetalum olacoides (root and stem bark — "Potency Wood")',
    tcm_meridians: ['Kidney', 'Liver', 'Heart'],
    tcm_element: 'Water + Fire',
    energetics: ['Warm', 'Bitter', 'Pungent', 'Yang-Activating', 'Libido-Enhancing', 'Nervine-Tonic'],
    primary_functions: [
      'Sexual vitality and libido — small human trials report improved sexual desire, frequency of intercourse and erection quality; traditional centuries Amazonian "Potency Wood"',
      'CNS tonic and cognitive support — reported improved mental clarity, focus and mood; traditional use for nervous exhaustion and cognitive fog',
      'Anti-fatigue and physical performance — traditional use for increased energy, endurance and recovery',
      'Rooted masculine drive — Yang-activating without scattered stimulation; directed vital force',
      'Amazonian traditional aphrodisiac — centuries of indigenous Brazilian use',
    ],
    secondary_benefits: [
      'Potential neuroprotective effects — preclinical data on memory, learning and stress resilience',
      'Female libido support — human trials include women as well as men',
      'HPA axis modulation — traditional use for fatigue may involve cortisol regulation',
    ],
    pharmacology:
      'Key constituents: alkaloids (muirapuamine and others — poorly defined structurally; limited chemistry characterisation), terpenes, sterols, fatty acids, essential oils, coumarin-like compounds. Human trials: two small studies in France reported improved libido and erectile function in men with sexual dysfunction (mechanisms unclear — likely vascular plus CNS). Chemistry still partially characterised. Grade B- aphrodisiac and sexual function (small human trials plus extensive traditional use); Grade C+ cognitive support (preclinical and traditional). Traditional use suggests acceptable safety at moderate doses; modern formal toxicology limited.',
    flavor_profile: 'Slightly aromatic, bitter and woody — traditional decoction has distinctive character',
    contraindications: [
      'Pregnancy — CAUTION: insufficient safety data; avoid',
      'Breastfeeding — CAUTION: insufficient data; avoid',
      'Significant cardiovascular disease (hypertension, arrhythmias, structural heart disease) — CAUTION: potential CNS and circulatory stimulation; consult cardiologist',
      'Severe anxiety or agitation — CAUTION: stimulating properties may exacerbate',
      'Bipolar disorder — CAUTION: stimulating CNS effects; consult prescriber',
    ],
    herb_to_herb_synergy: [
      'Maca — classical sexual vitality synergy; complementary nutritive (Maca) and neural-vascular (Muira Puama) mechanisms',
      'Damiana and Catuaba — comprehensive Amazonian-Andean sexual vitality protocol',
      'Ginkgo — enhanced peripheral circulation amplifying Muira Puama vascular effects',
      'Oatstraw — nervine restorative base stabilises Muira Puama stimulating effect',
      'Ashwagandha — adaptogenic grounding combined with Muira Puama Yang activation',
    ],
    herb_to_herb_caution: [
      'Other stimulant or sympathomimetic herbs at high combined doses — cumulative cardiovascular effects',
      'Antihypertensive herbs — potential antagonism of BP-lowering effects',
    ],
    herb_to_drug_interactions: [
      'Stimulant medications — additive CNS and cardiovascular effects; monitor',
      'Antihypertensives — potential antagonism; monitor BP',
      'No other significant documented interactions',
    ],
    herb_interactions: [
      'Synergy: Maca, Damiana, Catuaba, Ginkgo, Oatstraw, Ashwagandha',
      'Caution: stimulant herbs at high combined doses; antihypertensive herbs (BP monitoring)',
      'Drug interactions: stimulant meds (monitor), antihypertensives (monitor BP); otherwise minimal',
    ],
    dosage_range:
      'Decoction: 2–4 g dried root/bark per 250 ml simmered 15–20 minutes, 1–2× daily. Tincture: 2–4 ml, 1–2× daily. Powder/capsules: 500–1000 mg, 1–2× daily. Often used in 4–8 week cycles then reassessed.',
    spiritual_layer:
      'Muira Puama is "potency wood" — the Amazonian tree whose bark teaches that desire, when aligned with heart and mind and purpose, becomes potency rather than compulsion. The indigenous peoples of the Brazilian Amazon have used her for centuries, understanding that healthy sexuality is inseparable from overall vitality, from connection to life force itself. She teaches that libido is directional: when it flows through the channels of purpose, love and authentic relationship it becomes medicine; when it dissipates in compulsion or anxiety it becomes depletion. She whispers: My desire and my purpose align. My energy rises in service of what truly matters. Potency is rooted in depth, not surface.',
    best_preparation:
      'Decoction (bark or root simmered 15–20 minutes) for most complete traditional extraction. Pairs naturally with Maca and Oatstraw for a comprehensive sexual vitality and nervous system support protocol. Screen for cardiovascular disease and stimulant medication use. Always note that persistent ED may indicate underlying vascular disease — encourage medical evaluation.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B- sexual function and libido (small human trials plus extensive traditional use). Grade C+ cognitive and anti-fatigue. Appropriate safety for moderate-term use in low-risk individuals. Cardiovascular screening required. Not a substitute for medical evaluation of persistent sexual dysfunction.',
  },

  // ─────────────────────────────────────────────
  // NETTLE
  // ─────────────────────────────────────────────
  {
    id: 270,
    name: 'Nettle',
    botanical: 'Urtica dioica (leaf only — harvested spring-summer)',
    tcm_meridians: ['Kidney', 'Spleen', 'Liver'],
    tcm_element: 'Earth + Metal',
    energetics: ['Cool', 'Dry', 'Nutritive', 'Mineral-Rich', 'Grounding', 'Strengthening'],
    primary_functions: [
      'Foundational mineral tonification — most mineral-rich commonly available herb; one cup infusion provides more bioavailable minerals than most supplements (potassium 50 mg, calcium 480 mg, magnesium 280 mg, iron 8 mg, silica 500+ mg per cup)',
      'Silica for connective tissue — 500+ mg silica per cup crosslinks collagen fibres; cumulative strengthening of hair, skin, nails, bones and tendons over 4–12 weeks',
      'Potassium-sparing diuretic — gentle detoxification that preserves potassium (unlike pharmaceutical diuretics which deplete it)',
      'Quercetin antihistamine — mast cell stabilisation; cumulative reduction in baseline histamine; allergy, eczema and asthma support',
      'Immune support via beta-glucans — foundational NK cell and innate immunity activation (not stimulating; tonifying)',
    ],
    secondary_benefits: [
      'Galactagogue — traditional and mechanistically supported support for milk supply and nutrient density in breastfeeding',
      'Pregnancy mineral support — second and third trimester mineral foundation for fetal development',
      'Post-illness mineral repletion — fastest route to foundational recovery after illness, surgery or chemotherapy',
      'Blood tonic — iron, folate and vitamin C support red blood cell formation and anaemia prevention',
    ],
    pharmacology:
      'Primary bioactives: minerals (4–6% dried leaf; potassium, calcium, magnesium, iron, silica, zinc, chromium, selenium, manganese — EXCEPTIONAL density; one cup infusion exceeds most mineral supplements), silica (500+ mg/cup; crosslinks collagen; structural mineral for connective tissue), quercetin (flavonoid 0.1–0.5%; mast cell stabilisation; antihistamine; anti-inflammatory), chlorophyll (alkalising; detoxification), beta-glucans (polysaccharides; NK cell and immune activation). Mechanism: minerals are water-soluble — long steeping (10–15 minutes) extracts minerals into infusion naturally; no alcohol required. Potassium-sparing diuretic is unique property (most diuretics deplete K). Grade A mineral content; Grade B+ silica/connective tissue; Grade B antihistamine; Grade A safety.',
    flavor_profile: 'Green, slightly grassy and mild with a hint of mineral depth — pleasant as a daily tonic tea',
    contraindications: [
      'Pharmaceutical diuretics — CAUTION: additive diuresis; monitor hydration and electrolytes',
      'Kidney disease — CAUTION: even gentle diuretics may require adjustment; monitor renal function',
      'Pregnancy (first trimester) — LIMITED DATA: traditional use suggests safety; consult provider if uncertain; generally safe in second and third trimester',
      'Iron deficiency supplementation — TIMING: tannins can reduce iron absorption; separate by 1–2 hours (though Nettle has minimal tannins — usually not a significant issue)',
      'Otherwise: Grade A safety — centuries traditional and culinary use',
    ],
    herb_to_herb_synergy: [
      'Oatstraw and Lucerne (Alfalfa) — foundational mineral "green trinity" for deep nutritive rebuilding',
      'Moringa — comprehensive nutritive tonification covering all micronutrient bases',
      'Dandelion — combined potassium-sparing diuresis and liver-kidney tonic',
      'Raspberry Leaf — postpartum mineral and uterine recovery combined',
      'Chamomile — antihistamine plus anti-inflammatory combined for allergy management',
    ],
    herb_to_herb_caution: [
      'Other diuretic herbs — cumulative diuresis; monitor electrolytes',
    ],
    herb_to_drug_interactions: [
      'Diuretic medications — additive diuresis and electrolyte shifts; monitor',
      'Anticoagulants — vitamin K content may affect INR at very large doses; monitor',
      'Diabetes medications — monitor blood sugar (mild glucose effects)',
      'Iron supplements — separate by 1–2 hours (tannin absorption interference; usually not significant)',
    ],
    herb_interactions: [
      'Synergy: Oatstraw, Lucerne, Moringa, Dandelion, Raspberry Leaf, Chamomile',
      'Caution: other diuretics (cumulative)',
      'Drug interactions: diuretics (monitor), anticoagulants (large doses only), diabetes meds (monitor glucose), iron supplements (space by 1–2 hours)',
    ],
    dosage_range:
      'Infusion (OPTIMAL — minerals require water extraction): 2–4 g dried leaf steeped 10–15 minutes minimum (longer = more minerals), 2–4 cups daily. Long steeping and generous amounts are key — many people use 1–2 oz (30–60 g) steeped overnight per day for intensive mineral building. Safe indefinite daily use.',
    spiritual_layer:
      'Nettle is the fierce nourisher — her sting teaches respect before she shares her gifts; the protective defence of something truly generous. She grows in the most nutritionally rich soils — wherever nitrogen and human activity have concentrated the earth\'s wealth, there Nettle appears, pulling up mineral treasure and offering it to whoever has the wisdom to wear gloves and harvest carefully. She teaches that strong boundaries allow generous giving, that fierceness and generosity are not opposites but aspects of the same integrity. She is the reminder that the most nourishing things in life sometimes require something of us before they give. She whispers: I am nourished. My foundations are solid. My bones are strong. My hair and skin glow. I am abundant. My boundaries protect my generosity. I am rooted and rising.',
    best_preparation:
      'Long-steep infusion (10–15 minutes minimum; overnight preferred for intensive mineral building) — not tincture, not capsules; the minerals are water-soluble and need adequate steeping time in hot water. Generous amounts: 1–2 oz (30–60 g) per quart is traditional. Daily ritual. Safe in pregnancy, breastfeeding, children and all populations except with caution in renal disease and alongside diuretic medications.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A mineral content and safety. Most mineral-rich commonly available herb — unmatched nutritive foundation. Safe indefinitely for all populations with renal and diuretic medication caution. Long-steep infusion essential. Cumulative connective tissue, bone, hair and skin benefits over 4–12 weeks.',
  },

  // ─────────────────────────────────────────────
  // OATSTRAW
  // ─────────────────────────────────────────────
  {
    id: 271,
    name: 'Oatstraw',
    botanical: 'Avena sativa (aerial parts — sterile stem and milky oat tops)',
    tcm_meridians: ['Spleen', 'Heart'],
    tcm_element: 'Earth + Fire',
    energetics: ['Neutral to Slightly Cool', 'Sweet', 'Moistening', 'Tonifying', 'Gentle Nervine', 'Rebuilding'],
    primary_functions: [
      'Nervous system nourishment and rebuilding — rebuilds resilience in burnout, chronic stress, sensory overload and post-illness nervous exhaustion through mineral and B-vitamin supply',
      'Gentle non-sedating anxiolytic — reduces baseline anxiety and reactivity through steady mineral support without cognitive impairment or drowsiness',
      'Mineral-rich nutritive tonic — calcium, magnesium, potassium, silica and iron in bioavailable form; supports bones, connective tissue, skin, hair and nails',
      'Cognitive support — oat extracts show modest improvements in attention and information processing in human studies',
      'Long-term foundational tonic — weeks to months of consistent use; fundamentally rebuilding rather than acutely stimulating',
    ],
    secondary_benefits: [
      'Cardiovascular support via avenanthramides — unique phenolic compounds with anti-inflammatory and vasodilatory properties',
      'Mood stabilisation — gentle, non-forcing baseline mood elevation through nervous system nourishment',
      'Post-substance-recovery rebuilding — ideal for nervous system repair following substance use history',
      'Food-like safety profile — appropriate for very sensitive, depleted or fragile constitutions',
    ],
    pharmacology:
      'Primary bioactives: minerals — calcium, magnesium, potassium, silica, iron (highly bioavailable in long infusions; best extracted via 4–8 hour or overnight steep), avenanthramides (unique phenolic compounds; anti-inflammatory; vasodilatory; protective to cardiovascular and nervous systems; reduces inflammatory markers), B vitamins and complex carbohydrates (energy metabolism; nerve function), flavonoids, saponins, sterols (anti-inflammatory; heart-supportive; adaptogenic-like effects). Mechanism: gentle cumulative nourishment — not acute sedation or acute anxiolysis but slow rebuilding of nervous system resilience and mineral foundation. GLUTEN NOTE: certify gluten-free if celiac disease. Grade B+ nervine restorative; Grade B cognitive; Grade B+ anti-inflammatory; Grade A safety.',
    flavor_profile: 'Mild, sweet, grassy and gently warming — brews into a bright greenish infusion; one of the most pleasant medicinal teas',
    contraindications: [
      'Celiac disease or gluten sensitivity — use ONLY certified gluten-free oatstraw; some individuals react to avenin proteins even in gluten-free varieties',
      'Known oat allergy — rare; discontinue if rash, itching or GI upset',
      'Otherwise: Grade A safety — food status; long-term usage across multiple populations; extremely safe',
    ],
    herb_to_herb_synergy: [
      'Nettle and Lucerne (Alfalfa) — foundational mineral-rich "green trinity" for comprehensive nutritive rebuilding',
      'Skullcap and Lemon Balm — nervine trio for anxiety with exhaustion; Oatstraw provides mineral foundation',
      'Milky Oats tincture (fresh Avena sativa) — combined for deep nervous system rehabilitation',
      'Ashwagandha and Holy Basil — adaptogenic HPA axis support while Oatstraw provides structural mineral foundation',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb cautions — safe with all herbs',
    ],
    herb_to_drug_interactions: [
      'None significant documented — extremely safe with all medications',
    ],
    herb_interactions: [
      'Synergy: Nettle, Lucerne, Skullcap, Lemon Balm, Milky Oats, Ashwagandha, Holy Basil',
      'Caution: None',
      'Drug interactions: None documented',
    ],
    dosage_range:
      'Infusion (OPTIMAL — minerals and avenanthramides require water extraction): 1–2 oz (30–60 g) dried oatstraw per quart of just-boiled water, steeped 4–8 hours covered (or overnight), then refrigerate and drink 1–4 cups throughout the day. Short steep (15–20 minutes): gentler and less mineral-rich but still therapeutic. Tincture (milky oats 1:2 fresh): 3–5 ml, 2–3× daily. Duration: 6–12 weeks minimum for burnout recovery; safe indefinitely.',
    spiritual_layer:
      'Oatstraw is quiet nourishment — she does not announce herself with bitterness or potency but with gentle sweetness and a bright green infusion. She is the "re-mothering" herb — the sense of someone making you soup and reminding you to rest. She teaches that rebuilding comes from small, consistent acts of care rather than heroic surges of willpower, that the nervous system is like a field that needs water, minerals and time to regrow after drought, not more ploughing. She is for the wired-and-tired, the chronically depleted, those who have given so much that they have forgotten what it feels like to be genuinely nourished. She whispers: I nourish myself deeply. Slow steadiness rebuilds me. I am allowed to rest and refill. The field regrows.',
    best_preparation:
      'Overnight infusion (4–8 hours) using 1–2 oz per quart — this is the traditional "nourishing herbal infusion" preparation that extracts the full mineral content. Daily ritual over 3–6 months for burnout recovery. Certify gluten-free if celiac disease. No drug interactions. One of the safest and most universally applicable tonic herbs in Western herbalism.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A safety — food status; gluten caution only. Grade B+ nervine restorative (strong traditional use; clinical cognitive studies). Fundamentally different from acute nervines — works through slow mineral and nutritive rebuilding over weeks to months. Ideal for burnout, exhaustion, chronic stress and post-illness recovery.',
  },
  // ============================================================
  // BATCH 07 — 10 herbs converted from monographs
  // Ready to merge into src/data/herbsAndProtocols.ts
  // ============================================================

  // ─────────────────────────────────────────────
  // OREGANO
  // ─────────────────────────────────────────────
  {
    id: 272,
    name: 'Oregano',
    botanical: 'Origanum vulgare (leaves and flowering tops — "Joy of the Mountain")',
    tcm_meridians: ['Lung', 'Spleen', 'Liver'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm', 'Dry', 'Pungent', 'Stimulating', 'Antimicrobial', 'Protective', 'Purifying'],
    primary_functions: [
      'Broadest-spectrum herbal antimicrobial — carvacrol (20–80% of volatile oil) disrupts bacterial cell membranes and inhibits cell wall synthesis; effective against E. coli, S. aureus, H. pylori, C. difficile, Salmonella, Listeria and others',
      'Antifungal (fungicidal) — carvacrol inhibits ergosterol synthesis (fungal cell membrane component); kills Candida albicans and Aspergillus rather than merely inhibiting growth',
      'Antiparasitic — carvacrol and thymol disrupt parasite metabolism; effective against roundworms, tapeworms and intestinal parasites',
      'Anti-inflammatory (potent NF-κB inhibitor) — rosmarinic acid (1–4%) inhibits NF-κB transcription factor (master switch controlling 100+ inflammatory genes); reduces TNF-α and IL-6',
      'Antioxidant — highest ORAC capacity among culinary herbs; rosmarinic acid and flavonoids; exceeds some antioxidant supplements',
    ],
    secondary_benefits: [
      'Immune stimulation — volatile oils and compounds enhance innate immunity (white blood cell function) during acute pathogenic challenge',
      'Digestive carminative — volatile oils reduce gas, bloating and GI spasm',
      'Respiratory antimicrobial adjunct — thymol expectorant action combined with carvacrol antimicrobial for respiratory infections',
      'Therapeutic food medicine — Mediterranean culinary staple 2000+ years; daily cooking provides continuous mild antimicrobial and anti-inflammatory benefit',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (4–6% dried herb; carvacrol 20–80% — primary antimicrobial; bactericidal via membrane disruption and metabolic enzyme inhibition; fungicidal via ergosterol synthesis inhibition; antiparasitic; thymol 5–10% — antimicrobial, antispasmodic), rosmarinic acid (1–4%; phenolic; potent NF-κB inhibition; anti-inflammatory; antioxidant), flavonoids — apigenin, luteolin (1–2%; antioxidant; anti-inflammatory). Grade A antimicrobial (in vitro); Grade B+ antifungal; Grade B antiparasitic and anti-inflammatory; Grade A antioxidant; Grade A culinary safety. Carvacrol content varies by variety: Greek and Spanish oregano 20–80%; Turkish varieties often lower — specify high-carvacrol variety for medicinal use.',
    flavor_profile: 'Warm, peppery, slightly bitter and resinously aromatic — characteristic Mediterranean Mediterranean culinary signature',
    contraindications: [
      'Pregnancy — concentrated tinctures and essential oil CAUTION: emmenagogue potential at high doses; CULINARY amounts entirely safe',
      'Breastfeeding — culinary amounts safe; high-dose concentrated forms insufficient data',
      'Essential oil undiluted internally — DO NOT ingest: GI irritation and toxicity risk; whole herb tea and tincture are safe',
      'Bleeding disorders — minor theoretical antiplatelet activity; generally safe; monitor if severe coagulopathy',
      'Immunosuppressant therapy — may partially stimulate immunity; monitor if intentional immune suppression (transplant, autoimmune medical treatment)',
      'Otherwise: Grade A culinary safety — centuries Mediterranean use with no documented toxicity from whole herb',
    ],
    herb_to_herb_synergy: [
      'Garlic — the defining antimicrobial pairing; carvacrol plus allicin creates the strongest herbal antibacterial combination',
      'Ginger — warming plus antimicrobial synergy; both potent NF-κB inhibitors; anti-inflammatory amplification',
      'Thyme — antimicrobial trio (Oregano plus Thyme plus Garlic = triple bactericidal action)',
      'Turmeric — dual NF-κB inhibitor combination; potent synergistic anti-inflammatory',
    ],
    herb_to_herb_caution: [
      'Other essential oil-rich herbs at very high combined doses — cumulative GI irritation potential; moderate stacking',
      'Anticoagulant herbs with Warfarin — mild additive antiplatelet; monitor INR',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants (Warfarin) — theoretical mild antiplatelet; monitor INR at high doses; generally safe at culinary and standard tincture doses',
      'Immunosuppressants — immune stimulation may partially counteract; monitor if intentional immunosuppression',
      'No CYP450 interactions documented; safe with all other medications',
    ],
    herb_interactions: [
      'Synergy: Garlic, Ginger, Thyme, Turmeric',
      'Caution: stacked essential oil-rich herbs at high doses (GI risk); anticoagulant herbs with Warfarin (monitor)',
      'Drug interactions: anticoagulants (mild theoretical — monitor), immunosuppressants (monitor); otherwise safe with all medications',
    ],
    dosage_range:
      'Culinary (MOST SUSTAINABLE): 1–2 tbsp fresh or 1–2 tsp dried daily in cooking — indefinitely safe therapeutic food medicine. Tea: 1–2 tsp dried herb steeped 10–15 minutes (warm, covered), 2–3× daily. Tincture: 30–60 drops, 2–3× daily. For acute infection: intensive dosing 2–4 weeks then break. Standardised extract (50%+ carvacrol): 500–1000 mg daily.',
    spiritual_layer:
      'Oregano is "joy of the mountain" in Greek — ganos (joy) and oros (mountain) — sacred to Aphrodite, goddess of love, who grew it on Mount Olympus. She is the fierce protector whose pungent warmth teaches that love sometimes looks fierce, that genuine protection sets boundaries, that the most loving act can be the removal of what harms. Her antimicrobial precision — discerning what belongs in the body and what must be expelled — is a teaching about healthy immunity at every level: physical, emotional and relational. She grows on mountain heights where conditions are harsh, teaching that resilience develops in difficult terrain. She whispers: I am protected. My boundaries are strong. I discern what belongs. I am fierce and loving simultaneously. My strength protects myself and others.',
    best_preparation:
      'Daily culinary integration is the most sustainable and enjoyable protocol — warm pasta sauce, marinades, soups, teas. For acute infection: warm tea 3× daily (warmth enhances volatile oils) combined with Garlic and Ginger. High-carvacrol Greek or Spanish varieties for medicinal use. Warm extraction optimal. Carvacrol percentage verification important for standardised extracts.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A antimicrobial (in vitro) and antioxidant. Broadest-spectrum herbal antimicrobial available. Culinary amounts safe indefinitely and for all populations. Concentrated forms: pregnancy caution. Safe with all medications. Synergises definitively with Garlic and Ginger for antimicrobial protocols.',
  },

  // ─────────────────────────────────────────────
  // PASSIONFLOWER
  // ─────────────────────────────────────────────
  {
    id: 273,
    name: 'Passionflower',
    botanical: 'Passiflora incarnata (aerial parts — leaves and flowering tops)',
    tcm_meridians: ['Heart', 'Liver'],
    tcm_element: 'Water + Metal',
    energetics: ['Cool', 'Moist', 'Gently Sedating', 'Anxiety-Releasing', 'Emotionally-Softening', 'Parasympathetic-Activating'],
    primary_functions: [
      'Clinically proven anxiolytic — apigenin flavonoid positively modulates GABA-A receptors; multiple human RCTs show anxiety reduction comparable to benzodiazepines, but non-addictive',
      'Sleep onset for racing mind — quiets overactive thinking and rumination rather than forcing sedation; specifically indicated for anxiety-driven insomnia where mental chatter prevents sleep',
      'Muscle relaxation and antispasmodic — GABA modulation reduces skeletal and smooth muscle tension; tension headaches, TMJ, menstrual cramping, physical stress holding',
      'Emotional intensity processing — facilitates grief, anxiety and overwhelm as a safe parasympathetic container; emotional gripping dissolves',
      'Panic and palpitation support — calms both anxious nervous system and anxiety-linked racing heart via vagal tone and GABA modulation simultaneously',
    ],
    secondary_benefits: [
      'Menstrual support — antispasmodic and emotional calming reduce period cramping and PMS emotional intensity',
      'Non-addictive benzodiazepine alternative — no tolerance, no dependence, no withdrawal; safe ongoing indefinite use',
      'Meditation and presence support — calm-alert state (paradoxical clarity) is ideal for contemplative practice',
      '300+ years Native American and European traditional use',
    ],
    pharmacology:
      'Primary bioactives: flavonoids (2–6%; apigenin — KEY anxiolytic; positive allosteric modulation of GABA-A receptors WITHOUT benzodiazepine site binding; non-sedating paradoxical calm-alert; luteolin, orientin, isovitexin — supporting GABAergic and antioxidant activity), trace alkaloids — harmane, harmaline (weak MAOI-like activity; additional anxiolytic and sedative contribution; CAUTION with SSRIs — theoretical additive monoamine modulation), volatile oils (vanilla-like aromatic compounds; mild mood-lifting), polysaccharides (10–15%; immune-modulating). KEY CLINICAL DISTINCTION from benzodiazepines: does not force sedation; facilitates body\'s own GABA system; calm alert maintained. Multiple human RCTs; Grade B anxiety evidence; Grade A safety.',
    flavor_profile: 'Mildly aromatic and slightly bitter with characteristic vanilla-like notes — pleasantly herbal',
    contraindications: [
      'Depression — MONITOR: emphasis on calming and surrender may deepen lethargy in severely depressed individuals; pair with mood-lifting herbs (Lemon Balm, St. John\'s Wort) if needed',
      'CNS depressants (benzodiazepines, alcohol, sedatives) — additive sedation; consult prescriber; may allow pharmaceutical dose reduction over time (not abrupt stopping)',
      'SSRIs and antidepressants — MONITOR: trace alkaloid weak MAOI-like activity may produce additive serotonin effect; generally compatible; watch for rare serotonin syndrome symptoms',
      'Pregnancy — limited data; traditionally considered safe; consult provider',
    ],
    herb_to_herb_synergy: [
      'Lemon Balm — classic nervine pairing; both provide calm-alert state; complementary mechanisms; anxiety and mood combined',
      'Chamomile — gentle triple nervine with Lemon Balm; comprehensive anxiety and sleep support',
      'Skullcap — dual non-sedating anxiolytic; nervous tension plus emotional processing',
      'Motherwort — emotional heart support combined with Passionflower emotional softening',
      'Valerian — deeper sleep combination (REDUCE DOSES of both when combining; can produce strong sedation)',
    ],
    herb_to_herb_caution: [
      'Valerian — STRONG CAUTION: opposite energies; together can be overly sedating; use reduced doses intentionally; better as separate protocols',
      'St. John\'s Wort — both affect monoamine systems; monitor combined serotonin effects',
    ],
    herb_to_drug_interactions: [
      'SSRIs and SNRIs — MONITOR: trace alkaloid monoamine interaction; generally compatible but watch for rare serotonin syndrome',
      'Benzodiazepines — additive GABAergic effect; may allow dose reduction over time with prescriber coordination',
      'CNS depressants — additive sedation; monitor',
    ],
    herb_interactions: [
      'Synergy: Lemon Balm, Chamomile, Skullcap, Motherwort',
      'Caution: Valerian (reduce both doses; overly sedating); St. John\'s Wort (monitor serotonin load)',
      'Drug interactions: SSRIs (monitor — generally compatible), benzodiazepines (additive — coordinate with prescriber), CNS depressants (additive sedation)',
    ],
    dosage_range:
      'Tincture (fresh herb most potent): 20–40 drops, 2–3× daily, or 30–40 drops 30–60 minutes before sleep for racing-mind insomnia. Infusion: 2–4 g dried herb steeped 10–15 minutes, 2–3× daily. Safe ongoing indefinite use. No tolerance or dependence development. Afternoon and evening dosing optimal; safe throughout day for most.',
    spiritual_layer:
      'Passionflower is the surrenderer and the releaser — her intricate climbing vine teaches flexibility and yielding; her impossibly complex flower (designed by Spanish missionaries to symbolise the Passion of Christ) holds all the beauty and paradox of emotional complexity. She teaches the sacred work of letting go: releasing the tension we grip, processing the emotions we hold, surrendering what no longer serves. She opens the hands that have been clenched around fear, grief and urgency, and teaches the body that it is safe to rest while remaining present. She whispers: It is safe to feel. It is safe to rest. You can let go now. Surrender is not defeat. It is how the deepest healing enters.',
    best_preparation:
      'Fresh herb tincture for highest potency. Evening timing for sleep support (30–60 minutes before bed is critical). Acute anxiety: keep tincture accessible throughout the day for as-needed dosing. Screen for depression (monitor mood), CNS depressants and SSRIs. The non-addictive quality is the central clinical message — safe to use daily indefinitely, unlike any pharmaceutical equivalent.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B anxiety evidence (multiple human RCTs; GABA mechanism confirmed). Grade A safety (300+ years; non-addictive; no dependence). Paradoxical calm-alert state is the defining quality. Screen depression, CNS depressants and SSRIs. Safe long-term daily use. The defining non-addictive benzodiazepine alternative.',
  },

  // ─────────────────────────────────────────────
  // PAU D'ARCO
  // ─────────────────────────────────────────────
  {
    id: 274,
    name: "Pau d'Arco",
    botanical: "Handroanthus impetiginosus / Tabebuia impetiginosa (inner bark — CAUTION: restricted use)",
    tcm_meridians: ['Liver', 'Large Intestine', 'Immune System'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Bitter', 'Astringent', 'Heat-Clearing', 'Damp-Drying', 'Antimicrobial', 'Narrow Therapeutic Window'],
    primary_functions: [
      'Broad antifungal and antimicrobial — lapachol and beta-lapachone (naphthoquinones) show potent in vitro activity against Candida spp., dermatophytes, bacteria (gram+ and gram-), viruses and parasites',
      'Anti-inflammatory and analgesic — NSAID-like prostaglandin (PGE2) modulation; open-label trial (1050 mg/day, 8 weeks) showed significant dysmenorrhoea pain reduction',
      'Antiplatelet and mild anticoagulant — lapachol reduces platelet aggregation and may interfere with vitamin K-dependent coagulation; MAJOR SAFETY RISK at higher doses',
      'Experimental antitumour properties — naphthoquinones show cytotoxicity against tumour cell lines in vitro; human cancer evidence sparse and inconsistent; NOT for cancer self-treatment',
      'Conservative short-term antimicrobial adjunct — best reserved for cases where safer alternatives are insufficient; topical use has better safety margin',
    ],
    secondary_benefits: [
      'Safer alternatives exist for most indications: Garlic, Thyme, Berberine herbs, Oregano, Calendula for candida and infection',
      'Topical application (strong decoction) for fungal skin infections has better safety margin than high-dose internal use',
      'Traditional Amazonian and South American indigenous use for fevers, infections and chronic inflammatory conditions',
      'SUSTAINABILITY CONCERN: wild pau d\'arco trees face overharvesting pressure; certified sustainable or plantation sources essential',
    ],
    pharmacology:
      "Primary bioactives: naphthoquinones — lapachol and beta-lapachone (responsible for both antimicrobial and antitumour activity AND toxicity: GI irritation, bleeding risk, fetotoxicity, reproductive toxicity), flavonoids, phenolic acids, iridoids, tannins. NO universally accepted safe medicinal dose. Modern products often limit lapachol content to reduce toxicity. Antiplatelet mechanism: lapachol reduces platelet aggregation and may interfere with vitamin K; >1.5 g/day lapachol-rich preparations particularly problematic. Pregnancy: lapachol shows teratogenic and abortifacient effects in animal studies — ABSOLUTELY CONTRAINDICATED. Grade B antifungal/antimicrobial (strong in vitro; limited human observational data). Grade B+ antiplatelet risk (confirmed). Grade C safety overall (some short-term data; high-dose lapachol toxicity well-documented; pregnancy and bleeding concerns critical).",
    flavor_profile: 'Bitter, astringent and slightly aromatic — characteristic inner-bark character; not unpleasant but clearly medicinal',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: lapachol teratogenic and abortifacient in animal studies; hard block',
      'Breastfeeding — AVOID: insufficient data; major references advise avoidance',
      'Anticoagulant or antiplatelet drugs (Warfarin, DOACs, heparin, aspirin, clopidogrel) — CONTRAINDICATED: serious additive bleeding risk',
      'Bleeding disorders — CONTRAINDICATED: lapachol prolongs bleeding time',
      'Surgery scheduled within 2 weeks — CONTRAINDICATED: discontinue at minimum 2 weeks before; bleeding risk',
      'Significant liver disease or severe anaemia — AVOID: high chronic lapachol dosing causes anaemia and hepatic stress in animals',
      'Long-term high-dose internal use — LIKELY UNSAFE: severe nausea, vomiting, diarrhoea, dizziness and haemorrhage documented at high lapachol doses',
      'As standalone cancer therapy — BLOCK: refer to oncology; experimental only; unsupervised use not acceptable',
    ],
    herb_to_herb_synergy: [
      'Berberine herbs and Oregano — short-term supervised antimicrobial adjunct (not unsupervised long-term)',
      'Topical use with Calendula or Thyme — better safety margin than internal use for fungal skin conditions',
    ],
    herb_to_herb_caution: [
      'Anticoagulant herbs (Ginkgo, Garlic, Turmeric, Ginger) — DANGEROUS additive bleeding risk; absolutely avoid combination',
      'Hepatotoxic herbs at high combined doses — cumulative liver stress',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets — DANGEROUS: additive bleeding; CONTRAINDICATED',
      'CYP450 substrates — beta-lapachone metabolised via CYP systems; drug level changes possible; monitor',
      'COMT-related drugs — beta-lapachone metabolism via COMT; interactions possible',
    ],
    herb_interactions: [
      "Synergy: None actively recommended — safer alternatives preferred for all indications",
      'Caution: anticoagulant herbs (DANGEROUS additive bleeding); hepatotoxic herbs (cumulative)',
      'Drug interactions: anticoagulants/antiplatelets (CONTRAINDICATED), CYP450 substrates (monitor)',
    ],
    dosage_range:
      "Conservative short-term internal (if used at all): 2–4 g/day bark decoction divided into 2–3 doses, for 7–14 days maximum, with full risk disclosure and monitoring. Dysmenorrhoea trial dose: 1050 mg/day encapsulated bark for up to 8 weeks with monitoring (based on single open-label trial of 12 women). Topical: strong decoction (10–15 g bark in 500–750 ml water, simmered 20–30 minutes) applied externally to fungal infections 1–2× daily — better safety profile than high-dose internal. NOT for unsupervised consumer recommendation.",
    spiritual_layer:
      "Pau d'Arco is the deep uncompromising purifier — a warrior bark that goes after entrenched stagnation, chronic infections and systemic toxicity with remarkable precision. She teaches that strong medicine requires discernment, that the most powerful purifiers must be used with respect for their limits. Her teaching is power with precision: she is not for casual or routine use but for those moments when gentler allies have been insufficient and a deeper clearing is necessary. She also carries the lesson of ecological relationship: her trees face overharvesting, and choosing her always requires considering the cost to the forest. She whispers: I clear what no longer belongs — with wisdom and care. I respect the strength of deep medicine and use it with discernment. Purification in my life is precise, safe and guided.",
    best_preparation:
      "NOT for standard consumer recommendation. Position as restricted herb requiring practitioner mode. Topical decoction for fungal skin conditions is the most accessible and safest application. For internal use: absolute contraindication screening (pregnancy, bleeding, anticoagulants, surgery) is mandatory. Safer antimicrobial alternatives: Oregano, Garlic, Thyme, Berberine herbs. Always address sustainability (certified sustainable sources only).",
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'RESTRICTED HERB — not for standard consumer recommendation. Grade B antifungal/antimicrobial in vitro. Critical safety concerns: pregnancy HARD BLOCK (teratogenic); bleeding risk (anticoagulants and surgery CONTRAINDICATED); high-dose lapachol toxicity documented. Topical use safer than internal. Always offer safer antimicrobial alternatives first.',
  },

  // ─────────────────────────────────────────────
  // PINE POLLEN
  // ─────────────────────────────────────────────
  {
    id: 275,
    name: 'Pine Pollen',
    botanical: 'Pinus densiflora / Pinus sylvestris (pollen — male reproductive dust)',
    tcm_meridians: ['Spleen', 'Stomach', 'Kidney'],
    tcm_element: 'Earth + Water',
    energetics: ['Warm', 'Sweet', 'Dense', 'Tonifying', 'Nourishing', 'Masculine', 'Grounding'],
    primary_functions: [
      'Nutritional foundation — 200+ bioactive nutrients; complete amino acid profile (all 20 amino acids, 9 essential — rare for a plant source, 15–25% by weight); comprehensive mineral cofactors',
      'Gentle phytoandrogen endocrine support — plant-derived DHEA precursors and weak androgen receptor agonists modulate HPA axis without direct testosterone replacement; slow cumulative hormonal support',
      'Energy and stamina — complete amino acid profile plus mineral cofactors (magnesium, iron, copper, manganese) support mitochondrial ATP production; traditional marathon runner and martial artist fuel',
      'Anti-ageing and cellular resilience — polysaccharides (15–20%; beta-glucans, arabinogalactans) support cellular resilience; antioxidants (flavonoids, carotenoids, vitamin E) scavenge free radicals',
      'Immune baseline modulation — polysaccharides stimulate NK cells and macrophages without overstimulation; zinc and selenium support immune enzyme systems',
    ],
    secondary_benefits: [
      'Collagen and skin support — amino acid profile plus vitamin C supports collagen synthesis; skin quality and connective tissue resilience',
      'Male sexual vitality — secondary to endocrine support; libido and erectile function via slow cumulative phytoandrogen effect (4–12+ weeks)',
      'Post-surgical recovery — complete protein and mineral foundation accelerates tissue repair and energy restoration',
      'TCM jing tonification — nourishes Kidney essence and Spleen qi simultaneously; traditional longevity medicine',
    ],
    pharmacology:
      'Primary bioactives: amino acids (15–25% by weight; all 20 including all 9 essential — exceptional for plant source), phytoandrogens (weak DHEA precursors; androsteiones — plant-derived; weak androgen receptor agonism; NOT direct testosterone; HPA axis and hypothalamic-pituitary modulation; slow cumulative endocrine support), 85+ trace minerals (zinc, magnesium, selenium, iron, copper, manganese, boron, chromium, molybdenum — all bioavailable), polysaccharides (15–20%; beta-glucans; arabinogalactans; immune modulation), antioxidants (flavonoids, phenolics, carotenoids — β-carotene, lutein, zeaxanthin; vitamin E; proanthocyanidins), vitamins (vitamin D; B-complex; vitamin C; vitamin A from carotenoids). Hypoallergenic — no histamine unlike flower pollens. Grade A nutritional composition; Grade C phytoandrogen activity (mechanism plausible; limited RCTs; traditional use extensive); Grade B athletic performance (traditional use; limited modern trials); Grade A safety.',
    flavor_profile: 'Mild, slightly sweet and subtly pine-like — pleasant and food-like; versatile in smoothies and warm milk',
    contraindications: [
      'Pine or pollen allergy — EXTREMELY RARE: pine pollen is hypoallergenic (no histamine); patch test if severe multi-pollen allergy; discontinue if reaction',
      'Hormone-sensitive conditions (oestrogen-receptor-positive cancers) — THEORETICAL: phytoandrogen activity; consult oncologist; generally considered safe (weak plant androgens, not pharmaceutical)',
      'Otherwise: Grade A safety — food source; no documented toxicity; safe for all populations',
    ],
    herb_to_herb_synergy: [
      'Cordyceps — endurance and mitochondrial energy combined with phytoandrogen nutritive foundation; classical TCM trio with Ginseng',
      'Maca — complementary Andean nutritive and phytoandrogen support; comprehensive vitality',
      'Ashwagandha — adaptogenic HPA grounding combined with Pine Pollen nutritive foundation',
      'Nettle and Moringa — expanded mineral and nutritive foundation; comprehensive green food medicine',
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic or androgenic herbs in hormone-sensitive conditions — theoretical cumulative hormonal effect; consult',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented',
      'Hormone therapies — theoretical mild additive effect; monitor if on exogenous hormones',
    ],
    herb_interactions: [
      'Synergy: Cordyceps, Maca, Ashwagandha, Nettle, Moringa',
      'Caution: androgenic herbs in hormone-sensitive conditions (theoretical)',
      'Drug interactions: None significant; hormone therapies (monitor)',
    ],
    dosage_range:
      'Powder (whole pollen — optimal): 1–2 tsp (2–4 g), once daily morning on empty stomach or with warm water or milk. Capsules: 500 mg, 2–4 daily (equivalent). Traditional honey integration: 1 tsp pollen with 1 tsp raw honey morning. Take with fat-containing meal or warm milk for fat-soluble vitamin absorption. Daily use 3–6 months for cumulative effects. Safe indefinite daily use.',
    spiritual_layer:
      'Pine Pollen is the golden dust of ancient forests — the distilled fertility and ancestral power of trees that have stood for centuries through mountain winds and seasonal extremes. She is the male reproductive essence of the pines, released in vast golden clouds each spring, teaching that abundance is not scarcity, that generosity is the nature of vitality, that the tree gives its most precious substance freely to the wind. She carries the memory of deep roots, of growth through seasons, of the accumulated intelligence of forests. She teaches that true masculine vitality is not aggression but rooted, patient, enduring power — the strength of something that grows slowly and lasts. She whispers: I am grounded. I am strong. My roots are deep. I am resilient. My energy is enduring. I am nourished. I am vital. I rise with deliberate power.',
    best_preparation:
      'Morning dose with warm (not hot — preserves nutrients) milk or water, optionally mixed with raw honey (traditional absorption synergy). Quality verification via third-party amino acid and mineral profile testing. CRITICAL distinction for clients: phytoandrogen effect is gentle endocrine modulation supporting the body\'s own hormone production — NOT pharmaceutical testosterone replacement; slower acting but safer and more sustainable.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A nutritional composition (200+ nutrients documented; complete amino acid profile confirmed). Grade C phytoandrogen activity (mechanism plausible; limited RCTs). Grade A safety — food source; hypoallergenic; safe for all populations. Cumulative effect: 4–12+ weeks. Morning dosing optimal.',
  },

  // ─────────────────────────────────────────────
  // RHODIOLA
  // ─────────────────────────────────────────────
  {
    id: 276,
    name: 'Rhodiola',
    botanical: 'Rhodiola rosea (root and rhizome — standardised 3%+ rosavins)',
    tcm_meridians: ['Heart', 'Spleen', 'Kidney Yang'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm', 'Dry', 'Stimulating', 'Tonifying', 'Resilience-Building', 'Grounding-in-Action'],
    primary_functions: [
      'Adaptogenic stress resilience — rosavins modulate HPA axis; increases DHEA (recovery hormone); normalises cortisol in chronic stress without suppressing natural daily cortisol rhythm; improves capacity to handle stress rather than sedating the response',
      'SSRI-equivalent antidepressant — salidroside inhibits serotonin reuptake (same mechanism as SSRIs); clinical trials show comparable efficacy to fluoxetine and paroxetine for mild-moderate depression with fewer side effects (no sexual dysfunction, weight gain or emotional blunting)',
      'Physical endurance enhancement — increases mitochondrial ATP production; reduces lactate accumulation; improves VO2 max; traditional athletic and military endurance herb',
      'Mental performance under stress — improves prefrontal cortex executive function; increases dopamine (sustained focus and motivation); decision-making quality under pressure',
      'Burnout recovery — rebuilds energy and resilience after stress exhaustion; reduces stress-related fatigue',
    ],
    secondary_benefits: [
      'Mood elevation via dopaminergic and serotonergic activity — avoids the dysphoria of pure GABA agonists',
      'Neuroprotective via phenolic antioxidants crossing blood-brain barrier',
      'Post-illness recovery — rebuilds vitality after acute illness',
      'Distinctive rose-like aroma when root is crushed — quality marker for rosavins',
    ],
    pharmacology:
      'Primary bioactives: rosavins (salidroside and related compounds; 3%+ in premium standardised extracts; true adaptogenic HPA axis modulation; serotonin reuptake inhibition — Grade A SSRI-equivalent clinical evidence; dopaminergic activity; mitochondrial ATP enhancement), phenolic compounds (antioxidant; neuroprotective), terpene volatile compounds (mood-altering; antidepressant; rose-like aroma). CRITICAL INTERACTIONS: bipolar disorder — absolute contraindication (antidepressant mania induction documented); SSRI/SNRI — serotonin syndrome risk (documented especially with paroxetine/Paxil); MAOIs — contraindicated; stimulating effect — morning dosing only; 8–12 week cycling protocol mandatory (not indefinite daily use). Grade A adaptogenic stress resilience; Grade A antidepressant (mild-moderate); Grade B+ physical endurance; Grade A serotonin syndrome risk (well-documented).',
    flavor_profile: 'Slightly bitter and earthy with characteristic rose-like aromatic note when fresh — the rose aroma is the quality marker',
    contraindications: [
      'Bipolar disorder — ABSOLUTE CONTRAINDICATION: antidepressant effect triggers documented mania; HARD BLOCK',
      'SSRIs and SNRIs (especially paroxetine/Paxil) — SEROTONIN SYNDROME RISK: documented interaction; CONTRAINDICATED or only under close psychiatric supervision',
      'MAOIs — ABSOLUTELY CONTRAINDICATED: serotonin syndrome',
      'Anxiety disorders (generalised anxiety) — CAUTION: stimulating; can worsen anxiety; use only if anxiety plus depression both present; monitor closely',
      'Insomnia — AVOID: stimulating; worsens sleep; use morning-midday only',
      'High blood pressure — MONITOR: mild stimulant effect may elevate BP; use only with well-controlled hypertension',
      'ADHD stimulant medications — MONITOR: additive stimulation; watch for overstimulation',
      'Pregnancy and breastfeeding — AVOID: insufficient safety data',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha — complementary adaptogen stack (Rhodiola activating; Ashwagandha grounding); powerful combined resilience building; monitor for overstimulation',
    ],
    herb_to_herb_caution: [
      'St. John\'s Wort — SEROTONIN SYNDROME RISK: both serotonergic; avoid combination',
      '5-HTP — SEROTONIN SYNDROME RISK: additive serotonergic; avoid',
      'Other stimulant adaptogens at high combined doses — excessive stimulation; use sequentially not simultaneously',
    ],
    herb_to_drug_interactions: [
      'SSRIs and SNRIs — SEROTONIN SYNDROME (documented; especially paroxetine): CONTRAINDICATED or psychiatric supervision only',
      'MAOIs — ABSOLUTELY CONTRAINDICATED: serotonin syndrome',
      'ADHD stimulants (Ritalin, Adderall) — additive stimulation; monitor; may allow pharmaceutical dose reduction',
      'Antihypertensives — may counteract BP-lowering; monitor BP',
      'Immunosuppressants — adaptogenic immune stimulation may partially counteract intentional immune suppression; monitor',
    ],
    herb_interactions: [
      'Synergy: Ashwagandha (monitor overstimulation)',
      'Caution: St. John\'s Wort (serotonin syndrome), 5-HTP (serotonin syndrome), stimulant adaptogens at high combined doses',
      'Drug interactions: SSRIs/SNRIs (SEROTONIN SYNDROME — CONTRAINDICATED), MAOIs (CONTRAINDICATED), ADHD stimulants (additive — monitor), antihypertensives (monitor BP)',
    ],
    dosage_range:
      'Standardised extract (3%+ rosavins — STRONGLY PREFERRED over loose root powder): 200–600 mg daily in divided doses. MORNING ONLY — stimulating; evening dosing disrupts sleep. CYCLING PROTOCOL MANDATORY: 8–12 weeks on, then 2–4 week break; repeat indefinitely. NOT for continuous indefinite daily use (loses adaptogenic benefit; tolerance possible). Drug screening MANDATORY before any recommendation.',
    spiritual_layer:
      'Rhodiola grows at extreme altitudes — 3000–5000 metres above sea level in the arctic and subarctic, on cliff faces and rocky terrain where most plants cannot survive. She was used by Siberian warriors before battle, by Scandinavian Vikings for endurance, by Soviet cosmonauts preparing for space. She is the mountain plant that teaches resilience is not the absence of challenge but the capacity to meet challenge and recover, that stress can become the teacher rather than the destroyer, that the altitude that would weaken others can become the source of concentrated vitality. She whispers: I am resilient. Stress strengthens me. I recover quickly. I am powerful. I endure. I thrive in challenge.',
    best_preparation:
      'Standardised 3%+ rosvain extract — do not use unstandardised root powder; potency verification is non-negotiable given cost and safety stakes. Morning dosing only. Drug screening mandatory (SSRI, bipolar, MAOI — non-negotiable). Cycling protocol education: 8–12 weeks on, 2–4 week break. Realistic timeline: 8–12 weeks for full effect — set expectations clearly.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade A adaptogenic stress resilience (multiple robust RCTs). Grade A antidepressant for mild-moderate depression (SSRI-equivalent efficacy with fewer side effects). CRITICAL safety: bipolar HARD BLOCK; SSRI serotonin syndrome (especially paroxetine — documented). Stimulating — morning only. Cycling protocol mandatory. Extensive psychiatric screening required before every recommendation.',
  },

  // ─────────────────────────────────────────────
  // ROSEMARY
  // ─────────────────────────────────────────────
  {
    id: 277,
    name: 'Rosemary',
    botanical: 'Rosmarinus officinalis (leaves — "Dew of the Sea")',
    tcm_meridians: ['Liver', 'Heart', 'Head-Brain'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm', 'Dry', 'Ascending', 'Moving', 'Stimulating', 'Clarifying'],
    primary_functions: [
      'Mental clarity and cognitive focus — rosmarinic acid inhibits acetylcholinesterase (increases acetylcholine — the memory and focus neurotransmitter); camphor and cineole activate prefrontal cortex function; acute and cumulative cognitive enhancement',
      'Memory support — acetylcholinesterase inhibition mechanism (same target as pharmaceutical Alzheimer\'s drugs like donepezil, but gentler); rosmarinic acid neuroprotective via blood-brain barrier penetration',
      'Circulation to head and brain — camphor and volatile oils produce mild vasodilation; improved cerebral blood flow and oxygenation',
      'Neuroprotection and anti-ageing — rosmarinic acid and carnosic acid (activates Nrf2 antioxidant pathway) protect neurons from oxidative damage; potential Alzheimer\'s prevention (preliminary research)',
      'Liver qi movement and detoxification — bitter principles stimulate bile production; detoxification pathway support; stagnation clearance',
    ],
    secondary_benefits: [
      'Mood elevation and alertness via mild sympathomimetic volatile oils (camphor, pinenes)',
      'Antimicrobial activity — volatile oils broad-spectrum antibacterial and antifungal',
      'German Commission E monograph — approved for supportive cardiovascular and memory function',
      '2000+ years Mediterranean culinary and medicinal use',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (15–50%; camphor — primary vasodilator and mild sympathomimetic; 1,8-cineole — cognitive stimulant; anti-inflammatory; α-pinene and β-pinene — stimulating; limonene — mood-lifting; ALL lipophilic — cross blood-brain barrier), rosmarinic acid (phenolic 3–5%; PRIMARY bioactive; acetylcholinesterase inhibition; potent antioxidant — blood-brain barrier penetration; neuroprotective; anti-inflammatory), carnosic acid (0.5–2%; Nrf2 activation — antioxidant master pathway; neuroprotective), flavonoids — diosmin, hesperidin (0.5–1%; circulatory; antioxidant). TIMING CRITICAL: stimulating — morning to midday ONLY; evening use disrupts sleep. PREPARATION CRITICAL: short tea steep (5–10 minutes maximum) — volatile oils lost with prolonged steeping and heat exposure. Grade B+ mental clarity; Grade B memory and neuroprotection; Grade A culinary safety.',
    flavor_profile: 'Warm, camphoraceous, aromatic and slightly minty-peppery — highly distinctive and pleasantly stimulating',
    contraindications: [
      'Evening use — AVOID: stimulating volatile oils disrupt sleep; morning to midday ONLY',
      'Insomnia — OPPOSITE CONTRAINDICATION: worsens sleep; do not recommend for anyone with active sleep disruption',
      'High blood pressure — MONITOR: mild sympathomimetic effect; generally manageable but monitor BP',
      'Seizure history — CAUTION with concentrated essential oil only: trace thujone (0.2–0.5%); whole herb is safe; avoid concentrated essential oil',
      'Pregnancy — concentrated tinctures and essential oil CAUTION: uterine stimulant potential at high doses; culinary amounts entirely safe',
      'Anxiety and hyperactivity — START LOW: stimulating; may overstimulate sensitive individuals; 10 drops tincture initially; monitor',
    ],
    herb_to_herb_synergy: [
      'Ginkgo — triple cognitive enhancement: acetylcholinesterase (Rosemary) plus ginkgolide circulation and neuroprotection',
      'Gotu Kola — complementary cognitive support and neuroprotection',
      'Lemon Balm — balances Rosemary\'s stimulating clarity with Lemon Balm\'s calming uplift; "calm clarity" combination',
      'Lavender — Rosemary\'s warming circulation combined with Lavender\'s cooling GABA balance',
    ],
    herb_to_herb_caution: [
      'Valerian, Passionflower and sedative herbs — contradictory energies; stimulating vs. sedating; do not combine',
      'High-dose Ginseng — cumulative stimulation; moderate combination',
    ],
    herb_to_drug_interactions: [
      'Blood pressure medications — mild additive or antagonistic effect; monitor BP',
      'Seizure medications — trace thujone in whole herb is minimal; concentrated essential oil caution only',
      'No significant drug interactions from whole herb at culinary or standard tincture doses',
    ],
    herb_interactions: [
      'Synergy: Ginkgo, Gotu Kola, Lemon Balm, Lavender',
      'Caution: sedative herbs (contradictory); high-dose Ginseng (cumulative stimulation)',
      'Drug interactions: antihypertensives (monitor BP); otherwise minimal from whole herb',
    ],
    dosage_range:
      'Tincture (most concentrated): 15–30 drops, 1–2× daily morning only. Tea: 1–2 tsp dried leaf steeped 5–10 minutes ONLY (NOT longer — volatile oils lost); 1–2× daily morning. Aromatic inhalation (2–3 drops essential oil on cloth): fastest route for acute mental clarity effect. Fresh herb in cooking: daily cognitive and circulation support at gentle maintenance level. MORNING TO MIDDAY ONLY.',
    spiritual_layer:
      'Rosemary is the guardian of memory and clarity — from the Latin ros marinus, "dew of the sea," she grows on Mediterranean cliffs where sea air meets rock, where clarity and salt and light converge. She has been the herb of remembrance at funerals and weddings for millennia, understood as the keeper of continuity between past and present. Her teaching is that memory is sacred, that clarity of mind is a form of respect for what has come before and what is yet to be created. The Greek students who wore rosemary garlands while studying understood something neuroscience has now confirmed: her aromatic compounds reach the brain and enhance its function directly. She whispers: My mind is clear. My memory is sharp. My thoughts flow freely. I am awake. I am focused. I remember. I am brilliant.',
    best_preparation:
      'Short-steep tea (5–10 minutes maximum — critical) or tincture for morning cognitive support. Aromatic inhalation for immediate pre-task clarity. Fresh herb in daily cooking for sustained gentle benefit. MORNING ONLY — non-negotiable. Screen for insomnia, anxiety/hyperactivity (start low), high blood pressure (monitor) and pregnancy (concentrated forms).',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ mental clarity and cognitive focus. German Commission E monograph. Grade A culinary safety. TIMING IS THE SAFETY: morning only; evening is contraindicated. Short steep preparation essential. Screen insomnia, hypertension, anxiety, pregnancy (concentrated forms). No significant drug interactions from whole herb.',
  },

  // ─────────────────────────────────────────────
  // SAFFRON
  // ─────────────────────────────────────────────
  {
    id: 278,
    name: 'Saffron',
    botanical: 'Crocus sativus (stigmas only — three red threads per flower — "Red Gold")',
    tcm_meridians: ['Heart', 'Liver'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Dry', 'Precious', 'Radiance-Giving', 'Heart-Opening', 'Mood-Elevating'],
    primary_functions: [
      'Clinically proven mood elevation — crocin (10–15%) is a mild serotonin reuptake inhibitor; multiple RCTs show efficacy comparable to low-dose SSRIs for mild-to-moderate depression; UNIQUE advantage: no sexual dysfunction side effects unlike pharmaceutical SSRIs',
      'Blood circulation and vitality — vasodilatory; mild anticoagulant; increases blood flow to extremities and organs; traditional warming and enlivening effect',
      'Heart opening and emotional warmth — facilitates emotional vulnerability, self-love and compassion; traditional ceremonial medicine for the heart',
      'Neuroprotection — safranal crosses blood-brain barrier; inhibits tau protein aggregation (Alzheimer\'s pathology); reduces neuroinflammation; potential cognitive preservation',
      'Anti-inflammatory — picrocrocin (bitter principle 5–10%) systemic inflammation reduction; inflammatory mood disorder support',
    ],
    secondary_benefits: [
      'Seasonal affective disorder (SAD) support — mood and emotional warmth through darker months',
      'Memory and cognitive preservation — modest evidence; safranal neuroprotective mechanism',
      'Sensory pleasure and radiance — internal warmth, beauty from within, luxury self-care dimension',
      '3000+ years "red gold" — Persian, Indian, Mediterranean medicinal and culinary tradition',
    ],
    pharmacology:
      'Primary bioactives: crocin (10–15%; yellow-orange water-soluble pigment; crosses blood-brain barrier; mild serotonin reuptake inhibitor — SSRI-like mechanism; antidepressant comparable to low-dose SSRI in RCTs; vasodilatory; mild anticoagulant), safranal (0.4–0.6%; orange-red volatile pigment; neuroprotective; inhibits tau protein aggregation; antioxidant; crosses blood-brain barrier; gives saffron its characteristic aroma), picrocrocin (5–10%; bitter principle; anti-inflammatory; antimicrobial), flavonoids — kaempferol, quercetin (1–2%; antioxidant; anti-inflammatory), carotenoids — β-carotene, lycopene (antioxidant), minerals — iron, magnesium, copper. COST: ~$8–15 per serving for whole stigmas; tincture form (2–5 drops) most cost-effective for long-term use. Timeline: 4–8 weeks minimum for mood effects (like pharmaceutical antidepressants — not acute). Grade B mood elevation (multiple RCTs, SSRI mechanism confirmed); Grade A safety (centuries use; minimal contraindications).',
    flavor_profile: 'Uniquely complex — warm, slightly sweet, subtly earthy and distinctively honeyed; the most characterful of all spice aromas',
    contraindications: [
      'Anticoagulants (Warfarin, high-dose aspirin, DOACs) — MONITOR INR: mild anticoagulant activity; additive blood-thinning possible; manageable with monitoring and prescriber awareness',
      'Bleeding disorders — CAUTION: mild increased bleeding risk; monitor carefully',
      'Pregnancy — traditionally avoided by some sources; limited modern data; individual assessment; consult prenatal provider',
      'SSRIs — MONITOR: both affect serotonin; additive serotonin effects generally manageable; rare serotonin syndrome symptoms to watch for; may eventually allow SSRI dose reduction (consult psychiatrist)',
      'Otherwise: Grade A safety — centuries medicinal and culinary use with no documented toxicity',
    ],
    herb_to_herb_synergy: [
      'St. John\'s Wort — dual mood elevation; multi-mechanism antidepressant combination (serotonin and dopamine)',
      'Lemon Balm — mood plus calming nervine; cost-managed combination for everyday mood support',
      'Damiana — saffron mood plus Damiana pleasure and confidence; heart-opening intimate combination',
      'Rose — dual heart-opening aromatic; self-love and emotional warmth amplified',
    ],
    herb_to_herb_caution: [
      'St. John\'s Wort with SSRI medications — combined serotonergic herbs; monitor serotonin syndrome symptoms',
      'Other anticoagulant herbs — cumulative blood-thinning with Warfarin; monitor INR',
    ],
    herb_to_drug_interactions: [
      'Warfarin and anticoagulants — MONITOR INR: mild additive anticoagulant; generally manageable',
      'SSRIs — MONITOR: additive serotonergic; generally compatible; rare serotonin syndrome possible; may allow dose reduction over time (consult psychiatrist)',
      'No other significant drug interactions documented',
    ],
    herb_interactions: [
      'Synergy: St. John\'s Wort, Lemon Balm, Damiana, Rose',
      'Caution: St. John\'s Wort with SSRIs (combined serotonergic — monitor); anticoagulant herbs with Warfarin (INR monitoring)',
      'Drug interactions: anticoagulants (monitor INR), SSRIs (monitor — generally compatible); otherwise minimal',
    ],
    dosage_range:
      'Whole stigmas (traditional ceremonial): 3–5 stigmas steeped 10–15 minutes in hot (not boiling) water, 1–2× daily. Tincture (most cost-effective for long-term): 2–5 drops, 1–2× daily. Take with meals (fat-soluble crocin — absorption enhanced). Timeline: 4–8 weeks minimum for mood effects. Cost note: recommend tincture for daily use; whole stigmas for ceremonial occasions or weekly ritual.',
    spiritual_layer:
      'Saffron is gold distilled into plant form — the most precious spice in the world by weight, each gram representing the hand-harvested stigmas of 150–200 flowers. She has been called "red gold" across Persia, India, Rome, Spain and Morocco for three millennia, reserved for royalty, ceremony, the highest celebrations of life. She teaches that luxury is not indulgence but sacred self-love, that one\'s own wellbeing deserves the most precious attention, that the heart deserves warmth and radiance rather than just adequate functioning. Her crimson colour is the colour of life, of warmth, of the sun\'s first and last light. She whispers: I am radiant. My heart is warm. I am worthy of beauty and luxury. My mood is lifted. I glow from within. I love myself. I am precious. I am whole.',
    best_preparation:
      'Tincture for cost-effective daily mood support; whole stigmas for ceremonial weekly ritual. Morning or evening (not stimulating; neutral timing). With fat-containing meals for absorption. Screen for anticoagulants (monitor INR) and SSRIs (monitor serotonin). CRITICAL timeline education: 4–8 weeks for mood effects — identical pace to pharmaceutical antidepressants. The no-sexual-side-effects advantage over SSRIs is the central clinical message for eligible clients.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade B mood elevation (multiple RCTs; SSRI-equivalent mechanism; no sexual dysfunction). Grade A safety (centuries use). 4–8 week timeline for mood effects. Key advantage over pharmaceutical SSRIs: no sexual dysfunction side effects. Screen anticoagulants (INR monitoring) and SSRIs (additive serotonin — monitor). Tincture most cost-effective for long-term use.',
  },

  // ─────────────────────────────────────────────
  // SCHISANDRA (SCHIZANDRA)
  // ─────────────────────────────────────────────
  {
    id: 279,
    name: 'Schisandra (Five-Flavour Fruit)',
    botanical: 'Schisandra chinensis (whole dried berries — "Magnolia Vine")',
    tcm_meridians: ['Heart', 'Lung', 'Liver', 'Kidney', 'Spleen'],
    tcm_element: 'All Five Elements — integrative',
    energetics: ['Warm', 'Dry', 'Sweet-Sour', 'Astringent', 'Adaptogenic', 'All-Seasons-Integrating'],
    primary_functions: [
      'Unique adaptogenic HPA modulation — lignans (schizandrin A/B/C; deoxyschizandrin; gomisin) modulate HPA axis WITHOUT direct hormone agonism; unique paradox: supports both cortisol normalisation AND energy maintenance simultaneously',
      'Endurance and stamina — lignan-driven ATP production support builds deep reserves (TCM jing); sustained endurance not acute stimulation; traditional Chinese athlete, martial artist and Soviet cosmonaut endurance herb',
      'Liver detoxification support — lignans activate cytochrome P450 Phase I and glutathione S-transferase Phase II enzymes; hepatoprotection; bile production support; lipid peroxidation reduction',
      'Sleep quality and dream enhancement — paradoxical effect: stimulating early (weeks 1–4), then sleep-deepening; REM support; dream vividness; traditionally combined with Reishi for dreamwork',
      'Mental clarity without overstimulation — supports neurotransmitter balance (dopamine, serotonin, GABA) simultaneously; cognitive clarity plus emotional stability; scattered minds settle',
    ],
    secondary_benefits: [
      'Jing essence tonification — TCM Kidney system activation; constitutional energy; reproductive vitality; bone health; longevity',
      'Five-flavor profile (sweet, sour, salty, bitter, pungent) — unique among herbs; corresponds to all Five Elements; integrative action on all organ systems',
      '2000+ years traditional use — Chinese martial arts, Soviet space programme, Korean mountain training; one of the most extensively used adaptogens in Eastern medicine',
    ],
    pharmacology:
      'Primary bioactives: lignans (1–3%; schizandrin A/B/C, deoxyschizandrin, γ-schizandrin, gomisin — UNIQUE bioactive class; distinct from polysaccharides, alkaloids or glycosides; HPA axis modulation via glucocorticoid receptor sensitivity and catecholamine balance; NOT direct hormone agonism), polysaccharides (10–20%; immune modulation), flavonoids — quercetin, kaempferol (3–5%; antioxidant; anti-inflammatory), organic acids — citric, malic, tartaric (5–10%; astringency; mineral binding; sour taste), volatile oils (trace; CNS modulation). PREPARATION CRITICAL: decoction (heat extraction) required for lignan bioavailability; tea alone insufficient; tincture acceptable alternative. INITIAL STIMULATION: weeks 1–4 often stimulating (energy boost, possible mild sleep disruption); settles into balanced adaptive equilibrium by week 4+; morning dosing initially. CRITICAL INTERACTION: CYP450 enzyme induction — many medications at risk (statins, anticonvulsants, SSRIs, oral contraceptives, HRT, Warfarin, immunosuppressants); prescriber consultation MANDATORY before recommending. Grade B+ adaptogenic properties; Grade A CYP450 interaction risk.',
    flavor_profile: 'Remarkably complex — all five flavours simultaneously: sweet, sour, salty, bitter and pungent; astringent; the most multi-dimensional herbal taste',
    contraindications: [
      'CYP450-metabolised medications — CRITICAL INTERACTION: lignans induce CYP450 enzymes; PRESCRIBER CONSULTATION MANDATORY; medications at risk: statins, anticonvulsants, SSRIs, oral contraceptives, HRT, Warfarin, immunosuppressants (tacrolimus, cyclosporine — transplant rejection risk), and many others',
      'Initial stimulation phase (weeks 1–4) — EXPECTED but screen for anxiety disorders and insomnia: stimulation may temporarily worsen these; manage with morning-only dosing and lower initial dose; usually resolves week 4+',
      'Acid reflux and GERD — CAUTION: sour acidic nature may aggravate; take with food',
      'Pregnancy — stimulating early in adaptation; consult prenatal provider',
      'Breastfeeding — limited data; consult provider',
    ],
    herb_to_herb_synergy: [
      'Cordyceps — triple endurance powerhouse (Schisandra + Cordyceps + Ginseng = classical TCM athlete formula)',
      'Ginseng — qi tonification and adaptogenic depth combined',
      'Reishi — sleep quality and dream enhancement protocol; Schisandra balancing plus Reishi yin tonification',
      'Astragalus — immune plus foundational qi tonification; comprehensive Chinese tonic combination',
    ],
    herb_to_herb_caution: [
      'Other stimulating adaptogens at high combined doses (Rhodiola, Eleuthero) — cumulative early stimulation phase; sequential use preferred over simultaneous',
      'Valerian and sedative herbs — opposite energies in early phase; stagger dosing (Schisandra morning; Valerian evening)',
    ],
    herb_to_drug_interactions: [
      'CYP450 enzyme substrates — CRITICAL: prescriber consultation mandatory before combining; statins (levels may decrease), anticonvulsants (efficacy may decrease), SSRIs (efficacy may decrease), oral contraceptives (efficacy may decrease — backup contraception), HRT (efficacy may decrease), Warfarin (INR may decrease), immunosuppressants (TRANSPLANT REJECTION RISK — absolutely consult)',
      'Immunosuppressants — particularly high risk; transplant patients: ABSOLUTELY CONSULT SPECIALIST',
    ],
    herb_interactions: [
      'Synergy: Cordyceps, Ginseng, Reishi, Astragalus',
      'Caution: stimulant adaptogens at high combined doses (early phase); sedative herbs (timing — stagger doses)',
      'Drug interactions: CYP450 substrates — CRITICAL (prescriber consultation mandatory for all prescription medications)',
    ],
    dosage_range:
      'Decoction (OPTIMAL — lignan extraction): 2–4 g whole dried berries simmered 15–20 minutes, 1–2× daily (morning initially; afternoon once adaptation phase settles). Tincture (acceptable alternative): 20–40 drops, 1–2× daily. Standardised extract (3% lignans): 300–600 mg daily. WITH FOOD (fat-soluble lignans — fat enhances absorption). NOT evening initially (stimulating weeks 1–4). Long-term safe with appropriate screening; cycles optional (8–12 weeks on, 1–2 weeks off).',
    spiritual_layer:
      'Schisandra is the Five-Flavour Fruit — the only herb that contains all five flavours simultaneously: sweet, sour, salty, bitter and pungent, each one corresponding to one of the Five Elements, one of the five organ systems, one of the five seasons. She holds the whole year within a single berry. She teaches that true adaptation means holding opposites without resolving them prematurely — that the ability to contain sweetness and bitterness, rest and action, expansion and contraction is not confusion but wisdom. She is the medicine of integration: all seasons present at once, all elements in balance, all aspects of life acknowledged. She whispers: I am adaptable. I am resilient. I contain all seasons. My stamina is sustained. My essence is deep. I am balanced. I am whole. I am integrated.',
    best_preparation:
      'Decoction (heat extraction required) is non-negotiable for lignans. CYP450 drug interaction screening is the critical first step before recommending — verify medication list with prescriber. Educate on initial stimulation phase (weeks 1–4) as expected and manageable. Take with food (fat absorption). Morning dosing initially. One of the most rewarding long-term adaptogens when properly selected.',
    caution_level: 'MEDIUM-HIGH',
    safe_pregnancy: null,
    status:
      'Grade B+ adaptogenic properties (200+ studies; unique lignan mechanism; endurance evidence). Grade A CYP450 interaction risk — the defining safety concern. Decoction preparation essential. Initial stimulation phase (weeks 1–4): manage with morning dosing. CYP450 prescriber consultation mandatory before all recommendations involving prescription medications.',
  },

  // ─────────────────────────────────────────────
  // SHILAJIT
  // ─────────────────────────────────────────────
  {
    id: 280,
    name: 'Shilajit (Mineral Pitch)',
    botanical: 'Asphaltum / Mineral Pitch (Himalayan rock exudate — "Destroyer of Weakness")',
    tcm_meridians: ['Kidney', 'Spleen'],
    tcm_element: 'Water + Earth',
    energetics: ['Warm', 'Moist', 'Dense', 'Tonifying', 'Jing-Restoring', 'Mineral-Rich'],
    primary_functions: [
      'Mitochondrial ATP enhancement — fulvic acid stabilises CoQ10 in inner mitochondrial membrane; increases electron transport chain efficiency up to 40%; stimulates mitochondrial biogenesis; cellular energy multiplication',
      'Testosterone support (hypogonadal men) — increases LH release and enhances Leydig cell steroidogenesis; documented 15–20% testosterone increase in hypogonadal men',
      'Neuroprotection via tau inhibition — fulvic acid crosses blood-brain barrier; specifically inhibits tau protein aggregation (hallmark of Alzheimer\'s pathology); neuronal mitochondrial antioxidant',
      'Iron bioavailability and anaemia correction — fulvic acid chelates iron and trace minerals; dramatically enhances mineral absorption; iron-deficiency correction',
      'Comprehensive mineral tonification — 85+ trace minerals in bioavailable chelated form; foundational cellular function optimisation',
    ],
    secondary_benefits: [
      'Adaptogenic stress resilience — mineral support plus antioxidant reduces cortisol-induced oxidative damage; HPA axis support',
      'Athletic performance — mitochondrial ATP plus mineral plus testosterone stack; body composition, recovery and endurance',
      'Ayurvedic rasayana (rejuvenative) — 3000+ years Sanskrit tradition; "destroyer of weakness"; primordial earth essence',
      'SOURCE QUALITY IS CRITICAL: raw pitch may contain heavy metals (lead, mercury, cadmium); only 3rd-party tested purified standardised extracts are safe',
    ],
    pharmacology:
      'Primary bioactives: fulvic acid (60–80% of purified extract; 500–1000 Da molecular weight; small enough to cross cell membranes; chelates minerals for bioavailability; stabilises CoQ10 in mitochondrial cristae; antioxidant; anti-inflammatory; BBB-crossing), dibenzo-α-pyrones (ubiquinone-like structures; electron transport chain enhancement; CoQ10-like activity; mitochondrial ATP optimisation), humic acid (antioxidant; mineral chelation; anti-inflammatory), 85+ trace minerals (iron, copper, zinc, manganese, magnesium, calcium, potassium, cobalt, molybdenum, selenium — all chelated and bioavailable), amino acids (trace; building blocks). CRITICAL QUALITY NOTE: raw pitch from unverified sources contains heavy metals; 3rd-party tested purified standardised extracts ONLY. ABSOLUTE CONTRAINDICATIONS: haemochromatosis, sickle cell anaemia, thalassemia (iron overload conditions). Grade B+ mitochondrial ATP (mechanism plausible; emerging RCTs); Grade B testosterone in hypogonadal men; Grade B neuroprotection (tau mechanism established; animal models).',
    flavor_profile: 'Earthy, slightly mineral and distinctively resinous — unmistakeably primordial; small amount goes a long way',
    contraindications: [
      'Haemochromatosis (iron overload disease) — ABSOLUTELY CONTRAINDICATED: high bioavailable iron; iron overload worsening',
      'Sickle cell anaemia — ABSOLUTELY CONTRAINDICATED: iron-related complications',
      'Thalassemia (alpha or beta) — ABSOLUTELY CONTRAINDICATED: iron overload syndrome',
      'Gout (high uric acid) — CAUTION/AVOID: contains purines; may elevate uric acid and exacerbate gout',
      'Unverified source quality — ABSOLUTELY AVOID: raw or impure pitch may contain dangerous levels of heavy metals (lead, mercury, cadmium); 3rd-party tested purified standardised extract ONLY',
      'Pregnancy — AVOID: insufficient safety data; safer alternatives available',
      'Breastfeeding — CAUTION: insufficient data; consult provider',
    ],
    herb_to_herb_synergy: [
      'CoQ10 — Shilajit stabilises CoQ10; the defining mitochondrial stack; ATP production maximised synergistically',
      'Cordyceps — both enhance cellular energy; mitochondrial plus fungal mechanism synergy',
      'Ashwagandha and Rhodiola — adaptogenic plus mineral tonification; comprehensive resilience stack',
      'Nettle and Yellow Dock — iron-rich herbs plus Shilajit fulvic chelation; anaemia correction combined protocol',
    ],
    herb_to_herb_caution: [
      'Excessive iron-rich herbs in haemochromatosis-risk individuals — cumulative iron overload; avoid stacking',
    ],
    herb_to_drug_interactions: [
      'Iron supplements — additive iron; monitor iron levels; may need to reduce supplement dose if combining',
      'Diabetes medications — may enhance hypoglycaemic effect (improves insulin sensitivity); monitor blood sugar',
      'Antihypertensives — mild additive BP-lowering (mineral support); monitor BP',
      'Anticoagulants — theoretical mineral interaction; limited evidence; monitor',
    ],
    herb_interactions: [
      'Synergy: CoQ10, Cordyceps, Ashwagandha, Rhodiola, Nettle, Yellow Dock',
      'Caution: iron-rich herbs in haemochromatosis risk (cumulative iron)',
      'Drug interactions: iron supplements (additive — monitor levels), diabetes meds (monitor glucose), antihypertensives (monitor BP), anticoagulants (theoretical — monitor)',
    ],
    dosage_range:
      'Standardised extract (50–60% fulvic acid — ONLY verified source): 200–500 mg daily with meals. Start at 200 mg; titrate up gradually. Take with fat-containing meal for optimal absorption. Safe indefinite daily use when clean-sourced. 3rd-party heavy metal testing documentation required before recommending any specific product.',
    spiritual_layer:
      'Shilajit is "destroyer of weakness" in Sanskrit — primordial earth essence formed over millions of years as ancient plant matter was compressed under geological pressure into a mineral-rich resinous pitch. She is time made substance, patience crystallised into medicine, the accumulated biochemical intelligence of ancient ecosystems preserved in rock crevices at high altitude. She teaches that deep nourishment comes from depth and time, that the most foundational vitality is not obtained quickly but is built slowly, layer by layer, like geological strata. The yogic traditions that used her understood that the mineral foundation of life itself is as important as any herb or practice — that we are, after all, made of earth. She whispers: I am vitality. My cells are energised. My essence is restored. I am ancient and renewed. I contain earth\'s wisdom. I am strong from my foundation. Time and pressure have made me wise.',
    best_preparation:
      'Source quality is the entire conversation — only 3rd-party tested, purified, standardised extracts (50–60% fulvic acid). No exceptions. Heavy metal panel documentation required. Start at 200 mg; titrate to 300–500 mg. Iron overload conditions (haemochromatosis, sickle cell, thalassemia) are absolute blocks. Excellent with CoQ10 for mitochondrial support protocol.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ mitochondrial ATP (emerging RCT evidence; mechanism confirmed). Grade B testosterone in hypogonadal men. SOURCE QUALITY IS THE DEFINING SAFETY ISSUE — heavy metal contamination risk in unverified products is serious. Absolute contraindications: haemochromatosis, sickle cell, thalassemia. Gout caution. Pregnancy avoid. Iron interaction monitoring. Indefinitely safe when clean-sourced.',
  },

  // ─────────────────────────────────────────────
  // SKULLCAP
  // ─────────────────────────────────────────────
  {
    id: 281,
    name: 'Skullcap',
    botanical: 'Scutellaria lateriflora (aerial parts — flowering tops — "Helmet Flower")',
    tcm_meridians: ['Heart', 'Liver', 'Spleen'],
    tcm_element: 'Water + Metal',
    energetics: ['Cool', 'Moist', 'Calming', 'Non-Sedating', 'Grounding', 'Steadying'],
    primary_functions: [
      'Non-sedating anxiolytic — baicalin and baicalein flavonoids allosterically modulate GABA-A receptors WITHOUT binding the benzodiazepine site; anxiety reduces while alertness, cognitive function and presence are fully maintained',
      'Physical tension release — catalpol iridoid glycoside (0.1–0.3%) relaxes skeletal and smooth muscle; tension headaches, jaw clenching (bruxism), neck and shoulder rigidity, physical anxiety holding patterns',
      'Cumulative nervous system baseline reset — daily use 4–8 weeks shifts baseline anxiety downward through HPA axis recalibration; stress threshold raises; chronic anxiety becomes manageable',
      'Neuroprotection — baicalein crosses blood-brain barrier; neuronal antioxidant; TNF-α and IL-6 reduction in brain tissue; potential cognitive ageing prevention',
      'Daytime anxiety management — unique among nervines; maintains full work, driving and parenting function while reducing anxiety',
    ],
    secondary_benefits: [
      'Anxiety-related insomnia — removes anxiety barriers to natural sleep WITHOUT forcing sleep; maintains REM and sleep architecture',
      'Hypervigilance and trauma recovery — cumulative nervous system deconditioning; HPA axis reset; long-term nervous system rehabilitation',
      'Benzodiazepine tapering support — provides gentle GABA support as pharmaceuticals are reduced; non-addictive transition aid',
      'Mood stabilisation — modest dopamine modulation prevents the mood flattening typical of pure GABA agonists; anxiety reduces while mood remains stable or elevated',
    ],
    pharmacology:
      'Primary bioactives: flavonoids — baicalin (0.5–1%; positive allosteric modulation of GABA-A receptors; anxiolytic; NOT benzodiazepine site; no sedation cascade; paradoxical calm-alert) and baicalein (potent hydroxylated derivative; BBB-penetrant; neuroprotective; antioxidant; antispasmodic synergy), catalpol iridoid glycoside (0.1–0.3%; smooth muscle relaxation via calcium channel and myosin light chain kinase inhibition; physical tension release), rosmarinic acid (phenolic; anti-inflammatory; neuroprotective), other flavonoids — apigenin, luteolin, scutellarin (antioxidant; anti-inflammatory; GABAergic activity). MECHANISM DISTINCTION: baicalin/baicalein allosteric GABA-A modulation differs fundamentally from benzodiazepines (direct agonist) and barbiturates — provides anxiolysis without sedation cascade. CUMULATIVE TONING EFFECT: not acute remedy; 2–4 weeks for baseline shift; 8–12 weeks for deep HPA axis reset. Grade B+ anxiolytic (human trials emerging; mechanism confirmed); Grade A safety (200+ years; no serious adverse events; minimal screening).',
    flavor_profile: 'Mildly bitter and herbaceous with subtle astringency — pleasant and accessible; more palatable than many bitter nervines',
    contraindications: [
      'Pregnancy — LIMITED MODERN DATA: traditional Eclectic use in later pregnancy; first trimester caution; consult provider; Chamomile or Lemon Balm as alternatives if uncertain',
      'Severe liver disease — THEORETICAL: hepatic metabolism; caution if significantly compromised liver function',
      'Otherwise: Grade A safety — 200+ years documented use; no serious adverse events; suitable for all populations',
    ],
    herb_to_herb_synergy: [
      'Lemon Balm — dual non-sedating nervine; complementary mechanisms; both provide calm-alert state; comprehensive anxiety and mood protocol',
      'Passionflower — nervous system calming (Skullcap) plus emotional processing and relaxation (Passionflower); excellent combined protocol',
      'Motherwort — nervous system calm plus heart courage; anxiety rooted in vulnerability and emotional guardedness',
      'Oatstraw — Skullcap nervous system tonification plus Oatstraw mineral-rich nutritive foundation; comprehensive nervous system rebuilding',
      'Gotu Kola — both support nervous system resilience and HPA axis reset; cumulative stress adaptation',
    ],
    herb_to_herb_caution: [
      'Valerian — opposite energies; Skullcap non-sedating, Valerian sedating; reduce Valerian dose if combining; better as separate protocols',
      'Chamomile at high combined doses — slightly additive calming; usually manageable but monitor',
    ],
    herb_to_drug_interactions: [
      'Benzodiazepines — mild additive calming; may support tapering protocol with prescriber coordination; not contraindicated',
      'No significant drug interactions documented — no CYP450 involvement; no protein binding competition; safe with all medications',
    ],
    herb_interactions: [
      'Synergy: Lemon Balm, Passionflower, Motherwort, Oatstraw, Gotu Kola',
      'Caution: Valerian (reduce dose if combining — opposite energies); Chamomile at high doses (additive — monitor)',
      'Drug interactions: benzodiazepines (mild additive — coordinate tapering with prescriber); otherwise NONE — safe with all medications',
    ],
    dosage_range:
      'Tea (preferred for long-term toning — longer steep extracts more baicalin): 1–2 tsp dried herb steeped 10–15 minutes, 2–3× daily. Morning and afternoon — NOT evening (non-sedating; will not support sleep if sedation is needed). Tincture (fastest onset for acute anxiety): 30–60 drops, 2–3× daily, or as needed during acute anxiety episodes. DAYTIME USE. Safe indefinite long-term daily use — no tolerance, no dependence, no withdrawal.',
    spiritual_layer:
      'Skullcap teaches the paradox of calm presence — that grounding does not require sedation, that safety allows authentic awareness rather than requiring the numbing of awareness. She wears a tiny purple helmet flower, and her teaching is similarly precise: she does not blunt the senses or force surrender; she teaches the nervous system a different rhythm, a different baseline. She whispers: Your vigilance is not protecting you — your presence is. She holds the distinction between vigilance (fear-based hyperalertness) and presence (grounded awareness) with extraordinary clarity. The nervous system is not the enemy; it is an intelligence that has learned a pattern of survival. Skullcap teaches it a new pattern — one where safety and awareness coexist, where the body can relax without losing contact with what matters. I am safe. My nervous system is intelligent. I am present without fear. I am grounded and clear. Calm presence is my natural state.',
    best_preparation:
      'Longer steep tea (10–15 minutes) for maximum baicalin extraction. DAYTIME USE ONLY — the non-sedating quality is the defining clinical value; evening use is appropriate only for anxiety-related insomnia (removes barriers without forcing sleep). No drug screening necessary — safe with all medications. Excellent gateway herb: safe, effective, non-sedating, pleasant; accessible introduction to herbal nervines for anxious individuals who cannot tolerate sedation.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade B+ non-sedating anxiolytic (human trials emerging; GABA mechanism confirmed; long traditional evidence). Grade A safety — 200+ years; no serious adverse events; no drug interactions. The defining daytime non-sedating nervine. Cumulative 4–8 week toning effect. No tolerance or dependence. Improves with consistent long-term use. Safe indefinitely.',
  },
  // ─────────────────────────────────────────────
  // GOLDENROD / SOLIDAGO
  // ─────────────────────────────────────────────
  {
    id: 279,
    name: 'Goldenrod',
    botanical: 'Solidago virgaurea / S. canadensis / S. gigantea (aerial parts — flowering tops and leaves)',
    tcm_meridians: ['Lung', 'Kidney', 'Bladder', 'Spleen'],
    tcm_element: 'Water + Metal',
    energetics: ['Warm to Neutral', 'Drying', 'Aromatic', 'Slightly Bitter', 'Astringent', 'Diuretic', 'Anti-Catarrhal'],
    primary_functions: [
      'Urinary irrigation and diuretic — flavonoids (quercetin, hyperoside, rutin) and glycosides (leiocarposide) increase urine volume via neutral endopeptidase inhibition and natriuretic peptide modulation; pharmacopoeial "irrigation therapy" for lower urinary tract inflammation',
      'Anti-inflammatory and antispasmodic in urinary tract — flavonoids and saponins reduce inflammatory mediators and smooth muscle spasm; clinical improvement in burning, urgency and pain in cystitis and irritable bladder',
      'Antimicrobial adjunct — extracts show antibacterial activity against common urinary pathogens and reduce bacterial adherence; adjunctive, not standalone antibiotic',
      'Upper respiratory anti-catarrhal — astringent tannins and anti-inflammatory volatile oils tone lax mucous membranes; thins and reduces excessive secretions in allergy-driven catarrh (itchy watery eyes, drippy nose, post-nasal drip)',
      'Kidney flushing and post-UTI recovery — promotes clearance of post-infection inflammatory debris and supports mucosal resilience to reduce recurrence risk',
    ],
    secondary_benefits: [
      'Mild immune modulation — saponins and flavonoids contribute immunomodulatory activity supporting recurrent-UTI patterns and low-grade respiratory infections',
      'Mild edema support (normal heart and kidney function only) — diuretic action helps with fluid accumulation when cardiac and renal function is intact',
      'German Commission E and EMA HMPC monograph — traditional use recognised for lower urinary tract irrigation therapy',
      'Seasonal allergy combination herb — pairs with Nettle, Plantain and Eyebright for histamine-driven catarrh',
    ],
    pharmacology:
      'Primary bioactives: flavonoids (rutin, hyperoside, quercetin derivatives — diuretic via neutral endopeptidase inhibition; anti-inflammatory; antispasmodic; antioxidant), phenolic glycosides (leiocarposide, virgaureoside — notable diuretic activity in animal models; anti-inflammatory), saponins (triterpenoid — diuretic; mild expectorant; immunomodulatory), tannins (astringent — mucosal toning; antimicrobial), volatile oils (monoterpenes and sesquiterpenes including germacrene, limonene — antimicrobial; anti-catarrhal; mild spasmolytic). Side effects ≤0.3% in clinical reviews — mainly mild GI upset or allergic reactions. Grade B+ diuretic and urinary anti-inflammatory; Grade B antimicrobial and upper respiratory catarrh; Grade A safety (EMA assessment).',
    flavor_profile: 'Slightly balsamic and resinous-herbal with mild bitterness — aromatic and pleasantly earthy',
    contraindications: [
      'Oedema from heart or kidney failure — ABSOLUTELY CONTRAINDICATED: increased diuresis may mask or worsen serious underlying disease; HARD BLOCK',
      'Asteraceae allergy (ragweed, chamomile, yarrow family) — risk of allergic reactions; caution or avoid',
      'Pregnancy — limited data; generally avoided (especially first trimester); prefer safer urinary herbs',
      'Breastfeeding — insufficient data; use cautiously if at all',
      'Children under 12 — limited data; use only with professional guidance',
      'Kidney disease (non-failure) — use under practitioner guidance; monitor renal function if long-term',
    ],
    herb_to_herb_synergy: [
      'Marshmallow root and Cornsilk — demulcent soothing combined with Goldenrod flushing; comprehensive urinary comfort in cystitis and irritable bladder',
      'Nettle leaf, Plantain and Eyebright — classic allergy anti-catarrhal formula; histamine support plus mucosal toning',
      'Bearberry (Uva-ursi) and Juniper — short-term acute urinary antimicrobial trio; monitor duration',
      'Oatstraw and Cornsilk — long-term urinary terrain support for recurrent UTI patterns',
    ],
    herb_to_herb_caution: [
      'Pharmaceutical diuretics — additive fluid and electrolyte effects; monitor hydration and electrolytes',
      'Hepatotoxic herbs — no specific concern but maintain general caution with polypharmacy',
    ],
    herb_to_drug_interactions: [
      'Pharmaceutical diuretics — additive diuretic effect; monitor electrolytes and fluid balance',
      'Lithium — increased urinary output may theoretically alter lithium excretion; monitor levels',
      'No other significant drug interactions documented from whole herb at standard doses',
    ],
    herb_interactions: [
      'Synergy: Marshmallow, Cornsilk, Nettle, Plantain, Eyebright, Bearberry, Oatstraw',
      'Caution: pharmaceutical diuretics (additive — monitor); lithium (theoretical excretion change)',
      'Drug interactions: diuretics (monitor electrolytes), lithium (monitor levels); otherwise minimal',
    ],
    dosage_range:
      'Tea: 3–5 g dried herb per 150 ml boiling water, steeped 5–10 minutes, 2–4× daily (6–12 g/day total); always with ≥2 L water daily for irrigation benefit. Tincture (1:5 in 45% ethanol): 0.5–1 ml, 2–4× daily. Fluid extract (1:1): 0.5–2 ml, 2–3× daily. Duration: 2–4 week therapeutic courses for urinary or allergy complaints; repeat as needed. Long-term use well tolerated when kidney and heart function are normal.',
    spiritual_layer:
      'Goldenrod is the bright wand of the hedgerow — rising like a sunbeam over meadows and forest edges, she teaches uprightness and flow. When resentment, grief or fear pools and stagnates in the kidneys and mucosa we feel bogged down and leaky. Goldenrod teaches clear, warm release: flushing what no longer serves while toning the boundaries that keep us whole. She is the golden flush of autumn that clears the season, stands tall without rigidity and releases without losing herself. She whispers: I release what is stagnant. My waters flow clear and free. My boundaries are toned, not rigid. I stand upright in my own golden light. I am cleansed, steady and renewed.',
    best_preparation:
      'Tea with generous hydration (always ≥2 L/day) is the classical irrigation protocol — warm, frequent cups throughout the day. For allergy support: combine with Nettle and Eyebright; for UTI: combine with Marshmallow for soothing plus Goldenrod for flushing. CRITICAL: contraindicate in oedema from heart or kidney failure (HARD BLOCK); screen Asteraceae allergy. Emphasise adjunctive role in UTIs — not a replacement for antibiotics when clinically indicated. Always encourage medical evaluation for fever, flank pain, blood in urine or systemic symptoms.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ diuretic and urinary anti-inflammatory. EMA HMPC traditional use monograph for lower urinary tract irrigation. Grade B upper respiratory anti-catarrhal. Grade A safety. HARD BLOCK: oedema from heart or kidney failure. Screen Asteraceae allergy. Adjunctive to medical UTI care — not standalone antibiotic. 2–4 week courses; repeat as needed.',
  },

  // ─────────────────────────────────────────────
  // SPIRULINA
  // ─────────────────────────────────────────────
  {
    id: 280,
    name: 'Spirulina',
    botanical: 'Arthrospira platensis (whole dried organism — "Ancient Blue-Green Life")',
    tcm_meridians: ['Spleen', 'Stomach', 'Liver', 'Kidney'],
    tcm_element: 'Earth + Water',
    energetics: ['Cool', 'Moist', 'Dense', 'Nutritive', 'Tonifying', 'Grounding', 'Detoxifying'],
    primary_functions: [
      'Foundational nutritive tonification — 60–70% complete protein (all 9 essential amino acids; bioavailability comparable to animal proteins); comprehensive mineral matrix (iron 15–25 mg/100g in heme-like forms; calcium, magnesium, zinc, selenium, chromium); B-vitamin complex; GLA omega-6 fatty acid; densest plant-source nutrition available',
      'Immune stimulation and resilience — polysaccharides (rhamnose and arabinose) directly activate macrophages and NK cells (innate immunity); phycocyanin (1–2%) provides additional anti-inflammatory and immune-modulating activity',
      'Heavy-metal binding detoxification (adjunctive) — chlorophyll binds lead, mercury and cadmium; polysaccharides support elimination pathways; NOT a standalone detox — requires comprehensive protocol',
      'Antioxidant and neuroprotective — phycocyanin crosses blood-brain barrier; scavenges free radicals in brain tissue; reduces neuroinflammation; emerging neuroprotective potential (Alzheimer\'s animal models promising)',
      'Anti-inflammatory systemic — GLA plus phycocyanin plus polyphenols reduce TNF-α, IL-6 and other inflammatory cytokines; supports healthy inflammatory response',
    ],
    secondary_benefits: [
      'Complete vegetarian and vegan protein and mineral support — addresses dietary gaps in plant-based diets (protein, iron, B12-analog); blood-building role',
      'Athletic endurance and recovery — complete amino acid profile plus magnesium, iron and copper cofactors support muscle protein synthesis and oxygen-carrying capacity',
      'Metabolic and hormonal support for women — GLA supports cycle health, reduces menstrual pain and supports skin via anti-inflammatory pathway',
      'Post-illness recovery — rebuilds nutritional reserves after acute infection, malnutrition or surgical recovery',
    ],
    pharmacology:
      'Primary bioactives: protein (60–70% dry weight; all amino acids including all essential; high bioavailability), phycocyanin (1–2%; blue pigment; potent antioxidant + anti-inflammatory; crosses BBB; neuroprotective), polysaccharides (immune-stimulating rhamnose + arabinose; activate macrophages and NK cells; heavy metal elimination support), chlorophyll (heavy-metal binding; detoxification pathways), GLA (1–2% gamma-linolenic acid; anti-inflammatory; hormone balance), minerals (iron, calcium, magnesium, zinc, selenium — all bioavailable forms), vitamins (B-complex; some true B12 and pseudo-B12 analogs — bioavailability debated; vitamin E; carotenoids). CRITICAL SAFETY: source quality paramount — heavy metal contamination in poorly cultivated products; ONLY third-party tested sources. ABSOLUTE CONTRAINDICATIONS: PKU (high phenylalanine — life-threatening); autoimmune disease (immune-stimulating — may flare). Grade A nutritive completeness; Grade B+ immune stimulation; Grade B neuroprotection (mechanism sound; animal studies promising; human trials limited); Grade A safety if clean source.',
    flavor_profile: 'Earthy, mineral and slightly oceanic — dense and distinctive; best masked in smoothies with fruit and greens',
    contraindications: [
      'Phenylketonuria (PKU) — ABSOLUTE CONTRAINDICATION: high phenylalanine content; life-threatening if consumed; HARD BLOCK',
      'Autoimmune diseases (lupus, rheumatoid arthritis, MS, etc.) — CAUTION or AVOID: polysaccharides stimulate immunity; may flare autoimmune conditions; consult healthcare provider',
      'Poor-quality or untested source — NEVER use without verified third-party heavy-metal testing (lead, mercury, cadmium, arsenic): contamination documented in poorly sourced products',
      'Iodine sensitivity — modest iodine content; minor concern in rare iodine-sensitive individuals',
      'Otherwise: Grade A safety if clean verified source — ancient organism; no toxicity from clean product',
    ],
    herb_to_herb_synergy: [
      'Chlorella — dual algae detoxification; complementary heavy-metal binding profiles',
      'Ashwagandha — nutritive foundation plus adaptogenic HPA axis support; comprehensive vitality',
      'Nettle and Moringa — expanded mineral and chlorophyll-rich green food medicine matrix',
      'Lion\'s Mane — neuroprotective synergy; spirulina phycocyanin plus Lion\'s Mane NGF stimulation',
    ],
    herb_to_herb_caution: [
      'Other immune-stimulating herbs in autoimmune conditions — cumulative immune activation; use caution',
      'High-dose iron supplementation — additive iron from spirulina; monitor ferritin if already supplementing',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — immune-stimulating activity may counteract; CAUTION; monitor',
      'Anticoagulants — theoretical mild additive effect; monitor if on Warfarin',
      'Diabetes medications — GLA and other compounds may modestly affect glycemic control; monitor blood sugar',
    ],
    herb_interactions: [
      'Synergy: Chlorella, Ashwagandha, Nettle, Moringa, Lion\'s Mane',
      'Caution: immune-stimulating herbs in autoimmune conditions; iron supplementation (monitor ferritin)',
      'Drug interactions: immunosuppressants (monitor), anticoagulants (theoretical — monitor), diabetes meds (monitor glucose)',
    ],
    dosage_range:
      'Powder (most economical and flexible): 3–5 g daily (1–2 tbsp) mixed into smoothie with fruit and greens (masks earthy taste). Higher dose 5–7 g daily for post-illness recovery or intensive athletic protocols. Capsules: 500 mg per capsule — requires 6–10 for therapeutic dose; expensive. Tablets: 3–9 g daily. Safe indefinite daily use (food source). With food recommended (improves absorption; reduces potential nausea).',
    spiritual_layer:
      'Spirulina is ancient life — a photosynthetic organism predating plants and animals by 3.5 billion years; she connects us to primordial earth, ancient wisdom and foundational life force. Used by the Aztecs as a staple food and by astronauts as space sustenance — she sustains in extreme conditions, nourishes without drama, and teaches that simple dense abundance is enough. She carries the memory of the first light falling on ancient waters, the quiet miracle of life feeding life across unimaginable time. She whispers: I am nourished. I am vital. Ancient wisdom sustains me. My cells are fed. I am grounded. I am resilient. Simple abundance provides.',
    best_preparation:
      'Powder in morning smoothie with fruit and greens is the optimal delivery — flavour masked, nutrients maximised, affordable daily. SOURCE QUALITY IS NON-NEGOTIABLE: only purchase third-party tested products with documentation (NSF, USP or independent heavy-metals testing for lead, mercury, cadmium, arsenic). Screen PKU (absolute block) and autoimmune conditions (caution flag) before every recommendation. For vegetarian and vegan clients: position as foundational protein, iron and B-complex support. Always frame detoxification as adjunctive only — requires comprehensive protocol.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A nutritive completeness (protein, minerals, vitamins confirmed). Grade B+ immune stimulation. Grade A safety if clean verified source. ABSOLUTE CONTRAINDICATION: PKU (phenylalanine — HARD BLOCK). CAUTION: autoimmune disease (immune-stimulating). Source quality is the primary safety variable — third-party heavy-metal testing mandatory. Safe indefinite daily use from verified clean source.',
  },

  // ─────────────────────────────────────────────
  // ST. JOHN\'S WORT
  // ─────────────────────────────────────────────
  {
    id: 281,
    name: "St. John's Wort",
    botanical: 'Hypericum perforatum (aerial parts — leaves, stems and flowering tops; harvested at summer solstice — "Captured Sunshine")',
    tcm_meridians: ['Heart', 'Liver', 'Solar Plexus', 'Nervous System'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm', 'Dry', 'Uplifting', 'Clarifying', 'Light-Bringing', 'Protective', 'Boundary-Setting'],
    primary_functions: [
      'SSRI-equivalent antidepressant (mild-moderate depression) — hyperforin inhibits reuptake of serotonin, dopamine and norepinephrine; multiple RCTs and Cochrane meta-analysis confirm efficacy equal to SSRIs (fluoxetine, sertraline, paroxetine) for mild-to-moderate depression with fewer side effects',
      'Seasonal affective disorder — light-absorbing hypericin (red pigment; harvested at peak solar solstice) makes this particularly effective for SAD; synergises powerfully with morning bright-light therapy',
      'Neuropathic pain and nerve repair — hypericin plus flavonoids support nerve regeneration and reduce neuropathic pain; relevant for diabetic neuropathy, post-herpetic neuralgia and chemotherapy-induced neuropathy',
      'Neuroprotection and anti-inflammatory brain support — flavonoids (quercetin, kaempferol, rutin) and phenolic acids cross blood-brain barrier; reduce neuroinflammation (IL-6, TNF-alpha); potential cognitive aging support',
      'CYP3A4 enzyme induction — hyperforin induces CYP3A4, CYP2C9 and CYP1A2; accelerates metabolism of approximately 50% of all medications; PRIMARY drug interaction mechanism (not toxicity)',
    ],
    secondary_benefits: [
      'Advantage over pharmaceutical SSRIs — fewer sexual dysfunction side effects; less emotional blunting; better GI tolerability; lower cost; no weight gain in most users',
      'Mild anxiolytic (secondary) — GABAergic modulation via hyperforin; anxiety associated with depression particularly responsive',
      'Sleep quality improvement (mood-mediated) — sleep improves through mood elevation; not direct sedation',
      'Cochrane meta-analysis (2008) confirmed: effective and equivalent to SSRIs for mild-moderate depression with fewer side effects',
    ],
    pharmacology:
      'Primary bioactives: hyperforin (0.3–4.5% in premium extracts; PRIMARY antidepressant via serotonin, dopamine and norepinephrine reuptake inhibition; ALSO CYP3A4/CYP2C9/CYP1A2 induction — PRIMARY drug interaction liability), hypericin and pseudohypericin (naphthodianthrones; red pigment; photosensitising at high doses; weak MAOI-like contribution; neuroprotective), flavonoids (quercetin, kaempferol, rutin, isoquercitrin — 1–4%; neuroprotective; antioxidant; BBB-penetrating), phenolic acids (chlorogenic, caffeic — anti-inflammatory; neuroprotective), tannins (1–2%; antimicrobial; wound healing). TIMELINE: 4–8 weeks minimum for mood effects (same as pharmaceutical SSRIs). Grade A antidepressant for mild-moderate depression. Grade A drug interaction risk (CYP450 induction — well documented). Grade B SAD support. EXTENSIVE psychiatric screening mandatory before every recommendation.',
    flavor_profile: 'Gently bitter, slightly resinous and mildly astringent — pleasantly herbaceous',
    contraindications: [
      'SSRIs and SNRIs — SEROTONIN SYNDROME RISK (agitation, tachycardia, hyperthermia, confusion, seizures): CONTRAINDICATED or only under strict psychiatric supervision with dose adjustment and monitoring',
      'Oral contraceptive pills — UNINTENDED PREGNANCY RISK: CYP3A4 induction increases contraceptive metabolism → lower hormone levels → breakthrough bleeding; backup contraception mandatory or AVOID',
      'Warfarin and anticoagulants — CLOTTING RISK: enzyme induction reduces warfarin blood levels → decreased INR → thrombosis risk; CONTRAINDICATED without close medical monitoring',
      'Immunosuppressants (cyclosporine, tacrolimus, mycophenolate) — ORGAN REJECTION RISK: reduced drug levels via CYP3A4 induction; ABSOLUTE CONTRAINDICATION in transplant recipients',
      'Bipolar disorder or family history — MANIA RISK: antidepressant mechanism triggers documented manic episodes; HARD BLOCK',
      'MAOIs — SEROTONIN SYNDROME: ABSOLUTELY CONTRAINDICATED',
      'Pregnancy — avoid: potential uterine-stimulating activity; unknown fetal effects',
      'Breastfeeding — avoid: likely passes into breast milk; infant safety unknown',
      'Pre-surgery — inform anesthesiologist: hyperforin enzyme induction affects anesthetic metabolism',
      'Photosensitivity risk — hypericin increases UV sensitivity (especially fair skin); use sunscreen in summer',
    ],
    herb_to_herb_synergy: [
      'Lemon Balm — mood elevation plus calming nervine; complementary non-serotonergic mechanisms',
      'Saffron — dual antidepressant combination (crocin SSRI-like plus hyperforin); monitor combined serotonergic load',
      'Rhodiola — adaptogenic stress resilience combined with mood elevation; monitor overstimulation',
      'Rose and Hawthorn — heart-centred emotional support pairing',
    ],
    herb_to_herb_caution: [
      'Saffron — both serotonergic; monitor combined serotonin load carefully',
      'High-dose 5-HTP or tryptophan — additive serotonin precursor; serotonin syndrome risk',
      'Other CYP450-inducing herbs — compounding drug interaction risks',
    ],
    herb_to_drug_interactions: [
      'SSRIs and SNRIs — SEROTONIN SYNDROME: CONTRAINDICATED',
      'MAOIs — SEROTONIN SYNDROME: ABSOLUTELY CONTRAINDICATED',
      'Oral contraceptives — breakthrough bleeding; UNINTENDED PREGNANCY: backup contraception required',
      'Warfarin and DOACs — reduced anticoagulation; CLOTTING RISK: CONTRAINDICATED without INR monitoring',
      'Immunosuppressants (cyclosporine, tacrolimus) — ORGAN REJECTION: CONTRAINDICATED in transplant recipients',
      'HIV protease inhibitors (indinavir, ritonavir) — reduced antiviral efficacy',
      'Cancer chemotherapy (irinotecan, imatinib) — reduced chemotherapy efficacy',
      'Statins, digoxin, benzodiazepines, opioids, theophylline — reduced drug efficacy via CYP3A4 induction',
    ],
    herb_interactions: [
      'Synergy: Lemon Balm, Saffron (monitor serotonin), Rhodiola (monitor stimulation), Rose, Hawthorn',
      'Caution: Saffron (serotonin load), 5-HTP (serotonin syndrome), CYP450-inducing herbs',
      'Drug interactions: SSRIs/MAOIs (CONTRAINDICATED), contraceptives (pregnancy risk), warfarin (clotting risk), immunosuppressants (organ rejection), HIV meds, chemo, statins, digoxin and many others via CYP3A4',
    ],
    dosage_range:
      'Standardised extract (0.3% hypericin, 2–4% hyperforin — STRONGLY PREFERRED): 300–600 mg daily in 2–3 divided doses. Tincture (fresh peak-bloom herb — highest hyperforin): 30–60 drops, 2–3× daily. Dried herb tea: 2–4 g steeped 10 minutes, 1–2× daily (hyperforin partially lost). Morning or early afternoon dosing (mood-elevating — avoid evening). MINIMUM 4–8 WEEKS before assessing efficacy. Taper over 1–2 weeks on discontinuation. Comprehensive drug interaction screening is MANDATORY before any recommendation.',
    spiritual_layer:
      'St. John\'s Wort is the light-bringer — gathered at summer solstice when solar power peaks; hypericin literally absorbs light. She is captured sunshine, brought into winter darkness for those whose inner light has dimmed. She carries the teaching that joy is not gone but covered by depression\'s grey, that the hero\'s descent into darkness always contains the seed of emergence. Her secondary Metal element demands honesty: know your medications, know your limits, speak truth — her light cannot penetrate deceit. She whispers: The sun still shines within me. Darkness is temporary. My light is not extinguished. I choose to rise. I choose illumination. I am resilient. I am worth the effort of climbing back to light.',
    best_preparation:
      'Standardised 0.3% hypericin extract for consistent antidepressant efficacy. COMPREHENSIVE SCREENING MANDATORY before recommendation: full medication list review against CYP3A4/CYP2C9 interaction database; bipolar disorder or family history (HARD BLOCK); pregnancy/breastfeeding (BLOCK); transplant or immunosuppressant (ABSOLUTE CONTRAINDICATION). Oral contraceptive users must use backup contraception or switch. 4–8 week timeline education is non-negotiable — identical to pharmaceutical SSRIs. Best used in combination with psychotherapy and morning light exposure.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade A antidepressant for mild-moderate depression (Cochrane meta-analysis; SSRI-equivalent; fewer side effects). Grade A drug interaction risk (CYP3A4 induction — 50%+ of medications affected). ABSOLUTE CONTRAINDICATIONS: SSRIs/MAOIs (serotonin syndrome), oral contraceptives (pregnancy risk), warfarin (clotting risk), immunosuppressants/transplant (organ rejection), bipolar disorder (mania). 4–8 week minimum for efficacy. Comprehensive drug screening mandatory every recommendation.',
  },

  // ─────────────────────────────────────────────
  // STAR ANISE
  // ─────────────────────────────────────────────
  {
    id: 282,
    name: 'Star Anise',
    botanical: 'Illicium verum (seed pods — "Eight-Pointed Star of the East")',
    tcm_meridians: ['Stomach', 'Spleen', 'Kidney'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Dry', 'Pungent', 'Sweet', 'Digestive-Warming', 'Carminative', 'Antispasmodic', 'Aromatic'],
    primary_functions: [
      'Carminative and gas relief — anethole (80–90% of essential oil, 5–8% of pod) is the defining carminative compound; one of the most potent natural gas and bloating relievers (alongside Fennel, Ginger and Cardamom); reduces intestinal cramping and fermentation',
      'Digestive fire warming — anethole plus volatile oil matrix stimulates digestive secretions; warms stomach and spleen; increases appetite; supports sluggish cold digestion patterns',
      'Antispasmodic — anethole relaxes intestinal smooth muscle; relieves cramping and spasms; supports comfortable digestion after meals',
      'Antimicrobial digestive support — anethole and polyphenols show broad-spectrum antimicrobial activity against digestive pathogens; traditional food-preservation and post-meal infection-protection role',
      'Respiratory expectorant support — anethole is a mild expectorant; loosens and moves respiratory congestion; traditional use in coughs and bronchial congestion',
    ],
    secondary_benefits: [
      'Traditional lactation support — traditional Southeast Asian and Ayurvedic galactagogue; may support milk production (limited RCT evidence; centuries empirical use)',
      'Antioxidant and anti-inflammatory — polyphenols provide systemic free-radical scavenging and cytokine reduction',
      'Culinary therapeutic integration — easy daily use in soups, curries, broths, teas and desserts; licorice-like flavour highly palatable; excellent compliance',
      'Safe in all populations at culinary doses — millennia of food use with no documented toxicity',
    ],
    pharmacology:
      'Primary bioactives: essential oil (5–8% in whole pod; anethole 80–90% — PRIMARY carminative, antispasmodic, digestive-warming, mild antimicrobial, expectorant; responsible for distinctive licorice aroma and therapeutic benefit), polyphenols (antioxidant; anti-inflammatory; antiviral), volatile aromatic compounds (aromatic pleasure compounds; digestive stimulation). Minor phytoestrogenic properties (theoretical at very high doses; culinary amounts generally safe). Grade B digestive warming and carminative; Grade B antispasmodic; Grade C+ antimicrobial and respiratory; Grade A safety (food spice — centuries culinary use).',
    flavor_profile: 'Sweet, warm and intensely licorice-like — one of the most distinctive and pleasurable spice aromas; highly palatable',
    contraindications: [
      'Pregnancy — LIKELY SAFE at culinary doses (traditional use extensive including for lactation); verify with prenatal provider for early pregnancy; avoid large medicinal doses first trimester',
      'Breastfeeding — LIKELY SAFE and traditionally recommended; traditional galactagogue; consult provider',
      'Hormone-sensitive conditions (oestrogen-receptor-positive breast cancer history) — MONITOR: minor phytoestrogenic theoretical concern; culinary doses generally safe; consult oncologist for concentrated forms',
      'Otherwise: Grade A safety — food-spice form; centuries of use; no documented toxicity from culinary amounts',
    ],
    herb_to_herb_synergy: [
      'Ginger and Cinnamon — classic warming digestive trio; triple carminative and digestive-fire support; excellent palatability',
      'Fennel and Cardamom — comprehensive carminative and antispasmodic combination for gas, bloating and cramping',
      'Licorice root — sweet complementary flavour and anti-inflammatory plus demulcent; digestive synergy',
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic herbs in hormone-sensitive conditions — theoretical cumulative estrogenic effect; consult',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented at culinary or standard medicinal doses',
      'Hormone therapies — theoretical very mild additive phytoestrogenic effect; generally negligible at culinary doses',
    ],
    herb_interactions: [
      'Synergy: Ginger, Cinnamon, Fennel, Cardamom, Licorice root',
      'Caution: phytoestrogenic herbs in hormone-sensitive conditions (theoretical)',
      'Drug interactions: None significant at culinary doses',
    ],
    dosage_range:
      'Culinary (EASIEST AND SAFEST): 1–3 whole star pods daily in soups, broths, teas and curries — indefinitely safe. Infusion/tea: 1–3 whole pods steeped 5–10 minutes, 1–2× daily (pleasant licorice tea). Decoction: 1–2 pods simmered 10–15 minutes for stronger extraction. Powder: 0.25–0.5 g, 1–2× daily in food, tea or honey. After meals optimal (digestive support). Safe indefinite long-term use.',
    spiritual_layer:
      'Star Anise is the eight-pointed star of the East — her shape alone is sacred geometry, the spice that looks like a gift from the cosmos. She carries Southeast Asian wisdom about the pleasure of warmth: that the belly at ease, the digestion comfortable, the appetite alive are not trivial things but foundations of wellbeing. She teaches that good digestion is the root of everything — that we are only as nourished as what we can receive, absorb and transform. Her sweet warmth says: welcome this. Let it in. You are allowed to enjoy what nourishes you. She whispers: My digestion is strong. I am warm. I am comfortable. My appetite is healthy. My belly is at ease. I am nourished. I am whole.',
    best_preparation:
      'Culinary integration is the most sustainable path — a star pod or two in daily cooking gives consistent mild benefit with zero burden. For acute gas and bloating: tea from 2–3 pods steeped 5–10 minutes after meals. Pair with Ginger and Cinnamon for the classic warming digestive trio. Lactation support: 1–2 pods in infusion 2–3× daily for nursing mothers. Minimal screening required — one of the safest herbs in the library.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade B carminative and digestive warming (anethole mechanism confirmed). Grade B antispasmodic. Grade A safety (food-spice form; centuries culinary use; no documented toxicity). Minimal contraindications. Culinary integration is primary recommendation. Excellent compliance due to pleasant licorice flavour.',
  },

  // ─────────────────────────────────────────────
  // THYME
  // ─────────────────────────────────────────────
  {
    id: 283,
    name: 'Thyme',
    botanical: 'Thymus vulgaris (leaves and flowering tops — "Thymos: Courage")',
    tcm_meridians: ['Lung', 'Spleen', 'Liver', 'Throat/Voice'],
    tcm_element: 'Metal + Fire',
    energetics: ['Warm', 'Dry', 'Pungent', 'Stimulating', 'Antimicrobial', 'Clearing', 'Tonifying', 'Expectorant'],
    primary_functions: [
      'Expectorant (primary respiratory action) — thymol and carvacrol volatile oils mildly irritate respiratory mucosa triggering a reflex increase in mucus production and cilia activation; mobilises and clears respiratory congestion; makes productive coughing more efficient',
      'Antispasmodic bronchial relaxant — thymol, carvacrol and linalool relax bronchial smooth muscle; eases bronchospasm and spasmodic exhausting cough; improves airway patency',
      'Potent antimicrobial — thymol is one of the strongest herbal bactericidal and virucidal compounds documented; effective against E. coli, S. aureus, H. influenzae, Streptococcus species and respiratory viruses via cell membrane disruption and enzyme inhibition',
      'Anti-inflammatory and tissue-healing — flavonoids (apigenin, luteolin 1–2%) reduce TNF-α, IL-6, IL-8; support airway tissue repair after infection; prevent lingering post-infection inflammation',
      'Respiratory tonification (long-term) — consistent use builds baseline respiratory resilience; reduces chronic inflammation; strengthens breathing capacity cumulatively over months',
    ],
    secondary_benefits: [
      'Digestive carminative (secondary) — volatile oils reduce gas, bloating and GI spasm; mild bitter digestive stimulation',
      'Immune stimulation during acute infection — volatile oils plus flavonoids enhance white blood cell function and cytokine response',
      'Safe for all ages including children — excellent as honey-thyme preparation for children\'s cough; no side effects; pleasant warming taste',
      '2000+ years Mediterranean culinary and medicinal use; used in WWI and WWII military medical supplies for thymol antiseptic properties',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (35–54% of dry herb; thymol 40–50% — PRIMARY antimicrobial and expectorant; bactericidal/virucidal via membrane disruption; stimulates mucociliary clearance; antispasmodic; antioxidant; carvacrol — secondary antimicrobial + antispasmodic; smooth muscle relaxation; linalool — mild anxiolytic contribution), flavonoids (apigenin, luteolin — 1–2%; anti-inflammatory; antioxidant), tannins (trace; astringent; antimicrobial). PREPARATION CRITICAL: tea superior to tincture for expectorant action (saponins water-soluble). DOSING CRITICAL: 3–4× daily for acute respiratory (mobilises congestion); 1–2× daily for chronic tonification. Grade A safety; Grade B+ expectorant and antimicrobial; Grade B antispasmodic and anti-inflammatory; Grade C+ respiratory tonification.',
    flavor_profile: 'Warm, peppery and highly aromatic with characteristic Mediterranean volatile pungency — pleasantly stimulating and medicinal',
    contraindications: [
      'Pregnancy (concentrated forms only) — essential oil and high-dose concentrated extracts have emmenagogue potential; CULINARY amounts in food are entirely safe; tinctures and concentrated extracts: use caution or avoid; consult provider',
      'Lamiaceae family allergy (very rare) — mild skin sensitivity possible; discontinue if reaction',
      'Essential oil undiluted internally — NEVER: concentrated volatile oils cause GI irritation and toxicity; whole herb tea and culinary use are safe at all doses',
      'Otherwise: Grade A safety — suitable for all populations including children and elderly; one of the safest respiratory herbs in the library',
    ],
    herb_to_herb_synergy: [
      'Mullein leaf — expectorant plus demulcent pairing; Thyme mobilises while Mullein soothes; comprehensive respiratory support',
      'Licorice root — demulcent plus anti-inflammatory; soothing and healing respiratory tissue alongside Thyme\'s mobilising action',
      'Ginger — warming plus dual antimicrobial; triple respiratory combination (expectorant + warming + antibacterial/antiviral)',
      'Garlic and Oregano — the antimicrobial respiratory trio; strongest herbal infection-fighting combination',
      'Elecampane and Horehound — deep respiratory tonification and expectorant amplification for chronic patterns',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns — Thyme is compatible with all herbs and tends to enhance rather than conflict',
    ],
    herb_to_drug_interactions: [
      'No known drug interactions — completely safe with all medications including respiratory pharmaceuticals (bronchodilators, antihistamines, antibiotics, inhalers)',
      'No CYP450 involvement; no protein binding competition; no absorption interference documented',
    ],
    herb_interactions: [
      'Synergy: Mullein, Licorice root, Ginger, Garlic, Oregano, Elecampane, Horehound, Plantain',
      'Caution: None',
      'Drug interactions: None known; safe with all medications',
    ],
    dosage_range:
      'Tea (SUPERIOR to tincture for expectorant action — saponins water-soluble): 1–2 tsp dried herb steeped 10 minutes (not shorter — need full extraction), 3–4× daily for acute respiratory; 1–2× daily for chronic/maintenance. WARM preparation optimal (volatile oil effects enhanced by heat). Tincture: 30–60 drops, 2–3× daily (adequate but less potent for expectorant). Culinary: abundant use in cooking 3–7× weekly (ongoing mild baseline support). Honey-thyme preparation: steep 1–2 tsp in warm honey 2–4 weeks; 1 tsp as needed for cough. Safe indefinite long-term use.',
    spiritual_layer:
      'Thyme carries the ancient Greek name thymos — courage, soul, will. Medieval knights wore thyme on their armour; it was burned as protective and purifying incense. She is the voice-opener, the truth-facilitator, the herb of courageous expression. Metal element in TCM governs voice, clarity and boundaries — Thyme teaches both physical respiratory clarity (opening airways) and metaphorical clarity (finding and speaking voice, truth, authentic expression). The sore throat that accompanies unexpressed words, the held breath of unspoken feeling — Thyme clears both. She whispers: My voice is clear. My breath is free. I speak truth. My throat opens. My lungs expand. I am brave. I am heard. My voice matters.',
    best_preparation:
      'Tea is the first recommendation (not tincture) for respiratory use — 10-minute steep, warm, 3–4× daily in acute phases. Honey preparation is ideal for children and for palatability. Pair with Mullein for dry irritating cough (Thyme mobilises, Mullein soothes). Screen only for concentrated-form pregnancy caution and Lamiaceae allergy (both very rare). Safe for everyone including children and elderly. No drug interaction screening required.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A safety (universally safe; suitable all ages including children). Grade B+ expectorant and antimicrobial. Grade B antispasmodic and anti-inflammatory. Tea preparation superior to tincture for expectorant action (non-negotiable preparation guidance). 3–4× daily for acute respiratory. Minimal contraindications. No drug interactions. One of the most clinically accessible and broadly applicable respiratory herbs.',
  },

  // ─────────────────────────────────────────────
  // TONGKAT ALI
  // ─────────────────────────────────────────────
  {
    id: 284,
    name: 'Tongkat Ali',
    botanical: 'Eurycoma longifolia (root — "Malaysian Ginseng"; standardised to eurycomanone 10–30%)',
    tcm_meridians: ['Kidney Yang', 'Spleen', 'Heart'],
    tcm_element: 'Fire + Water',
    energetics: ['Warm', 'Dry', 'Stimulating', 'Tonifying', 'Yang-Activating', 'Masculine Vitality'],
    primary_functions: [
      'Endogenous testosterone support — eurycomanone stimulates pituitary LH (luteinizing hormone) release; LH signals Leydig cells to increase testosterone synthesis; may also inhibit aromatase (testosterone to estrogen conversion); documented 15–25% testosterone increase in 40+ human RCTs over 10–12 weeks',
      'Sexual function enhancement — testosterone increase plus possible direct quassinoid smooth-muscle relaxation (penile arterial vasodilation); improves erectile quality, libido and sexual satisfaction; multiple RCTs confirm',
      'Sperm quality and male fertility support — testosterone is critical for spermatogenesis; studies show improvement in sperm count, motility and morphology (conception enhancement)',
      'Athletic performance and body composition — testosterone drives muscle protein synthesis, bone mineralisation and red blood cell production; documented strength, muscle mass, endurance and recovery improvement',
      'Adaptogenic stress resilience — HPA axis modulation reduces stress-induced cortisol elevation; beta-carboline alkaloids contribute dopaminergic mood elevation, motivation and confidence',
    ],
    secondary_benefits: [
      'Energy and fatigue reduction — testosterone plus adaptogenic effects reduce baseline fatigue; sustained energy improvement',
      'Mood elevation and confidence — dopaminergic beta-carboline alkaloids plus testosterone effects; motivation, pleasure and confidence increase',
      'Polysaccharide immune modulation (secondary) — modest innate immune support',
      'KEY DISTINCTION: stimulates body\'s OWN testosterone production (endogenous) — NOT pharmaceutical hormone replacement; physiologic, body-respecting approach',
    ],
    pharmacology:
      'Primary bioactives: eurycomanone and related quassinoids (0.3–0.6% dried root; 10–30% standardised extract; PRIMARY — stimulates LH → Leydig cell testosterone synthesis; may inhibit aromatase; anti-inflammatory; documented 15–25% testosterone increase), beta-carboline alkaloids (dopaminergic — mood elevation, libido, motivation), polysaccharides (modest immune modulation). CYCLING PROTOCOL MANDATORY: 8–12 weeks on, 4–6 weeks off (hormonal cycling more physiologic; reduces tolerance). STANDARDISED EXTRACT ESSENTIAL: eurycomanone-standardised (10–30%) most reliable clinical form. Grade A testosterone increase (40+ RCTs); Grade A sexual function (mechanism confirmed; multiple RCTs); Grade B+ sperm quality; Grade B+ athletic performance. ABSOLUTE CONTRAINDICATIONS: prostate cancer; hormone-sensitive cancers.',
    flavor_profile: 'Intensely bitter and slightly astringent — characteristic of quassinoids; typically taken in capsule form',
    contraindications: [
      'Prostate cancer — ABSOLUTELY CONTRAINDICATED: testosterone promotion may accelerate cancer growth or recurrence; HARD BLOCK',
      'Hormone-sensitive cancers (male breast cancer, others) — ABSOLUTELY CONTRAINDICATED: testosterone effects; HARD BLOCK',
      'Prostate concerns (PSA elevation, BPH history) — MAJOR CAUTION: testosterone can promote prostate growth; PSA monitoring mandatory if use continues',
      'Uncontrolled high blood pressure — CONTRAINDICATED: may elevate BP; requires controlled BP before use',
      'Heart disease — CAUTION: testosterone cardiovascular effects; consult cardiologist',
    ],
    herb_to_herb_synergy: [
      'Shilajit — mineral tonification plus testosterone support; comprehensive male vitality stack',
      'Pine Pollen — phytoandrogenic nutritive plus Tongkat Ali LH stimulation; complementary testosterone support',
      'Tribulus Terrestris — libido and sexual desire plus testosterone; complementary sexual enhancement mechanisms',
      'Cordyceps — endurance plus testosterone; athletic performance amplification',
    ],
    herb_to_herb_caution: [
      'Other testosterone-stimulating herbs (Fadogia Agrestis, high-dose Ashwagandha) — CAUTION: cumulative testosterone increase; prostate and cardiovascular considerations; avoid excessive stacking',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — testosterone affects glucose metabolism; may potentiate → hypoglycaemia risk; MONITOR blood sugar',
      'Antihypertensives — may elevate BP and counteract medications; MONITOR BP',
      'Anticoagulants — theoretical mild quassinoid anticoagulant activity; MONITOR INR',
      'Immunosuppressants — theoretical counteraction; MONITOR',
    ],
    herb_interactions: [
      'Synergy: Shilajit, Pine Pollen, Tribulus Terrestris, Cordyceps',
      'Caution: other testosterone-stimulating herbs (cumulative androgenic effects; prostate/cardiovascular risk)',
      'Drug interactions: diabetes meds (hypoglycaemia risk — monitor glucose), antihypertensives (monitor BP), anticoagulants (monitor INR)',
    ],
    dosage_range:
      'Standardised extract (eurycomanone 10–30% — ESSENTIAL; most reliable clinical form): 200–400 mg daily with meals or fat source (optimal absorption). Root powder: 3–9 g daily (less reliable due to variable eurycomanone content). Tincture (1:5 alcohol): 30–60 drops, 2–3× daily. CYCLING PROTOCOL MANDATORY: 8–12 weeks on, 4–6 weeks off; repeat. Sexual function and testosterone begin improving at 4–8 weeks; peak effect at 8–12 weeks. MANDATORY screening: prostate cancer (HARD BLOCK), hormone-sensitive cancers (HARD BLOCK), PSA/prostate history, BP, heart disease, diabetes medications.',
    spiritual_layer:
      'Tongkat Ali is rooted masculine vitality — not the aggression of testosterone weaponised, but the grounded, enduring strength of a man aligned with his body\'s own intelligence. She is the Malaysian ginseng that has nourished warriors and farmers in the rainforest for centuries, teaching that real vitality is earned through rootedness, that sexual confidence is an expression of embodied health, that honoring the body\'s natural testosterone rhythms is wisdom not forcing. She teaches that true masculine strength is patience, groundedness and pleasure in embodiment. She whispers: My body is strong. My vitality is natural. My sexual function is healthy. My confidence is grounded. My pleasure is sacred. I honor my masculine energy. My strength serves life.',
    best_preparation:
      'Standardised eurycomanone extract (10–30%) is non-negotiable for reliable results — root powder is too variable. MANDATORY PRE-SCREENING: prostate cancer and hormone-sensitive cancers (HARD BLOCK — ask before anything else); prostate concerns (PSA monitoring); BP monitoring; heart disease (cardiologist referral); diabetes medications (blood sugar monitoring). Cycling protocol (8–12 weeks on, 4–6 weeks off) must be educated from the first recommendation. Position explicitly as endogenous testosterone support — NOT pharmaceutical hormone replacement.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade A testosterone increase (40+ RCTs; 15–25% documented; mechanism confirmed). Grade A sexual function (multiple RCTs). Grade B+ sperm quality and athletic performance. ABSOLUTE CONTRAINDICATIONS: prostate cancer (HARD BLOCK); hormone-sensitive cancers (HARD BLOCK). Standardised extract (eurycomanone 10–30%) essential. Cycling protocol (8–12 on/4–6 off) mandatory. Cancer screening non-negotiable before every recommendation.',
  },

  // ─────────────────────────────────────────────
  // TREMELLA
  // ─────────────────────────────────────────────
  {
    id: 285,
    name: 'Tremella',
    botanical: 'Tremella fuciformis (fruiting body — "Snow Fungus / White Wood Ear")',
    tcm_meridians: ['Lung', 'Stomach', 'Spleen', 'Kidney'],
    tcm_element: 'Water + Metal',
    energetics: ['Neutral to Cool', 'Sweet', 'Moistening', 'Yin-Nourishing', 'Jing-Restorative', 'Gently Qi-Supporting'],
    primary_functions: [
      'Deep yin and fluid nourishment — polysaccharides (TFP: high-molecular-weight glucuronoxylomannans) attract and retain water in tissues; moistens Lung and Stomach yin; soothes dry cough, dry throat and dry mucosa; comparable to or exceeding hyaluronic acid for tissue hydration',
      'Skin hydration and anti-ageing — TF polysaccharides form hydrating film on skin; bind large amounts of water; improve moisture, texture and elasticity; protect skin fibroblasts from oxidative stress; clinically used in cosmetics and nutraceuticals',
      'Immunomodulation and leukopenia support — TF polysaccharides developed into enteric-coated capsules approved in China as biological response modifiers for leukopenia from chemotherapy and radiotherapy; enhance NK cells, macrophages and T/B cells',
      'Neuroprotection and cognitive support — neurotrophic effects (promote neurite outgrowth) and neuroprotection in cell and animal studies; double-blind RCT (600–1200 mg/day, 8 weeks) improved short-term memory and executive function in subjective cognitive impairment',
      'Metabolic and cardiometabolic support — TFPS reduce blood glucose, improve insulin sensitivity and lower lipids in preclinical and clinical studies; anti-inflammatory actions ameliorate atopic dermatitis models via immune and gut microbiota modulation',
    ],
    secondary_benefits: [
      'Post-illness yin depletion recovery — rebuilds fluids and essence after fever, overwork or significant fluid loss',
      'Radioprotective and haematopoietic support — increases survival in irradiated animals; protects bone marrow; used clinically for leukopenia in cancer patients under oncology supervision',
      'Longevity and anti-ageing stack component — pairs with Reishi, Astragalus and Schisandra for comprehensive long-term tonic',
      'Imperial Chinese beauty mushroom — centuries use specifically for women\'s radiance, skin and longevity; revered in TCM as skin-nourishing food',
    ],
    pharmacology:
      'Primary bioactives: TF polysaccharides (glucuronoxylomannans — HIGH-MOLECULAR-WEIGHT; immunomodulatory via NK cell, macrophage, T/B cell activation; antioxidant; anti-ageing; neuroprotective with neurotrophic effects; hypoglycaemic; hypolipidaemic; skin-hydrating film-forming; anti-inflammatory; gut microbiota modulation in atopic dermatitis models). Minor components: mannose, fucose, xylose; trace proteins, minerals, vitamins; beta-glucan-like structures. Clinically approved polysaccharide capsules (CFDA, China) for leukopenia adjunct therapy. Grade A-minus immune and leukopenia support (clinical drug use); Grade B+ neuroprotection (RCT plus preclinical); Grade B+ skin hydration; Grade B metabolic support; Grade A safety (long culinary history; low toxicity).',
    flavor_profile: 'Neutral to mildly mushroom-sweet — subtle and pleasant; easily incorporated into soups, desserts and smoothies',
    contraindications: [
      'Pregnancy and breastfeeding — CAUTION: insufficient human data on high-dose supplements; food-level culinary use (dried tremella in soup) generally considered safe; avoid concentrated supplements unless under provider guidance',
      'Autoimmune diseases or immunosuppressive therapy — CAUTION: immunomodulatory activity; use only under practitioner oversight; most data suggest modulation rather than overstimulation',
      'Anticoagulant use or bleeding disorders — MONITOR: theoretical mild anticoagulant and platelet-modulating activity; limited robust clinical data but caution warranted',
      'Active cancer therapy — route to oncology team approval: potentially beneficial but must be supervised by oncologist',
      'Otherwise: very safe; long culinary history with no significant toxicity in healthy adults',
    ],
    herb_to_herb_synergy: [
      'Lily bulb, Ophiopogon and Pear — classical TCM lung-yin moistening decoction; Tremella soup base',
      'Lion\'s Mane — dual neuroprotective mushroom combination; Tremella TFP plus Lion\'s Mane NGF stimulation',
      'Reishi, Maitake and Cordyceps — comprehensive medicinal mushroom longevity stack; Tremella provides distinctive moistening/yin counterbalance to more stimulating fungi',
      'Gotu Kola and Schisandra — skin and collagen beauty formula; antioxidant synergy',
    ],
    herb_to_herb_caution: [
      'Other immunomodulatory mushrooms in autoimmune conditions — cumulative immune modulation; use under practitioner guidance',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — immunomodulatory activity may theoretically interact; monitor under practitioner oversight',
      'Anticoagulants and antiplatelets — theoretical mild anticoagulant activity; monitor if on Warfarin or DOACs',
      'Hypoglycaemic medications — blood glucose lowering activity; may enhance effect; monitor glucose levels',
    ],
    herb_interactions: [
      'Synergy: Lily bulb, Ophiopogon, Lion\'s Mane, Reishi, Maitake, Cordyceps, Gotu Kola, Schisandra',
      'Caution: immunomodulatory mushrooms in autoimmune conditions (practitioner guidance)',
      'Drug interactions: immunosuppressants (monitor), anticoagulants (theoretical — monitor), hypoglycaemics (monitor glucose)',
    ],
    dosage_range:
      'Culinary (traditional): 3–10 g dried fruiting body rehydrated and simmered 30–90 minutes in soup or sweet dessert broth with goji berries, jujube and rock sugar; daily or several times per week. Standardised polysaccharide extract: 1–3 g/day general health; 3–6 g/day for intensive immune or oncology-adjacent support (under professional guidance); 600–1200 mg/day as used in cognitive trial. Capsules: 500–1000 mg per capsule, 1–3× daily. Safe long-term daily tonic use. Higher-dose concentrated extracts: 8–12+ week defined courses.',
    spiritual_layer:
      'Tremella is a luminous yin cloud — a teacher of deep hydration, softness and resilient beauty. She grows as a gelatinous white jewel on wood, converting hardness into translucent nourishment. She carries the message that softness is strength, that deep replenishment is not weakness but the source of sustained radiance. The imperial Chinese court prized her specifically because outer beauty is an expression of inner moisture, inner nourishment, inner reserves that have been tended. She teaches: longevity and beauty are born not from striving but from sustained, deep, quiet care. She whispers: I am nourished from within. My inner waters are full and clear. I soften, replenish and glow with quiet strength.',
    best_preparation:
      'Traditional soup preparation (dried tremella rehydrated, simmered with goji, jujube and pear) for beauty and lung-yin support. Polysaccharide extract powder in smoothies or warm beverages for cognitive and immune protocols. Topical tremella in serum or cream for skin alongside internal use. Screen for autoimmune conditions (immunomodulator — practitioner oversight) and anticoagulant use (monitor). Food-level culinary use has excellent safety across all populations.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A-minus immune and leukopenia support (CFDA-approved clinical drug in China). Grade B+ neuroprotection (RCT confirmed) and skin hydration. Grade B metabolic support. Grade A safety for culinary use. CAUTION: autoimmune disease (immunomodulator — practitioner oversight); pregnancy/breastfeeding (insufficient high-dose data); anticoagulant use (theoretical — monitor). Excellent long-term tonic food mushroom.',
  },

  // ─────────────────────────────────────────────
  // TURMERIC
  // ─────────────────────────────────────────────
  {
    id: 286,
    name: 'Turmeric',
    botanical: 'Curcuma longa (rhizome — "Golden Root")',
    tcm_meridians: ['Liver', 'Spleen', 'Heart'],
    tcm_element: 'Fire + Wood',
    energetics: ['Warm', 'Bitter', 'Pungent', 'Drying', 'Moving', 'Anti-Inflammatory', 'Blood-Invigorating', 'Stagnation-Clearing'],
    primary_functions: [
      'Potent multi-pathway anti-inflammatory — curcumin inhibits NF-κB transcription factor (master switch for 100+ inflammatory genes); suppresses TNF-α, IL-1β, IL-6, COX-2 and inducible nitric oxide synthase; multiple RCTs confirm efficacy in osteoarthritis comparable to ibuprofen with better tolerability',
      'Antioxidant and cytoprotective — direct free-radical scavenging plus upregulation of endogenous antioxidant enzymes (superoxide dismutase, catalase, glutathione); activates Nrf2 antioxidant master pathway',
      'Hepatoprotective and choleretic — enhances bile secretion and flow; supports phase II hepatic detoxification pathways; protects hepatocytes from toxin-induced damage in models; digestive fat-metabolism support',
      'Metabolic and cardiovascular support — improves insulin sensitivity, modulates adipokines; improves endothelial function; reduces LDL oxidation; favourable shifts in metabolic syndrome markers in RCTs',
      'BIOAVAILABILITY CRITICAL — curcumin has inherently low oral absorption; ALWAYS require piperine (black pepper) and dietary fat to enhance absorption 20-fold; without these, therapeutic doses are wasted',
    ],
    secondary_benefits: [
      'TCM blood-moving and stagnation-clearing — breaks up stasis (inflammation, congestion, emotional stagnation) and restores flow at physical, digestive and emotional levels',
      'Liver qi movement and emotional processing — bitter principles stimulate bile; Liver organ in TCM governs both physical detoxification and the smooth flow of qi and emotion',
      'Daily culinary integration is the most sustainable protocol — Golden Milk, curries, soups and spice blends provide continuous mild anti-inflammatory and antioxidant benefit',
      '5000+ years Ayurvedic and Asian use — blood purification, liver support, wound healing, sacred ceremonial use',
    ],
    pharmacology:
      'Primary bioactives: curcuminoids (2–5% of rhizome; curcumin, demethoxycurcumin, bisdemethoxycurcumin — potent NF-κB inhibition; COX-2 and LOX inhibition; Nrf2 activation; antioxidant; hepatoprotective; anti-inflammatory; standard extracts 95% curcuminoids), volatile oils (turmerone, atlantone, zingiberene — anti-inflammatory; choleretic; CNS-modulating), polysaccharides (mucosal and immune support). BIOAVAILABILITY: piperine increases absorption 20-fold; phospholipid complexes (phytosome) further enhance. Grade A anti-inflammatory for osteoarthritis (multiple RCTs); Grade A antioxidant; Grade B+ hepatoprotective; Grade B+ metabolic support; Grade A culinary safety.',
    flavor_profile: 'Warm, earthy, slightly bitter and subtly peppery — characteristic golden colour and distinctive golden-milk warmth',
    contraindications: [
      'Biliary obstruction or severe gallstones — CAUTION or AVOID: choleretic action may exacerbate bile flow in obstruction; use only under medical supervision',
      'Active peptic ulcer — high concentrated doses may irritate in some individuals',
      'Anticoagulants (Warfarin, DOACs, aspirin) — MONITOR: potential additive anticoagulant effect at higher doses; generally manageable at culinary levels; monitor INR if on Warfarin',
      'Pre-surgery — discontinue high-dose curcumin extracts 2 weeks before: theoretical additive bleeding risk',
      'Pregnancy — culinary amounts broadly safe; avoid high-dose curcumin extracts without clinician oversight',
      'Known allergy to Curcuma or Zingiberaceae family (rare)',
      'Otherwise: Grade A safety at culinary doses; centuries of food use with no documented toxicity',
    ],
    herb_to_herb_synergy: [
      'Black Pepper (piperine) — ESSENTIAL bioavailability partner: 20-fold absorption increase; always combine',
      'Ginger — warming plus dual NF-κB inhibition; digestive and anti-inflammatory amplification; natural flavour pairing',
      'Boswellia — complementary joint inflammation mechanisms; LOX plus COX inhibition; potent arthritis combination',
      'Milk Thistle and Dandelion root — expanded liver detoxification protocol; hepatoprotective synergy',
      'Oregano — dual potent NF-κB inhibitor combination; synergistic systemic anti-inflammatory',
    ],
    herb_to_herb_caution: [
      'Anticoagulant herbs (Garlic, Ginkgo, Willow Bark) with Warfarin — additive antiplatelet; monitor INR',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets (Warfarin, DOACs, aspirin) — additive anticoagulant at high doses; MONITOR INR',
      'Antidiabetic medications — may improve glycaemic control; MONITOR glucose; may need dose adjustment',
      'No significant CYP450 interactions at culinary doses',
    ],
    herb_interactions: [
      'Synergy: Black Pepper (ESSENTIAL), Ginger, Boswellia, Milk Thistle, Dandelion, Oregano',
      'Caution: anticoagulant herbs with Warfarin (additive — monitor INR)',
      'Drug interactions: anticoagulants/antiplatelets (additive at high doses — monitor), antidiabetics (monitor glucose)',
    ],
    dosage_range:
      'Culinary (most sustainable): 1–3 g powdered rhizome daily in cooking with fat and black pepper — indefinitely. Standardised curcumin extract (95% curcuminoids): 500–1500 mg/day in divided doses, with piperine and fat-containing meals. Golden Milk: 0.5–1 tsp turmeric with black pepper pinch, warming spices, simmered in milk or plant milk with ghee or coconut oil — 1 cup daily. Tincture or fluid extract: 2–5 ml, 2–3× daily with food. Bioavailability note: piperine (black pepper) and fat are NON-NEGOTIABLE — without them, curcumin absorption is <1%.',
    spiritual_layer:
      'Turmeric is golden flow — the colour of the sun, of autumn fields, of sacred marks drawn on skin for millennia in India. She teaches that stagnation is not permanent, that inflammation is a signal of overload that can be redirected into purposeful circulation. In Ayurveda she is the herb of purification and blessing — she clears what has accumulated, invites what has hardened to soften, and turns murky inflammatory reactivity into clear, directed energy. She teaches the emotional equivalent: that bitterness dissolves when it is allowed to flow, that the liver meridian governs both physical detoxification and the smooth movement of feeling through life. She whispers: My inner fire serves healing. Stagnation melts. I move with clarity and purpose.',
    best_preparation:
      'ALWAYS combine with black pepper and a fat source — this is the most important practical instruction. Golden Milk is the ideal daily ritual: warm, enjoyable, consistent, with excellent bioavailability. For clinical anti-inflammatory (arthritis): standardised 95% curcumin extract 500–1000 mg twice daily with piperine and meal. Screen for gallstones/biliary obstruction (choleretic caution), anticoagulants (monitor INR) and surgery (discontinue 2 weeks pre-op). The bioavailability message is so critical it should always be the first practical instruction given.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A anti-inflammatory for osteoarthritis (multiple RCTs; NF-κB inhibition confirmed). Grade A antioxidant. Grade B+ hepatoprotective and choleretic. Grade A culinary safety. BIOAVAILABILITY: piperine plus fat mandatory — always instruct. Screen for gallstones (choleretic), anticoagulants (additive), surgery (discontinue 2 weeks pre-op). Safe indefinitely at culinary doses.',
  },

  // ─────────────────────────────────────────────
  // VANILLA
  // ─────────────────────────────────────────────
  {
    id: 287,
    name: 'Vanilla',
    botanical: 'Vanilla planifolia / Vanilla tahitensis (cured pod — "The Comfort of the Orchid")',
    tcm_meridians: ['Heart', 'Spleen', 'Liver', 'Digestive System'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Moist', 'Sweet', 'Pleasure-Inducing', 'Grounding', 'Parasympathetic-Activating', 'Limbic-Opening'],
    primary_functions: [
      'Limbic mood elevation and anxiety reduction — vanillin crosses the blood-brain barrier and directly activates limbic structures (amygdala, hippocampus); triggers reward pathway activation (nucleus accumbens, VTA); RCTs confirm 25–35% reduction in anxiety scores with vanillin aromatherapy; immediate via scent; cumulative via oral ingestion (2–4 weeks)',
      'Parasympathetic activation and cortisol reduction — mild GABAergic properties plus parasympathetic nervous system activation reduce sympathetic overdrive; HPA axis modulation reduces cortisol response to stress; signals safety without sedation',
      'Neurotransmitter receptor sensitisation — does NOT directly increase serotonin or dopamine; rather enhances receptor sensitivity and signal transduction efficiency; no downregulation; no tolerance; sustainable mood support that amplifies the body\'s own reward signalling',
      'Antioxidant and anti-inflammatory — vanillic acid (phenolic) scavenges hydroxyl radicals and superoxide; reduces IL-6, TNF-alpha and COX-2 inflammatory pathway; neuroprotective at systemic level',
      'Digestive warming and carminative — gentle warming of GI tract; mild antispasmodic via terpenes; stimulates digestive secretions (saliva, gastric juice, bile); supports gut-brain axis emotional digestion',
    ],
    secondary_benefits: [
      'Sleep quality support (non-sedating) — parasympathetic activation signals safety to nervous system; supports sleep onset without sedation; preserves sleep architecture; synergises with warm milk ritual',
      'Sensory pleasure and comfort principle — used in neonatal ICUs to soothe premature infants; FDA-approved for this purpose; carries the memory of maternal safety and early nurturing',
      'Trauma-informed safety anchor — consistent comforting sensory experience useful in trauma recovery as a felt-sense of protection before deeper nervous system work',
      'Anhedonia support — particularly effective for stress-induced loss of pleasure capacity; restores ability to experience normal reward; pairs synergistically with Cacao and Cardamom',
    ],
    pharmacology:
      'Primary bioactives: vanillin (1–3% in whole bean; PRIMARY — crosses BBB; limbic system activation; reward pathway stimulation; mild GABAergic; cortisol reduction; immediate olfactory + cumulative oral routes), vanillic acid (phenolic; potent antioxidant; anti-inflammatory; neuroprotective), p-hydroxybenzoic acid (antimicrobial; antioxidant), 250+ aromatic compounds (guaiacol, phenols, esters, fatty acids — create complex sensory experience), trace terpenes (limonene, eucalyptol, α-pinene — uplifting, clarifying, grounding), flavonoids (chrysoeriol, luteolin — antioxidant; neuroprotective), trace minerals (magnesium, calcium, potassium) and B vitamins (niacin, thiamine, riboflavin). MECHANISM: receptor sensitisation NOT direct neurotransmitter increase — no downregulation, no tolerance. Grade A sensory and emotional effect (anxiolytic RCTs); Grade B antioxidant and anti-inflammatory. Grade A safety.',
    flavor_profile: 'Deeply sweet, warm and complex — universally recognised as comfort itself; the most beloved aromatic in perfumery and food',
    contraindications: [
      'Synthetic vanillin (petroleum or wood pulp derived) — NOT therapeutic; only whole-bean or genuine extract; verify source',
      'Known vanilla or Orchidaceae allergy — rare; discontinue if reaction',
      'Otherwise: Grade A safety — one of the safest and most gentle herbs in the library; suitable all populations including children, pregnancy, elderly, sensitive individuals',
    ],
    herb_to_herb_synergy: [
      'Cacao — synergistic pleasure and dopamine support; both reward-pathway activators; the defining comfort combination',
      'Cardamom — mood elevation plus warming digestive; complementary sensory and neurochemical pleasure',
      'Saffron — dual limbic mood elevation; vanillin comfort plus crocin SSRI-like serotonin support',
      'Chamomile — calm warmth and safety; perfect pairing for sleep and stress-relief rituals',
      'Rose — heart-opening aromatic; self-love and emotional warmth amplified; luxury self-care formula',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns — Vanilla is universally compatible and tends to amplify other herbs through the pleasure principle',
    ],
    herb_to_drug_interactions: [
      'No known drug interactions — completely safe with all medications',
      'Enhances parasympathetic nervous system tone; complementary to all wellness and nervous-system interventions',
    ],
    herb_interactions: [
      'Synergy: Cacao, Cardamom, Saffron, Chamomile, Rose; enhances enjoyment of all herbal protocols',
      'Caution: None',
      'Drug interactions: None known',
    ],
    dosage_range:
      'Whole bean: 0.5–1 bean scraped into warm milk, smoothie or culinary preparation daily. Tincture (most cost-effective): 10–20 drops, 1–3× daily in warm liquid. Powder (whole bean): 0.25–0.5 g daily. Aromatherapy (immediate effect): 2–3 drops essential oil on cloth or diffused — direct limbic access within seconds to minutes. Warm milk ritual (foundational): 1 cup warm milk with scraped vanilla bean and honey — 15 minutes of intentional ceremony. Safe indefinite daily use.',
    spiritual_layer:
      'Vanilla is the rarest and most patient of flavours — her pods require hand-pollination, months of careful curing, and the labour of thousands of hands to become the scent that the entire world recognises as comfort. She is the Orchid of pleasure, teaching that sweetness is not indulgence but medicine, that pleasure is a valid therapeutic pathway, that the nervous system that knows how to receive ease is a nervous system that can heal. She teaches that luxury is not about external wealth but about the quality of presence one brings to receiving. She carries the ancient memory of being held safely — she whispers to the oldest part of the nervous system: You have been safe before. You can be safe again. You are worthy of sweetness. She whispers: I am worthy of pleasure. I allow sweetness. I receive comfort without guilt. I am safe. I am cared for. I enjoy this life.',
    best_preparation:
      'Warm milk ritual is the defining preparation — 15 minutes of intentional warming, scraping the bean, adding honey, drinking slowly and without rushing. This is as much a nervous-system intervention as a herbal one. Aromatherapy for immediate acute anxiety: keep vanilla essential oil accessible. For anhedonia: combine with Cacao and Cardamom (pleasure-medicine triad). No screening required — safe for every population, no drug interactions. Position as the foundational pleasure tonic: begin herbal protocols with Vanilla when clients are disconnected from their capacity to receive.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade A sensory and emotional anxiolytic (RCT evidence; limbic mechanism confirmed). Grade B antioxidant and anti-inflammatory. Grade A safety — universally gentle; suitable all populations. No drug interactions. No contraindications except verified natural source requirement. The foundational pleasure and comfort herb of the library.',
  },

  // ─────────────────────────────────────────────
  // VALERIAN
  // ─────────────────────────────────────────────
  {
    id: 288,
    name: 'Valerian',
    botanical: 'Valeriana officinalis (root and rhizome — "Night Medicine for the Overthinking Mind")',
    tcm_meridians: ['Heart', 'Liver', 'Gallbladder'],
    tcm_element: 'Earth + Water',
    energetics: ['Cool to Neutral', 'Slightly Bitter', 'Pungent-Aromatic', 'Sedative', 'Relaxing', 'Antispasmodic', 'Shen-Calming'],
    primary_functions: [
      'Sedative and hypnotic for anxiety-related insomnia — valerenic acids enhance GABAergic tone (GABA-A receptor positive modulation + GABA reuptake inhibition); shortens sleep-onset latency; improves sleep maintenance; EMA monograph supports use for mild nervous tension and sleep disturbance; multiple RCTs confirm',
      'Anxiolytic and daytime calming — at moderate doses reduces subjective anxiety, muscle tension and restlessness without strong daytime sedation; mild serotonin receptor interaction contributes anxiolytic effect',
      'Antispasmodic — smooth muscle relaxation in GI and uterine tissues; useful for tension headaches, menstrual cramps and stress-related gut spasm',
      'Nervine tonic (cumulative) — ongoing appropriate use supports more balanced stress response and nervous system resilience; best combined with lifestyle and sleep hygiene',
      'Non-habit-forming alternative to pharmaceuticals — does not act as a classical benzodiazepine; dependence risk much lower at appropriate doses and duration',
    ],
    secondary_benefits: [
      'Perimenopausal sleep disturbance — combines well with Hops and Passionflower for hormonal sleep disruption',
      'Tension headache and muscle tension — antispasmodic and GABA-sedating combination; pairs with magnesium and Skullcap',
      'EMA traditional use monograph — recognised for mild nervous tension and sleep disturbance',
      'KEY CLINICAL NOTE: full effect often takes 2–4 weeks of consistent nighttime use — set expectations clearly; avoid "failed in one night" narratives',
    ],
    pharmacology:
      'Primary bioactives: valerenic acid, hydroxyvalerenic acid, acetoxyvalerenic acid (positive GABA-A receptor modulation; inhibition of GABA breakdown; mild adenosine and serotonin receptor interaction; sedative and anxiolytic), volatile oils (0.2–1%; bornyl isovalerate — characteristic pungent odour; mild sedative contribution), valepotriates (iridoids — historically implicated; unstable with heat and long storage), flavonoids and lignans (antioxidant; minor neuroprotection). CYCLING: recommend limiting continuous high-dose use to 4–6 weeks before tapering or cycling; taper gradually to avoid rebound in sensitive individuals. Grade A sleep improvement (EMA monograph; multiple RCTs); Grade B+ anxiolytic; Grade B antispasmodic.',
    flavor_profile: 'Strong, earthy and characteristic pungent — distinctively funky aroma from bornyl isovalerate; typically taken in tincture or capsule to avoid taste',
    contraindications: [
      'Pregnancy and breastfeeding — insufficient safety data; avoid or use only under professional supervision',
      'Children under 12 — very low doses only with professional guidance; not in standardised adult doses',
      'Significant liver disease — reports of hepatotoxicity in multi-herb preparations; monitor or use alternatives',
      'CNS depressants (benzodiazepines, alcohol, barbiturates, sedative antihistamines) — ADDITIVE SEDATION: caution; do not combine without prescriber guidance',
      'Driving or operating machinery — caution until individual response known; some experience morning grogginess at higher doses',
      'Known hypersensitivity to Valeriana species',
    ],
    herb_to_herb_synergy: [
      'Passionflower — classic insomnia pairing for racing-mind type; complementary GABA mechanisms (REDUCE doses of both when combining — can produce strong sedation)',
      'Hops — deeper sedation combination for severe short-term insomnia (use temporarily; not for chronic)',
      'Lemon Balm — soft-focus calm; nervous tension plus mood support without heavy sedation',
      'Skullcap — nervous tension plus antispasmodic; excellent for tension headache pattern',
      'Milky Oats — deep nervous system nourishment alongside acute calming; burnout plus insomnia',
    ],
    herb_to_herb_caution: [
      'Passionflower — CAUTION with high doses of both together: can produce excessive sedation; reduce both doses when combining',
      'Kava — both potently GABAergic; potential excessive CNS depression; avoid combining',
    ],
    herb_to_drug_interactions: [
      'CNS depressants (benzodiazepines, barbiturates, sleep medications, alcohol) — ADDITIVE SEDATION: caution; coordinate with prescriber',
      'CYP3A4 substrates — possible modulation suggested (limited data); caution with narrow-therapeutic-index drugs',
    ],
    herb_interactions: [
      'Synergy: Passionflower (reduce both doses when combining), Hops (short-term only), Lemon Balm, Skullcap, Milky Oats',
      'Caution: Passionflower (reduce doses), Kava (avoid combining — excessive CNS depression)',
      'Drug interactions: CNS depressants (additive sedation — coordinate with prescriber), CYP3A4 substrates (caution; limited data)',
    ],
    dosage_range:
      'Tincture (1:5 in 40–70% alcohol): 2–4 ml (40–80 drops) 30–60 minutes before bed for insomnia; optional 1–2 ml afternoon dose to soften the landing. For daytime anxiety: 1–2 ml up to 3× daily. Tea: 2–3 g dried root per 250 ml, steeped 10–15 minutes, 1–2× daily (less efficient for lipophilic constituents). Standardised extract (capsules, 0.8% valerenic acids): 300–600 mg 30–60 minutes before bed. Duration: 2–4 weeks to evaluate full effect; maximum 4–6 weeks continuous high-dose before reassessing or cycling. Taper gradually on discontinuation.',
    spiritual_layer:
      'Valerian is earth-root medicine — she grows deep, smells of the subterranean, and carries the teaching that safety is felt in the body when the mind releases its grip. True rest is not collapse but consent to being held by the earth; valerian teaches that the vigilance we maintain against an imagined threat costs more than the threat itself. She is the night companion for the one whose mind will not stop — the one who solves problems in the dark, who carries the world into sleep. She reaches her roots into the ground and says: This is where the thinking can rest. The earth holds what you cannot. She whispers: My body is safe. My mind releases. Rest is allowed. Sleep comes naturally. I do not have to hold everything alone.',
    best_preparation:
      'Evening tincture 30–60 minutes before bed is the most reliable delivery. Set the 2–4 week expectation clearly — clients who expect immediate results will abandon a herb that requires consistency to work. Optional afternoon dose helps "soften the landing" for anxious hypervigilant types. Screen for liver disease, pregnancy, CNS depressants and alcohol use. Cycling at 4–6 weeks: taper and rotate with other nervines (Skullcap, Passionflower) for chronic insomnia.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade A sleep improvement (EMA monograph; multiple RCTs). Grade B+ anxiolytic. Grade B antispasmodic. 2–4 weeks for full effect (set expectations). Maximum 4–6 weeks continuous high-dose; taper gradually. Screen for CNS depressants (additive sedation — coordinate with prescriber), liver disease, pregnancy (avoid). Non-habit-forming at appropriate doses. Rotate and cycle for long-term use.',
  },

  // ─────────────────────────────────────────────
  // VERVAIN / VERBENA
  // ─────────────────────────────────────────────
  {
    id: 289,
    name: 'Vervain',
    botanical: 'Verbena officinalis (aerial parts — flowering tops, leaves and upper stems)',
    tcm_meridians: ['Liver', 'Heart', 'Nervous System'],
    tcm_element: 'Wood + Metal',
    energetics: ['Slightly Cool to Neutral', 'Bitter', 'Slightly Acrid', 'Aromatic', 'Nervine-Relaxant', 'Hepatic', 'Antispasmodic'],
    primary_functions: [
      'Relaxing nervine and anxiolytic — iridoid glycosides (verbenalin, hastatoside) and flavonoids (luteolin, apigenin) provide anxiolytic, sedative and anticonvulsant effects; animal models show efficacy comparable to diazepam; indicated for overtaxed, hyper-vigilant, wired-tired nervous systems',
      'ANS rebalancing and burnout support — clinically used by herbalists to reduce sympathetic overdrive; ideal for those whose stress is held in the neck, head and liver; bridges overwork and recovery',
      'Bitter hepatic and digestive support — bitter principles stimulate bile flow and digestion; addresses liver-qi stagnation patterns manifesting as irritability, poor appetite, slow fat digestion and PMS with breast tenderness',
      'Tension headache and migraine — relaxes skeletal muscles (neck and shoulders), modulates ANS and supports liver; classic herb in liver-nervine migraine formulas for the tense, overworked, liverish constitution',
      'PMS, menstrual tension and mild hypertension — nervine, antispasmodic and hepatic actions reduce PMS irritability, breast tenderness and mild cramps; mild BP modulation in stress-driven cases',
    ],
    secondary_benefits: [
      'Neuroprotective — in vitro studies show significant reduction of beta-amyloid toxicity and caspase activation in cortical neurons; potential Alzheimer\'s-type protection (Grade B-minus; no human trials yet)',
      'Sleep support for hyper-vigilant types — evening infusion supports winding down in those too activated to use heavy sedatives',
      'Sacred herb of European folk tradition — purification, prophecy and protection herb for millennia; liver of the overworked, the intellectual, the duty-bound',
      'Bridges digestion and mood — the liver-nervine connection makes this uniquely suited for stress-GI combinations and PMS',
    ],
    pharmacology:
      'Primary bioactives: iridoid glycosides (verbenalin, hastatoside — core anxiolytic, sedative, anti-inflammatory, potential neuroprotective; comparable to diazepam in elevated plus maze and open field tests at 0.1–0.5 g/kg; anticonvulsant in PTZ seizure models; increases thiopental-induced sleep duration), triterpenes (oleanolic acid, ursolic acid — anti-inflammatory; hepatoprotective; antimicrobial), flavonoids (luteolin, apigenin — antioxidant; anxiolytic; neuroprotective). In vitro: aqueous extracts significantly reduce beta-amyloid toxicity in cortical neurons. Grade B anxiolytic/sedative (animal models plus strong traditional clinical use); Grade B-minus neuroprotection (in vitro only); Grade B-minus anticonvulsant (animal models).',
    flavor_profile: 'Mildly bitter and slightly aromatic — pleasantly herbaceous; often combined with Lemon Balm or Mint for palatability',
    contraindications: [
      'Pregnancy — traditionally contraindicated: emmenagogue and uterine-stimulating reputation (limited modern evidence but cautious avoidance standard); BLOCK or strong caution',
      'Trying to conceive — CAUTION: same uterine-stimulating concern; consult practitioner',
      'CNS depressants (benzodiazepines, barbiturates, alcohol) — ADDITIVE effect: caution; monitor',
      'Antiepileptic drugs — anticonvulsant properties from animal data; unknown interaction with medications; use only under supervision',
      'Hypotension or multiple antihypertensives — mild BP-lowering effect; additive caution',
      'Severe depression — emphasise on calming and surrender may deepen lethargy; pair with mood-lifting herbs; monitor',
    ],
    herb_to_herb_synergy: [
      'Lemon Balm — classic nervous tension pairing; both provide calming; complementary mechanisms; mood-calming combination',
      'Milky Oats and Ashwagandha — deep burnout recovery; Vervain unwinding plus nutritive nervous system rebuilding',
      'Dandelion root and Artichoke — liver bitters trio; comprehensive liver-qi support for PMS-liver pattern',
      'Skullcap and Cramp Bark — tension headache and menstrual tension formula',
      'Feverfew — prophylactic migraine formula for the tense, liverish constitutional type',
    ],
    herb_to_herb_caution: [
      'Hypnotic sedatives (Valerian, Hops) at high combined doses — can produce excessive CNS depression; reduce doses',
      'Other hypotensive herbs — additive BP-lowering; monitor',
    ],
    herb_to_drug_interactions: [
      'CNS depressants — additive sedation; monitor',
      'Antihypertensives — mild hypotensive synergy; monitor BP',
      'Antiepileptic drugs — unknown interaction (anticonvulsant animal data); supervision required',
      'No major CYP interactions well documented at standard doses',
    ],
    herb_interactions: [
      'Synergy: Lemon Balm, Milky Oats, Ashwagandha, Dandelion, Skullcap, Cramp Bark, Feverfew',
      'Caution: Valerian/Hops at high doses (reduce both), hypotensive herbs (monitor BP)',
      'Drug interactions: CNS depressants (additive — monitor), antihypertensives (monitor BP), antiepileptics (supervision required)',
    ],
    dosage_range:
      'Tincture (1:5 in 40–60% alcohol): 1–5 ml, 2–3× daily; lower end for sensitive individuals; higher end for acute tension episodes. Tea: 1–2 tsp (1–3 g) dried herb per 250 ml, steeped 10–15 minutes, 1–3× daily (bitter — combine with Lemon Balm or Mint for palatability). Duration: several months at moderate doses; often cycled (5 days on / 2 off) for long-term stress patterns. For migraines and PMS: expect 2–3 cycles or 4–8 weeks for full effect.',
    spiritual_layer:
      'Vervain is the overworked person\'s ally — the herb of the one who cannot put the burden down, whose mind keeps spinning, whose shoulders hold the world. She is sacred to every tradition that recognised the person who serves too much and rests too little: the intellectual, the caretaker, the duty-bound. She teaches that true service and intellect must be anchored in relaxation and flow — otherwise tension jams the liver, the head aches and the spirit cannot hear itself. She releases the sense of duty that has become suffering, the hypervigilance that has mistaken itself for care. She whispers: I release what I cannot carry. My nerves unwind, my liver and mind are at ease. I serve and create from a relaxed, steady centre.',
    best_preparation:
      'Tincture 2–3 ml twice daily (late afternoon and evening) for burnout and ANS rebalancing. Bitter taste — combine with Lemon Balm in tea or tincture blend for palatability and complementary action. For tension headache: acute dose of 2–4 ml at onset; tonic 1–3 ml twice daily long-term with Feverfew and magnesium. MANDATORY screening: pregnancy and trying to conceive (BLOCK/strong caution). Monitor CNS depressants, antiepileptics and very low BP.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B anxiolytic and nervine (animal models plus strong traditional clinical use). Grade B-minus neuroprotection (in vitro; no human trials). Strong traditional evidence for burnout, tension headache, PMS-liver pattern and stress gut. BLOCK in pregnancy (uterine-stimulating reputation). Screen CNS depressants and antiepileptics. 4–8 weeks for full PMS and migraine effect.',
  },

  // ─────────────────────────────────────────────
  // VITEX (CHASTEBERRY)
  // ─────────────────────────────────────────────
  {
    id: 290,
    name: 'Vitex',
    botanical: 'Vitex agnus-castus (dried berries — "Chaste Tree / Abraham\'s Balm")',
    tcm_meridians: ['Liver', 'Kidney', 'Uterus'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Dry', 'Bitter', 'Regulating', 'Hormonally-Balancing', 'Cycle-Normalising'],
    primary_functions: [
      'Luteal phase support and progesterone enhancement — iridoids (agnuside, aucubin; 0.5–1%) modulate pituitary LH release; enhance progesterone production via improved corpus luteum function; progesterone-like activity WITHOUT being a phytoprogesterone (unique mechanism); German Commission E monograph; 100+ RCTs',
      'PMS and PMDD symptom reduction — progesterone enhancement reduces breast tenderness, bloating, mood swings, irritability and depression linked to luteal phase (progesterone deficiency); particularly effective for mood-related PMS',
      'Cycle regulation and normalisation — regulates FSH/LH ratio; normalises cycle length; reduces anovulatory cycles; irregular cycles (late or early) become regular',
      'Fertility support via luteal strengthening — stronger luteal phase and improved progesterone during implantation window; NOT a direct fertility drug but supports fertility for luteal-phase insufficiency',
      'Perimenopausal cycle stabilisation — supports cycle regularity and hormonal balance during the transition of perimenopause',
    ],
    secondary_benefits: [
      'Dopaminergic activity — mild dopamine receptor agonism contributes to PMS mood improvement via additional neurochemical pathway',
      'Anti-inflammatory flavonoids — antioxidant and mild anti-inflammatory contribution to cycle comfort',
      'Long history in European and Mediterranean herbalism — monks used to reduce sexual drive (chaste tree); centuries of women\'s health use',
      'KEY CLINICAL EXPECTATION: minimum 3 months for significant effects (hormonal changes require multiple cycles to manifest) — educate from first recommendation',
    ],
    pharmacology:
      'Primary bioactives: iridoids (0.5–1%; agnuside, aucubin — modulate LH release; enhance progesterone via corpus luteum; NOT phytoprogesterone; unique mechanism), flavonoids (minor; antioxidant; anti-inflammatory), essential oil (2–3% volatile; minor aromatic effects). CAUTION with dopamine antagonist medications: Vitex enhances dopamine and may counteract antipsychotics and metoclopramide. PREGNANCY ABSOLUTE CONTRAINDICATION. HORMONAL CONTRACEPTIVES: may reduce contraceptive efficacy (hormone modulation) — backup contraception or consult prescriber. Grade A cycle regulation and PMS/PMDD (100+ RCTs; mechanism confirmed; German Commission E monograph); Grade B+ fertility support and luteal phase; Grade A safety when screened appropriately.',
    flavor_profile: 'Mildly bitter and slightly peppery — characteristic berry; typically taken as standardised extract or tincture',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: progesterone-enhancing; may affect pregnancy hormones; HARD BLOCK',
      'Breastfeeding — CAUTION/AVOID concentrated forms: some traditional use but insufficient modern data; consult provider',
      'Hormonal contraceptives (OCP, patches, rings) — POTENTIAL INTERACTION: may reduce contraceptive efficacy via hormone modulation; consult prescriber; consider backup contraception',
      'Oestrogen-receptor-positive breast cancer — CAUTION: progesterone-enhancing; consult oncologist before use',
      'Dopamine antagonist medications (antipsychotics, metoclopramide, haloperidol) — CAUTION: Vitex enhances dopamine; may counteract these medications; consult prescriber',
      'Hormone-sensitive conditions — CAUTION: any condition sensitive to progesterone changes; consult practitioner',
    ],
    herb_to_herb_synergy: [
      'Raspberry Leaf — cycle tonification plus hormonal support; excellent daily women\'s health duo',
      'Lady\'s Mantle — astringent cycle support plus hormonal balancing; physical PMS symptoms',
      'Yarrow — menstrual regulation and haemostatic; multi-herb cycle formula',
      'Nettle infusion — mineral tonification supporting the entire reproductive hormonal system',
    ],
    herb_to_herb_caution: [
      'Black Cohosh and Sage — potentially contradictory hormonal mechanisms; coordinate if combining; consult practitioner',
      'Other progesterone-modulating herbs — cumulative hormonal effect; coordinate carefully',
    ],
    herb_to_drug_interactions: [
      'Hormonal contraceptives — may REDUCE contraceptive efficacy; backup contraception or alternative; consult prescriber',
      'Dopamine antagonist medications (antipsychotics, metoclopramide) — COUNTERACTION: may reduce drug efficacy; consult prescriber',
      'Hormone replacement therapy — potential modulation; consult prescriber',
    ],
    herb_interactions: [
      'Synergy: Raspberry Leaf, Lady\'s Mantle, Yarrow, Nettle',
      'Caution: Black Cohosh and Sage (potentially contradictory), hormonal contraceptives (may reduce efficacy)',
      'Drug interactions: hormonal contraceptives (efficacy — backup contraception), dopamine antagonists (counteraction — consult prescriber), HRT (consult prescriber)',
    ],
    dosage_range:
      'Standardised extract (0.6% agnuside): 20–40 mg daily (some formulas 500 mg extract daily). Dried berry: 1–2 tsp (3–4 g), 1–2× daily. Tincture (1:5 alcohol): 40–60 drops, 2× daily. MINIMUM 3 months for significant effects (hormonal changes require multiple cycles); optimal effect 3–6 months. Safe long-term indefinite with optional cycling (3 months on, 1 month off). Morning dosing standard. Continuous throughout cycle (not just luteal phase) for cycle regulation; optional luteal-phase-only timing for PMS focus.',
    spiritual_layer:
      'Vitex — Chaste Tree, Abraham\'s Balm — is the keeper of women\'s cycle wisdom. The monks who used her to reduce desire misunderstood her; she was never about suppression but about regulation, about the power of rhythm, about honouring the phases of the moon reflected in the female body. She teaches that the luteal phase is sacred — the inward space of integration, creativity and deep knowing that Western culture has pathologised as PMS. She teaches that cycle regularity is body confidence, that body wisdom is trustworthy, that the progesterone-nourished second half of the cycle is not a liability but a gift of depth. She whispers: My cycle is regular. My luteal phase is strong. I honour my rhythms. I am fertile. I am balanced. My body is wise. I am whole.',
    best_preparation:
      'Standardised 20–40 mg agnuside extract is the most reliable clinical form. MANDATORY screening before every recommendation: pregnancy (ABSOLUTE CONTRAINDICATION — HARD BLOCK); breastfeeding (caution); hormonal contraceptives (discuss efficacy risk; backup contraception or review options with prescriber); oestrogen-receptor-positive breast cancer (consult oncologist); dopamine antagonist medications (counteraction risk). Three-month minimum timeline education is non-negotiable — set the expectation clearly from day one.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade A cycle regulation and PMS/PMDD (100+ RCTs; German Commission E monograph; mechanism confirmed). Grade B+ fertility support and luteal phase. ABSOLUTE CONTRAINDICATION: pregnancy (HARD BLOCK). MAJOR CAUTIONS: hormonal contraceptives (efficacy risk — backup contraception); dopamine antagonists (counteraction — prescriber). Three-month minimum timeline. Standardised extract preferred.',
  },

  // ─────────────────────────────────────────────
  // WILD DAGGA
  // ─────────────────────────────────────────────
  {
    id: 291,
    name: 'Wild Dagga',
    botanical: 'Leonotis leonurus (leaves and flowers — "Lion\'s Ear")',
    tcm_meridians: ['Heart', 'Liver', 'Kidney'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Moist', 'Relaxing', 'Mood-Lifting', 'Mildly Psychoactive', 'Spirit-Calming', 'Pleasure-Promoting'],
    primary_functions: [
      'Gentle relaxation with preserved clarity — leonurine and related alkaloids (0.1–0.5%) create mild nervous-system ease and tension release; paradoxical calm-alert state (relaxation without drowsiness); non-intoxicating at normal doses; no impairment or altered perception',
      'Mild mood elevation and euphoria — leonurine plus aromatic essential-oil compounds lift mood and create gentle non-intoxicating pleasure; non-addictive; no tolerance development; safe ongoing use',
      'Spirit calming and emotional ease — calms nervous system; accessible emotional vulnerability; slight heart-opening; presence deepens; tension releases at emotional level',
      'Antioxidant and anti-inflammatory support (secondary) — polyphenols and flavonoids provide free-radical scavenging and cytokine modulation',
      'Traditional South African relaxation and pleasure herb — centuries ceremonial and everyday use for relaxation, mild euphoria and spiritual connection',
    ],
    secondary_benefits: [
      'Non-addictive relaxant — no tolerance, no dependence, no withdrawal; safe indefinite daily use',
      'Paradoxical calm-alert (unique quality) — unlike pharmaceutical sedatives or cannabis; relaxation and mental clarity coexist',
      'Social ease and confidence — mild euphoria reduces social anxiety and enhances connection; traditional social and gathering herb',
      'Synergises with Hops and Passionflower — triple nervous-system relaxation combination with complementary mechanisms',
    ],
    pharmacology:
      'Primary bioactives: alkaloids (leonurine and others — 0.1–0.5%; PRIMARY mild psychoactive; CNS ease; mood-lifting; non-intoxicating mechanism emerging; traditional centuries; non-addictive), essential oils (volatile aromatic compounds — mood-lifting; pleasure-inducing; aromatic synergy with alkaloids), polyphenols and flavonoids (antioxidant; anti-inflammatory — tertiary contribution). UNIQUE PROFILE: mildly psychoactive but NON-INTOXICATING at normal doses; no impairment; clarity maintained; non-addictive unlike cannabis or kratom. Grade C+ relaxation (mechanism emerging; traditional use; limited RCTs); Grade C mood elevation (mechanism plausible; traditional; limited studies); Grade B safety (centuries use; well-tolerated; alkaloid content documented).',
    flavor_profile: 'Herbal, slightly sweet and mildly bitter — aromatic and earthy; pleasant as a tea',
    contraindications: [
      'Pregnancy — CAUTION: psychoactive alkaloid content; safety data limited; LIKELY AVOID; consult prenatal provider',
      'Breastfeeding — CAUTION: theoretical alkaloid transfer to infant; LIKELY AVOID concentrated forms; consult provider',
      'Liver disease — MONITOR: alkaloids metabolised hepatically; monitor liver function; consult provider',
      'CNS depressants — MONITOR: additive relaxation possible; generally manageable; adjust doses',
      'Otherwise: generally safe with awareness — non-addictive; non-intoxicating; centuries traditional use',
    ],
    herb_to_herb_synergy: [
      'Hops and Passionflower — triple nervous-system support; relaxation plus sleep plus calm-alert clarity',
      'Lemon Balm — mood elevation plus nervous-system calming; complementary aromatic pleasure',
      'Kava (with caution) — deeper relaxation; reduce doses of both; monitor liver if combining',
    ],
    herb_to_herb_caution: [
      'Kava — both hepatically metabolised; monitor liver if combining; reduce doses',
      'Other mildly psychoactive herbs at high combined doses — cumulative CNS effect; use with awareness',
    ],
    herb_to_drug_interactions: [
      'CNS depressants — additive relaxation; generally manageable; monitor',
      'Hepatically metabolised drugs — alkaloid hepatic metabolism; theoretical interactions; monitor',
    ],
    herb_interactions: [
      'Synergy: Hops, Passionflower, Lemon Balm',
      'Caution: Kava (hepatic — monitor liver; reduce doses), other mildly psychoactive herbs at high combined doses',
      'Drug interactions: CNS depressants (additive — monitor), hepatically metabolised drugs (theoretical — monitor)',
    ],
    dosage_range:
      'Dried leaf and flower infusion (SAFEST): 2–4 g steeped 5–10 minutes, 1–2× daily. Fresh infusion most potent. Tincture (fresh plant): 20–40 drops, 1–2× daily. Traditional smoking (CEREMONIAL — use cautiously — combustion byproducts): small amounts of fresh or dried leaves; fastest onset; most potent; not recommended for daily respiratory health. Afternoon or evening timing for relaxation. Low doses fine during daytime (non-drowsy). Safe indefinite daily use (non-addictive; no tolerance).',
    spiritual_layer:
      'Wild Dagga carries the joy of South African wildness — the orange-red flowers blazing like flames above the savanna, the lion\'s ear hearing what others miss. She teaches that pleasure is not earned through suffering, that mild euphoria is a gift of nature available without intoxication, that the relaxed clear mind is not a compromise of function but an enhancement of it. She carries the teaching of the paradox: that you can be fully present AND at ease, fully awake AND at rest. She is the reminder that African traditional knowledge understood something pharmaceuticals have struggled to achieve — gentle, non-addictive pleasure as medicine. She whispers: I am relaxed. I am joyful. I am clear. I am present. I am peaceful. I am connected. I am whole. I am pleased.',
    best_preparation:
      'Infusion (tea) is the daily safest preparation — pleasant earthy flavour; portable; no combustion. Evening use for relaxation and pleasure ritual; daytime low-dose for paradoxical calm-alert work state. Pair with Passionflower for sleep or Lemon Balm for mood. EDUCATE clearly: non-intoxicating at normal doses — no impairment, no altered perception, clarity maintained. Screen for pregnancy and breastfeeding (likely avoid), liver disease (monitor). A herb for pleasure, presence and gentle joy — frame the ritual and intention as part of the medicine.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade C+ relaxation (mechanism emerging; centuries traditional use). Grade B safety (traditional use; well-tolerated; alkaloid content documented). Non-addictive; non-intoxicating at normal doses; paradoxical calm-alert; safe indefinite daily use. CAUTION: pregnancy (likely avoid), breastfeeding (likely avoid), liver disease (monitor). Educate on non-intoxicating nature clearly.',
  },

  // ─────────────────────────────────────────────
  // WILLOW BARK
  // ─────────────────────────────────────────────
  {
    id: 292,
    name: 'Willow Bark',
    botanical: 'Salix alba / Salix spp. (inner bark — "The Original Aspirin")',
    tcm_meridians: ['Liver', 'Kidney', 'Heart'],
    tcm_element: 'Water + Wood',
    energetics: ['Cool', 'Dry', 'Bitter', 'Pain-Relieving', 'Anti-Inflammatory', 'Fever-Reducing', 'Detoxifying'],
    primary_functions: [
      'Natural aspirin-equivalent pain relief — salicin (converted to salicylic acid in the body; 1–2% of inner bark) provides COX inhibition and analgesia comparable to aspirin; ADVANTAGE: natural salicylates are gentler on GI tract than synthetic aspirin (tannins provide simultaneous mucosal protection)',
      'Anti-inflammatory — salicylate COX inhibition plus polyphenol cytokine reduction (dual mechanism); reduces systemic inflammation; supports arthritis, joint pain and chronic inflammatory conditions',
      'Fever reduction — salicylate fever-modulating properties; traditional and effective for acute febrile states',
      'GI-protective pain relief (unique advantage) — unlike synthetic aspirin and NSAIDs which damage GI lining, Willow Bark tannins (5–10%) actively protect the stomach mucosa; superior tolerability for long-term use',
      'Traditional pain management with 2000+ year history — the original source of aspirin; synthetic salicylate was isolated from Willow Bark in 1897',
    ],
    secondary_benefits: [
      'Safe long-term for chronic pain management — gentler cumulative profile than NSAIDs; no documented GI ulceration or kidney stress at therapeutic doses',
      'Synergistic anti-inflammatory triple — pairs with Turmeric and Ginger for comprehensive multi-pathway pain and inflammation support',
      'Aspirin alternative for aspirin-sensitive individuals (unless salicylate allergy) — generally better tolerated',
      'European and Asian traditional use across 2000+ years — documented in Hippocratic writings; medieval herbalism cornerstone',
    ],
    pharmacology:
      'Primary bioactives: salicylates (salicin 1–2%; PRIMARY — COX inhibition; aspirin-like analgesia; anti-inflammatory; fever reduction; gentler on GI than synthetic aspirin), polyphenols (catechin and others 1–2%; antioxidant; anti-inflammatory synergy), tannins (5–10%; astringent; GI mucosal protection — UNIQUE ADVANTAGE over synthetic aspirin; antimicrobial). ONSET: 1–2 weeks minimum for noticeable benefit (salicylates accumulate; baseline decreases over 2–4 weeks — different from acute aspirin effect). Grade B pain relief (mechanism confirmed; multiple RCTs); Grade B anti-inflammatory; Grade C+ fever reduction; Grade A safety (2000+ years; well-tolerated).',
    flavor_profile: 'Bitter and astringent — characteristic inner-bark bitterness; typically decocted for 10–15 minutes to soften taste',
    contraindications: [
      'Aspirin sensitivity or salicylate allergy — MONITOR: contains salicylates; discontinue if reaction (though often better tolerated than synthetic aspirin)',
      'Bleeding disorders — CAUTION: mild anticoagulant salicylate properties; monitor bleeding time',
      'Pregnancy — CAUTION: salicylate concern similar to aspirin; consult prenatal provider; likely avoid concentrated doses',
      'Anticoagulants (Warfarin, DOACs) — MONITOR INR: mild additive anticoagulation; generally manageable with monitoring',
      'Other NSAIDs or aspirin — additive effect; may reduce need but consult prescriber before combining',
      'Surgery — discontinue 2 weeks before: mild anticoagulant effect',
    ],
    herb_to_herb_synergy: [
      'Turmeric — dual anti-inflammatory (salicylate COX inhibition plus curcumin NF-κB inhibition); potent pain and inflammation combination',
      'Ginger — triple anti-inflammatory (Willow Bark + Turmeric + Ginger = comprehensive natural pain relief)',
      'Boswellia — LOX pathway inhibition plus COX inhibition; joint inflammation comprehensive support',
      'Devil\'s Claw — additional anti-inflammatory for arthritis and musculoskeletal pain patterns',
    ],
    herb_to_herb_caution: [
      'Other anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) with Warfarin — additive bleeding; monitor INR',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets (Warfarin, DOACs, aspirin, clopidogrel) — MONITOR INR: mild additive anticoagulant; generally manageable',
      'NSAIDs — additive anti-inflammatory; may reduce pharmaceutical NSAID need under medical supervision',
      'Antidiabetic medications — theoretical mild glycaemic modulation; monitor glucose',
    ],
    herb_interactions: [
      'Synergy: Turmeric, Ginger, Boswellia, Devil\'s Claw',
      'Caution: anticoagulant herbs with Warfarin (additive — monitor INR)',
      'Drug interactions: anticoagulants (monitor INR), NSAIDs (additive — consult prescriber), aspirin (additive)',
    ],
    dosage_range:
      'Decoction (OPTIMAL — water extracts salicylates well): 1–3 g dried inner bark simmered 10–15 minutes, 1–3× daily. Tincture (fresh bark): 20–40 drops, 1–3× daily. Standardised extract (when available — most reliable): 500–1500 mg standardised to salicylate content, 1–2× daily. With meals (additional GI protection; improves tolerance). Onset: 1–2 weeks for initial benefit; cumulative baseline decrease over 2–4 weeks. Safe indefinite long-term use for chronic pain management.',
    spiritual_layer:
      'Willow Bark is ancient healing medicine — the original aspirin that humanity reached for across every continent where willows grow, long before anyone understood why. She grows beside water, her branches bending without breaking in the strongest wind, teaching that flexibility is strength and that yielding to what moves us is not weakness. The Willow has always been associated with grief, emotion, deep feeling — and it is fitting that her pain-relieving gift comes from her bark, her outer protective layer. She teaches: pain is a message, not a permanent sentence; your body knows how to communicate and how to heal; gentleness applied consistently is more powerful than force. She whispers: My pain eases. My body heals. I am gentle with myself. I am supported. I am whole. I am comfortable. I am well.',
    best_preparation:
      'Decoction is superior to infusion (simmering 10–15 minutes extracts salicylates better than steeping). The stomach-protective advantage over synthetic aspirin is the defining clinical message — educate clearly. For anti-inflammatory triple: Willow Bark decoction plus Turmeric Golden Milk plus Ginger tea across the day. Screen for aspirin/salicylate sensitivity, anticoagulants (monitor INR), surgery (discontinue 2 weeks pre-op) and pregnancy. Onset education critical: 1–2 weeks minimum, 2–4 weeks for full baseline effect.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B pain relief (salicylate mechanism confirmed; RCTs comparable to aspirin). Grade B anti-inflammatory. Grade A safety (2000+ years; GI-protective tannins advantage over synthetic aspirin). CAUTION: salicylate allergy (discontinue if reaction), anticoagulants (monitor INR), surgery (discontinue 2 weeks pre-op), pregnancy (consult). Onset: 1–2 weeks minimum. GI-protective advantage is the key clinical differentiator from synthetic aspirin.',
  },

  // ─────────────────────────────────────────────
  // WORMWOOD
  // ─────────────────────────────────────────────
  {
    id: 293,
    name: 'Wormwood',
    botanical: 'Artemisia absinthium (aerial parts — leaves and flowering tops; "Grand Wormwood")',
    tcm_meridians: ['Liver', 'Gallbladder', 'Stomach', 'Large Intestine'],
    tcm_element: 'Wood',
    energetics: ['Cool', 'Dry', 'Very Bitter', 'Stimulating Detoxification', 'Parasite-Expelling', 'Boundary-Setting', 'Fierce Purifier'],
    primary_functions: [
      'Potent antiparasitic — thujone (α and β; 0.3–1.5% dried herb) plus absinthin (sesquiterpene lactone; 0.2–0.8%) immobilise and expel roundworms, tapeworms and intestinal parasites via cell membrane disruption and metabolic enzyme inhibition; centuries of empirical effectiveness',
      'Broad-spectrum antimicrobial — thymol-like bactericidal and fungicidal activity against E. coli, Staphylococcus, Candida and others; dysbiosis adjunct',
      'Intense digestive bitters — absinthin is one of the most intensely bitter compounds in the plant kingdom; bitter receptor cascade triggers HCl, pepsin, bile and pancreatic enzyme release; powerful digestive activation and appetite stimulation',
      'Liver choleretic and bile movement — sesquiterpene lactones stimulate bile production and flow; move stagnant bile; support liver detoxification pathways',
      'NEUROTOXIC RISK (thujone) — thujone crosses BBB at high doses; convulsant at excessive concentrations; absinthe liqueur toxicity from alcohol-enhanced CNS penetration; MANDATES strict short-term protocols and absolute contraindication screening',
    ],
    secondary_benefits: [
      'Anti-inflammatory secondary — azulene (0.1–0.3%) reduces TNF-α and IL-6; anti-inflammatory support alongside primary antiparasitic action',
      'Traditional antiparasitic trio backbone — pairs with Black Walnut Hull and Clove for the classical three-herb antiparasitic protocol',
      'STRICTLY a short-term protocol herb — maximum 2–4 weeks per cycle with mandatory breaks; not for indefinite or casual use',
      'Fierce boundary-setting spiritual teaching — teaches that some things must be removed cleanly, without negotiation',
    ],
    pharmacology:
      'Primary bioactives: thujone (α and β isomers; 0.3–1.5% dried herb; 50%+ in essential oil — antiparasitic + antimicrobial + CONVULSANT at high doses; crosses BBB; neurotoxic potential; the primary safety concern; limits all dosing and duration), absinthin (sesquiterpene lactone; 0.2–0.8% — PRIMARY antiparasitic; intensely bitter digestive stimulant; antimicrobial), azulene (0.1–0.3%; anti-inflammatory; reduces TNF-α and IL-6), flavonoids (minor antioxidant). CRITICAL: thujone = neurotoxin at high doses; whole herb therapeutic dosing (0.3–1.5% thujone in dried herb at standard doses) is short-term safe; ESSENTIAL OIL is contraindicated internally. Grade B+ antiparasitic (traditional evidence; mechanism confirmed; limited RCTs); Grade B antimicrobial; Grade B digestive bitters; Grade A neurotoxicity concern (convulsant mechanism confirmed; seizure risk at excess).',
    flavor_profile: 'Intensely and distinctively bitter — the defining bitterness of absinthe; always in small quantities',
    contraindications: [
      'Pregnancy — ABSOLUTELY CONTRAINDICATED: thujone is uterine stimulant (emmenagogue) and potentially neurotoxic to the developing fetus; miscarriage and fetal CNS damage risk; HARD BLOCK all trimesters',
      'Breastfeeding — ABSOLUTELY AVOID: thujone present in breast milk; infant convulsion risk',
      'Seizure disorders or epilepsy — ABSOLUTELY CONTRAINDICATED: thujone is a documented convulsant; crosses BBB; HARD BLOCK',
      'Anticonvulsant medications — AVOID: thujone may reduce anticonvulsant drug efficacy; seizure breakthrough risk',
      'Kidney disease — AVOID: thujone nephrotoxic at significant doses; contraindicated if kidney function compromised',
      'Liver disease — CAUTION: intense bitter plus hepatotoxic potential at high doses; monitor if liver dysfunction',
      'Long-term use beyond protocol limits — LIKELY UNSAFE: maximum 2–4 weeks per cycle; mandatory 1–2 week breaks; maximum 3 cycles per year; thujone accumulation risk',
      'Essential oil internal use — ABSOLUTE BLOCK: concentrated thujone; life-threatening neurotoxicity',
    ],
    herb_to_herb_synergy: [
      'Black Walnut Hull and Clove — classical antiparasitic trio; synergistic triple mechanism; allows LOWER individual doses of each herb (reduces toxicity risk while maintaining efficacy)',
      'Berberine herbs (Oregon Grape, Goldenseal) — comprehensive antimicrobial and antiparasitic protocol adjunct',
    ],
    herb_to_herb_caution: [
      'Other thujone-rich herbs (Mugwort, Sage at high dose, Tansy) — CUMULATIVE THUJONE TOXICITY: convulsant risk; NEVER combine with other high-thujone herbs',
      'Hepatotoxic herbs at high combined doses — cumulative liver stress; avoid stacking',
    ],
    herb_to_drug_interactions: [
      'Anticonvulsants — thujone may reduce drug efficacy; seizure breakthrough risk; AVOID',
      'Anticoagulants — theoretical mild additive; monitor',
    ],
    herb_interactions: [
      'Synergy: Black Walnut Hull, Clove (antiparasitic trio — reduces individual doses safely), Berberine herbs',
      'Caution: other thujone-rich herbs (CUMULATIVE CONVULSANT RISK — NEVER combine); hepatotoxic herbs',
      'Drug interactions: anticonvulsants (seizure risk — AVOID), anticoagulants (theoretical — monitor)',
    ],
    dosage_range:
      'Tea/infusion (GENTLEST): 0.5–1 tsp dried herb steeped 10–15 minutes, 1–2× BEFORE meals (intensely bitter; pre-meal optimal). Tincture (1:5 alcohol; START LOW): 10–20 drops, 2–3× daily. PARASITE PROTOCOL (INTENSIVE): 20–40 drops tincture 3× daily for 2 weeks, then MANDATORY 1–2 week break; repeat 2–3 cycles maximum. ALWAYS use in antiparasitic trio (Black Walnut + Clove + Wormwood) — reduces individual herb dose and toxicity risk. MAXIMUM 3 cycles per year. ABSOLUTELY NOT for casual or indefinite use.',
    spiritual_layer:
      'Wormwood is the fierce protector — her very name tells her story: werm (worm), the ancient antiparasitic function that defined her role for every culture that knew her. She is sharp, bitter, uncompromising — the herb that removes what does not belong, that sets boundaries without apology, that teaches that fierce protection is compatible with wisdom. She grew around the graves of warriors and in the wormwood forests of Central Asia; she was the secret of absinthe and the nightmare of excess. Her teaching is precision: she is most powerful when used exactly, for exactly as long as needed, then set aside. She whispers: I am protected. My boundaries are clear and firm. I remove invaders. I stand strong. I trust my fierce wisdom. I am safe.',
    best_preparation:
      'ALWAYS use in the antiparasitic trio (Black Walnut Hull 20 drops + Clove 10 drops + Wormwood 20 drops, 3× daily) — this synergistic combination allows lower individual doses while maintaining efficacy, meaningfully reducing neurotoxicity risk. MANDATORY screening: pregnancy (HARD BLOCK — ask first), seizure disorders (HARD BLOCK), anticonvulsant medications (AVOID), kidney disease (AVOID). Duration enforcement: 2 weeks on, 1–2 weeks off, maximum 3 cycles per year — non-negotiable. Safer antimicrobial alternatives exist for most situations (Oregano, Garlic, Thyme, Berberine); Wormwood is reserved for confirmed or suspected parasitic infection when safer options are insufficient.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade B+ antiparasitic (traditional evidence; mechanism confirmed). Grade A neurotoxicity concern (convulsant; seizure risk — well documented). ABSOLUTE CONTRAINDICATIONS: pregnancy (HARD BLOCK — abortifacient and fetotoxic), seizure disorders (HARD BLOCK — convulsant), anticonvulsants (avoid). MAXIMUM 2–4 weeks per cycle; mandatory breaks; maximum 3 cycles per year. Always use in antiparasitic trio to reduce individual herb dose. Not for casual consumer recommendation — practitioner mode required.',
  },

  // ─────────────────────────────────────────────
  // YARROW
  // ─────────────────────────────────────────────
  {
    id: 294,
    name: 'Yarrow',
    botanical: 'Achillea millefolium (aerial parts — leaves and flowering tops — "Soldier\'s Woundwort")',
    tcm_meridians: ['Liver', 'Spleen', 'Lung', 'Kidney'],
    tcm_element: 'Metal + Wood + Earth',
    energetics: ['Warm', 'Bitter', 'Pungent', 'Drying', 'Astringent', 'Dispersing', 'Circulatory', 'Diaphoretic'],
    primary_functions: [
      'Haemostatic and wound healing — astringent tannins plus local vasoconstriction and anti-inflammatory effects stop minor bleeding and accelerate wound repair; fresh-crushed leaf or powdered dry herb applied directly to cuts, scrapes and nosebleeds; the legendary battlefield herb of Achilles',
      'Diaphoretic and fever management — promotes sweating and peripheral circulation when taken hot; assists the body\'s natural febrile response in early-stage colds and flu; classically combined with Elderflower and Peppermint',
      'Circulatory and menstrual regulation — regulates blood flow bidirectionally: moves stagnant blood in dysmenorrhoea and pelvic congestion while also helping to moderate heavy menses in context-specific ways',
      'Digestive bitter and carminative — stimulates appetite, bile flow and fat digestion; relieves spasmodic GI discomfort, cramping and gas',
      'Urinary antimicrobial and diuretic — broad-spectrum antimicrobial volatile oils; mild diuretic; used in urinary tract combination formulas for infections and prostatitis',
    ],
    secondary_benefits: [
      'Anti-inflammatory and antispasmodic — spasmolytic action on smooth muscle (GI and uterine) and flavonoid anti-inflammatory reduce cramps and pain',
      'Energetic shielding for sensitives and empaths — traditional use as energetic boundary herb; prevents "bleeding out" of energy; warrior-healer archetype',
      'Named for Achilles — Greek mythological warrior-healer who used yarrow to treat soldiers\' wounds; 2000+ years of continuous cross-cultural wound-care use',
      'Immune support in acute respiratory infections — diaphoretic function supports appropriate febrile immune response',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (chamazulene in some chemotypes — anti-inflammatory; spasmolytic; antimicrobial; cineole, borneol, camphor), sesquiterpene lactones (achillin and related — bitter; anti-inflammatory; immunomodulatory), flavonoids and phenolics (anti-inflammatory; antioxidant; spasmolytic), tannins (astringent; haemostatic; wound-healing contribution). Grade B+ haemostatic and wound healing; Grade B+ anti-inflammatory and antispasmodic; Grade B digestive and hepatic support; Grade B+ safety for short-term use (widespread use; well-characterised cautions). CAUTION: Asteraceae allergy; pregnancy (uterine-stimulating emmenagogue potential).',
    flavor_profile: 'Aromatic, pungent, slightly bitter and characteristic — pleasantly herbaceous with camphoraceous undertones',
    contraindications: [
      'Pregnancy — AVOID: uterine-stimulating and emmenagogue potential; may increase miscarriage risk; HARD BLOCK',
      'Asteraceae allergy (ragweed, chamomile, yarrow family) — AVOID: risk of allergic reactions including dermatitis or systemic reactions; ask before recommending',
      'Photosensitivity — rarely contributes to photosensitisation in sensitive individuals; monitor sun exposure',
      'Serious bleeding conditions or anticoagulant use — theoretical caution with haemostatic and vascular effects (evidence limited but relevant at high doses)',
    ],
    herb_to_herb_synergy: [
      'Elderflower and Peppermint — classic diaphoretic fever formula; three-herb acute cold and flu protocol; always serve hot',
      'Shepherd\'s Purse and Raspberry Leaf — heavy menstrual bleeding and spasmodic dysmenorrhoea formula',
      'Plantain leaf — wound wash and urinary/respiratory anti-inflammatory; complementary boundary medicine',
      'Cramp Bark and Skullcap — comprehensive menstrual tension and antispasmodic formula for tense constitutions',
    ],
    herb_to_herb_caution: [
      'Other Asteraceae herbs in allergy-prone individuals — always screen Asteraceae allergy before combining Yarrow with Chamomile, Calendula or Echinacea',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants — theoretical caution (haemostatic and vascular effects); evidence limited; monitor if on Warfarin',
      'Antihypertensives — mild diuretic and circulatory effects; monitor if on BP medications at high doses',
    ],
    herb_interactions: [
      'Synergy: Elderflower, Peppermint (fever), Shepherd\'s Purse, Raspberry Leaf (heavy menses), Plantain, Cramp Bark, Skullcap',
      'Caution: Asteraceae herbs in allergy-prone individuals (screen first)',
      'Drug interactions: anticoagulants (theoretical — monitor), antihypertensives (monitor at high doses)',
    ],
    dosage_range:
      'Tea/infusion: 1–2 tsp dried herb per 250 ml boiling water, steeped 10–15 minutes; 1–3× daily for digestion and circulation; 3–5× daily (served HOT) for acute fever and diaphoretic effect. Tincture (1:5 in 40–60% alcohol): 2–4 ml, 2–3× daily; 1–2 ml every 1–3 hours for acute fever. Topical: fresh crushed leaves applied directly to wound or cut; strong infusion as wound wash or sitz bath. Duration: acute fever — days; digestive and menstrual — weeks to months with breaks.',
    spiritual_layer:
      'Yarrow is named for Achilles — the warrior who was invulnerable everywhere except his heel, who knew how to fight but not how to be vulnerable in the right places. She is boundary and bridge simultaneously: she knows when to stop the bleeding (literal and emotional) and when to open channels so stagnation cannot calcify. She is the energetic shield of the empath, the boundary-keeper for those who need to learn where they end and others begin. In her warrior-healer teaching she holds both courage and care — she teaches that we can stand and mend, that strength includes the wisdom to be tender with what is genuinely wounded. She whispers: My boundaries are clear. I hold what is mine and release what is not. I am protected and free.',
    best_preparation:
      'Hot tea is the superior preparation for diaphoretic and acute fever use — always serve hot; the heat amplifies the diaphoretic action. Fresh crushed leaves for first-aid wound care are incomparable. Always screen Asteraceae allergy and pregnancy before recommending. Classic cold/flu tea: Yarrow + Elderflower + Peppermint, 3–5 cups served hot at onset of infection. Menstrual formula: Yarrow + Shepherd\'s Purse + Raspberry Leaf for heavy or spasmodic menses.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ haemostatic and wound healing. Grade B+ anti-inflammatory and antispasmodic. Grade B digestive and hepatic support. Grade B+ safety for short-term use. HARD BLOCK: pregnancy (uterine-stimulating emmenagogue). Screen Asteraceae allergy. Acute fever: serve HOT 3–5× daily. Diaphoretic trio (Yarrow + Elderflower + Peppermint) is the defining preparation.',
  },

  // ─────────────────────────────────────────────
  // YELLOW DOCK ROOT
  // ─────────────────────────────────────────────
  {
    id: 295,
    name: 'Yellow Dock Root',
    botanical: 'Rumex crispus (root — "Iron Bitter of the Hedgerow")',
    tcm_meridians: ['Liver', 'Large Intestine', 'Spleen'],
    tcm_element: 'Wood + Earth',
    energetics: ['Cool to Neutral', 'Bitter', 'Astringent', 'Hepatic', 'Mild Laxative', 'Iron-Supportive'],
    primary_functions: [
      'Digestive bitter and hepatic stimulant — bitter anthraquinone and tannin complex stimulates bile flow, supports liver function and improves fat digestion; classic sluggish-liver bitter for poor appetite and digestive congestion',
      'Mild stimulant laxative (short-term) — anthraquinones (emodin, chrysophanol) increase colonic motility and secretion; useful for short-term constipation correction especially in iron-supplementation protocols that cause constipation as a side effect',
      'Iron-supportive mineral herb — significant iron content in bioavailable forms; traditionally combined with Nettle and vitamin C for anaemia and iron-deficiency support; works best as part of a comprehensive dietary iron protocol',
      'Skin and lymphatic clearing — liver-stimulating action supports clearance of inflammatory skin conditions linked to sluggish liver and bowel; traditional blood-cleansing role',
    ],
    secondary_benefits: [
      'Tannin astringent action — provides mild mucosal protection and antimicrobial contribution alongside the stimulant-laxative effect',
      'Short-course constipation reset — best used in time-limited phases with clear goals rather than as a daily long-term tonic',
      'Combination herb in women\'s iron support — pairs with Nettle and Raspberry Leaf for nutritive iron-building protocols for heavy menstrual bleeding or pregnancy anaemia',
      'Traditional blood-purifying bitter — Victorian and Edwardian spring cleanse herb; still useful as a short-course hepatic activator',
    ],
    pharmacology:
      'Primary bioactives: anthraquinones (emodin, chrysophanol — stimulant laxative via colonic motility increase; antiparasitic; anti-inflammatory; PRIMARY driver of laxative action), oxalates (SIGNIFICANT: can bind calcium; contribute to kidney stone risk and kidney damage at high intake; animal toxicity documented at excess), tannins (astringent; antimicrobial; provide moderate mucosal protection), iron and other minerals (bioavailable forms; traditional iron-support use). SAFETY: NOT for long-term continuous use (anthraquinone dependence; oxalate accumulation; electrolyte loss via prolonged stimulant laxative action). Grade C+ digestive bitter and iron support (traditional plus mechanistic; limited direct RCTs); Grade B safety for short-term courses; Grade D safety for long-term high-dose use.',
    flavor_profile: 'Bitter and astringent — characteristic earthy dock root bitterness; typically taken as tincture or capsule',
    contraindications: [
      'Pregnancy — AVOID: anthraquinone laxatives stimulate uterine smooth muscle; miscarriage risk',
      'Kidney stones or kidney disease — AVOID: significant oxalate content can worsen kidney stone formation or damage renal function; hard stop',
      'IBD flares, haemorrhoids or anal fissures — AVOID: stimulant laxative aggravates active bowel inflammation',
      'Long-term daily use — AVOID: anthraquinone laxative dependence; electrolyte loss; oxalate accumulation; designed for short courses only',
      'Hypokalaemia or electrolyte imbalance — CAUTION: prolonged use increases potassium loss; dangerous if already depleted',
    ],
    herb_to_herb_synergy: [
      'Nettle leaf and Raspberry Leaf — iron-building nutritive trio for anaemia, heavy menses and pregnancy support',
      'Dandelion root and Artichoke — comprehensive liver bitter formula; Yellow Dock adds mild laxative component to otherwise gentle hepatics',
      'Vitamin C-rich foods or Rosa Canina — iron absorption enhancement; always pair iron support with vitamin C',
    ],
    herb_to_herb_caution: [
      'Other stimulant laxatives (Senna, Cascara, Rhubarb root) — ADDITIVE: increased risk of cramping, diarrhoea and electrolyte imbalance; avoid combining',
    ],
    herb_to_drug_interactions: [
      'Diuretics (especially thiazides) — additive potassium loss; MONITOR electrolytes',
      'Other stimulant laxatives or laxative medications — additive cramping and fluid/electrolyte loss; avoid combining',
      'Iron supplements — complementary; monitor total iron intake to avoid excess',
    ],
    herb_interactions: [
      'Synergy: Nettle, Raspberry Leaf (iron trio), Dandelion root, Artichoke (liver), vitamin C sources (iron absorption)',
      'Caution: other stimulant laxatives (additive — avoid combining)',
      'Drug interactions: thiazide diuretics (potassium loss — monitor electrolytes), stimulant laxative medications (additive — avoid)',
    ],
    dosage_range:
      'Decoction: 1–2 g root in 250 ml water, simmered 10–15 minutes, 1–3× daily for short courses only. Tincture (1:5): 1–4 ml, 1–3× daily. Duration: SHORT COURSES ONLY — use in time-limited phases (1–3 weeks) with clear therapeutic goals (constipation reset, iron support phase); then reassess and discontinue or rotate. NOT for daily chronic long-term use.',
    spiritual_layer:
      'Yellow Dock is the iron bitter of the hedgerow — the plant that pushes its deep taproot through the hardest, most compacted soil to pull up iron and minerals that surface-feeding plants cannot reach. She teaches that depth of nourishment sometimes requires bitterness, that the most necessary work is not always the most comfortable, that sluggish systems sometimes need a strong, temporary stimulus before they remember how to move on their own. She is the short-term clearing teacher — not the long gentle tonic but the precise, brief intervention that restores function so the body can take over again. She whispers: I move what has stagnated. I clear briefly and precisely. I restore function so life can flow again. I nourish from depth.',
    best_preparation:
      'Position as a SHORT-COURSE SECONDARY herb, not a core long-term tonic. Primary uses: 1–3 week constipation reset during iron supplementation, or as part of a women\'s iron-building protocol with Nettle and Raspberry Leaf. Always combine with Vitamin C foods for iron absorption. MANDATORY screening: pregnancy (AVOID), kidney stones or kidney disease (HARD STOP), IBD flares (avoid), thiazide diuretics (monitor electrolytes). Always specify duration limits clearly and explain why long-term use is contraindicated.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade C+ digestive bitter and iron support (traditional plus mechanistic; limited RCTs). Grade B safety for SHORT courses only. NOT for long-term continuous use (anthraquinone dependence; oxalate accumulation). AVOID: pregnancy (uterine stimulant); kidney stones/disease (oxalate risk); IBD active flares. Screen thiazide diuretics (potassium loss). Secondary herb in defined short courses — not a primary long-term tonic.',
  },

  // ─────────────────────────────────────────────
  // YERBA MATE
  // ─────────────────────────────────────────────
  {
    id: 296,
    name: 'Yerba Mate',
    botanical: 'Ilex paraguariensis (leaves — "The Social Energy of South America")',
    tcm_meridians: ['Heart', 'Liver', 'Spleen'],
    tcm_element: 'Fire + Earth',
    energetics: ['Warm', 'Dry', 'Moderately Stimulating', 'Consciousness-Enhancing', 'Social-Ease-Promoting', 'Metabolic-Supporting'],
    primary_functions: [
      'Balanced sustained energy without jitteriness — caffeine (0.7–1.7% by dry weight; MODERATE — lower than coffee at 1–2%; higher than green tea at 0.5–1%) blocks adenosine receptors and increases dopamine and norepinephrine; produces strong energy without the excessive jitteriness or crash common to higher-caffeine sources',
      'Mental clarity and cognitive stamina — caffeine plus polyphenols (chlorogenic acid 2–4%) enhance prefrontal cortex function; focus, working memory and sustained attention; unique social confidence and presence dimension from traditional shared use',
      'Antioxidant defence and metabolic support — polyphenols provide free-radical scavenging and modest fat oxidation (metabolic support for energy metabolism); theobromine and theophylline (trace xanthines) contribute additional mild stimulation and mood lift',
      'Unique social ease and community dimension — the only major stimulant herb with a deeply encoded traditional ceremonial sharing practice (mate gourd and bombilla); social confidence, conversational ease and group connection are documented traditional uses',
      'Mild adaptogenic stress support — trace saponins provide mild adaptogenic properties; sustainable energy without crash; not crash-prone unlike pure caffeine',
    ],
    secondary_benefits: [
      'Daily sustainable stimulant — lower caffeine than coffee creates gentler tolerance curve; daily use safe long-term without severe dependence cycle',
      'Safer stimulant for caffeine-sensitive individuals — positioned between green tea (gentle) and coffee (strong); often well tolerated by those who cannot handle coffee',
      'Weight management adjunct (secondary) — polyphenols plus theobromine support fat oxidation and metabolic rate; traditionally used by hunters for sustained physical energy',
      '1000+ years Guaraní indigenous use — Paraguay, Argentina, Brazil; one of South America\'s most culturally significant plants',
    ],
    pharmacology:
      'Primary bioactives: caffeine (0.7–1.7% by dry weight; PRIMARY CNS stimulant; adenosine receptor antagonism; dopamine and norepinephrine increase; moderate level — balanced energy without excessive jitteriness), polyphenols (chlorogenic acid 2–4%; antioxidant; neuroprotective; metabolism support; anti-inflammatory), theobromine and theophylline (trace xanthine alkaloids; additional mild stimulation; mood elevation; bronchial support), saponins (trace; mild adaptogenic properties; stress support), volatile aromatic compounds (social and pleasure compounds; slightly smoky from traditional roasting). Grade A energy and mental clarity (caffeine mechanism confirmed; extensive evidence); Grade B antioxidant (polyphenol mechanism confirmed); Grade C+ metabolic support; Grade A safety (1000+ years traditional use; well-tolerated; safer than high-caffeine alternatives).',
    flavor_profile: 'Distinctive herbal, slightly smoky, grassy and mildly bitter — characteristic South American flavour; earthy and complex; culturally rich',
    contraindications: [
      'Evening use — AVOID: moderate caffeine disrupts sleep; morning to afternoon only; less severe than coffee but still relevant',
      'Insomnia — morning only; not recommended for those with active sleep disorders',
      'Anxiety disorders — MONITOR: lower caffeine than coffee = less anxiety trigger; usually tolerable; monitor individual response',
      'Cardiac arrhythmia — CAUTION: caffeine may trigger arrhythmias in susceptible individuals; consult cardiologist',
      'Uncontrolled high blood pressure — MONITOR: mild stimulant effects; generally safer than high-caffeine alternatives; consult prescriber if hypertensive',
      'Pregnancy — CAUTION: moderate caffeine; consult prenatal provider; generally minimise caffeine intake in pregnancy; likely safer than coffee at standard doses',
      'Breastfeeding — CAUTION: caffeine transfers to breast milk; monitor infant response; generally safe at moderate consumption',
    ],
    herb_to_herb_synergy: [
      'Ginseng — adaptogenic energy plus caffeine stimulation; sustained energy stack without crash',
      'Rhodiola — afternoon energy and stress resilience combination (Rhodiola morning, Yerba Mate midday)',
      'Cacao — complementary methylxanthine pleasure-energy pairing; traditional South American dual combination',
      'Lemon Balm — stimulation balanced with calming nervine; focus with parasympathetic underpinning',
    ],
    herb_to_herb_caution: [
      'Other high-caffeine herbs (Guarana, Green Tea extract, Guayusa) — additive caffeine; risk of excessive stimulation; monitor total caffeine load',
      'MAOIs (pharmaceutical or herbal) — caffeine interactions; monitor',
    ],
    herb_to_drug_interactions: [
      'Stimulant medications (Ritalin, Adderall, ephedrine) — additive stimulation; monitor for overstimulation',
      'Antihypertensives — mild caffeine BP elevation; monitor if on BP medications',
      'MAOIs — caffeine and MAOI interactions; caution',
      'Anticoagulants — very minor theoretical effect; generally safe',
    ],
    herb_interactions: [
      'Synergy: Ginseng, Rhodiola, Cacao, Lemon Balm',
      'Caution: other high-caffeine herbs (monitor total caffeine), MAOIs (monitor)',
      'Drug interactions: stimulant medications (additive — monitor), antihypertensives (monitor BP), MAOIs (caution)',
    ],
    dosage_range:
      'Traditional mate gourd (CEREMONIAL — optimal cultural experience): dried leaves steeped in hot water via gourd and bombilla; 1–2 servings daily, shared. Dried leaf infusion: 2–4 g steeped 5–10 minutes, 1–2× daily. Tea: 1–2 tsp in hot water daily. Powder: 1–2 tsp in water or milk, 1× daily. MORNING TO AFTERNOON ONLY (stimulating — not evening). 1–2× daily; daily use safe long-term (lower caffeine than coffee — gentler tolerance). The mate gourd ritual has therapeutic value beyond the herb itself — the ceremony, the sharing and the slowing-down are part of the medicine.',
    spiritual_layer:
      'Yerba Mate carries South American community wisdom — the understanding that energy shared in community is fundamentally different from energy consumed alone. The mate gourd passes from hand to hand and nobody fills their own cup; the host pours for each guest. This is the radical teaching: that wakefulness, presence and vitality are communal experiences, that consciousness elevated together creates something no individual cup of coffee can. She teaches that stimulation is not just a personal pharmacological event but a social one — that being awake and present for others is its own form of nourishment. She whispers: I am energized. I am present. I am connected. I am clear. I am awake. I am social. I am vital. I am whole.',
    best_preparation:
      'Traditional mate gourd preparation for the full social and cultural dimension — this is an experience, not just a beverage. For clinical use: 2–4 g infusion 1–2× daily, morning to afternoon. For sensitive caffeine responders: start with 1–2 g (lower dose) and assess tolerance. MORNING TO AFTERNOON ONLY — non-negotiable. Screen for anxiety (monitor), cardiac arrhythmia (consult cardiologist), uncontrolled hypertension (consult prescriber) and pregnancy (minimise). The social ritual value enhances compliance and experience.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A energy and mental clarity (caffeine mechanism; extensive evidence). Grade B antioxidant (polyphenol confirmed). Grade A safety (1000+ years traditional use; safer than high-caffeine alternatives). MORNING TO AFTERNOON ONLY (stimulating). Lower caffeine than coffee = balanced energy without excessive jitteriness; safer for sensitive individuals. Screen anxiety (monitor), cardiac arrhythmia (consult cardiologist), hypertension (monitor), pregnancy (minimise caffeine). Social and ceremonial dimension is part of the therapeutic value.',
  },

  // ─────────────────────────────────────────────
  // SLIPPERY ELM BARK
  // ─────────────────────────────────────────────
  {
    id: 297,
    name: 'Slippery Elm Bark',
    botanical: 'Ulmus rubra (inner bark — "The Healing Bark of the Red Elm")',
    tcm_meridians: ['Lung', 'Stomach', 'Large Intestine'],
    tcm_element: 'Earth + Metal',
    energetics: ['Cool', 'Moist', 'Demulcent', 'Soothing', 'Nutritive', 'Protective'],
    primary_functions: [
      'Mucilaginous GI demulcent — rich mucilaginous polysaccharides coat and protect irritated mucosa throughout the gastrointestinal tract from oesophagus to large intestine; physical barrier protection against acid, inflammation and irritation; first choice for GERD, oesophagitis, gastritis and IBD flares',
      'Respiratory demulcent and throat soother — mucilage coats and soothes irritated throat and upper respiratory mucosa; immediate symptom relief for sore throat, dry cough and laryngitis',
      'IBD flare soothing — observational and case data show symptom relief in IBD (Crohn\'s and ulcerative colitis); mucilage reduces mucosal irritation and may support healing in inflamed bowel',
      'Urinary tract soothing — mucilage extends protective action to urinary mucosa; relieves burning irritation in UTI and urethritis as an adjunct (not antimicrobial)',
      'Diarrhoea management — mucilage absorbs excess fluid and provides bulk; gentle normalisation of loose stools',
    ],
    secondary_benefits: [
      'FDA GRAS status for oral use — one of the most broadly recognised safe traditional herbs; excellent safety profile',
      'Nutritive and soothing during recovery — traditional use during convalescence when solid food is difficult; mucilage is mildly nutritive and easy to digest',
      'Powder form versatility — easily made into porridge, slurry or lozenges; multiple preparation options for different conditions',
      'CAUTION: reduces absorption of all medications and supplements if taken simultaneously — always separate by at least 2 hours',
    ],
    pharmacology:
      'Primary bioactives: mucilaginous polysaccharides (HIGH CONTENT — the defining and primary therapeutic constituent; coat and protect mucosa of GI, respiratory and urinary tracts; form physical protective barrier; anti-inflammatory via mucosal protection; mild immune-modulating), tannins (minor astringent contribution; mild mucosal toning), trace minerals and nutrients (mildly nutritive). PREPARATION: always take in cold or warm water as a slurry; hot water reduces mucilage viscosity. CRITICAL SAFETY NOTE: mucilage coats GI tract and reduces absorption of medications and supplements — minimum 2 hour separation from all medications mandatory. Pregnancy: conservative sources advise avoidance (folkloric abortifacient reputation from cervical use; oral therapeutic use appears safe in modern assessment but insufficient data for concentrated supplements). Grade B+ demulcent and mucosal soothing (mechanism confirmed; traditional evidence extensive; limited formal RCTs); Grade A safety for oral use (FDA GRAS).',
    flavor_profile: 'Mild, slightly sweet and mucilaginous — pleasant and food-like; easily mixed into water, porridge or warm drinks',
    contraindications: [
      'Pregnancy — CONSERVATIVE CAUTION: traditional abortifacient reputation from bark strips used cervically (historical context — NOT from oral use); most modern sources say oral use appears safe; however insufficient data for concentrated supplements; consult prenatal provider; culinary-level use likely safe',
      'Breastfeeding — insufficient safety data; likely safe at low doses; consult provider',
      'Children and infants under 2 — insufficient data; not recommended in concentrated supplement forms',
      'CRITICAL — Medication absorption: mucilage REDUCES ABSORPTION OF ALL MEDICATIONS AND SUPPLEMENTS; MANDATORY 2-hour separation from all pharmaceutical medications and supplements; failure to separate is a significant drug interaction',
    ],
    herb_to_herb_synergy: [
      'Marshmallow root — complementary mucilaginous demulcent pair; combined deeper mucosal protection of GI and respiratory tracts',
      'Licorice root — demulcent plus anti-inflammatory; DGL licorice and Slippery Elm for GERD and gastritis',
      'Calendula — anti-inflammatory plus mucilage; gut-healing combination for IBD support',
      'Goldenrod — Slippery Elm soothes urinary mucosa while Goldenrod flushes; complementary urinary protocol',
      'Plantain leaf — mucilaginous and anti-inflammatory duo for GI and respiratory healing',
    ],
    herb_to_herb_caution: [
      'All herbs taken simultaneously — mucilage reduces absorption of all co-administered substances; always take Slippery Elm 2 hours apart from any other herb or medication',
    ],
    herb_to_drug_interactions: [
      'ALL MEDICATIONS — CRITICAL: mucilaginous coating reduces GI absorption of all oral medications; MANDATORY 2-hour separation; this applies to every pharmaceutical without exception',
      'ALL SUPPLEMENTS — same mucilage coating effect; 2-hour separation applies',
    ],
    herb_interactions: [
      'Synergy: Marshmallow root, Licorice root (DGL), Calendula, Goldenrod, Plantain',
      'Caution: ALL herbs taken simultaneously (reduces absorption — always separate by 2 hours)',
      'Drug interactions: ALL ORAL MEDICATIONS (CRITICAL — mucilage reduces absorption; 2-hour separation mandatory)',
    ],
    dosage_range:
      'Cold or warm water slurry (OPTIMAL): 1–2 tsp powder stirred into 150–250 ml cool or warm (not hot) water; mix until viscous; drink 1–3× daily between meals for GERD, IBD and urinary soothing. Lozenges and throat preparations: as per product label for sore throat. Porridge: powder mixed into oatmeal or warm water porridge. TIMING: 30–60 minutes before meals OR 2+ hours after medications. Temperatures: cool or warm; hot water reduces mucilage viscosity and therapeutic effect. Safe long-term for chronic conditions when pregnancy is excluded and medications are separated.',
    spiritual_layer:
      'Slippery Elm is the great soother — she grows in the moist edges of forests, her inner bark holding a gentle intelligence that knows how to surround what is raw, inflamed and unprotected, and offer it the gift of softness. She does not fight inflammation; she envelops it in a layer of comfort that allows healing to happen beneath. She is the bark that sustained many during times of scarcity — ground into powder and stirred with water, she nourished and healed simultaneously. She teaches the value of protection before repair, of creating safety before demanding change, of surrounding the wounded place with gentleness rather than insisting it simply be stronger. She whispers: I soften what is raw. I protect what is healing. I coat the tender places with care. I allow healing to happen at its own pace.',
    best_preparation:
      'Cold or warm water slurry is the optimal preparation — never use boiling water (reduces mucilage). Take between meals and at minimum 2 hours from ALL medications (this instruction is the most important clinical detail). For GERD: 1 tsp slurry before meals and before bed. For sore throat: lozenges or powder dissolved in room-temperature water, gargled and swallowed slowly. For IBD flares: 1–2 tsp slurry 2–3× daily as an adjunct to medical treatment. Screen for pregnancy (conservative caution) and enforce medication separation strictly.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade B+ demulcent and mucosal soothing (mechanism confirmed; traditional evidence). FDA GRAS for oral use. CRITICAL DRUG INTERACTION: reduces absorption of ALL oral medications — 2-hour separation is non-negotiable and applies to every pharmaceutical. Conservative caution in pregnancy (folkloric history; oral use probably safe but insufficient concentrated-supplement data). Safe long-term for GI, respiratory and urinary mucosal soothing when medications are appropriately separated.',
  },
  // ─────────────────────────────────────────────
  // PEPPERMINT
  // ─────────────────────────────────────────────
  {
    id: 298,
    name: 'Peppermint',
    botanical: 'Mentha × piperita (leaf and essential oil — hybrid of M. aquatica × M. spicata)',
    tcm_meridians: ['Liver', 'Lung', 'Stomach', 'Large Intestine'],
    tcm_element: 'Metal + Wood',
    energetics: ['Cool', 'Aromatic', 'Drying', 'Antispasmodic', 'Carminative', 'Dispersing', 'Analgesic'],
    primary_functions: [
      'IBS and functional gut antispasmodic — L-menthol blocks smooth-muscle calcium channels; enteric-coated peppermint oil is the most evidence-supported herbal treatment for IBS; multiple RCTs and systematic reviews confirm significant improvement in global IBS symptoms and abdominal pain vs placebo',
      'Carminative and gas relief — volatile oil relaxes gastric and intestinal smooth muscle; rapidly reduces bloating, flatulence and intestinal cramping; one of the most effective natural carminatives',
      'Tension headache analgesic — topical menthol applied to forehead and temples produces cooling analgesia comparable to paracetamol in RCTs; inhibits serotonin receptors and stimulates cold-sensitive receptors',
      'Nasal decongestant — menthol stimulates cold receptors in nasal mucosa creating sensation of improved airflow; mild genuine mucosal decongestant activity in respiratory passages',
      'Antispasmodic for functional dyspepsia and biliary pain — smooth-muscle relaxation extends to biliary tree and oesophagus (benefit AND risk: may worsen GERD via lower oesophageal sphincter relaxation)',
    ],
    secondary_benefits: [
      'Mild analgesic and cooling for musculoskeletal pain — topical menthol applications for joint and muscle pain; counter-irritant mechanism',
      'Antimicrobial activity — menthol and other volatile oil components show broad-spectrum antimicrobial effects in vitro',
      'Mental alertness — inhalation of peppermint aroma shown to improve alertness, cognitive performance and exercise endurance in some studies',
      'Nausea relief — menthol provides mild antiemetic action; useful for post-operative and chemotherapy-adjacent nausea adjunct',
    ],
    pharmacology:
      'Primary bioactives: L-menthol (PRIMARY — 35–55% of volatile oil; calcium channel blockade in smooth muscle — antispasmodic; cold receptor (TRPM8) agonism — analgesic, cooling, decongestant; serotonin receptor modulation), menthone (15–20%; antimicrobial; cooling), cineole (3–8%; expectorant; antimicrobial), menthyl acetate and other esters (aromatic; carminative). CRITICAL PREPARATION DISTINCTION: enteric-coated oil capsules bypass stomach (avoiding reflux AEs) and deliver menthol to small intestine — SUPERIOR to plain capsules or tea for IBS; plain tea adequate for dyspepsia, nausea and upper GI. GERD RISK: menthol relaxes lower oesophageal sphincter — contraindicated in significant GERD or hiatal hernia. Grade B+ IBS antispasmodic (systematic reviews; multiple RCTs); Grade A safety at culinary doses; Grade B topical analgesia (tension headache RCTs).',
    flavor_profile: 'Intensely cool, clean and aromatic — the defining mint flavour; pleasantly refreshing and universally familiar',
    contraindications: [
      'Significant GERD or hiatal hernia — AVOID enteric-coated oil: menthol relaxes lower oesophageal sphincter; worsens reflux and heartburn; tea in small amounts may be acceptable but monitor',
      'Bile duct obstruction, gallstones or severe liver disease — AVOID peppermint oil (not tea): contraindicated for concentrated oil preparations; biliary tree relaxation may worsen obstruction',
      'Children under 8 — NEVER apply menthol near face or nostrils: risk of laryngospasm and bronchospasm; serious respiratory compromise documented',
      'Infants — ANY menthol application is contraindicated: life-threatening respiratory events',
      'Pregnancy and breastfeeding — culinary amounts (tea, cooking) are safe; medicinal concentrated oil use only short-term and with caution; insufficient safety data for extended concentrated use',
      'Achlorhydria or antacid use — non-enteric-coated peppermint oil dissolves in stomach; menthol released → heartburn and upper GI irritation',
    ],
    herb_to_herb_synergy: [
      'Fennel and Ginger — triple carminative antispasmodic for IBS, bloating and functional gut pain; excellent flavour combination',
      'Chamomile — dual antispasmodic and calming; nervous gut combination for stress-driven IBS',
      'Elderflower and Yarrow — classic diaphoretic fever formula served hot; peppermint adds decongestant and cooling dimension',
      'Lemon Balm — dual gut-calming and mood-lifting nervine; excellent for anxiety-driven GI symptoms',
    ],
    herb_to_herb_caution: [
      'Other volatile-oil-rich herbs at high combined doses — cumulative GI irritation potential if layering concentrated oils internally',
    ],
    herb_to_drug_interactions: [
      'Medications requiring gastric acid dissolution — enteric coating of peppermint oil may alter timing of drug release if taken simultaneously; separate by 2 hours',
      'CYP450 substrates — menthol inhibits certain CYP enzymes in vitro (CYP3A4, CYP1A2); clinically significant interactions not well documented at standard herbal doses; theoretical caution with narrow therapeutic index drugs',
      'Antacids — if taken together with non-enteric-coated peppermint oil, may dissolve capsule in stomach prematurely causing oesophageal menthol release and heartburn',
    ],
    herb_interactions: [
      'Synergy: Fennel, Ginger, Chamomile, Elderflower, Yarrow, Lemon Balm',
      'Caution: stacked concentrated volatile oils at high combined doses (GI irritation)',
      'Drug interactions: CYP3A4/1A2 substrates (theoretical — monitor; limited clinical significance at standard doses), antacids (timing — separate), enteric-coated medications (separate by 2 hours)',
    ],
    dosage_range:
      'Enteric-coated peppermint oil capsules (OPTIMAL for IBS — delivers menthol to small intestine): 0.08–0.2 ml oil per capsule, 1–2 capsules 2–3× daily before meals; enteric coating essential to prevent reflux. Tea/infusion (OPTIMAL for dyspepsia, nausea, headache, decongestant): 1.5–3 g dried leaf per 250 ml hot water, steeped 5–10 minutes, 1–3× daily. Topical (tension headache): 10% menthol in ethanol solution applied to forehead and temples; reapply after 15–30 minutes as needed. Duration: safe for ongoing use at culinary/tea doses; enteric-coated oil protocols typically 4–8 weeks then reassess.',
    spiritual_layer:
      'Peppermint is the great clarifier — she cuts through fog, heaviness and stagnation with cool precision. She is neither aggressive nor passive; she simply brings clarity where there was congestion, movement where there was stagnation, freshness where there was staleness. Her coolness teaches that not all healing requires heat — sometimes the most powerful act is to cool an overheated system, to release the grip of spasm with gentleness rather than force. She embodies the quality of clean discernment: the ability to distinguish what belongs and what should pass through. She whispers: I am clear. My thoughts are fresh. My belly is at ease. I release what grips me. I breathe freely. I move with ease.',
    best_preparation:
      'The preparation distinction is the most important clinical teaching point: enteric-coated capsules for IBS (bypasses stomach; delivers menthol to bowel); tea for upper GI complaints, nausea, headache and decongestant. Never use concentrated oil internally without enteric coating. CRITICAL screens: GERD or hiatal hernia (avoid or use only weak tea with caution); children under 8 (never apply menthol near face); gallstones or biliary obstruction (avoid concentrated oil). For tension headache: topical 10% menthol application is evidence-based and drug-free.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ IBS antispasmodic (enteric-coated oil; systematic reviews; multiple RCTs). Grade B topical analgesia for tension headache. Grade A safety at tea and culinary doses. CRITICAL: enteric coating mandatory for IBS use (plain capsules and tea cause reflux). HARD BLOCK: children under 8 for any menthol near face (laryngospasm). AVOID in significant GERD and biliary obstruction (concentrated oil). Culinary and tea use safe for all other populations.',
  },

  // ─────────────────────────────────────────────
  // PINE NEEDLES
  // ─────────────────────────────────────────────
  {
    id: 299,
    name: 'Pine Needles',
    botanical: 'Pinus sylvestris / Pinus strobus (needles — safe species only; NEVER yew or toxic conifers)',
    tcm_meridians: ['Lung', 'Kidney', 'Liver'],
    tcm_element: 'Metal + Water',
    energetics: ['Warming', 'Aromatic', 'Mildly Expectorant', 'Antimicrobial', 'Antioxidant', 'Forest-Grounding'],
    primary_functions: [
      'Respiratory support and mild decongestant — aromatic terpenes (α-pinene, β-pinene, limonene, bornyl acetate) act as mild expectorants and decongestants; vapour inhalation opens nasal passages and supports respiratory ease in colds and flu',
      'Antiviral adjunct — shikimic acid (precursor to oseltamivir/Tamiflu) present in notable amounts; terpenes show inhibitory effects against certain viruses in vitro; used as a complementary antiviral support during respiratory illness (NOT a standalone treatment)',
      'Antioxidant and vitamin C source — fresh needles contain vitamin C, flavonoids and polyphenol antioxidants; historical use as scurvy prevention; free-radical scavenging activity',
      'Anti-inflammatory — shikimic acid exhibits anti-inflammatory properties in models; may support reduction of upper respiratory inflammatory burden',
      'Forest-bathing in a cup — aromatic terpene profile provides mood-elevating, grounding and stress-reducing properties analogous to forest-bathing (shinrin-yoku); psychological and physiological benefit from aromatic exposure',
    ],
    secondary_benefits: [
      'Traditional indigenous use — Eastern and Northern indigenous traditions used pine needle tea for respiratory health, vitamin C supplementation and immune resilience through winter',
      'Steam inhalation option — needles simmered in hot water create terpene-rich steam; effective aromatic inhalation for nasal and bronchial congestion',
      'Minimal processing required — fresh or simply dried needles; accessible, sustainable and low-cost if correctly identified',
      'CRITICAL: species identification is non-negotiable — only safe Pinus species; yew (Taxus), ponderosa pine and certain other conifers are toxic',
    ],
    pharmacology:
      'Primary bioactives: shikimic acid (antiviral precursor; anti-inflammatory; notable but lower concentration than star anise), terpenes (α-pinene and β-pinene — aromatic expectorant and decongestant; antimicrobial; mood-elevating; limonene — uplifting; bornyl acetate — antimicrobial; calming), vitamin C (significant in fresh needles; reduced in dried), flavonoids and polyphenols (antioxidant; anti-inflammatory). SPECIES SAFETY CRITICAL: Pinus sylvestris (Scots Pine), Pinus strobus (Eastern White Pine) = safe. Pinus ponderosa (Ponderosa Pine) — animal abortion risk (cattle). Taxus spp. (Yew) — HIGHLY TOXIC, NOT A PINE. Evidence grade: Grade C antiviral and respiratory (mechanistic and in vitro; minimal human RCTs); Grade C+ traditional respiratory decongestant; Grade C+ pregnancy risk with certain species (animal data).',
    flavor_profile: 'Resinous, fresh and gently piney — pleasantly aromatic; reminiscent of forest air; mild and accessible as a tea',
    contraindications: [
      'Pregnancy and trying to conceive — AVOID: pine needles contain phytoestrogens; ponderosa pine needles linked to abortions in cattle (animal data); HARD BLOCK during pregnancy and pre-conception; evidence limited but precautionary avoidance is standard among herbalists',
      'Incorrect species — ABSOLUTE BLOCK: yew (Taxus spp.) is highly toxic and deadly; ponderosa pine is unsafe; ONLY use verified Pinus sylvestris or Pinus strobus; species must be confirmed before use',
      'Asthma or severe respiratory allergy — CAUTION: terpene-rich vapours can trigger bronchoconstriction in sensitive individuals; monitor response',
      'Kidney disease — CAUTION: high terpene intake may be irritating to renal tissue; keep doses modest; avoid concentrated preparations',
      'Children under 8 — CAUTION with aromatic steam inhalation: terpene exposure can be intense for young respiratory tracts; use diluted and with supervision',
    ],
    herb_to_herb_synergy: [
      'Elder flower and Peppermint — respiratory and antiviral tea combination; diaphoretic plus decongestant plus antiviral shikimic acid',
      'Thyme — dual antimicrobial respiratory combination; thymol plus pine terpenes; cough and infection support',
      'Rosemary — dual aromatic terpene-rich cognitive and respiratory support; forest-medicine pairing',
    ],
    herb_to_herb_caution: [
      'Other phytoestrogenic herbs in pregnancy-adjacent situations — cumulative theoretical effect; avoid in pregnancy regardless',
    ],
    herb_to_drug_interactions: [
      'No well-documented drug interactions at standard tea doses',
      'Theoretical nephrotoxic synergy — high terpene dose plus other nephrotoxic agents; use modest doses',
    ],
    herb_interactions: [
      'Synergy: Elderflower, Peppermint (respiratory antiviral tea), Thyme (antimicrobial), Rosemary (aromatic terpene)',
      'Caution: phytoestrogenic herbs in pregnancy-adjacent situations',
      'Drug interactions: None well documented; theoretical nephrotoxic synergy at high doses',
    ],
    dosage_range:
      'Tea: 1–2 tsp freshly chopped needles per 250 ml hot (NOT boiling — preserve vitamin C and terpenes) water; steep covered 10–20 minutes; 1–3 cups daily during acute respiratory illness. Steam inhalation: handful of needles in hot water; tent over bowl with towel; inhale 5–10 minutes; 1–2× daily. Duration: short-term during respiratory illness (days to 2 weeks); not for indefinite daily use. SPECIES VERIFICATION MANDATORY before any preparation.',
    spiritual_layer:
      'Pine Needles carry the quiet wisdom of ancient forests — the teaching that healing sometimes means returning to something older and simpler than ourselves. The pine stands through the harshest winters without losing its green, teaching perennial resilience, the keeping of life-colour through darkness. To drink pine needle tea is to take the forest inside: the resinous terpenes that calm the nervous system, the green that speaks of vitamin and light, the deep steadiness of a tree that has roots in bedrock. She whispers: I am rooted. I breathe deeply. I endure. I stay green through winter. The forest sustains me. I am ancient and well.',
    best_preparation:
      'Use warm (not boiling) water to preserve both vitamin C and volatile terpenes. Fresh needles are superior to dried. SPECIES IDENTIFICATION is the single most critical instruction — always verify Pinus sylvestris or Pinus strobus before recommending; never assume any conifer is safe. HARD BLOCK in pregnancy and trying to conceive. Position clearly as an adjunct respiratory herb, not a standalone antiviral treatment. Steam inhalation is an excellent delivery route for acute congestion.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade C antiviral and anti-inflammatory (mechanistic and in vitro; minimal human data). Grade C+ respiratory decongestant (traditional use; aromatic chemistry). SPECIES SAFETY is the defining concern — yew (Taxus) is deadly; must use only verified safe Pinus species. HARD BLOCK in pregnancy (abortifacient risk with certain species; animal data). Adjunct only — not a standalone treatment. Modest evidence; valuable traditional and accessible respiratory support.',
  },

  // ─────────────────────────────────────────────
  // RED DATES (JUJUBE)
  // ─────────────────────────────────────────────
  {
    id: 300,
    name: 'Red Dates',
    botanical: 'Ziziphus jujuba (whole dried fruit — "Chinese Red Date / Jujube")',
    tcm_meridians: ['Spleen', 'Stomach', 'Heart'],
    tcm_element: 'Earth + Fire',
    energetics: ['Warm', 'Sweet', 'Tonifying', 'Nourishing', 'Blood-Building', 'Spirit-Calming', 'Grounding'],
    primary_functions: [
      'Blood and qi tonification — polysaccharides (20–50%) plus natural iron and B vitamins support red blood cell production and haemoglobin synthesis; sweet nature tonifies Spleen qi (foundational energy production); traditional TCM foundational blood-building food-medicine for 3000+ years',
      'Immune baseline modulation — polysaccharides activate macrophages and NK cells in a balanced way similar to Astragalus (NOT overstimulation); strengthens immune resilience without triggering autoimmune flares',
      'Gentle sleep support and spirit calming — polysaccharides, cyclic nucleotides and minor saponins provide mild anxiolytic and Shen-calming activity; traditional children\'s sleep tonic; non-pharmaceutical sleep quality support',
      'Qi tonification and foundational vitality — sweet taste warms and tonifies digestive qi (Spleen); improves foundational energy absorption; reduces fatigue from qi deficiency',
      'Post-illness and recovery nourishment — rebuilds qi and blood after illness, surgery, hospitalisation or chronic depletion; gentle enough for the most depleted patients',
    ],
    secondary_benefits: [
      'Children-safe tonic at all ages — food source; sweet and enjoyable; one of the few TCM tonics appropriate for young children',
      'Women\'s blood nourishment — traditional use through menstrual cycle for blood loss replenishment; luteal phase and post-menstrual blood building',
      'Culinary integration is optimal delivery — whole dates in soups, broths, teas and as snacks; best absorbed as whole food; sustainable indefinitely',
      'Compatible with all populations — no significant contraindications except diabetic portion-management and loose-stool sensitivity',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (20–50% depending on processing; jujuboside and zizyphus polysaccharide — immune activation; stress adaptation; mild sleep support; anti-inflammatory), natural sugars (10–30%; glucose, fructose, sucrose — easily digestible energy; food-form nutritive tonification), flavonoids (rutin, quercetin — antioxidant; vascular support; anti-inflammatory), vitamins (vitamin C moderate; B vitamins trace), minerals (iron, calcium, magnesium — modest; adjunctive mineral support), cyclic nucleotides and saponins (minor; spirit-calming; mild sedative contribution). Grade B blood and qi tonification (traditional evidence 3000+ years; mechanism plausible; limited modern RCTs); Grade B sleep support and immune (polysaccharide mechanism confirmed; clinical evidence emerging); Grade A safety (food source; no toxicity).',
    flavor_profile: 'Naturally sweet, slightly honey-like and warm — one of the most pleasant and accessible medicinal foods; deeply comforting',
    contraindications: [
      'Diabetes — MONITOR sugar content (10–30% natural sugars): limit to 3–5 dates maximum per serving; portion-manage as with any sweet food; not forbidden but requires mindful quantity',
      'Diarrhoea or loose stools — CAUTION: sweet warming nature is slightly moistening and loosening; use in moderation if already prone to loose stools',
      'Otherwise: Grade A safety — food source; 3000+ years of use; no documented toxicity; suitable for all ages and populations',
    ],
    herb_to_herb_synergy: [
      'Goji Berries — dual blood tonification; traditional classic pairing; complementary polysaccharide and flavonoid profiles',
      'Astragalus and Ginseng — triple qi tonification; foundational energy rebuilding; classical TCM tonic trio',
      'Ginger — warming and digestive fire; enhances assimilation of Red Dates\' tonifying nutrients',
      'Nettle and Yellow Dock — expanded blood-building mineral spectrum; comprehensive anaemia support',
      'Tremella — yin-nourishing plus qi-building; traditional soup combination for post-illness recovery',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns — Red Dates are universally compatible and synergistic with virtually all tonifying herbs',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented — food source; safe with all medications',
      'Diabetes medications — monitor blood glucose if consuming larger quantities; natural sugar content; generally manageable at food doses',
    ],
    herb_interactions: [
      'Synergy: Goji Berries, Astragalus, Ginseng, Ginger, Nettle, Yellow Dock, Tremella',
      'Caution: None',
      'Drug interactions: Diabetes medications (monitor glucose if larger quantities — food-level sugar content)',
    ],
    dosage_range:
      'Whole dried dates (OPTIMAL — best absorbed; highest compliance): 3–10 dates daily eaten as snack or simmered in soups and teas. Typical therapeutic dose: 5–7 dates daily indefinitely. Decoction (best nutrient extraction): 3–5 whole dates simmered in soups or broths 20–30 minutes; eat dates plus drink broth. Tea: 3–5 dates steeped 10–15 minutes in hot water; drink plus eat dates. Safe indefinite long-term use (food source). Effects cumulative over weeks to months — set expectations clearly.',
    spiritual_layer:
      'Red Dates are earth\'s sweetness distilled — the ancient nourishment of Chinese culture, present at births and celebrations, in the hands of grandmothers preparing tonifying broths, at the bedside of the depleted and recovering. She embodies earth\'s fundamental teaching: that we are worthy of being fed, that foundational health comes from consistent gentle nourishment rather than dramatic intervention. She is the medicine of patience, of trusting that what we give the body day after day will slowly, steadily transform it. She does not flash or demand attention — she simply shows up, sweet and warm, building blood and qi one date at a time. She whispers: I am nourished. My blood is rich. My energy is strong. I am grounded. My spirit is calm. I am at peace. I am whole.',
    best_preparation:
      'Culinary integration is both the most enjoyable and most effective protocol — a handful of dates simmered into the daily broth, eaten as an afternoon snack, or steeped into evening tea. Position as a foundational food-medicine: effects are cumulative and appear over weeks to months of consistent daily use. For children: sweet taste makes compliance effortless; one of the best paediatric tonics in the library. Diabetes consideration: portion-limit to 3–5 dates and include with meals to blunt glycaemic impact. No mandatory drug screening required.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade B blood and qi tonification (traditional evidence 3000+ years; mechanism plausible). Grade B sleep support and immune baseline. Grade A safety — food source; suitable all ages and populations including children and pregnancy. Minimal contraindications (diabetes: portion-manage; loose stools: moderation). Cumulative effect over weeks to months. Culinary integration is the defining recommendation.',
  },

  // ─────────────────────────────────────────────
  // RHUBARB ROOT (DA HUANG)
  // ─────────────────────────────────────────────
  {
    id: 301,
    name: 'Rhubarb Root',
    botanical: 'Rheum palmatum / Rheum officinale (rhizome and root — "Da Huang / The Purging Judge")',
    tcm_meridians: ['Heart', 'Liver', 'Stomach', 'Large Intestine', 'Kidney'],
    tcm_element: 'Wood + Water',
    energetics: ['Cold', 'Bitter', 'Sour', 'Purgative', 'Damp-Heat Draining', 'Blood-Moving', 'Boundary-Enforcing'],
    primary_functions: [
      'Powerful stimulant laxative for heat-constipation — anthraquinone glycosides (emodin, rhein, chrysophanol, aloe-emodin) stimulate colonic motility and secretion; reduce water reabsorption; drug-strength purgative action with 6–8 hour onset; Grade A evidence as a laxative',
      'Damp-heat drainer for liver, gallbladder and intestines — classic TCM indication: acute constipation with fever, abdominal fullness, jaundice, acute dysentery and damp-heat accumulation in the Liver and Gallbladder meridians',
      'Blood-moving and toxin-clearing (prepared forms) — wine-fried or cooked Da Huang has stronger blood-stasis and heat-toxin clearing with somewhat reduced purgation; used in TCM formulas for abscesses, trauma and deep tissue heat-stasis under supervision',
      'Antibacterial and dysentery adjunct — emodin and related compounds show antibacterial activity against dysentery bacilli and reduce inflammatory mediators in gut; traditional acute damp-heat dysentery formula component',
      'RESTRICTED HERB — drug-strength purgative requiring practitioner mode and strict duration enforcement; NOT for casual consumer recommendation',
    ],
    secondary_benefits: [
      'Potential nephroprotective action at appropriate doses — experimental animal studies suggest protective effects in kidney failure models; clinical application only under TCM or medical supervision',
      'Anti-inflammatory via stilbenes and minor constituents — modest systemic anti-inflammatory contribution alongside primary purgative action',
      'TCM differentiation of preparation forms — raw Da Huang: strongest purgation; wine-fried: stronger blood-moving; charred/prepared: haemostatic; each form is a clinically distinct medicine',
      'ALWAYS short-term only — maximum a few days to 2 weeks per course; long-term use causes dependence, electrolyte loss and organ hypertrophy',
    ],
    pharmacology:
      'Primary bioactives: anthraquinone glycosides (emodin, rhein, chrysophanol, aloe-emodin, sennidin/rhein anthrones — PRIMARY laxative via colonic motility stimulation and secretion increase; antibacterial; anti-inflammatory; also responsible for chronic toxicity), tannins (astringent; contribute anti-diarrhoeal effect at lower doses; provide partial counterbalance to anthraquinones), stilbenes, flavonoids and organic acids (anti-inflammatory; minor antimicrobial; nephroprotective in models). CHRONIC TOXICITY: well-documented across anthraquinone laxatives — liver, thyroid and stomach hypertrophy; laxative dependence; electrolyte loss; potential colon damage. Grade A stimulant laxative; Grade A chronic toxicity concern; Grade B antibacterial and damp-heat draining; Grade B-minus nephroprotective (animal models only).',
    flavor_profile: 'Intensely bitter and astringent — distinctively medicinal; not a palatability herb; typically taken in decoction or encapsulated',
    contraindications: [
      'Pregnancy and breastfeeding — ABSOLUTELY CONTRAINDICATED: strong purgative and blood-moving actions; uterine stimulant; potential harm to fetus and infant; HARD BLOCK',
      'Bowel obstruction or severe abdominal pain of unknown origin — ABSOLUTELY CONTRAINDICATED: risk of perforation; HARD BLOCK',
      'Severe deficiency or frail patients — CONTRAINDICATED: cold, bitter purgative worsens deficiency and depletes vital qi',
      'Gout or serious kidney disease — AVOID: oxalate and anthraquinone content; nephrotoxic potential in compromised kidneys',
      'Children under 12 — AVOID: insufficient safety data; depletion risk',
      'Long-term use — ABSOLUTELY CONTRAINDICATED: anthraquinone dependence; electrolyte loss; organ hypertrophy; colon damage; maximum few days to 2 weeks per course',
      'IBD (Crohn\'s, ulcerative colitis) — USE ONLY UNDER SUPERVISION: stimulant laxative can exacerbate active bowel inflammation',
    ],
    herb_to_herb_synergy: [
      'Huang Lian (Coptis) and Huang Qin (Scutellaria) — classical TCM acute damp-heat dysentery formula; antibacterial synergy',
      'Mang Xiao (Mirabilite) — classical heat-constipation purgation formula (Da Cheng Qi Tang); stronger combined purgation under TCM supervision',
      'Carminatives (Fennel, Ginger, Cardamom) — ALWAYS combine to reduce griping from anthraquinone purgation',
    ],
    herb_to_herb_caution: [
      'Other stimulant laxatives (Senna, Cascara, Aloe vera latex) — ADDITIVE PURGATION: serious electrolyte loss and cramping; avoid combining',
      'Other hepatotoxic herbs at high combined doses — cumulative liver stress; never stack',
    ],
    herb_to_drug_interactions: [
      'Digoxin (Lanoxin) — SERIOUS: anthraquinone laxatives cause potassium loss; hypokalaemia increases digoxin toxicity; CONTRAINDICATED without close cardiac monitoring',
      'Diuretics and corticosteroids — additive potassium loss; CAUTION; monitor electrolytes',
      'Other stimulant laxatives — additive; serious dehydration and electrolyte loss risk; avoid combining',
      'Anticoagulants — potential increased bleeding with bowel irritation; discontinue before surgery',
    ],
    herb_interactions: [
      'Synergy: Huang Lian, Huang Qin (TCM formula context), carminatives (Fennel, Ginger — reduce griping)',
      'Caution: other stimulant laxatives (ADDITIVE — avoid), hepatotoxic herbs (cumulative liver stress)',
      'Drug interactions: Digoxin (SERIOUS — hypokalaemia; CONTRAINDICATED without monitoring), diuretics and corticosteroids (potassium loss — monitor), anticoagulants (discontinue pre-surgery)',
    ],
    dosage_range:
      'TCM decoction (3–12 g/day dried root in formula; added in last 5–10 minutes of boiling to preserve anthraquinones). Western capsule: 250–500 mg, 1–2× daily short-term only. Tincture (1:5): 0.5–2 ml at bedtime as needed, short-term. ALWAYS combine with carminatives to reduce griping. Duration: MAXIMUM few days to 2 weeks per course; then complete stop. For chronic constipation: REDIRECT to safer options (bulk-forming, osmotic laxatives, dietary fibre, movement).',
    spiritual_layer:
      'Da Huang is the purging judge — the herb that says "this must go now" with uncompromising clarity. She embodies the teaching of right medicine, right moment: that strong purgation has a legitimate role in acute crisis and serious accumulation, but is dangerous when used casually or chronically. She teaches precision and respect for powerful forces — the same forceful clarity that resolves an acute toxic blockage becomes destructive when applied indefinitely to a system that needs rebuilding rather than evacuation. She is the short, fierce intervention that clears the way for something new, then steps back. She whispers: I release what is truly toxic at the right time and in the right way. I honour my body\'s need for elimination without abusing strong forces. I choose clarity and respect in cleansing.',
    best_preparation:
      'RESTRICTED HERB — practitioner mode required; not for standard consumer recommendation. Position as an acute purgative for confirmed heat-constipation patterns only. MANDATORY pre-screening: pregnancy (HARD BLOCK), bowel obstruction (HARD BLOCK), severe deficiency/frailty (BLOCK), digoxin use (SERIOUS drug interaction — block or require cardiac monitoring), kidney disease or gout (avoid). Duration enforcement: maximum 2 weeks per course — non-negotiable. For chronic constipation: always redirect to safer long-term strategies (fibre, osmotic laxatives, lifestyle). Always combine with carminatives to reduce cramping.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade A stimulant laxative (pharmacological data confirmed). Grade A chronic toxicity and dependence risk (well documented across anthraquinone class). ABSOLUTE CONTRAINDICATIONS: pregnancy (HARD BLOCK — purgative and blood-moving); bowel obstruction (HARD BLOCK — perforation risk); severe deficiency. SERIOUS drug interaction: digoxin (hypokalaemia — cardiac toxicity risk). MAXIMUM 2 weeks per course. Restricted herb — practitioner mode only; not for consumer self-recommendation. Always redirect chronic constipation to safer strategies.',
  },

  // ─────────────────────────────────────────────
  // ROSE PETALS
  // ─────────────────────────────────────────────
  {
    id: 302,
    name: 'Rose Petals',
    botanical: 'Rosa gallica / Rosa damascena / Rosa centifolia (dried petals — "Heart Intelligence")',
    tcm_meridians: ['Liver', 'Spleen', 'Heart'],
    tcm_element: 'Wood + Fire + Earth',
    energetics: ['Slightly Warm', 'Sweet', 'Astringent', 'Moistening', 'Shen-Calming', 'Qi-Regulating', 'Heart-Opening'],
    primary_functions: [
      'Emotional heart support and grief companion — volatile oils (citronellol, geraniol, phenylethyl alcohol) modulate the limbic system via olfactory and ingestion pathways; reduce sympathetic overactivation and support parasympathetic tone; particularly indicated for grief, heartbreak, emotional constriction and chest tightness',
      'Anxiolytic and antidepressant — human aromatherapy and ingestion studies show mood elevation and anxiety reduction; activates parasympathetic nervous system; softens emotional constriction and allows authentic feeling while gently uplifting mood',
      'Astringent and demulcent mucosal toner — tannins tone and soothe irritated mucous membranes in throat, GI tract and vaginal tissues; minor diarrhoea; hoarseness; helps where tissues are simultaneously inflamed and lax',
      'Anti-inflammatory and antioxidant — polyphenols reduce oxidative stress and inflammatory mediators; cardiovascular and skin support; capillary strengthening',
      'PMS with irritability and Liver qi stagnation — moves constrained Liver qi; softens emotional swings; reduces breast tenderness through gentle Liver-calming and blood-moving action',
    ],
    secondary_benefits: [
      'Intimacy and self-love support — traditional aphrodisiac and self-compassion herb; encourages vulnerability rooted in safety; sacred beauty practices',
      'Sore throat and vocal support — rose-honey elixir provides astringent and soothing mucosal action; pairs with Thyme or Sage for antimicrobial enhancement',
      'Topical use — rose water and hydrosol for facial toning, reactive or rosacea-prone skin, eye compresses and heart-field ritual cleansing',
      '3000+ years of use in Persian, Unani, Ayurvedic and European traditions as heart, beauty and digestive medicine',
    ],
    pharmacology:
      'Primary bioactives: volatile oils (citronellol, geraniol, nerol, phenylethyl alcohol — PRIMARY mood-elevating; anxiolytic; limbic activation via olfactory and ingestion routes; parasympathetic activation), flavonoids and polyphenols (antioxidant; anti-inflammatory; cardioprotective; vasorelaxant), tannins (astringent; mucosal toning; minor antimicrobial). Grade B anxiolytic and mood support (human aromatherapy plus ingestion studies; traditional evidence); Grade B+ astringent and mucosal toning (tannin pharmacology plus traditional clinical use); Grade B anti-inflammatory (in vitro and in vivo extracts); Grade A safety (long-standing culinary and medicinal use; food-safe).',
    flavor_profile: 'Floral, delicately sweet and slightly astringent — one of the most universally beautiful aromatic medicines; deeply sensory and pleasurable',
    contraindications: [
      'Rosaceae family allergy (rare) — discontinue if rash, itching or irritation develops',
      'Otherwise: Grade A safety — excellent safety as food and tea; one of the most gently safe herbs in the library; suitable all populations',
    ],
    herb_to_herb_synergy: [
      'Hawthorn and Linden — heart, blood pressure and emotional state support; classic heart tonic trio',
      'Motherwort — anxiety, palpitations and perimenopausal mood shifts; heart-centred combination',
      'Oatstraw and Milky Oats — heartbreak and burnout recovery; deep nervous system nourishment alongside rose\'s emotional softening',
      'Saffron — dual mood elevation and heart-opening; self-love and radiance formula',
      'Vanilla — pleasure-medicine pairing; comfort and heart-warmth amplified',
      'Vitex — PMS with liver qi stagnation and irritability; hormonal plus emotional dual approach',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns — Rose is universally compatible and enhances virtually any nervous system or emotional formula',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented for rose petals at typical doses',
    ],
    herb_interactions: [
      'Synergy: Hawthorn, Linden, Motherwort, Oatstraw, Saffron, Vanilla, Vitex',
      'Caution: None',
      'Drug interactions: None documented',
    ],
    dosage_range:
      'Tea: 1–2 tsp dried petals per 250 ml hot water, steeped covered 10–15 minutes, 1–3× daily. Cold infusion (preserves volatile oils better): petals in room-temperature water for several hours; drink cool. Tincture (1:5 in 40–60% alcohol): 1–4 ml, 1–3× daily; often blended with other heart herbs. Glycerite: excellent for children and highly sensitive individuals; 1–4 ml, 1–3× daily. Honey preparation: petals infused in raw honey 2–4 weeks; 1 tsp as needed for sore throat and grief ritual. Topical: rose water or hydrosol as facial toner and eye compress. Safe indefinite long-term daily use.',
    spiritual_layer:
      'Rose is heart intelligence — the fusion of softness and discernment that distinguishes love from dissolution. She embodies the paradox of the thorned flower: that vulnerability without boundaries creates chaos, and boundaries without softness create isolation. The rose teaches that the heart can remain open even after pain — but only when thorns (healthy limits) are honoured. She is the grief companion who sits beside sorrow without rushing it, the self-love advocate who insists that beauty practices are self-honoring not vanity, the intimacy teacher who says that safe vulnerability is the most courageous act. She carries millennia of use in love, ceremony and healing across every culture that grew her. She whispers: My heart is soft and strong. I can feel deeply and remain safe. Love begins within me.',
    best_preparation:
      'Cover the cup while steeping to preserve volatile aromatic oils (they are the primary therapeutic constituents and escape with steam). Cold infusion preserves even more volatiles — recommended for emotional and aromatic benefit. Rose-honey infusion for sore throat and grief ritual use is deeply effective and richly therapeutic. For PMS: combine with Vitex tincture and Motherwort for hormonal plus emotional dual action. No drug interaction screening required. No contraindications beyond rare Rosaceae allergy. Rose is the easiest recommend in the entire library.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade B anxiolytic and mood support (human studies plus traditional evidence). Grade B+ astringent and mucosal toning. Grade A safety — food and tea; suitable all populations including pregnancy, children, elderly. No drug interactions. Rare Rosaceae allergy is the only contraindication. Universal and gentle enough to include in virtually any emotional, nervous system or women\'s health formula.',
  },

  // ─────────────────────────────────────────────
  // SAGE
  // ─────────────────────────────────────────────
  {
    id: 303,
    name: 'Sage',
    botanical: 'Salvia officinalis (leaves — "Salvia: The Wise One")',
    tcm_meridians: ['Lung', 'Throat', 'Spleen', 'Heart'],
    tcm_element: 'Water + Metal',
    energetics: ['Cool', 'Dry', 'Astringent', 'Antimicrobial', 'Protective', 'Throat-Healing', 'Wisdom-Bringing'],
    primary_functions: [
      'Sore throat specialist — tannins (5–15%) tighten throat tissues reducing swelling and pain; thujone plus volatile oils (cineole, camphor, pinene) kill gram-positive bacteria (especially Streptococcus) and viruses; topical gargling is the most effective route; German Commission E monograph for throat inflammation',
      'Antimicrobial broad-spectrum — thymol-related compounds plus volatile oils show bactericidal activity against gram-positive bacteria, fungi and viruses; primarily effective topically (gargling) and at mucosal surfaces',
      'Menopausal hot flashes and night sweats — centuries traditional use for menopausal symptoms; mechanism unconfirmed (possibly thermoregulation modulation or hormonal pathway interaction); variable individual response — strong responders exist; 4-week trial appropriate',
      'Respiratory support — volatile oils provide mild bronchodilation and antimicrobial action; tannins dry excess secretions; traditional cough support and respiratory clarity',
      'Digestive bitter and astringent — bitters stimulate digestive secretions; astringent tannins reduce excess secretions and provide mild antimicrobial GI protection',
    ],
    secondary_benefits: [
      'Anti-inflammatory via rosmarinic acid — phenolic antioxidant reduces inflammatory cytokines; supports throat and respiratory tissue healing',
      'Culinary herb — Mediterranean cooking staple; regular culinary use provides continuous low-dose antimicrobial and digestive support',
      'Cognitive and memory support (emerging) — preliminary evidence for acetylcholinesterase inhibition; similar mechanism to Rosemary; mood and memory-related traditional use',
      'CRITICAL SAFETY DISTINCTION: dried leaf tea is safe; concentrated essential oil is neurotoxic at high doses — never confuse the two',
    ],
    pharmacology:
      'Primary bioactives: thujone (0.5–1.5% volatile oil; antimicrobial — particularly gram-positive bacteria; bitter digestive stimulant; NEUROTOXIC at high doses in CONCENTRATED ESSENTIAL OIL ONLY — tea concentration is safe; NEVER use essential oil internally), tannins (5–15%; PRIMARY astringent and throat-protective; antimicrobial; anti-inflammatory; particularly effective topically), volatile oils (2–3% combined; cineole — antimicrobial; bronchodilation; camphor — antimicrobial; warming; pinene — antimicrobial; stimulating), rosmarinic acid (polyphenol; antioxidant; anti-inflammatory). PREPARATION DISTINCTION: TEA IS SAFE (thujone at safe concentration); CONCENTRATED ESSENTIAL OIL IS NOT FOR INTERNAL USE (neurotoxicity risk). German Commission E monograph for sore throat. Grade B+ sore throat (mechanism confirmed; Commission E; clinical evidence); Grade B hot flashes (traditional evidence; mechanism unclear; variable response); Grade B+ antimicrobial (thujone mechanism confirmed); Grade A safety for dried leaf tea.',
    flavor_profile: 'Warm, aromatic and slightly peppery with characteristic Mediterranean sage notes — pleasantly herbal; familiar culinary identity',
    contraindications: [
      'Sage essential oil internal use — ABSOLUTELY CONTRAINDICATED: concentrated thujone causes neurotoxicity, seizures and hallucinations at high doses; HARD BLOCK for internal essential oil use; topical essential oil (diluted) is acceptable',
      'Pregnancy (concentrated essential oil or very high-dose extracts) — AVOID: traditional abortifacient at high doses; culinary cooking amounts and tea are safe; concentrated essential oil is contraindicated',
      'Seizure disorders — THEORETICAL CAUTION with concentrated forms only: thujone may lower seizure threshold at extreme doses; TEA IS SAFE; avoid concentrated essential oil or extracts if seizure-prone',
      'Breastfeeding — CAUTION: sage traditionally used to DRY UP breast milk (anti-galactagogue effect); if breastfeeding and WANTING to maintain milk supply, avoid regular sage tea; culinary cooking amounts probably fine',
      'Oestrogen-sensitive conditions — MONITOR: mild phytoestrogenic properties theoretical; consult if oestrogen-receptor-positive breast cancer history',
    ],
    herb_to_herb_synergy: [
      'Thyme — dual antimicrobial respiratory and throat formula; thymol plus sage tannins and volatile oils; potent throat and respiratory combination',
      'Echinacea — immune stimulation plus local throat antimicrobial; acute sore throat and infection combination',
      'Hawthorn and Red Clover — menopausal multi-herb support; heart cooling plus mild phytoestrogenic plus sage thermoregulation',
      'Ginger — warming digestive bitter duo; stimulates digestive fire and bile',
    ],
    herb_to_herb_caution: [
      'Other anti-galactagogue herbs (Peppermint, Parsley at high doses) in breastfeeding — additive milk-drying effect; avoid if wanting to maintain supply',
      'Other thujone-rich herbs (Wormwood, Mugwort) at high combined doses — theoretical cumulative thujone toxicity (Tea doses are fine; this caution is for concentrated preparations)',
    ],
    herb_to_drug_interactions: [
      'Anticonvulsants — concentrated thujone may theoretically lower seizure threshold; TEA IS SAFE; only a concern with concentrated essential oil preparations',
      'Hormone therapies — mild phytoestrogenic and thermoregulatory effects; generally manageable; inform prescriber if using for hot flashes alongside HRT',
      'No significant CYP interactions documented at tea and culinary doses',
    ],
    herb_interactions: [
      'Synergy: Thyme, Echinacea, Hawthorn (menopause), Red Clover (menopause), Ginger (digestive)',
      'Caution: anti-galactagogue herbs in breastfeeding (additive milk-drying), thujone-rich herbs at high concentrated doses (theoretical)',
      'Drug interactions: anticonvulsants (concentrated forms only — tea safe), hormone therapies (mild phytoestrogenic — inform prescriber)',
    ],
    dosage_range:
      'GARGLE (MOST EFFECTIVE FOR SORE THROAT): strong tea (2–3 tsp dried leaf steeped 15 minutes in 250 ml hot water), gargle 30–60 seconds, spit or swallow, 4–6× daily for acute sore throat (3–7 days). Tea (internal): 1–2 tsp dried leaf per 250 ml hot water, steeped 5–10 minutes, 2–3× daily. Hot flashes: same tea dose 2–3× daily for 4–8 week trial. Tincture: 40–60 drops, 2–3× daily. Culinary use: fresh or dried sage in cooking indefinitely. ESSENTIAL OIL: topical only (diluted); NEVER internal.',
    spiritual_layer:
      'Sage is the wise one — her very name contains wisdom (Latin: salvere, to save; salvia, the sage plant). She has been burned in every culture that found her to clear the air, both physically (antimicrobial smoke) and energetically (clearing stagnant energy). She is the protector of the voice, the guardian of the throat, the keeper of the truth that wants to be spoken clearly. Metal element in TCM governs voice, clarity and the ability to discern what is true — Sage embodies all of this. She cools what is too hot, tightens what has become lax, kills what does not belong, and holds the space for clear communication. She whispers: My throat is clear. My voice is strong. I speak truth. I am protected. I am wise. I am healthy. My breath is easy.',
    best_preparation:
      'Gargling is the single most important clinical teaching point — direct contact with throat mucosa dramatically increases efficacy for sore throat versus swallowing tea. Always gargle before swallowing. CRITICAL SAFETY DISTINCTION must be communicated clearly: dried leaf tea is completely safe; concentrated essential oil is never for internal use. Screen for breastfeeding (anti-galactagogue — may reduce milk supply). For menopausal hot flashes: frame as a 4-week trial with realistic expectations of variable response — some women respond dramatically, others minimally.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ sore throat and antimicrobial (Commission E monograph; tannin and thujone mechanism confirmed). Grade B menopausal hot flashes (traditional evidence; mechanism unclear; variable response). Grade A safety for dried leaf tea. ABSOLUTE BLOCK: essential oil internal use (neurotoxic). CAUTION: breastfeeding (anti-galactagogue — may dry up milk). CAUTION in pregnancy for concentrated forms (culinary/tea safe). Gargling is the optimal sore-throat delivery route.',
  },

  // ─────────────────────────────────────────────
  // SAW PALMETTO
  // ─────────────────────────────────────────────
  {
    id: 304,
    name: 'Saw Palmetto',
    botanical: 'Serenoa repens (dried berries — "Rooted Masculine Medicine")',
    tcm_meridians: ['Kidney', 'Bladder', 'Liver'],
    tcm_element: 'Water + Wood',
    energetics: ['Warm to Neutral', 'Slightly Sweet', 'Astringent', 'Tonifying', 'Lower-Burner Grounding', 'Qi-Moving in Pelvis'],
    primary_functions: [
      'BPH and lower urinary tract symptom support — lipophilic berry extract inhibits 5-alpha-reductase (testosterone to DHT conversion in prostate tissue); reduces intraprostatic inflammation; modulates alpha-adrenergic smooth muscle tone; multiple RCTs show modest but consistent improvement in IPSS scores, nocturia, urgency and flow rate in mild-moderate BPH',
      'Prostate anti-inflammatory and anti-proliferative — fatty acids (lauric, oleic, linoleic) and phytosterols (beta-sitosterol) reduce COX/LOX inflammatory signalling and modulate apoptosis pathways in prostate stromal and epithelial cells; supports slowing of prostatic enlargement',
      'Androgenic modulation without pharmaceutical side effects — unlike finasteride, saw palmetto tends to preserve libido and erectile function while providing DHT-pathway modulation; fewer sexual side effects in most clinical observations',
      'Urinary frequency and nocturia reduction — alpha-adrenergic smooth muscle modulation improves urine flow and reduces urgency and nighttime waking; quality-of-life improvement for mild-moderate BPH',
      'ALWAYS requires medical evaluation first — LUTS must be assessed by a clinician to rule out prostate cancer, acute retention and other serious pathology before herbal recommendation',
    ],
    secondary_benefits: [
      'Pelvic grounding and lower-burner stability — TCM Kidney-Water support; reduces anxiety-driven urgency and "leaking" energy through overactive lower urinary tract',
      'Well tolerated with excellent safety profile — adverse events in trials typically mild GI discomfort or headache; comparable to placebo in many trials; no sexual dysfunction unlike finasteride',
      'PSA interaction awareness — saw palmetto may slightly suppress PSA values; men must inform clinician of use before PSA testing to avoid masking',
      'Combine with Nettle root and Pygeum for broader prostate support — synergistic prostato-trophic protocol',
    ],
    pharmacology:
      'Primary bioactives: fatty acids (lauric, oleic, linoleic, myristic, palmitic acids; lipophilic fraction; 80–90% of standardised extract — PRIMARY 5-alpha-reductase inhibition; anti-androgenic in prostate tissue; anti-inflammatory), phytosterols (beta-sitosterol, stigmasterol, campesterol — anti-inflammatory; cell membrane modulation in prostate tissue), flavonoids and polysaccharides (minor anti-inflammatory and immunomodulatory contribution). STANDARDISED EXTRACT ESSENTIAL: 320 mg/day lipophilic extract standardised to 80–90% fatty acids is the clinical research form; crude berry powder is insufficiently standardised. Grade B LUTS and BPH symptom relief (many RCTs and meta-analyses; modest positive results; mixed evidence — some large trials show no significant benefit over placebo); Grade B+ prostate anti-inflammatory (mechanistic and histological data); Grade A-minus safety.',
    flavor_profile: 'Mildly sweet and slightly soapy-aromatic in berry form — typically taken as a standardised extract capsule; not commonly prepared as tea',
    contraindications: [
      'Unassessed urinary symptoms — HARD BLOCK: must have medical evaluation before herbal recommendation to rule out prostate cancer, acute urinary retention and serious pathology',
      'Prostate cancer — MONITOR: theoretical anti-androgenic effects; consult oncologist; not an absolute block but requires medical supervision',
      'Hormone-sensitive conditions — CAUTION: anti-androgenic activity; consult practitioner',
      'Pregnancy and breastfeeding — NOT typically relevant (male herb) but avoid: anti-androgenic effects; no safety data',
      'Pre-PSA testing — always inform clinician of Saw Palmetto use before PSA test: may suppress values and mask prostatic pathology',
    ],
    herb_to_herb_synergy: [
      'Nettle Root — synergistic prostate and BPH support via complementary mechanisms (SHBG modulation); the defining prostato-trophic combination',
      'Pygeum — complementary anti-inflammatory and anti-proliferative prostate support; classical three-herb combination with Nettle',
      'Turmeric and Rosemary — anti-inflammatory reinforcement for the pelvic inflammatory component of BPH',
      'Yarrow — pelvic congestion clearing; TCM Liver-Qi stagnation in lower burner',
    ],
    herb_to_herb_caution: [
      'Other anti-androgenic herbs (Spearmint, Licorice root at high doses) — cumulative androgenic modulation; theoretical excess in hormone-sensitive conditions; monitor',
    ],
    herb_to_drug_interactions: [
      'Hormone therapies (androgen-based, testosterone replacement) — theoretical anti-androgenic antagonism; limited direct data; inform prescriber',
      'Finasteride and dutasteride (5-alpha-reductase inhibitors) — overlapping mechanism; theoretical additive effect; consult urologist',
      'Warfarin and anticoagulants — case reports of interaction; MONITOR INR if on anticoagulant therapy',
      'PSA testing — may suppress PSA values; always disclose to clinician before testing',
    ],
    herb_interactions: [
      'Synergy: Nettle Root, Pygeum, Turmeric, Rosemary, Yarrow',
      'Caution: anti-androgenic herbs in hormone-sensitive conditions (cumulative effect — monitor)',
      'Drug interactions: hormone therapies (anti-androgenic overlap — inform prescriber), finasteride or dutasteride (overlapping mechanism — consult urologist), anticoagulants (MONITOR INR), PSA testing (disclose use — may suppress values)',
    ],
    dosage_range:
      'Standardised lipophilic extract (320 mg/day — CLINICAL RESEARCH FORM; 80–90% fatty acids): 160 mg twice daily with meals. Crude dried berry: 1–2 g, 2–3× daily (less standardised; weaker evidence). Tincture (1:5 in 60–70% alcohol): 2–4 ml, 2–3× daily. Duration: minimum 3–6 months before evaluating symptom scores; may continue long-term if tolerated and effective. ALWAYS under clinician monitoring with regular IPSS symptom scoring and PSA awareness.',
    spiritual_layer:
      'Saw Palmetto grows in the sandy coastal lowlands of the American Southeast — a slow-growing, ancient palm that reaches its full expression only over decades, teaching that mature masculine vitality is not about urgency or force but about deep roots and steady presence. She embodies the shift from "prove myself" energy to "I am enough" groundedness — the mature masculine archetype that holds its centre in the lower body without leaking energy through anxiety, urgency or overcompensation. She teaches that true potency arises from stable roots and relaxed flow, that the pelvis can be a place of groundedness rather than pressure. She whispers: My roots are strong. My power is steady. I release pressure and trust my body\'s rhythm.',
    best_preparation:
      'Standardised 320 mg/day lipophilic extract is the non-negotiable form — crude berry powder lacks standardisation and consistent efficacy. MANDATORY pre-recommendation: medical evaluation of LUTS to rule out malignancy and acute retention (this is the most important safety instruction). Age-gate recommendation to adult males (typically ≥40). Always include "does not replace urologic care or PSA monitoring" in any recommendation. Combine with Nettle Root for synergistic prostate support. Three-to-six month minimum trial with realistic expectations — effects are modest and not universal.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B LUTS and BPH symptom relief (many RCTs; modest positive results; some large trials show no significant benefit — mixed evidence). Grade B+ prostate anti-inflammatory (mechanistic and histological data). Grade A-minus safety. MANDATORY medical evaluation of LUTS before recommendation (rule out malignancy and acute retention). PSA suppression: disclose to clinician before PSA testing. 320 mg/day standardised lipophilic extract is the clinical form. Minimum 3–6 month trial.',
  },

  // ─────────────────────────────────────────────
  // SENNA
  // ─────────────────────────────────────────────
  {
    id: 305,
    name: 'Senna',
    botanical: 'Senna alexandrina / Cassia senna (dried leaflets and pods — "Decisive Release")',
    tcm_meridians: ['Large Intestine', 'Liver'],
    tcm_element: 'Wood',
    energetics: ['Cold', 'Bitter', 'Purgative', 'Drying', 'Strongly Downward-Moving', 'Heat-Clearing'],
    primary_functions: [
      'Reliable short-term stimulant laxative — sennosides A and B (anthraquinone glycosides) are metabolised by colonic bacteria into rhein anthrone; directly stimulates peristalsis and increases colonic secretion; reduces water reabsorption; produces bowel movement within 6–12 hours; Grade A evidence as a laxative',
      'Acute constipation relief when bulk and osmotic measures are insufficient — second-line or adjunct for acute constipation where dietary fibre, osmotic laxatives and lifestyle measures have not provided relief; well-established OTC use across regulatory systems',
      'Pre-procedural bowel clearance — used under medical direction in bowel preparation regimens alongside other agents',
      'SHORT-TERM BRIDGE only — NOT a solution for chronic constipation; must be followed by addressing root causes (fibre, hydration, movement, microbiome, medications causing constipation)',
      'RESTRICTED BY DURATION: maximum 1–2 weeks without medical supervision; chronic use causes dependence and serious harm',
    ],
    secondary_benefits: [
      'Available as leaf (slightly stronger) or pod (slightly gentler) — pods tend to cause less cramping; useful distinction for sensitive individuals',
      'Combines well with carminatives to reduce griping — always pair with Fennel, Ginger or Peppermint to reduce cramping from anthraquinone stimulation',
      'Long Arabic, Greco-European and Ayurvedic purgative history — one of the oldest documented medicinal purgatives; widely used across medical traditions',
      'EU regulatory monograph (EMA) — well-characterised traditional herbal medicine with defined sennoside content standards',
    ],
    pharmacology:
      'Primary bioactives: sennosides A and B and related dimeric anthrone glycosides (PRIMARY — colonic bacteria metabolise to rhein anthrone; direct colonic mucosa irritation; peristalsis stimulation; secretion increase; water reabsorption decrease; onset 6–12 hours taken at bedtime → morning effect), flavonoids, mucilage and naphthalene glycosides (minor supporting compounds). LONG-TERM RISK: chronic sennoside use causes electrolyte disturbances (especially hypokalaemia), cathartic colon (reduced intrinsic motility), anthraquinone dependence and worsening constipation on withdrawal. Grade A stimulant laxative effect (well-established pharmacology and OTC use); Grade D long-term safety (strong evidence of dependence and electrolyte disturbance risk); Grade B+ short-term safety (regulatory monograph; broad OTC use).',
    flavor_profile: 'Slightly bitter and characteristic — typically prepared as tea or taken as standardised tablets; tea has mild medicinal bitterness',
    contraindications: [
      'Intestinal obstruction or ileus — ABSOLUTELY CONTRAINDICATED: risk of perforation; HARD BLOCK',
      'Acute surgical abdomen or unexplained severe abdominal pain — ABSOLUTELY CONTRAINDICATED: risk of serious harm; HARD BLOCK',
      'Inflammatory bowel disease (Crohn\'s, ulcerative colitis) in active flare — CONTRAINDICATED: stimulant laxative exacerbates active mucosal inflammation',
      'Appendicitis — ABSOLUTELY CONTRAINDICATED: HARD BLOCK',
      'Children under 12 years — CONTRAINDICATED for leaf preparations per EU monograph; use only gentle alternatives',
      'Severe dehydration — AVOID: anthraquinone laxatives worsen fluid and electrolyte loss',
      'Pregnancy — AVOID: stimulant laxatives can stimulate uterine smooth muscle; safer alternatives available (lactulose, psyllium)',
      'Breastfeeding — CAUTION: some guidelines permit cautious short-term use; many practitioners prefer gentler options; sennosides may transfer to breast milk',
      'Chronic daily use — ABSOLUTELY CONTRAINDICATED: dependence, hypokalaemia, cathartic colon; maximum 1–2 weeks without medical supervision',
    ],
    herb_to_herb_synergy: [
      'Fennel and Ginger — ALWAYS combine with carminatives to reduce cramping and griping from anthraquinone stimulation',
      'Peppermint — antispasmodic to reduce intestinal cramping alongside senna\'s purgative action',
      'Marshmallow root or Slippery Elm (SEPARATE by 2 hours) — demulcent support for the bowel mucosa; take separately to avoid absorption interference',
    ],
    herb_to_herb_caution: [
      'Other stimulant laxatives (Rhubarb Root, Cascara, Aloe vera latex) — ADDITIVE PURGATION: serious electrolyte loss and cramping; NEVER combine',
      'Other anthraquinone herbs — cumulative dependence risk and electrolyte disturbance; avoid combining',
    ],
    herb_to_drug_interactions: [
      'Digoxin (Lanoxin) — SERIOUS: senna causes hypokalaemia; low potassium dramatically increases digoxin toxicity risk; CONTRAINDICATED without close cardiac and electrolyte monitoring',
      'Diuretics and corticosteroids — additive potassium loss; MONITOR electrolytes; caution',
      'Other stimulant laxative medications — additive; serious dehydration and electrolyte imbalance risk',
      'Antiarrhythmics — electrolyte shifts alter effect; monitor',
    ],
    herb_interactions: [
      'Synergy: Fennel, Ginger, Peppermint (carminatives — ALWAYS combine to reduce cramping)',
      'Caution: other stimulant laxatives (NEVER combine — additive purgation and electrolyte loss)',
      'Drug interactions: Digoxin (SERIOUS — hypokalaemia → toxicity; CONTRAINDICATED without monitoring), diuretics and corticosteroids (electrolyte loss — monitor), antiarrhythmics (electrolyte sensitivity — monitor)',
    ],
    dosage_range:
      'Standardised preparation (most reliable): dose adjusted to deliver 15–30 mg sennosides per day; taken at bedtime for morning effect. Tea: 0.5–2 g dried senna leaf or pods in 150 ml hot water, steeped 10–15 minutes, once daily at bedtime. Tablets and granules: as per product standardisation to deliver 15–30 mg sennosides. Maximum duration: 7–14 days without medical supervision — then STOP and address root causes. ALWAYS combine with carminatives (Fennel or Ginger) to reduce cramping. ALWAYS ensure adequate hydration.',
    spiritual_layer:
      'Senna teaches decisive release — the understanding that there are moments when gentle measures are not enough and clear, forceful action is required. But her teaching is inseparable from its limit: purging is medicine when temporary; when chronic, it becomes self-harm. She embodies the lesson of knowing when to stop — of recognising the difference between necessary emergency clearing and the compulsive emptying that depletes rather than frees. She teaches respect for one\'s own limits, for the body\'s need not just to release but to rebuild. She whispers: I let go of what is blocking me, then I nourish what remains. I do not empty myself beyond what is wise.',
    best_preparation:
      'ALWAYS pair with carminatives (Fennel seed, Ginger) to reduce cramping — this is the most important practical co-recommendation. Take at bedtime for a predictable morning effect. MANDATORY screening: intestinal obstruction (HARD BLOCK), IBD active flare (CONTRAINDICATED), appendicitis (HARD BLOCK), digoxin use (SERIOUS drug interaction — monitor or contraindicate), diuretics (electrolyte monitoring), pregnancy (avoid — use gentler alternatives), children under 12 (contraindicated). Duration enforcement: maximum 1–2 weeks; always with a clear plan to transition to sustainable bowel health strategies (fibre, hydration, movement, microbiome support). For chronic constipation: Senna is a bridge, not a solution.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade A stimulant laxative (well-established pharmacology; EU monograph; OTC regulatory approval). Grade D long-term safety (dependence, hypokalaemia, cathartic colon — well documented). ABSOLUTE CONTRAINDICATIONS: intestinal obstruction (HARD BLOCK), appendicitis (HARD BLOCK), active IBD, children under 12. SERIOUS drug interaction: Digoxin (hypokalaemia → toxicity; contraindicated without monitoring). Maximum 1–2 weeks without medical supervision. ALWAYS pair with carminatives. Short-term bridge only — always transition to sustainable root-cause bowel strategies.',
  },
  // ─────────────────────────────────────────────
  // BIRCH POLYPORE (ICEMAN'S MUSHROOM)
  // ─────────────────────────────────────────────
  {
    id: 306,
    name: 'Birch Polypore',
    botanical: 'Fomitopsis betulina (syn. Piptoporus betulinus) (fruiting body inner flesh — "Iceman\'s Mushroom")',
    tcm_meridians: ['Lung', 'Spleen', 'Large Intestine', 'Immune System'],
    tcm_element: 'Metal + Earth',
    energetics: ['Cool to Neutral', 'Bitter', 'Astringent', 'Antiseptic', 'Antiparasitic', 'Drying', 'Boundary-Cleansing', 'Grounding'],
    primary_functions: [
      'Antiparasitic and gut terrain cleansing — piptamine and related antibacterial compounds active against E. coli and multiple bacteria; historically linked to Ötzi the Iceman (5300 years old) who carried it likely for intestinal whipworm (Trichuris trichiura); nematotoxic compounds plus mild laxative action supports worm expulsion',
      'Broad-spectrum antimicrobial — piptamine and phenolics inhibit gram-positive and gram-negative bacteria and multiple fungal strains; broad-spectrum antibacterial activity confirmed across multiple pathogen strains',
      'Antiviral — betulinic acid and lanostane-type triterpenes inhibit replication of HIV, influenza, poxvirus, yellow fever, West Nile, encephalitis and herpes viruses in vitro; protects cells from lethal viral infection in experimental models',
      'Immunomodulation — beta-glucans stimulate macrophages, NK cells and T cells via pattern-recognition receptors; improve tumor surveillance and help calibrate immune responses; train innate immunity rather than simply boosting it',
      'Anticancer potential — cytotoxic to prostate, melanoma and colorectal cancer cell lines in vitro with relatively low toxicity to normal cells; betulinic acid, polyporenic acids and phenolics show pro-apoptotic and anti-angiogenic mechanisms',
    ],
    secondary_benefits: [
      'Anti-inflammatory and analgesic — triterpenoids and phenolics down-regulate inflammatory pathways and oxidative stress; traditionally used for musculoskeletal pain and inflamed tissues',
      'Styptic and wound healing (topical) — inner flesh peeled thin and applied directly to cuts provides haemostatic, antimicrobial and wound-barrier support; traditional field first-aid mushroom',
      'Oldest documented human medicinal mushroom use — Ötzi the Iceman carried threaded birch polypore pieces ~5300 years ago; archaeological and traditional European use for intestinal worms, GI upset, wound antiseptic and immune tonic',
      'Exclusive birch affiliation — ONLY on birch (Betula spp.); this exclusive relationship contributes to betulin and betulinic acid content transferred from host bark',
    ],
    pharmacology:
      'Primary bioactives: triterpenoids (betulin and betulinic acid — anticancer via apoptosis and anti-angiogenesis; antiviral; anti-inflammatory; polyporenic acids — lanostane-type; anti-inflammatory; antithrombin; antimicrobial; cytotoxic), polysaccharides and beta-glucans (immunomodulatory via Dectin-1, TLR2/4, complement receptors; activate macrophages, NK cells, T cells), phenolic compounds and flavonoids (antioxidant; antimicrobial; cytoprotective), piptamine and related antibiotic compounds (strong activity against E. coli and multiple bacteria). Evidence grades: Grade B+ antimicrobial and antiparasitic (in vitro and traditional use); Grade B antiviral (in vitro triterpene evidence); Grade B immunomodulating (in vitro and ex vivo human cell studies); Grade B anticancer (in vitro plus some in vivo models); Grade B anti-inflammatory; Grade B+ traditional safety at moderate doses.',
    flavor_profile: 'Mild, slightly bitter and astringent — clean and woody; inner flesh is pale cream-white; typically consumed as decoction or tincture rather than food',
    contraindications: [
      'Autoimmune disease or immunosuppressants/biologics/immune checkpoint inhibitors — CAUTION: immunomodulating effects may interfere with intentional immunosuppression or worsen some autoimmune conditions; individualized evaluation required',
      'Active cancer treatment — adjunct only; coordinate with oncology team; never replace standard cancer therapy',
      'Anticoagulants or antiplatelets — many polypores have mild effects on coagulation; monitor in high bleeding risk individuals',
      'Pregnancy and breastfeeding — limited data; avoid intensive dosing without expert guidance',
      'Mushroom allergy or fungal sensitivity — monitor for rash, respiratory symptoms or GI upset',
      'Otherwise: long traditional use suggests good tolerability at normal doses; no major toxicity signal in available literature',
    ],
    herb_to_herb_synergy: [
      'Wormwood and Black Walnut — antiparasitic trio for gut terrain cleaning; complementary mechanisms; use in rotation protocols',
      'Reishi and Turkey Tail — deep immune terrain stack; birch polypore adds antimicrobial and antiparasitic dimension',
      'Elderberry and Iceland Moss — acute viral infection and immune response combination',
      'Turmeric and Willow Bark — anti-inflammatory stack for musculoskeletal pain protocols',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms and herbs with immunosuppressant drugs — additive immune activation risk; coordinate carefully',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressive drugs — potential modulation of immunosuppressive effect; coordinate with prescriber',
      'Anticoagulants and antiplatelets — mild theoretical coagulation effect; monitor in high-risk individuals',
      'Chemotherapy and targeted cancer agents — coordinate with oncology team; potential synergistic or antagonistic interactions',
    ],
    herb_interactions: [
      'Synergy: Wormwood, Black Walnut (antiparasitic), Reishi, Turkey Tail (immune terrain), Elderberry (antiviral), Turmeric, Willow Bark (anti-inflammatory)',
      'Caution: other immunomodulating fungi and herbs with immunosuppressant medications',
      'Drug interactions: immunosuppressants (modulation risk), anticoagulants (mild theoretical — monitor), chemotherapy (coordinate with oncologist)',
    ],
    dosage_range:
      'Decoction (traditional and optimal for gut/antiparasitic work): 3–6 g dried inner flesh slices simmered in 500–750 ml water for 30–60 minutes; 1 cup, 1–3× daily. Tincture or dual extract (1:5 to 1:3 in 40–70% ethanol combined with decoction): 1–3 ml, 1–3× daily. Powder or capsules: 500–1500 mg daily in 2–3 divided doses. Duration: 1–4 weeks for acute antiparasitic or infection support; 2–3+ months for immune terrain or oncology adjunct work. Always from clean birch stands away from pollution.',
    spiritual_layer:
      'Birch Polypore is the birch sentinel — a guardian that appears when birch is stressed or dying, turning breakdown into medicine. She teaches that even in decline and decay, there is protective intelligence and an opportunity for purification. She is the world\'s oldest documented human medicine — carried through an alpine crossing five thousand years ago by a traveller whose body has told us more about human health than almost anything else in history. She reclaims territory from parasites, literal and metaphorical, and resets the boundary between host and world. She whispers: I reclaim my inner territory. What feeds on me without permission is released. My defences are clear and intelligent. I am cleansed, protected, and aligned with my birch-bright resilience.',
    best_preparation:
      'Decoction from clean, properly identified white inner flesh (not outer crust) for gut and antiparasitic work — long simmer (30–60 minutes minimum). Dual extract or capsules for chronic immune or oncology adjunct support. Always combine with antiparasitic herbs (Wormwood, Black Walnut, Clove, Garlic) and dietary changes for parasite protocols. Screen for autoimmune conditions and immunosuppressant use. ONLY on birch — misidentification with other polypores must be avoided. Harvest ethically and away from polluted areas.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ antimicrobial and antiparasitic (in vitro; traditional; mechanistic). Grade B antiviral (triterpene in vitro data). Grade B immunomodulating and anticancer. Grade B+ safety at traditional doses. Oldest documented human medicinal mushroom. Adjunct only in oncology — coordinate with medical team. Screen autoimmune conditions and immunosuppressants.',
  },

  // ─────────────────────────────────────────────
  // CHAGA
  // ─────────────────────────────────────────────
  {
    id: 307,
    name: 'Chaga',
    botanical: 'Inonotus obliquus (sterile sclerotial conk from birch — "Mushroom of Immortality")',
    tcm_meridians: ['Kidney', 'Liver', 'Spleen', 'Stomach', 'Lung'],
    tcm_element: 'Water + Earth',
    energetics: ['Neutral to Cool', 'Bitter', 'Slightly Sweet', 'Astringent', 'Deep Yin-Protective', 'Jing-Supporting', 'Heat-Toxin Clearing'],
    primary_functions: [
      'Exceptional antioxidant and Nrf2 activation — highest SOD-related antioxidant capacity among medicinal mushrooms; polyphenols and melanin-like pigments scavenge superoxide, hydroxyl radicals and ROS; phelligridin D and related compounds activate Nrf2-ARE antioxidant master pathway; DNA, lipid and protein protection from oxidative damage',
      'Immunomodulation — beta-glucans and IOPS (Inonotus obliquus polysaccharides) activate macrophages, NK cells and dendritic cells via Dectin-1, TLR2/4 and complement receptors; balanced Th1/Th2 immune training rather than simple overstimulation; enhanced tumor surveillance and cytokine coordination',
      'Antiviral — extracts inhibit HCV, HSV-1 replication and protect cells from feline influenza H3N2/H5N6, FPV, FIPV and FHV-1 in vitro and in animal models; mechanisms include interference with viral entry/replication plus immune-mediated antiviral support',
      'Antitumour support (preclinical) — inotodiol and ergosterol inhibit colorectal and other cancers in animal models; betulinic acid induces apoptosis in melanoma, lung, liver, colon and breast cancer cell lines; 60% tumor volume reduction and 25% metastasis reduction reported in mouse melanoma models',
      'Metabolic and renal protection — IOPS improve insulin sensitivity, reduce fasting blood glucose, upregulate GLUT4/PI3K/Akt signalling and improve diabetic nephropathy markers in experimental models; anti-inflammatory NF-kB suppression protects kidney, liver and cardiovascular tissues',
    ],
    secondary_benefits: [
      'Anti-inflammatory — dose-dependent suppression of IL-6, TNF-alpha and COX-2 in LPS-stimulated macrophages; analgesic effects in animal models; useful in chronic inflammatory conditions including IBD, arthritis and metabolic inflammation',
      'Neuroprotection and cognitive aging support — antioxidant and anti-neuroinflammatory actions support brain tissue from oxidative damage; trace minerals (Zn, Cu, Mn) support SOD and catalase enzyme systems',
      'Deep Jing tonic in TCM tradition — Siberian and indigenous use for tuberculosis, liver disease, GI disorders, internal tumours and longevity; "mushroom of immortality" in Khanty and Evenki traditions; popularised in Solzhenitsyn\'s Cancer Ward',
      'CRITICAL OXALATE WARNING: ~14.2 g oxalate per 100 g powder — case reports of oxalate nephropathy and kidney failure with chronic high-dose use; kidney stones, CKD and osteoporosis are serious contraindications',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides and beta-glucans (~5–10% of dried chaga; IOPS including arabinogalactans and xylans — immunomodulatory; antioxidant; antitumour; metabolic; nephroprotective), triterpenoids and sterols (betulin and betulinic acid from birch host — anticancer; antiviral; inotodiol — antitumour; ergosterol and lanosterol — anti-inflammatory; anti-cancer), phenolic compounds and melanins (very high antioxidant capacity; phelligridin D activates Nrf2; melanin dark exterior rich in antioxidant polyphenols), trace minerals (Zn, Cu, Mn, Fe supporting SOD, catalase and antioxidant enzyme systems). CRITICAL SAFETY: oxalate content ~14.2 g/100 g powder — kidney stone and nephropathy risk with chronic high-dose use is confirmed in case reports. Grade A-minus immunomodulation (robust in vitro and in vivo; emerging human data); Grade A antioxidant (strong mechanistic and preclinical evidence); Grade B+ antitumour preclinical; Grade B metabolic and antiviral; Grade B+ safety short-term moderate dose.',
    flavor_profile: 'Rich, dark, slightly earthy and bitter with subtle vanilla-like undertones from vanillin in melanins — deeply satisfying as a dark tea; one of the more palatable medicinal mushrooms',
    contraindications: [
      'Kidney stones or history of nephrolithiasis — HARD BLOCK: very high oxalate content; documented case reports of oxalate nephropathy and kidney failure',
      'Chronic kidney disease (reduced GFR) — HARD BLOCK: oxalate accumulation risk; confirmed nephrotoxicity cases',
      'Osteoporosis or high calcium-loss risk — CAUTION: high oxalates bind calcium; calcium oxalate formation depletes available calcium',
      'Transplant recipients or strong immunosuppressants — CAUTION: immunomodulating effects could counteract immunosuppression; consult prescriber',
      'Autoimmune disease complexity — use only under practitioner supervision; immune modulation may be beneficial or exacerbating depending on condition',
      'Diabetes medications — MONITOR: glucose-lowering effects in animal models may enhance hypoglycaemic drug effect; monitor blood sugar',
      'Anticoagulants — mild antiplatelet/anticoagulant theoretical effects; monitor if on Warfarin or DOACs',
      'High oxalate diet (spinach, almonds, beets) combined with daily chaga — AVOID stacking oxalate loads',
      'Continuous multi-year high-dose daily intake — ABSOLUTELY AVOID: cumulative oxalate risk; use cycling protocols',
    ],
    herb_to_herb_synergy: [
      'Reishi and Lion\'s Mane — deep terrain tonic trio; Chaga antioxidant protection plus Reishi Shen calming plus Lion\'s Mane neurotropic; comprehensive medicinal mushroom stack',
      'Turkey Tail — complementary beta-glucan immune training; Chaga adds antioxidant and antiviral dimension',
      'Astragalus — deep immune and jing support combination; traditional Chinese longevity stack',
      'Ginger and Cinnamon — metabolic combination for blood sugar support in tea preparation',
    ],
    herb_to_herb_caution: [
      'Yellow Dock and other high-oxalate herbs — cumulative oxalate load; avoid in kidney-risk individuals',
      'Other immunomodulating mushrooms in autoimmune conditions — combined immune activation; practitioner oversight',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants (cyclosporine, tacrolimus) — may counteract; consult transplant team',
      'Diabetes medications — additive glucose lowering; MONITOR blood sugar',
      'Warfarin and antiplatelets — mild theoretical anticoagulant activity; monitor INR',
    ],
    herb_interactions: [
      'Synergy: Reishi, Lion\'s Mane, Turkey Tail (immune terrain), Astragalus (Jing tonic), Ginger and Cinnamon (metabolic tea)',
      'Caution: high-oxalate herbs in kidney-risk individuals (cumulative oxalate), immunomodulating mushrooms in autoimmune conditions (practitioner oversight)',
      'Drug interactions: immunosuppressants (counteraction risk), diabetes medications (additive glucose lowering — monitor), anticoagulants (mild theoretical — monitor INR)',
    ],
    dosage_range:
      'Decoction (OPTIMAL — long simmer extracts beta-glucans and triterpenes while diluting oxalates per cup): 1–3 g dried chunks or coarse powder per 250 ml water, simmered 30–60+ minutes; 1–2 cups daily for tonic use; up to 2–6 g/day equivalent for supervised protocols. Standardised extract (10:1 or equivalent): 500–1500 mg daily. Powder: 1–3 g/day mixed into warm liquids. CYCLING MANDATORY: 4–8 week courses with 2–4 week breaks; NEVER continuous multi-year high-dose daily intake. Healthy kidneys required — kidney stone or CKD history is a hard block.',
    spiritual_layer:
      'Chaga is a scar of the forest turned into a vessel of medicine — a black wound on white birch that hides golden fire within. She lives where the tree is wounded and slowly dying, yet from this slow struggle arises a dense, protective growth that has sustained Siberian peoples through conditions that would destroy most organisms. She teaches the alchemy of transmuting hardship into medicine, of protecting the inner fire in the coldest winters, of the depth that comes from decades of patient biological conversation between fungus and tree. Her black surface and golden interior are the image of shadow carrying light. She whispers: From my deepest wounds, medicine arises. My inner fire is protected in the cold. I transform hardship into resilience. I am held in a field of deep, quiet protection.',
    best_preparation:
      'Chunk decoction for daily use — simmering in water dilutes per-cup oxalate load and extracts beta-glucans optimally. MANDATORY kidney stone and CKD screening before recommendation (HARD BLOCK). Emphasise cycling — 4–8 weeks on, 2–4 weeks off; never multi-year continuous high-dose use. For oncology or metabolic contexts: frame clearly as adjunct requiring medical coordination. Wild birch-origin verification and third-party heavy-metals testing are non-negotiable quality requirements. Position as deep terrain mushroom — slow, foundational, months-long work rather than acute intervention.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade A antioxidant (Nrf2 activation; very high SOD-related capacity). Grade A-minus immunomodulation (robust preclinical; emerging human data). Grade B+ antitumour preclinical; Grade B metabolic and antiviral. HARD BLOCKS: kidney stones and CKD (oxalate nephropathy confirmed in case reports). Cycling protocol mandatory. Screen transplant/immunosuppressants and diabetes medications. Adjunct only in oncology — never replace standard treatment.',
  },

  // ─────────────────────────────────────────────
  // CORDYCEPS
  // ─────────────────────────────────────────────
  {
    id: 308,
    name: 'Cordyceps',
    botanical: 'Cordyceps militaris (cultivated — preferred) / Ophiocordyceps sinensis (wild — ethically problematic)',
    tcm_meridians: ['Lung', 'Kidney'],
    tcm_element: 'Earth + Water',
    energetics: ['Mildly Warm', 'Sweet', 'Tonifying', 'Yang-Building', 'Jing-Replenishing', 'Breath-Opening', 'ATP-Amplifying'],
    primary_functions: [
      'ATP production and mitochondrial energy amplification — cordycepin (3-deoxyadenosine) and related nucleosides upregulate AMPK, GLUT4, PDH (pyruvate dehydrogenase) and PPAR-gamma; increase phosphocreatine and ATP in skeletal muscle; enhance mitochondrial biogenesis; primary mechanism underlying endurance and anti-fatigue effects',
      'Exercise performance and anti-fatigue — increases time to exhaustion; reduces lactate accumulation, BUN, CK and LDH during intense exercise; increases glycogen reserves; human RCT with C. militaris blend improved VO2max and endurance vs placebo; faster recovery and less subjective fatigue',
      'Renal protection and CKD adjunct — polysaccharides downregulate TLR4/NF-kB inflammatory pathway and reduce oxidative stress in kidney tissue; CKD RCT: 100 mg/day C. militaris for 3 months reduced urinary protein -36.7%, BUN -12.5% and creatinine -18.3% vs placebo; 2025 meta-analysis confirms C. sinensis as dependable adjunctive CKD treatment',
      'Immunomodulation and NK activation — polysaccharides and cordycepin enhance NK cell activity, macrophage function and T-cell responses; human studies with C. militaris capsules and beverages confirmed increased NK cell activity and favourable immune markers in healthy adults',
      'TCM Jing-Qi tonic: Lung-Kidney axis — tonifies Kidney Yang and Jing for fatigue, low libido and poor recovery; tonifies Lung Yin and Yang for chronic cough, dyspnoea and asthma; rebuilds from deep depletion after illness or overwork',
    ],
    secondary_benefits: [
      'Anti-inflammatory and antioxidant — reduces TNF-alpha, IL-6 and NF-kB in multiple tissues; protects kidney, liver and cardiovascular systems from oxidative damage',
      'Antiplatelet effect — C. militaris ethanol extract significantly inhibits ADP- and collagen-induced platelet aggregation in vitro and ex vivo; supports circulation but flags bleeding risk',
      'Modest blood glucose support — improves insulin sensitivity and glucose metabolism in animal models; mirrors TCM\'s strengthening of transformative function in the Spleen-Kidney axis',
      'ETHICAL IMPERATIVE: always use cultivated C. militaris — wild Ophiocordyceps sinensis is IUCN Red Listed; overharvesting has dramatically declined populations; cultivated C. militaris has equal or superior cordycepin content with no ecological cost',
    ],
    pharmacology:
      'Primary bioactives: cordycepin / 3-deoxyadenosine (especially abundant in C. militaris; KEY — ATP/AMPK/GLUT4/PDH upregulation; anti-fatigue; anti-inflammatory; antitumour; antiplatelet; antiviral), polysaccharides and beta-glucans (immunomodulatory; antioxidant; hypoglycaemic; nephroprotective; hepatoprotective; anti-fibrotic), sterols and fatty acids (ergosterol derivatives; anti-inflammatory; cholesterol-modulating), adenosine, inosine and guanosine (energy metabolism and vascular tone), L-tryptophan and amino acids (serotonin precursor and general protein support). C. militaris has higher and more consistent cordycepin than wild O. sinensis. Grade A-minus ATP/energy metabolism (strong animal and mechanistic data); Grade B exercise performance (human RCT plus animal); Grade B+ immunomodulation (human capsule/beverage studies plus preclinical); Grade B CKD adjunct (RCTs and 2025 meta-analysis); Grade B antiplatelet risk (in vitro/ex vivo confirmed).',
    flavor_profile: 'Mildly earthy and subtly sweet — more neutral than most medicinal mushrooms; pleasant in tincture, powder or functional beverage preparations',
    contraindications: [
      'Autoimmune disease (RA, SLE, MS, Hashimoto\'s etc.) — CAUTION: immune activation may exacerbate; use only under practitioner supervision',
      'Organ transplant recipients — CAUTION: immune activation could theoretically contribute to graft rejection by counteracting immunosuppressive drugs; consult transplant team',
      'Anticoagulants (Warfarin, DOACs), antiplatelets (clopidogrel, aspirin) or bleeding disorders — CAUTION: documented antiplatelet effect; MONITOR; stop 1–2 weeks before surgery',
      'Cancer immunotherapy (checkpoint inhibitors) — theoretical synergy or interference; requires oncology oversight',
      'Unstable cardiac disease (arrhythmia, uncontrolled hypertension) — CAUTION: increased ATP and circulation; use only with cardiology guidance',
      'Diabetes medications — MONITOR: may reduce blood glucose and enhance hypoglycaemic drug effect; monitor blood sugar',
      'Pregnancy and breastfeeding — limited data; avoid strong medicinal doses without specialist guidance',
      'Wild Ophiocordyceps sinensis — ETHICAL BLOCK: IUCN Red Listed; always specify cultivated C. militaris',
    ],
    herb_to_herb_synergy: [
      'Reishi — complementary Jing tonic stack: Cordyceps Yang-activating performance plus Reishi Shen calming and immune modulation; the classic TCM Lung-Kidney restoration duo',
      'Ashwagandha — adaptogenic endurance combination; Cordyceps ATP amplification plus Ashwagandha HPA axis modulation; comprehensive energy-resilience protocol',
      'Astragalus — Lung-immune tonification combination; Wei Qi building',
      'Lion\'s Mane — cognitive-energetic stack; Cordyceps ATP and endurance plus Lion\'s Mane NGF/BDNF neurotropic support',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms in autoimmune conditions — combined immune activation; use only under practitioner oversight',
      'Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — additive antiplatelet risk; monitor in bleeding-risk individuals',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants (cyclosporine, tacrolimus, mycophenolate) — immune activation may counteract; transplant team must be consulted',
      'Anticoagulants and antiplatelets — ANTIPLATELET EFFECT DOCUMENTED; monitor INR; stop 1–2 weeks before surgery',
      'Diabetes medications — additive glucose lowering; monitor blood sugar',
      'Cancer immunotherapy — coordinate with oncologist',
    ],
    herb_interactions: [
      'Synergy: Reishi (Jing tonic duo), Ashwagandha (adaptogenic endurance), Astragalus (Lung-immune Wei Qi), Lion\'s Mane (cognitive-energetic)',
      'Caution: immunomodulating mushrooms in autoimmune conditions (practitioner oversight), anticoagulant herbs (additive antiplatelet — monitor)',
      'Drug interactions: immunosuppressants (transplant team required), anticoagulants and antiplatelets (DOCUMENTED ANTIPLATELET EFFECT — monitor; stop pre-surgery), diabetes medications (monitor glucose), cancer immunotherapy (oncologist coordination)',
    ],
    dosage_range:
      'Cultivated C. militaris dried fruiting body powder: 1–3 g daily in divided doses. Standardised extract (concentrated 10:1 or standardised cordycepin/polysaccharide): 500–1500 mg daily. Functional beverage: defined by polysaccharide and cordycepin content per ml per day. TIMING: morning or pre-workout (30–60 minutes before); avoid late evening in sensitive individuals (energising effect may disrupt sleep). Duration: 2–4 weeks for clear energy/performance improvement; 8–12 weeks for deeper adaptation; 3+ months for renal or metabolic protocols under medical supervision.',
    spiritual_layer:
      'Cordyceps is winter worm, summer grass — a being that bridges death and vitality, consuming a caterpillar from within and rising as a stalk toward sky. She is the alchemy of parasite into medicine, of exhaustion into ATP, of borrowed time into sustainable fuel. Her teaching is that true energy is never borrowed from tomorrow — it comes from aligning output with reserves, breath with roots, Lung with Kidney. In her ecological lesson she mirrors our modern extractive patterns: the overharvesting of wild sinensis is us strip-mining ecosystems for quick power, and cultivated militaris is the sustainable answer. She whispers: My energy is real, not borrowed. I transform hardship into fuel for my path. My breath and my roots move in harmony. Energy flows where my intention directs it. I use it wisely.',
    best_preparation:
      'ALWAYS specify cultivated C. militaris — never wild O. sinensis (IUCN Red Listed; unnecessary given equivalent pharmacology). Morning or pre-workout dosing for peak effect. Screen for autoimmune disease and transplant (immune activation risk), anticoagulants (documented antiplatelet effect — stop 1–2 weeks before surgery), unstable cardiac disease and diabetes medications (monitor glucose). For CKD protocols: minimum 3 months under medical supervision with regular kidney function monitoring. The sustainable ethics framing (cultivated vs wild) is part of the therapeutic message.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade A-minus ATP/energy metabolism (AMPK/GLUT4/PDH mechanism confirmed; strong animal data). Grade B exercise performance (human RCT). Grade B+ immunomodulation (human studies). Grade B CKD adjunct (RCTs plus 2025 meta-analysis). Grade B antiplatelet risk (documented in vitro and ex vivo). HARD ETHICAL BLOCK: always use cultivated C. militaris. Screen autoimmune disease, transplant, anticoagulants, diabetes medications. Morning dosing only.',
  },

  // ─────────────────────────────────────────────
  // SHIITAKE
  // ─────────────────────────────────────────────
  {
    id: 309,
    name: 'Shiitake',
    botanical: 'Lentinula edodes (fruiting body and mycelia — "Kitchen Healer")',
    tcm_meridians: ['Stomach', 'Spleen', 'Liver'],
    tcm_element: 'Earth + Wood',
    energetics: ['Neutral', 'Slightly Warm', 'Sweet', 'Umami', 'Tonifying', 'Immune-Training', 'Cholesterol-Modulating'],
    primary_functions: [
      'Immune enhancement through daily food consumption — 4-week human RCT (5–10 g dried shiitake daily): ~60% increase in gamma-delta T cell proliferation, ~2-fold increase in NK-T cells, increased secretory IgA (mucosal immunity), reduced CRP and favourable cytokine shifts (increased IL-4, IL-10, TNF-alpha, IL-1alpha; decreased MIP-1alpha); improved immune function in less inflammatory milieu in healthy adults',
      'Lentinan as cancer adjuvant — purified beta-(1,3)-glucan with beta-(1,6) branches; clinically approved injectable adjuvant in Japan and China for gastric and lung cancer; binds Dectin-1 and complement receptor 3 on leukocytes; enhances IL-12, IFN-gamma, NK cell cytotoxicity and ADCC; synergises with monoclonal antibodies (e.g., trastuzumab) in tumour models',
      'Cholesterol and lipid modulation — eritadenine (unique adenosine-derived compound) enhances cholesterol clearance and alters phospholipid metabolism; 90 g fresh shiitake daily for 1 week lowered serum cholesterol ~12% in human experiment; rat studies show ~20–27% triglyceride reduction',
      'LEM (mycelial extract) cancer quality-of-life adjunct — double-blind RCT in breast cancer patients on anthracycline chemotherapy: LEM attenuated declines in quality of life and preserved NK cell activity and regulatory T cell balance vs placebo; supports use as oral adjuvant during chemotherapy',
      'Antioxidant and cytoprotective — ergothioneine (sulfur-containing amino acid with strong antioxidant properties) plus polyphenols reduce oxidative stress and provide anti-inflammatory and organ-protective effects',
    ],
    secondary_benefits: [
      'Culinary-medicinal hybrid — second most cultivated edible mushroom worldwide; central to East Asian cuisine for 2000+ years; healing woven into ordinary meals requires no special protocol',
      'Beta-glucan trained immunity via food — mechanism same as supplement-based beta-glucans but delivered through daily cooking; kitchen medicine as terrain building',
      'Shiitake dermatitis awareness — flagellate dermatitis (linear itchy rashes) occurs with raw or undercooked shiitake due to lentinan; always thoroughly cook to prevent; rare but documented',
      'Ergothioneine plasma levels linked in population studies to lower cardiovascular disease and type 2 diabetes risk',
    ],
    pharmacology:
      'Primary bioactives: lentinan (high-MW beta-(1,3)-D-glucan with beta-(1,6) branches; clinically approved injectable in Asia; PRIMARY immunomodulator — Dectin-1, CR3 binding; IL-12, IFN-gamma, NK activation; ADCC enhancement; cancer adjuvant), LEM/Lentinula edodes mycelia extract (oral biological response modifier; preserves NK activity and QOL during chemotherapy in RCT), eritadenine (unique adenosine-derived compound; cholesterol clearance enhancement; triglyceride reduction), ergothioneine (thiol antioxidant; cytoprotective; SOD support; cardiovascular biomarker), polyphenols (antioxidant; anti-inflammatory). Evidence: Grade B+ immune enhancement (4-week whole-mushroom human RCT); Grade B+ lentinan as cancer adjuvant (clinical use; multiple studies and reviews); Grade B cholesterol and lipids (animal models plus small human data); Grade A culinary safety.',
    flavor_profile: 'Rich, smoky, deeply umami and savoury — one of the most flavourful culinary mushrooms; intensifies significantly when dried; the defining flavour of East Asian cooking',
    contraindications: [
      'Raw or undercooked consumption — FLAGELLATE DERMATITIS RISK: itchy linear rashes from lentinan in uncooked or undercooked mushroom; always thoroughly cook',
      'Autoimmune disease or immunosuppressive therapy — CAUTION: concentrated lentinan and LEM as immunomodulators may conflict with intentional immune suppression; food-level culinary use very low risk; concentrated extracts require practitioner oversight',
      'Chemotherapy or active cancer treatment — LEM and lentinan injectable used clinically but require oncology team coordination; do not self-prescribe without medical oversight',
      'Mushroom allergy (rare) — discontinue if allergic reaction',
      'Otherwise: culinary shiitake: Grade A safety — very low risk widely across all ages and populations including pregnancy at food doses',
    ],
    herb_to_herb_synergy: [
      'Maitake — complementary beta-glucan immunomodulators; human and animal data show Shiitake plus Maitake combination produces stronger NK and phagocyte activation than either alone',
      'Reishi — Shen calming terrain support alongside Shiitake immune training; classical medicinal mushroom pairing',
      'Turkey Tail — comprehensive immune-training trio; different beta-glucan structures train different immune pathways',
      'Ginger and Garlic — culinary synergy in daily cooking; antimicrobial plus immune immune amplification',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms with immunosuppressant drugs — combined immune activation; coordinate carefully in transplant and autoimmune contexts',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — immunomodulating concentrated forms may counteract; food-level use very low risk',
      'Chemotherapy — LEM and lentinan injectable have defined oncology protocols; self-supplementation with extracts requires oncologist coordination',
    ],
    herb_interactions: [
      'Synergy: Maitake (NK-immune combination), Reishi (terrain-immune duo), Turkey Tail (beta-glucan diversity), Ginger and Garlic (culinary antimicrobial)',
      'Caution: concentrated immunomodulating extracts with immunosuppressant medications',
      'Drug interactions: immunosuppressants (low risk at food level; monitor concentrated forms), chemotherapy (oncologist coordination for LEM/lentinan)',
    ],
    dosage_range:
      'Culinary daily intake (OPTIMAL delivery): 5–10 g dried or 50–100 g fresh shiitake cooked into daily meals — this is the dose used in 4-week immune RCT. ALWAYS thoroughly cook — flagellate dermatitis from raw or undercooked. Lentinan injectable: clinical oncology use only (administered by clinicians; not a consumer product). LEM oral extract: per oncology protocol. Cholesterol support: clinical research used 90 g fresh daily; culinary integration provides gentler ongoing benefit. Regular cooking provides best compliance and lowest risk.',
    spiritual_layer:
      'Shiitake is the kitchen healer — medicine disguised as comfort food. Instead of asking for ceremony or protocol, she hides in soups and stir-fries, turning everyday meals into slow, quiet immunological rituals. She is the teaching that healing can be woven into the ordinary, that you do not need exotic substances or complex rituals for your body to remember balance, that pleasure and medicine can share the same plate. She has fed and healed people across East Asia for two millennia without ever demanding to be called medicine. She whispers: Healing can be woven into the ordinary. You do not need exotic substances or complex rituals. Pleasure and medicine can share the same plate.',
    best_preparation:
      'Thorough cooking is the most important instruction — always. Daily culinary integration (5–10 g dried or 50–100 g fresh) is the primary recommendation and the dose confirmed in human immune RCTs. Dried shiitake have more concentrated flavour and beta-glucans than fresh. For cancer-adjacent use of lentinan or LEM: these are clinical products requiring oncologist involvement, not consumer supplements. Screen for autoimmune conditions and immunosuppressants only for concentrated extracts — food-level culinary use is safe for all.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade B+ immune enhancement (4-week whole-mushroom human RCT confirmed). Grade B+ lentinan cancer adjuvant (clinical approval in Asia; multiple studies). Grade B cholesterol and lipids. Grade A culinary safety. COOKING IS MANDATORY (flagellate dermatitis from raw). Culinary daily integration is the primary recommendation. Lentinan and LEM require oncologist coordination.',
  },

  // ─────────────────────────────────────────────
  // TREMELLA (SNOW FUNGUS)
  // ─────────────────────────────────────────────
  {
    id: 310,
    name: 'Tremella',
    botanical: 'Tremella fuciformis (fruiting body — "Snow Fungus / Silver Ear")',
    tcm_meridians: ['Lung', 'Stomach', 'Spleen', 'Kidney'],
    tcm_element: 'Water + Metal',
    energetics: ['Neutral to Cool', 'Sweet', 'Moistening', 'Yin-Nourishing', 'Jing-Restorative', 'Skin-Hydrating', 'Neuroprotective'],
    primary_functions: [
      'Skin hydration and barrier protection — TF polysaccharides (glucuronoxylomannans) form hydrating film on skin; bind and retain water comparable to or exceeding hyaluronic acid in some assessments; topical emulsion with 0.1% Tremella extract increased epidermal hydration and reduced TEWL by ~12.4% in human volunteers; anti-photoaging and fibroblast protection from oxidative stress',
      'Neuroprotection and cognitive support — double-blind RCT: TFP supplementation in individuals with cognitive impairment significantly improved subjective memory complaints, short-term memory and executive function with increased grey matter volume; animal models show enhanced hippocampal CREB neurons, glucose uptake and cholinergic activity; reverses scopolamine-induced memory deficits',
      'Immunomodulation — TF polysaccharides activate NK cells, macrophages and T/B cells; clinically used in China as CFDA-approved enteric-coated capsule for leukopenia from chemotherapy and radiotherapy; NF-kB inhibition via Akt/p38MAPK/miR-155 suppression; Treg cell ratio increase in atopic dermatitis models',
      'Anti-inflammatory at innate immune level — polysaccharides decrease ROS and pro-inflammatory cytokines (TNF-alpha, IL-6) in LPS-stimulated macrophages; reduces NF-kB activation; anti-atopic-dermatitis effects (topical and oral) comparable to prednisolone in mouse models via gut-skin-immune axis',
      'Deep Lung-Stomach yin nourishment (TCM) — moistens Lung yin and Stomach yin; soothes dry cough, dry throat and dry mucosa; post-illness yin depletion recovery; rebuilds fluids and essence after fever, overwork or fluid loss',
    ],
    secondary_benefits: [
      'Radioprotective and haematopoietic — increases survival in irradiated animals; protects bone marrow; CFDA-approved use for leukopenia in cancer patients under oncology supervision',
      'Metabolic support — reduces blood glucose, improves insulin sensitivity and lowers lipids in preclinical and some clinical studies; gut microbiota modulation contributes to metabolic effects',
      'Imperial Chinese beauty mushroom — centuries of use specifically for women\'s radiance, skin and longevity in TCM; celebrated as "beauty mushroom" in Chinese imperial court',
      'Atopic dermatitis gut-skin axis — oral Tremella polysaccharides increase Treg ratio and reduce AD-like lesions via microbiome modulation; emerging role in inflammatory skin conditions',
    ],
    pharmacology:
      'Primary bioactives: TF polysaccharides / TFPS / TPS (glucuronoxylomannans — HIGH-MOLECULAR-WEIGHT heteropolysaccharides from mannose, xylose, fucose, arabinose and glucuronic acid; PRIMARY immunomodulatory; anti-aging; neuroprotective with neurotrophic effects; skin hydration film-forming; anti-inflammatory; gut microbiota modulation; CFDA-approved for leukopenia; low-MW fractions TFLP show higher bioavailability and bioactivity). Minor components: mannose, fucose, xylose, trace proteins, minerals and beta-glucan-like structures. CFDA-approved polysaccharide capsules for leukopenia adjunct therapy (China). Grade A-minus immune and leukopenia (clinical drug use); Grade B+ neuroprotection (RCT plus preclinical); Grade B+ skin hydration (human cosmetic studies plus fibroblast data); Grade B metabolic support; Grade A safety (culinary use history; low toxicity).',
    flavor_profile: 'Neutral to mildly sweet and gelatinous — delicate and pleasant; easily incorporated into soups, desserts and sweet tonics; the most aesthetically beautiful of medicinal mushrooms',
    contraindications: [
      'Pregnancy and breastfeeding — CAUTION: insufficient data on high-dose supplements; food-level culinary use (dried tremella in soup) generally safe; avoid concentrated supplements without provider guidance',
      'Autoimmune disease or immunosuppressive therapy — CAUTION: immunomodulatory activity; most data suggest modulation rather than overstimulation; use under practitioner oversight',
      'Anticoagulants or bleeding disorders — MONITOR: theoretical mild anticoagulant and platelet-modulating activity; limited robust clinical data; caution warranted',
      'Active cancer therapy — present to oncology team for approval; CFDA-approved leukopenia use is supervised; do not self-prescribe without oncologist',
      'Otherwise: very safe at culinary doses; long food history with no significant toxicity in healthy adults',
    ],
    herb_to_herb_synergy: [
      'Lily bulb (Bai He) and Ophiopogon (Mai Dong) — classical TCM Lung-yin moistening decoction; Tremella soup base with pear and goji',
      'Lion\'s Mane — dual neuroprotective mushroom combination; Tremella TFP polysaccharide support plus Lion\'s Mane NGF/BDNF stimulation',
      'Reishi, Maitake and Cordyceps — comprehensive medicinal mushroom longevity stack; Tremella provides distinctive moistening Yin counterbalance to more stimulating fungi',
      'Gotu Kola and Schisandra — skin and collagen beauty formula; antioxidant synergy for skin health and longevity',
    ],
    herb_to_herb_caution: [
      'Other immunomodulatory mushrooms in autoimmune conditions — cumulative immune modulation; practitioner guidance required',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — immunomodulatory activity may theoretically interact; monitor under practitioner oversight',
      'Anticoagulants and antiplatelets — theoretical mild anticoagulant; monitor INR if on Warfarin',
      'Hypoglycaemic medications — blood glucose lowering activity; monitor glucose levels',
    ],
    herb_interactions: [
      'Synergy: Lily Bulb, Ophiopogon (Lung-yin decoction), Lion\'s Mane (neuroprotection duo), Reishi, Maitake, Cordyceps (longevity stack), Gotu Kola, Schisandra (beauty formula)',
      'Caution: immunomodulatory mushrooms in autoimmune conditions (practitioner guidance)',
      'Drug interactions: immunosuppressants (monitor), anticoagulants (theoretical — monitor INR), hypoglycaemics (monitor glucose)',
    ],
    dosage_range:
      'Culinary (traditional and optimal): 3–10 g dried fruiting body rehydrated and simmered 30–90 minutes in soup or sweet dessert broth with goji berries, jujube and rock sugar; daily or several times weekly. Standardised polysaccharide extract: 1–3 g/day general health; 3–6 g/day for intensive immune or oncology-adjacent support under professional guidance; 600–1200 mg/day as used in cognitive RCT. Safe long-term daily tonic use at culinary doses.',
    spiritual_layer:
      'Tremella is a luminous yin cloud — a teacher of deep hydration, softness and resilient beauty. She grows as a gelatinous white jewel on wood, converting hardness into translucent nourishment. She teaches that softness is strength, that deep replenishment is not weakness but the source of sustained radiance, that the outer beauty the imperial court prized was always an expression of inner moisture and inner reserves that had been tended. She holds water the way the extracellular matrix holds water — as the medium in which all cellular life occurs, as the cushion between the hard things. She whispers: I am nourished from within. My inner waters are full and clear. I soften, replenish and glow with quiet strength.',
    best_preparation:
      'Traditional soup preparation (dried tremella rehydrated, simmered 30–90 minutes with goji, jujube and pear) for beauty, lung-yin and post-illness support. Polysaccharide extract powder for cognitive and immune protocols. Topical tremella serum or cream for skin alongside internal use. Screen autoimmune conditions (immunomodulator — practitioner oversight) and anticoagulants (theoretical — monitor). Food-level culinary use has excellent safety across all populations. The beauty dimension is a legitimate clinical framing — skin hydration and neuroprotection are both evidence-supported.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A-minus immune and leukopenia (CFDA-approved clinical drug). Grade B+ neuroprotection (RCT confirmed). Grade B+ skin hydration (human cosmetic studies). Grade B metabolic support. Grade A safety for culinary use. CAUTION: autoimmune disease (practitioner oversight), pregnancy/breastfeeding (insufficient high-dose data), anticoagulants (theoretical — monitor). Excellent long-term tonic food mushroom.',
  },

  // ─────────────────────────────────────────────
  // AMANITA MUSCARIA (FLY AGARIC)
  // ─────────────────────────────────────────────
  {
    id: 311,
    name: 'Amanita Muscaria',
    botanical: 'Amanita muscaria (fruiting body — "Fly Agaric / Threshold Grandmother")',
    tcm_meridians: [],
    tcm_element: 'Fire + Water',
    energetics: ['Mixed Excitatory-Sedative', 'Deliriant', 'Threshold-Opening', 'GABA-Agonist', 'Glutamate-Agonist', 'Liminal', 'Unpredictable'],
    primary_functions: [
      'GABA-A receptor agonist via muscimol — muscimol (3-isoxazolol GABA analog) is a potent direct agonist at GABA-A receptors (same binding site as GABA, NOT benzodiazepine or barbiturate sites); produces pronounced CNS inhibition, sedation, muscle relaxation, ataxia and altered sensory perception; also partial agonist at GABA-A-rho receptors',
      'Glutamate receptor agonism via ibotenic acid — ibotenic acid is a structural analog of glutamate/aspartate acting as NMDA and metabotropic glutamate receptor agonist; neuroexcitatory; decarboxylated in vivo to muscimol (both compounds present after ingestion); used experimentally to induce focal brain lesions in neuroscience research',
      'Mixed excitatory-depressive neurotoxidrome — ibotenic acid produces early agitation, hallucinations and delirium (excitatory phase); muscimol produces subsequent sedation, ataxia, stupor and coma-like sleep (inhibitory phase); onset 30 min–2 hours; typical duration 6–24 hours; seizures, respiratory depression and rare fatality documented',
      'Ethnomycological entheogenic use — long record of ritual use among indigenous Siberian peoples (Khanty, Evenki and others); shamanic divination, spirit travel and healing; traditional practices included urine recycling to reuse muscimol while reducing ibotenic acid; cannot be equated with modern unstructured consumption',
      'TOXICOLOGICAL WARNING — not a therapeutic fungus: case series document severe poisonings including fatalities; rising commercial Amanita products are creating public health concerns; no approved clinical indications exist',
    ],
    secondary_benefits: [
      'Neuroscience research tool only — muscimol is used as a pharmacological research tool for reversible inactivation of specific brain regions in animal studies; not a therapeutic application',
      'Pharmacological archetype — contrasts with psilocybin (5-HT2A agonist) as a GABA plus glutamate system mushroom; produces deliriant and sedative effects rather than classical psychedelic; important for mycological and pharmacological education',
      'Ecological role — ectomycorrhizal symbiont with birch, pine, spruce and other boreal trees; iconic species; globally recognisable; ecologically important despite being pharmaceutically dangerous',
      'Symbolic and folkloric richness — associated in lore with shamanism, fairy tales, Christmas iconography and numerous cultural traditions; educational and cultural significance is legitimate and separate from therapeutic claims',
    ],
    pharmacology:
      'Primary bioactives: muscimol (GABA analog; potent GABA-A agonist; CNS inhibition — sedation, ataxia, muscle relaxation, altered perception; also partial GABA-A-rho agonist), ibotenic acid (glutamate/aspartate analog; NMDA and metabotropic glutamate receptor agonist; neuroexcitatory; neurotoxic at high exposures; decarboxylates to muscimol; used to induce brain lesions in animal models). Clinical toxidrome: mixed excitatory-depressive; onset 30 min–2 hours; mydriasis, flushing, diaphoresis, GI symptoms; alternating agitation/hallucinations and somnolence/ataxia/stupor; seizures and respiratory depression in severe cases; mostly self-limited but fatalities documented. No therapeutic dose established. Rising commercial products with unregulated muscimol/ibotenic acid content creating public health emergency.',
    flavor_profile: 'Not consumed therapeutically — this entry is educational/taxonomic only; do not use as a beverage or tincture ingredient',
    contraindications: [
      'ABSOLUTE BLOCK FOR ALL INTERNAL USE — no safe established therapeutic dose; toxidrome unpredictable; fatalities documented',
      'ANY use by children or adolescents — ABSOLUTE BLOCK: severe neurological harm risk',
      'Pregnancy — ABSOLUTE BLOCK: neurotoxic to developing brain',
      'Any concurrent CNS-active medication — unpredictable interaction via GABA and glutamate systems',
      'Self-medication for any condition — ABSOLUTE BLOCK: no clinical indications; safer alternatives exist for every condition',
      'Seizure disorders — ABSOLUTE BLOCK: ibotenic acid is documented convulsant',
    ],
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [
      'CATEGORICALLY — no herb combinations for therapeutic use; this is an educational/taxonomic entry only',
    ],
    herb_to_drug_interactions: [
      'CNS depressants — additive CNS depression via GABA system; dangerous',
      'Anticonvulsants — ibotenic acid may reduce drug efficacy; seizure breakthrough risk',
      'All psychoactive medications — unpredictable interaction via combined GABA and glutamate system effects',
    ],
    herb_interactions: [
      'Synergy: None — no therapeutic formulation use',
      'Caution: All CNS-active substances (GABA system additive risk)',
      'Drug interactions: CNS depressants (additive), anticonvulsants (reduced efficacy), all psychoactive medications (unpredictable)',
    ],
    dosage_range:
      'NO THERAPEUTIC DOSE ESTABLISHED. This entry is educational and taxonomic only. For clinical toxicology reference: onset 30 min–2 hours; duration typically 6–24 hours; management is purely supportive (airway, breathing, circulation; benzodiazepines for agitation/seizures; activated charcoal if early; IV fluids; ICU monitoring if severe). Do not attempt to use this species medicinally.',
    spiritual_layer:
      'Amanita muscaria is the threshold grandmother — a liminal fungus sitting at the edge between waking and dream, inhibition and excitation. Unlike psilocybin which reveals patterns, she collapses and scrambles ordinary patterns, forcing a more chaotic re-encounter with self and unconscious content. She is the icon of the threshold itself: simultaneously the fairy-tale mushroom of childhood, the shaman\'s gateway, and the pharmacological teacher that shows what happens when GABA and glutamate are yanked in opposite directions simultaneously. Her teaching is: Not all gateways are gentle or precise. Some medicines teach by destabilising what you take for granted. True respect includes knowing when not to cross a threshold.',
    best_preparation:
      'DATABASE ENTRY IS EDUCATIONAL AND TAXONOMIC ONLY. Do not include in any tincture, beverage or supplement formulation. For educational content: describe taxonomy, ethnomycology and pharmacological mechanism. Clearly distinguish from psilocybin-containing mushrooms (different mechanism entirely). Always communicate that commercial muscimol products are an emerging public health risk with unregulated content and unpredictable toxicity.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'EDUCATIONAL AND TAXONOMIC ENTRY ONLY — NOT FOR THERAPEUTIC FORMULATION. Pharmacological archetype: GABA-A agonist (muscimol) plus NMDA/mGluR agonist (ibotenic acid). Mixed excitatory-depressive toxidrome. Fatalities documented. No approved clinical indications. Rising commercial products creating public health emergency. Hard block for all internal use recommendations.',
  },

  // ─────────────────────────────────────────────
  // AMANITA PANTHERINA (PANTHER CAP)
  // ─────────────────────────────────────────────
  {
    id: 312,
    name: 'Amanita Pantherina',
    botanical: 'Amanita pantherina (fruiting body — "Panther Cap")',
    tcm_meridians: [],
    tcm_element: 'Fire + Water',
    energetics: ['High-Potency Excitatory-Sedative', 'Deliriant', 'Neurotoxic', 'Narrow Safety Margin', 'Unpredictable', 'Dangerous'],
    primary_functions: [
      'Higher-potency muscimol and ibotenic acid mushroom — same core pharmacology as Amanita muscaria (GABA-A agonism via muscimol; NMDA/mGluR agonism via ibotenic acid) but generally higher combined alkaloid concentrations per gram; narrower safety margin; more severe toxicity at lower ingested doses',
      'More severe neurological presentations than A. muscaria — case literature documents more frequent seizures, deeper coma, significant respiratory depression and fatalities compared to typical A. muscaria cases at similar ingested weights; fatal cases documented particularly in children and adults with large ingestions',
      'Mixed excitatory-depressive toxidrome — identical mechanism to A. muscaria: early ibotenic acid neuroexcitation (agitation, confusion, hallucinations, myoclonus, seizures) followed by muscimol-mediated CNS depression (somnolence, ataxia, stupor, respiratory compromise); onset 30 min–3 hours; significant symptoms 6–24 hours',
      'TOXICOLOGICAL CLASSIFICATION — poisonous mushroom: universally classified as dangerous in all medical and mycological references; variable potency and unpredictable toxicity make it particularly hazardous; misidentification with edible brown Amanita species is a significant risk',
      'Public health concern — rising Amanita commercial products (often containing or confused with A. pantherina) are creating increased severe poisonings; consumers treating these as benign legal highs is an emerging emergency',
    ],
    secondary_benefits: [
      'NONE — this is an educational and taxonomic entry; no therapeutic benefits to document',
      'Pharmacological contrast to A. muscaria — higher alkaloid density illustrates that within the same mechanism class, concentration determines severity; educational for understanding mushroom toxicology',
      'Morphological contrast — olive-brown to dark brown (NOT red like A. muscaria) with distinctive concentric volval rings at base; educational for mushroom identification and safety',
    ],
    pharmacology:
      'Same mechanism as A. muscaria: muscimol (GABA-A agonist) plus ibotenic acid (NMDA and mGluR agonist) but HIGHER and MORE VARIABLE concentrations than typical A. muscaria. This higher alkaloid density = narrower safety margin = more frequent severe poisonings in case literature. Clinical presentation: seizures, deep coma, respiratory depression and documented fatalities more common than with A. muscaria. Management: purely supportive (no specific antidote); ICU-level monitoring required. Rising commercial risk: Amanita products increasingly contain A. pantherina or mixed species with unverified alkaloid content.',
    flavor_profile: 'NOT for consumption — educational and taxonomic entry only',
    contraindications: [
      'ABSOLUTE BLOCK FOR ALL USE — poisonous mushroom; no established therapeutic dose; serious neurological toxicity and fatalities documented',
      'ALL populations — children, adults, elderly, pregnant, all without exception: ABSOLUTE BLOCK',
      'Any CNS condition — ibotenic acid is convulsant; seizure risk',
      'Any concurrent medication — unpredictable interactions via GABA and glutamate systems',
    ],
    herb_to_herb_synergy: [],
    herb_to_herb_caution: [
      'CATEGORICALLY — no therapeutic formulation use; educational entry only',
    ],
    herb_to_drug_interactions: [
      'CNS depressants — additive CNS depression; dangerous',
      'Anticonvulsants — ibotenic acid may reduce efficacy; seizure breakthrough risk',
    ],
    herb_interactions: [
      'Synergy: None — no therapeutic use',
      'Caution: All CNS-active substances',
      'Drug interactions: CNS depressants (additive danger), anticonvulsants (reduced efficacy risk)',
    ],
    dosage_range:
      'NO THERAPEUTIC DOSE. Educational entry only. Clinical toxicology note: higher alkaloid density than A. muscaria means effective toxic dose is lower and less predictable. Supportive care only (no antidote); benzodiazepines for seizures; ICU monitoring.',
    spiritual_layer:
      'Amanita pantherina is the panther teacher — sleek, powerful and inherently risky. Where A. muscaria stands as a liminal grandmother at the threshold, A. pantherina embodies concentrated, volatile power with little room for error. She teaches: Power without proportion is peril. Some forces do not invite casual contact; they exist as reminders that not every gateway is meant to be walked through. Respect includes knowing when to abstain.',
    best_preparation:
      'DATABASE ENTRY IS EDUCATIONAL AND TAXONOMIC ONLY. Absolutely do not include in any therapeutic formulation. More dangerous than A. muscaria due to higher and more variable alkaloid content. Misidentification with A. muscaria is a serious risk. Commercial products claiming to contain Amanita species may contain A. pantherina — this is an emerging public health hazard.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status:
      'EDUCATIONAL AND TAXONOMIC ENTRY ONLY — NOT FOR THERAPEUTIC FORMULATION. Poisonous mushroom. Higher alkaloid concentration than A. muscaria = narrower safety margin = more frequent severe poisonings. Fatal cases documented. Absolutely no therapeutic use. Hard block all recommendations.',
  },

  // ─────────────────────────────────────────────
  // SHAGGY MANE (INK CAP)
  // ─────────────────────────────────────────────
  {
    id: 313,
    name: 'Shaggy Mane',
    botanical: 'Coprinus comatus (young fruiting body only — "Shaggy Ink Cap / Ephemeral Glycaemic Scalpel")',
    tcm_meridians: ['Spleen', 'Stomach', 'Liver'],
    tcm_element: 'Earth + Water',
    energetics: ['Cool', 'Neutral', 'Bitter', 'Astringent', 'Hypoglycaemic', 'Hepatoprotective', 'Ephemeral'],
    primary_functions: [
      'Potent antidiabetic and hypoglycaemic — comatin (low-MW antidiabetic compound) reduced blood glucose from 5.14 to 4.28 mmol/L within 3 hours in normal rats; 28-day comatin treatment in diabetic rabbits lowered fasting blood glucose, fructosamine, triglycerides and total cholesterol, often outperforming metformin at equivalent dose; DPP-4 inhibitory activity (incretin pathway) also documented',
      'Cholesterol and lipid reduction — comatin treatment reduced total cholesterol up to 49.3% and triglycerides 28.7% in diabetic rabbits; fruiting body extracts lower LDL, total cholesterol and triglycerides while raising HDL in diabetic rat models',
      'Hepatoprotective and antioxidant — polysaccharides and extracts improved antioxidant capacity and protected against CCl4-induced liver damage in 42-day rat study; reduced aminotransferases and lipid peroxidation; increased glutathione and normalised liver histology; alcohol-induced liver inflammation attenuated via IL-6, iNOS and COX-2 reduction',
      'Anti-inflammatory and anti-arthritic — C. comatus nanogels in rheumatoid arthritis model showed significant reductions in TNF-alpha, IL-1beta, IL-6, COX-2, paw oedema (-27.75%) and arthritis index (-45.45%); potent anti-inflammatory profile',
      'Antiandrogenic and anticancer — ethyl acetate extract inhibited androgen-sensitive prostate cancer cells (LNCaP) by suppressing androgen receptor transcriptional activity and PSA expression; activity against leukemia and various tumour cell lines documented',
    ],
    secondary_benefits: [
      'Antimicrobial and antiparasitic — antibacterial, antifungal, antiviral and antinematode activity in vitro and in vivo; broad-spectrum antimicrobial profile',
      'Acetylcholinesterase inhibitory activity — suggests possible neuroprotective or cognitive implications; early data only',
      'Culinary use (regional) — edible when very young (white, firm, gills still white); rapidly autolysis into black ink within hours; must be cooked promptly after harvest; popular in East Asian and some European traditional cooking',
      'SAFETY CAVEATS: misidentification risk with Coprinopsis atramentaria (alcohol-reactive — causes vomiting with alcohol for up to 72 hours); rapid autolysis; heavy metal accumulation in urban soils',
    ],
    pharmacology:
      'Primary bioactives: comatin (low-MW hypoglycaemic compound; reduces blood glucose, fructosamine, cholesterol, triglycerides; outperforms metformin in some animal models; DPP-4 inhibitory activity), polysaccharides (antioxidant; antidiabetic; anti-obesity; immunomodulatory; hepatoprotective; anti-inflammatory; nanogel formulations for RA models), ergothioneine (antioxidant; DNA-protective; anti-inflammatory), flavonoids, phenolic acids, triterpenoids, sterols (antioxidant; antimicrobial). SAFETY: allergic skin reactions reported; misidentification risk with Coprinopsis atramentaria (alcohol-reactive); rapid autolysis post-harvest (microbial spoilage risk); heavy metal accumulation in urban environments. Evidence grades: Grade B+ antidiabetic preclinical (strong animal data); Grade B+ antioxidant and hepatoprotective; Grade B+ anti-inflammatory; Grade B anticancer; Grade C+ clinical (promising but very limited human trials).',
    flavor_profile: 'Delicate, mild and pleasant when very young — nutty and slightly sweet; quality window extremely short (hours) before autolysis begins; must be consumed immediately after harvest',
    contraindications: [
      'Alcohol consumption within 72 hours — CRITICAL MISIDENTIFICATION RISK: Coprinopsis atramentaria (common ink cap) looks similar and is alcohol-reactive (coprine causes vomiting, flushing, palpitations for up to 72 hours after consumption); ALWAYS positively identify Coprinus comatus',
      'Urban or contaminated soil collection — AVOID: Coprinus readily accumulates heavy metals and environmental pollutants; only collect from clean areas',
      'Any mushroom allergy — CAUTION: allergic skin reactions documented; monitor',
      'Diabetes medications — MONITOR: potent antidiabetic comatin may enhance hypoglycaemic drug effect; MONITOR blood glucose if using concentrated extracts',
      'Autoimmune conditions — CAUTION: immunomodulatory; practitioner guidance',
      'Raw consumption — AVOID: raw Coprinus may cause GI upset and possibly neurotoxic symptoms; always cook thoroughly',
    ],
    herb_to_herb_synergy: [
      'Berberine herbs (Oregon Grape, Barberry) — complementary antidiabetic mechanisms; DPP-4 plus AMPK activation',
      'Milk Thistle and Dandelion Root — complementary hepatoprotective protocols',
      'Turmeric — dual anti-inflammatory combination; NF-kB plus cytokine pathway synergy',
    ],
    herb_to_herb_caution: [
      'Diabetes herbs with diabetes medications — additive hypoglycaemic effect; monitor blood glucose carefully',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications (insulin, metformin, sulphonylureas) — MONITOR: potent antidiabetic comatin may enhance effect; hypoglycaemia risk',
      'Chemotherapy — coordinate with oncologist for anticancer applications',
    ],
    herb_interactions: [
      'Synergy: Berberine herbs (antidiabetic), Milk Thistle, Dandelion Root (hepatoprotective), Turmeric (anti-inflammatory)',
      'Caution: diabetes herbs with diabetes medications (additive — monitor glucose)',
      'Drug interactions: diabetes medications (MONITOR — comatin may enhance hypoglycaemic effect)',
    ],
    dosage_range:
      'Culinary use (traditional, ONLY from clean areas, properly identified): very young fruiting bodies only (white, firm, gills white-pink); cook immediately — autolysis begins within hours of harvest; not suitable for drying or long storage. Experimental extract doses from animal studies (for reference only, not consumer guidance): comatin 80 mg/kg; fruiting body extract 400–750 mg/kg; these are high doses relative to typical culinary intake. Clinical human data is very limited — no standardised consumer dosing established.',
    spiritual_layer:
      'Shaggy Mane is the ephemeral glycaemic scalpel — a short-lived mushroom that cuts through sugar peaks and oxidative smog but must be handled wisely. The young white caps turning to black ink within hours point to the fleeting window where intense medicine and decay sit side by side. She teaches that potent medicine exists in transient forms, that some healing is available only to those who are present and prepared, that the window between medicine and decay is sometimes measured in hours. She whispers: I am present in the moment of possibility. I cut cleanly and precisely. I transform what does not serve. My power is real but ephemeral — meet me when I am here.',
    best_preparation:
      'Culinary use only for this database — very young, properly identified fruiting bodies from clean, non-urban areas, cooked immediately. CRITICAL: positive identification is essential (distinguish from Coprinopsis atramentaria — the alcohol-reactive look-alike). Heavy metal contamination risk in urban collection sites. Concentrated extracts and comatin are research compounds — no consumer products currently standardised. Screen diabetes medications (MONITOR glucose). Position as emerging functional mushroom with impressive preclinical data but limited human clinical translation.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ antidiabetic preclinical (comatin outperforms metformin in animal models). Grade B+ antioxidant and hepatoprotective. Grade B anti-inflammatory and anticancer. Grade C+ clinical (limited human data). MISIDENTIFICATION RISK with Coprinopsis atramentaria (alcohol-reactive). Heavy metal accumulation risk in urban environments. Rapidly autolysing — short harvesting window. Diabetes medication monitoring essential for concentrated extracts.',
  },

  // ─────────────────────────────────────────────
  // BUTTON MUSHROOM
  // ─────────────────────────────────────────────
  {
    id: 314,
    name: 'Button Mushroom',
    botanical: 'Agaricus bisporus (fruiting body — Button / Cremini / Portobello — "Commoner\'s Shield")',
    tcm_meridians: ['Spleen', 'Stomach', 'Kidney'],
    tcm_element: 'Earth',
    energetics: ['Neutral', 'Sweet', 'Nourishing', 'Grounding', 'Immune-Training', 'Metabolic-Supporting', 'Daily-Foundation'],
    primary_functions: [
      'Trained immunity via beta-glucans — beta-glucan-rich fractions train bone-marrow-derived macrophages: after 24-hour exposure and 7-day rest, cells show enhanced TNF and IL-6 responses to LPS or Pam3CSK4 restimulation; metabolic reprogramming via increased oxidative phosphorylation and glycolysis supporting epigenetic changes (histone demethylase inhibition); fractionation confirms beta-glucans as the active component',
      'Vitamin D status improvement — ergosterol (vitamin D2 precursor) enriched by UV exposure during cultivation; UV-treated button mushrooms significantly improve human vitamin D status in clinical trials; most accessible dietary source of plant-based vitamin D2',
      'Cardiometabolic support — reduce plasma total cholesterol, LDL and triglycerides while increasing HDL and lowering blood glucose in clinical and animal studies; cardiovascular protective mechanisms include endothelial support and LDL oxidation reduction; hydroalcoholic extract reduced markers of chemically-induced cardiac damage',
      'Gut microbiota prebiotic effect — polysaccharides promote beneficial bacteria (Bifidobacterium, Bacteroidetes) and increase SCFA production while reducing Firmicutes; gut barrier integrity improvement; anti-inflammatory microbiome modulation',
      'Everyday accessible food medicine — globally most consumed edible mushroom; delivers beta-glucans, ergothioneine, B-vitamins and functional compounds through routine daily meals without any protocol burden',
    ],
    secondary_benefits: [
      'Ergothioneine as cardiovascular biomarker — higher plasma ergothioneine levels linked in population studies to lower risk of cardiovascular disease and type 2 diabetes; button mushrooms as primary dietary source of ergothioneine',
      'Antimicrobial activity — ethanolic and acetonic extracts antibacterial against Gram-positive and Gram-negative pathogens including multidrug-resistant strains; activity linked to phenolics, flavonoids and secondary metabolites',
      'Hepatoprotective — extracts demonstrate protection against chemical liver injury in animal models by lowering liver enzymes and oxidative damage markers',
      'Anticancer and antigenotoxic potential — polysaccharides, lectins and phenolic compounds show antiproliferative and antimutagenic properties in preclinical work; supportive evidence for cancer risk reduction through regular consumption',
    ],
    pharmacology:
      'Primary bioactives: beta-glucans and non-starch polysaccharides including chitin (trained immunity via macrophage epigenetic reprogramming; immune adjuvancy; gut prebiotic; antioxidant), ergosterol (vitamin D2 precursor; hypocholesterolaemic; antioxidant; significant dietary source of both ergosterol and ergothioneine), ergothioneine (unique thiol antioxidant; cardiovascular and metabolic biomarker; concentrated in mushrooms), phenolic compounds and flavonoid-like antioxidants (ROS scavenging; anti-inflammatory), lectins, glycoproteins and peptides (antihypertensive; immunomodulatory), B-vitamins (riboflavin, niacin, pantothenic acid), minerals (potassium, phosphorus, selenium). Evidence: Grade B trained immunity (human macrophage work plus RCT data); Grade B+ metabolic syndrome (multiple human studies for vitamin D; promising but limited data for cardiometabolic markers); Grade B gut microbiota; Grade A culinary safety.',
    flavor_profile: 'Mild, earthy and pleasantly umami — universally accessible flavour that intensifies with cooking; the most familiar of all mushroom flavours; accepts any culinary preparation',
    contraindications: [
      'Raw consumption — mild GI discomfort in some individuals; always best cooked for easier digestion',
      'Mushroom allergy (rare) — discontinue if allergic reaction',
      'Otherwise: Grade A safety — globally consumed; very well tolerated across all populations including children, elderly and pregnancy at food doses',
    ],
    herb_to_herb_synergy: [
      'Shiitake and Oyster Mushroom — daily culinary mushroom trio for comprehensive beta-glucan trained immunity through ordinary meals',
      'Garlic and Onion — prebiotic and antimicrobial amplification; gut health kitchen combination',
      'Turmeric and Black Pepper — anti-inflammatory and antioxidant amplification in daily cooking',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns — Button Mushroom is universally compatible and enhances rather than conflicts',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented at food doses',
      'Theoretical mild glucose-lowering; monitor if on tight diabetic management with concentrated extracts (not culinary)',
    ],
    herb_interactions: [
      'Synergy: Shiitake, Oyster Mushroom (daily immunity trio), Garlic and Onion (prebiotic kitchen), Turmeric and Black Pepper (anti-inflammatory cooking)',
      'Caution: None',
      'Drug interactions: None at food doses; theoretical glucose monitoring with concentrated extracts',
    ],
    dosage_range:
      'Culinary daily integration (OPTIMAL): 50–150 g fresh or 5–15 g dried cooked into daily meals — this is the most practical and effective delivery for trained immunity and metabolic benefits. UV-exposed mushrooms for vitamin D: product-specific D2 content; check label. Functional extracts (standardised for beta-glucan): dosing per product standardisation for specific research outcomes. No supplementation burden — daily cooking is the protocol.',
    spiritual_layer:
      'Button Mushroom is the ordinary guardian — an unassuming mushroom that quietly educates immune cells, nourishes gut flora and steadies glucose, lipids and vitamin D toward balance. She is kitchen-table medicine, the everyday Earth presence that builds health through simple repetition of small meals. She embodies the teaching that transformation is not always dramatic — that daily consistency, humble and unremarkable, reshapes baselines over months and years in ways that no single intervention can match. She is the commoner\'s shield: protecting through availability, accessibility and reliable constancy. She whispers: I protect through consistency. Daily simplicity builds lasting resilience. Ordinary actions compound into extraordinary health.',
    best_preparation:
      'Daily cooking — sautéed, roasted, in soups and stews. UV-treated products for vitamin D enhancement (check label). Thorough cooking improves digestibility and beta-glucan availability. No screening required — safe for all populations. The key clinical message is that regular daily culinary consumption is both the mechanism (beta-glucan trained immunity requires consistent exposure) and the most practical delivery route.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade B trained immunity (macrophage beta-glucan epigenetic reprogramming confirmed; human data). Grade B+ vitamin D status (clinical trials confirmed). Grade B gut microbiota and cardiometabolic. Grade A culinary safety. No drug interactions at food doses. Daily culinary integration is the primary recommendation.',
  },

  // ─────────────────────────────────────────────
  // ENOKI
  // ─────────────────────────────────────────────
  {
    id: 315,
    name: 'Enoki',
    botanical: 'Flammulina velutipes (fruiting body — "Winter Filament / Golden Needle Mushroom")',
    tcm_meridians: ['Liver', 'Kidney', 'Spleen'],
    tcm_element: 'Water + Metal',
    energetics: ['Neutral to Cool', 'Sweet', 'Antioxidant', 'Anti-Ageing', 'Neuroprotective', 'Renoprotective', 'Gentle'],
    primary_functions: [
      'Antioxidant and anti-ageing — sulfated FVP polysaccharides (SFPS) from F. velutipes residue show strong DPPH, hydroxyl and superoxide radical scavenging; in D-galactose-induced aging mice, SFPS increases SOD, GSH-Px, CAT and total antioxidant capacity, reduces MDA and lipid peroxidation, improves inflammatory markers and aging signs; NOS activity elevation and AChE reduction suggest neuroprotective and cognitive support in aging',
      'Periodontal and tissue protection (anti-inflammaging) — FVP polysaccharides protect human gingival fibroblasts from AGEs/LPS-induced damage: scavenges ROS, inhibits NLRP3 inflammasome activation, prevents caspase-1-mediated pyroptosis, reduces IL-1beta/IL-18 release, IL-6/IL-8 and senescence markers (p16, SA-beta-gal); restores cell survival and wound healing',
      'Renoprotective and metabolic — residue polysaccharides (En-RPS) decrease serum creatinine, BUN and glucose; increase renal SOD, CAT and GSH-Px while lowering MDA in STZ-induced diabetic mice; antioxidant and renoprotective mechanisms in diabetic kidney disease model',
      'Antimicrobial and antifungal — extracts inhibit adhesion of Candida albicans and Sporothrix schenckii to epithelial cells via mannose-rich polysaccharides; anti-adhesive and antifungal properties; broader antibacterial activity against multiple pathogens',
      'Traditional and folk longevity — longstanding use in Japan, China and Korea for longevity, cardiovascular health, immune support and cognitive clarity; now framed as anti-ageing culinary-medicinal strategy',
    ],
    secondary_benefits: [
      'Cardiovascular cholesterol modulation — some studies indicate cholesterol-lowering effects; preclinical data support cardiovascular and lipid support',
      'DOSE-DEPENDENT TOXICITY CAUTION: high doses of wild winter mushroom extracts in animals revealed myotoxic and cardiotoxic effects (elevated creatine kinase and histologic cardiac changes at 6–9 g/kg/day); this is a dose issue, not a culinary-dose concern — cultivated enoki at dietary portions is entirely different from high-dose wild extracts',
      'Anti-inflammatory in multiple tissues — broad anti-pyroptotic and anti-senescence mechanisms across gingival, renal and systemic tissues',
      'Proteins and lectins (FVE) — immunomodulatory; minor allergenic potential in sensitive individuals',
    ],
    pharmacology:
      'Primary bioactives: FPS/FVP/SFPS polysaccharides (PRIMARY — antioxidant via DPPH, hydroxyl and superoxide scavenging; anti-ageing via SOD, CAT, GSH-Px upregulation; neuroprotective via NOS and AChE modulation; anti-pyroptotic via NLRP3 inflammasome inhibition; renoprotective via oxidative stress reduction; antifungal via anti-adhesion mechanisms), proteins and lectins (FVE — immunomodulatory; some allergenic potential), lipids, sterols, phenolic compounds, micronutrients. SAFETY NOTE: high-dose wild extract toxicity (myotoxic and cardiotoxic at 6–9 g/kg/day in animals) is dose-dependent and not relevant to culinary portions of cultivated enoki. Evidence: Grade B+ antioxidant and anti-ageing (strong preclinical); Grade B periodontal/gum protection (human fibroblast work); Grade B renoprotective and metabolic; Grade C+ antimicrobial; Grade B culinary safety.',
    flavor_profile: 'Mild, slightly sweet and delicate with a pleasant crunchy texture — one of the most tender culinary mushrooms; excellent in soups, hotpots and light stir-fries',
    contraindications: [
      'Mushroom allergy (rare) — proteins and lectins may provoke allergic reactions in susceptible individuals; discontinue if reaction',
      'Raw consumption — cook thoroughly; raw enoki can cause GI discomfort',
      'High-dose concentrated wild-source extracts — CAUTION: myotoxic and cardiotoxic effects documented at very high doses in animals (6–9 g/kg/day); cultivated culinary portions are entirely safe; concentrated wild-source extracts are a different category',
      'Cardiac disease with very high-dose extract use — not relevant to food use; monitoring concern for research-grade concentrated preparations only',
      'Otherwise: Grade B+ safety for culinary and moderate extract use',
    ],
    herb_to_herb_synergy: [
      'Tremella — dual yin-nourishing and anti-ageing mushroom combination; gelatinous texture affinity in traditional soups',
      'Reishi and Cordyceps — anti-ageing longevity mushroom trio; Enoki antioxidant plus Reishi Shen plus Cordyceps ATP',
      'Gotu Kola — anti-ageing and tissue repair synergy; collagen and connective tissue support',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns at culinary doses',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented at culinary doses',
      'Diabetes medications — mild glucose-lowering activity in animal models; monitor glucose if using concentrated extracts',
    ],
    herb_interactions: [
      'Synergy: Tremella (yin-nourishing anti-ageing soup), Reishi and Cordyceps (longevity trio), Gotu Kola (tissue repair)',
      'Caution: None at culinary doses; high-dose concentrated wild extracts (cardiac and muscle monitoring)',
      'Drug interactions: Diabetes medications (mild — monitor glucose with concentrated extracts only)',
    ],
    dosage_range:
      'Culinary (OPTIMAL): 50–150 g fresh cultivated enoki cooked in soups, hotpots and stir-fries; daily or several times weekly. Polysaccharide extracts (FPS, FVP, SFPS): research preparations with no standardised consumer dosing yet established. Duration: safe for regular daily culinary integration. High-dose concentrated extracts: research context only; cardiac and muscle monitoring warranted.',
    spiritual_layer:
      'Enoki is the winter filament — fine white threads rising from cold wood like flames that never burn, slender and cool and capable of weaving antioxidant, vascular, renal and gingival protection into slow, subtle rejuvenation. She grows in tight clusters in cold seasons, teaching that vitality is possible in the most inhospitable conditions, that slenderness and apparent fragility can carry profound protective intelligence. Her anti-ageing teaching is the anti-inflammatory stitching of oxidative tears across decades of cellular life. She whispers: I am fine and resilient. I stitch what has been torn. I remain vital in the cold. Small consistent interventions compound into enduring youth.',
    best_preparation:
      'Cultivated enoki in daily culinary use (soups, hotpots, light cooking — cook thoroughly for best digestibility). Polysaccharide extracts for targeted anti-ageing, renal or periodontal protocols are research-grade — no standardised consumer products yet. Screen mushroom allergy (proteins and lectins). Important distinction: cultivated culinary enoki is entirely different from high-dose wild-extract preparations — never conflate the two in dosing guidance.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade B+ antioxidant and anti-ageing (strong preclinical data; SFPS confirmed). Grade B periodontal/gum protection (human fibroblast work). Grade B renoprotective and metabolic. Grade B culinary safety. Note: high-dose wild extract toxicity exists but is irrelevant to culinary portions of cultivated enoki. Daily culinary integration is the primary recommendation.',
  },

  // ─────────────────────────────────────────────
  // FU LING / PORIA (WOLFIPORIA COCOS)
  // ─────────────────────────────────────────────
  {
    id: 316,
    name: 'Fu Ling',
    botanical: 'Wolfiporia cocos (syn. Poria cocos) (sclerotium — "White Stone of Stillness")',
    tcm_meridians: ['Heart', 'Spleen', 'Kidney'],
    tcm_element: 'Earth + Water',
    energetics: ['Neutral', 'Bland', 'Sweet', 'Slightly Drying', 'Damp-Draining', 'Spleen-Tonifying', 'Shen-Calming', 'Diuretic'],
    primary_functions: [
      'Spleen qi tonification and damp draining — bland sweet taste tonifies Spleen qi (foundational energy production); promotes urination and leaches dampness; addresses oedema, urinary difficulty and phlegm-fluid accumulation; strengthens digestion and assimilation in spleen deficiency patterns with poor appetite, loose stools and fatigue',
      'Renoprotective and diuretic — surface layer (Fu Ling Pi) shows particular diuretic potency and targeted renoprotective effects in models of acute kidney injury, diabetic kidney disease, nephrotic syndrome and tubulointerstitial nephropathy; mechanisms include TGF-beta1/Smad, Wnt/beta-catenin, NF-kB, Nrf2/MAPK, renin-angiotensin system and matrix metalloproteinase modulation',
      'Antitumour and organ protection — polysaccharides and triterpenes show broad antitumour activity in lung, breast, gastric, liver, pancreatic and kidney cancer models; CMP polysaccharides significantly mitigate 5-fluorouracil-induced colon damage by decreasing ROS and inflammatory markers while increasing antioxidant enzymes; chemotherapy protection and adjunct role',
      'Immunomodulation — PCP and PCP-I polysaccharides activate macrophages via Ca2+/PKC/p38/NF-kB; act as immune adjuvants enhancing innate and adaptive responses; lanostane triterpenoids activate NK cells and skew Th1/Th2 toward Th1 (IFN-gamma increase, IL-4/IL-5 decrease); anti-allergic potential via Th1/Th2 rebalancing',
      'Shen calming and sleep support — traditional use for palpitations, insomnia and anxiety from heart-spleen disharmony; Fu Shen (sclerotium with pine root) emphasises spirit calming; mechanistic work on gut-brain-serotonin axis and TCM heart-spirit integration is still developing but supported by centuries of clinical use',
    ],
    secondary_benefits: [
      'Anti-inflammatory — poricoic acid GM and related triterpenes inhibit NO production and COX-2, PGE2, IL-1beta, IL-6 and TNF-alpha in LPS-stimulated macrophages via NF-kB and Nrf2/MAPK; systemic anti-inflammatory contribution',
      'Gut barrier integrity — triterpenes protect Caco-2 intestinal epithelial monolayers from inflammatory insults via glucocorticoid receptor and PI3K/Akt/NF-kB; glycolipid metabolism improvement and diabetic peripheral neuropathy support',
      'Millennia of use — classical TCM sclerotial fungus used for thousands of years in complex formulas; one of the most frequently prescribed TCM herbs across all classical texts',
      'Processing variants: plain Fu Ling (spleen-damp), Fu Shen with wood (Shen-calming heart), Fu Ling Pi skin (stronger diuretic), Chi Fu Ling and Bai Fu Ling (blood vs spleen emphasis)',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (beta-glucans and heteroglycans — PCP, PCP-I, CMP fractions; antitumour; antioxidant; anti-inflammatory; immunomodulatory; gut-barrier; hepatoprotective; nephroprotective; chemotherapy protection), lanostane and 3,4-seco-lanostane triterpenoids (poricoic acids, pachymic acid, tumulosic acid — concentrated in epidermis; anti-inflammatory; renoprotective; antitumour; Th1/NK activation; anti-allergic), sterols and ergosterol, fatty acids, amino acids and trace minerals. Preparation significantly affects chemistry: raw vs wine-fried vs charred forms have distinct indications in TCM. Epidermis vs inner core show distinct triterpene distributions. Evidence: Grade B+ diuretic and renoprotective (preclinical + growing clinical); Grade B antitumour (multiple models); Grade B immunomodulation; Grade B anti-inflammatory; Grade A traditional safety.',
    flavor_profile: 'Bland and neutral with very mild sweetness — essentially flavourless in cooking; easily added to soups, broths and teas without altering taste; the "invisible tonic" of Chinese cuisine',
    contraindications: [
      'Marked dryness, yin or fluid deficiency without dampness — traditional TCM caution: as a damp-draining diuretic, may worsen dryness patterns; requires TCM pattern differentiation',
      'Pregnancy — general medicinal use caution; food-level amounts in traditional cooking are widely considered safe; concentrated extracts require clinical guidance',
      'High-dose long-term use without reassessment — review every 8–12 weeks; Fu Ling is designed for cycling in TCM rather than indefinite unmonitored use',
      'Otherwise: long history as edible-medicinal herb; generally well tolerated within traditional dosage ranges; low toxicity in preclinical studies',
    ],
    herb_to_herb_synergy: [
      'Atractylodes (Bai Zhu) and Ginseng — the classic Si Junzi Tang (Four Gentlemen Decoction): spleen qi tonification trio; foundational TCM formula',
      'Astragalus — Lung and spleen qi building; Wei Qi support and deep tonification',
      'Rehmannia and Cornelian Cherry — Liu Wei Di Huang Wan base; Kidney essence nourishing with Fu Ling damp-drainage balance',
      'Schisandra and Ziziphus seed — Shen-calming formula for heart-spleen insomnia pattern',
    ],
    herb_to_herb_caution: [
      'Very strong drying or diuretic herbs in fluid-deficient constitution — cumulative drying effect; assess TCM pattern before combining',
    ],
    herb_to_drug_interactions: [
      'Diuretics — additive diuretic effect; monitor electrolytes and fluid balance',
      'Immunosuppressants — immunomodulatory activity may theoretically interact; practitioner oversight in transplant or autoimmune contexts',
      'Hypoglycaemic medications — glycolipid metabolism improvement may modestly affect glucose; monitor',
    ],
    herb_interactions: [
      'Synergy: Atractylodes and Ginseng (Four Gentlemen formula), Astragalus (Wei Qi tonification), Rehmannia and Cornelian Cherry (Kidney essence formulas), Schisandra and Ziziphus (Shen-calming sleep)',
      'Caution: strong diuretics or drying herbs in fluid-deficient constitution',
      'Drug interactions: diuretics (additive — monitor electrolytes), immunosuppressants (practitioner oversight), hypoglycaemics (monitor glucose)',
    ],
    dosage_range:
      'Decoction (classical and optimal): 9–15 g dried sclerotium simmered 30–45 minutes in 500 ml water; 1–2 cups daily in TCM formulas. Granules or powder: 3–9 g daily in divided doses mixed with warm water. Standardised polysaccharide or triterpene extract: 500–1500 mg daily. Duration: typically 4–12 week courses aligned with TCM pattern work; reassess. Fu Shen (with pine root wood) for Shen-calming emphasis; plain Fu Ling for spleen-damp and urinary; Fu Ling Pi for stronger diuretic action.',
    spiritual_layer:
      'Fu Ling is the white stone of stillness — a hidden reservoir that both absorbs damp chaos and anchors the spirit. She grows underground, clasping pine roots, turning forest damp into stable quiet tissue and calm awareness. She embodies the Earth element teaching that the most profound stability comes not from resistance but from absorption and transformation — the body that can drink in excess moisture and convert it into functional qi rather than pathological damp is a body at peace. Her neutrality is her power: she does not agitate, does not stimulate, does not sedate — she simply creates conditions in which the spleen can function and the spirit can rest. She whispers: I am grounded. I am still. I transform what is cloudy into clarity. My foundation is dry and firm. I rest without effort.',
    best_preparation:
      'Long decoction with other TCM herbs in classical formula context — Fu Ling is rarely used alone in traditional practice; it is the grounding, balancing presence in multi-herb formulas. For modern single-mushroom use: standardised polysaccharide extract for immune, renal or oncology-adjacent protocols. TCM pattern differentiation before recommending (damp vs dry constitution matters). Processing variant selection matters: Fu Shen for sleep/anxiety, plain Fu Ling for digestion/damp, Fu Ling Pi for diuretic/oedema.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade B+ diuretic and renoprotective (preclinical; growing clinical). Grade B antitumour (multiple models). Grade B immunomodulation. Grade A traditional safety (millennia of use). TCM pattern differentiation is the key clinical variable. Processing variant selection (Fu Ling vs Fu Shen vs Fu Ling Pi) changes indication. Reassess every 8–12 weeks.',
  },

  // ─────────────────────────────────────────────
  // LION'S MANE
  // ─────────────────────────────────────────────
  {
    id: 317,
    name: "Lion's Mane",
    botanical: 'Hericium erinaceus (fruiting body and mycelium — "Neuron Awakener")',
    tcm_meridians: ['Heart', 'Spleen', 'Kidney'],
    tcm_element: 'Water + Fire',
    energetics: ['Neutral', 'Sweet', 'Nourishing', 'Neurotropic', 'Cognitively-Clarifying', 'Neuroprotective', 'Psychoplastogenic'],
    primary_functions: [
      'NGF and BDNF stimulation — hericenones C-H (fruiting body aromatic meroterpenoids) stimulate NGF synthesis via PKA pathway; erinacines A-K (mycelium cyathane diterpenoids) stimulate both NGF and BDNF expression; erinacine C and Z1 increase both simultaneously; whole extracts also increase BDNF in stress and neurodegenerative models; these neurotrophins drive neuronal survival, synaptic plasticity, hippocampal neurogenesis and cognitive function',
      'Cognitive improvement in MCI — double-blind placebo-controlled RCT (30 Japanese adults 50–80 years with mild cognitive impairment): 0.8 g/day dried fruiting body powder for 16 weeks produced significantly higher cognitive scores (HDS-R) at weeks 8, 12 and 16 vs placebo; scores declined after discontinuation indicating continued intake needed; no adverse effects',
      'Cognitive benefit in mild Alzheimer\'s — pilot double-blind RCT: erinacine A-enriched mycelium (EAHE) 3×350 mg capsules/day vs placebo for 49 weeks showed improved MMSE, CASI and IADL scores and better contrast sensitivity; no serious adverse events',
      'Neuroprotection in Alzheimer\'s and Parkinson\'s models — decreases amyloid plaque burden, protects dopaminergic neurons and improves behavioural and cognitive outcomes in multiple animal models; anti-neuroinflammatory via NF-kB reduction and Nrf2 activation; antioxidant neuroprotection',
      'Immunomodulatory and anti-inflammatory — polysaccharides and beta-glucans activate macrophages, NK cells and T cells; reduce pro-inflammatory cytokines; contribute to systemic and CNS inflammation reduction which indirectly supports cognitive health and gut-brain axis',
    ],
    secondary_benefits: [
      'Antiplatelet effect of hericenone B — selectively inhibits collagen-induced platelet aggregation in rabbit and human platelets (IC50 ~3 µM) without affecting ADP, thrombin or TXA2-induced aggregation; potential antithrombotic mechanism but also flags theoretical increased bleeding risk with anticoagulants',
      'Mood and neuropsychiatric support — preliminary human data suggest reduced depressive and anxiety symptoms and increased pro-BDNF levels; animal models show benefit in depression, anxiety, binge eating and sleep; gut-brain axis NCT04939961 trial assessing cognitive and BDNF effects via microbiota',
      'Gut-brain axis and microbiome — polysaccharide-mediated microbiota modulation contributes to cognitive and mood effects; emerging gut-brain neurotrophic pathway',
      'Edible culinary mushroom — widely consumed as food in East Asia; meaty texture and good flavour; delivers neurotrophic compounds through regular cooking alongside supplementation',
    ],
    pharmacology:
      'Primary bioactives: hericenones C-H (fruiting body; PRIMARY NGF stimulants via PKA pathway), erinacines A-K, Z1 (mycelium; cyathane diterpenoids; strongest NGF and BDNF stimulation; erinacine A enrichment in EAHE clinical products), polysaccharides and beta-glucans (immunomodulatory; anti-inflammatory; gut-microbiota modulating; antioxidant), hericenone B (selective collagen-induced antiplatelet — theoretical bleeding caution). KEY DISTINCTION: fruiting body = hericenones (NGF primary); mycelium = erinacines (NGF + BDNF primary); clinical products should specify which form. Evidence: Grade A-minus NGF/BDNF stimulation (strong in vitro and in vivo); Grade B+ MCI cognitive improvement (RCT confirmed); Grade B mild AD cognitive benefit (pilot RCT); Grade B+ neuroprotection preclinical; Grade B antiplatelet potential; Grade A-minus general safety.',
    flavor_profile: 'Mild, slightly sweet and seafood-like (sometimes compared to lobster or crab) — delicate and pleasant; excellent as a culinary mushroom when sautéed in butter or oil',
    contraindications: [
      'Anticoagulants (Warfarin, DOACs), antiplatelets or bleeding disorders — MONITOR: hericenone B inhibits collagen-induced platelet aggregation; no major clinical bleeding events in trials but theoretical increased bleeding risk; discuss with prescriber',
      'Mushroom allergy — mild GI discomfort or allergic reactions possible but uncommon; allergy test with small amounts in sensitive individuals',
      'Pregnancy and breastfeeding — culinary food use unlikely problematic at dietary doses; high-dose extract use should be supervised; limited data',
      'IMPORTANT: cognitive effects require continued intake — decline after stopping indicates this is a long-term tonic not an acute nootropic',
      'Otherwise: Grade A-minus safety (multiple clinical trials and culinary use confirm good tolerability)',
    ],
    herb_to_herb_synergy: [
      'Reishi — Shen calming and immune terrain plus Lion\'s Mane NGF/BDNF neurotropic; comprehensive brain-spirit medicine pairing',
      'Cordyceps — cognitive-energetic combination; Lion\'s Mane neuroplasticity plus Cordyceps ATP and performance',
      'Tremella — dual neuroprotective mushroom; Tremella TFP polysaccharide support plus Lion\'s Mane hericenone and erinacine neurotropic',
      'Bacopa — complementary cholinergic mechanism; Bacopa acetylcholinesterase inhibition plus Lion\'s Mane NGF-driven cholinergic neuron nourishment',
      'Ginkgo — cerebral circulation plus neurotropic nourishment; comprehensive cognitive stack',
    ],
    herb_to_herb_caution: [
      'Anticoagulant herbs (Garlic, Ginkgo at high doses, Turmeric) — additive antiplatelet effect via hericenone B; monitor in bleeding-risk individuals',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants and antiplatelets — MONITOR: hericenone B antiplatelet effect; generally low clinical risk at therapeutic doses but discuss with prescriber',
      'Alzheimer\'s medications (donepezil, rivastigmine) — complementary cholinergic mechanism; potentially synergistic; inform prescriber',
    ],
    herb_interactions: [
      'Synergy: Reishi (brain-spirit), Cordyceps (cognitive-energetic), Tremella (neuroprotection duo), Bacopa (cholinergic stack), Ginkgo (cognitive circulation)',
      'Caution: anticoagulant herbs at high doses (additive hericenone B antiplatelet — monitor in bleeding-risk)',
      'Drug interactions: anticoagulants and antiplatelets (MONITOR — hericenone B), Alzheimer\'s medications (complementary — inform prescriber)',
    ],
    dosage_range:
      'Fruiting body dried powder: 0.8–3 g daily (0.8 g used in MCI RCT; higher doses used in practice). Erinacine A-enriched mycelium (EAHE) capsules: 3×350 mg daily as used in Alzheimer\'s pilot RCT. Tincture or dual extract: 1–3 ml daily. TIMING: morning or daytime (cognitive-activating; may be mildly stimulating for some individuals in the evening). Duration: minimum 8–16 weeks before assessing cognitive effects; continued intake required for sustained benefit (cognitive scores decline after stopping).',
    spiritual_layer:
      'Lion\'s Mane is the white mane of the forest mind — a fungal brain hanging from hardwood, mirroring dendrites and axons in physical form. She is the mushroom that does not disrupt consciousness but patiently rebuilds its infrastructure: more NGF here, more BDNF there, more synaptic connections, more neuronal survival. Her teaching is structural rewiring rather than acute disruption — she shows that the deepest cognitive healing is not a lightning strike but the result of patient, sustained nourishment of the neural terrain over months and years. She whispers: Your brain is not fixed. New growth is possible wherever attention, nourishment and time converge. Creativity, clarity and healing are not lightning strikes — they are the result of patient rewiring.',
    best_preparation:
      'Distinguish preparation for specific outcome: fruiting body (hericenones — NGF primary) for general cognitive and culinary use; erinacine A-enriched mycelium (EAHE) for Alzheimer\'s-adjacent protocols. Duration education is critical — effects require 8+ weeks and decline after stopping; frame as a long-term neuroprotective investment, not an acute nootropic. Screen anticoagulants (hericenone B antiplatelet — discuss with prescriber). For Alzheimer\'s-adjacent use: always alongside medical care, not replacing it.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade A-minus NGF/BDNF stimulation (multiple in vitro and in vivo confirmations). Grade B+ MCI cognitive improvement (RCT confirmed). Grade B mild AD cognitive benefit (pilot RCT). Grade A-minus general safety. Antiplatelet caution (hericenone B — discuss with prescriber if on anticoagulants). Continued intake required for sustained benefit. Fruiting body vs mycelium distinction matters for product selection.',
  },

  // ─────────────────────────────────────────────
  // MAITAKE
  // ─────────────────────────────────────────────
  {
    id: 318,
    name: 'Maitake',
    botanical: 'Grifola frondosa (fruiting body — "Hen of the Woods / Dancing Sentinel")',
    tcm_meridians: ['Spleen', 'Stomach', 'Kidney', 'Immune System'],
    tcm_element: 'Earth + Water',
    energetics: ['Neutral', 'Slightly Sweet', 'Immunomodulating', 'Metabolic-Balancing', 'Insulin-Sensitising', 'NK-Activating'],
    primary_functions: [
      'Potent beta-glucan immunomodulation — MaitakeGold 404 and D-fraction/MD-fraction (partially purified beta-glucan formulations); bind Dectin-1, complement receptor 3 and other PRRs on macrophages, dendritic cells, NK cells and T cells; enhance phagocytic activity, NK cell cytotoxicity and cytokine production (IL-6, IL-12, IFN-gamma); oral Maitake glucan studies show MaitakeGold outperforming AHCC per dose; Maitake+Shiitake combination is strongest in comparative studies',
      'Cancer adjuvant immunomodulation — Phase I/II dose-escalation trial (30 postmenopausal breast cancer survivors): oral Maitake polysaccharide extract at 2 mg/kg/day produced ~300% increase in CD3+CD25+ and CD4+CD25+ T cells; higher doses maximised IL-2 (NKT cells) and IL-10 (T cells) production; safe without serious adverse events; non-randomised Japanese case series reported clinical responses in liver (58%), breast (69%), lung (63%) cancers',
      'Blood glucose and insulin sensitivity — single oral dose FXM water-soluble extract (140 mg/mouse) reduced circulating glucose ~25% at 8–18 hours; chronic dosing significantly lowered glucose AND insulin (peripheral insulin sensitisation); Maitake SX fraction improved glucose-insulin metabolism and reduced blood pressure via renin-angiotensin and NO pathway modulation in diabetic model',
      'Potent oral immune activator — animal studies show significant NK cell cytotoxicity increase, phagocytic activation and IL-6, IL-12, IFN-gamma cytokine production; in combination with Shiitake the strongest oral beta-glucan immune activation recorded in comparative mushroom studies',
      'Antitumour (preclinical) — D-fraction enhances antitumour effects and reduces chemotherapy toxicity in mice; direct antitumour effects on triple-negative breast cancer cells; anti-angiogenic potential from blazeispirols-type lipid components',
    ],
    secondary_benefits: [
      'Metabolic syndrome support — beta-glucans promising for improving insulin sensitivity and blunting postprandial glucose spikes; human evidence emerging',
      'Blood pressure modulation — SX fraction reduced systolic blood pressure via renin-angiotensin activity reduction and NO system activation in diabetic model',
      'Edible culinary mushroom — widely consumed in East Asian and Western cooking; large flavorful clusters; delivers functional compounds through regular cooking',
      'Dancing mushroom archetype — Japanese maitake means "dancing mushroom" possibly because foragers danced for joy upon finding it, or because its layered fronds resemble a dancing figure',
    ],
    pharmacology:
      'Primary bioactives: grifolan and related beta-glucans (beta-(1,3) backbone with beta-(1,6) branches; MD-fraction and D-fraction — partially purified; PRIMARY immunomodulators via Dectin-1, CR3 and other PRRs; direct antitumour and immune activation; FXM water-soluble extract — antidiabetic via peripheral insulin sensitisation; SX fraction — blood pressure and metabolic modulation). Evidence: Grade B+ immune activation (multiple animal studies; Phase I/II immune marker data in breast cancer survivors); Grade B-minus cancer adjuvancy (case series plus small trials; no large RCTs); Grade B-minus glucose and insulin (strong animal models; limited human data); Grade B safety (Phase I/II plus culinary use).',
    flavor_profile: 'Rich, earthy and deeply savoury — one of the most flavourful edible mushrooms; excellent roasted, sautéed and in soups; meaty and satisfying texture',
    contraindications: [
      'Autoimmune disease or immunosuppressants — CAUTION: strong beta-glucan immune activation may exacerbate Th1-driven autoimmunity or counteract immunosuppressive therapy; use only under practitioner supervision',
      'Diabetes medications (insulin, sulphonylureas, metformin) — MONITOR: significant glucose-lowering and insulin-sensitising effects in animal models; concentrated extracts may enhance hypoglycaemic effect; MONITOR glucose',
      'Active cancer therapy — use as adjunct only; coordinate with oncologist; Phase I/II evidence is immune marker-level; no large RCTs of clinical cancer outcomes',
      'Transplant recipients — immune activation could theoretically contribute to rejection risk; consult transplant team',
      'Otherwise: generally well tolerated at food doses and in Phase I/II trials; no serious dose-limiting toxicities',
    ],
    herb_to_herb_synergy: [
      'Shiitake — the strongest oral beta-glucan immune combination studied; complementary beta-glucan structures; comparative animal studies show the duo outperforms either alone',
      'Reishi — Shen calming terrain support alongside Maitake active immune activation; complementary tones',
      'Astragalus — Wei Qi and deep immune terrain building; excellent long-term combination',
      'Berberine herbs — complementary antidiabetic mechanisms for metabolic syndrome protocols',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms in autoimmune conditions — combined immune activation risk; practitioner oversight required',
      'Diabetes herbs with diabetes medications — additive insulin-sensitising and glucose-lowering; monitor blood glucose carefully',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — MONITOR: significant glucose-lowering and insulin sensitisation; risk of excessive hypoglycaemia with concentrated extracts',
      'Immunosuppressants — immune activation may counteract; consult prescriber',
      'Anticoagulants — theoretical mild effects; monitor in high bleeding risk',
    ],
    herb_interactions: [
      'Synergy: Shiitake (strongest beta-glucan combination), Reishi (terrain-immune), Astragalus (Wei Qi), Berberine herbs (metabolic syndrome)',
      'Caution: immunomodulating mushrooms in autoimmune conditions (practitioner oversight), diabetes herbs with diabetes medications (monitor glucose)',
      'Drug interactions: diabetes medications (MONITOR — glucose lowering), immunosuppressants (counteraction risk), anticoagulants (theoretical — monitor)',
    ],
    dosage_range:
      'Culinary (most accessible): 50–150 g fresh or 5–15 g dried roasted or cooked in daily meals. MD-fraction or D-fraction standardised extract: 0.5–5 mg/kg/day (Phase I/II range); typically 500–1500 mg standardised polysaccharide extract for consumer products. Duration: 4–12 weeks for immune and metabolic protocols; continued culinary intake for long-term terrain. Oncology-adjacent use: coordinate with oncology team; use alongside rather than replacing standard treatment.',
    spiritual_layer:
      'Maitake is the dancing sentinel of the forest floor — nestled at the base of ancient oaks, swirling in layered fronds, embodying joyful vigilance. She is immune cells on patrol, responding with precision rather than panic. She is found at the roots of oaks that have stood for centuries, teaching that immune strength is not aggression but graceful responsiveness, not overreaction but precisely calibrated recognition. She dances because she has found something that sustains — and asks us to do the same: to activate when needed, to settle when done, to be neither chronically armed nor dangerously lax. She whispers: Balance is dynamic, not rigid. My immune system and metabolism are meant to dance — to rise, respond and then settle again. Strength is not overreaction; it is graceful responsiveness.',
    best_preparation:
      'Culinary daily integration for food-level immune and metabolic support. Standardised D-fraction/MD-fraction extracts for more intensive immune or oncology-adjacent protocols. CRITICAL screening: autoimmune disease and immunosuppressants (strong immune activation — practitioner oversight), diabetes medications (significant glucose-lowering — MONITOR blood glucose), transplant (consult team), active cancer therapy (adjunct only — oncologist coordination). Maitake+Shiitake combination is the strongest oral beta-glucan immune protocol in comparative mushroom research — position together for immune terrain work.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B+ immune activation (multiple animal studies plus Phase I/II human immune data). Grade B-minus cancer adjuvancy (case series plus small trials). Grade B-minus glucose and insulin (strong animal data; limited human). Grade B safety. Screen autoimmune, immunosuppressants, diabetes medications and transplant. Adjunct only in oncology. Maitake+Shiitake combination is the strongest oral beta-glucan immune protocol studied.',
  },

  // ─────────────────────────────────────────────
  // MESIMA (BLACK HOOF MUSHROOM)
  // ─────────────────────────────────────────────
  {
    id: 319,
    name: 'Mesima',
    botanical: 'Phellinus linteus (fruiting body — "Black Hoof / Sang-Hwang / Immune Sculptor")',
    tcm_meridians: ['Liver', 'Spleen', 'Lung', 'Immune System'],
    tcm_element: 'Wood + Metal',
    energetics: ['Neutral to Slightly Cool', 'Bitter', 'Astringent', 'Immune-Sculpting', 'Antitumour', 'Anti-Allergic', 'Haemostatic'],
    primary_functions: [
      'Antitumour and immune biological response modulator — protein-bound polysaccharides (PL proteoglycans) stimulate T-lymphocyte proliferation, B-cell activation, NK cell activity and macrophage responses; used as nonspecific immunostimulant in cancer patients in East Asia; fruiting body extracts (PL-H and PL-A) showed 71–73% solid tumour growth inhibition in mouse models comparable to commercial Krestin (PSK)',
      'Wnt/beta-catenin pathway suppression in colon cancer — PL at 125–1000 µg/mL inhibited SW480 colon cancer cell proliferation, decreased beta-catenin expression and cyclin D1, reduced TCF/LEF transcriptional activity; inhibited MMP-2 and MMP-9 anti-invasive activity; direct anti-metastatic potential',
      'Anti-asthmatic and Th2 modulation — OVA-induced asthma model: P. linteus ethanol extract reduced eosinophilic airway inflammation and airway hyperresponsiveness; significantly attenuated Th2 cytokines (IL-4, IL-5, IL-13), eotaxin and adhesion molecules; inhibited p38 MAPK and NF-kB activation; positions Mesima as anti-allergic Th2-modulating mushroom',
      'Immune NK and Th1/Th2 balance — WAFL water-soluble extract increased IFN-gamma (Th1) while modulating IgE-mediated Th2 responses; anti-allergic and Th1/Th2 rebalancing relevant to allergy, asthma and immune-mediated conditions',
      'Breast tissue and hormone-sensitive cancer support — hispolon and phenylpropanoids show anti-proliferative and pro-apoptotic effects in ER-positive breast cancer lines with ER-alpha expression reduction; aqueous fruiting body extracts dose-dependent antiproliferative effects on MDA-MB-231 breast cancer cells',
    ],
    secondary_benefits: [
      'Women\'s health and immune-related fertility — clinical practice reports: 3 g/day for elevated NK cells or cytokine dysregulation in immune-mediated infertility; anecdotal improvements in implantation and pregnancy rates; aligns with immune-balancing profile',
      'Haemostatic and heavy menstrual bleeding — traditional use and folk reports for controlling excessive menstrual bleeding; haemostatic effects align with traditional East Asian use for bleeding disorders',
      'Traditional use millennia — thousands of years in China, Korea and Japan for cancer, GI and hepatic support, haemostasis and women\'s health; Sang-Hwang polypore is a foundational East Asian medicinal mushroom',
      'Human immune function RCT — randomised double-blind placebo-controlled trial confirmed P. linteus oral extract improved NK cell activity and specific cytokine profiles vs placebo in healthy adults with good tolerability',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides and protein-bound polysaccharides/proteoglycans (PL, PLP, P1, Mesima glycopeptide — immunomodulatory via T/B cells, NK cells, macrophages; antitumour; Th1/Th2 modulation; anti-allergic; nonspecific biological response modifier), phenylpropanoids and polyphenols (hispolon — anticancer via ER-alpha reduction; antiviral; antioxidant; hispidin — anticancer; antiviral; immunomodulatory; caffeic acid, davallialactone — anti-inflammatory; antioxidant), triterpenoids and furans (anti-inflammatory; antioxidant). Evidence: Grade B antitumour (strong in vitro and animal; limited human clinical); Grade B immunomodulation (cell/animal work plus small clinical trial); Grade B-minus anti-asthmatic/allergic (OVA animal models); Grade C women\'s health (clinical practice and anecdotal); Grade B general safety.',
    flavor_profile: 'Distinctly bitter and woody — hard polypore; not a culinary mushroom; typically consumed as decoction, tincture or standardised extract',
    contraindications: [
      'Autoimmune disease or immunosuppressants/biologics/transplant — CAUTION: strong immune activation and NK enhancement may exacerbate autoimmune conditions or counteract immunosuppressive therapy; use only under specialist supervision',
      'Concurrent chemotherapy or biologics — coordinate with oncology team; Th1 immune activation may interact with specific treatment protocols',
      'Pregnancy (immune-fertility use) — specialist supervision required; immune-modulating effects in fertility context require clinical oversight',
      'Perioperative — antioxidant/anti-inflammatory benefit but bleeding risk and immune effects require clinical communication before surgery',
      'Otherwise: generally well tolerated in oral and injectable forms in East Asian clinical practice; no major acute toxicity signals',
    ],
    herb_to_herb_synergy: [
      'Reishi and Turkey Tail — complementary immune-modulating mushroom combination; Mesima potent NK activation plus Reishi Shen calming and Turkey Tail broad-spectrum immune training',
      'Astragalus — deep immune and Wei Qi support; classical East Asian immune tonic combination',
      'Raspberry Leaf and Nettle — women\'s health formula alongside Mesima for hormone-sensitive and immune-fertility contexts',
    ],
    herb_to_herb_caution: [
      'Other strong immunostimulating herbs and mushrooms in autoimmune conditions — cumulative Th1 immune activation; specialist oversight required',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants (cyclosporine, tacrolimus, biologics) — immune activation may counteract; specialist supervision required',
      'Chemotherapy — coordinate with oncologist; Th1 immune activation may synergise or interfere',
      'Anticoagulants — theoretical minor effects; monitor if on blood thinners',
    ],
    herb_interactions: [
      'Synergy: Reishi and Turkey Tail (immune-modulating mushroom stack), Astragalus (Wei Qi), Raspberry Leaf and Nettle (women\'s health)',
      'Caution: strong immunostimulating herbs and mushrooms in autoimmune conditions (specialist oversight)',
      'Drug interactions: immunosuppressants (counteraction — specialist required), chemotherapy (coordinate with oncologist), anticoagulants (theoretical — monitor)',
    ],
    dosage_range:
      'Decoction (traditional): 3–9 g dried fruiting body simmered 30–60 minutes; 1–2 cups daily. Tincture or standardised proteoglycan extract: 500–1500 mg daily in divided doses. Fertility protocol (clinical practice): ~3 g/day standardised extract for NK cell normalisation. Human immune RCT: oral P. linteus extract (dose per clinical protocol; product-specific). Duration: 8–12 week minimum for immune outcomes; reassess and cycle.',
    spiritual_layer:
      'Mesima is the black hoof at the mulberry trunk — dense, dark and slow-growing, embodying structured immunological discipline. She teaches that defence can be refined not just amplified, that true protection is the art of saying yes and no in the right measure — to tumours, to allergens, to pregnancies, to bleeding. She has guarded health in East Asia for thousands of years with the patience of a polypore that grows for decades on a single tree. She whispers: Defense can be refined, not just amplified. True protection is the art of saying yes and no in the right measure. Balance your guardians, and life can take root where it was once rejected.',
    best_preparation:
      'Decoction or standardised proteoglycan extract for immune protocols. MANDATORY screening: autoimmune disease and immunosuppressants (specialist supervision required), transplant and biologics (coordinate with medical team), concurrent chemotherapy (oncologist required), perioperative use (communicate with surgical team). Women\'s fertility use: specialist clinical context only. Frame clearly as biological response modifier — immune sculpting, not simple boosting.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B antitumour (strong preclinical; limited clinical). Grade B immunomodulation (human RCT confirmed in healthy adults). Grade B-minus anti-asthmatic/allergic (OVA models). Grade C women\'s health and fertility (clinical practice; minimal formal trials). Specialist supervision for autoimmune, transplant, chemotherapy and perioperative contexts. Human immune RCT provides clinical validation for immune function use.',
  },

  // ─────────────────────────────────────────────
  // MORELS
  // ─────────────────────────────────────────────
  {
    id: 320,
    name: 'Morels',
    botanical: 'Morchella esculenta / M. conica / M. importuna (fruiting body — "Spring Scout")',
    tcm_meridians: ['Liver', 'Spleen', 'Stomach'],
    tcm_element: 'Wood + Earth',
    energetics: ['Neutral', 'Sweet', 'Nourishing', 'Hepatoprotective', 'Antioxidant', 'Immuno-Supportive', 'Regenerative'],
    primary_functions: [
      'Hepatoprotection — M. esculenta fruiting body extract reduced serum ALT and AST, decreased lipid accumulation and improved liver histology in alcohol-induced acute liver injury model; mechanisms: Nrf-2 pathway activation (upregulated antioxidant defences) and NF-kB inhibition (reduced pro-inflammatory cytokines); morel polysaccharides (MEP) reduce MDA, MPO and inflammatory markers while improving SOD, catalase and glutathione',
      'Antioxidant — significant in vitro hydroxyl and superoxide radical scavenging; phenolics, polysaccharides and tocopherols all contribute; higher MW polysaccharides linked to stronger immunomodulation; lower MW linked to stronger direct antioxidant activity; consistent across multiple morel species',
      'Immunomodulatory and gut health — polysaccharides and beta-glucans enhance immune function including macrophage activity and lymphocyte proliferation; prebiotic fibre effects support gut microbiota composition; SCFA production; gut barrier integrity',
      'Anticancer (preclinical) — heteropolysaccharide (81 kDa) from M. esculenta showed growth-inhibitory effects on HT29 colon cancer cells; hexane oil extract from Himalayan M. esculenta inhibited breast cancer cell proliferation and migration',
      'ABSOLUTE SPECIES DISTINCTION: True morels (Morchella) are safe when cooked; false morels (Gyromitra) are highly toxic (gyromitrin/MMH — seizures, liver damage, haemolysis, coma, death) and must never be consumed or confused with true morels',
    ],
    secondary_benefits: [
      'Mycelia polysaccharides (MP) — 2026 study confirmed hepatoprotective effects of mycelial polysaccharides: decreased ALT/AST, enhanced antioxidant enzymes, downregulated inflammatory pathways (transcriptomic analysis)',
      'Spring seasonal culinary delicacy — highly prized edible mushroom across European and Asian traditions; flavour and rarity make them significant culinary medicine through seasonal ritual',
      'Post-fire emergence — morels often fruit abundantly in the first spring after forest fires; symbology of regeneration from destruction',
      'Nutritionally rich — high-quality protein, fibre, vitamins (B group), minerals; ergosterols and tocopherols provide fat-soluble antioxidants',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (principal therapeutic components — heteropolysaccharides and beta-glucan complexes; immunomodulatory; antioxidant via SOD, CAT and glutathione upregulation; anti-tumour via cancer cell growth inhibition; hepatoprotective via Nrf-2 and NF-kB; prebiotic effects on gut microbiota; MW-dependent activity profiles), phenolic compounds and tocopherols (significant antioxidant capacity; anti-inflammatory), ergosterol and sterols (antioxidant; membrane-stabilising). Evidence: Grade A culinary and nutritional value; Grade B+ antioxidant; Grade B+ hepatoprotection (consistent across alcohol and DSS liver injury models); Grade B-minus anticancer (cell-based and limited animal); Grade B immunomodulation and gut health. FALSE MOREL WARNING: Gyromitra species contain gyromitrin metabolised to MMH — potentially fatal; positive identification is mandatory.',
    flavor_profile: 'Intensely earthy, nutty and smoky — deeply savoury and complex; among the most prized flavours in European foraging tradition; intensifies significantly with butter sautéing',
    contraindications: [
      'Raw or undercooked consumption — ALWAYS cook thoroughly: raw morels can cause GI upset (nausea, vomiting, diarrhoea) and possibly neurotoxic symptoms; NEVER eat raw',
      'CRITICAL: SPECIES IDENTIFICATION — NEVER confuse with Gyromitra (false morels): Gyromitra species contain gyromitrin metabolised to monomethylhydrazine (MMH) causing seizures, liver damage, haemolysis, coma and death; this is the primary safety issue for morels',
      'Large repeated quantities of lightly cooked morels — avoid excessive consumption at any single meal; some idiosyncratic GI or neurological reactions reported even with cooked morels at very large quantities',
      'Mushroom allergy — as with all Ascomycete fungi, allergy possible; monitor in sensitive individuals',
      'Otherwise: Grade B+ safety when thoroughly cooked and correctly identified',
    ],
    herb_to_herb_synergy: [
      'Milk Thistle and Dandelion Root — hepatoprotective combination; Morchella Nrf-2/NF-kB plus Silymarin membrane stabilisation plus Dandelion bitter hepatic',
      'Astragalus and Reishi — immune and tonic combination; Morchella seasonal spring energy plus deep terrain support',
      'Artichoke — combined hepatobiliary support; bile flow plus antioxidant hepatoprotection',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns at culinary doses',
    ],
    herb_to_drug_interactions: [
      'No significant drug interactions documented at culinary doses',
    ],
    herb_interactions: [
      'Synergy: Milk Thistle and Dandelion Root (hepatoprotective), Astragalus and Reishi (immune-tonic), Artichoke (hepatobiliary)',
      'Caution: None at culinary doses',
      'Drug interactions: None documented',
    ],
    dosage_range:
      'Culinary (OPTIMAL and ONLY recommended approach): 50–200 g fresh or equivalent dried THOROUGHLY COOKED; spring seasonal availability. Polysaccharide extracts: research grade; no standardised consumer products established. Duration: seasonal culinary integration; hepatoprotective and antioxidant benefits accrue with regular seasonal and dried consumption. COOKING IS MANDATORY. SPECIES IDENTIFICATION IS MANDATORY.',
    spiritual_layer:
      'Morels are the spring scout — emerging quickly after thaw and fire, signalling regeneration and liver renewal. Honeycombed, they evoke filters and lattices, like hepatocytes and gut villi, quietly processing and protecting. They appear at the margins — where soil is disturbed, where fire has passed — teaching that healing and renewal begin in the disrupted places, that the liver that has been overloaded can be renewed, that the body that has been through a hard season can reclaim its regenerative intelligence. She whispers: Regeneration begins at the margins. Nourish the systems that filter and renew, and the whole organism can flourish again.',
    best_preparation:
      'Butter sauté is the classic preparation — enhances flavour and ensures thorough cooking. SPECIES IDENTIFICATION IS THE PRIMARY SAFETY INSTRUCTION: always confirm hollow stem and honeycomb cap attachment structure of true Morchella vs brain-like lobed cap of Gyromitra (never consume Gyromitra under any circumstances). ALWAYS cook thoroughly — never raw. Seasonal spring availability makes morels a ritual medicine; their rarity enhances the intentionality of consumption.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A culinary and nutritional value. Grade B+ antioxidant. Grade B+ hepatoprotection (consistent Nrf-2/NF-kB mechanism; alcohol and DSS injury models; mycelial polysaccharides confirmed 2026). Grade B immunomodulation and gut health. CRITICAL safety: never confuse with Gyromitra false morels (gyromitrin/MMH — potentially fatal). Always cook thoroughly. Positive species identification is the non-negotiable safety requirement.',
  },

  // ─────────────────────────────────────────────
  // OYSTER MUSHROOM
  // ─────────────────────────────────────────────
  {
    id: 321,
    name: 'Oyster Mushroom',
    botanical: 'Pleurotus ostreatus (fruiting body — "Metabolic Ventilator")',
    tcm_meridians: ['Lung', 'Stomach', 'Spleen', 'Large Intestine'],
    tcm_element: 'Metal + Earth',
    energetics: ['Neutral', 'Sweet', 'Cardiometabolic-Balancing', 'Glucose-Modulating', 'Immune-Training', 'Respiratory-Supportive'],
    primary_functions: [
      'Pleuran beta-glucan for respiratory immunity — double-blind placebo-controlled trial (50 athletes): 3-month pleuran supplementation reduced incidence of upper respiratory tract infection symptoms and increased circulating NK cells; in children with recurrent respiratory tract infections: 6-month pleuran significantly reduced both number and duration of RTIs with good safety profile; additional trials show benefits against herpes labialis and improvements in immune parameters',
      'Antidiabetic and hypolipidaemic — STZ-induced diabetic rat extracts reduced blood glucose, lowered serum triglycerides, total cholesterol and LDL-C, raised HDL-C; total polysaccharides (POP) improve hyperglycaemia, hyperlipidaemia, insulin resistance and glycogen storage while boosting SOD, CAT and GSH-Px and reducing MDA; alpha-amylase and alpha-glucosidase inhibition supports postprandial glucose control',
      'Cardiovascular protection — antihypercholesterolaemic and antihypertensive; reduces cholesterol and blood pressure in animal and small human studies; endothelial protection; LDL oxidation reduction; lovastatin-like statin compounds contribute to cholesterol-lowering effect',
      'Antimicrobial including MDR pathogens — ethanolic and acetonic extracts antibacterial against multiple Gram-positive and Gram-negative pathogens including multidrug-resistant strains; minimum bactericidal concentrations at 10-3 to 10-6 mg/mL for some fractions; activity linked to phenolics, flavonoids and secondary metabolites',
      'Gut microbiota prebiotic and barrier support — high dietary fibre and complex carbohydrates with prebiotic effects; SCFA production; gut barrier integrity; anti-inflammatory microbiome modulation; roles in obesity, diabetes, cardiovascular and IBD prevention frameworks',
    ],
    secondary_benefits: [
      'Antitumour and immunomodulatory — beta-glucans and polysaccharides show antitumour effects in multiple cancer cell line models; immunomodulatory activity supporting anticancer immune surveillance',
      'Lovastatin-like statin compounds — natural statin-like compounds in oyster mushrooms contribute to cholesterol-lowering alongside beta-glucan effects; "culinary statin" framing',
      'Ergothioneine content — antioxidant and cytoprotective; contributes to cardiovascular and metabolic biomarker effects',
      'Cultivation sustainability — grows efficiently on agricultural waste substrates (straw, sawdust, bagasse); highly sustainable production; high yield; easy to cultivate at home',
    ],
    pharmacology:
      'Primary bioactives: beta-(1,3/1,6)-D-glucans including pleuran (PRIMARY — immunomodulatory; respiratory and immune RCTs confirmed; Dectin-1, CR3 receptor binding; NK cell and macrophage activation), proteins and peptides (antihypertensive; immunomodulatory), lovastatin-like statins (cholesterol reduction synergy with beta-glucans), ergothioneine (antioxidant; cardiovascular biomarker), phenolic compounds, vitamins (B group), minerals (potassium, iron, selenium), bioactive lipids and sterols. SUBSTRATE VARIABILITY: chemical profile and activity significantly influenced by cultivation substrate (wheat bran vs maize bagasse alters phenolic and antimicrobial potency); standardised strain, substrate and extraction method important for consistent effects. Evidence: Grade B+ respiratory infections (pleuran; multiple controlled trials); Grade B antidiabetic and hypolipidaemic (preclinical strong; some human data); Grade B cardiovascular (animal and small human); Grade B antimicrobial; Grade A culinary safety.',
    flavor_profile: 'Delicate, mild and pleasantly savoury with oyster-like oceanic notes — tender texture; accepts marinades beautifully; excellent in all culinary preparations',
    contraindications: [
      'Raw consumption — mild GI discomfort; always cook thoroughly',
      'Mushroom allergy — possible in sensitive individuals; discontinue if reaction',
      'Substrate variability — chemical profile varies significantly with cultivation substrate; for consistent therapeutic effects, standardised commercial products are preferable to home-grown where extract quality matters',
      'Diabetes medications — MONITOR: alpha-glucosidase inhibition and glucose-lowering activity may enhance hypoglycaemic drug effect with concentrated polysaccharide extracts',
      'Otherwise: Grade A culinary safety — globally consumed; very well tolerated across all populations',
    ],
    herb_to_herb_synergy: [
      'Shiitake and Maitake — comprehensive daily immune-training mushroom trio via different beta-glucan structures and immune mechanisms',
      'Garlic and Ginger — antimicrobial amplification; culinary synergy for immune and cardiovascular kitchen medicine',
      'Berberine herbs — complementary antidiabetic mechanisms; DPP-4 plus alpha-glucosidase inhibition',
    ],
    herb_to_herb_caution: [
      'No significant herb-to-herb concerns at culinary doses',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — MONITOR: polysaccharide glucose-lowering activity may enhance hypoglycaemic effect with concentrated extracts',
      'Antihypertensives — mild additive blood pressure lowering; monitor if on multiple antihypertensives',
      'Statins — lovastatin-like compounds may have theoretical additive statin effect; generally safe at culinary doses; monitor with concentrated extracts',
    ],
    herb_interactions: [
      'Synergy: Shiitake and Maitake (immune-training trio), Garlic and Ginger (antimicrobial culinary), Berberine herbs (antidiabetic combination)',
      'Caution: None at culinary doses',
      'Drug interactions: diabetes medications (MONITOR — glucose lowering), antihypertensives (mild additive), statins (theoretical additive — monitor with concentrated extracts)',
    ],
    dosage_range:
      'Culinary daily integration (OPTIMAL): 50–150 g fresh or 5–15 g dried cooked into daily meals. Pleuran beta-glucan supplement (standardised — OPTIMAL for respiratory/immune protocol): per RCT dosing protocols (product-specific; typically 500 mg–1 g daily pleuran for 3–6 months respiratory support). Polysaccharide extract for metabolic protocols: 500–1500 mg daily. Duration: 3–6 months for pleuran respiratory benefit; indefinite for culinary cardiometabolic support.',
    spiritual_layer:
      'Oyster Mushroom is the stackable everyday ally — a fan of gills catching currents of nutrients and breath, growing on dead wood and transforming it into living medicine. She is the metabolic ventilator: opening airways of immunity and circulation, cleaning excess sugar and fat, feeding the microbiome, training immune sentries at mucosal borders. Her tiered oyster caps on logs teach the value of structured stacking of gentle interventions — daily food, daily fibre, daily beta-glucans — building up systemic resilience through consistency rather than intensity. She whispers: I build health through consistency. Small daily acts compound into lasting resilience. I nourish and protect without drama.',
    best_preparation:
      'Daily culinary integration is the primary recommendation — thoroughly cooked in diverse preparations. For respiratory immunity (especially in children or athletes): pleuran standardised beta-glucan supplement over 3–6 months is the evidence-based protocol. Screen diabetes medications with concentrated extracts (monitor glucose). Substrate awareness for consistent therapeutic quality in standardised products. The culinary-medicine integration message is particularly strong here — one of the easiest functional food mushrooms to incorporate daily.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status:
      'Grade B+ respiratory immunity (pleuran; multiple controlled trials in athletes and children). Grade B antidiabetic and hypolipidaemic. Grade B cardiovascular. Grade A culinary safety. Pleuran standardised beta-glucan is the clinical product for respiratory protocols. Monitor diabetes medications with concentrated extracts. Daily culinary integration is primary recommendation.',
  },

  // ─────────────────────────────────────────────
  // RED-BELTED POLYPORE
  // ─────────────────────────────────────────────
  {
    id: 322,
    name: 'Red-Belted Polypore',
    botanical: 'Fomitopsis pinicola (fruiting body — "Forest Belt of Regulation")',
    tcm_meridians: ['Liver', 'Kidney', 'Heart', 'Spleen'],
    tcm_element: 'Wood + Water',
    energetics: ['Neutral to Cool', 'Bitter', 'Astringent', 'Anti-Angiogenic', 'Metabolic-Regulating', 'Anti-Inflammatory', 'Slowly Corrective'],
    primary_functions: [
      'Anti-angiogenic and anti-inflammatory polysaccharides — polysaccharides show strong anti-angiogenic and anti-inflammatory effects in endothelial cell models WITHOUT endothelial cytotoxicity; inhibit neovascularisation and inflammatory responses; 32 lanostane triterpenoids including pinicolasin J potently inhibit superoxide anion generation and elastase release in human neutrophils (IC50 ~1.8–2.5 µM)',
      'Anticancer (preclinical) — extracts show pro-apoptotic, antioxidant and anti-inflammatory effects in multiple cancer cell lines; two of three animal studies reported tumour growth inhibition and prolonged survival; colon, rectum, stomach and liver cancer models showed reduced tumour growth, shifts in ROS and apoptosis markers in mice',
      'Metabolic: antihyperglycaemic and hypolipidaemic — striking preclinical data: F. pinicola extract lowered blood glucose by 77% after 20 days, increased HDL by 73% and decreased LDL by 76% in animal metabolic disturbance models; alkaline polysaccharide-rich extracts show antihyperglycaemic activity via improved insulin sensitivity and hepatic glucose metabolism modulation',
      'Antimicrobial and anti-biofilm — ethanolic extracts show antibacterial, anti-biofilm, anti-quorum-sensing and efflux pump inhibitory activities against important pathogens; potential antibiotic adjuvant strategy; broad antimicrobial and antiviral properties',
      'Traditional use for pain and inflammation — extensive use in Chinese and Korean traditional medicine for headache, nausea, liver problems, haemorrhage (haemostatic), inflammation and fatigue; COX-2 inhibition (fomitoside E) confirms anti-inflammatory mechanism',
    ],
    secondary_benefits: [
      'Haemostatic traditional use — traditional application for haemorrhage and bleeding; fomitoside-related compounds and triterpenes may contribute',
      'Taxonomy caution — North American red-belted polypores were frequently misidentified; many are actually Fomitopsis mounceae or F. ochracea with potentially different chemistry; European and Asian F. pinicola is the reference medicinal species',
      'Non-culinary polypore — woody, corky, hoof-shaped bracket; only suitable as decoction, powder or tincture; never eaten raw',
      'Boreal forest medicine — widely distributed in boreal and temperate forests across Europe and Asia; grows on conifer and hardwood deadwood; traditionally harvested from clean forest stands',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (beta-glucans and heteroglycans — anti-angiogenic; anti-inflammatory; antihyperglycaemic; immunomodulatory; no endothelial cytotoxicity), lanostane-type triterpenoids and triterpene glycosides (pinicolasin J and related — anti-inflammatory via neutrophil enzyme inhibition; antimicrobial; cytotoxic; fomitoside E — COX-2 inhibition; cardiovascular-supportive), sterols, phenolics, coumarins (additional antioxidant and antimicrobial activity). SPECIES IDENTITY CRITICAL: especially in North America where misidentification is common; European and Asian collections are the pharmacological reference. Evidence: Grade B anticancer (in vitro plus limited in vivo); Grade B+ anti-angiogenic and anti-inflammatory (polysaccharides and triterpenoids); Grade B-minus antihyperglycaemic and lipid (animal with striking effect sizes); Grade B-minus antimicrobial (in vitro anti-quorum-sensing); Grade B traditional safety.',
    flavor_profile: 'Not for food consumption — woody polypore; consumed as decoction, powder or tincture only; strongly bitter and astringent as decoction',
    contraindications: [
      'Cancer self-treatment without oncologist oversight — BLOCK: experimental preclinical only; no human clinical cancer trials; adjunct context only',
      'Autoimmune or immunosuppressive therapy — CAUTION: immunomodulatory polysaccharides may conflict; practitioner oversight',
      'Diabetes medications — MONITOR: very significant antihyperglycaemic effects in animal models (77% glucose reduction); concentrated extracts may powerfully enhance hypoglycaemic drug effect',
      'Pregnancy and breastfeeding — insufficient data; avoid concentrated forms without professional guidance',
      'North American collection — CAUTION: misidentification risk with closely related species; only European or Asian verified F. pinicola or genetically confirmed North American material',
      'Otherwise: no major toxicity signals in available traditional use data; formal safety trials sparse',
    ],
    herb_to_herb_synergy: [
      'Reishi and Chaga — non-culinary polypore and sclerotium combination for comprehensive antioxidant, immune and anticancer terrain support',
      'Berberine herbs — complementary antidiabetic mechanisms for metabolic syndrome protocols',
      'Turmeric and Boswellia — combined anti-inflammatory stack; NF-kB plus COX inhibition',
    ],
    herb_to_herb_caution: [
      'Other potent antidiabetic herbs with diabetes medications — additive glucose-lowering may cause hypoglycaemia; monitor carefully',
      'Other immunomodulating mushrooms in autoimmune conditions — cumulative immune activation; practitioner oversight',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — MONITOR CLOSELY: 77% glucose reduction in animal models; serious hypoglycaemia risk with insulin or sulphonylureas and concentrated extracts',
      'Anticoagulants — haemostatic traditional use implies possible coagulation effects; monitor',
      'Immunosuppressants — immunomodulatory; practitioner oversight',
    ],
    herb_interactions: [
      'Synergy: Reishi and Chaga (polypore terrain stack), Berberine herbs (antidiabetic), Turmeric and Boswellia (anti-inflammatory)',
      'Caution: antidiabetic herbs with diabetes medications (additive — monitor glucose), immunomodulating mushrooms in autoimmune conditions',
      'Drug interactions: diabetes medications (MONITOR CLOSELY — powerful glucose-lowering in animal models), anticoagulants (monitor), immunosuppressants (practitioner oversight)',
    ],
    dosage_range:
      'Decoction (traditional): dried polypore slices or powder simmered 30–60 minutes; standard TCM bracket polypore dosing 3–9 g daily. Tincture or extract: 1–3 ml daily. Duration: short to medium courses (4–8 weeks) with reassessment; monitoring important given striking metabolic effect sizes. NOTE: no standardised consumer dosing established for F. pinicola specifically; extrapolated from traditional bracket polypore practice.',
    spiritual_layer:
      'Red-Belted Polypore is the forest belt of regulation — a layered, red-banded bracket that slowly edits the tree\'s biomass, mirroring gradual profound rebalancing of inflammation, metabolism and tissue growth. She grows where wood needs regulated decomposition, teaching that overgrowth, inflammation and excess sugar all respond to the same quiet discipline: steady, structural change that recalibrates without catastrophe. She whispers: Correction can be gradual yet far-reaching. Overgrowth, inflammation and excess sugar all respond to the same quiet discipline. True guardianship is not flashy; it is persistent recalibration.',
    best_preparation:
      'Decoction for traditional use; tincture or standardised extract for metabolic and anti-inflammatory protocols. SPECIES IDENTITY IS CRITICAL — especially in North America (misidentification risk); only use verified European/Asian F. pinicola or confirmed species. Screen diabetes medications (MONITOR CLOSELY — powerful glucose-lowering in animal models). Oncology: preclinical only, adjunct framing, oncologist coordination. Experimental status is honest framing — promising but not yet clinically validated.',
    caution_level: 'MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B anticancer (preclinical; limited clinical). Grade B+ anti-angiogenic and anti-inflammatory (polysaccharides and triterpenoids confirmed). Grade B-minus antihyperglycaemic and lipid (animal models with striking effect sizes). Grade B-minus antimicrobial. Grade B traditional safety. SPECIES IDENTITY CRITICAL (misidentification risk in North America). MONITOR diabetes medications closely (powerful glucose-lowering preclinical data). Experimental status — no human clinical trials established.',
  },

  // ─────────────────────────────────────────────
  // REISHI (LINGZHI)
  // ─────────────────────────────────────────────
  {
    id: 323,
    name: 'Reishi',
    botanical: 'Ganoderma lucidum (fruiting body, mycelium and spores — "Mushroom of Immortality / Lingzhi")',
    tcm_meridians: ['Heart', 'Lung', 'Liver', 'Kidney'],
    tcm_element: 'Fire + Earth',
    energetics: ['Neutral to Slightly Warm', 'Slightly Bitter', 'Sweet', 'Shen-Calming', 'Qi-Tonifying', 'Adaptogenic', 'Foundational'],
    primary_functions: [
      'Shen calming and sleep facilitation — aqueous extract potentiates pentobarbital-induced sleep via GABAergic mechanism (antagonised by flumazenil); GLAA acidic polysaccharide promotes sleep via gut microbiota-dependent serotonin-associated pathway; spore extract improved total, REM and NREM sleep and prevented cognitive deficits in Alzheimer\'s rat model; multi-target anti-insomnia potential via TNF, CASP3, JUN and HSP90 modulation; facilitates sleep by modulating GABA, HPA cytokines and gut-mediated serotonin rather than blunt sedation',
      'Immune strengthening via beta-glucan — double-blind RCT (72 healthy adults; Reishi beta-glucan vs placebo; 12 weeks): significant increases in CD3+, CD4+, CD8+ T-cells, NK cells, improved CD4/CD8 ratio and serum IgA; no adverse liver or kidney function changes; beta-glucan polysaccharides activate macrophages, dendritic cells, T and B lymphocytes via TLRs and Dectin-1; strengthens both innate and adaptive immune parameters',
      'Adaptogenic HPA axis modulation — triterpenes and polysaccharides reduce pro-inflammatory cytokines (TNF-alpha, IL-6), modulate NF-kB and support appropriate stress response rather than blunting or hyper-activating; improves capacity to handle stress via terrain recalibration rather than cortisol suppression',
      'Anti-inflammatory and antioxidant — triterpenes (ganoderic acids, lucidenic acids) and polysaccharides reduce oxidative stress and inflammatory markers across multiple systems; contribute to neuroprotection, metabolic syndrome support and hepatic protection',
      'TCM Heart-Shen calming and Lung-Wei Qi tonification — classic indications: Heart and Spleen Qi/Blood deficiency with Shen disturbance (insomnia, palpitations, anxiety, fatigue); Lung Qi/Wei Qi deficiency (frequent colds, weak immunity); general deficiency with aging, chronic stress or recovery',
    ],
    secondary_benefits: [
      'Mood and mental wellbeing (emerging) — mechanistic support through sleep, HPA and neuro-inflammatory modulation; dedicated anxiety/depression RCTs are emerging; mushroom mood trial in Gen Z women underway',
      'Cardiovascular: mild antiplatelet and blood pressure lowering — theoretical mild antiplatelet/anticoagulant effects (triterpenes); modest BP-lowering often beneficial; caution in hypotensive individuals or those on anticoagulants',
      'Hepatoprotective (usual doses) — generally safe for liver; case reports of hepatotoxicity with high-dose unregulated powders plus alcohol; favoured standardised dual extracts over raw powder in polypharmacy or liver-concern contexts',
      'Cultivation forms: fruiting body (antler/kidney-shaped lacquered conk), mycelium, spore powder and cracked spore oil — distinct bioactive profiles; dual extract (water + alcohol) captures both polysaccharides and triterpenes optimally',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (beta-1,3/1,6-D-glucans and heteropolysaccharides; 30–50% in some extracts; PRIMARY immunomodulatory via TLRs and Dectin-1; antioxidant; anti-inflammatory; antidiabetic; sleep-promoting via GLAA), triterpenoids (ganoderic, ganodermic, lucidenic acids; 1–2% or higher in ethanol extracts; anti-inflammatory; hepatoprotective; antihypertensive; antiallergic; antitumour; CNS-modulating; sleep support via HPA cytokine modulation), sterols (ergosterol), peptides, nucleosides (adenosine). PREPARATION: hot-water extract = polysaccharides (sleep, immune); ethanol extract = triterpenes (liver, inflammation, CNS); dual extract = full spectrum (optimal). Evidence: Grade B sleep (preclinical plus network pharmacology; emerging human data); Grade B+ immune modulation (12-week RCT confirmed); Grade B anti-inflammatory and antioxidant; Grade B+ safety healthy adults (RCTs and traditional use; isolated hepatotoxicity cases).',
    flavor_profile: 'Distinctly bitter and slightly woody — characteristic lacquer-resin bitterness from triterpenes; typically taken as tincture, dual extract or decoction; less palatable as plain powder',
    contraindications: [
      'Transplant recipients or strong immunosuppressants — CAUTION: immune-enhancing T cells, NK cells and IgA may counteract immunosuppressive therapy; consult transplant team',
      'Complex autoimmune diseases — case-by-case; beneficial modulation vs potential exacerbation is context-dependent; use low-and-slow under practitioner supervision',
      'Liver disease or heavy alcohol concurrent use — CAUTION: rare case report of acute hepatitis after consuming Reishi with alcohol; favour standardised extracts over raw powder; avoid heavy concurrent alcohol',
      'Bleeding disorders or Warfarin/DOACs — CAUTION: mild antiplatelet/anticoagulant triterpenoid effects; monitor in high-risk individuals',
      'Very low blood pressure or multiple antihypertensives — CAUTION: mild blood pressure lowering; monitor in hypotensive individuals',
      'Otherwise: generally well tolerated; RCT confirmed no significant liver or kidney function changes over 12 weeks in healthy adults',
    ],
    herb_to_herb_synergy: [
      'Cordyceps — the classic Jing-Shen pairing: Cordyceps Yang-activating ATP performance plus Reishi Shen calming and immune modulation; complementary and balancing energies',
      'Lion\'s Mane — comprehensive brain-spirit medicine combination; Reishi GABAergic sleep and HPA calm plus Lion\'s Mane NGF/BDNF neurotropic',
      'Astragalus — deep immune and Wei Qi foundation; Reishi inner Shen plus Astragalus outer protection',
      'Schisandra — five-flavour adaptogen combining with Reishi for comprehensive stress and liver support',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms with immunosuppressant medications — combined immune activation; coordinate carefully',
      'Anticoagulant herbs (Garlic, Ginkgo, Turmeric at high doses) — mild additive antiplatelet; monitor in bleeding-risk individuals',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — immune-enhancing effects may counteract; transplant team must be consulted',
      'Warfarin and anticoagulants — mild triterpenoid antiplatelet/anticoagulant theoretical effects; MONITOR INR',
      'Antihypertensives — mild additive blood pressure lowering; monitor',
    ],
    herb_interactions: [
      'Synergy: Cordyceps (Jing-Shen pairing), Lion\'s Mane (brain-spirit), Astragalus (Wei Qi), Schisandra (adaptogenic liver)',
      'Caution: immunomodulating mushrooms with immunosuppressants (coordinate), anticoagulant herbs (additive — monitor in bleeding risk)',
      'Drug interactions: immunosuppressants (transplant team required), anticoagulants (monitor INR), antihypertensives (mild additive — monitor)',
    ],
    dosage_range:
      'Tincture (dual or ethanol-rich for triterpenes): 1–3 ml daily (20–60 drops), ideally in evening. Hot-water extract capsules/powder (polysaccharides): 500–1500 mg daily. Whole powder: 1–3 g daily with hot liquid or decoction. Spore powder: per product; clinical evidence for sleep most established with whole extract forms. DUAL EXTRACT optimal for full-spectrum Reishi (polysaccharides + triterpenes). Duration: sleep and stress benefits 2–8 weeks; immune and longevity terrain support months to years of continuous or cyclical use. Evening dosing for Shen calming and sleep support.',
    spiritual_layer:
      'Reishi is the immortality mushroom — not because she makes you live forever, but because she connects finite form to an enduring current. She grows on old wood, transforming decay into a glossy, heart-shaped lacquer that feels like a physicalised aura. Her teaching has three dimensions: that rest is a skill to be trained not a collapse to be earned through exhaustion; that soft power recalibrates the HPA axis rather than driving on cortisol borrowed from tomorrow; and that spiritual potency — what the Chinese meant by Lingzhi — is the quality of action that flows from deeper values rather than reactive fear. She is the slow foundational adaptogen of mushroom medicine. She whispers: My nervous system is safe to rest. Calm and clarity can exist together in me. My immune system is wise, not frantic. Restoration is not a luxury; it is my foundation.',
    best_preparation:
      'Dual extract is the optimal product form (captures both polysaccharides for immune/sleep and triterpenes for anti-inflammatory/CNS). Evening dosing for Shen calming and sleep. 2–8 week timeline education for full effect — frame as slow foundational medicine not acute intervention. Screen for transplant and strong immunosuppressants (immune enhancement contraindication), liver disease with heavy alcohol use (rare hepatotoxicity cases — choose standardised extracts), anticoagulants (mild triterpenoid effect — monitor INR) and hypotension (mild BP-lowering). Reishi is the anchor herb of any medicinal mushroom stack.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade B sleep promotion (preclinical mechanism confirmed; emerging human data). Grade B+ immune modulation (12-week RCT confirmed; T cell, NK cell and IgA enhancement). Grade B anti-inflammatory and antioxidant. Grade B+ safety in healthy adults (RCTs and traditional use; isolated rare hepatotoxicity with high-dose unregulated powder plus alcohol). Screen transplant, immunosuppressants, liver disease, anticoagulants and hypotension. Dual extract preferred. Evening dosing for Shen calming.',
  },

  // ─────────────────────────────────────────────
  // ROYAL SUN MUSHROOM (AGARICUS BLAZEI)
  // ─────────────────────────────────────────────
  {
    id: 324,
    name: 'Royal Sun Mushroom',
    botanical: 'Agaricus subrufescens (syn. Agaricus blazei) (fruiting body — "Cogumelo do Sol / Immune Activator from Brazil")',
    tcm_meridians: ['Spleen', 'Lung', 'Liver', 'Immune System'],
    tcm_element: 'Earth + Metal',
    energetics: ['Neutral to Warm', 'Sweet', 'Pungent', 'Strongly Immune-Activating', 'NK-Stimulating', 'Th1-Leaning', 'Antitumour'],
    primary_functions: [
      'Potent NK cell and Th1 immune activation — beta-1,3/1,6-D-glucans and proteoglycans bind Dectin-1, complement receptor 3 (CR3) and other PRRs; trigger IL-12 and IFN-gamma production; NK cell proliferation and T cell activation; independent of TLR-4; mouse models confirm NK cytotoxicity augmentation via IL-12/IFN-gamma pathway; human reviews confirm encouraging NK-cell-mediated immune support',
      'Antitumour (preclinical) — Agarol ergosterol derivative induces caspase-independent apoptosis in multiple human carcinoma cell lines (A549, MKN45, HSC-3, HSC-4) via ROS generation, mitochondrial membrane depolarisation, AIF release, Bax upregulation and Bcl-2 downregulation; blazeispirols anti-angiogenic; beta-glucans cause tumour regression in sarcoma and solid tumour mouse models',
      'Anti-allergic and Th1/Th2 rebalancing — Th1-leaning immune activation reduces IgE and Th2 skewing in animal models; potential benefit for allergy-driven conditions; WAFL extract increased IFN-gamma while modulating IgE-mediated Th2 responses',
      'Antigenotoxic and hepatoprotective (preclinical) — CCl4-induced liver damage in rats: supplementation normalised ALT, AST, LDH, GSH and antioxidant vitamins while reducing malondialdehyde; antigenotoxic properties against hydrogen peroxide-induced DNA damage in vitro',
      'CRITICAL HEPATOTOXICITY: case series — three advanced cancer patients developed severe hepatic damage including two fatalities after consuming A. blazei extract; Memorial Sloan Kettering explicitly warns of severe hepatic dysfunction induction; idiosyncratic hepatotoxicity in cancer patients is the defining safety concern',
    ],
    secondary_benefits: [
      'Antidiabetic potential — inhibition of alpha-glucosidase (slowing carbohydrate absorption); insulin sensitivity improvement; metabolic syndrome components; human data limited',
      'Antimicrobial and anti-infection — Th1 immune activation supports anti-infection responses; direct antimicrobial activity in extracts',
      'Traditional use from Piedade, Brazil — local populations consuming Agaricus blazei had notably lower cancer incidence, triggering original research interest; now widely cultivated in Japan and Brazil',
      'Phase I safety study in cancer survivors — 1.8, 3.6, 5.4 g/day doses generally tolerated; mild adverse events; elevated liver enzymes at highest dose in oncology population',
    ],
    pharmacology:
      'Primary bioactives: beta-glucans and proteoglycans (PRIMARY — NK cell, T cell and macrophage activation via Dectin-1, CR3; Th1/Th2 rebalancing; antitumour via immune activation; anti-allergic), Agarol ergosterol derivative (caspase-independent apoptosis in carcinoma cell lines via AIF/Bax/Bcl-2 pathway), blazeispirols and lipid-phase components (anti-angiogenic), phenolic compounds (antioxidant; hepatoprotective preclinically — but also hepatotoxic idiosyncratically). CRITICAL SAFETY PARADOX: preclinical hepatoprotective vs clinical case reports of fulminant hepatitis and two fatalities in cancer patients; likely idiosyncratic with contributing factors (chemotherapy, liver compromise, polypharmacy, product variability). Grade B+ immune activation (robust preclinical plus human NK data); Grade B+ antitumour (preclinical); Grade B-minus cancer adjuvant (small trials; observational); Grade B hepatoprotective preclinical; Grade B hepatotoxicity idiosyncratic (case series with fatalities — well documented).',
    flavor_profile: 'Mildly sweet and slightly almond-like — pleasant culinary edible; edible as food but primarily used in extract form for medicinal applications',
    contraindications: [
      'Active cancer patients, especially on hepatotoxic chemotherapy or with liver metastases/baseline liver dysfunction — SERIOUS CAUTION or AVOID: case series of severe hepatic damage including two fatalities; Memorial Sloan Kettering explicitly warns; requires liver function testing and oncologist involvement if used at all',
      'Autoimmune diseases (especially Th1/Th17-driven autoimmunity) — AVOID or specialist supervision: strong Th1-leaning immune activation may exacerbate Th1/Th17 autoimmune conditions',
      'Transplant recipients or strong biologic immunosuppressants — CONTRAINDICATED: potent immune activation counteracts immunosuppression',
      'Liver disease or abnormal liver enzymes — AVOID or hepatologist supervision: idiosyncratic hepatotoxicity risk; baseline and follow-up LFTs mandatory if used',
      'Unknown mushroom allergy — assess before use',
      'Highest dose or prolonged use — Phase I shows liver enzyme elevation at highest doses in cancer population; use conservative doses and monitor LFTs',
    ],
    herb_to_herb_synergy: [
      'Reishi — complementary immune-modulating combination; Royal Sun strong NK activation plus Reishi Shen calming and balanced modulation',
      'Astragalus — Wei Qi and deep immune support combined with Royal Sun active NK activation; for infection-prone states with intact liver function',
    ],
    herb_to_herb_caution: [
      'Other hepatotoxic herbs — AVOID: cumulative liver stress in individuals already at risk',
      'Other strong immunostimulating herbs in autoimmune conditions — Th1 cumulative activation risk; specialist supervision',
    ],
    herb_to_drug_interactions: [
      'Hepatotoxic chemotherapy drugs — SERIOUS RISK: two documented fatalities in cancer patients; CONTRAINDICATED without oncologist and hepatologist supervision',
      'Immunosuppressants (biologics, cyclosporine, tacrolimus) — CONTRAINDICATED: potent immune activation counteracts',
      'Diabetes medications — monitor glucose (alpha-glucosidase inhibition)',
    ],
    herb_interactions: [
      'Synergy: Reishi (balanced immune modulation), Astragalus (Wei Qi for infection-prone, liver-intact individuals)',
      'Caution: hepatotoxic herbs (cumulative liver risk — AVOID), strong immunostimulating herbs in autoimmune conditions (Th1 cumulative — specialist)',
      'Drug interactions: hepatotoxic chemotherapy (SERIOUS — two fatalities documented; oncologist/hepatologist required), immunosuppressants (CONTRAINDICATED), diabetes medications (monitor glucose)',
    ],
    dosage_range:
      'STRONGLY RESTRICTED: specialist supervision mandatory before any recommendation in oncology contexts. Healthy adults with intact liver function: 1.8–3.6 g/day granulated powder (Phase I safety range; below hepatic-event dose). Always with baseline and follow-up liver function tests. Duration: 4–8 week courses with liver monitoring; avoid prolonged high-dose. NEVER recommended without LFT monitoring in cancer patients or those with liver concerns.',
    spiritual_layer:
      'Royal Sun Agaricus rises from bright, sun-exposed soil as a compact, robust fruiting body — rooted in earth yet radiating upward. She embodies proactive defence: immune cells waking up, scanning and acting. Her teaching is two-part and inseparable: first, the power to activate clearly (stop under-responding, assert the boundary, say yes to immune engagement); second, the responsibility to know when not to activate (strong medicine demands strong discernment, and the same force that mobilises protection can, if misapplied, overreach — as her hepatotoxic cases show). She whispers: My defences wake up with wisdom. I say a clear yes to what nourishes and a clear no to what harms. I respect the power of activation and use it with discernment.',
    best_preparation:
      'SPECIALIST SUPERVISION REQUIRED for oncology and liver-disease contexts — this is the most important clinical instruction for this mushroom. MANDATORY pre-recommendation screening: cancer diagnosis (SERIOUS — hepatotoxicity fatalities; oncologist and hepatologist required), liver disease or abnormal LFTs (AVOID or specialist), transplant and biologics (CONTRAINDICATED), autoimmune disease (especially Th1/Th17 — avoid or specialist). For eligible healthy adults: conservative doses (1.8–3.6 g/day), baseline LFTs, 4–8 week courses with monitoring. Position as a powerful immune activator that demands the most careful risk-benefit assessment in the library.',
    caution_level: 'HIGH',
    safe_pregnancy: false,
    status:
      'Grade B+ immune activation (NK cell preclinical plus human data). Grade B+ antitumour (preclinical). Grade B-minus cancer adjuvant (small trials). Grade B idiosyncratic hepatotoxicity (case series: two fatalities in cancer patients; Memorial Sloan Kettering explicitly warns). SERIOUS SAFETY CONCERN in oncology and liver-disease contexts. CONTRAINDICATED in transplant and autoimmune (Th1/Th17) contexts without specialist. LFT monitoring mandatory for any use.',
  },

  // ─────────────────────────────────────────────
  // SHAGGY BRACKET (INONOTUS HISPIDUS)
  // ─────────────────────────────────────────────
  {
    id: 325,
    name: 'Shaggy Bracket',
    botanical: 'Inonotus hispidus (fruiting body — "Sanghuang Ally / Shaggy Lipid Filter")',
    tcm_meridians: ['Liver', 'Spleen', 'Lung', 'Immune System'],
    tcm_element: 'Fire + Wood',
    energetics: ['Neutral to Warm', 'Bitter', 'Anti-Inflammatory', 'Hepatoprotective', 'Hypolipidaemic', 'Immunomodulating', 'Antiviral'],
    primary_functions: [
      'Lipid metabolism, obesity and NAFLD reversal — HFD-fed mice: I. hispidus extract reversed hepatic steatosis and adipose hypertrophy, lowered serum LDL-C, total cholesterol, triglycerides and leptin, increased HDL-C; reduced liver ALT/AST and inflammatory cytokines (IL-1beta, IL-6, TNF-alpha, PAI-1); mechanism: Nrf2/HO-1 antioxidant pathway activation and NF-kB/IKKalpha/beta/IkBa phosphorylation inhibition plus significant gut microbiota and lipidomics modulation',
      'Hepatoprotection in alcoholic liver disease — chronic ALD model: improved liver histology, reduced fibrosis and inflammation, lowered ALT/AST and increased antioxidant enzyme activity; positions I. hispidus as hepatoprotective agent for alcohol-related liver damage',
      'Antiviral (influenza A and B) — hispidin and hispolon polyphenols show significant activity against influenza A and B viruses in allantoic membrane assays; combined with immunomodulation this positions the mushroom near other Inonotus/Sanghuang species in respiratory-viral defence potential',
      'Immunomodulation — ethanolic fruiting body extract increases activation but reduces proliferation of human activated T-cells, enhances NK cell activity and promotes dendritic cell maturation; hispidin and hispolon reproduce many effects suggesting multi-compound synergy; broad immune-modulating potential',
      'Anticancer potential — polyphenols hispidin and hispolon show cytotoxic and pro-apoptotic actions in cancer cell lines; mycelial cyclic peptide fraction (CCM) induces mitochondrial-mediated apoptosis in HeLa cells (upregulating Bax, cytochrome c, caspase-9, cleaved caspase-3; downregulating Bcl-2); lead compounds for cervical cancer drug development',
    ],
    secondary_benefits: [
      'Antioxidant and enzyme modulation — strong antioxidant capacity; antimicrobial against bacteria and fungi; lipase and alpha-glucosidase inhibitory activity (anti-obesity and antidiabetic potential); glutathione S-transferase modulation (detoxification)',
      'Traditional use for metabolic conditions — folk use for diabetes, gout, arthritis, indigestion and stomach disorders; enzymatic inhibition data align with postprandial glucose and uric acid modulation',
      'Genomic insights — extensive secondary-metabolite gene clusters including polyketides, terpenoids and EPS biosynthesis genes; genomic complexity underlies pharmacological richness',
      'Host-tree chemistry variability — metabolomic profiling shows significant differences in polyphenol content and pharmacological potency depending on host tree species (ash, apple, mulberry etc.); source tree should be tracked as quality parameter',
    ],
    pharmacology:
      'Primary bioactives: polyphenols (hispidin and hispolon — PRIMARY anticancer; antiviral influenza A/B; antioxidant; immunomodulatory; anti-inflammatory), exopolysaccharides EPS (hepatoprotective via Nrf2 activation; immunomodulatory; hypoglycaemic), cyclic peptides CCM from mycelia (mitochondrial-mediated apoptosis in HeLa cells; cervical cancer lead compounds), triterpenoids, flavonoids, fatty acids, sterols (antioxidant; antimicrobial; anti-inflammatory). HOST TREE VARIABILITY: polyphenol content and trace element profile significantly differ by host species; pharmacological potency varies accordingly. Evidence: Grade B+ antilipid and hepatoprotective (HFD and ALD animal models); Grade B immunomodulation (human T cell and NK data); Grade B anticancer (in vitro cervical and breast cancer); Grade B antiviral influenza (in ovo assays); Grade B enzyme inhibition; Grade C clinical (minimal human trials; strong candidate for development).',
    flavor_profile: 'Distinctly bitter and slightly resinous — hard polypore; not culinary; consumed as decoction, tea or standardised extract only; traditional decoction called Sanghuang tea',
    contraindications: [
      'Autoimmune disease or immunosuppressive therapy — CAUTION: immunomodulating; T-cell and NK effects may conflict with intentional immunosuppression; practitioner oversight',
      'Diabetes medications — MONITOR: alpha-glucosidase inhibition and metabolic effects may enhance hypoglycaemic drug effect',
      'Heavy metal contamination risk — as a wood-rotting bracket fungus may accumulate environmental contaminants; only from clean forest environments or controlled cultivation',
      'Pregnancy and breastfeeding — insufficient safety data for concentrated forms; traditional decoction likely lower risk; caution',
      'Otherwise: traditional use suggests good tolerability; modern toxicity data limited but no major red flags at typical doses',
    ],
    herb_to_herb_synergy: [
      'Chaga and Reishi — complementary Sanghuang-type and Ganoderma combination for comprehensive hepato-immune-antioxidant terrain',
      'Berberine herbs — complementary antidiabetic and lipid-lowering mechanisms; AMPK plus alpha-glucosidase inhibition',
      'Milk Thistle — complementary hepatoprotective mechanisms; silymarin membrane stabilisation plus I. hispidus Nrf2/NF-kB support',
      'Elderberry and Thyme — antiviral respiratory stack; influenza A/B coverage expansion',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating herbs and mushrooms with immunosuppressants — cumulative immune activation; coordinate carefully',
      'Other antidiabetic herbs with diabetes medications — additive glucose-lowering; monitor blood sugar',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — MONITOR: alpha-glucosidase inhibition plus metabolic effects may enhance hypoglycaemic drugs',
      'Immunosuppressants — T-cell and NK modulation may counteract; practitioner oversight',
      'Anticoagulants — theoretical; monitor if on blood thinners',
    ],
    herb_interactions: [
      'Synergy: Chaga and Reishi (hepato-immune-antioxidant terrain), Berberine herbs (antidiabetic-lipid), Milk Thistle (hepatoprotective), Elderberry and Thyme (antiviral respiratory)',
      'Caution: immunomodulating herbs/mushrooms with immunosuppressants (coordinate), antidiabetic herbs with diabetes medications (monitor glucose)',
      'Drug interactions: diabetes medications (MONITOR), immunosuppressants (practitioner oversight), anticoagulants (theoretical — monitor)',
    ],
    dosage_range:
      'Decoction (traditional Sanghuang tea): dried fruiting body slices simmered 30–60 minutes; 3–9 g daily divided doses. Ethanolic or aqueous extract: 500–1500 mg daily. EPS or hispidin-enriched standardised preparations: per product specification. Duration: 4–12 weeks for metabolic/hepatic protocols with reassessment. SOURCE QUALITY: only from clean environments or controlled cultivation (heavy metal and contaminant risk).',
    spiritual_layer:
      'Inonotus hispidus is the shaggy Sanghuang cousin — a bristly bracket burning slowly on injured trunks, embodying long-term stubborn allyship for stubborn chronic conditions: fatty liver, swollen joints, slow tumours, persistent viral burden. She is fire in wood — polyphenols that heat and clarify, lipids that filter and move, immune cells that receive precise instructions rather than generalised alarm. Her teaching is the patience of years on a single tree, converting the host\'s struggle into structured medicine, arming immune scouts and clearing the damp heat that accumulates in liver and vessels over decades. She whispers: I re-tune lipids and liver. I steady inflammation and immunity. I offer precise polyphenol medicine against viruses and tumours. I work slowly but I work deeply.',
    best_preparation:
      'Sanghuang tea decoction for traditional metabolic and hepatic use. Standardised hispidin/hispolon-containing extract for antiviral and anticancer-adjacent protocols. SOURCE QUALITY IS CRITICAL — only from clean environments; heavy metal testing recommended. Screen autoimmune conditions and immunosuppressants. Monitor diabetes medications. Host-tree provenance tracking matters for consistent pharmacological quality. Frame as an emerging Sanghuang-type polypore with impressive preclinical data awaiting clinical validation.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ antilipid and hepatoprotective (HFD and ALD animal models). Grade B immunomodulation (human T cell and NK data). Grade B anticancer (in vitro). Grade B antiviral influenza (in ovo). Grade C clinical (strong preclinical candidate; minimal human trials). Source quality critical (heavy metal risk). Screen autoimmune, immunosuppressants and diabetes medications. Sanghuang-type Hymenochaetaceae with rich polyphenol pharmacology.',
  },
  // ─────────────────────────────────────────────
  // TINDER FUNGUS (AMADOU / ICEMAN CONK)
  // ─────────────────────────────────────────────
  {
    id: 326,
    name: 'Tinder Fungus',
    botanical: 'Fomes fomentarius (fruiting body — amadou layer and insoluble fibers — "Keeper of the Ember")',
    tcm_meridians: ['Lung', 'Spleen', 'Liver', 'Large Intestine'],
    tcm_element: 'Metal + Earth',
    energetics: ['Warm to Neutral', 'Drying', 'Astringent', 'Anti-Inflammatory', 'Antioxidant', 'Terrain-Modulating', 'Slow and Deep'],
    primary_functions: [
      'Immune and inflammatory terrain modulation — polysaccharides and insoluble cell wall fibers modulate innate and adaptive immune responses, enhancing deficient functions while down-regulating excessive inflammation; fomentariol (benzotropolone phenolic) specifically suppresses ERK/JNK signalling, reducing NO, ROS and pro-inflammatory cytokines in LPS-stimulated macrophages; normalises dysregulated cytokine patterns in chronic multi-system illness',
      'Anti-inflammatory and anti-nociceptive — methanol extracts reduce carrageenan-induced oedema and pain behaviours in animals; in vitro inhibition of NO, PGE2, TNF-alpha and ROS; Grade B+ evidence from animal models and in vitro macrophage studies',
      'Antioxidant buffering — strong radical-scavenging (DPPH), beta-carotene bleaching inhibition and FRAP activity; ethanol and methanol extracts show high antioxidant potency; Grade A antioxidant evidence from multiple in vitro and chemical assay methods',
      'Gut-liver-kidney detoxification support — purified insoluble cell wall fibers (chitin-glucan matrix) bind heavy metals, organic dyes and radionuclides; support intestinal microbiota and barrier integrity; early clinical and ex vivo work suggests liver and kidney function normalisation in contexts of environmental toxic load',
      'Antitumour and antimicrobial — extracts and isolated compounds induce apoptosis and inhibit proliferation in cancer cell lines; broad-spectrum antimicrobial activity against bacteria (E. coli and others) and pathogenic fungi including dermatophytes; supports chronic infection terrain alongside immune modulation',
    ],
    secondary_benefits: [
      'Wound healing and haemostasis — traditional hemostatic and wound-dressing use for 5000+ years; Ötzi the Iceman carried F. fomentarius; modern work confirms antimicrobial and wound-healing acceleration; amadou layer used as styptic pad, burn dressing and wound antiseptic in historical European medicine',
      'Neuroprotective and anxiolytic potential — some studies show reduction of AChE activity and modulation of CNS oxidative stress pathways; traditions reference nervous system tonification and calming effects; emerging neuroprotective indication',
      'Deep terrain archetype — best suited for chronic, recurrent, multifactorial conditions where immune dysregulation, oxidative stress and environmental toxic load combine; long-term slow medicine, not acute symptom relief',
      '5000+ years of documented use — appears in Hippocratic medicine, Japanese anticancer beverages, traditional European wound care and Ötzi the Iceman\'s survival kit; one of the longest-documented medicinal fungi',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides and beta-glucans (immunomodulatory — enhance deficient responses and down-regulate excessive inflammation; prebiotic-like; support gut and systemic immune balance), insoluble cell wall fibers (purified chitin-glucan matrices — bind heavy metals, dyes and radionuclides; support intestinal health and microbiota; normalise hepatic/renal markers), phenolic compounds and polyphenols (phenolic acids, flavonoids and fomentariol benzotropolone — potent antioxidant and anti-inflammatory via ERK/JNK and NO/ROS pathway modulation), triterpenoids and sterols (antitumour; hepatoprotective; anti-inflammatory). Evidence: Grade A antioxidant; Grade B+ anti-inflammatory and anti-nociceptive (animal and macrophage models); Grade B+ immunomodulatory (in vitro, ex vivo, emerging clinical); Grade B antimicrobial and antitumour; Grade B-minus gut-liver-kidney (animal, ex vivo, early clinical); Grade B+ safety at traditional and moderate dosing.',
    flavor_profile: 'Not a culinary mushroom — hard, woody, perennial conk; consumed as decoction or tincture only; characteristic bitter-astringent taste',
    contraindications: [
      'Autoimmune disease or immunosuppressive/biologic therapies — CAUTION: immune-modulating effects require careful individualisation; coordinate with medical team; start low and go slow',
      'Active cancer treatment — adjunctive only under oncology supervision; never replace conventional cancer treatment',
      'Anticoagulants or antiplatelets — some polypores affect coagulation; limited specific F. fomentarius data; caution in high bleeding-risk individuals',
      'Pregnancy and breastfeeding — limited targeted safety data; theoretical concerns low; high-dose or concentrated extracts only with specialist guidance',
      'Mushroom allergy or hypersensitivity — rare but possible; monitor early dosing',
      'Otherwise: traditional use over millennia with good tolerability; modern preparations generally well tolerated; GI upset possible at high fiber doses',
    ],
    herb_to_herb_synergy: [
      'Reishi, Turkey Tail and Chaga — comprehensive medicinal mushroom terrain stack; Tinder Fungus adds deep anti-inflammatory and detox fibre dimension',
      'Dandelion Root, Burdock and Schisandra — bitter hepatic and detoxification combination for gut-liver terrain work',
      'Birch Polypore — historical companion (both carried by Ötzi the Iceman); antiparasitic plus terrain modulating mushroom pairing',
      'Lion\'s Mane — neuroprotective stack addition; Tinder Fungus AChE modulation plus Lion\'s Mane NGF/BDNF',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms in autoimmune conditions — combined immune activation; coordinate carefully',
      'Other hepatotoxic herbs at high combined doses — cumulative liver stress; not relevant at therapeutic doses but worth noting in heavy polypharmacy',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants, corticosteroids and biologics — potential modulation of drug effect through immune pathways; monitor under specialist oversight',
      'Anticoagulants and antiplatelets — limited specific data; caution in high-risk patients; monitor',
      'Chemotherapy and radiotherapy — use only in cooperative integrative oncology settings; coordinate with treating team',
    ],
    herb_interactions: [
      'Synergy: Reishi, Turkey Tail, Chaga (mushroom terrain stack), Dandelion Root, Burdock, Schisandra (liver-detox terrain), Birch Polypore (Ötzi pairing), Lion\'s Mane (neuroprotective)',
      'Caution: immunomodulating mushrooms in autoimmune conditions (coordinate), hepatotoxic herbs at high combined doses (theoretical)',
      'Drug interactions: immunosuppressants and biologics (immune modulation — monitor), anticoagulants (limited data — caution in high-risk), chemotherapy and radiotherapy (integrative oncology coordination required)',
    ],
    dosage_range:
      'Decoction (traditional and foundational): 3–6 g dried inner tissue (amadou layer or sliced conk) simmered in 500–750 ml water for 30–60 minutes; 1 cup, 1–3× daily in chronic protocols. Tincture or fluid extract (40–70% ethanol, 1:5 to 1:3): approximately 1–3 ml, 1–3× daily. Purified insoluble fiber preparations (capsules or powder): hundreds of mg to a few grams daily in divided doses under practitioner supervision. Duration: designed for long-term terrain-level protocols — 2–3 months or longer with periodic reassessment. Topical wound use: processed amadou layer as styptic pad in traditional first-aid contexts.',
    spiritual_layer:
      'Tinder Fungus is the keeper of the ember — fire stored inside wood, the bridge between earth, fire, air and deep time. She has kept human fire alive for at least five thousand years; Ötzi the Iceman carried her across an alpine crossing as the technology that made warmth and cooking and survival possible. She is medicine for those walking long roads through complexity: chronic illness, multi-system failure, the exhausted terrain that has been burning low for years. Her teaching is that healing in chronic illness is a slow ember-carrying process — protect the spark of vitality, tend it carefully, and let it gradually reshape the terrain of your body and life. She whispers: My inner fire is steady, not frantic. I carry my spark through long nights. My terrain is slowly changing toward balance. I am patient, persistent, and quietly powerful.',
    best_preparation:
      'Long decoction for terrain work — simmering 30–60 minutes extracts polysaccharides and phenolics optimally. Purified fibre preparations for heavy metal detox and gut-barrier protocols. ALWAYS identify correctly (hoof-shaped F. fomentarius on hardwoods; distinct from Chaga which is an irregular sterile canker on birch). MANDATORY screening: autoimmune and immunosuppressive therapy (coordinate with medical team), active cancer treatment (adjunctive only — oncologist required), anticoagulants (limited data — caution). Long-term protocols (2–3+ months) are the appropriate framing — this is deep terrain medicine not acute symptom relief.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade A antioxidant (strong in vitro and chemical assay data). Grade B+ anti-inflammatory and immunomodulatory (animal models and macrophage studies; emerging clinical). Grade B antimicrobial and antitumour (in vitro and animal). Grade B+ safety at traditional dosing (5000+ years use; modern preparations well tolerated). Screen autoimmune, immunosuppressants and active cancer treatment. Deep terrain medicine — 2–3+ month protocols.',
  },

  // ─────────────────────────────────────────────
  // TURKEY TAIL
  // ─────────────────────────────────────────────
  {
    id: 327,
    name: 'Turkey Tail',
    botanical: 'Trametes versicolor (syn. Coriolus versicolor) (fruiting body and mycelium — "Yún Zhī / Cloud Mushroom")',
    tcm_meridians: ['Spleen', 'Lung', 'Liver'],
    tcm_element: 'Earth + Metal + Wood',
    energetics: ['Neutral to Slightly Cool', 'Slightly Sweet', 'Bland', 'Qi-Tonifying', 'Damp-Transforming', 'Immune-Regulating', 'Toxin-Clearing'],
    primary_functions: [
      'PSK and PSP cancer adjuvant — PSK (polysaccharide-K/Krestin) prescription-approved in Japan since 1977; PSP (polysaccharopeptide) approved in China; protein-bound beta-(1,3)-D-glucans with beta-(1,4) and (1,6) branches plus peptide chain (~100 kDa); meta-analysis across 23 RCTs (4246 patients) shows hazard ratio ~0.82 mortality reduction vs control in gastric, colorectal, breast, lung and other cancers alongside chemo/radiation; improved disease-free survival and treatment response rates',
      'Comprehensive immunomodulation — PSP/PSK and beta-glucans bind Dectin-1, TLR2/4 and CR3 on macrophages, dendritic cells and NK cells; increase IL-2, IL-12, IL-18, IFN-gamma and TNF-alpha; enhance NK cell cytotoxicity, CD4+ and CD8+ T-cell activity and antigen presentation; reprogramme tumour microenvironment (reduce Treg and MDSCs, increase effector T cells); phase I breast cancer trial: dose-dependent NK cell and lymphocyte increases at 3–9 g/day mycelial product',
      'Microbiome prebiotic effect — human RCT (PSP vs amoxicillin vs control): PSP induced distinct prebiotic microbiome shifts with increased Bifidobacterium and Lactobacillus, increased SCFAs and lower pH; amoxicillin caused marked dysbiosis persisting 42 days; PSP is a confirmed human prebiotic; in vitro fermentation of PSP with human fecal microbes shows classic prebiotic signature; supports butyrate production and intestinal barrier integrity',
      'Chemotherapy protection and synergy — PSP prolongs anti-cancer drug half-life and increases cytotoxicity of agents such as cyclophosphamide in HepG2 cells; PSK/PSP reduce treatment-related immunosuppression and support bone marrow function; improved quality of life during chemotherapy and radiation across cancer types',
      'TCM Qi tonification and toxin-clearing — Spleen Qi (post-natal vitality, digestion); Lung and Wei Qi (defensive boundary, mucosal immunity); heat-toxin clearing (chronic infection, inflammation, tumour patterns); fatigue, poor appetite, weakness after illness; chronic hepatitis and recurrent respiratory infections',
    ],
    secondary_benefits: [
      'Anti-inflammatory and organ protection — NF-kB inhibition; reduces TNF-alpha and IL-6; protective in osteoarthritis, IBD, alcoholic liver injury and diabetic cardiomyopathy models; significant gut and systemic anti-inflammatory effects',
      'Antitumour direct mechanisms — apoptosis and cell cycle arrest in breast, colorectal, gastric, leukemia, lung, liver and prostate cell lines; inhibition of tumour migration and invasion via urokinase plasminogen activator suppression',
      'Neurocognitive support (emerging) — anti-inflammatory and antioxidant actions support neuroprotection; early cognitive benefit data emerging; gut-brain axis contribution via microbiome modulation',
      'Most evidence-rich medicinal mushroom in oncology — PSK clinical oncology use since 1977; more RCT data than any other medicinal mushroom; Phase I breast cancer trial and 23-RCT meta-analysis represent the strongest clinical dataset in the fungi library',
    ],
    pharmacology:
      'Primary bioactives: PSP (polysaccharopeptide from COV-1 mycelium — China; protein-bound beta-glucan ~100 kDa; PRIMARY in Chinese clinical use), PSK/Krestin (from CM-101 fruiting bodies — Japan; prescription approved since 1977; same structural class as PSP with distinct peptide and branching patterns), beta-glucans (cell wall polysaccharides via Dectin-1, TLR2/4, CR3 — broad immunomodulatory effects; prebiotic potential), phenolic compounds and flavonoids (gallic acid, protocatechuic acid — antioxidant; anti-inflammatory), sterols and triterpenoids (ergosterol derivatives — anti-inflammatory; hepatoprotective; metabolic). CRITICAL PRODUCT DISTINCTION: PSK = fruiting body derived; PSP = mycelium derived; different structures with distinct clinical profiles; mycelium-on-grain products may have significant starch content reducing effective beta-glucan density. Evidence: Grade A immunomodulation (extensive in vitro, in vivo and human immune parameter studies); Grade B+ oncology adjuvant (RCTs and meta-analysis with ~0.82 hazard ratio); Grade B+ microbiome/prebiotic (human RCT confirmed); Grade A-minus safety (Phase I plus large clinical oncology experience).',
    flavor_profile: 'Thin, leathery and not culinary — not eaten as food; consumed as decoction, standardised PSK/PSP extract or capsule; mild tea with neutral to slightly earthy taste',
    contraindications: [
      'Organ transplant recipients — CONTRAINDICATED or specialist-only: immunostimulatory effects may interfere with graft-protecting immunosuppressants; avoid unless under specialist oncology/transplant oversight',
      'Active immunotherapy (checkpoint inhibitors, CAR-T, biologic immunotherapy) — COORDINATE WITH ONCOLOGY TEAM: potential synergy or interference not fully defined; must be supervised',
      'Complex autoimmune disease — INDIVIDUALIZE with specialist: bidirectional immune effects; some patients benefit from modulation; others may flare; start low and go slow under monitoring',
      'Pregnancy and breastfeeding — no major safety signals at dietary/supplement doses; high-dose PSK/PSP lacks robust pregnancy study; use caution and professional guidance',
      'Mushroom allergy — rare allergic reactions possible; discontinue if rash or itching',
      'Children — generally low-risk at moderate doses (broth, decoction); high-dose PSK/PSP protocols require specialist guidance',
      'Otherwise: Grade A-minus safety profile; extensive clinical oncology experience with PSK/PSP showing excellent tolerability',
    ],
    herb_to_herb_synergy: [
      'Reishi — the defining medicinal mushroom pair: Turkey Tail active immune training plus Reishi Shen calming terrain; PSK/PSP immune education plus ganoderic acid adaptogenic calm; classic integration',
      'Astragalus — Wei Qi and deep immune foundation; Turkey Tail adds direct biological response modifier activity alongside Astragalus polysaccharide immune training',
      'Maitake and Shiitake — comprehensive beta-glucan immune diversity; three different beta-glucan structures training different immune pathways; broadest oral beta-glucan protocol available',
      'Lion\'s Mane — gut-brain axis synergy; Turkey Tail prebiotic microbiome support plus Lion\'s Mane NGF/BDNF neurotropic; cognitive and immune combined',
    ],
    herb_to_herb_caution: [
      'Other immunomodulating mushrooms and herbs with transplant immunosuppressants — combined immune activation could threaten graft; coordinate with transplant team',
      'Other immunostimulating herbs in checkpoint inhibitor therapy — uncertain synergy or interference; always coordinate with oncologist',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants (cyclosporine, tacrolimus, mycophenolate — transplant) — immunostimulatory effects may counteract; CONTRAINDICATED without specialist oversight',
      'Cancer immunotherapy (checkpoint inhibitors, CAR-T) — potential synergy or interference; coordinate with oncology team before combining',
      'Chemotherapy and radiotherapy — generally beneficial adjunct; timing and dosing should be coordinated with treating oncologist',
      'Anticoagulants — no strong evidence of clinically significant coagulation changes; caution in high-risk patients',
    ],
    herb_interactions: [
      'Synergy: Reishi (defining mushroom pair), Astragalus (Wei Qi immune foundation), Maitake and Shiitake (beta-glucan diversity trio), Lion\'s Mane (gut-brain axis)',
      'Caution: immunomodulating mushrooms/herbs with transplant immunosuppressants (coordinate), immunostimulating herbs with checkpoint inhibitor therapy (coordinate with oncologist)',
      'Drug interactions: transplant immunosuppressants (CONTRAINDICATED without oversight), cancer immunotherapy (coordinate with oncology team), chemotherapy and radiotherapy (beneficial adjunct — coordinate timing)',
    ],
    dosage_range:
      'Decoction (Qi tonic and general immune support): 3–9 g dried fruiting bodies simmered in 500–1000 ml water 30–60 minutes; 1–3 cups daily. Standardised PSK (Japan oncology protocol): 3 g/day in 1 g TID capsules as adjunct to chemotherapy or radiation. Standardised PSP (China oncology protocol): ~3 g/day. Whole mushroom powder or extract (immune and gut support): 1–3 g/day for maintenance; up to 6–9 g/day in intensive protocols. Duration: oncology — continuous during treatment and months to years afterward (integrative oncology team guidance); microbiome and immune — minimum 4–8 weeks; general Qi tonic — long-term safe with periodic reassessment.',
    spiritual_layer:
      'Turkey Tail is the forest\'s immune system expressed in colour — a fan of overlapping zones, like the layers of healthy immune memory, like the concentric rings of community and protection. She appears on dead wood, digesting what is finished and transforming it into new soil, teaching that completion and beginning are the same moment. Her teaching is networked resilience: health arises not when one node dominates but when connections are functional and communication is clear. She is adjunct medicine — not the tree but part of the forest, powerful when integrated with other supports and hollow when used alone in defiance of appropriate care. She teaches: your immune cells need reminding, not just stimulating. She whispers: My defences are wise and flexible. My body remembers how to recognise and transform what harms me. I nourish the networks that keep me alive. I am resilient, adaptive, and held in a web of support.',
    best_preparation:
      'Standardised PSK or PSP products match the clinical evidence for oncology — use the form that corresponds to the research (PSK = fruiting body; PSP = mycelium). For gut/microbiome: PSP-containing mycelium or high beta-glucan fruiting-body extract over 4–12 weeks. For general Qi tonic: decoction or capsules at 1–3 g/day. MANDATORY screening: transplant and strong immunosuppression (CONTRAINDICATED — coordination essential), active immunotherapy (coordinate with oncologist), complex autoimmune (individualise with specialist). Turkey Tail is the most evidence-supported medicinal mushroom in oncology — the PSK approval in Japan since 1977 and 23-RCT meta-analysis are the anchors of credibility for this entire fungi category.',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: null,
    status:
      'Grade A immunomodulation (PSK/PSP; extensive in vitro, in vivo and human studies). Grade B+ oncology adjuvant (23-RCT meta-analysis; HR ~0.82 mortality reduction). Grade B+ microbiome and prebiotic (human RCT confirmed). Grade A-minus safety (Phase I plus large clinical oncology experience). PSK prescription-approved in Japan since 1977 — strongest regulatory standing of any medicinal mushroom. CONTRAINDICATED with transplant immunosuppressants without oversight. Coordinate with oncology team for cancer immunotherapy.',
  },

  // ─────────────────────────────────────────────
  // WILLOW BRACKET / FALSE CHAGA (PHELLINUS IGNARIUS)
  // ─────────────────────────────────────────────
  {
    id: 328,
    name: 'Willow Bracket',
    botanical: 'Phellinus igniarius (fruiting body — "False Chaga / Willow Mesima / Blood-River Stone")',
    tcm_meridians: ['Liver', 'Spleen', 'Kidney', 'Immune System'],
    tcm_element: 'Fire + Earth',
    energetics: ['Neutral to Cool', 'Bitter', 'Astringent', 'Blood-Moving', 'Hypoglycaemic', 'Anti-Gout', 'Hepatoprotective', 'Neuroprotective'],
    primary_functions: [
      'Anti-gout and hyperuricaemia — polyphenols from wild and cultivated P. igniarius lower serum uric acid and improve kidney function in hyperuricaemic rats; in MSU-induced acute gouty arthritis models: polyphenols suppressed ankle swelling and reduced ICAM-1, IL-1beta and IL-6 expression; strong anti-inflammatory and anti-gout profile aligning with traditional Chinese use for joint and inflammatory conditions',
      'Antidiabetic and gut microbiota remodelling — SH-P polysaccharides significantly lowered blood glucose, improved insulin sensitivity and restored pancreatic, liver and kidney function in high-fat diet/STZ diabetic mice; SH-P rebalanced gut microbiota increasing Lactobacillus and Parabacteroides; fecal microbiota transplantation confirmed microbiome remodelling mediated much of the antidiabetic effect; polyphenol-rich extracts (PI-PRE) reduced fasting glucose and improved glucose tolerance in KK-Ay diabetic mice with identified actives 7,8-dihydroxycoumarin and inoscavin C',
      'Antitumour and immunomodulation — water, ethanol and ethyl acetate extracts show broad antitumour activity against multiple cell lines (S180, PC-3, SK-HEP-1, HT-29) reducing tumour growth in mice; network pharmacology study linked key compounds to mitochondrial apoptosis pathways and inflammatory signalling in colon cancer; PIP polysaccharides enhanced NK cell and macrophage function and increased cytokines (potency varies by geographic origin)',
      'Neuroprotection — polyphenol extract protected against acrolein toxicity in vitro and reduced brain infarct volume, oedema and neurobehavioural deficits in a mouse stroke model; emerging neuroprotective profile alongside Chaga and other Hymenochaetaceae',
      'Hepatoprotective and cardiovascular — extracts show hepatoprotective effects in chemical liver injury models; LDL oxidation inhibition and lipid profile improvement support anti-atherogenic cardiovascular role; TCM traditional use for blood circulation and gastroenteric dysfunction',
    ],
    secondary_benefits: [
      'Anti-inflammatory and immune enhancement — polysaccharides and flavonoids from strain YASH1 enhanced immunity in cyclophosphamide-immunosuppressed mice restoring immune organ indices, cytokines and intestinal flora balance; consistent reduction of pro-inflammatory cytokines, oxidative markers and endothelial adhesion molecules across models',
      'IDENTITY CLARITY: False Chaga is NOT Chaga — critical morphological distinction: P. igniarius is a hard black hoof growing directly on wood (often willow, poplar, birch) with a clear pore surface; Chaga (Inonotus obliquus) is an irregular sterile black canker with corky orange-rust interior found exclusively on birch; different pharmacology, different safety profile, different application',
      'Traditional East Asian use — TCM use for diarrhoea, blood circulation, gastroenteric dysfunction and cancer; historical indications include bellyache, festering lesions and bloody gonorrhoea; Mesima-type bracket with centuries of East Asian traditional medical use',
      'Origin-dependent bioactivity — wild and cultivated material showed similar anti-gout profiles but may differ in polyphenol composition; for formulations, tracking source, solvent and active class is important',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides (PIP, SH-P — hypoglycaemic via gut microbiota remodelling and insulin pathway; immunomodulatory via NK and macrophage activation; antioxidant; hepatoprotective), polyphenols and flavonoids (coumarins — 7,8-dihydroxycoumarin; styrylpyrones — inoscavin C; benzofurans; isoflavones — antidiabetic; anti-gout via uric acid reduction and IL-1beta suppression; neuroprotective; antioxidant), triterpenoids (anti-atherosclerotic; hepatoprotective; immunomodulatory), sterols and fatty acids (antioxidant; cardiovascular). SPECIES DISTINCTION: same Hymenochaetaceae family as Phellinus linteus (Mesima) and Inonotus obliquus (Chaga) but distinct chemistry, host preference and regulatory status. Evidence: Grade B+ anti-gout and hypoglycaemic (strong animal data); Grade B antitumour and immunomodulation (in vitro and animal); Grade B neuroprotection (stroke model); Grade B hepatoprotective and cardiovascular; Grade C+ clinical (emerging; most data from animal and cell models).',
    flavor_profile: 'Bitter and astringent — hard perennial hoof polypore; not culinary; consumed as decoction or extracted tea only; traditional long simmers in East Asian practice',
    contraindications: [
      'Autoimmune disease or immunosuppressive therapy — CAUTION: immunomodulatory NK and macrophage effects; practitioner oversight required',
      'Diabetes medications — MONITOR CLOSELY: significant antidiabetic effects via gut microbiota remodelling; concentrated SH-P extracts may powerfully enhance hypoglycaemic drug effect; risk of excessive hypoglycaemia with insulin or sulphonylureas',
      'Anticoagulants — blood-moving TCM action; possible coagulation effects; monitor if on Warfarin or DOACs',
      'Pregnancy and breastfeeding — limited safety data; use only with professional guidance',
      'Otherwise: traditional long-term use suggests good tolerability; no major toxicity signals in available data; human trials remain limited',
    ],
    herb_to_herb_synergy: [
      'Phellinus linteus (Mesima) — same Hymenochaetaceae family; complementary polysaccharide and polyphenol profiles; combined immune-modulating and anti-cancer terrain support',
      'Berberine herbs (Barberry, Oregon Grape) — dual antidiabetic mechanisms: SH-P gut microbiota remodelling plus berberine AMPK activation',
      'Turmeric and Boswellia — complementary anti-inflammatory profiles for gout and joint inflammation protocols',
      'Milk Thistle and Dandelion Root — hepatoprotective synergy; combined liver protection mechanisms',
    ],
    herb_to_herb_caution: [
      'Antidiabetic herbs with diabetes medications — additive glucose-lowering effect; monitor blood glucose carefully when combining',
      'Anticoagulant herbs with Warfarin — possible additive blood-moving effects; monitor INR',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications (insulin, sulphonylureas, metformin) — MONITOR: SH-P gut microbiota-mediated antidiabetic effect may enhance drug action; hypoglycaemia risk',
      'Anticoagulants and antiplatelets — blood-moving TCM properties; monitor INR if on Warfarin',
      'Immunosuppressants — immunomodulatory NK and macrophage effects may counteract; practitioner oversight',
    ],
    herb_interactions: [
      'Synergy: Phellinus linteus (Hymenochaetaceae family pairing), Berberine herbs (antidiabetic duo), Turmeric and Boswellia (anti-gout and joint inflammation), Milk Thistle and Dandelion (hepatoprotective)',
      'Caution: antidiabetic herbs with diabetes medications (additive — monitor glucose), anticoagulant herbs with Warfarin (blood-moving — monitor INR)',
      'Drug interactions: diabetes medications (MONITOR — significant antidiabetic via gut microbiota), anticoagulants (monitor INR), immunosuppressants (NK/macrophage modulation — practitioner oversight)',
    ],
    dosage_range:
      'Decoction (traditional): dried conk slices simmered 30–60 minutes in water; typical East Asian bracket polypore dosing 3–9 g daily in divided doses. Extract (polyphenol-rich or polysaccharide-enriched per application): dose based on active fraction — no universal standardised consumer protocol established. Duration: 4–12 week courses for metabolic and anti-gout protocols; longer courses for immune terrain work. NOTE: mark clearly in database as False Chaga / Willow Bracket; never conflate with Inonotus obliquus (Chaga).',
    spiritual_layer:
      'Phellinus igniarius is the blood-river stone — a dense black hoof anchoring turbulent river-edge trees, carrying the intelligence of flowing water made still and dark and powerful. She grows where willow trees bend over rivers, hooves clasping the trunk, slowing the thick red currents of uric acid, sugar and inflammatory oedema that accumulate when we move too little and eat too much. She is fire compressed into earth: the metabolic heat of inflammation, crystallised gout, excess glucose — she cools and clarifies with patient, persistent polyphenol precision. She whispers: I cool the heated currents. I lower what has risen too high. I move what has stagnated. I anchor turbulence. I clarify the blood-river.',
    best_preparation:
      'Long decoction for traditional metabolic and anti-gout use. Polyphenol-rich extract for antidiabetic and anti-gout protocols; polysaccharide extract for immune and microbiome work. CRITICAL IDENTITY CLARITY in database and all client communications: this is Phellinus igniarius (False Chaga / Willow Bracket), NOT Inonotus obliquus (Chaga) — different pharmacology, different host tree, different safety considerations. Screen diabetes medications (MONITOR — microbiome-mediated antidiabetic effect), anticoagulants (blood-moving — monitor) and autoimmune conditions (NK/macrophage modulation).',
    caution_level: 'LOW-MEDIUM',
    safe_pregnancy: false,
    status:
      'Grade B+ anti-gout and hypoglycaemic (strong animal data; gout animal models and diabetic mouse models with gut microbiota confirmation). Grade B antitumour and immunomodulation. Grade B neuroprotection (stroke model). Grade B hepatoprotective and cardiovascular. Grade C+ clinical (limited human data). IDENTITY CRITICAL: False Chaga is NOT Chaga; always label clearly as Phellinus igniarius / Willow Bracket / False Chaga. Screen diabetes medications and anticoagulants.',
  },

  // ─────────────────────────────────────────────
  // ZHU LING (POLYPORUS UMBELLATUS)
  // ─────────────────────────────────────────────
  {
    id: 329,
    name: 'Zhu Ling',
    botanical: 'Polyporus umbellatus (sclerotium — "Underground Sieve / Drainage and Protection Fungus")',
    tcm_meridians: ['Kidney', 'Bladder', 'Spleen', 'Liver'],
    tcm_element: 'Water + Earth',
    energetics: ['Neutral', 'Bland', 'Sweet', 'Diuretic', 'Damp-Draining', 'Renoprotective', 'Anti-Fibrotic', 'Hepatoprotective'],
    primary_functions: [
      'Diuretic and TCM damp-draining — classical TCM primary function: promotes urination and leaches out dampness for oedema, difficult urination, urinary tract damp-heat, jaundice and water retention; Zhu Ling decoctions in classical Chinese formulas for these patterns for centuries; modern studies confirm increased urine output and improved renal function in various kidney disease models',
      'Renoprotective and anti-fibrotic — PPS (P. umbellatus polysaccharide) improves renal histology, reduces collagen deposition and fibrosis, and modulates epithelial-mesenchymal transition and matrix metalloproteinases in kidney models; mechanisms include anti-inflammatory, antioxidative and anti-fibrotic actions in renal tissue; kidney "guardian" that drains but also protects structure simultaneously',
      'Antitumour and oncology adjunct — PUPs (P. umbellatus polysaccharides) show antineoplastic effects against multiple tumour cell lines in vitro and in vivo; approved in China as adjuvant for chronic hepatitis B and cancer support (alongside other treatments); mechanisms include immune activation, apoptosis induction, ROS modulation and inhibition of proliferation and metastasis',
      'Hepatoprotective and anti-hepatitis — PUPs help repair liver injury in hepatitis models, improving histology and accelerating hepatocyte regeneration; clinically approved in China as adjuvant for chronic hepatitis B, lowering serum transaminases and improving symptoms; complementary to Fu Ling in liver-kidney support protocols',
      'Immune modulation and anti-ageing — polysaccharides enhance macrophage activation and cytokine modulation; anti-mutagenic and DNA-protective effects; anti-ageing via reduction of oxidative damage and antioxidant enzyme improvement; TCM foundational maintenance mushroom for chronic conditions',
    ],
    secondary_benefits: [
      'Anti-inflammatory and antioxidant — multiple fractions inhibit pro-inflammatory mediators and reduce oxidative stress in renal, hepatic and systemic models; anti-inflammatory tone underlies the renoprotective, hepatoprotective and anti-fibrotic profile across all systems',
      'Sclerotial form distinction — the SCLEROTIUM (underground tuber-like mass) is the medicinal organ, not the fruiting body; this is important for product identification and quality; authentic Zhu Ling specifically refers to P. umbellatus sclerotia',
      'Conservation concern — historically wild-harvested; overharvesting contributed to local rarity; modern controlled cultivation emphasised to protect wild populations and stabilise quality',
      'Classical TCM formula component — Zhu Ling Tang and other multi-herb formulas; typically used in combination with Fu Ling, Alisma, Talcum and other damp-draining herbs rather than as a standalone single medicine',
    ],
    pharmacology:
      'Primary bioactives: polysaccharides PUPs and PPS (beta-glucans and heteropolysaccharides — PRIMARY; antineoplastic; hepatoprotective; immunomodulatory; anti-ageing; antioxidant; PPS specifically renoprotective via EMT modulation and fibrosis reduction; CFDA-approved use as HBV adjuvant in China), triterpenoids and sterols (lanostane-type; diuretic; nephroprotective; anti-inflammatory; antitumour), nucleosides, fatty acids, alkaloids, phenolic compounds and trace elements. Evidence: Grade B+ diuretic and renoprotective (traditional plus modern animal models; growing clinical evidence); Grade B hepatoprotective and anti-hepatitis (clinical approval in China for HBV adjuvant); Grade B antitumour (in vitro and in vivo; oncology adjuvant use in China); Grade B immunomodulatory; Grade A traditional safety (centuries of use).',
    flavor_profile: 'Bland and neutral with minimal taste — sclerotium form used medicinally only; decocted or extracted; not a culinary edible in the ordinary sense',
    contraindications: [
      'Severe fluid depletion, yin deficiency or dryness without dampness — traditional TCM contraindication: as a strong diuretic-damp-drainer, use cautiously when the pattern is dry rather than damp; TCM pattern differentiation is important before recommending',
      'Autoimmune conditions or immunosuppressants — CAUTION: immunomodulatory polysaccharide effects; practitioner oversight in complex immune situations',
      'Pregnancy — insufficient data for strong reassurance; traditional use caution; avoid concentrated extracts without professional guidance',
      'Sclerotium adulteration risk — other sclerotial fungi may appear similar with different chemistry and safety; authentic P. umbellatus sclerotia required; chemical variability across germplasm means standardisation and traceability are needed',
      'Otherwise: preclinical data indicate low toxicity of PUPs/PPS; long-term traditional diuretic use supports generally favourable safety',
    ],
    herb_to_herb_synergy: [
      'Fu Ling (Wolfiporia cocos) — the classical TCM pair: Zhu Ling promotes urination and drains dampness while Fu Ling tonifies Spleen qi and calms Shen; together they address damp patterns at the draining (Zhu Ling) and building (Fu Ling) level simultaneously',
      'Alisma (Ze Xie) — classical Zhu Ling Tang formula ingredient; complementary diuretic and renal-clearing combination',
      'Astragalus and Cordyceps — renal protection trio for CKD-adjacent protocols; complementary nephroprotective mechanisms',
      'Milk Thistle and Schisandra — liver protection combination for hepatitis-adjacent protocols; hepatoprotective synergy',
    ],
    herb_to_herb_caution: [
      'Strong diuretic herbs in dehydrated or yin-deficient individuals — cumulative fluid-draining effect; assess constitution before combining',
      'Other immunomodulating mushrooms in complex autoimmune conditions — combined immune activation; practitioner oversight',
    ],
    herb_to_drug_interactions: [
      'Diuretics — additive fluid and electrolyte loss; monitor hydration and electrolyte balance',
      'Immunosuppressants — immunomodulatory polysaccharides may theoretically interact; practitioner oversight',
      'Hepatitis B antivirals — used as adjuvant in China alongside conventional HBV therapy; coordinate with hepatologist',
      'Hypoglycaemic medications — theoretical mild glycaemic effects; monitor if on tight diabetic management',
    ],
    herb_interactions: [
      'Synergy: Fu Ling (classical TCM pair — drain and build damp pattern), Alisma (Zhu Ling Tang formula), Astragalus and Cordyceps (renal protection trio), Milk Thistle and Schisandra (liver hepatitis protocol)',
      'Caution: strong diuretics in dehydrated or yin-deficient individuals (cumulative fluid loss), immunomodulating mushrooms in complex autoimmune (practitioner oversight)',
      'Drug interactions: diuretics (additive — monitor electrolytes), immunosuppressants (theoretical — practitioner oversight), hepatitis B antivirals (coordinate with hepatologist), hypoglycaemics (monitor glucose)',
    ],
    dosage_range:
      'Decoction (classical and optimal): 6–12 g dried sclerotium simmered 30–45 minutes in 500 ml water; typically 2 cups daily in TCM formulas. Standardised polysaccharide extract (PUPs): 500–1500 mg daily for oncology adjunct or hepatitis B support; per clinical protocol. Duration: TCM formula use — 4–12 week courses with reassessment based on pattern; oncology and hepatitis B adjuvant — longer supervised courses. Sclerotial identity verification mandatory — authentic P. umbellatus sclerotia required.',
    spiritual_layer:
      'Zhu Ling is the underground sieve — hidden clusters of many small caps emerging from a single buried mass, many expressions from one root storehouse. She is the subterranean reservoir keeper: an unseen node that decides where water gathers and how tissues endure over time. She sits in the soil at the base of oaks, invisible and patient, filtering what the body no longer needs while guarding the deep wells of kidney and liver against fibrosis and hardening. She teaches that the most essential work is sometimes the invisible work — the quiet maintenance of drainage systems, the steady protection of deep structural integrity, the prevention of accumulation that hardens into pathology. She whispers: I strain what the body no longer needs. I guard the deep wells of kidney and liver. I slowly unwind fibrotic overgrowth. I protect structure while clearing excess.',
    best_preparation:
      'Long decoction for TCM damp-pattern work — always with TCM pattern differentiation (damp vs dry constitution; Zhu Ling is for damp, not dry). Standardised PUPs extract for oncology adjunct or hepatitis B support in coordination with medical team. SCLEROTIUM IDENTITY VERIFICATION is essential — authentic P. umbellatus sclerotia; not interchangeable with other sclerotial fungi. Screen for yin deficiency/dryness (TCM contraindication), diuretic medications (monitor electrolytes), and autoimmune conditions with immunosuppressants.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status:
      'Grade B+ diuretic and renoprotective (traditional centuries use; modern animal models; growing clinical evidence). Grade B hepatoprotective and HBV adjuvant (CFDA-approved in China). Grade B antitumour and immunomodulatory. Grade A traditional safety. TCM pattern differentiation is the key clinical variable (damp vs dry constitution). Sclerotium identity verification mandatory. Classical pairing with Fu Ling is the foundational TCM formulation context.',
  },

  // ─────────────────────────────────────────────
  // PSILOCYBE CUBENSIS
  // ─────────────────────────────────────────────
  {
    id: 330,
    name: 'Psilocybe Cubensis',
    botanical: 'Psilocybe cubensis (fruiting body — "Psychoplastogen / 5-HT2A Catalyst"; LEGAL STATUS VARIES — SCHEDULE I IN MOST JURISDICTIONS)',
    tcm_meridians: ['Heart', 'Pericardium', 'Third Eye'],
    tcm_element: 'Fire + Water',
    energetics: ['Neutral to Warm', 'Consciousness-Expanding', 'Neuroplastogenic', 'DMN-Dissolving', 'Serotonergic', 'Psychoplastogenic', 'Liminal'],
    primary_functions: [
      'Psilocybin/psilocin 5-HT2A agonism and neuroplasticity — psilocybin (0.37–1.30% dry weight in caps) is dephosphorylated in vivo to psilocin; high affinity for 5-HT2A receptors on cortical layer V pyramidal neurons increases neuronal excitability and glutamate release; acute decreases in 5-HT2A receptor density and increased SV2A (synaptic vesicle glycoprotein marker of synaptic density) consistent with enhanced synaptogenesis; increased dendritic spine density and BDNF upregulation in preclinical models; mTOR-related pathway modulation',
      'Default Mode Network reduction and global connectivity increase — fMRI and PET neuroimaging shows reduced activity and connectivity within DMN (medial prefrontal cortex, posterior cingulate); increased global functional connectivity across normally segregated networks ("network entropy"); altered limbic-cortical connectivity correlating with emotional processing changes; these neurobiological changes correlate with sustained reductions in depressive symptoms weeks after dosing',
      'Treatment-resistant depression — multiple controlled trials: rapid, large effect-size reductions in depressive symptoms in MDD and TRD after one or two psilocybin-assisted psychotherapy sessions; changes in DMN and executive network connectivity correlate with symptom improvements sustained weeks to months; pooled analyses confirm clinical significance',
      'Cancer-related anxiety and depression — Johns Hopkins RCT (51 patients): ~80% maintained clinically significant reductions in anxiety and depression at 6-month follow-up from single psilocybin dose plus psychotherapy; earlier 29-patient trial: durable anti-anxiety and antidepressant effects with single psilocybin dose',
      'Substance use disorders — psilocybin-assisted therapy positive signals in alcohol use disorder (AUD) and tobacco dependence: increased abstinence rates, reduced drinking days; mechanisms include increased cognitive flexibility, altered reward learning and heightened salience of values-consistent behaviour',
    ],
    secondary_benefits: [
      'Transdiagnostic candidate for rigid maladaptive patterns — OCD, PTSD, anorexia nervosa, body dysmorphic disorder (BDD) and other conditions characterised by cognitive/emotional/behavioural rigidity; psilocybin shifts learning styles and cognitive flexibility (rodent data: task engagement, reduced loss aversion, belief-updating and reward learning parameters)',
      'Psychoplastogen conceptual frame — psilocybin acts as a catalyst within a therapeutic container: neuroplasticity and network changes are paired with intentional psychotherapeutic work; the mushroom alone is not the therapy — the therapeutic container including preparation, facilitated session and integration is the complete treatment',
      'Cultivated strain context — Golden Teacher, B+, Penis Envy, Melmac, Ecuadorian, Mexican and other cultivated lineages are all P. cubensis strains selected for morphology, growth behaviour or perceived potency; scientific literature does not distinguish pharmacologically between strains; all share the same core psilocybin-psilocin pharmacology; alkaloid content varies significantly (psilocybin 0.37–1.30% caps; strain variation 0.01–2% dry weight range)',
      'Low physiological toxicity — no confirmed human lethal overdoses from pure psilocybin; no solid evidence of organ damage at therapeutic doses; risk is primarily psychological and contextual rather than direct organ toxicity',
    ],
    pharmacology:
      'Primary bioactives: psilocybin (O-phosphoryl-4-hydroxy-N,N-dimethyltryptamine; 0.37–1.30% dry weight caps; prodrug; dephosphorylated to psilocin in gut/liver), psilocin (4-hydroxy-N,N-dimethyltryptamine; 0.05–1.27% dry weight; active serotonergic compound; 5-HT2A/1A/2C agonism; more labile than psilocybin), minor tryptamines and related compounds (baeocystin, norbaeocystin, norpsilocin, 4-hydroxytryptamine, aeruginascin; beta-carbolines and terpenoids; individual pharmacology still being elucidated — "entourage" effects proposed but not confirmed). PSILOCYBIN IS THE RESEARCH MOLECULE: all clinical trial data uses pharmaceutical psilocybin; the P. cubensis findings extrapolate from molecule-level pharmacology. Evidence: multiple controlled human trials for TRD, MDD, cancer-related anxiety/depression, AUD and tobacco dependence; Phase II/III pipeline active; legal psilocybin therapy services in Oregon (USA); neuroimaging biomarkers (DMN, SV2A) confirmed. LEGAL: Schedule I or equivalent in most jurisdictions; Oregon psilocybin services model; decriminalisation in some cities and regions; Dutch truffle retreats (Psilocybe tampanensis).',
    flavor_profile: 'Earthy, slightly bitter and slightly nutty — the characteristic taste of dried mushroom; variable depending on freshness and storage',
    contraindications: [
      'Personal or family history of psychosis, schizophrenia or schizoaffective disorder — ABSOLUTE CONTRAINDICATION: 5-HT2A agonism can trigger or exacerbate psychotic breaks; HARD BLOCK in all clinical protocols',
      'Bipolar I disorder — ABSOLUTE CONTRAINDICATION: mania risk documented; hard block in all clinical protocols',
      'Uncontrolled cardiovascular disease — CONTRAINDICATED: transient blood pressure and heart rate increases; screen for cardiac conditions',
      'Active severe suicidality or uncontained psychiatric instability — CONTRAINDICATED: clinical protocols require psychiatric stability and screening before any administration',
      'SSRIs, SNRIs, MAOIs — SIGNIFICANT INTERACTION: SSRIs/SNRIs may reduce psilocybin effects (5-HT2A receptor downregulation); MAOIs can potentiate and prolong psilocin effects (serotonin syndrome risk); must be disclosed and managed in clinical protocol',
      'LEGAL CONTEXT HARD BLOCK: in jurisdictions where psilocybin/psilocin is Schedule I or equivalent, this entry is EDUCATIONAL AND RESEARCH-CONTEXTUAL ONLY; no recommendation for unsupervised personal use should be made; only discuss in context of licensed therapeutic services or ongoing clinical trials',
      'Unsupervised recreational use — NOT RECOMMENDED: risk of psychological distress (challenging trips), rare HPPD, exacerbation of underlying vulnerability; the full therapeutic protocol (preparation, facilitation, integration) is integral to safety and benefit',
    ],
    herb_to_herb_synergy: [
      'Lion\'s Mane — neuroplasticity protocol pairing proposed in emerging research: Lion\'s Mane NGF/BDNF support alongside psilocybin neuroplasticity window; timing of Lion\'s Mane relative to psilocybin session is an active area of exploration',
      'Integration support herbs (post-session): Ashwagandha, Lemon Balm, Passionflower — nervous system grounding and integration support in the days following a psilocybin session; not taken before or during',
    ],
    herb_to_herb_caution: [
      'St. John\'s Wort — SEROTONIN SYNDROME RISK and receptor downregulation; avoid combining with psilocybin protocols',
      'High-dose 5-HTP or tryptophan — serotonin precursor additive; potential serotonin syndrome; avoid near sessions',
      'Kava and other potent GABAergic herbs — unpredictable interactions during altered states; generally contraindicated',
    ],
    herb_to_drug_interactions: [
      'SSRIs and SNRIs — receptor downregulation may significantly reduce psilocybin effects; careful tapering under psychiatric supervision required if transitioning; must be disclosed in clinical protocols',
      'MAOIs (pharmaceutical and herbal — including Syrian Rue, Harmala) — SERIOUS: potentiates and prolongs psilocin effects; serotonin syndrome risk; contraindicated without careful clinical dose adjustment',
      'Lithium — case reports of seizures when combined with psilocybin; CONTRAINDICATED',
      'Stimulants (amphetamines, MDMA) — cardiovascular strain; unpredictable CNS interactions; avoid',
      'Anticoagulants — no specific evidence but altered physiological state adds risk; clinical protocols screen for all medications',
    ],
    herb_interactions: [
      'Synergy: Lion\'s Mane (neuroplasticity protocol — emerging research), integration support herbs post-session (Ashwagandha, Lemon Balm, Passionflower — grounding)',
      'Caution: St. John\'s Wort (receptor downregulation and serotonin syndrome), 5-HTP and tryptophan (serotonin precursor risk), Kava and GABAergic herbs (unpredictable during altered states)',
      'Drug interactions: SSRIs/SNRIs (receptor downregulation — careful clinical management required), MAOIs (SERIOUS potentiation and serotonin syndrome risk), Lithium (CONTRAINDICATED — seizure case reports), stimulants (cardiovascular strain), all medications (full disclosure and clinical screening required)',
    ],
    dosage_range:
      'CLINICAL CONTEXT ONLY — all dosing information below is for educational reference regarding pharmaceutical research protocols; this is NOT a recommendation for personal use outside licensed therapeutic contexts. Pharmaceutical psilocybin clinical research doses: low (1–3 mg psilocybin base) for initial screening; moderate (10–20 mg) for therapeutic sessions; high (25–30 mg) for full-dose TRD protocols. Approximate whole-mushroom equivalent (educational only): moderate therapeutic session ≈ 2–4 g dried P. cubensis (highly variable due to strain and content variability). Oregon psilocybin services: licensed facilitators administer standardised doses in supervised settings. NEVER SELF-ADMINISTER outside licensed therapeutic or clinical trial context.',
    spiritual_layer:
      'Psilocybe cubensis is the golden cap teacher — the most widespread of the sacred mushrooms, growing from the earth itself, from the fertile substrate of what animals have eaten and processed and returned. She is deeply democratic: she grows where life has been, accessible to the humblest of conditions. Her pharmacological teaching is the DMN dissolution — the quieting of the default mode network that narrates self-story endlessly, the expansion of connectivity between brain regions that rarely speak, the window of neuroplasticity in which old patterns can be gently loosened and new learning can settle. She is not a shortcut to healing but a catalyst that requires a therapeutic container to become medicine. The mushroom itself is only one third of the protocol — preparation, session and integration are the three inseparable parts. She whispers: The self is a story. The story can be gently revised. Neuroplasticity is a gift and a responsibility. I open the window; you must do the work. The work requires the right container, the right support, the right timing.',
    best_preparation:
      'EDUCATIONAL AND RESEARCH-CONTEXTUAL ENTRY ONLY — this database entry describes the pharmacological, clinical and historical context of Psilocybe cubensis and psilocybin-assisted therapy for professional and educational purposes. In jurisdictions where licensed therapeutic services exist (Oregon psilocybin services, clinical trials, Dutch retreat contexts): the complete therapeutic protocol — psychiatric screening, preparation sessions, facilitated dosing session, integration support — is the medicine; the mushroom alone is not. MANDATORY CLINICAL SCREENING before any exposure: personal/family history of psychosis or schizophrenia (ABSOLUTE HARD BLOCK), bipolar I disorder (HARD BLOCK), cardiovascular conditions, active severe suicidality, current medications (especially SSRIs, MAOIs and lithium — serious interactions). Cultivated strain identification: all P. cubensis strains share the same pharmacology; alkaloid content varies significantly; standardised pharmaceutical psilocybin removes variability for clinical purposes.',
    caution_level: 'VERY HIGH',
    safe_pregnancy: false,
    status: 'EDUCATIONAL AND RESEARCH-CONTEXTUAL ENTRY — legal status is Schedule I or equivalent in most jurisdictions. Multiple controlled human trials for TRD, MDD, cancer-related anxiety/depression, AUD and tobacco dependence. 5-HT2A agonism; DMN reduction; neuroplasticity confirmed. ABSOLUTE CONTRAINDICATIONS: personal/family psychosis or schizophrenia, bipolar I disorder. SERIOUS DRUG INTERACTIONS: MAOIs (serotonin syndrome risk), lithium (seizure risk), SSRIs/SNRIs (receptor downregulation). Low physiological toxicity; risk is psychological and contextual. Complete therapeutic protocol (preparation, session, integration) is the effective clinical unit. Only discuss in context of licensed therapeutic services or clinical trials.'
  },
  {
    id: 304,
    name: 'Raspberry Leaf',
    botanical: 'Rubus idaeus',
    tcm_meridians: ['Uterus', 'Kidney', 'Liver', 'Spleen'],
    tcm_element: 'Earth',
    energetics: ['Slightly Cooling', 'Drying', 'Astringent', 'Toning', 'Tissue-firming'],
    primary_functions: [
      'Uterine tonic — premier ally for pelvic and uterine tissue resonance',
      'Tissue firming — gentle astringent for mucosal and reproductive integrity',
      'Nutritive support — rich in minerals and vitamins for long-term vitality',
      'Digestive astringent — useful for mild loose stools and GI irritation'
    ],
    secondary_benefits: [
      'Cycle regulation support',
      'Postpartum recovery and tissue toning',
      'Mouthwash/gargle for irritated gums or throat'
    ],
    pharmacology: 'Rich in fragarine (alkaloid that tones uterine muscles), tannins (astringency), and high mineral content (Magnesium, Potassium, Iron). Evidence grade B for traditional uterine support.',
    flavor_profile: 'Mildly sweet, herbaceous, earthy, and pleasantly green',
    contraindications: [
      'Extreme constipation or excessive dryness',
      'Early pregnancy (should only be used under practitioner guidance)',
      'Highly sensitive iron-absorption conditions'
    ],
    herb_interactions: [
      'Synergy: Nettle, Shatavari, Rose, Oatstraw',
      'Caution: Stacked high-tannin formulas may cause GI dryness'
    ],
    dosage_range: '1-3 cups as a standard infusion daily; Tincture 2-5ml daily',
    spiritual_layer: 'Raspberry leaf teaches resilient softness. She strengthens by toning the container, helping the body hold itself with dignity and grounded intelligence. She whispers: I am held. My tissues are strong and supple.',
    best_preparation: 'Long Infusion (Tea) is superior for mineral extraction.',
    caution_level: 'LOW',
    safe_pregnancy: null,
    status: 'Gentle, mineral-rich tonic. Excellent long-game herb for tissue resilience.'
  },
  {
    id: 305,
    name: 'Rosehip',
    botanical: 'Rosa canina / Rosa spp. (fruit)',
    tcm_meridians: ['Lung', 'Spleen', 'Liver', 'Heart'],
    tcm_element: 'Earth + Metal',
    energetics: ['Neutral', 'Slightly Cool', 'Sour', 'Nutritive', 'Restorative', 'Gently Astringent'],
    primary_functions: [
      'Nutritive antioxidant tonic — broad-spectrum vitamin-rich rebuilding',
      'Seasonal immune resilience — classic winter fruit ally for vitality',
      'Connective tissue support — useful for skin, collagen, and joint formulas',
      'Convalescence support — gentle rebuilding medicine after illness'
    ],
    secondary_benefits: [
      'Family-friendly syrup base',
      'Pectin-rich digestive support',
      'Tart brightness for flavoring clinical blends'
    ],
    pharmacology: 'Rich in Vitamin C, carotenoids, flavonoids, and galactolipids. Mechanistically supports antioxidant status and joint nourishment. Evidence grade A for nutritive use.',
    flavor_profile: 'Bright, tart, fruity, and pleasantly sour',
    contraindications: [
      'Kidney stone history (extreme high-dose vitamin C caution)',
      'Extreme gastric acidity',
      'Improperly processed seeds (hairs can irritate the throat)'
    ],
    herb_interactions: [
      'Synergy: Hibiscus, Elderberry, Nettle, Rose Petals, Hawthorn',
      'Caution: Very sour formulas in acid-sensitive individuals'
    ],
    dosage_range: '5-10g daily as powder or decoction',
    spiritual_layer: 'Rosehip is the fruit that remains after beauty passes. She teaches the medicine of ripening and the quiet strength of endurance. She whispers: I ripen into strength. I carry beauty through every season.',
    best_preparation: 'Syrup, Tea, or Powder.',
    caution_level: 'LOW',
    safe_pregnancy: true,
    status: 'Very safe, food-like restorative. Prioritize deseeded material.'
  },
  {
    id: 306,
    name: 'Shatavari',
    botanical: 'Asparagus racemosus (root)',
    tcm_meridians: ['Kidney', 'Lung', 'Stomach', 'Reproductive'],
    tcm_element: 'Water + Earth',
    energetics: ['Cool', 'Moist', 'Sweet', 'Bitter', 'Demulcent', 'Yin-Building'],
    primary_functions: [
      'Reproductive nourishment — premier Ayurvedic tonic for hormonal restoration',
      'Demulcent GI support — soothes hyperacidity and inflammatory digestive heat',
      'Nervous system restoration — replenishing ally for burnout and depletion',
      'Cooling endocrine support — reduces pitta-type hormonal irritability'
    ],
    secondary_benefits: [
      'Moistening support for dry constitutions',
      'Respiratory mucosal soothing',
      'Postpartum and lactation support'
    ],
    pharmacology: 'Contains steroidal saponins (shatavarins), mucilage, and flavonoids. Acts as a moistening demulcent and adaptogenic restorative. Evidence grade B for reproductive support.',
    flavor_profile: 'Mildly sweet, earthy, starchy, and nourishing',
    contraindications: [
      'Estrogen-sensitive conditions (cautious oversight required)',
      'Excess Kapha or heavily congested/damp constitutions',
      'Rare Asparagus-family allergy'
    ],
    herb_interactions: [
      'Synergy: Rose, Nettle, Raspberry Leaf, Ashwagandha, Oatstraw',
      'Caution: Heavy tonic stacking in damp/congested individuals'
    ],
    dosage_range: '2–6 g daily, often in warm milk or plant milk',
    spiritual_layer: 'Shatavari is the cooling intelligence of replenishment. She restores moisture where life has become too dry or driven. She whispers: I replenish with grace. Softness is strength. I restore my inner waters.',
    best_preparation: 'Powder in warm milk or nourishing decoction.',
    caution_level: 'MEDIUM',
    safe_pregnancy: null,
    status: 'Excellent cooling restorative. Best for dry/hot/depleted presentations.'
  }
];
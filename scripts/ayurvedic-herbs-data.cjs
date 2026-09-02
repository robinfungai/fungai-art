// ────────────────────────────────────────────────────────────────
// ayurvedic-herbs-data.cjs
//
// Real (not stub) pharmacology + traditional data for the 28 Ayurvedic
// herbs in engine-2's HB array that aren't yet in the rich herbs.ts
// / herbs-data.js source of truth.
//
// Sources: standard Ayurvedic materia medica (Bhavaprakasha, Charaka
// Samhita, Frawley/Lad Yoga of Herbs), modern reviews on Boswellia
// (5-LOX inhibition), Guggulu (guggulsterones), Amla (ascorbic +
// tannin complex), Andrographis (andrographolide immune modulation),
// Terminalia arjuna (arjunolic acid cardiotonic), etc.
//
// Each entry uses the same schema as herbs-data.js.
// ────────────────────────────────────────────────────────────────

module.exports = {
  // ── Amla · Emblica officinalis ──
  'Amla': {
    tcm_meridians: ['Liver','Stomach','Lung'],
    tcm_element: 'Wood + Metal',
    energetics: ['Cool','Sour','Sweet','Astringent','Rasayana — rejuvenative'],
    primary_functions: [
      'Rasayana (whole-body rejuvenative) — the primary Ayurvedic longevity tonic; balances all three doshas',
      'Antioxidant powerhouse — one of the densest natural sources of vitamin C (600-900 mg per 100g), stable via tannin complexing',
      'Digestive fire (agni) support without heating — cooling bitter that still kindles digestion',
      'Liver protection and hepatocyte regeneration — hepatoprotective across CCl4, alcohol, and paracetamol-induced models',
    ],
    secondary_benefits: [
      'Skin, hair and eye tonic — traditional beauty rasayana',
      'Blood sugar modulation and lipid profile support',
      'Anti-inflammatory via COX-2 and NF-kB modulation',
    ],
    pharmacology:
      'Rich in ascorbic acid (stable, tannin-complexed — resists heat and oxidation), hydrolysable tannins (emblicanin A/B, punigluconin, pedunculagin), gallic and ellagic acids, flavonoids (quercetin, kaempferol). The vitamin C stability via tannin complexing is unique and gives Amla its rasayana action across long shelf-life. Modulates NF-kB, reduces oxidative markers (MDA), supports glutathione, protects hepatocytes.',
    flavor_profile: 'Sour dominant, astringent, sweet-bitter aftertaste — five of six tastes present',
    contraindications: [
      'Generally very safe — food-like at traditional doses',
      'High-dose extracts may cause mild GI upset in sensitive individuals',
    ],
    herb_to_herb_synergy: [
      'Bibhitaki + Haritaki (as Triphala) — the classical three-fruit rejuvenative formula',
      'Ashwagandha — deep rasayana pairing for burnout recovery',
      'Turmeric — antioxidant + anti-inflammatory amplification',
    ],
    herb_to_drug_interactions: [
      'May potentiate anticoagulants (vitamin K interaction is minimal, but antiplatelet effect at high dose is documented)',
      'Blood sugar lowering — monitor if on diabetes medication',
    ],
    dosage_range: 'Powder: 3-6 g/day. Extract: 500-1500 mg/day. Fresh fruit: 1-2 daily.',
    spiritual_layer:
      'Amla is the sacred fruit of Vishnu — the fruit that never lost its lustre through cosmic ages. She is the rasayana of longevity that does not force youth but preserves what is already alive. She teaches that true rejuvenation is not adding but conserving, that the deepest medicine is often the most food-like, that cooling astringency is a form of love.',
    best_preparation: 'Fresh juice, standardised churna, or hydroalcoholic extract capturing the tannin-ascorbate complex',
  },

  // ── Neem · Azadirachta indica ──
  'Neem': {
    tcm_meridians: ['Liver','Large Intestine','Skin'],
    tcm_element: 'Wood + Metal',
    energetics: ['Cold','Bitter','Dry','Kapha-Pitta reducing'],
    primary_functions: [
      'Broad-spectrum antimicrobial — bacterial, fungal, parasitic; traditional first-line for skin conditions and internal parasites',
      'Blood-cleaning bitter — clears toxic-heat (raktashuddhi) from the tissues; use in chronic skin conditions',
      'Blood sugar reduction — traditional adjunct in Type 2 diabetes',
      'Insect-repellent and larvicidal — topical and environmental use',
    ],
    secondary_benefits: [
      'Immune-modulatory — supports resistance without over-stimulation',
      'Hepatoprotective in low doses; hepatotoxic at high doses (dose-dependent inversion — respect the traditional dose)',
      'Dental and oral health — twig-brush tradition backed by antimicrobial data',
    ],
    pharmacology:
      'Triterpenoid limonoids (azadirachtin, nimbin, nimbidin, salannin) are the primary bioactives — potent broad-spectrum antimicrobial via membrane disruption. Nimbidin: anti-inflammatory (comparable to indomethacin in some models), immunomodulatory. Contains flavonoids, sterols, and quercetin. Cautionary: seed oil (azadirachtin-concentrated) is hepatotoxic at high doses — leaf extract at traditional doses is the safe form.',
    flavor_profile: 'Intensely bitter, dry, cooling — one of the most bitter of the classical Ayurvedic herbs',
    contraindications: [
      'Pregnancy — traditional emmenagogue, avoid',
      'Children under 5 — avoid unsupervised',
      'Low Kapha / Vata constitution — cooling and drying, can aggravate',
      'Fertility — reversible reduction of male fertility documented; avoid if trying to conceive',
      'Hepatic disease — dose-dependent hepatotoxicity at high doses',
      'Not for long-term daily use — cyclical use (weeks on, weeks off) is traditional',
    ],
    herb_to_herb_synergy: [
      'Turmeric — classical anti-inflammatory + antimicrobial pairing for skin',
      'Manjistha — combined blood cleaner and lymph mover',
      'Guduchi — immune-modulating + detoxifying pairing',
    ],
    herb_to_drug_interactions: [
      'Blood sugar lowering — potentiates diabetes medications',
      'Immunosuppressants — theoretical interference (Neem is immunomodulatory)',
      'Lithium — theoretical interference via renal effects',
    ],
    dosage_range: 'Leaf powder: 1-3 g/day. Extract: 500-1000 mg/day. Cyclical use only.',
    spiritual_layer:
      'Neem is the village pharmacy — the tree of a hundred medicines standing at every temple gate. She is the bitter mother who does not soothe but purifies. She teaches that some medicines heal through cleansing rather than nourishing, that not everything comforting is medicine and not all medicine is comfortable. She whispers: I burn away what does not serve, so that what does can grow.',
    best_preparation: 'Fresh leaf decoction or standardised extract; avoid unregulated seed oil internally',
  },

  // ── Guggulu · Commiphora mukul ──
  'Guggulu': {
    tcm_meridians: ['Liver','Spleen','Heart'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm','Bitter','Pungent','Astringent','Kapha-reducing'],
    primary_functions: [
      'Scraping (lekhaniya) action — clears channels of accumulated fat, cholesterol, and inflammatory deposits; classical Ayurvedic obesity + hyperlipidaemia herb',
      'Anti-inflammatory for chronic joint and skin conditions — traditional first-line for rheumatoid arthritis and psoriasis',
      'Thyroid support — mild stimulation of thyroid function in hypothyroid presentations',
      'Cardiovascular protection via lipid modulation — reduces LDL and total cholesterol',
    ],
    secondary_benefits: [
      'Support for skin regeneration and healing',
      'Digestive fire (agni) support',
      'Traditional adjunct in diabetes and metabolic syndrome',
    ],
    pharmacology:
      'Guggulsterones (E- and Z-isomers) are the primary bioactives — farnesoid X receptor (FXR) antagonists, which paradoxically increases bile acid synthesis and lowers LDL cholesterol. Anti-inflammatory via NF-kB inhibition. Contains myrrhic acid, essential oils (myrcene, dimyrcene), gum resin. The purified resin (shuddha guggulu) is the traditional form — raw guggulu can cause GI upset.',
    flavor_profile: 'Bitter, pungent, astringent — resinous mouth-feel',
    contraindications: [
      'Pregnancy and breastfeeding — avoid',
      'Hyperthyroid — may worsen (mild TSH-lowering effect)',
      'Menorrhagia — may increase bleeding',
      'Autoimmune conditions — theoretical immune stimulation',
      'Concurrent statin use — additive lipid-lowering may over-lower LDL',
      'GI sensitivity — start low; can cause nausea, diarrhoea',
    ],
    herb_to_herb_synergy: [
      'Turmeric — anti-inflammatory + lipid-modulating amplification for arthritis',
      'Triphala — combined scraping and cleansing for metabolic syndrome',
      'Boswellia — synergistic joint and connective tissue support',
    ],
    herb_to_drug_interactions: [
      'Statins — additive; monitor lipids',
      'Thyroid medications — modulates thyroid function',
      'Anticoagulants — mild antiplatelet effect',
      'Diltiazem, propranolol — reduces bioavailability',
      'Estrogen — may reduce contraceptive efficacy',
    ],
    dosage_range: 'Purified (shuddha) guggulu: 500-2500 mg/day of standardised extract',
    spiritual_layer:
      'Guggulu is the tree that bleeds sacred resin when wounded — the healer that gives from its own wound. She is the fire that dissolves what has grown too heavy, the scraper of channels clogged by comfort. She teaches that some accumulations must be actively released, not simply nourished away, and that inflammation held long enough becomes the shape of the body itself.',
    best_preparation: 'Purified (shuddha) guggulu resin, standardised for guggulsterones 2.5-5%',
  },

  // ── Guduchi · Tinospora cordifolia ──
  'Guduchi': {
    tcm_meridians: ['Liver','Spleen','Lung'],
    tcm_element: 'Wood + Earth',
    energetics: ['Neutral (slightly warming)','Bitter','Astringent','Sweet post-digestive','Rasayana'],
    primary_functions: [
      'Immune-modulating rasayana — the primary Ayurvedic immune adaptogen; balances all three doshas',
      'Anti-inflammatory for chronic autoimmune and joint conditions',
      'Hepatoprotective — supports liver function in chronic hepatitis and NAFLD',
      'Blood sugar modulation — traditional diabetes adjunct',
    ],
    secondary_benefits: [
      'Fever reduction (jwaraghna) — classical fever herb',
      'Adaptogenic stress support with cognitive clarity',
      'Skin condition support via blood-cleaning action',
    ],
    pharmacology:
      'Alkaloids (berberine, palmatine, tinosporine), diterpenoids (tinosporide, columbin, tinosporaside), glycosides (giloin, tinosporin), steroids (giloinsterol). Immunomodulatory via macrophage activation, NK cell enhancement, T-cell proliferation. Hepatoprotective via glutathione support and NF-kB modulation. Berberine content contributes to blood sugar effect.',
    flavor_profile: 'Bitter, cooling on the tongue, warming in the belly',
    contraindications: [
      'Autoimmune conditions — cautious use (immunomodulatory can be dual-edged)',
      'Blood sugar lowering — monitor with diabetes medication',
      'Pregnancy — insufficient safety data; avoid',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha — deep adaptogenic + immune rasayana pairing',
      'Turmeric — anti-inflammatory + hepatoprotective amplification',
      'Neem — synergistic detoxification with immune support',
      'Amla — vitamin C + immunomodulator classical rasayana pairing',
    ],
    herb_to_drug_interactions: [
      'Immunosuppressants — theoretical interference',
      'Diabetes medications — additive blood sugar lowering',
      'NSAIDs — additive anti-inflammatory (theoretical GI risk)',
    ],
    dosage_range: 'Stem powder: 3-6 g/day. Extract: 300-1000 mg/day.',
    spiritual_layer:
      'Guduchi is amrita — the nectar of the gods that took root in earthly form. She is the immortal creeper that regenerates from any cut stem. She teaches that resilience is not resistance but the capacity to grow back from disturbance, that the immune system is not a wall but a memory of self, and that adaptation is the deepest form of intelligence a body carries.',
    best_preparation: 'Fresh stem juice, satva (starchy extract), or standardised full-spectrum extract',
  },

  // ── Kalmegh · Andrographis paniculata ──
  'Kalmegh': {
    tcm_meridians: ['Liver','Lung','Large Intestine'],
    tcm_element: 'Wood + Metal',
    energetics: ['Cold','Bitter','Dry'],
    primary_functions: [
      'Acute respiratory infection support — reduces upper-respiratory symptom severity and duration (multiple RCTs)',
      'Immune-modulating with strong antimicrobial action',
      'Hepatoprotective — the "king of bitters" for liver inflammation',
      'Anti-inflammatory via NF-kB and COX pathway modulation',
    ],
    secondary_benefits: [
      'Blood sugar reduction',
      'Adjunctive in fever protocols',
      'Traditional use in autoimmune inflammatory conditions',
    ],
    pharmacology:
      'Andrographolide (and neo-, deoxy-, iso- variants) is the primary diterpene lactone — powerful anti-inflammatory via NF-kB inhibition, anti-viral (broad spectrum including influenza and dengue in vitro), hepatoprotective. Multiple RCT reviews show clinically significant benefit in acute URTI (fewer + milder + shorter symptoms).',
    flavor_profile: 'Extremely bitter — one of the most bitter herbs in the pharmacopoeia',
    contraindications: [
      'Pregnancy — abortifacient at high doses; avoid entirely',
      'Fertility — reversible male fertility reduction documented',
      'Autoimmune conditions — cautious immunomodulation',
      'Anticoagulants — additive antiplatelet',
      'Not for long-term daily use — 4-8 weeks then break',
    ],
    herb_to_herb_synergy: [
      'Echinacea — combined immune activation for acute infection',
      'Elderberry — respiratory + antiviral pairing',
      'Turmeric — anti-inflammatory amplification',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants — additive antiplatelet',
      'Antihypertensives — mild BP lowering additive',
      'Diabetes meds — additive blood sugar lowering',
      'Immunosuppressants — theoretical interference',
    ],
    dosage_range: 'Standardised extract (10-30% andrographolides): 300-1200 mg/day for 4-8 weeks',
    spiritual_layer:
      'Kalmegh is the fierce bitter — the medicine that refuses to be sweetened. She strips away comfort to reveal what needs healing, cleanses the liver of accumulated frustration, breaks fevers by refusing to negotiate. She teaches that some medicines must taste like the illness they treat, that bitterness held on the tongue is the beginning of true cleansing.',
    best_preparation: 'Standardised extract in capsule form (raw powder is prohibitively bitter)',
  },

  // ── Manjistha · Rubia cordifolia ──
  'Manjistha': {
    tcm_meridians: ['Liver','Heart','Spleen'],
    tcm_element: 'Wood + Fire',
    energetics: ['Cool','Bitter','Sweet','Astringent','Pitta-Kapha reducing'],
    primary_functions: [
      'Blood cleaner (raktashodhak) — the primary Ayurvedic lymph and blood mover',
      'Skin condition support — acne, eczema, hyperpigmentation, chronic skin issues',
      'Lymphatic drainage — supports lymph flow and clearance',
      'Uterine tonic — traditional support for menstrual irregularities',
    ],
    secondary_benefits: [
      'Traditional wound and connective tissue healing',
      'Hepatoprotective and mild anti-inflammatory',
      'Anti-neoplastic potential (early research)',
    ],
    pharmacology:
      'Anthraquinones (purpurin, munjistin, alizarin), naphtoquinones, glycosides (rubiadin, mollugin), triterpenoids. Alizarin and its derivatives are the classical natural red dye — and the source of the herb\'s blood-analogue action metaphorically and biochemically. Anti-inflammatory via COX-2 modulation; hepatoprotective in CCl4 models.',
    flavor_profile: 'Bitter-sweet with astringent finish, mild earthy quality',
    contraindications: [
      'Pregnancy — traditional emmenagogue; avoid',
      'Diabetes — may enhance blood sugar lowering effect of medications',
      'Urine may turn reddish — normal, not a health concern',
    ],
    herb_to_herb_synergy: [
      'Neem — powerful blood-cleaning pairing for chronic skin issues',
      'Turmeric — anti-inflammatory skin trio with anti-microbial edge',
      'Guduchi — immune + blood-cleaning combination',
    ],
    herb_to_drug_interactions: [
      'Anticoagulants — mild theoretical interaction',
      'Diabetes medications — additive blood sugar lowering',
    ],
    dosage_range: 'Powder: 3-6 g/day. Extract: 500-1500 mg/day.',
    spiritual_layer:
      'Manjistha is the red thread that runs through the tissue of the earth — the herb that stains cloth and cleanses blood with the same alkaline heart. She is the mover of what has stagnated in the lymph, the shifter of old imprints held in the skin. She teaches that beauty is a byproduct of clean flow, and that what clears the outer surface must first move through the deeper channels.',
    best_preparation: 'Full-spectrum root decoction or standardised extract',
  },

  // ── Arjuna · Terminalia arjuna ──
  'Arjuna': {
    tcm_meridians: ['Heart','Liver','Pericardium'],
    tcm_element: 'Fire',
    energetics: ['Cool','Astringent','Pitta reducing'],
    primary_functions: [
      'Cardiac tonic — the primary Ayurvedic herb for the heart; supports myocardial function in CHF and angina',
      'Vasodilator and mild antihypertensive — improves coronary blood flow',
      'Lipid modulation — reduces LDL and total cholesterol',
      'Cardioprotective in ischemic conditions — reduces infarct size in animal models',
    ],
    secondary_benefits: [
      'Traditional support for grief and emotional heart-holding',
      'Astringent action for chronic diarrhoea and haemorrhage',
      'Bone healing (traditional)',
    ],
    pharmacology:
      'Arjunolic acid, arjungenin, arjunetin (triterpenoid glycosides) provide cardioprotective action. High tannin content contributes to astringent and haemostatic effects. CoQ10-sparing effect, positive inotropic action, mild ACE-inhibitor-like activity documented. Multiple small RCTs in CHF show improved LVEF and reduced symptoms.',
    flavor_profile: 'Astringent, mildly bitter, cool',
    contraindications: [
      'Hypotension — additive with antihypertensive drugs',
      'Concurrent digoxin — theoretical additive inotropy',
      'Pregnancy — insufficient safety data; use only under practitioner supervision',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha — combined heart + nervous system tonic',
      'Hawthorn — cardiac tonic pairing (Western-Ayurvedic bridge)',
      'Rose — heart-opening emotional support pairing',
    ],
    herb_to_drug_interactions: [
      'Antihypertensives — additive BP lowering',
      'Digoxin — additive cardiac effect; monitor',
      'Anticoagulants — mild interaction (tannin content)',
      'Statins — additive lipid lowering',
    ],
    dosage_range: 'Bark powder: 3-6 g/day. Extract: 500-1500 mg/day. Milk decoction traditional.',
    spiritual_layer:
      'Arjuna is the warrior-tree — named for the archer of the Bhagavad Gita, standing between duty and grief. She is the heart\'s tonic in both senses: physical strengthener of the myocardium, and quiet steadier of the emotional heart that carries loss. She teaches that a strong heart is not a hardened one but a well-supplied one, that the way through grief is often through more feeling, not less.',
    best_preparation: 'Bark decoction in milk (traditional), or standardised extract with arjunolic acid 8-12%',
  },

  // ── Boswellia / Shallaki · Boswellia serrata ──
  'Shallaki': {
    tcm_meridians: ['Liver','Large Intestine'],
    tcm_element: 'Fire + Metal',
    energetics: ['Warm','Bitter','Pungent','Kapha-Vata reducing'],
    primary_functions: [
      'Selective 5-LOX inhibitor — reduces leukotriene-mediated inflammation without cyclo-oxygenase inhibition (safer GI profile than NSAIDs)',
      'Osteoarthritis and rheumatoid arthritis — multiple RCTs show clinically meaningful pain and function improvement',
      'Inflammatory bowel disease (Crohn\'s, ulcerative colitis) — supportive evidence for symptom reduction and mucosal healing',
      'Chronic asthma — 5-LOX pathway relevance shows benefit in some trials',
    ],
    secondary_benefits: [
      'Chronic sinusitis and respiratory inflammation',
      'Traditional wound healing and skin conditions',
      'Neurological anti-inflammatory (early brain research)',
    ],
    pharmacology:
      'Boswellic acids (particularly AKBA — 3-O-acetyl-11-keto-beta-boswellic acid) are the primary bioactives. Selective and non-redox 5-LOX inhibition — a mechanistic advantage over NSAIDs (which inhibit COX and have GI risk). AKBA also inhibits cathepsin G, human leukocyte elastase, and complement C3. Standardised extracts (30-65% boswellic acids, enhanced AKBA content) are the modern research form.',
    flavor_profile: 'Bitter, pungent, resinous',
    contraindications: [
      'Pregnancy — traditional emmenagogue at high doses; avoid',
      'GI sensitivity — rare stomach upset, nausea',
      'Autoimmune modulators — theoretical interference',
    ],
    herb_to_herb_synergy: [
      'Turmeric — anti-inflammatory synergy via complementary COX + LOX pathway coverage',
      'Ashwagandha — pain + adaptogenic pairing for chronic inflammatory conditions',
      'Ginger — additional COX modulation for pain',
    ],
    herb_to_drug_interactions: [
      'NSAIDs — additive anti-inflammatory (potentially reducing NSAID need)',
      'Immunosuppressants — theoretical interaction',
      'Cytochrome P450 substrates — mild induction possible at high doses',
    ],
    dosage_range: 'Standardised extract (30-65% boswellic acids): 300-1200 mg/day divided doses',
    spiritual_layer:
      'Boswellia is the tree that gives its resin as prayer — frankincense of the Ayurvedic mountains, sister to the Middle Eastern olibanum. She is the anti-inflammatory that does not force but redirects, the pain-easer that works through pathway selectivity rather than blanket suppression. She teaches that intelligent medicine means picking the right lever, not the loudest one.',
    best_preparation: 'Standardised gum resin extract (AKBA-enriched preferred for research-grade outcomes)',
  },

  // ── Punarnava · Boerhavia diffusa ──
  'Punarnava': {
    tcm_meridians: ['Kidney','Liver','Spleen'],
    tcm_element: 'Water',
    energetics: ['Warm','Bitter','Astringent','Sweet post-digestive'],
    primary_functions: [
      'Diuretic — the classical Ayurvedic herb for oedema and water retention (name means "renewed again" — for the puffy body regaining shape)',
      'Kidney and liver protective — supports both organs in chronic dysfunction',
      'Anti-anaemic — traditional in iron-deficiency and general blood building',
      'Anti-inflammatory for chronic joint conditions',
    ],
    secondary_benefits: [
      'Blood sugar modulation',
      'Cardiac support (mild vasodilator)',
      'Traditional support in ascites and fluid overload',
    ],
    pharmacology:
      'Punarnavine (alkaloid, primary diuretic), boeravinones (rotenoids, hepatoprotective), punarnavoside, sitosterol, oxalate. Diuretic action is potassium-sparing (unlike thiazides) — a mechanistic advantage. Anti-inflammatory via NF-kB modulation.',
    flavor_profile: 'Slightly bitter, astringent, mildly sweet',
    contraindications: [
      'Pregnancy — traditional caution',
      'Concurrent diuretics — additive fluid loss',
      'Dehydration — inappropriate',
      'Kidney stones (oxalate content) — cautious in high-risk patients',
    ],
    herb_to_herb_synergy: [
      'Gokshura — combined diuretic + kidney tonic',
      'Guduchi — immune + kidney pairing for chronic conditions',
      'Turmeric — liver + kidney anti-inflammatory synergy',
    ],
    herb_to_drug_interactions: [
      'Diuretics — additive',
      'Antihypertensives — additive BP effect',
      'Digoxin — theoretical potassium modulation',
    ],
    dosage_range: 'Root powder: 3-6 g/day. Fresh juice: 10-30 ml/day. Extract: 500-1000 mg/day.',
    spiritual_layer:
      'Punarnava — "she who renews" — is the water-mover of the body, the shape-restorer for those who have been holding what should be released. She teaches that swelling is not just water but a stagnation of message, that the kidneys are the deepest keepers of fear and inheritance, and that renewal is often the return to a shape you already had.',
    best_preparation: 'Fresh juice or root decoction; standardised extract for chronic use',
  },

  // ── Gokshura · Tribulus terrestris ──
  'Gokshura': {
    tcm_meridians: ['Kidney','Liver','Bladder'],
    tcm_element: 'Water',
    energetics: ['Sweet','Cool','Rasayana for reproductive tissue'],
    primary_functions: [
      'Reproductive tonic for both sexes — traditional male vigour + female fertility support',
      'Urinary tonic — soothing and mildly diuretic; traditional for urinary tract inflammation and calculi',
      'Kidney tonic — nourishes and strengthens without over-stimulating',
      'Adaptogenic support for athletic recovery and libido',
    ],
    secondary_benefits: [
      'Cardiovascular support via vasodilation',
      'Mild anti-inflammatory',
      'Traditional in chronic gout and joint conditions',
    ],
    pharmacology:
      'Steroidal saponins (protodioscin, dioscin, tribulosin) are the primary bioactives — protodioscin has been theorised to raise DHEA and modestly influence libido via peripheral rather than pituitary pathways (does NOT reliably raise testosterone in humans, despite marketing claims). Contains flavonoids, alkaloids (harmane, harmine — minor).',
    flavor_profile: 'Sweet, slightly bitter, cooling',
    contraindications: [
      'Pregnancy and breastfeeding — insufficient safety data',
      'Hormone-sensitive cancers — theoretical caution',
      'Autoimmune — cautious use',
      'Sleep-onset insomnia — mildly activating in sensitive individuals',
    ],
    herb_to_herb_synergy: [
      'Ashwagandha — classical male rejuvenation pairing',
      'Shatavari — female reproductive tonic combination',
      'Punarnava — kidney + urinary tonic combination',
    ],
    herb_to_drug_interactions: [
      'Antihypertensives — additive',
      'Diabetes medications — mild additive blood sugar effect',
      'Digoxin — theoretical interaction (case reports)',
    ],
    dosage_range: 'Standardised extract (40-60% saponins): 500-1500 mg/day',
    spiritual_layer:
      'Gokshura is the small thorned fruit that grows where the ground is hard — a plant of resilience and quiet power. She is the tonic of the second chakra, the reproductive waters, the deep kidney reserves. She teaches that vitality is not something to force but to receive, that the reproductive fire and the kidney reserve are two names for the same well.',
    best_preparation: 'Standardised extract for reproductive/urinary use; whole herb decoction traditional',
  },

  // ── Shatavari (already exists, skip) ──
  // ── Ashwagandha (already exists, skip) ──

  // ── Bibhitaki · Terminalia bellerica ──
  'Bibhitaki': {
    tcm_meridians: ['Lung','Large Intestine','Stomach'],
    tcm_element: 'Metal',
    energetics: ['Warm','Astringent','Sweet post-digestive','Kapha-reducing'],
    primary_functions: [
      'Respiratory tonic — traditional first-line for chronic cough, congestion, and mucus',
      'Bowel regulator — one of the three fruits of Triphala; supports elimination without griping',
      'Voice tonic — classical remedy for hoarseness and vocal fatigue',
      'Antioxidant and hepatoprotective',
    ],
    secondary_benefits: [
      'Blood sugar and lipid modulation',
      'Traditional use in eye and skin conditions',
      'Mild antimicrobial',
    ],
    pharmacology:
      'Tannins (chebulinic acid, gallic acid, ellagic acid), lignans, sterols, flavonoids. Antioxidant capacity comparable to Amla and Haritaki (the other Triphala fruits). Hepatoprotective in CCl4 models; hypolipidemic in animal studies.',
    flavor_profile: 'Astringent, sweet-bitter, dry',
    contraindications: [
      'Pregnancy — caution; not recommended alone',
      'Diarrhoea (acute) — astringent may not be appropriate depending on cause',
      'Low body weight / vata excess — cyclical use only',
    ],
    herb_to_herb_synergy: [
      'Amla + Haritaki (Triphala) — the classical three-fruit synergy',
      'Ginger — for respiratory congestion',
      'Licorice — voice and respiratory tonic pairing',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — additive blood sugar effect',
      'Anticoagulants — mild theoretical (tannin content)',
    ],
    dosage_range: 'Powder: 1-3 g/day. As part of Triphala: 3-6 g/day of the compound.',
    spiritual_layer:
      'Bibhitaki is the fearless one — the fruit whose name means "the destroyer of fear". She clears the passages of body and voice so that expression can flow. She teaches that what is stuck in the lungs and gut is often unspoken, and that regularity of elimination is a kind of daily honesty.',
    best_preparation: 'As part of Triphala churna, or standardised extract for respiratory use',
  },

  // ── Shankhpushpi · Convolvulus pluricaulis ──
  'Shankhpushpi': {
    tcm_meridians: ['Heart','Liver','Kidney'],
    tcm_element: 'Fire + Water',
    energetics: ['Cool','Bitter','Sweet','Medhya rasayana — mind rejuvenative'],
    primary_functions: [
      'Medhya rasayana — the primary Ayurvedic herb for memory, learning, and mental clarity',
      'Anxiolytic and mildly sedating — settles a racing mind without heavy sedation',
      'Neuroprotective — supports acetylcholine, protects against oxidative brain damage',
      'Cardiovascular support via mild BP lowering and stress reduction',
    ],
    secondary_benefits: [
      'Sleep support in anxiety-driven insomnia',
      'Antioxidant across neural tissue',
      'Traditional in epilepsy protocols',
    ],
    pharmacology:
      'Alkaloids (shankhapushpine, convoline, subhirsine), flavonoids, glycosides. Cholinergic modulation supports acetylcholine availability; anxiolytic action via GABA-adjacent pathways. Preclinical models show improved learning + memory + neuroprotection.',
    flavor_profile: 'Slightly bitter, sweet, cool',
    contraindications: [
      'Concurrent sedatives — additive CNS depression',
      'Pregnancy — insufficient data; avoid',
      'Hypotension — mild BP lowering',
    ],
    herb_to_herb_synergy: [
      'Bacopa — combined memory + learning classical Ayurvedic pairing',
      'Gotu Kola — brain-blood tonic amplification',
      'Ashwagandha — anxiety + memory pairing for burnout',
    ],
    herb_to_drug_interactions: [
      'CNS depressants — additive',
      'Antihypertensives — mild additive',
      'Thyroid medications — theoretical interaction (some evidence of TSH modulation)',
    ],
    dosage_range: 'Powder: 3-6 g/day. Extract: 500-1000 mg/day.',
    spiritual_layer:
      'Shankhpushpi is the conch-flower — the plant whose blossom curves like the sacred conch, the shape of primordial sound. She is the herb of Saraswati, goddess of learning and speech. She teaches that memory is not accumulation but attunement, and that clear thinking begins with a settled heart.',
    best_preparation: 'Fresh whole-plant juice or standardised extract',
  },

  // ── Nirgundi · Vitex negundo ──
  'Nirgundi': {
    tcm_meridians: ['Lung','Liver'],
    tcm_element: 'Wood + Metal',
    energetics: ['Warm','Bitter','Pungent','Astringent'],
    primary_functions: [
      'Analgesic and anti-inflammatory — traditional first-line for joint pain, sciatica, and neuralgia',
      'Respiratory decongestant — supports asthma and chronic bronchitis',
      'Antimicrobial and vulnerary — traditional wound and skin use',
      'Insect-repellent (topical)',
    ],
    secondary_benefits: [
      'Traditional support in fever and headache',
      'Anti-parasitic',
      'Nervine — mild calming action',
    ],
    pharmacology:
      'Iridoid glycosides (agnuside, negundoside), flavonoids (vitexin, isovitexin), essential oil (viridiflorol, sabinene, eucalyptol). Anti-inflammatory via COX-2 modulation and prostaglandin reduction; analgesic effects comparable to low-dose NSAIDs in some models.',
    flavor_profile: 'Bitter, pungent, warming — aromatic',
    contraindications: [
      'Pregnancy — traditional emmenagogue; avoid',
      'GI sensitivity',
      'Concurrent NSAIDs — additive',
    ],
    herb_to_herb_synergy: [
      'Shallaki (Boswellia) — powerful joint pain combination',
      'Turmeric — anti-inflammatory synergy',
      'Guggulu — chronic arthritis triple combination',
    ],
    herb_to_drug_interactions: [
      'NSAIDs — additive anti-inflammatory',
      'Anticoagulants — mild theoretical',
    ],
    dosage_range: 'Powder: 3-6 g/day. Oil (topical): as needed for pain.',
    spiritual_layer:
      'Nirgundi is the pain-remover — a plant of the crossroads that grows where soil is disturbed. She teaches that pain is not the enemy but the body\'s messenger, and that easing it well means listening first, muting second.',
    best_preparation: 'Fresh leaf poultice (topical) or dried leaf decoction (internal)',
  },

  // ── Ashoka · Saraca asoca ──
  'Ashoka': {
    tcm_meridians: ['Liver','Uterus','Spleen'],
    tcm_element: 'Wood',
    energetics: ['Cool','Astringent','Bitter','Pitta-reducing'],
    primary_functions: [
      'Women\'s tonic — the primary Ayurvedic herb for uterine health',
      'Menorrhagia — reduces heavy menstrual bleeding via astringent + uterine tonic action',
      'Dysmenorrhoea — reduces cramping in painful periods',
      'Traditional support for fibroids and endometrial concerns (adjunctive)',
    ],
    secondary_benefits: [
      'Astringent for chronic diarrhoea',
      'Traditional support in leucorrhoea',
      'Mild antioxidant',
    ],
    pharmacology:
      'Tannins (very high — provides astringent action), sterols, glycosides, flavonoids. Estrogen-modulatory effect documented (mild). Uterine stimulant-tonic action — increases uterine muscle tone while paradoxically reducing spasmodic pain.',
    flavor_profile: 'Astringent dominant, mild bitter',
    contraindications: [
      'Pregnancy — avoid (uterine stimulant, potential abortifacient)',
      'Hormone-sensitive conditions — cautious use given estrogen modulation',
      'Post-menopausal bleeding — investigate cause first',
    ],
    herb_to_herb_synergy: [
      'Shatavari — classical female reproductive tonic combination',
      'Lodhra — combined astringent + uterine tonic',
      'Manjistha — combined blood + uterine support',
    ],
    herb_to_drug_interactions: [
      'Hormonal contraceptives — theoretical interaction',
      'Hormone replacement therapy — cautious',
      'Anticoagulants — mild theoretical (tannin content)',
    ],
    dosage_range: 'Bark powder: 3-6 g/day. Extract: 500-1000 mg/day.',
    spiritual_layer:
      'Ashoka is the tree without sorrow — under whose canopy the Buddha was born, and whose name means "without grief". She is the deep uterine tonic that holds the womb in wisdom rather than reactivity. She teaches that women\'s bleeding is a monthly conversation with the ancestors, and that a well-toned uterus is a listening organ, not just a holding one.',
    best_preparation: 'Bark decoction or standardised extract; often in polyherbal women\'s tonics',
  },

  // ── Bakuchi · Psoralea corylifolia ──
  'Bakuchi': {
    tcm_meridians: ['Kidney','Liver','Skin'],
    tcm_element: 'Fire',
    energetics: ['Warm','Bitter','Pungent'],
    primary_functions: [
      'Vitiligo and hypopigmented skin conditions — the classical Ayurvedic herb for repigmentation (topical + carefully-supervised oral)',
      'Psoralen-mediated photosensitisation — clinical PUVA precursor',
      'Bone density support (traditional and modern research)',
      'Antimicrobial',
    ],
    secondary_benefits: [
      'Traditional use in leprosy protocols',
      'Skin infections (topical)',
      'Aphrodisiac (traditional; low-quality evidence)',
    ],
    pharmacology:
      'Psoralen and isopsoralen (furanocoumarins) — photosensitisers used in modern PUVA therapy. Bakuchiol (meroterpene) — the more clinically validated component, anti-inflammatory, retinol-alternative for skin without the irritation. Bavachalcone and neobavaisoflavone contribute to bone effects (osteoblast stimulation, osteoclast inhibition).',
    flavor_profile: 'Bitter, pungent, warming',
    contraindications: [
      'HEPATOTOXICITY WARNING — oral use has been associated with acute liver failure in some case reports; use ONLY under practitioner supervision',
      'Pregnancy and breastfeeding — absolute contraindication',
      'Photosensitivity — sun exposure precautions mandatory',
      'Liver disease — absolute contraindication',
      'Children — avoid',
      'Not for casual use — one of the more serious herbs on the Ayurvedic list',
    ],
    herb_to_herb_synergy: [
      'Traditionally combined with Manjistha and Neem in skin protocols under supervision',
      'Bakuchiol (isolated) pairs well with topical vitamin C for skin',
    ],
    herb_to_drug_interactions: [
      'Hepatotoxic drugs — dangerous additive',
      'Photosensitising drugs (tetracyclines, isotretinoin, etc.) — additive photosensitivity',
      'CYP3A4 substrates — potent inhibition',
    ],
    dosage_range: 'Practitioner supervision only. Topical bakuchiol (0.5-1%) is the safer form.',
    spiritual_layer:
      'Bakuchi is the sun-answerer — the herb that speaks with light to return colour to skin that has forgotten. She is fierce medicine and demands respect: photosensitising, hepatotoxic at wrong doses, but genuinely transformative in trained hands.',
    best_preparation: 'Topical bakuchiol extract; internal use practitioner-supervised only',
  },

  // ── Hadjod · Cissus quadrangularis ──
  'Hadjod': {
    tcm_meridians: ['Kidney','Liver'],
    tcm_element: 'Earth',
    energetics: ['Warm','Bitter','Astringent'],
    primary_functions: [
      'Bone healing — the primary Ayurvedic herb for fractures and connective tissue repair; name means "bone-joiner"',
      'Osteoporosis support — increases bone mineral density',
      'Joint and ligament support post-injury',
      'Wound healing (topical and internal)',
    ],
    secondary_benefits: [
      'Weight management (some evidence for metabolic support)',
      'GI tract protection (anti-ulcer activity documented)',
      'Traditional support in scurvy',
    ],
    pharmacology:
      'Ketosteroids (parallel to anabolic steroids in structure but not effect), triterpenoids, vitamin C, calcium. Fracture-healing action attributed to increased osteoblast activity and calcium mobilisation. Anti-inflammatory via COX modulation.',
    flavor_profile: 'Astringent, bitter, cooling on the palate',
    contraindications: [
      'Pregnancy — insufficient data',
      'Diabetes — may modestly lower blood sugar',
      'Concurrent anticoagulants — mild theoretical',
    ],
    herb_to_herb_synergy: [
      'Guggulu — bone + connective tissue combination',
      'Ashwagandha — bone density + adaptogenic',
      'Shallaki — connective tissue anti-inflammatory pairing',
    ],
    herb_to_drug_interactions: [
      'Diabetes medications — mild additive',
      'Corticosteroids — theoretical bone-support countering',
    ],
    dosage_range: 'Powder: 500-1500 mg/day. Extract: 300-1000 mg/day.',
    spiritual_layer:
      'Hadjod is the bone-mender — the vine whose square, jointed stems mimic the very structure they heal. She teaches that skeletal integrity is the deepest scaffold of trust, that the body can rebuild what it has broken with patient support.',
    best_preparation: 'Fresh stem juice, dried powder, or standardised extract',
  },

  // ── Rasna · Alpinia galanga ──
  'Rasna': {
    tcm_meridians: ['Liver','Kidney'], tcm_element: 'Wood',
    energetics: ['Warm','Bitter','Pungent','Vata reducing'],
    primary_functions: [
      'Analgesic and anti-inflammatory for chronic joint pain and neuralgia — classical rheumatoid arthritis and sciatica herb',
      'Antimicrobial and anti-spasmodic for respiratory and digestive complaints',
      'Neuroprotective in early animal models',
    ],
    secondary_benefits: ['Mild diaphoretic for fever protocols','Traditional support in gout'],
    pharmacology: 'Essential oil (galangal-adjacent — cineole, α-fenchyl acetate, methyl cinnamate). Anti-inflammatory via COX modulation; antimicrobial via membrane disruption.',
    flavor_profile: 'Bitter, pungent, warming',
    contraindications: ['Pregnancy — avoid','Peptic ulcer — cautious','High-pitta constitutions'],
    herb_to_herb_synergy: ['Shallaki — combined joint pain','Guggulu — chronic inflammatory conditions','Nirgundi — synergistic analgesic'],
    herb_to_drug_interactions: ['NSAIDs — additive','Anticoagulants — mild theoretical'],
    dosage_range: 'Powder: 3-6 g/day. Decoction traditional.',
    spiritual_layer: 'Rasna moves stuck pain in stubborn joints — a warming rhizome that reaches deep to disturb chronic patterns.',
    best_preparation: 'Root decoction or in polyherbal joint formulas',
  },

  // ── Vijaysar · Pterocarpus marsupium ──
  'Vijaysar': {
    tcm_meridians: ['Spleen','Stomach','Kidney'], tcm_element: 'Earth',
    energetics: ['Cool','Bitter','Astringent','Kapha-Pitta reducing'],
    primary_functions: [
      'Blood sugar reduction — the primary Ayurvedic anti-diabetic; regenerative for pancreatic beta cells (animal evidence)',
      'Lipid modulation — reduces total cholesterol and triglycerides',
      'Traditional insulin-sensitising action',
    ],
    secondary_benefits: ['Weight management adjunct','Traditional use in skin conditions','Astringent for chronic diarrhoea'],
    pharmacology: 'Pterostilbene (a resveratrol analog, stronger bioavailability), marsupsin, pterosupin. Beta-cell regeneration documented in animal models; multiple small clinical trials support blood sugar reduction.',
    flavor_profile: 'Astringent, mildly bitter, cooling',
    contraindications: ['Hypoglycaemia — monitor blood sugar','Concurrent insulin/oral hypoglycaemics — dose-adjust'],
    herb_to_herb_synergy: ['Guduchi — combined immune + blood sugar','Turmeric — anti-inflammatory + insulin-sensitising','Amla — antioxidant + blood sugar pairing'],
    herb_to_drug_interactions: ['Insulin, sulfonylureas, metformin — additive hypoglycaemic effect'],
    dosage_range: 'Wood powder: 3-6 g/day. Standardised extract: 250-500 mg/day. Traditional: wooden cup infused with water overnight.',
    spiritual_layer: 'Vijaysar is the wood that gives its medicine to water — the traditional cup that turns morning water into a blood-sugar tonic while you sleep. She teaches patience: some medicines work through slow overnight extraction.',
    best_preparation: 'Traditional wooden cup infusion, or standardised heartwood extract',
  },

  // ── Lodhra · Symplocos racemosa ──
  'Lodhra': {
    tcm_meridians: ['Liver','Uterus','Spleen'], tcm_element: 'Wood',
    energetics: ['Cool','Astringent','Bitter','Kapha-Pitta reducing'],
    primary_functions: [
      'Uterine astringent and haemostatic — reduces heavy menstrual bleeding',
      'Traditional support in leucorrhoea, dysmenorrhoea, PCOS',
      'Astringent for chronic diarrhoea and eye conditions (topical)',
    ],
    secondary_benefits: ['Mild wound healing (topical)','Traditional support in obesity (Kapha reduction)','Anti-microbial for oral use'],
    pharmacology: 'Alkaloids (loturine, colloturine, loturidine), tannins, triterpenes. Estrogen-modulatory action. Astringent + mild uterine tonic effect similar to Ashoka but with more skin/mucous membrane specificity.',
    flavor_profile: 'Astringent dominant, mildly bitter',
    contraindications: ['Pregnancy — avoid','Constipation — high tannin content can worsen','Hormone-sensitive conditions — cautious use'],
    herb_to_herb_synergy: ['Ashoka — combined uterine tonic','Manjistha — women\'s + blood cleaning','Amla — astringent + antioxidant'],
    herb_to_drug_interactions: ['Hormonal contraceptives — theoretical','Iron supplements — tannin binding reduces absorption'],
    dosage_range: 'Bark powder: 3-6 g/day. Extract: 500-1000 mg/day.',
    spiritual_layer: 'Lodhra is the astringent mother — the herb that holds what has been leaking too long, whether blood or tears. She teaches that structure and tone are as feminine as flow.',
    best_preparation: 'Bark decoction or in polyherbal women\'s formulas',
  },

  // ── Khadira · Acacia catechu ──
  'Khadira': {
    tcm_meridians: ['Skin','Large Intestine','Lung'], tcm_element: 'Metal',
    energetics: ['Cool','Bitter','Astringent','Kapha-Pitta reducing'],
    primary_functions: [
      'Skin and oral cavity antimicrobial — classical for chronic skin conditions, aphthous ulcers, gingivitis',
      'Blood cleaner (rakta-shodhak) for chronic skin issues',
      'Astringent for chronic diarrhoea and haemorrhage',
    ],
    secondary_benefits: ['Traditional support in diabetes','Anti-inflammatory','Dental — traditional tooth-strengthening'],
    pharmacology: 'Catechin and epicatechin (major polyphenols — same class as green tea), tannins, quercetin. Broad antimicrobial activity; strong astringent via tannin content.',
    flavor_profile: 'Intensely astringent, bitter',
    contraindications: ['Constipation — tannin content','Iron supplements — reduces absorption','Pregnancy — traditional caution'],
    herb_to_herb_synergy: ['Neem — powerful skin + antimicrobial combination','Manjistha — blood cleaning pair','Turmeric — anti-inflammatory + antimicrobial'],
    herb_to_drug_interactions: ['Iron supplements — reduce absorption','Anticoagulants — mild theoretical'],
    dosage_range: 'Powder: 1-3 g/day. Traditional: as gum tablets for oral use.',
    spiritual_layer: 'Khadira is the astringent healer of surfaces — skin and mouth and the interface between inside and outside. She teaches that boundaries can be tightened without being closed.',
    best_preparation: 'Extract of heartwood, or traditional catechu gum',
  },

  // ── Nishoth · Operculina turpethum ──
  'Nishoth': {
    tcm_meridians: ['Large Intestine','Liver'], tcm_element: 'Metal',
    energetics: ['Hot','Bitter','Pungent','Purgative — strong scraping action'],
    primary_functions: [
      'Purgative — the classical Ayurvedic virechana (therapeutic purgation) herb; strong bowel-moving',
      'Traditional detoxification protocol component',
      'Chronic skin conditions (via elimination pathway)',
      'Traditional support in obesity, chronic joint conditions',
    ],
    secondary_benefits: ['Anti-inflammatory','Traditional support in ascites'],
    pharmacology: 'Turpethin (glycoside), operculinin — potent purgatives that stimulate intestinal peristalsis and fluid secretion. NOT a herb for casual use — traditional protocols always pair with buffering herbs (ginger, licorice).',
    flavor_profile: 'Intensely bitter, pungent',
    contraindications: ['Pregnancy — absolute; abortifacient','Dehydration','GI disease (colitis, ulcers, IBD)','Children','Elderly / debility','Not for daily use — practitioner-supervised protocol only'],
    herb_to_herb_synergy: ['Traditionally paired with Triphala and ginger in virechana formulas','Licorice — buffers harshness'],
    herb_to_drug_interactions: ['Diuretics — dangerous fluid loss','Laxatives — additive','Digoxin — electrolyte disturbance risk'],
    dosage_range: 'PRACTITIONER SUPERVISION ONLY. Traditional: 1-3 g in polyherbal virechana formulas.',
    spiritual_layer: 'Nishoth is the fierce purifier — traditional virechana that clears what stubborn detoxes cannot reach. Never a casual herb.',
    best_preparation: 'Only in traditional polyherbal panchakarma formulas under practitioner supervision',
  },

  // ── Ajwan (celery seed / Trachyspermum in Ayurveda) — using Trachyspermum ammi ──
  'Ajwan': {
    tcm_meridians: ['Stomach','Spleen','Lung'], tcm_element: 'Metal + Earth',
    energetics: ['Hot','Pungent','Bitter'],
    primary_functions: [
      'Digestive fire (agni) support — the classical Ayurvedic bloating and gas remedy',
      'Antimicrobial and antispasmodic for GI complaints',
      'Respiratory decongestant',
      'Traditional support for period cramps',
    ],
    secondary_benefits: ['Traditional galactagogue','Anti-parasitic','Mild antihypertensive at high doses'],
    pharmacology: 'Thymol (essential oil, main antimicrobial), carvacrol, p-cymene, γ-terpinene. Thymol has strong antibacterial and antifungal activity; carminative via smooth muscle relaxation.',
    flavor_profile: 'Sharply pungent, thyme-like, warming',
    contraindications: ['Peptic ulcer — cautious','Pregnancy — traditional caution at high doses','GI sensitivity — dose down'],
    herb_to_herb_synergy: ['Ginger — combined digestive fire','Fennel — carminative pair','Cumin — classical digestive triple'],
    herb_to_drug_interactions: ['Anticoagulants — mild antiplatelet','Antihypertensives — mild additive'],
    dosage_range: 'Seed: 1-3 g/day. Oil: use with caution, drops in carrier.',
    spiritual_layer: 'Ajwan is the sharp digestive spark — the seed that wakes up a sluggish belly with its thymol-driven fire.',
    best_preparation: 'Ground seed or seed decoction; chewed with rock salt traditionally',
  },

  // ── Anantmul · Hemidesmus indicus ──
  'Anantmul': {
    tcm_meridians: ['Liver','Kidney','Blood'], tcm_element: 'Water + Wood',
    energetics: ['Cool','Sweet','Bitter','Pitta reducing'],
    primary_functions: [
      'Blood cooler and rakta-shodhak — traditional first-line for hot blood conditions',
      'Chronic skin conditions with heat signs — eczema, psoriasis, urticaria',
      'Traditional support in syphilis and chronic infections (raktapitta)',
      'Alterative — slow tissue-clearing action',
    ],
    secondary_benefits: ['Mild diuretic','Traditional galactagogue','Cooling antioxidant'],
    pharmacology: 'Hemidesmine, indicine, coumarins, saponins. Anti-inflammatory and mild antioxidant. Traditional cooling action via bitter and sweet post-digestive taste.',
    flavor_profile: 'Sweet with bitter undertone, cooling, faintly vanilla-like',
    contraindications: ['Cold constitutions — cooling can aggravate','Pregnancy — insufficient data'],
    herb_to_herb_synergy: ['Manjistha — combined blood cleaning','Neem — powerful hot-blood + skin pair','Sarsaparilla (Western analog) — combined blood-cooler'],
    herb_to_drug_interactions: ['Immunosuppressants — theoretical'],
    dosage_range: 'Root powder: 3-6 g/day. Decoction traditional.',
    spiritual_layer: 'Anantmul is the sweet cooling root — the vanilla-scented blood-cleaner for a system running hot. She teaches that gentle sweetness is a form of medicine, that cooling can be nourishing.',
    best_preparation: 'Root decoction or in cooling polyherbal formulas',
  },

  // ── Karanja · Pongamia pinnata ──
  'Karanja': {
    tcm_meridians: ['Skin','Liver','Large Intestine'], tcm_element: 'Metal + Wood',
    energetics: ['Warm','Bitter','Pungent','Kapha reducing'],
    primary_functions: [
      'Topical antimicrobial for skin conditions — chronic wounds, dermatitis, scabies',
      'Traditional wound cleaning via antibacterial oil',
      'Anti-parasitic (topical)',
    ],
    secondary_benefits: ['Traditional support in respiratory infections','Anti-inflammatory','Anti-diabetic (traditional and emerging evidence)'],
    pharmacology: 'Karanjin, pongamol (furanoflavones), oil rich in oleic acid. Karanjin has documented antimicrobial + anti-inflammatory activity. Not typically used internally — topical/oil applications are the norm.',
    flavor_profile: 'Bitter, pungent — oil is intensely bitter',
    contraindications: ['Pregnancy — internal use avoided','Not for internal use except under practitioner supervision','GI sensitivity if taken internally'],
    herb_to_herb_synergy: ['Neem — powerful topical antimicrobial combination','Turmeric — wound-healing pairing','Manjistha — combined skin + blood cleaning'],
    herb_to_drug_interactions: ['Topical antimicrobials — additive'],
    dosage_range: 'Topical oil primarily. Internal use practitioner-supervised.',
    spiritual_layer: 'Karanja is the bitter oil of skin renewal — the topical antimicrobial for wounds that would not close, the healer that stays outside.',
    best_preparation: 'Karanja oil (topical) or fresh leaf poultice',
  },

  // ── Bael · Aegle marmelos ──
  'Bael': {
    tcm_meridians: ['Large Intestine','Stomach','Spleen'], tcm_element: 'Earth',
    energetics: ['Warm','Astringent','Sweet','Bitter','Vata-Kapha reducing'],
    primary_functions: [
      'Chronic diarrhoea and dysentery — the classical Ayurvedic astringent gut healer; especially unripe fruit',
      'IBS and inflammatory bowel — reduces intestinal inflammation and stabilises',
      'Traditional support in diabetes (leaves)',
      'Antimicrobial for GI pathogens',
    ],
    secondary_benefits: ['Cardiovascular support (leaves)','Traditional galactagogue','Mild anthelmintic'],
    pharmacology: 'Marmelosin (coumarin), aegelin, umbelliferone, tannins. Anti-diarrhoeal via astringent tannins + smooth-muscle antispasmodic action. Marmelosin has documented antimicrobial activity against common GI pathogens.',
    flavor_profile: 'Astringent-sweet in unripe form; sweet-sour ripe',
    contraindications: ['Constipation — unripe form worsens','Pregnancy — caution with unripe fruit and leaves'],
    herb_to_herb_synergy: ['Kutaja (Holarrhena) — combined chronic diarrhoea','Amla — astringent + antioxidant pair','Guduchi — GI + immune combination'],
    herb_to_drug_interactions: ['Diabetes medications — mild additive (leaves)','Anticoagulants — mild theoretical'],
    dosage_range: 'Unripe fruit powder: 3-6 g/day. Fresh pulp: as needed for GI symptoms.',
    spiritual_layer: 'Bael is the sacred fruit of Shiva — a hard shell holding sweet pulp, the astringent that holds the belly together when it has been dissolving. She teaches that binding is a form of medicine when things have been flowing out too fast.',
    best_preparation: 'Unripe fruit powder or ripe fruit pulp depending on indication',
  },

  // ── Chandrashoor · Lepidium sativum (garden cress) ──
  'Chandrashoor': {
    tcm_meridians: ['Kidney','Spleen','Bone'], tcm_element: 'Earth + Water',
    energetics: ['Warm','Pungent','Bitter'],
    primary_functions: [
      'Traditional bone-healing herb — rich in calcium and folate',
      'Galactagogue — traditional support for lactation',
      'Anti-inflammatory for chronic joint conditions',
      'Traditional support in respiratory conditions',
    ],
    secondary_benefits: ['Mineral-rich food-herb — iron, calcium, folate','Mild anti-parasitic','Traditional support in cardiac oedema'],
    pharmacology: 'High in vitamin K, C, E, calcium, iron, folate. Glucosinolates (as with other Brassicas). Anti-inflammatory via COX-2 modulation.',
    flavor_profile: 'Pungent, mildly bitter — mustard-family character',
    contraindications: ['Hypothyroid — Brassica-family goitrogenic potential','Pregnancy — high doses avoided','Diuretics — mild additive'],
    herb_to_herb_synergy: ['Hadjod — bone healing combination','Ashwagandha — bone density + adaptogenic','Sesame seeds — calcium + bone-support pairing'],
    herb_to_drug_interactions: ['Anticoagulants — vitamin K interaction','Thyroid medications — cautious'],
    dosage_range: 'Seeds soaked: 1 tsp/day. Powder: 1-3 g/day.',
    spiritual_layer: 'Chandrashoor is the mineral-rich moon-seed — a small pungent herb that carries the bone-building intelligence of the earth. She teaches that some medicines are foods, and that mineral density is a form of ancestor.',
    best_preparation: 'Seeds soaked in water or milk; sprouted greens as food',
  },

  // ── Amaltas · Cassia fistula ──
  'Amaltas': {
    tcm_meridians: ['Large Intestine','Liver'], tcm_element: 'Earth',
    energetics: ['Cool','Sweet','Bitter','Mild laxative — Vata-Pitta reducing'],
    primary_functions: [
      'Gentle laxative — the classical Ayurvedic sneha-virechana for constipation, safer than harsh purgatives',
      'Traditional support in chronic skin conditions (via elimination)',
      'Mild anti-inflammatory for joint pain',
      'Traditional use in fever protocols',
    ],
    secondary_benefits: ['Wound healing (topical)','Mild antimicrobial','Traditional support in diabetes'],
    pharmacology: 'Anthraquinone glycosides (rhein, sennoside — same family as senna but gentler), fistulic acid, mucilage. Osmotic + gentle stimulant laxative action; less griping than senna due to mucilage buffering.',
    flavor_profile: 'Sweet with bitter undertone, cool',
    contraindications: ['Pregnancy — caution','Chronic constipation — not for long-term daily use (dependency risk)','GI inflammatory conditions'],
    herb_to_herb_synergy: ['Triphala — combined bowel regulation','Licorice — mucilage support for GI','Ginger — buffers cool nature'],
    herb_to_drug_interactions: ['Diuretics — electrolyte disturbance risk','Digoxin — potassium loss risk','Laxatives — additive'],
    dosage_range: 'Fruit pulp: 3-6 g/day for occasional constipation. Not for daily long-term use.',
    spiritual_layer: 'Amaltas is the golden-shower tree — the yellow-flowered gentle laxative for a body that has forgotten how to let go. She teaches that softness can be the most direct medicine, that not every constipation needs a purgative.',
    best_preparation: 'Fruit pulp decoction; often combined with Triphala',
  },

  // ── Coleus / Gandira · Coleus forskohlii ──
  'Gandira': {
    tcm_meridians: ['Heart','Lung','Kidney'],
    tcm_element: 'Fire',
    energetics: ['Warm','Pungent','Bitter'],
    primary_functions: [
      'Adenylate cyclase activator via forskolin — raises intracellular cAMP; broad cardiovascular, metabolic, and pulmonary applications',
      'Vasodilator and antihypertensive — direct smooth muscle relaxation',
      'Bronchodilator — traditional and clinical use in asthma',
      'Weight management support — increases lipolysis via cAMP pathway (moderate evidence)',
    ],
    secondary_benefits: [
      'Glaucoma support (topical, traditional and modern)',
      'Thyroid function support (mild TSH modulation)',
      'Traditional support for skin conditions',
    ],
    pharmacology:
      'Forskolin (a labdane diterpene) is the primary bioactive — one of the few natural compounds that directly activates adenylate cyclase, raising cyclic AMP across cell types. Downstream effects: smooth muscle relaxation (vasodilation, bronchodilation), lipolysis, thyroid function, gastric acid modulation. Standardised extracts (10-20% forskolin) are the research form.',
    flavor_profile: 'Pungent, mildly bitter, warming',
    contraindications: [
      'Hypotension — additive with antihypertensives',
      'Bleeding disorders and pre-surgery — inhibits platelet aggregation',
      'Peptic ulcer — increases gastric acid',
      'Pregnancy — insufficient data',
    ],
    herb_to_herb_synergy: [
      'Arjuna — combined cardiovascular support',
      'Turmeric — anti-inflammatory + circulatory pairing',
      'Ashwagandha — thyroid + adaptogenic combination for hypothyroid presentations',
    ],
    herb_to_drug_interactions: [
      'Antihypertensives — additive',
      'Anticoagulants and antiplatelets — additive',
      'Antacids and H2-blockers — counteracts (increases acid)',
      'Thyroid medications — modulates thyroid function',
    ],
    dosage_range: 'Standardised extract (10% forskolin): 100-250 mg twice daily',
    spiritual_layer:
      'Coleus is the vasodilator — a plant of the coastal cliffs that teaches expansion. She is the smooth-muscle release for a body that has held everything too tight. She teaches that opening the vessels is often opening the story, that constriction is a habit as much as a physiology.',
    best_preparation: 'Standardised root extract; not the ornamental Coleus (different species)',
  },
};

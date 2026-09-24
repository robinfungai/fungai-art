// src/server/myco/vocabulary.cjs
//
// MYCO's DOMAIN VOCABULARY. This file is data, not logic — it is meant to
// be edited by hand as the corpus grows. The matching machinery that reads
// it lives in terminology.cjs.
//
// Three tables, three different jobs:
//
//   EQUIVALENT   things that are the same thing under different names.
//                Symmetric: any member in the question pulls in all the
//                others. "lingzhi" and "Ganoderma" are Reishi.
//
//   IMPLIES      one-way. The question's word is narrower, vaguer or more
//                colloquial than the corpus's word, so we widen it —
//                but not the other way round, because widening in reverse
//                would fire on half the corpus. "blood thinner" should
//                reach warfarin; "warfarin" should not drag in every
//                mention of clotting.
//
//   MISSPELLINGS what a person types → what they meant.
//
// ── WHO READS MISSPELLINGS ────────────────────────────────────────
// Two callers, with different needs, and the difference explains why this
// table is longer than it looks like it should be.
//
//   MYCO has the whole knowledge base to correct against, so bounded edit
//   distance already catches most single-slip typos without a line here.
//   What it needs from this table is the cases distance cannot reach: two
//   or more errors ("ashwaghanda"), a wrong shape ("shisandra"), or a
//   plausible word that would be corrected to the WRONG neighbour.
//
//   THE FORMULA ENGINE has no corpus. scoring.js scores the quiz's notes
//   field by substring match against a fixed keyword list, so it gets this
//   table and nothing else — deliberately, because a fuzzy guess there
//   changes which herbs go in a bottle rather than which paragraph ranks
//   third. For the engine, even a one-letter typo needs a line ("stres").
//
// So an entry earns its place if EITHER caller needs it. What is never
// justified is an entry whose key and value are the same word after
// stemming — "nootropics → nootropic" is a plural, not a misspelling, and
// `npm run test:myco-terminology` fails on those.
//
// ── THE DEAD-TERM RULE ────────────────────────────────────────────
// Every term below is checked against the actual corpus vocabulary when
// the lexicon is built. A term that appears nowhere in the knowledge base
// is DEAD: it can never match, so it is dropped and reported by
// `npm run test:myco-terminology`. That is how this file avoids rotting
// into a wishlist. A dead term is not a bug — it is either a typo here,
// or knowledge we have not written yet.

// ── 1 · Same thing, different name ───────────────────────────────
// Common name ↔ genus ↔ pinyin ↔ trade name. Entity aliases already
// carry each herb's own display name and full binomial (see
// build-myco-kb.cjs), so what earns a line here is the vocabulary a
// person brings that our own records do not use.
const EQUIVALENT = [
  // Fungi
  ['reishi', 'lingzhi', 'ling zhi', 'mannentake', 'ganoderma'],
  ['lions mane', 'hericium', 'erinaceus', 'yamabushitake', 'monkey head mushroom'],
  ['turkey tail', 'trametes', 'coriolus', 'versicolor', 'yun zhi'],
  ['chaga', 'inonotus', 'obliquus', 'birch conk'],
  ['cordyceps', 'ophiocordyceps', 'militaris', 'dong chong xia cao', 'caterpillar fungus'],
  ['maitake', 'grifola', 'frondosa', 'hen of the woods'],
  ['shiitake', 'lentinula', 'lentinus', 'edodes', 'xiang gu'],
  ['tremella', 'fuciformis', 'snow fungus', 'silver ear'],
  ['fu ling', 'poria', 'hoelen'],
  ['zhu ling', 'polyporus', 'umbellatus'],
  ['agaricus', 'royal sun mushroom', 'blazei', 'himematsutake'],
  ['amanita', 'muscaria', 'fly agaric'],
  ['tinder fungus', 'fomes', 'fomentarius', 'amadou', 'horse hoof fungus'],
  ['birch polypore', 'fomitopsis', 'betulina', 'piptoporus'],

  // Adaptogens and nervines
  ['ashwagandha', 'withania', 'somnifera', 'indian ginseng', 'winter cherry'],
  ['rhodiola', 'golden root', 'arctic root', 'roseroot'],
  ['eleuthero', 'siberian ginseng', 'eleutherococcus', 'senticosus', 'ci wu jia'],
  ['schisandra', 'schizandra', 'wu wei zi'],
  ['holy basil', 'tulsi', 'ocimum', 'sanctum', 'tenuiflorum'],
  ['gotu kola', 'centella', 'asiatica'],
  ['bacopa', 'monnieri', 'water hyssop'],
  ['st johns wort', 'hypericum', 'perforatum', 'sjw'],
  ['lemon balm', 'melissa'],
  ['passionflower', 'passiflora', 'incarnata', 'maypop'],
  ['valerian', 'valeriana'],
  ['kava', 'methysticum', 'awa'],
  ['blue lotus', 'nymphaea', 'caerulea', 'blue water lily'],
  ['damiana', 'turnera', 'diffusa'],
  ['mucuna', 'pruriens', 'velvet bean', 'kapikacchu'],
  ['skullcap', 'scutellaria', 'huang qin'],
  ['oatstraw', 'oat straw', 'avena', 'milky oats'],

  // Tonics, roots, barks
  ['astragalus', 'huang qi', 'membranaceus'],
  ['licorice', 'liquorice', 'glycyrrhiza', 'glycyrrhizin', 'gan cao'],
  ['dan shen', 'miltiorrhiza', 'red sage'],
  ['he shou wu', 'fo ti', 'multiflorum', 'fallopia'],
  ['knotweed', 'cuspidatum', 'hu zhang', 'resveratrol'],
  ['amla', 'amalaki', 'emblica', 'indian gooseberry'],
  ['kalmegh', 'andrographis', 'paniculata'],
  ['milk thistle', 'silybum', 'marianum', 'silymarin'],
  ['saw palmetto', 'serenoa', 'repens'],
  ['nettle', 'urtica', 'dioica', 'stinging nettle'],
  ['maca', 'lepidium', 'meyenii', 'peruvian ginseng'],
  ['cats claw', 'uncaria', 'tomentosa', 'una de gato'],
  ['devils claw', 'harpagophytum', 'procumbens'],
  ['pau darco', 'pau d arco', 'tabebuia', 'handroanthus', 'lapacho', 'taheebo'],
  ['red yeast rice', 'monascus', 'purpureus', 'hong qu'],
  ['thunder god vine', 'tripterygium', 'wilfordii', 'lei gong teng'],
  ['gromwell', 'shikonin', 'lithospermum', 'zi cao'],
  ['ginkgo', 'biloba', 'maidenhair tree'],
  ['echinacea', 'coneflower', 'purpurea'],
  ['elderberry', 'elder', 'sambucus', 'sambucol'],
  ['turmeric', 'curcuma', 'curcumin', 'longa'],
  ['ginger', 'zingiber', 'sheng jiang'],
  ['vitex', 'chaste tree', 'chasteberry', 'agnus castus'],
  ['hops', 'humulus', 'lupulus'],
  ['tongkat ali', 'eurycoma', 'longjack'],
  ['rowan berry', 'sorbus', 'aucuparia', 'mountain ash'],
  ['lingonberry', 'vitis idaea', 'cowberry'],
  ['bilberry', 'myrtillus', 'european blueberry'],
  ['cleavers', 'galium', 'aparine', 'clivers'],

  // Preparation
  ['tincture', 'hydroethanolic', 'hydro ethanolic', 'ethanol extract', 'alcohol extract'],
  ['decoction', 'decoct', 'simmered', 'boiled root'],
  ['infusion', 'tisane', 'steeped'],
  ['maceration', 'macerate', 'cold infusion'],
  ['dual extraction', 'double extraction', 'water and alcohol'],
  ['glycerite', 'glycerin', 'glycerol', 'alcohol free'],
  ['oxymel', 'honey and vinegar'],
  ['succus', 'fresh juice', 'pressed juice'],
  ['menstruum', 'solvent', 'extraction medium'],
  ['abv', 'proof', 'ethanol percentage'],
  ['spagyric', 'alchemical', 'calcination'],
  ['der', 'drug extract ratio', 'extract ratio'],

  // TCM and Ayurveda
  ['qi', 'chi', 'vital energy'],
  ['shen', 'spirit'],
  ['jing', 'essence'],
  ['san jiao', 'triple burner', 'triple warmer'],
  ['damp', 'dampness', 'phlegm'],
  ['meridian', 'channel'],
  ['rasayana', 'rejuvenative'],
  ['ayurveda', 'ayurvedic'],
  // The Ayurvedic Pharmacopoeia layer (see the `ayurveda` block in
  // herbs.ts). These became live terms with the API batch — before it
  // the corpus never used them.
  ['virya', 'potency'],
  ['vipaka', 'post digestive'],
  ['ushna', 'heating'],
  ['shita', 'cooling'],
  ['katu', 'pungent'],
  ['tikta', 'bitter'],
  ['madhura', 'sweet'],
  ['kashaya', 'astringent'],
  ['lavana', 'salty'],
  ['dipana', 'kindles digestive fire'],
  ['pacana', 'digests ama'],
  ['anulomana', 'downward flow'],
  ['krimighna', 'anthelmintic'],
  ['shulahara', 'relieves colic'],
  // NOT listed: 'amla' as the Sanskrit for sour. Amla is also one of our
  // plants (id 523, Amla / Amalaki), and an equivalence from 'amla' to
  // 'sour' would drag every question about the fruit into the taste
  // vocabulary. Sanskrit that collides with a herb name stays out.

  // Pharmacology
  ['beta glucan', 'betaglucan', 'polysaccharide'],
  ['triterpene', 'triterpenoid'],
  ['withanolide', 'withanolides'],
  ['hericenone', 'erinacine'],
  ['cyp', 'cytochrome', 'p450'],
  ['bioavailability', 'absorption'],
  ['ngf', 'nerve growth factor'],
  ['bdnf', 'brain derived neurotrophic factor'],
  ['hpa', 'hypothalamic pituitary adrenal'],
  ['gaba', 'gabaergic'],

  // Drugs, where two names mean one molecule
  ['warfarin', 'coumadin', 'jantoven'],
  ['anaesthesia', 'anesthesia'],
  ['ciclosporin', 'cyclosporine'],
];

// ── 2 · One-way widening ─────────────────────────────────────────
// [trigger, [terms it should also reach]]. The trigger may be a phrase.
// Read each line as "someone asking about X probably wants Y as well" —
// never as "X equals Y".
const IMPLIES = [
  // Colloquial effect language → the words the corpus actually uses
  ['grounding',        ['centering', 'rooted', 'settling', 'earth', 'kidney', 'adaptogen']],
  ['sedating',         ['sedative', 'soporific', 'hypnotic', 'drowsiness']],
  ['sedative',         ['soporific', 'hypnotic', 'drowsiness']],
  ['sleepy',           ['sedative', 'drowsiness', 'hypnotic']],
  ['cant sleep',       ['insomnia', 'sleep onset', 'sedative']],
  ['insomnia',         ['sleep onset', 'sleep latency', 'sedative']],
  ['wired',            ['overstimulated', 'cortisol', 'sympathetic']],
  ['burnout',          ['adrenal', 'hpa', 'cortisol', 'exhaustion', 'adaptogen']],
  ['stressed',         ['stress', 'cortisol', 'adaptogen', 'hpa']],
  ['focus',            ['cognitive', 'nootropic', 'concentration', 'attention']],
  ['brain fog',        ['cognitive', 'clarity', 'nootropic', 'memory']],
  ['nootropic',        ['cognitive', 'memory', 'neuroplasticity']],
  ['anxiety',          ['anxiolytic', 'nervine', 'calming']],
  ['panic',            ['anxiolytic', 'anxiety', 'nervine']],
  ['low mood',         ['mood', 'antidepressant', 'serotonin']],
  ['libido',           ['aphrodisiac', 'sexual', 'desire']],
  ['energy',           ['fatigue', 'vitality', 'stamina', 'atp']],
  ['immune',           ['immunomodulator', 'immunity', 'beta glucan']],
  ['inflammation',     ['anti inflammatory', 'antiinflammatory', 'cytokine']],
  ['detox',            ['liver', 'hepatoprotective', 'hepatic', 'phase ii']],
  ['gut',              ['digestive', 'gastrointestinal', 'microbiome']],
  ['bloating',         ['carminative', 'digestive', 'gas']],
  ['hormones',         ['endocrine', 'hormonal', 'oestrogen', 'estrogen']],
  ['perimenopause',    ['menopause', 'hot flushes', 'hormonal']],
  ['period pain',      ['dysmenorrhoea', 'dysmenorrhea', 'menstrual', 'antispasmodic']],
  ['skin',             ['dermatological', 'collagen', 'topical']],
  ['joints',           ['musculoskeletal', 'cartilage', 'anti inflammatory']],
  ['blood sugar',      ['glycaemic', 'glycemic', 'insulin', 'glucose']],
  ['blood pressure',   ['hypertension', 'hypotensive', 'antihypertensive']],
  ['cholesterol',      ['lipid', 'ldl', 'statin']],

  // Safety language → the clinical vocabulary of the safety chunks
  ['blood thinner',    ['anticoagulant', 'antiplatelet', 'warfarin', 'clotting', 'inr']],
  ['blood thinners',   ['anticoagulant', 'antiplatelet', 'warfarin', 'clotting']],
  ['antidepressant',   ['ssri', 'serotonin', 'serotonergic', 'maoi']],
  ['ssri',             ['serotonin', 'serotonergic', 'sertraline', 'fluoxetine']],
  ['maoi',             ['monoamine oxidase', 'tyramine']],
  ['benzo',            ['benzodiazepine', 'gaba', 'sedative']],
  ['benzos',           ['benzodiazepine', 'gaba', 'sedative']],
  ['sleeping pill',    ['benzodiazepine', 'hypnotic', 'sedative']],
  ['statin',           ['cholesterol', 'lipid', 'rhabdomyolysis']],
  ['the pill',         ['contraceptive', 'oral contraceptive', 'oestrogen', 'estrogen']],
  ['birth control',    ['contraceptive', 'oral contraceptive', 'oestrogen', 'estrogen']],
  ['thyroid meds',     ['levothyroxine', 'thyroid', 'tsh']],
  ['diabetes',         ['insulin', 'metformin', 'glycaemic', 'glycemic', 'hypoglycaemia']],
  ['diabetic',         ['insulin', 'metformin', 'glycaemic', 'glycemic']],
  ['transplant',       ['immunosuppressant', 'ciclosporin', 'tacrolimus']],
  ['chemo',            ['chemotherapy', 'oncology', 'cytotoxic']],
  ['surgery',          ['perioperative', 'anaesthesia', 'anesthesia', 'bleeding']],
  ['expecting',        ['pregnancy', 'pregnant', 'gestation']],
  ['trying to conceive', ['fertility', 'conception', 'pregnancy']],
  ['nursing',          ['breastfeeding', 'lactation']],
  ['breastfeeding',    ['lactation']],
  ['kids',             ['children', 'paediatric', 'pediatric', 'adolescent']],
  ['teenager',         ['adolescent', 'children', 'paediatric', 'pediatric']],
  ['elderly',          ['geriatric', 'older adults']],
  ['driving',          ['sedation', 'drowsiness', 'psychomotor']],
  ['alcohol',          ['ethanol', 'hepatic', 'cns depressant']],

  // Provenance and ecology — the /atlas gap. Habitat is not a field in
  // herbs.ts yet (38% coverage, see docs/HANDOFF.md), so these reach
  // whatever the monographs happen to say about where a plant grows.
  ['nordic',           ['boreal', 'scandinavian', 'taiga', 'northern europe', 'subarctic']],
  ['scandinavian',     ['boreal', 'nordic', 'northern europe']],
  ['boreal',           ['taiga', 'subarctic', 'conifer']],
  ['local',            ['native', 'european', 'wildcrafted']],
  ['wildcrafted',      ['wild harvested', 'foraged', 'wild']],
  ['foraged',          ['wildcrafted', 'wild harvested', 'wild']],
  ['forest',           ['woodland', 'canopy', 'understorey', 'understory']],
  ['alpine',           ['montane', 'subalpine', 'high altitude']],
  ['bog',              ['peat', 'mire', 'wetland']],
  ['symbiotic',        ['mycorrhizal', 'endophyte']],
  ['parasitic',        ['pathogen', 'host tree']],
  ['saprophytic',      ['saprotroph', 'decomposer', 'deadwood']],

  // Method questions about us, not about a plant
  ['how do you make',  ['protocol', 'extraction', 'menstruum', 'ratio']],
  ['your process',     ['protocol', 'our practice', 'extraction']],
  ['house standard',   ['protocol', 'specification', 'our practice']],
  ['shelf life',       ['storage', 'stability', 'preservation']],
  ['strength',         ['ratio', 'concentration', 'potency']],
  ['how much',         ['dosage', 'dose', 'range']],

  // Ayurvedic questions asked in English
  ['rasa',             ['taste', 'flavour']],
  ['guna',             ['quality']],
  ['karma',            ['actions']],
  ['dosha',            ['vata', 'pitta', 'kapha']],
  ['vata',             ['dosha', 'dryness']],
  ['pitta',            ['dosha', 'heat']],
  ['kapha',            ['dosha', 'damp']],
  ['sanskrit name',    ['sanskrit', 'synonyms']],
  ['classical formula', ['classical formulations', 'traditional formulation']],
  ['pharmacopoeia',    ['api', 'monograph', 'quality standards']],
];

// ── 3 · Misspellings edit distance cannot reach ───────────────────
// Only two-or-more-error cases and wrong-shape cases belong here. If a
// misspelling is one letter off a word already in the corpus, delete the
// line: terminology.cjs finds it without help, and an entry here is one
// more thing to keep true.
const MISSPELLINGS = {
  ashwaganda:       'ashwagandha',
  ashwagandah:      'ashwagandha',
  aswagandha:       'ashwagandha',
  ashwaghanda:      'ashwagandha',
  ashwagandaha:     'ashwagandha',
  cordyseps:        'cordyceps',
  cordicepts:       'cordyceps',
  cordysepts:       'cordyceps',
  echinachea:       'echinacea',
  ekinacea:         'echinacea',
  echinacia:        'echinacea',
  eccinacea:        'echinacea',
  rhodeola:         'rhodiola',
  rodeola:          'rhodiola',
  rodiolla:         'rhodiola',
  schizandrah:      'schisandra',
  shisandra:        'schisandra',
  hericum:          'hericium',
  hericeum:         'hericium',
  ganaderma:        'ganoderma',
  ganodermah:       'ganoderma',
  inonotous:        'inonotus',
  psilocibin:       'psilocybin',
  psylocybin:       'psilocybin',
  muscimole:        'muscimol',
  muscamol:         'muscimol',
  muscarea:         'muscaria',
  hypericium:       'hypericum',
  hipericum:        'hypericum',
  valarian:         'valerian',
  valerin:          'valerian',
  tumeric:          'turmeric',
  termeric:         'turmeric',
  curcumen:         'curcumin',
  liquorise:        'liquorice',
  glycerhizin:      'glycyrrhizin',
  glycirrhiza:      'glycyrrhiza',
  astragulus:       'astragalus',
  astragolus:       'astragalus',
  eleuthro:         'eleuthero',
  centela:          'centella',
  bacopah:          'bacopa',
  silibum:          'silybum',
  silimarin:        'silymarin',
  mycellium:        'mycelium',
  mycelieum:        'mycelium',
  myceliium:        'mycelium',
  triterpines:      'triterpene',
  polysacharide:    'polysaccharide',
  polysaccaride:    'polysaccharide',
  bioavailibility:  'bioavailability',
  bioavailablity:   'bioavailability',
  contraindiction:  'contraindication',
  contraindacation: 'contraindication',
  contraindcation:  'contraindication',
  countraindication: 'contraindication',
  interation:       'interaction',
  anxeity:          'anxiety',
  anxeous:          'anxious',
  insomia:          'insomnia',
  insonmia:         'insomnia',
  menapause:        'menopause',
  menopuase:        'menopause',
  pregnent:         'pregnant',
  pregnancey:       'pregnancy',
  breastfeading:    'breastfeeding',
  warfrin:          'warfarin',
  wafarin:          'warfarin',
  warferin:         'warfarin',
  // Straight to warfarin, not to "coumadin": the corpus never uses the
  // brand name, so correcting to it would land on a word that retrieves
  // nothing. EQUIVALENT carries coumadin → warfarin for anyone who spells
  // the brand correctly.
  coumidin:         'warfarin',
  coumadine:        'warfarin',
  tinture:          'tincture',
  tincuture:        'tincture',
  tinctur:          'tincture',
  decotion:         'decoction',
  decoktion:        'decoction',
  adaptagen:        'adaptogen',
  adaptogin:        'adaptogen',
  adaptagenic:      'adaptogenic',
  nuetropic:        'nootropic',
  extracion:        'extraction',
  extration:        'extraction',
  dosagge:          'dosage',
  dossage:          'dosage',
  ethanoll:         'ethanol',
  etanol:           'ethanol',
  spagiric:         'spagyric',
  meridien:         'meridian',
  meridiens:        'meridian',

  // Words people misspell in the find-your-formula notes field. The
  // engine scores that field by substring match against a fixed keyword
  // list (scoring.js · NOTES_KEYWORDS), so a slip here does not merely
  // rank something lower — it silently removes a whole intention from
  // the composition. "anxeity" contains no 'anxi'.
  fatuige:          'fatigue',
  fatique:          'fatigue',
  fatige:           'fatigue',
  tierd:            'tired',
  stamania:         'stamina',
  staminia:         'stamina',
  enduranse:        'endurance',
  concetration:     'concentration',
  consentration:    'concentration',
  concentraton:     'concentration',
  depresion:        'depression',
  depressoin:       'depression',
  melancholie:      'melancholic',
  melancholly:      'melancholic',
  inflamation:      'inflammation',
  imflammation:     'inflammation',
  inflammaton:      'inflammation',
  digestoin:        'digestion',
  digestione:       'digestion',
  bloted:           'bloated',
  nausia:           'nausea',
  nausua:           'nausea',
  migrane:          'migraine',
  migrain:          'migraine',
  headach:          'headache',
  headacke:         'headache',
  stomache:         'stomach',
  colagen:          'collagen',
  collagene:        'collagen',
  memmory:          'memory',
  memori:           'memory',
  clarety:          'clarity',
  claritty:         'clarity',
  creativty:        'creativity',
  creativety:       'creativity',
  meditaton:        'meditation',
  medidation:       'meditation',
  ceremoney:        'ceremony',
  ceremonie:        'ceremony',
  cortisole:        'cortisol',
  cortizol:         'cortisol',
  burnt_out:        'burnout',
  hormoan:          'hormone',
  hormoans:         'hormone',
  libedo:           'libido',
  imune:            'immune',
  imunity:          'immunity',
  detoxx:           'detox',
  stres:            'stress',
  stresss:          'stress',
  strees:           'stress',
  anxius:           'anxious',
  anxios:           'anxious',
  sleap:            'sleep',
  slepe:            'sleep',
  energie:          'energy',
  enery:            'energy',
  focuss:           'focus',
  fokus:            'focus',
  painfull:         'painful',
  achey:            'ache',
  achy:             'ache',
  akey:             'ache',
  bloating:         'bloated',
  imflamed:         'inflamed',
  inflamd:          'inflamed',
  greif:            'grief',
  moode:            'mood',
  hormonal_acne:    'hormone',
  digestiv:         'digestive',
  visionry:         'visionary',
  shamanik:         'shamanic',
  ritaul:           'ritual',
  pryer:            'prayer',
};

// ── 4 · Negators ─────────────────────────────────────────────────
// "grounding but NOT sedating" must not pull in the sedative corpus.
// A trigger with one of these in the NEGATION_WORDS immediately before
// it is recorded as suppressed rather than expanded.
//
// The window is counted in WORDS, and it is small on purpose. Measured in
// characters it was wide enough that "grounding but not sedating with a
// nordic forest profile" suppressed *nordic* as well as *sedating* —
// a negator reaching four words past its own object. English negation of
// this kind binds tight: "not sedating", "without alcohol", "avoid
// warfarin". Anything looser guesses, and guessing here silently drops
// half of what the member asked for.
const NEGATORS = [
  'not', 'non', 'no', 'without', 'avoid', 'avoiding', 'avoids', 'except',
  'excluding', 'minus', 'free of', 'free from', 'rather than', 'instead of',
  'other than', 'anything but', 'nothing', 'never', 'cant take', 'cannot take',
  'cant have', 'allergic to', 'sensitive to', 'reacts to', 'less', 'nothing with',
];
const NEGATION_WORDS = 3;

module.exports = { EQUIVALENT, IMPLIES, MISSPELLINGS, NEGATORS, NEGATION_WORDS };

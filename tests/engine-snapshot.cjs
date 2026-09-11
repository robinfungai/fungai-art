// tests/engine-snapshot.cjs
//
// FROZEN SNAPSHOT of the client-side formula engine as it existed in
// public/find-your-formula/index.html at Step 0 of the P0 migration.
//
// Copied verbatim from the source so this file becomes the reference
// baseline. Do NOT modify to "improve" the engine here — this snapshot
// exists so any Step 1+ server engine can be proven byte-equivalent
// to the current behaviour.
//
// If the live client engine changes intentionally, regenerate the
// baseline (see tests/README.md) and commit both the snapshot and the
// updated expected/ outputs together.
//
// Runnable from Node. Loads herbs from public/herbs-data.js via a
// minimal window shim.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ── Load HERBS from public/herbs-data.js ────────────────────────
// The client-side file declares `const HERBS = [...]` and then does
// `window.HERB_DB = HERBS`. Run it in a shim context and pull HERBS
// back out.
function loadHerbs() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'public', 'herbs-data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src + '\nglobalThis.__HERBS__ = HERBS;', sandbox);
  return sandbox.__HERBS__;
}

const HERBS = loadHerbs();

// ════════════════════════════════════════════════════════════════
// SNAPSHOT — copied verbatim from
//   public/find-your-formula/index.html lines 1091–2361 & 2600–2627
// ════════════════════════════════════════════════════════════════

const RESTRICTED_NAMES = [
  'psilocybe','psilocybin','psilocin',
  'ayahuasca','banisteriopsis','chacruna','yage','yagé',
  'peyote','lophophora','mescaline','san pedro','trichocereus','echinopsis pachanoi',
  'salvia divinorum',
  'iboga','tabernanthe','ibogaine',
  'kratom','mitragyna',
  'morning glory seed','ololiuhqui','lsa','hawaiian baby woodrose',
  'toad venom','5-meo-dmt','bufo alvarius',
  'dmt','n,n-dmt',
  'coca leaf','erythroxylum','cocaine',
  'acorus calamus','calamus root',
];

const TRACE_IDS = [
  'lavender','peppermint','clove','cinnamon','cayenne','ginger','oregano',
  'thyme','sage','rosemary','black_pepper','cardamom','fennel','star_anise',
  'nutmeg','anise','bay_leaf','allspice','wormwood','tarragon','pepper',
  'gentian','goldenseal','coptis','myrrh','frankincense','copal','juniper',
  'eucalyptus','tea_tree','wintergreen','camphor',
];
function isTrace(h) {
  const id = (h.id || '').toString().toLowerCase();
  const name = (h.name || '').toLowerCase();
  return TRACE_IDS.some(t => id.includes(t) || name.includes(t.replace(/_/g, ' ')));
}
function isRestricted(h) {
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return RESTRICTED_NAMES.some(r => s.includes(r));
}

const GATED_NAMES = [
  'amanita muscaria','amanita_muscaria','amanita pantherina',
];
function isGated(h) {
  const s = ((h.name || '') + ' ' + (h.botanical || '')).toLowerCase();
  return GATED_NAMES.some(r => s.includes(r));
}

function inferAxes(h) {
  const text = [
    ...(h.primary_functions   || []),
    ...(h.secondary_benefits  || []),
    ...(h.energetics          || []),
    h.spiritual_layer || '',
    h.pharmacology    || '',
    h.tcm_element     || '',
    ...(h.tcm_meridians       || []),
  ].join(' | ').toLowerCase();
  const has = re => re.test(text);
  const con = ((h.contraindications || []).concat(h.herb_to_drug_interactions || [])).join(' | ').toLowerCase();

  const intentions = [];
  if (has(/adaptogen|cortisol|stress|hpa|resilience|burnout|nervine tonic/)) intentions.push('stress');
  if (has(/anxi|nervous|gaba|tension|calm|settle|sedativ|anxiolytic|kava|panic|shen disturb/)) intentions.push('anxiety');
  if (has(/sleep|somno|insomni|circadian|melaton|hypnotic|deep sleep|night wake/)) intentions.push('sleep');
  if (has(/vital|stamina|adren|fatigue|exhaustion|athletic|endurance|yang tonic|qi tonic|energizer|mitochondri/)) intentions.push('energy');
  if (has(/mood|antidepress|serotonergi|dopamin|heart open|emotional|grief|depression|melanchol|lift|euphoric/)) intentions.push('mood');
  if (has(/cognit|memory|attention|focus|clarity|neuroplast|ngf|nootropi|acetylcholi|neuroprotect|bdnf|concentrat|neurogen/)) intentions.push('cognitive');
  if (has(/hormon|endocrine|estrogen|progester|testoster|libido|cycle|menopaus|luteal|pms|amenorr|dysmenor|androgen|thyroid.*support/)) intentions.push('hormones');
  if (has(/digest|gastroint|gut|stomach|bloating|ibs|carminativ|bitter|liver.*bile|gastric|dyspepsia|nausea|colon|microbiome|prebiotic/)) intentions.push('digestion');
  if (has(/immun|antiviral|antibacterial|antimicrobial|innate|leukocyt|lymphocyt|resistance|cold.*flu/)) intentions.push('immunity');
  if (has(/anti.?inflammat|cox|pain|analgesic|arthriti|joint|muscle.*spasm|neuralg|headache|migraine|nsaid/)) intentions.push('pain');
  if (has(/detox|liver.*cleans|hepatic|phase\s?i{1,2}|glutathion|bile flow|lymphatic drain|chelat|hepatoprotect/)) intentions.push('detox');
  if (has(/skin|collagen|ceramid|beauty|glow|hydration|photo.?protect|melanin|antioxidant.*skin|hyaluron/)) intentions.push('beauty');
  if (!intentions.length) intentions.push('stress');

  const patterns = [];
  const enr = (h.energetics || []).join(' ').toLowerCase();
  if (has(/cool|cold energetic|clear.*heat|liver.*heat|damp.?heat|inflam|hot.*natur/) || /cool|cold/.test(enr)) patterns.push('hot');
  if (has(/warm|warming|hot energetic|yang tonic|dispel.*cold|move blood|circulation/) || /warm|hot/.test(enr))  patterns.push('cold');
  if (has(/move.*qi|regulate.*qi|liver qi stagnat|resolve.*damp|resolve.*phlegm|dispel.*stag/)) patterns.push('mixed');
  if (has(/tonify|nourish|blood tonic|yin tonic|essence|jing|marrow|convalescence|nutriti|restorat|deplet/)) patterns.push('depleted');
  if (!patterns.length) patterns.push(intentions.includes('stress') || intentions.includes('anxiety') ? 'mixed' : 'depleted');

  const times = [];
  if (intentions.includes('sleep')) { times.push('evening', 'night'); }
  if (intentions.includes('energy') || intentions.includes('cognitive')) { times.push('morning', 'midday'); }
  if (intentions.includes('anxiety') || intentions.includes('stress')) { times.push('evening', 'any'); }
  if (intentions.includes('mood')) { times.push('morning', 'midday', 'any'); }
  if (!times.length) times.push('any');

  const stress = [];
  if (has(/adaptogen/))                       stress.push('push', 'collapse');
  if (has(/nervine|gaba|anxiolytic/))         stress.push('off', 'ride');
  if (has(/stimulant|caffeine|energizer/))    stress.push('numb', 'push');
  if (has(/restorat|deplet|nourish|nutriti/)) stress.push('collapse');
  if (has(/heart open|serotonergi|mood.*lift|antidepress/)) stress.push('numb', 'off');
  if (!stress.length) stress.push('ride', 'off');

  const flags = [];
  if (/pregnan|lactat|breastfeed|uterine.*stim|emmenagog|abortifac|fetal|infant.*transfer/.test(con)) flags.push('pregnancy');
  if (/anticoagulant|antiplatelet|blood.?thin|warfarin|heparin|inr|digoxin|cardiac glycoside|heart.*medicat|antihypertens|hypertens/.test(con)) flags.push('cardio_meds');
  if (/maoi|ssri|snri|serotonin syndrome|antidepress|mood stabili|antipsychot|bipolar|lithium|dopaminergi/.test(con)) flags.push('psych_meds');
  if (/immunostim|autoimmun|immunosuppress|lupus|MS\b|rheumatoid|multiple sclerosis/i.test(con)) flags.push('autoimmune');
  if (/hepatotox|liver.*damage|hepatit|nephrotox|kidney.*stone|oxalate|renal fail/.test(con)) flags.push('liver_kidney');
  if (/thyroid|hyperthyroid|hypothyroid|graves|hashimoto|iodine/.test(con)) flags.push('thyroid');
  if (/hypertens|blood pressure|vasoconstrict/.test(con)) flags.push('hypertension');
  if (/cyp3a4|contracepti|estrogen.*bind|birth control|oral contracepti/.test(con)) flags.push('contraceptive');
  if (/benzodiazepin|cns depress|sedative.*additive|potentiat.*sedat/.test(con)) flags.push('sedatives');
  if (/asteraceae|ragweed|daisy family|compositae|salicylat|aspirin/.test(con)) flags.push('allergy');

  const uniqIntentions = [...new Set(intentions)];
  return {
    intentions: uniqIntentions.slice(0, 3),
    patterns:   [...new Set(patterns)],
    times:      [...new Set(times)],
    stress:     [...new Set(stress)],
    flags:      [...new Set(flags)],
    _polyvalent: uniqIntentions.length > 3,
  };
}

let POOL = null;
function ensurePool() {
  if (POOL) return POOL;
  if (!Array.isArray(HERBS) || !HERBS.length) return null;
  POOL = HERBS
    .filter(h => !isRestricted(h))
    .map(h => Object.assign({}, h, { _ax: inferAxes(h), gated: isGated(h) }));
  return POOL;
}

function shortNote(h) {
  const src = (h.primary_functions && h.primary_functions[0]) || h.spiritual_layer || h.pharmacology || '';
  const chunk = String(src).split(/[—.–:;]/)[0].trim();
  return chunk.length > 140 ? chunk.slice(0, 137) + '…' : chunk;
}

const SUBPATTERN_AFFINITY = {
  anger:       ['bupleurum','peony','chrysanthemum','gardenia','skullcap','passionflower','motherwort','mint'],
  flushed:     ['american_ginseng','ophiopogon','rehmannia','tremella','lily','moutan'],
  inflamed:    ['turmeric','boswellia','solidago','japanese_knotweed','honeysuckle','forsythia','cats_claw','burdock'],
  hot_night:   ['rehmannia','ophiopogon','peony','lily','asparagus','american_ginseng','mulberry'],
  cold_hands:  ['cinnamon','ginger','angelica','pine_pollen','maca','shatavari','dong_quai'],
  heavy:       ['fu_ling','atractylodes','codonopsis','ginger','citrus_peel','magnolia','tangerine'],
  pale:        ['codonopsis','astragalus','atractylodes','licorice','red_dates','shan_yao','jujube'],
  low_drive:   ['cistanche','morinda','eucommia','cordyceps','maca','ashwagandha','shilajit','pine_pollen'],
  stuck:       ['bupleurum','cyperus','citrus_peel','rose','holy_basil','damiana','vervain'],
  up_down:     ['bupleurum','peony','lily','albizia','shatavari','holy_basil','saffron'],
  tension:     ['gastrodia','uncaria','black_cohosh','passionflower','skullcap','magnolia','wood_betony'],
  sighing:     ['bupleurum','magnolia_bark','rose','lily','albizia','lavender','damiana'],
  purposeless: ['reishi','asparagus','albizia','lily','rose','saffron','shatavari','damiana'],
  dry:         ['ophiopogon','tremella','glehnia','american_ginseng','shatavari','rehmannia','goji','pear'],
  overworked:  ['rehmannia','goji','cistanche','eucommia','he_shou_wu','deer','shilajit','pine_pollen','maca'],
  anxious_empty:['albizia','longan','lily','fu_ling','jujube','red_dates','saffron','ashwagandha','oatstraw'],
};
function subPatternBoost(h, subKey) {
  const hints = SUBPATTERN_AFFINITY[subKey];
  if (!hints || !hints.length) return 0;
  const id = String(h.id || '').toLowerCase();
  const name = String(h.name || '').toLowerCase();
  for (const hint of hints) {
    const needle = hint.replace(/_/g, ' ');
    if (id.includes(hint) || name.includes(needle)) return 6;
  }
  return 0;
}

function durationBoost(h, duration) {
  if (!duration) return 0;
  const text = ((h.primary_functions || []).concat(h.energetics || []).concat([h.pharmacology || ''])).join(' | ').toLowerCase();
  if (duration === 'weeks') {
    if (/nervine|acute|fast|rapid|immediate|warming|move.*qi|circulation/.test(text)) return 3;
    if (/deep.*tonic|constitutional|jing|multi.?month|long.?slow/.test(text)) return -2;
  } else if (duration === 'year_plus' || duration === 'lifelong') {
    if (/tonic|adaptogen|nourish|jing|essence|restor|convalescence|constitutional|mineral/.test(text)) return 4;
    if (/acute|first.line.*acute|short.?term|fast.?acting/.test(text)) return -1;
  }
  return 0;
}

function ageBoost(h, age) {
  if (!age) return 0;
  const text = ((h.primary_functions || []).concat(h.contraindications || [])).join(' | ').toLowerCase();
  if (age === '60_plus') {
    if (/gentle|nourish|tonic|restor|adaptogen|kidney.*yin|blood.*tonic/.test(text)) return 2;
    if (/stimulant|caffeine|strong.*yang|hot.*energetic/.test(text)) return -2;
  }
  if (age === 'under_25') {
    if (/menopaus|perimenopaus|hot flash/.test(text)) return -2;
  }
  return 0;
}

function sleepBoost(h, sleep) {
  if (!sleep || sleep === 'restorative_6plus' || sleep === 'restorative') return 0;
  const text = ((h.primary_functions || []).concat(h._ax?.intentions || [])).join(' | ').toLowerCase();
  if (sleep === 'very_broken' || sleep === 'under_6') {
    if (/sleep|somno|insomni|hypnotic|deep sleep|night wake|circadian/.test(text)) return 4;
  }
  if (sleep === 'not_restorative_6plus') {
    if (/restor|adaptogen|adrenal|hpa|shen|kidney.*yin/.test(text)) return 3;
  }
  return 0;
}

const NOTES_KEYWORDS = [
  'lucid dream','lucid travel','astral',
  'dream','vision','visionary','oneir','shamanic',
  'sleep','insomni','wake',
  'anxi','panic','worry','loop',
  'focus','memory','cognit','clarity','concentrat',
  'energy','fatigue','tired','stamina','endurance','athlet',
  'depress','mood','grief','heavy heart','melanchol','flat',
  'stress','burnout','cortisol','deplet','exhaust',
  'pain','inflam','ache','joint','headache','migraine',
  'gut','digest','bloat','ibs','stomach','nausea',
  'immune','cold','flu','virus',
  'hormone','cycle','pms','menopaus','libido',
  'liver','detox','cleanse',
  'skin','glow','beauty','collagen',
  'heart','open','love',
  'creativ','write','music','art',
  'ceremon','ritual','meditat','prayer',
];
function notesBoost(h, notes) {
  if (!notes) return 0;
  const n = String(notes).toLowerCase();
  const t = (
    (h.primary_functions   || []).join(' | ') + ' | ' +
    (h.secondary_benefits  || []).join(' | ') + ' | ' +
    (h.energetics          || []).join(' | ') + ' | ' +
    (h.spiritual_layer     || '') + ' | ' +
    (h.pharmacology        || '') + ' | ' +
    (h.name                || '')
  ).toLowerCase();
  let boost = 0;
  for (const kw of NOTES_KEYWORDS) {
    if (n.includes(kw) && t.includes(kw)) boost += kw.includes(' ') ? 4 : 2;
  }
  return boost;
}

function scoreHerb(h, a) {
  const ax = h._ax;
  let s = 0;
  if (ax.intentions.includes(a.intention)) {
    s += 5 / Math.max(1, ax.intentions.length);
  }
  if (Array.isArray(a.intentions) && a.intentions.length > 1) {
    if (a.intentions[1] && ax.intentions.includes(a.intentions[1])) {
      s += 3 / Math.max(1, ax.intentions.length);
    }
    if (a.intentions[2] && ax.intentions.includes(a.intentions[2])) {
      s += 1.5 / Math.max(1, ax.intentions.length);
    }
  }
  if (ax.patterns.includes(a.pattern))     s += 4;
  if (ax.times.includes(a.time))           s += 2;
  if (ax.stress.includes(a.stress))        s += 3;
  s += notesBoost(h, a.notes);
  s += subPatternBoost(h, a.patternSub);
  s += durationBoost(h, a.duration);
  s += ageBoost(h, a.age);
  s += sleepBoost(h, a.sleep);
  return s;
}

function safetyFilter(h, avoid) {
  if (!avoid || !avoid.length || avoid.includes('none')) return true;
  for (const f of avoid) if ((h._ax.flags || []).includes(f)) return false;
  return true;
}

function countFilteredOut(a) {
  const pool = ensurePool();
  if (!pool) return { removed: 0, total: 0, byFlag: {}, examples: [] };
  const total = pool.length;
  const filters = (a.avoid || []).filter(x => x !== 'none');
  if (!filters.length) return { removed: 0, total, byFlag: {}, examples: [] };
  const removed = [];
  const byFlag = {};
  for (const h of pool) {
    for (const f of filters) {
      if ((h._ax.flags || []).includes(f)) {
        removed.push({ name: h.name, flag: f });
        byFlag[f] = (byFlag[f] || 0) + 1;
        break;
      }
    }
  }
  return { removed: removed.length, total, byFlag, examples: removed.slice(0, 8).map(r => r.name) };
}

const GABAERGIC_IDS = ['valerian','passionflower','hops','magnolia','skullcap','kava','california_poppy','blue_lotus','ashwagandha_sedating'];
const STIMULANT_IDS = ['ginseng','panax_ginseng','cordyceps','rhodiola','guarana','yerba_mate','mate','guayusa','kola_nut','coffee','green_tea','gotu_kola_stim','maca'];
function isGABAergic(h) {
  const s = String(h.id || '').toLowerCase() + ' ' + String(h.name || '').toLowerCase() + ' ' +
            ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
  if (GABAERGIC_IDS.some(id => s.includes(id))) return true;
  return /gaba|benzodiazepine.receptor|hypnotic|strong.sedativ|cns.depressant/.test(s);
}
function isCNSStimulant(h) {
  const s = String(h.id || '').toLowerCase() + ' ' + String(h.name || '').toLowerCase() + ' ' +
            ((h.primary_functions || []).join(' ') + ' ' + (h.pharmacology || '')).toLowerCase();
  if (STIMULANT_IDS.some(id => s.includes(id))) return true;
  return /cns.stimulant|caffeine.rich|methylxanthine|adrenergic.stim/.test(s);
}

function categoryOf(h) {
  const t = (
    (h.primary_functions || []).join(' | ') + ' | ' +
    (h.energetics || []).join(' | ') + ' | ' +
    (h.pharmacology || '')
  ).toLowerCase();
  const name = (h.name || '').toLowerCase();
  if (/mushroom|reishi|chaga|lion|cordyceps|maitake|shiitake|tremella|turkey.tail|amanita|polypore/.test(name + ' ' + t)) return 'mushroom';
  if (/adaptogen|cortisol|hpa|adrenal|stress.resil/.test(t)) return 'adaptogen';
  if (/nervine|gaba|anxiolytic|sedativ|calm.*nerv/.test(t)) return 'nervine';
  if (/move.*qi|circulate|regulate.*qi|liver.*qi|disperse|open.*chest/.test(t)) return 'mover';
  if (/bitter|hepatic|liver.*cleans|digest.*bitter|choleretic/.test(t)) return 'bitter';
  if (/tonic|nourish|blood.*tonic|yin.*tonic|yang.*tonic|jing|essence|restor/.test(t)) return 'tonic';
  if (/nutriti|mineral.*rich|silica|iron.*rich|dense.*nutri|deeply nour/.test(t)) return 'nutritive';
  if (/aromatic|essential.*oil|carminativ/.test(t)) return 'aromatic';
  return 'other';
}

function targetHerbCount(a) {
  let n = 4;
  if (a.notes && a.notes.trim().length > 80) n += 1;
  if (a.patternSub) n += 1;
  if (a.duration === 'year_plus' || a.duration === 'lifelong') n += 1;
  if (a.sleep === 'very_broken' || a.sleep === 'under_6') n += 1;
  const medFlags = (a.avoid || []).filter(k => k !== 'none').length;
  if (medFlags >= 2) n += 1;
  if (!a.notes && !a.patternSub && a.duration === 'weeks' && a.sleep === 'restorative_6plus') {
    n = 3;
  }
  return Math.min(7, Math.max(3, n));
}

function pickFormula(a) {
  const pool = ensurePool();
  if (!pool || !pool.length) return [];
  const safe = pool.filter(h => safetyFilter(h, a.avoid || []));
  const scored = safe.map(h => ({ h, s: scoreHerb(h, a) })).filter(x => x.s > 0);
  scored.sort((x, y) => y.s - x.s);

  const seen = new Set();
  const uniq = scored.filter(x => {
    const key = (shortNote(x.h) || x.h.name).slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const target = targetHerbCount(a);
  const openToGated = !!a._gatedOptIn;

  const catCount = {};
  const composed = [];
  let traceUsed = 0, gabaUsed = 0, stimUsed = 0;
  for (const x of uniq) {
    if (composed.length >= target) break;
    if (x.h.gated && !openToGated) continue;
    const cat = categoryOf(x.h);
    if ((catCount[cat] || 0) >= 2) continue;
    if (isTrace(x.h)) { if (traceUsed >= 1) continue; }
    if (isGABAergic(x.h)) { if (gabaUsed >= 2) continue; }
    if (isCNSStimulant(x.h)) { if (stimUsed >= 2) continue; }
    composed.push(x);
    catCount[cat] = (catCount[cat] || 0) + 1;
    if (isTrace(x.h)) traceUsed += 1;
    if (isGABAergic(x.h)) gabaUsed += 1;
    if (isCNSStimulant(x.h)) stimUsed += 1;
  }

  if (composed.length < target) {
    for (const x of uniq) {
      if (composed.length >= target) break;
      if (composed.includes(x)) continue;
      if (x.h.gated && !openToGated) continue;
      if (isTrace(x.h) && traceUsed >= 1) continue;
      if (isGABAergic(x.h) && gabaUsed >= 2) continue;
      if (isCNSStimulant(x.h) && stimUsed >= 2) continue;
      composed.push(x);
      if (isTrace(x.h)) traceUsed += 1;
      if (isGABAergic(x.h)) gabaUsed += 1;
      if (isCNSStimulant(x.h)) stimUsed += 1;
    }
  }

  return composed.map(x => Object.assign({}, x.h, { _score: x.s, _cat: categoryOf(x.h) }));
}

function assignPercentages(herbs) {
  if (!herbs || !herbs.length) return [];
  const scores = herbs.map(h => Math.max(1, h._score || 1));
  const total = scores.reduce((a, b) => a + b, 0);
  let raw = scores.map(s => (s / total) * 100);
  let excess = 0;
  herbs.forEach((h, i) => {
    if (isTrace(h) && raw[i] > 5) { excess += raw[i] - 5; raw[i] = 5; }
  });
  if (excess > 0.01) {
    const nonTraceIdx = herbs.map((h, i) => isTrace(h) ? -1 : i).filter(i => i >= 0);
    const nonTraceTotal = nonTraceIdx.reduce((s, i) => s + raw[i], 0);
    if (nonTraceTotal > 0) {
      nonTraceIdx.forEach(i => { raw[i] += excess * (raw[i] / nonTraceTotal); });
    }
  }
  const pct = raw.map(p => Math.round(p));
  const drift = 100 - pct.reduce((a, b) => a + b, 0);
  if (drift !== 0) {
    let iMax = 0;
    for (let i = 1; i < pct.length; i++) if (pct[i] > pct[iMax]) iMax = i;
    pct[iMax] += drift;
  }
  return pct;
}

function checkFormulaPairs(herbs) {
  const synergies = [];
  const cautions = [];
  function firstWord(name) { return String(name || '').toLowerCase().split(/[\s()]+/).filter(Boolean)[0] || ''; }
  function match(h, target) {
    const key = firstWord(target.name);
    if (!key || key.length < 4) return null;
    const syn = (h.herb_to_herb_synergy || []).find(s => s.toLowerCase().includes(key));
    const cau = (h.herb_to_herb_caution || []).find(s => s.toLowerCase().includes(key));
    return { syn, cau };
  }
  for (let i = 0; i < herbs.length; i++) {
    for (let j = i + 1; j < herbs.length; j++) {
      const m1 = match(herbs[i], herbs[j]);
      const m2 = match(herbs[j], herbs[i]);
      const synNote = (m1 && m1.syn) || (m2 && m2.syn);
      const cauNote = (m1 && m1.cau) || (m2 && m2.cau);
      if (synNote) synergies.push({ a: herbs[i].name, b: herbs[j].name, note: synNote });
      if (cauNote) cautions.push({ a: herbs[i].name, b: herbs[j].name, note: cauNote });
    }
  }
  return { synergies, cautions };
}

// ════════════════════════════════════════════════════════════════
// END OF FROZEN SNAPSHOT
// ════════════════════════════════════════════════════════════════

// Public API — the fixture runner calls this.
function runFormula(profile) {
  const herbs = pickFormula(profile);
  const percentages = assignPercentages(herbs);
  const pairs = checkFormulaPairs(herbs);
  const filtered = countFilteredOut(profile);
  const target = targetHerbCount(profile);
  return {
    engineVersion:     '1.0.0-clientside',
    herbDbVersion:     '2026.09-198herbs',
    capturedAt:        new Date().toISOString(),
    targetHerbCount:   target,
    formulaSize:       herbs.length,
    filteredOut:       filtered,
    herbs: herbs.map((h, i) => ({
      id:              h.id,
      name:            h.name,
      botanical:       h.botanical,
      category:        h._cat,
      score:           Math.round((h._score || 0) * 100) / 100,
      percentage:      percentages[i],
      isTrace:         isTrace(h),
      isGABAergic:     isGABAergic(h),
      isCNSStimulant:  isCNSStimulant(h),
      isGated:         !!h.gated,
    })),
    percentageTotal:   percentages.reduce((a, b) => a + b, 0),
    synergies:         pairs.synergies,
    cautions:          pairs.cautions,
  };
}

module.exports = {
  HERBS,
  ensurePool,
  runFormula,
  // Individual functions exposed so future tests can target them:
  isTrace, isRestricted, isGated, inferAxes, shortNote,
  subPatternBoost, durationBoost, ageBoost, sleepBoost, notesBoost,
  scoreHerb, safetyFilter, countFilteredOut,
  isGABAergic, isCNSStimulant, categoryOf,
  targetHerbCount, pickFormula, assignPercentages, checkFormulaPairs,
};

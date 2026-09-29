// src/server/formula-engine/note-safety.js
//
// Safety words in the free-text note (Robin, D1 2026-09-28).
//
// The note is not a safety channel — both pages say medicines,
// pregnancy and conditions belong in the safety question. People write
// them in the note anyway ("on sertraline since spring"), and until now
// the engine read that note only for scoring. So: a note that names a
// medicine, a pregnancy or a condition gets the matching safety flag
// applied, exactly as if the box had been ticked, and the reveal says so.
//
// It fails CLOSED on purpose. "Not pregnant" still applies the pregnancy
// filter — the cost is a slightly narrower bottle, the reveal names the
// word it read, and the person can take it out of the note. The other
// direction (missing a real medicine) is the one that can hurt.
//
// It only ever ADDS flags; it never removes one the person ticked.
// English plus the common German words (the house is in Berlin).
// Conditions with no safety flag of their own (epilepsy, chemotherapy)
// are not guessed at here — there is no filter to map them to.

const { normaliseNote, findHerbs, isHerbPhrase, GERMAN_NAMES } = require('./herb-names');

const RULES = [
  ['pregnancy', /\b(pregn\w*|pregant|preganant|expecting a baby|trying to (?:conceive|get pregnant)|ttc|ivf|fertility treatment|breast[- ]?feed\w*|lactating|lactation|post-?partum|schwanger\w*|stillzeit|ich stille)\b/i],
  ['psych_meds', /\b(anti-?\s?depress?ant\w*|antidepressiva|ssris?|snris?|maois?|tricyclic\w*|mood[- ]stabili[sz]er\w*|anti-?psychotic\w*|lithium|sertralin\w*|fluoxetin\w*|citalopram|escitalopram|paroxetin\w*|venlafaxin\w*|duloxetin\w*|bupropion|mirtazapin\w*|trazodon\w*|amitriptylin\w*|lamotrigin\w*|quetiapin\w*|olanzapin\w*|aripiprazol\w*|risperidon\w*|valpro\w*|zoloft|prozac|lexapro|cipralex|celexa|paxil|effexor|cymbalta|wellbutrin|elontril|seroquel|abilify|methylphenidat\w*|ritalin|medikinet|concerta|adderall|vyvanse|elvanse|lisdexamfetamin\w*|atomoxetin\w*|strattera|adhd (?:meds?|medication))\b/i],
  ['sedatives', /\b(benzos?|benzodiazepin\w*|diazepam|valium|lorazepam|ativan|tavor|alprazolam|xanax|clonazepam|klonopin|rivotril|temazepam|oxazepam|zolpidem|ambien|stilnox|zopiclon\w*|sleeping (?:pills?|tablets?)|sleep(?:ing)? (?:meds?|medication)|schlaftablette\w*|on sedatives|sedative (?:meds?|medication|drugs?|tablets?)|gabapentin|pregabalin|lyrica|opioid\w*|opiate\w*|codein\w*|tramadol|oxycodon\w*|morphin\w*|fentanyl|methadon\w*|buprenorphin\w*)\b/i],
  ['cardio_meds', /\b(blood[- ]?thinner\w*|blutverd[üu]nner\w*|anti-?coagula\w*|anti-?platelet\w*|warfarin|coumadin|marcumar|phenprocoumon|apixaban|eliquis|rivaroxaban|xarelto|dabigatran|pradaxa|edoxaban|lixiana|clopidogrel|plavix|ticagrelor|aspirin|ass 100|heparin|digoxin|digitoxin|statins?|atorvastatin|simvastatin|rosuvastatin|beta[- ]?blocker\w*|metoprolol|bisoprolol|propranolol|amiodaron\w*|heart (?:meds?|medication|condition|disease|failure)|arrhythmi\w*|atrial fibrillation|a-?fib|herzmedikament\w*)\b/i],
  ['hypertension', /\b(high blood[- ]pressure|hypertens\w*|blood[- ]pressure (?:meds?|medication|pills?|tablets?)|bluthochdruck|ace[- ]inhibitor\w*|ramipril|lisinopril|enalapril|amlodipin\w*|losartan|candesartan|valsartan|telmisartan|hydrochlorothiazid\w*)\b/i],
  ['thyroid', /\b(thyroid\w*|hypo-?thyroid\w*|hyper-?thyroid\w*|hashimoto\w*|graves'? disease|morbus basedow|levothyrox\w*|l-?thyroxin\w*|thyroxin\w*|euthyrox|synthroid|carbimazol\w*|methimazol\w*|thiamazol\w*|schilddr\w*)\b/i],
  ['autoimmune', /\b(auto-?\s?immun\w*|lupus|multiple sclerosis|rheumatoid|crohn'?s?|ulcerative colitis|colitis ulcerosa|coeliac|celiac|z[öo]liakie|hashimoto\w*|graves'? disease|morbus basedow|psoria\w*|sj[öo]gren\w*|ankylosing|type[- ]?1 diabet\w*|immuno-?suppress\w*|methotrexat\w*|ciclosporin|cyclosporin\w*|tacrolimus|azathioprin\w*|mycophenol\w*|(?:organ|kidney|liver|heart|lung|stem[- ]cell) transplant\w*|transplant (?:patient|recipient))\b/i],
  ['liver_kidney', /\b(liver (?:disease|condition|damage|failure|problems?|issues?)|hepatitis|cirrhosis|fatty liver|nafld|kidney (?:disease|condition|damage|failure|problems?|issues?|stones?)|renal\w*|dialysis|nephr\w*|leber(?:erkrankung|schaden|zirrhose)\w*|niere\w*)\b/i],
  ['contraceptive', /\b(the pill|birth[- ]control|contracepti\w*|verh[üu]tung\w*|anti-?baby-?pille|die pille|mini-?pill|hormonal iud|mirena|kyleena|nexplanon|implanon|nuva-?ring|depo-?provera)\b/i],
  ['allergy', /\b(allerg\w*|anaphyla\w*|hay ?fever|heuschnupfen|ragweed|ambrosia|asteraceae|compositae|daisy family|salicylat\w*)\b/i],
];

const NOTE_SAFETY_FLAGS = RULES.map(r => r[0]);

/**
 * Safety flags named in a note, each with the first word that named it.
 * @returns {Array<{flag: string, word: string}>}
 */
function detectNoteSafety(notes) {
  // Curly quotes straightened: "Graves’ disease" from a phone.
  const text = normaliseNote(String(notes || '').slice(0, 4000));
  if (!text.trim()) return [];
  const hits = [];
  for (const [flag, rx] of RULES) {
    const m = text.match(rx);
    if (m) hits.push({ flag, word: m[0].slice(0, 40) });
  }
  return hits;
}

/**
 * Merge the note's flags into an already-validated avoid[].
 * "none" gives way to any flag the note names.
 * @returns {{ avoid: string[], added: string[], hits: Array<{flag, word}> }}
 *   hits lists only the flags the note ADDED (not ones already ticked).
 */
function applyNoteSafety(avoid, notes) {
  const ticked = (avoid || []).filter(f => f !== 'none');
  const hits = detectNoteSafety(notes).filter(h => !ticked.includes(h.flag));
  if (!hits.length) return { avoid: avoid.slice(), added: [], hits: [] };
  const added = hits.map(h => h.flag);
  return { avoid: ticked.concat(added), added, hits };
}


// ── A named herb to avoid (2026-09-28) ─────────────────────────────
// "Allergic to chamomile", "bad reaction to ashwagandha", "no more
// rhodiola", "valerian made me groggy": that herb leaves the pool —
// a hard exclusion, never a score. Each clause of the note is read on
// its own; a herb counts when it follows a refusal in the same clause,
// or comes just before a "made me …" / "didn't agree with me". Fails
// closed like the flags above, and the reveal names every herb it left
// out. WHICH herb a word means is herb-names.js (2026-09-29: typos,
// plurals, spacing, genus, German, curly apostrophes).
//
// A long refusal governs the rest of its clause up to a turn ("but",
// "helped", "because"); a short one ("no", "without", "ohne") the next
// few words. Either runs on through a list — "no valerian, kava,
// passionflower, hops or skullcap" — while each further item is only
// herb names (or an effect), so "without melatonin, so something with
// valerian" still refuses nothing.
const AVOID_BEFORE = new RegExp('\\b(?:' + [
  "allerg\\w*(?: (?:to|with|reaction to|gegen|auf))?",
  "(?:bad |adverse |strong )?reactions? (?:to|with|from)",
  "react(?:ed|s)? (?:badly |poorly |strongly )?(?:to|with)",
  "intoleran\\w*(?: (?:to|of|gegen))?",
  "sensitive to",
  "can'?t (?:take|tolerate|have|use|stand|do)", "cannot (?:take|tolerate|have|use|stand|do)",
  "(?:do|did|does)(?:n'?t| not) (?:tolerate|want|use|like|need|do well with)",
  "(?:won'?t|will not|wouldn'?t|would not) (?:take|have|use|want|touch)",
  "(?:do not|don'?t) (?:put|include|add|give me|use|mix)",
  "(?:would |'d )?rather not(?: have)?",
  "not a fan of", "not keen on", "hate", "dislike",
  "avoid(?:ing)?", "no more", "never again", "(?:stay|keep)(?:ing)? away from",
  "not (?:allowed|supposed) to (?:take|have)",
  "stopped (?:taking|using)", "had to stop",
  // German
  "vertrag\\w* (?:kein\\w*|nicht)", "mag (?:kein\\w*|nicht)", "allergisch (?:gegen|auf)", "allergie (?:gegen|auf)",
  "nicht mehr", "verzicht\\w* auf", "reagier\\w* (?:allergisch |empfindlich )?auf",
  "will (?:kein\\w*|nicht)", "m[öo]chte (?:kein\\w*|nicht)",
].join('|') + ')', 'gi');
const AVOID_NEAR = /\b(?:no|without|ohne|kein(?:e|en|er|em|es)?|free (?:of|from)|please no|nothing (?:with|containing|that|like)|leave out|keep out|exclude|skip|except|anything but|not too|none of|minus|zero|au(?:ß|ss)er|bitte nicht|nichts mit)\b/gi;
// "not" and "nicht" alone refuse a NAMED herb ("not valerian", "bitte
// nicht Baldrian") but never an effect: "I'm not sleepy at night" must
// not take the sedating herbs away from someone who cannot sleep.
const AVOID_NEAR_HERB = /\b(?:not|nicht)\b/gi;
const NEAR_WORDS = 4;
// "leave the kava out", "lass den Baldrian weg".
const AVOID_WRAP = /\b(?:leave|keep|take|lass|lasst|lassen)\s+(.{1,60}?)\s+(?:out|away|weg|raus|heraus)\b/gi;
const AVOID_AFTER = new RegExp('(?:' + [
  "\\b(?:made|makes|make|gave|gives|give) me (?:feel )?(?:really |very |so |super )?(?:sick|ill|nause\\w*|queasy|anxious|jittery|wired|groggy|dizzy|worse|bad|awful|terrible|horrible|weird|strange|off|foggy|drowsy|sleepy|tired|panicky|restless|shaky|a rash|rashes|hives|headaches?|a headache|migraines?|palpitations|heartburn|insomnia|nightmares|bad dreams|diarrh\\w*|the runs|cramps|stomach ?aches?|reflux|the jitters)\\b",
  "\\b(?:do|did|does)(?:n'?t| not) (?:agree|sit well|sit right|work for me|suit me)",
  "\\bupsets? my (?:stomach|gut|tummy)",
  "\\b(?:is|are|was|were) (?:a )?no[- ]?go\\b",
  "\\b(?:is|are) not for me\\b", "\\b(?:is|are) off the table\\b",
  "\\band i (?:don'?t|do not|didn'?t) get (?:on|along)",
  "\\b(?:i'?m|i am) allergic\\b",
  // German
  "\\b(?:bin|reagiere) ich allergisch\\b",
  "\\b(?:vertrag\\w*|mag|will|m[öo]chte|nehme|darf|kann) ich (?:nicht|kein\\w*)\\b",
  "\\b(?:ist|sind|war) nichts f[üu]r mich\\b", "\\bbekommt mir nicht\\b", "\\btut mir nicht gut\\b",
  "\\b(?:macht|machte) mich (?:m[üu]de|nerv[öo]s|unruhig|krank|schwindelig)\\b",
].join('|') + ')', 'gi');
const CLAUSE_TURN = /\b(?:but|however|though|although|except|prefer|love|loved|help|helps|helped|works|worked|maybe|perhaps|because|since|try|instead|fine|okay|happy|enjoy|aber|jedoch|sondern|lieber|gerne?|hilft|half|geholfen|weil|denn)\b/i;
// Between list items.
const LIST_SEP = /\s*(?:,|\/|&|\+|\bor\b|\band\b|\bnor\b|\boder\b|\bund\b|\bnoch\b|\bsowie\b|\bplus\b)\s*/i;

// Clauses of the note. "St." is not the end of a sentence.
function clausesOf(notes) {
  return normaliseNote(String(notes || '').slice(0, 4000))
    .replace(/\b(st|sankt|hl)\.\s*/gi, '$1 ')
    .split(/[.;!?\n]+/);
}

// The first item of what a refusal governs, then every further list
// item that is nothing but names or effects.
function withList(rest, firstWords, isItem) {
  const items = rest.split(LIST_SEP);
  const firstAll = items[0].trim().split(/\s+/).filter(Boolean);
  const out = [firstWords ? firstAll.slice(0, firstWords).join(' ') : items[0]];
  if (firstWords && firstAll.length > firstWords) return out[0];
  for (const it of items.slice(1)) { if (!isItem(it)) break; out.push(it); }
  return out.join(', ');
}

// The parts of a clause a refusal governs, each marked with whether it
// may refuse effects as well as named herbs.
function refusedSegments(clause, pool) {
  const isItem = it => isHerbPhrase(it, pool) || (it.trim().split(/\s+/).length <= 3 && EFFECTS.some(e => e.words.test(it)));
  const out = [];
  let m;
  AVOID_BEFORE.lastIndex = 0;
  while ((m = AVOID_BEFORE.exec(clause))) {
    let rest = clause.slice(m.index + m[0].length);
    const turn = rest.search(CLAUSE_TURN);
    if (turn >= 0) rest = rest.slice(0, turn);
    out.push({ marker: m[0], text: ' ' + withList(rest, 0, isItem), effects: true });
  }
  for (const [rx, effects] of [[AVOID_NEAR, true], [AVOID_NEAR_HERB, false]]) {
    rx.lastIndex = 0;
    while ((m = rx.exec(clause))) {
      out.push({ marker: m[0], text: ' ' + withList(clause.slice(m.index + m[0].length), NEAR_WORDS, isItem), effects });
    }
  }
  AVOID_WRAP.lastIndex = 0;
  while ((m = AVOID_WRAP.exec(clause))) out.push({ marker: m[0].split(/\s+/)[0], text: ' ' + m[1], effects: true });
  return out;
}

// ── An effect the note refuses (2026-09-29) ──────────────────────────
// Robin: "when the user doesn't want [a herb or an effect] … this needs
// to be waterproof." "No caffeine", "nothing sedating", "I don't want
// anything that makes me drowsy", "no mushrooms", "caffeine-free",
// "ohne Koffein": every herb with that effect leaves the pool, exactly
// like a named herb. The effect words are only read after a refusal —
// "I'm sleepy all day" refuses nothing. Fails closed, and the reveal
// names what it left out and the words it read.
const P = require('./pharmacology');
const EFFECTS = [
  { effect: 'stimulating', label: 'anything stimulating',
    words: /\b(?:stimula\w*|caffein\w*|koffein\w*|energi[sz]ing|wired|jitter\w*|uppers?|anregend\w*|aufputsch\w*|keeps? me (?:up|awake)|wach ?mach\w*)/i,
    test: h => P.isCNSStimulant(h) || P.isStrongStimulant(h) },
  { effect: 'sedating', label: 'anything sedating',
    words: /\b(?:sedat\w*|drows\w*|sleepy|groggy|knock(?:s|ed|ing)? (?:me )?out|makes? me tired|beruhig\w*|schl[äa]frig\w*|m[üu]de mach\w*)/i,
    test: h => P.isGABAergic(h) },
  { effect: 'psychoactive', label: 'anything psychoactive',
    words: /\b(?:psycho-?activ\w*|psychedel\w*|hallucinogen\w*|mind[- ]altering|trippy|intoxicat\w*|getting high|psychoaktiv\w*|berausch\w*)/i,
    test: h => !!h.gated || P.cnsAction(h) === 'psychoactive' },
  { effect: 'laxative', label: 'laxative herbs',
    words: /\b(?:laxativ\w*|purgativ\w*|abf[üu]hr\w*)/i,
    test: h => P.isLaxative(h) },
  { effect: 'mushroom', label: 'mushrooms',
    words: /\b(?:mushrooms?|fung(?:i|us)|funghi|pilz\w*)\b/i,
    test: h => P.isFungus(h) },
  { effect: 'serotonergic', label: 'serotonergic herbs',
    words: /\bserotonerg\w*/i,
    test: h => P.isSerotonergic(h) },
  // "no dream herbs", "nothing that gives vivid dreams", "no more
  // nightmares" (2026-09-29): the herbs recorded as deepening dreams.
  { effect: 'dreaming', label: 'anything that deepens dreams',
    words: /\b(?:dream\w*|oneirogen\w*|lucid|vivid|nightmar\w*|tr[äa]um\w*|albtr[äa]um\w*|alptr[äa]um\w*)/i,
    test: h => P.isDreamDeepening(h) },
];
// "caffeine-free", "koffeinfrei", "alcohol free" style.
const FREE_OF = /\b(\w+)[- ]?(?:free|frei)\b/gi;

/**
 * Effects the note refuses, each with the herbs it removes.
 * @returns {Array<{effect, label, word, ids: Array}>}
 */
function detectNoteEffectAvoidance(notes, pool) {
  if (!String(notes || '').trim() || !Array.isArray(pool)) return [];
  const found = new Map();
  const hit = (e, word) => { if (!found.has(e.effect)) found.set(e.effect, { effect: e.effect, label: e.label, word: word.replace(/\s+/g, ' ').trim().slice(0, 60) }); };
  for (const clause of clausesOf(notes)) {
    for (const seg of refusedSegments(clause, pool)) {
      if (!seg.effects) continue;
      for (const e of EFFECTS) { const w = seg.text.match(e.words); if (w) hit(e, seg.marker + ' ' + seg.text.slice(0, seg.text.indexOf(w[0]) + w[0].length)); }
    }
    FREE_OF.lastIndex = 0;
    let m;
    while ((m = FREE_OF.exec(clause))) for (const e of EFFECTS) if (e.words.test(m[1] + ' ') || e.words.test(m[0])) hit(e, m[0]);
  }
  return [...found.values()].map(x => {
    const e = EFFECTS.find(y => y.effect === x.effect);
    return { ...x, ids: pool.filter(h => { try { return e.test(h); } catch (_) { return false; } }).map(h => h.id) };
  });
}

/**
 * Herbs the note says to avoid.
 * @param {string} notes
 * @param {Array} pool — ensurePool() herbs
 * @returns {Array<{id, name, word}>} word = the phrase that named it
 */
function detectNoteHerbAvoidance(notes, pool) {
  if (!String(notes || '').trim() || !Array.isArray(pool)) return [];
  const found = new Map();
  const note = (h, word) => { if (!found.has(h.id)) found.set(h.id, { id: h.id, name: h.name, word: word.replace(/\s+/g, ' ').trim().slice(0, 60) }); };
  for (const clause of clausesOf(notes)) {
    for (const seg of refusedSegments(clause, pool)) {
      for (const { herb } of findHerbs(seg.text, pool)) note(herb, seg.marker + seg.text.slice(0, 40));
    }
    AVOID_AFTER.lastIndex = 0;
    let m;
    while ((m = AVOID_AFTER.exec(clause))) {
      // The words just before, from the last turn on: "I love chamomile
      // but valerian made me groggy" names valerian only.
      let before = clause.slice(Math.max(0, m.index - 60), m.index);
      const turns = [...before.matchAll(new RegExp(CLAUSE_TURN.source, 'gi'))];
      if (turns.length) { const t = turns[turns.length - 1]; before = before.slice(t.index + t[0].length); }
      // …and of those, the subject: the nearest list item that names a
      // herb ("I used to take ashwagandha and it made me anxious"), with
      // any bare names listed before it ("valerian and kava made me
      // groggy") — never an earlier item that only praises one ("lion's
      // mane felt clean and I want more of that, rhodiola gave me a
      // headache" names rhodiola).
      const items = before.split(LIST_SEP);
      let i = items.length - 1;
      while (i >= 0 && !findHerbs(items[i], pool).length) i--;
      if (i < 0) continue;
      let j = i;
      while (j > 0 && isHerbPhrase(items[j - 1], pool)) j--;
      before = items.slice(j, i + 1).join(', ');
      for (const { herb } of findHerbs(before, pool)) note(herb, before.trim().split(/\s+/).slice(-4).join(' ') + ' ' + m[0]);
    }
  }
  return [...found.values()];
}

// ── Restless sleep: no dream-deepening herbs (Robin, 2026-09-29) ────
// "The herbs which induce vividness of dreams, such as mugwort, blue
// lotus and calea, should not be matched when people are already
// having restless sleep." Not a score — they leave the pool, for the
// deterministic bottle, MYCO's shortlist and the fallback alike. The
// herbs are the ones recorded sleep_action 'dream_vivid'.
// Restless = the sleep answers "vivid, restless dreams", "very broken
// sleep" and "wakes in the night", or the note saying so ("nightmares",
// "restless sleep", "Albträume"). A want ("I'd love vivid dreams") is
// not a complaint and is left alone.
const RESTLESS_SLEEP_ANSWERS = new Set(['vivid_restless', 'very_broken', 'wakes_middle']);
const RESTLESS_WORDS = /\b(?:nightmares?|night terrors?|bad dreams?|disturb(?:ed|ing) dreams?|restless (?:sleep|nights?|sleeper)|sleep(?:ing)? restless(?:ly)?|albtr[äa]um\w*|alptr[äa]um\w*|schlecht(?:e|en)? tr[äa]um\w*|unruhig\w* (?:schlaf\w*|n[äa]chte|nacht))/i;

/**
 * @returns {null | {answer: string|null, word: string|null, ids: Array}}
 *   word = what the note said (only then does the reveal mention it).
 */
function detectRestlessSleep(profile, pool) {
  const p = profile || {};
  const answer = RESTLESS_SLEEP_ANSWERS.has(p.sleep) ? p.sleep : null;
  const m = normaliseNote(String(p.notes || '').slice(0, 4000)).match(RESTLESS_WORDS);
  if (!answer && !m) return null;
  return { answer, word: m ? m[0] : null, ids: (pool || []).filter(P.isDreamDeepening).map(h => h.id) };
}

module.exports = {
  NOTE_SAFETY_FLAGS, detectNoteSafety, applyNoteSafety, detectNoteHerbAvoidance, detectNoteEffectAvoidance,
  detectRestlessSleep, RESTLESS_SLEEP_ANSWERS, EFFECTS, GERMAN_NAMES,
};

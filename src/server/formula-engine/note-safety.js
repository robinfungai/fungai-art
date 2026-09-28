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
  const text = String(notes || '').slice(0, 4000);
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

module.exports = { NOTE_SAFETY_FLAGS, detectNoteSafety, applyNoteSafety };

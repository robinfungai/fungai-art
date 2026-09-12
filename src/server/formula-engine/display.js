// src/server/formula-engine/display.js
//
// AUDIT_FIX (Finding #7): pre-compute all customer-facing display
// strings server-side so the compose response can ship *strings*
// instead of the raw pharmacology / synergy metadata the browser
// used to receive.
//
// Prior architecture leaked, per herb:
//   primary_functions, secondary_benefits, energetics,
//   spiritual_layer, pharmacology, tcm_element,
//   herb_to_herb_synergy, herb_to_herb_caution
// which allowed a scraper hitting /api/fyf/compose repeatedly to
// reconstruct a substantial subset of the herb IP.
//
// Post-fix, the server ships only:
//   per herb  → { name, botanical, percentage, shortNote, isTrace }
//   per form  → { synergies:[{a,b,note}], cautions:[...], storyText, whyText }
//
// LIFTED (with minor cleanups) FROM
//   public/find-your-formula/index.html
//     storyFor            (line ~2611)
//     buildWhyText        (line ~2706)
//     stripLead / herbSummary  (lines ~2700–2705)
//     SUB_COPY / INTENT_PHRASE / PATTERN_PHRASE constant maps
// so the browser can be a pure rendering shell.

const { shortNote } = require('./axes');
const { checkFormulaPairs } = require('./interactions');

// Sub-pattern refinement copy (Q2 stage B) — reads the user's second-
// stage pick and folds it into the reveal story as a specific
// body-reading line.
const SUB_COPY = {
  anger: 'a Liver-heat lift that fires quickly',
  flushed: 'a Heart-fire signature that comes up in the face',
  inflamed: 'toxic-heat holding in the tissues',
  hot_night: 'a Yin-deficient heat rising after dark',
  cold_hands: 'a Yang-deficient chill sitting in the extremities',
  heavy: 'damp accumulation making the body heavy',
  pale: 'Spleen-Qi deficiency in the middle burner',
  low_drive: 'a low Kidney-Yang pilot light',
  stuck: 'Liver-Qi stagnation asking to move',
  up_down: 'Liver-Heart disharmony flickering through',
  tension: 'wind moving through the meridians',
  sighing: 'Lung-Qi constrained by Liver-Qi',
  purposeless: 'a Shen wandering — spirit off its anchor',
  dry: 'Yin-deficient dryness across the tissues',
  overworked: 'Jing depletion — the constitutional bank overdrawn',
  anxious_empty: 'Heart-Blood deficiency with floating anxiety',
};

const INTENT_PHRASE = {
  stress: 'the space to steady under load',
  anxiety: 'the quiet — a settled nervous system',
  sleep: 'deeper, more restorative sleep',
  energy: 'clean sustained vitality',
  mood: 'warmth back into the days',
  cognitive: 'sharper thinking and better recall',
  hormones: 'endocrine rhythm and flow',
  digestion: 'a gut that settles and absorbs',
  immunity: 'trained inner defence',
  pain: 'inflammation cooled at its source',
  detox: 'clean liver and lymphatic flow',
  beauty: 'skin, hair, nails from the inside',
};

const PATTERN_PHRASE = {
  hot: 'a body that runs hot and reactive',
  cold: 'a body that runs cool and slow',
  mixed: 'a body caught between hot and cold — variable, stuck',
  depleted: 'a body running on empty reserves',
};

const INT_MAP_STORY = {
  stress: 'the space to steady',
  anxiety: 'the quiet',
  sleep: 'deeper sleep',
  energy: 'clean vitality',
  mood: 'warmth back',
  cognitive: 'clearer thinking',
  hormones: 'endocrine flow',
  digestion: 'gut settlement',
  immunity: 'inner defence',
  pain: 'ease in the body',
  detox: 'liver clearance',
  beauty: 'the glow',
};

const PAT_MAP_STORY = {
  hot: 'running hot — reactive, inflamed',
  cold: 'running cool — heavy, slow',
  mixed: 'stuck in the middle — sighing, held',
  depleted: 'depleted — the tank has been low',
};

const TIME_MAP_STORY = {
  morning: 'mornings land hardest',
  midday: 'the midday dip is where it shows',
  evening: 'evenings are the struggle',
  night: 'the deep night wakes you',
  any: 'it moves through the whole day',
};

const STRESS_MAP_STORY = {
  push: 'you push through rather than pause',
  collapse: 'you collapse into recovery-mode',
  numb: 'you reach for something to numb the edge',
  ride: 'you roll with it, mostly',
  off: 'something is off in a way you can\'t name',
};

// The "reading" — 3-4 sentence template narrative. Reads only the
// user's answers + herb NAMES (no pharma metadata leak).
function storyFor(profile, herbs) {
  if (!herbs || !herbs.length) return '';
  const heroNames = herbs.slice(0, 2).map(h => h.name).join(' and ');
  const spineNames = herbs.slice(2, 4).map(h => h.name).join(', ');
  const closerName = (herbs[4] && herbs[4].name)
    || (herbs[herbs.length - 1] && herbs[herbs.length - 1].name)
    || 'the closing note';
  const subLine = profile.patternSub && SUB_COPY[profile.patternSub]
    ? ' Underneath, a specific signal: <em>' + SUB_COPY[profile.patternSub] + '</em>.'
    : '';
  return (
    'You\'re calling in <em>' + (INT_MAP_STORY[profile.intention] || 'the shift') + '</em>. ' +
    'Your body reads as ' + (PAT_MAP_STORY[profile.pattern] || 'searching') + ', and ' +
    (TIME_MAP_STORY[profile.time] || 'it moves through the whole day') + '. ' +
    'Under pressure, ' + (STRESS_MAP_STORY[profile.stress] || 'you\'re finding your way') + '.' +
    subLine +
    '<br><br>' +
    'This blend leans on <em>' + heroNames + '</em> as the spine — ' +
    'weaves in ' + spineNames + ' to hold you steady — ' +
    'and closes with <em>' + closerName + '</em> for the deeper, slower work. ' +
    'Slow-pace medicine. Give it three weeks.'
  );
}

function stripLead(s) {
  return String(s || '').split(/[—.–:;]/)[0].trim();
}

// Compact "what this herb does" line. Sourced from the herb's own
// primary_functions[0] first clause, capped. Also lives client-side
// as shortNote() in axes.js — here we keep a 120-char cap version
// used by whyText's hero/second lines.
function herbSummary(h) {
  const src = (h.primary_functions && h.primary_functions[0])
    || h.spiritual_layer
    || h.pharmacology
    || '';
  const s = stripLead(src);
  return s.length > 120 ? s.slice(0, 117) + '…' : s;
}

// The "why this formula" 3-paragraph explainer. Free preview at top +
// dimmed reveal (unlocks after reservation) with the hero-herb reasoning.
function buildWhyText(profile, herbs, percentages) {
  if (!herbs || !herbs.length) return '';
  const withPct = herbs.map((h, i) => ({ h, pct: percentages[i] || 0 }));
  withPct.sort((a, b) => b.pct - a.pct);
  const hero = withPct[0];
  const second = withPct[1];
  const rest = withPct.slice(2);

  const intentPhrase = INTENT_PHRASE[profile.intention] || 'what you\'re calling in';
  const patternPhrase = PATTERN_PHRASE[profile.pattern] || 'the body reading you gave';

  const heroLine =
    '<strong style="color:var(--parchment);">' + hero.h.name + '</strong> takes the largest share (' +
    hero.pct + '%) &mdash; ' + herbSummary(hero.h).toLowerCase() + '. ' +
    (second
      ? 'Woven in at ' + second.pct + '%, <strong style="color:var(--parchment);">' + second.h.name +
        '</strong> holds the second thread &mdash; ' + herbSummary(second.h).toLowerCase() + '.'
      : '');
  const restLine = rest.length
    ? 'The remaining allies (' + rest.map(x => x.pct + '% ' + x.h.name).join(', ') +
      ') round the blend so the shift is <em>whole-body</em>, not narrow.'
    : '';
  const readingLine =
    'This composition targets <em>' + intentPhrase + '</em>, tuned for <em>' + patternPhrase + '</em>' +
    (profile.patternSub ? ' &mdash; specifically the ' + profile.patternSub.replace(/_/g, ' ') + ' signature' : '') + '.';
  const hasSafetyFlags = (profile.avoid || []).filter(x => x && x !== 'none').length > 0;
  const openLine = hasSafetyFlags
    ? 'Your composition was <strong>filtered against the safety flags you set</strong>, then scored across intention, body signature, rhythm and stress. Cross-checked for herb-to-herb synergy in the practitioner catalog.'
    : 'Your composition was scored across intention, body signature, rhythm and stress. Cross-checked for herb-to-herb synergy in the practitioner catalog.';
  const methodLine =
    'Any essential-oil-rich herb (lavender, ginger, cinnamon and their kin) is capped at 5% by design &mdash; their pharmacology is strong enough that anything more would dominate the blend. The remaining share goes to the tonics, nervines and adaptogens that do the slower, foundational work.';

  return (
    '<p>' + openLine + '</p>' +
    '<p>' + methodLine + '</p>' +
    '<div class="r-why-reveal">' +
      '<p>' + readingLine + '</p>' +
      '<p>' + heroLine + '</p>' +
      (restLine ? '<p>' + restLine + '</p>' : '') +
    '</div>'
  );
}

// Convenience: build the full display bundle from an engine result.
// Called once by fyf-compose.mjs before shipping the response.
// `enrichedHerbs` is the picker's full-metadata herb list (needed for
// checkFormulaPairs + herbSummary); the caller then strips it to the
// display-only shape.
function buildDisplayBundle({ profile, enrichedHerbs, percentages }) {
  const pairs = checkFormulaPairs(enrichedHerbs);
  return {
    storyText: storyFor(profile, enrichedHerbs),
    whyText:   buildWhyText(profile, enrichedHerbs, percentages),
    synergies: pairs.synergies,
    cautions:  pairs.cautions,
    herbLines: enrichedHerbs.map(h => ({
      // shortNote per herb — 140-char summary. This is the SINGLE
      // pharma-derived string the client gets per herb; the raw source
      // arrays (primary_functions, secondary_benefits, energetics,
      // spiritual_layer, pharmacology, tcm_element, synergy, caution)
      // are dropped before the response leaves the server.
      shortNote: shortNote(h),
    })),
  };
}

module.exports = {
  storyFor,
  buildWhyText,
  buildDisplayBundle,
  SUB_COPY,
  INTENT_PHRASE,
  PATTERN_PHRASE,
};

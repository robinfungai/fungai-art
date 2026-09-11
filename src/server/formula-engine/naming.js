// src/server/formula-engine/naming.js
//
// Deterministic formula naming — same NAME_TEMPLATES table + djb2
// seed the client currently uses. Two-argument signature (bank +
// answers) instead of the client's closure-scoped state.answers so
// this is a pure function.
//
// LIFTED VERBATIM from
//   public/find-your-formula/index.html lines 2659–2703.

const NAME_TEMPLATES = {
  stress:    ['Slow Anchor','Held Hollow','Long Exhale','Cedar Steady','Amber Ground','Deep Yield'],
  anxiety:   ['Quiet Grove','Slow Rain','Blue Vervain Hush','Still Water','Held Circle','Pearl Field'],
  sleep:     ['Blue Fold','Night Bell','Moss Down','Star Anchor','Deep Willow','Silver Vein'],
  energy:    ['Ember Vein','Rising Bark','Copper Dawn','Fire Root','Wild Ignition','Alpine Kindle'],
  mood:      ['Rose Return','First Warmth','Saffron Lift','Heart Reweave','Violet Sun','Peach Field'],
  cognitive: ['Clear Meridian','First Light','Ash Compass','Bright Root','Ivory Ridge','Pine Signal'],
  hormones:  ['Moon Loom','Cycle Weave','Vitex Tide','Red Thread','Iron Bloom','Silver Cycle'],
  digestion: ['Bitter Root','Green Ferment','Warm Belly','Fennel Field','Yellow Spring','Gentle Ash'],
  immunity:  ['Chaga Shield','Astragalus Wall','Elder Fortress','Fir Guard','Root Sentinel','Inner Iron'],
  pain:      ['Cool Ash','Willow Ease','Turmeric Field','Devil\'s Claw','Green Ointment','Slow Release'],
  detox:     ['Silver Clearance','Milk Thistle','Green Reset','Bile Flow','River Clean','Dandelion Rise'],
  beauty:    ['Rose Skin','Tremella Dew','Silica Gleam','Collagen Field','Amber Radiance','Peach Glow'],
};

// djb2 hash — cheap, well-distributed, deterministic. Seeds pickName
// so two people with different answers but similar-length JSON never
// collide on the same name.
function hashAnswers(a) {
  const stable = JSON.stringify({
    intention:  a.intention || '',
    intentions: Array.isArray(a.intentions) ? a.intentions.slice(0, 3) : [],
    pattern:   a.pattern   || '',
    patternSub:a.patternSub|| '',
    time:      a.time      || '',
    stress:    a.stress    || '',
    avoid:     Array.isArray(a.avoid) ? [...a.avoid].sort() : (a.avoid || ''),
    duration:  a.duration  || '',
    age:       a.age       || '',
    sleep:     a.sleep     || '',
    notes:     (a.notes    || '').trim().toLowerCase(),
  });
  let h = 5381;
  for (let i = 0; i < stable.length; i++) h = ((h << 5) + h + stable.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickName(profile) {
  const intention = profile && profile.intention;
  const bank = NAME_TEMPLATES[intention] || NAME_TEMPLATES.stress;
  const seed = hashAnswers(profile);
  return bank[seed % bank.length];
}

module.exports = { NAME_TEMPLATES, hashAnswers, pickName };

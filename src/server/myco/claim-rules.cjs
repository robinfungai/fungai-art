// src/server/myco/claim-rules.cjs
//
// ONE source of truth for what counts as a medicinal claim. Used by:
//
//   scripts/check-claims.cjs        — scans the site before we publish
//   src/server/myco/claims-guard    — scrubs MYCO's live replies
//   tests/claims-verify.cjs         — proves both still work
//
// Keeping these in one file matters: a rule that exists in the scanner
// but not in the guard means MYCO can say in a chat what we would never
// print on a page. See docs/claims-policy.md for the human version.

const DISEASES = 'anxiety|depression|insomnia|adhd|ptsd|ocd|bipolar|schizophrenia|arthritis|diabetes|hypertension|cancer|tumou?rs?|epilepsy|ibs|crohn|colitis|fibromyalgia|autoimmune|thyroid disease|dementia|alzheimer|parkinson|copd|asthma|migraine|chronic pain|infections?|covid|influenza|herpes|candida|ulcers?|eczema|psoriasis|menopause|osteoporosis|anaemia|anemia';

// level: BLOCKER — medicinal claim; never allowed on any customer-facing
//                  surface, and stripped from MYCO's replies.
//        WARN    — implies a medicinal effect; rewrite before publishing.
//        NOTE    — names a disease; fine in safety copy and editorial,
//                  wrong on a product surface.
const RULES = [
  { id: 'cure',        level: 'BLOCKER', re: () => new RegExp(`\\b(cures?|curing|heals?|healing|treats?|treating|reverses?|eliminates?|eradicates?)\\s+(?:your\\s+|the\\s+)?(${DISEASES})\\b`, 'gi'),
    why: 'Direct treatment/cure claim — makes the product a medicinal product by presentation.' },
  { id: 'prevent',     level: 'BLOCKER', re: () => new RegExp(`\\b(prevents?|preventing|protects? against|wards? off|stops?)\\s+(?:your\\s+|the\\s+)?(${DISEASES})\\b`, 'gi'),
    why: 'Disease-prevention claim — prohibited for foods and supplements (Reg. 1924/2006 Art. 2).' },
  { id: 'kills',       level: 'BLOCKER', re: () => /\b(kills?|destroys?|wipes? out)\s+(cancer|tumou?rs?|viruses|bacteria|pathogens|parasites|candida)\b/gi,
    why: 'Anti-disease action claim — medicinal, and in the cancer case criminal in several member states.' },
  { id: 'replace_med', level: 'BLOCKER', re: () => /\b(replaces?|instead of|substitute for|alternative to)\s+(your\s+)?(medication|medicine|antidepressants?|prescriptions?|antibiotics?|hrt|the pill)\b/gi,
    why: 'Tells a person to change prescribed treatment. Medicinal claim and a safety risk.' },
  { id: 'may_treat',   level: 'BLOCKER', re: () => new RegExp(`\\b(may|might|can|could|helps?( to)?)\\s+(help\\s+)?(treat|cure|heal|relieve|alleviate|remedy)\\s+(?:your\\s+|the\\s+)?(${DISEASES})\\b`, 'gi'),
    why: 'Hedging does not remove a medicinal claim — "may help treat X" is still a claim to treat X.' },
  { id: 'diagnose',    level: 'BLOCKER', re: () => /\byou\s+(have|suffer from|are suffering from|show signs of)\s+(?:an?\s+)?[a-z ]{0,20}(anxiety|depression|insomnia|adrenal fatigue|hormonal imbalance|leaky gut|thyroid)/gi,
    why: 'Diagnosis. Only a clinician may diagnose.' },
  { id: 'detox_organ', level: 'WARN',    re: () => /\b(detoxifies?|detoxify|cleanses?|flushes?|purges?)\s+(your\s+)?(liver|kidneys?|blood|body|colon|lymph)\b/gi,
    why: '"Detoxifies the liver" is an unauthorised health claim in the EU.' },
  { id: 'boosts',      level: 'WARN',    re: () => /\b(boosts?|strengthens?|enhances?|supercharges?)\s+(your\s+)?(immune system|immunity|metabolism)\b/gi,
    why: 'Unauthorised health claim wording. Only authorised phrasing for a specific nutrient is permitted.' },
  { id: 'proven',      level: 'WARN',    re: () => /\b(clinically|scientifically|medically)\s+(proven|validated|guaranteed)\b/gi,
    why: 'Efficacy claim requiring authorisation and evidence held on file.' },
  { id: 'guarantee',   level: 'WARN',    re: () => /\b(guaranteed results|guarantees? to|will definitely|100% effective)\b/gi,
    why: 'Absolute efficacy promise — also an unfair commercial practice.' },
  { id: 'dose_for',    level: 'WARN',    re: () => new RegExp(`\\b(take|dose|dosage of)\\s+[^.;\\n]{0,40}\\s+(for|to treat)\\s+(${DISEASES})\\b`, 'gi'),
    why: 'Posology tied to a disease — a hallmark of a medicinal product.' },
  { id: 'disease_name', level: 'NOTE',   re: () => new RegExp(`\\b(${DISEASES})\\b`, 'gi'),
    why: 'Names a disease. Fine in safety copy and in editorial that reports literature; wrong on a product surface.' },
];

// Safety copy naming a condition is the opposite of a claim — leaving it
// out would be the real failure. Recognised by the surrounding sentence.
const SAFETY_CONTEXT = /contraindicat|caution|avoid|do not|don't|discuss with|consult|monitor|interaction|speak to|see a (clinician|doctor)|not suitable|risk|pregnan|breastfeed|medication|prescri/i;

function rulesOf(level) {
  return RULES.filter(r => r.level === level);
}

module.exports = { DISEASES, RULES, SAFETY_CONTEXT, rulesOf };

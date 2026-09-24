// tests/myco-verbatim-verify.cjs — npm run test:myco-verbatim
//
// verifyAnswer() and verifyVerbatimNumbers() in src/server/myco/grounding.cjs.
//
// THE LOOPHOLE THIS CLOSES. verifyAnswer used to strip an invented
// citation tag and keep the sentence. A model that hallucinated [K99]
// had its tag quietly removed and its unsupported claim delivered as
// ordinary prose — the stripping made the answer look MORE authoritative,
// because nothing was left to mark it unsourced.
//
// AND THE ONE NOBODY WAS CHECKING. A wrong NUMBER inside a correctly
// cited sentence was never verified at all. "Macerate at 60°C for 24
// hours [K1]" against a chunk saying 40°C and 8 hours read as fully
// sourced. That is the class of error that burns a batch, or a person.
const g = require('../src/server/myco/grounding.cjs');
let p = 0, f = 0;
const ok  = (n,d) => { p++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad = (n,d) => { f++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };

const S = [
  { ref:'K1', id:'a', title:'Reishi', type:'preparation', label:'Preparation',
    source:'m.md', score:9,
    text:'Double extraction on Ganoderma lucidum: 1:5 in 60% ethanol for fourteen '
       + 'days, then a four-hour decoction at 90°C. Typical dose 500 mg twice daily.' },
  { ref:'K2', id:'b', title:'Safety', type:'safety', label:'Safety',
    source:'s.md', score:7,
    text:'Avoid with anticoagulants. No human data above 3 g per day.' },
];

console.log('\n── the stripping loophole ──');
let r = g.verifyAnswer('Reishi is a potent immune cure [K99]. Double extraction uses 1:5 in 60% ethanol [K1].', S);
!/potent immune cure/.test(r.text) ? ok('fabricated-citation sentence REMOVED', 'not just de-tagged') : bad('sentence removed', r.text);
/1:5/.test(r.text)                 ? ok('the properly cited sentence survives')                        : bad('valid sentence kept', r.text);
r.verificationFlags.includes('fabricated_citation') ? ok('flag: fabricated_citation')                  : bad('flag', JSON.stringify(r.verificationFlags));
r.invalidRefs.includes('K99')      ? ok('invalidRefs still reports K99')                               : bad('invalidRefs', r.invalidRefs);

console.log('\n── fail closed when NOTHING survives ──');
r = g.verifyAnswer('Reishi cures cancer [K99]. It also reverses ageing [K42].', S);
r.refused === true                        ? ok('refused = true')            : bad('refused', r.refused);
/Insufficient verified evidence/.test(r.text) ? ok('refusal copy returned') : bad('refusal copy', r.text);
r.confidence === 0                        ? ok('confidence forced to 0')    : bad('confidence', r.confidence);
r.citations.length === 0                  ? ok('no citations on a refusal') : bad('citations', r.citations.length);

console.log('\n── verbatim numbers ──');
r = g.verifyAnswer('Decoct at 90°C for four hours [K1].', S);
/Decoct/.test(r.text) ? ok('90°C IS in the chunk → kept') : bad('kept', JSON.stringify(r.droppedClaims));
r = g.verifyAnswer('Macerate at 60°C [K1].', S);
!/Macerate/.test(r.text) ? ok('60°C is NOT (60 is the ethanol %) → dropped', 'not fooled by the digits appearing elsewhere') : bad('dropped');
r = g.verifyAnswer('Macerate at 40°C and dose 900 mg daily [K1].', S);
r.verificationFlags.includes('verbatim_number_mismatch') ? ok('flag: verbatim_number_mismatch') : bad('flag', JSON.stringify(r.verificationFlags));
(r.droppedClaims[0].missing || []).length ? ok('names which numbers were missing', JSON.stringify(r.droppedClaims[0].missing)) : bad('missing list');

console.log('\n── formatting is not a mismatch ──');
['500mg','500 mg','90 °C','1:5','60%','3 g'].forEach(v => {
  const x = g.verifyVerbatimNumbers('Dose is ' + v + ' here.', S[0].text + ' ' + S[1].text);
  x.ok ? ok('accepts "' + v + '"') : bad('accepts "' + v + '"', JSON.stringify(x.missing));
});

console.log('\n── citation markers are not numbers ──');
const x = g.verifyVerbatimNumbers('Reishi is traditional [K1, K2].', S[0].text);
x.checked.length === 0 ? ok('[K1, K2] yields no numeric tokens') : bad('checked', JSON.stringify(x.checked));

console.log('\n── no chunk text reaches the client ──');
r = g.verifyAnswer('Double extraction uses 1:5 in 60% ethanol [K1].', S);
(r.citations.length && r.citations.every(c => c.text === undefined)) ? ok('citations carry no chunk body') : bad('LEAK: chunk text in citations');
r.citations[0].title === 'Reishi' ? ok('metadata preserved', 'title, type, source, score') : bad('metadata');

console.log('\n  passed: ' + p + '   failed: ' + f);
process.exit(f ? 1 : 0);

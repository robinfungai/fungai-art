/* ════════════════════════════════════════════════════════════════
   The Alchemist's Lexicon — 100 terms of the extraction lab
   ────────────────────────────────────────────────────────────────
   One list, shown in two places (Robin, 2026-09-27):
     · /extraction — open, at the foot of the page, with a filter;
     · /community/academy/ — the same list behind a "show" arrow.
   Edit the terms HERE; both pages read this file, so they can never
   disagree.

   Plain words for the words that trip people up. Definitions describe
   what a thing IS or what a process DOES — never what a plant treats.
   Our house extraction ratio is 1:3 (see "Extraction ratio").

   Usage:
     <div id="lexicon"></div>
     <script src="/alchemy-lexicon.js"></script>
     <script>AlchemyLexicon.render(document.getElementById('lexicon'));</script>
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var TERMS = [
    // ── Methods & processes ─────────────────────────────────────
    ['Methods', 'Maceration', 'Soaking plant material in a liquid at room temperature for days or weeks, so its compounds slowly dissolve out. The basis of a cold extract. "To macerate" is to do this.'],
    ['Methods', 'Percolation', 'Letting solvent drip slowly through a packed column of ground herb, so fresh liquid keeps meeting the plant. Faster and more complete than soaking.'],
    ['Methods', 'Decoction', 'Simmering hard material — roots, bark, seeds, mushrooms — in water to break open tough cell walls and draw out what only heat and water can reach.'],
    ['Methods', 'Infusion', 'Steeping soft parts (leaves, flowers) in hot water, like tea. Gentler than a decoction, kinder to delicate aromatics.'],
    ['Methods', 'Cold infusion', 'Steeping in cool water for hours instead of minutes. Keeps scent and slippery mucilage that heat would drive off or change.'],
    ['Methods', 'Double extraction', 'Two extractions of the same material — one hot water, one alcohol — combined at the end. Each solvent reaches a different part of the chemistry. Standard for medicinal mushrooms.'],
    ['Methods', 'Digestion', 'In alchemy: keeping a mixture at gentle, steady warmth (around body heat) for a period, to deepen and speed an extraction.'],
    ['Methods', 'Distillation', 'Heating a liquid until part of it turns to vapour, then cooling that vapour back to liquid in a separate vessel. Separates substances by their boiling points.'],
    ['Methods', 'Steam distillation', 'Passing steam through plant material to carry its essential oil away. On cooling, the oil floats apart from the water, which becomes a hydrosol.'],
    ['Methods', 'Rectification', 'Distilling a liquid a second time to purify it — for example to make an alcohol stronger and cleaner.'],
    ['Methods', 'Evaporation', 'Letting liquid turn to vapour and leave. Used to concentrate what remains; low heat or a vacuum protects fragile compounds.'],
    ['Methods', 'Reduction', 'Gently evaporating part of the solvent from an extract so each millilitre carries more of the plant.'],
    ['Methods', 'Cohobation', 'Pouring a distillate back over its own residue and distilling again, several times — a classical way of "marrying" a preparation.'],
    ['Methods', 'Calcination', 'Burning spent plant material to a white ash to recover its mineral salts — a step of the spagyric method.'],
    ['Methods', 'Lixiviation', 'Washing the soluble salts out of an ash with water, then evaporating the water to collect them. How spagyric salts are cleaned.'],
    ['Methods', 'Sublimation', 'A solid turning straight into vapour and back into a solid without ever becoming liquid. Used to purify some substances, such as camphor.'],
    ['Methods', 'Filtration', 'Passing a liquid through paper, cloth or a membrane to hold back particles.'],
    ['Methods', 'Decanting', 'Pouring a clear liquid off slowly, leaving the sediment behind in the vessel.'],
    ['Methods', 'Pressing', 'Squeezing the soaked plant (the marc) through cloth or a press to recover the extract it still holds — often a large share of the yield.'],
    ['Methods', 'Fermentation', 'Yeasts or bacteria transforming sugars and other compounds — making alcohol, acids, or changing a plant’s chemistry.'],
    ['Methods', 'Putrefaction', 'In alchemy, the dark first stage: letting matter break down (rot or ferment) before it can be renewed.'],
    ['Methods', 'Crystallisation', 'A dissolved substance coming out of solution as ordered crystals, as the liquid cools or evaporates.'],
    ['Methods', 'Precipitation', 'A solid forming and settling out of a liquid — for example when alcohol strength or pH changes.'],
    ['Methods', 'Decarboxylation', 'A chemical change, usually driven by heat or time, in which a molecule loses a carbon-dioxide group. It is how ibotenic acid becomes muscimol, or THCA becomes THC.'],
    ['Methods', 'Comminution', 'Cutting or grinding plant material to a chosen size before extraction. Finer means faster extraction; too fine clogs a percolator.'],
    ['Methods', 'Reflux', 'Boiling a liquid under a condenser so the vapour runs straight back as liquid — long heating without losing solvent.'],
    ['Methods', 'Supercritical CO₂', 'Carbon dioxide under high pressure behaves like both a gas and a liquid, and becomes a clean solvent for oils and resins. Leaves no residue.'],

    // ── Solvents & ratios ───────────────────────────────────────
    ['Solvents & ratios', 'Menstruum', 'The liquid used to extract a plant — water, alcohol, glycerin, vinegar, oil, or a mix of them.'],
    ['Solvents & ratios', 'Marc', 'The spent plant material left after extraction and pressing. In spagyrics it is calcined, not thrown away.'],
    ['Solvents & ratios', 'Solvent', 'Any liquid that dissolves other substances. Each solvent pulls out a different part of a plant’s chemistry.'],
    ['Solvents & ratios', 'Polarity', 'How unevenly a molecule carries its charge. "Like dissolves like": water takes polar compounds, alcohol reaches less polar ones, oil takes the fat-soluble.'],
    ['Solvents & ratios', 'Aqueous extract', 'An extract made with water as the solvent — a tea, infusion or decoction.'],
    ['Solvents & ratios', 'Hydroalcoholic', 'A solvent of water and alcohol mixed. The percentage of alcohol decides which compounds come out.'],
    ['Solvents & ratios', 'Ethanol', 'Drinking alcohol. The most common extraction solvent, and a preservative once the finished extract holds roughly 20–25% or more.'],
    ['Solvents & ratios', 'ABV', 'Alcohol by volume — the percentage of a liquid that is ethanol. A typical vodka is 40% ABV.'],
    ['Solvents & ratios', 'Proof', 'An older scale of alcohol strength. In the US, proof is twice the ABV: 80 proof is 40%.'],
    ['Solvents & ratios', 'Extraction ratio', 'Weight of plant to volume of solvent. 1:3 means 100 g of plant to 300 ml of liquid — our house standard at Fungai Art.'],
    ['Solvents & ratios', 'Weight to volume (w/v)', 'The usual way a ratio is written: grams of plant per millilitre of solvent.'],
    ['Solvents & ratios', 'Drug-to-extract ratio', 'How much raw plant went into a unit of finished extract after concentrating it. 4:1 means four parts herb became one part extract.'],
    ['Solvents & ratios', 'Fresh vs dried weight', 'Fresh plants are mostly water, so their water dilutes the alcohol; dried plants drink up solvent. Both change how a ratio behaves.'],
    ['Solvents & ratios', 'Final alcohol strength', 'The alcohol percentage of the finished extract after any water or decoction is mixed in. It must stay high enough to keep the extract from spoiling.'],
    ['Solvents & ratios', 'Glycerite', 'An extract made with vegetable glycerin instead of alcohol. Sweet and alcohol-free, but weaker for some compounds.'],
    ['Solvents & ratios', 'Acetum', 'A vinegar extract. The acid in vinegar is good at drawing out minerals and alkaloids.'],

    // ── Preparations ────────────────────────────────────────────
    ['Preparations', 'Extract', 'The concentrated liquid drawn from a plant with a solvent. On this site, "extract" is the finished liquid in the bottle.'],
    ['Preparations', 'Tincture', 'The traditional name for an alcohol extract of a plant.'],
    ['Preparations', 'Elixir', 'Historically a sweetened alcoholic preparation; in alchemy, the perfected medicine the work aims at.'],
    ['Preparations', 'Spagyric', 'Paracelsus’s method: separate a plant into its alcohol, its oil and its mineral salt — spirit, soul and body — purify each, then bring them back together.'],
    ['Preparations', 'Syrup', 'A preparation thickened and preserved by a high share of sugar or honey.'],
    ['Preparations', 'Oxymel', 'Vinegar and honey together, often with herbs steeped in them. An old way to carry bitter plants.'],
    ['Preparations', 'Infused oil', 'Plant material steeped in a carrier oil, often with gentle warmth, so the oil takes up fat-soluble compounds.'],
    ['Preparations', 'Salve', 'An infused oil thickened with wax, for the skin.'],
    ['Preparations', 'Hydrosol', 'The fragrant water left after steam distillation, holding traces of essential oil. Also called a floral water.'],
    ['Preparations', 'Essential oil', 'A plant’s concentrated, evaporating aromatic oil, usually won by steam distillation or pressing. Very potent; used in drops.'],
    ['Preparations', 'Oleoresin', 'A natural mix of resin and essential oil, as in frankincense — or an extract that captures both.'],
    ['Preparations', 'Isolate', 'A single compound purified out of a plant, such as pure menthol, rather than the plant’s whole chemistry.'],
    ['Preparations', 'Full-spectrum extract', 'An extract that keeps the broad range of a plant’s compounds instead of one isolated molecule.'],
    ['Preparations', 'Standardised extract', 'An extract adjusted to hold a fixed amount of a chosen marker compound, batch after batch.'],
    ['Preparations', 'Derivative', 'A compound made by chemically changing another one; more loosely, anything made from a raw material.'],

    // ── Plant chemistry ─────────────────────────────────────────
    ['Plant chemistry', 'Constituent', 'Any single chemical component of a plant.'],
    ['Plant chemistry', 'Phytochemical', 'A chemical made by a plant — often for defence, colour or scent.'],
    ['Plant chemistry', 'Secondary metabolites', 'The specialised compounds a plant makes beyond what it needs to live — alkaloids, terpenes, polyphenols. They give each herb its character.'],
    ['Plant chemistry', 'Polysaccharides', 'Long chains of sugar molecules. In mushrooms and many roots they dissolve in water, so they come out in a long hot decoction, not in alcohol.'],
    ['Plant chemistry', 'Beta-glucans', 'A family of polysaccharides in mushroom cell walls, oats and yeast. Water-soluble, and widely studied.'],
    ['Plant chemistry', 'Alkaloids', 'Nitrogen-containing plant compounds, often bitter and physiologically strong — caffeine, berberine and nicotine are alkaloids. Many dissolve well in alcohol or acid.'],
    ['Plant chemistry', 'Terpenes', 'The aromatic compounds behind most plant scents — limonene in citrus, pinene in pine. The building blocks of essential oils and resins.'],
    ['Plant chemistry', 'Triterpenes', 'Larger terpene compounds, such as the bitter ganoderic acids of reishi. Alcohol-soluble — the reason mushrooms get a second, alcohol extraction.'],
    ['Plant chemistry', 'Flavonoids', 'Plant pigments — yellows, reds, blues — found in flowers, berries and tea. A branch of the polyphenols.'],
    ['Plant chemistry', 'Polyphenols', 'A large family of plant compounds built from ring structures, including flavonoids and tannins.'],
    ['Plant chemistry', 'Tannins', 'Astringent polyphenols that make the mouth feel dry — in tea, oak bark and pomegranate peel. They bind to proteins.'],
    ['Plant chemistry', 'Saponins', 'Compounds that foam when shaken in water, like soapwort, or the ginsenosides of ginseng.'],
    ['Plant chemistry', 'Glycosides', 'A molecule joined to a sugar. The sugar changes how it dissolves and when it becomes active.'],
    ['Plant chemistry', 'Mucilage', 'Slippery, gel-forming plant sugars, as in marshmallow root, slippery elm and flax. Best drawn out in cold water.'],
    ['Plant chemistry', 'Volatile oils', 'Aromatic compounds that evaporate easily — lost to high heat or a long open boil. Cover the pot.'],
    ['Plant chemistry', 'Resin', 'The sticky exudate of trees such as pine or frankincense. It does not dissolve in water; high-proof alcohol or oil takes it up.'],
    ['Plant chemistry', 'Sterols', 'Plant and fungal compounds related to cholesterol in structure, such as ergosterol in mushrooms.'],
    ['Plant chemistry', 'Bioavailability', 'How much of a compound actually reaches the bloodstream once taken. Preparation can change it a great deal.'],
    ['Plant chemistry', 'Solubility', 'How readily a compound dissolves in a given solvent. The whole art of extraction is matching solvent to solubility.'],
    ['Plant chemistry', 'pH', 'A scale from 0 to 14 for acidity: below 7 is acidic, above 7 alkaline. It affects which compounds dissolve and how long they stay stable.'],

    // ── Fungi ───────────────────────────────────────────────────
    ['Fungi', 'Fruiting body', 'The mushroom itself — the part of a fungus that rises above ground to release spores.'],
    ['Fungi', 'Mycelium', 'The web of fine fungal threads that runs through soil or wood. It is the main body of the fungus; the mushroom is only its fruit.'],
    ['Fungi', 'Hyphae', 'The single threads that together make up mycelium.'],
    ['Fungi', 'Spore', 'The microscopic reproductive cell of a fungus, released from its gills or pores.'],
    ['Fungi', 'Chitin', 'The tough material of fungal cell walls (also of insect shells). It needs heat and time to break open, which is why mushrooms are decocted.'],
    ['Fungi', 'Conk', 'A hard, shelf-like fungal body growing on wood — chaga and tinder fungus are conks.'],
    ['Fungi', 'Substrate', 'What a fungus grows on — wood, grain, soil. It shapes what the fungus contains.'],
    ['Fungi', 'Ergosterol', 'The main sterol of fungal cell membranes. Under ultraviolet light it turns into vitamin D2.'],

    // ── Tools & measurement ─────────────────────────────────────
    ['Tools & measurement', 'pH meter', 'An instrument that reads pH as a precise number. Test strips give a rougher reading by colour.'],
    ['Tools & measurement', 'Alcoholmeter', 'A floating glass gauge that reads alcohol strength from a liquid’s density. Its cousin, the hydrometer, reads sugar.'],
    ['Tools & measurement', 'Refractometer', 'Measures how a liquid bends light, which gives its sugar content in °Brix.'],
    ['Tools & measurement', 'Specific gravity', 'A liquid’s density compared with water. It falls as alcohol rises and climbs with sugar.'],
    ['Tools & measurement', 'Amber glass', 'Brown glass that blocks most ultraviolet light, protecting light-sensitive extracts.'],
    ['Tools & measurement', 'Bain-marie', 'A water bath for gentle, even heat. Named after Mary the Jewess, one of the earliest alchemists.'],
    ['Tools & measurement', 'Alembic', 'The classical still: a pot, a head that gathers the vapour, and a spout that leads it away to condense.'],
    ['Tools & measurement', 'Condenser', 'The cooled tube in which vapour turns back into liquid during distillation.'],
    ['Tools & measurement', 'Rotary evaporator', 'A lab device that removes solvent under vacuum at low temperature, sparing delicate compounds.'],

    // ── The alchemical tradition ────────────────────────────────
    ['The alchemical tradition', 'Tria prima', 'Paracelsus’s three principles of every substance: Sulphur (the soul — oils), Mercury (the spirit — alcohol) and Salt (the body — minerals).'],
    ['The alchemical tradition', 'Solve et coagula', '"Dissolve and bind": the alchemical rhythm of taking a thing apart and putting it back together in a purer form.'],
    ['The alchemical tradition', 'Quintessence', 'The "fifth essence" — the purified, concentrated heart of a substance.'],
    ['The alchemical tradition', 'Nigredo, albedo, rubedo', 'The three colour stages of the great work: blackening (breaking down), whitening (purifying), reddening (completion).'],
    ['The alchemical tradition', 'Athanor', 'The alchemist’s slow, steady furnace, built to hold a gentle heat for days.'],
  ];

  var CSS =
    '.lex{--lex-accent:#E8B14B;--lex-text:#C9B894;--lex-strong:#E6D9B5;--lex-dim:#8B7E62;--lex-rule:rgba(201,184,148,.14)}' +
    '.lex-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 18px}' +
    '.lex-search{flex:1 1 220px;min-width:0;background:rgba(10,12,9,.6);border:.5px solid rgba(232,177,75,.28);border-radius:999px;padding:9px 16px;color:var(--lex-strong);font:inherit;font-size:14px;outline:none}' +
    '.lex-search:focus{border-color:var(--lex-accent)}' +
    '.lex-chip{font-family:"Geist Mono",ui-monospace,monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:7px 12px;border-radius:999px;border:.5px solid var(--lex-rule);background:none;color:var(--lex-dim);cursor:pointer}' +
    '.lex-chip.on{color:var(--lex-accent);border-color:rgba(232,177,75,.5);background:rgba(232,177,75,.07)}' +
    '.lex-count{font-family:"Geist Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.1em;color:var(--lex-dim);margin-left:auto}' +
    '.lex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}' +
    '.lex-term{padding:14px 16px;border:.5px solid var(--lex-rule);border-radius:10px;background:rgba(10,12,9,.35)}' +
    '.lex-term dt{font-family:"Zodiak","Cormorant Garamond",Georgia,serif;font-style:italic;font-size:18px;color:var(--lex-strong);line-height:1.25}' +
    '.lex-term .lex-cat{display:block;font-family:"Geist Mono",ui-monospace,monospace;font-style:normal;font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--lex-dim);margin-top:4px}' +
    '.lex-term dd{margin:8px 0 0;font-size:14px;line-height:1.6;color:var(--lex-text)}' +
    '.lex-empty{color:var(--lex-dim);font-style:italic}';

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render(host, opts) {
    if (!host) return;
    opts = opts || {};
    if (!document.getElementById('lex-css')) {
      var st = document.createElement('style'); st.id = 'lex-css'; st.textContent = CSS; document.head.appendChild(st);
    }
    var cats = [];
    TERMS.forEach(function (t) { if (cats.indexOf(t[0]) < 0) cats.push(t[0]); });
    var state = { q: '', cat: 'All' };
    host.classList.add('lex');
    host.innerHTML =
      '<div class="lex-tools">' +
        '<input class="lex-search" type="search" placeholder="Find a term…" aria-label="Find a term">' +
        ['All'].concat(cats).map(function (c) { return '<button type="button" class="lex-chip' + (c === 'All' ? ' on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>'; }).join('') +
        '<span class="lex-count"></span>' +
      '</div>' +
      '<dl class="lex-grid"></dl>';
    var grid = host.querySelector('.lex-grid'), count = host.querySelector('.lex-count');
    function draw() {
      var q = state.q.trim().toLowerCase();
      var list = TERMS.filter(function (t) {
        if (state.cat !== 'All' && t[0] !== state.cat) return false;
        return !q || (t[1] + ' ' + t[2]).toLowerCase().indexOf(q) >= 0;
      });
      count.textContent = list.length + ' of ' + TERMS.length;
      grid.innerHTML = list.length
        ? list.map(function (t) {
            return '<div class="lex-term"><dt>' + esc(t[1]) + '<span class="lex-cat">' + esc(t[0]) + '</span></dt><dd>' + esc(t[2]) + '</dd></div>';
          }).join('')
        : '<p class="lex-empty">No term matches that.</p>';
    }
    host.querySelector('.lex-search').addEventListener('input', function (e) { state.q = e.target.value; draw(); });
    host.querySelectorAll('.lex-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cat = b.getAttribute('data-cat');
        host.querySelectorAll('.lex-chip').forEach(function (x) { x.classList.toggle('on', x === b); });
        draw();
      });
    });
    draw();
  }

  window.AlchemyLexicon = { TERMS: TERMS, count: TERMS.length, render: render };
})();

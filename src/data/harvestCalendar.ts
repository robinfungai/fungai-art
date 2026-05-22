// Swedish foraging harvest calendar — sourced from skogsskafferiet.se/skordetider/
// Maps each month (1-12) to harvestable plants/fungi/berries in Sweden
// Swedish name → { english, latin, type, parts }

export type PlantType = 'plant' | 'fungi' | 'berry' | 'tree' | 'seaweed';

export interface HarvestEntry {
  sv: string;         // Swedish name
  en: string;         // English name
  latin?: string;     // Latin binomial
  type: PlantType;
  parts?: string;     // Which parts to harvest
  note?: string;      // Brief note
}

export const HARVEST_PLANTS: Record<string, HarvestEntry> = {
  'Tall':           { sv:'Tall',           en:'Scots Pine',          latin:'Pinus sylvestris',         type:'tree',   parts:'needles, pollen, shoots, bark, resin', note:'Needles year-round; pollen May; shoots May–Jun; inner bark spring' },
  'Björk':          { sv:'Björk',          en:'Birch',               latin:'Betula pendula',           type:'tree',   parts:'sap (spring), leaves, catkins, bark fungi' },
  'Lind':           { sv:'Lind',           en:'Linden / Lime',       latin:'Tilia cordata',            type:'tree',   parts:'flowers, young leaves', note:'Flowers June–July. Sedative, respiratory' },
  'Rönn':           { sv:'Rönn',           en:'Rowan',               latin:'Sorbus aucuparia',         type:'tree',   parts:'berries (after frost)', note:'Cook only — raw mildly toxic' },
  'Skogslönn':      { sv:'Skogslönn',      en:'Maple',               latin:'Acer platanoides',         type:'tree',   parts:'sap (early spring), young leaves' },
  'Hägg':           { sv:'Hägg',           en:'Bird Cherry',         latin:'Prunus padus',             type:'tree',   parts:'flowers, berries (bitter, small quantities)' },
  'Bok':            { sv:'Bok',            en:'Beech',               latin:'Fagus sylvatica',          type:'tree',   parts:'beechnuts (autumn), young leaves (spring)' },
  'Gran':           { sv:'Gran',           en:'Norway Spruce',       latin:'Picea abies',              type:'tree',   parts:'young shoots, needles, resin' },
  'Skogsek':        { sv:'Skogsek',        en:'Oak',                 latin:'Quercus robur',            type:'tree',   parts:'acorns (leached), oak galls (tannin)' },
  'Hassel':         { sv:'Hassel',         en:'Hazel',               latin:'Corylus avellana',         type:'tree',   parts:'hazelnuts (August–October)' },
  'Oxel':           { sv:'Oxel',           en:'Swedish Whitebeam',   latin:'Sorbus intermedia',        type:'tree',   parts:'berries (autumn)' },
  'Syren':          { sv:'Syren',          en:'Lilac',               latin:'Syringa vulgaris',         type:'plant',  parts:'flowers (edible, decorative)', note:'May' },

  'Brännässla':     { sv:'Brännässla',     en:'Stinging Nettle',     latin:'Urtica dioica',            type:'plant',  parts:'young tops (spring), leaves, seeds', note:'Rich in iron, silica, protein' },
  'Maskros':        { sv:'Maskros',        en:'Dandelion',            latin:'Taraxacum officinale',     type:'plant',  parts:'leaves, flowers, root', note:'Year-round; root best autumn' },
  'Ramslök':        { sv:'Ramslök',        en:'Wild Garlic / Ramsons',latin:'Allium ursinum',          type:'plant',  parts:'leaves, flowers, bulbs', note:'Beech forest floors April–May. Brief season' },
  'Kirskål':        { sv:'Kirskål',        en:'Ground Elder',         latin:'Aegopodium podagraria',   type:'plant',  parts:'young leaves (spring)', note:'Medieval gout remedy; invasive garden weed' },
  'Hundkäx':        { sv:'Hundkäx',        en:'Cow Parsley',          latin:'Anthriscus sylvestris',   type:'plant',  parts:'young leaves (spring ONLY — do not confuse with hemlock)', note:'⚠ ID carefully' },
  'Jordreva':       { sv:'Jordreva',       en:'Ground Ivy',           latin:'Glechoma hederacea',      type:'plant',  parts:'leaves, stems', note:'Bitter; respiratory; traditional brewing herb' },
  'Röllika':        { sv:'Röllika',        en:'Yarrow',               latin:'Achillea millefolium',     type:'plant',  parts:'flowers, leaves', note:'Harvest when blooming June–Sept' },
  'Älggräs':        { sv:'Älggräs',        en:'Meadowsweet',          latin:'Filipendula ulmaria',     type:'plant',  parts:'flowers, leaves', note:'Anti-inflammatory; wetlands June–August' },
  'Mjölke':         { sv:'Mjölke',         en:'Fireweed',             latin:'Chamaenerion angustifolium',type:'plant',parts:'young shoots, leaves, flowers', note:'Clearcuts; young shoots edible like asparagus' },
  'Kvanne':         { sv:'Kvanne',         en:'Angelica',             latin:'Angelica archangelica',   type:'plant',  parts:'stems, seeds, root', note:'⚠ Resemble hemlock — ID precisely' },
  'Harsyra':        { sv:'Harsyra',        en:'Wood Sorrel',          latin:'Oxalis acetosella',       type:'plant',  parts:'leaves, flowers', note:'Sour, oxalic acid — small quantities' },
  'Stensöta':       { sv:'Stensöta',       en:'Polypody Fern',        latin:'Polypodium vulgare',      type:'plant',  parts:'rhizome (sweet)', note:'Traditional Nordic sweetener' },
  'Mynta':          { sv:'Mynta',          en:'Mint',                 latin:'Mentha spp.',             type:'plant',  parts:'leaves', note:'Water mint most common in Sweden' },
  'Kamomill':       { sv:'Kamomill',       en:'Chamomile',            latin:'Matricaria chamomilla',   type:'plant',  parts:'flowers', note:'Roadsides and fields June–September' },
  'Snärjmåra':      { sv:'Snärjmåra',      en:'Cleavers / Goosegrass',latin:'Galium aparine',         type:'plant',  parts:'young shoots (spring)', note:'Lymphatic; fresh ONLY' },
  'Smultron':       { sv:'Smultron',       en:'Wild Strawberry',      latin:'Fragaria vesca',          type:'berry',  parts:'berries, leaves', note:'June–July; intense flavour' },
  'Pors':           { sv:'Pors',           en:'Bog Myrtle',           latin:'Myrica gale',             type:'plant',  parts:'leaves, catkins', note:'Traditional beer herb; avoid in pregnancy' },
  'Strätta':        { sv:'Strätta',        en:'Greater Water Parsnip', latin:'Sium latifolium',        type:'plant',  parts:'young leaves (coastal wetlands)', note:'⚠ Expert ID required' },
  'Gökärt':         { sv:'Gökärt',         en:'Meadow Vetchling',     latin:'Lathyrus pratensis',      type:'plant',  parts:'young shoots (small quantities)', note:'Seeds mildly toxic in quantity' },
  'Daggkåpa':       { sv:'Daggkåpa',       en:"Lady's Mantle",        latin:'Alchemilla vulgaris',     type:'plant',  parts:'leaves, flowers', note:'Astringent; women\'s herb' },
  'Renfana':        { sv:'Renfana',        en:'Tansy',                latin:'Tanacetum vulgare',       type:'plant',  parts:'flowers (small quantity only)', note:'⚠ Toxic in large amounts; traditional insect repellent' },
  'Kärleksört':     { sv:'Kärleksört',     en:'Orpine / Stonecrop',   latin:'Hylotelephium telephium', type:'plant',  parts:'young leaves (spring)', note:'Succulent; salads' },
  'Humleblomster':  { sv:'Humleblomster',  en:'Herb Bennet',          latin:'Geum urbanum',            type:'plant',  parts:'root (clove-scented)', note:'Root flavours liqueurs traditionally' },
  'Groblad':        { sv:'Groblad',        en:'Broadleaf Plantain',   latin:'Plantago major',          type:'plant',  parts:'leaves, seeds', note:'Nutritive; wound healing' },
  'Ormrot':         { sv:'Ormrot',         en:'Bistort',              latin:'Bistorta officinalis',     type:'plant',  parts:'young leaves, root', note:'Traditional Easter pudding herb in England' },
  'Lomme':          { sv:'Lomme',          en:"Shepherd's Purse",     latin:'Capsella bursa-pastoris', type:'plant',  parts:'leaves, seeds, root', note:'Year-round; haemostatic' },
  'Bergbräsma':     { sv:'Bergbräsma',     en:'Hairy Bittercress',    latin:'Cardamine hirsuta',       type:'plant',  parts:'young leaves', note:'Peppery; early spring' },
  'Löktrav':        { sv:'Löktrav',        en:'Garlic Mustard',       latin:'Alliaria petiolata',      type:'plant',  parts:'young leaves, flowers', note:'Garlic-flavoured; beech edges' },
  'Svinmålla':      { sv:'Svinmålla',      en:'Fat Hen',              latin:'Chenopodium album',       type:'plant',  parts:'young leaves', note:'Spinach substitute; nutritive' },
  'Knölklocka':     { sv:'Knölklocka',     en:'Clustered Bellflower', latin:'Campanula glomerata',     type:'plant',  parts:'young leaves', note:'Edible; meadows' },
  'Ljung':          { sv:'Ljung',          en:'Heather',              latin:'Calluna vulgaris',        type:'plant',  parts:'flowers, tips', note:'Traditional ale herb; anti-bacterial' },
  'Kummin':         { sv:'Kummin',         en:'Wild Caraway',         latin:'Carum carvi',             type:'plant',  parts:'seeds, young leaves', note:'Best autumn-harvested seeds' },
  'Palsternacka':   { sv:'Palsternacka',   en:'Wild Parsnip',         latin:'Pastinaca sativa',        type:'plant',  parts:'root (autumn)', note:'⚠ Sap causes photosensitivity burns — gloves' },
  'Kvickrot':       { sv:'Kvickrot',       en:'Couch Grass',          latin:'Elymus repens',           type:'plant',  parts:'rhizome', note:'Diuretic; traditional kidney herb' },
  'Viol':           { sv:'Viol',           en:'Violet',               latin:'Viola spp.',              type:'plant',  parts:'flowers, leaves', note:'Edible; decorative; mild respiratory use' },
  'Tusensköna':     { sv:'Tusensköna',     en:'Common Daisy',         latin:'Bellis perennis',         type:'plant',  parts:'flowers, young leaves', note:'Anti-inflammatory; wound herb' },
  'Våtarv':         { sv:'Våtarv',         en:'Common Chickweed',     latin:'Stellaria media',         type:'plant',  parts:'leaves, stems', note:'Year-round; cooling, anti-itch' },
  'Kråkbär':        { sv:'Kråkbär',        en:'Crowberry',            latin:'Empetrum nigrum',         type:'berry',  parts:'berries', note:'Year-round (persist through winter); arctic berry' },
  'Tranbär':        { sv:'Tranbär',        en:'Cranberry',            latin:'Vaccinium oxycoccos',     type:'berry',  parts:'berries', note:'Bogs — harvest October–February' },
  'Blåbär':         { sv:'Blåbär',         en:'Bilberry',             latin:'Vaccinium myrtillus',     type:'berry',  parts:'berries, leaves', note:'July–September; leaves medicinal year-round' },
  'Lingon':         { sv:'Lingon',         en:'Lingonberry',          latin:'Vaccinium vitis-idaea',   type:'berry',  parts:'berries', note:'August–October; leaves year-round' },
  'Hallon':         { sv:'Hallon',         en:'Raspberry',            latin:'Rubus idaeus',            type:'berry',  parts:'berries, leaves', note:'July–August; leaf tea year-round' },
  'Hjortron':       { sv:'Hjortron',       en:'Cloudberry',           latin:'Rubus chamaemorus',       type:'berry',  parts:'berries', note:'July–August only; northern Sweden and bogs' },
  'Nypon':          { sv:'Nypon',          en:'Rosehip',              latin:'Rosa canina',             type:'berry',  parts:'hips', note:'September–November; highest vitamin C' },
  'Havtorn':        { sv:'Havtorn',        en:'Sea Buckthorn',        latin:'Hippophae rhamnoides',    type:'berry',  parts:'berries', note:'August–February; coastal; vitamin C champion' },
  'Slånbär':        { sv:'Slånbär',        en:'Sloe',                 latin:'Prunus spinosa',          type:'berry',  parts:'berries (after frost)', note:'October–November; hedges' },
  'Aronia':         { sv:'Aronia',         en:'Aronia / Chokeberry',  latin:'Aronia melanocarpa',      type:'berry',  parts:'berries', note:'August–September; highest ORAC of any berry' },
  'Odon':           { sv:'Odon',           en:'Bog Bilberry',         latin:'Vaccinium uliginosum',    type:'berry',  parts:'berries', note:'August–September; bogs; larger than bilberry' },
  'Stenbär':        { sv:'Stenbär',        en:'Dewberry',             latin:'Rubus saxatilis',         type:'berry',  parts:'berries', note:'August; rocky forest; tart' },
  'Rönnbär':        { sv:'Rönnbär',        en:'Rowan Berry',          latin:'Sorbus aucuparia',        type:'berry',  parts:'berries (after frost only)', note:'Bitter raw; cook and use for jelly' },
  'Björnbär':       { sv:'Björnbär',       en:'Blackberry',           latin:'Rubus fruticosus',        type:'berry',  parts:'berries, leaves', note:'August–September; leaves for tannin tea' },
  'Krusbär':        { sv:'Krusbär',        en:'Gooseberry',           latin:'Ribes uva-crispa',        type:'berry',  parts:'berries', note:'Wild gooseberry; tart' },
  'Enbär':          { sv:'Enbär',          en:'Juniper Berry',        latin:'Juniperus communis',      type:'berry',  parts:'ripe dark berries (2-year berries only)', note:'October; diuretic, antimicrobial' },
  'Cikoria':        { sv:'Cikoria',        en:'Chicory',              latin:'Cichorium intybus',       type:'plant',  parts:'root (roasted coffee), leaves, flowers', note:'Dalarna and coastal Sweden; August–October' },
  'Ros':            { sv:'Ros',            en:'Wild Rose / Rosehip',  latin:'Rosa canina',             type:'plant',  parts:'hips (autumn), petals (summer)', note:'320 MHz biofrequency — highest of any plant' },
  'Äkta johannesört': { sv:'Äkta johannesört', en:"St. John's Wort", latin:'Hypericum perforatum',    type:'plant',  parts:'flowers (harvest solstice)', note:'Grade A evidence for mild depression; harvest midsummer' },
  'Fläder':         { sv:'Fläder',         en:'Elderflower',          latin:'Sambucus nigra',          type:'plant',  parts:'flowers (June), berries (August–September)', note:'Cold water infusion for flowers; cook berries' },

  // FUNGI
  'Kantarell':      { sv:'Kantarell',      en:'Chanterelle',          latin:'Cantharellus cibarius',   type:'fungi',  parts:'fruiting body', note:'June–October; conifer + birch forests' },
  'Karljohan':      { sv:'Karljohan',      en:'Porcini / Cep',        latin:'Boletus edulis',          type:'fungi',  parts:'fruiting body', note:'August–October; under spruce and pine' },
  'Trumpetsvamp':   { sv:'Trumpetsvamp',   en:'Black Trumpet',        latin:'Craterellus cornucopioides',type:'fungi',parts:'fruiting body', note:'August–October; deciduous forest floor' },
  'Ostronmussling': { sv:'Ostronmussling', en:'Oyster Mushroom',      latin:'Pleurotus ostreatus',     type:'fungi',  parts:'fruiting body', note:'On dead wood; autumn into winter' },
  'Lärksopp':       { sv:'Lärksopp',       en:'Larch Bolete',         latin:'Suillus grevillei',       type:'fungi',  parts:'fruiting body', note:'Under larch trees only; July–October' },
  'Smörsopp':       { sv:'Smörsopp',       en:'Slippery Jack',        latin:'Suillus luteus',          type:'fungi',  parts:'fruiting body (peel cap)', note:'Pine forests; July–November' },
  'Sandsopp':       { sv:'Sandsopp',       en:'Sandy Bolete',         latin:'Suillus variegatus',      type:'fungi',  parts:'fruiting body', note:'Dry pine heaths; July–October' },
  'Trattkantarell': { sv:'Trattkantarell', en:'Funnel Chanterelle',   latin:'Cantharellus tubaeformis',type:'fungi',  parts:'fruiting body', note:'September–November; misty forest' },
  'Blomkålssvamp':  { sv:'Blomkålssvamp',  en:'Cauliflower Fungus',   latin:'Sparassis crispa',        type:'fungi',  parts:'fruiting body', note:'At base of pine/fir; August–October' },
  'Brunsopp':       { sv:'Brunsopp',       en:'Bay Bolete',           latin:'Imleria badia',           type:'fungi',  parts:'fruiting body', note:'July–November; conifer forests' },
  'Strävsopp':      { sv:'Strävsopp',      en:'Rough Bolete',         latin:'Leccinum scabrum',        type:'fungi',  parts:'fruiting body', note:'Under birch; July–October' },
  'Sillkremla':     { sv:'Sillkremla',     en:'Herring Russula',      latin:'Russula xerampelina',     type:'fungi',  parts:'fruiting body', note:'Smells of shellfish when old' },
  'Mandelkremla':   { sv:'Mandelkremla',   en:'Almond Russula',       latin:'Russula grata',           type:'fungi',  parts:'fruiting body', note:'Smells of bitter almonds — cook well' },
  'Mandelriska':    { sv:'Mandelriska',    en:'Saffron Milk Cap',     latin:'Lactarius deliciosus',    type:'fungi',  parts:'fruiting body', note:'Orange milk when cut; excellent edible' },
  'Blodriska':      { sv:'Blodriska',      en:'Bleeding Milk Cap',    latin:'Lactarius deterrimus',    type:'fungi',  parts:'fruiting body', note:'Turns red when cut; under spruce' },
  'Stolt fjällskivling': { sv:'Stolt fjällskivling', en:'Parasol Mushroom', latin:'Macrolepiota procera', type:'fungi', parts:'cap only (cook)', note:'Meadows; August–October' },
  'Fårticka':       { sv:'Fårticka',       en:'Sheep Polypore',       latin:'Albatrellus ovinus',      type:'fungi',  parts:'fruiting body', note:'Pine forests; August–October' },

  // COASTAL / SEAWEED
  'Strandkål':      { sv:'Strandkål',      en:'Sea Kale',             latin:'Crambe maritima',         type:'plant',  parts:'young shoots (spring), leaves', note:'Coastal rocks; blanch shoots' },
  'Havssälting':    { sv:'Havssälting',    en:'Sea Lavender',         latin:'Limonium vulgare',        type:'seaweed',parts:'leaves, flowers', note:'Salt marshes; drying and preserving uses' },
  'Saltarv':        { sv:'Saltarv',        en:'Sea Sandwort',         latin:'Honckenya peploides',     type:'plant',  parts:'young leaves', note:'Sandy coastal beaches' },
  'Spjutmålla':     { sv:'Spjutmålla',     en:'Spear-leaved Orache',  latin:'Atriplex prostrata',      type:'plant',  parts:'young leaves', note:'Coastal; salty spinach substitute' },
  'Strandmålla':    { sv:'Strandmålla',    en:'Sea Orache',           latin:'Atriplex littoralis',     type:'plant',  parts:'young leaves', note:'Saline coastal areas' },
  'Strandaster':    { sv:'Strandaster',    en:'Sea Aster',            latin:'Tripolium pannonicum',    type:'plant',  parts:'young leaves', note:'Salt marshes' },
  'Marviol':        { sv:'Marviol',        en:'Sea Violet',           latin:'Cakile maritima',         type:'plant',  parts:'young leaves, seed pods', note:'Sandy coasts; peppery sea rocket' },
};

// Month → list of harvestable plant Swedish names
export const HARVEST_BY_MONTH: Record<number, string[]> = {
  1:  ['Björk','Hundkäx','Kråkbär','Lind','Ros','Tall','Tranbär','Marviol','Kvanne','Strandaster','Havssälting','Saltarv','Spjutmålla','Strandmålla','Strandkål','Havtorn'],
  2:  ['Björk','Hundkäx','Kråkbär','Lind','Ros','Tall','Tranbär','Marviol','Kvanne','Strandaster','Havssälting','Saltarv','Spjutmålla','Strandmålla','Strandkål','Havtorn'],
  3:  ['Bergbräsma','Björk','Brännässla','Gökärt','Hundkäx','Jordreva','Kirskål','Knölklocka','Kråkbär','Lind','Maskros','Ros','Skogslönn','Tall','Tranbär','Tusensköna','Viol','Våtarv','Marviol','Kvanne','Strandaster','Havssälting','Saltarv','Spjutmålla','Strandmålla','Strandkål','Havtorn'],
  4:  ['Bergbräsma','Björk','Brännässla','Gökärt','Harsyra','Havssälting','Humleblomster','Hundkäx','Jordreva','Kirskål','Knölklocka','Kvickrot','Kärleksört','Lind','Lomme','Maskros','Ramslök','Ros','Skogslönn','Spjutmålla','Stensöta','Strandaster','Strandmålla','Tall','Tusensköna','Viol','Våtarv'],
  5:  ['Bergbräsma','Blåbär','Björk','Bok','Brännässla','Daggkåpa','Gökärt','Gran','Hägg','Harsyra','Hundkäx','Humleblomster','Jordreva','Kirskål','Knölklocka','Kvanne','Kvickrot','Kärleksört','Lind','Lomme','Löktrav','Maskros','Mjölke','Penningört','Pors','Ramslök','Ros','Rönn','Skogslönn','Smultron','Snärjmåra','Spjutmålla','Stensöta','Strandaster','Strandkål','Strandmålla','Strätta','Svinmålla','Syren','Tall','Tusensköna','Viol','Våtarv'],
  6:  ['Blåbär','Björk','Brännässla','Fläder','Gran','Hallon','Hägg','Jordreva','Kamomill','Kantarell','Kirskål','Kvanne','Lind','Maskros','Mynta','Nypon','Ramslök','Röllika','Rönnbär','Smultron','Spjutmålla','Strandaster','Strandkål','Strandmålla','Strätta','Syren','Tall','Älggräs','Äkta johannesört','Havssälting','Saltarv'],
  7:  ['Blåbär','Björk','Brännässla','Hallon','Havtorn','Hjortron','Jordreva','Kamomill','Kantarell','Lärksopp','Maskros','Mjölke','Mynta','Odon','Pors','Renfana','Röllika','Rönnbär','Smultron','Stenbär','Tall','Trumpetsvamp','Viol','Älggräs','Äkta johannesört'],
  8:  ['Aronia','Björk','Björnbär','Blåbär','Brunsopp','Cikoria','Fårticka','Groblad','Hallon','Havssälting','Havtorn','Hjortron','Hundkäx','Kamomill','Kantarell','Karljohan','Kirskål','Knölklocka','Krusbär','Kråkbär','Kvickrot','Lingon','Lärksopp','Ljung','Lind','Mandelkremla','Mandelriska','Maskros','Mjölke','Mynta','Odon','Ormrot','Ostronmussling','Röllika','Rönnbär','Ros','Sandsopp','Sillkremla','Smörsopp','Snärjmåra','Stenbär','Stolt fjällskivling','Strandkål','Strävsopp','Strätta','Tall','Trumpetsvamp','Vinbär','Våtarv','Äkta johannesört','Älggräs'],
  9:  ['Aronia','Björk','Blåbär','Brännässla','Brunsopp','Cikoria','Enbär','Hallon','Hassel','Havtorn','Hjortron','Jordreva','Kamomill','Kantarell','Karljohan','Kråkbär','Lärksopp','Maskros','Nypon','Odon','Ostronmussling','Röllika','Rönnbär','Sandsopp','Sillkremla','Slånbär','Smörsopp','Stensöta','Strävsopp','Tall','Trattkantarell','Trumpetsvamp','Äkta johannesört'],
  10: ['Aronia','Björk','Blomkålssvamp','Brunsopp','Cikoria','Enbär','Fårticka','Gökärt','Hassel','Havtorn','Hundkäx','Kantarell','Kamomill','Knölklocka','Kummin','Kvanne','Kvickrot','Kråkbär','Lärksopp','Lind','Ljung','Lomme','Marviol','Nypon','Oxel','Röllika','Rönnbär','Sillkremla','Slånbär','Stensöta','Tall','Tranbär','Trattkantarell','Trumpetsvamp','Tusensköna','Våtarv','Viol','Blomkålssvamp','Snärjmåra','Strätta'],
  11: ['Aronia','Bergbräsma','Björk','Enbär','Gökärt','Hassel','Havssälting','Havtorn','Hundkäx','Knölklocka','Kråkbär','Kvanne','Kvickrot','Lind','Lomme','Marviol','Nypon','Oxel','Rönn','Rönnbär','Saltarv','Slån','Slånbär','Spjutmålla','Strandaster','Strandkål','Strandmålla','Stensöta','Tall','Tranbär','Tusensköna','Våtarv'],
  12: ['Björk','Hundkäx','Kråkbär','Lind','Ros','Slån','Tall','Tranbär'],
};

// Swedish month names
export const MONTH_SV: Record<number, string> = {
  1:'Januari', 2:'Februari', 3:'Mars', 4:'April', 5:'Maj', 6:'Juni',
  7:'Juli', 8:'Augusti', 9:'September', 10:'Oktober', 11:'November', 12:'December',
};

// ════════════════════════════════════════════════════════════════
// Fungai Art · Explorer — chapter + product data
// ════════════════════════════════════════════════════════════════
// Edit this file to change what /explorer shows. The page itself
// (index.html) only renders what is here.
//
// PRODUCTS are keyed by the CART NAME: the exact string the shop passes
// to addToCart() and that netlify/functions/create-payment-intent.js
// looks up in its server CATALOG. Change a name or price here without
// changing it there and checkout rejects the order — by design.
// `npm run test:explorer` checks every name + price against the server
// catalog, and checks `unavailable` against the shop page.
//
// Copy rules: this page is a commercial surface, so docs/claims-policy.md
// applies in full. No condition names, no "treats / prevents / boosts".
// `npm run check:claims` scans this file.
//
// Chapter fields:
//   slug      URL hash (/explorer#sacred-fungi)
//   kicker    small heading on the card ("Chapter 1")
//   title     the pill label on the card + the chapter heading
//   colour    feature colour: card fill on hover + chapter accents
//   img, alt  card image (portrait crops best)
//   video     optional mp4; plays on hover like the reference design
//   lede      one italic line under the title
//   body      paragraphs
//   products  cart names, in display order
//   links     secondary links shown as pills
//   cta       one primary button
//   event     optional dated notice; hidden after `until`
// ════════════════════════════════════════════════════════════════

window.FA_EXPLORER = {

  products: {
    'Amanita Muscaria': {
      title: 'Amanita muscaria', label: 'Fungi · Spagyric', size: '30ml', price: 55,
      img: '/home/products/amanita.webp', href: '/shop/amanita/',
      note: 'Fly agaric, self-foraged and prepared spagyrically: separated, purified and recombined, the old alchemical way.',
    },
    'Chaga Extract': {
      title: 'Chaga extract', label: 'Fungi · Birch', size: '30ml', price: 44,
      img: '/home/products/chaga.webp', href: '/shop/chaga/',
      note: 'Wild birch chaga from Swedish forests, double-extracted in water and pharma-grade ethanol for the full spectrum.',
    },
    'Chaga Syrup': {
      title: 'Chaga syrup', label: 'Fungi · Elixir', size: '100ml', price: 11,
      placeholder: 'Chaga',
      note: 'The same wild chaga, slow-cooked into a dark forest syrup. Stir into coffee, cacao or tonic water.',
    },
    'Wild Cordyceps': {
      title: 'Wild Cordyceps', label: 'Fungi · Himalayan', size: '30ml', price: 44,
      placeholder: 'Cordyceps', href: '/shop/wild-cordyceps/', unavailable: true,
      note: 'High-altitude Himalayan cordyceps, among the rarest fungi in the apothecary. Returning with the next harvest.',
    },
    'Lucid': {
      title: 'Lucid', label: 'Composition · Dreamwork', size: '30ml', price: 44,
      img: '/home/products/lucid.webp', href: '/shop/lucid/',
      note: 'Mugwort, calea zacatechichi, blue lotus, passionflower and bobinsana. A bedside composition for dreamwork.',
    },
    'Sleepy Sleepy': {
      title: 'Sleepy Sleepy', label: 'Composition · Evening', size: '30ml', price: 38,
      img: '/home/products/sleepy.webp', href: '/shop/sleepy-sleepy/',
      note: 'Valerian, passionflower, magnolia bark, lemon balm and hops. The evening ritual of letting the day go.',
    },
    'Blue Lotus (dried 100g)': {
      title: 'Blue Lotus', label: 'Flowers · Sacred', size: '100g', price: 44,
      img: '/home/products/blue-lotus-flower.webp',
      note: 'Nymphaea caerulea, the sacred flower of ancient Egypt. Steep as tea or infuse in wine.',
    },
    'Kumbaya Herbal Smoke Blend': {
      title: 'Kumbaya', label: 'Herbal smoke · Ritual', size: '10g', price: 7,
      placeholder: 'Kumbaya',
      note: 'A tobacco-free herbal smoke blend for ceremony, meditation and intentional ritual.',
    },
    'Nervous System Tonic': {
      title: 'Nervous System Tonic', label: 'Composition · Nervine', size: '30ml', price: 44,
      img: '/home/products/nervoussystem.webp', href: '/shop/nervous-system-tonic/',
      note: 'Oatstraw, skullcap, ashwagandha and gotu kola. A grounding daily composition built on nervine herbs.',
    },
    'Mineral Tonic': {
      title: 'Mineral Tonic', label: 'Composition · Mineral', size: '30ml', price: 44,
      img: '/home/products/mineral-tonic.webp',
      note: 'Shilajit, nettle, horsetail, schisandra and rose hips. Earth minerals in a daily dropper.',
    },
    'Nettle Extract': {
      title: 'Nettle extract', label: 'Single herb · Nutritive', size: '30ml', price: 33,
      img: '/home/products/nettle.webp',
      note: 'The most mineral-rich herb in common use, as a single-herb extract. A nutritive base to build on.',
    },
    'Healthy Aging': {
      title: 'Healthy Aging', label: 'Composition · Longevity', size: '30ml', price: 44,
      img: '/home/products/healthy-aging.webp', href: '/shop/healthy-aging/',
      note: 'Reishi, schisandra, ashwagandha, saffron and pearl. A daily tonic for the long view.',
    },
    'Moon Support': {
      title: 'Moon Support', label: 'Composition · Cycle', size: '30ml', price: 44,
      img: '/home/products/moon-support.webp', unavailable: true,
      note: "Motherwort, shatavari, lady's mantle, passionflower, yarrow and raspberry leaf. A composition for the monthly cycle.",
    },
    'Temple Nectar': {
      title: 'Temple Nectar', label: 'Composition · Sensual', size: '30ml', price: 38,
      img: '/home/products/temple-nectar.webp', href: '/shop/temple-nectar/',
      note: 'Saffron, damiana, catuaba, blue lotus, maca negra, vanilla and muira puama. Warm, sensual and made for sharing.',
    },
    'Ruby No.7': {
      title: 'Ruby No.7', label: 'Composition · Heart', size: '30ml', price: 44,
      img: '/home/products/ruby-no7.webp', unavailable: true,
      note: 'The deep-red composition of the house. Resting between batches.',
    },
    'Afghan Saffron': {
      title: 'Afghan Saffron', label: 'Spice · Royal',
      placeholder: 'Saffron',
      note: 'Hand-harvested grade-one stamens of Crocus sativus. For the kitchen, the teapot and the finest compositions.',
      sizes: [
        { size: '3g',  name: 'Afghan Saffron (3g)',  price: 44 },
        { size: '5g',  name: 'Afghan Saffron (5g)',  price: 66 },
        { size: '10g', name: 'Afghan Saffron (10g)', price: 100 },
      ],
    },
    'Butterfly Pea (dried 100g)': {
      title: 'Butterfly Pea', label: 'Flowers · Colour', size: '100g', price: 28,
      img: '/home/products/butterfly-pea.webp',
      note: 'Clitoria ternatea, the cobalt-blue flower. Turns tea blue, then pink with a squeeze of lemon.',
    },
    'Sacred Lavendula (foraged 50g)': {
      title: 'Sacred Lavendula', label: 'Flowers · Foraged', size: '50g', price: 22,
      img: '/home/products/sacred-lavendula.webp',
      note: 'Wild Anatolian lavender, self-foraged in Cappadocia. For tea, bath and pillow.',
    },
    'Pine Cones': {
      title: 'Pine Cones', label: 'Special · Forest', size: '100g', price: 33,
      placeholder: 'Pine',
      note: "The forest's sacred geometry made tangible. Each scale unfolds in a Fibonacci spiral.",
    },
    'Shilajit Paste': {
      title: 'Shilajit', label: 'Special · Mineral', size: '4 pills', price: 33,
      placeholder: 'Shilajit', href: '/shop/shilajit/',
      note: 'Pressed pills of mountain shilajit with compressed gold. Fulvic acid and trace minerals from high rock.',
    },
  },

  chapters: [
    {
      slug: 'foreword', kicker: 'Foreword', title: 'Earth Keepers', colour: '#88BAC8',
      img: '/dinner-experience/mushroom-gills.webp', alt: 'Orange mushroom gills over moss and lichen',
      lede: 'It begins on the forest floor.',
      body: [
        'Fungai Art grew out of moss, lichen and the slow work of mycelium. Every bottle in the apothecary is foraged, macerated and composed by hand in small batches, then bottled when it is ready rather than when a calendar says so.',
        'This explorer is the apothecary told in chapters. Wander in any order. Each chapter opens onto the bottles that belong to it, and everything you gather lands in the same basket as the shop.',
      ],
      links: [
        { href: '/the-house-ethos', label: 'The house ethos' },
        { href: '/foraging',        label: 'Foraging map' },
      ],
      cta: { href: '#signatures', label: 'Begin with the Signatures' },
    },
    {
      slug: 'signatures', kicker: 'Introduction', title: 'The Signatures', colour: '#DCC494',
      img: '/home/products/healthy-aging.webp', alt: 'A Fungai Art dropper bottle among bracket fungi',
      lede: 'The bottles that carry the house signature.',
      body: [
        'Full spectrum, made with pharma-grade ethanol, and self-foraged where marked. If you want to know what Fungai tastes like, start here.',
        'Every order ships for a flat €6, however much is in the basket.',
      ],
      products: ['Amanita Muscaria', 'Temple Nectar', 'Sleepy Sleepy', 'Lucid', 'Nervous System Tonic', 'Healthy Aging', 'Chaga Extract'],
      links: [{ href: '/shop', label: 'The full apothecary' }],
    },
    {
      slug: 'sacred-fungi', kicker: 'Chapter 1', title: 'Sacred Fungi', colour: '#E4572E',
      img: '/home/amanita123.webp', alt: 'Fly agaric caps and stems laid out on a wooden table',
      lede: 'The kingdom the house is named for.',
      body: [
        'Fly agaric gathered by hand and prepared spagyrically. Chaga lifted from living birch and double-extracted. Cordyceps from high Himalayan ground.',
        'Fungi are neither plant nor animal, and they ask for their own methods: long, patient extractions that honour both the water-soluble and the alcohol-soluble parts of the body.',
      ],
      products: ['Amanita Muscaria', 'Chaga Extract', 'Chaga Syrup', 'Wild Cordyceps'],
      links: [
        { href: '/extraction', label: 'How we extract' },
        { href: '/foraging',   label: 'Foraging map' },
      ],
    },
    {
      slug: 'night-and-dream', kicker: 'Chapter 2', title: 'Night & Dream', colour: '#A99BF0',
      img: '/dinner-experience/blue-lotus.jpg', alt: 'A blue lotus flower opening in a glass',
      lede: 'For the hours after dark.',
      body: [
        'Mugwort, calea and blue lotus have been kept at the bedside for dreamwork for centuries. Valerian, passionflower and hops belong to an older ritual: simply letting go of the day.',
        'Keep a notebook by the bed. The dream chapter rewards the ones who write things down.',
      ],
      products: ['Lucid', 'Sleepy Sleepy', 'Blue Lotus (dried 100g)', 'Kumbaya Herbal Smoke Blend'],
    },
    {
      slug: 'ground-and-rhythm', kicker: 'Chapter 3', title: 'Ground & Rhythm', colour: '#8DBF74',
      img: '/home/products/mineral-tonic.webp', alt: 'Mineral Tonic bottle on a mossy forest floor',
      lede: 'The quiet foundation.',
      body: [
        'Nettle, horsetail and oatstraw are among the most mineral-rich plants in the herbal tradition, and shilajit is pressed from mountain rock itself. These are daily tonics, taken slowly across a season rather than reached for in a hurry.',
        'Rhythm matters as much as the herbs: the same time each day, a few drops in water, and patience.',
      ],
      products: ['Nervous System Tonic', 'Mineral Tonic', 'Nettle Extract', 'Healthy Aging', 'Moon Support'],
    },
    {
      slug: 'heart-and-senses', kicker: 'Chapter 4', title: 'Heart & Senses', colour: '#E8B14B',
      img: '/home/products/temple-nectar.webp', alt: 'Temple Nectar bottle among bracket fungi',
      lede: 'The warm side of the apothecary.',
      body: [
        'Saffron, damiana and blue lotus were the treasured botanicals of temples and royal courts. This chapter gathers compositions and flowers for pleasure, colour and celebration.',
        'Saffron is sold by the gram, hand-harvested, grade one. A few threads colour a whole pot.',
      ],
      products: ['Temple Nectar', 'Afghan Saffron', 'Butterfly Pea (dried 100g)', 'Sacred Lavendula (foraged 50g)', 'Ruby No.7'],
    },
    {
      slug: 'forest-specials', kicker: 'Chapter 5', title: 'Forest Specials', colour: '#C98A55',
      img: '/dinner-experience/header.webp', alt: 'Young pine cones in a glass jar of syrup',
      lede: 'Small harvests, when the forest allows.',
      body: [
        'Some things only happen once a year: young cones in early summer, a good batch of chaga syrup, shilajit carried down from the mountains. When they are gone, they are gone until the next season.',
      ],
      products: ['Pine Cones', 'Shilajit Paste', 'Chaga Syrup'],
    },
    {
      slug: 'your-own-bottle', kicker: 'Chapter 6', title: 'Your Own Bottle', colour: '#EDE5D8',
      img: '/sensorium/hero.webp', alt: 'A glowing mycelial network surrounded by translucent petals',
      lede: 'Six questions, one bespoke bottle.',
      body: [
        'Tell the Compounder’s Bench about your days, your evenings and your senses. It reads your answers against the house materia medica and proposes a composition that is yours alone, which we then make by hand.',
        'Prefer to compose it yourself? The Herbal Engine lets you build a formula herb by herb.',
      ],
      cta: { href: '/find-your-formula', label: 'Begin the six questions' },
      links: [
        { href: '/herbal-engine-2/', label: 'Herbal Engine' },
        { href: '/mixology',         label: 'Mixology' },
      ],
    },
    {
      slug: 'at-the-table', kicker: 'Chapter 7', title: 'At the Table', colour: '#E89AA8',
      img: '/dinner-experience/featured.webp', alt: 'A plated dish of morels and flowers beside a piece of chaga',
      lede: 'The apothecary, cooked.',
      body: [
        'The Dinner Experience is a seven-course fungal feast by forager-chef Robin Floræsta. Foraged mushrooms, chaga garum and spagyric pairings, served to a small table.',
      ],
      event: {
        until: '2026-10-12',
        label: 'Next dinner',
        lines: ['Saturday 11 October 2026', 'Holzmarkt Berlin', 'Fungi Fever Fest'],
      },
      cta: { href: '/dinner-experience#reserve', label: 'Reserve a seat' },
      links: [
        { href: '/the-tasting-arc',               label: 'The tasting arc' },
        { href: '/dinner-experience-sample-menu', label: 'Sample menu' },
        { href: '/the-house-ethos',               label: 'The house ethos' },
      ],
    },
  ],
};

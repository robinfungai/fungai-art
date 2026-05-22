/* Spore — data layer */

const NETWORK_NODES = [
  {
    id: 'berlin',
    name: 'Berlin Studio / LAB',
    sub: 'Active · 12 contributors',
    region: 'DE',
    color: '#3B6D11',
    coord: { x: 0.55, y: 0.42 },
    activity: 'live',
    contributions: [
      { id: 'kitchen',  label: 'Kitchen help',     sub: '1 day · meals',          earn: 40 },
      { id: 'event',    label: 'Event hosting',    sub: 'one evening',            earn: 80, rep: 2 },
      { id: 'forage',   label: 'Foraging guide',   sub: 'morning circle',         earn: 60, rep: 1 },
      { id: 'docs',     label: 'Documentation',    sub: 'photo · field notes',    earn: 20 },
    ],
  },
  {
    id: 'sweden',
    name: 'Sweden Foraging',
    sub: 'Seasonal · foraging',
    region: 'SE',
    color: '#639922',
    coord: { x: 0.62, y: 0.18 },
    activity: 'seasonal',
    contributions: [
      { id: 'expedition', label: 'Foraging expedition', sub: '5 days · wild north', earn: 100, rep: 3 },
      { id: 'harvest',    label: 'Wild harvest',        sub: 'per day',             earn: 60, rep: 1 },
      { id: 'species',    label: 'Species ID',          sub: 'documented find',     earn: 15 },
    ],
  },
  {
    id: 'festival',
    name: 'Festival Circuit',
    sub: 'Travelling · EU+',
    region: 'EU',
    color: '#C48838',
    coord: { x: 0.32, y: 0.55 },
    activity: 'travelling',
    contributions: [
      { id: 'setup',  label: 'Stand setup',        sub: 'pre-event',            earn: 50 },
      { id: 'facil',  label: 'Facilitation help',  sub: 'live event',           earn: 70, rep: 2 },
      { id: 'media',  label: 'Content creation',   sub: 'photo · video',        earn: 30 },
    ],
  },
  {
    id: 'lisbon',
    name: 'Lisbon Studio',
    sub: 'Atlantic · year-round',
    region: 'PT',
    color: '#534AB7',
    coord: { x: 0.18, y: 0.78 },
    activity: 'live',
    contributions: [
      { id: 'art',     label: 'Studio residency', sub: '2 weeks · exchange', earn: 200, rep: 4 },
      { id: 'workshop',label: 'Workshop assist',  sub: 'one weekend',        earn: 50, rep: 1 },
      { id: 'translate',label:'Translation',      sub: 'EN ⇄ PT',            earn: 25 },
    ],
  },
  {
    id: 'beirut',
    name: 'Beirut',
    sub: 'Lebanon · Mediterranean',
    region: 'LB',
    color: '#A03028',
    coord: { x: 0.76, y: 0.72 },
    activity: 'live',
    contributions: [
      { id: 'harvest',   label: 'Wild plant harvest',  sub: 'Mediterranean herbs', earn: 60, rep: 1 },
      { id: 'workshop',  label: 'Workshop assist',     sub: 'herb processing',     earn: 50, rep: 1 },
      { id: 'docs',      label: 'Documentation',       sub: 'field notes · photo', earn: 20 },
      { id: 'ceremony',  label: 'Ceremonial hosting',  sub: 'plant medicine',      earn: 80, rep: 2 },
    ],
  },
  {
    id: 'new',
    name: 'Genoa Castle',
    sub: 'Mycelial expansion · proposed',
    region: '—',
    color: '#8A8270',
    coord: { x: 0.48, y: 0.62 },
    activity: 'proposed',
    contributions: [],
    requirement: 'Requires 300 $H + Forager reputation to propose a node.',
  },
];

const PRODUCTS = [
  { id:'p1', name:'Temple Nectar',     cat:'compositions', bg:'#C48838', desc:'Vitality, sensual, sacred energy.',           pEur:48, pH:35, vol:'30 ml' },
  { id:'p2', name:'Chaga',             cat:'fungi',        bg:'#7A4F2E', desc:'Immunity, resilience, slow vitality.',         pEur:38, pH:28, vol:'60 g'  },
  { id:'p3', name:'Lucid',             cat:'compositions', bg:'#5050A0', desc:'Dreamwork, luminous, visionary nights.',       pEur:48, pH:35, vol:'30 ml' },
  { id:'p4', name:'Steady',            cat:'compositions', bg:'#486038', desc:'Focus, clarity, gentle resilience.',           pEur:48, pH:35, vol:'30 ml' },
  { id:'p5', name:'Amanita Muscaria',  cat:'fungi',        bg:'#A03028', desc:'Neuroalchemy, shamanic warmth, focus.',        pEur:38, pH:28, vol:'30 ml' },
  { id:'p6', name:'Sleepy Sleepy',     cat:'compositions', bg:'#3F4E5A', desc:'CNS ease, deep sleep, stress release.',        pEur:48, pH:35, vol:'30 ml' },
];

const EXPERIENCES = [
  {
    id:'e1', title:'Sensual Dinner',
    desc:'A multi-course ceremonial dinner exploring taste, scent, and plant intelligence.',
    bg:'#A03028', tag:'limited', tagLabel:'2 seats left', pEur:65, pH:50, minH:50,
  },
  {
    id:'e2', title:'Mycelium Trance',
    desc:'111-minute embodied sensory awakening. Gong, tuning forks, plant allies.',
    bg:'#5C7338', tag:'open', tagLabel:'Open', pEur:40, pH:30, minH:30, featured:true,
  },
  {
    id:'e3', title:'Foraging Circle',
    desc:'Morning in the Berlin forest. Eight wild plants, their stories, their medicine.',
    bg:'#486038', tag:'work', tagLabel:'Free · earn back', pEur:0, pH:0, minH:0, earnBack:40,
  },
  {
    id:'e4', title:'Fungi Lab',
    desc:'Hands-on tincture making and species identification. Small group, deep practice.',
    bg:'#7A4F2E', tag:'locked', tagLabel:'Token-gated', pEur:null, pH:80, minH:80,
  },
  {
    id:'e5', title:'Berlin Lab Residency',
    desc:'Two weeks of access to mycelium cultivation equipment and the community network.',
    bg:'#534AB7', tag:'locked', tagLabel:'Forager+ only', pEur:null, pH:150, minH:150, repReq:2,
  },
];

const REPUTATION_TIERS = [
  { min: 0,   label: 'Spore',     color: '#854F0B' },
  { min: 1,   label: 'Seedling',  color: '#3B6D11' },
  { min: 3,   label: 'Mycelium',  color: '#0F6E56' },
  { min: 6,   label: 'Forager',   color: '#534AB7' },
  { min: 10,  label: 'Root Node', color: '#3C3489' },
];

function reputationTier(repPoints) {
  let tier = REPUTATION_TIERS[0];
  for (const t of REPUTATION_TIERS) {
    if (repPoints >= t.min) tier = t;
  }
  return tier;
}

const PHASES = [
  { id:'MOCK',    name:'Mock Economy',  num:'01', items:'UI · fake balances · unlock states' },
  { id:'TESTNET', name:'Web2 Bridge',   num:'02', items:'Stripe · off-chain points · email accounts' },
  { id:'CHAIN',   name:'Token Live',    num:'03', items:'$HYPHAE on-chain · wallets · NFT keys' },
  { id:'LIVING',  name:'Living Network',num:'04', items:'Governance · staking · DAO' },
];

const MEMBERS = [
  {
    id: 'robin',
    name: 'Robin',
    role: 'Founder',
    node: 'berlin',
    rep: 15,
    balance: 500,
    focus: 'Network architecture · product development · alchemy',
    admin: true,
  },
  {
    id: 'remi',
    name: 'Remi',
    role: 'Community Weaver',
    node: 'berlin',
    rep: 10,
    balance: 340,
    focus: 'Facilitation · governance · network tending',
  },
  {
    id: 'stephanie',
    name: 'Stephanie',
    role: 'Sound Healer',
    node: 'berlin',
    rep: 6,
    balance: 260,
    focus: 'Mycelium Trance · gong · tuning forks · plant ceremony',
  },
  {
    id: 'angela',
    name: 'Angela',
    role: 'Forager',
    node: 'sweden',
    rep: 6,
    balance: 280,
    focus: 'Wild harvest · species ID · Nordic forests',
  },
  {
    id: 'gabi',
    name: 'Gabi',
    role: 'Herbalist',
    node: 'berlin',
    rep: 3,
    balance: 195,
    focus: 'Tincture making · plant medicine · formulation',
  },
  {
    id: 'emil',
    name: 'Emil',
    role: 'Cultivator',
    node: 'sweden',
    rep: 3,
    balance: 170,
    focus: 'Mycelium cultivation · spawn · substrate work',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Alchemist',
    node: 'lisbon',
    rep: 2,
    balance: 140,
    focus: 'Spagyric extraction · plant alchemy · lunar timing',
  },
  {
    id: 'leni',
    name: 'Leni',
    role: 'Forager',
    node: 'sweden',
    rep: 2,
    balance: 130,
    focus: 'Nordic wild plants · mushroom ID · forest medicine',
  },
  {
    id: 'acile',
    name: 'Acile',
    role: 'Artist',
    node: 'festival',
    rep: 1,
    balance: 110,
    focus: 'Visual art · illustration · botanical design',
  },
  {
    id: 'wissam',
    name: 'Wissam',
    role: 'Artist & Contributor',
    node: 'festival',
    rep: 1,
    balance: 120,
    focus: 'Visual art · event facilitation · content',
  },
  {
    id: 'vi',
    name: 'Vi',
    role: 'Documenter',
    node: 'lisbon',
    rep: 1,
    balance: 105,
    focus: 'Photography · field notes · archive',
  },
];

const CONTRIBUTION_TYPES = [
  { id: 'foraging',    label: 'Foraging',    icon: '🌿', desc: 'Wild harvest, species ID, field medicine' },
  { id: 'laboratory',  label: 'Laboratory',  icon: '⚗',  desc: 'Extraction, tincture, formulation' },
  { id: 'events',      label: 'Events',      icon: '✦',  desc: 'Setup, facilitation, hosting' },
  { id: 'sales',       label: 'Sales',       icon: '◎',  desc: 'Customer, market, outreach' },
];

window.SporeData = {
  NETWORK_NODES, PRODUCTS, EXPERIENCES, REPUTATION_TIERS, PHASES, MEMBERS, CONTRIBUTION_TYPES, reputationTier
};

/* Spore — data layer */

const NETWORK_NODES = [
  {
    id: 'berlin',
    name: 'Berlin Studio / LAB',
    sub: 'Active · 12 contributors',
    region: 'DE',
    color: '#3B6D11',
    latlon: [52.5, 13.4],
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
    latlon: [62.0, 17.0],
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
    latlon: [52.0, 16.0],
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
    latlon: [38.7, -9.1],
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
    latlon: [33.9, 35.5],
    activity: 'live',
    contributions: [
      { id: 'harvest',   label: 'Wild plant harvest',  sub: 'Mediterranean herbs', earn: 60, rep: 1 },
      { id: 'workshop',  label: 'Workshop assist',     sub: 'herb processing',     earn: 50, rep: 1 },
      { id: 'docs',      label: 'Documentation',       sub: 'field notes · photo', earn: 20 },
      { id: 'ceremony',  label: 'Ceremonial hosting',  sub: 'plant medicine',      earn: 80, rep: 2 },
    ],
  },
  {
    id: 'atitlan',
    name: 'Lake Atitlán',
    sub: 'Guatemala · Farm Community',
    region: 'GT',
    color: '#2E8B57',
    latlon: [14.7, -91.2],
    activity: 'live',
    contributions: [
      { id: 'farm',      label: 'Farm work',          sub: 'planting · harvesting', earn: 60, rep: 1 },
      { id: 'ceremony',  label: 'Ceremony support',   sub: 'plant medicine',        earn: 80, rep: 2 },
      { id: 'harvest',   label: 'Wild harvest',       sub: 'jungle medicines',      earn: 70, rep: 1 },
      { id: 'docs',      label: 'Documentation',      sub: 'field notes',           earn: 20 },
    ],
  },
  {
    id: 'zanzibar',
    name: 'Zanzibar',
    sub: 'Tanzania · Farm Community',
    region: 'TZ',
    color: '#C4872A',
    latlon: [-6.2, 39.2],
    activity: 'live',
    contributions: [
      { id: 'farm',      label: 'Farm work',          sub: 'spice & herb garden',   earn: 55, rep: 1 },
      { id: 'ocean',     label: 'Seaweed harvest',    sub: 'mineral extraction',    earn: 50, rep: 1 },
      { id: 'ceremony',  label: 'Ceremony support',   sub: 'coastal ritual',        earn: 75, rep: 2 },
      { id: 'docs',      label: 'Field documentation',sub: 'photo · notes',         earn: 20 },
    ],
  },
  {
    id: 'bangkok',
    name: 'Bangkok',
    sub: 'Thailand · Urban Hub',
    region: 'TH',
    color: '#7A3DAA',
    latlon: [13.8, 100.5],
    activity: 'live',
    contributions: [
      { id: 'lab',       label: 'Lab work',           sub: 'Thai herb extraction',  earn: 65, rep: 1 },
      { id: 'market',    label: 'Market presence',    sub: 'events · outreach',     earn: 50, rep: 1 },
      { id: 'teach',     label: 'Workshop teaching',  sub: 'plant medicine',        earn: 80, rep: 2 },
    ],
  },
  {
    id: 'bali',
    name: 'Bali',
    sub: 'Indonesia · Farm Community',
    region: 'ID',
    color: '#4A7A3A',
    latlon: [-8.4, 115.2],
    activity: 'live',
    contributions: [
      { id: 'farm',      label: 'Farm work',          sub: 'tropical medicines',    earn: 55, rep: 1 },
      { id: 'ceremony',  label: 'Ceremonial support', sub: 'Balinese ritual',       earn: 85, rep: 2 },
      { id: 'retreat',   label: 'Retreat support',    sub: 'hosting & facilitation',earn: 70, rep: 1 },
    ],
  },
  {
    id: 'hokkaido',
    name: 'Hokkaido',
    sub: 'Japan · Fungi Farm',
    region: 'JP',
    color: '#3A6B8A',
    latlon: [43.5, 141.4],
    activity: 'live',
    contributions: [
      { id: 'fungi',     label: 'Fungi cultivation',  sub: 'spawn · substrate',     earn: 70, rep: 2 },
      { id: 'forage',    label: 'Forest foraging',    sub: 'wild Japanese fungi',   earn: 90, rep: 2 },
      { id: 'lab',       label: 'Lab extraction',     sub: 'double-extract method', earn: 60, rep: 1 },
    ],
  },
  {
    id: 'genoa',
    name: 'Genoa Castle',
    sub: 'Mycelial expansion · proposed',
    region: 'IT',
    color: '#8A8270',
    latlon: [44.4, 8.9],
    activity: 'proposed',
    contributions: [],
    requirement: 'Requires 300 $H + Forager reputation to propose a node.',
  },
];

/* ── Events ─────────────────────────────────────────────────── */
const EVENTS = [
  {
    id: 'garbicz-dinner-0731',
    title: 'Mycelium Dinner',
    subtitle: 'Garbicz Music Festival · Poland',
    date: '2026-07-31',
    time: '20:00',
    node: 'festival',
    freq: '111 Hz',
    color: '#C48838',
    capacity: 24,
    desc: 'A slow, intentional ceremonial feast at the forest edge. Spagyric extracts, live plant allies on the table, gong bath at midnight under the Aquarius moon.',
    contributions: [
      { type: 'kitchen', earn: 80, rep: 2, label: 'Kitchen & ceremonial prep' },
      { type: 'events',  earn: 70, rep: 2, label: 'Event hosting & facilitation' },
      { type: 'laboratory', earn: 60, rep: 1, label: 'Elixir & tincture prep' },
    ],
    open: true,
  },
  {
    id: 'berlin-lab-night-0815',
    title: 'Extraction Lab Night',
    subtitle: 'Berlin Studio / LAB',
    date: '2026-08-15',
    time: '18:00',
    node: 'berlin',
    freq: '432 Hz',
    color: '#3B6D11',
    capacity: 8,
    desc: 'A hands-on evening in the Berlin lab. Double-extraction of Chaga and Reishi. Participants learn spagyric calcination. Bring your own specimen if you have one.',
    contributions: [
      { type: 'laboratory', earn: 90, rep: 3, label: 'Lab lead & teaching' },
      { type: 'foraging',   earn: 60, rep: 1, label: 'Mushroom sourcing & ID' },
      { type: 'events',     earn: 40, rep: 1, label: 'Setup & documentation' },
    ],
    open: true,
  },
  {
    id: 'sweden-forage-0820',
    title: 'Nordic Foraging Circle',
    subtitle: 'Sweden · Boreal Forest',
    date: '2026-08-20',
    time: '07:00',
    node: 'sweden',
    freq: '528 Hz',
    color: '#639922',
    capacity: 12,
    desc: 'Five days in the north. Wild harvest, species identification, Schizophyllum observation at 61°N. Sleep under birch canopy. Bring Zodiak time.',
    contributions: [
      { type: 'foraging', earn: 100, rep: 3, label: 'Expedition forager (5 days)' },
      { type: 'sales',    earn: 60,  rep: 1, label: 'Daily wild harvest' },
      { type: 'events',   earn: 25,  rep: 0, label: 'Species documentation' },
    ],
    open: true,
  },
  {
    id: 'bali-retreat-0901',
    title: 'Sacred Plant Retreat',
    subtitle: 'Bali · Ubud Jungle',
    date: '2026-09-01',
    time: '06:00',
    node: 'bali',
    freq: '111 Hz',
    color: '#4A7A3A',
    capacity: 16,
    desc: 'A seven-day immersion in Balinese plant medicine. Morning ceremonial cacao, afternoon lab sessions with tropical adaptogens, evening gong and tuning fork ceremony.',
    contributions: [
      { type: 'events',     earn: 120, rep: 3, label: 'Lead facilitator (7 days)' },
      { type: 'laboratory', earn: 80,  rep: 2, label: 'Cacao & elixir preparation' },
      { type: 'foraging',   earn: 70,  rep: 1, label: 'Jungle herb harvest' },
    ],
    open: true,
  },
  {
    id: 'atitlan-equinox-0922',
    title: 'Equinox Ceremony',
    subtitle: 'Lake Atitlán · Guatemala',
    date: '2026-09-22',
    time: '05:30',
    node: 'atitlan',
    freq: '111 Hz',
    color: '#2E8B57',
    capacity: 20,
    desc: 'Sunrise ceremony on the volcanic lake shore. Plant medicine circle, mycelium mapping of the local jungle floor. The calendar turns on 111 Hz — be here when it does.',
    contributions: [
      { type: 'ceremony', earn: 100, rep: 3, label: 'Ceremony lead & holding' },
      { type: 'foraging', earn: 80,  rep: 2, label: 'Sacred plant preparation' },
      { type: 'events',   earn: 50,  rep: 1, label: 'Circle support' },
    ],
    open: true,
  },
  {
    id: 'hokkaido-fungi-1005',
    title: 'Fungi Harvest Festival',
    subtitle: 'Hokkaido · Japan',
    date: '2026-10-05',
    time: '08:00',
    node: 'hokkaido',
    freq: '432 Hz',
    color: '#3A6B8A',
    capacity: 18,
    desc: 'Autumn peak harvest in Hokkaido\'s ancient forests. Matsutake, Nameko, Maitake at altitude. Double-extraction lab sessions, culinary ceremony at base camp.',
    contributions: [
      { type: 'foraging',   earn: 110, rep: 3, label: 'Expert fungi guide' },
      { type: 'laboratory', earn: 75,  rep: 2, label: 'Field extraction lab' },
      { type: 'events',     earn: 45,  rep: 1, label: 'Camp setup & hosting' },
    ],
    open: true,
  },
  {
    id: 'zanzibar-solstice-1221',
    title: 'Solstice Ocean Ceremony',
    subtitle: 'Zanzibar · Indian Ocean',
    date: '2026-12-21',
    time: '18:00',
    node: 'zanzibar',
    freq: '111 Hz',
    color: '#C4872A',
    capacity: 30,
    desc: 'The longest night. Spice harvest complete, the ocean holds the frequency. Ceremonial dinner with clove, cardamom, and marine plant medicine. Gong bath at dawn.',
    contributions: [
      { type: 'events',   earn: 90, rep: 2, label: 'Ceremony hosting' },
      { type: 'kitchen',  earn: 70, rep: 1, label: 'Ceremonial feast preparation' },
      { type: 'foraging', earn: 60, rep: 1, label: 'Spice & ocean harvest' },
    ],
    open: true,
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
  { min: 1,   label: 'Palawan',   color: '#3B6D11' },
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
  // ── FOUNDING SIX ───────────────────────────────────────────
  {
    id: 'robin',
    name: 'Robin',
    role: 'Founder',
    node: 'berlin',
    rep: 15,
    balance: 500,
    focus: 'Network architecture · product development · alchemy',
    admin: true,
    founding: true,
  },
  {
    id: 'stephanie',
    name: 'Stephanie',
    role: 'Sound Healer',
    node: 'berlin',
    rep: 12,
    balance: 320,
    focus: 'Mycelium Trance · gong · tuning forks · plant ceremony',
    founding: true,
  },
  {
    id: 'vi',
    name: 'Vi',
    role: 'Documenter',
    node: 'lisbon',
    rep: 11,
    balance: 280,
    focus: 'Photography · field notes · archive',
    founding: true,
  },
  {
    id: 'angela',
    name: 'Angela',
    role: 'Forager',
    node: 'sweden',
    rep: 11,
    balance: 290,
    focus: 'Wild harvest · species ID · Nordic forests',
    founding: true,
  },
  {
    id: 'wissam',
    name: 'Wissam',
    role: 'Artist & Contributor',
    node: 'festival',
    rep: 10,
    balance: 240,
    focus: 'Visual art · event facilitation · content',
    founding: true,
  },
  {
    id: 'emil',
    name: 'Emil',
    role: 'Cultivator',
    node: 'sweden',
    rep: 10,
    balance: 230,
    focus: 'Mycelium cultivation · spawn · substrate work',
    founding: true,
  },
  // ── PALAWAN COHORT (novice tier · newer threads) ───────────
  {
    id: 'remi',
    name: 'Remi',
    role: 'Community Weaver',
    node: 'berlin',
    rep: 1,
    balance: 120,
    focus: 'Facilitation · governance · network tending',
  },
  {
    id: 'gabi',
    name: 'Gabi',
    role: 'Herbalist',
    node: 'berlin',
    rep: 1,
    balance: 100,
    focus: 'Plant medicine · formulation · materia medica',
  },
  {
    id: 'luna',
    name: 'Luna',
    role: 'Alchemist',
    node: 'lisbon',
    rep: 1,
    balance: 95,
    focus: 'Spagyric extraction · plant alchemy · lunar timing',
  },
  {
    id: 'leni',
    name: 'Leni',
    role: 'Forager',
    node: 'sweden',
    rep: 1,
    balance: 90,
    focus: 'Nordic wild plants · mushroom ID · forest medicine',
  },
  {
    id: 'acile',
    name: 'Acile',
    role: 'Artist',
    node: 'festival',
    rep: 1,
    balance: 85,
    focus: 'Visual art · illustration · botanical design',
  },
  {
    id: 'robert',
    name: 'Robert',
    role: 'Collaborator',
    node: 'berlin',
    rep: 1,
    balance: 80,
    focus: 'New thread · vendor & supplier collaboration',
  },
];

// ── Auto-merge the visitor's own profile (created at /onboard, stored in localStorage)
// Any profile saved by the current visitor appears in the member list automatically,
// marked as "you", until we wire up Supabase for the global registry.
(function mergeLocalProfile(){
  try {
    const raw = localStorage.getItem('fungai_profile');
    if (!raw) return;
    const p = JSON.parse(raw);
    if (!p || !p.character_name) return;
    const id = 'me_' + p.character_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24);
    // Don't duplicate if their name already matches a canonical member
    if (MEMBERS.some(m => m.name.toLowerCase() === p.character_name.toLowerCase())) return;
    // Map role → display label
    const ROLE_LABEL = {
      forager: 'Forager', herbalist: 'Herbalist', alchemist: 'Alchemist',
      ceremony: 'Ceremony Facilitator', sound: 'Sound Healer', artist: 'Artist',
      patron: 'Patron', collaborator: 'Collaborator', student: 'Student',
      seeker: 'Seeker', other: 'Spore-bearer',
    };
    // Map location → existing node id (closest match)
    const NODE_MAP = {
      sweden: 'sweden', berlin: 'berlin', lisbon: 'lisbon', beirut: 'beirut',
      genoa: 'berlin', france: 'berlin', germany: 'berlin', denmark: 'sweden',
      other_europe: 'berlin', other_world: 'festival',
    };
    MEMBERS.unshift({
      id, isMe: true, avatar: p.avatar || null,
      name: p.character_name,
      role: ROLE_LABEL[p.role] || 'Spore-bearer',
      node: NODE_MAP[p.location] || 'berlin',
      rep: 1, balance: 0,
      focus: p.bio || (p.specialties && p.specialties.length ? p.specialties.join(' · ') : 'A new thread in the network'),
    });
  } catch (e) { /* localStorage blocked — skip */ }
})();

const CONTRIBUTION_TYPES = [
  { id: 'foraging',    label: 'Foraging',    icon: '🌿', desc: 'Wild harvest, species ID, field medicine' },
  { id: 'laboratory',  label: 'Laboratory',  icon: '⚗',  desc: 'Extraction, tincture, formulation' },
  { id: 'events',      label: 'Events',      icon: '✦',  desc: 'Setup, facilitation, hosting' },
  { id: 'sales',       label: 'Sales',       icon: '◎',  desc: 'Customer, market, outreach' },
];

window.SporeData = {
  NETWORK_NODES, PRODUCTS, EXPERIENCES, REPUTATION_TIERS, PHASES, MEMBERS, CONTRIBUTION_TYPES, EVENTS, reputationTier
};

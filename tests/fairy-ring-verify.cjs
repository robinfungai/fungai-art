// tests/fairy-ring-verify.cjs — npm run test:fairy-ring
//
// The fairy ring, which is the portal's navigation since 2026-09-25.
// Four classes of check:
//
//   1. portalSections is the ring Robin asked for, and coherent — ids
//      match what app-living actually dispatches on, and every thread is
//      declared at BOTH ends.
//
//   2. The six reference bugs stay fixed, plus the Phase 1 one where the
//      focused node was turned to the BACK of the ring.
//
//   3. Nothing invents a number. HEALTH, ACTIVITY, FLOW and Pulse stay
//      gone, and the Dashboard's placeholder figures reach keepers only.
//
//   4. It is wired in as THE navigation: tab row and QuickNav gone, the
//      ring rendered once, full on home and compact inside a section.
const fs = require('fs'), vm = require('vm'), path = require('path');
const React = require('react'), RDS = require('react-dom/server');

let p = 0, f = 0;
const ok  = (n, d) => { p++; console.log('  ✓ ' + n + (d ? '  — ' + d : '')); };
const bad = (n, d) => { f++; console.log('  ✗ ' + n + (d ? '  — ' + d : '')); };

function load() {
  const sb = {
    console, React, setTimeout, clearTimeout, Date, Intl,
    cancelAnimationFrame() {}, requestAnimationFrame: () => 0,
    performance: { now: () => 0 },
    document: {
      hidden: false, addEventListener() {}, removeEventListener() {},
      getElementById: () => null, querySelectorAll: () => [],
    },
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    open() {},
    Math, JSON, Object, Array, String, Number, Error, Map, Set, Boolean,
    SporeData: {
      MEMBERS: [
        { id: 'a', name: 'Ada Moss', cloudId: 'p1', createdAt: '2026-09-01T00:00:00Z' },
        { id: 'b', name: 'Bo Lichen', cloudId: 'p2', createdAt: '2026-09-20T00:00:00Z' },
      ],
      EVENTS: [{ id: 'e1', title: 'Fungi Fever Fest', subtitle: 'Holzmarkt', date: '2099-10-11', capacity: 40 }],
      NETWORK_NODES: [{ id: 'berlin', activity: 'live' }, { id: 'genoa', activity: 'proposed' }],
      RANKS: [
        { id: 'palawan', label: 'Palawan' }, { id: 'patron', label: 'Patron' },
        { id: 'facilitator', label: 'Facilitator' }, { id: 'alchemist', label: 'Alchemist' },
        { id: 'founder', label: 'Founder' },
      ],
    },
  };
  sb.window = sb; sb.globalThis = sb;
  const ctx = vm.createContext(sb);
  for (const name of ['sections', 'organism', 'fairy-ring', 'rsvps', 'dashboard']) {
    const file = path.join('public/community/portal', name + '.js');
    vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: name });
  }
  return sb;
}

const sb = load();
const PS = sb.PortalSections;
const app     = fs.readFileSync('public/community/spore/app-living.jsx', 'utf8');
const ringSrc = fs.readFileSync('public/community/portal/fairy-ring.jsx', 'utf8');
const css     = fs.readFileSync('public/community/portal/fairy-ring.css', 'utf8');
const html    = fs.readFileSync('public/community/index.html', 'utf8');
const render  = (C, props) => RDS.renderToStaticMarkup(React.createElement(C, props));

console.log('\n── the ring Robin asked for (2026-09-25) ──');
PS                                      ? ok('window.PortalSections is set') : bad('window.PortalSections is set');
typeof sb.FairyRing === 'function'      ? ok('window.FairyRing is set')      : bad('window.FairyRing is set');
typeof sb.PortalOrganism === 'function' ? ok('window.PortalOrganism is set') : bad('window.PortalOrganism is set');

const labels = PS.RING.map(s => s.label).join(', ');
labels === 'Network, Calendar, Apothecary, Hyphae, Academy'
  ? ok('ring labels', labels) : bad('ring labels', labels);
PS.ORGANISM.label === 'Dashboard' && PS.ORGANISM.id === 'home'
  ? ok('the centre is the Dashboard, and it is home') : bad('centre', PS.ORGANISM.label + ' / ' + PS.ORGANISM.id);
!/\b(Fruiting|Larder|Almanac|Alchemy)\b/.test(PS.ALL.map(s => s.label).join(' '))
  ? ok('Fruiting, Larder, Almanac and Alchemy are retired') : bad('a retired label is back');
PS.resolve('exp') === 'calendar' ? ok('an old #exp link lands on the Calendar') : bad('legacy exp', PS.resolve('exp'));
PS.resolve('access_token=abc') === null ? ok('junk in the hash resolves to nothing') : bad('junk hash resolved');

const apo = PS.byId('shop');
(apo && apo.label === 'Apothecary' && apo.choices && apo.choices.length === 2
  && apo.choices[0].id === 'shop' && apo.choices[1].href === '/shop')
  ? ok('Apothecary offers Members shop and Official shop') : bad('Apothecary choices');
const acad = PS.byId('academy');
(acad.external && acad.href === '/community/academy/')
  ? ok('Academy opens its own page') : bad('Academy is not external');
/window\.open\(s\.href, '_blank'/.test(ringSrc) ? ok('…in a new tab') : bad('Academy does not open a new tab');

// Ids are load-bearing: app-living switches on them. Academy is its own page.
const unknown = PS.ALL.map(s => s.id)
  .filter(id => !PS.byId(id).external && app.indexOf("view === '" + id + "'") === -1);
unknown.length === 0
  ? ok('every section id is one app-living dispatches on', PS.ALL.map(s => s.id).join(' '))
  : bad('unknown section id', unknown.join(', '));

const probs = PS.relationProblems();
probs.length === 0 ? ok('every thread is declared at both ends') : bad('thread problems', probs.join(' · '));
PS.RING.every(s => s.label && s.line && s.subtitle)
  ? ok('every ring node has a label, subtitle and one-liner') : bad('missing copy');
PS.ROOT.requiresRole === 'admin'     ? ok('Root requires the admin role') : bad('Root role');
PS.RING.every(s => s.id !== 'admin') ? ok('Root is not in the shared ring config') : bad('Root in RING');

console.log('\n── nothing invents a number ──');
!/fr-pulse-bar|pulseValue/.test(ringSrc) ? ok('no Pulse bar is rendered') : bad('a Pulse bar exists');
!/<SystemStats/.test(app) ? ok('HEALTH / FLOW / ACTIVITY are not rendered') : bad('SystemStats is back');
!/width:'28%'/.test(app)  ? ok('the calendar capacity bar is not a hardcoded 28%') : bad('fake capacity bar');
try {
  const member = render(sb.PortalDashboard, { currentMember: { name: 'Ada Moss' }, isAdmin: false });
  const keeper = render(sb.PortalDashboard, { currentMember: { name: 'Robin' }, isAdmin: true });
  !/Dinners hosted|db-draft/.test(member) ? ok('draft figures are hidden from members') : bad('a draft figure reached a member');
  /Dinners hosted/.test(keeper) && /db-draft/.test(keeper) ? ok('keepers see drafts, tagged') : bad('drafts missing for keepers');
  /Hyphae in the network/.test(member) && />2</.test(member) ? ok('the member count is live', '2 in the stub') : bad('member count');
} catch (e) {
  bad('the Dashboard renders', e.message);
}

console.log('\n── the six reference bugs, and the front of the ring ──');
(/requestAnimationFrame/.test(ringSrc) && !/setInterval\s*\(/.test(ringSrc))
  ? ok('(a) one rAF loop, no setInterval') : bad('(a) setInterval present');
/shortestDelta/.test(ringSrc)   ? ok('(b) angle tweened the short way round') : bad('(b) no shortestDelta');
!/set[A-Z]\w*\(\s*\w+\s*=>\s*\{[\s\S]{0,200}?(window\.location|document\.)/.test(ringSrc)
  ? ok('(c) no side effects inside a state updater') : bad('(c) side effect in updater');
/ref=\{\([^)]*\)\s*=>\s*\{/.test(ringSrc) ? ok('(d) ref callbacks use block bodies') : bad('(d) implicit-return ref');
/focusIndex === null|frontId === null/.test(ringSrc) ? ok('(e) compared to null, not truthiness') : bad('(e) truthiness check');
/<button/.test(ringSrc)         ? ok('(f) nodes are real buttons') : bad('(f) clickable divs');
/const FRONT\s*=\s*Math\.PI \/ 2/.test(ringSrc) && /FRONT - \(focusIndex/.test(ringSrc)
  ? ok('the chosen node turns to the FRONT (+90°), not the back') : bad('front of the ring');
/placeRef\.current\(\)/.test(ringSrc) && /\}, \[focusIndex, count\]\);/.test(ringSrc)
  ? ok('the tween is not restarted by every frame of the shrink') : bad('tween restarts on resize');

console.log('\n── accessibility + motion ──');
/aria-label="Portal sections"/.test(ringSrc) ? ok('the ring is a labelled nav landmark') : bad('nav landmark');
/aria-current/.test(ringSrc)         ? ok('the open section is aria-current')   : bad('aria-current');
/aria-haspopup/.test(ringSrc)        ? ok('Apothecary announces its menu')      : bad('aria-haspopup');
/ArrowRight|ArrowLeft/.test(ringSrc) ? ok('arrow keys move around the ring')    : bad('arrow keys');
/Escape/.test(ringSrc)               ? ok('Escape closes the choice')           : bad('Escape');
/prefers-reduced-motion/.test(ringSrc) ? ok('reduced motion honoured in JS')    : bad('reduced motion JS');
/visibilitychange/.test(ringSrc)     ? ok('no jump after a hidden tab')         : bad('visibilitychange');
/ResizeObserver/.test(ringSrc)       ? ok('radius comes from the stage size')   : bad('ResizeObserver');
/prefers-reduced-motion/.test(css)   ? ok('reduced motion honoured in CSS')     : bad('reduced motion CSS');
/is-compact \.fr-stage \{ height/.test(css) && /transition: height/.test(css)
  ? ok('the compact ring is a height transition, not a swap') : bad('compact transition');
/@media \(max-width: 600px\)/.test(css) ? ok('phone sizes defined') : bad('no phone sizes');
!/@import|tailwind/i.test(css)       ? ok('no Tailwind, no imports', 'portal tokens only') : bad('CSS imports something');

console.log('\n── wired in as THE navigation ──');
const iS = html.indexOf('portal/sections.js');
const iR = html.indexOf('portal/fairy-ring.js');
const iD = html.indexOf('portal/dashboard.js');
const iM = html.indexOf('dm/dm.js');
const iA = html.indexOf('spore/app-living.js');
(iS > -1 && iR > iS) ? ok('sections.js loads before fairy-ring.js') : bad('order: sections before ring');
(iR > -1 && iD > -1 && iM > -1 && iA > Math.max(iR, iD, iM))
  ? ok('ring, dashboard and DMs load before app-living.js') : bad('load order');
/portal\/fairy-ring\.css/.test(html) && /portal\/portal\.css/.test(html) ? ok('stylesheets linked') : bad('stylesheets');
!/maximum-scale/.test(html) ? ok('pinch-zoom is not disabled') : bad('maximum-scale is back');
(/window\.FairyRing/.test(app) && /<FairyRing[^>]*compact=\{view !== 'home'\}/.test(app))
  ? ok('app-living renders the ring, compact inside a section') : bad('app-living wiring');
!/tabs-desktop|tabs-mobile-sheet/.test(app) ? ok('the old tab row is gone') : bad('tab row still rendered');
!/<QuickNav/.test(app) ? ok('the QuickNav sidebar is gone') : bad('QuickNav still rendered');
/SectionFallbackNav/.test(app) ? ok('a plain fallback nav exists if the ring fails to load') : bad('no fallback nav');

console.log('\n── it renders ──');
try {
  const out = render(sb.FairyRing, { role: 'member', active: 'home', onNavigate() {} });
  ok('renders without throwing');
  (/Network/.test(out) && /Apothecary/.test(out) && /Academy/.test(out))
    ? ok('ring labels appear') : bad('labels', out.slice(0, 140));
  !/Root/.test(out) ? ok('Root is hidden for a member') : bad('Root leaked to a member');
  !/fr-choices/.test(out) ? ok('the Apothecary choice is closed until pressed') : bad('choice open on load');
  /fr-caption/.test(out) ? ok('the full ring has its caption') : bad('caption missing');
  const admin = render(sb.FairyRing, { role: 'admin', active: 'home', onNavigate() {} });
  /Root/.test(admin) ? ok('Root appears for a keeper') : bad('Root missing for an admin');
  const compact = render(sb.FairyRing, { role: 'member', active: 'calendar', compact: true, onNavigate() {} });
  /is-compact/.test(compact) && !/fr-caption/.test(compact) ? ok('compact ring drops the caption') : bad('compact render');
  /id="fr-node-calendar"[^>]*aria-current="page"|aria-current="page"[^>]*id="fr-node-calendar"/.test(compact)
    ? ok('the open section is marked current') : bad('aria-current on calendar');
  const shopOpen = render(sb.FairyRing, { role: 'member', active: 'shop', compact: true, onNavigate() {} });
  /id="fr-node-shop"[^>]*aria-current="page"|aria-current="page"[^>]*id="fr-node-shop"/.test(shopOpen)
    ? ok('Members shop lights the Apothecary node') : bad('Apothecary not current on shop');
} catch (e) {
  bad('renders without throwing', e.message);
}

console.log('\n── ranks gate sections; badges count ──');
PS.RING.every(s => !s.minRank) ? ok('nothing is rank-gated until Robin chooses') : bad('a gate was set by default');
(PS.allows(null, 'palawan') && !PS.allows('Patron', 'palawan') && PS.allows('Patron', 'facilitator') && PS.allows('patron', 'patron'))
  ? ok('allows() climbs the rank ladder', 'Palawan < Patron < Facilitator < Alchemist < Founder') : bad('allows()');
try {
  const net = PS.byId('network');
  net.minRank = 'Alchemist';                                   // a gate, for this test only
  PS.minRankForTab('network') === 'Alchemist' ? ok('minRankForTab reads a node gate') : bad('minRankForTab');
  const spore = render(sb.FairyRing, { role: 'member', active: 'home', rank: 'palawan', onNavigate() {} });
  /fr-node is-locked[^"]*"[^>]*id="fr-node-network"|id="fr-node-network"[^>]*class="fr-node is-locked/.test(spore) && /· <!-- -->?Alchemist|· Alchemist/.test(spore)
    ? ok('a Palawan sees Network locked, marked Alchemist') : bad('locked render', spore.slice(0, 200));
  const alc = render(sb.FairyRing, { role: 'member', active: 'home', rank: 'alchemist', onNavigate() {} });
  !/is-locked/.test(alc) ? ok('an Alchemist walks in') : bad('still locked at rank');
  const keeper = render(sb.FairyRing, { role: 'admin', active: 'home', rank: 'palawan', onNavigate() {} });
  !/is-locked/.test(keeper) ? ok('keepers pass every gate') : bad('keeper locked out');
  delete net.minRank;
} catch (e) {
  bad('rank gates render', e.message);
}
/rankBlocked/.test(app) && /PS\.minRankForTab\(tab\)/.test(app)
  ? ok('a typed #hash cannot walk past a gate') : bad('App does not enforce gates');
/memberRank = \(currentMember && currentMember\.rank\)/.test(app)
  ? ok('rank comes from the cloud profile, not the local economy') : bad('rank source');
// Ranks a member may not give themselves (Robin, 2026-09-25).
{
  const rolesBlock = app.slice(app.indexOf('const ROLES = ['), app.indexOf('];', app.indexOf('const ROLES = [')));
  !/\['(alchemist|patron|founder|facilitator|admin)'/.test(rolesBlock)
    ? ok('the profile editor offers no rank as a persona') : bad('a rank is still self-selectable');
  !/facilitat/i.test(rolesBlock.replace(/\/\/.*$/gm, '')) ? ok('no persona label says "facilitator"') : bad('facilitator wording in personas');
}
!/Gift \$H|hypha_gifts/.test(app.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))
  ? ok('the gift feature is gone') : bad('gift feature still present');
const sbClient = fs.readFileSync('public/supabase-client.js', 'utf8');
(/PUBLIC_PROFILE_COLS/.test(sbClient) && !/email: user\.email/.test(sbClient) && !/email: profile\.email/.test(sbClient))
  ? ok('no login email is written to a profile row') : bad('an email write remains');
const privacySql = fs.readFileSync('supabase-profiles-privacy.sql', 'utf8');
const granted = (privacySql.match(/GRANT\s+SELECT\s*\(([^)]+)\)/) || [])[1] || '';
const clientCols = (sbClient.match(/PUBLIC_PROFILE_COLS = '([^']+)'\s*\+\s*'([^']+)'/) || []).slice(1).join('');
const norm = s => s.split(',').map(x => x.trim()).filter(Boolean).sort().join(',');
granted && norm(granted) === norm(clientCols)
  ? ok('signed-out columns match the anon GRANT', norm(granted).split(',').length + ' columns')
  : bad('PUBLIC_PROFILE_COLS and the GRANT differ', norm(clientCols) + ' vs ' + norm(granted));
!/\b(email|contact|auth_user_id|is_admin|dm_public_key)\b/.test(granted)
  ? ok('anon can read no email, contact, auth id, admin flag or DM key') : bad('anon grant too wide');
try {
  const withBadge = render(sb.FairyRing, { role: 'admin', active: 'home', badges: { members: 3, admin: 12 }, onNavigate() {} });
  /fr-badge[^>]*>3</.test(withBadge) && /fr-badge[^>]*>9\+</.test(withBadge)
    ? ok('badges render, capped at 9+') : bad('badges', withBadge.slice(0, 160));
} catch (e) {
  bad('badges render', e.message);
}

console.log('\n── the Event manager ──');
try {
  vm.runInContext(fs.readFileSync('public/community/portal/events.js', 'utf8'), vm.createContext(sb), { filename: 'events' });
  const PE = sb.PortalEvents;
  const ev = { id: 'walk-261101', title: ' Walk ', subtitle: '', date: '2026-11-01', time: '', node: 'berlin',
               freq: '111 Hz', capacity: '12', desc: 'Bring boots', url: '', contributions: [], cancelled: false };
  const row = PE.toRow(ev);
  (row.title === 'Walk' && row.capacity === 12 && row.description === 'Bring boots' && row.url === null && row.time === null)
    ? ok('toRow trims, types and nulls the form') : bad('toRow', JSON.stringify(row));
  const back = PE.toEvent({ ...row, description: row.description });
  (back.desc === 'Bring boots' && back.contributions.length === 0 && back.cancelled === false)
    ? ok('toEvent gives the shape the portal already reads') : bad('toEvent', JSON.stringify(back));
} catch (e) {
  bad('events.js loads', e.message);
}
const eventsSql = fs.readFileSync('supabase-events.sql', 'utf8');
const dataSrc = fs.readFileSync('public/community/spore/data.jsx', 'utf8');
const evStart = dataSrc.indexOf('const EVENTS');
const hardIds = (dataSrc.slice(evStart, dataSrc.indexOf('\n];', evStart)).match(/id:\s*'([^']+)'/g) || []).map(s => s.split("'")[1]);
hardIds.length && hardIds.every(id => eventsSql.indexOf("('" + id + "'") !== -1)
  ? ok('the seed keeps every event id, so RSVPs stay attached', hardIds.length + ' events')
  : bad('seed ids differ from data.jsx');
/url ~ '\^\(\/\|https:\/\/\)'/.test(eventsSql) ? ok('event links are site paths or https only') : bad('no url check');
/ON CONFLICT \(id\) DO NOTHING/.test(eventsSql) ? ok('re-running the seed never overwrites an edit') : bad('seed overwrites');
const iE = html.indexOf('portal/events.js');
(iE > -1 && iE < html.indexOf('spore/app-living.js')) ? ok('events.js loads before app-living.js') : bad('events.js load order');
/EventsEditor/.test(app) && /freqColors=\{FREQ_COLORS\}/.test(app) ? ok('the Event manager is on the Admin page') : bad('EventsEditor not wired');
/ev\.cancelled/.test(app) ? ok('cancelled events close RSVPs on the calendar') : bad('cancelled not handled');

console.log('\n  passed: ' + p + '   failed: ' + f);
process.exit(f ? 1 : 0);

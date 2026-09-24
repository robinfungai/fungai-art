// src/islands/atlas-explorer.tsx
//
// The Atlas: 243 organisms, navigable by facet, each opening a ten-layer
// dossier with its synergy graph.
//
// Data comes from public/atlas/data/ (built by scripts/build-atlas.cjs):
// index.json for the grid and the graph, organism/<slug>.json fetched on
// open. Nothing here reads herbs.ts directly — the corpus is 1.4 MB of
// prose and this is a landing page.
//
// Facets marked `derived` in index.json are classified by the build script
// from recorded text, not recorded as fields. The UI says so rather than
// presenting a pattern match as a curated fact.

import { createRoot } from 'react-dom/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ── Types (mirror scripts/build-atlas.cjs output) ────────────────
interface Slim {
  id: number; slug: string; name: string; binomial: string;
  family: string; epithet: string; type: string;
  parts: string[]; chem: string[];
  states: string[]; statesAlso: string[];
  ecology: string[]; preparations: string[];
  tradition: string; element: string; meridians: string[];
  energetics: string[]; body: string[]; onset: string; energyPattern: string[];
  grade: string; caution_level: string;
  synergy: number[]; cautionEdges: number[];
}
interface FacetGroup { derived: boolean; values: { value: string; count: number }[] }
interface AtlasIndex {
  generated: string; count: number;
  facets: Record<string, FacetGroup>;
  organisms: Slim[];
}
interface Mention { id: number; note: string }
interface Dossier {
  id: number; slug: string; name: string; binomial: string; botanical: string;
  family: string; epithet: string; type: string;
  layers: {
    identity: { family: string; binomial: string; epithet: string; type: string; parts: string[] };
    ecology: { biomes: string[]; origin: string; tradition: string };
    material: { parts: string[]; preparationNote: string };
    chemistry: { classes: string[]; pharmacology: string };
    tradition: { meridians: string[]; element: string; energetics: string[]; flavor: string; spiritual: string };
    evidence: { grade: string; status: string };
    extraction: { best: string; dosage: string; methods: string[] };
    safety: { level: string; pregnancy: string | null; contraindications: string[]; drugInteractions: string[] };
    relationship: { synergy: Mention[]; caution: Mention[] };
    formulation: {
      primary: string[]; secondary: string[]; body: string[];
      onset: string; energyPattern: string[]; states: string[]; statesAlso: string[];
    };
  };
}

const DATA = '/atlas/data';

const TYPE_GLYPH: Record<string, string> = {
  fungus: '❋', plant: '✦', algae: '≈', resin: '◈', mineral: '◆', ferment: '⟳', hive: '⬡',
};

// Facet rails, in the order the brief lays them out.
const RAILS: { key: keyof AtlasIndex['facets'] & string; label: string; sub: string }[] = [
  { key: 'type',         label: 'ORGANISM',    sub: 'what it is' },
  { key: 'states',       label: 'HUMAN STATE', sub: 'what it is for' },
  { key: 'ecology',      label: 'ECOLOGY',     sub: 'where it lives' },
  { key: 'preparations', label: 'PREPARATION', sub: 'how it is taken' },
  { key: 'tradition',    label: 'TRADITION',   sub: 'who carried it' },
];

const TABS = [
  'BOTANICAL', 'CHEMISTRY', 'TRADITION', 'EXTRACTION',
  'FORMULATION', 'SAFETY', 'ALLIES', 'FIELD NOTES',
] as const;
type Tab = typeof TABS[number];

// Caution levels, most severe first — drives the badge colour.
const CAUTION_TONE: Record<string, string> = {
  'VERY HIGH': '#CE6C52', 'HIGH': '#CE6C52', 'MEDIUM-HIGH': '#D89A6A',
  'MEDIUM': '#D89A6A', 'LOW-MEDIUM': '#A8D4E0', 'LOW': '#88BAC8',
};

// Which values of a facet an organism carries. Kept beside filterOrganisms so
// adding a rail is one edit in one place.
export function facetValues(o: Slim, facet: string): string[] {
  switch (facet) {
    case 'type':         return [o.type];
    case 'states':       return o.states;
    case 'ecology':      return o.ecology;
    case 'preparations': return o.preparations;
    case 'tradition':    return [o.tradition];
    default:             return [];
  }
}

// Within a facet the selected values are OR'd; across facets they are AND'd.
// That matches how people read the rails: "fungi OR plants, that are for REST".
// Pure and exported so tests/atlas-verify.cjs can hold the semantics down —
// silently flipping this to AND-within-facet would make most combinations
// return nothing, which reads as "no results" rather than as a bug.
export function filterOrganisms(
  organisms: Slim[], sel: Record<string, string[]>, query: string,
): Slim[] {
  const q = query.trim().toLowerCase();
  return organisms.filter(o => {
    for (const [facet, vals] of Object.entries(sel)) {
      if (!vals.length) continue;
      const has = facetValues(o, facet);
      if (!vals.some(v => has.includes(v))) return false;
    }
    if (!q) return true;
    return (
      o.name.toLowerCase().includes(q) ||
      o.binomial.toLowerCase().includes(q) ||
      o.family.toLowerCase().includes(q) ||
      o.epithet.toLowerCase().includes(q) ||
      o.chem.some(c => c.includes(q))
    );
  });
}

function useAtlas() {
  const [index, setIndex] = useState<AtlasIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`${DATA}/index.json`)
      .then(r => { if (!r.ok) throw new Error(`index.json ${r.status}`); return r.json(); })
      .then(j => { if (live) setIndex(j); })
      .catch(e => { if (live) setError(String(e.message || e)); });
    return () => { live = false; };
  }, []);
  return { index, error };
}

export default function AtlasExplorer() {
  const { index, error } = useAtlas();
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [openSlug, setOpenSlug] = useState<string | null>(null);

  // Deep links: /atlas#lions-mane opens that dossier, and every open writes
  // the hash so a dossier can be shared.
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.replace(/^#/, '');
      setOpenSlug(h || null);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  const open = useCallback((slug: string | null) => {
    if (slug) window.location.hash = slug;
    else if (window.location.hash) history.replaceState(null, '', window.location.pathname + window.location.search);
    setOpenSlug(slug);
  }, []);

  const toggle = useCallback((facet: string, value: string) => {
    setSel(prev => {
      const cur = prev[facet] || [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      const out = { ...prev, [facet]: next };
      if (!next.length) delete out[facet];
      return out;
    });
  }, []);

  const results = useMemo(
    () => (index ? filterOrganisms(index.organisms, sel, query) : []),
    [index, sel, query],
  );

  const activeCount = Object.values(sel).reduce((s, v) => s + v.length, 0);

  if (error) {
    return (
      <div className="atl-msg">
        The atlas index did not load ({error}).{' '}
        <code>npm run build:atlas</code> generates it.
      </div>
    );
  }
  if (!index) return <div className="atl-msg">Reading the atlas…</div>;

  return (
    <div className="atl">
      <header className="atl-head">
        <div className="atl-kicker">The public botanical intelligence layer</div>
        <h2>THE ATLAS</h2>
        <p className="atl-lede">
          {index.count} organisms — plants, fungi, algae, resins and minerals — each carrying
          its taxonomy, chemistry, tradition, safety and its relationships to the others.
        </p>
      </header>

      <div className="atl-search">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, binomial, family or constituent…"
          aria-label="Search the atlas"
        />
        {(activeCount > 0 || query) && (
          <button type="button" className="atl-clear" onClick={() => { setSel({}); setQuery(''); }}>
            Clear {activeCount ? `· ${activeCount} filter${activeCount > 1 ? 's' : ''}` : ''}
          </button>
        )}
      </div>

      <div className="atl-rails">
        {RAILS.map(rail => {
          const group = index.facets[rail.key];
          if (!group) return null;
          return (
            <section className="atl-rail" key={rail.key}>
              <div className="atl-rail-head">
                <span className="atl-rail-label">{rail.label}</span>
                <span className="atl-rail-sub">{rail.sub}</span>
                {group.derived && (
                  <span
                    className="atl-derived"
                    title="Classified from the recorded text by the build script, not a curated field in the herb record."
                  >
                    derived
                  </span>
                )}
              </div>
              <div className="atl-chips">
                {group.values.map(v => {
                  const on = (sel[rail.key] || []).includes(v.value);
                  return (
                    <button
                      type="button"
                      key={v.value}
                      className={'atl-chip' + (on ? ' is-on' : '')}
                      aria-pressed={on}
                      onClick={() => toggle(rail.key, v.value)}
                    >
                      {v.value}<span className="atl-chip-n">{v.count}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="atl-count">
        {results.length === index.count
          ? `All ${index.count} organisms`
          : `${results.length} of ${index.count}`}
      </div>

      <div className="atl-grid">
        {results.map(o => (
          <button type="button" className="atl-card" key={o.id} onClick={() => open(o.slug)}>
            <span className="atl-card-glyph" aria-hidden="true">{TYPE_GLYPH[o.type] || '✦'}</span>
            <span className="atl-card-name">{o.name}</span>
            <span className="atl-card-bin">{o.binomial}</span>
            {o.epithet && <span className="atl-card-ep">{o.epithet}</span>}
            <span className="atl-card-foot">
              <span>{o.tradition}</span>
              {o.grade && <span className="atl-grade">{o.grade}</span>}
            </span>
          </button>
        ))}
        {!results.length && (
          <div className="atl-msg">
            Nothing matches that combination. The narrowest rail is usually ECOLOGY —
            habitat is only recorded for part of the catalogue.
          </div>
        )}
      </div>

      {openSlug && <DossierPanel slug={openSlug} index={index} onNavigate={open} onClose={() => open(null)} />}
    </div>
  );
}

// ── Dossier ──────────────────────────────────────────────────────
function DossierPanel({
  slug, index, onNavigate, onClose,
}: { slug: string; index: AtlasIndex; onNavigate: (s: string) => void; onClose: () => void }) {
  const [doc, setDoc] = useState<Dossier | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<Tab>('BOTANICAL');
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let live = true;
    setDoc(null); setMissing(false); setTab('BOTANICAL');
    fetch(`${DATA}/organism/${slug}.json`)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(j => { if (live) setDoc(j); })
      .catch(() => { if (live) setMissing(true); });
    return () => { live = false; };
  }, [slug]);

  // Panel owns the scroll while open, and Escape closes it.
  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.documentElement.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => { panelRef.current?.scrollTo({ top: 0 }); }, [slug]);

  const byId = useMemo(() => new Map(index.organisms.map(o => [o.id, o])), [index]);
  const slim = useMemo(() => index.organisms.find(o => o.slug === slug), [index, slug]);
  const ordinal = useMemo(() => index.organisms.findIndex(o => o.slug === slug) + 1, [index, slug]);

  return (
    <div className="atl-overlay" role="dialog" aria-modal="true" aria-label={slim?.name || 'Organism'}>
      <button type="button" className="atl-scrim" onClick={onClose} aria-label="Close dossier" />
      <div className="atl-panel" ref={panelRef} tabIndex={-1}>
        <button type="button" className="atl-close" onClick={onClose} aria-label="Close">✕</button>

        {missing && <div className="atl-msg">No dossier file for “{slug}”.</div>}
        {!missing && !doc && <div className="atl-msg">Opening…</div>}

        {doc && (
          <>
            {/* Visual anchor. Reserved for the per-organism cinematic loop;
                until those exist it carries the type glyph rather than a
                stock image standing in for a specific organism. */}
            <div className="atl-anchor" aria-hidden="true">
              <span className="atl-anchor-glyph">{TYPE_GLYPH[doc.type] || '✦'}</span>
              <span className="atl-anchor-note">visual identity pending</span>
            </div>

            <header className="atl-dhead">
              <div className="atl-ordinal">{String(ordinal).padStart(3, '0')}</div>
              <h3>{doc.name}</h3>
              <div className="atl-bin">{doc.binomial}</div>
              {doc.epithet && <p className="atl-ep">{doc.epithet}</p>}
              <div className="atl-badges">
                <span className="atl-badge">{doc.type}</span>
                {doc.family && <span className="atl-badge">{doc.family}</span>}
                {doc.layers.evidence.grade && (
                  <span className="atl-badge">evidence {doc.layers.evidence.grade}</span>
                )}
                {doc.layers.safety.level && (
                  <span className="atl-badge" style={{ color: CAUTION_TONE[doc.layers.safety.level] || '#88BAC8' }}>
                    caution {doc.layers.safety.level}
                  </span>
                )}
              </div>
            </header>

            <nav className="atl-tabs" aria-label="Dossier sections">
              {TABS.map(t => (
                <button
                  type="button" key={t}
                  className={'atl-tab' + (t === tab ? ' is-on' : '')}
                  aria-current={t === tab ? 'true' : undefined}
                  onClick={() => setTab(t)}
                >{t}</button>
              ))}
            </nav>

            <div className="atl-body">
              {tab === 'BOTANICAL'   && <Botanical doc={doc} />}
              {tab === 'CHEMISTRY'   && <Chemistry doc={doc} />}
              {tab === 'TRADITION'   && <TraditionTab doc={doc} />}
              {tab === 'EXTRACTION'  && <Extraction doc={doc} />}
              {tab === 'FORMULATION' && <Formulation doc={doc} />}
              {tab === 'SAFETY'      && <Safety doc={doc} />}
              {tab === 'ALLIES'      && <Allies doc={doc} byId={byId} onNavigate={onNavigate} />}
              {tab === 'FIELD NOTES' && <FieldNotes doc={doc} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Layer views ──────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="atl-field"><div className="atl-field-label">{label}</div><div className="atl-field-val">{children}</div></div>
);
const Tags = ({ items }: { items: string[] }) =>
  items.length ? <div className="atl-tags">{items.map(i => <span className="atl-tag" key={i}>{i}</span>)}</div> : <Empty />;
const Empty = ({ what = 'Not recorded' }: { what?: string }) => <span className="atl-empty">{what}</span>;
const Prose = ({ text }: { text: string }) => text ? <p className="atl-prose">{text}</p> : <Empty />;
const List = ({ items }: { items: string[] }) =>
  items.length ? <ul className="atl-list">{items.map((i, n) => <li key={n}>{i}</li>)}</ul> : <Empty />;

function Botanical({ doc }: { doc: Dossier }) {
  const { identity, ecology, material } = doc.layers;
  return (
    <>
      <h4 className="atl-layer">Layer 01 · Identity</h4>
      <Field label="Binomial">{identity.binomial || <Empty />}</Field>
      <Field label="Family">{identity.family || <Empty />}</Field>
      <Field label="Kingdom">{identity.type}</Field>
      <h4 className="atl-layer">Layer 02 · Ecology</h4>
      <Field label="Biome">
        {ecology.biomes.length
          ? <Tags items={ecology.biomes} />
          : <Empty what="Habitat is not yet recorded for this organism." />}
      </Field>
      <Field label="Tradition of origin">{ecology.origin || <Empty />}</Field>
      <h4 className="atl-layer">Layer 03 · Material</h4>
      <Field label="Part used"><Tags items={material.parts} /></Field>
    </>
  );
}

function Chemistry({ doc }: { doc: Dossier }) {
  const { chemistry } = doc.layers;
  return (
    <>
      <h4 className="atl-layer">Layer 04 · Chemistry</h4>
      <Field label="Constituent classes"><Tags items={chemistry.classes} /></Field>
      <Field label="Pharmacology"><Prose text={chemistry.pharmacology} /></Field>
    </>
  );
}

function TraditionTab({ doc }: { doc: Dossier }) {
  const { tradition } = doc.layers;
  return (
    <>
      <h4 className="atl-layer">Layer 05 · Tradition</h4>
      <Field label="Meridians"><Tags items={tradition.meridians} /></Field>
      <Field label="Element">{tradition.element || <Empty />}</Field>
      <Field label="Energetics"><Tags items={tradition.energetics} /></Field>
      <Field label="Flavour"><Prose text={tradition.flavor} /></Field>
    </>
  );
}

function Extraction({ doc }: { doc: Dossier }) {
  const { extraction } = doc.layers;
  return (
    <>
      <h4 className="atl-layer">Layer 07 · Extraction</h4>
      <Field label="Methods"><Tags items={extraction.methods} /></Field>
      <Field label="Best preparation"><Prose text={extraction.best} /></Field>
      <Field label="Dosage range"><Prose text={extraction.dosage} /></Field>
    </>
  );
}

function Formulation({ doc }: { doc: Dossier }) {
  const { formulation, evidence } = doc.layers;
  return (
    <>
      <h4 className="atl-layer">Layer 10 · Formulation</h4>
      <Field label="Primary functions"><List items={formulation.primary} /></Field>
      <Field label="Secondary benefits"><List items={formulation.secondary} /></Field>
      <Field label="Human state"><Tags items={formulation.states} /></Field>
      {formulation.statesAlso?.length > 0 && (
        <Field label="Also touches"><Tags items={formulation.statesAlso} /></Field>
      )}
      <Field label="Body affinity"><Tags items={formulation.body} /></Field>
      <Field label="Onset">{formulation.onset || <Empty />}</Field>
      <Field label="Energy pattern"><Tags items={formulation.energyPattern} /></Field>
      <h4 className="atl-layer">Layer 06 · Evidence</h4>
      <Field label="Grade">{evidence.grade || <Empty />}</Field>
    </>
  );
}

function Safety({ doc }: { doc: Dossier }) {
  const { safety, evidence } = doc.layers;
  return (
    <>
      <h4 className="atl-layer">Layer 08 · Safety</h4>
      <Field label="Caution level">
        <span style={{ color: CAUTION_TONE[safety.level] || '#88BAC8' }}>{safety.level || <Empty />}</span>
      </Field>
      <Field label="Pregnancy">{safety.pregnancy || <Empty what="Not assessed" />}</Field>
      <Field label="Contraindications"><List items={safety.contraindications} /></Field>
      <Field label="Drug interactions"><List items={safety.drugInteractions} /></Field>
      <Field label="Status"><Prose text={evidence.status} /></Field>
      <p className="atl-disclaimer">
        This is reference material, not medical advice. Nothing here accounts for your
        own medication, pregnancy or condition — the reading at Find Your Formula does
        screen for those.
      </p>
    </>
  );
}

function FieldNotes({ doc }: { doc: Dossier }) {
  return (
    <>
      <h4 className="atl-layer">Field notes</h4>
      <Prose text={doc.layers.tradition.spiritual} />
    </>
  );
}

// ── Layer 09 · Relationship — the botanical mycelium ─────────────
function Allies({
  doc, byId, onNavigate,
}: { doc: Dossier; byId: Map<number, Slim>; onNavigate: (slug: string) => void }) {
  const synergy = doc.layers.relationship.synergy;
  const caution = doc.layers.relationship.caution;

  // Radial layout: the organism at the centre, allies on a ring. Clicking an
  // ally re-centres the graph on it — the database navigates as a network
  // rather than a list.
  const R = 128;
  const nodes = synergy.slice(0, 8).map((m, i, arr) => {
    const a = (-Math.PI / 2) + (i * 2 * Math.PI) / Math.max(arr.length, 1);
    return { ...m, x: Math.cos(a) * R, y: Math.sin(a) * R, herb: byId.get(m.id) };
  }).filter(n => n.herb);

  return (
    <>
      <h4 className="atl-layer">Layer 09 · Relationship</h4>
      {nodes.length > 0 ? (
        <div className="atl-graph-wrap">
          <svg className="atl-graph" viewBox="-190 -190 380 380" role="img"
               aria-label={`${doc.name} and its ${nodes.length} recorded allies`}>
            {nodes.map(n => (
              <line key={'e' + n.id} x1={0} y1={0} x2={n.x} y2={n.y} className="atl-edge" />
            ))}
            <circle r={30} className="atl-node-core" />
            <text className="atl-node-core-label" textAnchor="middle" dy="4">
              {doc.name.length > 14 ? doc.name.slice(0, 12) + '…' : doc.name}
            </text>
            {nodes.map(n => (
              <g key={'n' + n.id} className="atl-node" transform={`translate(${n.x},${n.y})`}
                 onClick={() => onNavigate(n.herb!.slug)} role="button" tabIndex={0}
                 onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onNavigate(n.herb!.slug); } }}>
                <title>{n.note}</title>
                <circle r={22} />
                <text textAnchor="middle" dy="3">
                  {n.herb!.name.length > 11 ? n.herb!.name.slice(0, 9) + '…' : n.herb!.name}
                </text>
              </g>
            ))}
          </svg>
          <p className="atl-graph-hint">Click an ally to re-centre the graph on it.</p>
        </div>
      ) : (
        <Empty what="No synergies are recorded for this organism yet." />
      )}

      {synergy.length > 0 && (
        <Field label={`Synergies (${synergy.length})`}>
          <ul className="atl-list">
            {synergy.map(m => {
              const h = byId.get(m.id);
              return (
                <li key={m.id}>
                  {h
                    ? <button type="button" className="atl-link" onClick={() => onNavigate(h.slug)}>{h.name}</button>
                    : null}
                  <span className="atl-note"> — {m.note}</span>
                </li>
              );
            })}
          </ul>
        </Field>
      )}
      {caution.length > 0 && (
        <Field label={`Cautions with (${caution.length})`}>
          <ul className="atl-list atl-list-caution">
            {caution.map(m => {
              const h = byId.get(m.id);
              return (
                <li key={m.id}>
                  {h
                    ? <button type="button" className="atl-link" onClick={() => onNavigate(h.slug)}>{h.name}</button>
                    : null}
                  <span className="atl-note"> — {m.note}</span>
                </li>
              );
            })}
          </ul>
        </Field>
      )}
    </>
  );
}

// The eight layer views, exported so tests/atlas-verify.cjs can render each
// one against all 243 real dossier files. That is what catches a field the UI
// reads but scripts/build-atlas.cjs stopped emitting — the two are only
// coupled by the shape of the JSON.
export const LAYER_VIEWS = {
  BOTANICAL: Botanical, CHEMISTRY: Chemistry, TRADITION: TraditionTab,
  EXTRACTION: Extraction, FORMULATION: Formulation, SAFETY: Safety,
  ALLIES: Allies, 'FIELD NOTES': FieldNotes,
};
export { TABS };

// ── Mount ────────────────────────────────────────────────────────
// Guarded so the module can be imported outside a browser — tests/atlas-verify.cjs
// renders these components with react-dom/server to prove the ten-layer views
// survive contact with the real dossier files.
if (typeof document !== 'undefined') {
  const host = document.getElementById('atlas-explorer');
  if (host) createRoot(host).render(<AtlasExplorer />);
}

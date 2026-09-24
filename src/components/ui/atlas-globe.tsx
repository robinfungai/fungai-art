// src/components/ui/atlas-globe.tsx
//
// The Atlas's spatial layer. A region-density globe over the real herb
// records — the geographic interface to the knowledge graph, not an
// ornament.
//
// ── WHAT IT IS AND IS NOT ────────────────────────────────────────
// Every node sits at a REGION taken from recorded data (see
// atlas-regions.ts). Nothing is a collection site, because the database
// holds no coordinates and inventing them was not on the table. 223 of
// 242 organisms place; the other 19 are recorded only as "Global" and are
// listed beside the globe rather than scattered across it to fill it in.
//
// ── ZOOM CHANGES INFORMATION, NOT SIZE ──────────────────────────
//   WORLD     region names and counts. Individual nodes are faint.
//   REGION    nodes resolve, regions stay labelled.
//   BIOME     biome grouping within the region reads.
//   ORGANISM  every node is legible and hoverable.
// The tier is derived from camera distance and only enters React when it
// actually changes.
//
// ── PERFORMANCE ─────────────────────────────────────────────────
// One <points> object for all 223 nodes, with per-vertex size and colour
// attributes mutated in place. No React state is set per frame — the
// animation loop writes to typed arrays and flags them dirty. React only
// hears about hover when the hovered node CHANGES, and about tier when it
// crosses a boundary. That is what keeps this responsive as the catalogue
// grows.
//
// ── ACCESSIBILITY ───────────────────────────────────────────────
// This component is an ENHANCEMENT. The page's organism grid is the
// canonical, keyboard-navigable, WebGL-free path to every record; the
// globe renders nothing if WebGL is unavailable and the grid carries on.
// It also stops animating under prefers-reduced-motion.

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  REGIONS, placeAll, regionCounts, tierForDistance, latLonToVec3,
  type Tier, type PlacedNode, type Placeable,
} from '../../islands/atlas-regions';

// ── Palette ──────────────────────────────────────────────────────
// Taken from /atlas's OWN tokens. The first version invented a palette —
// #9ED438 and #E8B14B, neither of which appears anywhere on this page — and
// the result read as neon green against a forest-and-teal design. The page
// is cool water and warm parchment, so the earth is teal and the living
// things on it are dust and bone.
//
//   --forest #080F13   --moss #1A2E33   --fern #1E3438
//   --sage   #336065   --lichen #4D869B --mist #88BAC8
//   --dust   #C0B49A   --cream #E5D9C5  --parchment #EDE5D8
const C = {
  idle:      new THREE.Color('#C0B49A'),   // dust — warm against the cool earth
  hover:     new THREE.Color('#EDE5D8'),   // parchment
  selected:  new THREE.Color('#A8D4E0'),   // amber-lt, the page's highlight
  connected: new THREE.Color('#88BAC8'),   // mist
  dimmed:    new THREE.Color('#1E3438'),   // fern — present, not shouting
  fungus:    new THREE.Color('#E5D9C5'),   // cream
};

export interface GlobeOrganism extends Placeable {
  id: number;
  slug: string;
  name: string;
  binomial?: string;
  type?: string;
  synergy?: number[];
}

interface GlobeProps {
  organisms: GlobeOrganism[];
  /** Currently open organism, or null. Drives selected / connected / dimmed. */
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  /** Slugs still visible under the page's facet filters. Others go dim. */
  visibleSlugs?: Set<string> | null;
  /** Kingdom emphasis, e.g. 'fungus'. Non-matching nodes recede. */
  emphasis?: string | null;
  onTierChange?: (tier: Tier) => void;
  className?: string;
}

// ── The sphere ───────────────────────────────────────────────────
// Dark, matte, with a rim light. Deliberately not a satellite texture:
// this is a scientific diagram of where knowledge lives, and a photoreal
// Earth would promise a precision the data does not have.
function Sphere() {
  const uniforms = useMemo(
    () => ({ uRim: { value: new THREE.Color('#336065') }, uBase: { value: new THREE.Color('#080F13') } }),
    [],
  );
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 48]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vN; varying vec3 vV;
          void main() {
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`}
        fragmentShader={`
          uniform vec3 uRim; uniform vec3 uBase;
          varying vec3 vN; varying vec3 vV;
          void main() {
            float rim = 1.0 - max(dot(vN, vV), 0.0);
            rim = pow(rim, 3.0);
            gl_FragColor = vec4(uBase + uRim * rim * 0.85, 1.0);
          }`}
      />
    </mesh>
  );
}

/** A graticule. Now barely there — the coastlines carry the geography and
 *  this is just enough grid to read as an instrument. */
function Graticule() {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const R = 1.002;
    for (let lat = -60; lat <= 60; lat += 30) {
      for (let lon = -180; lon < 180; lon += 4) {
        pts.push(...latLonToVec3(lat, lon, R), ...latLonToVec3(lat, lon + 4, R));
      }
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let lat = -88; lat < 88; lat += 4) {
        pts.push(...latLonToVec3(lat, lon, R), ...latLonToVec3(lat + 4, lon, R));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#1A2E33" transparent opacity={0.5} />
    </lineSegments>
  );
}

/**
 * The land.
 *
 * Natural Earth 110m coastline, public domain, simplified to 128 lines and
 * 3,643 points and committed as public/atlas/coastline.json (38 KB). Fetched
 * rather than drawn: a hand-approximated Earth would be a fabricated map, and
 * this globe's whole argument is that it does not invent geography.
 *
 * Drawn as segments just above the surface so it reads as a shoreline rather
 * than a texture, and it is the REASON the globe looks like a world — before
 * it there was only a graticule, which is a ball with a grid on it.
 */
function Coastline() {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/atlas/coastline.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('coastline ' + r.status))))
      .then((data: { lines: number[][] }) => {
        if (!live) return;
        const pts: number[] = [];
        for (const flat of data.lines) {
          for (let i = 0; i + 3 < flat.length; i += 2) {
            pts.push(...latLonToVec3(flat[i + 1], flat[i], 1.004));
            pts.push(...latLonToVec3(flat[i + 3], flat[i + 2], 1.004));
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        setGeometry(g);
      })
      .catch(e => console.warn('[atlas-globe] ' + e.message));
    return () => { live = false; };
  }, []);

  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#4D869B" transparent opacity={0.62} />
    </lineSegments>
  );
}

// ── The nodes ────────────────────────────────────────────────────
function Nodes({
  placed, selectedSlug, visibleSlugs, emphasis, hovered, onHover, onSelect, tier,
}: {
  placed: PlacedNode<GlobeOrganism>[];
  selectedSlug: string | null;
  visibleSlugs?: Set<string> | null;
  emphasis?: string | null;
  hovered: number | null;
  onHover: (i: number | null) => void;
  onSelect: (slug: string | null) => void;
  tier: Tier;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(placed.length * 3);
    placed.forEach((p, i) => { pos[i * 3] = p.position[0]; pos[i * 3 + 1] = p.position[1]; pos[i * 3 + 2] = p.position[2]; });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    // Seeded, not zeroed. A zero-filled colour attribute is black and a
    // zero-filled size attribute is a zero-pixel point, so an unseeded first
    // frame draws nothing at all — and if anything ever stops the per-frame
    // write, "nothing at all" is what stays on screen.
    const col = new Float32Array(placed.length * 3);
    const siz = new Float32Array(placed.length);
    for (let i = 0; i < placed.length; i++) {
      col[i * 3] = C.idle.r; col[i * 3 + 1] = C.idle.g; col[i * 3 + 2] = C.idle.b;
      siz[i] = 6;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(siz, 1));
    return g;
  }, [placed]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // Who is connected to the selection, from the RECORDED synergy edges.
  // Not "things that happen to be nearby" — the brief is explicit that
  // visual proximity must never imply a relationship.
  const connected = useMemo(() => {
    if (!selectedSlug) return null;
    const sel = placed.find(p => p.organism.slug === selectedSlug);
    if (!sel) return null;
    const ids = new Set(sel.organism.synergy || []);
    const slugs = new Set<string>();
    for (const p of placed) if (ids.has(p.organism.id)) slugs.add(p.organism.slug);
    return slugs;
  }, [placed, selectedSlug]);

  // Written every frame into typed arrays. No setState here — that is the
  // difference between a globe that stays smooth and one that does not.
  useFrame(() => {
    const colors = geometry.getAttribute('color') as THREE.BufferAttribute;
    const sizes = geometry.getAttribute('size') as THREE.BufferAttribute;
    // At world scale nodes recede but must still READ as a field of points —
    // the first version scaled 2.6px down to 1.4px, which is indistinguishable
    // from an empty globe.
    const tierScale = tier === 'WORLD' ? 0.75 : tier === 'REGION' ? 0.9 : 1;

    for (let i = 0; i < placed.length; i++) {
      const o = placed[i].organism;
      const isSel = o.slug === selectedSlug;
      const isCon = !!connected && connected.has(o.slug);
      const filteredOut = !!visibleSlugs && !visibleSlugs.has(o.slug);
      const offEmphasis = !!emphasis && o.type !== emphasis;

      let c = C.idle, size = 6;
      if (emphasis === 'fungus' && o.type === 'fungus') c = C.fungus;
      if (filteredOut || (offEmphasis && !isSel)) { c = C.dimmed; size = 3; }
      else if (isSel) { c = C.selected; size = 17; }
      else if (isCon) { c = C.connected; size = 11; }
      else if (i === hovered) { c = C.hover; size = 13; }
      else if (selectedSlug) { c = C.dimmed; size = 4; }   // selection owns the hierarchy

      colors.setXYZ(i, c.r, c.g, c.b);
      sizes.setX(i, size * tierScale);
    }
    colors.needsUpdate = true;
    sizes.needsUpdate = true;
  });

  // A ShaderMaterial rather than pointsMaterial, because a node has to grow
  // when it is chosen and pointsMaterial's `size` is a single uniform for
  // every point. Writing the shader also buys a soft round sprite without
  // loading a texture.
  const material = useMemo(
    () => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uScale: { value: 1 } },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        uniform float uScale;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uScale;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          // Soft disc: bright core, feathered edge. Reads as a living point
          // rather than a map pin.
          vec2 d = gl_PointCoord - vec2(0.5);
          float r = length(d) * 2.0;
          if (r > 1.0) discard;
          float a = pow(1.0 - r, 1.8);
          gl_FragColor = vec4(vColor, a);
        }`,
    }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  // Retina: keep points the same apparent size across pixel ratios.
  const { gl } = useThree();
  useEffect(() => {
    material.uniforms.uScale.value = Math.min(2, gl.getPixelRatio());
  }, [material, gl]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      onPointerMove={e => {
        e.stopPropagation();
        const i = e.index ?? null;
        if (i !== hovered) onHover(i);
      }}
      onPointerOut={() => onHover(null)}
      onClick={e => {
        e.stopPropagation();
        const i = e.index;
        if (i == null) return;
        const slug = placed[i].organism.slug;
        onSelect(slug === selectedSlug ? null : slug);
      }}
    />
  );
}

/**
 * Region names. Nine labels, so plain DOM via drei is the right tool.
 *
 * Back-hemisphere culling is done here rather than with drei's `occlude`.
 * That prop raycasts against the scene and proved unreliable against a
 * shader-material sphere — it hid every label, which is exactly what a
 * label that never appears looks like. A dot product is deterministic:
 * if the region's outward normal faces away from the camera, it is round
 * the back and should not be drawn.
 */
function RegionLabels({ counts, tier }: { counts: { region: typeof REGIONS[number]; count: number }[]; tier: Tier }) {
  const [facing, setFacing] = useState<Record<string, boolean>>({});
  const positions = useMemo(
    () => counts.map(c => ({
      id: c.region.id,
      v: new THREE.Vector3(...latLonToVec3(c.region.lat, c.region.lon, 1)),
    })),
    [counts],
  );

  // Cheap, and only touches React when a label crosses the horizon.
  const last = useRef<string>('');
  useFrame(({ camera }) => {
    const next: Record<string, boolean> = {};
    for (const p of positions) next[p.id] = p.v.dot(camera.position) > 0.18;
    const key = Object.entries(next).map(([k, v]) => k + (v ? '1' : '0')).join();
    if (key !== last.current) { last.current = key; setFacing(next); }
  });

  if (tier === 'ORGANISM') return null;
  return (
    <>
      {counts.filter(c => facing[c.region.id]).map(({ region, count }) => (
        <Html
          key={region.id}
          position={latLonToVec3(region.lat, region.lon, 1.07)}
          center
          zIndexRange={[20, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="atl-globe-region">
            <span className="atl-globe-region-name">{region.label}</span>
            {tier === 'WORLD' && <span className="atl-globe-region-count">{count}</span>}
          </div>
        </Html>
      ))}
    </>
  );
}

/** Watches camera distance and reports the tier when it changes. */
function TierWatcher({ onTier }: { onTier: (t: Tier) => void }) {
  const last = useRef<Tier | null>(null);
  useFrame(({ camera }) => {
    const t = tierForDistance(camera.position.length());
    if (t !== last.current) { last.current = t; onTier(t); }
  });
  return null;
}

export default function AtlasGlobe({
  organisms, selectedSlug, onSelect, visibleSlugs, emphasis, onTierChange, className,
}: GlobeProps) {
  const [tier, setTier] = useState<Tier>('WORLD');
  const [hovered, setHovered] = useState<number | null>(null);
  const [interacting, setInteracting] = useState(false);
  const [webgl, setWebgl] = useState(true);
  const reducedMotion = useMemo(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const { placed, unplaced } = useMemo(() => placeAll(organisms), [organisms]);
  const counts = useMemo(() => regionCounts(placed), [placed]);

  const handleTier = useCallback((t: Tier) => { setTier(t); onTierChange?.(t); }, [onTierChange]);

  // WebGL is not guaranteed. If it is missing we render nothing and say so;
  // the grid below remains the complete path to the data.
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch { setWebgl(false); }
  }, []);

  const hoveredNode = hovered != null ? placed[hovered] : null;

  if (!webgl) {
    return (
      <div className={'atl-globe atl-globe-fallback ' + (className || '')}>
        <p>
          The globe needs WebGL, which this browser has not made available. Every
          organism is still listed and searchable below — the globe is a second
          way in, not the only one.
        </p>
      </div>
    );
  }

  return (
    <div className={'atl-globe ' + (className || '')}>
      <Canvas
        camera={{ position: [0, 0.6, 3.2], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        // Points are infinitely thin to a raycaster without a threshold, so
        // hovering one would be impossible. This is the hit radius in world
        // units on a globe of radius 1.
        raycaster={{ params: { Points: { threshold: 0.022 } } as any }}
        onPointerDown={() => setInteracting(true)}
        onPointerUp={() => setInteracting(false)}
      >
        <ambientLight intensity={0.6} />
        <Sphere />
        <Graticule />
        <Coastline />
        <Nodes
          placed={placed}
          selectedSlug={selectedSlug}
          visibleSlugs={visibleSlugs}
          emphasis={emphasis}
          hovered={hovered}
          onHover={setHovered}
          onSelect={onSelect}
          tier={tier}
        />
        <RegionLabels counts={counts} tier={tier} />
        <TierWatcher onTier={handleTier} />
        {/* Rotation is OrbitControls' own, not a second hand on the camera.
            An earlier version advanced camera.position in useFrame, which
            fought the controls' damping every frame. It stops while the
            pointer is down, while a dossier is open — the selection owns the
            view at that point — and under prefers-reduced-motion. */}
        <OrbitControls
          enablePan={false}
          minDistance={1.6}
          maxDistance={3.4}
          rotateSpeed={0.5}
          zoomSpeed={0.7}
          enableDamping
          dampingFactor={0.08}
          autoRotate={!interacting && !selectedSlug && !reducedMotion}
          autoRotateSpeed={0.28}
        />
      </Canvas>

      {/* Hover identity. Common name and Latin name, as §09 asks. */}
      <div className="atl-globe-readout" aria-live="polite">
        {hoveredNode ? (
          <>
            <span className="atl-globe-readout-name">{hoveredNode.organism.name}</span>
            {hoveredNode.organism.binomial && (
              <em className="atl-globe-readout-bino">{hoveredNode.organism.binomial}</em>
            )}
            <span className="atl-globe-readout-region">{hoveredNode.region.label}</span>
          </>
        ) : (
          <span className="atl-globe-readout-hint">
            {tier === 'WORLD' ? 'Drag to turn · scroll to draw closer'
              : tier === 'ORGANISM' ? 'Every organism is legible here'
              : 'Closer in, the organisms resolve'}
          </span>
        )}
      </div>

      {/* The honest footnote. It is not decoration — it is the reason the
          globe looks the way it does. */}
      <p className="atl-globe-note">
        <strong>{placed.length}</strong> organisms placed by recorded range and
        tradition. A node sits at a <em>region</em>, never a collection site —
        the database holds no coordinates and none were invented.
        {unplaced.length > 0 && (
          <> <strong>{unplaced.length}</strong> are recorded only as cosmopolitan
          and are not on the globe.</>
        )}
      </p>
    </div>
  );
}

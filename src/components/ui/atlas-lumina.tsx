// src/components/ui/atlas-lumina.tsx
//
// The Fungi Kingdom's visual transformation layer. The glass-bubble morph
// from the supplied LuminaInteractiveList, rebuilt as a controlled React
// component that the Atlas drives.
//
// ── WHAT WAS KEPT ────────────────────────────────────────────────
// The shader. All of it: the expanding circular wavefront, the radial
// refraction that bends the incoming image away from the bubble centre,
// per-channel chromatic aberration, the rim glow at the boundary, and the
// liquid sine/cosine drift. That technique is the reason the component was
// supplied and it is preserved uniform for uniform.
//
// ── WHAT WAS REMOVED, AND WHY ────────────────────────────────────
// · CDN <script> loading of three and gsap. `three` is already a project
//   dependency; injecting r128 from a CDN would run a SECOND, older copy of
//   three alongside it. gsap is not a dependency and is not needed — one
//   eased number per frame is four lines (see `easeInOutQuad`).
// · document.getElementById('mainTitle') + innerHTML + querySelectorAll.
//   The title is React's to render. The original reached outside its own
//   tree, which is why it needed `id` attributes that could collide with
//   anything else on the page.
// · Autoplay, the progress bars, the slide counter and the 5-second timer.
//   §21: the visitor controls this. A transition happens BECAUSE an organism
//   was selected. There is no timer left to remove.
// · uEffectType and the frost/ripple/plasma/timeshift branches — all four
//   were `mix(tex1, tex2, progress)` stubs. Dead uniforms and dead branches
//   in a fragment shader are still compiled.
// · The six CDN stock images. §17 names the two local assets, and they are
//   the only ones used.
// · `return () => {}` — the original never cleaned up. See the disposal
//   note below.
//
// ── LIFECYCLE (§32) ──────────────────────────────────────────────
// Rendering goes through R3F's <Canvas>, which owns the renderer and
// disposes the scene graph on unmount. What R3F does NOT own is what we
// allocate by hand: the textures and the ShaderMaterial. Both are disposed
// explicitly. There are no timers, no manual requestAnimationFrame loop and
// no window listeners to leak — the resize uniform reads R3F's own `size`.
//
// ── IT IS NOT FULL-SCREEN (§18) ──────────────────────────────────
// The original sized itself to window.innerWidth/innerHeight and assumed it
// owned the viewport. This one fills its container, and `uResolution` is the
// canvas size from R3F, so the shader's cover-fit maths is correct inside a
// panel.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export interface LuminaOrganism {
  slug: string;
  name: string;
  binomial?: string;
  /** Local image for this organism. The §36 seam: when Higgsfield assets
   *  arrive this becomes a field on the record rather than a lookup. */
  image: string;
}

interface LuminaProps {
  /** Only organisms that actually have imagery. Two, today. */
  organisms: LuminaOrganism[];
  /** The selected organism's slug, owned by the Atlas. */
  activeSlug: string | null;
  /** Selecting here opens the same dossier as the globe and the grid. */
  onSelect: (slug: string) => void;
  transitionSeconds?: number;
}

const VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The glass effect, carried over intact. Only the effect switch and the four
// stub functions are gone.
const FRAGMENT = `
  uniform sampler2D uTexture1, uTexture2;
  uniform float uProgress;
  uniform vec2 uResolution, uTexture1Size, uTexture2Size;
  uniform float uGlobalIntensity, uSpeedMultiplier, uDistortionStrength;
  uniform float uGlassRefractionStrength, uGlassChromaticAberration;
  uniform float uGlassBubbleClarity, uGlassEdgeGlow, uGlassLiquidFlow;
  varying vec2 vUv;

  // Cover-fit, so neither photograph is stretched by the panel's aspect.
  vec2 getCoverUV(vec2 uv, vec2 textureSize) {
    vec2 s = uResolution / textureSize;
    float scale = max(s.x, s.y);
    vec2 scaledSize = textureSize * scale;
    vec2 offset = (uResolution - scaledSize) * 0.5;
    return (uv * uResolution - offset) / scaledSize;
  }

  vec4 glassEffect(vec2 uv, float progress) {
    float time = progress * 5.0 * uSpeedMultiplier;
    vec2 uv1 = getCoverUV(uv, uTexture1Size);
    vec2 uv2 = getCoverUV(uv, uTexture2Size);

    // The wavefront: a circle growing from the centre past the far corner.
    float maxR = length(uResolution) * 0.85;
    float br = progress * maxR;
    vec2 p = uv * uResolution;
    vec2 c = uResolution * 0.5;
    float d = length(p - c);
    float nd = d / max(br, 0.001);
    float param = smoothstep(br + 3.0, br - 3.0, d);

    vec4 img;
    if (param > 0.0) {
      float ro = 0.08 * uGlassRefractionStrength * uDistortionStrength * uGlobalIntensity
               * pow(smoothstep(0.3 * uGlassBubbleClarity, 1.0, nd), 1.5);
      vec2 dir = (d > 0.0) ? (p - c) / d : vec2(0.0);
      vec2 distUV = uv2 - dir * ro;
      distUV += vec2(sin(time + nd * 10.0), cos(time * 0.8 + nd * 8.0))
              * 0.015 * uGlassLiquidFlow * uSpeedMultiplier * nd * param;

      float ca = 0.02 * uGlassChromaticAberration * uGlobalIntensity
               * pow(smoothstep(0.3, 1.0, nd), 1.2);
      img = vec4(
        texture2D(uTexture2, distUV + dir * ca * 1.2).r,
        texture2D(uTexture2, distUV + dir * ca * 0.2).g,
        texture2D(uTexture2, distUV - dir * ca * 0.8).b,
        1.0);

      if (uGlassEdgeGlow > 0.0) {
        float rim = smoothstep(0.95, 1.0, nd) * (1.0 - smoothstep(1.0, 1.01, nd));
        img.rgb += rim * 0.08 * uGlassEdgeGlow * uGlobalIntensity;
      }
    } else {
      img = texture2D(uTexture2, uv2);
    }

    vec4 oldImg = texture2D(uTexture1, uv1);
    // Settle any refraction still lingering at the very end.
    if (progress > 0.95) img = mix(img, texture2D(uTexture2, uv2), (progress - 0.95) / 0.05);
    return mix(oldImg, img, param);
  }

  void main() { gl_FragColor = glassEffect(vUv, uProgress); }
`;

/** gsap's power2.inOut, without gsap. */
const easeInOutQuad = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function Morph({
  organisms, activeSlug, transitionSeconds,
}: { organisms: LuminaOrganism[]; activeSlug: string | null; transitionSeconds: number }) {
  const { size, gl } = useThree();
  const [textures, setTextures] = useState<Map<string, THREE.Texture> | null>(null);

  // Load the imagery once. Two files, so a loader per mount is fine; the
  // disposal is the part that matters.
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const map = new Map<string, THREE.Texture>();
    let cancelled = false;
    Promise.all(organisms.map(o => new Promise<void>(resolve => {
      loader.load(
        o.image,
        t => {
          t.minFilter = t.magFilter = THREE.LinearFilter;
          t.colorSpace = THREE.SRGBColorSpace;
          t.userData = { size: new THREE.Vector2(t.image.width, t.image.height) };
          map.set(o.slug, t);
          resolve();
        },
        undefined,
        () => { console.warn('[lumina] texture failed: ' + o.image); resolve(); },
      );
    }))).then(() => {
      if (cancelled) { map.forEach(t => t.dispose()); return; }
      setTextures(map);
    });
    return () => {
      cancelled = true;
      map.forEach(t => t.dispose());
    };
  }, [organisms]);

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTexture1: { value: null }, uTexture2: { value: null },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTexture1Size: { value: new THREE.Vector2(1, 1) },
      uTexture2Size: { value: new THREE.Vector2(1, 1) },
      // The Default preset from the reference config.
      uGlobalIntensity: { value: 1.0 },
      uSpeedMultiplier: { value: 1.0 },
      uDistortionStrength: { value: 1.0 },
      uGlassRefractionStrength: { value: 1.0 },
      uGlassChromaticAberration: { value: 1.0 },
      uGlassBubbleClarity: { value: 1.0 },
      uGlassEdgeGlow: { value: 1.0 },
      uGlassLiquidFlow: { value: 1.0 },
    },
  }), []);

  useEffect(() => () => material.dispose(), [material]);

  // Resolution follows the CANVAS, not the window — this lives in a panel.
  useEffect(() => {
    const dpr = Math.min(2, gl.getPixelRatio());
    material.uniforms.uResolution.value.set(size.width * dpr, size.height * dpr);
  }, [material, size.width, size.height, gl]);

  // The transition. `from` is what is on screen; `to` is what was selected.
  const shown = useRef<string | null>(null);
  const anim = useRef<{ from: string; to: string; t: number } | null>(null);

  const setPair = (fromSlug: string, toSlug: string) => {
    const a = textures?.get(fromSlug), b = textures?.get(toSlug);
    if (!a || !b) return false;
    material.uniforms.uTexture1.value = a;
    material.uniforms.uTexture2.value = b;
    material.uniforms.uTexture1Size.value = a.userData.size;
    material.uniforms.uTexture2Size.value = b.userData.size;
    return true;
  };

  useEffect(() => {
    if (!textures || !textures.size) return;
    const target = (activeSlug && textures.has(activeSlug)) ? activeSlug : organisms[0]?.slug;
    if (!target) return;

    // First paint: show the target outright, no transition from nothing.
    if (shown.current === null) {
      setPair(target, target);
      material.uniforms.uProgress.value = 1;
      shown.current = target;
      return;
    }
    if (target === shown.current) return;
    if (setPair(shown.current, target)) {
      material.uniforms.uProgress.value = 0;
      anim.current = { from: shown.current, to: target, t: 0 };
    }
  }, [textures, activeSlug, organisms, material]);

  useFrame((_, dt) => {
    const a = anim.current;
    if (!a) return;
    a.t = Math.min(1, a.t + dt / transitionSeconds);
    material.uniforms.uProgress.value = easeInOutQuad(a.t);
    if (a.t >= 1) {
      // Settle: the arriving image becomes the resting one.
      setPair(a.to, a.to);
      material.uniforms.uProgress.value = 1;
      shown.current = a.to;
      anim.current = null;
    }
  });

  if (!textures) return null;
  return (
    <mesh material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export default function AtlasLumina({
  organisms, activeSlug, onSelect, transitionSeconds = 2.0,
}: LuminaProps) {
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl')));
    } catch { setWebgl(false); }
  }, []);

  const active = organisms.find(o => o.slug === activeSlug) || organisms[0];
  if (!organisms.length || !active) return null;

  return (
    <section className="atl-lumina" aria-label="Fungal material">
      {webgl && (
        <Canvas
          className="atl-lumina-canvas"
          orthographic
          camera={{ left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 1, position: [0, 0, 0.5] }}
          dpr={[1, 2]}
          gl={{ antialias: false, alpha: false }}
        >
          <Morph organisms={organisms} activeSlug={activeSlug} transitionSeconds={transitionSeconds} />
        </Canvas>
      )}

      {/* Without WebGL the photograph is still the photograph. */}
      {!webgl && (
        <img className="atl-lumina-fallback" src={active.image} alt={active.name} />
      )}

      {/* React renders the caption. The original wrote innerHTML into an
          element it found by id, from outside its own tree. */}
      <div className="atl-lumina-caption">
        <h3 className="atl-lumina-name">{active.name}</h3>
        {active.binomial && <em className="atl-lumina-bino">{active.binomial}</em>}
      </div>

      {/* The choice. Real buttons: focusable, keyboard-operable, announced —
          §34 and §35 both rule out anything that needs hover. */}
      <nav className="atl-lumina-choice" aria-label="Choose a fungus">
        {organisms.map(o => (
          <button
            key={o.slug}
            type="button"
            className={'atl-lumina-pick' + (o.slug === active.slug ? ' is-active' : '')}
            aria-pressed={o.slug === active.slug}
            onClick={() => onSelect(o.slug)}
          >
            <span className="atl-lumina-pick-rule" aria-hidden="true" />
            <span className="atl-lumina-pick-name">{o.name}</span>
          </button>
        ))}
      </nav>
    </section>
  );
}

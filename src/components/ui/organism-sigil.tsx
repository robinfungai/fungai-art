// src/components/ui/organism-sigil.tsx
//
// A seal for each organism, drawn from its own record.
//
// ── WHY NOT PHOTOGRAPHS ──────────────────────────────────────────
// There are two photographs in this repo and 242 organisms. Filling the
// grid with stock imagery would put a picture of someone else's plant
// under our name for the other 240, and a generic leaf icon repeated 242
// times is decoration pretending to be information.
//
// So the card carries a sigil, and every mark in it is read from the
// record. Two organisms look alike only where they ARE alike:
//
//   type            the core mark — cap, stem, frond, droplet, crystal
//   chemistry       one filament per constituent class, radiating
//   tradition       the hue, from the page's own palette
//   evidence grade  how much of the ring is drawn — A closes it, D barely starts
//   caution level   the ring's weight, so a HIGH-caution plant reads heavier
//   slug            the seed for rotation, so the set does not look stamped
//
// It is an identicon with a botany, and it scales: a new herb gets a seal
// the moment its record exists. When Higgsfield imagery arrives (§36) this
// becomes the fallback rather than the default.

import { useMemo } from 'react';

export interface SigilRecord {
  slug: string;
  type?: string;
  chem?: string[];
  tradition?: string;
  grade?: string;
  caution_level?: string;
}

// The page's tokens. A tradition is a hue, not a label with a colour on it.
const TRADITION_HUE: Record<string, string> = {
  NORDIC: '#88BAC8', TCM: '#C0B49A', AYURVEDA: '#D8C08A',
  EUROPEAN: '#8FB4A8', MEDITERRANEAN: '#C8AE8A', AFRICAN: '#C89A7A',
  MESOAMERICAN: '#B79BC0', 'SOUTH AMERICAN': '#9FC0A8',
  'NORTH AMERICAN': '#A8B8C8', GLOBAL: '#9AA79E',
};

// Evidence closes the ring. A is a complete circle; D is a tick of one.
const GRADE_SWEEP: Record<string, number> = {
  'A+': 1, A: 0.95, 'A-': 0.88, 'B+': 0.8, B: 0.72, 'B-': 0.64,
  'C+': 0.54, C: 0.46, 'C-': 0.38, 'D+': 0.28, D: 0.2, 'D-': 0.14,
  traditional: 0.46,
};

const CAUTION_WEIGHT: Record<string, number> = {
  LOW: 1, 'LOW-MEDIUM': 1.3, MEDIUM: 1.7, 'MEDIUM-HIGH': 2.1,
  HIGH: 2.5, 'VERY HIGH': 3,
};

/** Stable hash — the same organism must always draw the same seal. */
function seed(slug: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/** The core mark. One per kingdom, so a fungus never looks like a mineral. */
function coreMark(type: string, c: string) {
  switch (type) {
    case 'fungus':   // a cap over a stem
      return (
        <>
          <path d="M11 21c0-5 3.6-8.5 9-8.5s9 3.5 9 8.5z" fill={c} opacity=".9" />
          <path d="M18.4 21v6.5c0 1.2.7 1.8 1.6 1.8s1.6-.6 1.6-1.8V21" fill={c} opacity=".55" />
        </>
      );
    case 'algae':    // fronds in water
      return (
        <>
          <path d="M12 29c3-4 3-9 1.5-13" stroke={c} strokeWidth="1.6" fill="none" opacity=".85" />
          <path d="M20 30c0-6 1-11 3-15" stroke={c} strokeWidth="1.6" fill="none" opacity=".85" />
          <path d="M27.5 29c-2-4-2.5-8-1.5-12" stroke={c} strokeWidth="1.6" fill="none" opacity=".7" />
        </>
      );
    case 'resin':    // a bead about to fall
      return <path d="M20 11c4.4 5.6 6.6 9.2 6.6 12.1A6.6 6.6 0 0 1 20 29.7a6.6 6.6 0 0 1-6.6-6.6c0-2.9 2.2-6.5 6.6-12.1z" fill={c} opacity=".88" />;
    case 'mineral':  // a cut face
      return <path d="M20 10.5 28.5 17 25 29h-10l-3.5-12z" fill="none" stroke={c} strokeWidth="1.7" opacity=".9" />;
    case 'ferment':  // a turning vessel
      return (
        <>
          <circle cx="20" cy="20.5" r="7.5" fill="none" stroke={c} strokeWidth="1.6" opacity=".85" />
          <path d="M14 20.5c2-3 4-3 6 0s4 3 6 0" stroke={c} strokeWidth="1.5" fill="none" opacity=".8" />
        </>
      );
    case 'hive':
      return <path d="M20 11.5l7.4 4.3v8.4L20 28.5l-7.4-4.3v-8.4z" fill="none" stroke={c} strokeWidth="1.7" opacity=".9" />;
    default:         // plant — a stem with two leaves
      return (
        <>
          <path d="M20 30V13" stroke={c} strokeWidth="1.7" opacity=".85" />
          <path d="M20 19c-1.5-4.5-5-6-7.5-6 0 3.5 2.5 6.6 7.5 6z" fill={c} opacity=".8" />
          <path d="M20 23.5c1.4-4 4.6-5.4 6.9-5.4 0 3.2-2.3 6-6.9 5.4z" fill={c} opacity=".62" />
        </>
      );
  }
}

export default function OrganismSigil({
  record, size = 40, className,
}: { record: SigilRecord; size?: number; className?: string }) {
  const { hue, sweep, weight, filaments, rot } = useMemo(() => {
    const h = seed(record.slug);
    return {
      hue: TRADITION_HUE[record.tradition || 'GLOBAL'] || TRADITION_HUE.GLOBAL,
      sweep: GRADE_SWEEP[(record.grade || '').toUpperCase()] ?? GRADE_SWEEP[record.grade || ''] ?? 0.3,
      weight: CAUTION_WEIGHT[record.caution_level || 'LOW'] || 1,
      // One filament per recorded constituent class, capped so a well-studied
      // plant is legibly busier without becoming a scribble.
      filaments: Math.min(8, (record.chem || []).length),
      rot: h % 360,
    };
  }, [record.slug, record.tradition, record.grade, record.caution_level, record.chem]);

  const R = 17;
  const circumference = 2 * Math.PI * R;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {/* Chemistry: filaments radiating from the core, rotated by the slug so
          the grid does not look stamped from one die. */}
      <g transform={`rotate(${rot} 20 20)`} opacity=".5">
        {Array.from({ length: filaments }).map((_, i) => {
          const a = (i / Math.max(1, filaments)) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={20 + Math.cos(a) * 9.5} y1={20 + Math.sin(a) * 9.5}
              x2={20 + Math.cos(a) * 15.5} y2={20 + Math.sin(a) * 15.5}
              stroke={hue} strokeWidth=".9" strokeLinecap="round"
            />
          );
        })}
      </g>

      {/* Evidence: how much of the ring is earned. Caution: how heavy it is. */}
      <circle cx="20" cy="20" r={R} fill="none" stroke={hue} strokeWidth=".6" opacity=".16" />
      <circle
        cx="20" cy="20" r={R}
        fill="none" stroke={hue}
        strokeWidth={0.9 * weight}
        strokeLinecap="round"
        strokeDasharray={`${circumference * sweep} ${circumference}`}
        transform="rotate(-90 20 20)"
        opacity=".78"
      />

      {coreMark(record.type || 'plant', hue)}
    </svg>
  );
}

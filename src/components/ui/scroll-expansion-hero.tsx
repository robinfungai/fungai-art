// src/components/ui/scroll-expansion-hero.tsx
//
// Scroll-expansion hero. A media card grows from a small portrait frame to
// full bleed while the page scroll is held, the title splits and slides apart
// to reveal it, and the page content below fades in once the timeline
// completes and the lock releases.
//
// The motion engine is kept as specified:
//   · state-driven timeline — wheel / touchmove are hijacked to drive a
//     single `progress` value 0 → 1. No CSS scroll-timeline.
//   · dimensional scaling — the card grows by absolute pixel maths on
//     width/height, NOT transform: scale(), so the media is never soft and
//     the text inside never distorts.
//   · typography splitting — the title is cut into firstWord / restOfTitle,
//     pushed in opposite directions by progress.
//   · opacity fades — background out, children in, gated on progress.
//
// Two deliberate deviations from the brief, both forced by this repo:
//
//   1. No framer-motion. It is not a dependency here and the only thing it
//      was doing in the original is opacity, which is three CSS transitions.
//      Adding a ~50 KB animation runtime to the landing page to fade two
//      elements is not a trade worth making. Mechanics are unchanged.
//   2. No Tailwind class names. This component is bundled as a static-page
//      island (public/atlas/), outside Tailwind's content scan, so the
//      utility classes would compile to nothing. Styles are inline + a
//      scoped <style> block.
//
// Accessibility: prefers-reduced-motion skips the scroll-jack entirely and
// renders the completed state, because hijacking scroll is exactly the class
// of motion that setting exists to refuse.

import {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
  type ReactNode,
} from 'react';

export interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title: string;
  date?: string;
  scrollToExpand?: string;
  children?: ReactNode;
}

// Wheel delta needed to travel the whole timeline. Tuned so one firm
// trackpad flick is most of it and a mouse wheel takes ~4 notches.
const TRAVEL = 900;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function ScrollExpandMedia({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  children,
}: ScrollExpandMediaProps) {
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [vw, setVw] = useState(1280);
  const [vh, setVh] = useState(800);

  const sectionRef = useRef<HTMLElement | null>(null);
  // Progress is read inside native listeners registered once; a ref keeps
  // them looking at the live value without re-binding on every frame.
  const progressRef = useRef(0);
  const touchY = useRef<number | null>(null);

  const setProgressBoth = useCallback((next: number) => {
    const v = clamp(next, 0, 1);
    progressRef.current = v;
    setProgress(v);
  }, []);

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMq = () => {
      setReduced(mq.matches);
      if (mq.matches) { progressRef.current = 1; setProgress(1); }
    };
    applyMq();
    mq.addEventListener('change', applyMq);

    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => { mq.removeEventListener('change', applyMq); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    if (reduced) return;

    // The lock only applies while the hero owns the viewport: progress < 1
    // AND the document is at the top. Past that the page scrolls natively,
    // and scrolling back up to the top hands control back to the timeline.
    const onWheel = (e: WheelEvent) => {
      const p = progressRef.current;
      const atTop = window.scrollY <= 0;
      if (p < 1 && atTop) {
        e.preventDefault();
        setProgressBoth(p + e.deltaY / TRAVEL);
      } else if (p >= 1 && atTop && e.deltaY < 0) {
        e.preventDefault();
        setProgressBoth(p + e.deltaY / TRAVEL);
      }
    };

    const onTouchStart = (e: TouchEvent) => { touchY.current = e.touches[0].clientY; };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY.current == null) return;
      const p = progressRef.current;
      const dy = touchY.current - e.touches[0].clientY;   // down-swipe = positive
      const atTop = window.scrollY <= 0;
      if ((p < 1 && atTop) || (p >= 1 && atTop && dy < 0)) {
        e.preventDefault();
        setProgressBoth(p + dy / (TRAVEL * 0.55));        // touch travel is shorter
        touchY.current = e.touches[0].clientY;
      }
    };
    const onTouchEnd = () => { touchY.current = null; };

    // passive: false — preventDefault is the whole mechanism.
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [reduced, setProgressBoth]);

  const p = progress;
  const isNarrow = vw < 760;

  // ── Dimensional scaling · absolute pixels, never transform: scale() ──
  const baseW = isNarrow ? 180 : 300;
  const baseH = isNarrow ? 260 : 400;
  const maxW  = Math.min(isNarrow ? vw - 24 : 1550, vw - (isNarrow ? 24 : 48));
  const maxH  = Math.min(isNarrow ? vh * 0.62 : 870, vh - (isNarrow ? 150 : 120));
  const mediaW = baseW + p * (maxW - baseW);
  const mediaH = baseH + p * (maxH - baseH);

  // ── Typography splitting ──
  const words = title.trim().split(/\s+/);
  const firstWord = words[0] ?? '';
  const restOfTitle = words.slice(1).join(' ');
  const push = p * (isNarrow ? vw * 0.30 : vw * 0.22);

  const complete = p >= 1;

  return (
    <section
      ref={sectionRef}
      className="sem-root"
      style={{ ['--sem-p' as string]: String(p) }}
      aria-label={title}
    >
      <style>{SEM_CSS}</style>

      <div className="sem-stage" style={{ height: reduced ? 'auto' : '100vh' }}>
        {/* Background plate — fades out as the media takes the frame */}
        <div
          className="sem-bg"
          style={{ backgroundImage: `url("${bgImageSrc}")`, opacity: 1 - p * 0.92 }}
          aria-hidden="true"
        />
        <div className="sem-veil" style={{ opacity: 0.35 + p * 0.35 }} aria-hidden="true" />

        {/* The expanding card */}
        <div className="sem-media-wrap">
          <div
            className="sem-media"
            style={{ width: `${mediaW}px`, height: `${mediaH}px`, borderRadius: `${24 - p * 16}px` }}
          >
            {mediaType === 'video' ? (
              <video
                src={mediaSrc}
                poster={posterSrc}
                autoPlay muted loop playsInline preload="metadata"
                // Decorative: the dossiers below carry the actual content.
                aria-hidden="true"
              />
            ) : (
              <img src={mediaSrc} alt="" aria-hidden="true" />
            )}
            <div className="sem-media-veil" style={{ opacity: 0.45 - p * 0.35 }} />
          </div>
        </div>

        {/* Split title, pushed apart to reveal the media behind it */}
        <div className="sem-title" aria-hidden={complete ? 'true' : undefined}>
          <h1>
            <span className="sem-word" style={{ transform: `translateX(${-push}px)` }}>{firstWord}</span>
            {restOfTitle && (
              <span className="sem-word" style={{ transform: `translateX(${push}px)` }}>{restOfTitle}</span>
            )}
          </h1>
          <div className="sem-meta" style={{ opacity: 1 - p * 1.6 }}>
            {date && <span className="sem-date">{date}</span>}
            {scrollToExpand && <span className="sem-hint">{scrollToExpand}</span>}
          </div>
        </div>

        {/* Screen-reader + no-JS title. The visual one is aria-hidden once
            it has slid apart, so the page keeps exactly one h1. */}
        <h1 className="sem-sr">{title}</h1>

        {!reduced && (
          <div className="sem-rail" aria-hidden="true">
            <div className="sem-rail-fill" style={{ transform: `scaleY(${p})` }} />
          </div>
        )}
      </div>

      <div
        className="sem-children"
        style={{
          opacity: complete || reduced ? 1 : 0,
          pointerEvents: complete || reduced ? 'auto' : 'none',
          transform: complete || reduced ? 'translateY(0)' : 'translateY(24px)',
        }}
      >
        {children}
      </div>
    </section>
  );
}

const SEM_CSS = `
.sem-root { position: relative; display: block; }
.sem-stage {
  position: relative; width: 100%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.sem-bg {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  transform: scale(1.04); will-change: opacity;
}
.sem-veil {
  position: absolute; inset: 0;
  background: radial-gradient(120% 90% at 50% 45%, rgba(5,9,12,0) 0%, rgba(5,9,12,.85) 78%), #05090C;
}
.sem-media-wrap { position: relative; display: flex; align-items: center; justify-content: center; }
.sem-media {
  position: relative; overflow: hidden;
  box-shadow: 0 40px 120px rgba(0,0,0,.65);
  border: 0.5px solid rgba(136,186,200,.18);
  will-change: width, height;
}
.sem-media > video, .sem-media > img {
  width: 100%; height: 100%; object-fit: cover; display: block;
}
.sem-media-veil { position: absolute; inset: 0; background: #05090C; pointer-events: none; }
.sem-title {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 22px;
  pointer-events: none; text-align: center; padding: 0 16px;
}
.sem-title h1 {
  margin: 0; display: flex; flex-wrap: nowrap; align-items: baseline; gap: .28em;
  font-family: var(--serif, 'Cormorant Garamond', Georgia, serif);
  font-weight: 300; font-style: italic;
  font-size: clamp(2.6rem, 9vw, 7.5rem); line-height: .95;
  color: #EDE5D8; letter-spacing: -0.015em;
  text-shadow: 0 2px 40px rgba(0,0,0,.7);
}
.sem-word { display: inline-block; will-change: transform; }
.sem-meta {
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap; justify-content: center;
  font-family: var(--mono, 'Courier New', monospace);
  font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: #88BAC8;
}
.sem-hint::before { content: '↓'; margin-right: .8em; }
.sem-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
.sem-rail {
  position: absolute; right: 26px; top: 50%; transform: translateY(-50%);
  width: 1px; height: 120px; background: rgba(136,186,200,.16);
}
.sem-rail-fill {
  width: 100%; height: 100%; background: #88BAC8; transform-origin: top;
}
.sem-children {
  transition: opacity .7s ease, transform .7s cubic-bezier(.16,1,.3,1);
  will-change: opacity, transform;
}
@media (prefers-reduced-motion: reduce) {
  .sem-children { transition: none; }
  .sem-media { transition: none; }
}
`;

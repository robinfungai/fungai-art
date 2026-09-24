// src/islands/atlas-hero.tsx
//
// The entrance to /atlas: the scroll-expansion hero, and immediately below it
// the three doors the site actually wants people to walk through.
//
// The doors are children of the hero, so they fade in the moment the scroll
// timeline completes — that is the whole point of the component. One primary
// action (the atlas), two flagships beside it, nothing else competing.

import { createRoot } from 'react-dom/client';
import ScrollExpandMedia from '../components/ui/scroll-expansion-hero';

interface Door {
  kicker: string;
  title: string;
  line: string;
  href: string;
  glyph: string;
  primary?: boolean;
}

const DOORS: Door[] = [
  {
    kicker: 'Begin here',
    title: 'ENTER THE ATLAS',
    line: 'Explore the intelligence of the botanical world — 243 organisms, their chemistry, their traditions and how they relate to one another.',
    href: '#atlas',
    glyph: '❋',
    primary: true,
  },
  {
    kicker: 'The reading',
    title: 'FIND YOUR FORMULA',
    line: 'Discover your botanical constellation. A guided reading composes an extract around your own pattern.',
    href: '/find-your-formula',
    glyph: '✦',
  },
  {
    kicker: 'The source',
    title: 'ENTER THE FIELD',
    line: 'Explore where Fungai gathers its materials — and how they end up in bottles.',
    href: '/foraging',
    glyph: '◈',
  },
];

function Doors() {
  return (
    <section className="doors" id="doors" aria-label="Where to begin">
      <p className="doors-lede">
        A living intelligence of plants, fungi &amp; human intention.
      </p>
      <div className="doors-row">
        {DOORS.map(d => (
          <a
            key={d.title}
            className={'door' + (d.primary ? ' door-primary' : '')}
            href={d.href}
          >
            <span className="door-glyph" aria-hidden="true">{d.glyph}</span>
            <span className="door-kicker">{d.kicker}</span>
            <span className="door-title">{d.title}</span>
            <span className="door-line">{d.line}</span>
            <span className="door-go" aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export { Doors };

// Guarded so the module is importable outside a browser (see the explorer).
if (typeof document !== 'undefined') {
  const host = document.getElementById('atlas-hero');
  if (host) {
    createRoot(host).render(
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="/atlas/new-vid.mp4"
        posterSrc="/atlas/first-photo.jpg"
        bgImageSrc="/atlas/first-photo.jpg"
        title="Fungai Art"
        date="2026"
        scrollToExpand="Scroll to explore"
      >
        <Doors />
      </ScrollExpandMedia>,
    );
  }
}

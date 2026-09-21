// Wave-line background for /mixology and /extraction.
//
// A fixed layer behind the page (z-index -1, no pointer events), so the
// tools on top stay fully clickable and scrollable. The page's body
// background is made transparent — html keeps the same colour — or the
// body box would paint over the layer.
//
// Density: 14 × 12 px gaps instead of the component's default 8 × 8. On a
// 1440 × 900 screen that's ~9,000 points per frame instead of ~24,000.
// The component pauses while the tab is hidden and draws a still frame
// for visitors who prefer reduced motion.
//
// Built by scripts/build-islands.cjs → public/islands/waves.js.
import { createRoot } from 'react-dom/client';
import { Waves } from '../components/ui/wave-background';

function mount() {
  if (document.getElementById('fa-waves-bg')) return;

  const style = document.createElement('style');
  style.textContent = 'body{background:transparent!important}';
  document.head.appendChild(style);

  const host = document.createElement('div');
  host.id = 'fa-waves-bg';
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed', inset: '0', zIndex: '-1', pointerEvents: 'none',
    opacity: '0', transition: 'opacity 1.4s ease',
  });
  document.body.prepend(host);

  createRoot(host).render(
    <Waves
      strokeColor="rgba(107, 214, 111, 0.11)"
      backgroundColor="transparent"
      pointerSize={0.3}
      xGap={14}
      yGap={12}
    />
  );
  requestAnimationFrame(() => { host.style.opacity = '1'; });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
else mount();

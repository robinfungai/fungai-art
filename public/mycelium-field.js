/*
 * Living mycelium field — animated background, a cousin of the /members
 * backdrop. Instead of one static hyphal tree with pulsing strokes, hyphae
 * GROW outward from several points along the edges, linger, fade and regrow
 * in staggered waves, while spores drift slowly upward and two soft glows
 * wander.
 *
 *   <script src="/mycelium-field.js" data-variant="community"></script>
 *     → fixed, full-page layer behind the content (z-index 0).
 *
 *   <script src="/mycelium-field.js" data-variant="subtle" data-targets="#manifesto,#about"></script>
 *     → a quieter layer placed inside each target section, behind its content.
 *
 * Honours prefers-reduced-motion (static, no spores). Fewer elements on phones.
 */
(function () {
  var script = document.currentScript;
  var variant = (script && script.getAttribute('data-variant')) || 'community';
  var targets = (script && script.getAttribute('data-targets')) || '';
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var phone = (window.innerWidth || 1024) < 700;

  var P = variant === 'subtle'
    ? { opacity: 0.30, sources: 4, depth: 3, maxPaths: 34, spores: 6, speed: 1.7, glow: 0.55, stroke: 0.55 }
    : { opacity: 0.4, sources: 6, depth: 4, maxPaths: 92, spores: 18, speed: 1, glow: 1, stroke: 0.55 };
  if (phone) { P.maxPaths = Math.round(P.maxPaths * 0.55); P.spores = Math.round(P.spores * 0.5); }

  var PALETTE = ['#6abf88', '#88BAC8', '#E8B14B', '#A88FE0'];
  var NS = 'http://www.w3.org/2000/svg';

  function rng(seed) {
    var s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function injectCss() {
    if (document.getElementById('mf-style')) return;
    var st = document.createElement('style');
    st.id = 'mf-style';
    st.textContent = [
      '.mf-field{pointer-events:none;overflow:hidden}',
      '.mf-field.mf-fixed{position:fixed;inset:0;z-index:0}',
      '.mf-host{position:relative;isolation:isolate}',
      '.mf-field.mf-inset{position:absolute;inset:0;z-index:-1}',
      '.mf-field svg{position:absolute;inset:0;width:100%;height:100%}',
      '.mf-field path{fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:var(--len);stroke-dashoffset:var(--len);' +
        'animation:mfGrow var(--dur) cubic-bezier(.45,.05,.35,1) var(--delay) infinite}',
      '@keyframes mfGrow{0%{stroke-dashoffset:var(--len);opacity:0}6%{opacity:1}42%{stroke-dashoffset:0;opacity:1}' +
        '78%{stroke-dashoffset:0;opacity:.85}100%{stroke-dashoffset:0;opacity:0}}',
      '.mf-field circle{animation:mfNode var(--dur) ease-in-out var(--delay) infinite;transform-box:fill-box;transform-origin:center}',
      '@keyframes mfNode{0%,35%{opacity:0;transform:scale(.4)}48%{opacity:1;transform:scale(1.3)}70%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(.6)}}',
      '.mf-glow{position:absolute;width:60vmax;height:60vmax;border-radius:50%;filter:blur(40px);animation:mfWander var(--dur) ease-in-out infinite alternate}',
      '@keyframes mfWander{from{transform:translate(-10%,-6%) scale(1)}to{transform:translate(12%,8%) scale(1.15)}}',
      '.mf-spore{position:absolute;bottom:-4%;border-radius:50%;animation:mfRise var(--dur) linear var(--delay) infinite}',
      '@keyframes mfRise{0%{transform:translate(0,0);opacity:0}8%{opacity:var(--o)}50%{transform:translate(var(--sway),-55vh)}' +
        '92%{opacity:var(--o)}100%{transform:translate(0,-110vh);opacity:0}}',
      '.mf-field.mf-still path{animation:none;stroke-dashoffset:0;opacity:.6}',
      '.mf-field.mf-still circle,.mf-field.mf-still .mf-glow{animation:none}',
    ].join('\n');
    document.head.appendChild(st);
  }

  function buildField(seed, mode) {
    var rand = rng(seed);
    var W = 1600, H = 1000;
    var field = document.createElement('div');
    field.className = 'mf-field ' + (mode === 'fixed' ? 'mf-fixed' : 'mf-inset') + (reduce ? ' mf-still' : '');
    field.setAttribute('aria-hidden', 'true');
    field.style.opacity = String(P.opacity);

    // Wandering glows
    [['rgba(106,191,136,0.10)', '18%', '10%', 46], ['rgba(232,177,75,0.07)', '62%', '55%', 58], ['rgba(168,143,224,0.06)', '75%', '5%', 52]]
      .slice(0, variant === 'subtle' ? 2 : 3)
      .forEach(function (g) {
        var el = document.createElement('div');
        el.className = 'mf-glow';
        el.style.background = 'radial-gradient(circle,' + g[0] + ',transparent 65%)';
        el.style.left = g[1]; el.style.top = g[2];
        el.style.opacity = String(P.glow);
        el.style.setProperty('--dur', (g[3] * P.speed) + 's');
        field.appendChild(el);
      });

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    field.appendChild(svg);

    var paths = [];
    function grow(x, y, angle, len, depth, delay) {
      if (paths.length >= P.maxPaths) return;
      var d = 'M' + x.toFixed(1) + ' ' + y.toFixed(1);
      var cx = x, cy = y, a = angle, joints = [];
      var segs = 3 + Math.floor(rand() * 3);
      for (var i = 0; i < segs; i++) {
        var step = (len / segs) * (0.7 + rand() * 0.6);
        var na = a + (rand() - 0.5) * 0.8;
        var mx = cx + Math.cos((a + na) / 2) * step * 0.55, my = cy + Math.sin((a + na) / 2) * step * 0.55;
        var nx = cx + Math.cos(na) * step, ny = cy + Math.sin(na) * step;
        d += ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + nx.toFixed(1) + ' ' + ny.toFixed(1);
        joints.push([nx, ny, na]); cx = nx; cy = ny; a = na;
      }
      paths.push({ d: d, depth: depth, delay: delay, tip: [cx, cy] });
      if (depth <= 1) return;
      joints.forEach(function (j, idx) {
        if (rand() < 0.5) grow(j[0], j[1], j[2] + (rand() < 0.5 ? -1 : 1) * (0.45 + rand() * 0.7), len * 0.6, depth - 1, delay + (idx + 1) * 0.8 * P.speed);
      });
    }

    for (var s = 0; s < P.sources; s++) {
      // Sources sit along the edges and grow inward.
      var edge = s % 4, t = 0.15 + rand() * 0.7, x, y, ang;
      if (edge === 0) { x = t * W; y = -10; ang = Math.PI / 2; }
      else if (edge === 1) { x = W + 10; y = t * H; ang = Math.PI; }
      else if (edge === 2) { x = t * W; y = H + 10; ang = -Math.PI / 2; }
      else { x = -10; y = t * H; ang = 0; }
      grow(x, y, ang + (rand() - 0.5) * 0.7, 520 + rand() * 260, P.depth, s * 2.6 * P.speed);
    }

    paths.forEach(function (p) {
      var el = document.createElementNS(NS, 'path');
      el.setAttribute('d', p.d);
      el.setAttribute('stroke', PALETTE[(P.depth - p.depth) % PALETTE.length]);
      el.setAttribute('stroke-width', String(Math.max(0.35, P.stroke * (0.55 + p.depth * 0.28))));
      el.style.setProperty('--delay', p.delay.toFixed(2) + 's');
      el.style.setProperty('--dur', ((18 + rand() * 10) * P.speed).toFixed(1) + 's');
      svg.appendChild(el);
      if (p.depth === 1 && rand() < 0.45) {
        var c = document.createElementNS(NS, 'circle');
        c.setAttribute('cx', p.tip[0].toFixed(1)); c.setAttribute('cy', p.tip[1].toFixed(1));
        c.setAttribute('r', (1.4 + rand() * 1.8).toFixed(1));
        c.setAttribute('fill', PALETTE[Math.floor(rand() * PALETTE.length)]);
        c.style.setProperty('--delay', p.delay.toFixed(2) + 's');
        c.style.setProperty('--dur', ((18 + rand() * 10) * P.speed).toFixed(1) + 's');
        svg.appendChild(c);
      }
    });

    if (!reduce) {
      for (var k = 0; k < P.spores; k++) {
        var sp = document.createElement('div');
        var size = 1.5 + rand() * 2.5;
        sp.className = 'mf-spore';
        sp.style.left = (rand() * 100).toFixed(1) + '%';
        sp.style.width = sp.style.height = size.toFixed(1) + 'px';
        sp.style.background = 'radial-gradient(circle,' + PALETTE[Math.floor(rand() * 3)] + ',transparent 70%)';
        sp.style.setProperty('--dur', ((26 + rand() * 22) * P.speed).toFixed(1) + 's');
        sp.style.setProperty('--delay', (-rand() * 40).toFixed(1) + 's');
        sp.style.setProperty('--sway', ((rand() - 0.5) * 80).toFixed(0) + 'px');
        sp.style.setProperty('--o', (0.35 + rand() * 0.5).toFixed(2));
        field.appendChild(sp);
      }
    }
    return field;
  }

  // Path lengths are only measurable once the SVG is in the document.
  function measure(field) {
    field.querySelectorAll('path').forEach(function (el) {
      var len = 0;
      try { len = el.getTotalLength(); } catch (_) {}
      el.style.setProperty('--len', String(Math.ceil(len || 1200)));
    });
  }

  function mount() {
    injectCss();
    var seed = 0;
    for (var i = 0; i < location.pathname.length; i++) seed = (seed * 31 + location.pathname.charCodeAt(i)) | 0;
    seed = Math.abs(seed) + 7;

    if (variant === 'subtle' && targets) {
      targets.split(',').map(function (t) { return t.trim(); }).filter(Boolean).forEach(function (sel, idx) {
        var host = document.querySelector(sel);
        if (!host || host.querySelector(':scope > .mf-field')) return;
        host.classList.add('mf-host');
        var f = buildField(seed + idx * 101, 'inset');
        host.insertBefore(f, host.firstChild);
        measure(f);
      });
      return;
    }
    if (document.querySelector('.mf-field.mf-fixed')) return;
    var fixed = buildField(seed, 'fixed');
    document.body.insertBefore(fixed, document.body.firstChild);
    measure(fixed);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

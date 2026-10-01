# -*- coding: utf-8 -*-
"""
scripts/build_all_curricula.py

Builds all three distinct curricula and their distinctive UIs:
1. Botanical Field (Root, Sprout, Flower, Fruit, Expert) -> Leafora Emerald Glass UI
2. Mushroom Academy (Hyphae, Mycelium, Fruiting Body, Sporing, Decay) -> Bioluminescent Subterranean Mycelium UI
3. Magnum Opus Alchemy (Percolation, Oxymels, Topical Pharmacy, Suppositories, Spagyrics) -> Crucible Amber Glass UI
"""

import json
import os
import sys

# Import datasets
sys.path.append(os.path.dirname(__file__))
from curriculum_myco_data import get_mycology_questions, MYCO_LEVELS
from curriculum_alchemy_data import get_alchemy_questions, ALCHEMY_LEVELS

BOTANICAL_LEVELS = {
    1: "Root — Foundations of Plant & Fungi Wisdom",
    2: "Sprout — Organ Systems & Tissue Energetics",
    3: "Flower — Formulation Science & Extraction Craft",
    4: "Fruit — Clinical Epistemology & Chronic Care",
    5: "Expert — Master Lab & Nordic Stewardship"
}

CONTEXT_PHRASES = [
    ', depending on the solvent extraction ratio and maceration duration',
    ', requiring careful clinical intake and organ system differential evaluation',
    ', reflecting classical pharmacopoeial standards across traditional preparation methods',
    ', according to documented historical dispensary practices and herbal monographs',
    ', which must be monitored alongside client constitutional vitality and tissue state',
    ', as validated across standard herbal laboratory extraction protocols',
    ', following strict botanical identification keys and sustainable harvest ethics',
    ', ensuring appropriate dosing thresholds across diverse constitutional profiles',
    ', as outlined in traditional Nordic and European folk medicine compendiums'
]

def balance_option_lengths(questions, target_max_ratio=0.25):
    target_count = int(len(questions) * target_max_ratio)
    current_longest = []
    for i, q in enumerate(questions):
        c = q['correct']
        lens = [len(o) for o in q['options']]
        if lens[c] == max(lens) and lens.count(max(lens)) == 1:
            current_longest.append(i)
    
    needed_to_reduce = len(current_longest) - target_count
    phrase_idx = 0
    for idx in current_longest:
        if needed_to_reduce <= 0:
            break
        q = questions[idx]
        c = q['correct']
        wrong_indices = [i for i in range(len(q['options'])) if i != c]
        best_wrong = max(wrong_indices, key=lambda i: len(q['options'][i]))
        
        phrase = CONTEXT_PHRASES[phrase_idx % len(CONTEXT_PHRASES)]
        phrase_idx += 1
        q['options'][best_wrong] = q['options'][best_wrong].rstrip('.') + phrase
        needed_to_reduce -= 1
    return questions

def balance_and_format(questions, level_map):
    """
    Balances option lengths, distributes answers across A, B, C, D, and maps level string.
    """
    questions = balance_option_lengths(questions, target_max_ratio=0.25)
    processed = []
    for i, q in enumerate(questions):
        lvl_num = q['level_num']
        q['level'] = level_map[lvl_num]

        # Rotate correct answer across A (0), B (1), C (2), D (3)
        target_idx = i % 4
        opts = list(q['options'])
        curr_correct = q['correct']
        correct_text = opts[curr_correct]
        wrong_opts = [opt for idx, opt in enumerate(opts) if idx != curr_correct]

        new_opts = list(wrong_opts)
        new_opts.insert(target_idx, correct_text)

        q['options'] = new_opts
        q['correct'] = target_idx
        processed.append(q)
    return processed

def generate_html(curriculum_id, title, subtitle, eyebrow, questions, levels_dict, theme_css, cat_icons_data, active_key='botanical'):
    """
    Generates a standalone, interactive glassmorphic assessment page.
    """
    questions_json = json.dumps(questions, ensure_ascii=False)
    
    # Top switcher bar links
    switcher_html = f"""
    <nav class="curriculum-switcher" aria-label="Curriculum Switcher">
      <a href="/community/academy/curriculum-preview.html" class="switch-pill {'active' if active_key=='botanical' else ''}">
        <span class="switch-glyph">🌿</span>
        <span class="switch-text">Botanical Field</span>
      </a>
      <a href="/community/academy/curriculum-mycology.html" class="switch-pill {'active' if active_key=='mycology' else ''}">
        <span class="switch-glyph">🍄</span>
        <span class="switch-text">Mushroom Kingdom</span>
      </a>
      <a href="/community/academy/curriculum-alchemy.html" class="switch-pill {'active' if active_key=='alchemy' else ''}">
        <span class="switch-glyph">⚗️</span>
        <span class="switch-text">Magnum Opus</span>
      </a>
    </nav>
    """

    # Category buttons
    cat_buttons_html = f"""
    <button class="cat-btn active" data-level="all" onclick="selectStratum('all')">
      <span class="cat-icon">✦</span>
      <span class="cat-label">All ({len(questions)})</span>
    </button>
    """
    for lvl_num, lvl_label in levels_dict.items():
        short_label = lvl_label.split('—')[0].strip()
        icon = cat_icons_data.get(lvl_num, '✦')
        count = sum(1 for q in questions if q['level_num'] == lvl_num)
        cat_buttons_html += f"""
        <button class="cat-btn" data-level="{lvl_num}" onclick="selectStratum('{lvl_num}')">
          <span class="cat-icon">{icon}</span>
          <span class="cat-label">{short_label} ({count})</span>
        </button>
        """

    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="dark">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title} — Fungai Art</title>
  <meta name="description" content="{subtitle}"/>
  <link rel="icon" type="image/png" sizes="256x256" href="/favicon.png?v=4"/>
  <link rel="stylesheet" href="/fonts/fonts.css">
  <style>
    {theme_css}
  </style>
</head>
<body>

  <!-- TOP NAV & CURRICULUM SWITCHER -->
  <div class="nav-wrap">
    <header class="nav">
      <a href="/community/academy" class="nav-brand" title="Fungai Art Academy">
        <div class="nav-brand-mark">
          <img src="/fungi.png?v=4" alt="Fungai Art" onerror="this.onerror=null;this.src='/fungai-art-logo.png';">
        </div>
        <div class="nav-brand-text">
          <span class="nav-brand-title">fungai art</span>
          <span class="nav-brand-sub">Academy <em>· {title}</em></span>
        </div>
      </a>

      <!-- 3-Way Switcher -->
      {switcher_html}

      <div class="nav-actions">
        <div class="progress-pill">
          <span class="progress-dot"></span>
          <span id="integratedNavCount">0 / {len(questions)} Integrated</span>
        </div>
        <a href="/community/academy" class="nav-glass-btn">← Academy</a>
      </div>
    </header>
  </div>

  <div class="container">

    <!-- HERO CARD -->
    <section class="hero-glass">
      <div class="hero-eyebrow">
        <span>{eyebrow}</span>
      </div>
      <h1 class="hero-title">
        {title}
      </h1>
      <p class="hero-lead">
        {subtitle}
      </p>

      <div class="hero-stats">
        <div class="stat-item">
          <span class="stat-val">{len(questions)}</span>
          <span class="stat-label">Assessments</span>
        </div>
        <div class="stat-item">
          <span class="stat-val">{len(levels_dict)}</span>
          <span class="stat-label">Curriculum Strata</span>
        </div>
        <div class="stat-item">
          <span class="stat-val" id="statMasteryPct">0%</span>
          <span class="stat-label">Mastery Level</span>
        </div>
      </div>

      <button class="btn-pill-primary" onclick="scrollToQuestions()">
        <span>Enter Assessment Field</span>
        <span class="btn-pill-arrow">→</span>
      </button>
    </section>

    <!-- CONTROLS HUD -->
    <div class="controls-hud" id="controlsHud">
      <div class="hud-header">
        <div class="hud-title">
          <span>Active Strata: <strong id="currentStratumLabel">All Strata ({len(questions)} Assessments)</strong></span>
        </div>
        
        <div class="search-glass-wrap">
          <input 
            type="text" 
            id="searchInput" 
            class="search-glass-input" 
            placeholder="Search plant, fungus, or extraction term..." 
            oninput="handleSearch(this.value)"
          />
        </div>
      </div>

      <!-- Category Filter Grid (Rounded-Square Glass Buttons) -->
      <div class="category-grid">
        {cat_buttons_html}
      </div>

      <!-- Epistemic Lenses Bar -->
      <div class="lens-subbar">
        <span style="font-family:var(--font-mono);font-size:9px;color:var(--sage-muted);letter-spacing:0.18em;text-transform:uppercase;margin-right:4px;">Filter Lens:</span>
        <button class="lens-pill active" data-lens="all" onclick="selectLens('all')">✦ All Evidence</button>
        <button class="lens-pill" data-lens="[TRADITIONAL]" onclick="selectLens('[TRADITIONAL]')">Traditional Lore</button>
        <button class="lens-pill" data-lens="[MECHANISTIC]" onclick="selectLens('[MECHANISTIC]')">🔬 Mechanism</button>
        <button class="lens-pill" data-lens="[HUMAN EVIDENCE]" onclick="selectLens('[HUMAN EVIDENCE]')">⚖ Human Clinical</button>
        <button class="lens-pill" data-lens="[SAFETY]" onclick="selectLens('[SAFETY]')">⚠ Clinical Safety</button>
        <button class="lens-pill" data-lens="[ECOLOGY]" onclick="selectLens('[ECOLOGY]')">🌿 Stewardship</button>
      </div>
    </div>

    <!-- QUESTIONS FEED -->
    <main class="questions-feed" id="questionsFeed">
      <!-- Injected via JavaScript -->
    </main>

  </div>

  <script>
    window.ACADEMY_DATA = {questions_json};
    let activeLevel = 'all';
    let activeLens = 'all';
    let searchQuery = '';
    const storageKey = 'fa_curriculum_{curriculum_id}';
    let integratedSet = new Set(JSON.parse(localStorage.getItem(storageKey + '_integrated') || '[]'));
    let userAnswers = JSON.parse(localStorage.getItem(storageKey + '_answers') || '{{}}');

    function init() {{
      renderQuestions();
      updateProgressMetrics();
    }}

    function selectStratum(levelKey) {{
      activeLevel = levelKey;
      document.querySelectorAll('.cat-btn').forEach(btn => {{
        btn.classList.toggle('active', btn.dataset.level === levelKey);
      }});
      renderQuestions();
    }}

    function selectLens(lensKey) {{
      activeLens = lensKey;
      document.querySelectorAll('.lens-pill').forEach(pill => {{
        pill.classList.toggle('active', pill.dataset.lens === lensKey);
      }});
      renderQuestions();
    }}

    function handleSearch(val) {{
      searchQuery = val.trim().toLowerCase();
      renderQuestions();
    }}

    function scrollToQuestions() {{
      const el = document.getElementById('controlsHud');
      if (el) el.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
    }}

    function renderQuestions() {{
      const feed = document.getElementById('questionsFeed');
      if (!feed) return;
      const letters = ['A', 'B', 'C', 'D'];

      const filtered = window.ACADEMY_DATA.filter(q => {{
        if (activeLevel !== 'all' && String(q.level_num) !== String(activeLevel)) return false;
        if (activeLens !== 'all' && !q.badges.includes(activeLens)) return false;
        if (searchQuery) {{
          const term = (q.herb || q.fungus || '') + ' ' + q.question + ' ' + q.options.join(' ');
          if (!term.toLowerCase().includes(searchQuery)) return false;
        }}
        return true;
      }});

      if (filtered.length === 0) {{
        feed.innerHTML = `
          <div class="empty-state">
            <div class="empty-title">No Entries in this Frequency</div>
            <p style="color:var(--sage-muted);max-width:44ch;margin:10px auto 20px;">
              Try adjusting your search query or selecting "All Evidence".
            </p>
            <button class="btn-pill-primary" onclick="clearFilters()">Reset All Filters</button>
          </div>
        `;
        return;
      }}

      feed.innerHTML = filtered.map(q => {{
        const isIntegrated = integratedSet.has(q.num);
        const savedAnswer = userAnswers[q.num];
        const hasAnswered = savedAnswer !== undefined;

        const badgesHtml = q.badges.map(b => {{
          let cls = 'badge-trad';
          let label = b.replace(/[\\[\\]]/g, '');
          if (b.includes('MECHANISTIC')) cls = 'badge-mech';
          if (b.includes('HUMAN')) cls = 'badge-human';
          if (b.includes('SAFETY')) cls = 'badge-safe';
          if (b.includes('ECOLOGY')) cls = 'badge-eco';
          return `<span class="badge-tag ${{cls}}">${{label}}</span>`;
        }}).join('');

        const optionsHtml = q.options.map((opt, idx) => {{
          let itemCls = 'option-glass-item';
          if (hasAnswered) {{
            if (idx === q.correct) itemCls += ' correct';
            else if (idx === savedAnswer) itemCls += ' incorrect';
          }}
          return `
            <div class="${{itemCls}}" onclick="handleAnswerChoice(${{q.num}}, ${{idx}}, ${{q.correct}})">
              <span class="option-letter">${{letters[idx]}}</span>
              <span class="option-text">${{opt}}</span>
            </div>
          `;
        }}).join('');

        const feedbackCls = hasAnswered ? 'feedback-box show' : 'feedback-box';
        const isCorrectChoice = hasAnswered && savedAnswer === q.correct;
        const feedbackPrefix = isCorrectChoice ? '✦ Correct insight: ' : '🌿 Evidence distinction: ';
        const entityName = q.herb || q.fungus || 'Plant Ally';

        return `
          <article class="question-card ${{isIntegrated ? 'integrated' : ''}}" id="qcard-${{q.num}}">
            <div class="card-top">
              <div class="card-meta-left">
                <span class="q-number-pill">Q${{q.num}} · ${{q.level.split('—')[0].trim()}}</span>
                <h3 class="herb-title">${{entityName}}</h3>
              </div>
              <div class="card-badges">
                ${{badgesHtml}}
              </div>
            </div>

            <div class="card-lesson-line">
              ${{q.module}} · ${{q.lesson}}
            </div>

            <div class="question-prompt">
              ${{q.question}}
            </div>

            <div class="options-list">
              ${{optionsHtml}}
            </div>

            <div class="${{feedbackCls}}" id="feedback-${{q.num}}">
              <strong>${{feedbackPrefix}}</strong>${{q.explanation}}
            </div>

            <div class="card-footer">
              <span style="font-family:var(--font-mono);font-size:9px;color:var(--sage-muted);letter-spacing:0.18em;text-transform:uppercase;">
                Status: ${{isIntegrated ? 'Integrated in Network ✓' : 'Field Assessment Active'}}
              </span>
              <button 
                class="integrate-pill-btn ${{isIntegrated ? 'done' : ''}}" 
                onclick="toggleIntegrate(${{q.num}})"
              >
                ${{isIntegrated ? 'Integrated in Network ✓' : 'Integrate Spore ✦'}}
              </button>
            </div>
          </article>
        `;
      }}).join('');
    }}

    function handleAnswerChoice(qNum, chosenIdx, correctIdx) {{
      userAnswers[qNum] = chosenIdx;
      localStorage.setItem(storageKey + '_answers', JSON.stringify(userAnswers));
      if (chosenIdx === correctIdx) {{
        integratedSet.add(qNum);
        localStorage.setItem(storageKey + '_integrated', JSON.stringify(Array.from(integratedSet)));
      }}
      renderQuestions();
      updateProgressMetrics();
    }}

    function toggleIntegrate(qNum) {{
      if (integratedSet.has(qNum)) integratedSet.delete(qNum);
      else integratedSet.add(qNum);
      localStorage.setItem(storageKey + '_integrated', JSON.stringify(Array.from(integratedSet)));
      renderQuestions();
      updateProgressMetrics();
    }}

    function updateProgressMetrics() {{
      const total = window.ACADEMY_DATA.length;
      const count = integratedSet.size;
      const pct = Math.round((count / total) * 100);
      const navCount = document.getElementById('integratedNavCount');
      if (navCount) navCount.textContent = `${{count}} / ${{total}} Integrated`;
      const mastery = document.getElementById('statMasteryPct');
      if (mastery) mastery.textContent = `${{pct}}%`;
    }}

    function clearFilters() {{
      activeLevel = 'all';
      activeLens = 'all';
      searchQuery = '';
      const input = document.getElementById('searchInput');
      if (input) input.value = '';
      document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.level === 'all'));
      document.querySelectorAll('.lens-pill').forEach(pill => pill.classList.toggle('active', pill.dataset.lens === 'all'));
      renderQuestions();
    }}

    document.addEventListener('DOMContentLoaded', init);
  </script>
</body>
</html>
"""
    return html

# ═════════════════════════════════════════════════════════════════════
# THEME STYLESHEETS
# ═════════════════════════════════════════════════════════════════════

BOTANICAL_CSS = """
:root {
  --bg-deep: #09150E;
  --bg-card: rgba(18, 36, 28, 0.65);
  --glass-border: rgba(255, 255, 255, 0.13);
  --glass-highlight: rgba(255, 255, 255, 0.22);
  --pill-btn-bg: #CBE3B5;
  --pill-btn-hover: #D8ECC8;
  --pill-btn-text: #0C1B12;
  --accent: #CBE3B5;
  --accent-glow: rgba(203, 227, 181, 0.25);
  --sage-muted: #9AB8A3;
  --sage-light: #E1EFE3;
  --font-serif: 'Cormorant Garamond', 'Zodiak', Georgia, serif;
  --font-sans: 'Satoshi', -apple-system, sans-serif;
  --font-mono: 'Geist Mono', monospace;
}
body {
  background: radial-gradient(circle 800px at 50% -100px, rgba(203, 227, 181, 0.15), transparent 70%),
              radial-gradient(circle 600px at 90% 40%, rgba(79, 168, 224, 0.08), transparent 60%),
              radial-gradient(circle 700px at 10% 80%, rgba(107, 214, 111, 0.09), transparent 65%),
              linear-gradient(180deg, #0B1911 0%, #08140D 50%, #050E09 100%);
  background-attachment: fixed;
  color: var(--sage-light); font-family: var(--font-sans); margin: 0; padding: 0; line-height: 1.6;
}
"""

MYCO_CSS = """
:root {
  --bg-deep: #050807;
  --bg-card: rgba(10, 24, 20, 0.72);
  --glass-border: rgba(56, 189, 248, 0.2);
  --glass-highlight: rgba(56, 189, 248, 0.4);
  --pill-btn-bg: #38BDF8;
  --pill-btn-hover: #7DD3FC;
  --pill-btn-text: #041017;
  --accent: #38BDF8;
  --accent-glow: rgba(56, 189, 248, 0.35);
  --sage-muted: #7DD3FC;
  --sage-light: #E0F2FE;
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Satoshi', sans-serif;
  --font-mono: 'Geist Mono', monospace;
}
body {
  background: radial-gradient(circle 900px at 50% -120px, rgba(56, 189, 248, 0.18), transparent 70%),
              radial-gradient(circle 700px at 85% 50%, rgba(52, 211, 153, 0.12), transparent 60%),
              radial-gradient(circle 800px at 15% 85%, rgba(129, 140, 248, 0.1), transparent 65%),
              linear-gradient(180deg, #060B08 0%, #040806 50%, #020403 100%);
  background-attachment: fixed;
  color: var(--sage-light); font-family: var(--font-sans); margin: 0; padding: 0; line-height: 1.6;
}
"""

ALCHEMY_CSS = """
:root {
  --bg-deep: #0E0C09;
  --bg-card: rgba(26, 20, 14, 0.72);
  --glass-border: rgba(232, 177, 75, 0.22);
  --glass-highlight: rgba(245, 214, 137, 0.45);
  --pill-btn-bg: #F5D689;
  --pill-btn-hover: #FDE68A;
  --pill-btn-text: #171105;
  --accent: #E8B14B;
  --accent-glow: rgba(232, 177, 75, 0.35);
  --sage-muted: #D4A373;
  --sage-light: #FEF3C7;
  --font-serif: 'Cormorant Garamond', Georgia, serif;
  --font-sans: 'Satoshi', sans-serif;
  --font-mono: 'Geist Mono', monospace;
}
body {
  background: radial-gradient(circle 900px at 50% -120px, rgba(232, 177, 75, 0.18), transparent 70%),
              radial-gradient(circle 700px at 90% 50%, rgba(217, 119, 6, 0.12), transparent 60%),
              radial-gradient(circle 800px at 10% 85%, rgba(180, 83, 9, 0.1), transparent 65%),
              linear-gradient(180deg, #120E0A 0%, #0D0A07 50%, #070503 100%);
  background-attachment: fixed;
  color: var(--sage-light); font-family: var(--font-sans); margin: 0; padding: 0; line-height: 1.6;
}
"""

SHARED_CORE_CSS = """
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
.container { max-width: 1080px; margin: 0 auto; padding: 0 24px 120px; position: relative; z-index: 1; }

/* Sticky Nav */
.nav-wrap { position: sticky; top: 0; z-index: 100; padding: 14px 0; backdrop-filter: blur(24px); background: rgba(8,16,11,0.75); border-bottom: 1px solid rgba(255,255,255,0.08); }
.nav { max-width: 1080px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
.nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; }
.nav-brand-mark { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 1px solid var(--glass-highlight); box-shadow: 0 0 16px var(--accent-glow); }
.nav-brand-mark img { width: 100%; height: 100%; object-fit: cover; }
.nav-brand-text { display: flex; flex-direction: column; }
.nav-brand-title { font-family: var(--font-serif); font-style: italic; font-size: 21px; color: #fff; }
.nav-brand-sub { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sage-muted); }
.nav-brand-sub em { color: var(--accent); font-style: normal; }

/* 3-Way Switcher */
.curriculum-switcher { display: flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.05); padding: 4px; border-radius: 9999px; border: 1px solid var(--glass-border); }
.switch-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; font-family: var(--font-sans); font-size: 11.5px; font-weight: 500; text-decoration: none; color: var(--sage-muted); transition: all 0.2s ease; }
.switch-pill:hover { color: #fff; background: rgba(255,255,255,0.08); }
.switch-pill.active { background: var(--pill-btn-bg); color: var(--pill-btn-text); font-weight: 600; box-shadow: 0 0 14px var(--accent-glow); }

.nav-actions { display: flex; align-items: center; gap: 10px; }
.progress-pill { display: inline-flex; align-items: center; gap: 7px; padding: 6px 14px; border-radius: 9999px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); font-family: var(--font-mono); font-size: 9.5px; color: var(--accent); }
.progress-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
.nav-glass-btn { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 9999px; border: 1px solid var(--glass-border); background: rgba(255,255,255,0.04); color: var(--sage-muted); font-family: var(--font-mono); font-size: 9.5px; text-decoration: none; transition: all 0.2s; }
.nav-glass-btn:hover { color: #fff; border-color: var(--glass-highlight); }

/* Hero Glass */
.hero-glass { background: var(--bg-card); backdrop-filter: blur(28px); border: 1px solid var(--glass-border); border-top: 1px solid var(--glass-highlight); border-radius: 28px; padding: 40px; margin: 32px 0; box-shadow: 0 20px 50px rgba(0,0,0,0.4); }
.hero-eyebrow { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.hero-title { font-family: var(--font-serif); font-style: italic; font-size: clamp(32px, 5vw, 50px); color: #fff; line-height: 1.1; margin-bottom: 14px; }
.hero-lead { font-size: 15px; color: var(--sage-light); line-height: 1.65; max-width: 68ch; margin-bottom: 24px; opacity: 0.9; }
.hero-stats { display: flex; gap: 24px; margin-bottom: 28px; padding-top: 18px; border-top: 1px solid rgba(255,255,255,0.08); }
.stat-item { display: flex; flex-direction: column; }
.stat-val { font-family: var(--font-serif); font-style: italic; font-size: 24px; color: #fff; }
.stat-label { font-family: var(--font-mono); font-size: 8.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--sage-muted); }
.btn-pill-primary { display: inline-flex; align-items: center; gap: 10px; background: var(--pill-btn-bg); color: var(--pill-btn-text); font-weight: 600; padding: 13px 26px; border-radius: 9999px; border: none; cursor: pointer; text-decoration: none; transition: all 0.2s; box-shadow: 0 8px 24px var(--accent-glow); }
.btn-pill-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 30px var(--accent-glow); }
.btn-pill-arrow { width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center; }

/* Controls HUD */
.controls-hud { position: sticky; top: 72px; z-index: 90; margin-bottom: 32px; padding: 16px 20px; border-radius: 24px; background: rgba(10,20,15,0.85); backdrop-filter: blur(24px); border: 1px solid var(--glass-border); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }
.hud-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.hud-title { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--sage-muted); }
.hud-title strong { color: #fff; }
.search-glass-wrap { flex: 1; max-width: 380px; min-width: 240px; }
.search-glass-input { width: 100%; padding: 9px 16px; border-radius: 9999px; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); color: #fff; font-size: 13px; outline: none; transition: all 0.2s; }
.search-glass-input:focus { border-color: var(--accent); background: rgba(255,255,255,0.1); }

/* Category Grid (Rounded Square Glass) */
.category-grid { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }
.category-grid::-webkit-scrollbar { display: none; }
.cat-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 82px; height: 82px; padding: 8px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); color: var(--sage-muted); cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
.cat-btn:hover { background: rgba(255,255,255,0.08); color: #fff; transform: translateY(-2px); }
.cat-btn.active { background: rgba(255,255,255,0.12); border-color: var(--accent); color: var(--accent); box-shadow: 0 0 18px var(--accent-glow); }
.cat-icon { font-size: 22px; margin-bottom: 4px; }
.cat-label { font-size: 10.5px; font-weight: 500; white-space: nowrap; }

/* Epistemic Lenses */
.lens-subbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
.lens-pill { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; padding: 5px 12px; border-radius: 9999px; background: transparent; border: 1px solid var(--glass-border); color: var(--sage-muted); cursor: pointer; transition: all 0.18s; }
.lens-pill:hover { color: #fff; border-color: var(--glass-highlight); }
.lens-pill.active { color: #000; font-weight: 600; background: var(--accent); border-color: var(--accent); }

/* Question Cards */
.questions-feed { display: flex; flex-direction: column; gap: 24px; }
.question-card { background: var(--bg-card); backdrop-filter: blur(24px); border: 1px solid var(--glass-border); border-top: 1px solid var(--glass-highlight); border-radius: 26px; padding: 30px; box-shadow: 0 16px 40px rgba(0,0,0,0.35); transition: all 0.25s; }
.question-card.integrated { border-color: var(--accent); }
.card-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.card-meta-left { display: flex; align-items: center; gap: 10px; }
.q-number-pill { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; background: rgba(255,255,255,0.08); border: 1px solid var(--glass-border); color: var(--accent); }
.herb-title { font-family: var(--font-serif); font-size: 21px; font-style: italic; color: #fff; }
.card-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.badge-tag { font-family: var(--font-mono); font-size: 8px; letter-spacing: 0.14em; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.06); color: var(--sage-muted); }
.card-lesson-line { font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.1em; color: var(--sage-muted); margin-bottom: 10px; }
.question-prompt { font-size: 16px; color: #fff; font-weight: 500; line-height: 1.5; margin-bottom: 20px; }

/* Options */
.options-list { display: flex; flex-direction: column; gap: 9px; margin-bottom: 16px; }
.option-glass-item { display: flex; align-items: flex-start; gap: 12px; padding: 13px 18px; border-radius: 18px; background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); color: var(--sage-light); cursor: pointer; transition: all 0.2s; font-size: 14px; line-height: 1.5; }
.option-glass-item:hover { background: rgba(255,255,255,0.08); border-color: var(--glass-highlight); color: #fff; transform: translateX(2px); }
.option-letter { width: 24px; height: 24px; border-radius: 50%; background: rgba(255,255,255,0.08); font-family: var(--font-mono); font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; color: var(--sage-muted); }
.option-glass-item.correct { background: rgba(107,214,111,0.18) !important; border-color: #6BD66F !important; color: #fff !important; }
.option-glass-item.correct .option-letter { background: #6BD66F; color: #000; }
.option-glass-item.incorrect { background: rgba(224,107,107,0.16) !important; border-color: #E06B6B !important; color: #FFDFDF !important; }
.option-glass-item.incorrect .option-letter { background: #E06B6B; color: #fff; }

.feedback-box { display: none; margin-top: 14px; padding: 14px 18px; border-radius: 14px; background: rgba(0,0,0,0.3); border-left: 3px solid var(--accent); font-size: 13.5px; line-height: 1.6; color: var(--sage-light); }
.feedback-box.show { display: block; }
.feedback-box strong { color: var(--accent); }

.card-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 18px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
.integrate-pill-btn { display: inline-flex; align-items: center; padding: 8px 18px; border-radius: 9999px; background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border); color: var(--sage-light); font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
.integrate-pill-btn:hover { background: rgba(255,255,255,0.12); border-color: var(--accent); color: #fff; }
.integrate-pill-btn.done { background: var(--accent); color: #000; font-weight: 600; border-color: var(--accent); box-shadow: 0 0 16px var(--accent-glow); }
.empty-state { text-align: center; padding: 50px 20px; background: var(--bg-card); border-radius: 24px; border: 1px solid var(--glass-border); }
.empty-title { font-family: var(--font-serif); font-size: 24px; font-style: italic; color: #fff; margin-bottom: 8px; }

@media(max-width: 640px) {
  .hero-glass { padding: 26px 20px; }
  .question-card { padding: 22px 18px; }
  .curriculum-switcher { width: 100%; justify-content: center; }
  .nav { flex-direction: column; align-items: flex-start; }
}
"""

def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    academy_dir = os.path.join(repo_root, "public", "community", "academy")

    # 1. BOTANICAL FIELD CURRICULUM
    with open(os.path.join(academy_dir, "curriculum-questions.json"), 'r', encoding='utf-8') as f:
        botanical_raw = json.load(f)

    botanical_qs = balance_and_format(botanical_raw, BOTANICAL_LEVELS)
    
    # Save botanical JSONs
    with open(os.path.join(academy_dir, "curriculum-questions.json"), 'w', encoding='utf-8') as f:
        json.dump(botanical_qs, f, indent=2, ensure_ascii=False)
    with open(os.path.join(academy_dir, "curriculum-botanical.json"), 'w', encoding='utf-8') as f:
        json.dump(botanical_qs, f, indent=2, ensure_ascii=False)

    botanical_html = generate_html(
        curriculum_id="botanical",
        title="The Botanical & Plant Field",
        subtitle="Living tissue states, plant chemistry, and organ system energetics. Structured from root to sprout, flower, fruit, and master clinical integration.",
        eyebrow="✦ Fungai Art · Botanical Field Curriculum · 87 Assessments",
        questions=botanical_qs,
        levels_dict=BOTANICAL_LEVELS,
        theme_css=BOTANICAL_CSS + SHARED_CORE_CSS,
        cat_icons_data={1: "🌱", 2: "🌿", 3: "🌸", 4: "🍎", 5: "🦉"},
        active_key='botanical'
    )
    with open(os.path.join(academy_dir, "curriculum-preview.html"), 'w', encoding='utf-8') as f:
        f.write(botanical_html)
    with open(os.path.join(academy_dir, "curriculum-botanical.html"), 'w', encoding='utf-8') as f:
        f.write(botanical_html)
    print("Saved Botanical curriculum files.")

    # 2. MYCOLOGY / MUSHROOM CURRICULUM
    myco_raw = get_mycology_questions()
    myco_qs = balance_and_format(myco_raw, MYCO_LEVELS)
    
    with open(os.path.join(academy_dir, "curriculum-mycology.json"), 'w', encoding='utf-8') as f:
        json.dump(myco_qs, f, indent=2, ensure_ascii=False)

    myco_html = generate_html(
        curriculum_id="mycology",
        title="The Fungal Kingdom & Myco-Academy",
        subtitle="Traverse the underground continuum from haploid hyphae to the mycelial web, medicinal polypores, basidiospores, and saprotrophic decay.",
        eyebrow="✦ Fungai Art · Fungal Kingdom Curriculum · 28 Macrofungal Assessments",
        questions=myco_qs,
        levels_dict=MYCO_LEVELS,
        theme_css=MYCO_CSS + SHARED_CORE_CSS,
        cat_icons_data={1: "🕸️", 2: "🌱", 3: "🍄", 4: "✨", 5: "🍂"},
        active_key='mycology'
    )
    with open(os.path.join(academy_dir, "curriculum-mycology.html"), 'w', encoding='utf-8') as f:
        f.write(myco_html)
    print("Saved Mycology curriculum files.")

    # 3. ALCHEMY / MAGNUM OPUS CURRICULUM
    alchemy_raw = get_alchemy_questions()
    alchemy_qs = balance_and_format(alchemy_raw, ALCHEMY_LEVELS)

    with open(os.path.join(academy_dir, "curriculum-alchemy.json"), 'w', encoding='utf-8') as f:
        json.dump(alchemy_qs, f, indent=2, ensure_ascii=False)

    alchemy_html = generate_html(
        curriculum_id="alchemy",
        title="The Magnum Opus — Laboratory Spagyrics",
        subtitle="Advanced percolation, oxymels, topical pharmacopoeia, suppositories, and the Paracelsian calcination of the Vegetable Stone.",
        eyebrow="✦ Fungai Art · Magnum Opus Curriculum · 22 Laboratory Assessments",
        questions=alchemy_qs,
        levels_dict=ALCHEMY_LEVELS,
        theme_css=ALCHEMY_CSS + SHARED_CORE_CSS,
        cat_icons_data={1: "⚗️", 2: "🍯", 3: "🌿", 4: "🕯️", 5: "💎"},
        active_key='alchemy'
    )
    with open(os.path.join(academy_dir, "curriculum-alchemy.html"), 'w', encoding='utf-8') as f:
        f.write(alchemy_html)
    print("Saved Alchemy curriculum files.")

    print("All 3 Curricula and 3 Distinct UIs built successfully!")

if __name__ == '__main__':
    main()

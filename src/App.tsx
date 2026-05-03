import { useState, useMemo, useEffect } from "react";
import { Search, X, ArrowLeft, Menu, Leaf, BookmarkPlus, Clock } from "lucide-react";
import { HERBS, type Herb } from "./data/herbs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import FungaiArtLogo from "./assets/fungai-art-logo.png";

// Deduplicate herb list once at module level
const _seen = new Set<number>();
const HERBS_CLEAN = HERBS.filter(h => _seen.has(h.id) ? false : !!_seen.add(h.id));

// ─── Category derivation ────────────────────────────────────────────────────
const MUSHROOM_NAMES = new Set([
  "Birch Polypore","Button Mushroom","Chaga","Cordyceps","Enoki","Fu Ling",
  "Lion's Mane","Maitake","Mesima","Morels","Oyster Mushroom",
  "Red-Belted Polypore","Reishi","Royal Sun Mushroom","Shaggy Bracket",
  "Shaggy Mane","Shiitake","Tinder Fungus","Tremella","Turkey Tail",
  "Willow Bracket","Zhu Ling",
]);

const CATEGORY_RULES: [string, RegExp][] = [
  ["Adaptogen",        /adaptogen|hpa axis|cortisol normaliz|withania|eleuthero/i],
  ["Anti-inflammatory",/anti.inflamm|cox inhibit|lox|boswellic|curcumin|salicylat/i],
  ["Antimicrobial",    /antimicrobial|antifungal|antiviral|carvacrol|allicin|thymol/i],
  ["Nervine",          /nervine|anxiolytic|sedative|gaba|calming|antidepressant/i],
  ["Cognitive",        /cognitive|memory|neuroplasticity|bdnf|ngf|acetylcholine|nootropic|cerebral/i],
  ["Digestive",        /digest|carminative|gut|ibs|gastric|intestinal|bloat|prebiotic|carminative/i],
  ["Hepatic",          /hepatic|hepatoprotect|bile|liver.*clear|silymarin|berberine/i],
  ["Immune",           /immune|beta.glucan|innate|nk cell|macrophage|antiviral/i],
  ["Hormonal",         /hormon|estrogen|testosterone|endocrine|menstrual|lh.mediat|phytoestrogen|progesterone/i],
  ["Antioxidant",      /antioxidant|nrf2|anthocyanin|polyphenol|superoxide|flavonoid/i],
  ["Tonic",            /\btonic\b|nourish.*jing|qi tonic|vital restoration|jing.*tonic/i],
  ["Respiratory",      /respiratory|expectorant|bronch|lung.*mucilage|cough/i],
  ["Urinary",          /urinary.*tract|renal.*protect|diuretic.*urin|bladder/i],
];

function getHerbCategories(herb: Herb): string[] {
  const text = [...herb.primary_functions, ...(herb.secondary_benefits ?? [])].join(" ");
  const cats = new Set<string>();
  if (MUSHROOM_NAMES.has(herb.name)) cats.add("Mushroom");
  for (const [cat, re] of CATEGORY_RULES) if (re.test(text)) cats.add(cat);
  if (cats.size === 0) cats.add("Tonic");
  return [...cats];
}

// ─── Forageable in Sweden & Germany ────────────────────────────────────────
const FORAGEABLE_EU = new Set([
  // Swedish & German forests / meadows
  "Bilberry","Lingonberry","Elderberry","Elderflower","Nettle","Yarrow",
  "Chamomile","St. John's Wort","Valerian","Linden","Meadowsweet",
  "Rosehip","Raspberry Leaf","Pine Needles","Mugwort","Broadleaf Plantain",
  "Chickweed","Horsetail","Goldenrod","Motherwort","Lemon Balm",
  "Burdock Root","Dandelion Root","Ground Ivy","Eyebright","Skullcap",
  "Milk Thistle","Willow Bark","Rose Petals","Hawthorn","Vervain",
  "Thyme","Lavender","Calendula","Rosemary","Passionflower",
  // Nordic mushrooms
  "Birch Polypore","Chaga","Turkey Tail","Tinder Fungus","Shaggy Bracket",
  "Red-Belted Polypore","Willow Bracket","Oyster Mushroom","Morels","Enoki",
  // Arctic Scandinavia
  "Rhodiola",
]);

// ─── Tryp pool (Fungai Art ceremonial / consciousness herbs) ───────────────
const TRYP_HERBS = new Set([
  "Ashwagandha","Holy Basil","Rhodiola","Schisandra","Chamomile",
  "Damiana","Dong Quai","Lady's Mantle","Maca","Maca Negra","Muira Puama","Shatavari",
  "Blue Lotus","Passionflower","Valerian","Lemon Balm","Lavender","Skullcap",
  "Kanna","Rose Petals","Saffron","Oatstraw",
  "Astragalus","Elderberry","Echinacea",
  "Milk Thistle","Dandelion Root",
  "Cayenne","Turmeric","Star Anise","Cardamom","Ginger","Fennel",
  "Chaga","Cordyceps","Lion's Mane","Reishi","Tremella","Turkey Tail","Fu Ling","Shiitake","Maitake",
]);

// ─── Symptom → herb mapping (western-accessible language) ──────────────────
const SYMPTOM_HERBS: Record<string, string[]> = {
  "Stress & Anxiety":    ["Ashwagandha","Holy Basil","Rhodiola","Passionflower","Valerian","Lemon Balm","Lavender","Chamomile","Skullcap","Oatstraw","Motherwort","Linden","Schisandra","Reishi","Kanna","Saffron"],
  "Poor Sleep":          ["Valerian","Passionflower","Lemon Balm","Chamomile","Hops","Blue Lotus","Skullcap","Lavender","Oatstraw","Saffron","Fu Ling","Reishi","Calea Zacatachichi"],
  "Low Energy / Fatigue":["Ashwagandha","Rhodiola","Maca","Maca Negra","Schisandra","Cordyceps","Ginseng","Guarana","Holy Basil","Shilajit","Pine Pollen","Yerba Mate"],
  "Digestive Issues":    ["Chamomile","Ginger","Fennel","Peppermint","Caraway","Cardamom","Licorice Root","Slippery Elm","Meadowsweet","Star Anise","Wormwood","Dandelion Root","Barley"],
  "Immune Support":      ["Echinacea","Elderberry","Astragalus","Cat's Claw","Turkey Tail","Chaga","Reishi","Shiitake","Maitake","Black Cumin","Elderflower","Birch Polypore"],
  "Pain & Inflammation": ["Turmeric","Boswellia","Willow Bark","Devil's Claw","Cayenne","Ginger","Meadowsweet","Black Cumin","Butterbur"],
  "Hormonal Balance":    ["Vitex","Maca","Maca Negra","Dong Quai","Shatavari","Lady's Mantle","Saw Palmetto","Raspberry Leaf","Yarrow","Mugwort","Nettle"],
  "Focus & Memory":      ["Lion's Mane","Ginkgo","Bacopa","Gotu Kola","Rosemary","Rhodiola","Schisandra","Maca Negra","Calamus"],
  "Liver & Detox":       ["Milk Thistle","Dandelion Root","Schisandra","Yellow Dock Root","Burdock Root","Barberry","Turmeric","Wormwood"],
  "Skin & Beauty":       ["Burdock Root","Nettle","Calendula","Chickweed","Turmeric","Elderflower","Tremella","Gotu Kola","Rosehip"],
  "Low Libido":          ["Maca","Maca Negra","Damiana","Muira Puama","Ashwagandha","Tongkat Ali","Horny Goat Weed","Catuaba","Pine Pollen","Fadogia Agrestis"],
  "Blood Sugar":         ["Cinnamon","Barberry","Milk Thistle","Ginseng","Shilajit","Berberis"],
  "Mood & Depression":   ["Saffron","St. John's Wort","Lemon Balm","Rose Petals","Damiana","Kanna","Rhodiola","Ashwagandha","Jasmine"],
  "Frequent Illness":    ["Astragalus","Echinacea","Elderberry","Turkey Tail","Chaga","Reishi","Black Cumin","Cat's Claw"],
};

// Precompute all available categories & elements for filter UI
const ALL_HERB_CATEGORIES = [...new Set(
  HERBS_CLEAN.flatMap(h => getHerbCategories(h))
)].sort();

const ALL_TCM_ELEMENTS = [...new Set(
  HERBS_CLEAN.flatMap(h =>
    h.tcm_element.split(/\s*\+\s*/).map(e => e.trim()).filter(Boolean)
  )
)].sort();

interface SavedFormula {
  id: number;
  savedAt: string;
  herbIds: number[];
  herbNames: string[];
  themes: string[];
  tempLabel: string;
  synergyCount: number;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CAUTION_COLOR: Record<string, string> = {
  LOW:          "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "LOW-MEDIUM": "text-emerald-300 border-emerald-400/30 bg-emerald-500/8",
  MEDIUM:       "text-yellow-300  border-yellow-400/30  bg-yellow-500/10",
  "MEDIUM-HIGH":"text-orange-300  border-orange-400/30  bg-orange-500/10",
  HIGH:         "text-red-300     border-red-400/30     bg-red-500/10",
  "VERY HIGH":  "text-red-400     border-red-500/40     bg-red-500/15",
};

const CAUTION_SHORT: Record<string, string> = {
  LOW:          "LOW",
  "LOW-MEDIUM": "L-M",
  MEDIUM:       "MED",
  "MEDIUM-HIGH":"M-H",
  HIGH:         "HIGH",
  "VERY HIGH":  "V-H",
};

function shortFunction(fn: string): string {
  const dash = fn.indexOf("—");
  return dash !== -1 ? fn.slice(0, dash).trim() : fn.split(" ").slice(0, 6).join(" ");
}

export default function App() {
  const [searchQuery, setSearchQuery]   = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedHerbs, setSelectedHerbs] = useState<Herb[]>([]);
  const [showResults, setShowResults]   = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedFormulas, setSavedFormulas] = useState<SavedFormula[]>(() => {
    try { return JSON.parse(localStorage.getItem("fungai_formulas") ?? "[]"); }
    catch { return []; }
  });
  const [saveFlash, setSaveFlash] = useState(false);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeElements, setActiveElements] = useState<string[]>([]);
  const [showForageable, setShowForageable] = useState(false);
  const [showTryp, setShowTryp] = useState(false);
  const [activeSymptom, setActiveSymptom] = useState<string | null>(null);
  const [symptomOpen, setSymptomOpen] = useState(false);

  // Debounce search — prevents lag on large herb list
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredHerbs = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    let result = HERBS_CLEAN;

    if (q) {
      result = result.filter(h =>
        h.name.toLowerCase().includes(q) ||
        (h.botanical && h.botanical.toLowerCase().includes(q)) ||
        (h.tcm_element && h.tcm_element.toLowerCase().includes(q)) ||
        h.primary_functions.some(f => f.toLowerCase().includes(q)) ||
        h.energetics.some(e => e.toLowerCase().includes(q))
      );
    }
    if (activeCategories.length > 0) {
      result = result.filter(h => {
        const cats = getHerbCategories(h);
        return activeCategories.some(c => cats.includes(c));
      });
    }
    if (activeElements.length > 0) {
      result = result.filter(h => {
        const els = h.tcm_element.split(/\s*\+\s*/).map(e => e.trim());
        return activeElements.some(el => els.includes(el));
      });
    }
    if (showForageable) {
      result = result.filter(h => FORAGEABLE_EU.has(h.name));
    }
    if (showTryp) {
      result = result.filter(h => TRYP_HERBS.has(h.name));
    }
    if (activeSymptom && SYMPTOM_HERBS[activeSymptom]) {
      const names = new Set(SYMPTOM_HERBS[activeSymptom]);
      result = result.filter(h => names.has(h.name));
    }
    return result;
  }, [debouncedQuery, activeCategories, activeElements, showForageable, showTryp, activeSymptom]);

  // per-herb synergy pairs within the current selection
  const synergyMap = useMemo(() => {
    const map: Record<number, string[]> = {};
    selectedHerbs.forEach((h) => {
      const pairs: string[] = [];
      (h.herb_to_herb_synergy ?? []).forEach((s) => {
        selectedHerbs.forEach((other) => {
          if (other.id !== h.id && s.toLowerCase().includes(other.name.toLowerCase()))
            pairs.push(other.name);
        });
      });
      (h.herb_interactions ?? []).forEach((s) => {
        if (s.toLowerCase().includes("synergy:")) {
          s.replace(/synergy:/i, "").split(",").forEach((p) => {
            const pt = p.trim();
            if (
              selectedHerbs.some((o) => o.name.toLowerCase() === pt.toLowerCase()) &&
              pt.toLowerCase() !== h.name.toLowerCase() &&
              !pairs.includes(pt)
            ) pairs.push(pt);
          });
        }
      });
      map[h.id] = [...new Set(pairs)];
    });
    return map;
  }, [selectedHerbs]);

  const cautionFlags = useMemo(() => {
    const flags: Record<number, string[]> = {};
    selectedHerbs.forEach((h) => {
      const cautions: string[] = [];
      (h.herb_to_herb_caution ?? []).forEach((s) => {
        selectedHerbs.forEach((other) => {
          if (other.id !== h.id && s.toLowerCase().includes(other.name.toLowerCase()))
            cautions.push(other.name);
        });
      });
      flags[h.id] = [...new Set(cautions)];
    });
    return flags;
  }, [selectedHerbs]);

  const mixologySummary = useMemo(() => {
    if (selectedHerbs.length < 2) return null;

    // Temperature balance
    const warmCount = selectedHerbs.filter(h =>
      h.energetics.some(e => /^(hot|warm|slightly warm)/i.test(e))
    ).length;
    const coolCount = selectedHerbs.filter(h =>
      h.energetics.some(e => /^(cold|cool|slightly cool)/i.test(e))
    ).length;
    const tempLabel = warmCount > coolCount + 1 ? "Warming"
      : coolCount > warmCount + 1 ? "Cooling"
      : "Balanced";

    // TCM elements
    const elements = [...new Set(
      selectedHerbs.flatMap(h => h.tcm_element.split(/\s*\+\s*/).map(e => e.trim()))
    )].filter(Boolean).slice(0, 6);

    // Meridians coverage
    const meridians = [...new Set(selectedHerbs.flatMap(h => h.tcm_meridians))].slice(0, 6);

    // Synergy pairs (deduplicated)
    const synergyPairs: { a: string; b: string }[] = [];
    const seenSyn = new Set<string>();
    selectedHerbs.forEach(h => {
      (synergyMap[h.id] ?? []).forEach(partner => {
        const key = [h.name, partner].sort().join("|");
        if (!seenSyn.has(key)) { seenSyn.add(key); synergyPairs.push({ a: h.name, b: partner }); }
      });
    });

    // Caution pairs (deduplicated)
    const cautionPairs: { a: string; b: string }[] = [];
    const seenCaut = new Set<string>();
    selectedHerbs.forEach(h => {
      (cautionFlags[h.id] ?? []).forEach(partner => {
        const key = [h.name, partner].sort().join("|");
        if (!seenCaut.has(key)) { seenCaut.add(key); cautionPairs.push({ a: h.name, b: partner }); }
      });
    });

    // Highest caution level
    const cautionOrder = ["LOW","LOW-MEDIUM","MEDIUM","MEDIUM-HIGH","HIGH","VERY HIGH"];
    const maxCaution = selectedHerbs.reduce<Herb["caution_level"]>(
      (max, h) => cautionOrder.indexOf(h.caution_level) > cautionOrder.indexOf(max) ? h.caution_level : max,
      "LOW"
    );

    // Functional themes
    const THEMES: [string, string][] = [
      ["adaptogen","Adaptogenic"], ["nervine","Nervine"], ["hepatic","Hepatoprotective"],
      ["digest","Digestive"], ["immune","Immune"], ["hormon","Hormonal"],
      ["cognitive","Cognitive"], ["anti-inflamm","Anti-inflammatory"],
      ["anxiolytic","Anxiolytic"], ["sleep","Hypnotic"], ["tonic","Tonic"],
      ["antioxidant","Antioxidant"], ["antimicrobial","Antimicrobial"],
    ];
    const themes = THEMES
      .filter(([kw]) => selectedHerbs.some(h => h.primary_functions.some(f => f.toLowerCase().includes(kw))))
      .map(([, label]) => label);

    // Key mechanisms — extract the action phrase before "—" from each herb's top function
    const mechanisms = selectedHerbs.map(h => ({
      herb: h.name,
      action: h.primary_functions[0]
        ? h.primary_functions[0].split("—")[0].trim().replace(/\.$/, "")
        : "",
    })).filter(m => m.action.length > 3 && m.action.length < 80);

    // Herb roles
    const anchor1 = selectedHerbs[0]?.name ?? "";
    const anchor2 = selectedHerbs[1]?.name ?? "";
    const anchorStr = anchor2 ? `${anchor1} and ${anchor2}` : anchor1;
    const supportCount = selectedHerbs.length - 2;

    // Narrative (deep version)
    const THEME_WORDS: Record<string, string> = {
      Adaptogenic: "HPA axis adaptation and cortisol regulation",
      Nervine: "nervous system toning and emotional steadiness",
      Hepatoprotective: "hepatic clearing and metabolic detox flow",
      Digestive: "gut-liver restoration and microbiome support",
      Immune: "innate immune training and pathogen defence",
      Hormonal: "endocrine modulation and cycle support",
      Cognitive: "neuroplasticity, focus and memory consolidation",
      "Anti-inflammatory": "COX/LOX cascade inhibition and systemic inflammation reduction",
      Anxiolytic: "GABAergic anxiolytic calm without sedation",
      Hypnotic: "sleep onset, REM architecture and night repair",
      Tonic: "deep Jing/Qi tonic nourishment and vital restoration",
      Antioxidant: "Nrf2-mediated antioxidant cascade and cellular protection",
      Antimicrobial: "broad-spectrum antimicrobial and terrain restoration",
    };
    const top2themes = themes.slice(0, 2).map(t => THEME_WORDS[t] || t);
    const themeStr = top2themes.length >= 2
      ? `${top2themes[0]}, and ${top2themes[1]}`
      : top2themes[0] || "broad botanical support";

    const narrative = [
      `${anchorStr} form the anchor pair of this ${tempLabel.toLowerCase()}, ${selectedHerbs.length}-constituent formula — working primarily through ${themeStr}.`,
      supportCount > 0
        ? `${supportCount} supporting herb${supportCount !== 1 ? "s" : ""} (${selectedHerbs.slice(2).map(h => h.name).join(", ")}) extend the field through ${themes.slice(2, 4).join(", ") || "complementary action"}.`
        : "",
      elements.length > 0
        ? `The formula spans the ${elements.join(" · ")} element${elements.length !== 1 ? "s" : ""}, engaging ${meridians.slice(0, 4).join(", ")} meridians.`
        : "",
      synergyPairs.length > 0
        ? `${synergyPairs.length} synergistic pair${synergyPairs.length !== 1 ? "s" : ""} detected — the herb interactions amplify the combined therapeutic field beyond individual actions.`
        : "Each constituent contributes a distinct therapeutic lane with no detected cross-interactions.",
      cautionPairs.length > 0
        ? `⚠ ${cautionPairs.length} caution interaction${cautionPairs.length !== 1 ? "s" : ""} flagged — review before compounding or dispensing.`
        : "",
    ].filter(Boolean).join(" ");

    return { tempLabel, elements, meridians, synergyPairs, cautionPairs, maxCaution, themes, mechanisms, narrative };
  }, [selectedHerbs, synergyMap, cautionFlags]);

  const toggleHerb = (herb: Herb) => {
    const exists = selectedHerbs.find((h) => h.id === herb.id);
    if (exists) {
      setSelectedHerbs(selectedHerbs.filter((h) => h.id !== herb.id));
    } else if (selectedHerbs.length < 12) {
      setSelectedHerbs([...selectedHerbs, herb]);
    }
  };

  function saveFormula() {
    if (!mixologySummary) return;
    const entry: SavedFormula = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      herbIds: selectedHerbs.map(h => h.id),
      herbNames: selectedHerbs.map(h => h.name),
      themes: mixologySummary.themes,
      tempLabel: mixologySummary.tempLabel,
      synergyCount: mixologySummary.synergyPairs.length,
    };
    const updated = [entry, ...savedFormulas].slice(0, 30);
    setSavedFormulas(updated);
    localStorage.setItem("fungai_formulas", JSON.stringify(updated));
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1800);
    // Log human interaction to backend (silent fail — endpoint may not exist yet)
    fetch("/api/formula-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "human_formula_synthesis",
        timestamp: entry.savedAt,
        herbs: entry.herbNames,
        themes: entry.themes,
        temperature: entry.tempLabel,
        synergy_pairs: mixologySummary.synergyPairs,
        caution_pairs: mixologySummary.cautionPairs,
        meridians: mixologySummary.meridians,
        elements: mixologySummary.elements,
        note: "User-generated formula from Materia Medica selection — Fungai Art Herbal Engine",
      }),
    }).catch(() => {});
  }

  function loadFormula(f: SavedFormula) {
    const herbs = HERBS_CLEAN.filter(h => f.herbIds.includes(h.id));
    setSelectedHerbs(herbs);
    setShowResults(true);
    setIsSidebarOpen(false);
  }

  // ─── RESULTS VIEW ────────────────────────────────────────────────────────
  if (showResults) {
    return (
      <div
        className="min-h-[100dvh] overflow-x-hidden"
        style={{
          background: "radial-gradient(circle at top, #1d2623 0, #050606 55%)",
          color: "#f6f3ea",
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          padding: "1.5rem 1rem 4rem",
        }}
      >
        <div className="max-w-3xl mx-auto">
          {/* Back + Save row */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowResults(false)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] transition-opacity hover:opacity-70"
              style={{ color: "#7bd4a1" }}
            >
              <ArrowLeft size={13} /> Return to Materia Medica
            </button>
            <button
              onClick={saveFormula}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 rounded-full transition-all"
              style={{
                border: "0.5px solid rgba(123,212,161,0.35)",
                color: saveFlash ? "#0d1410" : "#7bd4a1",
                background: saveFlash ? "#7bd4a1" : "rgba(123,212,161,0.07)",
              }}
            >
              <BookmarkPlus size={11} />
              {saveFlash ? "Saved" : "Save formula"}
            </button>
          </div>

          {/* Page header */}
          <header className="mb-10 text-center px-2">
            <img src={FungaiArtLogo} alt="Fungai Art" className="w-12 h-12 mx-auto mb-4 object-contain" />
            <h1
              className="mb-2 text-white leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 500,
                letterSpacing: "0.04em",
                fontSize: "clamp(32px, 8vw, 56px)",
              }}
            >
              Formula Synthesis
            </h1>
            <p className="text-[10px] uppercase tracking-[0.35em]" style={{ color: "#7bd4a1" }}>
              {selectedHerbs.length} constituents · clinical matrix active
            </p>
          </header>

          {/* ── Mixology Summary ── */}
          {mixologySummary && (
            <div
              className="rounded-2xl overflow-hidden mb-8"
              style={{ background: "#0d1410", border: "0.5px solid rgba(123,212,161,0.22)" }}
            >
              {/* Header */}
              <div
                className="px-5 py-4"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)", background: "rgba(123,212,161,0.03)" }}
              >
                <div className="text-[9px] uppercase tracking-[0.25em] mb-1" style={{ color: "#7bd4a1" }}>
                  Synergy Mixology
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "#fff" }}>
                  Formula Intelligence
                </div>
              </div>

              {/* Narrative */}
              <div className="px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[12px] leading-relaxed" style={{ color: "#b9b3a6" }}>
                  {mixologySummary.narrative}
                </p>
              </div>

              {/* Stats grid */}
              <div
                className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4"
                style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}
              >
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Temperature</div>
                  <div className="text-[13px] font-medium text-white">{mixologySummary.tempLabel}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>TCM elements</div>
                  <div className="text-[11px] font-medium text-white leading-snug">{mixologySummary.elements.join(" · ")}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Synergy pairs</div>
                  <div className="text-[13px] font-medium" style={{ color: "#7bd4a1" }}>{mixologySummary.synergyPairs.length}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Max caution</div>
                  <div className={cn("text-[11px] font-medium", CAUTION_COLOR[mixologySummary.maxCaution])}>
                    {mixologySummary.maxCaution}
                  </div>
                </div>
              </div>

              {/* Functional lanes */}
              {mixologySummary.themes.length > 0 && (
                <div className="px-5 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7a766c" }}>Functional lanes</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mixologySummary.themes.map((t) => (
                      <span
                        key={t}
                        className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.04)", color: "#7a766c", border: "0.5px solid rgba(255,255,255,0.1)" }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Synergy pairs */}
              {mixologySummary.synergyPairs.length > 0 && (
                <div
                  className="px-5 py-3"
                  style={{ borderBottom: mixologySummary.cautionPairs.length > 0 ? "0.5px solid rgba(255,255,255,0.05)" : "none" }}
                >
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Detected synergies</div>
                  <div className="flex flex-wrap gap-2">
                    {mixologySummary.synergyPairs.map(({ a, b }, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-full"
                        style={{ background: "rgba(123,212,161,0.08)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.22)" }}
                      >
                        {a} × {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key mechanisms */}
              {mixologySummary.mechanisms.length > 0 && (
                <div className="px-5 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2.5" style={{ color: "#7a766c" }}>Key mechanisms</div>
                  <div className="space-y-1.5">
                    {mixologySummary.mechanisms.map(({ herb, action }) => (
                      <div key={herb} className="flex gap-2 text-[10px]" style={{ color: "#b9b3a6" }}>
                        <span className="flex-shrink-0 font-medium" style={{ color: "#7bd4a1", minWidth: 90 }}>{herb}</span>
                        <span className="leading-snug" style={{ color: "#7a766c" }}>— {action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meridians */}
              {mixologySummary.meridians.length > 0 && (
                <div className="px-5 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.05)" }}>
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7a766c" }}>Meridian coverage</div>
                  <div className="flex flex-wrap gap-1.5">
                    {mixologySummary.meridians.map(m => (
                      <span key={m} className="text-[9px] px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.03)", color: "#7a766c", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Caution interactions */}
              {mixologySummary.cautionPairs.length > 0 && (
                <div className="px-5 py-3">
                  <div className="text-[9px] uppercase tracking-[0.15em] mb-2 text-orange-400">Caution interactions</div>
                  <div className="flex flex-wrap gap-2">
                    {mixologySummary.cautionPairs.map(({ a, b }, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 rounded-full text-orange-300"
                        style={{ background: "rgba(251,146,60,0.08)", border: "0.5px solid rgba(251,146,60,0.22)" }}
                      >
                        {a} × {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Per-herb cards */}
          <div className="space-y-4">
            {selectedHerbs.map((h) => {
              const synergies = synergyMap[h.id] ?? [];
              const cautions  = cautionFlags[h.id] ?? [];
              return (
                <div
                  key={h.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#0d1410", border: "0.5px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Card top */}
                  <div
                    className="px-4 sm:px-6 py-4 flex items-start justify-between gap-3"
                    style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="min-w-0">
                      <h3
                        className="text-white mb-0.5 leading-tight"
                        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 600 }}
                      >
                        {h.name}
                      </h3>
                      <p className="text-[11px] italic truncate" style={{ color: "#7a766c" }}>{h.botanical}</p>
                    </div>
                    <span className={cn("text-[9px] px-2 py-1 rounded-full border whitespace-nowrap flex-shrink-0 mt-0.5", CAUTION_COLOR[h.caution_level])}>
                      {h.caution_level}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="px-4 sm:px-6 py-4 grid sm:grid-cols-2 gap-4">
                    {/* Primary actions */}
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Primary actions</div>
                      <ul className="space-y-1.5">
                        {h.primary_functions.slice(0, 4).map((fn, i) => (
                          <li key={i} className="text-[11px] leading-snug flex gap-2" style={{ color: "#b9b3a6" }}>
                            <span style={{ color: "#7bd4a1", flexShrink: 0, marginTop: 2 }}>·</span>
                            <span>{fn}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      {/* Energetics */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7bd4a1" }}>Energetics</div>
                        <div className="flex flex-wrap gap-1.5">
                          {h.energetics.map((e) => (
                            <span key={e} className="text-[9px] px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(123,212,161,0.07)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.2)" }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Meridians */}
                      <div>
                        <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>TCM meridians</div>
                        <div className="text-[11px]" style={{ color: "#b9b3a6" }}>{h.tcm_meridians.join(" · ")}</div>
                      </div>
                      {/* Dosage */}
                      {h.dosage_range && (
                        <div>
                          <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Dosage</div>
                          <div className="text-[11px]" style={{ color: "#b9b3a6" }}>{h.dosage_range}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Spiritual layer */}
                  {h.spiritual_layer && (
                    <div className="px-4 sm:px-6 pb-4">
                      <div className="text-[9px] uppercase tracking-[0.15em] mb-1" style={{ color: "#7a766c" }}>Spiritual dimension</div>
                      <p className="text-[11px] italic leading-relaxed" style={{ color: "#7a766c" }}>{h.spiritual_layer}</p>
                    </div>
                  )}

                  {/* Synergy / caution */}
                  {(synergies.length > 0 || cautions.length > 0) && (
                    <div
                      className="px-4 sm:px-6 py-3 flex flex-wrap gap-x-4 gap-y-2"
                      style={{ borderTop: "0.5px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.18)" }}
                    >
                      {synergies.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: "#7bd4a1" }}>Synergy:</span>
                          {synergies.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background: "rgba(123,212,161,0.1)", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.25)" }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {cautions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] uppercase tracking-[0.1em] text-orange-400">Caution:</span>
                          {cautions.map((c) => (
                            <span key={c} className="text-[10px] px-2 py-0.5 rounded-full text-orange-300"
                              style={{ background: "rgba(251,146,60,0.1)", border: "0.5px solid rgba(251,146,60,0.25)" }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowResults(false)}
              className="text-[11px] uppercase tracking-[0.22em] px-6 py-3 rounded-full border transition-opacity hover:opacity-70"
              style={{ borderColor: "rgba(123,212,161,0.3)", color: "#7bd4a1" }}
            >
              ← Adjust selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN VIEW ───────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col lg:flex-row h-[100dvh] overflow-hidden"
      style={{ background: "#050607", color: "#f6f3ea", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5 lg:p-6">

        {/* HEADER */}
        <header className="mb-4 pb-4 flex-shrink-0" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>

          {/* Brand row */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 overflow-hidden"
                style={{ border: "0.5px solid rgba(255,255,255,0.2)", background: "radial-gradient(circle at top, #2a3d35, #050607)" }}
              >
                <img src={FungaiArtLogo} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div
                  className="leading-tight truncate"
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(15px, 4vw, 22px)",
                    letterSpacing: "0.15em",
                    color: "#f9fafb",
                  }}
                >
                  Fungai Art Elixirs
                </div>
                <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#7a766c", marginTop: 1 }}>
                  Materia Medica · {HERBS.length} plants
                </div>
              </div>
            </div>

            {/* Nav + menu */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <a
                href="/herbal-engine.html" target="_blank" rel="noreferrer"
                className="hidden sm:block text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-opacity hover:opacity-100"
                style={{ color: "rgba(123,212,161,0.55)" }}
              >
                Engine 1.0 →
              </a>
              <a
                href="/herbal-engine-2/" target="_blank" rel="noreferrer"
                className="hidden sm:block text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-opacity hover:opacity-80"
                style={{ color: "#7bd4a1" }}
              >
                Engine 2.0 →
              </a>
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center justify-center rounded-xl transition-colors"
                style={{
                  width: 36, height: 36,
                  background: "#101412",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                }}
              >
                <Menu size={16} style={{ color: "#f6f3ea" }} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7a766c" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, botanical, energetics…"
              className="w-full rounded-xl text-sm outline-none transition-all"
              style={{
                background: "#101412",
                border: "0.5px solid rgba(255,255,255,0.1)",
                color: "#f6f3ea",
                padding: "10px 36px 10px 36px",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(123,212,161,0.35)")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
            />
            {searchQuery && (
              <X
                size={13}
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer"
                style={{ color: "#7a766c" }}
              />
            )}
          </div>
          {/* Result count */}
          {(debouncedQuery || activeCategories.length > 0 || activeElements.length > 0 || showForageable || showTryp || activeSymptom) && (
            <p className="text-[10px] mt-1.5" style={{ color: "#7a766c" }}>
              {filteredHerbs.length} herb{filteredHerbs.length !== 1 ? "s" : ""}
              {showTryp && " · Tryp"}
              {activeSymptom && ` · ${activeSymptom}`}
              {activeCategories.length > 0 && ` · ${activeCategories.join(", ")}`}
              {activeElements.length > 0 && ` · ${activeElements.join(", ")}`}
              {showForageable && " · Forageable EU"}
            </p>
          )}

          {/* ── Filter bar ── */}
          <div className="mt-3 flex flex-col gap-2">

            {/* Row 1: Category chips + Tryp */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {/* Tryp special pill */}
              <button
                onClick={() => setShowTryp(p => !p)}
                className="flex-shrink-0 text-[9px] px-2.5 py-1 rounded-full transition-all font-medium"
                style={{
                  border: showTryp ? "0.5px solid rgba(167,139,250,0.6)" : "0.5px solid rgba(167,139,250,0.25)",
                  background: showTryp ? "rgba(167,139,250,0.15)" : "rgba(167,139,250,0.05)",
                  color: showTryp ? "#c4b5fd" : "#9d7fd4",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                ✦ Tryp
              </button>

              {ALL_HERB_CATEGORIES.map(cat => {
                const on = activeCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategories(prev =>
                      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                    )}
                    className="flex-shrink-0 text-[9px] px-2.5 py-1 rounded-full transition-all"
                    style={{
                      border: on ? "0.5px solid rgba(123,212,161,0.55)" : "0.5px solid rgba(255,255,255,0.08)",
                      background: on ? "rgba(123,212,161,0.12)" : "rgba(255,255,255,0.03)",
                      color: on ? "#7bd4a1" : "#7a766c",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Symptom button + Element chips + Forageable */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {/* Symptom dropdown trigger */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setSymptomOpen(p => !p)}
                  className="flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full transition-all"
                  style={{
                    border: (activeSymptom || symptomOpen) ? "0.5px solid rgba(246,221,143,0.5)" : "0.5px solid rgba(255,255,255,0.08)",
                    background: (activeSymptom || symptomOpen) ? "rgba(246,221,143,0.1)" : "rgba(255,255,255,0.03)",
                    color: (activeSymptom || symptomOpen) ? "#f6dd8f" : "#7a766c",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {activeSymptom ? activeSymptom : "◈ By symptom"} {symptomOpen ? "▲" : "▾"}
                </button>

                {symptomOpen && (
                  <div
                    className="absolute left-0 top-8 z-50 rounded-2xl p-3 flex flex-wrap gap-1.5"
                    style={{
                      background: "#0d1410",
                      border: "0.5px solid rgba(246,221,143,0.2)",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                      width: 280,
                    }}
                  >
                    <div className="w-full text-[9px] uppercase tracking-[0.15em] mb-1 pb-1" style={{ color: "#7a766c", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                      Common symptoms
                    </div>
                    {Object.keys(SYMPTOM_HERBS).map(sym => (
                      <button
                        key={sym}
                        onClick={() => {
                          setActiveSymptom(activeSymptom === sym ? null : sym);
                          setSymptomOpen(false);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-full transition-all"
                        style={{
                          border: activeSymptom === sym ? "0.5px solid rgba(246,221,143,0.5)" : "0.5px solid rgba(255,255,255,0.08)",
                          background: activeSymptom === sym ? "rgba(246,221,143,0.12)" : "rgba(255,255,255,0.03)",
                          color: activeSymptom === sym ? "#f6dd8f" : "#b9b3a6",
                        }}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Forageable toggle */}
              <button
                onClick={() => setShowForageable(p => !p)}
                className="flex-shrink-0 text-[9px] px-2.5 py-1 rounded-full transition-all"
                style={{
                  border: showForageable ? "0.5px solid rgba(123,212,161,0.55)" : "0.5px solid rgba(255,255,255,0.08)",
                  background: showForageable ? "rgba(123,212,161,0.12)" : "rgba(255,255,255,0.03)",
                  color: showForageable ? "#7bd4a1" : "#7a766c",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                🌿 Forageable SE · DE
              </button>

              {/* Element chips */}
              {ALL_TCM_ELEMENTS.map(el => {
                const on = activeElements.includes(el);
                return (
                  <button
                    key={el}
                    onClick={() => setActiveElements(prev =>
                      prev.includes(el) ? prev.filter(e => e !== el) : [...prev, el]
                    )}
                    className="flex-shrink-0 text-[9px] px-2.5 py-1 rounded-full transition-all"
                    style={{
                      border: on ? "0.5px solid rgba(255,255,255,0.3)" : "0.5px solid rgba(255,255,255,0.08)",
                      background: on ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                      color: on ? "#f6f3ea" : "#7a766c",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {el}
                  </button>
                );
              })}

              {/* Clear all */}
              {(activeCategories.length > 0 || activeElements.length > 0 || showForageable || showTryp || activeSymptom) && (
                <button
                  onClick={() => { setActiveCategories([]); setActiveElements([]); setShowForageable(false); setShowTryp(false); setActiveSymptom(null); }}
                  className="flex-shrink-0 text-[9px] px-2.5 py-1 rounded-full transition-all"
                  style={{ border: "0.5px solid rgba(255,139,139,0.3)", background: "rgba(255,139,139,0.06)", color: "#ff8b8b", letterSpacing: "0.08em" }}
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
        </header>

        {/* HERB GRID — scrolls independently */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredHerbs.map((h) => {
              const selected = selectedHerbs.some((sh) => sh.id === h.id);
              return (
                <div
                  key={h.id}
                  onClick={() => toggleHerb(h)}
                  className="rounded-2xl cursor-pointer transition-all duration-200 relative"
                  style={{
                    background: selected
                      ? "radial-gradient(circle at top left, #16382a, #0a0f0c)"
                      : "#0d1410",
                    border: selected
                      ? "0.5px solid rgba(123,212,161,0.45)"
                      : "0.5px solid rgba(255,255,255,0.07)",
                    padding: "12px 14px 10px",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "rgba(123,212,161,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  }}
                >
                  {/* Selected indicator */}
                  {selected && (
                    <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full" style={{ background: "#7bd4a1" }} />
                  )}

                  {/* Name */}
                  <h3
                    className="text-white leading-tight mb-0.5 pr-4"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600 }}
                  >
                    {h.name}
                  </h3>

                  {/* Botanical */}
                  <p className="text-[10px] italic mb-2.5" style={{ color: "#7a766c" }}>
                    {h.botanical}
                  </p>

                  {/* Primary function snippet */}
                  {h.primary_functions[0] && (
                    <p className="text-[11px] leading-snug mb-2.5" style={{ color: "#b9b3a6" }}>
                      {shortFunction(h.primary_functions[0])}
                    </p>
                  )}

                  {/* Energetics pills */}
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {h.energetics.slice(0, 3).map((e) => (
                      <span
                        key={e}
                        className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: "rgba(123,212,161,0.07)",
                          color: "rgba(123,212,161,0.65)",
                          border: "0.5px solid rgba(123,212,161,0.15)",
                        }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>

                  {/* Footer: element + caution — use short label to prevent overflow */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] uppercase tracking-[0.1em] truncate" style={{ color: "#3d4a43" }}>
                      {h.tcm_element}
                    </span>
                    <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full border flex-shrink-0", CAUTION_COLOR[h.caution_level])}>
                      {CAUTION_SHORT[h.caution_level]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Bottom breathing room */}
          <div className="h-6" />
        </div>
      </main>

      {/* ── SIDEBAR ── */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col",
          "w-[290px] sm:w-[320px]",
          "lg:relative lg:translate-x-0 lg:w-[290px]",
          "transition-transform duration-300",
          isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "#0a0f0c",
          borderLeft: "0.5px solid rgba(255,255,255,0.07)",
          padding: "1rem",
          // iOS safe area at bottom
          paddingBottom: "max(1rem, env(safe-area-inset-bottom, 1rem))",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <div className="text-[9px] uppercase tracking-[0.2em] mb-0.5" style={{ color: "#7a766c" }}>
              Selection Matrix
            </div>
            <div className="text-[11px]" style={{ color: selectedHerbs.length > 0 ? "#7bd4a1" : "#3d4a43" }}>
              {selectedHerbs.length === 0
                ? "No herbs selected"
                : `${selectedHerbs.length} herb${selectedHerbs.length > 1 ? "s" : ""} selected`}
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, color: "#7a766c" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Engine links — mobile only */}
        <div className="lg:hidden flex gap-2 mb-4 flex-shrink-0">
          <a
            href="/herbal-engine.html"
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-[10px] uppercase tracking-[0.18em] py-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: "#101412", border: "0.5px solid rgba(123,212,161,0.2)", color: "rgba(123,212,161,0.6)" }}
          >
            Engine 1.0 →
          </a>
          <a
            href="/herbal-engine-2/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-[10px] uppercase tracking-[0.18em] py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: "#101412", border: "0.5px solid rgba(123,212,161,0.35)", color: "#7bd4a1" }}
          >
            Engine 2.0 →
          </a>
        </div>

        {/* Empty state */}
        {selectedHerbs.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-3 gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: "rgba(123,212,161,0.06)", border: "0.5px solid rgba(123,212,161,0.15)" }}
            >
              <Leaf size={18} style={{ color: "rgba(123,212,161,0.4)" }} />
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: "#7a766c" }}>
              Tap any plant in the grid to add it to your formula. Select 2–12 herbs to run a synergy analysis.
            </p>
            <div className="text-[10px] uppercase tracking-[0.15em]" style={{ color: "#3d4a43" }}>
              {HERBS.length} plants available
            </div>
          </div>
        )}

        {/* Selected list */}
        {selectedHerbs.length > 0 && (
          <div
            className="flex-1 overflow-y-auto space-y-2 mb-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}
          >
            {selectedHerbs.map((h) => {
              const synergies = synergyMap[h.id] ?? [];
              const cautions  = cautionFlags[h.id] ?? [];
              return (
                <div
                  key={h.id}
                  className="rounded-xl px-3 py-2.5 flex items-start justify-between gap-2"
                  style={{ background: "#101412", border: "0.5px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-white truncate">{h.name}</div>
                    <div className="text-[9px] uppercase tracking-[0.1em] mt-0.5" style={{ color: "#7a766c" }}>
                      {h.tcm_element}
                    </div>
                    {synergies.length > 0 && (
                      <div className="text-[9px] mt-1 truncate" style={{ color: "#7bd4a1" }}>
                        ⟳ {synergies.join(", ")}
                      </div>
                    )}
                    {cautions.length > 0 && (
                      <div className="text-[9px] mt-0.5 truncate text-orange-400">
                        ⚠ {cautions.join(", ")}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleHerb(h)}
                    className="flex-shrink-0 mt-0.5 transition-opacity hover:opacity-70"
                    style={{ color: "#3d4a43" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#f97373")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#3d4a43")}
                  >
                    <X size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile search */}
        <div className="relative mb-3 lg:hidden flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#7a766c" }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-lg text-xs outline-none"
            style={{
              background: "#101412",
              border: "0.5px solid rgba(255,255,255,0.08)",
              color: "#f6f3ea",
              padding: "9px 32px 9px 32px",
            }}
          />
          {searchQuery && (
            <X size={12} onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ color: "#7a766c" }}
            />
          )}
        </div>

        {/* Analyse button */}
        <button
          onClick={() => { if (selectedHerbs.length >= 2) setShowResults(true); }}
          disabled={selectedHerbs.length < 2}
          className="w-full rounded-xl text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-200 flex-shrink-0"
          style={{
            padding: "14px 12px",
            ...(selectedHerbs.length >= 2
              ? { background: "#16382a", color: "#7bd4a1", border: "0.5px solid rgba(123,212,161,0.35)", cursor: "pointer" }
              : { background: "#0d1410", color: "#3d4a43", border: "0.5px solid rgba(255,255,255,0.05)", cursor: "not-allowed" }
            ),
          }}
          onMouseEnter={(e) => { if (selectedHerbs.length >= 2) e.currentTarget.style.background = "#1e4a38"; }}
          onMouseLeave={(e) => { if (selectedHerbs.length >= 2) e.currentTarget.style.background = "#16382a"; }}
        >
          {selectedHerbs.length < 2
            ? `Select ${2 - selectedHerbs.length} more to analyse`
            : `Analyse ${selectedHerbs.length} herb${selectedHerbs.length > 1 ? "s" : ""} →`}
        </button>

        {/* Saved formulas */}
        {savedFormulas.length > 0 && (
          <div className="mt-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={9} style={{ color: "#7a766c" }} />
              <div className="text-[9px] uppercase tracking-[0.2em]" style={{ color: "#7a766c" }}>Saved formulas</div>
            </div>
            <div
              className="space-y-1.5 overflow-y-auto"
              style={{ maxHeight: 180, scrollbarWidth: "thin", scrollbarColor: "#1e2b24 transparent" }}
            >
              {savedFormulas.map(f => (
                <button
                  key={f.id}
                  onClick={() => loadFormula(f)}
                  className="w-full text-left rounded-xl px-3 py-2 transition-opacity hover:opacity-80"
                  style={{ background: "#101412", border: "0.5px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="text-[10px] font-medium text-white truncate">
                    {f.herbNames.slice(0, 3).join(", ")}{f.herbNames.length > 3 ? ` +${f.herbNames.length - 3}` : ""}
                  </div>
                  <div className="text-[9px] mt-0.5 flex gap-2" style={{ color: "#7a766c" }}>
                    <span>{f.tempLabel}</span>
                    {f.synergyCount > 0 && <span style={{ color: "#7bd4a1" }}>· {f.synergyCount} synergy</span>}
                    <span>· {new Date(f.savedAt).toLocaleDateString("en-GB", { day:"numeric", month:"short" })}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.55)" }}
        />
      )}
    </div>
  );
}

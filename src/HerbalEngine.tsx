import React, { useState, useMemo } from "react";
import { HERBS, type Herb } from "./data/herbs";

// Very small option sets to start
const INTENTIONS = [
  { id: "adaptogenic", label: "Stress resilience" },
  { id: "sleep", label: "Sleep & restoration" },
  { id: "gut", label: "Digestive reset" },
  { id: "mood", label: "Mood & emotion" },
  { id: "liver", label: "Detox & liver" }
];

const BODY_PATTERNS = [
  { id: "hot", label: "A lit match (hot / inflamed)" },
  { id: "cold", label: "A cold stone (cold / slow)" },
  { id: "mixed", label: "A flickering flame (mixed)" },
  { id: "depleted", label: "An empty cup (depleted)" }
];

type BodyId = "hot" | "cold" | "mixed" | "depleted";

function text(v: unknown): string {
  return (v ?? "").toString().toLowerCase();
}

// Very simple scoring using your Herb shape
function scoreHerb(herb: Herb, intentionId: string, bodyId: BodyId): number {
  let score = 0;

  // these are plain strings in your real type
  const pf = text(herb.primaryfunctions);
  const energetics = text(herb.energetics);
  const meridians = text(herb.tcmmeridians);
  const caution = herb.cautionlevel;

  // Intention matches
  if (intentionId === "adaptogenic" && pf.includes("adaptogen")) score += 4;
  if (intentionId === "sleep" && (pf.includes("sleep") || pf.includes("insomnia"))) score += 4;
  if (intentionId === "gut" && (pf.includes("digestive") || pf.includes("gi "))) score += 4;
  if (intentionId === "mood" && (pf.includes("mood") || pf.includes("nervine"))) score += 4;
  if (intentionId === "liver" && (pf.includes("liver") || meridians.includes("liver"))) score += 4;

  // Body pattern vs energetics
  if (bodyId === "hot" && (energetics.includes("cool") || energetics.includes("slightly cool"))) score += 3;
  if (bodyId === "cold" && energetics.includes("warm")) score += 3;
  if (bodyId === "depleted" && (energetics.includes("nourishing") || energetics.includes("building"))) score += 4;
  if (bodyId === "mixed" && energetics.includes("balancing")) score += 2;

  // Caution – prefer gentle herbs by default
  if (caution === "LOW") score += 1;
  if (caution === "LOW-MEDIUM") score += 0.5;
  if (caution === "MEDIUM-HIGH" || caution === "HIGH" || caution === "VERY HIGH") score -= 2;

  return score;
}

type ScoredHerb = Herb & {
  role: "hero" | "support";
  score: number;
};

export default function HerbalEngine() {
  const [intention, setIntention] = useState<string | null>(null);
  const [body, setBody] = useState<BodyId | null>(null);
  const [built, setBuilt] = useState(false);

  const topHerbs: ScoredHerb[] = useMemo(() => {
    if (!intention || !body) return [];
    const scored = HERBS.map((h) => ({
      herb: h,
      score: scoreHerb(h, intention, body)
    }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 5).map((x, idx) => ({
      ...x.herb,
      role: (idx < 2 ? "hero" : "support") as const,
      score: x.score
    }));
  }, [intention, body]);

  const handleBuild = () => {
    if (!intention || !body) {
      alert("Choose intention and body pattern first.");
      return;
    }
    setBuilt(true);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl space-y-8">
        <header className="space-y-2">
          <p className="text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
            Fungai Art Elixirs · Herbal Engine
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif text-white">
            Check in, then meet your herbal allies.
          </h1>
          <p className="text-xs text-slate-400 max-w-xl">
            This is a very early React prototype. It pulls plants from your actual HERBS
            catalogue and gives you a 5‑plant pattern: 2 anchor allies and 3 supports.
          </p>
        </header>

        {/* Step: Intention */}
        <section className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
            Step 1 · Primary intention
          </div>
          <h2 className="text-lg text-white">What is this elixir really for?</h2>
          <p className="text-xs text-slate-400">
            Pick the clearest headline. Everything else will orbit this.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {INTENTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setIntention(opt.id)}
                className={
                  "text-xs rounded-2xl border px-3 py-2 text-left transition " +
                  (intention === opt.id
                    ? "border-amber-500 bg-amber-500/10 text-amber-100"
                    : "border-slate-700 bg-[#020617] hover:border-slate-500")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Step: Body pattern */}
        <section className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
            Step 2 · Body pattern
          </div>
          <h2 className="text-lg text-white">Right now, your body feels more like…</h2>
          <p className="text-xs text-slate-400">
            One choice. Go for the one that feels 60% true.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {BODY_PATTERNS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setBody(opt.id as BodyId)}
                className={
                  "text-xs rounded-2xl border px-3 py-3 text-left transition " +
                  (body === opt.id
                    ? "border-amber-500 bg-amber-500/10 text-amber-100"
                    : "border-slate-700 bg-[#020617] hover:border-slate-500")
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={handleBuild}
            className="px-6 py-3 rounded-full bg-amber-500 text-black text-xs font-semibold tracking-[0.25em] uppercase disabled:opacity-40"
            disabled={!intention || !body}
          >
            Build 5‑plant pattern
          </button>
        </div>

        {/* Result */}
        {built && (
          <section className="bg-[#020617] border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
              Result · Anchor herbs in this pattern
            </div>

            {topHerbs.length === 0 && (
              <p className="text-xs text-slate-400">
                No obvious matches yet. This just means the current scoring is too strict –
                we can soften it later.
              </p>
            )}

            {topHerbs.length > 0 && (
              <>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">
                    These are drawn directly from your HERBS catalogue.
                  </p>
                </div>
                <div className="space-y-3">
                  {topHerbs.map((h) => (
                    <div
                      key={h.id}
                      className={
                        "rounded-2xl border px-4 py-3 " +
                        (h.role === "hero"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-700 bg-[#020617]")
                      }
                    >
                      <div className="flex justify-between items-baseline">
                        <div className="text-sm text-white font-semibold">
                          {h.name}
                          {h.role === "hero" && (
                            <span className="ml-2 text-[10px] uppercase tracking-[0.25em] text-amber-400">
                              Hero
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Score {h.score.toFixed(1)}
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        {h.botanical}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">
                        Energetics: {herbEnergeticsDisplay(h)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-3 rounded-xl border border-amber-200/30 bg-[#1f2933] px-3 py-2">
              <div className="text-[9px] uppercase tracking-[0.18em] text-amber-200">
                Gentle reminder
              </div>
              <div className="text-[10px] text-amber-100/90 mt-1">
                This is a ritual design tool built on your data. Herb patterns here are for
                inspiration and practitioner conversation, not direct prescriptions.
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// helper to show energetics nicely even though it's a string
function herbEnergeticsDisplay(h: Herb): string {
  const e = h.energetics ?? "";
  // if you later store them as comma‑separated lists, you can keep as-is
  return e;
}
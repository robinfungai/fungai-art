import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Music } from "lucide-react";

// IMAGE IMPORTS – these match the filenames you listed
import heroStephanie from "@/assets/mycelium-trance/mushroom-background.jpg";
import gong from "@/assets/mycelium-trance/gong.jpg";
import blueLotus from "@/assets/mycelium-trance/blue-lotus.jpg";
import fungaiLogo from "@/assets/mycelium-trance/logo-transparent.png";
import labelPrint from "@/assets/mycelium-trance/LABEL-PRINT-FINAL-21.png";
import mushroomBackground from "@/assets/mycelium-trance/hero-stephanie.png";
import mushroomGills from "@/assets/mycelium-trance/mushroom-gills.jpg";
import psiloMush from "@/assets/mycelium-trance/psilo-mush.png";
import robinAmanita from "@/assets/mycelium-trance/robin-amanita.jpeg";
import robinContact from "@/assets/mycelium-trance/robin-contact.jpg";
import robinMic from "@/assets/mycelium-trance/robin-mic.png";
import schizophyllium from "@/assets/mycelium-trance/schizophyllium.jpg";
import stephHealing from "@/assets/mycelium-trance/robin-chef.png";
import stephTuning from "@/assets/mycelium-trance/steph-tuning.png";
import stephUfo from "@/assets/mycelium-trance/steph-ufo.jpg";
import stephX3 from "@/assets/mycelium-trance/steph-x3.jpg";
import tuningForks from "@/assets/mycelium-trance/tuning-forks.png";
import stephamanita from "@/assets/mycelium-trance/steph-amanita.png";

const MyceliumTrance = () => {
  const guidingPrinciples = [
    "Reciprocity",
    "Embodiment",
    "Ecological Consciousness",
    "Integrity with Plant Allies",
    "Ritual Devotion",
    "Sensory Intelligence",
  ];
<h1 style={{ color: "red" }}>THIS IS MYCELIUM TRANCE NEW</h1>

  const plantAllies = [
    {
      name: "Amanita muscaria",
      description:
        "The wild hymn of the forest, a bridge and mycorrhizal genius—a fungal diplomat par excellence. In this underground economy they become translators and negotiators, helping entire forests share nutrients and chemical signals like a living neural network.",
      archetype:
        "⟶ Threshold Guardian – shattering illusions and opening hidden worlds (disorientation, dream, paradox).",
    },
    {
      name: "Chaga",
      description:
        "The elder who reminds us that decay is a form of devotion and that darkness is fertile. Drawing life from the wounded birch, it transmutes pain into nourishment—a living metaphor for regeneration.",
      archetype:
        "⟶ Silent Alchemist – thriving in decay, weaving new foundations (shadow, resilience, slow transformation).",
    },
    {
      name: "Cordyceps sinensis",
      description:
        "Moves along the thin line between life forces, teaching efficiency, endurance, and precise use of energy. A fungal strategist that keeps the system awake, adaptive, and alive, carrying transformation into motion, breath, and action.",
      archetype:
        "⟶ Restoring vitality – embodied will, energy, stamina, lucid presence.",
    },
    {
      name: "Pinus sylvestris – Pine pollen & cones",
      description:
        "The golden dust of renewal, the breath of the forest made visible. A fine alchemy of masculine essence, cellular vitality, and trees remembering their youth. Cones are sacred geometry made tangible, each scale unfolding like a hymn to the Fibonacci sequence.",
      archetype:
        "⟶ Sovereign Axis – grounding spine (earth–sky connection, regenerative energy, pattern of renewal).",
    },
    {
      name: "Chilcuague / Golden root",
      description:
        "The moment it touches the tongue, a warm, tingling vibration spreads through the mouth and into the breath, like a current switching on inside the body. It clears, sharpens, and opens—the senses feel more alive.",
      archetype:
        "⟶ Firekeeper of Voice – awakening vitality and authentic expression (tingling sensation, vocal release, presence).",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* Back link */}
      <div className="max-w-6xl mx-auto px-6 pt-20">
        <Button asChild variant="ghost" className="mb-4">
          <Link to="/offerings">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Offerings
          </Link>
        </Button>
      </div>

      {/* HERO */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroStephanie})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-16">
          <img
            src={fungaiLogo}
            alt="Fungai Art"
            className="mx-auto mb-6 w-40 opacity-90"
          />
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-golden mb-3">
            FUNGAI ART 2026
          </p>
          <h1 className="font-dream-avenue text-4xl md:text-6xl lg:text-7xl tracking-[0.25em] uppercase mb-4">
            Mycelium Trance
          </h1>
          <p className="text-[0.75rem] md:text-xs tracking-[0.25em] uppercase text-muted-foreground">
            Facilitated by Stephanie Teyæ &amp; Robin Fungi
          </p>
        </div>
      </section>

      {/* CONCEPT & EXPERIENCE */}
<section className="bg-[#0f0f0f] py-24 px-6">
  <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
    {/* Text side */}
    <div>
      <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase mb-8 text-center md:text-left">
        Concept &amp; Experience
      </h2>

      <div className="space-y-6 text-sm md:text-base text-muted-foreground leading-relaxed">
        <p>
          Sacred Plant Allies—Amanita muscaria, Chaga, Cordyceps, Pine pollen,
          Pine cones, Chilcuague—tether participants to the intelligence of the
          forest and its organism, opening sensory channels, activating
          neuroplasticity, and transmuting archetypal wisdom.
        </p>

        <p>
          Through sound, imagery, metaphor and somatic attunement, vibrations
          flow into bones, fascia and energetic fields. Participants are invited
          to become hyphae, weaving mycorrhizal threads with each other and the
          morphing organism, experiencing reciprocity, vitality and the
          intelligence of the life‑web.
        </p>

        <p>
          This{" "}
          <span className="font-semibold text-foreground">
            111‑minute journey
          </span>{" "}
          is a fully embodied sensory awakening, a deliberate attunement to the
          relational, ecological and mysterious architecture of life. It tunes
          perception to mycelial intelligence, allowing human consciousness to
          resonate with the subtle, interconnected networks around us.
        </p>
      </div>
    </div>

    {/* Image side */}
    <div className="flex justify-center">
      <img
        src={stephamanita}
        alt="Stephanie with Amanita"
        className="w-full max-w-md rounded-xl shadow-xl object-cover"
      />
    </div>
  </div>
</section>

      {/* INTENTION */}
<section
  className="relative py-24 px-6 bg-[#151515] overflow-hidden"
>
  {/* Background schizophyllium with opacity */}
  <div
    className="pointer-events-none absolute inset-0 opacity-50"
    style={{
      backgroundImage: `url(${schizophyllium})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      mixBlendMode: "soft-light",
    }}
  />

  {/* Content overlay */}
  <div className="relative max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
    {/* Text */}
    <div>
      <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase text-center md:text-left mb-8">
        Intention
      </h2>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
        We are contributing with an embodied metaphor for interconnectedness,
        enhancing nourishing collective coherence. Creating somatic memory and
        ecological awareness. Sound shifts the brain; vibration speaks to cells;
        relational medicine opens windows of plasticity, imprinting a visceral
        sense of belonging and reciprocity. Inviting participants to sense their
        place as givers and receivers within a greater ecology – a state of deep
        relational presence.
      </p>
    </div>

    {/* Images: mushroom + tuning-forks */}
    <div className="grid grid-cols-2 gap-4">
      <div className="flex items-end">
        <img
          src={mushroom-background.jpg}
          alt="Stephanie in ritual setting"
          className="w-full rounded-xl shadow-xl object-cover"
        />
      </div>
      <div className="flex items-start">
        <img
          src={tuningForks}
          alt="Tuning forks and sound tools"
          className="w-full rounded-xl shadow-xl object-cover"
        />
      </div>
    </div>
  </div>
</section>

      {/* ABOUT THE ARTISTS */}
      <section className="bg-[#0f0f0f] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-sm md:text-base text-muted-foreground italic text-center mb-10 leading-relaxed">
            “Inspired by a future where medicine and art return to their
            original unity, we craft multidimensional portals as sacred rebels,
            artists and healers.”
          </p>

          <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase text-center mb-12">
            About the Artists
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Stephanie */}
            <div>
              <div className="w-40 h-40 rounded-full overflow-hidden mb-5 border border-border/40 mx-auto">
                <img
                  src={stephX3}
                  alt="Stephanie"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-center text-base tracking-[0.2em] uppercase mb-4">
                Stephanie Teyæ
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>5+ years facilitator of somatic rituals and group immersions.</li>
                <li>Systemic psycho‑mystic coach (trauma‑informed).</li>
                <li>Gong and tuning fork practitioner.</li>
                <li>Guided sensual experiences.</li>
                <li>Botanical crafter, elixir maker (herbalist‑in‑training).</li>
                <li>Art installations.</li>
              </ul>
            </div>

            {/* Robin */}
            <div>
              <div className="w-40 h-40 rounded-full overflow-hidden mb-5 border border-border/40 mx-auto">
                <img
                  src={robinAmanita}
                  alt="Robin Fungi"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-center text-base tracking-[0.2em] uppercase mb-4">
                Robin Fungi
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  Facilitator of mushroom ceremonies and educative talks about
                  psilocybin &amp; Amanita muscaria.
                </li>
                <li>Guided sensual experiences.</li>
                <li>Art installations.</li>
                <li>Chef, forager &amp; elixir maker (herbalist‑in‑training).</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PLANT ALLIES */}
      <section className="bg-[#151515] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase text-center mb-12">
            Plant Allies as Initiatory Intelligence
          </h2>

          <div className="grid gap-10">
            {plantAllies.map((ally) => (
              <div
                key={ally.name}
                className="border-l border-border/60 pl-6 space-y-3"
              >
                <h3 className="text-sm tracking-[0.2em] uppercase">
                  {ally.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {ally.description}
                </p>
                <p className="text-xs italic text-muted-foreground/80">
                  {ally.archetype}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SENSORY ARCHITECTURE */}
      <section className="bg-[#0f0f0f] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase text-center mb-12">
            The Sensory Architecture
          </h2>

          <div className="grid gap-10">
            <Card className="bg-black/40 border-border/40">
              <CardHeader className="flex flex-row items-center gap-4">
                <img
                  src={labelPrint}
                  alt="Vibrational immersion"
                  className="w-28 h-20 object-cover rounded-md"
                />
                <CardTitle className="text-sm tracking-[0.18em] uppercase">
                  Vibrational Immersion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  Carefully curated sound frequencies:{" "}
                  <span className="font-semibold text-foreground">
                    beta waves at 18 Hz
                  </span>{" "}
                  (awakening pulse, sharpens presence, destabilizes habitual
                  identity),{" "}
                  <span className="font-semibold text-foreground">
                    theta waves at 4–7 Hz
                  </span>{" "}
                  (trance threshold, porous self‑boundaries, imagery and
                  sensation deepen),{" "}
                  <span className="font-semibold text-foreground">
                    self‑made gong at 111 Hz
                  </span>{" "}
                  (sensory expansion, bodily, visceral),{" "}
                  <span className="font-semibold text-foreground">
                    deep delta waves at 0–4 Hz
                  </span>{" "}
                  (deep integrative state, where re‑patterning becomes
                  possible).
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-border/40">
              <CardHeader className="flex flex-row items-center gap-4">
                <img
                  src={mushroomBackground}
                  alt="Intention & somatic attunement"
                  className="w-28 h-20 object-cover rounded-md"
                />
                <CardTitle className="text-sm tracking-[0.18em] uppercase">
                  Intention &amp; Somatic–Sensory Attunement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  Intention is the directional force. It shapes the field and
                  establishes coherence—aligning participants, space, sound, and
                  plant allies into a relational ecology. Somatic–sensory
                  attunement brings the field into the body. Through subtle
                  somatic cues, focused sensation, and scent, the body stays
                  tethered as perception expands, supporting a grounded return
                  from trance into embodied awareness.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-black/40 border-border/40">
              <CardHeader className="flex flex-row items-center gap-4">
                <img
                  src={schizophyllium}
                  alt="Mycelium metaphor"
                  className="w-28 h-20 object-cover rounded-md"
                />
                <CardTitle className="text-sm tracking-[0.18em] uppercase">
                  Mycelium Metaphor &amp; Relational Ecology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed">
                  Metaphor here is symbolic and operative—it reshapes perception
                  by giving the body a living image through which new ways of
                  sensing, relating, and belonging can be embodied. It
                  reactivates cellular memory of interconnection and symbiosis,
                  turning mycelium into a living map of our relational nature.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* WORKING WITH PSILOCYBIN */}
      <section className="bg-[#151515] py-24 px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase text-center">
            Working with Psilocybin
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Psilocybin, when combined with intentional sound frequencies and
            mindful guidance, can deepen emotional processing and expand
            consciousness. Music acts as a “hidden therapist,” gently guiding
            inner experience, facilitating mystical states, and opening access
            to transformative insights that support lasting healing.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            At a neural level, psilocybin promotes neuroplasticity and increases
            communication between brain regions, loosening rigid mental
            patterns. A key part of this process is the temporary quieting of
            the Default Mode Network—the system associated with the habitual
            sense of “I,” self‑referential thinking, and egoic control.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This opening fosters emotional openness, relief from depression and
            anxiety, and profound psychological transformation. In this state,
            insights are not only understood intellectually but felt and
            embodied.
          </p>
        </div>
      </section>

      {/* PERFORMANCE HIGHLIGHTS */}
      <section className="bg-[#0f0f0f] py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-dream-avenue text-3xl md:text-4xl tracking-[0.2em] uppercase text-center mb-10">
            Performance Highlights
          </h2>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="p-4 border border-border/30 bg-black/30 rounded-lg">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="font-semibold text-foreground">
                  Astral Plans, France
                </span>
                <span>Entheogenic Dinner (70 pax) · Light Portal Activation (50 pax)</span>
              </div>
            </div>
            <div className="p-4 border border-border/30 bg-black/30 rounded-lg">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="font-semibold text-foreground">
                  Hive Festival, Germany
                </span>
                <span>Blue Lotus Ceremony (50 pax) · Somatic Exploration (40 pax)</span>
              </div>
            </div>
            <div className="p-4 border border-border/30 bg-black/30 rounded-lg">
              <div className="flex justify-between flex-wrap gap-2">
                <span className="font-semibold text-foreground">
                  Private Event, Bali
                </span>
                <span>Mycelium Trance (14 pax)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT / CTA */}
      <section className="bg-[#151515] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h3 className="font-dream-avenue text-2xl md:text-3xl tracking-[0.2em] uppercase">
            Experience the Mycelial Web
          </h3>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            A profound journey into the life‑web, exploring our symbiosis with
            vibration and each other as interconnected beings.
          </p>

          <div className="space-y-2 text-sm md:text-base text-muted-foreground">
            <p className="tracking-[0.18em] uppercase text-xs md:text-sm">
              Contact
            </p>
            <p>
              <a
                href="mailto:robin@fungai.art"
                className="underline hover:text-golden"
              >
                robin@fungai.art
              </a>
              {"  ·  "}
              <a
                href="mailto:teyae@fungai.art"
                className="underline hover:text-golden"
              >
                teyae@fungai.art
              </a>
            </p>
          </div>

          <Button
            asChild
            className="bg-golden hover:bg-golden/90 text-background text-sm md:text-base px-8 py-6"
          >
            <Link to="/#contact">
              <Music className="w-4 h-4 mr-2" />
              Open Contact Form
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default MyceliumTrance;

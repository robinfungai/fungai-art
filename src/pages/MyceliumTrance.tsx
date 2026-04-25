import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Music, Leaf, Sparkles, Waves, Network, Radio, Brain, Users } from "lucide-react";
import myceliumHero from "@/assets/mycelium-trance-hero.jpg";
import myceliumNetwork from "@/assets/mycelium-trance-network.png";
import stephaniePortrait from "@/assets/stephanie-portrait.png";
import robinPortrait from "@/assets/robin-portrait.png";
const MyceliumTrance = () => {
  const plantAllies = [{
    name: "Amanita Muscaria",
    description: "The wild hymn of the forest. They are a bridge, mycorrhizal genius - a fungal diplomat par excellence. In this underground economy they become a translator and negotiator, they trades sugars from the tree's photosynthesis for essential minerals and water drawn from the soil, helping entire forests share nutrients and chemical signals, like a living neural network. Translating the life of the forest into the breath of the human imagination."
  }, {
    name: "Chaga",
    description: "Chaga is the elder, the shadow sage - the one who reminds us that decay is a form of devotion and that darkness is fertile. It is no ordinary fungus, but a keeper of the deep earth codes. Drawing life from the wounded birch, it transmutes pain into nourishment - a living metaphor for regeneration."
  }, {
    name: "Pine Cones / Pine Pollen",
    description: "The golden dust of renewal, It is the breath of the forest made visible — a fine alchemy of masculine essence, cellular vitality, and ancient trees remembering their youth. Pine cones are the forest's sacred geometry made tangible, each scale unfolding like a hymn to the Fibonacci sequence, whispering of cosmic order hidden in earthly form."
  }, {
    name: "Chilcuague / Golden Root",
    description: "The moment it touches the tongue, a warm, tingling vibration spreads through the mouth and into the breath, almost like a current switching on inside the body. It clears, sharpens, and opens, the senses feel more alive. This golden root is both purifier and activator."
  }];
  const uniqueElements = [{
    icon: <Waves className="w-6 h-6" />,
    title: "Vibrational Shifts",
    description: "Carefully curated sound frequencies: beta waves at 18 Hz (awakening pulse), self-made Gong tuned to 111 Hz (trance remembering), deep Delta waves at 4 Hz (root descent)."
  }, {
    icon: <Leaf className="w-6 h-6" />,
    title: "Sacred Plant Allies",
    description: "Sacred botanical elements: pine pollen, pine cones, chaga, amanita muscaria and micro-psilocybin, open sensory and consciousness pathways during the journey."
  }, {
    icon: <Sparkles className="w-6 h-6" />,
    title: "Tuning Fork Light Body Activation",
    description: "Activates the light body by directing vibrations into bones, tissues, and energetic fields, fostering embodied sensory awakening throughout the performance."
  }, {
    icon: <Radio className="w-6 h-6" />,
    title: "Layered Frequencies and Binaural Beats",
    description: "Six powerful frequencies including Sun 126.22 Hz and Schumann 125.28 Hz binaural beats, Divine 5th intervals at 108 Hz and 162 Hz, AUM at 136.1 Hz, and Root tone at 128 Hz weave together to create complex vibrational textures."
  }, {
    icon: <Network className="w-6 h-6" />,
    title: "Mycorrhizal Metaphor & Relational Ecology",
    description: "Participants become like fungal hyphae - mycorrhizal threads - forming a living network of energy and connection. This fully embodied trance moves beyond habitual sensory limits into subtle currents of being, offering a profound ecological and relational exploration rather than meditation."
  }];
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden mt-16">
        <div className="absolute inset-0 z-0">
          <img src={myceliumHero} alt="Mycelium Trance ceremonial space" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-20">
          <p className="text-sm uppercase tracking-widest text-golden mb-4">Presented by FUNGAI ART</p>
          <h1 className="font-dream-avenue text-5xl md:text-8xl mb-6 leading-tight">
            <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
              Mycelium Trance
            </span>
          </h1>
          
          
        </div>
      </section>

      <Button asChild variant="ghost" className="ml-6 mt-8">
        <Link to="/offerings">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Offerings
        </Link>
      </Button>

      {/* Introduction */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center space-y-6">
          <p className="text-xl text-muted-foreground leading-relaxed">
            We are contributing with an embodied metaphor for interconnectedness, enhancing nourishing collective coherence.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Creating somatic memory and ecological awareness. Through plant medicine and sound frequencies we imprint a visceral sense of belonging and reciprocity, inviting participants to sense their place of givers and receivers within a greater ecology - a state of deep relational presence.
          </p>
        </div>
      </section>

      {/* Concept & Experience */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-dream-avenue text-4xl md:text-5xl mb-8 text-center">
            <span className="bg-gradient-to-r from-golden via-accent to-golden bg-clip-text text-transparent">
              Concept & Experience
            </span>
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>This 111-minute journey is a fully embodied sensory awakening, a deliberate attunementto the relational, ecological, and mysterious architecture of life. It tunes participants to the mycelial intelligence, allowing humanperceptionandconsciousnesstoresonatewiththesubtle,interconnectednetworksaroundus<strong className="text-foreground">111-minute journey</strong> is a fully embodied sensory awakening, exploring the relational, ecological, and mysterious architecture of life and vibration. It unfolds through vibrational shifts—awakening pulse, trance remembering, and root descent—each a gateway extending perception beyond habitual limits into subtle currents of being.
            </p>
            <p>Sacred PlantAllies-Amanita muscaria,Chaga,Cordyceps, Pine pollen, Pine cones,Chilcuague - tether participants to the intelligence of the forest and its organism, opening sensory channels, activatingneuroplasticity,andtransmutingarchetypalwisdom. 


Through diverse sound modules, imagery, metaphor and somatic attunement, vibrationsflowinto bones,fascia, and energetic fields. Participants are invited to become hyphae,weaving mycorrhizal threads with each other and the morphing organism, experiencing reciprocity, vitality, and intelligenceofthelife-web.</p>
            
            <p className="text-xl text-foreground font-light italic text-center pt-4">
              This is not meditation; it is a mycorrhizal trance - a profound journey into the life-web, exploring our symbiosis with vibration and each other as interconnected beings.
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <img src={myceliumNetwork} alt="Mycelium network illustration" className="max-w-md w-full rounded-lg opacity-80" />
          </div>
        </div>
      </section>

      {/* Unique Elements */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="font-dream-avenue text-4xl md:text-5xl mb-12 text-center">
          <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
            Unique Elements
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {uniqueElements.map((element, index) => <Card key={index} className="group hover:shadow-mystical transition-all duration-500 bg-card/80 backdrop-blur-sm border-border/50 hover:border-golden/30">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-golden mb-3 group-hover:scale-110 transition-transform duration-300">
                  {element.icon}
                </div>
                <CardTitle className="text-xl font-inter text-foreground">
                  {element.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {element.description}
                </CardDescription>
              </CardContent>
            </Card>)}
        </div>
      </section>

      {/* Plant Allies */}
      <section className="bg-gradient-to-br from-accent/5 via-background to-primary/5 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-dream-avenue text-3xl md:text-4xl mb-8 text-center">
            <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
              Plant Allies
            </span>
          </h2>

          <div className="space-y-4 text-muted-foreground">
            {plantAllies.map((ally, index) => <div key={index} className="leading-relaxed">
                <strong className="text-golden font-semibold">{ally.name}</strong>
                <br />
                {ally.description}
              </div>)}
          </div>
        </div>
      </section>

      {/* Working with Psilocybin */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="font-dream-avenue text-3xl md:text-4xl mb-6 text-center">
          <span className="bg-gradient-to-r from-golden via-accent to-golden bg-clip-text text-transparent">
            Working with Psilocybin
          </span>
        </h2>

        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>
            Psilocybin combined with intentional sound frequencies and mindful guidance enhances therapeutic outcomes by deepening emotional processing and expanding consciousness. Music acts as a "hidden therapist," facilitating mystical experiences and transformative insights that promote lasting healing.
          </p>
          <p>
            By promoting neuroplasticity and increasing brain connectivity, psilocybin opens the system to rewire rigid patterns, fostering emotional openness, rapid relief from depression and anxiety, and profound psychological transformation. This synergy of sacred plant allies, vibrational sound, and intention creates a powerful, embodied journey of healing and expansion.
          </p>
          <p className="text-center italic text-foreground text-sm mt-4">
            Turning off the default mode network - which is the self of I (ego)
          </p>
        </div>
      </section>

      {/* About the Artists */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-lg text-muted-foreground italic mb-6 text-center leading-relaxed">
            "We are inspired by a future where medicine and art return to their original unity,
            <br />
            we craft multidimensional portals as sacred rebels, artists and healers."
          </p>
          <h2 className="font-dream-avenue text-3xl md:text-4xl mb-10 text-center">
            <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
              About the Artists
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stephanie */}
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-golden/30">
                <img src={stephaniePortrait} alt="Stephanie Teÿæ" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-dream-avenue text-golden mb-3">Stephanie</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>5 years experienced facilitator of somatic rituals and group immersions</li>
                <li>Gong and Tuning fork practitioner</li>
                <li>Guided sensual experiences</li>
                <li>Art installations</li>
              </ul>
            </div>

            {/* Robin */}
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-2 border-golden/30">
                <img src={robinPortrait} alt="Robin Fungi" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-dream-avenue text-golden mb-3">Robin</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>Facilitation of mushroom ceremonies about psilocybin & amanita and educative talks</li>
                <li>Guided muscaria for groups</li>
                <li>Sensual experiences</li>
                <li>Chef, forager art installations</li>
                <li>Elixir master</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Events */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="font-dream-avenue text-3xl md:text-4xl mb-8 text-center">
          <span className="bg-gradient-to-r from-golden via-accent to-golden bg-clip-text text-transparent">
            Performance Highlights
          </span>
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20">
            <h3 className="text-lg font-semibold text-foreground">Astral Plans, France</h3>
            <p className="text-sm text-muted-foreground">Entheogenic Dinner, Light Portal Activation</p>
          </div>

          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20">
            <h3 className="text-lg font-semibold text-foreground">Hive Festival, Germany</h3>
            <p className="text-sm text-muted-foreground">Blue Lotus Ceremony, Somatic Exploration</p>
          </div>

          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20">
            <h3 className="text-lg font-semibold text-foreground">Private Event, Berlin</h3>
            <p className="text-sm text-muted-foreground">Mycelium Trance</p>
          </div>

          <div className="p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-border/20">
            <h3 className="text-lg font-semibold text-foreground">Hive Festival</h3>
            <p className="text-sm text-muted-foreground">Performance</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-dream-avenue text-3xl md:text-4xl mb-6 text-foreground">
            Join Us on This Journey
          </h3>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Experience the profound connection between consciousness, sound, and the mycelial web of existence.
          </p>
          <Button asChild className="bg-golden hover:bg-golden/90 text-background text-lg px-8 py-6">
            <Link to="/#contact">
              <Music className="w-5 h-5 mr-2" />
              Get in Touch
            </Link>
          </Button>
        </div>
      </section>
    </div>;
};
export default MyceliumTrance;
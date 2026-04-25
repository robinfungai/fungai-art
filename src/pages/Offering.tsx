import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf, Heart, Sparkles, Shield, Globe, Users } from "lucide-react";
import { Link } from "react-router-dom";
import myceliumBg from "@/assets/mycelium-network.jpg";

const Offering = () => {
  const offerings = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Amanita Muscaria Ceremony",
      description: "Journey into the ancient wisdom of the fly agaric mushroom. A guided ceremonial experience honoring traditional shamanic practices with this sacred fungi ally."
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Blue Lotus Ceremony",
      description: "Immerse yourself in the tranquil energy of the sacred Blue Lotus. An ancient Egyptian sacrament used for spiritual awakening, deep relaxation, and dream enhancement."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Sananga Ceremony",
      description: "Experience the powerful Amazonian eye medicine. This sacred plant ally clears energetic blockages, sharpens vision, and opens deeper perception of reality."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Mycelium Trance Immersion",
      description: "A unique ceremonial performance that weaves together plant medicine, sound, and consciousness. Journey through the underground network of existence.",
      link: "/mycelium-trance"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden mt-16">
        <div className="absolute inset-0 z-0">
          <img 
            src={myceliumBg} 
            alt="Mycelium network representing interconnected offerings"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-20">
          <h1 className="font-dream-avenue text-5xl md:text-7xl mb-6 leading-tight">
            <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
              Our Sacred Offerings
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            More than products, we offer a gateway to ancient wisdom, healing traditions, 
            and the profound connection between humanity and the plant kingdom.
          </p>
        </div>
      </section>

      {/* What We Offer */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {offerings.map((offering, index) => (
            <Card 
              key={index}
              className="group hover:shadow-mystical transition-all duration-500 bg-card/80 backdrop-blur-sm border-border/50 hover:border-golden/30"
            >
              <CardHeader>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-golden mb-4 group-hover:scale-110 transition-transform duration-300">
                  {offering.icon}
                </div>
                <CardTitle className="text-2xl font-inter text-foreground">
                  {offering.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {offering.description}
                </CardDescription>
                {offering.link && (
                  <Button asChild variant="outline" className="border-golden/30 text-golden hover:bg-golden/10">
                    <Link to={offering.link}>
                      Learn More <Sparkles className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Our Promise */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-dream-avenue text-4xl md:text-5xl mb-8 text-foreground">
            <span className="bg-gradient-to-r from-golden via-accent to-golden bg-clip-text text-transparent">
              Our Promise to You
            </span>
          </h2>
          <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
            <p>
              Every product in our collection is chosen with intention and respect. We don't just sell botanicals—
              we share allies for your journey toward wellness, consciousness, and connection.
            </p>
            <p>
              From the mushrooms we forage in ancient forests to the herbs cultivated with care, 
              each offering carries the essence of its origin and the wisdom of generations who came before us.
            </p>
            <p>
              We invite you to explore these sacred plant teachers with reverence and curiosity, 
              honoring the profound relationship between human consciousness and the natural world.
            </p>
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-golden hover:bg-golden/90 text-background text-lg px-8 py-6">
              <Link to="/products">
                <Sparkles className="w-5 h-5 mr-2" />
                Explore Our Collection
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-golden/30 text-golden hover:bg-golden/10 text-lg px-8 py-6">
              <Link to="/#contact">
                Connect With Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Offering;

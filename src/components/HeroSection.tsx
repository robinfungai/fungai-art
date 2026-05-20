import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-fungi.jpg";
import logoImage from "@/assets/fungai-art-logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Mystical fungi art in enchanted forest"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      </div>

      {/* Floating Spores Animation */}
      <div className="absolute inset-0 z-10">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-golden/30 rounded-full animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-20 text-center max-w-4xl mx-auto px-6 animate-organic-grow pt-[28rem]">

        <h1 className="font-dream-avenue text-4xl md:text-6xl text-foreground mb-6 mt-16 leading-tight tracking-wider normal-case">
          <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent drop-shadow-lg">fungai art</span>
        </h1>
        
        <p className="font-inter text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
          Ancient plant wisdom meets modern craftsmanship. Discover premium botanical extracts,
          mushroom medicines, and plant allies sourced with reverence and intention.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="rounded-full px-8 bg-golden text-background hover:bg-golden/90 font-semibold"
            onClick={() => window.location.href = '/mixology'}
          >
            Open Mixology Lab
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 border-golden/40 text-golden hover:bg-golden/10"
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
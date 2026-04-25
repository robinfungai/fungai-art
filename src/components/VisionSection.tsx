import logoImage from "@/assets/fungai-art-logo.png";

const VisionSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background via-background/95 to-background">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src={logoImage} 
              alt="fungai art vision"
              className="w-48 h-48 md:w-64 md:h-64 object-contain animate-float"
            />
          </div>
          
          {/* Vision Content */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-dream-avenue text-3xl md:text-4xl text-foreground mb-6">
              <span className="bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
                Our Vision
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              At the heart of <span className="font-semibold text-foreground">Fungai Art</span> is a deep remembering: reconnecting people to their natural state of being in rhythm with the living Earth.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We understand <span className="font-semibold text-foreground">Gaia</span> not as a resource, but as a conscious, regenerative system that has always held the medicine of <span className="font-semibold text-foreground">care, balance, and belonging</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisionSection;

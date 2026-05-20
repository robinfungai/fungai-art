import logoImage from "@/assets/fungai-art-logo.png";
import myceliumNetwork from "@/assets/mycelium-network.jpg";
import pomelli1 from "@/assets/pomelli-image-1.png";
import pomelli3 from "@/assets/pomelli-image-3.png";

const FlowingAboutSection = () => {
  return <section className="relative py-0 px-6 bg-gradient-to-b from-background via-card to-background overflow-hidden">
      {/* Organic Flowing Background */}
      <div className="absolute inset-0">
        <svg viewBox="0 0 1200 800" className="w-full h-full opacity-10">
          <path d="M0,400 Q300,200 600,400 T1200,400 L1200,800 L0,800 Z" fill="url(#organic-gradient-1)" />
          <path d="M0,500 Q400,300 800,500 T1200,500 L1200,800 L0,800 Z" fill="url(#organic-gradient-2)" />
          <defs>
            <linearGradient id="organic-gradient-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--mystical-purple))" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="organic-gradient-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--golden-spore))" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(var(--forest-deep))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Pipettes */}
      <div className="absolute inset-0 pointer-events-none">
      </div>

      <div className="relative z-10 max-w-6xl mx-auto py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Content with Organic Shapes */}
          <div className="space-y-8">
            <div className="relative">
              {/* Organic background blob */}
              <div className="absolute -inset-8 bg-gradient-mystical rounded-full opacity-5 blur-2xl transform -rotate-12 scale-110"></div>
              
              <div className="relative z-10">
                <h2 className="font-playfair text-4xl md:text-5xl font-semibold text-foreground mb-6">
                  Botanical Wisdom & 
                  <span className="text-primary-glow italic block">Natural Healing</span>
                </h2>
                <p className="font-inter text-lg text-muted-foreground leading-relaxed">
                  We curate premium botanical extracts, medicinal mushrooms, and plant medicines
                  sourced with deep respect for indigenous traditions and sustainable practices.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Mushroom Image positioned left of Pure and Potent */}
              <div className="absolute -left-12 top-96 z-0">
                <img src={myceliumNetwork} alt="Mycelium" className="w-32 h-32 object-cover rounded-full opacity-30 animate-float" style={{
                animationDelay: '2s'
              }} />
              </div>
              
              {/* Organic Feature Bubbles */}
              <div className="relative group ml-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative flex items-start space-x-4 p-6 rounded-2xl">
                  <div>
                    <h3 className="font-inter font-semibold text-xl text-primary-glow mb-2">
                      Pure & Potent
                    </h3>
                    <p className="text-muted-foreground">
                      Every extract and tincture is carefully crafted for maximum potency,
                      using traditional methods and modern precision.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-golden/10 to-transparent rounded-full blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative flex items-start space-x-4 p-6 rounded-3xl bg-card/30 backdrop-blur-sm border border-golden/10">
                  <div>
                    <h3 className="font-inter font-semibold text-xl text-golden mb-2">
                      Ethically Sourced
                    </h3>
                    <p className="text-muted-foreground">
                      We work directly with trusted suppliers who honor the plants,
                      supporting sustainable cultivation and fair trade practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Element - Organic Shape */}
          <div className="relative">
            <div className="relative">
              {/* Main organic container with logo */}
              <div className="relative overflow-hidden flex items-center justify-center" style={{
              borderRadius: '60% 40% 70% 30% / 40% 60% 30% 70%',
              transform: 'rotate(-5deg)'
            }}>
                <img src={logoImage} alt="Fungai Art Logo" className="w-80 h-80 object-contain opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-br from-forest-deep/10 to-earth/20 mix-blend-overlay" />
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-8 -right-8">
                <div className="w-32 h-32 bg-gradient-golden rounded-full opacity-20 animate-glow-pulse blur-xl"></div>
              </div>
              <div className="absolute -bottom-12 -left-12">
                <div className="w-24 h-24 bg-gradient-mystical opacity-30 animate-float blur-lg" style={{
                borderRadius: '60% 40% 30% 70% / 70% 30% 60% 40%'
              }}></div>
              </div>
              
              {/* Organic droplets */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-primary-glow/40 animate-float" style={{
              borderRadius: '80% 20% 70% 30% / 60% 40% 60% 40%',
              animationDelay: '1s'
            }}></div>
              <div className="absolute bottom-8 left-8 w-6 h-6 bg-golden/50 animate-float" style={{
              borderRadius: '70% 30% 60% 40% / 50% 80% 20% 50%',
              animationDelay: '3s'
            }}></div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default FlowingAboutSection;
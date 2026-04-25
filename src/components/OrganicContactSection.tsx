import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MushroomWithEnvelope, MushroomWithRoots, MushroomWithHeart } from "@/components/ui/mushroom-icons";
import myceliumBackground from '@/assets/mycelium-background.jpg';
const OrganicContactSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Welcome to our community!",
      description: "You'll receive wisdom about botanical allies and plant medicines.",
    });

    setEmail("");
    setIsSubmitting(false);
  };
  return (
    <section className="relative py-24 px-6 bg-background overflow-hidden">
      {/* Mycelium Background Image */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage: `url(${myceliumBackground})`,
            filter: 'sepia(10%) hue-rotate(20deg) saturate(110%) brightness(0.9)'
          }}
        />
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/50 to-background/70" />
      </div>

      {/* Organic Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-mystical opacity-5 blur-3xl animate-float" style={{
          borderRadius: '60% 40% 70% 30% / 40% 60% 30% 70%',
          animationDuration: '20s'
        }}></div>
        <div className="absolute bottom-32 right-16 w-48 h-48 bg-gradient-golden opacity-5 blur-2xl animate-float" style={{
          borderRadius: '30% 70% 40% 60% / 70% 30% 60% 40%',
          animationDelay: '10s',
          animationDuration: '25s'
        }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-playfair text-4xl md:text-5xl font-semibold text-foreground mb-6">
            Connect with Our
            <span className="text-mystical italic block">Community</span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Questions about our botanicals? Want to join our circle? 
            Or follow our journey with plant medicines? Choose your path to connection.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* WhatsApp/Message - Organic Shape */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-golden opacity-10 blur-xl group-hover:opacity-20 transition-all duration-500" style={{
              borderRadius: '40% 60% 70% 30% / 30% 70% 60% 40%'
            }}></div>
            
            <div className="relative p-8 text-center hover:shadow-mystical transition-all duration-300 border border-primary/20 backdrop-blur-sm bg-card/30" style={{
              borderRadius: '70% 30% 50% 50% / 40% 60% 80% 20%'
            }}>
              <div className="w-16 h-16 bg-gradient-golden mx-auto flex items-center justify-center mb-6 animate-float" style={{
                borderRadius: '50% 80% 30% 70% / 70% 30% 60% 40%',
                animationDelay: '1s'
              }}>
                <MushroomWithEnvelope className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-inter font-semibold text-xl text-foreground mb-3">Message Us</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Quick consultations and dosage guidance
              </p>
              <Button 
                variant="outline" 
                className="w-full border-golden/50 text-golden hover:bg-golden/10 bg-transparent backdrop-blur-sm"
                style={{ borderRadius: '25px' }}
                asChild
              >
                <a href="https://wa.me/4917616212061" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Newsletter - Organic Shape */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-mystical opacity-10 blur-xl group-hover:opacity-20 transition-all duration-500" style={{
              borderRadius: '60% 40% 30% 70% / 50% 50% 80% 20%'
            }}></div>
            
            <div className="relative p-8 text-center hover:shadow-mystical transition-all duration-300 border border-primary/20 backdrop-blur-sm bg-card/30" style={{
              borderRadius: '40% 60% 80% 20% / 70% 30% 50% 50%'
            }}>
              <div className="w-16 h-16 bg-gradient-mystical mx-auto flex items-center justify-center mb-6 animate-float" style={{
                borderRadius: '80% 20% 60% 40% / 40% 60% 70% 30%',
                animationDelay: '1.5s'
              }}>
                <MushroomWithRoots className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-inter font-semibold text-xl text-foreground mb-3">Join Our Newsletter</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                First to know about new botanicals & wisdom
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-background/50 border-mystical/30 focus:border-mystical text-foreground placeholder:text-muted-foreground backdrop-blur-sm text-sm"
                  style={{ borderRadius: '20px' }}
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-gradient-mystical hover:shadow-glow transition-all duration-500 font-inter font-medium text-sm border-0"
                  style={{ borderRadius: '20px' }}
                >
                  {isSubmitting ? "Joining..." : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>

          {/* Instagram - Organic Shape */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-forest opacity-10 blur-xl group-hover:opacity-20 transition-all duration-500" style={{
              borderRadius: '30% 70% 60% 40% / 80% 20% 70% 30%'
            }}></div>
            
            <div className="relative p-8 text-center hover:shadow-mystical transition-all duration-300 border border-primary/20 backdrop-blur-sm bg-card/30" style={{
              borderRadius: '80% 20% 40% 60% / 50% 50% 70% 30%'
            }}>
              <div className="w-16 h-16 bg-gradient-forest mx-auto flex items-center justify-center mb-6 animate-float" style={{
                borderRadius: '70% 30% 80% 20% / 60% 40% 30% 70%',
                animationDelay: '2s'
              }}>
                <MushroomWithHeart className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-inter font-semibold text-xl text-foreground mb-3">Instagram</h3>
              <p className="text-muted-foreground mb-4 text-sm">
                Plant education and product showcases
              </p>
              <Button 
                variant="outline" 
                className="w-full border-primary/50 text-primary hover:bg-primary/10 bg-transparent backdrop-blur-sm"
                style={{ borderRadius: '25px' }}
                asChild
              >
                <a href="https://www.instagram.com/fungai.art/" target="_blank" rel="noopener noreferrer">
                  @fungai.art
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrganicContactSection;
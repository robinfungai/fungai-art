import logoImage from "@/assets/fungai-art-logo.png";
import heroImage from "@/assets/hero-fungi.jpg";
import VisionSection from "@/components/VisionSection";
import FlowingAboutSection from "@/components/FlowingAboutSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import SacredOfferingsSection from "@/components/SacredOfferingsSection";
import OrganicContactSection from "@/components/OrganicContactSection";
import Navigation from "@/components/Navigation";

const NAV_CARDS = [
  {
    label: "Mixology Lab",
    description: "Build custom herbal formulas, explore synergies and extraction methods",
    href: "/mixology",
    symbol: "⚗",
  },
  {
    label: "Herbal Engine",
    description: "AI-powered personalised elixir recommendations",
    href: "/herbal-engine-2/index.html",
    symbol: "🌿",
  },
  {
    label: "Community",
    description: "Connect with the Fungai Art community and collective wisdom",
    href: "/community",
    symbol: "✦",
  },
  {
    label: "Shop",
    description: "Premium tinctures, mushrooms, botanicals and sacred compounds",
    href: "/products",
    symbol: "◈",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      {/* ── Hero + 4-card portal ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Fungai Art"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/90" />
        </div>

        {/* Floating spores */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-golden/30 rounded-full animate-float"
              style={{
                left: `${10 + i * 11}%`,
                top: `${15 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-20 flex flex-col items-center text-center px-6 pt-24 pb-12 w-full max-w-4xl mx-auto">
          <img
            src={logoImage}
            alt="Fungai Art"
            className="w-32 h-32 object-contain mb-6"
            style={{ filter: "drop-shadow(0 0 28px rgba(212,175,55,0.4))" }}
          />

          <h1 className="font-dream-avenue text-6xl md:text-8xl mb-4 tracking-widest bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
            fungai art
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-lg mb-12 leading-relaxed">
            Ancient plant wisdom · modern craftsmanship · botanical intelligence
          </p>

          {/* 4 nav cards */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-3xl">
            {NAV_CARDS.map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="group block rounded-2xl p-5 text-left transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(212,175,55,0.2)",
                  backdropFilter: "blur(12px)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.45)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.2)";
                }}
              >
                <div className="text-xl mb-2">{card.symbol}</div>
                <h2 className="text-foreground font-semibold text-base mb-1 group-hover:text-golden transition-colors">
                  {card.label}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {card.description}
                </p>
              </a>
            ))}
          </div>

          {/* Scroll hint */}
          <button
            className="mt-10 flex flex-col items-center gap-1 text-muted-foreground/50 hover:text-golden/60 transition-colors text-xs"
            onClick={() => document.getElementById("landing")?.scrollIntoView({ behavior: "smooth" })}
          >
            <span>discover more</span>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M1 1l7 7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </section>

      {/* ── Full landing page content ── */}
      <div id="landing">
        <VisionSection />
        <div id="about">
          <FlowingAboutSection />
        </div>
        <FeaturedProducts />
        <SacredOfferingsSection />
        <div id="contact">
          <OrganicContactSection />
        </div>
      </div>
    </div>
  );
};

export default Home;

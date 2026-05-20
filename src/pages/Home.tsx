import logoImage from "@/assets/fungai-art-logo.png";
import heroImage from "@/assets/hero-fungi.jpg";

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
      {/* Hero */}
      <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Fungai Art"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background/95" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-16 pb-8">
          <img
            src={logoImage}
            alt="Fungai Art"
            className="w-24 h-24 rounded-full mb-6 border border-golden/30"
            style={{ filter: "drop-shadow(0 0 24px rgba(212,175,55,0.25))" }}
          />

          <h1
            className="font-dream-avenue text-5xl md:text-7xl mb-4 tracking-widest"
            style={{
              background: "linear-gradient(135deg, #d4af37, #f0d060, #c8961a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            fungai art
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-md mb-12 leading-relaxed">
            Ancient plant wisdom · modern craftsmanship · botanical intelligence
          </p>

          {/* Nav Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
            {NAV_CARDS.map((card) => (
              <a
                key={card.href}
                href={card.href}
                className="group block rounded-2xl p-6 text-left transition-all duration-300"
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
                <div className="text-2xl mb-3">{card.symbol}</div>
                <h2 className="text-foreground font-semibold text-lg mb-1 group-hover:text-golden transition-colors">
                  {card.label}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {card.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import VisionSection from "@/components/VisionSection";
import FlowingAboutSection from "@/components/FlowingAboutSection";
import FeaturedProducts from "@/components/FeaturedProducts";
import SacredOfferingsSection from "@/components/SacredOfferingsSection";
import OrganicContactSection from "@/components/OrganicContactSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
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
  );
};

export default Index;
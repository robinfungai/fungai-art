import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "@/components/CartDrawer";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== "/") {
      window.location.href = `/#${sectionId}`;
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { label: "Home", path: "/", type: "link" },
    { label: "Products", path: "/products", type: "link" },
    { label: "Offerings", path: "/offerings", type: "link" },
    { label: "About", id: "about", type: "scroll" },
    { label: "Contact", id: "contact", type: "scroll" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <Leaf className="w-6 h-6 text-golden group-hover:rotate-12 transition-transform" />
            <span className="font-dream-avenue text-2xl bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
              fungai art
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.type === "link" ? (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`text-sm font-medium transition-colors hover:text-golden ${
                    isActive(link.path) ? "text-golden" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.id!)}
                  className="text-sm font-medium text-muted-foreground hover:text-golden transition-colors"
                >
                  {link.label}
                </button>
              )
            ))}
            
            <CartDrawer />
          </div>

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background/98 backdrop-blur-lg">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  link.type === "link" ? (
                    <Link
                      key={link.label}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-golden ${
                        isActive(link.path) ? "text-golden" : "text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      key={link.label}
                      onClick={() => scrollToSection(link.id!)}
                      className="text-lg font-medium text-foreground hover:text-golden transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  )
                ))}
                
                <div className="mt-4">
                  <CartDrawer />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

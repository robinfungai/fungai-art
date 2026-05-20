import { useState } from "react";
import { Menu, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CartDrawer } from "@/components/CartDrawer";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const currentPath = window.location.pathname;

  const scrollToSection = (sectionId: string) => {
    if (currentPath !== "/home" && currentPath !== "/") {
      window.location.href = `/home#${sectionId}`;
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  const isActive = (path: string) => currentPath === path;

  const navLinks = [
    { label: "Home",      path: "/home",     type: "link" },
    { label: "Mixology",  path: "/mixology", type: "link" },
    { label: "Products",  path: "/products", type: "link" },
    { label: "About",     id: "about",       type: "scroll" },
    { label: "Contact",   id: "contact",     type: "scroll" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/home" className="flex items-center gap-2 group">
            <Leaf className="w-6 h-6 text-golden group-hover:rotate-12 transition-transform" />
            <span className="font-dream-avenue text-2xl bg-gradient-to-r from-golden via-primary-glow to-golden bg-clip-text text-transparent">
              fungai art
            </span>
          </a>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              link.type === "link" ? (
                <a
                  key={link.label}
                  href={link.path}
                  className={`text-sm font-medium transition-colors hover:text-golden ${
                    isActive(link.path!) ? "text-golden" : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </a>
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
                    <a
                      key={link.label}
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`text-lg font-medium transition-colors hover:text-golden ${
                        isActive(link.path!) ? "text-golden" : "text-foreground"
                      }`}
                    >
                      {link.label}
                    </a>
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

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Funktionen", href: "#features" },
  { label: "Preise", href: "#pricing" },
  { label: "Vorteile", href: "#stats" },
  { label: "Kunden", href: "#testimonials" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className={`mx-4 transition-all duration-500 ${scrolled ? "mt-2" : "mt-4"}`}>
        <div className={`rounded-2xl border transition-all duration-500 ${
          scrolled
            ? "bg-background/90 backdrop-blur-2xl border-border/50 shadow-lg"
            : "bg-transparent border-transparent"
        }`}>
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/12 transition-colors duration-300">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display font-bold text-base tracking-tight">DecisionOS</span>
              </Link>

              <div className="hidden md:flex items-center gap-0.5">
                {navItems.map(item => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-foreground px-3.5 py-1.5 rounded-lg transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground">
                    Anmelden
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="sm" className="rounded-lg">
                    Kostenlos testen
                  </Button>
                </Link>
              </div>

              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="md:hidden mx-4 mt-2"
          >
            <div className="rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/50 p-5 shadow-elevated space-y-1">
              {navItems.map(item => (
                <a key={item.label} href={item.href} className="block text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  {item.label}
                </a>
              ))}
              <div className="pt-4 mt-3 border-t border-border/40 space-y-2">
                <Link to="/login">
                  <Button variant="ghost" className="w-full rounded-lg">Anmelden</Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="w-full rounded-lg">Kostenlos testen</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

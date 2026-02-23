import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const navItems = [
  { label: "Vorteile", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Kunden", href: "#testimonials" },
  { label: "Preise", href: "#pricing" },
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
      <div className={`mx-auto max-w-5xl px-4 transition-all duration-500 ${scrolled ? "mt-3" : "mt-5"}`}>
        <div className={`rounded-2xl transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl border border-border/40 shadow-lg shadow-foreground/[0.02]"
            : "bg-transparent border border-transparent"
        }`}>
          <div className="px-5">
            <div className="flex items-center justify-between h-14">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img src={decivioLogo} alt="Decivio" className="w-7 h-7 rounded-md" />
                <span className="font-semibold text-[15px] tracking-tight">Decivio</span>
              </Link>

              <div className="hidden md:flex items-center gap-0.5">
                {navItems.map(item => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-[13px] text-muted-foreground/70 hover:text-foreground px-3.5 py-1.5 rounded-lg transition-colors duration-200"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-lg text-muted-foreground/70 hover:text-foreground text-[13px]">
                    Anmelden
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="sm" className="rounded-full text-[13px] px-5">
                    Kostenlos testen
                  </Button>
                </Link>
              </div>

              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted/30 transition-colors"
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
            <div className="rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/40 p-5 space-y-1 shadow-xl">
              {navItems.map(item => (
                <a key={item.label} href={item.href} className="block text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  {item.label}
                </a>
              ))}
              <div className="pt-4 mt-3 border-t border-border/30 space-y-2">
                <Link to="/login">
                  <Button variant="ghost" className="w-full rounded-lg">Anmelden</Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="w-full rounded-full">Kostenlos testen</Button>
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

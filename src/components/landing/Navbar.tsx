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
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className={`transition-all duration-300 border-b ${scrolled ? "bg-background/80 backdrop-blur-xl border-border" : "bg-transparent border-transparent"}`}>
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded" />
              <span className="font-semibold text-sm tracking-tight">Decivio</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-[13px] text-muted-foreground hover:text-foreground">
                  Anmelden
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="sm" className="rounded-full text-[13px] px-5">
                  Kostenlos testen
                </Button>
              </Link>
            </div>

            <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="md:hidden border-b border-border bg-background"
          >
            <div className="container mx-auto px-4 py-4 space-y-1">
              {navItems.map(item => (
                <a key={item.label} href={item.href} className="block text-sm text-muted-foreground hover:text-foreground py-2 transition-colors">
                  {item.label}
                </a>
              ))}
              <div className="pt-4 mt-2 border-t border-border space-y-2">
                <Link to="/login"><Button variant="ghost" className="w-full">Anmelden</Button></Link>
                <Link to="/dashboard"><Button className="w-full rounded-full">Kostenlos testen</Button></Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

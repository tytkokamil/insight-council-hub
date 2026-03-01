import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { label: "Das Problem", href: "#problem" },
    { label: "Lösung", href: "#solution" },
    { label: "Branchen", href: "#industries" },
    { label: "Compliance", href: "#compliance" },
    { label: "Preise", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

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
      <div className={`transition-all duration-500 border-b ${
        scrolled
          ? "bg-background/80 backdrop-blur-2xl border-border shadow-sm"
          : "bg-transparent border-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={decivioLogo} alt="Decivio" className="w-7 h-7 rounded-md" />
              <span className="font-semibold text-[15px] tracking-tight text-foreground">Decivio</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] text-muted-foreground hover:text-foreground px-3.5 py-1.5 rounded-lg transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth" className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors">
                Einloggen
              </Link>
              <Link to="/auth" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-5 py-2 rounded-lg shadow-md transition-all">
                Kostenlos starten <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="md:hidden mx-4 mt-2"
          >
            <div className="rounded-2xl bg-card/95 backdrop-blur-2xl border border-border p-5 space-y-1 shadow-lg">
              {navItems.map(item => (
                <a key={item.label} href={item.href} onClick={() => setIsOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-lg transition-colors">
                  {item.label}
                </a>
              ))}
              <div className="pt-4 mt-3 border-t border-border space-y-2">
                <Link to="/auth" className="block text-center text-sm text-foreground py-2">Einloggen</Link>
                <Link to="/auth" className="block text-center text-sm font-medium text-primary-foreground bg-primary py-2.5 rounded-lg">Kostenlos starten</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

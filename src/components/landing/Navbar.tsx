import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Problem", href: "#problem" },
  { label: "Lösung", href: "#solution" },
  { label: "Preise", href: "#preise" },
  { label: "Rollen", href: "#rollen" },
  { label: "Branchen", href: "#branchen" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionEls = navItems
      .map(item => document.querySelector(item.href))
      .filter(Boolean) as HTMLElement[];

    sectionEls.forEach((section) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(`#${section.id}`);
        },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach(o => o.disconnect());
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 80);
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsOpen(false);
  };

  return (
    <nav
      className={`sticky z-50 transition-all duration-500 dark ${scrolled ? "glass-ultra" : ""}`}
      style={{ top: "44px" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[22px] font-bold text-foreground" style={{ fontFamily: "'Syne', sans-serif" }}>
              Decivio
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = activeSection === item.href;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className={`text-sm px-3.5 py-1.5 rounded-lg transition-colors duration-200 ${isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm px-4 py-2 rounded-lg transition-all duration-200 text-foreground border border-border hover:border-destructive/40"
            >
              Einloggen
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive-foreground px-5 py-2.5 rounded-lg transition-all duration-200 bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20"
            >
              Kostenlos starten <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menü"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Scroll progress */}
      {scrolled && (
        <div
          className="h-[2px] origin-left transition-transform duration-150 bg-destructive"
          style={{ transform: `scaleX(${scrollProgress})` }}
        />
      )}

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "100vh" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden fixed inset-0 top-[108px] z-50 bg-background"
          >
            <div className="p-6 space-y-2">
              {navItems.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className="block text-lg py-3 border-b border-border text-foreground"
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-6 space-y-3">
                <Link to="/login" className="block text-center py-3 rounded-lg text-foreground border border-border">Einloggen</Link>
                <Link to="/auth" className="block text-center py-3 rounded-lg font-semibold text-destructive-foreground bg-destructive">Kostenlos starten →</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

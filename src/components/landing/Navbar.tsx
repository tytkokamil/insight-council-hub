import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

const navItems = [
  { label: "Problem", href: "#problem" },
  { label: "Lösung", href: "#solution" },
  { label: "Branchen", href: "#industries" },
  { label: "Compliance", href: "#compliance" },
  { label: "Preise", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateActive = useCallback(() => {
    const sections = navItems
      .map(item => document.querySelector(item.href))
      .filter(Boolean) as HTMLElement[];

    let current = "";
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 120) current = `#${section.id}`;
    }
    setActiveSection(current);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      updateActive();
      // Calculate scroll progress
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [updateActive]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className={`transition-all duration-500 border-b ${
        scrolled
          ? "bg-white/80 backdrop-blur-2xl border-border/40 shadow-[0_1px_8px_-3px_hsl(220,20%,50%,0.08)]"
          : "bg-transparent border-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.img
                src={decivioLogo}
                alt="Decivio"
                className="w-7 h-7 rounded-md"
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              />
              <span className="font-semibold text-[15px] tracking-tight text-foreground">Decivio</span>
            </Link>

            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map(item => {
                const isActive = activeSection === item.href;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className={`relative text-[13px] px-3.5 py-1.5 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? "text-foreground font-medium"
                        : "text-muted-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </a>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link to="/auth" className="text-[13px] text-muted-foreground/70 hover:text-foreground px-3 py-1.5 transition-colors">
                Einloggen
              </Link>
              <Link
                to="/auth"
                className="group/cta relative inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-foreground px-5 py-2.5 rounded-lg bg-primary transition-all duration-300 hover:shadow-[0_4px_16px_-4px_hsl(var(--primary)/0.4)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Kostenlos starten
                  <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform duration-200" />
                </span>
              </Link>
            </div>

            <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Scroll progress bar */}
        {scrolled && (
          <motion.div
            className="h-[2px] bg-primary/30 origin-left"
            style={{ scaleX: scrollProgress }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="md:hidden mx-4 mt-2"
          >
            <div className="rounded-2xl bg-white/95 backdrop-blur-2xl border border-border/40 p-5 space-y-1 shadow-lg">
              {navItems.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className={`block text-sm px-4 py-2.5 rounded-lg transition-colors ${
                    activeSection === item.href
                      ? "text-foreground font-medium bg-primary/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 mt-3 border-t border-border/30 space-y-2">
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

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import decivioLogo from "@/assets/decivio-logo.png";

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
  const [inDarkHero, setInDarkHero] = useState(true);
  const activeSectionRef = useRef("");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const sectionEls = navItems
      .map(item => document.querySelector(item.href))
      .filter(Boolean) as HTMLElement[];

    sectionEls.forEach((section) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            activeSectionRef.current = `#${section.id}`;
            setActiveSection(`#${section.id}`);
          }
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
        const sy = window.scrollY;
        setScrolled(sy > 20);
        setInDarkHero(sy < window.innerHeight * 0.85);
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(docHeight > 0 ? Math.min(sy / docHeight, 1) : 0);
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

  const isDark = inDarkHero;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 will-change-transform"
    >
      <div
        className="transition-all duration-500"
        style={{
          background: scrolled ? "hsl(var(--background) / 0.7)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.8)" : "none",
          borderBottom: scrolled ? "1px solid hsl(var(--border) / 0.08)" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <motion.img
                src={decivioLogo}
                alt="Decivio"
                className="w-7 h-7 rounded-md"
                whileHover={{ rotate: -8, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                loading="eager"
                width={28}
                height={28}
                style={isDark ? { filter: "brightness(10)" } : {}}
              />
              <span
                className="font-semibold text-[15px] tracking-tight"
                style={{ color: isDark ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}
              >
                Decivio
              </span>
            </Link>

            {/* Desktop nav — pill-style with background indicator */}
            <div className="hidden md:flex items-center gap-0.5 relative rounded-full px-1 py-1"
              style={{
                background: scrolled ? "hsl(var(--muted) / 0.3)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${scrolled ? "hsl(var(--border) / 0.15)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {navItems.map(item => {
                const isActive = activeSection === item.href;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className="relative text-[13px] px-3.5 py-1.5 rounded-full transition-colors duration-200 z-10"
                    style={{
                      color: isDark
                        ? isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--primary-foreground) / 0.5)"
                        : isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.7)",
                      fontWeight: isActive ? 500 : 400,
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.08)" : "hsl(var(--background))",
                          boxShadow: isDark ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </a>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="text-[13px] px-3 py-1.5 transition-colors"
                style={{
                  color: isDark ? "hsl(var(--primary-foreground) / 0.6)" : "hsl(var(--muted-foreground) / 0.7)",
                }}
              >
                Einloggen
              </Link>
              <Link
                to="/auth"
                className="group/cta relative inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-5 py-2.5 rounded-full transition-all duration-300 overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-blue)))",
                  boxShadow: "0 0 20px -4px hsl(var(--primary) / 0.3)",
                }}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  Kostenlos starten
                  <ArrowRight className="w-3.5 h-3.5 group-hover/cta:translate-x-0.5 transition-transform duration-200" />
                </span>
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              style={{ color: isDark ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menü öffnen"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {scrolled && (
          <div className="h-[1px] origin-left will-change-transform">
            <div
              className="h-full transition-transform duration-150"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary) / 0.5), hsl(var(--accent-violet) / 0.3))",
                transform: `scaleX(${scrollProgress})`,
                transformOrigin: "left",
              }}
            />
          </div>
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
            <div
              className="rounded-2xl p-5 space-y-1 shadow-lg"
              style={{
                background: "hsl(var(--background) / 0.95)",
                backdropFilter: "blur(20px) saturate(1.8)",
                border: `1px solid ${isDark ? "hsl(var(--border) / 0.1)" : "hsl(var(--border) / 0.3)"}`,
              }}
            >
              {navItems.map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className="block text-sm px-4 py-2.5 rounded-lg transition-colors"
                  style={{
                    color: isDark
                      ? activeSection === item.href ? "hsl(var(--primary-foreground))" : "hsl(var(--primary-foreground) / 0.6)"
                      : activeSection === item.href ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-4 mt-3 space-y-2" style={{ borderTop: `1px solid ${isDark ? "hsl(var(--border) / 0.1)" : "hsl(var(--border) / 0.3)"}` }}>
                <Link to="/login" className="block text-center text-sm py-2" style={{ color: isDark ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))" }}>Einloggen</Link>
                <Link to="/auth" className="block text-center text-sm font-medium text-primary-foreground py-2.5 rounded-full" style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent-blue)))" }}>Kostenlos starten</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

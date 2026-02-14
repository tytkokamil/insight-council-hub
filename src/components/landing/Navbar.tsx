import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, X, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className={`mx-4 mt-4 transition-all duration-500 ${scrolled ? "mt-2" : ""}`}>
        <div className={`rounded-2xl border transition-all duration-500 ${
          scrolled
            ? "bg-background/80 backdrop-blur-2xl border-border/60 shadow-lg"
            : "bg-background/40 backdrop-blur-xl border-border/30"
        }`}>
          <div className="container mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <Sparkles className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="font-display font-bold text-lg tracking-tight">DecisionOS</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {["Features", "Pricing", "Enterprise", "Docs"].map(item => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="text-sm text-muted-foreground hover:text-foreground px-4 py-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                  >
                    {item}
                  </a>
                ))}
              </div>

              {/* Desktop CTA */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    Sign In
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="sm" className="rounded-xl shadow-md shadow-primary/20">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-2"
          >
            <div className="rounded-2xl bg-card/95 backdrop-blur-2xl border border-border/60 p-5 shadow-elevated space-y-1">
              {["Features", "Pricing", "Enterprise", "Docs"].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="block text-sm text-muted-foreground hover:text-foreground px-4 py-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                  {item}
                </a>
              ))}
              <div className="pt-4 mt-3 border-t border-border/50 space-y-2">
                <Link to="/login">
                  <Button variant="ghost" className="w-full rounded-xl">Sign In</Button>
                </Link>
                <Link to="/dashboard">
                  <Button className="w-full rounded-xl">Get Started</Button>
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

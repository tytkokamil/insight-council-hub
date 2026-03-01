import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { BarChart3, Shield, Brain, ArrowRight } from "lucide-react";
import dashboardImg from "@/assets/product-dashboard-frame.jpg";
import analyticsImg from "@/assets/product-analytics-frame.jpg";
import graphImg from "@/assets/product-graph-frame.jpg";

const ease = [0.16, 1, 0.3, 1] as const;

const screens = [
  {
    id: "dashboard",
    icon: BarChart3,
    label: "Live Dashboard",
    title: "Alle Entscheidungen. Ein Blick.",
    description: "Echtzeit Cost-of-Delay, SLA-Status, Eskalationen und KI-Empfehlungen — alles auf einen Blick.",
    img: dashboardImg,
    accent: "bg-primary/10 text-primary",
    stats: [
      { label: "Offene Entscheidungen", value: "23" },
      { label: "Economic Exposure", value: "€48.200" },
      { label: "SLA-Einhaltung", value: "94%" },
    ],
  },
  {
    id: "analytics",
    icon: Brain,
    label: "KI Analytics",
    title: "9 Analytics-Module. Null Blindflug.",
    description: "Decision DNA, Health Heatmap, Friction Map, Bottleneck Intelligence — powered by KI.",
    img: analyticsImg,
    accent: "bg-accent-violet/10 text-accent-violet",
    stats: [
      { label: "Cycle Time Ø", value: "4,2 Tage" },
      { label: "Bottleneck", value: "Review-Phase" },
      { label: "Trend", value: "−23%" },
    ],
  },
  {
    id: "compliance",
    icon: Shield,
    label: "Audit Trail",
    title: "Kryptographisch. Unveränderbar.",
    description: "SHA-256 Hash-Kette, digitale Signaturen und versionierter Audit Trail — bereit für jeden Auditor.",
    img: graphImg,
    accent: "bg-accent-teal/10 text-accent-teal",
    stats: [
      { label: "Hash-Kette", value: "SHA-256" },
      { label: "Frameworks", value: "9 aktiv" },
      { label: "Audit Score", value: "100%" },
    ],
  },
];

const ProductShowcase = () => {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const current = screens[active];

  return (
    <section ref={sectionRef} id="product" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Das Produkt</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Sehen Sie Decivio in Aktion.
          </h2>
        </motion.div>

        {/* Tab selector */}
        <div className="flex justify-center gap-2 mb-10">
          {screens.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                i === active
                  ? "bg-white shadow-[var(--shadow-card)] text-foreground border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Text side */}
              <div className="order-2 lg:order-1">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold mb-5 ${current.accent}`}>
                  <current.icon className="w-3.5 h-3.5" />
                  {current.label}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-4">
                  {current.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {current.description}
                </p>

                {/* Live stats */}
                <div className="grid grid-cols-3 gap-3">
                  {current.stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="p-3 rounded-xl border border-border/50 bg-white/60"
                    >
                      <div className="text-lg font-bold tabular-nums font-mono text-foreground">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Image side */}
              <motion.div
                style={{ y: imgY }}
                className="order-1 lg:order-2"
              >
                <div className="relative rounded-2xl overflow-hidden border border-border/60 bg-white shadow-[var(--shadow-xl)] group">
                  {/* Browser chrome */}
                  <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2 bg-muted/30">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-warning/30" />
                      <div className="w-2.5 h-2.5 rounded-full bg-success/30" />
                    </div>
                    <div className="flex-1 mx-3 h-6 rounded-md bg-muted/50 flex items-center px-3">
                      <span className="text-[10px] text-muted-foreground/50 font-mono">app.decivio.com</span>
                    </div>
                  </div>
                  <div className="relative overflow-hidden">
                    <img
                      src={current.img}
                      alt={current.label}
                      className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    {/* Subtle gradient overlay at bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/60 to-transparent" />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProductShowcase;

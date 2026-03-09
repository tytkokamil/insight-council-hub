import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { BarChart3, Shield, Brain } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const screens = [
  {
    id: "dashboard",
    icon: BarChart3,
    label: "Live Dashboard",
    title: "Alle Entscheidungen. Ein Blick.",
    description: "Echtzeit Cost-of-Delay, SLA-Status, Eskalationen und KI-Empfehlungen — alles auf einen Blick.",
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
    accent: "bg-accent-teal/10 text-accent-teal",
    stats: [
      { label: "Hash-Kette", value: "SHA-256" },
      { label: "Frameworks", value: "9 aktiv" },
      { label: "Audit Score", value: "100%" },
    ],
  },
];

const TiltCard = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 150, damping: 20 });
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), { stiffness: 150, damping: 20 });
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => { mouseX.set(0); mouseY.set(0); };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative">
        {children}
        <motion.div className="absolute inset-0 rounded-2xl pointer-events-none z-10" style={{ background: `radial-gradient(circle at ${glareX}% ${glareY}%, hsl(var(--primary) / 0.08), transparent 60%)` }} />
      </motion.div>
    </div>
  );
};

/* Realistic Dashboard Mockup */
const DashboardMockup = () => (
  <div className="p-4 space-y-3">
    {/* KPI row */}
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: "Approved", value: "12", color: "text-emerald-600" },
        { label: "In Review", value: "5", color: "text-amber-600" },
        { label: "Risk Score", value: "34%", color: "text-amber-600" },
      ].map((kpi) => (
        <div key={kpi.label} className="rounded-lg border border-border/40 bg-muted/20 p-2.5">
          <div className={`text-lg font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
        </div>
      ))}
    </div>

    {/* Decision Velocity Chart */}
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
      <div className="text-[11px] font-semibold text-foreground/70 mb-2">Decision Velocity</div>
      <div className="flex items-end gap-1 h-16 relative">
        {[35, 42, 38, 55, 62, 68, 72, 78, 85].map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-t relative"
            style={{ background: `linear-gradient(to top, hsl(var(--primary) / 0.6), hsl(var(--primary) / 0.25))` }}
            initial={{ height: 0 }}
            whileInView={{ height: `${h}%` }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.04, duration: 0.5, ease }}
          >
            {i === 8 && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-primary bg-primary/10 px-1 rounded whitespace-nowrap">+23%</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>

    {/* Decisions list with real text */}
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-1.5">
      <div className="text-[11px] font-semibold text-foreground/70 mb-1">Decisions</div>
      {[
        { title: "Zulieferer-Wechsel Hydraulik", status: "Approved", statusClass: "bg-emerald-500/10 text-emerald-600" },
        { title: "ERP Update Genehmigung", status: "Review", statusClass: "bg-amber-500/10 text-amber-600" },
        { title: "IATF Re-Zertifizierung 2024", status: "Draft", statusClass: "bg-muted text-muted-foreground" },
      ].map((d, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
          <span className="flex-1 text-[11px] text-foreground/70 truncate">{d.title}</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${d.statusClass}`}>{d.status}</span>
        </div>
      ))}
    </div>

    {/* Alert bar */}
    <div className="rounded-lg border border-destructive/20 bg-destructive/[0.04] px-3 py-2 flex items-center gap-2">
      <span className="text-[10px]">🔴</span>
      <span className="text-[10px] text-destructive font-medium">€28.500 Economic Exposure — 2 SLA-Warnungen</span>
    </div>
  </div>
);

const AnalyticsMockup = () => (
  <div className="p-5 space-y-4">
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Decision DNA", value: "Pattern erkannt" },
        { label: "Health Score", value: "87%" },
      ].map((item) => (
        <div key={item.label} className="rounded-xl border border-border/40 bg-muted/20 p-3">
          <div className="text-[10px] text-muted-foreground mb-1">{item.label}</div>
          <div className="text-sm font-semibold text-foreground/80">{item.value}</div>
        </div>
      ))}
    </div>
    <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
      <div className="text-[11px] font-semibold text-foreground/70 mb-3">Friction Map</div>
      <div className="space-y-2">
        {[
          { label: "Review Phase", w: 85 },
          { label: "Approval", w: 45 },
          { label: "Implementation", w: 30 },
        ].map((bar, i) => (
          <div key={bar.label} className="space-y-1">
            <div className="text-[10px] text-muted-foreground">{bar.label}</div>
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-accent-violet/30"
                initial={{ width: 0 }}
                whileInView={{ width: `${bar.w}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
      <div className="text-[11px] font-semibold text-foreground/70 mb-3">Bottleneck Intelligence</div>
      <div className="flex gap-2">
        {[60, 35, 80, 45, 70].map((v, i) => (
          <motion.div
            key={i}
            className="flex-1 text-center"
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 300, damping: 15 }}
          >
            <div className="mx-auto w-8 h-8 rounded-full border-2 border-accent-violet/20 flex items-center justify-center text-[10px] font-mono text-foreground/60">{v}</div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

const AuditMockup = () => (
  <div className="p-5 space-y-4">
    <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
      <div className="text-[11px] font-semibold text-foreground/70 mb-3">Audit Trail</div>
      <div className="space-y-3">
        {[
          { action: "Decision approved", hash: "a3f8…c2d1", time: "vor 2h" },
          { action: "Review submitted", hash: "7b2e…9f4a", time: "vor 5h" },
          { action: "Status changed", hash: "d1c4…3e7b", time: "vor 1d" },
        ].map((entry, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-accent-teal/50" />
            <div className="flex-1">
              <div className="text-[11px] text-foreground/70">{entry.action}</div>
              <div className="text-[9px] font-mono text-muted-foreground">{entry.hash}</div>
            </div>
            <span className="text-[10px] text-muted-foreground">{entry.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="text-[10px] text-muted-foreground mb-1">Hash-Algorithmus</div>
        <div className="text-sm font-semibold font-mono text-foreground/80">SHA-256</div>
      </div>
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="text-[10px] text-muted-foreground mb-1">Integrität</div>
        <div className="text-sm font-semibold text-accent-teal">Verifiziert ✓</div>
      </div>
    </div>
  </div>
);

const mockups = [DashboardMockup, AnalyticsMockup, AuditMockup];

const ProductShowcase = () => {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const perspective = useTransform(scrollYProgress, [0, 0.3, 0.5], [15, 5, 0]);
  const current = screens[active];
  const MockupComponent = mockups[active];

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

        <div className="flex justify-center gap-2 mb-10">
          {screens.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                i === active
                  ? "bg-card shadow-[var(--shadow-card)] text-foreground border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <s.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease }}
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
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
                <div className="grid grid-cols-3 gap-3">
                  {current.stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="p-3 rounded-xl border border-border/50 bg-card/60"
                    >
                      <div className="text-lg font-bold tabular-nums font-mono text-foreground">{stat.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <motion.div style={{ y: imgY }} className="order-1 lg:order-2">
                <TiltCard>
                  <motion.div
                    style={{ rotateX: perspective }}
                    className="relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-elevated"
                  >
                    <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none z-10" />
                    <div className="px-4 py-2.5 border-b border-border/40 flex items-center gap-2 bg-muted/30 relative z-20">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-destructive/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-warning/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-success/30" />
                      </div>
                      <div className="flex-1 mx-3 h-6 rounded-md bg-muted/50 flex items-center px-3">
                        <span className="text-[10px] text-muted-foreground font-mono">app.decivio.com</span>
                      </div>
                    </div>
                    <div className="relative z-20">
                      <MockupComponent />
                    </div>
                  </motion.div>
                </TiltCard>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProductShowcase;

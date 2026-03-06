import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Factory, Pill, Car, Landmark, Monitor, HardHat, Zap, HeartPulse, ArrowRight, CheckCircle2 } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const industries = [
  {
    icon: Factory, name: "Maschinenbau", color: "hsl(220 45% 50%)",
    desc: "ECOs, Projektfreigaben, Maschinenabnahmen",
    useCases: ["Engineering Change Orders", "Projektmeilenstein-Freigaben", "Maschinenabnahme-Protokolle"],
    compliance: ["ISO 9001", "VDI 2221"],
  },
  {
    icon: Pill, name: "Pharma", color: "hsl(280 40% 55%)",
    desc: "Change Control, CAPA, Batch-Freigaben",
    useCases: ["Change-Control-Prozesse", "CAPA-Management", "Batch-Record-Freigaben"],
    compliance: ["GMP", "FDA 21 CFR Part 11"],
  },
  {
    icon: Car, name: "Automotive", color: "hsl(200 45% 50%)",
    desc: "PPAP, 8D-Reports, Änderungsmanagement",
    useCases: ["PPAP-Dokumentation", "8D-Problemlösung", "Produktänderungen"],
    compliance: ["IATF 16949", "VDA 6.3"],
  },
  {
    icon: Landmark, name: "Finanzdienstleister", color: "hsl(160 35% 45%)",
    desc: "Kreditentscheidungen, Compliance",
    useCases: ["Kreditvergabe-Prozesse", "Risikobewertungen", "Regulatorische Meldungen"],
    compliance: ["MaRisk", "Solvency II"],
  },
  {
    icon: Monitor, name: "IT & Software", color: "hsl(250 40% 55%)",
    desc: "ADRs, Release-Freigaben, Security",
    useCases: ["Architecture Decision Records", "Release-Management", "Security-Reviews"],
    compliance: ["ISO 27001", "SOC 2"],
  },
  {
    icon: HardHat, name: "Bau & Infrastruktur", color: "hsl(30 50% 50%)",
    desc: "Nachträge, Subunternehmer, Abnahmen",
    useCases: ["Nachtragsmanagement", "Subunternehmer-Freigaben", "Bauabnahmen"],
    compliance: ["VOB/B", "VgV"],
  },
  {
    icon: Zap, name: "Energie", color: "hsl(45 60% 48%)",
    desc: "Netzinvestitionen, KRITIS, NIS2",
    useCases: ["Netzausbau-Entscheidungen", "KRITIS-Compliance", "Investitionsfreigaben"],
    compliance: ["NIS2", "EnWG"],
  },
  {
    icon: HeartPulse, name: "Healthcare", color: "hsl(350 45% 55%)",
    desc: "Geräteinvestitionen, Protokolländerungen",
    useCases: ["Medizinprodukt-Bewertungen", "Klinische Protokolländerungen", "Investitionsentscheidungen"],
    compliance: ["MDR", "ISO 13485"],
  },
];

const IndustriesSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? industries[activeIndex] : null;

  return (
    <section id="industries" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-primary">Branchen</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Für jede Branche die richtige Sprache.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Decivio passt sich Ihrer Branche an — Terminologie, Templates, Compliance-Anforderungen.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {industries.map((ind, i) => {
            const isActive = activeIndex === i;
            return (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5, ease }}
                whileHover={{ y: -3 }}
                onClick={() => setActiveIndex(isActive ? null : i)}
                className={`p-5 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? "border-primary/30 bg-primary/[0.03] shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.15)]"
                    : "border-border/30 bg-background/60 backdrop-blur-sm hover:border-border/50 hover:shadow-md"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors duration-300"
                  style={{ background: `${ind.color} / 0.08)`.replace(')', '') }}
                >
                  <ind.icon className="w-4.5 h-4.5" style={{ color: ind.color }} />
                </div>
                <h3 className="text-[13px] font-semibold mb-1">{ind.name}</h3>
                <p className="text-[12px] leading-relaxed text-muted-foreground">{ind.desc}</p>
                {isActive && (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    className="h-0.5 bg-primary/30 rounded-full mt-3"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Expanded detail panel */}
        <AnimatePresence mode="wait">
          {active && activeIndex !== null && (
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.4, ease }}
              className="overflow-hidden"
            >
              <div className="mt-6 p-6 rounded-2xl border border-primary/15 bg-background/80 backdrop-blur-sm">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <active.icon className="w-4 h-4 text-primary" />
                      Typische Use Cases
                    </h4>
                    <ul className="space-y-2">
                      {active.useCases.map((uc, j) => (
                        <motion.li
                          key={j}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: j * 0.08 }}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                          {uc}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Unterstützte Frameworks</h4>
                    <div className="flex flex-wrap gap-2">
                      {active.compliance.map((c, j) => (
                        <motion.span
                          key={j}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: j * 0.1 }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/15 bg-primary/[0.04] text-primary"
                        >
                          {c}
                        </motion.span>
                      ))}
                    </div>
                    <a
                      href="/auth"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-4 hover:gap-2.5 transition-all"
                    >
                      Template für {active.name} testen <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default IndustriesSection;

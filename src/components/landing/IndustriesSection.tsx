import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Factory, Pill, Car, Landmark, Monitor, HardHat, Zap, HeartPulse, ArrowRight, CheckCircle2, ShoppingCart, Shield, Truck, UtensilsCrossed, Heart, GraduationCap, Building2 } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type AccentKey = "blue" | "violet" | "teal" | "amber" | "rose" | "primary";

const accentStyles: Record<AccentKey, { iconBg: string; iconText: string }> = {
  blue: { iconBg: "bg-accent-blue/10", iconText: "text-accent-blue" },
  violet: { iconBg: "bg-accent-violet/10", iconText: "text-accent-violet" },
  teal: { iconBg: "bg-accent-teal/10", iconText: "text-accent-teal" },
  amber: { iconBg: "bg-accent-amber/10", iconText: "text-accent-amber" },
  rose: { iconBg: "bg-accent-rose/10", iconText: "text-accent-rose" },
  primary: { iconBg: "bg-primary/10", iconText: "text-primary" },
};

const industries = [
  {
    icon: Factory, name: "Maschinenbau", accent: "primary" as AccentKey, priority: "primary",
    desc: "ECOs, Investitionsfreigaben, Projektmittel",
    useCases: ["Engineering Change Orders", "Investitionsfreigabe CNC-Maschine", "Projektmeilenstein-Freigaben"],
    compliance: ["ISO 9001", "ISO 13849", "VDI 2221"],
  },
  {
    icon: Car, name: "Automotive", accent: "blue" as AccentKey, priority: "secondary",
    desc: "PPAP, 8D-Reports, Änderungsmanagement",
    useCases: ["PPAP-Dokumentation", "8D-Problemlösung", "APQP-Prozesse", "FMEA-Management"],
    compliance: ["IATF 16949", "VDA 6.3"],
  },
  {
    icon: Pill, name: "Pharma & Life Sciences", accent: "violet" as AccentKey, priority: "secondary",
    desc: "Change Control, Deviations, CAPA",
    useCases: ["Change-Control-Prozesse", "CAPA-Management", "Batch-Record-Freigaben", "Deviation-Handling"],
    compliance: ["GMP", "FDA 21 CFR Part 11", "EU-GMP"],
  },
  {
    icon: Landmark, name: "Finanzdienstleister", accent: "teal" as AccentKey, priority: "tertiary",
    desc: "Kreditentscheidungen, Risikoakzeptanz",
    useCases: ["Kreditvergabe-Prozesse", "Risikobewertungen", "Vier-Augen-Prinzip"],
    compliance: ["MaRisk", "BaFin", "DSGVO"],
  },
  {
    icon: Monitor, name: "IT & Software", accent: "violet" as AccentKey, priority: "tertiary",
    desc: "RFC, Security Review, Go/No-Go",
    useCases: ["Architecture Decision Records", "Release-Management", "Security-Reviews"],
    compliance: ["NIS2", "ISO 27001", "BSI IT-Grundschutz"],
  },
  {
    icon: HardHat, name: "Bau & Industrie", accent: "amber" as AccentKey, priority: "tertiary",
    desc: "Auftragsvergabe, Partnerwahl, Abnahmen",
    useCases: ["Nachtragsmanagement", "Subunternehmer-Freigaben", "Bauabnahmen"],
    compliance: ["VOB/B", "HOAI", "VgV"],
  },
  {
    icon: HeartPulse, name: "Healthcare", accent: "rose" as AccentKey, priority: "tertiary",
    desc: "Medizinprodukte, Behandlungsprotokolle",
    useCases: ["Medizinprodukt-Bewertungen", "Klinische Protokolländerungen", "Investitionsentscheidungen"],
    compliance: ["MDR", "ISO 13485"],
  },
  {
    icon: Zap, name: "Energie", accent: "amber" as AccentKey, priority: "tertiary",
    desc: "Netzinvestitionen, KRITIS, NIS2",
    useCases: ["Netzausbau-Entscheidungen", "KRITIS-Compliance", "Investitionsfreigaben"],
    compliance: ["NIS2", "EnWG"],
  },
  {
    icon: ShoppingCart, name: "Handel", accent: "teal" as AccentKey, priority: "tertiary",
    desc: "Lieferantenwahl, Sortiment, Compliance",
    useCases: ["Lieferantenauswahl", "Sortimentsentscheidungen", "Standortentscheidungen"],
    compliance: ["DSGVO", "Lieferkettensorgfalt"],
  },
  {
    icon: Shield, name: "Versicherung", accent: "blue" as AccentKey, priority: "tertiary",
    desc: "Policenfreigabe, Schadenregulierung",
    useCases: ["Policenfreigabe-Prozesse", "Schadenregulierung", "Risikoakzeptanz"],
    compliance: ["VAG", "Solvency II"],
  },
  {
    icon: Truck, name: "Logistik", accent: "blue" as AccentKey, priority: "tertiary",
    desc: "Routenoptimierung, Fahrzeugkauf",
    useCases: ["Routenoptimierung", "Fahrzeugbeschaffung", "Lagerstandort-Entscheidungen"],
    compliance: ["ADR", "ISO 28000"],
  },
  {
    icon: UtensilsCrossed, name: "Lebensmittel", accent: "amber" as AccentKey, priority: "tertiary",
    desc: "Rezeptur, Lieferant, Qualitätskontrolle",
    useCases: ["Rezepturänderungen", "Lieferantenfreigabe", "Qualitätskontrolle"],
    compliance: ["HACCP", "IFS", "BRC"],
  },
  {
    icon: Heart, name: "Non-Profit", accent: "rose" as AccentKey, priority: "tertiary",
    desc: "Mittelverwendung, Vorstandsbeschlüsse",
    useCases: ["Mittelverwendung", "Vorstandsbeschlüsse", "Förderentscheidungen"],
    compliance: ["Gemeinnützigkeitsrecht"],
  },
  {
    icon: GraduationCap, name: "Bildung", accent: "violet" as AccentKey, priority: "tertiary",
    desc: "Lehrplan, Beschaffung, Gremien",
    useCases: ["Lehrplanänderungen", "Beschaffungsentscheidungen", "Gremienentscheidungen"],
    compliance: ["Schulrecht"],
  },
  {
    icon: Building2, name: "Öffentlicher Sektor", accent: "teal" as AccentKey, priority: "tertiary",
    desc: "Vergabe, Haushaltsbeschluss, Gremien",
    useCases: ["Vergabeentscheidungen", "Haushaltsbeschlüsse", "Genehmigungsverfahren"],
    compliance: ["VOL/A", "UVgO"],
  },
];

const IndustriesSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const active = activeIndex !== null ? industries[activeIndex] : null;

  const displayedIndustries = showAll ? industries : industries.slice(0, 8);

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
          <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-primary">15 Branchen</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Für jede Branche die richtige Sprache.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            Decivio passt sich Ihrer Branche an — Terminologie, Templates, Compliance-Anforderungen.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {displayedIndustries.map((ind, i) => {
            const isActive = activeIndex === i;
            const styles = accentStyles[ind.accent];
            return (
              <motion.button
                key={ind.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5, ease }}
                whileHover={{ y: -3 }}
                onClick={() => setActiveIndex(isActive ? null : i)}
                className={`p-5 rounded-xl border text-left transition-all duration-300 ${
                  isActive
                    ? "border-primary/30 bg-primary/[0.03] shadow-card-hover"
                    : "border-border/30 bg-background/60 backdrop-blur-sm hover:border-border/50 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 ${styles.iconBg}`}>
                    <ind.icon className={`w-4.5 h-4.5 ${styles.iconText}`} />
                  </div>
                  {ind.priority === "primary" && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">Fokus</span>
                  )}
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

        {/* Show more / less toggle */}
        {!showAll && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-6"
          >
            <button
              onClick={() => setShowAll(true)}
              className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              +{industries.length - 8} weitere Branchen anzeigen
            </button>
          </motion.div>
        )}
        {showAll && (
          <div className="text-center mt-6">
            <button
              onClick={() => { setShowAll(false); setActiveIndex(null); }}
              className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Weniger anzeigen
            </button>
          </div>
        )}

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
                    {["maschinenbau", "automotive", "pharma-medizin", "it-software", "bau-industrie"].includes(
                      active.name === "Maschinenbau" ? "maschinenbau" :
                      active.name === "Automotive" ? "automotive" :
                      active.name === "Pharma & Life Sciences" ? "pharma-medizin" :
                      active.name === "IT & Software" ? "it-software" :
                      active.name === "Bau & Industrie" ? "bau-industrie" : ""
                    ) ? (
                      <Link
                        to={`/branchen/${
                          active.name === "Maschinenbau" ? "maschinenbau" :
                          active.name === "Automotive" ? "automotive" :
                          active.name === "Pharma & Life Sciences" ? "pharma-medizin" :
                          active.name === "IT & Software" ? "it-software" :
                          "bau-industrie"
                        }`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-4 hover:gap-2.5 transition-all"
                      >
                        Mehr über Decivio für {active.name} <ArrowRight className="w-3 h-3" />
                      </Link>
                    ) : (
                      <a
                        href="/auth"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-4 hover:gap-2.5 transition-all"
                      >
                        Template für {active.name} testen <ArrowRight className="w-3 h-3" />
                      </a>
                    )}
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

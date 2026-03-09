import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { industries } from "@/data/industries-data";

const ease = [0.16, 1, 0.3, 1] as const;

const IndustriesSection = () => {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedIndustries = showAll ? industries : industries.slice(0, 8);
  const active = industries.find(ind => ind.slug === activeSlug);

  return (
    <section id="branchen" className="py-24 relative">
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
            Für jede Branche die richtige Vorlage.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
            15 spezialisierte Branchen. Compliance-Templates sofort einsatzbereit.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {displayedIndustries.map((ind, i) => {
            const isActive = activeSlug === ind.slug;
            const Icon = ind.icon;
            return (
              <motion.button
                key={ind.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.5, ease }}
                whileHover={{ y: -3 }}
                onClick={() => setActiveSlug(isActive ? null : ind.slug)}
                className={`relative p-5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "border-primary/30 bg-primary/[0.03] shadow-card-hover"
                    : "border-border/30 bg-background/60 backdrop-blur-sm hover:border-border/50 hover:shadow-md"
                }`}
              >
                {ind.popular && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider">
                    BELIEBT
                  </span>
                )}
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-primary/10">
                  <Icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <h3 className="text-[13px] font-semibold mb-1">{ind.name}</h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border/30 text-muted-foreground">
                  {ind.complianceBadge}
                </span>
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

        {/* Show more toggle */}
        <div className="text-center mt-6">
          <button
            onClick={() => { setShowAll(!showAll); if (showAll) setActiveSlug(null); }}
            className="text-[13px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {showAll ? "Weniger anzeigen ▲" : `Weitere ${industries.length - 8} Branchen anzeigen ▼`}
          </button>
        </div>

        {/* Inline Expand Panel */}
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.slug}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease }}
              className="overflow-hidden"
            >
              <div className="mt-6 p-6 rounded-2xl border border-primary/15 bg-background/80 backdrop-blur-sm relative">
                <button
                  onClick={() => setActiveSlug(null)}
                  className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted/50 transition-colors"
                  aria-label="Schließen"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <h4 className="text-lg font-bold mb-6">{active.headline}</h4>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  {active.useCases.map((uc, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: j * 0.08 }}
                      className="p-4 rounded-xl border border-border/30 bg-card/60"
                    >
                      <h5 className="text-[13px] font-semibold mb-1">{uc.name}</h5>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">
                        {uc.desc.length > 120 ? uc.desc.slice(0, 120) + "..." : uc.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {active.compliance.map((c, j) => (
                    <span key={j} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-primary/15 bg-primary/[0.04] text-primary">
                      {c}
                    </span>
                  ))}
                </div>

                {/* Template box */}
                <div className="p-4 rounded-xl bg-muted/20 border-l-3 border-primary/30 mb-6" style={{ borderLeft: "3px solid hsl(var(--primary) / 0.3)" }}>
                  <p className="text-[13px] font-semibold mb-2">📋 Vorlage: {active.templateName}</p>
                  <ul className="space-y-1">
                    {active.templateFields.map((field, j) => (
                      <li key={j} className="flex items-center gap-2 text-[12px] text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary/60 shrink-0" />
                        {field}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Link
                    to={`/auth?template=${active.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                  >
                    Vorlage verwenden <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/branchen/${active.slug}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-border/60 text-foreground hover:bg-muted/50 transition-colors"
                  >
                    Zur Branchenseite
                  </Link>
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

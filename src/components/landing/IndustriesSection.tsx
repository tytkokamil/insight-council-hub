import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { INDUSTRIES } from "@/data/industries-data";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const IndustriesSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = showAll ? INDUSTRIES : INDUSTRIES.slice(0, 8);

  return (
    <section id="branchen" className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-bold mb-4 text-foreground">Für jede Branche die richtige Vorlage.</h2>
          <p className="text-lg text-muted-foreground">15 spezialisierte Branchen. Compliance-Templates sofort einsatzbereit.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visible.map((ind) => (
            <div key={ind.slug}>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
                onClick={() => setExpanded(expanded === ind.slug ? null : ind.slug)}
                className={`relative rounded-xl p-5 cursor-pointer transition-all duration-200 magnetic-card bg-card ${expanded === ind.slug ? "border border-destructive" : "border border-border"}`}>
                {ind.popular && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive">BELIEBT</span>}
                <span className="text-2xl block mb-2">{ind.icon}</span>
                <h3 className="text-sm font-semibold mb-1 text-foreground">{ind.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{ind.complianceBadge}</span>
              </motion.div>
              <AnimatePresence>
                {expanded === ind.slug && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="mt-3 rounded-xl p-6 bg-card border border-border">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-foreground">{ind.headline}</h4>
                        <button onClick={() => setExpanded(null)} aria-label="Schließen"><X className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {ind.useCases.map((uc, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50">
                            <p className="text-sm font-semibold mb-0.5 text-foreground">{uc.name}</p>
                            <p className="text-xs text-muted-foreground">{uc.desc.slice(0, 120)}{uc.desc.length > 120 ? "..." : ""}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {ind.compliance.map(c => <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{c}</span>)}
                      </div>
                      <div className="p-4 rounded-lg mb-4 bg-muted/50 border-l-[3px] border-l-destructive">
                        <p className="text-sm font-semibold mb-2 text-foreground">📋 Enthaltene Vorlage: {ind.templateName}</p>
                        <div className="flex flex-wrap gap-2">{ind.templateFields.map(f => <span key={f} className="text-xs text-muted-foreground">✓ {f}</span>)}</div>
                      </div>
                      <div className="flex gap-3">
                        <Link to={`/auth?template=${ind.slug}`} className="text-sm font-semibold text-destructive-foreground px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90">Vorlage verwenden →</Link>
                        <Link to={`/branchen/${ind.slug}`} className="text-sm px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground">Zur Branchenseite →</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => setShowAll(!showAll)} className="text-sm font-medium px-6 py-3 rounded-lg transition-all border border-border text-muted-foreground hover:text-foreground hover:border-destructive/40">
            {showAll ? "Weniger anzeigen ▲" : "Weitere 7 Branchen anzeigen ▼"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { INDUSTRIES, type IndustryData } from "@/data/industries-data";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const IndustriesSection = () => {
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = showAll ? INDUSTRIES : INDUSTRIES.slice(0, 8);

  return (
    <section id="branchen" className="py-24" style={{ background: "#FFFFFF" }}>
      <div className="max-w-6xl mx-auto px-4">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
          <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>Für jede Branche die richtige Vorlage.</h2>
          <p className="text-lg" style={{ color: "#64748B" }}>15 spezialisierte Branchen. Compliance-Templates sofort einsatzbereit.</p>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visible.map((ind) => (
            <div key={ind.slug}>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
                onClick={() => setExpanded(expanded === ind.slug ? null : ind.slug)}
                className="relative rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md"
                style={{ background: "#FFFFFF", border: expanded === ind.slug ? "1px solid #EF4444" : "1px solid #E2E8F0" }}>
                {ind.popular && <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "#FEE2E2", color: "#EF4444" }}>BELIEBT</span>}
                <span className="text-2xl block mb-2">{ind.icon}</span>
                <h3 className="text-sm font-semibold mb-1" style={{ color: "#0F172A" }}>{ind.name}</h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "#F1F5F9", color: "#64748B" }}>{ind.complianceBadge}</span>
              </motion.div>
              <AnimatePresence>
                {expanded === ind.slug && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="mt-3 rounded-xl p-6" style={{ background: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-semibold" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>{ind.headline}</h4>
                        <button onClick={() => setExpanded(null)} aria-label="Schließen"><X className="w-4 h-4" style={{ color: "#64748B" }} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {ind.useCases.map((uc, i) => (
                          <div key={i} className="p-3 rounded-lg" style={{ background: "#F8FAFC" }}>
                            <p className="text-sm font-semibold mb-0.5" style={{ color: "#0F172A" }}>{uc.name}</p>
                            <p className="text-xs" style={{ color: "#64748B" }}>{uc.desc.slice(0, 120)}{uc.desc.length > 120 ? "..." : ""}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {ind.compliance.map(c => <span key={c} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#F1F5F9", color: "#64748B" }}>{c}</span>)}
                      </div>
                      <div className="p-4 rounded-lg mb-4" style={{ background: "#F8FAFC", borderLeft: "3px solid #EF4444" }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: "#0F172A" }}>📋 Enthaltene Vorlage: {ind.templateName}</p>
                        <div className="flex flex-wrap gap-2">{ind.templateFields.map(f => <span key={f} className="text-xs" style={{ color: "#64748B" }}>✓ {f}</span>)}</div>
                      </div>
                      <div className="flex gap-3">
                        <Link to={`/auth?template=${ind.slug}`} className="text-sm font-semibold text-white px-4 py-2 rounded-lg" style={{ background: "#EF4444" }}>Vorlage verwenden →</Link>
                        <Link to={`/branchen/${ind.slug}`} className="text-sm px-4 py-2 rounded-lg" style={{ border: "1px solid #E2E8F0", color: "#64748B" }}>Zur Branchenseite →</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <button onClick={() => setShowAll(!showAll)} className="text-sm font-medium px-6 py-3 rounded-lg transition-all" style={{ border: "1px solid #E2E8F0", color: "#64748B" }}>
            {showAll ? "Weniger anzeigen ▲" : "Weitere 7 Branchen anzeigen ▼"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;

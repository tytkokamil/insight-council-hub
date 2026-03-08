import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const problems = [
  { icon: "⏳", color: "#EF4444", title: "Freigaben dauern zu lange", text: "Operative Entscheidungen im Mittelstand warten durchschnittlich 4–6 Tage auf Freigabe. Jeder Tag Verzögerung hat wirtschaftliche Konsequenzen — die meistens niemand quantifiziert.", source: "McKinsey Decision Research" },
  { icon: "📧", color: "#F59E0B", title: "Entscheidungen laufen per E-Mail", text: "Freigabeprozesse über E-Mail-Chains haben kein zentrales Tracking, kein Fälligkeitsdatum und keine Eskalationslogik. Der Status einer Entscheidung kennt oft nur der Absender.", source: "Intern beobachtbar" },
  { icon: "📋", color: "#F97316", title: "Compliance-Dokumentation fehlt", text: "ISO 9001 Kapitel 7.5, IATF 16949 und NIS2 fordern nachvollziehbare, dokumentierte Entscheidungsprozesse. Bei den meisten Unternehmen ist diese Dokumentation im Audit-Fall nicht vorhanden.", source: "ISO 9001:2015 Kap. 7.5" },
  { icon: "💸", color: "#991B1B", title: "Die Kosten bleiben unsichtbar", text: "Was Verzögerungen wirklich kosten — in Stunden, in gebundenem Kapital, in verpassten Marktfenstern — rechnet kaum jemand aus. Bis jetzt.", ctaLink: true },
];

const ProblemSection = () => (
  <section id="problem" className="py-24" style={{ background: "#F8FAFC" }}>
    <div className="max-w-6xl mx-auto px-4">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="text-center mb-16">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold mb-4" style={{ fontFamily: "'DM Serif Display', serif", color: "#0F172A" }}>
          Was in Ihrem Unternehmen gerade passiert.
        </h2>
        <p className="text-lg" style={{ color: "#64748B" }}>Täglich. In jedem Unternehmen. Unsichtbar.</p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-6">
        {problems.map((p, i) => (
          <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            className="bg-white rounded-xl p-6 shadow-sm" style={{ borderLeft: `4px solid ${p.color}` }}>
            <div className="text-2xl mb-3">{p.icon}</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "#0F172A" }}>{p.title}</h3>
            <p className="text-sm leading-relaxed mb-3" style={{ color: "#64748B" }}>{p.text}</p>
            {p.ctaLink ? (
              <a href="#roi" onClick={(e) => { e.preventDefault(); document.querySelector("#roi")?.scrollIntoView({ behavior: "smooth" }); }}
                className="text-sm font-semibold" style={{ color: "#EF4444" }}>Eigene Kosten berechnen →</a>
            ) : (
              <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ background: "#F1F5F9", color: "#64748B" }}>{p.source}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ProblemSection;

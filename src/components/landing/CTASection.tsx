import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const CTASection = () => (
  <section className="dark">
    <div className="py-24 bg-background relative overflow-hidden">
      <div className="aurora-bg" />
      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-bold mb-6 leading-tight text-foreground">
            Erste Entscheidung in 3 Minuten.<br />Keine Kreditkarte. Kein IT-Projekt.
          </h2>
          <p className="text-lg mb-10 text-muted-foreground">Starten Sie heute. Ihr nächster Audit-Prüfer wird es Ihnen danken.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-destructive-foreground px-8 py-4 rounded-lg min-h-[48px] bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/20">
              Kostenlos starten <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:hallo@decivio.com" className="inline-flex items-center justify-center text-sm px-8 py-4 rounded-lg min-h-[48px] text-foreground border border-border hover:border-destructive/40">
              Demo buchen
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10">
            {["🇩🇪 Server in Deutschland", "🔒 DSGVO", "📋 AVV inklusive", "↕ Jederzeit kündbar"].map(t => <span key={t} className="text-sm text-muted-foreground">{t}</span>)}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default CTASection;

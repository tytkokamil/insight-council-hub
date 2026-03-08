import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const DARK_TEXTURE = `radial-gradient(ellipse at 20% 50%, rgba(239,68,68,0.08) 0%, transparent 60%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const CTASection = () => (
  <section className="py-24" style={{ background: "#030810", backgroundImage: DARK_TEXTURE }}>
    <div className="max-w-3xl mx-auto px-4 text-center">
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
        <h2 className="text-[clamp(1.75rem,4vw,3rem)] font-semibold mb-6 leading-tight" style={{ fontFamily: "'DM Serif Display', serif", color: "#F1F5F9" }}>
          Erste Entscheidung in 3 Minuten.<br />Keine Kreditkarte. Kein IT-Projekt.
        </h2>
        <p className="text-lg mb-10" style={{ color: "#94A3B8" }}>Starten Sie heute. Ihr nächster Audit-Prüfer wird es Ihnen danken.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth" className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white px-8 py-4 rounded-lg min-h-[48px] shadow-lg"
            style={{ background: "#EF4444" }}>Kostenlos starten <ArrowRight className="w-4 h-4" /></Link>
          <a href="mailto:hallo@decivio.com" className="inline-flex items-center justify-center text-sm px-8 py-4 rounded-lg min-h-[48px]"
            style={{ color: "#F1F5F9", border: "1px solid #1E293B" }}>Demo buchen</a>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10">
          {["🇩🇪 Server in Deutschland", "🔒 DSGVO", "📋 AVV inklusive", "↕ Jederzeit kündbar"].map(t => <span key={t} className="text-sm" style={{ color: "#64748B" }}>{t}</span>)}
        </div>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

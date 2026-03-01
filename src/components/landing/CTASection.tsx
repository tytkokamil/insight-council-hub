import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-28 relative overflow-hidden">
    {/* Large blue glow */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-[800px] h-[500px] bg-[hsl(217,91%,60%)]/[0.08] rounded-full blur-[120px]" />
    </div>

    <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
      >
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-5 leading-[1.1]">
          Starten Sie heute.<br />Erste Entscheidung in 3 Minuten.
        </h2>
        <p className="text-[hsl(215,20%,65%)] mb-10 text-lg">
          Keine Kreditkarte · Keine Installation · DSGVO-konform
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth"
            className="inline-flex items-center justify-center gap-2 text-[15px] font-semibold text-white bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] px-8 py-3.5 rounded-xl shadow-[0_0_30px_-6px_hsl(217,91%,60%/0.5)] transition-all"
          >
            Kostenlos 14 Tage testen <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="mailto:demo@decivio.com"
            className="inline-flex items-center justify-center gap-2 text-[15px] font-medium text-[hsl(215,20%,65%)] hover:text-white border border-white/[0.1] hover:border-white/[0.2] px-8 py-3.5 rounded-xl transition-all"
          >
            Demo buchen
          </a>
        </div>

        <p className="mt-10 text-[12px] text-[hsl(215,16%,47%)]">
          Server in Deutschland · ISO 27001 zertifiziertes Rechenzentrum · Auftragsverarbeitungsvertrag inklusive
        </p>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

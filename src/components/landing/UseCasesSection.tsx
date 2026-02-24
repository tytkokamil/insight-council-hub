import { motion } from "framer-motion";
import { Landmark, FlaskConical, Rocket, Building2 } from "lucide-react";

const useCases = [
  {
    icon: Landmark,
    title: "Finanzdienstleister",
    subtitle: "Regulatorik & Governance",
    description: "Audit-sichere Freigabe-Workflows für Kreditentscheidungen, Compliance-Reports und regulatorische Dokumentation — NIS2- und DSGVO-konform.",
    stat: "98%",
    statLabel: "SLA-Einhaltung",
  },
  {
    icon: FlaskConical,
    title: "Pharma & Life Sciences",
    subtitle: "Pipeline & Risk Management",
    description: "Strukturierte Entscheidungsprozesse für klinische Studien, M&A-Bewertungen und Portfolio-Priorisierung mit vollständigem Audit Trail.",
    stat: "€4.2M",
    statLabel: "CoD vermieden",
  },
  {
    icon: Rocket,
    title: "Scale-Ups & Tech",
    subtitle: "Velocity & Alignment",
    description: "Schnelle Entscheidungen ohne Chaos. OKR-Alignment, automatische Eskalation und KI-gestütztes Risk Scoring für wachsende Teams.",
    stat: "43%",
    statLabel: "schnellere Zyklen",
  },
  {
    icon: Building2,
    title: "Public Sector & Verwaltung",
    subtitle: "Transparenz & Nachvollziehbarkeit",
    description: "Revisionssichere Dokumentation, mehrstufige Genehmigungsverfahren und vollständige Transparenz für Gremienentscheidungen.",
    stat: "100%",
    statLabel: "Audit-Abdeckung",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const UseCasesSection = () => (
  <section className="py-28 relative">
    <div className="absolute inset-0 bg-muted/20" />

    <div id="use-cases" className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-xl mx-auto mb-16"
      >
        <p className="text-[11px] font-medium text-muted-foreground/60 mb-4 tracking-[0.2em] uppercase">Branchen</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
          Gebaut für regulierte Branchen{" "}
          <span className="text-muted-foreground font-normal">und schnelle Teams</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
        {useCases.map((uc, i) => (
          <motion.div
            key={uc.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.6, ease }}
            className="group relative p-7 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
          >
            <div className="flex items-start gap-5">
              <div className="w-11 h-11 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-primary/[0.06] transition-colors">
                <uc.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[15px] font-semibold mb-0.5">{uc.title}</h3>
                <p className="text-[11px] text-muted-foreground/50 mb-3">{uc.subtitle}</p>
                <p className="text-sm text-muted-foreground/70 leading-relaxed mb-4">
                  {uc.description}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-primary font-display">{uc.stat}</span>
                  <span className="text-[11px] text-muted-foreground/50">{uc.statLabel}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default UseCasesSection;

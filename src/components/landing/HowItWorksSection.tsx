import { motion } from "framer-motion";

const steps = [
  { number: "01", title: "Erfassen", description: "Templates, Kontext, klare Verantwortlichkeiten — strukturiert von Anfang an." },
  { number: "02", title: "Bewerten", description: "KI-Risikoanalyse, Reviewer-Vorschläge und Stakeholder-Alignment in Echtzeit." },
  { number: "03", title: "Steuern", description: "SLA-Tracking, automatische Eskalation und konfigurierbare Review-Flows." },
  { number: "04", title: "Lernen", description: "Outcome-Tracking, Decision DNA und Pattern-Erkennung für bessere Ergebnisse." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const HowItWorksSection = () => (
  <section className="py-32 relative bg-muted/30">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-primary" />
            <span className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">So funktioniert's</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-[-0.04em]">
            Von der Idee zum Ergebnis.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-x-20 gap-y-16">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5, ease }}
            >
              <span className="text-7xl font-bold text-foreground/[0.04] font-display block leading-none mb-4">
                {step.number}
              </span>
              <h3 className="text-xl font-semibold tracking-tight mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;

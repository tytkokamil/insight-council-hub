import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Erfassen",
    description: "Templates, Kontext, klare Verantwortlichkeiten — strukturiert von Anfang an.",
  },
  {
    number: "02",
    title: "Bewerten",
    description: "KI-Risikoanalyse, Reviewer-Vorschläge und Stakeholder-Alignment in Echtzeit.",
  },
  {
    number: "03",
    title: "Steuern",
    description: "SLA-Tracking, automatische Eskalation und konfigurierbare Review-Flows.",
  },
  {
    number: "04",
    title: "Lernen",
    description: "Outcome-Tracking, Decision DNA und Pattern-Erkennung für bessere Ergebnisse.",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const HowItWorksSection = () => (
  <section className="py-24 relative">
    <div className="absolute inset-0 bg-muted/15" />
    
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center max-w-lg mx-auto mb-14"
      >
        <p className="text-[11px] font-medium text-muted-foreground/50 mb-3 tracking-[0.15em] uppercase">So funktioniert's</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          Von der Idee zum Ergebnis
        </h2>
      </motion.div>

      <div className="max-w-3xl mx-auto">
        <div className="grid md:grid-cols-4 gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.08, duration: 0.5, ease }}
              className="relative p-5 flex flex-col"
            >
              {/* Connector arrow */}
              {i < 3 && (
                <ArrowRight className="hidden md:block absolute -right-2 top-6 w-4 h-4 text-primary/20 z-10" />
              )}
              
              <span className="text-2xl font-bold text-primary/15 mb-3 font-display">{step.number}</span>
              <h3 className="text-sm font-semibold mb-1.5">{step.title}</h3>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;

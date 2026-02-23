import { motion } from "framer-motion";

const steps = [
  { number: "01", title: "Erfassen", description: "Templates, Kontext, klare Verantwortlichkeiten — strukturiert von Anfang an." },
  { number: "02", title: "Bewerten", description: "KI-Risikoanalyse, Reviewer-Vorschläge und Stakeholder-Alignment in Echtzeit." },
  { number: "03", title: "Steuern", description: "SLA-Tracking, automatische Eskalation und konfigurierbare Review-Flows." },
  { number: "04", title: "Lernen", description: "Outcome-Tracking, Decision DNA und Pattern-Erkennung für bessere Ergebnisse." },
];

const ease = [0.16, 1, 0.3, 1] as const;

const HowItWorksSection = () => (
  <section className="py-28 relative overflow-hidden">
    {/* Aurora background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-aurora-mint/[0.08] blur-[120px]" />
      <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-aurora-blue/[0.06] blur-[100px]" />
    </div>

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="max-w-3xl mx-auto mb-16"
      >
        <p className="text-xs font-medium text-accent-teal/60 mb-4 tracking-[0.15em] uppercase">So funktioniert's</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-[-0.03em]">
          Von der Idee zum Ergebnis
        </h2>
      </motion.div>

      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-4 gap-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease }}
              className="relative p-6 group"
            >
              {i < 3 && (
                <div className="hidden md:block absolute top-10 right-0 w-full h-px">
                  <motion.div
                    className="h-full bg-gradient-to-r from-aurora-mint/25 to-aurora-violet/15"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease }}
                    style={{ originX: 0 }}
                  />
                </div>
              )}

              <div className="relative">
                <span className="text-5xl font-bold text-aurora-blue/[0.1] font-display block mb-4 group-hover:text-aurora-violet/[0.15] transition-colors duration-500">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm text-muted-foreground/60 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;

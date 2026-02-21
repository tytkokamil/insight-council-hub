import { motion } from "framer-motion";
import { FileText, Users, LineChart, Lightbulb } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Decision erfassen",
    description: "Strukturiert mit Templates, Kontext und klaren Verantwortlichkeiten — statt verstreuter Slack-Threads.",
    accent: "text-accent-blue",
    accentBg: "bg-accent-blue/8",
    accentBorder: "border-accent-blue/20",
  },
  {
    number: "02",
    icon: Users,
    title: "Review & Governance",
    description: "Konfigurierbare Review-Flows, SLA-Tracking und automatische Eskalation. Nichts bleibt liegen.",
    accent: "text-accent-violet",
    accentBg: "bg-accent-violet/8",
    accentBorder: "border-accent-violet/20",
  },
  {
    number: "03",
    icon: LineChart,
    title: "Umsetzung tracken",
    description: "Verfolgen Sie den Status jeder Entscheidung bis zur vollständigen Implementierung. Mit KI-Risikoanalyse.",
    accent: "text-accent-teal",
    accentBg: "bg-accent-teal/8",
    accentBorder: "border-accent-teal/20",
  },
  {
    number: "04",
    icon: Lightbulb,
    title: "Lernen & Optimieren",
    description: "Outcome-Tracking, Lessons Learned und Pattern-Erkennung. Jede Entscheidung macht die nächste besser.",
    accent: "text-accent-amber",
    accentBg: "bg-accent-amber/8",
    accentBorder: "border-accent-amber/20",
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

const HowItWorksSection = () => (
  <section className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">So funktioniert's</p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
          Von der Idee bis zum <span className="gradient-text">messbaren Ergebnis</span>
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          Vier Schritte, die jeden Entscheidungsprozess in Ihrem Unternehmen transformieren.
        </p>
      </motion.div>

      <div className="relative max-w-4xl mx-auto">
        {/* Connecting line */}
        <div className="absolute left-[29px] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.12, duration: 0.6, ease }}
              className="relative flex gap-6 items-start"
            >
              {/* Step number */}
              <div className={`relative z-10 w-[58px] h-[58px] shrink-0 rounded-2xl ${step.accentBg} border ${step.accentBorder} flex items-center justify-center`}>
                <step.icon className={`w-6 h-6 ${step.accent}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-xs font-bold ${step.accent} tabular-nums`}>{step.number}</span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;

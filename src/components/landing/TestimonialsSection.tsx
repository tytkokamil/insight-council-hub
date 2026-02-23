import { motion } from "framer-motion";
import { Star, Quote, Shield, Lock, Award } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Christina Berger",
    role: "CEO, Mittelstand (420 MA)",
    quote: "Unsere Entscheidungszyklen sind um 43% schneller geworden. Was vorher 3 Wochen dauerte, schaffen wir jetzt in 4 Tagen — mit vollständiger Audit-Trail.",
    avatar: "CB",
    highlight: "43% schnellere Zyklen",
    accentClass: "from-accent-blue to-accent-violet",
    avatarBg: "bg-accent-blue/15 text-accent-blue",
    metric: { value: "3 Wo → 4 Tage", label: "Zykluszeit" },
  },
  {
    name: "Marcus Weber",
    role: "CFO, Series-B Scale-Up",
    quote: "Wir haben €2.3M an Opportunity Costs identifiziert, die uns durch verzögerte Entscheidungen entgangen wären. Der ROI war nach 6 Wochen erreicht.",
    avatar: "MW",
    highlight: "€2.3M eingespart",
    accentClass: "from-accent-violet to-accent-rose",
    avatarBg: "bg-accent-violet/15 text-accent-violet",
    metric: { value: "€2.3M", label: "identifizierte Kosten" },
  },
  {
    name: "Anna Richter",
    role: "VP Governance, Enterprise (1.200 MA)",
    quote: "Eskalationen sind um 61% zurückgegangen. Unser Board hat erstmals vollständige Transparenz über alle strategischen Entscheidungen — inklusive Compliance-Nachweis.",
    avatar: "AR",
    highlight: "-61% Eskalationen",
    accentClass: "from-accent-teal to-accent-blue",
    avatarBg: "bg-accent-teal/15 text-accent-teal",
    metric: { value: "-61%", label: "Eskalationen" },
  },
];

const trustBadges = [
  { icon: Shield, label: "DSGVO-konform" },
  { icon: Lock, label: "End-to-End verschlüsselt" },
  { icon: Award, label: "SOC 2 Type II ready" },
];

const ease = [0.16, 1, 0.3, 1] as const;

const TestimonialsSection = () => (
  <section id="testimonials" className="py-20 relative overflow-hidden">
    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="text-center max-w-2xl mx-auto mb-12"
      >
        <p className="text-xs font-medium text-muted-foreground mb-4 tracking-[0.15em] uppercase">
          Vertrauen von Führungsteams
        </p>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Messbare Ergebnisse auf <span className="gradient-text">C-Level</span>
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Führungsteams aus Mittelstand und Enterprise nutzen Decivio, um Entscheidungsqualität messbar zu steigern.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.12, duration: 0.7, ease }}
            className="group relative p-7 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-300 flex flex-col"
          >
            <div className="relative flex-1 flex flex-col">
              <Quote className="w-5 h-5 text-primary/20 mb-3" />

              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-accent-amber text-accent-amber" />
                ))}
              </div>

              {/* Key Metric */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`inline-flex px-2.5 py-1 rounded-full bg-gradient-to-r ${t.accentClass} text-[10px] font-semibold text-white`}>
                  {t.highlight}
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-[1.8] mb-6 flex-1">
                „{t.quote}"
              </p>

              {/* Result metric */}
              <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border/50 mb-5">
                <p className="text-lg font-bold text-foreground">{t.metric.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{t.metric.label}</p>
              </div>

              <div className="flex items-center gap-3 mt-auto pt-5 border-t border-border/30">
                <div className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-xs font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease }}
        className="flex items-center justify-center gap-6 flex-wrap"
      >
        {trustBadges.map((badge, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/50">
            <badge.icon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">{badge.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
);

export default TestimonialsSection;

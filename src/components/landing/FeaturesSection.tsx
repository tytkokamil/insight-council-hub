import { motion } from "framer-motion";
import {
  Workflow,
  Users,
  Brain,
  Shield,
  BarChart3,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Workflow,
    title: "Decision Lifecycle",
    description: "4-phase workflow from Draft to Implementation with full version control and timestamps.",
  },
  {
    icon: Users,
    title: "Multi-Step Reviews",
    description: "Sequential approval workflows with assigned reviewers and structured feedback.",
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Automatic risk assessment, impact analysis, and success factor recommendations.",
  },
  {
    icon: Shield,
    title: "Audit Trail",
    description: "Complete compliance-ready history with timestamps, versions, and user tracking.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "KPIs, bottleneck detection, and implementation rate tracking in real-time.",
  },
  {
    icon: FileText,
    title: "Smart Templates",
    description: "Pre-built templates for Strategic, Operational, Budget, HR, and Technical decisions.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-32 relative">
      {/* Subtle background */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-medium text-primary mb-4 tracking-wide uppercase"
          >
            Capabilities
          </motion.p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Everything you need for
            <span className="gradient-text block mt-1">professional decisions</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From initial idea to implementation — full transparency, AI support, and compliance tracking.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              className="group relative p-6 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm hover:bg-card/70 hover:border-border/70 transition-all duration-500 hover:shadow-lg"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-5 group-hover:bg-primary/12 transition-colors duration-300">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Workflow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-32"
        >
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-8 md:p-14">
            <div className="text-center mb-14">
              <p className="text-sm font-medium text-primary mb-3 tracking-wide uppercase">Workflow</p>
              <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
                Decision Lifecycle
              </h3>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
              {[
                { step: 1, label: "Draft", icon: FileText, desc: "Create & Define" },
                { step: 2, label: "Review", icon: MessageSquare, desc: "Collaborate & Discuss" },
                { step: 3, label: "Approved", icon: CheckCircle2, desc: "Get Consensus" },
                { step: 4, label: "Implemented", icon: Clock, desc: "Execute & Track" },
              ].map((phase, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 ${
                      i === 0 ? 'bg-muted/50' :
                      i === 1 ? 'bg-warning/10' :
                      i === 2 ? 'bg-success/10' :
                      'bg-primary/10'
                    }`}>
                      <phase.icon className={`w-7 h-7 ${
                        i === 0 ? 'text-muted-foreground' :
                        i === 1 ? 'text-warning' :
                        i === 2 ? 'text-success' :
                        'text-primary'
                      }`} />
                    </div>
                    <span className="font-display font-semibold text-sm">{phase.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{phase.desc}</span>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:flex items-center mx-6">
                      <div className="w-16 h-px bg-border" />
                      <ArrowRight className="w-4 h-4 text-muted-foreground/40 -ml-1" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

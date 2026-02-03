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
  CheckCircle2
} from "lucide-react";

const features = [
  {
    icon: Workflow,
    title: "Decision Lifecycle",
    description: "4-phase workflow from Draft to Implementation with full version control and timestamps.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Users,
    title: "Multi-Step Reviews",
    description: "Sequential approval workflows with assigned reviewers and structured feedback.",
    color: "text-purple-400",
    bgColor: "bg-purple-400/10"
  },
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Automatic risk assessment, impact analysis, and success factor recommendations.",
    color: "text-blue-400",
    bgColor: "bg-blue-400/10"
  },
  {
    icon: Shield,
    title: "Audit Trail",
    description: "Complete compliance-ready history with timestamps, versions, and user tracking.",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "KPIs, bottleneck detection, and implementation rate tracking in real-time.",
    color: "text-warning",
    bgColor: "bg-warning/10"
  },
  {
    icon: FileText,
    title: "Smart Templates",
    description: "Pre-built templates for Strategic, Operational, Budget, HR, and Technical decisions.",
    color: "text-pink-400",
    bgColor: "bg-pink-400/10"
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const FeaturesSection = () => {
  return (
    <section className="py-32 relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">
            Everything You Need for
            <span className="gradient-text block">Professional Decisions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From initial idea to implementation — full transparency, AI support, and compliance tracking.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="group glass-card p-6 hover:bg-card/80 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Workflow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-32"
        >
          <div className="glass-card p-8 md:p-12">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
              Decision Workflow
            </h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
              {[
                { step: 1, label: "Draft", icon: FileText, desc: "Create & Define" },
                { step: 2, label: "Review", icon: MessageSquare, desc: "Collaborate & Discuss" },
                { step: 3, label: "Approved", icon: CheckCircle2, desc: "Get Consensus" },
                { step: 4, label: "Implemented", icon: Clock, desc: "Execute & Track" },
              ].map((phase, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 ${
                      i === 0 ? 'bg-muted' :
                      i === 1 ? 'bg-warning/20' :
                      i === 2 ? 'bg-success/20' :
                      'bg-primary/20'
                    }`}>
                      <phase.icon className={`w-7 h-7 ${
                        i === 0 ? 'text-muted-foreground' :
                        i === 1 ? 'text-warning' :
                        i === 2 ? 'text-success' :
                        'text-primary'
                      }`} />
                    </div>
                    <span className="font-semibold">{phase.label}</span>
                    <span className="text-sm text-muted-foreground">{phase.desc}</span>
                  </div>
                  {i < 3 && (
                    <div className="hidden md:block w-20 h-0.5 bg-gradient-to-r from-border to-primary/50 mx-4" />
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

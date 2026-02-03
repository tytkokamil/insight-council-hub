import { motion } from "framer-motion";
import { TrendingUp, Clock, Target, Users } from "lucide-react";

const stats = [
  {
    icon: TrendingUp,
    value: "73%",
    label: "Faster Decisions",
    description: "Average time reduction in decision cycles",
  },
  {
    icon: Target,
    value: "94%",
    label: "Implementation Rate",
    description: "Decisions that reach full execution",
  },
  {
    icon: Clock,
    value: "2.5x",
    label: "Better Tracking",
    description: "Improved visibility into decision progress",
  },
  {
    icon: Users,
    value: "500+",
    label: "Enterprise Teams",
    description: "Organizations transforming their decisions",
  },
];

const StatsSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
                <stat.icon className="w-7 h-7 text-primary" />
              </div>
              <div className="font-display text-4xl md:text-5xl font-bold gradient-text mb-2">
                {stat.value}
              </div>
              <div className="font-semibold mb-1">{stat.label}</div>
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Zap, Shield, BarChart3 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Ambient background */}
      <div className="absolute inset-0 mesh-gradient" />
      <div className="floating-orb w-[600px] h-[600px] bg-primary/20 -top-40 -left-40" />
      <div className="floating-orb w-[500px] h-[500px] bg-accent/15 top-1/3 -right-40" style={{ animationDelay: "2s" }} />
      <div className="floating-orb w-[400px] h-[400px] bg-primary/10 bottom-0 left-1/3" style={{ animationDelay: "4s" }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground)/0.015)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground)/0.015)_1px,transparent_1px)] bg-[size:72px_72px]" />

      {/* Top fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm mb-10"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Enterprise Decision Platform
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-7 leading-[0.95]"
          >
            Decisions that
            <br />
            <span className="gradient-text">move forward.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed text-balance"
          >
            Transform chaotic ad-hoc decisions into structured, AI-powered workflows.
            Full transparency, complete audit trails, and intelligent insights.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button variant="hero" size="xl" className="rounded-2xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="hero-outline" size="xl" className="rounded-2xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-20 flex flex-wrap items-center justify-center gap-10 text-muted-foreground"
          >
            {[
              { icon: Shield, text: "GDPR Compliant" },
              { icon: Zap, text: "SOC 2 Ready" },
              { icon: Shield, text: "Enterprise Security" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <badge.icon className="w-4 h-4 text-muted-foreground/60" />
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-24 relative max-w-5xl mx-auto"
        >
          {/* Glow behind */}
          <div className="absolute -inset-8 bg-primary/5 rounded-[32px] blur-3xl" />

          <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl overflow-hidden shadow-elevated">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/50 bg-muted/20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-warning/40" />
                <div className="w-3 h-3 rounded-full bg-success/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-lg bg-muted/30 text-xs text-muted-foreground font-mono">
                  app.decisionos.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <DashboardPreview />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Mini dashboard preview
const DashboardPreview = () => {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-semibold text-sm">Decision Dashboard</span>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full text-xs bg-success/10 text-success font-medium">12 Approved</div>
          <div className="px-3 py-1 rounded-full text-xs bg-warning/10 text-warning font-medium">5 In Review</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { title: "Q4 Budget Allocation", status: "Approved", priority: "High", progress: 85 },
          { title: "New Market Entry", status: "In Review", priority: "Critical", progress: 60 },
          { title: "Tech Stack Migration", status: "Draft", priority: "Medium", progress: 30 },
        ].map((decision, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-3 hover:border-border/60 transition-colors">
            <div className="flex items-start justify-between">
              <span className="font-medium text-sm">{decision.title}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                decision.status === 'Approved' ? 'bg-success/10 text-success' :
                decision.status === 'In Review' ? 'bg-warning/10 text-warning' :
                'bg-muted/50 text-muted-foreground'
              }`}>
                {decision.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${decision.progress}%` }}
                  transition={{ duration: 1.2, delay: 1.2 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono">{decision.progress}%</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`${
                decision.priority === 'Critical' ? 'text-destructive' :
                decision.priority === 'High' ? 'text-warning' :
                'text-primary'
              }`}>● {decision.priority}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background orbs */}
      <div className="floating-orb w-96 h-96 bg-primary -top-20 -left-20" />
      <div className="floating-orb w-80 h-80 bg-[hsl(280_87%_65%)] top-1/2 -right-20" />
      <div className="floating-orb w-64 h-64 bg-[hsl(217_91%_60%)] bottom-20 left-1/3" />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Enterprise Decision Management Platform
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            Make Decisions
            <br />
            <span className="gradient-text">That Matter</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
          >
            Transform chaotic ad-hoc decisions into structured, AI-powered workflows. 
            Full transparency, complete audit trails, and intelligent insights.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="hero" size="xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="hero-outline" size="xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm">SOC 2 Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm">Enterprise Security</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1 }}
          className="mt-20 relative"
        >
          <div className="glass-card p-2 glow-effect gradient-border">
            <div className="rounded-lg overflow-hidden bg-card/50">
              <DashboardPreview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Mini dashboard preview component
const DashboardPreview = () => {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="font-display font-semibold">Decision Dashboard</span>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 rounded-full text-xs bg-success/20 text-success">12 Approved</div>
          <div className="px-3 py-1 rounded-full text-xs bg-warning/20 text-warning">5 In Review</div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Q4 Budget Allocation", status: "Approved", priority: "High", progress: 85 },
          { title: "New Market Entry", status: "In Review", priority: "Critical", progress: 60 },
          { title: "Tech Stack Migration", status: "Draft", priority: "Medium", progress: 30 },
        ].map((decision, i) => (
          <div key={i} className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
            <div className="flex items-start justify-between">
              <span className="font-medium text-sm">{decision.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                decision.status === 'Approved' ? 'bg-success/20 text-success' :
                decision.status === 'In Review' ? 'bg-warning/20 text-warning' :
                'bg-muted text-muted-foreground'
              }`}>
                {decision.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${decision.progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{decision.progress}%</span>
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

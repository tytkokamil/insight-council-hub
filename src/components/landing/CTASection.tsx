import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="floating-orb w-[500px] h-[500px] bg-primary/15 top-0 left-1/4" />
        <div className="floating-orb w-[400px] h-[400px] bg-accent/10 bottom-0 right-1/4" style={{ animationDelay: "3s" }} />
      </div>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/40 backdrop-blur-sm mb-10">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium tracking-wide uppercase">Get Started Today</span>
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-bold mb-7 tracking-tight leading-[0.95]">
            Ready to transform
            <span className="gradient-text block mt-1">your decision making?</span>
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
            Join hundreds of enterprise teams making better decisions with DecisionOS.
            Start your free trial today — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="xl" className="rounded-2xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl" className="rounded-2xl">
              Schedule Demo
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            {["14-day free trial", "No credit card", "Cancel anytime"].map((text, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-success" />
                {text}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

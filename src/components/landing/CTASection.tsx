import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="floating-orb w-96 h-96 bg-primary top-0 left-1/4" />
        <div className="floating-orb w-64 h-64 bg-[hsl(280_87%_65%)] bottom-0 right-1/4" />
      </div>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">Get Started Today</span>
          </div>

          <h2 className="font-display text-4xl md:text-6xl font-bold mb-6">
            Ready to Transform
            <span className="gradient-text block">Your Decision Making?</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Join hundreds of enterprise teams making better decisions with DecisionOS. 
            Start your free trial today — no credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button variant="glass" size="xl">
              Schedule Demo
            </Button>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            ✓ 14-day free trial &nbsp; ✓ No credit card &nbsp; ✓ Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

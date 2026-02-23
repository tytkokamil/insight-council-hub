import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-32 relative">
    <div className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-[-0.05em] leading-[0.95] mb-6">
            Bereit für strukturierte
            <br />
            Entscheidungen?
          </h2>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-border pt-8 mt-8">
            <p className="text-lg text-muted-foreground max-w-md">
              14 Tage kostenlos. Keine Kreditkarte. Jederzeit kündbar.
            </p>

            <div className="flex gap-3 shrink-0">
              <Link to="/dashboard">
                <Button size="lg" className="rounded-full group px-8 h-12 text-[15px]">
                  Kostenlos starten
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-[15px]">
                Demo vereinbaren
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default CTASection;

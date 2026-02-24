import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const ease = [0.16, 1, 0.3, 1] as const;

const CTASection = () => (
  <section className="py-28 relative overflow-hidden">
    {/* Navy background */}
    <div className="absolute inset-0 bg-primary" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.8),transparent_70%)]" />

    <div className="container mx-auto px-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-[1.05] text-primary-foreground">
          In 5 Minuten eingerichtet.
          <br />
          Keine Kreditkarte.
        </h2>

        <p className="text-primary-foreground/70 max-w-md mx-auto mb-10 leading-relaxed">
          Jede offene Entscheidung kostet euer Unternehmen täglich Geld — macht diesen Verlust sichtbar, messbar und lösbar.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/auth">
            <Button size="xl" variant="secondary" className="rounded-full group shadow-lg">
              Kostenlos starten
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button variant="outline" size="xl" className="rounded-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
            Demo vereinbaren
          </Button>
        </div>

        <p className="mt-8 text-[12px] text-primary-foreground/40">
          Bereits von Teams in Finanz, Pharma und Scale-Ups genutzt.
        </p>
      </motion.div>
    </div>
  </section>
);

export default CTASection;

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Brain, ArrowRight, Sparkles, Users } from "lucide-react";
import type { Plan } from "./PricingData";

const ease = [0.16, 1, 0.3, 1] as const;

interface PricingCardProps {
  plan: Plan;
  annual: boolean;
  index: number;
}

const PricingCard = ({ plan, annual, index }: PricingCardProps) => {
  const price = plan.monthlyPrice === null
    ? null
    : annual
      ? plan.annualPrice
      : plan.monthlyPrice;

  const isMailto = plan.ctaLink.startsWith("mailto:");

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.08, duration: 0.7, ease }}
      className={`group relative rounded-2xl border p-6 transition-all duration-300 flex flex-col ${
        plan.highlighted
          ? "border-primary/30 bg-card shadow-glow"
          : "border-border bg-card hover:border-foreground/10"
      }`}
    >
      {plan.highlighted && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide">
            <Sparkles className="w-3 h-3" />
            Beliebteste Wahl
          </span>
        </div>
      )}

      <h3 className="text-lg font-bold mb-1">{plan.name}</h3>

      {/* Price */}
      <div className="mb-2 min-h-[44px]">
        {price === null ? (
          <span className="text-2xl font-bold gradient-text">Individuell</span>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={`${price}-${annual}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold tracking-tight tabular-nums"
            >
              {plan.name === "Enterprise" && "ab "}€{price}
            </motion.span>
            {price > 0 && (
              <span className="text-xs text-muted-foreground">
                {plan.name === "Enterprise" ? "/ Monat" : "pro Nutzer / Monat"}
              </span>
            )}
            {annual && plan.monthlyPrice !== null && plan.monthlyPrice > 0 && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-muted-foreground/50 line-through tabular-nums ml-1"
              >
                €{plan.monthlyPrice}
              </motion.span>
            )}
          </div>
        )}
      </div>

      {/* Min seats */}
      {plan.minSeats && (
        <div className="flex items-center gap-1.5 mb-3">
          <Users className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">
            Mindestens {plan.minSeats} Nutzer
          </span>
        </div>
      )}

      <p className="text-sm text-muted-foreground leading-relaxed mb-5">
        {plan.description}
      </p>

      {/* CTA */}
      {isMailto ? (
        <a href={plan.ctaLink}>
          <Button variant="outline" className="w-full rounded-xl mb-6 group/btn" size="lg">
            {plan.cta}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </a>
      ) : (
        <Link to={plan.ctaLink}>
          <Button
            variant={plan.ctaVariant === "hero" ? "default" : "outline"}
            className="w-full rounded-xl mb-6 group/btn"
            size="lg"
          >
            {plan.cta}
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      )}

      {/* Features */}
      <ul className="space-y-2 flex-1">
        {plan.features.map((feature, fi) => (
          <li key={fi} className="flex items-start gap-2 text-[13px]">
            {!feature.included ? (
              <X className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-0.5" />
            ) : feature.ai ? (
              <Brain className="w-3.5 h-3.5 text-accent-violet shrink-0 mt-0.5" />
            ) : (
              <Check className="w-3.5 h-3.5 text-accent-teal shrink-0 mt-0.5" />
            )}
            <span className={
              !feature.included
                ? "text-muted-foreground/50 line-through"
                : feature.ai
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
            }>
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {/* Ideal for */}
      <div className="mt-6 pt-4 border-t border-border/40">
        <p className="text-[11px] text-muted-foreground/70">
          <span className="font-semibold text-muted-foreground">👉 </span>
          {plan.idealFor}
        </p>
      </div>
    </motion.div>
  );
};

export default PricingCard;

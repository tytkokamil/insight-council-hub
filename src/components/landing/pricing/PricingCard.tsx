import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Brain, ArrowRight, Sparkles, Users, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Plan } from "./PricingData";

const ease = [0.16, 1, 0.3, 1] as const;

interface PricingCardProps {
  plan: Plan;
  annual: boolean;
  index: number;
}

const PricingCard = ({ plan, annual, index }: PricingCardProps) => {
  const { t } = useTranslation();
  const price = plan.monthlyPrice === null ? null : annual ? plan.annualPrice : plan.monthlyPrice;
  const isMailto = plan.ctaLink.startsWith("mailto:");

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), { stiffness: 200, damping: 20 });
  const glareX = useTransform(mouseX, [0, 1], [0, 100]);
  const glareY = useTransform(mouseY, [0, 1], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.12, duration: 0.8, ease }}
      className="group relative flex flex-col perspective-[1200px]"
    >
      {/* Animated gradient border glow for highlighted card */}
      {plan.highlighted && (
        <motion.div
          className="absolute -inset-[1px] rounded-2xl opacity-60 group-hover:opacity-100 blur-[1px] transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary)/0.4), hsl(var(--accent-violet)/0.3), hsl(var(--accent-teal)/0.3))",
            backgroundSize: "200% 200%",
          }}
          animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      )}

      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={`relative rounded-2xl border p-6 transition-all duration-500 flex flex-col flex-1 backdrop-blur-sm overflow-hidden ${
          plan.highlighted
            ? "border-primary/40 bg-card/95 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.15)]"
            : "border-border/60 bg-card/80 hover:border-foreground/15 hover:shadow-[0_8px_30px_-10px_hsl(var(--primary)/0.08)]"
        }`}
      >
        {/* Glare overlay */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: useTransform(
              [glareX, glareY],
              ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, hsl(var(--primary)/0.06) 0%, transparent 60%)`
            ),
          }}
        />

        {/* Popular badge with shimmer */}
        {plan.highlighted && (
          <motion.div
            className="mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5, ease }}
          >
            <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-primary text-primary-foreground tracking-wide overflow-hidden">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_infinite] -translate-x-full" />
              <Sparkles className="w-3 h-3 relative z-10" />
              <span className="relative z-10">{t("landing.pricing.popularBadge")}</span>
            </span>
          </motion.div>
        )}

        {/* Enterprise crown */}
        {plan.name === "Enterprise" && (
          <motion.div
            className="mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + 0.3, duration: 0.5, ease }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-accent-amber/10 text-accent-amber border border-accent-amber/20 tracking-wide">
              <Crown className="w-3 h-3" />
              Enterprise
            </span>
          </motion.div>
        )}

        <h3 className="text-lg font-bold mb-1">{plan.name}</h3>

        <div className="mb-2 min-h-[44px]">
          {price === null ? (
            <span className="text-2xl font-bold gradient-text">{t("landing.pricing.custom")}</span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <motion.span
                key={`${price}-${annual}`}
                initial={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease }}
                className="text-3xl font-bold tracking-tight tabular-nums"
              >
                {plan.name === t("landing.pricing.enterpriseName") && `${t("landing.pricing.from")} `}€{price}
              </motion.span>
              {price > 0 && (
                <span className="text-xs text-muted-foreground">{t("landing.pricing.perMonth")}</span>
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

        {plan.minSeats && (
          <div className="flex items-center gap-1.5 mb-3">
            <Users className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {t("landing.pricing.minSeats", { count: plan.minSeats })}
            </span>
          </div>
        )}

        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{plan.description}</p>

        {/* CTA Button */}
        {isMailto ? (
          <a href={plan.ctaLink}>
            <Button
              variant="outline"
              className="w-full rounded-xl mb-6 group/btn transition-all duration-300 hover:shadow-md"
              size="lg"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </a>
        ) : (
          <Link to={plan.ctaLink}>
            <Button
              variant={plan.ctaVariant === "hero" ? "default" : "outline"}
              className={`w-full rounded-xl mb-6 group/btn transition-all duration-300 ${
                plan.highlighted ? "hover:shadow-[0_4px_20px_-4px_hsl(var(--primary)/0.4)]" : "hover:shadow-md"
              }`}
              size="lg"
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </Link>
        )}

        {/* Feature list */}
        <ul className="space-y-2 flex-1">
          {plan.features.map((feature, fi) => (
            <motion.li
              key={fi}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 + fi * 0.03, duration: 0.4, ease }}
              className="flex items-start gap-2.5 text-[13px] group/feat"
            >
              {!feature.included ? (
                <X className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0 mt-0.5" />
              ) : feature.ai ? (
                <span className="relative shrink-0 mt-0.5">
                  <Brain className="w-3.5 h-3.5 text-accent-violet" />
                  <span className="absolute -inset-1 bg-accent-violet/10 rounded-full blur-sm group-hover/feat:bg-accent-violet/20 transition-colors" />
                </span>
              ) : (
                <span className="relative shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-accent-teal" />
                </span>
              )}
              <span
                className={
                  !feature.included
                    ? "text-muted-foreground/40 line-through"
                    : feature.ai
                    ? "text-foreground font-medium"
                    : "text-muted-foreground group-hover/feat:text-foreground transition-colors duration-200"
                }
              >
                {feature.label}
              </span>
            </motion.li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground/60">
            <span className="font-semibold text-muted-foreground/80">👉 </span>
            {plan.idealFor}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PricingCard;

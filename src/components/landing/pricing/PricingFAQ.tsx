import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { getFaqItems } from "./PricingData";
import { HelpCircle } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingFAQ = () => {
  const { t } = useTranslation();
  const faqItems = getFaqItems(t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.15, duration: 0.7, ease }}
      className="mt-20 max-w-2xl mx-auto"
    >
      <div className="text-center mb-8">
        <motion.div
          className="w-10 h-10 rounded-xl bg-accent-violet/10 border border-accent-violet/20 flex items-center justify-center mx-auto mb-4"
          whileHover={{ rotate: 15 }}
        >
          <HelpCircle className="w-5 h-5 text-accent-violet" />
        </motion.div>
        <h3 className="text-2xl font-bold tracking-tight">{t("landing.pricing.faqTitle")}</h3>
      </div>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {faqItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06, duration: 0.5, ease }}
          >
            <AccordionItem
              value={`faq-${i}`}
              className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm px-4 data-[state=open]:border-primary/20 data-[state=open]:bg-card/90 transition-all duration-300"
            >
              <AccordionTrigger className="text-sm font-medium text-left hover:no-underline py-4">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.div>
  );
};

export default PricingFAQ;

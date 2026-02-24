import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { getFaqItems } from "./PricingData";

const ease = [0.16, 1, 0.3, 1] as const;

const PricingFAQ = () => {
  const { t } = useTranslation();
  const faqItems = getFaqItems(t);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.7, ease }} className="mt-20 max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold tracking-tight text-center mb-8">{t("landing.pricing.faqTitle")}</h3>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-sm font-medium text-left">{item.question}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  );
};

export default PricingFAQ;

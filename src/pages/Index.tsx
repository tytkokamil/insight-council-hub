import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

import FeaturesSection from "@/components/landing/FeaturesSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import AIShowcaseSection from "@/components/landing/AIShowcaseSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import { useTranslation } from "react-i18next";

const faqJsonLd = (t: (k: string) => string) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": t("landing.pricing.faq1q"), "acceptedAnswer": { "@type": "Answer", "text": t("landing.pricing.faq1a") } },
    { "@type": "Question", "name": t("landing.pricing.faq2q"), "acceptedAnswer": { "@type": "Answer", "text": t("landing.pricing.faq2a") } },
    { "@type": "Question", "name": t("landing.pricing.faq3q"), "acceptedAnswer": { "@type": "Answer", "text": t("landing.pricing.faq3a") } },
    { "@type": "Question", "name": t("landing.pricing.faq4q"), "acceptedAnswer": { "@type": "Answer", "text": t("landing.pricing.faq4a") } },
    { "@type": "Question", "name": t("landing.pricing.faq5q"), "acceptedAnswer": { "@type": "Answer", "text": t("landing.pricing.faq5a") } },
    { "@type": "Question", "name": t("landing.pricing.faq6q"), "acceptedAnswer": { "@type": "Answer", "text": t("landing.pricing.faq6a") } },
  ],
});

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Decivio",
  "url": "https://decivio.com",
  "logo": "https://decivio.com/favicon.png",
  "sameAs": [],
  "contactPoint": { "@type": "ContactPoint", "email": "sales@decivio.com", "contactType": "sales" },
};

const Index = () => {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>Decision Platform — Entscheidungen sichtbar, messbar, lösbar</title>
        <meta name="description" content="Jede offene Entscheidung kostet Geld. Decision Platform macht Verzögerungskosten sichtbar, automatisiert Governance und liefert KI-gestützte Entscheidungsintelligenz. In 5 Minuten eingerichtet." />
        <meta name="keywords" content="Decision Management Software, Cost of Delay, Entscheidungs-Tool Unternehmen, NIS2 Dokumentation, Decision Intelligence Platform" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd(t))}</script>
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          {/* Section order per ENDSTAND doc page 17 */}
          <HeroSection />          {/* 2: Hero */}
          <StatsSection />         {/* 3: Social Proof Bar */}
          <ProblemSection />       {/* 4: Pain Section */}
          <HowItWorksSection />    {/* 5: How It Works */}
          <FeaturesSection />      {/* 6: Core Features */}
          <UseCasesSection />      {/* 7: Use Cases */}
          <AIShowcaseSection />    {/* 8: KI-Showcase */}
          <TestimonialsSection />  {/* 9: Testimonials */}
          <PricingSection />       {/* 10: Pricing */}
          <CTASection />           {/* 11: Final CTA */}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

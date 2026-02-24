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

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Decision Platform — Entscheidungen sichtbar, messbar, lösbar</title>
        <meta name="description" content="Jede offene Entscheidung kostet Geld. Decision Platform macht Verzögerungskosten sichtbar, automatisiert Governance und liefert KI-gestützte Entscheidungsintelligenz. In 5 Minuten eingerichtet." />
        <meta name="keywords" content="Decision Management Software, Cost of Delay, Entscheidungs-Tool Unternehmen, NIS2 Dokumentation, Decision Intelligence Platform" />
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

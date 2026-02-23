import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Decivio — Executive Decision Governance Platform</title>
        <meta name="description" content="Die Governance-Plattform für Entscheidungen in wachsenden Unternehmen. SLA-Tracking, Eskalation, Risk Scoring und Executive Dashboards — für Führungsteams mit 100–500 Mitarbeitern." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <ProblemSection />
          <HowItWorksSection />
          <BenefitsSection />
          <UseCasesSection />
          <TestimonialsSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;

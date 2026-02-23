import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import AIShowcaseSection from "@/components/landing/AIShowcaseSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Decivio — Decision Governance Platform</title>
        <meta name="description" content="Die Governance-Plattform für Entscheidungen in wachsenden Unternehmen. KI-Risikoanalyse, SLA-Tracking, Eskalation und Executive Dashboards." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <StatsSection />
          <ProblemSection />
          <HowItWorksSection />
          <BenefitsSection />
          <FeaturesSection />
          <AIShowcaseSection />
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

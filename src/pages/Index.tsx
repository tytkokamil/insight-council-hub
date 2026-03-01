import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import IndustriesSection from "@/components/landing/IndustriesSection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import ROICalculatorSection from "@/components/landing/ROICalculatorSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

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
  return (
    <>
      <Helmet>
        <title>Decivio — Decision Governance Platform</title>
        <meta name="description" content="Jede offene Entscheidung kostet Geld. Decivio macht Verzögerungskosten sichtbar, automatisiert Governance und liefert KI-gestützte Entscheidungsintelligenz." />
        <meta name="keywords" content="Decision Management, Cost of Delay, Entscheidungs-Tool, NIS2, Decision Intelligence, Governance" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
      </Helmet>
      <div className="landing-page min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <ProblemSection />
          <SolutionSection />
          <IndustriesSection />
          <ComplianceSection />
          <ROICalculatorSection />
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

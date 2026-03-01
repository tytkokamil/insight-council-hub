import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import LogoBar from "@/components/landing/LogoBar";
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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Was ist Decivio?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio ist eine Decision Governance Platform, die Entscheidungen in Unternehmen sichtbar, messbar und compliance-konform macht. Mit Echtzeit-Cost-of-Delay-Tracking, KI-gestützten Briefings und kryptographischem Audit Trail." },
    },
    {
      "@type": "Question",
      "name": "Für welche Unternehmen ist Decivio geeignet?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio richtet sich an Unternehmen mit 20–500 Mitarbeitern aus Branchen wie Maschinenbau, Automotive, Pharma, Finanzdienstleistungen und IT-Dienstleistungen." },
    },
    {
      "@type": "Question",
      "name": "Ist Decivio DSGVO-konform?",
      "acceptedAnswer": { "@type": "Answer", "text": "Ja. Alle Daten werden auf Servern in Deutschland gehostet (ISO 27001 zertifiziert). Ein Auftragsverarbeitungsvertrag (AVV) ist inklusive." },
    },
    {
      "@type": "Question",
      "name": "Welche Compliance-Frameworks unterstützt Decivio?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio unterstützt NIS2, ISO 9001, IATF 16949, GMP/FDA 21 CFR Part 11, MaRisk, DSGVO, VOB/VgV, Solvency II und den EU AI Act mit branchenspezifischen Templates." },
    },
    {
      "@type": "Question",
      "name": "Was kostet Decivio?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio bietet einen kostenlosen Plan (1 Nutzer, 10 Entscheidungen), Professional für €149/Monat (bis 25 Nutzer) und individuelle Enterprise-Pläne. Alle Pläne mit 14 Tagen kostenloser Testphase." },
    },
  ],
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Decivio Decision Governance Platform",
  "description": "Governance-Plattform für Entscheidungen in Unternehmen. Cost-of-Delay-Tracking, KI Briefings, Compliance Audit Trail.",
  "brand": { "@type": "Brand", "name": "Decivio" },
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "EUR",
    "lowPrice": "0",
    "highPrice": "149",
    "offerCount": "3",
  },
};

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Decivio — Decision Governance Platform</title>
        <meta name="description" content="Jede offene Entscheidung kostet Geld. Decivio macht Verzögerungskosten sichtbar, automatisiert Governance und liefert KI-gestützte Entscheidungsintelligenz." />
        <meta name="keywords" content="Decision Management, Cost of Delay, Entscheidungs-Tool, NIS2, Decision Intelligence, Governance, ISO 9001, DSGVO" />
        <link rel="canonical" href="https://decivio.com" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>
      <div className="landing-page min-h-screen">
        <Navbar />
        <main>
          <HeroSection />
          <StatsSection />
          <LogoBar />
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

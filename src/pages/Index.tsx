import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoBar from "@/components/landing/LogoBar";
import ProblemSection from "@/components/landing/ProblemSection";
import SolutionSection from "@/components/landing/SolutionSection";
import IndustriesSection from "@/components/landing/IndustriesSection";
import ComplianceSection from "@/components/landing/ComplianceSection";
import ROICalculatorSection from "@/components/landing/ROICalculatorSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import ScrollProgress from "@/components/landing/ScrollProgress";
import StickyCTA from "@/components/landing/StickyCTA";
import BackToTop from "@/components/landing/BackToTop";
import ComparisonSection from "@/components/landing/ComparisonSection";
import VideoSection from "@/components/landing/VideoSection";

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
      "name": "Was genau ist Decivio?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio ist eine Decision Governance Platform, die alle offenen Entscheidungen in Ihrem Unternehmen sichtbar macht, Verzögerungskosten in Echtzeit berechnet und Compliance-Anforderungen automatisch dokumentiert — mit kryptographischem Audit Trail." },
    },
    {
      "@type": "Question",
      "name": "Für welche Unternehmensgröße ist Decivio geeignet?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio richtet sich an Unternehmen mit 20 bis 500 Mitarbeitern. Besonders geeignet für Mittelständler aus Maschinenbau, Automotive, Pharma, Finanzdienstleistungen und IT-Dienstleistungen." },
    },
    {
      "@type": "Question",
      "name": "Wie schnell kann ich starten?",
      "acceptedAnswer": { "@type": "Answer", "text": "In unter 3 Minuten. Registrieren, Branche wählen, erste Entscheidung anlegen. Kein IT-Projekt, keine Installation, keine Kreditkarte." },
    },
    {
      "@type": "Question",
      "name": "Ist Decivio DSGVO-konform?",
      "acceptedAnswer": { "@type": "Answer", "text": "Ja. Alle Daten werden auf ISO 27001-zertifizierten Servern in Deutschland gehostet. Ein Auftragsverarbeitungsvertrag (AVV) ist in jedem Plan inklusive. Wir verarbeiten keine Daten außerhalb der EU." },
    },
    {
      "@type": "Question",
      "name": "Welche Compliance-Frameworks werden unterstützt?",
      "acceptedAnswer": { "@type": "Answer", "text": "Decivio unterstützt NIS2, ISO 9001, IATF 16949, GMP/FDA 21 CFR Part 11, MaRisk, DSGVO, VOB/VgV, Solvency II und den EU AI Act — mit branchenspezifischen Vorlagen und automatischer Dokumentation." },
    },
    {
      "@type": "Question",
      "name": "Was kostet Decivio?",
      "acceptedAnswer": { "@type": "Answer", "text": "Es gibt einen kostenlosen Plan für Einzelpersonen (1 Nutzer, 10 Entscheidungen). Professional kostet €149/Monat für bis zu 25 Nutzer. Enterprise-Pläne sind individuell. Alle Pläne mit 14 Tagen kostenloser Testphase — keine Kreditkarte nötig." },
    },
    {
      "@type": "Question",
      "name": "Wie funktioniert der KI Daily Brief?",
      "acceptedAnswer": { "@type": "Answer", "text": "Jeden Morgen analysiert unsere KI Ihre offenen Entscheidungen und erstellt ein Executive Briefing: Die 3 kritischsten Entscheidungen, SLA-Warnungen, Economic Exposure und empfohlene Sofort-Maßnahmen — in 30 Sekunden erfassbar." },
    },
    {
      "@type": "Question",
      "name": "Kann ich Decivio mit meinen bestehenden Tools verbinden?",
      "acceptedAnswer": { "@type": "Answer", "text": "Ja. Decivio bietet Webhooks, Microsoft Teams-Integration, E-Mail-basierte Workflows (One-Click Approval) und eine API für individuelle Anbindungen." },
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
        <ScrollProgress />
        <Navbar />
        <main>
          <HeroSection />
          <LogoBar />
          <ProblemSection />
          <SolutionSection />
          <VideoSection />
          <ComparisonSection />
          <IndustriesSection />
          <ComplianceSection />
          <ROICalculatorSection />
          <TestimonialsSection />
          <FAQSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
        <StickyCTA />
        <BackToTop />
      </div>
    </>
  );
};

export default Index;

import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoBar from "@/components/landing/LogoBar";
import ScrollProgress from "@/components/landing/ScrollProgress";
import SectionDivider from "@/components/landing/SectionDivider";
import Footer from "@/components/landing/Footer";
import CursorGlow from "@/components/landing/CursorGlow";

// Lazy load below-fold sections for better initial load
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const SolutionSection = lazy(() => import("@/components/landing/SolutionSection"));
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const MetricsShowcase = lazy(() => import("@/components/landing/MetricsShowcase"));
const ComparisonSection = lazy(() => import("@/components/landing/ComparisonSection"));
const BeforeAfterTimeline = lazy(() => import("@/components/landing/BeforeAfterTimeline"));
const AIShowcaseSection = lazy(() => import("@/components/landing/AIShowcaseSection"));
const IndustriesSection = lazy(() => import("@/components/landing/IndustriesSection"));
const ComplianceSection = lazy(() => import("@/components/landing/ComplianceSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const ROICalculatorSection = lazy(() => import("@/components/landing/ROICalculatorSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const StickyCTA = lazy(() => import("@/components/landing/StickyCTA"));
const BackToTop = lazy(() => import("@/components/landing/BackToTop"));
const ScarcityBar = lazy(() => import("@/components/landing/ScarcityBar"));
const SalesChatbot = lazy(() => import("@/components/landing/SalesChatbot"));

const SectionFallback = () => <div className="py-24" aria-hidden="true" />;

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Decivio",
  "url": "https://decivio.com",
  "logo": "https://decivio.com/favicon.png",
  "description": "Decision Governance Platform für den Mittelstand",
  "sameAs": [],
  "contactPoint": { "@type": "ContactPoint", "email": "hallo@decivio.com", "contactType": "sales", "availableLanguage": ["German", "English"] },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "DE"
  }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Was genau ist Decivio?", "acceptedAnswer": { "@type": "Answer", "text": "Decivio ist eine Decision Governance Platform, die alle offenen Entscheidungen in Ihrem Unternehmen sichtbar macht, Verzögerungskosten in Echtzeit berechnet und Compliance-Anforderungen automatisch dokumentiert — mit kryptographischem Audit Trail." } },
    { "@type": "Question", "name": "Für welche Unternehmensgröße ist Decivio geeignet?", "acceptedAnswer": { "@type": "Answer", "text": "Decivio richtet sich an Unternehmen mit 20 bis 500 Mitarbeitern. Besonders geeignet für Mittelständler aus Maschinenbau, Automotive, Pharma, Finanzdienstleistungen und IT-Dienstleistungen." } },
    { "@type": "Question", "name": "Wie schnell kann ich starten?", "acceptedAnswer": { "@type": "Answer", "text": "In unter 3 Minuten. Registrieren, Branche wählen, erste Entscheidung anlegen. Kein IT-Projekt, keine Installation, keine Kreditkarte." } },
    { "@type": "Question", "name": "Ist Decivio DSGVO-konform?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Alle Daten werden auf ISO 27001-zertifizierten Servern in Deutschland gehostet. Ein Auftragsverarbeitungsvertrag (AVV) ist in jedem Plan inklusive. Wir verarbeiten keine Daten außerhalb der EU." } },
    { "@type": "Question", "name": "Welche Compliance-Frameworks werden unterstützt?", "acceptedAnswer": { "@type": "Answer", "text": "Decivio unterstützt NIS2, ISO 9001, IATF 16949, GMP/FDA 21 CFR Part 11, MaRisk, DSGVO, VOB/VgV, Solvency II und den EU AI Act — mit branchenspezifischen Vorlagen und automatischer Dokumentation." } },
    { "@type": "Question", "name": "Was kostet Decivio?", "acceptedAnswer": { "@type": "Answer", "text": "Es gibt einen kostenlosen Plan für Einzelpersonen (1 Nutzer, 10 Entscheidungen). Professional kostet €149/Monat für bis zu 25 Nutzer. Enterprise-Pläne sind individuell. Alle Pläne mit 14 Tagen kostenloser Testphase — keine Kreditkarte nötig." } },
    { "@type": "Question", "name": "Wie funktioniert der KI Daily Brief?", "acceptedAnswer": { "@type": "Answer", "text": "Jeden Morgen analysiert unsere KI Ihre offenen Entscheidungen und erstellt ein Executive Briefing: Die 3 kritischsten Entscheidungen, SLA-Warnungen, Economic Exposure und empfohlene Sofort-Maßnahmen — in 30 Sekunden erfassbar." } },
    { "@type": "Question", "name": "Kann ich Decivio mit meinen bestehenden Tools verbinden?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Decivio bietet Webhooks, Microsoft Teams-Integration, E-Mail-basierte Workflows (One-Click Approval) und eine API für individuelle Anbindungen." } },
  ],
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Decivio Decision Governance Platform",
  "description": "Governance-Plattform für Entscheidungen in Unternehmen. Cost-of-Delay-Tracking, KI Briefings, Compliance Audit Trail.",
  "brand": { "@type": "Brand", "name": "Decivio" },
  "offers": { "@type": "AggregateOffer", "priceCurrency": "EUR", "lowPrice": "0", "highPrice": "149", "offerCount": "3" },
};

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Decivio — Decision Governance Platform für den Mittelstand</title>
        <meta name="description" content="Jede offene Entscheidung kostet Ihr Unternehmen Geld. Decivio macht Verzögerungskosten sichtbar, automatisiert Governance und liefert KI-Entscheidungsintelligenz. 14 Tage kostenlos." />
        <meta name="keywords" content="Decision Management, Cost of Delay, Entscheidungs-Tool, NIS2, Decision Intelligence, Governance, ISO 9001, DSGVO, Mittelstand" />
        <link rel="canonical" href="https://decivio.com" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(productJsonLd)}</script>
      </Helmet>
      <div className="landing-page min-h-screen relative">
        <CursorGlow />
        <ScrollProgress />
        <Navbar />
        <main>
          <HeroSection />
          <LogoBar />
          <SectionDivider />
          <Suspense fallback={<SectionFallback />}>
            <ProblemSection />
            <SolutionSection />
            <SectionDivider />
            <ProductShowcase />
            <MetricsShowcase />
            <SectionDivider />
            <BeforeAfterTimeline />
            <ComparisonSection />
            <AIShowcaseSection />
            <IndustriesSection />
            <ComplianceSection />
            <SectionDivider />
            <TestimonialsSection />
            <ROICalculatorSection />
            <SectionDivider />
            <PricingSection />
            <FAQSection />
            <CTASection />
          </Suspense>
        </main>
        <Footer />
        <Suspense fallback={null}>
          <ScarcityBar />
          <SalesChatbot />
          <StickyCTA />
          <BackToTop />
        </Suspense>
      </div>
    </>
  );
};

export default Index;

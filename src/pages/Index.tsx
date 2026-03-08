import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ScarcityBar from "@/components/landing/ScarcityBar";

const SocialProofBar = lazy(() => import("@/components/landing/SocialProofBar"));
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const SolutionSection = lazy(() => import("@/components/landing/SolutionSection"));
const BeforeAfterSection = lazy(() => import("@/components/landing/BeforeAfterSection"));
const ROICalculatorSection = lazy(() => import("@/components/landing/ROICalculatorSection"));
const ProductShowcase = lazy(() => import("@/components/landing/ProductShowcase"));
const RolesSection = lazy(() => import("@/components/landing/RolesSection"));
const IndustriesSection = lazy(() => import("@/components/landing/IndustriesSection"));
const ComplianceSection = lazy(() => import("@/components/landing/ComplianceSection"));
const ComparisonSection = lazy(() => import("@/components/landing/ComparisonSection"));
const AIShowcaseSection = lazy(() => import("@/components/landing/AIShowcaseSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const CTASection = lazy(() => import("@/components/landing/CTASection"));
const Footer = lazy(() => import("@/components/landing/Footer"));
const SalesChatbot = lazy(() => import("@/components/landing/SalesChatbot"));
const StickyCTA = lazy(() => import("@/components/landing/StickyCTA"));
const BackToTop = lazy(() => import("@/components/landing/BackToTop"));

const SectionFallback = () => <div className="py-24" aria-hidden="true" />;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Was ist Decivio?", "acceptedAnswer": { "@type": "Answer", "text": "Decivio ist eine Decision Governance Platform die Entscheidungskosten sichtbar macht, Compliance dokumentiert und Freigaben beschleunigt." } },
    { "@type": "Question", "name": "Ist Decivio DSGVO-konform?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Server in Deutschland. AVV in allen Plänen inklusive." } },
    { "@type": "Question", "name": "Was kostet Decivio?", "acceptedAnswer": { "@type": "Answer", "text": "Free €0, Starter €59/Mo, Professional €149/Mo, Enterprise ab €499/Mo. 14 Tage kostenlos." } },
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Decivio",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Decision Governance Platform für den deutschen Mittelstand",
  "offers": [
    { "@type": "Offer", "price": "0", "priceCurrency": "EUR", "name": "Free" },
    { "@type": "Offer", "price": "59", "priceCurrency": "EUR", "name": "Starter" },
    { "@type": "Offer", "price": "149", "priceCurrency": "EUR", "name": "Professional" },
  ],
  "availableLanguage": ["de", "en"],
  "featureList": "Cost-of-Delay Tracking, SHA-256 Audit Trail, One-Click Email Approval, KI Daily Brief, 15 Branchen-Templates",
};

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Decivio — Decision Governance Platform für den deutschen Mittelstand</title>
        <meta name="description" content="Offene Entscheidungen kosten Geld. Decivio macht Verzögerungskosten in Echtzeit sichtbar, erzwingt Compliance und dokumentiert jeden Schritt mit SHA-256 Audit Trail. DSGVO-konform. Server in Deutschland." />
        <meta name="keywords" content="Decision Governance, Entscheidungsmanagement, Mittelstand, ISO 9001, IATF, NIS2, Cost of Delay, Audit Trail, DSGVO, Maschinenbau, Automotive, Pharma" />
        <link rel="canonical" href="https://app.decivio.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Decivio — Decision Governance für den Mittelstand" />
        <meta property="og:description" content="Verzögerungskosten sichtbar machen, Compliance sichern, Freigaben beschleunigen." />
        <meta property="og:url" content="https://app.decivio.com/" />
        <meta property="og:locale" content="de_DE" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(softwareJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <div className="landing-page min-h-screen">
        <ScarcityBar />
        <Navbar />
        <main>
          <HeroSection />
          <Suspense fallback={<SectionFallback />}>
            <SocialProofBar />
            <ProblemSection />
            <SolutionSection />
            <BeforeAfterSection />
            <ROICalculatorSection />
            <ProductShowcase />
            <RolesSection />
            <IndustriesSection />
            <ComplianceSection />
            <ComparisonSection />
            <AIShowcaseSection />
            <PricingSection />
            <FAQSection />
            <CTASection />
          </Suspense>
        </main>
        <Suspense fallback={null}>
          <Footer />
          <SalesChatbot />
          <StickyCTA />
          <BackToTop />
        </Suspense>
      </div>
    </>
  );
};

export default Index;

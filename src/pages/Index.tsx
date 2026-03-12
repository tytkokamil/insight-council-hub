import { lazy, Suspense } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoBar from "@/components/landing/LogoBar";
import SectionDivider from "@/components/landing/SectionDivider";
import Footer from "@/components/landing/Footer";
import CursorGlow from "@/components/landing/CursorGlow";
import ScarcityBar from "@/components/landing/ScarcityBar";

const FoundingSection = lazy(() => import("@/components/landing/FoundingSection"));
const ProblemSection = lazy(() => import("@/components/landing/ProblemSection"));
const SolutionSection = lazy(() => import("@/components/landing/SolutionSection"));
const BeforeAfterTimeline = lazy(() => import("@/components/landing/BeforeAfterTimeline"));
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
const StickyCTA = lazy(() => import("@/components/landing/StickyCTA"));
const BackToTop = lazy(() => import("@/components/landing/BackToTop"));
const SalesChatbot = lazy(() => import("@/components/landing/SalesChatbot"));

const SectionFallback = () => <div className="py-24" aria-hidden="true" />;

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Decivio",
  "url": "https://app.decivio.com",
  "logo": "https://app.decivio.com/favicon.png",
  "description": "Decision Governance Platform für den deutschen Mittelstand",
  "contactPoint": { "@type": "ContactPoint", "email": "hallo@decivio.com", "contactType": "sales", "availableLanguage": ["German", "English"] },
  "address": { "@type": "PostalAddress", "addressCountry": "DE" }
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Was ist Decivio — und was unterscheidet es von Monday oder Jira?", "acceptedAnswer": { "@type": "Answer", "text": "Monday.com und Jira sind Projektmanagement-Tools — sie verwalten Tasks, Projekte und Sprints. Decivio löst ein anderes Problem: Wer entscheidet was, wann, warum — und was kostet es wenn die Entscheidung nicht fällt?" } },
    { "@type": "Question", "name": "Für welche Unternehmensgrößen ist Decivio geeignet?", "acceptedAnswer": { "@type": "Answer", "text": "Starter ist ab 2 Personen sinnvoll. Professional ist optimiert für Teams von 5–25 Personen. Enterprise für Konzerne mit SSO-Pflicht, Custom Branding oder On-Premise-Bedarf." } },
    { "@type": "Question", "name": "Wie lange dauert der Einstieg wirklich?", "acceptedAnswer": { "@type": "Answer", "text": "Branche auswählen → erste Entscheidung anlegen → Reviewer einladen. Das Onboarding ist auf unter 5 Minuten ausgelegt." } },
    { "@type": "Question", "name": "Ist Decivio DSGVO-konform? Wo liegen die Daten?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Server in Deutschland (EU-Region Frankfurt). AVV in allen Plänen inklusive. Datenexport nach Art. 20 und Datenlöschung nach Art. 17 direkt verfügbar." } },
    { "@type": "Question", "name": "Können externe Partner ohne Account genehmigen?", "acceptedAnswer": { "@type": "Answer", "text": "Ja. Externe Reviewer erhalten einen sicheren Token-Link per E-Mail. Keine Registrierung nötig. Alle Aktionen im Audit Trail." } },
    { "@type": "Question", "name": "Was genau ist der SHA-256 Audit Trail?", "acceptedAnswer": { "@type": "Answer", "text": "Jede Änderung wird als Hash-verketteter Audit-Log-Eintrag gespeichert. Nachträgliche Änderungen sind mathematisch erkennbar." } },
    { "@type": "Question", "name": "Was kostet das Founding Program?", "acceptedAnswer": { "@type": "Answer", "text": "Professional für €89/Mo statt €149 — lebenslang fixiert. Nur für die ersten 20 Founding Customers." } },
    { "@type": "Question", "name": "Gibt es eine Mindestlaufzeit oder Kündigungsfrist?", "acceptedAnswer": { "@type": "Answer", "text": "Nein. Monatliche Zahlung jederzeit kündbar. Jährlich spart 17%." } },
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
        <meta name="description" content="Offene Entscheidungen kosten Geld. Decivio macht Verzögerungskosten sichtbar, erzwingt Compliance und dokumentiert jeden Schritt mit SHA-256 Audit Trail. DSGVO-konform. Server in Deutschland." />
        <meta name="keywords" content="Decision Governance, Entscheidungsmanagement, Mittelstand, ISO 9001, IATF, NIS2, Cost of Delay, Audit Trail, DSGVO, Maschinenbau, Automotive, Pharma" />
        <link rel="canonical" href="https://app.decivio.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="de_DE" />
        <meta property="og:title" content="Decivio — Decision Governance für den Mittelstand" />
        <meta property="og:description" content="Verzögerungskosten sichtbar machen, Compliance sichern, Freigaben beschleunigen." />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify(orgJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(softwareJsonLd)}</script>
      </Helmet>
      <div className="landing-page min-h-screen relative">
        <CursorGlow />
        <ScarcityBar />
        <Navbar />
        <main>
          {/* ── Dark zone: seamless dark background ── */}
          <HeroSection />
          <Suspense fallback={<SectionFallback />}>
            <FoundingSection />
          </Suspense>
          <LogoBar />

          {/* ── Content zone: themed background ── */}
          <Suspense fallback={<SectionFallback />}>
            <ProblemSection />
            <SolutionSection />
            <SectionDivider />
            <BeforeAfterTimeline />
            <ROICalculatorSection />
            <SectionDivider />
            <ProductShowcase />
            <RolesSection />
            <IndustriesSection />
            <ComplianceSection />
            <SectionDivider />
            <ComparisonSection />
            <AIShowcaseSection />
            <SectionDivider />
            <PricingSection />
            <FAQSection />
            <CTASection />
          </Suspense>
        </main>
        <Footer />
        <Suspense fallback={null}>
          <SalesChatbot />
          <StickyCTA />
          <BackToTop />
        </Suspense>
      </div>
    </>
  );
};

export default Index;

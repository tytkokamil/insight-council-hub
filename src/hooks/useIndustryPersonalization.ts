import { useState, useEffect } from "react";

/** Prompt 37 — Dynamic industry personalization
 *  Reads ?branche= param or localStorage to serve industry-specific copy. */

export type IndustryKey =
  | "maschinenbau"
  | "automotive"
  | "pharma"
  | "finanz"
  | "it"
  | "bau"
  | null;

interface IndustryCopy {
  key: IndustryKey;
  label: string;
  heroSub: string;
  painPoint: string;
  framework: string;
  useCase: string;
}

const industryMap: Record<string, IndustryCopy> = {
  maschinenbau: {
    key: "maschinenbau",
    label: "Maschinenbau",
    heroSub: "ECOs, Investitionsfreigaben und Projektmeilensteine — strukturiert, nachvollziehbar, compliant.",
    painPoint: "Blockierte Engineering Change Orders kosten Ø €47.000 pro Monat.",
    framework: "ISO 9001",
    useCase: "Engineering Change Order",
  },
  automotive: {
    key: "automotive",
    label: "Automotive",
    heroSub: "PPAP, 8D-Reports und Änderungsmanagement — lückenlos dokumentiert nach IATF 16949.",
    painPoint: "Verzögerte Freigaben verursachen Bandstillstände mit Ø €120.000/Tag.",
    framework: "IATF 16949",
    useCase: "PPAP-Dokumentation",
  },
  pharma: {
    key: "pharma",
    label: "Pharma & Life Sciences",
    heroSub: "Change Control, CAPA und Deviation-Handling — FDA- und GMP-konform.",
    painPoint: "Nicht-dokumentierte Abweichungen gefährden Ihre Zulassung.",
    framework: "GMP / FDA 21 CFR Part 11",
    useCase: "Change-Control-Prozess",
  },
  finanz: {
    key: "finanz",
    label: "Finanzdienstleister",
    heroSub: "Kreditentscheidungen, Risikoakzeptanz und Vier-Augen-Prinzip — MaRisk-konform.",
    painPoint: "Verzögerte Kreditentscheidungen kosten Zinsmarge und Kundenvertrauen.",
    framework: "MaRisk / BaFin",
    useCase: "Kreditvergabe-Prozess",
  },
  it: {
    key: "it",
    label: "IT & Software",
    heroSub: "Architecture Decision Records, Security Reviews und Release-Management — NIS2-ready.",
    painPoint: "Undokumentierte Architekturentscheidungen explodieren als Tech-Debt.",
    framework: "NIS2 / ISO 27001",
    useCase: "Architecture Decision Record",
  },
  bau: {
    key: "bau",
    label: "Bau & Industrie",
    heroSub: "Nachtragsmanagement, Subunternehmer-Freigaben und Bauabnahmen — VOB-konform.",
    painPoint: "Verzögerte Freigaben verschieben Bauprojekte um Wochen.",
    framework: "VOB/B",
    useCase: "Nachtragsmanagement",
  },
};

export function useIndustryPersonalization(): IndustryCopy | null {
  const [industry, setIndustry] = useState<IndustryCopy | null>(null);

  useEffect(() => {
    // 1. Check URL param
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("branche");
    if (fromUrl && industryMap[fromUrl]) {
      localStorage.setItem("decivio-industry", fromUrl);
      setIndustry(industryMap[fromUrl]);
      return;
    }

    // 2. Check localStorage
    const stored = localStorage.getItem("decivio-industry");
    if (stored && industryMap[stored]) {
      setIndustry(industryMap[stored]);
      return;
    }

    // 3. No personalization
    setIndustry(null);
  }, []);

  return industry;
}

export { industryMap };

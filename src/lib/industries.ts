export interface Industry {
  id: string;
  icon: string;
  name: string;
  description: string;
}

export const industries: Industry[] = [
  { id: "maschinenbau", icon: "🏭", name: "Maschinenbau & Industrie", description: "Projektfreigaben, ECOs, Maschinenabnahmen" },
  { id: "pharma", icon: "💊", name: "Pharma & Life Sciences", description: "Change Control, CAPA, Batch-Freigaben" },
  { id: "bau", icon: "🏗️", name: "Baubranche & Immobilien", description: "Nachtragsfreigaben, Subunternehmer, Abnahmen" },
  { id: "finanzen", icon: "🏦", name: "Finanzdienstleister & Banken", description: "Kreditentscheidungen, Compliance, Risikoakzeptanz" },
  { id: "it", icon: "💻", name: "IT & Software", description: "ADRs, Release-Freigaben, Security Patches" },
  { id: "handel", icon: "🛒", name: "Handel & E-Commerce", description: "Sortiment, Lieferanten, Kampagnen" },
  { id: "healthcare", icon: "🏥", name: "Healthcare & Krankenhäuser", description: "Geräteinvestitionen, Protokolländerungen" },
  { id: "automotive", icon: "🚗", name: "Automotive & Zulieferer", description: "PPAP, 8D-Reports, Änderungsmanagement" },
  { id: "energie", icon: "⚡", name: "Energie & Versorgung", description: "Netzinvestitionen, KRITIS, NIS2" },
  { id: "oeffentlich", icon: "🏛️", name: "Öffentlicher Sektor & Behörden", description: "Vergabeentscheidungen, Fördermittel" },
  { id: "lebensmittel", icon: "🌾", name: "Lebensmittel & Agrar", description: "Rohstofffreigaben, Rückruf, HACCP" },
  { id: "versicherungen", icon: "🛡️", name: "Versicherungen", description: "Schadenregulierung, Produktfreigaben" },
  { id: "bildung", icon: "📚", name: "Bildung & Weiterbildung", description: "Lehrgänge, IT-Plattformen, Kooperationen" },
  { id: "nonprofit", icon: "🤝", name: "Non-Profit & NGOs", description: "Projektmittel, Fördermittelanträge" },
  { id: "allgemein", icon: "🔧", name: "Andere / Allgemein", description: "Allgemeine Entscheidungs-Vorlagen" },
];

export function getIndustryById(id: string | null | undefined): Industry | undefined {
  return industries.find(i => i.id === id);
}

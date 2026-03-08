import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Building2, Users, Clock, DollarSign, TrendingUp, BarChart3, CheckCircle2, ArrowRight, Mail, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { industries } from "@/lib/industries";
import { addPdfHeader, addPdfFooter } from "@/lib/pdfBranding";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import decivioLogo from "@/assets/decivio-logo.png";

/* ══════════════════════════════════════════════════════════════
 *  TYPES & DEFAULTS
 * ══════════════════════════════════════════════════════════════ */
interface FormData {
  companyName: string;
  industry: string;
  employees: number;
  decisionsPerMonth: number;
  personsPerDecision: number;
  hourlyRate: number;
  currentDelayDays: number;
  targetReduction: number; // 0-100%
}

const DEFAULTS: FormData = {
  companyName: "",
  industry: "maschinenbau",
  employees: 150,
  decisionsPerMonth: 25,
  personsPerDecision: 4,
  hourlyRate: 85,
  currentDelayDays: 8,
  targetReduction: 80,
};

/* ══════════════════════════════════════════════════════════════
 *  ROI CALCULATIONS
 * ══════════════════════════════════════════════════════════════ */
function calculateRoi(d: FormData) {
  const monthlyCost = (d.hourlyRate * 8 * d.personsPerDecision * d.decisionsPerMonth * d.currentDelayDays) / 4.3;
  const reducedDays = d.currentDelayDays * (1 - d.targetReduction / 100);
  const newMonthlyCost = (d.hourlyRate * 8 * d.personsPerDecision * d.decisionsPerMonth * reducedDays) / 4.3;
  const monthlySavings = monthlyCost - newMonthlyCost;
  const annualSavings = monthlySavings * 12;

  // Plan recommendation
  let planName = "Professional";
  let planPrice = 149;
  if (d.employees <= 10) { planName = "Starter"; planPrice = 59; }
  else if (d.employees > 100) { planName = "Enterprise"; planPrice = 499; }

  const roiPercent = planPrice > 0 ? Math.round((annualSavings / (planPrice * 12)) * 100) : 0;
  const amortWeeks = monthlySavings > 0 ? Math.max(1, Math.round((planPrice / monthlySavings) * 4.3)) : 0;

  // Per-category breakdown (simulated distribution)
  const categories = [
    { name: "Strategische Entscheidungen", share: 0.25, avgDelay: d.currentDelayDays * 1.5 },
    { name: "Operative Entscheidungen", share: 0.35, avgDelay: d.currentDelayDays * 0.8 },
    { name: "Investitionsentscheidungen", share: 0.20, avgDelay: d.currentDelayDays * 1.8 },
    { name: "Compliance-Entscheidungen", share: 0.12, avgDelay: d.currentDelayDays * 1.2 },
    { name: "HR-/Team-Entscheidungen", share: 0.08, avgDelay: d.currentDelayDays * 0.6 },
  ].map(c => ({
    ...c,
    count: Math.round(d.decisionsPerMonth * c.share),
    cost: Math.round(monthlyCost * c.share),
    savings: Math.round(monthlySavings * c.share),
  }));

  // Industry benchmarks (simulated)
  const industryAvgDelay = Math.round(d.currentDelayDays * 1.3);

  return {
    monthlyCost: Math.round(monthlyCost),
    newMonthlyCost: Math.round(newMonthlyCost),
    monthlySavings: Math.round(monthlySavings),
    annualSavings: Math.round(annualSavings),
    roiPercent,
    amortWeeks,
    planName,
    planPrice,
    categories,
    industryAvgDelay,
    reducedDays: Math.round(reducedDays * 10) / 10,
  };
}

/* ══════════════════════════════════════════════════════════════
 *  PDF GENERATION
 * ══════════════════════════════════════════════════════════════ */
function generatePdf(form: FormData, roi: ReturnType<typeof calculateRoi>) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const ind = industries.find(i => i.id === form.industry);
  const fmt = (n: number) => n.toLocaleString("de-DE");
  const today = new Date().toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

  // ═══ PAGE 1: Executive Summary ═══
  let y = addPdfHeader(doc, `ROI-Analyse: Decivio für ${form.companyName}`, ind?.name || "", today);

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Executive Summary", 14, y + 5);
  y += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Erstellt für ${form.companyName} • ${form.employees} Mitarbeiter • ${form.decisionsPerMonth} Entscheidungen/Monat`, 14, y);
  y += 12;

  // KPI boxes
  const kpis = [
    { label: "Aktuelle Kosten", value: `€${fmt(roi.monthlyCost)}/Mo`, color: [220, 38, 38] },
    { label: "Potenzielle Einsparung", value: `€${fmt(roi.monthlySavings)}/Mo`, color: [16, 185, 129] },
    { label: "Amortisationszeit", value: `${roi.amortWeeks} Wochen`, color: [99, 102, 241] },
    { label: "ROI im ersten Jahr", value: `${fmt(roi.roiPercent)}%`, color: [245, 158, 11] },
  ];

  const boxW = (pw - 28 - 15) / 4;
  kpis.forEach((kpi, i) => {
    const bx = 14 + i * (boxW + 5);
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.roundedRect(bx, y, boxW, 28, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, bx + boxW / 2, y + 9, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, bx + boxW / 2, y + 20, { align: "center" });
  });
  y += 40;

  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const summaryText = [
    `Basierend auf ${form.decisionsPerMonth} Entscheidungen pro Monat mit durchschnittlich ${form.personsPerDecision} beteiligten`,
    `Personen und einem Stundensatz von €${form.hourlyRate} entstehen ${form.companyName} aktuell Verzögerungskosten`,
    `von €${fmt(roi.monthlyCost)} pro Monat (€${fmt(roi.annualSavings * 12 / 12 + roi.newMonthlyCost * 12 / 12)} pro Jahr).`,
    ``,
    `Mit Decivio kann die durchschnittliche Entscheidungsdauer von ${form.currentDelayDays} Tagen auf ${roi.reducedDays} Tage`,
    `reduziert werden. Das entspricht einer monatlichen Einsparung von €${fmt(roi.monthlySavings)} bzw.`,
    `€${fmt(roi.annualSavings)} im ersten Jahr.`,
  ];
  summaryText.forEach(line => { doc.text(line, 14, y); y += 6; });
  y += 6;

  // Comparison bar chart (drawn manually)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Monatliche Verzögerungskosten", 14, y);
  y += 8;

  const barMax = roi.monthlyCost;
  const barAreaW = pw - 80;

  // Current bar
  doc.setFillColor(220, 38, 38);
  const bar1W = Math.max(10, (roi.monthlyCost / barMax) * barAreaW);
  doc.roundedRect(50, y, bar1W, 10, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Heute", 14, y + 7);
  doc.setTextColor(220, 38, 38);
  doc.setFont("helvetica", "bold");
  doc.text(`€${fmt(roi.monthlyCost)}`, 50 + bar1W + 3, y + 7);
  y += 15;

  // New bar
  doc.setFillColor(16, 185, 129);
  const bar2W = Math.max(10, (roi.newMonthlyCost / barMax) * barAreaW);
  doc.roundedRect(50, y, bar2W, 10, 2, 2, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Mit Decivio", 14, y + 7);
  doc.setTextColor(16, 185, 129);
  doc.setFont("helvetica", "bold");
  doc.text(`€${fmt(roi.newMonthlyCost)}`, 50 + bar2W + 3, y + 7);
  y += 15;

  // Savings highlight
  doc.setFillColor(16, 185, 129, 0.1);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(14, y, pw - 28, 14, 3, 3, "FD");
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Jährliche Einsparung: €${fmt(roi.annualSavings)}`, pw / 2, y + 9, { align: "center" });

  // ═══ PAGE 2: Cost Analysis ═══
  doc.addPage();
  y = addPdfHeader(doc, `Kostenanalyse — ${form.companyName}`, "", "Seite 2");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Detaillierte Kostenanalyse", 14, y + 5);
  y += 15;

  // Category table
  autoTable(doc, {
    startY: y,
    head: [["Kategorie", "Anz./Mo", "Ø Verzögerung", "Kosten/Mo", "Einsparung/Mo"]],
    body: roi.categories.map(c => [
      c.name,
      `${c.count}`,
      `${Math.round(c.avgDelay)} Tage`,
      `€${fmt(c.cost)}`,
      `€${fmt(c.savings)}`,
    ]),
    foot: [["Gesamt", `${form.decisionsPerMonth}`, `${form.currentDelayDays} Tage`, `€${fmt(roi.monthlyCost)}`, `€${fmt(roi.monthlySavings)}`]],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    footStyles: { fillColor: [240, 240, 240], textColor: [30, 30, 30], fontStyle: "bold" },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 12;

  // Industry benchmark
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Branchen-Benchmark", 14, y);
  y += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const benchLines = [
    `Branchendurchschnitt (${ind?.name || "Allgemein"}): ${roi.industryAvgDelay} Tage Ø Entscheidungsdauer`,
    `${form.companyName} aktuell: ${form.currentDelayDays} Tage${form.currentDelayDays < roi.industryAvgDelay ? " (unter Durchschnitt ✓)" : " (über Durchschnitt)"}`,
    `Mit Decivio: ${roi.reducedDays} Tage — ${Math.round((1 - roi.reducedDays / roi.industryAvgDelay) * 100)}% besser als Branchendurchschnitt`,
  ];
  benchLines.forEach(l => { doc.text(l, 14, y); y += 5; });
  y += 8;

  // Formula explanation
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "bold");
  doc.text("Berechnungsgrundlage", 14, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const formulaLines = [
    "Monatliche Verzögerungskosten = (Stundensatz × 8h × Beteiligte × Entscheidungen × Verzögerungstage) ÷ 4,3",
    `= (€${form.hourlyRate} × 8 × ${form.personsPerDecision} × ${form.decisionsPerMonth} × ${form.currentDelayDays}) ÷ 4,3 = €${fmt(roi.monthlyCost)}/Monat`,
    `Reduktion durch Decivio: ${form.targetReduction}% → neue Verzögerung: ${roi.reducedDays} Tage`,
  ];
  formulaLines.forEach(l => { doc.text(l, 14, y); y += 5; });

  // ═══ PAGE 3: Implementation Plan ═══
  doc.addPage();
  y = addPdfHeader(doc, `Implementierungsplan — ${form.companyName}`, "", "Seite 3");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Implementierungsplan", 14, y + 5);
  y += 14;

  const phases = [
    {
      phase: "Woche 1",
      title: "Onboarding & Quick Wins",
      items: [
        "Account-Setup und Team-Import (< 15 Minuten)",
        "Erste 5 Entscheidungen anlegen und strukturieren",
        "SLA-Regeln und Eskalationsstufen konfigurieren",
        "Branchen-Templates aktivieren und anpassen",
      ],
      color: [99, 102, 241] as [number, number, number],
    },
    {
      phase: "Woche 2",
      title: "Team-Rollout & Integration",
      items: [
        "Alle Reviewer und Entscheider einladen",
        "E-Mail- und Teams-Integration einrichten",
        "One-Click Approval für mobile Reviewer aktivieren",
        "Automatisierungsregeln definieren",
      ],
      color: [16, 185, 129] as [number, number, number],
    },
    {
      phase: "Monat 2",
      title: "Erste messbare Verbesserungen",
      items: [
        "KPI-Dashboard zeigt erste Trends",
        "Entscheidungszeit sinkt messbar (Ziel: -50%)",
        "Audit-Trail vollständig für alle Entscheidungen",
        "Erste automatische Daily Briefs an Führungskräfte",
      ],
      color: [245, 158, 11] as [number, number, number],
    },
    {
      phase: "Monat 3+",
      title: "Vollständige ROI-Realisierung",
      items: [
        `Ziel: ${form.targetReduction}% Reduktion der Verzögerungen erreicht`,
        `Monatliche Einsparung von €${fmt(roi.monthlySavings)} realisiert`,
        "Decision Intelligence Reports für Geschäftsführung",
        "Kontinuierliche KI-gestützte Optimierung",
      ],
      color: [220, 38, 38] as [number, number, number],
    },
  ];

  phases.forEach(phase => {
    // Phase header
    doc.setFillColor(...phase.color);
    doc.roundedRect(14, y, pw - 28, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${phase.phase}: ${phase.title}`, 18, y + 7);
    y += 14;

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    phase.items.forEach(item => {
      doc.text(`•  ${item}`, 18, y);
      y += 5.5;
    });
    y += 5;
  });

  // ═══ PAGE 4: Next Steps ═══
  doc.addPage();
  y = addPdfHeader(doc, `Nächste Schritte — ${form.companyName}`, "", "Seite 4");

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Empfehlung & Nächste Schritte", 14, y + 5);
  y += 18;

  // Plan recommendation
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(14, y, pw - 28, 30, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Empfohlener Plan: Decivio ${roi.planName}`, pw / 2, y + 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (roi.planName === "Enterprise") {
    doc.text("Individuelle Preisgestaltung — kontaktieren Sie uns für ein Angebot", pw / 2, y + 22, { align: "center" });
  } else {
    doc.text(`€${roi.planPrice}/Monat • 14 Tage kostenlos testen • Keine Kreditkarte nötig`, pw / 2, y + 22, { align: "center" });
  }
  y += 40;

  // ROI summary
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  autoTable(doc, {
    startY: y,
    head: [["Kennzahl", "Wert"]],
    body: [
      ["Monatliche Investition", `€${roi.planPrice}`],
      ["Monatliche Einsparung", `€${fmt(roi.monthlySavings)}`],
      ["Jährliche Einsparung", `€${fmt(roi.annualSavings)}`],
      ["Amortisationszeit", `${roi.amortWeeks} Wochen`],
      ["ROI im 1. Jahr", `${fmt(roi.roiPercent)}%`],
      ["Break-Even pro Entscheidung", `€${fmt(Math.round(roi.monthlySavings / form.decisionsPerMonth))}`],
    ],
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 5 },
    headStyles: { fillColor: [99, 102, 241] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // Contact
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Ihr Ansprechpartner", 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const contacts = [
    "Kamil — Gründer & CEO",
    "E-Mail: kamil@decivio.com",
    "Telefon: +49 176 123 456 78",
    "",
    "→ 14 Tage kostenlos testen: app.decivio.com/auth",
    "→ Demo buchen: calendly.com/decivio/demo",
  ];
  contacts.forEach(c => { doc.text(c, 14, y); y += 5.5; });

  // Footer on all pages
  addPdfFooter(doc, { showBranding: true, confidentialText: `Decivio ROI-Analyse · Vertraulich · Erstellt für ${form.companyName}` });

  return doc;
}

/* ══════════════════════════════════════════════════════════════
 *  UI COMPONENT
 * ══════════════════════════════════════════════════════════════ */
const RoiReport = () => {
  const [form, setForm] = useState<FormData>(DEFAULTS);
  const roi = useMemo(() => calculateRoi(form), [form]);
  const fmt = (n: number) => n.toLocaleString("de-DE");

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleDownload = useCallback(() => {
    const doc = generatePdf(form, roi);
    const fileName = `Decivio_ROI_${form.companyName.replace(/\s+/g, "_") || "Report"}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  }, [form, roi]);

  const handleEmail = useCallback(() => {
    const subject = encodeURIComponent(`ROI-Analyse: Decivio für ${form.companyName}`);
    const body = encodeURIComponent(
      `Hallo,\n\nanbei die ROI-Analyse für ${form.companyName}.\n\nZusammenfassung:\n- Aktuelle Verzögerungskosten: €${fmt(roi.monthlyCost)}/Monat\n- Einsparungspotenzial: €${fmt(roi.monthlySavings)}/Monat\n- ROI im 1. Jahr: ${fmt(roi.roiPercent)}%\n\nMit freundlichen Grüßen\nDecivio Team`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }, [form, roi]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={decivioLogo} alt="Decivio" className="h-6" />
          <Separator orientation="vertical" className="h-5" />
          <div>
            <h1 className="text-lg font-bold text-foreground">ROI Report Generator</h1>
            <p className="text-xs text-muted-foreground">Enterprise Sales Tool</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* INPUT FORM — Left side */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calculator className="w-4 h-4 text-primary" />
              Unternehmensdaten
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs">Firmenname</Label>
                <Input
                  value={form.companyName}
                  onChange={e => update("companyName", e.target.value)}
                  placeholder="Müller Maschinenbau GmbH"
                />
              </div>

              <div>
                <Label className="text-xs">Branche</Label>
                <Select value={form.industry} onValueChange={v => update("industry", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {industries.map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.icon} {i.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Mitarbeiter</Label>
                  <Input
                    type="number"
                    value={form.employees}
                    onChange={e => update("employees", +e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Entscheidungen/Monat</Label>
                  <Input
                    type="number"
                    value={form.decisionsPerMonth}
                    onChange={e => update("decisionsPerMonth", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ø Beteiligte/Entscheidung</Label>
                  <Input
                    type="number"
                    value={form.personsPerDecision}
                    onChange={e => update("personsPerDecision", +e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Ø Stundensatz (€)</Label>
                  <Input
                    type="number"
                    value={form.hourlyRate}
                    onChange={e => update("hourlyRate", +e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Ø Verzögerung heute (Tage)</Label>
                  <Input
                    type="number"
                    value={form.currentDelayDays}
                    onChange={e => update("currentDelayDays", +e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Ziel-Reduktion (%)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={95}
                    value={form.targetReduction}
                    onChange={e => update("targetReduction", Math.min(95, Math.max(10, +e.target.value)))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleDownload} className="gap-2 h-12" disabled={!form.companyName}>
              <Download className="w-4 h-4" /> PDF Report herunterladen
            </Button>
            <Button onClick={handleEmail} variant="outline" className="gap-2" disabled={!form.companyName}>
              <Mail className="w-4 h-4" /> Per E-Mail senden
            </Button>
          </div>
        </div>

        {/* LIVE PREVIEW — Right side */}
        <div className="lg:col-span-3 space-y-4">
          {/* Executive Summary Card */}
          <motion.div
            layout
            className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Executive Summary</span>
              {form.companyName && (
                <span className="text-xs text-muted-foreground ml-auto">für {form.companyName}</span>
              )}
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Aktuelle Kosten", value: `€${fmt(roi.monthlyCost)}`, sub: "/Monat", color: "text-destructive", bg: "bg-destructive/10" },
                  { label: "Einsparung", value: `€${fmt(roi.monthlySavings)}`, sub: "/Monat", color: "text-success", bg: "bg-success/10" },
                  { label: "Amortisation", value: `${roi.amortWeeks}`, sub: "Wochen", color: "text-primary", bg: "bg-primary/10" },
                  { label: "ROI 1. Jahr", value: `${fmt(roi.roiPercent)}%`, sub: "", color: "text-warning", bg: "bg-warning/10" },
                ].map((kpi, i) => (
                  <motion.div
                    key={kpi.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`rounded-lg p-3 ${kpi.bg} text-center`}
                  >
                    <p className="text-[10px] text-muted-foreground mb-1">{kpi.label}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${kpi.color} tabular-nums`}>{kpi.value}</p>
                    {kpi.sub && <p className="text-[10px] text-muted-foreground">{kpi.sub}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Cost Analysis */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Kostenanalyse nach Kategorie</span>
            </div>
            <div className="p-4 space-y-2">
              {roi.categories.map((c, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-40 truncate text-muted-foreground text-xs">{c.name}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-destructive/40 rounded-l-full transition-all"
                      style={{ width: `${roi.monthlyCost > 0 ? (c.cost / roi.monthlyCost * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold tabular-nums w-20 text-right text-foreground">
                    €{fmt(c.cost)}
                  </span>
                  <span className="text-xs text-success tabular-nums w-20 text-right">
                    −€{fmt(c.savings)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Implementation timeline */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Implementierungsplan</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { phase: "Woche 1", title: "Onboarding", color: "border-primary", icon: Users },
                { phase: "Woche 2", title: "Team-Rollout", color: "border-success", icon: CheckCircle2 },
                { phase: "Monat 2", title: "Erste Ergebnisse", color: "border-warning", icon: TrendingUp },
                { phase: "Monat 3+", title: "Voller ROI", color: "border-destructive", icon: DollarSign },
              ].map((p, i) => (
                <div key={i} className={`rounded-lg border-l-4 ${p.color} p-3 bg-muted/20`}>
                  <p.icon className="w-4 h-4 text-muted-foreground mb-1" />
                  <p className="text-xs font-bold text-foreground">{p.phase}</p>
                  <p className="text-[10px] text-muted-foreground">{p.title}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Plan recommendation */}
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">
                  Empfohlener Plan: <span className="text-primary">Decivio {roi.planName}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {roi.planName === "Enterprise"
                    ? "Individuelle Preisgestaltung"
                    : `€${roi.planPrice}/Monat • 14 Tage kostenlos`
                  }
                </p>
              </div>
              <Button size="sm" className="gap-1.5" onClick={handleDownload} disabled={!form.companyName}>
                <Download className="w-3.5 h-3.5" /> PDF erstellen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoiReport;

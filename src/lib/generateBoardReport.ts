import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  review: "In Review",
  approved: "Genehmigt",
  implemented: "Umgesetzt",
  rejected: "Abgelehnt",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
  critical: "Kritisch",
};

const CATEGORY_LABELS: Record<string, string> = {
  strategic: "Strategisch",
  budget: "Budget",
  hr: "Personal",
  technical: "Technisch",
  operational: "Operativ",
  marketing: "Marketing",
};

const fmtDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: de }) : "—";

interface BoardReportData {
  decisions: any[];
  teams: any[];
  auditLogs: any[];
  profiles: any[];
}

export async function fetchBoardReportData(): Promise<BoardReportData> {
  const [decRes, teamRes, auditRes, profRes] = await Promise.all([
    supabase.from("decisions").select("*").order("created_at", { ascending: false }),
    supabase.from("teams").select("*"),
    supabase.from("audit_logs").select("*, profiles:user_id(full_name), decisions:decision_id(title)")
      .order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("user_id, full_name"),
  ]);
  return {
    decisions: decRes.data || [],
    teams: teamRes.data || [],
    auditLogs: auditRes.data || [],
    profiles: profRes.data || [],
  };
}

export function generateBoardReport(data: BoardReportData) {
  const { decisions, teams, auditLogs, profiles } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = format(new Date(), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de });
  const profileMap: Record<string, string> = {};
  profiles.forEach((p: any) => { profileMap[p.user_id] = p.full_name || "Unbekannt"; });

  // --- HEADER ---
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Board Report", 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DecisionOS — Entscheidungsbericht für den Vorstand", 14, 23);
  doc.setFontSize(8);
  doc.text(`Erstellt: ${now}`, 14, 30);
  doc.text(`${decisions.length} Entscheidungen`, pageWidth - 14, 30, { align: "right" });

  // --- KPI SECTION ---
  let y = 44;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Key Performance Indicators", 14, y);
  y += 8;

  const implemented = decisions.filter((d: any) => d.status === "implemented");
  const overdue = decisions.filter((d: any) => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented");
  const highRisk = decisions.filter((d: any) => (d.ai_risk_score || 0) > 60);
  const inReview = decisions.filter((d: any) => d.status === "review");
  const approved = decisions.filter((d: any) => d.status === "approved");

  const implDurations = implemented
    .filter((d: any) => d.implemented_at)
    .map((d: any) => (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / 86400000);
  const avgVelocity = implDurations.length > 0 ? Math.round(implDurations.reduce((a: number, b: number) => a + b, 0) / implDurations.length) : 0;

  const openDecisions = decisions.filter((d: any) => d.status !== "implemented" && d.status !== "rejected");
  const totalCost = openDecisions.reduce((sum: number, d: any) => {
    const team = teams.find((t: any) => t.id === d.team_id);
    const rate = team?.hourly_rate || 75;
    const daysOpen = (Date.now() - new Date(d.created_at).getTime()) / 86400000;
    return sum + Math.round(rate * (daysOpen / 7) * 8 * (d.priority === "critical" ? 4 : d.priority === "high" ? 2.5 : 1.5));
  }, 0);

  const implRate = decisions.length > 0 ? Math.round((implemented.length / decisions.length) * 100) : 0;
  const overdueRate = decisions.length > 0 ? Math.round((overdue.length / decisions.length) * 100) : 0;
  const healthScore = Math.round(Math.max(0, Math.min(100,
    (implRate * 0.4) + ((100 - overdueRate) * 0.3) + (70 * 0.2) + (approved.length / (decisions.length || 1) * 100 * 0.1)
  )));

  const kpis = [
    ["Gesamt", String(decisions.length)],
    ["Umgesetzt", `${implemented.length} (${implRate}%)`],
    ["In Review", String(inReview.length)],
    ["Genehmigt", String(approved.length)],
    ["Überfällig", String(overdue.length)],
    ["Hohes Risiko", String(highRisk.length)],
    ["Ø Umsetzungsdauer", `${avgVelocity} Tage`],
    ["Health Score", `${healthScore}/100`],
    ["Opportunity Cost", `€${totalCost.toLocaleString("de-DE")}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metrik", "Wert"]],
    body: kpis,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  // --- DECISIONS TABLE ---
  y = (doc as any).lastAutoTable.finalY + 12;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Entscheidungsübersicht", 14, y);
  y += 4;

  const decRows = decisions.slice(0, 30).map((d: any) => [
    d.title.length > 35 ? d.title.slice(0, 35) + "…" : d.title,
    STATUS_LABELS[d.status] || d.status,
    PRIORITY_LABELS[d.priority] || d.priority,
    CATEGORY_LABELS[d.category] || d.category,
    `${d.ai_risk_score || 0}%`,
    fmtDate(d.due_date),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Titel", "Status", "Priorität", "Kategorie", "Risiko", "Fällig"]],
    body: decRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 55 } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5, overflow: "linebreak" },
    didParseCell: (data: any) => {
      // Color high risk cells
      if (data.column.index === 4 && data.section === "body") {
        const val = parseInt(data.cell.text[0]);
        if (val > 60) data.cell.styles.textColor = [220, 38, 38];
        else if (val > 40) data.cell.styles.textColor = [202, 138, 4];
      }
      // Color critical priority
      if (data.column.index === 2 && data.section === "body") {
        if (data.cell.text[0] === "Kritisch") data.cell.styles.textColor = [220, 38, 38];
        if (data.cell.text[0] === "Hoch") data.cell.styles.textColor = [202, 138, 4];
      }
    },
  });

  // --- STATUS BREAKDOWN ---
  y = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need a new page
  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Status-Verteilung", 14, y);
  y += 4;

  const statusBreakdown = [
    ["Entwurf", String(decisions.filter((d: any) => d.status === "draft").length)],
    ["In Review", String(inReview.length)],
    ["Genehmigt", String(approved.length)],
    ["Umgesetzt", String(implemented.length)],
    ["Abgelehnt", String(decisions.filter((d: any) => d.status === "rejected").length)],
  ];

  const categoryBreakdown = Object.entries(CATEGORY_LABELS).map(([key, label]) => [
    label,
    String(decisions.filter((d: any) => d.category === key).length),
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Status", "Anzahl", "Kategorie", "Anzahl"]],
    body: statusBreakdown.map((s, i) => [
      s[0], s[1],
      categoryBreakdown[i]?.[0] || "",
      categoryBreakdown[i]?.[1] || "",
    ]),
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
  });

  // --- AUDIT TRAIL ---
  y = (doc as any).lastAutoTable.finalY + 12;
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Audit Trail (letzte 20 Einträge)", 14, y);
  y += 4;

  const auditRows = auditLogs.slice(0, 20).map((log: any) => {
    const userName = (log.profiles as any)?.full_name || "System";
    const decTitle = (log.decisions as any)?.title || "—";
    return [
      fmtDate(log.created_at),
      userName.length > 18 ? userName.slice(0, 18) + "…" : userName,
      log.action,
      decTitle.length > 25 ? decTitle.slice(0, 25) + "…" : decTitle,
      log.field_name || "—",
    ];
  });

  if (auditRows.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["Datum", "Nutzer", "Aktion", "Entscheidung", "Feld"]],
      body: auditRows,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5 },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2 },
    });
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Keine Audit-Einträge vorhanden.", 14, y + 6);
  }

  // --- FOOTER on each page ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const pageH = doc.internal.pageSize.getHeight();
    doc.text("DecisionOS — Vertraulich", 14, pageH - 8);
    doc.text(`Seite ${i} von ${pageCount}`, pageWidth - 14, pageH - 8, { align: "right" });
    doc.line(14, pageH - 12, pageWidth - 14, pageH - 12);
  }

  // Save
  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: de });
  doc.save(`Board-Report_${dateStr}.pdf`);
}

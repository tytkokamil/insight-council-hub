import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import i18n from "@/i18n";
import { addPdfHeader, addPdfFooter, addSectionTitle } from "@/lib/pdfBranding";

const t = (key: string, opts?: any): string => String(i18n.t(key, opts));
const dateLoc = () => (i18n.language === "en" ? enUS : de);

const statusLabels = () => ({
  draft: t("boardReport.statusDraft"),
  proposed: t("boardReport.statusProposed"),
  review: t("boardReport.statusReview"),
  approved: t("boardReport.statusApproved"),
  rejected: t("boardReport.statusRejected"),
  implemented: t("boardReport.statusImplemented"),
  archived: t("boardReport.statusArchived"),
});

const priorityLabels = () => ({
  low: t("boardReport.prioLow"),
  medium: t("boardReport.prioMedium"),
  high: t("boardReport.prioHigh"),
  critical: t("boardReport.prioCritical"),
});

const categoryLabels = () => ({
  strategic: t("boardReport.catStrategic"),
  budget: t("boardReport.catBudget"),
  hr: t("boardReport.catHr"),
  technical: t("boardReport.catTechnical"),
  operational: t("boardReport.catOperational"),
  marketing: t("boardReport.catMarketing"),
});

const fmtDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: dateLoc() }) : "—";

interface BoardReportData {
  decisions: any[];
  teams: any[];
  auditLogs: any[];
  profiles: any[];
  risks: any[];
  tasks: any[];
}

export async function fetchBoardReportData(): Promise<BoardReportData> {
  const [decRes, teamRes, auditRes, profRes, riskRes, taskRes] = await Promise.all([
    supabase.from("decisions").select("*").order("created_at", { ascending: false }),
    supabase.from("teams").select("*"),
    supabase.from("audit_logs").select("*, profiles:user_id(full_name), decisions:decision_id(title)")
      .order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("user_id, full_name"),
    supabase.from("risks").select("*").order("risk_score", { ascending: false }),
    supabase.from("tasks").select("*").is("deleted_at", null),
  ]);
  return {
    decisions: decRes.data || [],
    teams: teamRes.data || [],
    auditLogs: auditRes.data || [],
    profiles: profRes.data || [],
    risks: riskRes.data || [],
    tasks: taskRes.data || [],
  };
}

export function generateBoardReport(data: BoardReportData) {
  const { decisions, teams, auditLogs, profiles, risks, tasks } = data;
  const sl = statusLabels();
  const pl = priorityLabels();
  const cl = categoryLabels();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const profileMap: Record<string, string> = {};
  profiles.forEach((p: any) => { profileMap[p.user_id] = p.full_name || t("boardReport.unknown"); });

  // --- BRANDED HEADER ---
  let y = addPdfHeader(doc, t("boardReport.headerSubtitle"), t("boardReport.decisionsCount", { count: decisions.length }), "Board Report");

  // --- KPI SECTION ---
  y = addSectionTitle(doc, t("boardReport.kpiTitle"), y);

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
    [t("boardReport.total"), String(decisions.length)],
    [t("boardReport.implemented"), `${implemented.length} (${implRate}%)`],
    [t("boardReport.inReview"), String(inReview.length)],
    [t("boardReport.approved"), String(approved.length)],
    [t("boardReport.overdue"), String(overdue.length)],
    [t("boardReport.highRisk"), String(highRisk.length)],
    [t("boardReport.avgVelocity"), t("boardReport.days", { count: avgVelocity })],
    [t("boardReport.healthScore"), `${healthScore}/100`],
    [t("boardReport.opportunityCost"), `€${totalCost.toLocaleString(i18n.language === "en" ? "en-US" : "de-DE")}`],
  ];

  autoTable(doc, {
    startY: y,
    head: [[t("boardReport.metric"), t("boardReport.value")]],
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
  doc.text(t("boardReport.decisionOverview"), 14, y);
  y += 4;

  const decRows = decisions.slice(0, 30).map((d: any) => [
    d.title.length > 35 ? d.title.slice(0, 35) + "…" : d.title,
    (sl as any)[d.status] || d.status,
    (pl as any)[d.priority] || d.priority,
    (cl as any)[d.category] || d.category,
    `${d.ai_risk_score || 0}%`,
    fmtDate(d.due_date),
  ]);

  autoTable(doc, {
    startY: y,
    head: [[t("boardReport.colTitle"), t("boardReport.colStatus"), t("boardReport.colPriority"), t("boardReport.colCategory"), t("boardReport.colRisk"), t("boardReport.colDue")]],
    body: decRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { cellWidth: 55 } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5, overflow: "linebreak" },
    didParseCell: (data: any) => {
      if (data.column.index === 4 && data.section === "body") {
        const val = parseInt(data.cell.text[0]);
        if (val > 60) data.cell.styles.textColor = [220, 38, 38];
        else if (val > 40) data.cell.styles.textColor = [202, 138, 4];
      }
      if (data.column.index === 2 && data.section === "body") {
        if (data.cell.text[0] === pl.critical) data.cell.styles.textColor = [220, 38, 38];
        if (data.cell.text[0] === pl.high) data.cell.styles.textColor = [202, 138, 4];
      }
    },
  });

  // --- STATUS BREAKDOWN ---
  y = (doc as any).lastAutoTable.finalY + 12;
  if (y > 250) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t("boardReport.statusDistribution"), 14, y);
  y += 4;

  const statusBreakdown = [
    [sl.draft, String(decisions.filter((d: any) => d.status === "draft").length)],
    [sl.review, String(inReview.length)],
    [sl.approved, String(approved.length)],
    [sl.implemented, String(implemented.length)],
    [sl.rejected, String(decisions.filter((d: any) => d.status === "rejected").length)],
  ];

  const catLabelsArr = Object.entries(cl).map(([key, label]) => [
    label,
    String(decisions.filter((d: any) => d.category === key).length),
  ]);

  autoTable(doc, {
    startY: y,
    head: [[t("boardReport.colStatus"), t("boardReport.count"), t("boardReport.colCategory"), t("boardReport.count")]],
    body: statusBreakdown.map((s, i) => [
      s[0], s[1],
      catLabelsArr[i]?.[0] || "",
      catLabelsArr[i]?.[1] || "",
    ]),
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
  });

  // --- RISK REGISTER ---
  y = (doc as any).lastAutoTable.finalY + 12;
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(t("boardReport.riskRegister"), 14, y);
  y += 4;

  if (risks.length > 0) {
    const riskRows = risks.slice(0, 15).map((r: any) => [
      r.title.length > 30 ? r.title.slice(0, 30) + "…" : r.title,
      `${r.likelihood}/5`,
      `${r.impact}/5`,
      String(r.risk_score || r.likelihood * r.impact),
      r.status === "open" ? sl.draft.replace(/.*/, t("boardReport.riskOpen")) : r.status === "mitigated" ? t("boardReport.riskMitigated") : r.status,
      r.mitigation_plan ? (r.mitigation_plan.length > 35 ? r.mitigation_plan.slice(0, 35) + "…" : r.mitigation_plan) : "—",
    ]);

    autoTable(doc, {
      startY: y,
      head: [[t("boardReport.riskCol"), t("boardReport.riskLikelihood"), t("boardReport.riskImpact"), t("boardReport.colScore"), t("boardReport.colStatus"), t("boardReport.riskMeasure")]],
      body: riskRows,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: { 0: { cellWidth: 40 }, 5: { cellWidth: 45 } },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2, overflow: "linebreak" },
      didParseCell: (data: any) => {
        if (data.column.index === 3 && data.section === "body") {
          const val = parseInt(data.cell.text[0]);
          if (val >= 15) data.cell.styles.textColor = [220, 38, 38];
          else if (val >= 9) data.cell.styles.textColor = [202, 138, 4];
        }
      },
    });
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(t("boardReport.noRisks"), 14, y + 6);
    y += 12;
  }

  // --- TASK TIMELINE ---
  y = risks.length > 0 ? (doc as any).lastAutoTable.finalY + 12 : y;
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t("boardReport.taskOverview"), 14, y);
  y += 4;

  const openTasks = tasks.filter((t: any) => t.status !== "done");
  const doneTasks = tasks.filter((t: any) => t.status === "done");
  const overdueTasks = openTasks.filter((t: any) => t.due_date && new Date(t.due_date) < new Date());

  const taskSummary = [
    [t("boardReport.total"), String(tasks.length)],
    [t("boardReport.taskOpen"), String(openTasks.length)],
    [t("boardReport.taskDone"), String(doneTasks.length)],
    [t("boardReport.overdue"), String(overdueTasks.length)],
  ];

  autoTable(doc, {
    startY: y,
    head: [[t("boardReport.metric"), t("boardReport.count")]],
    body: taskSummary,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 60 } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
  });

  // --- RECOMMENDATIONS ---
  y = (doc as any).lastAutoTable.finalY + 12;
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t("boardReport.recommendations"), 14, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);

  const recommendations: string[] = [];
  if (overdue.length > 0) recommendations.push(t("boardReport.recOverdue", { count: overdue.length, title: overdue[0]?.title }));
  if (highRisk.length > 0) recommendations.push(t("boardReport.recHighRisk", { count: highRisk.length }));
  if (overdueTasks.length > 0) recommendations.push(t("boardReport.recOverdueTasks", { count: overdueTasks.length }));
  const criticalRisks = risks.filter((r: any) => (r.risk_score || 0) >= 15);
  if (criticalRisks.length > 0) recommendations.push(t("boardReport.recCriticalRisks", { count: criticalRisks.length }));
  if (implRate < 30) recommendations.push(t("boardReport.recLowImplRate", { rate: implRate }));
  if (recommendations.length === 0) recommendations.push(t("boardReport.recHealthy"));

  recommendations.forEach(rec => {
    if (y > 275) { doc.addPage(); y = 20; }
    doc.text(`• ${rec}`, 16, y, { maxWidth: pageWidth - 30 });
    y += 8;
  });

  // --- AUDIT TRAIL ---
  y += 4;
  if (y > 240) { doc.addPage(); y = 20; }

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(t("boardReport.auditTrailTitle"), 14, y);
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
      head: [[t("boardReport.auditDate"), t("boardReport.auditUser"), t("boardReport.auditAction"), t("boardReport.auditDecision"), t("boardReport.auditField")]],
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
    doc.text(t("boardReport.noAuditEntries"), 14, y + 6);
  }

  // --- FOOTER on each page ---
  addPdfFooter(doc);

  // Save
  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: dateLoc() });
  doc.save(`Decivio-Board-Report_${dateStr}.pdf`);
}

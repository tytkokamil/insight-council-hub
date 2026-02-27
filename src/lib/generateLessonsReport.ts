import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import i18n from "@/i18n";
import { addPdfHeader, addPdfFooter, addSectionTitle } from "@/lib/pdfBranding";

const t = (key: string, opts?: any): string => String(i18n.t(key, opts));
const dateLoc = () => (i18n.language === "en" ? enUS : de);

interface DecisionData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  outcome_notes: string | null;
  implemented_at: string | null;
  created_at: string;
}

interface LessonData {
  id: string;
  decision_id: string;
  what_went_well: string | null;
  what_went_wrong: string | null;
  key_takeaway: string;
  recommendations: string | null;
  created_at: string;
}

interface TagData {
  id: string;
  name: string;
  color: string;
}

interface DecisionTagData {
  decision_id: string;
  tag_id: string;
}

const getStatusLabels = (): Record<string, string> => ({
  draft: t("status.draft"), review: t("status.review"), approved: t("status.approved"),
  implemented: t("status.implemented"), rejected: t("status.rejected"), archived: t("status.archived"),
});
const getPriorityLabels = (): Record<string, string> => ({
  low: t("priority.low"), medium: t("priority.medium"), high: t("priority.high"), critical: t("priority.critical"),
});
const getCategoryLabels = (): Record<string, string> => ({
  strategic: t("category.strategic"), budget: t("category.budget"), hr: t("category.hr"),
  technical: t("category.technical"), operational: t("category.operational"), marketing: t("category.marketing"),
});

const fmtDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: dateLoc() }) : "—";

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + "…" : s;

export function generateLessonsReport(
  decisions: DecisionData[],
  lessons: LessonData[],
  tags: TagData[],
  decisionTags: DecisionTagData[],
) {
  const sl = getStatusLabels();
  const pl = getPriorityLabels();
  const cl = getCategoryLabels();

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const tagMap = new Map(tags.map(tg => [tg.id, tg]));

  // --- BRANDED HEADER ---
  let y = addPdfHeader(
    doc,
    t("lessonsReport.subtitle", "Knowledge Base Export"),
    `${decisions.length} ${t("lessonsReport.decisions", "Entscheidungen")} · ${lessons.length} Lessons`,
    t("lessonsReport.title", "Lessons Learned Report"),
  );

  // --- SUMMARY ---
  y = addSectionTitle(doc, t("lessonsReport.summary", "Zusammenfassung"), y);

  const withLessons = decisions.filter(d => lessons.some(l => l.decision_id === d.id));
  const categoryCounts: Record<string, number> = {};
  decisions.forEach(d => { categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1; });

  const summaryRows = [
    [t("lessonsReport.completedDecisions", "Abgeschlossene Entscheidungen"), String(decisions.length)],
    [t("lessonsReport.withLessons", "Davon mit Lessons Learned"), `${withLessons.length} (${decisions.length ? Math.round(withLessons.length / decisions.length * 100) : 0}%)`],
    [t("lessonsReport.totalLessons", "Gesamte Lessons Learned"), String(lessons.length)],
    [t("lessonsReport.usedTags", "Verwendete Tags"), String(tags.length)],
  ];

  autoTable(doc, {
    startY: y,
    head: [[t("exports.metric", "Metrik"), t("exports.value", "Wert")]],
    body: summaryRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 65 } },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 3 },
  });

  // --- CATEGORY BREAKDOWN ---
  y = (doc as any).lastAutoTable.finalY + 10;
  y = addSectionTitle(doc, t("lessonsReport.categoryBreakdown", "Kategorieverteilung"), y);

  const catRows = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => {
      const catLessons = lessons.filter(l => {
        const dec = decisions.find(d => d.id === l.decision_id);
        return dec?.category === cat;
      });
      return [cl[cat] ?? cat, String(count), String(catLessons.length)];
    });

  autoTable(doc, {
    startY: y,
    head: [[t("exports.category", "Kategorie"), t("lessonsReport.decisions", "Entscheidungen"), "Lessons"]],
    body: catRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    styles: { cellPadding: 2.5 },
  });

  // --- DETAILED LESSONS ---
  y = (doc as any).lastAutoTable.finalY + 12;
  if (y > 240) { doc.addPage(); y = 20; }

  y = addSectionTitle(doc, t("lessonsReport.detailedTitle", "Detaillierte Lessons Learned"), y);

  const decisionsWithLessons = decisions.filter(d => lessons.some(l => l.decision_id === d.id));

  decisionsWithLessons.forEach((dec, idx) => {
    const decLessons = lessons.filter(l => l.decision_id === dec.id);
    const decTags = decisionTags
      .filter(dt => dt.decision_id === dec.id)
      .map(dt => tagMap.get(dt.tag_id)?.name)
      .filter(Boolean);

    if (y > 250) { doc.addPage(); y = 20; }

    // Decision header bar
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y - 4, pw - 28, 18, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${truncate(dec.title, 60)}`, 16, y + 2);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const meta = [
      cl[dec.category] ?? dec.category,
      pl[dec.priority] ?? dec.priority,
      sl[dec.status] ?? dec.status,
      dec.implemented_at ? `${t("lessonsReport.implemented", "Umgesetzt")}: ${fmtDate(dec.implemented_at)}` : "",
    ].filter(Boolean).join(" · ");
    doc.text(meta, 16, y + 8);
    if (decTags.length > 0) {
      doc.text(`Tags: ${decTags.join(", ")}`, 16, y + 12);
    }
    y += 20;

    // Outcome
    if (dec.outcome_notes) {
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      const lines = doc.splitTextToSize(`${t("lessonsReport.result", "Ergebnis")}: ${dec.outcome_notes}`, pw - 32);
      doc.text(lines, 16, y);
      y += lines.length * 4 + 4;
    }

    // Lessons table
    const lessonRows = decLessons.map(l => [
      truncate(l.key_takeaway, 50),
      truncate(l.what_went_well || "—", 40),
      truncate(l.what_went_wrong || "—", 40),
      truncate(l.recommendations || "—", 40),
    ]);

    autoTable(doc, {
      startY: y,
      head: [[
        t("lessonsReport.colTakeaway", "Kernerkenntnis"),
        t("lessonsReport.colWentWell", "Was lief gut"),
        t("lessonsReport.colWentWrong", "Was lief schlecht"),
        t("lessonsReport.colRecommendations", "Empfehlungen"),
      ]],
      body: lessonRows,
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2, overflow: "linebreak" },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 38 }, 2: { cellWidth: 38 }, 3: { cellWidth: 42 } },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // Decisions without lessons
  const withoutLessons = decisions.filter(d => !lessons.some(l => l.decision_id === d.id));
  if (withoutLessons.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, t("lessonsReport.withoutLessons", "Entscheidungen ohne Lessons Learned"), y);

    const noLessonRows = withoutLessons.slice(0, 20).map(d => [
      truncate(d.title, 45),
      cl[d.category] ?? d.category,
      sl[d.status] ?? d.status,
      fmtDate(d.implemented_at),
    ]);

    autoTable(doc, {
      startY: y,
      head: [[t("exports.title"), t("exports.category"), t("exports.status"), t("lessonsReport.implemented", "Umgesetzt")]],
      body: noLessonRows,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2.5 },
    });
  }

  // --- FOOTER ---
  addPdfFooter(doc);

  const dateStr = format(new Date(), "yyyy-MM-dd");
  doc.save(`Decivio-Lessons-Report_${dateStr}.pdf`);
}

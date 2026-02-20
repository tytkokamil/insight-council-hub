import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";

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

const fmtDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: de }) : "—";

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max) + "…" : s;

export function generateLessonsReport(
  decisions: DecisionData[],
  lessons: LessonData[],
  tags: TagData[],
  decisionTags: DecisionTagData[],
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const now = format(new Date(), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de });
  const tagMap = new Map(tags.map(t => [t.id, t]));

  // --- HEADER ---
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pw, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Lessons Learned Report", 14, 16);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("DecisionOS — Knowledge Base Export", 14, 23);
  doc.setFontSize(8);
  doc.text(`Erstellt: ${now}`, 14, 30);
  doc.text(`${decisions.length} Entscheidungen · ${lessons.length} Lessons`, pw - 14, 30, { align: "right" });

  // --- SUMMARY ---
  let y = 44;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Zusammenfassung", 14, y);
  y += 6;

  const withLessons = decisions.filter(d => lessons.some(l => l.decision_id === d.id));
  const categoryCounts: Record<string, number> = {};
  decisions.forEach(d => { categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1; });

  const summaryRows = [
    ["Abgeschlossene Entscheidungen", String(decisions.length)],
    ["Davon mit Lessons Learned", `${withLessons.length} (${decisions.length ? Math.round(withLessons.length / decisions.length * 100) : 0}%)`],
    ["Gesamte Lessons Learned", String(lessons.length)],
    ["Verwendete Tags", String(tags.length)],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Metrik", "Wert"]],
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
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Kategorieverteilung", 14, y);
  y += 4;

  const catRows = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => {
      const catLessons = lessons.filter(l => {
        const dec = decisions.find(d => d.id === l.decision_id);
        return dec?.category === cat;
      });
      return [categoryLabels[cat] ?? cat, String(count), String(catLessons.length)];
    });

  autoTable(doc, {
    startY: y,
    head: [["Kategorie", "Entscheidungen", "Lessons"]],
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

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Detaillierte Lessons Learned", 14, y);
  y += 6;

  const decisionsWithLessons = decisions.filter(d => lessons.some(l => l.decision_id === d.id));

  decisionsWithLessons.forEach((dec, idx) => {
    const decLessons = lessons.filter(l => l.decision_id === dec.id);
    const decTags = decisionTags
      .filter(dt => dt.decision_id === dec.id)
      .map(dt => tagMap.get(dt.tag_id)?.name)
      .filter(Boolean);

    // Check space for header
    if (y > 250) { doc.addPage(); y = 20; }

    // Decision header bar
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, y - 4, pw - 28, 18, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${idx + 1}. ${truncate(dec.title, 60)}`, 16, y + 2);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    const meta = [
      categoryLabels[dec.category] ?? dec.category,
      priorityLabels[dec.priority] ?? dec.priority,
      statusLabels[dec.status] ?? dec.status,
      dec.implemented_at ? `Umgesetzt: ${fmtDate(dec.implemented_at)}` : "",
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
      const lines = doc.splitTextToSize(`Ergebnis: ${dec.outcome_notes}`, pw - 32);
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
      head: [["Kernerkenntnis", "Was lief gut", "Was lief schlecht", "Empfehlungen"]],
      body: lessonRows,
      theme: "striped",
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontSize: 7, fontStyle: "bold" },
      bodyStyles: { fontSize: 7 },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 38 },
        2: { cellWidth: 38 },
        3: { cellWidth: 42 },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  });

  // Decisions without lessons
  const withoutLessons = decisions.filter(d => !lessons.some(l => l.decision_id === d.id));
  if (withoutLessons.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Entscheidungen ohne Lessons Learned", 14, y);
    y += 4;

    const noLessonRows = withoutLessons.slice(0, 20).map(d => [
      truncate(d.title, 45),
      categoryLabels[d.category] ?? d.category,
      statusLabels[d.status] ?? d.status,
      fmtDate(d.implemented_at),
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Titel", "Kategorie", "Status", "Umgesetzt"]],
      body: noLessonRows,
      theme: "striped",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
      styles: { cellPadding: 2.5 },
    });
  }

  // --- FOOTER ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    const ph = doc.internal.pageSize.getHeight();
    doc.text("DecisionOS — Vertraulich · Lessons Learned Report", 14, ph - 8);
    doc.text(`Seite ${i} von ${pageCount}`, pw - 14, ph - 8, { align: "right" });
    doc.line(14, ph - 12, pw - 14, ph - 12);
  }

  const dateStr = format(new Date(), "yyyy-MM-dd");
  doc.save(`Lessons-Learned-Report_${dateStr}.pdf`);
}

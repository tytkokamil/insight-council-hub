import * as XLSX from "xlsx";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  proposed: "Vorschlag",
  review: "In Review",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  implemented: "Umgesetzt",
  archived: "Archiviert",
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

const TASK_STATUS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Erledigt",
  blocked: "Blockiert",
};

const fmtDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: de }) : "—";

interface ExcelDecision {
  title: string;
  status: string;
  priority: string;
  category: string;
  description?: string | null;
  context?: string | null;
  outcome?: string | null;
  due_date?: string | null;
  created_at: string;
  ai_risk_score?: number | null;
  ai_impact_score?: number | null;
  team_name?: string;
  assignee_name?: string;
  creator_name?: string;
}

interface ExcelTask {
  title: string;
  status: string;
  priority: string;
  category: string;
  description?: string | null;
  due_date?: string | null;
  created_at: string;
  assignee_name?: string;
}

export function exportDecisionsExcel(decisions: ExcelDecision[]) {
  const data = decisions.map((d) => ({
    Titel: d.title,
    Status: STATUS_LABELS[d.status] || d.status,
    Priorität: PRIORITY_LABELS[d.priority] || d.priority,
    Kategorie: CATEGORY_LABELS[d.category] || d.category,
    Team: d.team_name || "—",
    Verantwortlich: d.assignee_name || "—",
    Ersteller: d.creator_name || "—",
    Beschreibung: d.description || "",
    Kontext: d.context || "",
    Ergebnis: d.outcome || "",
    Fällig: fmtDate(d.due_date),
    Erstellt: fmtDate(d.created_at),
    "Risiko-Score": d.ai_risk_score ?? 0,
    "Impact-Score": d.ai_impact_score ?? 0,
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Set column widths
  ws["!cols"] = [
    { wch: 35 }, // Titel
    { wch: 12 }, // Status
    { wch: 10 }, // Priorität
    { wch: 12 }, // Kategorie
    { wch: 15 }, // Team
    { wch: 18 }, // Verantwortlich
    { wch: 18 }, // Ersteller
    { wch: 40 }, // Beschreibung
    { wch: 30 }, // Kontext
    { wch: 30 }, // Ergebnis
    { wch: 12 }, // Fällig
    { wch: 12 }, // Erstellt
    { wch: 10 }, // Risiko
    { wch: 10 }, // Impact
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Entscheidungen");

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: de });
  XLSX.writeFile(wb, `Entscheidungen_${dateStr}.xlsx`);
}

export function exportTasksExcel(tasks: ExcelTask[]) {
  const data = tasks.map((t) => ({
    Titel: t.title,
    Status: TASK_STATUS[t.status] || t.status,
    Priorität: PRIORITY_LABELS[t.priority] || t.priority,
    Kategorie: CATEGORY_LABELS[t.category] || t.category,
    Beschreibung: t.description || "",
    Verantwortlich: t.assignee_name || "—",
    Fällig: fmtDate(t.due_date),
    Erstellt: fmtDate(t.created_at),
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 35 }, { wch: 14 }, { wch: 10 }, { wch: 12 },
    { wch: 40 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Aufgaben");

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: de });
  XLSX.writeFile(wb, `Aufgaben_${dateStr}.xlsx`);
}

export function exportFullReportExcel(decisions: ExcelDecision[], tasks: ExcelTask[]) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const implemented = decisions.filter((d) => d.status === "implemented").length;
  const overdue = decisions.filter((d) => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented").length;
  const highRisk = decisions.filter((d) => (d.ai_risk_score || 0) > 60).length;
  const openTasks = tasks.filter((t) => t.status !== "done").length;

  const summaryData = [
    { Metrik: "Entscheidungen gesamt", Wert: decisions.length },
    { Metrik: "Umgesetzt", Wert: implemented },
    { Metrik: "Überfällig", Wert: overdue },
    { Metrik: "Hohes Risiko (>60%)", Wert: highRisk },
    { Metrik: "Aufgaben gesamt", Wert: tasks.length },
    { Metrik: "Offene Aufgaben", Wert: openTasks },
    { Metrik: "Erstellt am", Wert: format(new Date(), "dd.MM.yyyy HH:mm", { locale: de }) },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Zusammenfassung");

  // Decisions sheet
  const decData = decisions.map((d) => ({
    Titel: d.title,
    Status: STATUS_LABELS[d.status] || d.status,
    Priorität: PRIORITY_LABELS[d.priority] || d.priority,
    Kategorie: CATEGORY_LABELS[d.category] || d.category,
    Team: d.team_name || "—",
    Verantwortlich: d.assignee_name || "—",
    "Risiko-Score": d.ai_risk_score ?? 0,
    "Impact-Score": d.ai_impact_score ?? 0,
    Fällig: fmtDate(d.due_date),
    Erstellt: fmtDate(d.created_at),
  }));
  const decWs = XLSX.utils.json_to_sheet(decData);
  decWs["!cols"] = [
    { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, decWs, "Entscheidungen");

  // Tasks sheet
  const taskData = tasks.map((t) => ({
    Titel: t.title,
    Status: TASK_STATUS[t.status] || t.status,
    Priorität: PRIORITY_LABELS[t.priority] || t.priority,
    Verantwortlich: t.assignee_name || "—",
    Fällig: fmtDate(t.due_date),
    Erstellt: fmtDate(t.created_at),
  }));
  const taskWs = XLSX.utils.json_to_sheet(taskData);
  taskWs["!cols"] = [
    { wch: 35 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, taskWs, "Aufgaben");

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: de });
  XLSX.writeFile(wb, `Decivio-Report_${dateStr}.xlsx`);
}

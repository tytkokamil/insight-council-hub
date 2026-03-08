import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import i18n from "@/i18n";

const t = (key: string, opts?: Record<string, any>): string => String(i18n.t(key, opts));
const loc = () => i18n.language?.startsWith("de") ? de : enUS;

const getStatusLabels = (): Record<string, string> => ({
  draft: t("status.draft"), proposed: t("status.proposed"), review: t("status.review"),
  approved: t("status.approved"), rejected: t("status.rejected"),
  implemented: t("status.implemented"), archived: t("status.archived"),
});
const getPriorityLabels = (): Record<string, string> => ({
  low: t("priority.low"), medium: t("priority.medium"), high: t("priority.high"), critical: t("priority.critical"),
});
const getCategoryLabels = (): Record<string, string> => ({
  strategic: t("category.strategic"), budget: t("category.budget"), hr: t("category.hr"),
  technical: t("category.technical"), operational: t("category.operational"), marketing: t("category.marketing"),
});
const getTaskStatusLabels = (): Record<string, string> => ({
  open: t("exports.open"), in_progress: t("exports.inProgress"), done: t("exports.done"), blocked: t("tasksPage.statusBlocked"),
});

const fmtDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: loc() }) : "—";

/** Escape a CSV field: wrap in quotes if it contains comma, quote, or newline */
function csvField(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Convert array of objects to CSV string and trigger download */
function downloadCSV(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvLines = [
    // BOM for Excel UTF-8 detection + header
    headers.map(csvField).join(";"),
    ...rows.map((row) => headers.map((h) => csvField(row[h])).join(";")),
  ];
  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface ExcelDecision {
  title: string; status: string; priority: string; category: string;
  description?: string | null; context?: string | null; outcome?: string | null;
  due_date?: string | null; created_at: string;
  ai_risk_score?: number | null; ai_impact_score?: number | null;
  team_name?: string; assignee_name?: string; creator_name?: string;
}

interface ExcelTask {
  title: string; status: string; priority: string; category: string;
  description?: string | null; due_date?: string | null; created_at: string;
  assignee_name?: string;
}

export function exportDecisionsExcel(decisions: ExcelDecision[]) {
  const S = getStatusLabels(); const P = getPriorityLabels(); const C = getCategoryLabels();
  const data = decisions.map((d) => ({
    [t("exports.title")]: d.title,
    [t("exports.status")]: S[d.status] || d.status,
    [t("exports.priority")]: P[d.priority] || d.priority,
    [t("exports.category")]: C[d.category] || d.category,
    [t("exports.team")]: d.team_name || "—",
    [t("exports.responsible")]: d.assignee_name || "—",
    [t("exports.creator")]: d.creator_name || "—",
    [t("exports.description")]: d.description || "",
    [t("exports.context")]: d.context || "",
    [t("exports.outcome")]: d.outcome || "",
    [t("exports.due")]: fmtDate(d.due_date),
    [t("exports.created")]: fmtDate(d.created_at),
    [t("exports.riskScore")]: d.ai_risk_score ?? 0,
    [t("exports.impactScore")]: d.ai_impact_score ?? 0,
  }));

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  downloadCSV(data, `${t("exports.decisionsSheet")}_${dateStr}.csv`);
}

export function exportTasksExcel(tasks: ExcelTask[]) {
  const P = getPriorityLabels(); const C = getCategoryLabels(); const TS = getTaskStatusLabels();
  const data = tasks.map((task) => ({
    [t("exports.title")]: task.title,
    [t("exports.status")]: TS[task.status] || task.status,
    [t("exports.priority")]: P[task.priority] || task.priority,
    [t("exports.category")]: C[task.category] || task.category,
    [t("exports.description")]: task.description || "",
    [t("exports.responsible")]: task.assignee_name || "—",
    [t("exports.due")]: fmtDate(task.due_date),
    [t("exports.created")]: fmtDate(task.created_at),
  }));

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  downloadCSV(data, `${t("exports.tasksSheet")}_${dateStr}.csv`);
}

export function exportFullReportExcel(decisions: ExcelDecision[], tasks: ExcelTask[]) {
  const S = getStatusLabels(); const P = getPriorityLabels(); const C = getCategoryLabels(); const TS = getTaskStatusLabels();

  // Combined report as single CSV with decisions + tasks
  const decData = decisions.map((d) => ({
    [t("exports.title")]: d.title,
    Type: "Decision",
    [t("exports.status")]: S[d.status] || d.status,
    [t("exports.priority")]: P[d.priority] || d.priority,
    [t("exports.category")]: C[d.category] || d.category,
    [t("exports.team")]: d.team_name || "—",
    [t("exports.responsible")]: d.assignee_name || "—",
    [t("exports.riskScore")]: d.ai_risk_score ?? 0,
    [t("exports.impactScore")]: d.ai_impact_score ?? 0,
    [t("exports.due")]: fmtDate(d.due_date),
    [t("exports.created")]: fmtDate(d.created_at),
  }));

  const taskData = tasks.map((task) => ({
    [t("exports.title")]: task.title,
    Type: "Task",
    [t("exports.status")]: TS[task.status] || task.status,
    [t("exports.priority")]: P[task.priority] || task.priority,
    [t("exports.category")]: C[task.category] || task.category,
    [t("exports.team")]: "—",
    [t("exports.responsible")]: task.assignee_name || "—",
    [t("exports.riskScore")]: 0,
    [t("exports.impactScore")]: 0,
    [t("exports.due")]: fmtDate(task.due_date),
    [t("exports.created")]: fmtDate(task.created_at),
  }));

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  downloadCSV([...decData, ...taskData], `Decivio-Report_${dateStr}.csv`);
}

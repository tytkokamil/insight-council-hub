import * as XLSX from "xlsx";
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

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 },
    { wch: 18 }, { wch: 18 }, { wch: 40 }, { wch: 30 }, { wch: 30 },
    { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t("exports.decisionsSheet"));

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  XLSX.writeFile(wb, `${t("exports.decisionsSheet")}_${dateStr}.xlsx`);
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

  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, t("exports.tasksSheet"));

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  XLSX.writeFile(wb, `${t("exports.tasksSheet")}_${dateStr}.xlsx`);
}

export function exportFullReportExcel(decisions: ExcelDecision[], tasks: ExcelTask[]) {
  const wb = XLSX.utils.book_new();
  const S = getStatusLabels(); const P = getPriorityLabels(); const C = getCategoryLabels(); const TS = getTaskStatusLabels();

  const implemented = decisions.filter((d) => d.status === "implemented").length;
  const overdue = decisions.filter((d) => d.due_date && new Date(d.due_date) < new Date() && d.status !== "implemented").length;
  const highRisk = decisions.filter((d) => (d.ai_risk_score || 0) > 60).length;
  const openTasks = tasks.filter((task) => task.status !== "done").length;

  const summaryData = [
    { [t("exports.metric")]: t("exports.totalDecisions"), [t("exports.value")]: decisions.length },
    { [t("exports.metric")]: t("exports.implemented"), [t("exports.value")]: implemented },
    { [t("exports.metric")]: t("exports.overdue"), [t("exports.value")]: overdue },
    { [t("exports.metric")]: t("exports.highRiskPct"), [t("exports.value")]: highRisk },
    { [t("exports.metric")]: t("exports.totalTasks"), [t("exports.value")]: tasks.length },
    { [t("exports.metric")]: t("exports.openTasks"), [t("exports.value")]: openTasks },
    { [t("exports.metric")]: t("exports.created"), [t("exports.value")]: format(new Date(), "dd.MM.yyyy HH:mm", { locale: loc() }) },
  ];

  const summaryWs = XLSX.utils.json_to_sheet(summaryData);
  summaryWs["!cols"] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, t("exports.summarySheet"));

  const decData = decisions.map((d) => ({
    [t("exports.title")]: d.title,
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
  const decWs = XLSX.utils.json_to_sheet(decData);
  decWs["!cols"] = [{ wch: 35 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, decWs, t("exports.decisionsSheet"));

  const taskData = tasks.map((task) => ({
    [t("exports.title")]: task.title,
    [t("exports.status")]: TS[task.status] || task.status,
    [t("exports.priority")]: P[task.priority] || task.priority,
    [t("exports.responsible")]: task.assignee_name || "—",
    [t("exports.due")]: fmtDate(task.due_date),
    [t("exports.created")]: fmtDate(task.created_at),
  }));
  const taskWs = XLSX.utils.json_to_sheet(taskData);
  taskWs["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, taskWs, t("exports.tasksSheet"));

  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  XLSX.writeFile(wb, `Decivio-Report_${dateStr}.xlsx`);
}

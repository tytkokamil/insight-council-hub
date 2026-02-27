import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import i18n from "@/i18n";

interface DecisionExport {
  title: string;
  status: string;
  priority: string;
  category: string;
  description?: string | null;
  context?: string | null;
  outcome?: string | null;
  outcome_notes?: string | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  ai_risk_score?: number | null;
  ai_impact_score?: number | null;
  team_name?: string;
  assignee_name?: string;
  creator_name?: string;
}

const t = (key: string, opts?: Record<string, any>): string => String(i18n.t(key, opts));
const loc = () => i18n.language?.startsWith("de") ? de : enUS;

const getStatusLabels = (): Record<string, string> => ({
  draft: t("status.draft"), review: t("status.review"), approved: t("status.approved"),
  implemented: t("status.implemented"), rejected: t("status.rejected"),
});
const getPriorityLabels = (): Record<string, string> => ({
  low: t("priority.low"), medium: t("priority.medium"), high: t("priority.high"), critical: t("priority.critical"),
});
const getCategoryLabels = (): Record<string, string> => ({
  strategic: t("category.strategic"), budget: t("category.budget"), hr: t("category.hr"),
  technical: t("category.technical"), operational: t("category.operational"), marketing: t("category.marketing"),
});

const formatDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: loc() }) : "—";

const escapeCSV = (val: string) => {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

export function exportCSV(decisions: DecisionExport[]) {
  const STATUS = getStatusLabels();
  const PRIORITY = getPriorityLabels();
  const CATEGORY = getCategoryLabels();

  const headers = [
    t("exports.title"), t("exports.status"), t("exports.priority"), t("exports.category"),
    t("exports.team"), t("exports.responsible"), t("exports.creator"), t("exports.description"),
    t("exports.context"), t("exports.outcome"), t("exports.outcomeNotes"),
    t("exports.due"), t("exports.created"), t("exports.updated"),
    t("exports.riskScore"), t("exports.impactScore"),
  ];

  const rows = decisions.map((d) => [
    d.title, STATUS[d.status] || d.status, PRIORITY[d.priority] || d.priority,
    CATEGORY[d.category] || d.category, d.team_name || "—", d.assignee_name || "—",
    d.creator_name || "—", (d.description || "").replace(/\n/g, " "),
    (d.context || "").replace(/\n/g, " "), (d.outcome || "").replace(/\n/g, " "),
    (d.outcome_notes || "").replace(/\n/g, " "), formatDate(d.due_date),
    formatDate(d.created_at), formatDate(d.updated_at),
    String(d.ai_risk_score ?? 0), String(d.ai_impact_score ?? 0),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  downloadFile(csv, `${t("exports.decisionsFilename")}.csv`, "text/csv;charset=utf-8;");
}

export function exportPDF(decisions: DecisionExport[]) {
  const STATUS = getStatusLabels();
  const PRIORITY = getPriorityLabels();
  const CATEGORY = getCategoryLabels();
  const now = format(new Date(), "dd.MM.yyyy HH:mm", { locale: loc() });

  const tableRows = decisions
    .map(
      (d) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.title}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${STATUS[d.status] || d.status}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${PRIORITY[d.priority] || d.priority}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${CATEGORY[d.category] || d.category}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.team_name || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.assignee_name || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.ai_risk_score ?? 0}%</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${formatDate(d.due_date)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="${i18n.language}">
<head>
  <meta charset="utf-8">
  <title>${t("exports.reportTitle")}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; color: #1a1a1a; }
    .header { background: #0f172a; color: white; padding: 24px 40px; display: flex; align-items: center; gap: 16px; }
    .logo-mark { width: 32px; height: 32px; background: #6366f1; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; color: white; }
    .header-text h1 { font-size: 18px; margin: 0; }
    .header-text p { font-size: 11px; margin: 2px 0 0; opacity: 0.7; }
    .content { padding: 24px 40px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #333; }
    td { padding: 6px 8px; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { padding: 12px 16px; background: #f5f5f5; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
    .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e5e5; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
    @media print { body { margin: 0; } .header { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-mark">D</div>
    <div class="header-text">
      <h1>Decivio</h1>
      <p>${t("exports.reportTitle")}</p>
    </div>
  </div>
  <div class="content">
  <p class="meta">${t("exports.createdAt", { date: now })} · ${t("exports.decisionsCount", { count: decisions.length })}</p>
  
  <div class="summary">
    <div class="stat"><div class="stat-value">${decisions.length}</div><div class="stat-label">${t("exports.total")}</div></div>
    <div class="stat"><div class="stat-value">${decisions.filter((d) => d.status === "review").length}</div><div class="stat-label">${t("exports.inReview")}</div></div>
    <div class="stat"><div class="stat-value">${decisions.filter((d) => d.status === "approved").length}</div><div class="stat-label">${t("exports.approved")}</div></div>
    <div class="stat"><div class="stat-value">${decisions.filter((d) => (d.ai_risk_score || 0) > 60).length}</div><div class="stat-label">${t("exports.highRisk")}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${t("exports.title")}</th><th>${t("exports.status")}</th><th>${t("exports.priority")}</th><th>${t("exports.category")}</th><th>${t("exports.team")}</th><th>${t("exports.responsible")}</th><th>${t("exports.risk")}</th><th>${t("exports.due")}</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>Decivio · ${i18n.language === "de" ? "Vertraulich" : "Confidential"}</span>
    <span>${now}</span>
  </div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
}

interface TaskExport {
  title: string;
  status: string;
  priority: string;
  category: string;
  description?: string | null;
  due_date?: string | null;
  created_at: string;
  assignee_name?: string;
}

export function exportTasksCSV(tasks: TaskExport[]) {
  const TASK_STATUS: Record<string, string> = {
    backlog: t("tasksPage.statusBacklog"), open: t("exports.open"),
    in_progress: t("exports.inProgress"), blocked: t("tasksPage.statusBlocked"),
    done: t("exports.done"),
  };
  const P = getPriorityLabels();
  const C = getCategoryLabels();

  const headers = [
    t("exports.title"), t("exports.status"), t("exports.priority"), t("exports.category"),
    t("exports.description"), t("exports.responsible"), t("exports.due"), t("exports.created"),
  ];

  const rows = tasks.map((task) => [
    task.title,
    TASK_STATUS[task.status] || task.status,
    P[task.priority] || task.priority,
    C[task.category] || task.category,
    (task.description || "").replace(/\n/g, " "),
    task.assignee_name || "—",
    formatDate(task.due_date),
    formatDate(task.created_at),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: loc() });
  downloadFile(csv, `Decivio-Tasks_${dateStr}.csv`, "text/csv;charset=utf-8;");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

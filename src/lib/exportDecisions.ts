import { format } from "date-fns";
import { de } from "date-fns/locale";

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

const formatDate = (d: string | null | undefined) =>
  d ? format(new Date(d), "dd.MM.yyyy", { locale: de }) : "—";

const escapeCSV = (val: string) => {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

export function exportCSV(decisions: DecisionExport[]) {
  const headers = [
    "Titel", "Status", "Priorität", "Kategorie", "Team", "Verantwortlich",
    "Ersteller", "Beschreibung", "Kontext", "Ergebnis", "Ergebnis-Notizen",
    "Fällig", "Erstellt", "Aktualisiert", "Risiko-Score", "Impact-Score",
  ];

  const rows = decisions.map((d) => [
    d.title,
    STATUS_LABELS[d.status] || d.status,
    PRIORITY_LABELS[d.priority] || d.priority,
    CATEGORY_LABELS[d.category] || d.category,
    d.team_name || "—",
    d.assignee_name || "—",
    d.creator_name || "—",
    (d.description || "").replace(/\n/g, " "),
    (d.context || "").replace(/\n/g, " "),
    (d.outcome || "").replace(/\n/g, " "),
    (d.outcome_notes || "").replace(/\n/g, " "),
    formatDate(d.due_date),
    formatDate(d.created_at),
    formatDate(d.updated_at),
    String(d.ai_risk_score ?? 0),
    String(d.ai_impact_score ?? 0),
  ]);

  const csv = [headers, ...rows].map((r) => r.map(escapeCSV).join(",")).join("\n");
  downloadFile(csv, "entscheidungen.csv", "text/csv;charset=utf-8;");
}

export function exportPDF(decisions: DecisionExport[]) {
  // Generate a styled HTML document and trigger print-to-PDF
  const now = format(new Date(), "dd.MM.yyyy HH:mm", { locale: de });

  const tableRows = decisions
    .map(
      (d) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.title}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${STATUS_LABELS[d.status] || d.status}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${PRIORITY_LABELS[d.priority] || d.priority}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${CATEGORY_LABELS[d.category] || d.category}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.team_name || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.assignee_name || "—"}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${d.ai_risk_score ?? 0}%</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e5e5;font-size:12px;">${formatDate(d.due_date)}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <title>Entscheidungsbericht</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; color: #1a1a1a; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #666; border-bottom: 2px solid #333; }
    .summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .stat { padding: 12px 16px; background: #f5f5f5; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #666; text-transform: uppercase; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Entscheidungsbericht</h1>
  <p class="meta">Erstellt am ${now} · ${decisions.length} Entscheidungen</p>
  
  <div class="summary">
    <div class="stat"><div class="stat-value">${decisions.length}</div><div class="stat-label">Gesamt</div></div>
    <div class="stat"><div class="stat-value">${decisions.filter((d) => d.status === "review").length}</div><div class="stat-label">In Review</div></div>
    <div class="stat"><div class="stat-value">${decisions.filter((d) => d.status === "approved").length}</div><div class="stat-label">Genehmigt</div></div>
    <div class="stat"><div class="stat-value">${decisions.filter((d) => (d.ai_risk_score || 0) > 60).length}</div><div class="stat-label">Hohes Risiko</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Titel</th><th>Status</th><th>Priorität</th><th>Kategorie</th><th>Team</th><th>Verantwortlich</th><th>Risiko</th><th>Fällig</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }
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

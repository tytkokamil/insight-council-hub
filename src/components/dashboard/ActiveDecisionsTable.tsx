import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useDecisions, useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslatedLabels } from "@/lib/labels";
import { useTranslation } from "react-i18next";
import { format, differenceInDays } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const priorityBadge: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusBadge: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  proposed: "bg-accent/50 text-accent-foreground",
  review: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  implemented: "bg-primary/10 text-primary",
};

const ActiveDecisionsTable = () => {
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const navigate = useNavigate();
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const { statusLabels, priorityLabels, categoryLabels } = useTranslatedLabels(t);

  const profileMap = useMemo(() => buildProfileMap(profiles), [profiles]);
  const isPersonal = selectedTeamId === null;

  const activeDecisions = useMemo(() => {
    const decisions = isPersonal
      ? allDecisions.filter(d => d.created_by === user?.id || d.assignee_id === user?.id || d.owner_id === user?.id)
      : allDecisions;

    return decisions
      .filter(d => !["implemented", "rejected", "archived", "cancelled"].includes(d.status))
      .sort((a, b) => {
        // Overdue first, then by CoD descending
        const now = new Date();
        const aOverdue = a.due_date && new Date(a.due_date) < now;
        const bOverdue = b.due_date && new Date(b.due_date) < now;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;
        return (b.cost_per_day || 0) - (a.cost_per_day || 0);
      });
  }, [allDecisions, user, isPersonal]);

  const now = new Date();

  if (activeDecisions.length === 0) {
    return (
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
          {t("dashboard.activeDecisions", { defaultValue: "Aktive Entscheidungen" })}
        </h2>
        <div className="border border-border rounded-xl p-8 text-center">
          <span className="text-4xl mb-3 block">📋</span>
          <p className="text-sm font-medium text-muted-foreground">
            {t("decisions.emptyTitle", { defaultValue: "Noch keine Entscheidungen angelegt" })}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {t("decisions.emptySubtitle", { defaultValue: "Beginne mit deiner ersten Entscheidung und sieh sofort die Kosten." })}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
        {t("dashboard.activeDecisions", { defaultValue: "Aktive Entscheidungen" })}
        <span className="ml-2 text-muted-foreground/50 font-normal normal-case">({activeDecisions.length})</span>
      </h2>
      <div className="border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{t("common.title", { defaultValue: "Titel" })}</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("common.category", { defaultValue: "Kategorie" })}</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">{t("common.priority", { defaultValue: "Priorität" })}</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">{t("common.status", { defaultValue: "Status" })}</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">SLA</th>
                <th className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">CoD/Woche</th>
                <th className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground hidden xl:table-cell">Reviewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeDecisions.map(d => {
                const isOverdue = d.due_date && new Date(d.due_date) < now;
                const weeklyCod = (d.cost_per_day || 0) * 7;
                const reviewerProfile = d.assignee_id ? profileMap[d.assignee_id] : null;

                return (
                  <tr
                    key={d.id}
                    onClick={() => navigate(`/decisions/${d.id}`)}
                    className={cn(
                      "cursor-pointer hover:bg-muted/30 transition-colors group",
                      isOverdue && "border-l-[3px] border-l-destructive"
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors truncate max-w-[280px]">{d.title}</p>
                      {d.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[280px] mt-0.5">
                          {d.description.slice(0, 80)}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {categoryLabels[d.category] || d.category}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={cn("text-[10px] border", priorityBadge[d.priority] || priorityBadge.medium)}>
                        {priorityLabels[d.priority] || d.priority}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge className={cn("text-[10px]", statusBadge[d.status] || statusBadge.draft)}>
                        {statusLabels[d.status] || d.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      {d.due_date ? (
                        <span className={cn("text-xs tabular-nums", isOverdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                          {format(new Date(d.due_date), "dd.MM.yy", { locale: dateFnsLocale })}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right hidden md:table-cell">
                      {weeklyCod > 0 ? (
                        <span className="text-xs font-medium tabular-nums text-destructive">
                          {weeklyCod.toLocaleString("de-DE")}€
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 hidden xl:table-cell">
                      {reviewerProfile ? (
                        <span className="text-xs text-muted-foreground">{reviewerProfile || "—"}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ActiveDecisionsTable;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DecisionMeta {
  openTasks: number;
  depCount: number;
  cost: number;
  alignment: number;
  isOverdue: boolean;
  isEscalated: boolean;
  needsReview: boolean;
  isBlocked: boolean;
  isHighRisk: boolean;
}

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  proposed: "bg-accent-blue/10 text-accent-blue border border-accent-blue/20",
  review: "bg-warning/15 text-warning border border-warning/20",
  approved: "bg-success/15 text-success border border-success/20",
  rejected: "bg-destructive/15 text-destructive border border-destructive/20",
  implemented: "bg-primary/15 text-primary border border-primary/20",
  cancelled: "bg-muted/60 text-muted-foreground line-through",
  superseded: "bg-accent-violet/10 text-accent-violet border border-accent-violet/20",
  archived: "bg-muted/50 text-muted-foreground/60",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-accent-blue",
  high: "text-warning",
  critical: "text-destructive font-semibold",
};

interface DecisionTableProps {
  decisions: any[];
  decisionMeta: Record<string, DecisionMeta>;
  profileMap: Record<string, string>;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onPreview: (d: any) => void;
  onEdit: (d: any) => void;
  onDelete: (d: any) => void;
  statusOptions: { value: string; label: string }[];
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
  userId?: string;
  onInvalidate: () => void;
  onClearFilters: () => void;
}

const DecisionTable = ({
  decisions, decisionMeta, profileMap, selectedIds,
  onToggleSelect, onToggleSelectAll, onPreview, onEdit, onDelete,
  statusOptions, statusLabels, priorityLabels, categoryLabels,
  userId, onInvalidate, onClearFilters,
}: DecisionTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-3 w-10">
                <Checkbox checked={selectedIds.size === decisions.length && decisions.length > 0} onCheckedChange={onToggleSelectAll} />
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("decisions.decision")}</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">{t("decisions.statusLabel")}</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("decisions.owner")}</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("decisions.priorityLabel")}</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">{t("decisions.risk")}</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("decisions.due")}</th>
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {decisions.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <p className="text-sm text-muted-foreground">{t("decisions.noFilterResults")}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={onClearFilters}>{t("decisions.resetFilters")}</Button>
                </td>
              </tr>
            ) : (
              decisions.map((decision) => {
                const meta = decisionMeta[decision.id] || { openTasks: 0, depCount: 0, cost: 0, alignment: 0, isOverdue: false, isEscalated: false, needsReview: false, isBlocked: false, isHighRisk: false };
                const isSelected = selectedIds.has(decision.id);
                return (
                  <tr
                    key={decision.id}
                    className={`border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    onClick={() => onPreview(decision)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(decision.id)} />
                    </td>

                    {/* Title + badges */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium">{decision.title}</p>
                        {meta.isOverdue && <Badge variant="destructive" className="text-[9px] h-4 px-1">{t("table.overdue")}</Badge>}
                        {meta.isEscalated && <Badge className="text-[9px] h-4 px-1 bg-warning/20 text-warning border-warning/30">{t("table.escalated")}</Badge>}
                        {meta.needsReview && <Badge className="text-[9px] h-4 px-1 bg-primary/20 text-primary border-primary/30">{t("table.review")}</Badge>}
                        {meta.isBlocked && <Badge className="text-[9px] h-4 px-1 bg-warning/20 text-warning border-warning/30">{t("table.blocked")}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{categoryLabels[decision.category]}</p>
                    </td>

                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${statusStyles[decision.status]}`}>
                        {statusLabels[decision.status]}
                      </span>
                    </td>

                    <td className="p-3 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(profileMap[decision.assignee_id || decision.created_by] || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {profileMap[decision.assignee_id || decision.created_by] || "—"}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 hidden md:table-cell">
                      <span className={`text-xs font-semibold ${priorityStyles[decision.priority]}`}>
                        {priorityLabels[decision.priority]}
                      </span>
                    </td>

                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(decision.ai_risk_score || 0) > 60 ? "bg-destructive" : (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"}`} />
                        <span className="text-xs text-muted-foreground font-mono">{decision.ai_risk_score || 0}%</span>
                      </div>
                    </td>

                    <td className="p-3 hidden md:table-cell">
                      <span className={`text-xs ${meta.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        {decision.due_date ? format(new Date(decision.due_date), "dd.MM.yy", { locale: de }) : "—"}
                      </span>
                    </td>

                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/decisions/${decision.id}`)} className="gap-2">
                            <Eye className="w-3.5 h-3.5" /> {t("common.open")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {statusOptions.filter(s => s.value !== decision.status).slice(0, 3).map(s => (
                            <DropdownMenuItem key={s.value} onClick={async () => {
                              await supabase.from("decisions").update({ status: s.value as any }).eq("id", decision.id);
                              onInvalidate(); toast.success(`→ ${s.label}`);
                            }} className="gap-2 text-xs">
                              {t("table.statusTo", { label: s.label })}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          {userId === decision.created_by && (
                            <>
                              <DropdownMenuItem onClick={() => onEdit(decision)} className="gap-2">
                                <Pencil className="w-3.5 h-3.5" /> {t("common.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onDelete(decision)} className="gap-2 text-destructive focus:text-destructive">
                                <Trash2 className="w-3.5 h-3.5" /> {t("common.delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DecisionTable;

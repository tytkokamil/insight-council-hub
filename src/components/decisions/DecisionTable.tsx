import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QualityScoreBadge } from "./DecisionQualityScore";
import QuickMessageButton from "@/components/shared/QuickMessageButton";
import LiveCodCounter from "@/components/shared/LiveCodCounter";
import { PredictiveSlaInlineBadge, type PredictiveSlaEntry } from "@/components/decisions/PredictiveSlaWarning";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown, ArrowRightLeft, Lock } from "lucide-react";
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

export type SortField = "title" | "status" | "priority" | "risk" | "due_date" | null;
export type SortDir = "asc" | "desc";

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

const priorityBadgeStyles: Record<string, string> = {
  low: "bg-muted text-muted-foreground border-border/50",
  medium: "bg-accent-blue/10 text-accent-blue border-accent-blue/20",
  high: "bg-warning/10 text-warning border-warning/20",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
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
  sortField?: SortField;
  sortDir?: SortDir;
  onSort?: (field: SortField) => void;
  slaPredictions?: PredictiveSlaEntry[];
}

/* ── Sortable header cell ── */
const SortableHeader = ({ field, label, currentField, currentDir, onSort, className }: {
  field: SortField;
  label: string;
  currentField?: SortField;
  currentDir?: SortDir;
  onSort?: (f: SortField) => void;
  className?: string;
}) => {
  const active = currentField === field;
  const Icon = active ? (currentDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <th
      className={`text-left p-3 text-xs font-medium text-muted-foreground select-none ${onSort ? "cursor-pointer hover:text-foreground group" : ""} ${className ?? ""}`}
      onClick={() => onSort?.(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <Icon className={`w-3 h-3 shrink-0 transition-colors ${active ? "text-foreground" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
      </span>
    </th>
  );
};

/* ── Badge row with limit ── */
const DecisionBadges = ({ meta, t }: { meta: DecisionMeta; t: any }) => {
  const badges: { label: string; className: string }[] = [];
  if (meta.isOverdue) badges.push({ label: t("table.overdue"), className: "bg-destructive/20 text-destructive border-destructive/30" });
  if (meta.isEscalated) badges.push({ label: t("table.escalated"), className: "bg-warning/20 text-warning border-warning/30" });
  if (meta.needsReview) badges.push({ label: t("table.review"), className: "bg-primary/20 text-primary border-primary/30" });
  if (meta.isBlocked) badges.push({ label: t("table.blocked"), className: "bg-warning/20 text-warning border-warning/30" });

  if (badges.length === 0) return null;

  const visible = badges.slice(0, 2);
  const hidden = badges.slice(2);

  return (
    <>
      {visible.map((b, i) => (
        <Badge key={i} variant="outline" className={`text-[9px] h-4 px-1 ${b.className}`}>{b.label}</Badge>
      ))}
      {hidden.length > 0 && (
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="text-[9px] h-4 px-1 bg-muted/50 text-muted-foreground border-border cursor-help">
                +{hidden.length}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {hidden.map(b => b.label).join(", ")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
};

const DecisionTable = ({
  decisions, decisionMeta, profileMap, selectedIds,
  onToggleSelect, onToggleSelectAll, onPreview, onEdit, onDelete,
  statusOptions, statusLabels, priorityLabels, categoryLabels,
  userId, onInvalidate, onClearFilters,
  sortField, sortDir, onSort, slaPredictions = [],
}: DecisionTableProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const predictions = slaPredictions;

  return (
    <Card className="overflow-hidden border-border/60">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30">
              <th className="p-3 w-10">
                <Checkbox checked={selectedIds.size === decisions.length && decisions.length > 0} onCheckedChange={onToggleSelectAll} />
              </th>
              <SortableHeader field="title" label={t("decisions.decision")} currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <SortableHeader field="status" label={t("decisions.statusLabel")} currentField={sortField} currentDir={sortDir} onSort={onSort} />
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">{t("decisions.owner")}</th>
              <SortableHeader field="risk" label={t("decisions.risk")} currentField={sortField} currentDir={sortDir} onSort={onSort} className="hidden lg:table-cell" />
              <SortableHeader field="due_date" label={t("decisions.due")} currentField={sortField} currentDir={sortDir} onSort={onSort} className="hidden md:table-cell" />
              <th className="p-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {decisions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
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
                    className={`border-b border-border/20 last:border-0 hover:bg-muted/30 cursor-pointer transition-colors duration-100 ${isSelected ? "bg-primary/[0.04]" : ""}`}
                    style={meta.isOverdue ? { borderLeft: "3px solid hsl(var(--destructive) / 0.6)" } : undefined}
                    onClick={() => onPreview(decision)}
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(decision.id)} />
                    </td>

                    {/* Title + category + priority badge + status badges */}
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <QualityScoreBadge decision={decision} />
                        {decision.confidential && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Lock className="w-3.5 h-3.5 text-destructive/70 shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{t("decisions.confidentialLabel")}</TooltipContent>
                          </Tooltip>
                        )}
                        <p className="text-sm font-medium">{decision.title}</p>
                        <DecisionBadges meta={meta} t={t} />
                        <PredictiveSlaInlineBadge decisionId={decision.id} predictions={predictions} />
                      </div>
                      {/* AI Summary (Prompt 16) */}
                      {decision.ai_summary ? (
                        <p className="text-[12px] text-muted-foreground/70 italic mt-0.5 truncate max-w-[400px]">
                          ✦ {decision.ai_summary}
                        </p>
                      ) : decision.description && decision.description.length > 50 ? (
                        <Skeleton className="h-3 w-[60%] mt-1" />
                      ) : null}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{categoryLabels[decision.category]}</span>
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${priorityBadgeStyles[decision.priority]}`}>
                          {priorityLabels[decision.priority]}
                        </Badge>
                      </div>
                    </td>

                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase hover:ring-2 hover:ring-ring/20 transition-all ${statusStyles[decision.status]}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {statusLabels[decision.status]}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                          {statusOptions.filter(s => s.value !== decision.status).map(s => (
                            <DropdownMenuItem key={s.value} onClick={async () => {
                              await supabase.from("decisions").update({ status: s.value as any }).eq("id", decision.id);
                              onInvalidate(); toast.success(`→ ${s.label}`);
                            }} className="gap-2 text-xs">
                              <ArrowRightLeft className="w-3 h-3" /> {s.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>

                    <td className="p-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(profileMap[decision.assignee_id || decision.created_by] || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                          {profileMap[decision.assignee_id || decision.created_by] || "—"}
                        </span>
                        <QuickMessageButton
                          teamId={decision.team_id}
                          decisionId={decision.id}
                          decisionTitle={decision.title}
                          recipientName={profileMap[decision.assignee_id || decision.created_by]}
                          recipientId={decision.assignee_id || decision.created_by}
                        />
                      </div>
                    </td>

                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${(decision.ai_risk_score || 0) > 60 ? "bg-destructive" : (decision.ai_risk_score || 0) > 40 ? "bg-warning" : "bg-success"}`} />
                        <span className="text-xs text-muted-foreground font-mono">{decision.ai_risk_score || 0}%</span>
                      </div>
                    </td>

                    <td className="p-3 hidden md:table-cell">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs ${meta.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                          {decision.due_date ? format(new Date(decision.due_date), "dd.MM.yy", { locale: de }) : "—"}
                        </span>
                        {meta.cost > 0 && (
                          <span className="text-[11px] font-medium text-destructive">
                            ⏱ {meta.cost >= 1000 ? `${(meta.cost / 1000).toFixed(1)}k` : Math.round(meta.cost)}€/Wo
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-0.5">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/decisions/${decision.id}`)}>
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">{t("common.open")}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/decisions/${decision.id}`)} className="gap-2">
                              <Eye className="w-3.5 h-3.5" /> {t("common.open")}
                            </DropdownMenuItem>
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
                      </div>
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

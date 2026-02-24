import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, Clock, AlertTriangle, TrendingUp, ArrowUpRight, Flame, Timer } from "lucide-react";
import AnalysisPageSkeleton from "@/components/shared/AnalysisPageSkeleton";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
import CollapsibleSection from "@/components/dashboard/CollapsibleSection";
import AiInsightPanel from "@/components/shared/AiInsightPanel";
import { useDecisions, useTeams } from "@/hooks/useDecisions";

interface CostEntry { id: string; title: string; status: string; priority: string; category: string; daysOpen: number; dailyCost: number; totalCost: number; dueDate: string | null; isOverdue: boolean; urgencyScore: number; teamName: string | null; }
const priorityMultiplier: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
const categoryMultiplier: Record<string, number> = { strategic: 3, budget: 2.5, hr: 1.8, technical: 1.5, marketing: 1.3, operational: 1 };

const OpportunityCostRadar = ({ embedded }: { embedded?: boolean }) => {
  const { t } = useTranslation();
  const [sortBy, setSortBy] = useState<"urgency" | "daily" | "total">("urgency");
  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: teams = [], isLoading: teamLoading } = useTeams();
  const loading = decLoading || teamLoading;

  const { entries, totalDailyCost, totalAccumulated } = useMemo(() => {
    if (loading) return { entries: [] as CostEntry[], totalDailyCost: 0, totalAccumulated: 0 };
    const openDecisions = decisions.filter(d => ["draft", "review", "approved"].includes(d.status) && d.status !== "cancelled" && d.status !== "superseded");
    const teamMap = Object.fromEntries(teams.map(t => [t.id, { name: t.name, rate: t.hourly_rate || 75 }]));
    const now = Date.now();
    const results: CostEntry[] = openDecisions.map(d => {
      const daysOpen = Math.max(1, Math.floor((now - new Date(d.created_at).getTime()) / 86400000));
      const team = d.team_id ? teamMap[d.team_id] : null;
      const baseRate = team?.rate || 75; const pMult = priorityMultiplier[d.priority] || 1; const cMult = categoryMultiplier[d.category] || 1;
      const dailyCost = Math.round(baseRate * 2 * 2 * pMult * cMult); const totalCost = dailyCost * daysOpen;
      const isOverdue = d.due_date ? new Date(d.due_date).getTime() < now : false;
      const overdueDays = isOverdue && d.due_date ? Math.floor((now - new Date(d.due_date).getTime()) / 86400000) : 0;
      const urgencyScore = Math.round((dailyCost / 100) * pMult + (isOverdue ? overdueDays * 10 : 0) + (daysOpen > 14 ? daysOpen * 2 : 0));
      return { id: d.id, title: d.title, status: d.status, priority: d.priority, category: d.category, daysOpen, dailyCost, totalCost, dueDate: d.due_date, isOverdue, urgencyScore, teamName: team?.name || null };
    });
    results.sort((a, b) => b.urgencyScore - a.urgencyScore);
    return { entries: results, totalDailyCost: results.reduce((s, e) => s + e.dailyCost, 0), totalAccumulated: results.reduce((s, e) => s + e.totalCost, 0) };
  }, [loading, decisions, teams]);

  const sorted = [...entries].sort((a, b) => { if (sortBy === "daily") return b.dailyCost - a.dailyCost; if (sortBy === "total") return b.totalCost - a.totalCost; return b.urgencyScore - a.urgencyScore; });
  const priorityColor: Record<string, string> = { critical: "text-destructive", high: "text-warning", medium: "text-primary", low: "text-muted-foreground" };
  const maxDailyCost = Math.max(...entries.map(e => e.dailyCost), 1);

  if (loading) return <AnalysisPageSkeleton cards={3} sections={2} />;

  const Wrap = embedded ? ({ children }: { children: React.ReactNode }) => <>{children}</> : AppLayout;
  return (
    <Wrap>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("opportunityCost.label")}</p>
          <h1 className="text-xl font-semibold tracking-tight">{t("opportunityCost.title")}</h1>
        </div>
        <PageHelpButton title={t("opportunityCost.title")} description={t("opportunityCost.helpDesc")} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2"><Flame className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">{t("opportunityCost.dailyLosses")}</span></div>
          <p className="text-3xl font-bold tabular-nums text-destructive">{totalDailyCost.toLocaleString("de-DE")} €</p>
          <p className="text-[10px] text-muted-foreground mt-1">{t("opportunityCost.dailyLossesDesc")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">{t("opportunityCost.accumulatedCosts")}</span></div>
          <p className="text-3xl font-bold tabular-nums text-warning">{totalAccumulated.toLocaleString("de-DE")} €</p>
          <p className="text-[10px] text-muted-foreground mt-1">{t("opportunityCost.accumulatedCostsDesc")}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2"><Timer className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">{t("opportunityCost.openDecisions")}</span></div>
          <p className="text-3xl font-bold tabular-nums">{entries.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{t("opportunityCost.ofWhichOverdue", { count: entries.filter(e => e.isOverdue).length })}</p>
        </CardContent></Card>
      </div>

      <CollapsibleSection title={t("opportunityCost.costRanking")} subtitle={t("opportunityCost.costRankingSub", { count: entries.length })} icon={<DollarSign className="w-4 h-4 text-destructive" />} defaultOpen={true}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">{t("opportunityCost.sortLabel")}</span>
          {([{ key: "urgency", label: t("opportunityCost.sortUrgency") }, { key: "daily", label: t("opportunityCost.sortDaily") }, { key: "total", label: t("opportunityCost.sortAccumulated") }] as const).map(s => (
            <button key={s.key} onClick={() => setSortBy(s.key)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${sortBy === s.key ? "bg-foreground/10 text-foreground font-medium" : "text-muted-foreground hover:bg-muted/30"}`}>{s.label}</button>
          ))}
        </div>

        <div className="space-y-2">
          {sorted.map((entry, i) => (
            <Card key={entry.id} className="hover:border-foreground/15 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${i < 3 ? "bg-destructive/20 text-destructive" : "bg-muted/30 text-muted-foreground"}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">{entry.title}</p>
                      {entry.isOverdue && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium shrink-0">{t("opportunityCost.overdue")}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className={`capitalize font-medium ${priorityColor[entry.priority]}`}>● {entry.priority}</span>
                      <span className="capitalize">{entry.category}</span>
                      {entry.teamName && <span>{entry.teamName}</span>}
                      <span><Clock className="w-3 h-3 inline mr-0.5" />{t("opportunityCost.daysOpen", { days: entry.daysOpen })}</span>
                    </div>
                  </div>
                  <div className="w-32 shrink-0 hidden md:block">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${entry.dailyCost / maxDailyCost > 0.7 ? "bg-destructive" : entry.dailyCost / maxDailyCost > 0.4 ? "bg-warning" : "bg-primary"}`} style={{ width: `${(entry.dailyCost / maxDailyCost) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0 w-24">
                    <p className={`text-sm font-bold ${entry.dailyCost > 1000 ? "text-destructive" : entry.dailyCost > 500 ? "text-warning" : "text-muted-foreground"}`}>{entry.dailyCost.toLocaleString("de-DE")} €</p>
                    <p className="text-[10px] text-muted-foreground">{t("opportunityCost.perDay")}</p>
                  </div>
                  <div className="text-right shrink-0 w-28 hidden lg:block">
                    <p className="text-sm font-medium">{entry.totalCost.toLocaleString("de-DE")} €</p>
                    <p className="text-[10px] text-muted-foreground">{t("opportunityCost.accumulated")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {entries.length === 0 && (
          <EmptyAnalysisState icon={DollarSign} title={t("opportunityCost.noCosts")} description={t("opportunityCost.noCostsDesc")} hint={t("opportunityCost.noCostsHint")} />
        )}
      </CollapsibleSection>

      {entries.length > 0 && (
        <AiInsightPanel
          type="bottleneck"
          context={{
            analysisType: "opportunity_cost",
            totalDailyCost,
            totalAccumulated,
            openDecisions: entries.length,
            overdueCount: entries.filter(e => e.isOverdue).length,
            top5: entries.slice(0, 5).map(e => ({
              title: e.title, priority: e.priority, dailyCost: e.dailyCost, totalCost: e.totalCost, daysOpen: e.daysOpen, isOverdue: e.isOverdue
            })),
          }}
          className="mt-6"
        />
      )}
    </Wrap>
  );
};

export default OpportunityCostRadar;

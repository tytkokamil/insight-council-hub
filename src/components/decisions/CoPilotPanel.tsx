import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Compass, AlertTriangle, UserCheck, Users2,
  Zap, ArrowRight, Shield, TrendingDown, ChevronRight,
} from "lucide-react";
import AiFeedbackButton from "@/components/shared/AiFeedbackButton";
import AiExplainabilityBadge from "@/components/shared/AiExplainabilityBadge";
import { useTranslation } from "react-i18next";

interface CoPilotResult {
  rejection_probability: number;
  rejection_reasons: string[];
  delegation_suggestion: { recommended_person: string; reason: string };
  reviewer_suggestions: { name: string; reason: string; priority: string }[];
  process_optimizations: { action: string; impact: string; effort: string }[];
  next_best_action: string;
  confidence: number;
}

const CoPilotPanel = ({ decision }: { decision: any }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CoPilotResult | null>(null);
  const { toast } = useToast();

  const runCoPilot = async () => {
    setLoading(true);
    try {
      let teamMembers: { name: string; role: string }[] = [];
      if (decision.team_id) {
        const { data: members } = await supabase
          .from("team_members").select("user_id").eq("team_id", decision.team_id);
        if (members?.length) {
          const userIds = members.map((m) => m.user_id);
          const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
          const { data: roles } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
          teamMembers = (profiles || []).map((p) => ({
            name: p.full_name || t("coPilot.unknown"),
            role: roles?.find((r) => r.user_id === p.user_id)?.role || "observer",
          }));
        }
      }

      const { data: allDecisions } = await supabase
        .from("decisions").select("status, created_at, implemented_at, category").eq("category", decision.category);
      const total = allDecisions?.length || 1;
      const rejected = allDecisions?.filter((d) => d.status === "rejected").length || 0;
      const implemented = allDecisions?.filter((d) => d.status === "implemented" && d.implemented_at) || [];
      const durations = implemented.map((d) => {
        const diff = new Date(d.implemented_at!).getTime() - new Date(d.created_at).getTime();
        return diff / (1000 * 60 * 60 * 24);
      });
      const avgDurationDays = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

      const { data: reviews } = await supabase.from("decision_reviews").select("feedback, status").eq("status", "rejected");
      const topReasons = reviews?.map((r) => r.feedback).filter(Boolean).slice(0, 3) || [];

      const { data, error } = await supabase.functions.invoke("decision-copilot", {
        body: {
          decision, teamMembers,
          historicalStats: { avgDurationDays, rejectionRate: Math.round((rejected / total) * 100), avgReviews: null, topRejectionReasons: topReasons },
        },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast({ title: t("coPilot.complete") });
    } catch (e: any) {
      toast({ title: t("coPilot.error"), description: e.message || t("coPilot.failed"), variant: "destructive" });
    }
    setLoading(false);
  };

  const impactColor = (v: string) =>
    v === "hoch" || v === "high" ? "text-success" : v === "mittel" || v === "medium" ? "text-warning" : "text-muted-foreground";
  const priorityBadge = (v: string) =>
    v === "hoch" || v === "high" ? "bg-destructive/20 text-destructive" : v === "mittel" || v === "medium" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-primary" /> {t("coPilot.title")}
        </h3>
        <Button size="sm" onClick={runCoPilot} disabled={loading} className="gap-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Compass className="w-3.5 h-3.5" />}
          {loading ? t("coPilot.analyzing") : t("coPilot.start")}
        </Button>
      </div>

      {result ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3" /> {t("coPilot.nextStep")}
            </p>
            <p className="text-sm text-foreground">{result.next_best_action}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-destructive" /> {t("coPilot.rejectionProb")}
              </p>
              <span className={`text-lg font-bold font-display ${result.rejection_probability > 50 ? "text-destructive" : result.rejection_probability > 25 ? "text-warning" : "text-success"}`}>
                {result.rejection_probability}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${result.rejection_probability > 50 ? "bg-destructive" : result.rejection_probability > 25 ? "bg-warning" : "bg-success"}`} style={{ width: `${result.rejection_probability}%` }} />
            </div>
            {result.rejection_reasons.length > 0 && (
              <div className="mt-2 space-y-1">
                {result.rejection_reasons.map((r, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" /> {r}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-xs font-medium flex items-center gap-1 mb-2">
              <UserCheck className="w-3 h-3 text-primary" /> {t("coPilot.delegation")}
            </p>
            <p className="text-sm font-semibold">{result.delegation_suggestion.recommended_person}</p>
            <p className="text-xs text-muted-foreground mt-1">{result.delegation_suggestion.reason}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-xs font-medium flex items-center gap-1 mb-2">
              <Users2 className="w-3 h-3 text-primary" /> {t("coPilot.reviewerSuggestions")}
            </p>
            <div className="space-y-2">
              {result.reviewer_suggestions.map((rs, i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{rs.name}</p>
                    <p className="text-xs text-muted-foreground">{rs.reason}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${priorityBadge(rs.priority)}`}>
                    {rs.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-xs font-medium flex items-center gap-1 mb-2">
              <Zap className="w-3 h-3 text-primary" /> {t("coPilot.processOptimizations")}
            </p>
            <div className="space-y-2">
              {result.process_optimizations.map((po, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">{po.action}</p>
                    <div className="flex gap-3 mt-1">
                      <span className={`text-[10px] ${impactColor(po.impact)}`}>{t("coPilot.impact", { value: po.impact })}</span>
                      <span className="text-[10px] text-muted-foreground">{t("coPilot.effort", { value: po.effort })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <AiExplainabilityBadge confidence={result.confidence} factors={result.rejection_reasons?.slice(0, 3)} sourceType="data" />
          <AiFeedbackButton context="copilot" />
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Compass className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{t("coPilot.emptyTitle")}</p>
        </div>
      )}
    </div>
  );
};

export default CoPilotPanel;

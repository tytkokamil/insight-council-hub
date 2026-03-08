import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { GitBranch, Plus, Loader2, Trash2, Brain, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AiExplainabilityBadge from "@/components/shared/AiExplainabilityBadge";
import { useTranslation } from "react-i18next";

const WhatIfSimulatorPanel = ({ decision }: { decision: any }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProb, setNewProb] = useState(50);
  const [showForm, setShowForm] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const { toast } = useToast();

  const fetchScenarios = async () => {
    const { data } = await supabase
      .from("decision_scenarios")
      .select("*")
      .eq("decision_id", decision.id)
      .order("created_at");
    if (data) setScenarios(data);
  };

  useEffect(() => { fetchScenarios(); }, [decision.id]);

  const addScenario = async () => {
    if (!newTitle.trim() || !user) return;
    await supabase.from("decision_scenarios").insert({
      decision_id: decision.id,
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      probability: newProb,
      created_by: user.id,
    });
    setNewTitle(""); setNewDesc(""); setNewProb(50); setShowForm(false);
    await fetchScenarios();
  };

  const deleteScenario = async (id: string) => {
    await supabase.from("decision_scenarios").delete().eq("id", id);
    await fetchScenarios();
  };

  const runSimulation = async () => {
    if (scenarios.length === 0) {
      toast({ title: t("whatIf.error"), description: t("whatIf.minScenario"), variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("simulate-scenarios", {
        body: { decision, scenarios },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysisResult(data);
      toast({ title: t("whatIf.complete") });
    } catch (e: any) {
      toast({ title: t("whatIf.error"), description: e.message, variant: "destructive" });
    }
    setAnalyzing(false);
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("whatIf.title")}</h3>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3 h-3" /> {t("whatIf.addScenario")}
          </Button>
          <Button size="sm" className="gap-1 text-xs" onClick={runSimulation} disabled={analyzing || scenarios.length === 0}>
            {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
            {t("whatIf.simulate")}
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t("whatIf.scenarioPlaceholder")} className={inputClass} />
          <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder={t("whatIf.descPlaceholder")} className={`${inputClass} h-16 resize-none`} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{t("whatIf.probability", { pct: newProb })}</label>
            <input type="range" min={0} max={100} value={newProb} onChange={(e) => setNewProb(Number(e.target.value))} className="w-full accent-primary" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addScenario} disabled={!newTitle.trim()}>{t("whatIf.add")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>{t("whatIf.cancel")}</Button>
          </div>
        </div>
      )}

      {scenarios.length > 0 ? (
        <div className="space-y-2">
          {scenarios.map(s => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/50">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{s.title}</p>
                {s.description && <p className="text-xs text-muted-foreground truncate">{s.description}</p>}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium shrink-0">{s.probability}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteScenario(s.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{t("whatIf.emptyTitle")}</p>
        </div>
      )}

      {analysisResult && (
        <div className="space-y-3 pt-3 border-t border-border">
          <h4 className="text-xs font-semibold">{t("whatIf.results")}</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-success/10 text-center">
              <p className="text-xs text-muted-foreground">{t("whatIf.bestCase")}</p>
              <p className="text-lg font-bold text-success">{analysisResult.best_case_probability}%</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 text-center">
              <p className="text-xs text-muted-foreground">{t("whatIf.worstCase")}</p>
              <p className="text-lg font-bold text-destructive">{analysisResult.worst_case_probability}%</p>
            </div>
          </div>
          {analysisResult.scenario_results?.map((sr: any, i: number) => (
            <div key={i} className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">{sr.scenario_title}</p>
                <span className="text-xs font-medium">{t("whatIf.risk", { level: sr.risk_level })}</span>
              </div>
              <p className="text-xs text-muted-foreground">{sr.expected_outcome}</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="text-xs">
                  <p className="font-medium text-warning flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("whatIf.mitigation")}</p>
                  <p className="text-muted-foreground">{sr.mitigation}</p>
                </div>
                <div className="text-xs">
                  <p className="font-medium text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t("whatIf.opportunity")}</p>
                  <p className="text-muted-foreground">{sr.opportunity}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 pt-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${sr.impact_score}%` }} />
                </div>
                <span className="text-xs font-medium">{sr.impact_score}%</span>
              </div>
            </div>
          ))}
          <AiExplainabilityBadge
            confidence={analysisResult.confidence || analysisResult.best_case_probability}
            factors={analysisResult.scenario_results?.slice(0, 2).map((sr: any) => sr.scenario_title)}
            dataPoints={scenarios.length}
            sourceType="llm"
            explanation={analysisResult.overall_recommendation?.slice(0, 120) || null}
          />
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1">{t("whatIf.recommendation")}</p>
            <p className="text-xs">{analysisResult.overall_recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatIfSimulatorPanel;

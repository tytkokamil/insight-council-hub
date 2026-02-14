import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Brain, AlertTriangle, CheckCircle2, Loader2, Lightbulb, ThumbsUp, ThumbsDown, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiOption {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  estimated_roi: string;
  confidence: number;
}

const AiAnalysisPanel = ({ decision, onUpdated }: { decision: any; onUpdated: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(
    decision.ai_risk_score ? {
      risk_score: decision.ai_risk_score,
      impact_score: decision.ai_impact_score,
      risk_factors: decision.ai_risk_factors || [],
      success_factors: decision.ai_success_factors || [],
    } : null
  );
  const [options, setOptions] = useState<AiOption[]>(decision.ai_options || []);
  const [recommendation, setRecommendation] = useState<string>("");
  const { toast } = useToast();

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-decision", {
        body: { title: decision.title, description: decision.description, category: decision.category, priority: decision.priority, context: decision.context },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      await supabase.from("decisions").update({
        ai_risk_score: data.risk_score, ai_impact_score: data.impact_score,
        ai_risk_factors: data.risk_factors, ai_success_factors: data.success_factors,
      }).eq("id", decision.id);
      onUpdated();
      toast({ title: "KI-Analyse abgeschlossen", description: data.summary });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "KI-Analyse fehlgeschlagen", variant: "destructive" });
    }
    setLoading(false);
  };

  const runAutopilot = async () => {
    setAutopilotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-decision", {
        body: { title: decision.title, description: decision.description, category: decision.category, priority: decision.priority, context: decision.context, mode: "autopilot" },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
      setOptions(data.options || []);
      setRecommendation(data.recommendation || "");
      await supabase.from("decisions").update({
        ai_risk_score: data.risk_score, ai_impact_score: data.impact_score,
        ai_risk_factors: data.risk_factors, ai_success_factors: data.success_factors,
        ai_options: data.options,
      }).eq("id", decision.id);
      onUpdated();
      toast({ title: "KI-Autopilot abgeschlossen" });
    } catch (e: any) {
      toast({ title: "Fehler", description: e.message || "Autopilot fehlgeschlagen", variant: "destructive" });
    }
    setAutopilotLoading(false);
  };

  const scoreColor = (score: number) =>
    score > 60 ? "text-destructive" : score > 40 ? "text-warning" : "text-success";

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-sm font-medium">KI-gestützte Analyse</h3>
        <div className="flex gap-2">
          <Button size="sm" onClick={runAnalysis} disabled={loading || autopilotLoading} className="gap-1">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
            {loading ? "Analysiere..." : "Risiko-Analyse"}
          </Button>
          <Button size="sm" variant="default" onClick={runAutopilot} disabled={loading || autopilotLoading} className="gap-1 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90">
            {autopilotLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lightbulb className="w-3.5 h-3.5" />}
            {autopilotLoading ? "Generiere..." : "🚀 Autopilot"}
          </Button>
        </div>
      </div>

      {analysis ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Risiko-Score</p>
              <p className={`text-2xl font-bold font-display ${scoreColor(analysis.risk_score)}`}>{analysis.risk_score}%</p>
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${analysis.risk_score > 60 ? "bg-destructive" : analysis.risk_score > 40 ? "bg-warning" : "bg-success"}`} style={{ width: `${analysis.risk_score}%` }} />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground mb-1">Impact-Score</p>
              <p className={`text-2xl font-bold font-display ${scoreColor(100 - analysis.impact_score)}`}>{analysis.impact_score}%</p>
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${analysis.impact_score}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-2"><AlertTriangle className="w-3 h-3" /> Risikofaktoren</p>
              <ul className="space-y-1">
                {(analysis.risk_factors || []).map((f: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-destructive mt-0.5">•</span> {f}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-success flex items-center gap-1 mb-2"><CheckCircle2 className="w-3 h-3" /> Erfolgsfaktoren</p>
              <ul className="space-y-1">
                {(analysis.success_factors || []).map((f: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5"><span className="text-success mt-0.5">•</span> {f}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Autopilot Options */}
          {options.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">KI-Handlungsoptionen</h4>
              </div>
              {recommendation && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs font-medium text-primary mb-1">🎯 Empfehlung</p>
                  <p className="text-xs text-foreground">{recommendation}</p>
                </div>
              )}
              <div className="grid gap-3">
                {options.map((opt, i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-semibold">Option {i + 1}: {opt.title}</h5>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                        {opt.confidence}% Konfidenz
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-success flex items-center gap-1 mb-1"><ThumbsUp className="w-3 h-3" /> Pro</p>
                        {opt.pros.map((p, j) => (
                          <p key={j} className="text-xs text-muted-foreground ml-4">• {p}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1"><ThumbsDown className="w-3 h-3" /> Contra</p>
                        {opt.cons.map((c, j) => (
                          <p key={j} className="text-xs text-muted-foreground ml-4">• {c}</p>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 pt-1">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      <p className="text-xs text-primary font-medium">ROI: {opt.estimated_roi}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Starte die KI-Analyse oder nutze den Autopilot für automatische Handlungsoptionen.</p>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisPanel;

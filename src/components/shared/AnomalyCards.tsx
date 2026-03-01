import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, TrendingUp, Users, Calendar, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Anomaly {
  type: string;
  severity: "critical" | "high" | "medium";
  title: string;
  description: string;
  recommendation: string;
  action?: { label: string; route: string };
  meta?: Record<string, any>;
  isBanner?: boolean;
}

interface AnomalyCardsProps {
  className?: string;
  /** Only show banner-type anomalies (for dashboard) */
  bannersOnly?: boolean;
}

const iconMap: Record<string, typeof AlertTriangle> = {
  blocking_reviewer: Users,
  problem_category: TrendingUp,
  escalating_costs: AlertTriangle,
  seasonal_dip: Calendar,
};

const severityStyles: Record<string, string> = {
  critical: "border-destructive/30 bg-destructive/5",
  high: "border-warning/30 bg-warning/5",
  medium: "border-primary/20 bg-primary/[0.03]",
};

const severityBadge: Record<string, string> = {
  critical: "destructive",
  high: "warning" as any,
  medium: "secondary",
};

const AnomalyCards = ({ className = "", bannersOnly = false }: AnomalyCardsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("detect-anomalies");
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setAnomalies(data?.anomalies || []);
      setFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const dismiss = (idx: number) => {
    setDismissed(prev => new Set(prev).add(String(idx)));
  };

  const visible = anomalies
    .filter((a, i) => !dismissed.has(String(i)))
    .filter(a => bannersOnly ? a.isBanner : true);

  // Not fetched yet — show trigger button
  if (!fetched && !loading) {
    return (
      <Card className={`border-primary/20 bg-primary/[0.02] ${className}`}>
        <CardContent className="p-5 text-center">
          <Sparkles className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">KI-Anomalie-Erkennung</p>
          <p className="text-xs text-muted-foreground mb-3">
            Automatische Erkennung von Problemmustern in Ihren Entscheidungsdaten.
          </p>
          <Button size="sm" onClick={fetchAnomalies} className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Muster analysieren
          </Button>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={`border-primary/20 bg-primary/[0.02] ${className}`}>
        <CardContent className="p-5 text-center">
          <Loader2 className="w-5 h-5 text-primary mx-auto mb-2 animate-spin" />
          <p className="text-sm text-muted-foreground">Analysiere Entscheidungsmuster…</p>
        </CardContent>
      </Card>
    );
  }

  if (visible.length === 0 && fetched) {
    return (
      <Card className={`border-success/20 bg-success/5 ${className}`}>
        <CardContent className="p-5 text-center">
          <p className="text-sm font-medium text-success">✓ Keine Anomalien erkannt</p>
          <p className="text-xs text-muted-foreground mt-1">
            Ihre Entscheidungsprozesse zeigen keine kritischen Muster.
          </p>
          <Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={fetchAnomalies}>
            <RefreshCw className="w-3 h-3" /> Erneut prüfen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <h3 className="text-sm font-semibold">
            Erkannte Anomalien ({visible.length})
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchAnomalies} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {visible.map((anomaly, idx) => {
        const realIdx = anomalies.indexOf(anomaly);
        const Icon = iconMap[anomaly.type] || AlertTriangle;
        return (
          <Card key={realIdx} className={`${severityStyles[anomaly.severity]} transition-all`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  anomaly.severity === "critical" ? "bg-destructive/10" :
                  anomaly.severity === "high" ? "bg-warning/10" : "bg-primary/10"
                }`}>
                  <Icon className={`w-4 h-4 ${
                    anomaly.severity === "critical" ? "text-destructive" :
                    anomaly.severity === "high" ? "text-warning" : "text-primary"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold">{anomaly.title}</p>
                    <Badge variant={anomaly.severity === "critical" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0">
                      {anomaly.severity === "critical" ? "Kritisch" : anomaly.severity === "high" ? "Hoch" : "Mittel"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                  <p className="text-xs text-primary mt-1.5 font-medium">→ {anomaly.recommendation}</p>
                  {anomaly.action && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 gap-1 text-xs h-7"
                      onClick={() => navigate(anomaly.action!.route)}
                    >
                      {anomaly.action.label}
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <button
                  onClick={() => dismiss(realIdx)}
                  className="text-muted-foreground/40 hover:text-muted-foreground shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default AnomalyCards;

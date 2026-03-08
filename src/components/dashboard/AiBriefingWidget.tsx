import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, Zap,
  ArrowRight, RefreshCw, Lock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useAuth } from "@/hooks/useAuth";

const BULLET_ICONS: Record<string, typeof AlertTriangle> = {
  problem: AlertTriangle,
  positive: CheckCircle2,
  recommendation: Zap,
};
const BULLET_COLORS: Record<string, string> = {
  problem: "text-destructive",
  positive: "text-success",
  recommendation: "text-primary",
};

const AiBriefingWidget = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { aiBriefAvailable } = useFreemiumLimits();
  const { user } = useAuth();

  // Trigger 5 — Free plan: show blurred preview
  if (!aiBriefAvailable) {
    return (
      <div className="border border-border rounded-lg p-5 space-y-3 relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-muted-foreground/40" />
          <h3 className="text-sm font-semibold text-muted-foreground/60">{t("widgets.aiBriefing")}</h3>
        </div>
        <div className="space-y-2 opacity-50 blur-[2px] select-none pointer-events-none">
          <p className="text-sm font-medium">[Gesperrt] Engpass bei Schlüsselprojekten…</p>
          <div className="flex items-start gap-1.5 text-xs">
            <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
            <span className="text-muted-foreground">3 Entscheidungen überschreiten SLA um 5+ Tage</span>
          </div>
          <div className="flex items-start gap-1.5 p-2 rounded-md bg-primary/5 text-xs">
            <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
            <span>Priorisiere Budget-Review für Q2 Planung</span>
          </div>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 rounded-lg">
          <Lock className="w-5 h-5 text-muted-foreground mb-1" />
          <p className="text-xs font-medium text-muted-foreground">KI Daily Brief ab Professional</p>
          <Button variant="ghost" size="sm" className="mt-1 text-xs h-7 gap-1 text-primary" onClick={() => navigate("/upgrade")}>
            Upgrade <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Read from daily_briefs table (today's brief)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["daily-brief-widget", user?.id],
    queryFn: async () => {
      // First try daily_briefs table
      const today = new Date().toISOString().slice(0, 10);
      const { data: brief } = await supabase
        .from("daily_briefs" as any)
        .select("*")
        .eq("brief_date", today)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single();

      if (brief) {
        return {
          briefing: (brief as any).content,
          momentum_score: (brief as any).momentum_score,
          generated_at: (brief as any).generated_at,
        };
      }

      // Fallback: call ceo-briefing for on-demand generation
      const { data: fallback, error } = await supabase.functions.invoke("ceo-briefing");
      if (error) throw error;
      if (fallback?.error) throw new Error(fallback.error);
      return fallback;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled: !!user,
  });

  const briefing = data?.briefing;
  const momentum = data?.momentum_score;
  const generatedAt = data?.generated_at;

  if (isLoading) {
    return (
      <div className="border-l-4 border-l-primary bg-primary/[0.04] rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="border border-border rounded-lg p-5 text-center">
        <Sparkles className="w-5 h-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">{t("widgets.aiBriefingUnavailable")}</p>
        <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 gap-1" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3" /> {t("widgets.aiBriefingRetry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="border-l-4 border-l-primary bg-primary/[0.04] rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">✨ {t("widgets.aiBriefing")}</h3>
          {momentum != null && momentum > 0 && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
              momentum > 70 ? "bg-success/10 text-success" : momentum > 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
            }`}>
              {t("briefing.momentum")} {momentum}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-3 h-3 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-6 gap-1" onClick={() => navigate("/briefing")}>
            {t("widgets.details")} <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Headline */}
      <p className="text-sm font-medium">{briefing.headline}</p>

      {/* Structured Bullets with icons */}
      {briefing.bullets?.length > 0 && (
        <div className="space-y-1">
          {briefing.bullets.slice(0, 4).map((b: any, i: number) => {
            const Icon = BULLET_ICONS[b.type] || Zap;
            const color = BULLET_COLORS[b.type] || "text-muted-foreground";
            return (
              <div key={i} className="flex items-start gap-1.5 text-xs">
                <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${color}`} />
                <span className="text-muted-foreground">{b.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Fallback: urgent_actions for old format */}
      {!briefing.bullets && briefing.urgent_actions?.length > 0 && (
        <div className="space-y-1">
          {briefing.urgent_actions.slice(0, 2).map((a: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{a}</span>
            </div>
          ))}
        </div>
      )}

      {briefing.recommendation && (
        <div className="flex items-start gap-1.5 p-2 rounded-md bg-primary/5 text-xs">
          <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
          <span>{briefing.recommendation}</span>
        </div>
      )}

      {/* Footer with generation time */}
      {generatedAt && (
        <p className="text-[10px] text-muted-foreground/50 pt-1">
          Generiert {new Date(generatedAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr
        </p>
      )}
    </div>
  );
};

export default AiBriefingWidget;

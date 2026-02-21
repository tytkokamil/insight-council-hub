import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles, Loader2, AlertTriangle, CheckCircle2, Zap,
  ArrowRight, RefreshCw,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AiBriefingWidget = () => {
  const navigate = useNavigate();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-briefing"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ceo-briefing");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
    meta: { errorMessage: "Briefing konnte nicht geladen werden" },
  });

  const briefing = data?.briefing;
  const momentum = data?.momentum_score;

  if (isLoading) {
    return (
      <div className="border border-primary/20 bg-primary/[0.02] rounded-lg p-5 space-y-3">
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
        <p className="text-xs text-muted-foreground">KI-Briefing nicht verfügbar</p>
        <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 gap-1" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3" /> Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="border border-primary/20 bg-primary/[0.02] rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">KI Daily Brief</h3>
          {momentum != null && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
              momentum > 70 ? "bg-success/10 text-success" : momentum > 40 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
            }`}>
              Momentum {momentum}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-3 h-3 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs h-6 gap-1" onClick={() => navigate("/briefing")}>
            Details <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Headline */}
      <p className="text-sm font-medium">{briefing.headline}</p>

      {/* Urgent actions (max 2) */}
      {briefing.urgent_actions?.length > 0 && (
        <div className="space-y-1">
          {briefing.urgent_actions.slice(0, 2).map((a: string, i: number) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {briefing.recommendation && (
        <div className="flex items-start gap-1.5 p-2 rounded-md bg-primary/5 text-xs">
          <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
          <span>{briefing.recommendation}</span>
        </div>
      )}
    </div>
  );
};

export default AiBriefingWidget;

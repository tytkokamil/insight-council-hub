import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";

const TIER_CONFIG: Record<string, { label: string; fullLabel: string; bg: string; text: string }> = {
  bronze: { label: "BRONZE", fullLabel: "Decision Ready", bg: "bg-amber-800", text: "text-amber-100" },
  silver: { label: "SILVER", fullLabel: "Decision Proficient", bg: "bg-slate-600", text: "text-slate-100" },
  gold: { label: "GOLD", fullLabel: "Decision Excellence", bg: "bg-amber-600", text: "text-amber-50" },
  platinum: { label: "PLATINUM", fullLabel: "Decision Leader", bg: "bg-slate-800", text: "text-blue-100" },
};

const BadgeVerification = () => {
  const { token } = useParams();

  const { data: badge, isLoading } = useQuery({
    queryKey: ["badge-verify", token],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_badges")
        .select("*, organizations(name)")
        .eq("badge_token", token)
        .eq("is_public", true)
        .single();
      return data;
    },
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Verifiziere Badge...</div>
      </div>
    );
  }

  if (!badge) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Badge nicht gefunden</h1>
          <p className="text-sm text-muted-foreground">Dieser Badge existiert nicht oder ist nicht öffentlich.</p>
        </div>
      </div>
    );
  }

  const tier = TIER_CONFIG[badge.tier] || TIER_CONFIG.bronze;
  const isExpired = badge.expires_at && new Date(badge.expires_at) < new Date();
  const orgName = (badge as any).organizations?.name || "Organisation";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center">
        {/* Badge Card */}
        <div className={`rounded-2xl ${tier.bg} ${tier.text} p-8 mb-6 shadow-xl`}>
          <img src="/favicon.png" alt="Decivio" className="w-10 h-10 mx-auto mb-4 opacity-80" />
          <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-70 mb-2">DECIVIO</p>
          <p className="text-2xl font-bold mb-1">DECISION {tier.label}</p>
          <p className="text-sm opacity-70 mb-4">{tier.fullLabel}</p>
          <div className="flex items-center justify-center gap-6 mb-4">
            <div>
              <p className="text-2xl font-bold">{badge.quality_score || 0}</p>
              <p className="text-[10px] uppercase opacity-60">Quality</p>
            </div>
            {badge.velocity_score && (
              <div>
                <p className="text-2xl font-bold">{badge.velocity_score}</p>
                <p className="text-[10px] uppercase opacity-60">Velocity</p>
              </div>
            )}
          </div>
          <p className="text-sm font-semibold">{orgName}</p>
          <p className="text-[10px] opacity-50 mt-2">
            Verifiziert {badge.issued_at ? format(new Date(badge.issued_at), "MMMM yyyy", { locale: de }) : "—"}
          </p>
        </div>

        {isExpired ? (
          <div className="p-4 rounded-lg border border-warning/30 bg-warning/5 mb-6">
            <p className="text-sm font-medium text-warning">Dieser Badge ist abgelaufen.</p>
            <p className="text-xs text-muted-foreground mt-1">Letzte Scores: Quality {badge.quality_score}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-success text-sm mb-6">
            <Shield className="w-4 h-4" />
            <span>Dieser Badge wurde von Decivio verifiziert</span>
          </div>
        )}

        {/* CTA */}
        <div className="p-5 rounded-lg border border-border bg-card">
          <p className="text-sm font-medium mb-3">Beeindruckt? Testen Sie Decivio kostenlos.</p>
          <Link to="/auth">
            <Button className="gap-1.5">
              14 Tage kostenlos testen <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BadgeVerification;

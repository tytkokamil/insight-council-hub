import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Gift, TrendingUp, Users, DollarSign, Clock } from "lucide-react";

const COMMISSIONS: Record<string, { label: string; amount: number }> = {
  starter: { label: "Starter", amount: 117.60 },
  pro: { label: "Professional", amount: 357.60 },
  business: { label: "Business", amount: 357.60 },
  enterprise: { label: "Enterprise", amount: 357.60 },
};

const ReferralPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Fetch or create referral code
  const { data: referralCode, isLoading } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .single();
      if (data) return data.code;

      // Auto-create if missing
      const { data: newCode } = await supabase
        .from("referral_codes")
        .insert({ user_id: user.id })
        .select("code")
        .single();
      return newCode?.code ?? null;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  // Fetch conversions
  const { data: conversions = [] } = useQuery({
    queryKey: ["referral-conversions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("referral_conversions")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const referralLink = referralCode ? `https://decivio.com/ref/${referralCode}` : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Stats
  const totalReferrals = conversions.length;
  const activeReferrals = conversions.filter((c: any) => c.status === "active" || c.status === "released").length;
  const pendingReferrals = conversions.filter((c: any) => c.status === "pending").length;
  const releasedTotal = conversions
    .filter((c: any) => c.status === "released")
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);
  const pendingTotal = conversions
    .filter((c: any) => c.status === "active")
    .reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">{t("settings.referralTitle")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{t("settings.referralDesc")}</p>

      {/* Referral Link */}
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
        <p className="text-[10px] text-muted-foreground mb-1.5">{t("settings.referralYourLink")}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-background px-3 py-2 rounded-md border border-border truncate">
            {isLoading ? "..." : referralLink}
          </code>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={copyLink} disabled={!referralCode}>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t("settings.referralCopied") : t("settings.referralCopy")}
          </Button>
        </div>
      </div>

      {/* Commission Info */}
      <div className="p-3 rounded-lg border border-border bg-card">
        <h3 className="text-xs font-medium mb-2">{t("settings.referralCommission")}</h3>
        <p className="text-[11px] text-muted-foreground mb-3">{t("settings.referralCommissionDesc")}</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(COMMISSIONS).filter(([k]) => k === "starter" || k === "pro").map(([key, val]) => (
            <div key={key} className="p-2 rounded-md border border-border bg-muted/30">
              <p className="text-[10px] text-muted-foreground">{val.label}</p>
              <p className="text-sm font-semibold">€{val.amount.toFixed(2)}</p>
              <p className="text-[9px] text-muted-foreground">{t("settings.referralPerCustomer")}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 italic">{t("settings.referralPayoutInfo")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: t("settings.referralTotalInvites"), value: totalReferrals, icon: Users, color: "text-foreground" },
          { label: t("settings.referralActive"), value: activeReferrals, icon: TrendingUp, color: "text-primary" },
          { label: t("settings.referralPending"), value: pendingReferrals, icon: Clock, color: "text-warning" },
          { label: t("settings.referralEarnings"), value: `€${releasedTotal.toFixed(2)}`, icon: DollarSign, color: "text-success" },
        ].map((stat, i) => (
          <div key={i} className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center gap-1 mb-1">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Pending commission note */}
      {pendingTotal > 0 && (
        <div className="p-2.5 rounded-lg border border-warning/30 bg-warning/5">
          <p className="text-xs text-warning font-medium">
            €{pendingTotal.toFixed(2)} {t("settings.referralPendingRelease")}
          </p>
        </div>
      )}

      {/* Conversion History */}
      {conversions.length > 0 && (
        <div>
          <h3 className="text-xs font-medium mb-2">{t("settings.referralHistory")}</h3>
          <div className="space-y-1">
            {conversions.slice(0, 10).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-md border border-border text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{c.referred_email || "—"}</span>
                  <Badge variant="outline" className="text-[9px]">
                    {COMMISSIONS[c.plan]?.label || c.plan}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">€{Number(c.commission_amount || 0).toFixed(2)}</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      c.status === "released" ? "text-success border-success/30" :
                      c.status === "active" ? "text-primary border-primary/30" :
                      "text-muted-foreground"
                    }`}
                  >
                    {c.status === "released" ? t("settings.referralReleased") :
                     c.status === "active" ? t("settings.referralActiveLabel") :
                     t("settings.referralPendingLabel")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ReferralPanel;

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle2, Gift, TrendingUp, Users, DollarSign, Clock, ExternalLink } from "lucide-react";

const COMMISSIONS: Record<string, { label: string; amount: number }> = {
  starter: { label: "Starter", amount: 117.60 },
  pro: { label: "Professional", amount: 357.60 },
  business: { label: "Business", amount: 357.60 },
  enterprise: { label: "Enterprise", amount: 357.60 },
};

const SHARE_TEXT = "Ich nutze Decivio für Entscheidungs-Governance im Mittelstand — teste es kostenlos:";

const ReferralPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("referral_codes").select("code").eq("user_id", user.id).single();
      if (data) return data.code;
      const { data: newCode } = await supabase.from("referral_codes").insert({ user_id: user.id }).select("code").single();
      return newCode?.code ?? null;
    },
    enabled: !!user,
    staleTime: Infinity,
  });

  const { data: conversions = [] } = useQuery({
    queryKey: ["referral-conversions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from("referral_conversions").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
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

  const shareLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    const text = encodeURIComponent(`${SHARE_TEXT} ${referralLink}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${SHARE_TEXT} ${referralLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const totalReferrals = conversions.length;
  const activeReferrals = conversions.filter((c: any) => c.status === "active" || c.status === "released").length;
  const pendingReferrals = conversions.filter((c: any) => c.status === "pending").length;
  const releasedTotal = conversions.filter((c: any) => c.status === "released").reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);
  const pendingTotal = conversions.filter((c: any) => c.status === "active").reduce((sum: number, c: any) => sum + Number(c.commission_amount || 0), 0);
  const allZero = totalReferrals === 0 && activeReferrals === 0 && pendingReferrals === 0 && releasedTotal === 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">{t("settings.referralTitle")}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{t("settings.referralDesc")}</p>

      {/* Referral Link */}
      <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
        <p className="text-[10px] text-muted-foreground mb-1.5">{t("settings.referralYourLink")}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono bg-background px-3 py-2 rounded-md border border-border/60 truncate">
            {isLoading ? "..." : referralLink}
          </code>
          <Button size="sm" className="gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={copyLink} disabled={!referralCode}>
            {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t("settings.referralCopied") : t("settings.referralCopy")}
          </Button>
        </div>
        {/* Social share buttons */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            style={{ color: "#0A66C2", borderColor: "#0A66C2" }}
            onClick={shareLinkedIn}
            disabled={!referralCode}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            Auf LinkedIn teilen
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            style={{ color: "#25D366", borderColor: "#25D366" }}
            onClick={shareWhatsApp}
            disabled={!referralCode}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
            Per WhatsApp teilen
          </Button>
        </div>
      </div>

      {/* Commission Info */}
      <div className="p-3 rounded-lg border border-border/60 bg-card">
        <h3 className="text-xs font-medium mb-2">{t("settings.referralCommission")}</h3>
        <p className="text-[11px] text-muted-foreground mb-3">{t("settings.referralCommissionDesc")}</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(COMMISSIONS).filter(([k]) => k === "starter" || k === "pro").map(([key, val]) => (
            <div key={key} className="p-2 rounded-md border border-border/60 bg-muted/30">
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
          <div key={i} className="p-3 rounded-lg border border-border/60 bg-card min-h-[90px] flex flex-col justify-center">
            <div className="flex items-center gap-1 mb-1">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className="text-lg font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Motivational block when all values are 0 */}
      {allZero && (
        <div className="p-5 rounded-lg border border-primary/20 bg-primary/5 text-center">
          <Gift className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Teile deinen Link und verdiene bis zu €357 pro Kunde</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Lade Kollegen ein und profitiere von unserem Referral-Programm.</p>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              style={{ color: "#0A66C2", borderColor: "#0A66C2" }}
              onClick={shareLinkedIn}
              disabled={!referralCode}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LinkedIn
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              style={{ color: "#25D366", borderColor: "#25D366" }}
              onClick={shareWhatsApp}
              disabled={!referralCode}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              WhatsApp
            </Button>
          </div>
        </div>
      )}

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
              <div key={c.id} className="flex items-center justify-between p-2 rounded-md border border-border/60 text-xs">
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

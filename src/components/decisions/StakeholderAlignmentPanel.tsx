import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Minus, Users, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const StakeholderAlignmentPanel = ({ decisionId }: { decisionId: string }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [positions, setPositions] = useState<any[]>([]);
  const [myPosition, setMyPosition] = useState<string>("");
  const [myConcerns, setMyConcerns] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const positionConfig = {
    for: { label: t("stakeholder.for"), icon: ThumbsUp, color: "text-success", bg: "bg-success/10 border-success/30" },
    against: { label: t("stakeholder.against"), icon: ThumbsDown, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
    neutral: { label: t("stakeholder.neutral"), icon: Minus, color: "text-muted-foreground", bg: "bg-muted/30 border-border" },
  };

  const fetchPositions = async () => {
    const { data } = await supabase
      .from("stakeholder_positions")
      .select("*, profiles:user_id(full_name)")
      .eq("decision_id", decisionId);
    if (data) {
      setPositions(data);
      const mine = data.find(p => p.user_id === user?.id);
      if (mine) {
        setMyPosition(mine.position);
        setMyConcerns(mine.concerns || "");
      }
    }
  };

  useEffect(() => { fetchPositions(); }, [decisionId]);

  const submitPosition = async (position: string) => {
    if (!user) return;
    setLoading(true);
    const existing = positions.find(p => p.user_id === user.id);
    if (existing) {
      await supabase.from("stakeholder_positions")
        .update({ position, concerns: myConcerns.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("stakeholder_positions").insert({
        decision_id: decisionId, user_id: user.id, position, concerns: myConcerns.trim() || null,
      });
    }
    setMyPosition(position);
    await fetchPositions();
    setLoading(false);
    toast({ title: t("stakeholder.saved") });
  };

  const counts = { for: 0, against: 0, neutral: 0 };
  positions.forEach(p => { if (counts[p.position as keyof typeof counts] !== undefined) counts[p.position as keyof typeof counts]++; });
  const total = positions.length;
  const concerns = positions.filter(p => p.concerns).map(p => ({ name: p.profiles?.full_name || t("stakeholder.anonymous"), concern: p.concerns, position: p.position }));

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("stakeholder.title")}</h3>
        {total > 0 && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted font-medium">{t("stakeholder.votes", { count: total })}</span>
        )}
      </div>

      {total > 0 && (
        <div className="space-y-2">
          <div className="flex h-6 rounded-full overflow-hidden border border-border">
            {counts.for > 0 && (
              <div className="bg-success/60 flex items-center justify-center text-xs font-medium text-success-foreground" style={{ width: `${(counts.for / total) * 100}%` }}>
                {counts.for}
              </div>
            )}
            {counts.neutral > 0 && (
              <div className="bg-muted flex items-center justify-center text-xs font-medium" style={{ width: `${(counts.neutral / total) * 100}%` }}>
                {counts.neutral}
              </div>
            )}
            {counts.against > 0 && (
              <div className="bg-destructive/60 flex items-center justify-center text-xs font-medium text-destructive-foreground" style={{ width: `${(counts.against / total) * 100}%` }}>
                {counts.against}
              </div>
            )}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-success">{t("stakeholder.forCount", { count: counts.for })}</span>
            <span>{t("stakeholder.neutralCount", { count: counts.neutral })}</span>
            <span className="text-destructive">{t("stakeholder.againstCount", { count: counts.against })}</span>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs font-medium">{t("stakeholder.yourPosition")}</p>
        <div className="flex gap-2">
          {(Object.entries(positionConfig) as [string, any][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Button key={key} size="sm" variant={myPosition === key ? "default" : "outline"} className="gap-1.5 text-xs flex-1" disabled={loading} onClick={() => submitPosition(key)}>
                {loading && myPosition === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                {config.label}
              </Button>
            );
          })}
        </div>
        <textarea
          value={myConcerns}
          onChange={(e) => setMyConcerns(e.target.value)}
          placeholder={t("stakeholder.concernsPlaceholder")}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-xs h-16 resize-none"
        />
        {myConcerns && myPosition && (
          <Button size="sm" variant="outline" className="text-xs" onClick={() => submitPosition(myPosition)} disabled={loading}>
            {t("stakeholder.updateConcern")}
          </Button>
        )}
      </div>

      {concerns.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {t("stakeholder.concerns")}</p>
          {concerns.map((c, i) => (
            <div key={i} className={`p-2.5 rounded-lg border text-xs ${positionConfig[c.position as keyof typeof positionConfig]?.bg || "bg-muted/30"}`}>
              <p className="font-medium mb-0.5">{c.name}</p>
              <p className="text-muted-foreground">{c.concern}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StakeholderAlignmentPanel;

import { useState, useEffect } from "react";
import { formatDate } from "@/lib/formatters";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useDecisions";
import { Share2, Users, Check, Eye, MessageSquare, Pencil, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EventTypes } from "@/lib/eventTaxonomy";
import { useTranslation } from "react-i18next";

type SharePermission = "read" | "comment" | "edit";

interface ShareRecord {
  id: string;
  team_id: string;
  permission: SharePermission;
  expires_at: string | null;
  shared_at: string;
  shared_by: string;
}

interface Props {
  decisionId: string;
  decisionTeamId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareDecisionDialog = ({ decisionId, decisionTeamId, open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: teams = [] } = useTeams();
  const [shares, setShares] = useState<ShareRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [permission, setPermission] = useState<SharePermission>("read");
  const [duration, setDuration] = useState("none");
  const [customDate, setCustomDate] = useState("");

  const PERMISSION_CONFIG: Record<SharePermission, { label: string; icon: typeof Eye; description: string }> = {
    read: { label: t("decisions.share.read"), icon: Eye, description: t("decisions.share.readDesc") },
    comment: { label: t("decisions.share.comment"), icon: MessageSquare, description: t("decisions.share.commentDesc") },
    edit: { label: t("decisions.share.editPerm"), icon: Pencil, description: t("decisions.share.editDesc") },
  };

  const DURATION_OPTIONS = [
    { value: "none", label: t("decisions.share.unlimited") },
    { value: "7", label: t("decisions.share.days7") },
    { value: "30", label: t("decisions.share.days30") },
    { value: "90", label: t("decisions.share.days90") },
    { value: "custom", label: t("decisions.share.custom") },
  ];

  const fetchShares = async () => {
    const { data } = await supabase
      .from("decision_shares")
      .select("id, team_id, permission, expires_at, shared_at, shared_by")
      .eq("decision_id", decisionId);
    setShares((data as ShareRecord[]) || []);
  };

  useEffect(() => {
    if (open) {
      fetchShares();
      setSelectedTeamId("");
      setPermission("read");
      setDuration("none");
      setCustomDate("");
    }
  }, [open, decisionId]);

  const availableTeams = teams.filter(
    tm => tm.id !== decisionTeamId && !shares.some(s => s.team_id === tm.id)
  );

  const getExpiresAt = (): string | null => {
    if (duration === "none") return null;
    if (duration === "custom") return customDate ? new Date(customDate + "T23:59:59").toISOString() : null;
    const d = new Date();
    d.setDate(d.getDate() + parseInt(duration));
    return d.toISOString();
  };

  const handleShare = async () => {
    if (!user || !selectedTeamId) return;
    setLoading(true);

    const expires_at = getExpiresAt();
    const { error } = await supabase.from("decision_shares").insert({
      decision_id: decisionId,
      team_id: selectedTeamId,
      shared_by: user.id,
      permission,
      expires_at,
    } as any);

    if (error) {
      toast.error(t("decisions.share.shareError"));
    } else {
      const teamName = teams.find(tm => tm.id === selectedTeamId)?.name || selectedTeamId;
      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: user.id,
        action: EventTypes.DECISION_SHARED,
        field_name: "sharing",
        new_value: `${teamName} (${PERMISSION_CONFIG[permission].label}${expires_at ? `, ${t("decisions.share.limited")}` : ""})`,
      });
      toast.success(t("decisions.share.shared"));
      setSelectedTeamId("");
      setPermission("read");
      setDuration("none");
      await fetchShares();
    }
    setLoading(false);
  };

  const handleUpdatePermission = async (shareId: string, newPermission: SharePermission) => {
    if (!user) return;
    const share = shares.find(s => s.id === shareId);
    const { error } = await supabase
      .from("decision_shares")
      .update({ permission: newPermission } as any)
      .eq("id", shareId);
    if (!error) {
      const teamName = teams.find(tm => tm.id === share?.team_id)?.name || "";
      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: user.id,
        action: EventTypes.DECISION_SHARED,
        field_name: "share_permission",
        old_value: share?.permission,
        new_value: `${teamName}: ${newPermission}`,
      });
      toast.success(t("decisions.share.permissionUpdated"));
      await fetchShares();
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!user) return;
    const share = shares.find(s => s.id === shareId);
    const { error } = await supabase
      .from("decision_shares")
      .delete()
      .eq("id", shareId);
    if (!error) {
      const teamName = teams.find(tm => tm.id === share?.team_id)?.name || "";
      await supabase.from("audit_logs").insert({
        decision_id: decisionId,
        user_id: user.id,
        action: EventTypes.DECISION_SHARED,
        field_name: "share_removed",
        old_value: `${teamName} (${share?.permission})`,
        new_value: null,
      });
      toast.success(t("decisions.share.shareRemoved"));
      await fetchShares();
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            {t("decisions.share.title")}
          </DialogTitle>
        </DialogHeader>

        {shares.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("decisions.share.activeShares")}</p>
            {shares.map(share => {
              const team = teams.find(tm => tm.id === share.team_id);
              const expired = isExpired(share.expires_at);
              const PermIcon = PERMISSION_CONFIG[share.permission]?.icon || Eye;
              return (
                <div
                  key={share.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    expired ? "border-destructive/20 bg-destructive/5 opacity-60" : "border-border bg-muted/30"
                  }`}
                >
                  <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{team?.name || t("decisions.share.unknownTeam")}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {share.expires_at && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {expired ? t("decisions.share.expired") : t("decisions.share.until", { date: formatDate(share.expires_at) })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Select
                    value={share.permission}
                    onValueChange={(v) => handleUpdatePermission(share.id, v as SharePermission)}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs">
                      <div className="flex items-center gap-1.5">
                        <PermIcon className="w-3 h-3" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PERMISSION_CONFIG) as [SharePermission, typeof PERMISSION_CONFIG["read"]][]).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-1.5">
                            <cfg.icon className="w-3 h-3" />
                            {cfg.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveShare(share.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {availableTeams.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("decisions.share.addTeam")}</p>

            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("decisions.share.selectTeam")} />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map(tm => (
                  <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("decisions.share.permission")}</label>
                <Select value={permission} onValueChange={(v) => setPermission(v as SharePermission)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PERMISSION_CONFIG) as [SharePermission, typeof PERMISSION_CONFIG["read"]][]).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-1.5">
                          <cfg.icon className="w-3 h-3" />
                          {cfg.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("decisions.share.duration")}</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {duration === "custom" && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("decisions.share.expiryDate")}</label>
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="h-9"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {PERMISSION_CONFIG[permission].description}
              {duration !== "none" && (
                <span>
                  {" · "}
                  {duration === "custom"
                    ? (customDate ? t("decisions.share.until", { date: formatDate(customDate) }) : t("decisions.share.selectDate"))
                    : `${duration} ${t("decisions.share.days7").replace("7 ", "").replace("7", "")}`}
                </span>
              )}
            </p>

            <Button
              onClick={handleShare}
              disabled={!selectedTeamId || loading || (duration === "custom" && !customDate)}
              className="w-full gap-2"
            >
              <Share2 className="w-4 h-4" />
              {loading ? t("decisions.share.sharing") : t("decisions.share.shareBtn")}
            </Button>
          </div>
        )}

        {availableTeams.length === 0 && shares.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("decisions.share.noTeams")}
          </p>
        )}

        {shares.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {shares.filter(s => !isExpired(s.expires_at)).length === 1
              ? t("decisions.share.sharedWithOne")
              : t("decisions.share.sharedWith", { count: shares.filter(s => !isExpired(s.expires_at)).length })}
            {shares.some(s => isExpired(s.expires_at)) && (
              <span className="text-destructive"> · {t("decisions.share.expiredCount", { count: shares.filter(s => isExpired(s.expires_at)).length })}</span>
            )}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDecisionDialog;

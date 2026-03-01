import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, UserPlus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Props {
  decisionId: string;
  decisionTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteExternalReviewerDialog = ({ decisionId, decisionTitle, open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!user || !name.trim() || !email.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("external_review_tokens")
      .insert({
        decision_id: decisionId,
        reviewer_name: name.trim().substring(0, 100),
        reviewer_email: email.trim().toLowerCase().substring(0, 255),
        invited_by: user.id,
      })
      .select("token")
      .single();

    if (error) {
      toast.error(t("decisions.externalInviteFailed"));
    } else if (data) {
      const link = `${window.location.origin}/review/external?token=${data.token}`;
      setGeneratedLink(link);
      toast.success(t("decisions.externalInviteCreated"));
    }
    setSaving(false);
  };

  const copyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setName("");
      setEmail("");
      setGeneratedLink(null);
      setCopied(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4" />
            {t("decisions.externalInviteTitle")}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t("decisions.externalInviteDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <p className="text-[10px] text-muted-foreground">{t("decisions.externalForDecision")}</p>
            <p className="text-sm font-medium truncate">{decisionTitle}</p>
          </div>

          {!generatedLink ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("decisions.externalName")}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("decisions.externalNamePlaceholder")}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("decisions.externalEmail")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@example.com"
                  maxLength={255}
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px]">30 Tage gültig</Badge>
                <Badge variant="outline" className="text-[9px]">Nur diese Entscheidung</Badge>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{t("decisions.externalLinkReady")}</span>
              </div>
              <div className="p-2 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-[10px] text-muted-foreground mb-1">{t("decisions.externalShareLink")}</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono flex-1 break-all text-foreground">{generatedLink}</code>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyLink}>
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                {t("decisions.externalLinkHint")}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!generatedLink ? (
            <Button onClick={handleInvite} disabled={saving || !name.trim() || !email.trim()} className="gap-1.5">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {t("decisions.externalGenerate")}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)}>
              {t("decisions.externalDone")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteExternalReviewerDialog;

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Copy, CheckCircle2, UserPlus, ExternalLink, Mail } from "lucide-react";
import { toast } from "sonner";

interface Props {
  decisionId: string;
  decisionTitle: string;
  dueDate?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

const InviteExternalReviewerDialog = ({ decisionId, decisionTitle, dueDate, open, onOpenChange, onInvited }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [saving, setSaving] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Prefill message when dialog opens
  const defaultMessage = dueDate
    ? `Bitte reviewe diese Entscheidung bis ${new Date(dueDate).toLocaleDateString("de-DE")}.`
    : "Bitte reviewe diese Entscheidung.";

  const handleInvite = async () => {
    if (!user || !name.trim() || !email.trim()) return;
    setSaving(true);

    const expiresAt = new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("external_review_tokens")
      .insert({
        decision_id: decisionId,
        reviewer_name: name.trim().substring(0, 100),
        reviewer_email: email.trim().toLowerCase().substring(0, 255),
        invited_by: user.id,
        expires_at: expiresAt,
      })
      .select("token")
      .single();

    if (error) {
      toast.error(t("decisions.externalInviteFailed"));
    } else if (data) {
      const link = `${window.location.origin}/review/${data.token}`;
      setGeneratedLink(link);

      // Fire-and-forget: send notification email via edge function
      supabase.functions.invoke("external-review", {
        body: {
          action: "send_invite",
          token: data.token,
          message: (message || defaultMessage).trim().substring(0, 1000),
        },
      }).catch(() => {});

      toast.success(t("decisions.externalInviteCreated"));
      onInvited?.();
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
      setMessage("");
      setExpiryDays("30");
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
            Externen Reviewer einladen
          </DialogTitle>
          <DialogDescription className="text-xs">
            Personen ohne Decivio-Account können diese Entscheidung über einen sicheren Link reviewen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="p-2 rounded-lg bg-muted/50 border border-border">
            <p className="text-[10px] text-muted-foreground">Entscheidung</p>
            <p className="text-sm font-medium truncate">{decisionTitle}</p>
          </div>

          {!generatedLink ? (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">E-Mail-Adresse *</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reviewer@example.com"
                  maxLength={255}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Name (optional)</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  maxLength={100}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Nachricht an Reviewer (optional)</label>
                <Textarea
                  value={message || defaultMessage}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={defaultMessage}
                  rows={2}
                  maxLength={1000}
                  className="resize-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Ablaufdatum des Links</label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Tage</SelectItem>
                    <SelectItem value="14">14 Tage</SelectItem>
                    <SelectItem value="30">30 Tage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[9px]">{expiryDays} Tage gültig</Badge>
                <Badge variant="outline" className="text-[9px]">Nur diese Entscheidung</Badge>
                <Badge variant="outline" className="text-[9px]">Kein Login nötig</Badge>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <span>Einladung erstellt und Link bereit zum Teilen.</span>
              </div>
              <div className="p-2 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-[10px] text-muted-foreground mb-1">Review-Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono flex-1 break-all text-foreground">{generatedLink}</code>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyLink}>
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                <Mail className="w-3 h-3" /> Der Reviewer wurde per E-Mail benachrichtigt.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!generatedLink ? (
            <Button onClick={handleInvite} disabled={saving || !email.trim()} className="gap-1.5">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Einladen
            </Button>
          ) : (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Fertig
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteExternalReviewerDialog;

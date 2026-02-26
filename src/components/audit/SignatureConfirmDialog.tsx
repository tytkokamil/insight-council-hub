import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Fingerprint } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionDescription: string;
  /** Called with the signature method used */
  onConfirm: (signatureMethod: string) => void;
  loading?: boolean;
}

const SignatureConfirmDialog = ({ open, onOpenChange, actionDescription, onConfirm, loading }: Props) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const handlePasswordVerify = async () => {
    if (!password.trim()) return;
    setVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No user");
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      if (error) {
        toast.error(t("audit.signaturePasswordError"));
        setVerifying(false);
        return;
      }
      onConfirm("password");
      setPassword("");
      setAcknowledged(false);
    } catch {
      toast.error(t("audit.signaturePasswordError"));
    }
    setVerifying(false);
  };

  const handleAcknowledge = () => {
    onConfirm("checkbox");
    setPassword("");
    setAcknowledged(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setPassword(""); setAcknowledged(false); } onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-primary" />
            {t("audit.signatureTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-warning">{t("audit.signatureCritical")}</p>
                <p className="text-xs text-muted-foreground mt-1">{actionDescription}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold">{t("audit.signatureMethodPassword")}</p>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("audit.signaturePasswordPlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordVerify()}
            />
            <Button onClick={handlePasswordVerify} disabled={!password.trim() || verifying || loading} className="w-full">
              {verifying ? t("audit.verifying") : t("audit.signWithPassword")}
            </Button>
          </div>

          <div className="relative flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase">{t("common.or")}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={acknowledged}
                onCheckedChange={(v) => setAcknowledged(v === true)}
                id="sig-ack"
              />
              <label htmlFor="sig-ack" className="text-xs text-muted-foreground cursor-pointer leading-relaxed">
                {t("audit.signatureAcknowledge")}
              </label>
            </div>
            <Button variant="outline" onClick={handleAcknowledge} disabled={!acknowledged || loading} className="w-full">
              {t("audit.signWithAcknowledge")}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureConfirmDialog;

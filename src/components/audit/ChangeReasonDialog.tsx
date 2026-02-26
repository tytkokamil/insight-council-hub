import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** e.g. "draft → review" */
  changeDescription?: string;
  onConfirm: (reason: string) => void;
  loading?: boolean;
}

const ChangeReasonDialog = ({ open, onOpenChange, title, changeDescription, onConfirm, loading }: Props) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setReason(""); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {title || t("audit.reasonTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {changeDescription && (
            <p className="text-sm text-muted-foreground">{changeDescription}</p>
          )}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              {t("audit.reasonLabel")} <span className="text-destructive">*</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t("audit.reasonPlaceholder")}
              className="border-primary/30 focus:border-primary"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">{t("audit.reasonHint")}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!reason.trim() || loading}>
            {loading ? t("common.saving") : t("audit.confirmChange")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeReasonDialog;

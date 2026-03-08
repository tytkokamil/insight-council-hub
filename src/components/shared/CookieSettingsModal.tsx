import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Shield, BarChart3, Megaphone, Lock } from "lucide-react";
import { getConsent, setConsent, type CookieConsent } from "@/lib/cookieConsent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CookieSettingsModal = ({ open, onOpenChange }: Props) => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (open) {
      const c = getConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
    }
  }, [open]);

  const save = () => {
    setConsent({ analytics, marketing });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{t("shared.cookieSettingsTitle")}</DialogTitle>
          <DialogDescription className="text-xs">{t("shared.cookieSettingsDesc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Necessary — always on */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("shared.cookieCatNecessary")}</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  {t("shared.cookieAlwaysActive")}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("shared.cookieCatNecessaryDesc")}</p>
            </div>
          </div>

          {/* Analytics */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <BarChart3 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("shared.cookieCatAnalytics")}</p>
                <Switch checked={analytics} onCheckedChange={setAnalytics} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("shared.cookieCatAnalyticsDesc")}</p>
            </div>
          </div>

          {/* Marketing */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border">
            <Megaphone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("shared.cookieCatMarketing")}</p>
                <Switch checked={marketing} onCheckedChange={setMarketing} />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("shared.cookieCatMarketingDesc")}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button size="sm" onClick={save}>
            {t("shared.cookieSaveSettings")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookieSettingsModal;

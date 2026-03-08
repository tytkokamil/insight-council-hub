import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldAlert, Loader2, Hash, CheckCircle2, XCircle } from "lucide-react";

interface VerifyResult {
  valid: boolean;
  total: number;
  verified: number;
  hashed_entries: number;
  broken_at: number | null;
  last_hash: string | null;
}

const AuditIntegrityPanel = () => {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verify = async () => {
    setChecking(true);
    setError(null);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnErr } = await supabase.functions.invoke("verify-audit", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Verification failed");
    }
    setChecking(false);
  };

  return (
    <section>
      <h2 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Hash className="w-4 h-4 text-muted-foreground" />
        {t("settings.auditIntegrityTitle")}
      </h2>
      <p className="text-xs text-muted-foreground mb-3">{t("settings.auditIntegrityDesc")}</p>

      <Button size="sm" onClick={verify} disabled={checking} className="gap-1.5 mb-3 bg-primary hover:bg-primary/90 text-primary-foreground">
        {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
        {checking ? t("settings.auditChecking") : t("settings.auditVerifyButton")}
      </Button>

      {error && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {result && (
        <div className={`p-4 rounded-lg border ${result.valid ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.valid ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-success" />
                <span className="text-sm font-semibold text-success">{t("settings.auditIntact")}</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-destructive" />
                <span className="text-sm font-semibold text-destructive">{t("settings.auditBroken")}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            <div className="p-2 rounded-md border border-border/60 bg-background">
              <p className="text-[9px] text-muted-foreground uppercase">{t("settings.auditTotalEntries")}</p>
              <p className="text-sm font-semibold">{result.total}</p>
            </div>
            <div className="p-2 rounded-md border border-border/60 bg-background">
              <p className="text-[9px] text-muted-foreground uppercase">{t("settings.auditHashedEntries")}</p>
              <p className="text-sm font-semibold">{result.hashed_entries}</p>
            </div>
            <div className="p-2 rounded-md border border-border/60 bg-background">
              <p className="text-[9px] text-muted-foreground uppercase">{t("settings.auditVerified")}</p>
              <p className="text-sm font-semibold">{result.verified}</p>
            </div>
            <div className="p-2 rounded-md border border-border/60 bg-background">
              <p className="text-[9px] text-muted-foreground uppercase">{t("settings.auditStatus")}</p>
              <Badge variant="outline" className={`text-[9px] ${result.valid ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
                {result.valid ? t("settings.auditStatusOk") : t("settings.auditStatusFailed")}
              </Badge>
            </div>
          </div>

          {result.last_hash && (
            <div className="p-2 rounded-md border border-border/60 bg-muted/30">
              <p className="text-[9px] text-muted-foreground uppercase mb-1">{t("settings.auditLastHash")}</p>
              <code className="text-[10px] font-mono text-foreground/80 break-all">{result.last_hash}</code>
            </div>
          )}

          {!result.valid && result.broken_at !== null && (
            <p className="text-xs text-destructive mt-2">
              {t("settings.auditBrokenAt", { index: result.broken_at })}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

export default AuditIntegrityPanel;

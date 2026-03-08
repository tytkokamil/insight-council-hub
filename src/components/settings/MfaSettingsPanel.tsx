import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Smartphone, Mail, CheckCircle2, Loader2, QrCode, Copy, AlertTriangle, Download } from "lucide-react";

type MfaMethod = "none" | "totp" | "email" | "both";

const MfaSettingsPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState<MfaMethod>("none");
  const [backupCodesCount, setBackupCodesCount] = useState(0);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [codesConfirmed, setCodesConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [enrolling, setEnrolling] = useState(false);
  const [totpQr, setTotpQr] = useState<string | null>(null);
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [totpFactorId, setTotpFactorId] = useState<string | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [verifyingTotp, setVerifyingTotp] = useState(false);

  const [enrollingEmail, setEnrollingEmail] = useState(false);
  const [emailVerifyCode, setEmailVerifyCode] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  const [unenrollDialog, setUnenrollDialog] = useState<"totp" | "email" | null>(null);

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("mfa_settings").select("*").eq("user_id", user.id).single();
    if (data) {
      setTotpEnabled(data.totp_enabled);
      setEmailOtpEnabled(data.email_otp_enabled);
      setPreferredMethod(data.preferred_method as MfaMethod);
    }
    // Get backup codes count from edge function
    const { data: statusData } = await supabase.functions.invoke("manage-backup-codes", { body: { action: "status" } });
    if (statusData) {
      setBackupCodesCount(statusData.count || 0);
    }
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors?.totp && factors.totp.length > 0) {
      const verified = factors.totp.some(f => f.status === "verified");
      if (verified && !data?.totp_enabled) {
        await upsertSettings({ totp_enabled: true });
        setTotpEnabled(true);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const upsertSettings = async (updates: Record<string, any>) => {
    if (!user) return;
    const current = { user_id: user.id, totp_enabled: totpEnabled, email_otp_enabled: emailOtpEnabled, preferred_method: preferredMethod, ...updates };
    const totp = current.totp_enabled;
    const email = current.email_otp_enabled;
    if (totp && email) current.preferred_method = "both";
    else if (totp) current.preferred_method = "totp";
    else if (email) current.preferred_method = "email";
    else current.preferred_method = "none";
    await supabase.from("mfa_settings").upsert(current, { onConflict: "user_id" });
    setPreferredMethod(current.preferred_method as MfaMethod);
  };

  const startTotpEnroll = async () => {
    setEnrolling(true);
    setTotpVerifyCode("");
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Decivio Authenticator" });
    if (error) { toast({ title: t("mfa.errorGeneric"), description: error.message, variant: "destructive" }); setEnrolling(false); return; }
    setTotpQr(data.totp.qr_code);
    setTotpSecret(data.totp.secret);
    setTotpFactorId(data.id);
  };

  const verifyTotpEnroll = async () => {
    if (!totpFactorId || totpVerifyCode.length !== 6) return;
    setVerifyingTotp(true);
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactorId });
    if (challengeErr) { toast({ title: t("mfa.errorGeneric"), description: challengeErr.message, variant: "destructive" }); setVerifyingTotp(false); return; }
    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: totpFactorId, challengeId: challenge.id, code: totpVerifyCode });
    if (verifyErr) { toast({ title: t("mfa.invalidCode"), description: t("mfa.invalidCodeDesc"), variant: "destructive" }); setVerifyingTotp(false); return; }
    setTotpEnabled(true);
    await upsertSettings({ totp_enabled: true });
    setEnrolling(false); setTotpQr(null); setTotpSecret(null); setTotpFactorId(null); setVerifyingTotp(false);
    toast({ title: t("mfa.totpActivated"), description: t("mfa.totpActivatedDesc") });
  };

  const unenrollTotp = async () => {
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const totpFactor = factors?.totp?.find(f => f.status === "verified");
    if (totpFactor) await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
    setTotpEnabled(false);
    await upsertSettings({ totp_enabled: false });
    setUnenrollDialog(null);
    toast({ title: t("mfa.totpDeactivated") });
  };

  const startEmailOtpEnroll = async () => {
    setEnrollingEmail(true); setEmailVerifyCode(""); setEmailOtpSent(false);
    const { error } = await supabase.functions.invoke("send-mfa-otp", { body: { action: "send" } });
    if (error) { toast({ title: t("mfa.errorGeneric"), description: t("mfa.otpSendFailed"), variant: "destructive" }); setEnrollingEmail(false); return; }
    setEmailOtpSent(true);
  };

  const verifyEmailOtp = async () => {
    if (emailVerifyCode.length !== 6) return;
    setVerifyingEmail(true);
    const { data, error } = await supabase.functions.invoke("send-mfa-otp", { body: { action: "verify", code: emailVerifyCode } });
    if (error || !data?.verified) { toast({ title: t("mfa.invalidCode"), description: t("mfa.invalidCodeDesc"), variant: "destructive" }); setVerifyingEmail(false); return; }
    setEmailOtpEnabled(true);
    await upsertSettings({ email_otp_enabled: true });
    setEnrollingEmail(false); setEmailOtpSent(false); setVerifyingEmail(false);
    toast({ title: t("mfa.emailActivated"), description: t("mfa.emailActivatedDesc") });
  };

  const unenrollEmail = async () => {
    setEmailOtpEnabled(false);
    await upsertSettings({ email_otp_enabled: false });
    setUnenrollDialog(null);
    toast({ title: t("mfa.emailDeactivated") });
  };

  const generateBackupCodes = async () => {
    if (!user) return;
    setGeneratingCodes(true);
    setCodesConfirmed(false);
    const { data, error } = await supabase.functions.invoke("manage-backup-codes", {
      body: { action: "generate" },
    });
    if (error || !data?.codes) {
      toast({ title: "Fehler", description: "Backup Codes konnten nicht generiert werden.", variant: "destructive" });
      setGeneratingCodes(false);
      return;
    }
    setGeneratedCodes(data.codes);
    setBackupCodesCount(8);
    setShowBackupCodesDialog(true);
    setGeneratingCodes(false);
  };

  const downloadCodes = () => {
    const text = `Decivio MFA Backup Codes\nGeneriert: ${new Date().toLocaleString("de-DE")}\n\n${generatedCodes.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\n⚠️ Jeden Code nur einmal verwenden. Sicher aufbewahren!`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decivio-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCloseBackupDialog = () => {
    if (!codesConfirmed) return; // Can't close without confirming
    setShowBackupCodesDialog(false);
    setGeneratedCodes([]); // Clear plaintext from memory
    toast({ title: t("mfa.backupCodesGenerated") });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{t("mfa.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-medium">{t("mfa.title")}</h3>
        {(totpEnabled || emailOtpEnabled) && (
          <Badge className="text-[10px] bg-success/10 text-success border-success/20">{t("mfa.active")}</Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("mfa.description")}</p>

      {/* TOTP */}
      <div className="p-4 rounded-lg border border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("mfa.authenticator")}</p>
              <p className="text-xs text-muted-foreground">{t("mfa.authenticatorDesc")}</p>
            </div>
          </div>
          {totpEnabled ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-success border-success/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {t("mfa.active")}
              </Badge>
              <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => setUnenrollDialog("totp")}>
                {t("mfa.deactivate")}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startTotpEnroll}>{t("mfa.setup")}</Button>
          )}
        </div>
      </div>

      {/* Email OTP */}
      <div className="p-4 rounded-lg border border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center">
              <Mail className="w-4 h-4 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{t("mfa.emailCode")}</p>
              <p className="text-xs text-muted-foreground">{t("mfa.emailCodeDesc", { email: user?.email })}</p>
            </div>
          </div>
          {emailOtpEnabled ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-success border-success/30">
                <CheckCircle2 className="w-3 h-3 mr-1" /> {t("mfa.active")}
              </Badge>
              <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => setUnenrollDialog("email")}>
                {t("mfa.deactivate")}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={startEmailOtpEnroll}>{t("mfa.setup")}</Button>
          )}
        </div>
      </div>

      {totpEnabled && emailOtpEnabled && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          {t("mfa.bothMethodsHint")}
        </p>
      )}

      {/* Backup Codes */}
      {(totpEnabled || emailOtpEnabled) && (
        <div className="p-4 rounded-lg border border-border/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("mfa.backupCodes")}</p>
                <p className="text-xs text-muted-foreground">
                  {backupCodesCount > 0
                    ? `${backupCodesCount} Backup Codes verfügbar`
                    : t("mfa.backupCodesDesc")}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={generateBackupCodes} disabled={generatingCodes}>
              {generatingCodes ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {backupCodesCount > 0 ? t("mfa.regenerate") : t("mfa.generate")}
            </Button>
          </div>
        </div>
      )}

      {/* Backup Codes One-Time Display Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={(o) => { if (!o && codesConfirmed) handleCloseBackupDialog(); }}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => { if (!codesConfirmed) e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Backup Codes
            </DialogTitle>
          </DialogHeader>

          {/* Warning Banner */}
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Diese Codes werden nur jetzt angezeigt. Speichere sie an einem sicheren Ort.</span>
          </div>

          {/* Codes Grid */}
          <div className="p-4 rounded-lg bg-muted border border-border/60">
            <div className="grid grid-cols-2 gap-2">
              {generatedCodes.map((code, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <code className="text-sm font-mono font-medium">{code}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => {
              navigator.clipboard.writeText(generatedCodes.join("\n"));
              toast({ title: t("mfa.copied") });
            }}>
              <Copy className="w-3.5 h-3.5" /> Kopieren
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadCodes}>
              <Download className="w-3.5 h-3.5" /> Herunterladen (.txt)
            </Button>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start gap-2 pt-2 border-t border-border/60">
            <Checkbox
              id="confirm-codes"
              checked={codesConfirmed}
              onCheckedChange={(v) => setCodesConfirmed(!!v)}
              className="mt-0.5"
            />
            <label htmlFor="confirm-codes" className="text-sm cursor-pointer leading-snug">
              Ich habe die Codes gesichert und verstehe, dass sie nicht erneut angezeigt werden.
            </label>
          </div>

          <Button className="w-full" disabled={!codesConfirmed} onClick={handleCloseBackupDialog}>
            Fertig
          </Button>
        </DialogContent>
      </Dialog>

      {/* TOTP Enrollment Dialog */}
      <Dialog open={enrolling} onOpenChange={(o) => { if (!o) setEnrolling(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="w-4 h-4" /> {t("mfa.setupAuthenticator")}</DialogTitle>
            <DialogDescription>{t("mfa.scanQr")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {totpQr && <div className="flex justify-center"><img src={totpQr} alt="TOTP QR Code" className="w-48 h-48 rounded-lg border border-border/60" /></div>}
            {totpSecret && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-xs font-mono">
                <span className="flex-1 break-all">{totpSecret}</span>
                <button onClick={() => { navigator.clipboard.writeText(totpSecret); toast({ title: t("mfa.copied") }); }}>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-medium">{t("mfa.confirmCode")}</label>
              <InputOTP maxLength={6} value={totpVerifyCode} onChange={setTotpVerifyCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                  <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button className="w-full" onClick={verifyTotpEnroll} disabled={totpVerifyCode.length !== 6 || verifyingTotp}>
              {verifyingTotp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("mfa.verifyActivate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email OTP Enrollment Dialog */}
      <Dialog open={enrollingEmail} onOpenChange={(o) => { if (!o) { setEnrollingEmail(false); setEmailOtpSent(false); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Mail className="w-4 h-4" /> {t("mfa.setupEmailCode")}</DialogTitle>
            <DialogDescription>
              {emailOtpSent ? t("mfa.emailSent", { email: user?.email }) : t("mfa.emailSendPrompt")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!emailOtpSent ? (
              <Button className="w-full" onClick={startEmailOtpEnroll}>{t("mfa.sendCode")}</Button>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium">{t("mfa.enterCode")}</label>
                  <InputOTP maxLength={6} value={emailVerifyCode} onChange={setEmailVerifyCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
                      <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button className="w-full" onClick={verifyEmailOtp} disabled={emailVerifyCode.length !== 6 || verifyingEmail}>
                  {verifyingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {t("mfa.verifyActivate")}
                </Button>
                <button onClick={startEmailOtpEnroll} className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                  {t("mfa.resendCode")}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <Dialog open={!!unenrollDialog} onOpenChange={(o) => { if (!o) setUnenrollDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" /> {t("mfa.deactivateTitle")}
            </DialogTitle>
            <DialogDescription>
              {unenrollDialog === "totp" ? t("mfa.deactivateTotpDesc") : t("mfa.deactivateEmailDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setUnenrollDialog(null)}>{t("mfa.cancel")}</Button>
            <Button variant="destructive" className="flex-1" onClick={unenrollDialog === "totp" ? unenrollTotp : unenrollEmail}>
              {t("mfa.deactivate")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MfaSettingsPanel;

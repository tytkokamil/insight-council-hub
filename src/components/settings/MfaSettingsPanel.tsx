import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Smartphone, Mail, CheckCircle2, Loader2, QrCode, Copy, AlertTriangle } from "lucide-react";

type MfaMethod = "none" | "totp" | "email" | "both";

const MfaSettingsPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [totpEnabled, setTotpEnabled] = useState(false);
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [preferredMethod, setPreferredMethod] = useState<MfaMethod>("none");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [generatingCodes, setGeneratingCodes] = useState(false);
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
      setBackupCodes((data.backup_codes as string[]) || []);
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
    const codes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase()
    );
    await supabase.from("mfa_settings").upsert({ user_id: user.id, backup_codes: codes }, { onConflict: "user_id" });
    setBackupCodes(codes);
    setShowBackupCodes(true);
    setGeneratingCodes(false);
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
      <div className="p-4 rounded-lg border border-border">
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
      <div className="p-4 rounded-lg border border-border">
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
        <div className="p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("mfa.backupCodes")}</p>
                <p className="text-xs text-muted-foreground">{t("mfa.backupCodesDesc")}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={generateBackupCodes} disabled={generatingCodes}>
              {generatingCodes ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              {backupCodes.length > 0 ? t("mfa.regenerate") : t("mfa.generate")}
            </Button>
          </div>
          {showBackupCodes && backupCodes.length > 0 && (
            <div className="mt-3 p-3 rounded-md bg-muted">
              <div className="grid grid-cols-2 gap-1.5">
                {backupCodes.map((code, i) => (
                  <code key={i} className="text-xs font-mono">{code}</code>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join("\n"));
                    toast({ title: t("mfa.copied") });
                  }}
                >
                  <Copy className="w-3 h-3" /> {t("mfa.copyAll")}
                </Button>
                <p className="text-[10px] text-warning">{t("mfa.backupCodesWarning")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TOTP Enrollment Dialog */}
      <Dialog open={enrolling} onOpenChange={(o) => { if (!o) setEnrolling(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><QrCode className="w-4 h-4" /> {t("mfa.setupAuthenticator")}</DialogTitle>
            <DialogDescription>{t("mfa.scanQr")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {totpQr && <div className="flex justify-center"><img src={totpQr} alt="TOTP QR Code" className="w-48 h-48 rounded-lg border border-border" /></div>}
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

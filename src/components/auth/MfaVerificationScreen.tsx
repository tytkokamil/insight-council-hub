import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Smartphone, Mail, Loader2, AlertCircle, KeyRound } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";

interface MfaVerificationScreenProps {
  mfaMethod: "totp" | "email" | "both";
  onVerified: () => void;
  onCancel: () => void;
}

const MfaVerificationScreen = ({ mfaMethod, onVerified, onCancel }: MfaVerificationScreenProps) => {
  const [activeMethod, setActiveMethod] = useState<"totp" | "email" | "backup">(
    mfaMethod === "email" ? "email" : "totp"
  );
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Auto-send email OTP if email is the only/selected method
  useEffect(() => {
    if (activeMethod === "email" && !emailSent) {
      sendEmailOtp();
    }
  }, [activeMethod]);

  const sendEmailOtp = async () => {
    setSendingEmail(true);
    setError("");
    const { error } = await supabase.functions.invoke("send-mfa-otp", {
      body: { action: "send" },
    });
    if (error) {
      setError("Code konnte nicht gesendet werden. Bitte versuche es erneut.");
    } else {
      setEmailSent(true);
    }
    setSendingEmail(false);
  };

  const handleVerify = async () => {
    if (activeMethod === "backup") {
      return handleBackupCodeVerify();
    }
    if (code.length !== 6) return;
    setLoading(true);
    setError("");

    try {
      if (activeMethod === "totp") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totpFactor = factors?.totp?.find(f => f.status === "verified");
        if (!totpFactor) {
          setError("Kein TOTP-Faktor gefunden.");
          setLoading(false);
          return;
        }

        const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });
        if (challengeErr) {
          setError(challengeErr.message);
          setLoading(false);
          return;
        }

        const { error: verifyErr } = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challenge.id,
          code,
        });
        if (verifyErr) {
          setError("Ungültiger Code. Bitte versuche es erneut.");
          setLoading(false);
          return;
        }

        onVerified();
      } else {
        const { data, error: fnError } = await supabase.functions.invoke("send-mfa-otp", {
          body: { action: "verify", code },
        });
        if (fnError || !data?.verified) {
          setError("Ungültiger oder abgelaufener Code.");
          setLoading(false);
          return;
        }
        onVerified();
      }
    } catch (err: any) {
      setError(err.message || "Verifizierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupCodeVerify = async () => {
    const trimmed = backupCode.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("manage-backup-codes", {
        body: { action: "verify", code: trimmed },
      });
      if (fnError || !data?.verified) {
        setError("Ungültiger Backup Code.");
        setLoading(false);
        return;
      }
      onVerified();
    } catch (err: any) {
      setError(err.message || "Verifizierung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-xl overflow-hidden mx-auto mb-3">
            <img src={decivioLogo} alt="Decivio" className="w-full h-full" />
          </div>
          <h1 className="font-display text-xl font-bold">Zwei-Faktor-Verifizierung</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeMethod === "backup"
              ? "Gib einen deiner Backup Codes ein."
              : "Gib den 6-stelligen Code ein, um fortzufahren."}
          </p>
        </div>

        <Card className="border-border/50 shadow-glow">
          <CardContent className="p-6">
            {/* Method switcher */}
            {mfaMethod === "both" && activeMethod !== "backup" && (
              <div className="flex bg-muted rounded-lg p-1 mb-6">
                <button
                  onClick={() => { setActiveMethod("totp"); setCode(""); setError(""); }}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    activeMethod === "totp" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> App
                </button>
                <button
                  onClick={() => { setActiveMethod("email"); setCode(""); setError(""); }}
                  className={`flex-1 py-2 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                    activeMethod === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> E-Mail
                </button>
              </div>
            )}

            {activeMethod === "backup" ? (
              /* Backup Code Input */
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <KeyRound className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Backup Code</p>
                    <p className="text-xs text-muted-foreground">Format: XXXX-XXXX</p>
                  </div>
                </div>

                <Input
                  placeholder="XXXX-XXXX"
                  value={backupCode}
                  onChange={(e) => { setBackupCode(e.target.value); setError(""); }}
                  className="text-center font-mono text-lg tracking-wider"
                  maxLength={9}
                />

                {error && (
                  <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button className="w-full" onClick={handleBackupCodeVerify} disabled={!backupCode.trim() || loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                  Verifizieren
                </Button>

                <button
                  onClick={() => { setActiveMethod(mfaMethod === "email" ? "email" : "totp"); setError(""); setBackupCode(""); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                  Zurück zur Code-Eingabe
                </button>
              </div>
            ) : (
              /* Normal OTP Input */
              <>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {activeMethod === "totp" ? <Smartphone className="w-4 h-4 text-primary" /> : <Mail className="w-4 h-4 text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {activeMethod === "totp" ? "Authenticator-Code" : "E-Mail-Code"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeMethod === "totp"
                        ? "Code aus deiner Authenticator-App"
                        : emailSent ? "Code wurde gesendet" : "Code wird gesendet…"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); setError(""); }}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <Button className="w-full" onClick={handleVerify} disabled={code.length !== 6 || loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                    Verifizieren
                  </Button>

                  {activeMethod === "email" && (
                    <button
                      onClick={sendEmailOtp}
                      disabled={sendingEmail}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                    >
                      {sendingEmail ? "Wird gesendet…" : "Code erneut senden"}
                    </button>
                  )}

                  {/* Backup code link */}
                  <button
                    onClick={() => { setActiveMethod("backup"); setError(""); setCode(""); }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center flex items-center justify-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" /> Backup Code verwenden
                  </button>

                  <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center">
                    Zurück zum Login
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MfaVerificationScreen;

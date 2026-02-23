import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, AlertCircle, Shield, Zap, Timer } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import MfaVerificationScreen from "@/components/auth/MfaVerificationScreen";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import PasswordStrengthIndicator from "@/components/auth/PasswordStrengthIndicator";
import { isLockedOut, recordFailedAttempt, resetAttempts } from "@/lib/rateLimiter";

const Auth = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email" | "both">("totp");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  // Check lockout on mount and tick down
  useEffect(() => {
    const check = () => {
      const { locked, remainingSeconds } = isLockedOut();
      setLockoutSeconds(locked ? remainingSeconds : 0);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const loginSchema = z.object({
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(6, t("auth.minPassword")),
  });
  const signupSchema = loginSchema.extend({
    fullName: z.string().min(2, t("auth.minName")),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Check lockout before attempting
    const lockCheck = isLockedOut();
    if (lockCheck.locked) {
      setError(t("auth.accountLocked", { seconds: lockCheck.remainingSeconds }));
      setLockoutSeconds(lockCheck.remainingSeconds);
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
        const { error } = await signIn(email, password);
        if (error) {
          const result = recordFailedAttempt();
          if (result.locked) {
            setError(t("auth.accountLocked", { seconds: result.lockoutSeconds }));
            setLockoutSeconds(result.lockoutSeconds);
          } else if (error.message.includes("Invalid login")) {
            setError(`${t("auth.wrongCredentials")} (${result.remainingAttempts} ${t("auth.attemptsRemaining")})`);
          } else if (error.message.includes("Email not confirmed")) {
            setError(t("auth.emailNotConfirmed"));
          } else {
            setError(error.message);
          }
        } else {
          resetAttempts();
          // Check if user has MFA enabled
          const { data: mfaSettings } = await supabase
            .from("mfa_settings")
            .select("totp_enabled, email_otp_enabled, preferred_method")
            .eq("user_id", (await supabase.auth.getUser()).data.user?.id || "")
            .single();

          if (mfaSettings && (mfaSettings.totp_enabled || mfaSettings.email_otp_enabled)) {
            const method = mfaSettings.totp_enabled && mfaSettings.email_otp_enabled
              ? "both"
              : mfaSettings.totp_enabled ? "totp" : "email";
            setMfaMethod(method);
            setMfaRequired(true);
          }
        }
      } else {
        signupSchema.parse({ email, password, fullName });
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) setError(t("auth.alreadyRegistered"));
          else setError(error.message);
        } else {
          setSuccess(t("auth.signUpSuccess"));
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) setError(err.errors[0].message);
    } finally {
      setLoading(false);
    }
  };

  if (mfaRequired) {
    return (
      <MfaVerificationScreen
        mfaMethod={mfaMethod}
        onVerified={() => navigate("/dashboard")}
        onCancel={async () => {
          await supabase.auth.signOut();
          setMfaRequired(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-violet/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent-teal/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl overflow-hidden mx-auto mb-4">
            <img src={decivioLogo} alt="Decivio" className="w-full h-full" />
          </div>
          <h1 className="font-display text-2xl font-bold">Decivio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
          </p>
        </div>

        <Card className="border-border/50 shadow-glow">
          <CardContent className="p-6">
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <button onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t("auth.signIn")}
              </button>
              <button onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t("auth.signUp")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("auth.name")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder={t("auth.fullNamePlaceholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("auth.email")}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("auth.password")}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
                </div>
                
                {!isLogin && <PasswordStrengthIndicator password={password} />}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 text-accent-teal text-sm bg-accent-teal/10 border border-accent-teal/20 p-3 rounded-lg">
                  <Zap className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {lockoutSeconds > 0 && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <Timer className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t("auth.lockedTimer", { minutes: Math.ceil(lockoutSeconds / 60), seconds: lockoutSeconds % 60 })}</span>
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading || lockoutSeconds > 0}>
                {loading ? t("auth.loading") : lockoutSeconds > 0 ? t("auth.locked") : isLogin ? t("auth.signIn") : t("auth.signUp")}
              </Button>

              {isLogin && (
                <button type="button" onClick={() => navigate("/reset-password")} className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center">
                  {t("auth.forgotPassword")}
                </button>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Shield className="w-3.5 h-3.5 text-accent-teal/50" />
            {t("auth.gdprCompliant")}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
            <Lock className="w-3.5 h-3.5 text-accent-blue/50" />
            {t("auth.ssl")}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, AlertCircle, Shield, Zap, Timer, Building2 } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [ssoLoading, setSsoLoading] = useState(false);
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

  // Parse invite context from URL
  const [inviteContext] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("invite") || params.get("decision")) {
        return {
          decisionId: params.get("decision"),
          org: params.get("org"),
          from: params.get("from"),
        };
      }
    } catch {}
    return null;
  });

  useEffect(() => {
    if (user) {
      // If there's an invite context with a decision, redirect there
      if (inviteContext?.decisionId) {
        navigate(`/decisions/${inviteContext.decisionId}`);
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate, inviteContext]);

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

  const handleMagicLink = async () => {
    setError("");
    if (!email) { setError(t("auth.invalidEmail")); return; }
    setMagicLinkLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setMagicLinkLoading(false);
    if (error) { setError(error.message); return; }
    setMagicLinkSent(true);
    setMagicLinkEmail(email);
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => { if (prev <= 1) { clearInterval(interval); return 0; } return prev - 1; });
    }, 1000);
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px] text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring" }} className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-primary" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Check Ihr Postfach!</h2>
          <p className="text-muted-foreground text-sm mb-1">Wir haben einen Login-Link an</p>
          <p className="font-medium text-sm mb-1">{magicLinkEmail}</p>
          <p className="text-muted-foreground text-sm mb-6">gesendet. Der Link ist 15 Minuten gültig.</p>
          <Button variant="outline" className="w-full mb-3" disabled={resendTimer > 0} onClick={handleMagicLink}>
            {resendTimer > 0 ? `Link erneut senden (${resendTimer}s)` : "Link erneut senden"}
          </Button>
          <button onClick={() => { setMagicLinkSent(false); setEmail(""); }} className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Andere E-Mail verwenden
          </button>
        </motion.div>
      </div>
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
          {inviteContext ? (
            <div className="mt-2 p-3 rounded-lg bg-primary/[0.05] border border-primary/10">
              <p className="text-sm font-medium text-foreground">
                {inviteContext.from ? `${inviteContext.from} wartet auf Ihre Genehmigung` : "Sie wurden zu einer Entscheidung eingeladen"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Erstellen Sie ein Konto, um direkt zur Entscheidung zu gelangen.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? t("auth.signInSubtitle") : t("auth.signUpSubtitle")}
            </p>
          )}
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

            {/* Magic Link Section (primary for login) */}
            {isLogin && (
              <>
                <div className="space-y-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">{t("auth.email")}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input type="email" placeholder={t("auth.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-[52px] pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" autoFocus />
                    </div>
                  </div>

                  {error && !showPasswordLogin && (
                    <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                    </div>
                  )}

                  <Button size="lg" className="w-full h-[52px] gap-2" onClick={handleMagicLink} disabled={magicLinkLoading || lockoutSeconds > 0}>
                    {magicLinkLoading ? t("auth.loading") : "✉️ Magic Link senden"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Wir senden Ihnen einen sicheren Login-Link — kein Passwort nötig.</p>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span></div>
                </div>

                <button onClick={() => setShowPasswordLogin(!showPasswordLogin)} className="text-sm text-muted-foreground hover:text-foreground w-full text-center mb-3 transition-colors">
                  {showPasswordLogin ? "Passwort-Login ausblenden" : "Mit Passwort anmelden"}
                </button>

                {showPasswordLogin && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">{t("auth.password")}</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input type="password" placeholder={t("auth.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
                      </div>
                    </div>

                    {error && showPasswordLogin && (
                      <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                      </div>
                    )}

                    {lockoutSeconds > 0 && (
                      <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                        <Timer className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t("auth.lockedTimer", { minutes: Math.ceil(lockoutSeconds / 60), seconds: lockoutSeconds % 60 })}</span>
                      </div>
                    )}

                    <Button type="submit" size="lg" className="w-full" disabled={loading || lockoutSeconds > 0}>
                      {loading ? t("auth.loading") : t("auth.signIn")}
                    </Button>

                    <button type="button" onClick={() => navigate("/reset-password")} className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center">
                      {t("auth.forgotPassword")}
                    </button>
                  </form>
                )}
              </>
            )}

            {/* Sign Up Form (unchanged) */}
            {!isLogin && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t("auth.name")}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder={t("auth.fullNamePlaceholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all" />
                  </div>
                </div>

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
                  <PasswordStrengthIndicator password={password} />
                </div>

                {error && (
                  <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="flex items-start gap-2 text-accent-teal text-sm bg-accent-teal/10 border border-accent-teal/20 p-3 rounded-lg">
                    <Zap className="w-4 h-4 shrink-0 mt-0.5" /><span>{success}</span>
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? t("auth.loading") : t("auth.signUp")}
                </Button>
              </form>
            )}

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">{t("auth.or")}</span></div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={async () => {
                  setError("");
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) setError(error.message || t("auth.googleLoginFailed"));
                }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t("auth.signInWithGoogle")}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                disabled={ssoLoading}
                onClick={async () => {
                  setError("");
                  if (!email) {
                    setError("Bitte geben Sie Ihre E-Mail-Adresse ein, um SSO zu nutzen.");
                    return;
                  }
                  const domain = email.split("@")[1];
                  if (!domain) { setError("Ungültige E-Mail-Adresse."); return; }
                  setSsoLoading(true);
                  try {
                    const { data, error: rpcError } = await supabase.rpc("get_sso_config_by_domain", { _domain: domain });
                    if (rpcError || !data || data.length === 0) {
                      setError("Kein SSO für diese Domain konfiguriert.");
                      setSsoLoading(false);
                      return;
                    }
                    const ssoConfig = data[0];
                    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "";
                    const acsUrl = `https://${projectId}.supabase.co/functions/v1/sso-callback`;
                    const samlRequest = btoa(`<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" AssertionConsumerServiceURL="${acsUrl}" Destination="${ssoConfig.sso_url}" IssueInstant="${new Date().toISOString()}" Version="2.0"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">urn:decivio:saml</saml:Issuer></samlp:AuthnRequest>`);
                    window.location.href = `${ssoConfig.sso_url}?SAMLRequest=${encodeURIComponent(samlRequest)}`;
                  } catch {
                    setError("SSO-Login fehlgeschlagen.");
                    setSsoLoading(false);
                  }
                }}
              >
                <Building2 className="w-4 h-4" />
                {ssoLoading ? "Weiterleitung..." : "Mit Unternehmens-SSO anmelden"}
              </Button>
            </div>
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

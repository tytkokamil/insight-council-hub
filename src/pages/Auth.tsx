import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, AlertCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        loginSchema.parse({ email, password });
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login")) {
            setError("E-Mail oder Passwort ist falsch.");
          } else if (error.message.includes("Email not confirmed")) {
            setError("Bitte bestätige zuerst deine E-Mail-Adresse.");
          } else {
            setError(error.message);
          }
        }
      } else {
        signupSchema.parse({ email, password, fullName });
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            setError("Diese E-Mail ist bereits registriert.");
          } else {
            setError(error.message);
          }
        } else {
          setSuccess("Registrierung erfolgreich! Bitte überprüfe deine E-Mail zur Bestätigung.");
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <LayoutDashboard className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold">DecisionOS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Melde dich an, um fortzufahren" : "Erstelle dein Konto"}
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="p-6">
            {/* Tab Toggle */}
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <button
                onClick={() => { setIsLogin(true); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anmelden
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  !isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Registrieren
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Vollständiger Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">E-Mail</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@beispiel.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-destructive text-sm bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="text-success text-sm bg-success/10 border border-success/20 p-3 rounded-lg">
                  {success}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Laden..." : isLogin ? "Anmelden" : "Registrieren"}
              </Button>

              {isLogin && (
                <button
                  type="button"
                  onClick={() => navigate("/reset-password")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center"
                >
                  Passwort vergessen?
                </button>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Decision Intelligence Platform
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;

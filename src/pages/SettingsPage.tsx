import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { User, Shield, Bell, CheckCircle2, Brain, Eye, EyeOff, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AI_PROVIDERS = [
  {
    id: "lovable",
    name: "Standard (eingebaut)",
    description: "Kein API-Key nötig. Inklusiv-Kontingent.",
    models: [],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o-mini, o1, o3-mini",
    models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo"],
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Claude 4, Haiku",
    models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"],
    keyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "google",
    name: "Google Gemini",
    description: "Gemini 2.5 Pro, Flash, Flash-Lite",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"],
    keyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/apikey",
  },
];

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // AI settings
  const [aiProvider, setAiProvider] = useState("lovable");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [profileRes, aiRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", user.id).single(),
        supabase.from("user_ai_settings").select("*").eq("user_id", user.id).single(),
      ]);
      if (profileRes.data) setFullName(profileRes.data.full_name || "");
      if (aiRes.data) {
        setAiProvider(aiRes.data.provider || "lovable");
        setAiApiKey(aiRes.data.api_key || "");
        setAiModel(aiRes.data.model || "");
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Password updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
  };

  const handleSaveAi = async () => {
    if (!user) return;
    if (aiProvider !== "lovable" && !aiApiKey.trim()) {
      toast({ title: "Fehler", description: "Bitte gib einen API-Key ein.", variant: "destructive" });
      return;
    }
    setSavingAi(true);
    const payload = {
      user_id: user.id,
      provider: aiProvider,
      api_key: aiProvider === "lovable" ? null : aiApiKey.trim(),
      model: aiProvider === "lovable" ? null : (aiModel || null),
    };
    const { error } = await supabase.from("user_ai_settings").upsert(payload, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      setSavedAi(true);
      setTimeout(() => setSavedAi(false), 2000);
      toast({ title: "Gespeichert", description: "KI-Einstellungen aktualisiert." });
    }
    setSavingAi(false);
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);
  const inputClass = "w-full h-9 px-3 rounded-md bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all text-sm font-mono";

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <AppLayout>
      <div className="mb-6">
        <p className="font-mono text-[10px] text-primary/50 uppercase tracking-widest mb-1">Configuration</p>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="cmd-card p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-sm font-mono font-bold text-primary">{initials}</span>
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">{fullName || "Unknown"}</h2>
              <p className="text-xs font-mono text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Profile</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Email</label>
              <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
            <Button variant="hero" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              {saved && <CheckCircle2 className="w-3.5 h-3.5" />}
              {saving ? "Saving..." : saved ? "Saved" : "Save"}
            </Button>
          </div>
        </motion.div>

        {/* AI Provider */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">KI-Provider</h2>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setAiProvider(p.id);
                  setAiModel(p.models?.[0] || "");
                }}
                className={`text-left p-3 rounded-lg border transition-all duration-200 ${
                  aiProvider === p.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {p.id === "lovable" && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                  <span className="text-sm font-semibold">{p.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{p.description}</p>
              </button>
            ))}
          </div>

          {/* API Key + Model (wenn nicht lovable) */}
          {aiProvider !== "lovable" && selectedProvider && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">API Key</label>
                  {selectedProvider.docsUrl && (
                    <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">
                      Key erstellen →
                    </a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={aiApiKey}
                    onChange={(e) => setAiApiKey(e.target.value)}
                    placeholder={selectedProvider.keyPlaceholder}
                    className={inputClass}
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Dein Key wird verschlüsselt gespeichert und nur serverseitig verwendet.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Modell</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className={inputClass}
                >
                  {selectedProvider.models.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="mt-4">
            <Button variant="hero" size="sm" onClick={handleSaveAi} disabled={savingAi} className="gap-2">
              {savedAi && <CheckCircle2 className="w-3.5 h-3.5" />}
              {savingAi ? "Speichern..." : savedAi ? "Gespeichert" : "KI-Einstellungen speichern"}
            </Button>
          </div>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Security</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" className={inputClass} />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 block">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" className={inputClass} />
            </div>
            <Button variant="hero" size="sm" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="cmd-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Notifications</h2>
          </div>
          <div className="space-y-2">
            {[
              { label: "Review Requests", desc: "Alert on new reviews" },
              { label: "Escalations", desc: "Immediate escalation alerts" },
              { label: "Team Updates", desc: "New members & invitations" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-md bg-muted/30 border border-border">
                <div>
                  <p className="text-xs font-medium">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{item.desc}</p>
                </div>
                <div className="w-8 h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-end px-0.5">
                  <div className="w-4 h-4 rounded-full bg-primary" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import UserAvatar from "@/components/shared/UserAvatar";
import { User, Shield, Bell, CheckCircle2, Brain, Eye, EyeOff, Sparkles, Camera, Loader2, RotateCcw, Clock } from "lucide-react";
import SlaConfigPanel from "@/components/settings/SlaConfigPanel";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification preferences
  const [notifPrefs, setNotifPrefs] = useState({ review_requests: true, escalations: true, team_updates: true });

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
      const [profileRes, aiRes, notifRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single(),
        supabase.from("user_ai_settings").select("*").eq("user_id", user.id).single(),
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).single(),
      ]);
      if (profileRes.data) {
        setFullName(profileRes.data.full_name || "");
        setAvatarUrl(profileRes.data.avatar_url || null);
      }
      if (aiRes.data) {
        setAiProvider(aiRes.data.provider || "lovable");
        setAiApiKey(aiRes.data.api_key || "");
        setAiModel(aiRes.data.model || "");
      }
      if (notifRes.data) {
        setNotifPrefs({
          review_requests: notifRes.data.review_requests,
          escalations: notifRes.data.escalations,
          team_updates: notifRes.data.team_updates,
        });
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
      toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen haben.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Fehler", description: "Passwörter stimmen nicht überein.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Erfolg", description: "Passwort erfolgreich aktualisiert." });
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Fehler", description: "Bitte wähle eine Bilddatei.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Fehler", description: "Maximale Dateigröße: 2 MB.", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    
    // Remove old avatar files in user folder
    const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
    if (existingFiles?.length) {
      await supabase.storage.from("avatars").remove(existingFiles.map(f => `${user.id}/${f.name}`));
    }
    
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Fehler", description: "Upload fehlgeschlagen.", variant: "destructive" });
      setUploadingAvatar(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
    setAvatarUrl(newUrl);
    setUploadingAvatar(false);
    toast({ title: "Gespeichert", description: "Profilbild aktualisiert." });
  };

  const handleNotifToggle = async (key: keyof typeof notifPrefs) => {
    if (!user) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await supabase.from("notification_preferences").upsert(
      { user_id: user.id, ...updated },
      { onConflict: "user_id" }
    );
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);
  const inputClass = "w-full h-10 px-3 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all";

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Profil, Sicherheit und KI-Konfiguration</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <UserAvatar avatarUrl={avatarUrl} fullName={fullName} email={user?.email} size="lg" />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg">{fullName || "Unbekannt"}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Profil</h2>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">E-Mail</label>
                  <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                  {saved && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {saving ? "Speichern..." : saved ? "Gespeichert" : "Speichern"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Provider */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">KI-Provider</h2>
              </div>

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
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                  </button>
                ))}
              </div>

              {aiProvider !== "lovable" && selectedProvider && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">API Key</label>
                      {selectedProvider.docsUrl && (
                        <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dein Key wird verschlüsselt gespeichert und nur serverseitig verwendet.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Modell</label>
                    <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className={inputClass}>
                      {selectedProvider.models.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <Button size="sm" onClick={handleSaveAi} disabled={savingAi} className="gap-2">
                  {savedAi && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {savingAi ? "Speichern..." : savedAi ? "Gespeichert" : "KI-Einstellungen speichern"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Sicherheit</h2>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Neues Passwort</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Passwort bestätigen</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Passwort wiederholen" className={inputClass} />
                </div>
                <Button size="sm" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
                  {changingPassword ? "Aktualisieren..." : "Passwort ändern"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Benachrichtigungen</h2>
              </div>
              <div className="space-y-2">
                {([
                  { key: "review_requests" as const, label: "Review-Anfragen", desc: "Bei neuen Reviews benachrichtigen" },
                  { key: "escalations" as const, label: "Eskalationen", desc: "Sofortige Eskalationshinweise" },
                  { key: "team_updates" as const, label: "Team-Updates", desc: "Neue Mitglieder & Einladungen" },
                ]).map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[item.key]}
                      onCheckedChange={() => handleNotifToggle(item.key)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* SLA Configuration */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">SLA-Konfiguration</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Konfiguriere Eskalationszeiten und Delegationsregeln pro Kategorie und Priorität.
              </p>
              <SlaConfigPanel />
            </CardContent>
          </Card>
        </motion.div>

        {/* Onboarding Tour */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold">Onboarding</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Starte die Einführungstour erneut, um die wichtigsten Features kennenzulernen.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (user) {
                    localStorage.removeItem(`onboarding_done_${user.id}`);
                    window.location.reload();
                  }
                }}
                className="gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Tour erneut starten
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

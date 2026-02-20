import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import UserAvatar from "@/components/shared/UserAvatar";
import { User, Shield, Bell, CheckCircle2, Brain, Eye, EyeOff, Sparkles, Camera, Loader2, RotateCcw, Clock, Link2, Users, Lock, Beaker, Palette, CreditCard, Globe, Sun, Moon } from "lucide-react";
import SlaConfigPanel from "@/components/settings/SlaConfigPanel";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Badge } from "@/components/ui/badge";

const AI_PROVIDERS = [
  { id: "lovable", name: "Standard (eingebaut)", description: "Kein API-Key nötig. Inklusiv-Kontingent.", models: [] },
  { id: "openai", name: "OpenAI", description: "GPT-4o, GPT-4o-mini, o1, o3-mini", models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo"], keyPlaceholder: "sk-...", docsUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", description: "Claude 3.5 Sonnet, Claude 4, Haiku", models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"], keyPlaceholder: "sk-ant-...", docsUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google Gemini", description: "Gemini 2.5 Pro, Flash, Flash-Lite", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"], keyPlaceholder: "AIza...", docsUrl: "https://aistudio.google.com/apikey" },
];

type SettingsTab = "profile" | "notifications" | "ai" | "integrations" | "roles" | "security" | "features" | "theme" | "billing" | "organization";

const tabs: { key: SettingsTab; label: string; icon: typeof User; adminOnly?: boolean }[] = [
  { key: "profile", label: "Profil", icon: User },
  { key: "notifications", label: "Benachrichtigungen", icon: Bell },
  { key: "ai", label: "KI Einstellungen", icon: Brain },
  { key: "integrations", label: "Integrationen", icon: Link2 },
  { key: "roles", label: "Rollen & Rechte", icon: Users },
  { key: "security", label: "Sicherheit", icon: Lock },
  { key: "features", label: "Feature Flags", icon: Beaker, adminOnly: true },
  { key: "theme", label: "Theme & UI", icon: Palette },
  { key: "billing", label: "Billing", icon: CreditCard, adminOnly: true },
  { key: "organization", label: "Organisation", icon: Globe, adminOnly: true },
];

const roleLabels: Record<string, string> = { admin: "Admin", decision_maker: "Decision Maker", reviewer: "Reviewer", observer: "Observer" };
const roleDescriptions: Record<string, string> = {
  admin: "Vollzugriff auf alle Funktionen, Teams und Systemeinstellungen",
  decision_maker: "Kann Entscheidungen erstellen, bearbeiten und eskalieren",
  reviewer: "Kann Reviews durchführen und Feedback geben",
  observer: "Lesezugriff auf zugewiesene Teams und Entscheidungen",
};

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { flags, loading: flagsLoading, toggleFlag } = useFeatureFlags();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  // Profile state
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({ review_requests: true, escalations: true, team_updates: true });

  // AI
  const [aiProvider, setAiProvider] = useState("lovable");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);

  // Role
  const [userRole, setUserRole] = useState<string>("observer");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [profileRes, aiRes, notifRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("user_id", user.id).single(),
        supabase.from("user_ai_settings").select("*").eq("user_id", user.id).single(),
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
      ]);
      if (profileRes.data) { setFullName(profileRes.data.full_name || ""); setAvatarUrl(profileRes.data.avatar_url || null); }
      if (aiRes.data) { setAiProvider(aiRes.data.provider || "lovable"); setAiApiKey(aiRes.data.api_key || ""); setAiModel(aiRes.data.model || ""); }
      if (notifRes.data) { setNotifPrefs({ review_requests: notifRes.data.review_requests, escalations: notifRes.data.escalations, team_updates: notifRes.data.team_updates }); }
      if (roleRes.data) setUserRole(roleRes.data.role);
    };
    fetchData();
  }, [user]);

  const isAdmin = userRole === "admin";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen haben.", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Fehler", description: "Passwörter stimmen nicht überein.", variant: "destructive" }); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Erfolg", description: "Passwort erfolgreich aktualisiert." }); setNewPassword(""); setConfirmPassword(""); }
    setChangingPassword(false);
  };

  const handleSaveAi = async () => {
    if (!user) return;
    if (aiProvider !== "lovable" && !aiApiKey.trim()) { toast({ title: "Fehler", description: "Bitte gib einen API-Key ein.", variant: "destructive" }); return; }
    setSavingAi(true);
    const payload = { user_id: user.id, provider: aiProvider, api_key: aiProvider === "lovable" ? null : aiApiKey.trim(), model: aiProvider === "lovable" ? null : (aiModel || null) };
    const { error } = await supabase.from("user_ai_settings").upsert(payload, { onConflict: "user_id" });
    if (error) { toast({ title: "Fehler", description: error.message, variant: "destructive" }); }
    else { setSavedAi(true); setTimeout(() => setSavedAi(false), 2000); toast({ title: "Gespeichert", description: "KI-Einstellungen aktualisiert." }); }
    setSavingAi(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Fehler", description: "Bitte wähle eine Bilddatei.", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Fehler", description: "Maximale Dateigröße: 2 MB.", variant: "destructive" }); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
    if (existingFiles?.length) { await supabase.storage.from("avatars").remove(existingFiles.map(f => `${user.id}/${f.name}`)); }
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: "Fehler", description: "Upload fehlgeschlagen.", variant: "destructive" }); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
    setAvatarUrl(newUrl); setUploadingAvatar(false);
    toast({ title: "Gespeichert", description: "Profilbild aktualisiert." });
  };

  const handleNotifToggle = async (key: keyof typeof notifPrefs) => {
    if (!user) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await supabase.from("notification_preferences").upsert({ user_id: user.id, ...updated }, { onConflict: "user_id" });
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);
  const inputClass = "w-full h-10 px-3 rounded-lg bg-background border border-input text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all";

  const visibleTabs = tabs.filter(t => !t.adminOnly || isAdmin);

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-4">
            {/* Profile Header */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <UserAvatar avatarUrl={avatarUrl} fullName={fullName} email={user?.email} size="lg" />
                    <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">{fullName || "Unbekannt"}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{roleLabels[userRole] || userRole}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><User className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Profil bearbeiten</h2></div>
                <div className="space-y-3">
                  <div className="space-y-1.5"><label className="text-sm font-medium">Name</label><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">E-Mail</label><input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} /><p className="text-xs text-muted-foreground">E-Mail kann nicht geändert werden</p></div>
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                    {saved && <CheckCircle2 className="w-3.5 h-3.5" />}{saving ? "Speichern..." : saved ? "Gespeichert" : "Speichern"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Onboarding */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3"><RotateCcw className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Onboarding</h2></div>
                <p className="text-sm text-muted-foreground mb-3">Starte die Einführungstour erneut.</p>
                <Button size="sm" variant="outline" onClick={() => { if (user) { localStorage.removeItem(`onboarding_done_${user.id}`); window.location.reload(); } }} className="gap-2">
                  <RotateCcw className="w-3.5 h-3.5" />Tour erneut starten
                </Button>
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Bell className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Benachrichtigungseinstellungen</h2></div>
                <p className="text-xs text-muted-foreground mb-4">Konfiguriere, welche Benachrichtigungen du erhalten möchtest.</p>
                <div className="space-y-2">
                  {([
                    { key: "review_requests" as const, label: "Review-Anfragen", desc: "Bei neuen Reviews benachrichtigen" },
                    { key: "escalations" as const, label: "Eskalationen", desc: "Sofortige Eskalationshinweise" },
                    { key: "team_updates" as const, label: "Team-Updates", desc: "Neue Mitglieder & Einladungen" },
                  ]).map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                      <Switch checked={notifPrefs[item.key]} onCheckedChange={() => handleNotifToggle(item.key)} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Ruhezeiten</h3>
                <p className="text-xs text-muted-foreground">Keine Push-Benachrichtigungen zwischen 22:00 – 07:00 Uhr. Eskalationen werden trotzdem zugestellt.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Brain className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">KI-Provider</h2></div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {AI_PROVIDERS.map((p) => (
                    <button key={p.id} onClick={() => { setAiProvider(p.id); setAiModel(p.models?.[0] || ""); }}
                      className={`text-left p-3 rounded-lg border transition-all duration-200 ${aiProvider === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-muted/20"}`}>
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
                        {selectedProvider.docsUrl && <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Key erstellen →</a>}
                      </div>
                      <div className="relative">
                        <input type={showApiKey ? "text" : "password"} value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} placeholder={selectedProvider.keyPlaceholder} className={inputClass} />
                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Dein Key wird verschlüsselt gespeichert und nur serverseitig verwendet.</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Modell</label>
                      <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className={inputClass}>
                        {selectedProvider.models.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <Button size="sm" onClick={handleSaveAi} disabled={savingAi} className="gap-2">
                    {savedAi && <CheckCircle2 className="w-3.5 h-3.5" />}{savingAi ? "Speichern..." : savedAi ? "Gespeichert" : "KI-Einstellungen speichern"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Datenschutz</h3>
                <p className="text-xs text-muted-foreground">KI-Funktionen nutzen nur Daten aus deinem Workspace. Keine Daten werden extern gespeichert oder für Training verwendet.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Link2 className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Verbundene Apps</h2></div>
                <div className="space-y-3">
                  {[
                    { name: "Slack / MS Teams", desc: "Eskalationen & Reviews in Channels posten", connected: false },
                    { name: "Google / Outlook Kalender", desc: "Decisions & Tasks mit Kalender synchronisieren", connected: false },
                    { name: "Jira / Asana", desc: "Tasks synchronisieren & Issues verknüpfen", connected: false },
                  ].map((app) => (
                    <div key={app.name} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/10">
                      <div>
                        <p className="text-sm font-medium">{app.name}</p>
                        <p className="text-xs text-muted-foreground">{app.desc}</p>
                      </div>
                      <Button size="sm" variant="outline" disabled>{app.connected ? "Verbunden" : "Verbinden"}</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">API & Webhooks</h3>
                <p className="text-xs text-muted-foreground">API-Keys und Webhooks werden in einer zukünftigen Version verfügbar sein.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "roles":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Rollen & Berechtigungen</h2></div>
                <p className="text-xs text-muted-foreground mb-4">Deine aktuelle Rolle: <Badge variant="outline" className="ml-1">{roleLabels[userRole]}</Badge></p>
                <div className="space-y-2">
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <div key={key} className={`p-3 rounded-lg border ${key === userRole ? "border-primary bg-primary/5" : "border-border bg-muted/10"}`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{label}</p>
                        {key === userRole && <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">Deine Rolle</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{roleDescriptions[key]}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-4">Rollenzuweisung kann nur durch Admins in der Nutzerverwaltung geändert werden.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Passwort ändern</h2></div>
                <div className="space-y-3">
                  <div className="space-y-1.5"><label className="text-sm font-medium">Neues Passwort</label><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mind. 6 Zeichen" className={inputClass} /></div>
                  <div className="space-y-1.5"><label className="text-sm font-medium">Passwort bestätigen</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Passwort wiederholen" className={inputClass} /></div>
                  <Button size="sm" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>{changingPassword ? "Aktualisieren..." : "Passwort ändern"}</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">Sicherheitsrichtlinien</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• 2FA wird in einer zukünftigen Version unterstützt</p>
                  <p>• SSO ist für Enterprise-Kunden verfügbar</p>
                  <p>• Session-Timeout: 24 Stunden Inaktivität</p>
                </div>
              </CardContent>
            </Card>
            {/* SLA */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">SLA-Konfiguration</h2></div>
                <p className="text-xs text-muted-foreground mb-3">Eskalationszeiten und Delegationsregeln pro Kategorie und Priorität.</p>
                <SlaConfigPanel />
              </CardContent>
            </Card>
          </div>
        );

      case "features":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Beaker className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Feature Flags</h2></div>
                <p className="text-xs text-muted-foreground mb-4">Aktiviere oder deaktiviere Module. Deaktivierte Module verschwinden aus der Navigation.</p>
                {flagsLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-2">
                    {flags.map((flag) => (
                      <div key={flag.feature_key} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${flag.enabled ? "bg-muted/20 border-border" : "bg-muted/5 border-border/40 opacity-60"}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{flag.label}</p>
                          {flag.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{flag.description}</p>}
                        </div>
                        <Switch checked={flag.enabled} onCheckedChange={(checked) => toggleFlag(flag.feature_key, checked)} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case "theme":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Palette className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Theme & UI</h2></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-warning" />}
                      <div>
                        <p className="text-sm font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
                        <p className="text-xs text-muted-foreground">Wechsle zwischen Hell und Dunkel</p>
                      </div>
                    </div>
                    <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold mb-3">UI Optionen</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• Farbthemes werden in einer zukünftigen Version konfigurierbar</p>
                  <p>• Compact Mode und Animation-Steuerung kommen bald</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><CreditCard className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Billing & Plan</h2></div>
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-sm font-medium">Aktueller Plan: <span className="text-primary">Pilot</span></p>
                  <p className="text-xs text-muted-foreground mt-1">Unlimitierte Nutzer während der Pilotphase</p>
                </div>
                <p className="text-xs text-muted-foreground">Billing-Funktionen werden mit dem Produktionsrelease verfügbar.</p>
              </CardContent>
            </Card>
          </div>
        );

      case "organization":
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4"><Globe className="w-4 h-4 text-primary" /><h2 className="text-sm font-semibold">Organisation</h2></div>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Organisations-Einstellungen (Name, Logo, Datenregion, Retention Policy) sind für Enterprise-Kunden verfügbar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold">Einstellungen</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Profil, Sicherheit, KI und Systemkonfiguration</p>
      </div>

      <div className="flex gap-6 max-w-4xl">
        {/* Sidebar Tabs */}
        <nav className="w-48 shrink-0 space-y-0.5">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.key
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

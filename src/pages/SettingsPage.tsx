import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import UserAvatar from "@/components/shared/UserAvatar";
import { User, Shield, Bell, CheckCircle2, Brain, Eye, EyeOff, Sparkles, Camera, Loader2, RotateCcw, Clock, Palette, Sun, Moon, Beaker, Globe } from "lucide-react";
import SlaConfigPanel from "@/components/settings/SlaConfigPanel";
import DelegationPanel from "@/components/settings/DelegationPanel";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

const AI_PROVIDERS = [
  { id: "lovable", name: "Standard (eingebaut)", description: "noApiKeyNeeded", models: [] },
  { id: "openai", name: "OpenAI", description: "GPT-4o, o1, o3-mini", models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo"], keyPlaceholder: "sk-...", docsUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", description: "Claude 4, Sonnet, Haiku", models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"], keyPlaceholder: "sk-ant-...", docsUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google Gemini", description: "Gemini 2.5 Pro, Flash", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"], keyPlaceholder: "AIza...", docsUrl: "https://aistudio.google.com/apikey" },
];

type SettingsTab = "general" | "notifications" | "ai" | "security" | "admin";

const roleLabels: Record<string, string> = { org_owner: "Org Owner", org_admin: "Org Admin", org_member: "Mitglied" };

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const { flags, loading: flagsLoading, toggleFlag } = useFeatureFlags();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({ review_requests: true, escalations: true, team_updates: true });

  const [aiProvider, setAiProvider] = useState("lovable");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);

  const [userRole, setUserRole] = useState<string>("org_member");

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

  const isAdmin = userRole === "org_owner" || userRole === "org_admin";

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({ full_name: fullName }).eq("user_id", user.id);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast({ title: t("settings.error"), description: t("settings.passwordMinError"), variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: t("settings.error"), description: t("settings.passwordMismatch"), variant: "destructive" }); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast({ title: t("settings.error"), description: error.message, variant: "destructive" });
    else { toast({ title: t("settings.success"), description: t("settings.passwordUpdated") }); setNewPassword(""); setConfirmPassword(""); }
    setChangingPassword(false);
  };

  const handleSaveAi = async () => {
    if (!user) return;
    if (aiProvider !== "lovable" && !aiApiKey.trim()) { toast({ title: t("settings.error"), description: t("settings.enterApiKey"), variant: "destructive" }); return; }
    setSavingAi(true);
    const payload = { user_id: user.id, provider: aiProvider, api_key: aiProvider === "lovable" ? null : aiApiKey.trim(), model: aiProvider === "lovable" ? null : (aiModel || null) };
    const { error } = await supabase.from("user_ai_settings").upsert(payload, { onConflict: "user_id" });
    if (error) toast({ title: t("settings.error"), description: error.message, variant: "destructive" });
    else { setSavedAi(true); setTimeout(() => setSavedAi(false), 2000); }
    setSavingAi(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: t("settings.error"), description: t("settings.selectImage"), variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: t("settings.error"), description: t("settings.maxFileSize"), variant: "destructive" }); return; }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { data: existingFiles } = await supabase.storage.from("avatars").list(user.id);
    if (existingFiles?.length) await supabase.storage.from("avatars").remove(existingFiles.map(f => `${user.id}/${f.name}`));
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) { toast({ title: t("settings.error"), description: t("settings.uploadFailed"), variant: "destructive" }); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
    setAvatarUrl(newUrl); setUploadingAvatar(false);
  };

  const handleNotifToggle = async (key: keyof typeof notifPrefs) => {
    if (!user) return;
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await supabase.from("notification_preferences").upsert({ user_id: user.id, ...updated }, { onConflict: "user_id" });
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);
  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  const tabs: { key: SettingsTab; label: string; show?: boolean }[] = [
    { key: "general", label: t("settings.general") },
    { key: "notifications", label: t("settings.notifications") },
    { key: "ai", label: t("settings.ai") },
    { key: "security", label: t("settings.security") },
    { key: "admin", label: t("settings.admin"), show: isAdmin },
  ];

  const visibleTabs = tabs.filter(t => t.show !== false);

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-lg font-semibold tracking-tight">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>

        <div className="flex items-center gap-1 border-b border-border mb-8">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                activeTab === tab.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div layoutId="settings-tab" className="absolute bottom-0 left-0 right-0 h-px bg-foreground" />
              )}
            </button>
          ))}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
          {activeTab === "general" && (
            <div className="space-y-8">
              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.profile")}</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <UserAvatar avatarUrl={avatarUrl} fullName={fullName} email={user?.email} size="lg" />
                      <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{fullName || t("settings.unknown")}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="outline" className="mt-1.5 text-[10px] font-normal">{roleLabels[userRole] || userRole}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.nameLabel")}</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.emailLabel")}</label>
                      <input type="email" value={user?.email || ""} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
                    </div>
                    <Button size="sm" variant="outline" onClick={handleSave} disabled={saving} className="w-fit gap-1.5">
                      {saved && <CheckCircle2 className="w-3 h-3" />}{saving ? t("settings.saving") : saved ? t("settings.saved") : t("settings.save")}
                    </Button>
                  </div>
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.appearance")}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm">{theme === "dark" ? t("settings.darkMode") : t("settings.lightMode")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.switchTheme")}</p>
                    </div>
                  </div>
                  <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
                </div>
              </section>

              <hr className="border-border" />

              {/* Language */}
              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.language")}</h2>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm">{t("settings.language")}</p>
                      <p className="text-xs text-muted-foreground">{t("settings.languageDesc")}</p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-md border border-border p-0.5">
                    {([
                      { code: "de", label: t("settings.german") },
                      { code: "en", label: t("settings.english") },
                    ]).map(lng => (
                      <button
                        key={lng.code}
                        onClick={() => changeLanguage(lng.code)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          i18n.language === lng.code
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {lng.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-3">{t("settings.onboarding")}</h2>
                <p className="text-xs text-muted-foreground mb-3">{t("settings.onboardingDesc")}</p>
                <Button size="sm" variant="outline" onClick={() => { if (user) { localStorage.removeItem(`onboarding_done_${user.id}`); window.location.href = "/dashboard"; } }} className="gap-1.5">
                  <RotateCcw className="w-3 h-3" />{t("settings.restartTour")}
                </Button>
              </section>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.notifications")}</h2>
                <div className="space-y-1">
                  {([
                    { key: "review_requests" as const, label: t("settings.reviewRequests"), desc: t("settings.reviewRequestsDesc") },
                    { key: "escalations" as const, label: t("settings.escalations"), desc: t("settings.escalationsDesc") },
                    { key: "team_updates" as const, label: t("settings.teamUpdates"), desc: t("settings.teamUpdatesDesc") },
                  ]).map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={notifPrefs[item.key]} onCheckedChange={() => handleNotifToggle(item.key)} />
                    </div>
                  ))}
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-2">{t("settings.quietHours")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.quietHoursDesc")}</p>
              </section>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.aiProvider")}</h2>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {AI_PROVIDERS.map((p) => (
                    <button key={p.id} onClick={() => { setAiProvider(p.id); setAiModel(p.models?.[0] || ""); }}
                      className={`text-left p-3 rounded-md border transition-colors ${aiProvider === p.id ? "border-foreground" : "border-border hover:border-foreground/30"}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {p.id === "lovable" && <Sparkles className="w-3 h-3" />}
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.id === "lovable" ? t("settings.noApiKeyNeeded") : p.description}</p>
                    </button>
                  ))}
                </div>
                {aiProvider !== "lovable" && selectedProvider && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-muted-foreground">{t("settings.apiKey")}</label>
                        {selectedProvider.docsUrl && <a href={selectedProvider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("settings.createKey")}</a>}
                      </div>
                      <div className="relative">
                        <input type={showApiKey ? "text" : "password"} value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} placeholder={selectedProvider.keyPlaceholder} className={inputClass} />
                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.model")}</label>
                      <select value={aiModel} onChange={(e) => setAiModel(e.target.value)} className={inputClass}>
                        {selectedProvider.models.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                <div className="mt-4">
                  <Button size="sm" variant="outline" onClick={handleSaveAi} disabled={savingAi} className="gap-1.5">
                    {savedAi && <CheckCircle2 className="w-3 h-3" />}{savingAi ? t("settings.saving") : savedAi ? t("settings.saved") : t("settings.save")}
                  </Button>
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-2">{t("settings.privacy")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.privacyDesc")}</p>
              </section>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.changePassword")}</h2>
                <div className="space-y-3 max-w-sm">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.newPassword")}</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("settings.newPasswordPlaceholder")} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.confirmPassword")}</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("settings.confirmPasswordPlaceholder")} className={inputClass} />
                  </div>
                  <Button size="sm" variant="outline" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
                    {changingPassword ? t("settings.updating") : t("settings.changePassword")}
                  </Button>
                </div>
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.slaConfig")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.slaConfigDesc")}</p>
                <SlaConfigPanel />
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.delegation")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.delegationDesc")}</p>
                <DelegationPanel />
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-2">{t("settings.securityNotes")}</h2>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p>• {t("settings.securityNote1")}</p>
                  <p>• {t("settings.securityNote2")}</p>
                  <p>• {t("settings.securityNote3")}</p>
                </div>
              </section>
            </div>
          )}

          {activeTab === "admin" && isAdmin && (
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-medium mb-4">{t("settings.featureFlags")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.featureFlagsDesc")}</p>
                {flagsLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />)}</div>
                ) : (
                  <div className="space-y-1">
                    {flags.map((flag) => (
                      <div key={flag.feature_key} className={`flex items-center justify-between py-3 ${!flag.enabled ? "opacity-50" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{flag.label}</p>
                          {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
                        </div>
                        <Switch checked={flag.enabled} onCheckedChange={(checked) => toggleFlag(flag.feature_key, checked)} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <hr className="border-border" />

              <section>
                <h2 className="text-sm font-medium mb-2">{t("settings.roles")}</h2>
                <p className="text-xs text-muted-foreground mb-3">{t("settings.yourRole")} <Badge variant="outline" className="ml-1 text-[10px] font-normal">{roleLabels[userRole]}</Badge></p>
                <p className="text-xs text-muted-foreground">{t("settings.roleManagement")}</p>
              </section>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

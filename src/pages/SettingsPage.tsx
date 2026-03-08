import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import UserAvatar from "@/components/shared/UserAvatar";
import {
  User, Shield, Bell, CheckCircle2, Brain, Eye, EyeOff, Sparkles, Camera, Loader2,
  RotateCcw, Clock, Sun, Moon, Globe, Activity, Users, Lock, Zap,
  AlertTriangle, ShieldCheck, FileText, Settings2, Palette, Building2, KeyRound,
  Server, ChevronRight, Gift, Plug, Scale, CreditCard, Database
} from "lucide-react";
import SubNav from "@/components/shared/SubNav";
import PageHeader from "@/components/shared/PageHeader";
import SlaConfigPanel from "@/components/settings/SlaConfigPanel";
import DelegationPanel from "@/components/settings/DelegationPanel";
import MfaSettingsPanel from "@/components/settings/MfaSettingsPanel";
import ActiveSessionsPanel from "@/components/settings/ActiveSessionsPanel";
import OrgCodDefaultsPanel from "@/components/settings/OrgCodDefaultsPanel";
import IndustryConfigSection from "@/components/settings/IndustryConfigSection";
import TerminologyPanel from "@/components/settings/TerminologyPanel";
import WhatsAppSettingsPanel from "@/components/settings/WhatsAppSettingsPanel";
import InboundEmailPanel from "@/components/settings/InboundEmailPanel";
import TeamsIntegrationPanel from "@/components/settings/TeamsIntegrationPanel";
import WebhookSettingsPanel from "@/components/settings/WebhookSettingsPanel";
import CalendarSyncPanel from "@/components/settings/CalendarSyncPanel";
import AuditIntegrityPanel from "@/components/settings/AuditIntegrityPanel";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import ReferralPanel from "@/components/settings/ReferralPanel";
import PublicDashboardLinks from "@/components/dashboard/PublicDashboardLinks";
import NotificationMatrixPanel from "@/components/settings/NotificationMatrixPanel";
import AccountDeletionPanel from "@/components/settings/AccountDeletionPanel";
import BillingPanel from "@/components/settings/BillingPanel";
import SsoSettingsPanel from "@/components/settings/SsoSettingsPanel";
import BrandingPanel from "@/components/settings/BrandingPanel";
import ApiKeysPanel from "@/components/settings/ApiKeysPanel";
import DataRetentionPanel from "@/components/settings/DataRetentionPanel";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";

const AI_PROVIDERS = [
  { id: "lovable", name: "Standard (eingebaut)", description: "noApiKeyNeeded", models: [] },
  { id: "openai", name: "OpenAI", description: "GPT-4o, o1, o3-mini", models: ["gpt-4o", "gpt-4o-mini", "o1", "o3-mini", "gpt-4-turbo"], keyPlaceholder: "sk-...", docsUrl: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", description: "Claude 4, Sonnet, Haiku", models: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"], keyPlaceholder: "sk-ant-...", docsUrl: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google Gemini", description: "Gemini 2.5 Pro, Flash", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"], keyPlaceholder: "AIza...", docsUrl: "https://aistudio.google.com/apikey" },
];

type SettingsTab = "general" | "notifications" | "ai" | "security" | "sso" | "branding" | "governance" | "integrations" | "api" | "billing" | "referral" | "admin";

const roleLabels: Record<string, string> = { org_owner: "Org Owner", org_admin: "Org Admin", org_executive: "Executive", org_lead: "Team Lead", org_member: "Mitglied", org_viewer: "Betrachter" };

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
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

  const [notifPrefs, setNotifPrefs] = useState({ review_requests: true, escalations: true, team_updates: true, mention_enabled: true, deadline_enabled: true, status_change_enabled: true, digest_frequency: "instant" as string });

  const [aiProvider, setAiProvider] = useState("lovable");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [savedAi, setSavedAi] = useState(false);
  const [orgModelPref, setOrgModelPref] = useState("auto");
  const [orgId, setOrgId] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<string>("org_member");
  const [teamMemberships, setTeamMemberships] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [mfaActive, setMfaActive] = useState(false);
  const [orgPlan, setOrgPlan] = useState("Free");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [profileRes, aiRes, notifRes, roleRes, teamsRes, mfaRes] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url, org_id").eq("user_id", user.id).single(),
        supabase.from("user_ai_settings").select("*").eq("user_id", user.id).single(),
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
        supabase.from("team_members").select("*, teams(name)").eq("user_id", user.id),
        supabase.from("mfa_settings").select("totp_enabled, email_otp_enabled").eq("user_id", user.id).single(),
      ]);
      if (profileRes.data) {
        setFullName(profileRes.data.full_name || ""); setAvatarUrl(profileRes.data.avatar_url || null);
        if (profileRes.data.org_id) {
          setOrgId(profileRes.data.org_id);
          const { data: orgData } = await supabase.from("organizations").select("plan, ai_model_preference").eq("id", profileRes.data.org_id).maybeSingle();
          if (orgData?.plan) {
            const planMap: Record<string, string> = { free: "Free", starter: "Starter", professional: "Professional", enterprise: "Enterprise" };
            setOrgPlan(planMap[orgData.plan] || orgData.plan.charAt(0).toUpperCase() + orgData.plan.slice(1));
          }
          if (orgData?.ai_model_preference) setOrgModelPref(orgData.ai_model_preference);
        }
      }
      if (aiRes.data) { setAiProvider(aiRes.data.provider || "lovable"); setAiApiKey(aiRes.data.api_key || ""); setAiModel(aiRes.data.model || ""); }
      if (notifRes.data) { setNotifPrefs({ review_requests: notifRes.data.review_requests, escalations: notifRes.data.escalations, team_updates: notifRes.data.team_updates, mention_enabled: notifRes.data.mention_enabled ?? true, deadline_enabled: notifRes.data.deadline_enabled ?? true, status_change_enabled: notifRes.data.status_change_enabled ?? true, digest_frequency: notifRes.data.digest_frequency ?? "instant" }); }
      if (roleRes.data) setUserRole(roleRes.data.role);
      if (teamsRes.data) setTeamMemberships(teamsRes.data);
      if (mfaRes.data) setMfaActive(mfaRes.data.totp_enabled || mfaRes.data.email_otp_enabled);
    };
    fetchData();
  }, [user]);

  const isAdmin = userRole === "org_owner" || userRole === "org_admin";

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminStats = async () => {
      const [profilesRes, decisionsRes, escalationsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, created_at"),
        supabase.from("decisions").select("id, status, escalation_level, due_date, created_at").is("deleted_at", null),
        supabase.from("decisions").select("id").is("deleted_at", null).gte("escalation_level", 1),
      ]);
      const decisions = decisionsRes.data || [];
      const now = new Date();
      const overdue = decisions.filter(d => d.due_date && new Date(d.due_date) < now && !["implemented", "rejected", "archived", "cancelled"].includes(d.status));
      setAdminStats({
        totalUsers: (profilesRes.data || []).length,
        totalDecisions: decisions.length,
        openEscalations: (escalationsRes.data || []).length,
        slaViolations: overdue.length,
      });
    };
    fetchAdminStats();
  }, [isAdmin]);

  const securityScore = useMemo(() => {
    let score = 30;
    if (mfaActive) score += 20;
    if (notifPrefs.escalations) score += 10;
    if (notifPrefs.review_requests) score += 10;
    if (teamMemberships.length > 0) score += 10;
    if (aiProvider === "lovable") score += 10;
    if (fullName) score += 10;
    return Math.min(100, score);
  }, [notifPrefs, teamMemberships, aiProvider, fullName, mfaActive]);

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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
  };

  const selectedProvider = AI_PROVIDERS.find((p) => p.id === aiProvider);
  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  const tabs = [
    { key: "general" as SettingsTab, label: t("settings.general"), icon: User },
    { key: "notifications" as SettingsTab, label: t("settings.notifications"), icon: Bell },
    { key: "security" as SettingsTab, label: t("settings.security"), icon: Shield },
    ...(isAdmin ? [{ key: "sso" as SettingsTab, label: "SSO", icon: KeyRound }] : []),
    ...(isAdmin ? [{ key: "branding" as SettingsTab, label: "Branding", icon: Palette }] : []),
    { key: "governance" as SettingsTab, label: "Governance", icon: Scale },
    { key: "ai" as SettingsTab, label: t("settings.ai"), icon: Brain },
    ...(isAdmin ? [{ key: "integrations" as SettingsTab, label: "Integrationen", icon: Plug }] : []),
    ...(isAdmin ? [{ key: "api" as SettingsTab, label: "API", icon: Server }] : []),
    { key: "billing" as SettingsTab, label: "Abrechnung", icon: CreditCard },
    { key: "referral" as SettingsTab, label: t("settings.referral"), icon: Gift },
    ...(isAdmin ? [{ key: "admin" as SettingsTab, label: t("settings.admin"), icon: Settings2 }] : []),
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title={t("settings.pageTitle")}
          subtitle={t("settings.pageSubtitle")}
          role="system"
        />

        <SubNav<SettingsTab> items={tabs} active={activeTab} onChange={setActiveTab} layoutId="settings-tab" />

        <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>

          {/* ═══════════════ GENERAL ═══════════════ */}
          {activeTab === "general" && (
            <div className="space-y-8">
              {/* Profile Card */}
              <div className="settings-group">
                <h2>{t("settings.profile")}</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="relative group">
                      <UserAvatar avatarUrl={avatarUrl} fullName={fullName} email={user?.email} size="lg" />
                      <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        {uploadingAvatar ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
                      </button>
                      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{fullName || t("settings.unknown")}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar} className="text-xs text-primary hover:underline mt-1 cursor-pointer">
                        {uploadingAvatar ? t("settings.uploading", "Wird hochgeladen…") : t("settings.uploadPhoto", "Bild hochladen")}
                      </button>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <Badge variant="outline" className="text-[10px] font-normal">{roleLabels[userRole] || userRole}</Badge>
                        {teamMemberships.map(tm => (
                          <Badge key={tm.id} variant="secondary" className="text-[10px] font-normal">
                            {(tm.teams as any)?.name || "Team"} · {tm.role}
                          </Badge>
                        ))}
                      </div>
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
                    <Button size="sm" onClick={handleSave} disabled={saving} className="w-fit gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
                      {saved && <CheckCircle2 className="w-3 h-3" />}{saving ? t("settings.saving") : saved ? t("settings.saved") : t("settings.save")}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Workspace Info Card */}
              <div className="settings-group">
                <h2>{t("settings.workspace")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: t("settings.wsPlan"), value: orgPlan, icon: Zap },
                    { label: t("settings.wsUsers"), value: adminStats?.totalUsers || "–", icon: Users },
                    { label: t("settings.wsDecisions"), value: adminStats?.totalDecisions || "–", icon: Activity },
                    { label: t("settings.wsTeams"), value: teamMemberships.length, icon: Building2 },
                    { label: t("settings.wsDataLocation"), value: "EU", icon: Server },
                    { label: t("settings.wsRole"), value: roleLabels[userRole], icon: Shield },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20 min-h-[90px] flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                      </div>
                      <p className="text-sm font-semibold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance & Language Card */}
              <div className="settings-group">
                <h2>{t("settings.appearance")} & {t("settings.language")}</h2>
                <div className="space-y-4">
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

                  <div className="border-t border-border/30 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{t("settings.interfaceLanguage")}</p>
                          <p className="text-xs text-muted-foreground">{t("settings.interfaceLanguageDesc")}</p>
                        </div>
                      </div>
                      <div className="flex items-center rounded-md border border-border/60 p-0.5">
                        {[{ code: "de", label: t("settings.german") }, { code: "en", label: t("settings.english") }].map(lng => (
                          <button key={lng.code} onClick={() => changeLanguage(lng.code)}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${i18n.language === lng.code ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                            {lng.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Overrides */}
              <div className="settings-group">
                <h2>Feature-Freischaltung</h2>
                <ProgressiveOverrideToggle user={user} />
              </div>

              {/* Branche & Terminologie */}
              <div className="settings-group">
                <h2>Branche & Terminologie</h2>
                <IndustryConfigSection />
                {isAdmin && (
                  <div className="border-t border-border/30 pt-4 mt-4">
                    <TerminologyPanel />
                  </div>
                )}
              </div>

              {/* Onboarding */}
              <div className="settings-group">
                <h2>{t("settings.onboarding")}</h2>
                <p className="text-xs text-muted-foreground mb-3">{t("settings.onboardingDesc")}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { if (user) { localStorage.removeItem(`onboarding_done_${user.id}`); window.location.href = "/dashboard"; } }} className="gap-1.5">
                    <RotateCcw className="w-3 h-3" />{t("settings.restartTour")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (!user) return;
                    await supabase.from("profiles").update({ onboarding_completed: false } as any).eq("user_id", user.id);
                    toast({ title: "Onboarding zurückgesetzt", description: "Du wirst beim nächsten Laden zum Welcome-Wizard weitergeleitet." });
                    setTimeout(() => window.location.reload(), 1000);
                  }} className="gap-1.5">
                    <RotateCcw className="w-3 h-3" />Onboarding zurücksetzen
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <AccountDeletionPanel />
            </div>
          )}

          {/* ═══════════════ NOTIFICATIONS ═══════════════ */}
          {activeTab === "notifications" && (
            <div className="space-y-8">
              <div className="settings-group">
                <h2>{t("settings.notifChannels")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.digestDesc")}</p>
                <NotificationMatrixPanel />
              </div>

              <div className="settings-group">
                <h2>{t("settings.escalationPriority")}</h2>
                <div className="space-y-2">
                  {[
                    { level: t("settings.escCritical"), behavior: t("settings.escCriticalBehavior"), color: "text-destructive" },
                    { level: t("settings.escHigh"), behavior: t("settings.escHighBehavior"), color: "text-warning" },
                    { level: t("settings.escMedium"), behavior: t("settings.escMediumBehavior"), color: "text-muted-foreground" },
                    { level: t("settings.escLow"), behavior: t("settings.escLowBehavior"), color: "text-muted-foreground" },
                  ].map((esc, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-md border border-border/40 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-3.5 h-3.5 ${esc.color}`} />
                        <span className="text-sm font-medium">{esc.level}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{esc.behavior}</span>
                    </div>
                  ))}
                </div>
              </div>

               <div className="settings-group">
                <h2>{t("settings.execDigest")}</h2>
                <div className="space-y-2">
                  {[
                    { label: t("settings.execDigestDaily"), desc: t("settings.execDigestDailyDesc"), enabled: false },
                    { label: t("settings.execDigestWeekly"), desc: t("settings.execDigestWeeklyDesc"), enabled: false },
                    { label: t("settings.execDigestMonthly"), desc: t("settings.execDigestMonthlyDesc"), enabled: false },
                  ].map((digest, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm">{digest.label}</p>
                        <p className="text-xs text-muted-foreground">{digest.desc}</p>
                      </div>
                      <Switch checked={digest.enabled} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="settings-group">
                <h2>Messaging-Kanäle</h2>
                <WhatsAppSettingsPanel />
              </div>

              <div className="settings-group">
                <h2>{t("settings.quietHours")}</h2>
                <p className="text-xs text-muted-foreground">{t("settings.quietHoursDesc")}</p>
              </div>
            </div>
          )}

          {/* ═══════════════ SECURITY ═══════════════ */}
          {activeTab === "security" && (
            <div className="space-y-8">
              {/* Security Health Card */}
              <div className="settings-group">
                <h2>{t("settings.securityHealth")}</h2>
                <div className="p-4 rounded-lg border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-5 h-5 ${securityScore >= 80 ? "text-success" : securityScore >= 60 ? "text-warning" : "text-destructive"}`} />
                      <span className="text-2xl font-bold">{securityScore}</span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </div>
                    <Badge className={`text-[10px] ${securityScore >= 80 ? "bg-success/10 text-success border-success/20" : securityScore >= 60 ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                      {securityScore >= 80 ? t("settings.secGood") : securityScore >= 60 ? t("settings.secNeedsImprovement") : t("settings.secCritical")}
                    </Badge>
                  </div>
                  <Progress value={securityScore} className="h-1.5 mb-3" />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {[
                      { label: t("settings.secPasswordSet"), ok: true },
                      { label: t("settings.sec2faActive"), ok: mfaActive },
                      { label: t("settings.secSsoActive"), ok: false },
                      { label: t("settings.secSessionTimeout"), ok: true },
                      { label: t("settings.secProfileComplete"), ok: !!fullName },
                      { label: t("settings.secEscalationsActive"), ok: notifPrefs.escalations },
                    ].map((check, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        {check.ok ? <CheckCircle2 className="w-3 h-3 text-success" /> : <AlertTriangle className="w-3 h-3 text-warning" />}
                        <span className={check.ok ? "text-foreground" : "text-muted-foreground"}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sessions & MFA Card */}
              <div className="settings-group">
                <h2>Authentifizierung</h2>
                <ActiveSessionsPanel />
                <div className="border-t border-border/30 pt-4 mt-4">
                  <MfaSettingsPanel />
                </div>
              </div>

              {/* Password Card */}
              <div className="settings-group">
                <h2>{t("settings.changePassword")}</h2>
                <div className="space-y-3 max-w-sm">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.newPassword")}</label>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t("settings.newPasswordPlaceholder")} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("settings.confirmPassword")}</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t("settings.confirmPasswordPlaceholder")} className={inputClass} />
                  </div>
                  <Button size="sm" onClick={handlePasswordChange} disabled={changingPassword || !newPassword} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {changingPassword ? t("settings.updating") : t("settings.changePassword")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ SSO ═══════════════ */}
          {activeTab === "sso" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Single Sign-On (SAML 2.0)</h2>
                  <p className="text-xs text-muted-foreground">Konfigurieren Sie SSO für Ihre Organisation</p>
                </div>
              </div>
              <SsoSettingsPanel
                isEnterprise={orgPlan.toLowerCase() === "enterprise"}
                onUpgrade={() => window.location.href = "/upgrade"}
              />
            </div>
          )}

          {/* ═══════════════ BRANDING ═══════════════ */}
          {activeTab === "branding" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Custom Branding</h2>
                  <p className="text-xs text-muted-foreground">White-Label-Einstellungen für Ihre Organisation</p>
                </div>
              </div>
              <BrandingPanel />
            </div>
          )}

          {/* ═══════════════ GOVERNANCE ═══════════════ */}
          {activeTab === "governance" && (
            <div className="space-y-8">
              {/* Access Control Card */}
              <div className="settings-group">
                <h2>{t("settings.accessControl")}</h2>
                <p className="text-xs text-muted-foreground mb-3">{t("settings.accessControlDesc")}</p>
                <div className="rounded-lg border border-border/40 overflow-hidden">
                  <div className="grid grid-cols-5 gap-0 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    <div className="p-2.5">{t("settings.acAction")}</div>
                    <div className="p-2.5 text-center">Owner</div>
                    <div className="p-2.5 text-center">Admin</div>
                    <div className="p-2.5 text-center">Lead</div>
                    <div className="p-2.5 text-center">Member</div>
                  </div>
                  {[
                    { action: t("settings.acCreateDecisions"), permissions: [true, true, true, true] },
                    { action: t("settings.acDeleteDecisions"), permissions: [true, true, false, false] },
                    { action: t("settings.acConfigSla"), permissions: [true, true, false, false] },
                    { action: t("settings.acChangeEscalations"), permissions: [true, true, true, false] },
                    { action: t("settings.acManageTemplates"), permissions: [true, true, false, false] },
                    { action: t("settings.acManageUsers"), permissions: [true, true, false, false] },
                    { action: t("settings.acFeatureFlags"), permissions: [true, true, false, false] },
                    { action: t("settings.acRetention"), permissions: [true, true, false, false] },
                    { action: t("settings.acHardDelete"), permissions: [true, false, false, false] },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-5 gap-0 border-t border-border/30 items-center">
                      <div className="p-2.5 text-xs">{row.action}</div>
                      {row.permissions.map((p, j) => (
                        <div key={j} className="p-2.5 text-center">
                          {p ? <CheckCircle2 className="w-3.5 h-3.5 text-success mx-auto" /> : <span className="text-muted-foreground text-xs">–</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* SLA & Cost-of-Delay Card */}
              <div className="settings-group">
                <h2>{t("settings.slaConfig")} & Cost-of-Delay</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.slaConfigDesc")}</p>
                <SlaConfigPanel />
                <div className="border-t border-border/30 pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-2">{t("predictiveSla.settingsTitle", "Predictive SLA — Frühwarnung")}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{t("predictiveSla.settingsDesc", "Warnt bevor eine SLA-Verletzung eintritt, basierend auf historischen Review-Dauern.")}</p>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-muted-foreground whitespace-nowrap">Frühwarnung bei</label>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      defaultValue={parseInt(localStorage.getItem("sla-early-warning-days") || "2")}
                      onChange={e => localStorage.setItem("sla-early-warning-days", e.target.value)}
                      className="w-16 h-8 px-2 rounded-lg bg-background border border-input text-sm text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                    <span className="text-xs text-muted-foreground">Tagen vor Deadline</span>
                  </div>
                </div>
                <div className="border-t border-border/30 pt-4 mt-4">
                  <h3 className="text-sm font-medium mb-3">{t("cod.orgTitle", "Cost-of-Delay — Globale Defaults")}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{t("cod.orgDesc", "Diese Werte gelten für alle Teams ohne eigene Konfiguration.")}</p>
                  <OrgCodDefaultsPanel />
                </div>
              </div>

              {/* Delegation Card */}
              <div className="settings-group">
                <h2>{t("settings.delegation")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.delegationDesc")}</p>
                <DelegationPanel />
              </div>

              {/* Data Retention Card */}
              <div className="settings-group">
                <h2 className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  Datenspeicherung & Aufbewahrung
                </h2>
                <p className="text-xs text-muted-foreground mb-4">DSGVO-konforme Aufbewahrungsfristen und automatische Datenbereinigung konfigurieren.</p>
                <DataRetentionPanel />
              </div>

              {/* Compliance & Audit Card */}
              <div className="settings-group">
                <h2>{t("settings.compliance")}</h2>
                <div className="space-y-2">
                  {[
                    { label: t("settings.compGdpr"), status: t("settings.compActive"), icon: ShieldCheck, color: "text-success" },
                    { label: t("settings.compDataProcessing"), status: t("settings.compEuOnly"), icon: Server, color: "text-primary" },
                    { label: t("settings.compAuditTrail"), status: t("settings.compImmutable"), icon: Lock, color: "text-success" },
                    { label: t("settings.compEncryption"), status: "AES-256", icon: KeyRound, color: "text-success" },
                    { label: t("settings.compSoc2"), status: t("settings.compCompliant"), icon: Shield, color: "text-primary" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-md border border-border/40 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/30 pt-4 mt-4">
                  <AuditIntegrityPanel />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ AI ═══════════════ */}
          {activeTab === "ai" && (
            <div className="space-y-8">
              <div className="settings-group">
                <h2>{t("settings.aiUsage")}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: t("settings.aiRequestsMonth"), value: aiProvider === "lovable" ? t("settings.aiIncludedInPlan", "Inklusive im Plan") : "–", icon: Zap },
                    { label: t("settings.aiActiveProvider"), value: AI_PROVIDERS.find(p => p.id === aiProvider)?.name || "Standard", icon: Brain },
                    { label: t("settings.aiModelLabel"), value: aiModel || "Auto", icon: Activity },
                    { label: t("settings.aiDataResidency"), value: "EU", icon: Server },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20 min-h-[90px] flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-1">
                        <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-sm font-semibold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Residency — moved above provider selection for trust-first */}
              <div className="p-4 rounded-lg border-l-4 border-l-accent-blue bg-accent-blue/[0.06]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-accent-blue" />
                  <h3 className="text-sm font-medium">{t("settings.aiDataResidency")}</h3>
                </div>
                <p className="text-xs text-muted-foreground">{t("settings.aiDataResidencyInfo")}</p>
              </div>

              <div className="settings-group">
                <h2>{t("settings.aiProvider")}</h2>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {AI_PROVIDERS.map((p) => (
                    <button key={p.id} onClick={() => { setAiProvider(p.id); setAiModel(p.models?.[0] || ""); }}
                      className={`text-left p-3 rounded-lg border transition-all duration-200 ${aiProvider === p.id ? "border-primary/40 bg-primary/[0.03] shadow-sm" : "border-border/40 hover:border-border/60"}`}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {p.id === "lovable" && <Sparkles className="w-3 h-3" />}
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.id === "lovable" ? t("settings.noApiKeyNeeded") : p.description}</p>
                    </button>
                  ))}
                </div>
                {aiProvider !== "lovable" && selectedProvider && (
                  <div className="space-y-3 pt-4 border-t border-border/30">
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
                  <Button size="sm" onClick={handleSaveAi} disabled={savingAi} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
                    {savedAi && <CheckCircle2 className="w-3 h-3" />}{savingAi ? t("settings.saving") : savedAi ? t("settings.saved") : t("settings.save")}
                  </Button>
                </div>
              </div>

              {/* Org-level model preference (admin only) */}
              {(userRole === "org_admin" || userRole === "org_owner") && (
                <div className="settings-group">
                  <h2>{t("settings.aiOrgModel")}</h2>
                  <p className="text-xs text-muted-foreground mb-3">{t("settings.aiOrgModelDesc")}</p>
                  <select
                    value={orgModelPref}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setOrgModelPref(val);
                      if (orgId) {
                        await supabase.from("organizations").update({ ai_model_preference: val } as any).eq("id", orgId);
                        toast({ title: t("settings.saved") });
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="auto">{t("settings.aiModelAuto")}</option>
                    <option value="flash">{t("settings.aiModelFlash")}</option>
                    <option value="pro">{t("settings.aiModelPro")}</option>
                  </select>
                </div>
              )}

              <div className="settings-group">
                <h2>{t("settings.aiGovernanceScope")}</h2>
                <p className="text-xs text-muted-foreground mb-3">{t("settings.aiGovernanceScopeDesc")}</p>
                <div className="space-y-2">
                  {[
                    { label: t("settings.aiSummaries"), desc: t("settings.aiSummariesDesc"), enabled: true },
                    { label: t("settings.aiRiskAnalysis"), desc: t("settings.aiRiskAnalysisDesc"), enabled: true },
                    { label: t("settings.aiScenario"), desc: t("settings.aiScenarioDesc"), enabled: true },
                    { label: t("settings.aiCoPilot"), desc: t("settings.aiCoPilotDesc"), enabled: true },
                  ].map((scope, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm">{scope.label}</p>
                        <p className="text-xs text-muted-foreground">{scope.desc}</p>
                      </div>
                      <Switch checked={scope.enabled} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ INTEGRATIONS (admin only) ═══════════════ */}
          {activeTab === "integrations" && isAdmin && (
            <div className="space-y-8">
              <div className="settings-group">
                <h2>E-Mail & Messaging</h2>
                <InboundEmailPanel />
              </div>
              <div className="settings-group">
                <h2>Microsoft Teams</h2>
                <TeamsIntegrationPanel />
              </div>
              <div className="settings-group">
                <h2>Webhooks & API</h2>
                <WebhookSettingsPanel />
              </div>
              <div className="settings-group">
                <h2>Kalender-Synchronisierung</h2>
                <CalendarSyncPanel />
              </div>
              <div className="settings-group">
                <PdfBrandingSection />
              </div>
            </div>
          )}

          {/* ═══════════════ API KEYS (admin only) ═══════════════ */}
          {activeTab === "api" && isAdmin && (
            <div className="space-y-8">
              <div className="settings-group">
                <h2>API-Schlüssel</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Generiere API Keys um Decivio in externe Systeme zu integrieren (Zapier, Make, Custom Workflows).
                </p>
                <ApiKeysPanel />
              </div>
            </div>
          )}

          {/* ═══════════════ BILLING ═══════════════ */}
          {activeTab === "billing" && <BillingPanel />}

          {/* ═══════════════ REFERRAL ═══════════════ */}
          {activeTab === "referral" && (
            <div className="space-y-6">
              <ReferralPanel />
              <PublicDashboardLinks />
            </div>
          )}

          {/* ═══════════════ ADMIN ═══════════════ */}
          {activeTab === "admin" && isAdmin && (
            <div className="space-y-8">
              {adminStats && (
                <div className="settings-group">
                  <h2>{t("settings.adminOverview")}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: t("settings.adminActiveUsers"), value: adminStats.totalUsers, icon: Users, color: "text-primary" },
                      { label: t("settings.adminTotalDecisions"), value: adminStats.totalDecisions, icon: Activity, color: "text-foreground" },
                      { label: t("settings.adminOpenEscalations"), value: adminStats.openEscalations, icon: AlertTriangle, color: adminStats.openEscalations > 0 ? "text-warning" : "text-success" },
                      { label: t("settings.adminSlaViolations"), value: adminStats.slaViolations, icon: Clock, color: adminStats.slaViolations > 0 ? "text-destructive" : "text-success" },
                      { label: t("settings.adminSecurityScore"), value: `${securityScore}%`, icon: ShieldCheck, color: securityScore >= 80 ? "text-success" : "text-warning" },
                      { label: t("settings.adminTeams"), value: teamMemberships.length, icon: Building2, color: "text-muted-foreground" },
                    ].map((stat, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border/40 bg-muted/20 min-h-[90px] flex flex-col justify-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className="text-lg font-semibold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="settings-group">
                <h2>{t("settings.adminTools", "Administration")}</h2>
                <p className="text-xs text-muted-foreground mb-4">{t("settings.adminToolsDesc", "Erweiterte Verwaltungsfunktionen findest du in der Admin-Konsole.")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: t("settings.userManagement"), desc: t("settings.adminUserMgmtDesc", "Nutzer einladen, Rollen ändern"), icon: Users, path: "/admin/users" },
                    { label: t("settings.featureFlags"), desc: t("settings.adminFeatureFlagsDesc", "Module aktivieren & deaktivieren"), icon: Zap, path: "/admin/users?tab=config" },
                    { label: t("settings.adminDataMgmt", "Daten & Demo"), desc: t("settings.adminDataMgmtDesc", "Demo-Daten laden, Daten zurücksetzen"), icon: Scale, path: "/admin/users?tab=data", badge: (adminStats?.totalDecisions ?? 0) < 5 ? "Empfohlen zum Start" : undefined },
                    { label: t("settings.rolePermsTitle", "Berechtigungen"), desc: t("settings.adminPermsDesc", "Rollen-Berechtigungen anpassen"), icon: Lock, path: "/admin/users?tab=config" },
                  ].map((item, i) => (
                    <button
                      key={i}
                      onClick={() => window.location.href = item.path}
                      className="relative flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/20 hover:bg-muted/40 hover:border-border/60 transition-all text-left group"
                    >
                      {(item as any).badge && (
                        <Badge className="absolute top-2 right-2 text-[10px] bg-success/10 text-success border-success/20">{(item as any).badge}</Badge>
                      )}
                      <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="settings-group">
                <h2>{t("settings.roles")}</h2>
                <p className="text-xs text-muted-foreground">
                  {t("settings.yourRole")} <Badge variant="outline" className="ml-1 text-[10px] font-normal">{roleLabels[userRole]}</Badge>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

const PdfBrandingSection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { isFree } = useFreemiumLimits();
  const [hide, setHide] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("hide_pdf_branding").eq("user_id", user.id).single().then(({ data }) => {
        setHide((data as any)?.hide_pdf_branding ?? false);
        setLoaded(true);
      });
    }
  }, [user]);

  const toggle = async (val: boolean) => {
    setHide(val);
    if (user) await supabase.from("profiles").update({ hide_pdf_branding: val } as any).eq("user_id", user.id);
  };

  return (
    <section>
      <h2 className="text-sm font-medium mb-2 flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        {t("settings.brandingTitle")}
      </h2>
      <p className="text-xs text-muted-foreground mb-3">{t("settings.brandingDesc")}</p>
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
        <div>
          <p className="text-sm">{t("settings.brandingHide")}</p>
          <p className="text-[11px] text-muted-foreground">{t("settings.brandingHideDesc")}</p>
          {isFree && <a href="/#pricing" className="text-[10px] text-warning mt-1 hover:underline cursor-pointer block">{t("settings.brandingFreeHint")} → Upgrade</a>}
        </div>
        <Switch checked={hide} onCheckedChange={toggle} disabled={isFree || !loaded} />
      </div>
    </section>
  );
};

const ProgressiveOverrideToggle = ({ user }: { user: any }) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    if (user) supabase.from("profiles").select("progressive_override").eq("user_id", user.id).single().then(({ data }) => setChecked(data?.progressive_override ?? false));
  }, [user]);
  return (
    <section>
      <h2 className="text-sm font-medium mb-4">{t("settings.progressiveOverride", "Feature-Freischaltung")}</h2>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm">{t("settings.showAllFeatures", "Alle Features sofort anzeigen")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.showAllFeaturesDesc", "Überspringt die schrittweise Freischaltung basierend auf Entscheidungsanzahl.")}</p>
          </div>
        </div>
        <Switch checked={checked} onCheckedChange={async (val) => {
          setChecked(val);
          if (user) await supabase.from("profiles").update({ progressive_override: val }).eq("user_id", user.id);
        }} />
      </div>
    </section>
  );
};

export default SettingsPage;

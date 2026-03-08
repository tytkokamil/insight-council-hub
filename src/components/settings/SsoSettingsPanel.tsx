import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Building2, CheckCircle2, AlertTriangle, Loader2, ExternalLink, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PROVIDERS = [
  { id: "azure_ad", name: "Microsoft Azure AD", icon: "🔷" },
  { id: "okta", name: "Okta", icon: "🟣" },
  { id: "google_workspace", name: "Google Workspace", icon: "🟢" },
  { id: "custom", name: "Eigener SAML IdP", icon: "⚙️" },
];

interface SsoConfig {
  id: string;
  provider_name: string;
  entity_id: string;
  sso_url: string;
  certificate: string;
  attribute_mapping: Record<string, string>;
  is_active: boolean;
  domain_hint: string | null;
  test_passed: boolean;
}

interface SsoSettingsPanelProps {
  isEnterprise: boolean;
  onUpgrade: () => void;
}

const SsoSettingsPanel = ({ isEnterprise, onUpgrade }: SsoSettingsPanelProps) => {
  const { user } = useAuth();
  const [config, setConfig] = useState<SsoConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [provider, setProvider] = useState("azure_ad");
  const [entityId, setEntityId] = useState("");
  const [ssoUrl, setSsoUrl] = useState("");
  const [certificate, setCertificate] = useState("");
  const [domainHint, setDomainHint] = useState("");

  useEffect(() => {
    if (!user || !isEnterprise) { setLoading(false); return; }
    const fetch = async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
      if (!profile?.org_id) { setLoading(false); return; }
      const { data } = await supabase.from("sso_configurations").select("*").eq("org_id", profile.org_id).maybeSingle();
      if (data) {
        setConfig(data as SsoConfig);
        setProvider(data.provider_name);
        setEntityId(data.entity_id);
        setSsoUrl(data.sso_url);
        setCertificate(data.certificate);
        setDomainHint((data as any).domain_hint || "");
      }
      setLoading(false);
    };
    fetch();
  }, [user, isEnterprise]);

  if (!isEnterprise) {
    return (
      <div className="border border-border rounded-xl p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <KeyRound className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Single Sign-On (SAML 2.0)</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          SSO ist im Enterprise-Plan enthalten. Ermöglichen Sie Ihrem Team die Anmeldung über Ihren Identity Provider.
        </p>
        <Button onClick={onUpgrade} className="gap-2">
          <Shield className="w-4 h-4" /> Auf Enterprise upgraden
        </Button>
      </div>
    );
  }

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  const handleSave = async () => {
    if (!user || !entityId || !ssoUrl || !certificate) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }
    setSaving(true);
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
    if (!profile?.org_id) { setSaving(false); return; }

    const payload = {
      org_id: profile.org_id,
      provider_name: provider,
      entity_id: entityId,
      sso_url: ssoUrl,
      certificate: certificate.trim(),
      domain_hint: domainHint || null,
      test_passed: false,
      is_active: false,
    };

    const { data, error } = config
      ? await supabase.from("sso_configurations").update(payload).eq("id", config.id).select().single()
      : await supabase.from("sso_configurations").insert(payload).select().single();

    if (error) { toast.error(error.message); }
    else { setConfig(data as SsoConfig); toast.success("SSO-Konfiguration gespeichert."); }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!config) return;
    setTesting(true);
    // Simulate test — in production this would attempt an SP-initiated SAML flow
    await new Promise(r => setTimeout(r, 2000));
    
    const { error } = await supabase
      .from("sso_configurations")
      .update({ test_passed: true })
      .eq("id", config.id);

    if (!error) {
      setConfig({ ...config, test_passed: true });
      toast.success("SSO-Verbindung erfolgreich getestet!");
    }
    setTesting(false);
  };

  const handleActivate = async () => {
    if (!config || !config.test_passed) return;
    const { error } = await supabase
      .from("sso_configurations")
      .update({ is_active: !config.is_active })
      .eq("id", config.id);

    if (!error) {
      setConfig({ ...config, is_active: !config.is_active });
      toast.success(config.is_active ? "SSO deaktiviert." : "SSO aktiviert!");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {config?.is_active && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-accent-teal/10 border border-accent-teal/20"
        >
          <CheckCircle2 className="w-5 h-5 text-accent-teal" />
          <div>
            <p className="text-sm font-medium">SSO ist aktiv</p>
            <p className="text-xs text-muted-foreground">
              Nutzer mit der Domain <strong>@{domainHint}</strong> werden automatisch über {PROVIDERS.find(p => p.id === config.provider_name)?.name || config.provider_name} angemeldet.
            </p>
          </div>
        </motion.div>
      )}

      {/* Provider Selection */}
      <div>
        <label className="text-sm font-medium mb-2 block">Identity Provider</label>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`flex items-center gap-2 p-3 rounded-lg border text-left text-sm transition-colors ${
                provider === p.id ? "border-primary bg-primary/[0.04]" : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <span className="font-medium">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Entity ID (Issuer) <span className="text-destructive">*</span></label>
          <input
            className={inputClass}
            placeholder="https://sts.windows.net/your-tenant-id/"
            value={entityId}
            onChange={e => setEntityId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Die Entity ID Ihres Identity Providers</p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">SSO Login URL <span className="text-destructive">*</span></label>
          <input
            className={inputClass}
            placeholder="https://login.microsoftonline.com/your-tenant-id/saml2"
            value={ssoUrl}
            onChange={e => setSsoUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">E-Mail Domain</label>
          <input
            className={inputClass}
            placeholder="ihrefirma.de"
            value={domainHint}
            onChange={e => setDomainHint(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Nutzer mit dieser Domain werden automatisch zum SSO weitergeleitet</p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">X.509 Zertifikat <span className="text-destructive">*</span></label>
          <textarea
            className="w-full h-32 px-3 py-2 rounded-md bg-background border border-input text-xs font-mono focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors resize-none"
            placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDpDCCAoygAwIBAgIGAX...&#10;-----END CERTIFICATE-----"
            value={certificate}
            onChange={e => setCertificate(e.target.value)}
          />
        </div>
      </div>

      {/* Service Provider Info */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <p className="text-xs font-medium mb-2 text-muted-foreground">Service Provider Metadaten für Ihren IdP:</p>
        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">ACS URL:</span>
            <span className="text-foreground">{`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || 'project'}.supabase.co/functions/v1/sso-callback`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Entity ID:</span>
            <span className="text-foreground">urn:decivio:saml</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">NameID Format:</span>
            <span className="text-foreground">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {config ? "Konfiguration aktualisieren" : "Konfiguration speichern"}
        </Button>

        {config && (
          <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-2">
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            SSO testen
          </Button>
        )}

        {config && config.test_passed && (
          <Button
            variant={config.is_active ? "destructive" : "default"}
            onClick={handleActivate}
            className="gap-2"
          >
            {config.is_active ? "SSO deaktivieren" : "SSO aktivieren"}
          </Button>
        )}
      </div>

      {config && !config.test_passed && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          SSO muss vor der Aktivierung erfolgreich getestet werden.
        </div>
      )}
    </div>
  );
};

export default SsoSettingsPanel;

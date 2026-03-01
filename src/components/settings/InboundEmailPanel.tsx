import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Mail, Plus, X, Loader2, Copy, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";

const InboundEmailPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [orgSlug, setOrgSlug] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadConfig();
  }, [user]);

  const loadConfig = async () => {
    setLoading(true);
    // Get org slug
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user!.id)
      .single();

    if (profile?.org_id) {
      const { data: org } = await supabase
        .from("organizations")
        .select("slug")
        .eq("id", profile.org_id)
        .single();
      if (org) setOrgSlug(org.slug);

      const { data: config } = await supabase
        .from("inbound_email_config")
        .select("*")
        .eq("org_id", profile.org_id)
        .single();

      if (config) {
        setConfigId(config.id);
        setEnabled(config.enabled);
        setAllowedDomains(config.allowed_domains || []);
      }
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    if (!user) return;
    setSaving(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.org_id) {
      if (configId) {
        await supabase
          .from("inbound_email_config")
          .update({ enabled, allowed_domains: allowedDomains, updated_at: new Date().toISOString() })
          .eq("id", configId);
      } else {
        const { data } = await supabase
          .from("inbound_email_config")
          .insert({ org_id: profile.org_id, enabled, allowed_domains: allowedDomains })
          .select("id")
          .single();
        if (data) setConfigId(data.id);
      }
      toast.success(t("settings.inboundSaved"));
    }
    setSaving(false);
  };

  const addDomain = () => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain || allowedDomains.includes(domain)) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      toast.error(t("settings.inboundInvalidDomain"));
      return;
    }
    setAllowedDomains([...allowedDomains, domain]);
    setNewDomain("");
  };

  const removeDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
  };

  const copyEmail = () => {
    const email = `entscheidungen@${orgSlug}.decivio.com`;
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emailAddress = `entscheidungen@${orgSlug}.decivio.com`;

  const inputClass =
    "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  if (loading) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">{t("settings.inboundTitle")}</h2>
        <Badge variant="outline" className="text-[10px]">Beta</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("settings.inboundDesc")}</p>

      <div className="space-y-4">
        {/* Email address display */}
        <div className="p-3 rounded-lg border border-primary/20 bg-primary/5">
          <p className="text-[10px] text-muted-foreground mb-1">{t("settings.inboundYourAddress")}</p>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono font-medium text-foreground flex-1 break-all">{emailAddress}</code>
            <Button size="sm" variant="ghost" onClick={copyEmail} className="shrink-0 gap-1.5 h-7">
              {copied ? <CheckCircle2 className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              {copied ? t("settings.inboundCopied") : t("settings.inboundCopy")}
            </Button>
          </div>
        </div>

        {/* Enable/disable toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">{t("settings.inboundEnabled")}</p>
            <p className="text-[10px] text-muted-foreground">{t("settings.inboundEnabledDesc")}</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Allowed domains */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            {t("settings.inboundAllowedDomains")}
          </label>
          <p className="text-[10px] text-muted-foreground mb-2">{t("settings.inboundAllowedDomainsDesc")}</p>
          
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="example.com"
              className={`${inputClass} flex-1`}
            />
            <Button size="sm" onClick={addDomain} disabled={!newDomain.trim()} className="shrink-0 gap-1">
              <Plus className="w-3 h-3" /> {t("settings.inboundAddDomain")}
            </Button>
          </div>

          {allowedDomains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {allowedDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="gap-1 pr-1">
                  {domain}
                  <button onClick={() => removeDomain(domain)} className="hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">{t("settings.inboundNoDomainsYet")}</p>
          )}
        </div>

        {/* Info box */}
        <div className="p-3 rounded-lg border border-border/60 bg-muted/30">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-[11px] text-muted-foreground space-y-1">
              <p>{t("settings.inboundHowItWorks")}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t("settings.inboundStep1")}</li>
                <li>{t("settings.inboundStep2")}</li>
                <li>{t("settings.inboundStep3")}</li>
                <li>{t("settings.inboundStep4")}</li>
                <li>{t("settings.inboundStep5")}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save button */}
        <Button onClick={saveConfig} disabled={saving} className="w-full gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {t("settings.inboundSave")}
        </Button>
      </div>
    </section>
  );
};

export default InboundEmailPanel;

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Archive, Clock, Download, FileText, Loader2, Shield, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface RetentionConfig {
  archive_after_months: number;
  delete_archived_months: number | null;
  audit_retention_years: number;
  activity_log_days: number;
  notification_delete_days: number;
}

const DEFAULTS: RetentionConfig = {
  archive_after_months: 24,
  delete_archived_months: null,
  audit_retention_years: 3,
  activity_log_days: 365,
  notification_delete_days: 90,
};

// Minimum retention per compliance framework
const COMPLIANCE_REQUIREMENTS: Record<string, { label: string; min_audit_years: number }> = {
  iso9001: { label: "ISO 9001", min_audit_years: 3 },
  nis2: { label: "NIS2", min_audit_years: 5 },
  marisk: { label: "MaRisk", min_audit_years: 5 },
  sox: { label: "SOX", min_audit_years: 7 },
  gdpr: { label: "DSGVO", min_audit_years: 3 },
};

const DataRetentionPanel = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<RetentionConfig>(DEFAULTS);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [complianceFrameworks, setComplianceFrameworks] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
      if (!profile?.org_id) return;
      setOrgId(profile.org_id);

      const [{ data: org }, { data: compliance }] = await Promise.all([
        supabase.from("organizations").select("data_retention_config").eq("id", profile.org_id).single(),
        supabase.from("compliance_config").select("framework").eq("org_id", profile.org_id).eq("enabled", true),
      ]);

      if (org?.data_retention_config) {
        setConfig({ ...DEFAULTS, ...(org.data_retention_config as any) });
      }
      if (compliance) {
        setComplianceFrameworks(compliance.map((c: any) => c.framework));
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!orgId) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ data_retention_config: config as any } as any)
      .eq("id", orgId);

    if (error) {
      toast.error("Fehler beim Speichern.");
    } else {
      setSaved(true);
      toast.success("Datenspeicherungsrichtlinie gespeichert.");
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-user-data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `decivio-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Datenexport heruntergeladen.");
    } catch {
      toast.error("Fehler beim Exportieren.");
    }
    setExporting(false);
  };

  // Check compliance warnings
  const complianceWarnings = complianceFrameworks
    .map(fw => {
      const req = COMPLIANCE_REQUIREMENTS[fw];
      if (!req) return null;
      if (config.audit_retention_years < req.min_audit_years) {
        return `${req.label} erfordert mindestens ${req.min_audit_years} Jahre Audit-Aufbewahrung. Ihre Einstellung: ${config.audit_retention_years} Jahr(e). Bitte anpassen.`;
      }
      return null;
    })
    .filter(Boolean) as string[];

  const update = (key: keyof RetentionConfig, value: number | null) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Compliance Warnings */}
      {complianceWarnings.length > 0 && (
        <div className="space-y-2">
          {complianceWarnings.map((w, i) => (
            <div key={i} className="p-3 rounded-xl bg-warning/5 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Retention Settings */}
      <div className="space-y-4">
        {/* Archive decisions */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <Archive className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Entscheidungen archivieren nach</p>
              <p className="text-[11px] text-muted-foreground">Abgeschlossene Entscheidungen automatisch archivieren</p>
            </div>
          </div>
          <Select value={String(config.archive_after_months)} onValueChange={v => update("archive_after_months", Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[6, 12, 24, 36].map(m => (
                <SelectItem key={m} value={String(m)}>{m} Monate</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Delete archived */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Archivierte Entscheidungen löschen nach</p>
              <p className="text-[11px] text-muted-foreground">Endgültige Löschung archivierter Daten</p>
            </div>
          </div>
          <Select value={config.delete_archived_months === null ? "never" : String(config.delete_archived_months)} onValueChange={v => update("delete_archived_months", v === "never" ? null : Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[12, 24, 60].map(m => (
                <SelectItem key={m} value={String(m)}>{m} Monate</SelectItem>
              ))}
              <SelectItem value="never">Nie</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Audit trail retention */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Audit Trail aufbewahren</p>
              <p className="text-[11px] text-muted-foreground">Compliance-relevante Aufbewahrungsfrist</p>
            </div>
          </div>
          <Select value={String(config.audit_retention_years)} onValueChange={v => update("audit_retention_years", Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 3, 5, 7].map(y => (
                <SelectItem key={y} value={String(y)}>{y} Jahre</SelectItem>
              ))}
              <SelectItem value="999">Unbegrenzt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity logs */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Aktivitätslogs löschen nach</p>
              <p className="text-[11px] text-muted-foreground">Nicht-compliance-relevante Aktivitätsdaten</p>
            </div>
          </div>
          <Select value={String(config.activity_log_days)} onValueChange={v => update("activity_log_days", Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[90, 180, 365].map(d => (
                <SelectItem key={d} value={String(d)}>{d} Tage</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notification cleanup */}
        <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20">
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Benachrichtigungen löschen nach</p>
              <p className="text-[11px] text-muted-foreground">Gelesene Benachrichtigungen automatisch bereinigen</p>
            </div>
          </div>
          <Select value={String(config.notification_delete_days)} onValueChange={v => update("notification_delete_days", Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[30, 90, 180].map(d => (
                <SelectItem key={d} value={String(d)}>{d} Tage</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
        {saved && <CheckCircle2 className="w-3 h-3" />}
        {saving ? "Wird gespeichert…" : saved ? "Gespeichert" : "Richtlinie speichern"}
      </Button>

      {/* GDPR Export */}
      <div className="border-t border-border/30 pt-6">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
          <Shield className="w-4 h-4 text-primary" />
          DSGVO-Datenexport (Art. 20)
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Exportieren Sie alle Ihre persönlichen Daten in einem maschinenlesbaren Format.
        </p>
        <Button size="sm" variant="outline" onClick={handleExport} disabled={exporting} className="gap-1.5">
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {exporting ? "Wird exportiert…" : "Meine Daten exportieren"}
        </Button>
      </div>
    </div>
  );
};

export default DataRetentionPanel;

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions, OrgRoleKey, ROLE_LABELS, ROLE_LABELS_DE, PERMISSION_MAP, PERMISSION_CATEGORIES, getDefaultPermissions, type PermissionKey } from "@/hooks/usePermissions";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RotateCcw, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RolePermRow {
  id?: string;
  org_id: string | null;
  role: OrgRoleKey;
  permission: string;
  enabled: boolean;
}

const EDITABLE_ROLES: OrgRoleKey[] = ["org_viewer", "org_member", "org_lead", "org_executive"];

const RolePermissionsPanel = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { role: currentUserRole } = usePermissions();
  const [selectedRole, setSelectedRole] = useState<OrgRoleKey>("org_member");
  const [overrides, setOverrides] = useState<RolePermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const labels = i18n.language === "de" ? ROLE_LABELS_DE : ROLE_LABELS;

  const fetchOverrides = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("role_permissions")
      .select("id, org_id, role, permission, enabled")
      .eq("role", selectedRole);
    setOverrides((data as RolePermRow[]) || []);
    setLoading(false);
    setDirty(false);
  }, [selectedRole]);

  useEffect(() => { fetchOverrides(); }, [fetchOverrides]);

  const defaults = getDefaultPermissions(selectedRole);

  const getEffectiveValue = (permKey: string): boolean => {
    const override = overrides.find(o => o.permission === permKey);
    if (override) return override.enabled;
    const fieldName = PERMISSION_MAP[permKey];
    return fieldName ? defaults[fieldName] : false;
  };

  const isOverridden = (permKey: string): boolean => {
    return overrides.some(o => o.permission === permKey);
  };

  const handleToggle = (permKey: string, newValue: boolean) => {
    setDirty(true);
    const existing = overrides.find(o => o.permission === permKey);
    if (existing) {
      setOverrides(prev => prev.map(o => o.permission === permKey ? { ...o, enabled: newValue } : o));
    } else {
      setOverrides(prev => [...prev, { org_id: null, role: selectedRole, permission: permKey, enabled: newValue }]);
    }
  };

  const handleResetPermission = (permKey: string) => {
    setDirty(true);
    setOverrides(prev => prev.filter(o => o.permission !== permKey));
  };

  const handleSave = async () => {
    setSaving(true);

    // Delete existing overrides for this role, then upsert current
    await supabase.from("role_permissions").delete().eq("role", selectedRole);

    if (overrides.length > 0) {
      const rows = overrides.map(o => ({
        org_id: o.org_id,
        role: o.role,
        permission: o.permission,
        enabled: o.enabled,
      }));
      const { error } = await supabase.from("role_permissions").insert(rows);
      if (error) {
        toast({ title: t("settings.error"), description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: t("settings.saved"), description: t("settings.rolePermsSaved", "Berechtigungen gespeichert.") });
    setSaving(false);
    setDirty(false);
  };

  const canEditRole = currentUserRole === "org_owner" || (currentUserRole === "org_admin" && selectedRole !== "org_admin" && selectedRole !== "org_owner");

  const PERM_LABELS_DE: Record<string, string> = {
    "decisions.read": "Entscheidungen › Lesen",
    "decisions.create": "Entscheidungen › Erstellen",
    "decisions.edit_own": "Entscheidungen › Eigene bearbeiten",
    "decisions.edit_any": "Entscheidungen › Alle bearbeiten",
    "decisions.delete_own": "Entscheidungen › Eigene löschen",
    "decisions.delete_any": "Entscheidungen › Alle löschen",
    "decisions.change_status": "Entscheidungen › Status ändern",
    "reviews.submit": "Reviews › Einreichen",
    "reviews.assign": "Reviews › Zuweisen",
    "comments.write": "Kommentare › Schreiben",
    "tasks.create": "Aufgaben › Erstellen",
    "tasks.edit": "Aufgaben › Bearbeiten",
    "risks.create": "Risiken › Erstellen",
    "risks.read": "Risiken › Lesen",
    "analytics.view": "Analytik › Anzeigen",
    "executive.hub": "Executive › Hub",
    "process.hub": "Prozess › Hub",
    "templates.manage": "Vorlagen › Verwalten",
    "templates.use": "Vorlagen › Verwenden",
    "sla.manage": "SLA › Verwalten",
    "automations.manage": "Automatisierungen › Verwalten",
    "audit.read": "Audit › Lesen",
    "users.manage": "Benutzer › Verwalten",
    "roles.assign": "Rollen › Zuweisen",
    "owner.assign": "Eigentümer › Zuweisen",
    "billing.manage": "Abrechnung › Verwalten",
    "org.settings": "Organisation › Einstellungen",
  };

  const permLabel = (key: string): string => {
    if (i18n.language === "de" && PERM_LABELS_DE[key]) return PERM_LABELS_DE[key];
    const parts = key.split(".");
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" › ");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {EDITABLE_ROLES.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              selectedRole === r
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {labels[r]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5" />
        <span>{t("settings.rolePermsInfo", "Überschreibungen gelten global. Org-spezifische Overrides können in der Datenbank gesetzt werden.")}</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-muted rounded-md animate-pulse" />)}</div>
      ) : (
        <div className="space-y-5">
          {Object.entries(PERMISSION_CATEGORIES).map(([catKey, cat]) => (
            <div key={catKey}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {i18n.language === "de" ? cat.labelDe : cat.label}
              </h4>
              <div className="space-y-1">
                {cat.keys.map(permKey => {
                  const effective = getEffectiveValue(permKey);
                  const overridden = isOverridden(permKey);
                  return (
                    <div key={permKey} className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${overridden ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/30"}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm">{permLabel(permKey)}</span>
                        {overridden && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                            {t("settings.overridden", "Override")}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {overridden && (
                          <button
                            onClick={() => handleResetPermission(permKey)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title={t("settings.resetToDefault", "Auf Standard zurücksetzen")}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                        <Switch
                          checked={effective}
                          onCheckedChange={(val) => handleToggle(permKey, val)}
                          disabled={!canEditRole}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {dirty && canEditRole && (
        <div className="flex items-center gap-3 pt-3 border-t border-border/60">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
            {saving ? <span className="animate-spin">⏳</span> : <CheckCircle2 className="w-3.5 h-3.5" />}
            {t("settings.save")}
          </Button>
          <Button size="sm" variant="ghost" onClick={fetchOverrides} disabled={saving}>
            {t("settings.discard", "Verwerfen")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RolePermissionsPanel;

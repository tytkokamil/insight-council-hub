import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, ArrowRight, ArrowLeft, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { addDays, addMonths, addYears, format } from "date-fns";
import decivioLogo from "@/assets/decivio-logo.png";

interface ComplianceOnboardingProps {
  industry: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface FrameworkDef {
  key: string;
  labelDe: string;
  labelEn: string;
  descDe: string;
  descEn: string;
  industries: string[];
  hasAuditDate: boolean;
}

const FRAMEWORKS: FrameworkDef[] = [
  { key: "nis2", labelDe: "NIS2-Meldepflichten", labelEn: "NIS2 Reporting", descDe: "EU-Richtlinie für Cybersicherheit kritischer Infrastrukturen", descEn: "EU directive for cybersecurity of critical infrastructure", industries: ["pharma", "finanzen", "energie", "healthcare", "automotive", "versicherungen"], hasAuditDate: false },
  { key: "gmp", labelDe: "GMP-Pflicht", labelEn: "GMP Compliance", descDe: "Good Manufacturing Practice — Chargenfreigabe & Audit-Zyklen", descEn: "Good Manufacturing Practice — batch release & audit cycles", industries: ["pharma", "healthcare", "lebensmittel"], hasAuditDate: false },
  { key: "marisk", labelDe: "MaRisk", labelEn: "MaRisk", descDe: "Mindestanforderungen an das Risikomanagement", descEn: "Minimum requirements for risk management", industries: ["finanzen", "versicherungen"], hasAuditDate: false },
  { key: "iso9001", labelDe: "ISO 9001 Zertifizierung", labelEn: "ISO 9001 Certification", descDe: "Qualitätsmanagementsystem — nächstes Audit-Datum angeben", descEn: "Quality management system — specify next audit date", industries: ["pharma", "finanzen", "energie", "healthcare", "automotive", "maschinenbau", "lebensmittel"], hasAuditDate: true },
  { key: "iatf16949", labelDe: "IATF 16949", labelEn: "IATF 16949", descDe: "Automotive Qualitätsmanagement — nächstes Audit-Datum angeben", descEn: "Automotive quality management — specify next audit date", industries: ["automotive"], hasAuditDate: true },
];

const ComplianceOnboarding = ({ industry, onComplete, onSkip }: ComplianceOnboardingProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isEn = i18n.language?.startsWith("en");

  const relevantFrameworks = FRAMEWORKS.filter(f => f.industries.includes(industry));
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});
  const [auditDates, setAuditDates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (relevantFrameworks.length === 0) {
    // Not a regulated industry, skip
    onSkip();
    return null;
  }

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // Get org_id
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();
    const orgId = profile?.org_id;
    if (!orgId) { setSaving(false); onComplete(); return; }

    // Save compliance config
    const configs = relevantFrameworks.map(f => ({
      org_id: orgId,
      framework: f.key,
      enabled: enabled[f.key] || false,
      next_audit_date: f.hasAuditDate && auditDates[f.key] ? auditDates[f.key] : null,
    }));

    await supabase.from("compliance_config").upsert(configs, { onConflict: "org_id,framework" });

    // Generate compliance events for enabled frameworks
    const events: any[] = [];
    const now = new Date();

    for (const fw of relevantFrameworks) {
      if (!enabled[fw.key]) continue;

      if (fw.key === "nis2") {
        // Annual review + quarterly reminders
        const nextReview = addYears(now, 1);
        events.push({
          org_id: orgId, framework: "nis2", title: "NIS2 Jährlicher Review",
          description: "Jährliche Überprüfung der NIS2-Compliance-Maßnahmen",
          event_date: format(nextReview, "yyyy-MM-dd"), event_type: "review", recurrence: "yearly",
        });
        events.push({
          org_id: orgId, framework: "nis2", title: "NIS2 Meldepflicht-Reminder",
          description: "Quartalsweise Prüfung der Meldepflichten",
          event_date: format(addMonths(now, 3), "yyyy-MM-dd"), event_type: "reminder", recurrence: "quarterly",
        });
      }

      if (fw.key === "gmp") {
        events.push({
          org_id: orgId, framework: "gmp", title: "GMP Batch-Review Zyklus",
          description: "Quartalsweise Batch-Review und Dokumentationsprüfung",
          event_date: format(addMonths(now, 3), "yyyy-MM-dd"), event_type: "review", recurrence: "quarterly",
        });
        events.push({
          org_id: orgId, framework: "gmp", title: "GMP Audit",
          description: "Jährliches GMP-Audit",
          event_date: format(addYears(now, 1), "yyyy-MM-dd"), event_type: "audit", recurrence: "yearly",
        });
      }

      if (fw.key === "marisk") {
        events.push({
          org_id: orgId, framework: "marisk", title: "MaRisk Risikobeurteilung",
          description: "Jährliche MaRisk-Risikobeurteilung",
          event_date: format(addYears(now, 1), "yyyy-MM-dd"), event_type: "review", recurrence: "yearly",
        });
      }

      if (fw.key === "iso9001" && auditDates["iso9001"]) {
        const auditDate = new Date(auditDates["iso9001"]);
        events.push({
          org_id: orgId, framework: "iso9001", title: "ISO 9001 Audit",
          description: "Zertifizierungsaudit ISO 9001",
          event_date: auditDates["iso9001"], event_type: "audit",
        });
        // 90 days before: preparation
        const prepDate = addDays(auditDate, -90);
        if (prepDate > now) {
          events.push({
            org_id: orgId, framework: "iso9001", title: "ISO 9001 Vorbereitung starten",
            description: "90 Tage vor Audit — Compliance-Vorbereitung einleiten",
            event_date: format(prepDate, "yyyy-MM-dd"), event_type: "preparation", auto_create_decision: true,
          });
        }
      }

      if (fw.key === "iatf16949" && auditDates["iatf16949"]) {
        const auditDate = new Date(auditDates["iatf16949"]);
        events.push({
          org_id: orgId, framework: "iatf16949", title: "IATF 16949 Audit",
          description: "Zertifizierungsaudit IATF 16949",
          event_date: auditDates["iatf16949"], event_type: "audit",
        });
        const prepDate = addDays(auditDate, -90);
        if (prepDate > now) {
          events.push({
            org_id: orgId, framework: "iatf16949", title: "IATF 16949 Vorbereitung starten",
            description: "90 Tage vor Audit — Compliance-Vorbereitung einleiten",
            event_date: format(prepDate, "yyyy-MM-dd"), event_type: "preparation", auto_create_decision: true,
          });
        }
      }
    }

    if (events.length > 0) {
      await supabase.from("compliance_events").insert(events);
    }

    // Auto-create decisions for preparation events
    for (const ev of events) {
      if (ev.auto_create_decision && ev.event_date) {
        const slaDue = format(addDays(new Date(ev.event_date), 30), "yyyy-MM-dd");
        await supabase.from("decisions").insert([{
          title: `Compliance-Vorbereitung: ${ev.title}`,
          description: ev.description,
          category: "compliance" as any,
          priority: "high",
          status: "draft",
          created_by: user.id,
          owner_id: user.id,
          due_date: slaDue,
        }]);
      }
    }

    setSaving(false);
    onComplete();
  };

  const inputClass = "h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="pt-8 pb-4 text-center">
        <div className="w-10 h-10 rounded-xl overflow-hidden mx-auto mb-4">
          <img src={decivioLogo} alt="Decivio" className="w-full h-full" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-medium mb-3">
          <Shield className="w-3.5 h-3.5" />
          Compliance-Konfiguration
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {isEn ? "Regulatory Requirements" : "Regulatorische Anforderungen"}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-lg mx-auto px-4">
          {isEn
            ? "Based on your industry, we've identified relevant compliance frameworks. Enable the ones that apply to your organization."
            : "Basierend auf Ihrer Branche haben wir relevante Compliance-Frameworks identifiziert. Aktivieren Sie die für Ihre Organisation geltenden."}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-32">
        <div className="max-w-xl mx-auto space-y-4 mt-6">
          {relevantFrameworks.map((fw, i) => (
            <motion.div
              key={fw.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-4 rounded-xl border-2 transition-all ${
                enabled[fw.key]
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm">{isEn ? fw.labelEn : fw.labelDe}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{isEn ? fw.descEn : fw.descDe}</p>
                </div>
                <Switch
                  checked={enabled[fw.key] || false}
                  onCheckedChange={(v) => setEnabled(prev => ({ ...prev, [fw.key]: v }))}
                />
              </div>

              {fw.hasAuditDate && enabled[fw.key] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 border-t border-border/50"
                >
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                    <Calendar className="w-3 h-3" />
                    {isEn ? "Next audit date" : "Nächstes Audit-Datum"}
                  </label>
                  <input
                    type="date"
                    value={auditDates[fw.key] || ""}
                    onChange={e => setAuditDates(prev => ({ ...prev, [fw.key]: e.target.value }))}
                    className={inputClass}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-background/80 backdrop-blur-lg border-t border-border/60 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            {isEn ? "Skip for now" : "Später konfigurieren"}
          </button>
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving}
            className="gap-2 min-w-[180px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {isEn ? "Save & Continue" : "Speichern & Weiter"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComplianceOnboarding;

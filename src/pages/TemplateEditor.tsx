import { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import {
  FileText, Plus, Trash2, GripVertical, Save, AlertTriangle, ChevronDown, ChevronRight,
  Settings2, Download, Upload, Loader2, Copy, Shield, TrendingUp, Clock, Zap, BarChart3,
  History, CheckCircle2, XCircle, Activity, DollarSign, Target, Link2, ArrowRight, Info
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplates, type DbTemplate } from "@/hooks/useTemplates";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions } from "@/hooks/useDecisions";
import { type RequiredField, type ApprovalStep } from "@/lib/decisionTemplates";
import { useTranslatedLabels } from "@/lib/labels";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ─── Helpers ─── */
function computeHealthScore(draft: DbTemplate, t: (k: string) => string): { score: number; checks: { label: string; ok: boolean }[] } {
  const checks = [
    { label: t("templateEditor.healthCheckFields"), ok: (draft.required_fields?.length || 0) >= 1 },
    { label: t("templateEditor.healthCheckRisk"), ok: (draft.required_fields || []).some((f: any) => f.type === "risk_matrix" || f.key?.includes("risk")) },
    { label: t("templateEditor.healthCheckRoi"), ok: (draft.required_fields || []).some((f: any) => f.type === "percent" || f.type === "currency" || f.key?.includes("roi") || f.key?.includes("budget")) },
    { label: t("templateEditor.healthCheckApproval"), ok: (draft.approval_steps?.length || 0) >= 1 },
    { label: t("templateEditor.healthCheckSla"), ok: draft.default_duration_days > 0 },
    { label: t("templateEditor.healthCheckRules"), ok: (draft.conditional_rules?.length || 0) >= 1 },
    { label: t("templateEditor.healthCheckGov"), ok: !!(draft.governance_notes && draft.governance_notes.trim().length > 0) },
    { label: t("templateEditor.healthCheckDesc"), ok: !!(draft.description && draft.description.trim().length > 10) },
  ];
  const passed = checks.filter(c => c.ok).length;
  const score = Math.round((passed / checks.length) * 100);
  return { score, checks };
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-destructive";
}

const TemplateEditor = () => {
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const { templates, isLoading, seedDefaults, updateTemplate, deleteTemplate, createTemplate } = useTemplates();
  const { user } = useAuth();
  const { data: decisions = [] } = useDecisions();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localDraft, setLocalDraft] = useState<DbTemplate | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    health: true, fields: true, approval: true, rules: false, governance: false, automation: false, analytics: true, versions: false,
  });
  const [sidebarSort, setSidebarSort] = useState<"score-asc" | "score-desc" | "az">("score-asc");

  // Refs for scrolling health check items
  const fieldsRef = useRef<HTMLDivElement>(null);
  const approvalRef = useRef<HTMLDivElement>(null);
  const rulesRef = useRef<HTMLDivElement>(null);
  const governanceRef = useRef<HTMLDivElement>(null);

  const healthCheckScrollMap: Record<string, { ref: React.RefObject<HTMLDivElement>; section: string }> = useMemo(() => ({
    [t("templateEditor.healthCheckFields")]: { ref: fieldsRef, section: "fields" },
    [t("templateEditor.healthCheckRisk")]: { ref: fieldsRef, section: "fields" },
    [t("templateEditor.healthCheckRoi")]: { ref: fieldsRef, section: "fields" },
    [t("templateEditor.healthCheckApproval")]: { ref: approvalRef, section: "approval" },
    [t("templateEditor.healthCheckSla")]: { ref: fieldsRef, section: "fields" },
    [t("templateEditor.healthCheckRules")]: { ref: rulesRef, section: "rules" },
    [t("templateEditor.healthCheckGov")]: { ref: governanceRef, section: "governance" },
    [t("templateEditor.healthCheckDesc")]: { ref: fieldsRef, section: "fields" },
  }), [t]);

  const handleHealthCheckClick = (label: string) => {
    const target = healthCheckScrollMap[label];
    if (!target) return;
    setExpandedSections(prev => ({ ...prev, [target.section]: true }));
    setTimeout(() => {
      target.ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const fieldTypes = useMemo(() => [
    { value: "text", label: t("templateEditor.fieldTypeText") },
    { value: "textarea", label: t("templateEditor.fieldTypeTextarea") },
    { value: "number", label: t("templateEditor.fieldTypeNumber") },
    { value: "currency", label: t("templateEditor.fieldTypeCurrency") },
    { value: "percent", label: t("templateEditor.fieldTypePercent") },
    { value: "date", label: t("templateEditor.fieldTypeDate") },
    { value: "select", label: t("templateEditor.fieldTypeSelect") },
    { value: "multi_select", label: t("templateEditor.fieldTypeMultiSelect") },
    { value: "risk_matrix", label: t("templateEditor.fieldTypeRiskMatrix") },
    { value: "stakeholder", label: t("templateEditor.fieldTypeStakeholder") },
    { value: "attachment", label: t("templateEditor.fieldTypeAttachment") },
    { value: "checkbox", label: t("templateEditor.fieldTypeCheckbox") },
  ], [t]);

  useEffect(() => {
    if (templates.length > 0 && !selectedId) setSelectedId(templates[0].id);
  }, [templates, selectedId]);

  useEffect(() => {
    const found = templates.find(t => t.id === selectedId);
    if (found) setLocalDraft(JSON.parse(JSON.stringify(found)));
  }, [selectedId, templates]);

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const patchDraft = (patch: Partial<DbTemplate>) => {
    if (!localDraft) return;
    setLocalDraft({ ...localDraft, ...patch });
  };

  const updateField = (fieldIdx: number, patch: Partial<RequiredField>) => {
    if (!localDraft) return;
    const newFields = [...localDraft.required_fields];
    newFields[fieldIdx] = { ...newFields[fieldIdx], ...patch };
    patchDraft({ required_fields: newFields });
  };

  const addField = () => {
    if (!localDraft) return;
    patchDraft({
      required_fields: [
        ...localDraft.required_fields,
        { key: `field_${Date.now()}`, label: t("templateEditor.newFieldLabel"), type: "text", placeholder: "", validation: "" },
      ],
    });
  };

  const removeField = (idx: number) => {
    if (!localDraft) return;
    patchDraft({ required_fields: localDraft.required_fields.filter((_: any, i: number) => i !== idx) });
  };

  const updateStep = (stepIdx: number, patch: Partial<ApprovalStep & { sla_days?: number; escalation_level?: number }>) => {
    if (!localDraft) return;
    const newSteps = [...localDraft.approval_steps];
    newSteps[stepIdx] = { ...newSteps[stepIdx], ...patch };
    patchDraft({ approval_steps: newSteps });
  };

  const addStep = () => {
    if (!localDraft) return;
    patchDraft({
      approval_steps: [
        ...localDraft.approval_steps,
        { role: "reviewer", label: t("templateEditor.newStepLabel"), required: false, sla_days: 3, escalation_level: 1 },
      ],
    });
  };

  const removeStep = (idx: number) => {
    if (!localDraft) return;
    patchDraft({ approval_steps: localDraft.approval_steps.filter((_: any, i: number) => i !== idx) });
  };

  const addRule = () => {
    if (!localDraft) return;
    patchDraft({
      conditional_rules: [
        ...(localDraft.conditional_rules || []),
        { when: "priority", operator: "equals", value: "critical", addFields: [], addApprovalSteps: [], governanceHint: "" },
      ],
    });
  };

  const updateRule = (idx: number, patch: Record<string, any>) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    rules[idx] = { ...rules[idx], ...patch };
    patchDraft({ conditional_rules: rules });
  };

  const removeRule = (idx: number) => {
    if (!localDraft) return;
    patchDraft({ conditional_rules: (localDraft.conditional_rules || []).filter((_: any, i: number) => i !== idx) });
  };

  const addRuleField = (ruleIdx: number) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    const rule = { ...rules[ruleIdx] };
    rule.addFields = [...(rule.addFields || []), { key: `cond_field_${Date.now()}`, label: t("templateEditor.newFieldLabel"), type: "text", placeholder: "" }];
    rules[ruleIdx] = rule;
    patchDraft({ conditional_rules: rules });
  };

  const updateRuleField = (ruleIdx: number, fieldIdx: number, patch: Record<string, any>) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    const rule = { ...rules[ruleIdx] };
    const fields = [...(rule.addFields || [])];
    fields[fieldIdx] = { ...fields[fieldIdx], ...patch };
    rule.addFields = fields;
    rules[ruleIdx] = rule;
    patchDraft({ conditional_rules: rules });
  };

  const removeRuleField = (ruleIdx: number, fieldIdx: number) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    const rule = { ...rules[ruleIdx] };
    rule.addFields = (rule.addFields || []).filter((_: any, i: number) => i !== fieldIdx);
    rules[ruleIdx] = rule;
    patchDraft({ conditional_rules: rules });
  };

  const addRuleStep = (ruleIdx: number) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    const rule = { ...rules[ruleIdx] };
    rule.addApprovalSteps = [...(rule.addApprovalSteps || []), { role: "reviewer", label: t("templateEditor.newStepLabel"), required: false }];
    rules[ruleIdx] = rule;
    patchDraft({ conditional_rules: rules });
  };

  const updateRuleStep = (ruleIdx: number, stepIdx: number, patch: Record<string, any>) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    const rule = { ...rules[ruleIdx] };
    const steps = [...(rule.addApprovalSteps || [])];
    steps[stepIdx] = { ...steps[stepIdx], ...patch };
    rule.addApprovalSteps = steps;
    rules[ruleIdx] = rule;
    patchDraft({ conditional_rules: rules });
  };

  const removeRuleStep = (ruleIdx: number, stepIdx: number) => {
    if (!localDraft) return;
    const rules = [...(localDraft.conditional_rules || [])];
    const rule = { ...rules[ruleIdx] };
    rule.addApprovalSteps = (rule.addApprovalSteps || []).filter((_: any, i: number) => i !== stepIdx);
    rules[ruleIdx] = rule;
    patchDraft({ conditional_rules: rules });
  };

  /* ─── Template Analytics ─── */
  const templateAnalytics = useMemo(() => {
    if (!localDraft) return null;
    const templateDecisions = decisions.filter(d => d.template_used === localDraft.name);
    const total = templateDecisions.length;
    if (total === 0) return { total: 0, implemented: 0, rejected: 0, avgDays: 0, slaViolations: 0, reworkRate: 0, rejectionRate: 0 };

    const implemented = templateDecisions.filter(d => d.status === "implemented");
    const rejected = templateDecisions.filter(d => d.status === "rejected");
    const completionDays = implemented
      .filter(d => d.implemented_at)
      .map(d => differenceInDays(new Date(d.implemented_at!), new Date(d.created_at)));
    const avgDays = completionDays.length > 0 ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length) : 0;
    const overdue = templateDecisions.filter(d => d.due_date && new Date(d.due_date) < new Date() && !["implemented", "rejected", "archived"].includes(d.status));

    return { total, implemented: implemented.length, rejected: rejected.length, avgDays, slaViolations: overdue.length, reworkRate: 0, rejectionRate: total > 0 ? Math.round((rejected.length / total) * 100) : 0 };
  }, [localDraft, decisions]);

  const healthData = useMemo(() => localDraft ? computeHealthScore(localDraft, t) : null, [localDraft, t]);

  const handleSave = () => {
    if (!localDraft) return;
    const duplicate = templates.find(t => t.name.trim().toLowerCase() === localDraft.name.trim().toLowerCase() && t.id !== localDraft.id);
    if (duplicate) {
      toast.error(t("templateEditor.duplicateNameError", { name: localDraft.name }));
      return;
    }
    const newVersion = localDraft.version + 1;
    updateTemplate.mutate({
      id: localDraft.id,
      patch: {
        name: localDraft.name, category: localDraft.category, priority: localDraft.priority,
        description: localDraft.description, default_duration_days: localDraft.default_duration_days,
        required_fields: localDraft.required_fields, approval_steps: localDraft.approval_steps,
        conditional_rules: localDraft.conditional_rules, governance_notes: localDraft.governance_notes,
        when_to_use: localDraft.when_to_use, version: newVersion,
      } as any,
    });
  };

  const handleCreateNew = () => {
    if (!user) return;
    const slug = `custom-${Date.now()}`;
    createTemplate.mutate({
      name: t("templateEditor.newTemplate"), slug, category: "operational", priority: "medium",
      description: "", default_duration_days: 7, required_fields: [], approval_steps: [],
      conditional_rules: [], governance_notes: null, when_to_use: null, icon_color: null,
      version: 1, is_system: false, created_by: user.id,
    } as any, {
      onSuccess: () => { setTimeout(() => { const newest = templates[templates.length - 1]; if (newest) setSelectedId(newest.id); }, 500); },
    });
  };

  const handleDuplicate = () => {
    if (!localDraft || !user) return;
    const slug = `${localDraft.slug}-copy-${Date.now()}`;
    createTemplate.mutate({
      name: t("templateEditor.copyName", { name: localDraft.name }), slug,
      category: localDraft.category, priority: localDraft.priority, description: localDraft.description,
      default_duration_days: localDraft.default_duration_days, required_fields: localDraft.required_fields,
      approval_steps: localDraft.approval_steps, conditional_rules: localDraft.conditional_rules,
      governance_notes: localDraft.governance_notes, when_to_use: localDraft.when_to_use,
      icon_color: localDraft.icon_color, version: 1, is_system: false, created_by: user.id,
    } as any);
  };

  const handleDelete = () => {
    if (!localDraft || localDraft.is_system) return;
    if (!confirm(t("templateEditor.confirmDelete", { name: localDraft.name }))) return;
    deleteTemplate.mutate(localDraft.id, { onSuccess: () => { setSelectedId(null); setLocalDraft(null); } });
  };

  const handleExportTemplate = () => {
    if (!localDraft) return;
    const exportData = {
      name: localDraft.name, category: localDraft.category, priority: localDraft.priority,
      description: localDraft.description, default_duration_days: localDraft.default_duration_days,
      required_fields: localDraft.required_fields, approval_steps: localDraft.approval_steps,
      conditional_rules: localDraft.conditional_rules, governance_notes: localDraft.governance_notes,
      when_to_use: localDraft.when_to_use, icon_color: localDraft.icon_color, version: localDraft.version,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `template-${localDraft.slug || localDraft.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(t("templateEditor.exportedJson"));
  };

  const handleExportAll = () => {
    const exportData = templates.map(tmpl => ({
      name: tmpl.name, category: tmpl.category, priority: tmpl.priority, description: tmpl.description,
      default_duration_days: tmpl.default_duration_days, required_fields: tmpl.required_fields,
      approval_steps: tmpl.approval_steps, conditional_rules: tmpl.conditional_rules,
      governance_notes: tmpl.governance_notes, when_to_use: tmpl.when_to_use,
      icon_color: tmpl.icon_color, version: tmpl.version,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "templates-export.json"; a.click(); URL.revokeObjectURL(url);
    toast.success(t("templateEditor.exportedAll", { count: templates.length }));
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      let count = 0;
      for (const item of items) {
        if (!item.name) continue;
        const slug = `import-${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
        await new Promise<void>((resolve, reject) => {
          createTemplate.mutate({
            name: item.name, slug, category: item.category || "operational", priority: item.priority || "medium",
            description: item.description || "", default_duration_days: item.default_duration_days || 7,
            required_fields: item.required_fields || [], approval_steps: item.approval_steps || [],
            conditional_rules: item.conditional_rules || [], governance_notes: item.governance_notes || null,
            when_to_use: item.when_to_use || null, icon_color: item.icon_color || null,
            version: item.version || 1, is_system: false, created_by: user.id,
          } as any, { onSuccess: () => resolve(), onError: (err: Error) => reject(err) });
        });
        count++;
      }
      toast.success(t("templateEditor.importedCount", { count }));
    } catch (err: any) {
      toast.error(t("templateEditor.importFailed", { error: err.message || "Invalid JSON" }));
    }
    if (importFileRef.current) importFileRef.current.value = "";
  };

  const SectionHeader = ({ label, sectionKey, count, icon: Icon }: { label: string; sectionKey: string; count?: number; icon?: any }) => (
    <button onClick={() => toggleSection(sectionKey)} className="flex items-center gap-2 w-full text-left py-2">
      {expandedSections[sectionKey] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      <span className="text-sm font-semibold">{label}</span>
      {count !== undefined && <Badge variant="secondary" className="text-[10px]">{count}</Badge>}
    </button>
  );

  if (!isLoading && templates.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("templateEditor.noTemplates")}</p>
          <Button onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-2">
            {seedDefaults.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {t("templateEditor.seedDefaults")}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold">{t("templateEditor.title")}</h1>
        <Badge variant="outline" className="text-[10px]">{t("templateEditor.enterpriseGovernance")}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* ─── Sidebar ─── */}
        <Card>
           <CardContent className="p-3 space-y-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Templates ({isLoading ? "…" : templates.length})
              </p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCreateNew} disabled={createTemplate.isPending} title={t("templateEditor.newTemplate")}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {/* Sort toggle */}
            <div className="flex gap-1 mb-2">
              {([["score-asc", "Score ↑"], ["score-desc", "Score ↓"], ["az", "A–Z"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSidebarSort(key)}
                  className={`text-[10px] px-2 py-0.5 rounded-md transition-colors ${sidebarSort === key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
            ) : (
              [...templates].sort((a, b) => {
                if (sidebarSort === "az") return a.name.localeCompare(b.name);
                const scoreA = computeHealthScore(a, t).score;
                const scoreB = computeHealthScore(b, t).score;
                return sidebarSort === "score-asc" ? scoreA - scoreB : scoreB - scoreA;
              }).map(tmpl => {
                const h = computeHealthScore(tmpl, t);
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedId(tmpl.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                      tmpl.id === selectedId ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1">{tmpl.name}</span>
                      <span className={`text-[10px] font-mono font-bold ${getScoreColor(h.score)}`}>{h.score}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{tl.categoryLabels[tmpl.category] || tmpl.category}</span>
                      <span>·</span>
                      <span>v{tmpl.version}</span>
                      {tmpl.is_system && <Badge variant="outline" className="text-[8px] px-1 py-0">System</Badge>}
                    </div>
                    <Progress value={h.score} className="h-1 mt-1.5" />
                  </button>
                );
              })
            )}
            <Separator className="my-2" />
            <div className="flex gap-1.5">
              <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
              <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-7" onClick={() => importFileRef.current?.click()}>
                <Upload className="w-3 h-3" /> Import
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1 text-xs h-7" onClick={handleExportAll} disabled={templates.length === 0}>
                <Download className="w-3 h-3" /> {t("templateEditor.allExport")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Editor ─── */}
        {localDraft ? (
          <motion.div key={localDraft.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20 relative">

            {/* ── 1. Template Health Score ── */}
            <Card className="border-primary/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl font-bold font-mono ${healthData ? getScoreColor(healthData.score) : ""}`}>
                      {healthData?.score || 0}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{t("templateEditor.healthScore")}</h3>
                      <p className="text-[10px] text-muted-foreground">{t("templateEditor.designQuality")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={handleExportTemplate} className="gap-1 text-xs">
                      <Download className="w-3.5 h-3.5" /> Export
                    </Button>
                    {!localDraft.is_system && (
                      <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteTemplate.isPending} className="gap-1 text-xs text-destructive/70 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {healthData?.checks.map((c, i) => (
                    c.ok ? (
                      <div key={i} className="flex items-center gap-1.5 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-foreground">{c.label}</span>
                      </div>
                    ) : (
                      <Tooltip key={i}>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleHealthCheckClick(c.label)}
                            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer text-left"
                          >
                            <XCircle className="w-3.5 h-3.5 text-destructive/60 shrink-0" />
                            <span className="underline decoration-dashed underline-offset-2">{c.label}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Klicken um zu ergänzen →</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── Meta / Grunddaten ── */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> {t("templateEditor.basicData")}
                  {localDraft.is_system && <Badge variant="outline" className="text-[9px]">System</Badge>}
                  {!localDraft.is_system && <Badge variant="secondary" className="text-[9px]">{t("templateEditor.custom")}</Badge>}
                  <Badge variant="outline" className="text-[9px] ml-auto">v{localDraft.version}</Badge>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">{t("templateEditor.nameLabel")}</label>
                    <Input value={localDraft.name} onChange={e => patchDraft({ name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t("templateEditor.categoryLabel")}</label>
                    <Select value={localDraft.category} onValueChange={v => patchDraft({ category: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(tl.categoryLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t("templateEditor.defaultPriority")}</label>
                    <Select value={localDraft.priority} onValueChange={v => patchDraft({ priority: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(tl.priorityLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">{t("templateEditor.defaultSla")}</label>
                    <Input type="number" value={localDraft.default_duration_days} onChange={e => patchDraft({ default_duration_days: parseInt(e.target.value) || 7 })} className="mt-1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("templateEditor.descLabel")}</label>
                  <Textarea value={localDraft.description} onChange={e => patchDraft({ description: e.target.value })} className="mt-1" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{t("templateEditor.usageHint")}</label>
                  <Textarea value={localDraft.when_to_use || ""} onChange={e => patchDraft({ when_to_use: e.target.value } as any)} className="mt-1" rows={2} placeholder={t("templateEditor.usagePlaceholder")} />
                </div>
              </CardContent>
            </Card>

            {/* ── 2. Pflichtfelder ── */}
            <Card ref={fieldsRef}>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.requiredFields")} sectionKey="fields" count={localDraft.required_fields.length} icon={Target} />
                {expandedSections.fields && (
                  <div className="space-y-3 mt-2">
                    {localDraft.required_fields.map((field: any, idx: number) => (
                      <div key={field.key || idx} className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-2 shrink-0 cursor-grab" />
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">{t("templateEditor.labelCol")}</label>
                              <Input value={field.label} onChange={e => updateField(idx, { label: e.target.value })} className="mt-0.5 h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {t("templateEditor.typeCol")}
                                <span className="text-muted-foreground/50">({fieldTypes.length})</span>
                              </label>
                              <Select value={field.type} onValueChange={v => updateField(idx, { type: v as any })}>
                                <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {fieldTypes.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">{t("templateEditor.placeholderCol")}</label>
                              <Input value={field.placeholder || ""} onChange={e => updateField(idx, { placeholder: e.target.value })} className="mt-0.5 h-8 text-xs" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                                {t("templateEditor.validationCol")}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="w-3 h-3 text-muted-foreground/50 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-xs">{t("templateEditor.validationTooltip")}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </label>
                              <Input value={(field as any).validation || ""} onChange={e => updateField(idx, { validation: e.target.value } as any)} className="mt-0.5 h-8 text-xs" placeholder={t("templateEditor.validationPlaceholder")} />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">{t("templateEditor.optionsCol")}</label>
                              <Input value={(field as any).options || ""} onChange={e => updateField(idx, { options: e.target.value } as any)} className="mt-0.5 h-8 text-xs" placeholder={t("templateEditor.optionsPlaceholder")} disabled={!["select", "multi_select"].includes(field.type)} />
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeField(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addField}>
                        <Plus className="w-3.5 h-3.5" /> {t("templateEditor.addField")}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={() => {
                            if (!localDraft) return;
                            patchDraft({
                              required_fields: [
                                ...localDraft.required_fields,
                                { key: "budget_impact", label: "Budget-Auswirkung", type: "currency", placeholder: "€ Betrag eingeben", validation: "> 0" },
                                { key: "roi_estimate", label: "ROI-Schätzung", type: "percent", placeholder: "Erwarteter ROI in %", validation: "" },
                                { key: "risk_assessment", label: "Risiko-Bewertung", type: "risk_matrix", placeholder: "Likelihood × Impact", validation: "" },
                              ],
                            });
                            toast.success(t("templateEditor.govFieldsAdded"));
                          }}>
                            <Shield className="w-3.5 h-3.5" /> {t("templateEditor.insertGovFields")}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">{t("templateEditor.govFieldsTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 3. Governance-Regeln ── */}
            <Card ref={governanceRef}>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.govRules")} sectionKey="governance" icon={Shield} />
                {expandedSections.governance && (
                  <div className="space-y-3 mt-2">
                    <Textarea value={localDraft.governance_notes || ""} onChange={e => patchDraft({ governance_notes: e.target.value })} className="text-xs" rows={3} placeholder={t("templateEditor.govPlaceholder")} />
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[10px] text-primary font-medium flex items-center gap-1.5">
                        <Zap className="w-3 h-3" />
                        {t("templateEditor.govAutoHint")}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 4. Freigabe-Schritte ── */}
            <Card ref={approvalRef}>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.approvalSteps")} sectionKey="approval" count={localDraft.approval_steps.length} icon={CheckCircle2} />
                {expandedSections.approval && (
                  <div className="space-y-3 mt-2">
                    {localDraft.approval_steps.map((step: any, idx: number) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground w-6 text-center bg-muted rounded px-1">{idx + 1}</span>
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground">{t("templateEditor.stepLabel")}</label>
                              <Input value={step.label} onChange={e => updateStep(idx, { label: e.target.value })} className="mt-0.5 h-8 text-xs" />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground">{t("templateEditor.stepRole")}</label>
                              <Select value={step.role} onValueChange={v => updateStep(idx, { role: v })}>
                                <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="decision_maker">{t("templateEditor.roleDecisionMaker")}</SelectItem>
                                  <SelectItem value="reviewer">{t("templateEditor.roleReviewer")}</SelectItem>
                                  <SelectItem value="admin">{t("templateEditor.roleAdmin")}</SelectItem>
                                  <SelectItem value="cfo">{t("templateEditor.roleCfo")}</SelectItem>
                                  <SelectItem value="risk_officer">{t("templateEditor.roleRiskOfficer")}</SelectItem>
                                  <SelectItem value="board">{t("templateEditor.roleBoard")}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeStep(idx)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-4 pl-9">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-muted-foreground">{t("templateEditor.stepSlaDays")}</label>
                            <Input type="number" value={step.sla_days || 3} onChange={e => updateStep(idx, { sla_days: parseInt(e.target.value) || 3 } as any)} className="h-7 w-16 text-xs" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-muted-foreground">{t("templateEditor.stepEscalation")}</label>
                            <Input type="number" value={step.escalation_level || 1} onChange={e => updateStep(idx, { escalation_level: parseInt(e.target.value) || 1 } as any)} className="h-7 w-16 text-xs" />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-muted-foreground">{t("templateEditor.stepRequired")}</label>
                            <Switch checked={step.required} onCheckedChange={v => updateStep(idx, { required: v })} />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addStep}>
                      <Plus className="w-3.5 h-3.5" /> {t("templateEditor.addStep")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 5. Bedingte Regeln ── */}
            <Card ref={rulesRef}>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.conditionalRules")} sectionKey="rules" count={localDraft.conditional_rules?.length || 0} icon={AlertTriangle} />
                {expandedSections.rules && (
                  <div className="space-y-3 mt-2">
                    {(!localDraft.conditional_rules || localDraft.conditional_rules.length === 0) ? (
                      <p className="text-xs text-muted-foreground">{t("templateEditor.noRules")}</p>
                    ) : (
                      localDraft.conditional_rules.map((rule: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border text-xs space-y-3">
                          <div className="flex items-start gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-500 mt-1 shrink-0" />
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-muted-foreground">{t("templateEditor.whenField")}</label>
                                <Select value={rule.when} onValueChange={v => updateRule(idx, { when: v })}>
                                  <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="priority">{t("templateEditor.condPriority")}</SelectItem>
                                    <SelectItem value="category">{t("templateEditor.condCategory")}</SelectItem>
                                    <SelectItem value="budget_impact">{t("templateEditor.condBudget")}</SelectItem>
                                    <SelectItem value="stakeholder_count">{t("templateEditor.condStakeholders")}</SelectItem>
                                    <SelectItem value="risk_score">{t("templateEditor.condRiskScore")}</SelectItem>
                                    <SelectItem value="roi_estimate">{t("templateEditor.condRoi")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">{t("templateEditor.operator")}</label>
                                <Select value={rule.operator} onValueChange={v => updateRule(idx, { operator: v })}>
                                  <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="equals">{t("templateEditor.opEquals")}</SelectItem>
                                    <SelectItem value="not_equals">{t("templateEditor.opNotEquals")}</SelectItem>
                                    <SelectItem value="greater_than">{t("templateEditor.opGreaterThan")}</SelectItem>
                                    <SelectItem value="less_than">{t("templateEditor.opLessThan")}</SelectItem>
                                    <SelectItem value="in">{t("templateEditor.opIn")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">{t("templateEditor.values")}</label>
                                <Input
                                  value={Array.isArray(rule.value) ? rule.value.join(", ") : rule.value}
                                  onChange={e => {
                                    const raw = e.target.value;
                                    const val = rule.operator === "in" ? raw.split(",").map((s: string) => s.trim()).filter(Boolean) : raw;
                                    updateRule(idx, { value: val });
                                  }}
                                  className="mt-0.5 h-8 text-xs"
                                  placeholder={rule.operator === "in" ? t("templateEditor.commaValues") : t("templateEditor.valuePlaceholder")}
                                />
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeRule(idx)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">{t("templateEditor.govHintOnTrigger")}</label>
                            <Input value={rule.governanceHint || ""} onChange={e => updateRule(idx, { governanceHint: e.target.value })} className="mt-0.5 h-8 text-xs" placeholder={t("templateEditor.govHintPlaceholder")} />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">{t("templateEditor.additionalFields", { count: rule.addFields?.length || 0 })}</label>
                            <div className="space-y-1.5">
                              {(rule.addFields || []).map((f: any, fi: number) => (
                                <div key={fi} className="flex items-center gap-2">
                                  <Input value={f.label} onChange={e => updateRuleField(idx, fi, { label: e.target.value, key: e.target.value.toLowerCase().replace(/\s+/g, "_") })} className="h-7 text-xs flex-1" placeholder={t("templateEditor.fieldName")} />
                                  <Select value={f.type} onValueChange={v => updateRuleField(idx, fi, { type: v })}>
                                    <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {fieldTypes.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60" onClick={() => removeRuleField(idx, fi)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => addRuleField(idx)}>
                                <Plus className="w-3 h-3" /> {t("templateEditor.field")}
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground mb-1 block">{t("templateEditor.additionalSteps", { count: rule.addApprovalSteps?.length || 0 })}</label>
                            <div className="space-y-1.5">
                              {(rule.addApprovalSteps || []).map((s: any, si: number) => (
                                <div key={si} className="flex items-center gap-2">
                                  <Input value={s.label} onChange={e => updateRuleStep(idx, si, { label: e.target.value })} className="h-7 text-xs flex-1" placeholder={t("templateEditor.stepName")} />
                                  <Select value={s.role} onValueChange={v => updateRuleStep(idx, si, { role: v })}>
                                    <SelectTrigger className="h-7 text-xs w-[100px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="decision_maker">{t("templateEditor.roleDecisionMaker")}</SelectItem>
                                      <SelectItem value="reviewer">{t("templateEditor.roleReviewer")}</SelectItem>
                                      <SelectItem value="admin">{t("templateEditor.roleAdmin")}</SelectItem>
                                      <SelectItem value="cfo">{t("templateEditor.roleCfo")}</SelectItem>
                                      <SelectItem value="risk_officer">{t("templateEditor.roleRiskOfficer")}</SelectItem>
                                      <SelectItem value="board">{t("templateEditor.roleBoard")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <div className="flex items-center gap-1">
                                    <label className="text-[9px] text-muted-foreground">{t("templateEditor.stepRequired")}</label>
                                    <Switch checked={s.required} onCheckedChange={v => updateRuleStep(idx, si, { required: v })} className="scale-75" />
                                  </div>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60" onClick={() => removeRuleStep(idx, si)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1" onClick={() => addRuleStep(idx)}>
                                <Plus className="w-3 h-3" /> {t("templateEditor.approvalStep")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addRule}>
                      <Plus className="w-3.5 h-3.5" /> {t("templateEditor.addRule")}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 6. Automation-Verknüpfung ── */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.linkedAutomations")} sectionKey="automation" icon={Zap} />
                {expandedSections.automation && (
                  <div className="space-y-2 mt-2">
                    {localDraft.priority === "high" || localDraft.priority === "critical" ? (
                      <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{t("templateEditor.slaAutomatic")}</p>
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.slaDaysAtPriority", { days: localDraft.priority === "critical" ? 3 : 5, priority: tl.priorityLabels[localDraft.priority] })}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-emerald-500">{t("mfa.active")}</Badge>
                      </div>
                    ) : null}
                    {(localDraft.conditional_rules || []).length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{t("templateEditor.conditionalEscalation")}</p>
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.rulesConfigured", { count: (localDraft.conditional_rules || []).length })}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-emerald-500">{t("mfa.active")}</Badge>
                      </div>
                    )}
                    {(localDraft.approval_steps || []).length > 0 && (
                      <div className="p-3 rounded-lg bg-muted/20 border border-border flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">{t("templateEditor.autoNotification")}</p>
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.reviewerNotified")}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] text-emerald-500">{t("mfa.active")}</Badge>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground pt-1">{t("templateEditor.automationHint")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 7. Template Analytics ── */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.analytics")} sectionKey="analytics" icon={BarChart3} />
                {expandedSections.analytics && templateAnalytics && (
                  <div className="mt-2">
                    {templateAnalytics.total === 0 ? (
                      <div className="text-center py-6">
                        <BarChart3 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Noch nicht verwendet — wird nach erster Nutzung befüllt.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-muted/20 border border-border">
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.total")}</p>
                          <p className="text-lg font-bold">{templateAnalytics.total}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border">
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.avgTimeToDecision")}</p>
                          <p className="text-lg font-bold">{templateAnalytics.avgDays}<span className="text-xs font-normal text-muted-foreground ml-1">{t("templateEditor.daysUnit")}</span></p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border">
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.rejectionRate")}</p>
                          <p className={`text-lg font-bold ${templateAnalytics.rejectionRate > 30 ? "text-destructive" : ""}`}>{templateAnalytics.rejectionRate}%</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border">
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.implemented")}</p>
                          <p className="text-lg font-bold text-emerald-500">{templateAnalytics.implemented}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border">
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.rejected")}</p>
                          <p className="text-lg font-bold text-destructive">{templateAnalytics.rejected}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/20 border border-border">
                          <p className="text-[10px] text-muted-foreground">{t("templateEditor.slaViolations")}</p>
                          <p className={`text-lg font-bold ${templateAnalytics.slaViolations > 0 ? "text-amber-500" : ""}`}>{templateAnalytics.slaViolations}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── 8. Versionierung ── */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader label={t("templateEditor.versionHistory")} sectionKey="versions" icon={History} />
                {expandedSections.versions && (
                  <div className="space-y-2 mt-2">
                    {Array.from({ length: Math.min(localDraft.version, 5) }, (_, i) => localDraft.version - i).map(v => (
                      <div key={v} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${v === localDraft.version ? "border-primary/30 bg-primary/5" : "border-border bg-muted/10"}`}>
                        <Badge variant={v === localDraft.version ? "default" : "outline"} className="text-[10px]">v{v}</Badge>
                        <span className="flex-1 text-muted-foreground">
                          {v === localDraft.version ? t("templateEditor.currentVersion") : t("templateEditor.versionLabel", { v })}
                        </span>
                        {v === localDraft.version && (
                          <Badge variant="outline" className="text-[9px] text-emerald-500">{t("mfa.active")}</Badge>
                        )}
                        {v < localDraft.version && (
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground">
                            <History className="w-3 h-3" /> {t("templateEditor.restore")}
                          </Button>
                        )}
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground">{t("templateEditor.autoVersionHint")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Sticky Save Footer ── */}
            <div className="sticky bottom-0 left-0 right-0 bg-background border-t border-[hsl(214_32%_91%)] px-6 py-3 flex items-center justify-end gap-2 z-10 -mx-0">
              <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={createTemplate.isPending} className="gap-1.5 text-xs">
                <Copy className="w-3.5 h-3.5" /> {t("templateEditor.duplicate")}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={updateTemplate.isPending} className="gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                {updateTemplate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {t("templateEditor.save")}
              </Button>
            </div>

          </motion.div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TemplateEditor;

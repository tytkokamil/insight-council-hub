import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, GripVertical, Save, AlertTriangle, ChevronDown, ChevronRight, Settings2, Download, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTemplates, type DbTemplate } from "@/hooks/useTemplates";
import { type RequiredField, type ApprovalStep } from "@/lib/decisionTemplates";
import { categoryLabels, priorityLabels } from "@/lib/labels";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textbereich" },
  { value: "date", label: "Datum" },
  { value: "select", label: "Auswahl" },
];

const TemplateEditor = () => {
  const { templates, isLoading, seedDefaults, updateTemplate, deleteTemplate } = useTemplates();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localDraft, setLocalDraft] = useState<DbTemplate | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fields: true, approval: true, rules: false,
  });

  // Select first template when data arrives
  useEffect(() => {
    if (templates.length > 0 && !selectedId) {
      setSelectedId(templates[0].id);
    }
  }, [templates, selectedId]);

  // Sync local draft when selection changes
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
        { key: `field_${Date.now()}`, label: "Neues Feld", type: "text", placeholder: "" },
      ],
    });
  };

  const removeField = (idx: number) => {
    if (!localDraft) return;
    patchDraft({ required_fields: localDraft.required_fields.filter((_, i) => i !== idx) });
  };

  const updateStep = (stepIdx: number, patch: Partial<ApprovalStep>) => {
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
        { role: "reviewer", label: "Neuer Schritt", required: false },
      ],
    });
  };

  const removeStep = (idx: number) => {
    if (!localDraft) return;
    patchDraft({ approval_steps: localDraft.approval_steps.filter((_, i) => i !== idx) });
  };

  const handleSave = () => {
    if (!localDraft) return;
    const newVersion = localDraft.version + 1;
    updateTemplate.mutate({
      id: localDraft.id,
      patch: {
        name: localDraft.name,
        category: localDraft.category,
        priority: localDraft.priority,
        description: localDraft.description,
        default_duration_days: localDraft.default_duration_days,
        required_fields: localDraft.required_fields,
        approval_steps: localDraft.approval_steps,
        conditional_rules: localDraft.conditional_rules,
        governance_notes: localDraft.governance_notes,
        when_to_use: localDraft.when_to_use,
        version: newVersion,
      } as any,
    });
  };

  const SectionHeader = ({ label, sectionKey, count }: { label: string; sectionKey: string; count?: number }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className="flex items-center gap-2 w-full text-left py-2"
    >
      {expandedSections[sectionKey] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      <span className="text-sm font-semibold">{label}</span>
      {count !== undefined && <Badge variant="secondary" className="text-[10px]">{count}</Badge>}
    </button>
  );

  // Empty / seed state
  if (!isLoading && templates.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <FileText className="w-12 h-12 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Noch keine Templates in der Datenbank.</p>
          <Button onClick={() => seedDefaults.mutate()} disabled={seedDefaults.isPending} className="gap-2">
            {seedDefaults.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            System-Templates initialisieren
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold">Template Editor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <Card>
          <CardContent className="p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Templates ({isLoading ? "…" : templates.length})
            </p>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
            ) : (
              templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                    t.id === selectedId
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                    <span>{categoryLabels[t.category] || t.category}</span>
                    <span>·</span>
                    <span>v{t.version}</span>
                    {t.is_system && <Badge variant="outline" className="text-[8px] px-1 py-0">System</Badge>}
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Editor */}
        {localDraft ? (
          <motion.div key={localDraft.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Meta */}
            <Card>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Grunddaten
                  </h2>
                  <Button size="sm" onClick={handleSave} disabled={updateTemplate.isPending} className="gap-1.5 text-xs">
                    {updateTemplate.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Speichern
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Name</label>
                    <Input value={localDraft.name} onChange={e => patchDraft({ name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Kategorie</label>
                    <Select value={localDraft.category} onValueChange={v => patchDraft({ category: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Standard-Priorität</label>
                    <Select value={localDraft.priority} onValueChange={v => patchDraft({ priority: v })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Standard-Laufzeit (Tage)</label>
                    <Input
                      type="number"
                      value={localDraft.default_duration_days}
                      onChange={e => patchDraft({ default_duration_days: parseInt(e.target.value) || 7 })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Beschreibung</label>
                  <Textarea value={localDraft.description} onChange={e => patchDraft({ description: e.target.value })} className="mt-1" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Governance-Hinweise</label>
                  <Textarea
                    value={localDraft.governance_notes || ""}
                    onChange={e => patchDraft({ governance_notes: e.target.value })}
                    className="mt-1"
                    rows={2}
                    placeholder="Regeln und Hinweise für dieses Template..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Required Fields */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader label="Pflichtfelder" sectionKey="fields" count={localDraft.required_fields.length} />
                {expandedSections.fields && (
                  <div className="space-y-3 mt-2">
                    {localDraft.required_fields.map((field: any, idx: number) => (
                      <div key={field.key} className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border">
                        <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-2 shrink-0 cursor-grab" />
                        <div className="flex-1 grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Label</label>
                            <Input value={field.label} onChange={e => updateField(idx, { label: e.target.value })} className="mt-0.5 h-8 text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Typ</label>
                            <Select value={field.type} onValueChange={v => updateField(idx, { type: v as any })}>
                              <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {fieldTypes.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Placeholder</label>
                            <Input value={field.placeholder || ""} onChange={e => updateField(idx, { placeholder: e.target.value })} className="mt-0.5 h-8 text-xs" />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeField(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addField}>
                      <Plus className="w-3.5 h-3.5" /> Feld hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approval Steps */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader label="Freigabe-Schritte" sectionKey="approval" count={localDraft.approval_steps.length} />
                {expandedSections.approval && (
                  <div className="space-y-3 mt-2">
                    {localDraft.approval_steps.map((step: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                        <span className="text-xs font-mono text-muted-foreground w-6 text-center">{idx + 1}</span>
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-muted-foreground">Label</label>
                            <Input value={step.label} onChange={e => updateStep(idx, { label: e.target.value })} className="mt-0.5 h-8 text-xs" />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground">Rolle</label>
                            <Select value={step.role} onValueChange={v => updateStep(idx, { role: v })}>
                              <SelectTrigger className="mt-0.5 h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="decision_maker">Entscheider</SelectItem>
                                <SelectItem value="reviewer">Reviewer</SelectItem>
                                <SelectItem value="admin">Admin/GF</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="text-[10px] text-muted-foreground">Pflicht</label>
                          <Switch checked={step.required} onCheckedChange={v => updateStep(idx, { required: v })} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive/60 hover:text-destructive" onClick={() => removeStep(idx)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={addStep}>
                      <Plus className="w-3.5 h-3.5" /> Schritt hinzufügen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditional Rules (read-only) */}
            <Card>
              <CardContent className="p-5">
                <SectionHeader label="Bedingte Regeln" sectionKey="rules" count={localDraft.conditional_rules?.length || 0} />
                {expandedSections.rules && (
                  <div className="space-y-2 mt-2">
                    {(!localDraft.conditional_rules || localDraft.conditional_rules.length === 0) ? (
                      <p className="text-xs text-muted-foreground">Keine bedingten Regeln konfiguriert.</p>
                    ) : (
                      localDraft.conditional_rules.map((rule: any, idx: number) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                            <span className="font-medium">
                              Wenn <code className="bg-muted px-1 rounded">{rule.when}</code>{" "}
                              <code className="bg-muted px-1 rounded">{rule.operator}</code>{" "}
                              <code className="bg-muted px-1 rounded">{Array.isArray(rule.value) ? rule.value.join(", ") : rule.value}</code>
                            </span>
                          </div>
                          {rule.governanceHint && (
                            <p className="text-muted-foreground pl-5">{rule.governanceHint}</p>
                          )}
                          {rule.addFields && rule.addFields.length > 0 && (
                            <p className="text-muted-foreground pl-5">
                              → Zusätzliche Felder: {rule.addFields.map((f: any) => f.label).join(", ")}
                            </p>
                          )}
                          {rule.addApprovalSteps && rule.addApprovalSteps.length > 0 && (
                            <p className="text-muted-foreground pl-5">
                              → Zusätzliche Freigabe: {rule.addApprovalSteps.map((s: any) => s.label).join(", ")}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
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

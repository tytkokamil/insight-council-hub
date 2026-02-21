import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Plus, Trash2, GripVertical, Save, AlertTriangle, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  decisionTemplates,
  type DecisionTemplate,
  type RequiredField,
  type ApprovalStep,
  type ConditionalRule,
} from "@/lib/decisionTemplates";
import { categoryLabels, priorityLabels } from "@/lib/labels";

const fieldTypes = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textbereich" },
  { value: "date", label: "Datum" },
  { value: "select", label: "Auswahl" },
];

const TemplateEditor = () => {
  const [templates, setTemplates] = useState<DecisionTemplate[]>(() =>
    JSON.parse(JSON.stringify(decisionTemplates))
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    fields: true, approval: true, rules: false,
  });

  const template = templates[selectedIdx];

  const toggleSection = (key: string) =>
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const updateTemplate = (patch: Partial<DecisionTemplate>) => {
    setTemplates(prev => prev.map((t, i) => i === selectedIdx ? { ...t, ...patch } : t));
  };

  const updateField = (fieldIdx: number, patch: Partial<RequiredField>) => {
    const newFields = [...template.requiredFields];
    newFields[fieldIdx] = { ...newFields[fieldIdx], ...patch };
    updateTemplate({ requiredFields: newFields });
  };

  const addField = () => {
    updateTemplate({
      requiredFields: [
        ...template.requiredFields,
        { key: `field_${Date.now()}`, label: "Neues Feld", type: "text", placeholder: "" },
      ],
    });
  };

  const removeField = (idx: number) => {
    updateTemplate({ requiredFields: template.requiredFields.filter((_, i) => i !== idx) });
  };

  const updateStep = (stepIdx: number, patch: Partial<ApprovalStep>) => {
    const newSteps = [...template.approvalSteps];
    newSteps[stepIdx] = { ...newSteps[stepIdx], ...patch };
    updateTemplate({ approvalSteps: newSteps });
  };

  const addStep = () => {
    updateTemplate({
      approvalSteps: [
        ...template.approvalSteps,
        { role: "reviewer", label: "Neuer Schritt", required: false },
      ],
    });
  };

  const removeStep = (idx: number) => {
    updateTemplate({ approvalSteps: template.approvalSteps.filter((_, i) => i !== idx) });
  };

  const handleSave = () => {
    // In production this would persist to DB; for now just bump version
    updateTemplate({ version: template.version + 1 });
    toast.success(`Template "${template.name}" gespeichert (v${template.version + 1})`);
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

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Settings2 className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold">Template Editor</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: Template list */}
        <Card>
          <CardContent className="p-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Templates ({templates.length})
            </p>
            {templates.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setSelectedIdx(i)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${
                  i === selectedIdx
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                }`}
              >
                <div className="font-medium truncate">{t.name}</div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>{categoryLabels[t.category]}</span>
                  <span>·</span>
                  <span>v{t.version}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main: Template editor */}
        <motion.div key={selectedIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Meta */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Grunddaten
                </h2>
                <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs">
                  <Save className="w-3.5 h-3.5" /> Speichern
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={template.name} onChange={e => updateTemplate({ name: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Kategorie</label>
                  <Select value={template.category} onValueChange={v => updateTemplate({ category: v })}>
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
                  <Select value={template.priority} onValueChange={v => updateTemplate({ priority: v })}>
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
                    value={template.defaultDurationDays}
                    onChange={e => updateTemplate({ defaultDurationDays: parseInt(e.target.value) || 7 })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Beschreibung</label>
                <Textarea value={template.description} onChange={e => updateTemplate({ description: e.target.value })} className="mt-1" rows={2} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Governance-Hinweise</label>
                <Textarea
                  value={template.governanceNotes || ""}
                  onChange={e => updateTemplate({ governanceNotes: e.target.value })}
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
              <SectionHeader label="Pflichtfelder" sectionKey="fields" count={template.requiredFields.length} />
              {expandedSections.fields && (
                <div className="space-y-3 mt-2">
                  {template.requiredFields.map((field, idx) => (
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
              <SectionHeader label="Freigabe-Schritte" sectionKey="approval" count={template.approvalSteps.length} />
              {expandedSections.approval && (
                <div className="space-y-3 mt-2">
                  {template.approvalSteps.map((step, idx) => (
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

          {/* Conditional Rules (read-only display) */}
          <Card>
            <CardContent className="p-5">
              <SectionHeader label="Bedingte Regeln" sectionKey="rules" count={template.conditionalRules?.length || 0} />
              {expandedSections.rules && (
                <div className="space-y-2 mt-2">
                  {(!template.conditionalRules || template.conditionalRules.length === 0) ? (
                    <p className="text-xs text-muted-foreground">Keine bedingten Regeln konfiguriert.</p>
                  ) : (
                    template.conditionalRules.map((rule, idx) => (
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
                            → Zusätzliche Felder: {rule.addFields.map(f => f.label).join(", ")}
                          </p>
                        )}
                        {rule.addApprovalSteps && rule.addApprovalSteps.length > 0 && (
                          <p className="text-muted-foreground pl-5">
                            → Zusätzliche Freigabe: {rule.addApprovalSteps.map(s => s.label).join(", ")}
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
      </div>
    </AppLayout>
  );
};

export default TemplateEditor;

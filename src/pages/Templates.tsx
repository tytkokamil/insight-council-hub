import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { decisionTemplates, DecisionTemplate } from "@/lib/decisionTemplates";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Clock, Shield, ChevronRight, Users, ArrowRight,
  Target, DollarSign, UserCog, Cpu, Settings2, Megaphone,
  CheckCircle2, Circle, AlertTriangle, Info, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const categoryIcons: Record<string, React.ElementType> = {
  strategic: Target,
  budget: DollarSign,
  hr: UserCog,
  technical: Cpu,
  operational: Settings2,
  marketing: Megaphone,
};

const categoryColors: Record<string, string> = {
  strategic: "text-blue-400 bg-blue-400/10",
  budget: "text-emerald-400 bg-emerald-400/10",
  hr: "text-amber-400 bg-amber-400/10",
  technical: "text-violet-400 bg-violet-400/10",
  operational: "text-cyan-400 bg-cyan-400/10",
  marketing: "text-rose-400 bg-rose-400/10",
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Kritisch", className: "bg-destructive/10 text-destructive border-destructive/20" },
  high: { label: "Hoch", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  medium: { label: "Mittel", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  low: { label: "Niedrig", className: "bg-muted text-muted-foreground border-border" },
};

const roleLabels: Record<string, string> = {
  decision_maker: "Entscheider",
  reviewer: "Reviewer",
  admin: "Administrator",
};

function TemplateCard({ template, onSelect, isSelected }: {
  template: DecisionTemplate;
  onSelect: (t: DecisionTemplate) => void;
  isSelected: boolean;
}) {
  const Icon = categoryIcons[template.category] || FileText;
  const colorClass = categoryColors[template.category] || "text-muted-foreground bg-muted";
  const priority = priorityConfig[template.priority] || priorityConfig.medium;

  return (
    <motion.button
      onClick={() => onSelect(template)}
      className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
      }`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-lg ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground">{template.name}</h3>
            <Badge variant="outline" className={`text-[10px] ${priority.className}`}>
              {priority.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {template.description}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {template.defaultDurationDays} Tage
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              {template.approvalSteps.length} Stufen
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {template.requiredFields.length} Felder
            </span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 mt-1 transition-colors ${isSelected ? "text-primary" : "text-muted-foreground/30"}`} />
      </div>
    </motion.button>
  );
}

function ApprovalFlowVisual({ steps }: { steps: DecisionTemplate["approvalSteps"] }) {
  return (
    <div className="flex items-center gap-0 flex-wrap">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${
              step.required
                ? "bg-primary/15 text-primary border-2 border-primary/30"
                : "bg-muted text-muted-foreground border-2 border-border"
            }`}>
              {i + 1}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1.5 text-center max-w-[80px]">
              {step.label}
            </span>
            <span className="text-[9px] text-muted-foreground/50 mt-0.5">
              {roleLabels[step.role] || step.role}
            </span>
            {step.required && (
              <span className="text-[9px] text-primary mt-0.5 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Pflicht
              </span>
            )}
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-4 h-4 text-muted-foreground/30 mx-3 mb-6" />
          )}
        </div>
      ))}
    </div>
  );
}

function TemplateDetail({ template, onClose }: { template: DecisionTemplate; onClose: () => void }) {
  const Icon = categoryIcons[template.category] || FileText;
  const colorClass = categoryColors[template.category] || "text-muted-foreground bg-muted";
  const priority = priorityConfig[template.priority] || priorityConfig.medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="border border-border rounded-xl bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${colorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{template.name}</h2>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs ${priority.className}`}>
            {priority.label}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Standard: {template.defaultDurationDays} Tage
          </span>
        </div>
      </div>

      <Tabs defaultValue="flow" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent px-6 h-11">
          <TabsTrigger value="flow" className="text-xs">Approval Flow</TabsTrigger>
          <TabsTrigger value="fields" className="text-xs">Pflichtfelder</TabsTrigger>
          <TabsTrigger value="governance" className="text-xs">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="flow" className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Freigabe-Kette</h3>
          <p className="text-xs text-muted-foreground mb-6">
            Jede Entscheidung dieses Typs durchläuft die folgenden Freigabe-Stufen.
          </p>
          <ApprovalFlowVisual steps={template.approvalSteps} />

          <Separator className="my-6" />

          <h4 className="text-xs font-semibold text-foreground mb-3">Review-Workflow</h4>
          <div className="space-y-2">
            {template.approvalSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step.required ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">({roleLabels[step.role] || step.role})</span>
                </div>
                {step.required ? (
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Pflicht</Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Optional</Badge>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fields" className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Erforderliche Felder</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Diese Felder müssen beim Erstellen einer Entscheidung ausgefüllt werden.
          </p>
          <div className="space-y-2">
            {template.requiredFields.map((field, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Circle className="w-3.5 h-3.5 text-primary shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{field.label}</span>
                  <span className="text-xs text-muted-foreground/60 ml-2 capitalize">({field.type})</span>
                </div>
                {field.placeholder && (
                  <span className="text-[11px] text-muted-foreground/50 max-w-[200px] truncate hidden lg:block">
                    {field.placeholder}
                  </span>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="governance" className="p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Governance-Regeln</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Compliance- und Governance-Hinweise für diesen Entscheidungstyp.
          </p>
          {template.governanceNotes ? (
            <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80">{template.governanceNotes}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">Keine speziellen Governance-Regeln definiert.</p>
              </div>
            </div>
          )}

          <Separator className="my-6" />

          <h4 className="text-xs font-semibold text-foreground mb-3">Zusammenfassung</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Pflicht-Approvals</span>
              <p className="text-lg font-bold text-foreground">
                {template.approvalSteps.filter(s => s.required).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Optionale Approvals</span>
              <p className="text-lg font-bold text-foreground">
                {template.approvalSteps.filter(s => !s.required).length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Pflichtfelder</span>
              <p className="text-lg font-bold text-foreground">{template.requiredFields.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Standard-Dauer</span>
              <p className="text-lg font-bold text-foreground">{template.defaultDurationDays}d</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

export default function Templates() {
  const [selected, setSelected] = useState<DecisionTemplate | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates & Playbooks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vordefinierte Entscheidungs-Vorlagen mit Review-Flows und Approval-Chains
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Template List */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {decisionTemplates.length} Templates
              </h2>
            </div>
            {decisionTemplates.map((t) => (
              <TemplateCard
                key={t.category}
                template={t}
                onSelect={setSelected}
                isSelected={selected?.category === t.category}
              />
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <TemplateDetail
                  key={selected.category}
                  template={selected}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 p-8"
                >
                  <FileText className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground/50">
                    Template auswählen
                  </p>
                  <p className="text-xs text-muted-foreground/30 mt-1">
                    Klicke auf ein Template, um Details, Approval-Flows und Governance-Regeln zu sehen.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

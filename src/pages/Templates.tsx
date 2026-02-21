import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { decisionTemplates, DecisionTemplate } from "@/lib/decisionTemplates";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Clock, Shield, ChevronRight, ArrowRight,
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

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: "Kritisch", className: "text-destructive border-destructive/20" },
  high: { label: "Hoch", className: "text-warning border-warning/20" },
  medium: { label: "Mittel", className: "text-muted-foreground border-border" },
  low: { label: "Niedrig", className: "text-muted-foreground border-border" },
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
  const priority = priorityConfig[template.priority] || priorityConfig.medium;

  return (
    <motion.button
      onClick={() => onSelect(template)}
      className={`w-full text-left p-5 rounded-lg border transition-all duration-200 ${
        isSelected
          ? "border-foreground/20 bg-muted/50"
          : "border-border bg-card hover:border-foreground/10"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-muted">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{template.name}</h3>
            <Badge variant="outline" className={`text-[10px] ${priority.className}`}>
              {priority.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {template.description}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{template.defaultDurationDays} Tage</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{template.approvalSteps.length} Stufen</span>
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{template.requiredFields.length} Felder</span>
          </div>
        </div>
        <ChevronRight className={`w-4 h-4 mt-1 transition-colors ${isSelected ? "text-foreground" : "text-muted-foreground/30"}`} />
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
                ? "bg-foreground/10 text-foreground border-2 border-foreground/20"
                : "bg-muted text-muted-foreground border-2 border-border"
            }`}>
              {i + 1}
            </div>
            <span className="text-[10px] text-muted-foreground mt-1.5 text-center max-w-[80px]">{step.label}</span>
            <span className="text-[9px] text-muted-foreground mt-0.5">{roleLabels[step.role] || step.role}</span>
            {step.required && (
              <span className="text-[9px] text-foreground mt-0.5 flex items-center gap-0.5">
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
  const priority = priorityConfig[template.priority] || priorityConfig.medium;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="border border-border rounded-lg bg-card overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-muted">
              <Icon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{template.name}</h2>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-xs ${priority.className}`}>{priority.label}</Badge>
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
          <h3 className="text-sm font-semibold mb-1">Freigabe-Kette</h3>
          <p className="text-xs text-muted-foreground mb-6">Jede Entscheidung dieses Typs durchläuft die folgenden Freigabe-Stufen.</p>
          <ApprovalFlowVisual steps={template.approvalSteps} />
          <Separator className="my-6" />
          <h4 className="text-xs font-semibold mb-3">Review-Workflow</h4>
          <div className="space-y-2">
            {template.approvalSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step.required ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                }`}>{i + 1}</div>
                <div className="flex-1">
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">({roleLabels[step.role] || step.role})</span>
                </div>
                <Badge variant="outline" className="text-[10px]">{step.required ? "Pflicht" : "Optional"}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fields" className="p-6">
          <h3 className="text-sm font-semibold mb-1">Erforderliche Felder</h3>
          <p className="text-xs text-muted-foreground mb-4">Diese Felder müssen beim Erstellen einer Entscheidung ausgefüllt werden.</p>
          <div className="space-y-2">
            {template.requiredFields.map((field, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium">{field.label}</span>
                  <span className="text-xs text-muted-foreground ml-2 capitalize">({field.type})</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="governance" className="p-6">
          <h3 className="text-sm font-semibold mb-1">Governance-Regeln</h3>
          <p className="text-xs text-muted-foreground mb-4">Compliance- und Governance-Hinweise für diesen Entscheidungstyp.</p>
          {template.governanceNotes ? (
            <div className="p-4 rounded-lg bg-warning/5 border border-warning/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm">{template.governanceNotes}</p>
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
          <h4 className="text-xs font-semibold mb-3">Zusammenfassung</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Pflicht-Approvals", value: template.approvalSteps.filter(s => s.required).length },
              { label: "Optionale Approvals", value: template.approvalSteps.filter(s => !s.required).length },
              { label: "Pflichtfelder", value: template.requiredFields.length },
              { label: "Standard-Dauer", value: `${template.defaultDurationDays}d` },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[11px] text-muted-foreground">{s.label}</span>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            ))}
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Vorlagen</p>
            <h1 className="text-xl font-bold">Templates & Playbooks</h1>
          </div>
          <PageHelpButton title="Templates & Playbooks" description="Vordefinierte Entscheidungs-Vorlagen mit Review-Flows und Approval-Chains" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {decisionTemplates.length} Templates
            </h2>
            {decisionTemplates.map((t) => (
              <TemplateCard key={t.category} template={t} onSelect={setSelected} isSelected={selected?.category === t.category} />
            ))}
          </div>

          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {selected ? (
                <TemplateDetail key={selected.category} template={selected} onClose={() => setSelected(null)} />
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8">
                  <FileText className="w-12 h-12 text-muted-foreground/20 mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">Template auswählen</p>
                  <p className="text-xs text-muted-foreground mt-1">Klicke auf ein Template, um Details zu sehen.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import {
  decisionTemplates, getTemplateByCategory, evaluateConditionalRules,
  type DecisionTemplate, type RequiredField,
} from "@/lib/decisionTemplates";
import { suggestReviewFlow, type ReviewFlowTemplate } from "@/lib/reviewFlowTemplates";
import ReviewFlowSelector from "./ReviewFlowSelector";
import {
  FileText, Users, Shield, AlertCircle, Lightbulb, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Clock, CheckSquare, Zap, ArrowLeft, Sparkles, TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch", budget: "Budget", hr: "Personal",
  technical: "Technisch", operational: "Operativ", marketing: "Marketing",
};

const priorityLabels: Record<string, string> = {
  low: "Niedrig", medium: "Mittel", high: "Hoch", critical: "Kritisch",
};

const categoryIcons: Record<string, string> = {
  strategic: "🎯", budget: "💰", hr: "👥",
  technical: "⚙️", operational: "📋", marketing: "📣",
};

const NewDecisionDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("operational");
  const [priority, setPriority] = useState<string>("medium");
  const [dueDate, setDueDate] = useState("");
  const [teamId, setTeamId] = useState<string>(selectedTeamId || "");
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"template" | "form">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<DecisionTemplate | null>(null);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [reviewFlowId, setReviewFlowId] = useState<string>(() => suggestReviewFlow("operational", "medium"));
  const [selectedReviewFlow, setSelectedReviewFlow] = useState<ReviewFlowTemplate | null>(null);

  // Evaluate conditional rules based on current form state
  const conditionalResult = useMemo(() => {
    return evaluateConditionalRules(selectedTemplate?.conditionalRules, {
      priority,
      category,
      extraFields,
    });
  }, [selectedTemplate, priority, category, extraFields]);

  // Merge base + conditional fields
  const allRequiredFields = useMemo(() => {
    if (!selectedTemplate) return [];
    const base = selectedTemplate.requiredFields;
    const extra = conditionalResult.extraFields;
    // Avoid duplicates
    const keys = new Set(base.map(f => f.key));
    return [...base, ...extra.filter(f => !keys.has(f.key))];
  }, [selectedTemplate, conditionalResult.extraFields]);

  // Merge base + conditional approval steps
  const allApprovalSteps = useMemo(() => {
    if (!selectedTemplate) return [];
    const base = selectedTemplate.approvalSteps;
    const extra = conditionalResult.extraApprovalSteps;
    const labels = new Set(base.map(s => s.label));
    return [...base, ...extra.filter(s => !labels.has(s.label))];
  }, [selectedTemplate, conditionalResult.extraApprovalSteps]);

  // Fetch lessons learned for recommendations
  const { data: lessonsWithDecisions = [] } = useQuery({
    queryKey: ["lessons-recommendations"],
    queryFn: async () => {
      const { data: lessons } = await supabase
        .from("lessons_learned")
        .select("id, decision_id, key_takeaway, what_went_well, what_went_wrong, recommendations")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!lessons?.length) return [];
      const decisionIds = [...new Set(lessons.map(l => l.decision_id))];
      const { data: decisions } = await supabase
        .from("decisions")
        .select("id, title, category, priority")
        .in("id", decisionIds);
      const decMap = new Map((decisions ?? []).map(d => [d.id, d]));
      return lessons.map(l => ({ ...l, decision: decMap.get(l.decision_id) })).filter(l => l.decision);
    },
    enabled: open,
    staleTime: 60_000,
  });

  // Fetch historical decision data for AI template recommendation
  const { data: historicalDecisions = [] } = useQuery({
    queryKey: ["template-recommendation-data", teamId],
    queryFn: async () => {
      const { data } = await supabase
        .from("decisions")
        .select("category, priority, template_used, status, created_at, implemented_at, team_id")
        .not("template_used", "is", null)
        .order("created_at", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: open,
    staleTime: 120_000,
  });

  // AI Template Recommendation Engine
  const templateRecommendation = useMemo(() => {
    if (historicalDecisions.length < 3) return null;

    type TemplateStats = {
      name: string;
      total: number;
      implemented: number;
      rejected: number;
      avgDays: number;
      teamMatch: number;
    };

    const statsMap = new Map<string, TemplateStats>();

    for (const d of historicalDecisions) {
      const tpl = d.template_used as string;
      if (!statsMap.has(tpl)) {
        statsMap.set(tpl, { name: tpl, total: 0, implemented: 0, rejected: 0, avgDays: 0, teamMatch: 0 });
      }
      const s = statsMap.get(tpl)!;
      s.total++;
      if (d.status === "implemented") {
        s.implemented++;
        if (d.implemented_at && d.created_at) {
          const days = (new Date(d.implemented_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
          s.avgDays = (s.avgDays * (s.implemented - 1) + days) / s.implemented;
        }
      }
      if (d.status === "rejected") s.rejected++;
      if (teamId && d.team_id === teamId) s.teamMatch++;
    }

    // Score each template
    let bestScore = -1;
    let bestTemplate: (TemplateStats & { score: number; reasons: string[] }) | null = null;

    for (const [, stats] of statsMap) {
      if (stats.total < 2) continue;
      const successRate = stats.implemented / stats.total;
      const rejectionPenalty = stats.rejected / stats.total;
      const teamBonus = teamId ? (stats.teamMatch / stats.total) * 0.2 : 0;
      const speedBonus = stats.avgDays > 0 ? Math.max(0, 1 - stats.avgDays / 60) * 0.15 : 0;

      const score = successRate * 0.5 - rejectionPenalty * 0.3 + teamBonus + speedBonus;

      if (score > bestScore) {
        bestScore = score;
        const reasons: string[] = [];
        if (successRate > 0.6) reasons.push(`${Math.round(successRate * 100)}% Erfolgsrate`);
        if (stats.avgDays > 0) reasons.push(`Ø ${Math.round(stats.avgDays)} Tage bis Umsetzung`);
        if (teamId && stats.teamMatch > 0) reasons.push(`${stats.teamMatch}× in diesem Team genutzt`);
        if (rejectionPenalty < 0.1) reasons.push("Niedrige Ablehnungsrate");
        bestTemplate = { ...stats, score, reasons };
      }
    }

    // Match to actual template object
    if (bestTemplate) {
      const match = decisionTemplates.find(t => t.name === bestTemplate!.name);
      if (match) return { template: match, stats: bestTemplate };
    }
    return null;
  }, [historicalDecisions, teamId]);

  const relevantLessons = useMemo(() => {
    if (!category) return [];
    return lessonsWithDecisions
      .filter(l => l.decision?.category === category)
      .slice(0, 5);
  }, [lessonsWithDecisions, category]);

  useEffect(() => {
    if (open && user) {
      setTeamId(selectedTeamId || "");
      const fetchTeams = async () => {
        const { data: roleData } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", user.id).single();
        const isAdmin = roleData?.role === "org_owner" || roleData?.role === "org_admin";
        if (isAdmin) {
          const { data } = await supabase.from("teams").select("id, name").order("name");
          if (data) setTeams(data);
        } else {
          const { data: memberTeams } = await supabase
            .from("team_members").select("team_id").eq("user_id", user.id);
          const ids = memberTeams?.map((t) => t.team_id) || [];
          if (ids.length > 0) {
            const { data } = await supabase.from("teams").select("id, name").in("id", ids).order("name");
            if (data) setTeams(data);
          } else {
            setTeams([]);
          }
        }
      };
      fetchTeams();
      if (selectedTeamId) {
        handleTeamChange(selectedTeamId);
      }
    }
  }, [open, selectedTeamId]);

  const applyTemplate = (t: DecisionTemplate) => {
    setTitle(t.name);
    setDescription(t.description);
    setCategory(t.category);
    setPriority(t.priority);
    const due = new Date();
    due.setDate(due.getDate() + t.defaultDurationDays);
    setDueDate(due.toISOString().split("T")[0]);
    setSelectedTemplate(t);
    setExtraFields({});
    setValidationErrors([]);
    setStep("form");
    const suggested = suggestReviewFlow(t.category, t.priority);
    setReviewFlowId(suggested);
  };

  const startWithoutTemplate = () => {
    setSelectedTemplate(null);
    setStep("form");
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    const tpl = getTemplateByCategory(newCat);
    if (tpl && selectedTemplate?.category !== newCat) {
      setSelectedTemplate(tpl);
      setExtraFields({});
      setValidationErrors([]);
    }
    setReviewFlowId(suggestReviewFlow(newCat, priority));
  };

  const handlePriorityChange = (newPri: string) => {
    setPriority(newPri);
    setReviewFlowId(suggestReviewFlow(category, newPri));
  };

  const handleTeamChange = async (newTeamId: string) => {
    setTeamId(newTeamId);
    if (!newTeamId) return;
    const { data } = await supabase
      .from("team_defaults")
      .select("*")
      .eq("team_id", newTeamId)
      .single();
    if (data) {
      setCategory(data.default_category);
      setPriority(data.default_priority);
      setReviewFlowId(data.default_review_flow);
      if (data.default_sla_days && !dueDate) {
        const due = new Date();
        due.setDate(due.getDate() + data.default_sla_days);
        setDueDate(due.toISOString().split("T")[0]);
      }
      const tpl = getTemplateByCategory(data.default_category);
      if (tpl) {
        setSelectedTemplate(tpl);
        setExtraFields({});
      }
    }
  };

  const handleReviewFlowSelect = (flow: ReviewFlowTemplate) => {
    setReviewFlowId(flow.id);
    setSelectedReviewFlow(flow);
  };

  const validateRequiredFields = (): boolean => {
    const missing: string[] = [];
    allRequiredFields.forEach(f => {
      if (!extraFields[f.key]?.trim()) missing.push(f.label);
    });
    setValidationErrors(missing);
    return missing.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    if (!validateRequiredFields()) return;

    setLoading(true);
    setError("");

    // Build context from extra fields
    const contextParts: string[] = [];
    if (description.trim()) contextParts.push(description.trim());
    if (selectedTemplate) {
      allRequiredFields.forEach(f => {
        const val = extraFields[f.key]?.trim();
        if (val) contextParts.push(`**${f.label}:** ${val}`);
      });
      if (selectedTemplate.governanceNotes) {
        contextParts.push(`\n---\n_Governance: ${selectedTemplate.governanceNotes}_`);
      }
      // Add triggered governance hints
      conditionalResult.governanceHints.forEach(hint => {
        contextParts.push(`_⚠️ ${hint}_`);
      });
    }

    // Build template snapshot for versioning
    const templateSnapshot = selectedTemplate ? {
      name: selectedTemplate.name,
      version: selectedTemplate.version,
      category: selectedTemplate.category,
      priority: selectedTemplate.priority,
      requiredFields: selectedTemplate.requiredFields.map(f => ({ key: f.key, label: f.label, type: f.type })),
      approvalSteps: selectedTemplate.approvalSteps,
      governanceNotes: selectedTemplate.governanceNotes,
      defaultDurationDays: selectedTemplate.defaultDurationDays,
    } : null;

    const { data, error: err } = await supabase.from("decisions").insert([{
      title: title.trim(),
      description: description.trim() || null,
      context: contextParts.length > 1 ? contextParts.join("\n\n") : null,
      category: category as any,
      priority: priority as any,
      due_date: dueDate || null,
      team_id: teamId || null,
      created_by: user.id,
      template_used: selectedTemplate?.name || null,
      template_version: selectedTemplate?.version || null,
      template_snapshot: templateSnapshot,
    } as any]).select().single();

    if (err) {
      setError(err.message);
    } else {
      if (data) {
        const { EventTypes } = await import("@/lib/eventTaxonomy");
        await supabase.from("audit_logs").insert({
          decision_id: data.id,
          user_id: user.id,
          action: EventTypes.DECISION_CREATED,
          new_value: title.trim(),
        });

        // Auto-create review steps from selected Review-Flow + conditional approval steps
        const { reviewFlowTemplates } = await import("@/lib/reviewFlowTemplates");
        const flow = reviewFlowTemplates.find(f => f.id === reviewFlowId);
        if (flow && flow.steps.length > 0) {
          const flowSteps = flow.steps;
          if (teamId) {
            const { data: members } = await supabase
              .from("team_members")
              .select("user_id")
              .eq("team_id", teamId)
              .neq("user_id", user.id);

            const availableMembers = members?.map(m => m.user_id) || [];

            const reviewSteps = flowSteps.map((step, i) => ({
              decision_id: data.id,
              reviewer_id: availableMembers.length > 0
                ? availableMembers[i % availableMembers.length]
                : user.id,
              step_order: i + 1,
              status: "review" as const,
            }));

            // Add conditional approval steps
            const extraSteps = conditionalResult.extraApprovalSteps.map((s, i) => ({
              decision_id: data.id,
              reviewer_id: availableMembers.length > 0
                ? availableMembers[(flowSteps.length + i) % availableMembers.length]
                : user.id,
              step_order: flowSteps.length + i + 1,
              status: "review" as const,
            }));

            await supabase.from("decision_reviews").insert([...reviewSteps, ...extraSteps]);
          } else {
            const reviewSteps = flowSteps.map((step, i) => ({
              decision_id: data.id,
              reviewer_id: user.id,
              step_order: i + 1,
              status: "review" as const,
            }));
            await supabase.from("decision_reviews").insert(reviewSteps);
          }
        }
      }
      resetForm();
      onOpenChange(false);
      onCreated();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setCategory("operational"); setPriority("medium");
    setDueDate(""); setTeamId(""); setStep("template"); setSelectedTemplate(null);
    setExtraFields({}); setValidationErrors([]); setExpandedTemplate(null);
    setReviewFlowId(suggestReviewFlow("operational", "medium")); setSelectedReviewFlow(null);
  };

  const renderExtraField = (field: RequiredField, isConditional = false) => {
    const hasError = validationErrors.includes(field.label);
    const baseClass = `w-full px-3 rounded-lg bg-muted/50 border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm ${hasError ? "border-destructive" : "border-border"}`;

    return (
      <div key={field.key}>
        <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
          {field.label} <span className="text-destructive">*</span>
          {isConditional && (
            <Badge variant="outline" className="text-[9px] ml-1 px-1 py-0 border-warning/40 text-warning">
              <Zap className="w-2.5 h-2.5 mr-0.5" />bedingt
            </Badge>
          )}
        </label>
        {field.type === "textarea" ? (
          <textarea
            value={extraFields[field.key] || ""}
            onChange={(e) => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className={`${baseClass} h-20 resize-none py-2`}
          />
        ) : field.type === "select" && field.options ? (
          <select
            value={extraFields[field.key] || ""}
            onChange={(e) => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
            className={`${baseClass} h-10`}
          >
            <option value="" className="bg-card">Bitte wählen...</option>
            {field.options.map(o => (
              <option key={o.value} value={o.value} className="bg-card">{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={extraFields[field.key] || ""}
            onChange={(e) => setExtraFields(prev => ({ ...prev, [field.key]: e.target.value }))}
            placeholder={field.placeholder}
            className={`${baseClass} h-10`}
          />
        )}
      </div>
    );
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  // ─── Template Selection Step ───
  const renderTemplateStep = () => (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Wähle ein Template für strukturierte Governance oder starte frei.
      </p>

      {/* AI Template Recommendation */}
      {templateRecommendation && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">KI-Empfehlung</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              basierend auf {templateRecommendation.stats.total} Entscheidungen
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                {categoryIcons[templateRecommendation.template.category]} {templateRecommendation.template.name}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {templateRecommendation.stats.reasons.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] text-primary/80">
                    <TrendingUp className="w-2.5 h-2.5" />{r}
                  </span>
                ))}
              </div>
            </div>
            <Button size="sm" variant="default" className="shrink-0 gap-1.5" onClick={() => applyTemplate(templateRecommendation.template)}>
              <Sparkles className="w-3.5 h-3.5" /> Übernehmen
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {decisionTemplates.map((t) => {
          const isExpanded = expandedTemplate === t.category;
          const isRecommended = templateRecommendation?.template.category === t.category;
          return (
            <div
              key={t.category}
              className={`rounded-lg border bg-card overflow-hidden transition-all hover:border-primary/40 ${isRecommended ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
            >
              {/* Card header – always visible */}
              <button
                type="button"
                onClick={() => setExpandedTemplate(isExpanded ? null : t.category)}
                className="w-full text-left p-3 flex items-start gap-3"
              >
                <span className="text-xl mt-0.5">{categoryIcons[t.category] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold">{t.name}</span>
                    {isRecommended && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="text-[9px] gap-0.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            <Sparkles className="w-2.5 h-2.5" /> Empfohlen
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-48">
                          Basierend auf historischen Erfolgsraten und Team-Nutzung
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{priorityLabels[t.priority]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{t.requiredFields.length} Pflichtfelder</span>
                    <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{t.approvalSteps.length} Approval-Stufen</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.defaultDurationDays} Tage</span>
                    {t.conditionalRules && t.conditionalRules.length > 0 && (
                      <span className="flex items-center gap-1 text-warning"><Zap className="w-3 h-3" />{t.conditionalRules.length} Regeln</span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {/* Expanded preview */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                  {t.whenToUse && (
                    <p className="text-xs text-primary/80 italic">💡 {t.whenToUse}</p>
                  )}

                  {/* Required fields preview */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pflichtfelder</p>
                    <div className="flex flex-wrap gap-1">
                      {t.requiredFields.map(f => (
                        <span key={f.key} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Approval steps preview */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Freigabe-Stufen</p>
                    <div className="flex items-center gap-1.5">
                      {t.approvalSteps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${s.required ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
                            {s.label}
                          </span>
                          {i < t.approvalSteps.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Conditional rules preview */}
                  {t.conditionalRules && t.conditionalRules.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Bedingte Regeln</p>
                      <div className="space-y-1">
                        {t.conditionalRules.map((r, i) => (
                          <p key={i} className="text-[10px] text-warning/80 flex items-start gap-1">
                            <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                            {r.governanceHint || `Wenn ${r.when} ${r.operator} ${Array.isArray(r.value) ? r.value.join("/") : r.value}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Governance note */}
                  {t.governanceNotes && (
                    <p className="text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                      {t.governanceNotes}
                    </p>
                  )}

                  <Button size="sm" className="w-full gap-2" onClick={() => applyTemplate(t)}>
                    <FileText className="w-3.5 h-3.5" /> Template verwenden
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={startWithoutTemplate} className="text-xs text-primary hover:underline w-full text-center py-1">
        Ohne Vorlage fortfahren →
      </button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="glass-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            {step === "form" && selectedTemplate && (
              <button type="button" onClick={() => setStep("template")} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {step === "template" ? "Entscheidungs-Template wählen" : "Neue Entscheidung"}
            {selectedTemplate && step === "form" && (
              <Badge variant="outline" className="text-[10px]">{categoryIcons[selectedTemplate.category]} {selectedTemplate.name}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? renderTemplateStep() : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Titel *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Entscheidungstitel..." className={inputClass} required />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Beschreibung</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details zur Entscheidung..." className={`${inputClass} h-24 resize-none py-2`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Kategorie</label>
                <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
                  {categories.map((c) => (<option key={c} value={c} className="bg-card">{categoryLabels[c]}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Priorität</label>
                <select value={priority} onChange={(e) => handlePriorityChange(e.target.value)} className={inputClass}>
                  {priorities.map((p) => (<option key={p} value={p} className="bg-card">{priorityLabels[p]}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Fälligkeitsdatum</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Team</span>
                </label>
                <select value={teamId} onChange={(e) => handleTeamChange(e.target.value)} className={inputClass}>
                  <option value="" className="bg-card">Kein Team (öffentlich)</option>
                  {teams.map((t) => (<option key={t.id} value={t.id} className="bg-card">{t.name}</option>))}
                </select>
              </div>
            </div>

            {/* Review-Flow Selector */}
            <ReviewFlowSelector
              selectedFlowId={reviewFlowId}
              onSelect={handleReviewFlowSelect}
              category={category}
              priority={priority}
            />

            {/* Base required fields from template */}
            {selectedTemplate && selectedTemplate.requiredFields.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Pflichtfelder – {categoryLabels[selectedTemplate.category]}</span>
                  <Badge variant="outline" className="text-[10px]">{allRequiredFields.length} Felder</Badge>
                </div>
                {selectedTemplate.requiredFields.map(field => renderExtraField(field, false))}
              </div>
            )}

            {/* Conditional fields (dynamically added) */}
            {conditionalResult.extraFields.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-warning/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">Bedingte Pflichtfelder</span>
                  <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">{conditionalResult.extraFields.length} aktiviert</Badge>
                </div>
                {conditionalResult.extraFields.map(field => renderExtraField(field, true))}
              </div>
            )}

            {/* Conditional approval steps info */}
            {conditionalResult.extraApprovalSteps.length > 0 && (
              <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/20 text-xs space-y-1">
                <p className="font-medium text-warning flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Zusätzliche Freigabe-Stufen aktiviert
                </p>
                {conditionalResult.extraApprovalSteps.map((s, i) => (
                  <p key={i} className="text-muted-foreground pl-5">+ {s.label} {s.required ? "(Pflicht)" : "(Optional)"}</p>
                ))}
              </div>
            )}

            {/* Governance hints from conditional rules */}
            {conditionalResult.governanceHints.length > 0 && (
              <div className="space-y-1">
                {conditionalResult.governanceHints.map((hint, i) => (
                  <p key={i} className="text-[11px] text-warning italic p-2 rounded-lg bg-warning/5 border border-warning/20 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {hint}
                  </p>
                ))}
              </div>
            )}

            {/* Static governance notes from template */}
            {selectedTemplate?.governanceNotes && conditionalResult.governanceHints.length === 0 && (
              <p className="text-[11px] text-muted-foreground italic p-2 rounded-lg bg-warning/5 border border-warning/20">
                {selectedTemplate.governanceNotes}
              </p>
            )}

            {/* Lessons Learned Recommendations */}
            {relevantLessons.length > 0 && (
              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowRecommendations(v => !v)}
                  className="flex items-center gap-2 w-full text-left group"
                >
                  <Lightbulb className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium flex-1">
                    Lessons Learned ({relevantLessons.length})
                  </span>
                  <Badge variant="outline" className="text-[10px]">{categoryLabels[category]}</Badge>
                  {showRecommendations ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {showRecommendations && (
                  <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                    {relevantLessons.map(l => (
                      <div key={l.id} className="p-2.5 rounded-lg bg-warning/5 border border-warning/20 text-xs space-y-1">
                        <p className="font-medium text-foreground flex items-start gap-1.5">
                          <Lightbulb className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                          {l.key_takeaway}
                        </p>
                        {l.what_went_well && (
                          <p className="text-muted-foreground flex items-start gap-1.5 pl-4">
                            <ThumbsUp className="w-3 h-3 text-success mt-0.5 shrink-0" />
                            {l.what_went_well}
                          </p>
                        )}
                        {l.what_went_wrong && (
                          <p className="text-muted-foreground flex items-start gap-1.5 pl-4">
                            <ThumbsDown className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                            {l.what_went_wrong}
                          </p>
                        )}
                        {l.recommendations && (
                          <p className="text-primary/80 flex items-start gap-1.5 pl-4 italic">
                            → {l.recommendations}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/60 pl-4">
                          Aus: {l.decision?.title}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Pflichtfelder nicht ausgefüllt:</p>
                  <ul className="mt-1 space-y-0.5">
                    {validationErrors.map(e => <li key={e}>• {e}</li>)}
                  </ul>
                </div>
              </div>
            )}

            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>Abbrechen</Button>
              <Button type="submit" disabled={loading || !title.trim()}>{loading ? "Erstellen..." : "Erstellen"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewDecisionDialog;

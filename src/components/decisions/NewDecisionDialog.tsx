import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { Switch } from "@/components/ui/switch";
import {
  evaluateConditionalRules,
  type DecisionTemplate, type RequiredField,
} from "@/lib/decisionTemplates";
import { useTemplates, toDecisionTemplate } from "@/hooks/useTemplates";
import { suggestReviewFlow, type ReviewFlowTemplate } from "@/lib/reviewFlowTemplates";
import ReviewFlowSelector from "./ReviewFlowSelector";
import {
  FileText, Users, Shield, AlertCircle,
  ChevronDown, ChevronUp, Clock, CheckSquare, Zap, ArrowLeft, Sparkles, TrendingUp,
} from "lucide-react";
import ApplyLearningPanel from "./ApplyLearningPanel";
import TemplateBrowserModal from "./TemplateBrowserModal";
import ContextualAINudges from "./ContextualAINudges";
import AiAssistantSidebar from "./AiAssistantSidebar";
import { calculateQualityScore, QualityScoreCircle, QualityScoreHints } from "./DecisionQualityScore";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { Crown, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTranslatedLabels } from "@/lib/labels";
import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import DecisionLimitModal from "@/components/upgrade/DecisionLimitModal";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const categories = ["strategic", "budget", "hr", "technical", "operational", "marketing"] as const;
const priorities = ["low", "medium", "high", "critical"] as const;

const categoryIcons: Record<string, string> = {
  strategic: "🎯", budget: "💰", hr: "👥",
  technical: "⚙️", operational: "📋", marketing: "📣",
};

const NewDecisionDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const { user } = useAuth();
  const { selectedTeamId } = useTeamContext();
  const { templates: dbTemplates } = useTemplates();
  const { isDecisionLimitReached, decisionCount, maxDecisions, isFree } = useFreemiumLimits();
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Show limit modal when dialog opens and limit is reached
  useEffect(() => {
    if (open && isDecisionLimitReached) {
      setShowLimitModal(true);
    }
  }, [open, isDecisionLimitReached]);

  // Convert DB templates to DecisionTemplate interface for the UI
  const availableTemplates: DecisionTemplate[] = useMemo(
    () => dbTemplates.map(toDecisionTemplate),
    [dbTemplates]
  );

  const getTemplateByCategory = (cat: string) => availableTemplates.find(t => t.category === cat);
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
  const [pinnedLessons, setPinnedLessons] = useState<any[]>([]);
  const [templateBrowserOpen, setTemplateBrowserOpen] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [confidential, setConfidential] = useState(false);
  const [confidentialViewerIds, setConfidentialViewerIds] = useState<string[]>([]);
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

  // (Lessons fetched inside ApplyLearningPanel)

  // Fetch profiles for owner selector
  const { data: profilesList = [] } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
    staleTime: 60_000,
    enabled: open,
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
        if (successRate > 0.6) reasons.push(t("newDecision.successRate", { pct: Math.round(successRate * 100) }));
        if (stats.avgDays > 0) reasons.push(t("newDecision.avgDays", { days: Math.round(stats.avgDays) }));
        if (teamId && stats.teamMatch > 0) reasons.push(t("newDecision.teamUsed", { count: stats.teamMatch }));
        if (rejectionPenalty < 0.1) reasons.push(t("newDecision.lowRejection"));
        bestTemplate = { ...stats, score, reasons };
      }
    }

    // Match to actual template object
    if (bestTemplate) {
      const match = availableTemplates.find(t => t.name === bestTemplate!.name);
      if (match) return { template: match, stats: bestTemplate };
    }
    return null;
  }, [historicalDecisions, teamId]);

  // (relevantLessons now handled by ApplyLearningPanel)

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
    if (isDecisionLimitReached) return;

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

    // Append pinned lessons to context
    if (pinnedLessons.length > 0) {
      contextParts.push(`\n---\n${t("newDecision.pinnedLessons", { count: pinnedLessons.length })}`);
      pinnedLessons.forEach((l, i) => {
        contextParts.push(`${i + 1}. _"${l.key_takeaway}"_ (${t("newDecision.fromDecision", { title: l.decision?.title ?? "Decision" })})`);
        if (l.recommendations) contextParts.push(`   → ${l.recommendations}`);
      });
    }

    const effectiveOwnerId = ownerId || user.id;
    const { data, error: err } = await supabase.from("decisions").insert([{
      title: title.trim(),
      description: description.trim() || null,
      context: contextParts.length > 0 ? contextParts.join("\n\n") : null,
      category: category as any,
      priority: priority as any,
      due_date: dueDate || null,
      team_id: teamId || null,
      created_by: user.id,
      owner_id: effectiveOwnerId,
      template_used: selectedTemplate?.name || null,
      template_version: selectedTemplate?.version || null,
      template_snapshot: templateSnapshot,
      confidential,
      confidential_viewer_ids: confidential ? confidentialViewerIds : [],
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
    setPinnedLessons([]); setShowRecommendations(false); setOwnerId("");
    setConfidential(false); setConfidentialViewerIds([]);
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
              <Zap className="w-2.5 h-2.5 mr-0.5" />{t("newDecision.conditional")}
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
            <option value="" className="bg-card">{t("newDecision.selectPlaceholder")}</option>
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

  // ─── Decision Limit Banner ───
  const renderLimitBanner = () => {
    if (!isDecisionLimitReached) return null;
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-warning/10 border border-warning/25 mb-4">
        <div className="w-9 h-9 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-warning" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-warning">{t("freemium.decisionLimitTitle")}</p>
          <p className="text-xs text-warning/80 mt-0.5">
            {t("freemium.decisionLimitDesc", { count: maxDecisions })}
          </p>
          <Button
            size="sm"
            className="mt-2 gap-1.5 text-xs"
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/#pricing";
            }}
          >
            <Crown className="w-3.5 h-3.5" /> {t("freemium.upgradeCta")}
          </Button>
        </div>
      </div>
    );
  };

  // ─── Template Selection Step ───
  const renderTemplateStep = () => (
    <div className="space-y-3">
      {renderLimitBanner()}
      <p className="text-sm text-muted-foreground">
        {t("newDecision.templateIntro")}
      </p>

      {/* AI Template Recommendation */}
      {templateRecommendation && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{t("newDecision.aiRecommendation")}</span>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              {t("newDecision.basedOn", { count: templateRecommendation.stats.total })}
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
              <Sparkles className="w-3.5 h-3.5" /> {t("newDecision.apply")}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {availableTemplates.map((tpl) => {
          const isExpanded = expandedTemplate === tpl.category;
          const isRecommended = templateRecommendation?.template.category === tpl.category;
          return (
            <div
              key={tpl.category}
              className={`rounded-lg border bg-card overflow-hidden transition-all hover:border-primary/40 ${isRecommended ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
            >
              <button
                type="button"
                onClick={() => setExpandedTemplate(isExpanded ? null : tpl.category)}
                className="w-full text-left p-3 flex items-start gap-3"
              >
                <span className="text-xl mt-0.5">{categoryIcons[tpl.category] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold">{tpl.name}</span>
                    {isRecommended && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="text-[9px] gap-0.5 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                            <Sparkles className="w-2.5 h-2.5" /> {t("newDecision.recommended")}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-48">
                          {t("newDecision.recommendedTooltip")}
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Badge variant="outline" className="text-[10px] capitalize">{tl.priorityLabels[tpl.priority]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{tpl.description}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{tpl.requiredFields.length} {t("newDecision.requiredFieldsLabel")}</span>
                    <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{tpl.approvalSteps.length} {t("newDecision.approvalSteps")}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t("newDecision.days", { n: tpl.defaultDurationDays })}</span>
                    {tpl.conditionalRules && tpl.conditionalRules.length > 0 && (
                      <span className="flex items-center gap-1 text-warning"><Zap className="w-3 h-3" />{t("newDecision.rules", { n: tpl.conditionalRules.length })}</span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                  {tpl.whenToUse && (
                    <p className="text-xs text-primary/80 italic">💡 {tpl.whenToUse}</p>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("newDecision.requiredFieldsLabel")}</p>
                    <div className="flex flex-wrap gap-1">
                      {tpl.requiredFields.map(f => (
                        <span key={f.key} className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("newDecision.approvalSteps")}</p>
                    <div className="flex items-center gap-1.5">
                      {tpl.approvalSteps.map((s, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${s.required ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"}`}>
                            {s.label}
                          </span>
                          {i < tpl.approvalSteps.length - 1 && <span className="text-muted-foreground text-[10px]">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {tpl.conditionalRules && tpl.conditionalRules.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("newDecision.conditionalRules")}</p>
                      <div className="space-y-1">
                        {tpl.conditionalRules.map((r, i) => (
                          <p key={i} className="text-[10px] text-warning/80 flex items-start gap-1">
                            <Zap className="w-3 h-3 shrink-0 mt-0.5" />
                            {r.governanceHint || `Wenn ${r.when} ${r.operator} ${Array.isArray(r.value) ? r.value.join("/") : r.value}`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {tpl.governanceNotes && (
                    <p className="text-[10px] text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                      {tpl.governanceNotes}
                    </p>
                  )}

                  <Button size="sm" className="w-full gap-2" onClick={() => applyTemplate(tpl)}>
                    <FileText className="w-3.5 h-3.5" /> {t("newDecision.useTemplate")}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={startWithoutTemplate} className="text-xs text-primary hover:underline w-full text-center py-1">
        {t("newDecision.withoutTemplate")}
      </button>
    </div>
  );

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="glass-card border-border max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            {step === "form" && selectedTemplate && (
              <button type="button" onClick={() => setStep("template")} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {step === "template" ? t("newDecision.chooseTemplate") : t("newDecision.newDecision")}
            {selectedTemplate && step === "form" && (
              <Badge variant="outline" className="text-[10px]">{categoryIcons[selectedTemplate.category]} {selectedTemplate.name}</Badge>
            )}
            {step === "form" && (() => {
              const { score } = calculateQualityScore({
                title, description,
                hasCategory: !!category,
                hasPriority: !!priority && priority !== "medium",
                hasDueDate: !!dueDate,
                hasSla: !!dueDate,
                hasReviewer: !!selectedReviewFlow && selectedReviewFlow.steps.length > 0,
                hasRiskAssessment: false,
                hasBudgetInfo: Object.values(extraFields).some(v => v.toLowerCase().includes("budget") || v.toLowerCase().includes("kosten")),
              });
              return <QualityScoreCircle score={score} size={42} strokeWidth={3.5} showLabel className="ml-auto" />;
            })()}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? renderTemplateStep() : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 mt-2">
            {/* Left column: Form */}
            <form onSubmit={handleSubmit} className="space-y-4" id="new-decision-form">
            {/* Template Browser Button */}
            {!selectedTemplate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 border-dashed"
                onClick={() => setTemplateBrowserOpen(true)}
              >
                <FileText className="w-3.5 h-3.5" />
                Aus Vorlage starten
              </Button>
            )}
            <TemplateBrowserModal
              open={templateBrowserOpen}
              onOpenChange={setTemplateBrowserOpen}
              onSelectTemplate={applyTemplate}
            />
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("newDecision.titleLabel")}</label>
              <input id="qs-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("newDecision.titlePlaceholder")} className={inputClass} required />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t("newDecision.descriptionLabel")}</label>
              <textarea id="qs-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("newDecision.descriptionPlaceholder")} className={`${inputClass} h-24 resize-none py-2`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t("newDecision.categoryLabel")}</label>
                <select id="qs-category" value={category} onChange={(e) => handleCategoryChange(e.target.value)} className={inputClass}>
                  {categories.map((c) => (<option key={c} value={c} className="bg-card">{tl.categoryLabels[c]}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t("newDecision.priorityLabel")}</label>
                <select id="qs-priority" value={priority} onChange={(e) => handlePriorityChange(e.target.value)} className={inputClass}>
                  {priorities.map((p) => (<option key={p} value={p} className="bg-card">{tl.priorityLabels[p]}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t("newDecision.dueDateLabel")}</label>
                <input id="qs-duedate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t("newDecision.teamLabel")}</span>
                </label>
                <select value={teamId} onChange={(e) => handleTeamChange(e.target.value)} className={inputClass}>
                  <option value="" className="bg-card">{t("newDecision.noTeam")}</option>
                  {teams.map((tm) => (<option key={tm.id} value={tm.id} className="bg-card">{tm.name}</option>))}
                </select>
              </div>
            </div>

            {/* Owner selector */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-warning" /> {t("newDecision.ownerLabel")}
              </label>
              <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={inputClass}>
                <option value="" className="bg-card">{t("newDecision.ownerDefault")}</option>
                {profilesList.map(p => (
                  <option key={p.user_id} value={p.user_id} className="bg-card">
                    {p.full_name || p.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">{t("newDecision.ownerHint")}</p>
            </div>

            {/* Confidential Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium">{t("decisions.edit.confidentialTitle")}</p>
                  <p className="text-[10px] text-muted-foreground">{t("decisions.edit.confidentialDesc")}</p>
                </div>
              </div>
              <Switch checked={confidential} onCheckedChange={setConfidential} />
            </div>
            {confidential && (
              <div className="space-y-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-warning mt-0.5 shrink-0" />
                  <p className="text-xs text-warning">{t("decisions.confidentialWarning")}</p>
                </div>
                <label className="text-xs font-medium text-muted-foreground">{t("decisions.confidentialViewers")}</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {profilesList.map(p => {
                    const isSelected = confidentialViewerIds.includes(p.user_id);
                    return (
                      <button
                        key={p.user_id}
                        type="button"
                        onClick={() => setConfidentialViewerIds(prev =>
                          isSelected ? prev.filter(id => id !== p.user_id) : [...prev, p.user_id]
                        )}
                        className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                          isSelected
                            ? "bg-primary/15 border-primary/30 text-primary font-medium"
                            : "bg-muted/30 border-border text-muted-foreground hover:border-primary/20"
                        }`}
                      >
                        {p.full_name || p.user_id.slice(0, 8)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground">{t("decisions.confidentialAdminNote")}</p>
              </div>
            )}

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
                  <span className="text-sm font-medium">{t("newDecision.requiredFieldsTitle", { category: tl.categoryLabels[selectedTemplate.category] })}</span>
                  <Badge variant="outline" className="text-[10px]">{t("newDecision.fieldsCount", { count: allRequiredFields.length })}</Badge>
                </div>
                {selectedTemplate.requiredFields.map(field => renderExtraField(field, false))}
              </div>
            )}

            {/* Conditional fields (dynamically added) */}
            {conditionalResult.extraFields.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-warning/30">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-warning" />
                  <span className="text-sm font-medium text-warning">{t("newDecision.conditionalFieldsTitle")}</span>
                  <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">{t("newDecision.conditionalActivated", { count: conditionalResult.extraFields.length })}</Badge>
                </div>
                {conditionalResult.extraFields.map(field => renderExtraField(field, true))}
              </div>
            )}

            {/* Conditional approval steps info */}
            {conditionalResult.extraApprovalSteps.length > 0 && (
              <div className="p-2.5 rounded-lg bg-warning/5 border border-warning/20 text-xs space-y-1">
                <p className="font-medium text-warning flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> {t("newDecision.extraApprovalTitle")}
                </p>
                {conditionalResult.extraApprovalSteps.map((s, i) => (
                  <p key={i} className="text-muted-foreground pl-5">+ {s.label} {s.required ? t("newDecision.required") : t("newDecision.optional")}</p>
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

            {/* Contextual AI Nudges */}
            <ContextualAINudges
              category={category}
              priority={priority}
              title={title}
              description={description}
              hasStakeholders={!!teamId && allApprovalSteps.length > 0}
            />

            {/* Apply Learning Panel */}
            <ApplyLearningPanel
              title={title}
              description={description}
              category={category}
              pinnedLessons={pinnedLessons}
              onPinnedChange={setPinnedLessons}
            />

            {/* Quality Score Hints */}
            {(() => {
              const { score, missing } = calculateQualityScore({
                title, description,
                hasCategory: !!category,
                hasPriority: !!priority && priority !== "medium",
                hasDueDate: !!dueDate,
                hasSla: !!dueDate,
                hasReviewer: !!selectedReviewFlow && selectedReviewFlow.steps.length > 0,
                hasRiskAssessment: false,
                hasBudgetInfo: Object.values(extraFields).some(v => v.toLowerCase().includes("budget") || v.toLowerCase().includes("kosten")),
              });
              return (
                <>
                  <QualityScoreHints score={score} missing={missing} />

                  {validationErrors.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">{t("newDecision.validationMissing")}</p>
                        <ul className="mt-1 space-y-0.5">
                          {validationErrors.map(e => <li key={e}>• {e}</li>)}
                        </ul>
                      </div>
                    </div>
                  )}

                  {error && <p className="text-destructive text-sm">{error}</p>}
                  {renderLimitBanner()}
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={() => { resetForm(); onOpenChange(false); }}>{t("newDecision.cancel")}</Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button type="submit" disabled={loading || !title.trim() || isDecisionLimitReached}>
                            {loading ? t("newDecision.creating") : t("newDecision.create")}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {score < 40 && (
                        <TooltipContent side="top" className="text-xs max-w-64">
                          Entscheidungsqualität zu niedrig — bitte Beschreibung und Reviewer ergänzen.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </>
              );
            })()}
            </form>

            {/* Right column: AI Assistant Sidebar (desktop only) */}
            <div className="hidden lg:block">
              <AiAssistantSidebar
                title={title}
                description={description}
                category={category}
                priority={priority}
                onApplyTitle={(t) => setTitle(t)}
                onApplyCategory={(c) => handleCategoryChange(c)}
                onApplyPriority={(p) => handlePriorityChange(p)}
                onApplyTemplate={(templateName) => {
                  const match = availableTemplates.find(tpl =>
                    tpl.name.toLowerCase().includes(templateName.toLowerCase()) ||
                    templateName.toLowerCase().includes(tpl.name.toLowerCase())
                  );
                  if (match) applyTemplate(match);
                }}
                onApplySlaDays={(days) => {
                  const due = new Date();
                  due.setDate(due.getDate() + days);
                  setDueDate(due.toISOString().split("T")[0]);
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <DecisionLimitModal open={showLimitModal} onOpenChange={setShowLimitModal} />
    </>
  );
};

export default NewDecisionDialog;

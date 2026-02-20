import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Trash2, AlertCircle, CheckSquare, MessageSquare,
  GitPullRequest, Brain, History, Target, Users, GitBranch, Link2,
  Compass, Crosshair, Clock, ShieldAlert, AlertTriangle, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDecisions, useProfiles, buildProfileMap, useDependencies, useInvalidateDecisions } from "@/hooks/useDecisions";
import { useTasks } from "@/hooks/useTasks";
import { categoryLabels, statusLabels, priorityLabels } from "@/lib/labels";
import { differenceInDays, format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

// Panels
import DiscussionPanel from "@/components/decisions/DiscussionPanel";
import ReviewPanel from "@/components/decisions/ReviewPanel";
import AiAnalysisPanel from "@/components/decisions/AiAnalysisPanel";
import AuditTrailPanel from "@/components/decisions/AuditTrailPanel";
import ImpactTrackerPanel from "@/components/decisions/ImpactTrackerPanel";
import StakeholderAlignmentPanel from "@/components/decisions/StakeholderAlignmentPanel";
import WhatIfSimulatorPanel from "@/components/decisions/WhatIfSimulatorPanel";
import DependenciesPanel from "@/components/decisions/DependenciesPanel";
import CoPilotPanel from "@/components/decisions/CoPilotPanel";
import StrategyLinkPanel from "@/components/decisions/StrategyLinkPanel";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";

const statusOptions = ["draft", "review", "approved", "implemented", "rejected"] as const;

const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  implemented: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

const priorityStyles: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  critical: "text-destructive",
};

const tabGroups = [
  {
    label: "Überblick",
    tabs: [
      { value: "overview", icon: Target, label: "Overview" },
      { value: "discussion", icon: MessageSquare, label: "Diskussion" },
    ],
  },
  {
    label: "Analyse",
    tabs: [
      { value: "dependencies", icon: Link2, label: "Abhängigkeiten" },
      { value: "impact", icon: DollarSign, label: "Impact" },
      { value: "ai", icon: Brain, label: "KI Insights" },
      { value: "whatif", icon: GitBranch, label: "What-If" },
    ],
  },
  {
    label: "Governance",
    tabs: [
      { value: "review", icon: GitPullRequest, label: "Review" },
      { value: "alignment", icon: Users, label: "Alignment" },
      { value: "copilot", icon: Compass, label: "Co-Pilot" },
      { value: "strategy", icon: Crosshair, label: "Strategie" },
      { value: "audit", icon: History, label: "Audit" },
    ],
  },
];

const DecisionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: allDecisions = [] } = useDecisions();
  const { data: profiles = [] } = useProfiles();
  const { data: allDeps = [] } = useDependencies();
  const { data: allTasks = [] } = useTasks();
  const invalidate = useInvalidateDecisions();
  const profileMap = buildProfileMap(profiles);

  const [activeTab, setActiveTab] = useState("overview");
  const [status, setStatus] = useState("draft");
  const [saving, setSaving] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const decision = allDecisions.find(d => d.id === id);

  useEffect(() => {
    if (decision) setStatus(decision.status);
  }, [decision]);

  // Linked data
  const { openLinkedTasks, depCount, delayCost } = useMemo(() => {
    if (!decision) return { openLinkedTasks: 0, depCount: 0, delayCost: 0 };
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    let openTasks = 0;
    allDeps.forEach(dep => {
      if (dep.source_decision_id === decision.id && dep.target_task_id) {
        const task = taskMap.get(dep.target_task_id);
        if (task && task.status !== "done") openTasks++;
      }
      if (dep.target_decision_id === decision.id && dep.source_task_id) {
        const task = taskMap.get(dep.source_task_id);
        if (task && task.status !== "done") openTasks++;
      }
    });

    const deps = allDeps.filter(d =>
      d.source_decision_id === decision.id || d.target_decision_id === decision.id ||
      d.source_task_id === decision.id || d.target_task_id === decision.id
    );

    const daysOpen = differenceInDays(new Date(), new Date(decision.created_at));
    const mult: Record<string, number> = { critical: 4, high: 2.5, medium: 1.5, low: 1 };
    const cost = Math.round(daysOpen * 2 * 75 * (mult[decision.priority] || 1.5));

    return { openLinkedTasks: openTasks, depCount: deps.length, delayCost: cost };
  }, [decision, allDeps, allTasks]);

  if (!decision) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Entscheidung nicht gefunden.</p>
          <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/decisions")}>
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === decision.created_by;

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    const oldStatus = status;
    const updates: Record<string, any> = { status: newStatus as any, updated_at: new Date().toISOString() };
    if (newStatus === "implemented") updates.implemented_at = new Date().toISOString();
    const { error } = await supabase.from("decisions").update(updates).eq("id", decision.id);
    if (!error) {
      setStatus(newStatus);
      await supabase.from("audit_logs").insert({
        decision_id: decision.id, user_id: user!.id, action: "status_changed",
        field_name: "status", old_value: oldStatus, new_value: newStatus,
      });
      invalidate();
      toast.success(`Status → ${statusLabels[newStatus]}`);
    }
    setSaving(false);
  };

  const formatCost = (c: number) => c >= 1000 ? `${(c / 1000).toFixed(1)}k€` : `${c}€`;
  const riskScore = decision.ai_risk_score || 0;
  const isActive = !["implemented", "rejected"].includes(decision.status);

  return (
    <AppLayout>
      {/* Back navigation */}
      <Button variant="ghost" size="sm" className="gap-1.5 mb-4 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/decisions")}>
        <ArrowLeft className="w-4 h-4" /> Entscheidungen
      </Button>

      {/* ═══ HEADER ═══ */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-2">
            <h1 className="font-display text-2xl font-bold">{decision.title}</h1>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${statusStyles[status]}`}>
              {statusLabels[status]}
            </span>
            <span className={`text-xs font-semibold ${priorityStyles[decision.priority]}`}>
              {priorityLabels[decision.priority]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">{decision.description || "Keine Beschreibung"}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
            <span>Erstellt von {profileMap[decision.created_by] || "Unbekannt"}</span>
            {decision.assignee_id && <span>Zugewiesen: {profileMap[decision.assignee_id] || "—"}</span>}
            <span>{categoryLabels[decision.category]}</span>
            {decision.due_date && (
              <span className={decision.due_date && new Date(decision.due_date) < new Date() && isActive ? "text-destructive font-medium" : ""}>
                Fällig: {format(new Date(decision.due_date), "dd.MM.yyyy", { locale: de })}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isOwner && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowEdit(true)}>
                <Pencil className="w-3.5 h-3.5" /> Bearbeiten
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>
                <Trash2 className="w-3.5 h-3.5" /> Löschen
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Open tasks warning */}
      {openLinkedTasks > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 mb-4">
          <AlertCircle className="w-4 h-4 text-warning shrink-0" />
          <p className="text-xs text-warning">
            <span className="font-semibold">{openLinkedTasks} offene Aufgabe{openLinkedTasks > 1 ? "n" : ""}</span> verknüpft
          </p>
        </div>
      )}

      {/* ═══ STATUS BAR + INDICATOR STRIP ═══ */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Status changer */}
        <Card className="flex-1">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Status ändern</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusOptions.map(s => (
                <Button
                  key={s} size="sm" variant={status === s ? "default" : "outline"}
                  className="text-xs h-7" disabled={saving || (!isOwner && s !== "approved" && s !== "rejected")}
                  onClick={() => handleStatusChange(s)}
                >
                  {statusLabels[s]}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <AlertTriangle className={`w-4 h-4 mx-auto mb-1 ${riskScore > 60 ? "text-destructive" : riskScore > 40 ? "text-warning" : "text-success"}`} />
              <p className="text-lg font-bold">{riskScore}%</p>
              <p className="text-[10px] text-muted-foreground">Risk Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Link2 className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{depCount}</p>
              <p className="text-[10px] text-muted-foreground">Dependencies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <DollarSign className="w-4 h-4 mx-auto mb-1 text-destructive" />
              <p className="text-lg font-bold">{isActive ? formatCost(delayCost) : "—"}</p>
              <p className="text-[10px] text-muted-foreground">Cost Impact</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <ShieldAlert className={`w-4 h-4 mx-auto mb-1 ${(decision.escalation_level || 0) > 0 ? "text-warning" : "text-muted-foreground"}`} />
              <p className="text-lg font-bold">{decision.escalation_level || 0}</p>
              <p className="text-[10px] text-muted-foreground">Eskalation</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ TABBED CONTENT ═══ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 border-b border-border pb-3">
          {tabGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-1.5">{group.label}</p>
              <div className="flex gap-1">
                {group.tabs.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === tab.value
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Overview tab – summary of key data */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Description & Context */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-2">Beschreibung</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {decision.description || "Keine Beschreibung vorhanden."}
                  </p>
                </CardContent>
              </Card>
              {decision.context && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-2">Kontext</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{decision.context}</p>
                  </CardContent>
                </Card>
              )}
              {decision.outcome && (
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold mb-2">Ergebnis</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{decision.outcome}</p>
                    {decision.outcome_notes && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{decision.outcome_notes}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Decision Health */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Decision Health</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Risiko", value: riskScore, color: riskScore > 60 ? "bg-destructive" : riskScore > 40 ? "bg-warning" : "bg-success" },
                      { label: "KI-Impact", value: decision.ai_impact_score || 0, color: "bg-primary" },
                    ].map(metric => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{metric.label}</span>
                          <span className="font-semibold">{metric.value}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${metric.color}`} style={{ width: `${metric.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {(decision.ai_risk_factors?.length > 0 || decision.ai_success_factors?.length > 0) && (
                    <div className="mt-4 pt-3 border-t border-border space-y-3">
                      {decision.ai_risk_factors?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-destructive mb-1">Risikofaktoren</p>
                          <div className="flex flex-wrap gap-1">
                            {decision.ai_risk_factors.map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/20">{f}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {decision.ai_success_factors?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-success mb-1">Erfolgsfaktoren</p>
                          <div className="flex flex-wrap gap-1">
                            {decision.ai_success_factors.map((f: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px] text-success border-success/20">{f}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline info */}
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold mb-3">Timeline</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Erstellt</span>
                      <span>{format(new Date(decision.created_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Letztes Update</span>
                      <span>{format(new Date(decision.updated_at), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                    </div>
                    {decision.due_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Fällig</span>
                        <span className={new Date(decision.due_date) < new Date() && isActive ? "text-destructive font-medium" : ""}>
                          {format(new Date(decision.due_date), "dd.MM.yyyy", { locale: de })}
                        </span>
                      </div>
                    )}
                    {decision.implemented_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Umgesetzt</span>
                        <span className="text-success">{format(new Date(decision.implemented_at), "dd.MM.yyyy", { locale: de })}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-muted-foreground">Tage seit Erstellung</span>
                      <span className="font-semibold">{differenceInDays(new Date(), new Date(decision.created_at))}d</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="discussion"><DiscussionPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="review"><ReviewPanel decision={decision} onUpdated={invalidate} /></TabsContent>
        <TabsContent value="ai"><AiAnalysisPanel decision={decision} onUpdated={invalidate} /></TabsContent>
        <TabsContent value="alignment"><StakeholderAlignmentPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="whatif"><WhatIfSimulatorPanel decision={decision} /></TabsContent>
        <TabsContent value="dependencies"><DependenciesPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="impact"><ImpactTrackerPanel decision={decision} onUpdated={invalidate} /></TabsContent>
        <TabsContent value="copilot"><CoPilotPanel decision={decision} /></TabsContent>
        <TabsContent value="strategy"><StrategyLinkPanel decisionId={decision.id} /></TabsContent>
        <TabsContent value="audit"><AuditTrailPanel decisionId={decision.id} /></TabsContent>
      </Tabs>

      {isOwner && (
        <>
          <EditDecisionDialog decision={decision} open={showEdit} onOpenChange={setShowEdit} onUpdated={() => { invalidate(); }} />
          <DeleteDecisionDialog decision={decision} open={showDelete} onOpenChange={setShowDelete} onDeleted={() => { invalidate(); navigate("/decisions"); }} />
        </>
      )}
    </AppLayout>
  );
};

export default DecisionDetail;

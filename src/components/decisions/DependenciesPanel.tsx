import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeams } from "@/hooks/useDecisions";
import { GitBranch, Plus, Trash2, ArrowRight, CheckSquare, Lightbulb, Users, Sparkles, Check, X, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface Props {
  decisionId: string;
}

type EntityType = "decision" | "task";

interface AiSuggestion {
  decision_id: string;
  title: string;
  status: string;
  dependency_type: "blocks" | "requires" | "influences";
  confidence: number;
  reason: string;
}

const DependenciesPanel = ({ decisionId }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: teams = [] } = useTeams();
  const teamMap = Object.fromEntries(teams.map(tm => [tm.id, tm.name]));
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [allDecisions, setAllDecisions] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("task");
  const [depType, setDepType] = useState<"blocks" | "influences" | "requires">("requires");
  const [loading, setLoading] = useState(false);

  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRequested, setAiRequested] = useState(false);

  const fetchData = async () => {
    const { data: depsOut } = await supabase
      .from("decision_dependencies")
      .select("*, target_decision:decisions!decision_dependencies_target_decision_id_fkey(id, title, status, team_id)")
      .eq("source_decision_id", decisionId);

    const outgoing = depsOut || [];
    const taskTargetIds = outgoing.filter(d => d.target_task_id).map(d => d.target_task_id);
    let taskTargets: Record<string, any> = {};
    if (taskTargetIds.length > 0) {
      const { data: tasks } = await supabase.from("tasks").select("id, title, status").in("id", taskTargetIds);
      tasks?.forEach(tsk => { taskTargets[tsk.id] = tsk; });
    }
    const enrichedOut = outgoing.map(d => ({
      ...d,
      target: d.target_decision || (d.target_task_id ? taskTargets[d.target_task_id] : null),
      target_type: d.target_decision_id ? "decision" : "task",
    }));

    const { data: depsIn } = await supabase
      .from("decision_dependencies")
      .select("*, source_decision:decisions!decision_dependencies_source_decision_id_fkey(id, title, status, team_id)")
      .eq("target_decision_id", decisionId);

    const incoming = depsIn || [];
    const taskSourceIds = incoming.filter(d => d.source_task_id).map(d => d.source_task_id);
    let taskSources: Record<string, any> = {};
    if (taskSourceIds.length > 0) {
      const { data: tasks } = await supabase.from("tasks").select("id, title, status").in("id", taskSourceIds);
      tasks?.forEach(tsk => { taskSources[tsk.id] = tsk; });
    }
    const enrichedIn = incoming.map(d => ({
      ...d,
      source: d.source_decision || (d.source_task_id ? taskSources[d.source_task_id] : null),
      source_type: d.source_decision_id ? "decision" : "task",
    }));

    const { data: taskDepsIn } = await supabase
      .from("decision_dependencies")
      .select("*")
      .eq("target_decision_id", decisionId)
      .not("source_task_id", "is", null);

    if (taskDepsIn && taskDepsIn.length > 0) {
      const ids = taskDepsIn.filter(d => d.source_task_id).map(d => d.source_task_id);
      if (ids.length > 0) {
        const { data: tasks } = await supabase.from("tasks").select("id, title, status").in("id", ids);
        tasks?.forEach(tsk => { taskSources[tsk.id] = tsk; });
      }
      taskDepsIn.forEach(d => {
        if (!enrichedIn.find(e => e.id === d.id)) {
          enrichedIn.push({
            ...d, source_decision: null,
            source: d.source_task_id ? taskSources[d.source_task_id] : null,
            source_type: "task",
          });
        }
      });
    }

    setDependencies(enrichedOut);
    setDependents(enrichedIn);

    const [decs, tasks] = await Promise.all([
      supabase.from("decisions").select("id, title").neq("id", decisionId),
      supabase.from("tasks").select("id, title").eq("status", "open").order("created_at", { ascending: false }),
    ]);
    setAllDecisions(decs.data || []);
    setAllTasks(tasks.data || []);
  };

  useEffect(() => { fetchData(); }, [decisionId]);

  const addDependency = async () => {
    if (!selectedEntity || !user) return;
    setLoading(true);
    const insert: any = { dependency_type: depType, created_by: user.id, source_decision_id: decisionId };
    if (entityType === "decision") { insert.target_decision_id = selectedEntity; }
    else { insert.target_task_id = selectedEntity; }
    await supabase.from("decision_dependencies").insert(insert);
    setSelectedEntity("");
    await fetchData();
    setLoading(false);
  };

  const removeDependency = async (id: string) => {
    await supabase.from("decision_dependencies").delete().eq("id", id);
    await fetchData();
  };

  // AI: fetch suggestions
  const fetchAiSuggestions = async () => {
    setAiLoading(true);
    setAiRequested(true);
    try {
      const { data, error } = await supabase.functions.invoke("similarity-score", {
        body: { decisionId, mode: "dependencies" },
      });
      if (error) throw error;
      setAiSuggestions(data?.suggestions || []);
    } catch (e) {
      console.error("AI suggestions error:", e);
      toast.error(t("dependencies.aiNoSuggestions"));
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  // AI: accept a suggestion
  const acceptSuggestion = async (s: AiSuggestion) => {
    if (!user) return;
    await supabase.from("decision_dependencies").insert({
      source_decision_id: decisionId,
      target_decision_id: s.decision_id,
      dependency_type: s.dependency_type,
      created_by: user.id,
    });
    setAiSuggestions(prev => prev.filter(x => x.decision_id !== s.decision_id));
    await fetchData();
  };

  const dismissSuggestion = (id: string) => {
    setAiSuggestions(prev => prev.filter(x => x.decision_id !== id));
  };

  const existingTargetIds = new Set([
    ...dependencies.filter(d => d.target_decision_id).map(d => d.target_decision_id),
    ...dependencies.filter(d => d.target_task_id).map(d => d.target_task_id),
  ]);
  const available = entityType === "decision"
    ? allDecisions.filter(d => !existingTargetIds.has(d.id))
    : allTasks.filter(tsk => !existingTargetIds.has(tsk.id));

  const statusDot = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted-foreground", proposed: "bg-accent-foreground/60", review: "bg-warning", approved: "bg-success",
      implemented: "bg-primary", rejected: "bg-destructive", archived: "bg-muted-foreground/40",
      backlog: "bg-muted-foreground/40", open: "bg-muted-foreground", in_progress: "bg-warning", blocked: "bg-destructive", done: "bg-success",
    };
    return <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-muted"}`} />;
  };

  const typeLabel: Record<string, string> = {
    blocks: t("dependencies.typeBlocks"),
    influences: t("dependencies.typeInfluences"),
    requires: t("dependencies.typeRequires"),
  };

  const entityIcon = (type: string) =>
    type === "task"
      ? <CheckSquare className="w-3 h-3 text-accent-foreground" />
      : <Lightbulb className="w-3 h-3 text-primary" />;

  // Filter out already-linked suggestions
  const filteredSuggestions = aiSuggestions.filter(s => !existingTargetIds.has(s.decision_id));

  return (
    <div className="space-y-4">
      {/* Manual add */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          {t("dependencies.addLink")}
        </label>
        <div className="flex gap-2 flex-wrap">
          <select value={entityType} onChange={(e) => { setEntityType(e.target.value as EntityType); setSelectedEntity(""); }}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm w-28">
            <option value="task">{t("dependencies.task")}</option>
            <option value="decision">{t("dependencies.decision")}</option>
          </select>
          <select value={depType} onChange={(e) => setDepType(e.target.value as any)}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm w-32">
            <option value="requires">{t("dependencies.requires")}</option>
            <option value="blocks">{t("dependencies.blocks")}</option>
            <option value="influences">{t("dependencies.influences")}</option>
          </select>
          <select value={selectedEntity} onChange={(e) => setSelectedEntity(e.target.value)}
            className="flex-1 min-w-[160px] h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm">
            <option value="">{entityType === "task" ? t("dependencies.selectTask") : t("dependencies.selectDecision")}</option>
            {available.map((d) => (<option key={d.id} value={d.id}>{d.title}</option>))}
          </select>
          <Button size="sm" onClick={addDependency} disabled={!selectedEntity || loading}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Suggestions button */}
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAiSuggestions}
          disabled={aiLoading}
          className="gap-2"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {t("dependencies.aiSuggest")}
        </Button>
        {!aiRequested && (
          <p className="text-xs text-muted-foreground mt-1">{t("dependencies.aiSuggestHint")}</p>
        )}
      </div>

      {/* AI loading */}
      {aiLoading && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t("dependencies.aiLoading")}</span>
        </div>
      )}

      {/* AI suggestions list */}
      {!aiLoading && filteredSuggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            {t("dependencies.aiSuggested", { count: filteredSuggestions.length })}
          </h4>
          {filteredSuggestions.map((s) => (
            <div key={s.decision_id} className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
              <Lightbulb className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-primary/70 w-20 flex-shrink-0">
                {typeLabel[s.dependency_type]}
              </span>
              {statusDot(s.status)}
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{s.title}</span>
                <span className="text-[10px] text-muted-foreground block truncate">{s.reason}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                {t("dependencies.aiConfidence", { value: s.confidence })}
              </span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-success" onClick={() => acceptSuggestion(s)}>
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => dismissSuggestion(s.decision_id)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* AI: no results */}
      {!aiLoading && aiRequested && filteredSuggestions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">{t("dependencies.aiNoSuggestions")}</p>
      )}

      {/* Outgoing dependencies */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t("dependencies.outgoing", { count: dependencies.length })}
          </h4>
          {dependencies.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50">
              {entityIcon(dep.target_type)}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 flex-shrink-0">
                {typeLabel[dep.dependency_type]}
              </span>
              {dep.target && statusDot(dep.target.status)}
              <span className="text-sm flex-1 truncate">{dep.target?.title || "?"}</span>
              {dep.target_type === "decision" && dep.target?.team_id && teamMap[dep.target.team_id] && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/50 text-accent-foreground shrink-0">
                  <Users className="w-2.5 h-2.5" />
                  {teamMap[dep.target.team_id]}
                </span>
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeDependency(dep.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Incoming dependencies */}
      {dependents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            {t("dependencies.incoming", { count: dependents.length })}
          </h4>
          {dependents.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50">
              {entityIcon(dep.source_type)}
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 rotate-180" />
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground w-20 flex-shrink-0">
                {typeLabel[dep.dependency_type]}
              </span>
              {dep.source && statusDot(dep.source.status)}
              <span className="text-sm flex-1 truncate">{dep.source?.title || "?"}</span>
              {dep.source_type === "decision" && dep.source?.team_id && teamMap[dep.source.team_id] && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent/50 text-accent-foreground shrink-0">
                  <Users className="w-2.5 h-2.5" />
                  {teamMap[dep.source.team_id]}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {dependencies.length === 0 && dependents.length === 0 && !aiRequested && (
        <div className="text-center py-6 text-muted-foreground">
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{t("dependencies.noLinks")}</p>
          <p className="text-xs">{t("dependencies.noLinksHint")}</p>
        </div>
      )}
    </div>
  );
};

export default DependenciesPanel;

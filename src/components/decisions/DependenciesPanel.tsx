import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GitBranch, Plus, Trash2, ArrowRight, CheckSquare, Lightbulb } from "lucide-react";

interface Props {
  decisionId: string;
}

type EntityType = "decision" | "task";

const DependenciesPanel = ({ decisionId }: Props) => {
  const { user } = useAuth();
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [allDecisions, setAllDecisions] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState("");
  const [entityType, setEntityType] = useState<EntityType>("task");
  const [depType, setDepType] = useState<"blocks" | "influences" | "requires">("requires");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    // Outgoing: this decision is source
    const { data: depsOut } = await supabase
      .from("decision_dependencies")
      .select("*, target_decision:decisions!decision_dependencies_target_decision_id_fkey(id, title, status)")
      .eq("source_decision_id", decisionId);

    // Also fetch task targets for outgoing deps
    const outgoing = depsOut || [];
    const taskTargetIds = outgoing.filter(d => d.target_task_id).map(d => d.target_task_id);
    let taskTargets: Record<string, any> = {};
    if (taskTargetIds.length > 0) {
      const { data: tasks } = await supabase.from("tasks").select("id, title, status").in("id", taskTargetIds);
      tasks?.forEach(t => { taskTargets[t.id] = t; });
    }
    const enrichedOut = outgoing.map(d => ({
      ...d,
      target: d.target_decision || (d.target_task_id ? taskTargets[d.target_task_id] : null),
      target_type: d.target_decision_id ? "decision" : "task",
    }));

    // Incoming: this decision is target
    const { data: depsIn } = await supabase
      .from("decision_dependencies")
      .select("*, source_decision:decisions!decision_dependencies_source_decision_id_fkey(id, title, status)")
      .eq("target_decision_id", decisionId);

    const incoming = depsIn || [];
    const taskSourceIds = incoming.filter(d => d.source_task_id).map(d => d.source_task_id);
    let taskSources: Record<string, any> = {};
    if (taskSourceIds.length > 0) {
      const { data: tasks } = await supabase.from("tasks").select("id, title, status").in("id", taskSourceIds);
      tasks?.forEach(t => { taskSources[t.id] = t; });
    }
    const enrichedIn = incoming.map(d => ({
      ...d,
      source: d.source_decision || (d.source_task_id ? taskSources[d.source_task_id] : null),
      source_type: d.source_decision_id ? "decision" : "task",
    }));

    // Also fetch dependencies where tasks point TO this decision
    const { data: taskDepsIn } = await supabase
      .from("decision_dependencies")
      .select("*")
      .eq("target_decision_id", decisionId)
      .not("source_task_id", "is", null);

    if (taskDepsIn && taskDepsIn.length > 0) {
      const ids = taskDepsIn.filter(d => d.source_task_id).map(d => d.source_task_id);
      if (ids.length > 0) {
        const { data: tasks } = await supabase.from("tasks").select("id, title, status").in("id", ids);
        tasks?.forEach(t => { taskSources[t.id] = t; });
      }
      taskDepsIn.forEach(d => {
        if (!enrichedIn.find(e => e.id === d.id)) {
          enrichedIn.push({
            ...d,
            source_decision: null,
            source: d.source_task_id ? taskSources[d.source_task_id] : null,
            source_type: "task",
          });
        }
      });
    }

    setDependencies(enrichedOut);
    setDependents(enrichedIn);

    // Fetch available decisions and tasks
    const [decs, tasks] = await Promise.all([
      supabase.from("decisions").select("id, title").neq("id", decisionId),
      supabase.from("tasks").select("id, title").eq("status", "open").order("created_at", { ascending: false }),
    ]);
    setAllDecisions(decs.data || []);
    setAllTasks(tasks.data || []);
  };

  useEffect(() => {
    fetchData();
  }, [decisionId]);

  const addDependency = async () => {
    if (!selectedEntity || !user) return;
    setLoading(true);
    const insert: any = {
      dependency_type: depType,
      created_by: user.id,
      source_decision_id: decisionId,
    };
    if (entityType === "decision") {
      insert.target_decision_id = selectedEntity;
    } else {
      insert.target_task_id = selectedEntity;
    }
    await supabase.from("decision_dependencies").insert(insert);
    setSelectedEntity("");
    await fetchData();
    setLoading(false);
  };

  const removeDependency = async (id: string) => {
    await supabase.from("decision_dependencies").delete().eq("id", id);
    await fetchData();
  };

  const existingTargetIds = new Set([
    ...dependencies.filter(d => d.target_decision_id).map(d => d.target_decision_id),
    ...dependencies.filter(d => d.target_task_id).map(d => d.target_task_id),
  ]);
  const available = entityType === "decision"
    ? allDecisions.filter(d => !existingTargetIds.has(d.id))
    : allTasks.filter(t => !existingTargetIds.has(t.id));

  const statusDot = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted-foreground", proposed: "bg-accent-foreground/60", review: "bg-warning", approved: "bg-success",
      implemented: "bg-primary", rejected: "bg-destructive", archived: "bg-muted-foreground/40",
      backlog: "bg-muted-foreground/40", open: "bg-muted-foreground", in_progress: "bg-warning", blocked: "bg-destructive", done: "bg-success",
    };
    return <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-muted"}`} />;
  };

  const typeLabel: Record<string, string> = {
    blocks: "blockiert", influences: "beeinflusst", requires: "benötigt",
  };

  const entityIcon = (type: string) =>
    type === "task"
      ? <CheckSquare className="w-3 h-3 text-accent-foreground" />
      : <Lightbulb className="w-3 h-3 text-primary" />;

  return (
    <div className="space-y-4">
      {/* Add dependency */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Verknüpfung hinzufügen
        </label>
        <div className="flex gap-2 flex-wrap">
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value as EntityType); setSelectedEntity(""); }}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm w-28"
          >
            <option value="task">Aufgabe</option>
            <option value="decision">Entscheidung</option>
          </select>
          <select
            value={depType}
            onChange={(e) => setDepType(e.target.value as any)}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm w-32"
          >
            <option value="requires">Benötigt</option>
            <option value="blocks">Blockiert</option>
            <option value="influences">Beeinflusst</option>
          </select>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="flex-1 min-w-[160px] h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm"
          >
            <option value="">{entityType === "task" ? "Aufgabe" : "Entscheidung"} wählen...</option>
            {available.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <Button size="sm" onClick={addDependency} disabled={!selectedEntity || loading}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Outgoing */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Diese Entscheidung beeinflusst ({dependencies.length})
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
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeDependency(dep.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Incoming */}
      {dependents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Abhängig von ({dependents.length})
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
            </div>
          ))}
        </div>
      )}

      {dependencies.length === 0 && dependents.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Keine Verknüpfungen definiert</p>
          <p className="text-xs">Verknüpfe diese Entscheidung mit Aufgaben oder anderen Entscheidungen.</p>
        </div>
      )}
    </div>
  );
};

export default DependenciesPanel;

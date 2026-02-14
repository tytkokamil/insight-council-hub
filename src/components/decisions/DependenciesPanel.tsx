import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { GitBranch, Plus, Trash2, ArrowRight } from "lucide-react";

interface Props {
  decisionId: string;
}

const DependenciesPanel = ({ decisionId }: Props) => {
  const { user } = useAuth();
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [dependents, setDependents] = useState<any[]>([]);
  const [allDecisions, setAllDecisions] = useState<any[]>([]);
  const [selectedDecision, setSelectedDecision] = useState("");
  const [depType, setDepType] = useState<"blocks" | "influences" | "requires">("blocks");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [depsOut, depsIn, decs] = await Promise.all([
      supabase
        .from("decision_dependencies")
        .select("*, target:decisions!decision_dependencies_target_decision_id_fkey(id, title, status)")
        .eq("source_decision_id", decisionId),
      supabase
        .from("decision_dependencies")
        .select("*, source:decisions!decision_dependencies_source_decision_id_fkey(id, title, status)")
        .eq("target_decision_id", decisionId),
      supabase.from("decisions").select("id, title").neq("id", decisionId),
    ]);
    setDependencies(depsOut.data || []);
    setDependents(depsIn.data || []);
    setAllDecisions(decs.data || []);
  };

  useEffect(() => {
    fetchData();
  }, [decisionId]);

  const addDependency = async () => {
    if (!selectedDecision || !user) return;
    setLoading(true);
    await supabase.from("decision_dependencies").insert({
      source_decision_id: decisionId,
      target_decision_id: selectedDecision,
      dependency_type: depType,
      created_by: user.id,
    });
    setSelectedDecision("");
    await fetchData();
    setLoading(false);
  };

  const removeDependency = async (id: string) => {
    await supabase.from("decision_dependencies").delete().eq("id", id);
    await fetchData();
  };

  const existingIds = new Set([
    ...dependencies.map((d) => d.target_decision_id),
    ...dependents.map((d) => d.source_decision_id),
  ]);
  const available = allDecisions.filter((d) => !existingIds.has(d.id));

  const statusDot = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-muted-foreground",
      review: "bg-warning",
      approved: "bg-success",
      implemented: "bg-primary",
      rejected: "bg-destructive",
    };
    return <div className={`w-2 h-2 rounded-full ${colors[status] || "bg-muted"}`} />;
  };

  const typeLabel: Record<string, string> = {
    blocks: "blockiert",
    influences: "beeinflusst",
    requires: "benötigt",
  };

  return (
    <div className="space-y-4">
      {/* Add dependency */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Abhängigkeit hinzufügen
        </label>
        <div className="flex gap-2">
          <select
            value={depType}
            onChange={(e) => setDepType(e.target.value as any)}
            className="h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm w-32"
          >
            <option value="blocks">Blockiert</option>
            <option value="influences">Beeinflusst</option>
            <option value="requires">Benötigt</option>
          </select>
          <select
            value={selectedDecision}
            onChange={(e) => setSelectedDecision(e.target.value)}
            className="flex-1 h-9 px-2 rounded-lg bg-muted/50 border border-border text-sm"
          >
            <option value="">Entscheidung wählen...</option>
            {available.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
          <Button size="sm" onClick={addDependency} disabled={!selectedDecision || loading}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Outgoing: This decision affects... */}
      {dependencies.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Diese Entscheidung beeinflusst ({dependencies.length})
          </h4>
          {dependencies.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50">
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

      {/* Incoming: This decision is affected by... */}
      {dependents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Abhängig von ({dependents.length})
          </h4>
          {dependents.map((dep) => (
            <div key={dep.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 border border-border/50">
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
          <p className="text-sm">Keine Abhängigkeiten definiert</p>
          <p className="text-xs">Verknüpfe diese Entscheidung mit anderen, um Kaskaden sichtbar zu machen.</p>
        </div>
      )}
    </div>
  );
};

export default DependenciesPanel;

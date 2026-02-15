import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/layout/AppLayout";
import { AlertTriangle, DollarSign, GitBranch, Info } from "lucide-react";

const statusColors: Record<string, string> = {
  draft: "#6b7280",
  review: "#eab308",
  approved: "#22c55e",
  implemented: "#3b82f6",
  rejected: "#ef4444",
};

const prioritySize: Record<string, number> = {
  low: 140,
  medium: 160,
  high: 180,
  critical: 200,
};

const DecisionNode = ({ data }: { data: any }) => {
  const borderColor = statusColors[data.status] || "#6b7280";
  const isCriticalPath = data.cascadeCount > 0;
  const isBlocked = data.isBlocked;

  return (
    <div
      className="rounded-xl p-3 min-w-[180px] max-w-[220px] cursor-pointer transition-all hover:scale-105 bg-card text-card-foreground"
      style={{
        border: `2px solid ${borderColor}`,
        boxShadow: isCriticalPath
          ? `0 0 20px ${borderColor}40, 0 0 40px ${borderColor}20`
          : "0 4px 12px hsl(var(--shadow-color, 0 0% 0%) / 0.15)",
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: borderColor }}
        />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {data.status}
        </span>
        {isBlocked && (
          <AlertTriangle className="w-3 h-3 text-destructive ml-auto" />
        )}
      </div>
      <p className="text-sm font-semibold text-foreground leading-tight mb-2 line-clamp-2">
        {data.label}
      </p>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="capitalize">{data.priority}</span>
        <span className="capitalize">{data.category}</span>
      </div>
      {data.delayCost > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-warning font-medium">
          <DollarSign className="w-3 h-3" />
          {data.delayCost.toLocaleString("de-DE")} € Verzögerung
        </div>
      )}
      {data.cascadeCount > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-destructive font-medium">
          <GitBranch className="w-3 h-3" />
          {data.cascadeCount} Folgeentscheidung{data.cascadeCount > 1 ? "en" : ""} betroffen
        </div>
      )}
    </div>
  );
};

const nodeTypes = { decision: DecisionNode };

const edgeTypeStyles: Record<string, any> = {
  blocks: { stroke: "#ef4444", strokeWidth: 2, animated: true },
  influences: { stroke: "#eab308", strokeWidth: 1.5, strokeDasharray: "5 5" },
  requires: { stroke: "#3b82f6", strokeWidth: 1.5 },
};

const DecisionGraph = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [cascadeInfo, setCascadeInfo] = useState<{ count: number; cost: number; chain: string[] } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [decRes, depRes, teamRes] = await Promise.all([
        supabase.from("decisions").select("*").order("created_at"),
        supabase.from("decision_dependencies").select("*"),
        supabase.from("teams").select("id, hourly_rate"),
      ]);

      const decs = decRes.data || [];
      const deps = depRes.data || [];
      const teams = teamRes.data || [];
      const teamRateMap = Object.fromEntries(teams.map((t) => [t.id, t.hourly_rate || 75]));

      setDecisions(decs);
      setDependencies(deps);

      // Build adjacency for cascade calculation
      const adjForward: Record<string, string[]> = {};
      deps.forEach((d) => {
        if (!adjForward[d.source_decision_id]) adjForward[d.source_decision_id] = [];
        adjForward[d.source_decision_id].push(d.target_decision_id);
      });

      const blockedBy = new Set(deps.filter(d => d.dependency_type === "blocks").map(d => d.target_decision_id));

      // Cascade calculation: BFS from each node
      const getCascade = (id: string): { count: number; ids: string[] } => {
        const visited = new Set<string>();
        const queue = [id];
        while (queue.length > 0) {
          const current = queue.shift()!;
          const children = adjForward[current] || [];
          for (const child of children) {
            if (!visited.has(child) && child !== id) {
              visited.add(child);
              queue.push(child);
            }
          }
        }
        return { count: visited.size, ids: Array.from(visited) };
      };

      // Calculate delay cost per decision
      const getDelayCost = (dec: any) => {
        if (dec.status === "implemented" || dec.status === "rejected") return 0;
        const daysOpen = Math.max(1, Math.floor((Date.now() - new Date(dec.created_at).getTime()) / 86400000));
        const rate = dec.team_id ? (teamRateMap[dec.team_id] || 75) : 75;
        return daysOpen * 2 * 2 * rate;
      };

      // Layout: Dagre-style simple layering
      const positioned = layoutNodes(decs, deps);

      const graphNodes: Node[] = decs.map((dec, i) => {
        const cascade = getCascade(dec.id);
        const pos = positioned[dec.id] || { x: (i % 5) * 280, y: Math.floor(i / 5) * 200 };
        return {
          id: dec.id,
          type: "decision",
          position: pos,
          data: {
            label: dec.title,
            status: dec.status,
            priority: dec.priority,
            category: dec.category,
            delayCost: getDelayCost(dec),
            cascadeCount: cascade.count,
            cascadeIds: cascade.ids,
            isBlocked: blockedBy.has(dec.id),
            decision: dec,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        };
      });

      const graphEdges: Edge[] = deps.map((dep) => ({
        id: dep.id,
        source: dep.source_decision_id,
        target: dep.target_decision_id,
        type: "default",
        animated: dep.dependency_type === "blocks",
        label: dep.dependency_type === "blocks" ? "blockiert" : dep.dependency_type === "requires" ? "benötigt" : "beeinflusst",
        labelStyle: { fontSize: 10, fill: "#9ca3af" },
        style: edgeTypeStyles[dep.dependency_type] || edgeTypeStyles.influences,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeTypeStyles[dep.dependency_type]?.stroke || "#eab308",
        },
      }));

      setNodes(graphNodes);
      setEdges(graphEdges);
    };

    fetchData();
  }, []);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const nodeData = node.data as any;
    setSelectedNode(nodeData);
    if ((nodeData.cascadeCount as number) > 0) {
      const cascadeDecisions = decisions.filter((d) => (nodeData.cascadeIds as string[]).includes(d.id));
      const totalCost = cascadeDecisions.reduce((sum, d) => {
        const days = Math.max(1, Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000));
        return sum + days * 2 * 2 * 75;
      }, 0);
      setCascadeInfo({
        count: nodeData.cascadeCount as number,
        cost: totalCost + ((nodeData.delayCost as number) || 0),
        chain: cascadeDecisions.map((d) => d.title),
      });
    } else {
      setCascadeInfo(null);
    }
  }, [decisions]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Netzwerk</p>
          <h1 className="font-display text-xl font-bold">Decision Graph</h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
              <span className="capitalize text-muted-foreground">{status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="hsl(215 19% 25%)" gap={24} size={1} />
          <Controls
            className="!bg-card !border-border !rounded-lg !shadow-lg"
            style={{ button: { background: "hsl(217 32% 17%)", color: "white", borderColor: "hsl(215 19% 34%)" } } as any}
          />
          <MiniMap
            className="!bg-card/80 !border-border !rounded-lg"
            nodeColor={(n) => statusColors[n.data?.status as string] || "#6b7280"}
            maskColor="hsl(222 47% 11% / 0.8)"
          />

          {/* Cascade Info Panel */}
          {selectedNode && (
            <Panel position="top-right">
              <div className="glass-card p-4 max-w-xs space-y-3">
                <h3 className="font-display font-semibold text-sm">{selectedNode.label}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: statusColors[selectedNode.status] }}
                  />
                  <span className="capitalize">{selectedNode.status}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="capitalize">{selectedNode.priority}</span>
                </div>

                {selectedNode.delayCost > 0 && (
                  <div className="flex items-center gap-2 text-warning text-xs font-medium p-2 rounded-lg bg-warning/10">
                    <DollarSign className="w-3.5 h-3.5" />
                    {selectedNode.delayCost.toLocaleString("de-DE")} € direkte Verzögerungskosten
                  </div>
                )}

                {cascadeInfo && (
                  <div className="space-y-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive text-xs font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Kaskaden-Analyse
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Diese Verzögerung beeinflusst{" "}
                      <span className="text-destructive font-bold">{cascadeInfo.count} Folgeentscheidungen</span>
                    </p>
                    <p className="text-xs font-medium text-destructive">
                      Gesamtkosten der Kette: {cascadeInfo.cost.toLocaleString("de-DE")} €
                    </p>
                    <div className="space-y-1 mt-1">
                      {cascadeInfo.chain.slice(0, 5).map((title, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground truncate">
                          → {title}
                        </p>
                      ))}
                      {cascadeInfo.chain.length > 5 && (
                        <p className="text-[10px] text-muted-foreground">
                          ... und {cascadeInfo.chain.length - 5} weitere
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {selectedNode.isBlocked && (
                  <div className="flex items-center gap-2 text-destructive text-xs p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Blockiert durch andere Entscheidung
                  </div>
                )}

                {!cascadeInfo && !selectedNode.isBlocked && selectedNode.delayCost === 0 && (
                  <div className="flex items-center gap-2 text-success text-xs p-2 rounded-lg bg-success/10">
                    <Info className="w-3.5 h-3.5" />
                    Keine Abhängigkeiten oder Risiken
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Legend */}
          <Panel position="bottom-left">
            <div className="glass-card p-3 space-y-2 text-[10px]">
              <p className="font-semibold text-xs mb-1">Verbindungstypen</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-destructive rounded" />
                <span className="text-muted-foreground">Blockiert (animiert)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-warning rounded" style={{ borderTop: "1px dashed" }} />
                <span className="text-muted-foreground">Beeinflusst</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-primary rounded" />
                <span className="text-muted-foreground">Benötigt</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {decisions.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="font-display text-xl font-semibold mb-2 text-muted-foreground">Noch keine Entscheidungen</h3>
            <p className="text-sm text-muted-foreground">Erstelle Entscheidungen und verknüpfe sie, um den Graph zu sehen.</p>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

// Simple hierarchical layout algorithm
function layoutNodes(decisions: any[], deps: any[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  if (decisions.length === 0) return positions;

  // If no dependencies, use a grid layout
  if (deps.length === 0) {
    const cols = Math.ceil(Math.sqrt(decisions.length));
    const xGap = 300;
    const yGap = 200;
    decisions.forEach((d, i) => {
      positions[d.id] = {
        x: (i % cols) * xGap,
        y: Math.floor(i / cols) * yGap,
      };
    });
    return positions;
  }

  // Build incoming edge counts
  const incoming: Record<string, number> = {};
  const outgoing: Record<string, string[]> = {};
  const connectedIds = new Set<string>();

  decisions.forEach((d) => {
    incoming[d.id] = 0;
    outgoing[d.id] = [];
  });
  deps.forEach((dep) => {
    if (incoming[dep.target_decision_id] !== undefined) {
      incoming[dep.target_decision_id]++;
    }
    if (outgoing[dep.source_decision_id]) {
      outgoing[dep.source_decision_id].push(dep.target_decision_id);
    }
    connectedIds.add(dep.source_decision_id);
    connectedIds.add(dep.target_decision_id);
  });

  // Separate connected vs isolated nodes
  const connected = decisions.filter(d => connectedIds.has(d.id));
  const isolated = decisions.filter(d => !connectedIds.has(d.id));

  // Topological layering for connected nodes
  const layers: string[][] = [];
  const assigned = new Set<string>();
  let remaining = connected.map((d) => d.id);

  while (remaining.length > 0) {
    const layer = remaining.filter(
      (id) =>
        !assigned.has(id) &&
        deps
          .filter((d) => d.target_decision_id === id)
          .every((d) => assigned.has(d.source_decision_id))
    );

    if (layer.length === 0) {
      layers.push(remaining.filter((id) => !assigned.has(id)));
      break;
    }

    layers.push(layer);
    layer.forEach((id) => assigned.add(id));
    remaining = remaining.filter((id) => !assigned.has(id));
  }

  // Position connected layers
  const xGap = 320;
  const yGap = 160;

  layers.forEach((layer, li) => {
    const yOffset = -(layer.length - 1) * yGap / 2;
    layer.forEach((id, ni) => {
      positions[id] = {
        x: li * xGap,
        y: yOffset + ni * yGap,
      };
    });
  });

  // Position isolated nodes in a grid below the graph
  if (isolated.length > 0) {
    const maxLayerY = Math.max(0, ...Object.values(positions).map(p => p.y));
    const gridStartY = maxLayerY + yGap * 2;
    const cols = Math.min(4, Math.ceil(Math.sqrt(isolated.length)));
    isolated.forEach((d, i) => {
      positions[d.id] = {
        x: (i % cols) * 280,
        y: gridStartY + Math.floor(i / cols) * 180,
      };
    });
  }

  return positions;
}

export default DecisionGraph;

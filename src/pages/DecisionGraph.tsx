import { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import AppLayout from "@/components/layout/AppLayout";
import { AlertTriangle, DollarSign, GitBranch, Info } from "lucide-react";
import PageHelpButton from "@/components/shared/PageHelpButton";
import { useDecisions, useDependencies, useTeams } from "@/hooks/useDecisions";
import { useTranslatedLabels } from "@/lib/labels";

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
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: borderColor }} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {data.statusLabel}
        </span>
        {isBlocked && <AlertTriangle className="w-3 h-3 text-destructive ml-auto" />}
      </div>
      <p className="text-sm font-semibold text-foreground leading-tight mb-2 line-clamp-2">{data.label}</p>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="capitalize">{data.priorityLabel}</span>
        <span className="capitalize">{data.categoryLabel}</span>
      </div>
      {data.delayCost > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-warning font-medium">
          <DollarSign className="w-3 h-3" />
          {data.delayCostFormatted}
        </div>
      )}
      {data.cascadeCount > 0 && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-destructive font-medium">
          <GitBranch className="w-3 h-3" />
          {data.cascadeLabel}
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
  const { t } = useTranslation();
  const tl = useTranslatedLabels(t);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [cascadeInfo, setCascadeInfo] = useState<{ count: number; cost: number; chain: string[] } | null>(null);

  const { data: decisions = [], isLoading: decLoading } = useDecisions();
  const { data: allDeps = [], isLoading: depLoading } = useDependencies();
  const { data: teams = [], isLoading: teamLoading } = useTeams();

  const decIds = useMemo(() => new Set(decisions.map(d => d.id)), [decisions]);
  const deps = useMemo(() => allDeps.filter(d => d.source_decision_id && d.target_decision_id && decIds.has(d.source_decision_id) && decIds.has(d.target_decision_id)), [allDeps, decIds]);

  const edgeLabelMap: Record<string, string> = useMemo(() => ({
    blocks: t("graph.blocks"),
    requires: t("graph.requires"),
    influences: t("graph.influences"),
  }), [t]);

  useEffect(() => {
    if (decLoading || depLoading || teamLoading || decisions.length === 0) return;

    const teamRateMap = Object.fromEntries(teams.map((tm) => [tm.id, tm.hourly_rate || 75]));

    const adjForward: Record<string, string[]> = {};
    deps.forEach((d) => {
      if (!adjForward[d.source_decision_id]) adjForward[d.source_decision_id] = [];
      adjForward[d.source_decision_id].push(d.target_decision_id);
    });

    const blockedBy = new Set(deps.filter(d => d.dependency_type === "blocks").map(d => d.target_decision_id));

    const getCascade = (id: string): { count: number; ids: string[] } => {
      const visited = new Set<string>();
      const queue = [id];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = adjForward[current] || [];
        for (const child of children) {
          if (!visited.has(child) && child !== id) { visited.add(child); queue.push(child); }
        }
      }
      return { count: visited.size, ids: Array.from(visited) };
    };

    const getDelayCost = (dec: any) => {
      if (dec.status === "implemented" || dec.status === "rejected") return 0;
      const daysOpen = Math.max(1, Math.floor((Date.now() - new Date(dec.created_at).getTime()) / 86400000));
      const rate = dec.team_id ? (teamRateMap[dec.team_id] || 75) : 75;
      return daysOpen * 2 * 2 * rate;
    };

    const positioned = layoutNodes(decisions, deps);

    const graphNodes: Node[] = decisions.map((dec, i) => {
      const cascade = getCascade(dec.id);
      const pos = positioned[dec.id] || { x: (i % 5) * 280, y: Math.floor(i / 5) * 200 };
      const delayCost = getDelayCost(dec);
      return {
        id: dec.id,
        type: "decision",
        position: pos,
        data: {
          label: dec.title,
          status: dec.status,
          priority: dec.priority,
          category: dec.category,
          delayCost,
          delayCostFormatted: t("graph.delayCost", { cost: delayCost.toLocaleString("de-DE") }),
          cascadeCount: cascade.count,
          cascadeIds: cascade.ids,
          cascadeLabel: t("graph.cascadeAffected", { count: cascade.count }),
          isBlocked: blockedBy.has(dec.id),
          statusLabel: tl.statusLabels[dec.status] || dec.status,
          priorityLabel: tl.priorityLabels[dec.priority] || dec.priority,
          categoryLabel: tl.categoryLabels[dec.category] || dec.category,
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
      label: edgeLabelMap[dep.dependency_type] || dep.dependency_type,
      labelStyle: { fontSize: 10, fill: "#9ca3af" },
      style: edgeTypeStyles[dep.dependency_type] || edgeTypeStyles.influences,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeTypeStyles[dep.dependency_type]?.stroke || "#eab308" },
    }));

    setNodes(graphNodes);
    setEdges(graphEdges);
  }, [decLoading, depLoading, teamLoading, decisions, deps, teams, t, tl, edgeLabelMap]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const nodeData = node.data as any;
    setSelectedNode(nodeData);
    if ((nodeData.cascadeCount as number) > 0) {
      const cascadeDecisions = decisions.filter((d) => (nodeData.cascadeIds as string[]).includes(d.id));
      const totalCost = cascadeDecisions.reduce((sum, d) => {
        const days = Math.max(1, Math.floor((Date.now() - new Date(d.created_at).getTime()) / 86400000));
        return sum + days * 2 * 2 * 75;
      }, 0);
      setCascadeInfo({ count: nodeData.cascadeCount as number, cost: totalCost + ((nodeData.delayCost as number) || 0), chain: cascadeDecisions.map((d) => d.title) });
    } else {
      setCascadeInfo(null);
    }
  }, [decisions]);

  const statusLegend = useMemo(() => [
    ["draft", tl.statusLabels["draft"]],
    ["review", tl.statusLabels["review"]],
    ["approved", tl.statusLabels["approved"]],
    ["implemented", tl.statusLabels["implemented"]],
    ["rejected", tl.statusLabels["rejected"]],
  ], [tl]);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">{t("graph.network")}</p>
          <h1 className="font-display text-xl font-bold">{t("graph.title")}</h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <PageHelpButton title={t("graph.title")} description={t("graph.helpDesc")} />
          {statusLegend.map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[status] }} />
              <span className="text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative rounded-lg border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {decisions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <GitBranch className="w-8 h-8 text-primary opacity-60" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{t("graph.emptyTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-6">{t("graph.emptyDesc")}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: GitBranch, label: t("graph.dependencies"), desc: t("graph.seeDeps") },
                  { icon: AlertTriangle, label: t("graph.criticalPaths"), desc: t("graph.findBottlenecks") },
                  { icon: DollarSign, label: t("graph.cascadeCosts"), desc: t("graph.analyzeImpact") },
                ].map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <f.icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                    <p className="text-xs font-semibold">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick} nodeTypes={nodeTypes}
            fitView minZoom={0.3} maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="hsl(var(--border))" gap={24} size={1} />
            <Controls className="!bg-card !border-border !rounded-lg !shadow-lg" style={{ button: { background: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" } } as any} />
            <MiniMap className="!bg-card/80 !border-border !rounded-lg" nodeColor={(n) => statusColors[n.data?.status as string] || "#6b7280"} maskColor="hsl(var(--background) / 0.8)" />

            {selectedNode && (
              <Panel position="top-right">
                <div className="rounded-lg border border-border bg-card p-4 max-w-xs space-y-3 shadow-lg">
                  <h3 className="font-display font-semibold text-sm">{selectedNode.label}</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColors[selectedNode.status] }} />
                    <span>{selectedNode.statusLabel}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>{selectedNode.priorityLabel}</span>
                  </div>
                  {selectedNode.delayCost > 0 && (
                    <div className="flex items-center gap-2 text-warning text-xs font-medium p-2 rounded-lg bg-warning/10">
                      <DollarSign className="w-3.5 h-3.5" />
                      {t("graph.directDelayCost", { cost: selectedNode.delayCost.toLocaleString("de-DE") })}
                    </div>
                  )}
                  {cascadeInfo && (
                    <div className="space-y-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <div className="flex items-center gap-2 text-destructive text-xs font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t("graph.cascadeAnalysis")}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("graph.cascadeInfluence")}{" "}
                        <span className="text-destructive font-bold">{t("graph.cascadeFollowUp", { count: cascadeInfo.count })}</span>
                      </p>
                      <p className="text-xs font-medium text-destructive">
                        {t("graph.chainCost", { cost: cascadeInfo.cost.toLocaleString("de-DE") })}
                      </p>
                      <div className="space-y-1 mt-1">
                        {cascadeInfo.chain.slice(0, 5).map((title, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground truncate">→ {title}</p>
                        ))}
                        {cascadeInfo.chain.length > 5 && (
                          <p className="text-[10px] text-muted-foreground">{t("graph.andMore", { count: cascadeInfo.chain.length - 5 })}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {selectedNode.isBlocked && (
                    <div className="flex items-center gap-2 text-destructive text-xs p-2 rounded-lg bg-destructive/10">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t("graph.blockedBy")}
                    </div>
                  )}
                  {!cascadeInfo && !selectedNode.isBlocked && selectedNode.delayCost === 0 && (
                    <div className="flex items-center gap-2 text-success text-xs p-2 rounded-lg bg-success/10">
                      <Info className="w-3.5 h-3.5" />
                      {t("graph.noDepsOrRisks")}
                    </div>
                  )}
                </div>
              </Panel>
            )}

            <Panel position="bottom-left">
              <div className="rounded-lg border border-border bg-card p-3 space-y-2 text-[10px] shadow-lg">
                <p className="font-semibold text-xs mb-1">{t("graph.connectionTypes")}</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-destructive rounded" />
                  <span className="text-muted-foreground">{t("graph.blocksAnimated")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-warning rounded" style={{ borderTop: "1px dashed" }} />
                  <span className="text-muted-foreground">{t("graph.influencesLabel")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-primary rounded" />
                  <span className="text-muted-foreground">{t("graph.requiresLabel")}</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>
    </AppLayout>
  );
};

// Simple hierarchical layout algorithm
function layoutNodes(decisions: any[], deps: any[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  if (decisions.length === 0) return positions;

  if (deps.length === 0) {
    const cols = Math.ceil(Math.sqrt(decisions.length));
    const xGap = 300;
    const yGap = 200;
    decisions.forEach((d, i) => {
      positions[d.id] = { x: (i % cols) * xGap, y: Math.floor(i / cols) * yGap };
    });
    return positions;
  }

  const incoming: Record<string, number> = {};
  const outgoing: Record<string, string[]> = {};
  const connectedIds = new Set<string>();

  decisions.forEach((d) => { incoming[d.id] = 0; outgoing[d.id] = []; });
  deps.forEach((dep) => {
    if (incoming[dep.target_decision_id] !== undefined) incoming[dep.target_decision_id]++;
    if (outgoing[dep.source_decision_id]) outgoing[dep.source_decision_id].push(dep.target_decision_id);
    connectedIds.add(dep.source_decision_id);
    connectedIds.add(dep.target_decision_id);
  });

  const layers: string[][] = [];
  const assigned = new Set<string>();
  const queue = decisions.filter(d => incoming[d.id] === 0 && connectedIds.has(d.id)).map(d => d.id);
  if (queue.length === 0) {
    const maxId = Object.entries(incoming).reduce((a, b) => a[1] <= b[1] ? a : b)[0];
    queue.push(maxId);
  }

  while (queue.length > 0) {
    const layer = [...queue];
    layers.push(layer);
    layer.forEach(id => assigned.add(id));
    queue.length = 0;
    for (const id of layer) {
      for (const child of (outgoing[id] || [])) {
        if (!assigned.has(child) && !queue.includes(child)) queue.push(child);
      }
    }
  }

  const xGap = 320;
  const yGap = 180;
  layers.forEach((layer, li) => {
    const yStart = -(layer.length - 1) * yGap / 2;
    layer.forEach((id, ni) => { positions[id] = { x: li * xGap, y: yStart + ni * yGap }; });
  });

  const unassigned = decisions.filter(d => !assigned.has(d.id));
  const lastX = (layers.length) * xGap;
  const cols = Math.max(3, Math.ceil(Math.sqrt(unassigned.length)));
  unassigned.forEach((d, i) => {
    positions[d.id] = { x: lastX + (i % cols) * 280, y: Math.floor(i / cols) * yGap };
  });

  return positions;
}

export default DecisionGraph;

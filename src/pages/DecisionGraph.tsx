import { useState, useCallback, useMemo, useEffect } from "react";
import { formatNumber } from "@/lib/formatters";
import EmptyAnalysisState from "@/components/shared/EmptyAnalysisState";
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
import PageHeader from "@/components/shared/PageHeader";
import { useDecisions, useDependencies, useTeams } from "@/hooks/useDecisions";
import { useTranslatedLabels } from "@/lib/labels";

const statusColors: Record<string, string> = {
  draft: "hsl(var(--muted-foreground))",
  review: "hsl(var(--warning))",
  approved: "hsl(var(--success))",
  implemented: "hsl(var(--primary))",
  rejected: "hsl(var(--destructive))",
};

// Priority no longer affects node size — fixed at 140×80

const DecisionNode = ({ data }: { data: any }) => {
  const borderColor = statusColors[data.status] || "hsl(var(--muted-foreground))";

  return (
    <div
      className="rounded-lg p-2 cursor-pointer transition-all hover:scale-105 bg-card text-card-foreground group relative"
      style={{
        border: `2px solid ${borderColor}`,
        width: 140,
        maxHeight: 80,
        boxShadow: "0 2px 8px hsl(var(--shadow-color, 0 0% 0%) / 0.1)",
        overflow: "hidden",
      }}
      title={`${data.statusLabel} · ${data.priorityLabel} · ${data.categoryLabel}${data.ownerName ? ` · ${data.ownerName}` : ""}${data.cascadeCount > 0 ? ` · ${data.cascadeLabel}` : ""}`}
    >
      <span
        className="inline-block text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0 rounded mb-1"
        style={{ background: `${borderColor}20`, color: borderColor }}
      >
        {data.statusLabel}
      </span>
      <p className="text-xs font-bold text-foreground leading-tight line-clamp-2">{data.label}</p>
      {data.delayCost > 0 && (
        <p className="text-[9px] text-destructive font-medium mt-0.5 truncate">{data.delayCostFormatted}</p>
      )}
    </div>
  );
};

const nodeTypes = { decision: DecisionNode };

const edgeTypeStyles: Record<string, any> = {
  blocks: { stroke: "hsl(var(--destructive))", strokeWidth: 2, animated: true },
  influences: { stroke: "hsl(var(--warning))", strokeWidth: 1.5 },
  requires: { stroke: "hsl(var(--primary))", strokeWidth: 1.5 },
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
    console.log("[DecisionGraph] decisions:", decisions.length, "deps:", deps.length, "allDeps:", allDeps.length, "loading:", decLoading, depLoading, teamLoading);
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
          delayCostFormatted: t("graph.delayCost", { cost: formatNumber(delayCost) }),
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
      source: dep.source_decision_id as string,
      target: dep.target_decision_id as string,
      type: "default",
      animated: dep.dependency_type === "blocks",
      label: edgeLabelMap[dep.dependency_type] || dep.dependency_type,
      labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
      style: edgeTypeStyles[dep.dependency_type] || edgeTypeStyles.influences,
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeTypeStyles[dep.dependency_type]?.stroke || "hsl(var(--warning))" },
    }));

    console.log("[DecisionGraph] graphNodes:", graphNodes.length, "graphEdges:", graphEdges.length, "sample edge:", graphEdges[0]);

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
      <PageHeader
        title={t("graph.title")}
        subtitle={t("graph.network")}
        role="intelligence"
        help={{ title: t("graph.title"), description: t("graph.helpDesc") }}
        secondaryActions={
          <div className="flex items-center gap-4 text-xs">
            {statusLegend.map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[status] }} />
                <span className="text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        }
      />

      <div className="relative rounded-lg border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {decisions.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyAnalysisState
              icon={GitBranch}
              title={t("graph.emptyTitle")}
              description={t("graph.emptyDesc")}
              ctaLabel={t("emptyState.defaultCta")}
              ctaRoute="/decisions"
              hint={t("graph.emptyHint", { defaultValue: "Erstelle Entscheidungen und verknüpfe sie, um den Graphen zu sehen." })}
              features={[
                { icon: GitBranch, label: t("graph.dependencies"), desc: t("graph.seeDeps") },
                { icon: AlertTriangle, label: t("graph.criticalPaths"), desc: t("graph.findBottlenecks") },
                { icon: DollarSign, label: t("graph.cascadeCosts"), desc: t("graph.analyzeImpact") },
              ]}
            />
          </div>
        ) : (
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick} nodeTypes={nodeTypes}
            fitView fitViewOptions={{ padding: 0.15 }}
            minZoom={0.3} maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="hsl(var(--border))" gap={24} size={1} />
            <Controls className="!bg-card !border-border !rounded-lg !shadow-lg" style={{ button: { background: "hsl(var(--muted))", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" } } as any} />
            <MiniMap className="!bg-card/80 !border-border !rounded-lg" nodeColor={(n) => statusColors[n.data?.status as string] || "hsl(var(--muted-foreground))"} maskColor="hsl(var(--background) / 0.8)" />

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
                      {t("graph.directDelayCost", { cost: formatNumber(selectedNode.delayCost) })}
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
                        {t("graph.chainCost", { cost: formatNumber(cascadeInfo.cost) })}
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
                  <span className="text-muted-foreground">{t("graph.blocksLabel", "Blockiert")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-warning rounded" />
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

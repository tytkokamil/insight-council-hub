/**
 * ═══════════════════════════════════════════════════════════
 * CENTRALIZED KPI ENGINE
 * ═══════════════════════════════════════════════════════════
 * 
 * Single source of truth for all KPI calculations.
 * Reads config from DB (kpi_definitions, org_kpi_config, economic_config).
 * Falls back to sensible defaults when DB is unavailable.
 * 
 * Architecture:
 *   Layer 1 – Core Engine (immutable calculations)
 *   Layer 2 – Config Layer (org-specific thresholds from DB)
 *   Layer 3 – Adaptive Layer (relative benchmarks, future)
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInDays, subDays } from "date-fns";

// ─── Types ───────────────────────────────────────────────

export interface KpiDefinition {
  id: string;
  kpi_key: string;
  label: string;
  description: string | null;
  category: string;
  unit: string;
  positive_direction: "up" | "down";
  calculation_key: string;
  adaptive: boolean;
  default_threshold_critical: number | null;
  default_threshold_warning: number | null;
  default_threshold_good: number | null;
  sort_order: number;
}

export interface OrgKpiConfig {
  id: string;
  kpi_id: string;
  custom_threshold_critical: number | null;
  custom_threshold_warning: number | null;
  custom_threshold_good: number | null;
  custom_weight: number;
  benchmark_mode: "fixed" | "relative";
  enabled: boolean;
}

export interface EconomicConfigEntry {
  config_key: string;
  config_value: number;
  label: string;
  category: string;
}

export type Sentiment = "positive" | "neutral" | "warning" | "critical";

export interface ComputedKpi {
  key: string;
  label: string;
  value: number;
  formatted: string;
  unit: string;
  sentiment: Sentiment;
  positiveDirection: "up" | "down";
  thresholds: { critical: number; warning: number; good: number };
  weight: number;
  enabled: boolean;
}

// ─── Config Hooks ────────────────────────────────────────

export const useKpiDefinitions = () =>
  useQuery({
    queryKey: ["kpi-definitions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kpi_definitions")
        .select("*")
        .order("sort_order");
      return (data ?? []) as KpiDefinition[];
    },
    staleTime: 5 * 60_000,
  });

export const useOrgKpiConfig = () =>
  useQuery({
    queryKey: ["org-kpi-config"],
    queryFn: async () => {
      const { data } = await supabase.from("org_kpi_config").select("*");
      return (data ?? []) as OrgKpiConfig[];
    },
    staleTime: 5 * 60_000,
  });

export const useEconomicConfig = () =>
  useQuery({
    queryKey: ["economic-config"],
    queryFn: async () => {
      const { data } = await supabase.from("economic_config").select("*");
      return (data ?? []) as EconomicConfigEntry[];
    },
    staleTime: 5 * 60_000,
  });

// ─── Helpers ─────────────────────────────────────────────

const DEFAULT_MULTIPLIERS: Record<string, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

const DEFAULT_ECONOMIC: Record<string, number> = {
  default_hourly_rate: 75,
  working_hours_per_day: 8,
  multiplier_low: 1,
  multiplier_medium: 2,
  multiplier_high: 3,
  multiplier_critical: 4,
};

export function buildEconomicMap(entries: EconomicConfigEntry[]): Record<string, number> {
  const map = { ...DEFAULT_ECONOMIC };
  entries.forEach(e => { map[e.config_key] = e.config_value; });
  return map;
}

export function getPriorityMultiplier(priority: string, eco: Record<string, number>): number {
  return eco[`multiplier_${priority}`] ?? DEFAULT_MULTIPLIERS[priority] ?? 1.5;
}

function determineSentiment(
  value: number,
  direction: "up" | "down",
  thresholds: { critical: number; warning: number; good: number },
): Sentiment {
  if (direction === "up") {
    if (value >= thresholds.good) return "positive";
    if (value >= thresholds.warning) return "neutral";
    if (value >= thresholds.critical) return "warning";
    return "critical";
  } else {
    if (value <= thresholds.good) return "positive";
    if (value <= thresholds.warning) return "neutral";
    if (value <= thresholds.critical) return "warning";
    return "critical";
  }
}

function formatKpiValue(value: number, unit: string): string {
  if (unit === "€") {
    return value >= 1000 ? `€${Math.round(value / 1000)}k` : `€${Math.round(value)}`;
  }
  if (unit === "%") return `${Math.round(value)}%`;
  if (unit === "days" || unit === "/week") return `${Math.round(value * 10) / 10}`;
  return `${value}`;
}

// ─── Core Calculation Engine ─────────────────────────────

interface KpiInputData {
  decisions: any[];
  tasks: any[];
  risks: any[];
  reviews: any[];
  dependencies: any[];
  userId?: string;
  teamHourlyRate?: number;
}

function calculateKpi(
  key: string,
  data: KpiInputData,
  eco: Record<string, number>,
): number {
  const now = new Date();
  const active = data.decisions.filter(
    (d: any) => !["implemented", "rejected", "archived", "cancelled"].includes(d.status),
  );
  const implemented = data.decisions.filter(
    (d: any) => d.status === "implemented" && d.implemented_at,
  );

  switch (key) {
    case "decision_health": {
      const total = data.decisions.length;
      if (total === 0) return 100;
      const escalated = active.filter((d: any) => (d.escalation_level || 0) >= 1).length;
      const overdue = active.filter((d: any) => d.due_date && new Date(d.due_date) < now).length;
      const healthRatio = Math.max(0, 1 - escalated * 0.15 - overdue * 0.1);
      const successful = implemented.filter(
        (d: any) => d.outcome_type === "successful" || d.outcome_type === "partial",
      ).length;
      const successRatio = implemented.length > 0 ? successful / implemented.length : 0.5;
      return Math.round(Math.min(100, healthRatio * 50 + successRatio * 50));
    }

    case "risk_exposure": {
      const highRisk = active.filter((d: any) => (d.ai_risk_score || 0) >= 60).length;
      const openRisks = data.risks.filter((r: any) => r.status === "open").length;
      return openRisks + highRisk;
    }

    case "cost_of_delay": {
      const rate = data.teamHourlyRate ?? eco.default_hourly_rate;
      const hoursPerDay = eco.working_hours_per_day;
      const openDec = active.filter((d: any) => d.status === "draft" || d.status === "review");
      let total = 0;
      openDec.forEach((d: any) => {
        const days = differenceInDays(now, new Date(d.created_at));
        const mult = getPriorityMultiplier(d.priority, eco);
        // Formula: days × people(2) × hours(2) × rate × multiplier
        total += days * 2 * 2 * rate * mult;
      });
      return Math.round(total);
    }

    case "sla_compliance": {
      const withDue = active.filter((d: any) => d.due_date);
      if (withDue.length === 0) return 100;
      const onTrack = withDue.filter((d: any) => new Date(d.due_date) >= now).length;
      return Math.round((onTrack / withDue.length) * 100);
    }

    case "completion_rate": {
      if (data.decisions.length === 0) return 0;
      return Math.round((implemented.length / data.decisions.length) * 100);
    }

    case "avg_duration": {
      if (implemented.length === 0) return 0;
      const totalDays = implemented.reduce(
        (s: number, d: any) => s + differenceInDays(new Date(d.implemented_at), new Date(d.created_at)),
        0,
      );
      return Math.round(totalDays / implemented.length);
    }

    case "escalation_rate": {
      if (active.length === 0) return 0;
      const esc = active.filter((d: any) => (d.escalation_level || 0) >= 1).length;
      return Math.round((esc / active.length) * 100);
    }

    case "review_throughput": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return data.reviews.filter(
        (r: any) => r.reviewed_at && new Date(r.reviewed_at) >= monthStart,
      ).length;
    }

    case "rework_rate": {
      if (data.decisions.length === 0) return 0;
      const rejected = data.decisions.filter((d: any) => d.status === "rejected").length;
      return Math.round((rejected / data.decisions.length) * 100);
    }

    case "team_velocity": {
      const fourWeeksAgo = subDays(now, 28);
      const recent = implemented.filter(
        (d: any) => new Date(d.implemented_at) >= fourWeeksAgo,
      ).length;
      return Math.round((recent / 4) * 10) / 10;
    }

    case "automation_coverage": {
      const esc = active.filter((d: any) => (d.escalation_level || 0) >= 1).length;
      return esc; // placeholder – future: count rule-triggered decisions
    }

    case "blocked_ratio": {
      if (data.tasks.length === 0) return 0;
      const blocked = data.tasks.filter((t: any) => t.status === "blocked").length;
      return Math.round((blocked / data.tasks.length) * 100);
    }

    default:
      return 0;
  }
}

// ─── Main Hook ───────────────────────────────────────────

export interface UseKpiEngineResult {
  kpis: ComputedKpi[];
  kpiMap: Record<string, ComputedKpi>;
  economicConfig: Record<string, number>;
  loading: boolean;
  getKpi: (key: string) => ComputedKpi | undefined;
  getSentiment: (key: string) => Sentiment;
}

export function useKpiEngine(inputData: KpiInputData): UseKpiEngineResult {
  const { data: definitions = [], isLoading: loadingDefs } = useKpiDefinitions();
  const { data: orgConfig = [], isLoading: loadingOrg } = useOrgKpiConfig();
  const { data: ecoEntries = [], isLoading: loadingEco } = useEconomicConfig();

  const loading = loadingDefs || loadingOrg || loadingEco;

  const economicConfig = useMemo(() => buildEconomicMap(ecoEntries), [ecoEntries]);

  const orgConfigMap = useMemo(() => {
    const map: Record<string, OrgKpiConfig> = {};
    orgConfig.forEach(c => { map[c.kpi_id] = c; });
    return map;
  }, [orgConfig]);

  const kpis = useMemo<ComputedKpi[]>(() => {
    if (definitions.length === 0) return [];

    return definitions.map(def => {
      const override = orgConfigMap[def.id];
      const enabled = override?.enabled ?? true;

      const thresholds = {
        critical: override?.custom_threshold_critical ?? def.default_threshold_critical ?? 0,
        warning: override?.custom_threshold_warning ?? def.default_threshold_warning ?? 50,
        good: override?.custom_threshold_good ?? def.default_threshold_good ?? 80,
      };

      const value = calculateKpi(def.calculation_key, inputData, economicConfig);
      const sentiment = determineSentiment(value, def.positive_direction as "up" | "down", thresholds);

      return {
        key: def.kpi_key,
        label: def.label,
        value,
        formatted: formatKpiValue(value, def.unit),
        unit: def.unit,
        sentiment,
        positiveDirection: def.positive_direction as "up" | "down",
        thresholds,
        weight: override?.custom_weight ?? 1.0,
        enabled,
      };
    });
  }, [definitions, orgConfigMap, inputData, economicConfig]);

  const kpiMap = useMemo(() => {
    const map: Record<string, ComputedKpi> = {};
    kpis.forEach(k => { map[k.key] = k; });
    return map;
  }, [kpis]);

  const getKpi = (key: string) => kpiMap[key];
  const getSentiment = (key: string) => kpiMap[key]?.sentiment ?? "neutral";

  return { kpis, kpiMap, economicConfig, loading, getKpi, getSentiment };
}

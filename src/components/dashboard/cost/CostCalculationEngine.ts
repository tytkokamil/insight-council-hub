/**
 * Pure calculation logic for Cost-of-Delay.
 * Extracted from DecisionCostWidget for testability and reuse.
 */

export interface CodConfig {
  hourlyRate: number;
  persons: number;
  overhead: number;
}

export interface CostItem {
  title: string;
  days: number;
  cost: number;
  priority: string;
  rate: number;
  persons: number;
  overhead: number;
}

export const DEFAULT_COD_CONFIG: CodConfig = {
  hourlyRate: 85,
  persons: 3,
  overhead: 1.5,
};

/**
 * Calculate the Cost-of-Delay for a single decision.
 * Formula: daysOpen × hourlyRate × 8h × persons × overhead
 */
export const calculateCod = (daysOpen: number, config: CodConfig): number =>
  Math.round(daysOpen * config.hourlyRate * 8 * config.persons * config.overhead);

/**
 * Determine confidence level based on total cost.
 */
export type ConfidenceLevel = { label: string; color: string };

export const getConfidenceLevel = (
  totalCost: number,
  labels: { high: string; medium: string; low: string }
): ConfidenceLevel => {
  if (totalCost < 5_000) return { label: labels.high, color: "text-success" };
  if (totalCost < 20_000) return { label: labels.medium, color: "text-warning" };
  return { label: labels.low, color: "text-destructive" };
};

/**
 * Build a team config map from teams array, falling back to org defaults.
 */
export const buildTeamConfigMap = (
  teams: Array<{ id: string; hourly_rate?: number | null; cod_persons?: number | null; cod_overhead_factor?: number | null }>,
  orgDefaults: CodConfig
): Record<string, CodConfig> => {
  const map: Record<string, CodConfig> = {};
  teams.forEach((t) => {
    map[t.id] = {
      hourlyRate: t.hourly_rate ?? orgDefaults.hourlyRate,
      persons: t.cod_persons ?? orgDefaults.persons,
      overhead: Number(t.cod_overhead_factor) || orgDefaults.overhead,
    };
  });
  return map;
};

/**
 * Calculate costs for all open decisions.
 */
export const calculateAllCosts = (
  openDecisions: Array<{ title: string; created_at: string; team_id?: string | null; priority: string }>,
  teamConfigMap: Record<string, CodConfig>,
  orgDefaults: CodConfig
): { totalCost: number; costs: CostItem[] } => {
  const now = Date.now();
  let totalCost = 0;
  const costs: CostItem[] = [];

  openDecisions.forEach((d) => {
    const daysOpen = (now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const config = d.team_id && teamConfigMap[d.team_id] ? teamConfigMap[d.team_id] : orgDefaults;
    const cost = calculateCod(daysOpen, config);
    totalCost += cost;
    costs.push({
      title: d.title,
      days: Math.round(daysOpen),
      cost,
      priority: d.priority,
      rate: config.hourlyRate,
      persons: config.persons,
      overhead: config.overhead,
    });
  });

  return { totalCost, costs: costs.sort((a, b) => b.cost - a.cost) };
};

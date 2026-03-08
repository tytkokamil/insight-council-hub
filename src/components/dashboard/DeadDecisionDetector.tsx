import { useMemo } from "react";
import { motion } from "framer-motion";
import { Skull, ArrowRight, Archive } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";
import { formatCost } from "@/lib/formatters";
import { useTranslation } from "react-i18next";

interface Props {
  decisions: any[];
}

type ZombieLevel = "zombie" | "critical" | "dead";

interface ZombieDecision {
  id: string;
  title: string;
  daysInactive: number;
  level: ZombieLevel;
  weeklyCost: number;
}

const LEVEL_CONFIG: Record<ZombieLevel, { label: string; color: string; bgColor: string; minDays: number }> = {
  zombie: { label: "Zombie", color: "text-warning", bgColor: "bg-warning/10", minDays: 7 },
  critical: { label: "Kritisch", color: "text-accent-rose", bgColor: "bg-accent-rose/10", minDays: 14 },
  dead: { label: "Tot", color: "text-destructive", bgColor: "bg-destructive/10", minDays: 21 },
};

const DeadDecisionDetector = ({ decisions }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const now = new Date();

  const zombies = useMemo<ZombieDecision[]>(() => {
    const activeStatuses = ["draft", "proposed", "review", "approved"];
    return decisions
      .filter(d => activeStatuses.includes(d.status) && !d.deleted_at && !d.archived_at)
      .map(d => {
        const lastActivity = d.last_activity_at || d.updated_at;
        const daysInactive = differenceInDays(now, new Date(lastActivity));
        const weeklyCost = (d.cost_per_day || 0) * 7;
        let level: ZombieLevel | null = null;
        if (daysInactive >= 21) level = "dead";
        else if (daysInactive >= 14) level = "critical";
        else if (daysInactive >= 7) level = "zombie";
        return level ? { id: d.id, title: d.title, daysInactive, level, weeklyCost } : null;
      })
      .filter(Boolean) as ZombieDecision[];
  }, [decisions]);

  const totalWeeklyCost = zombies.reduce((s, z) => s + z.weeklyCost, 0);
  const sorted = [...zombies].sort((a, b) => b.daysInactive - a.daysInactive);
  const displayed = sorted.slice(0, 3);
  const remaining = sorted.length - 3;

  if (zombies.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-l-4 border-l-destructive bg-destructive/[0.03]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skull className="w-5 h-5 text-destructive" />
              <h3 className="text-sm font-semibold">
                🧟 {zombies.length} Zombie-Entscheidung{zombies.length > 1 ? "en" : ""} — still sterbend
              </h3>
            </div>
            {totalWeeklyCost > 0 && (
              <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                {formatCost(totalWeeklyCost)}€/Woche
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            Diese Entscheidungen hatten seit Tagen keine Aktivität, kosten aber weiterhin.
          </p>

          <div className="space-y-2">
            {displayed.map(z => {
              const cfg = LEVEL_CONFIG[z.level];
              return (
                <div
                  key={z.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-muted-foreground/70 truncate">
                        {z.title}
                      </span>
                      <Badge className={`${cfg.bgColor} ${cfg.color} border-0 text-[10px] px-1.5 py-0`}>
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Seit {z.daysInactive} Tagen inaktiv</span>
                      {z.weeklyCost > 0 && (
                        <span className="text-destructive font-medium">{formatCost(z.weeklyCost)}€/Woche</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs gap-1"
                    onClick={() => navigate(`/decisions/${z.id}`)}
                  >
                    Reaktivieren <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>

          {remaining > 0 && (
            <button
              onClick={() => navigate("/decisions?filter=zombie")}
              className="text-xs text-primary hover:underline mt-3 block"
            >
              +{remaining} weitere anzeigen
            </button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeadDecisionDetector;

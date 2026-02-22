import { motion } from "framer-motion";
import {
  ThumbsUp, ThumbsDown, Minus as MinusIcon, ArrowRight, AlertTriangle,
  Shield, TrendingUp, DollarSign, Target, Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { statusLabels, priorityLabels } from "@/lib/labels";
import { useNavigate } from "react-router-dom";
import { differenceInDays } from "date-fns";

interface Decision {
  id: string;
  title: string;
  description?: string | null;
  context?: string | null;
  status: string;
  priority: string;
  ai_risk_score?: number | null;
  ai_impact_score?: number | null;
  escalation_level?: number | null;
  due_date?: string | null;
  created_at: string;
  owner_id: string;
  created_by: string;
}

interface Blocker {
  id: string;
  title: string;
  status: string;
  type: "decision" | "task";
}

interface Props {
  decision: Decision;
  currentIndex: number;
  total: number;
  vote: "approve" | "reject" | "neutral" | undefined;
  onVote: (vote: "approve" | "reject" | "neutral") => void;
  onNext: () => void;
  profileMap: Record<string, string>;
  blockers: Blocker[];
  strategicGoal?: string;
  costOfDelay: number;
  notes: string;
  onNotesChange: (val: string) => void;
  noteConditions: string;
  onConditionsChange: (val: string) => void;
  noteFollowups: string;
  onFollowupsChange: (val: string) => void;
}

const DecisionReviewCard = ({
  decision, currentIndex, total, vote, onVote, onNext,
  profileMap, blockers, strategicGoal, costOfDelay,
  notes, onNotesChange, noteConditions, onConditionsChange,
  noteFollowups, onFollowupsChange,
}: Props) => {
  const navigate = useNavigate();
  const daysInStatus = differenceInDays(new Date(), new Date(decision.created_at));
  const isEscalated = (decision.escalation_level || 0) >= 1;
  const riskScore = decision.ai_risk_score || 0;
  const impactScore = decision.ai_impact_score || 0;

  const impactAfterApprove = vote === "approve"
    ? `Risiko −${Math.round(riskScore * 0.3)}% | Delay −${costOfDelay.toLocaleString("de-DE")}€`
    : null;

  return (
    <motion.div
      key={decision.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Progress badge */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="text-xs">
          {currentIndex + 1} / {total}
        </Badge>
        <div className="flex items-center gap-2">
          <Badge variant={decision.priority === "critical" ? "destructive" : "outline"} className="text-xs">
            {priorityLabels[decision.priority]}
          </Badge>
          {isEscalated && (
            <Badge variant="destructive" className="text-xs gap-1">
              <AlertTriangle className="w-3 h-3" /> Eskaliert
            </Badge>
          )}
        </div>
      </div>

      {/* Main card */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-1">{decision.title}</h2>
          <p className="text-sm text-muted-foreground mb-4">{decision.description || "Keine Beschreibung"}</p>

          {/* Strategic KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
              <p className="text-xs font-semibold">{statusLabels[decision.status]} ({daysInStatus}d)</p>
            </div>
            <div className={`p-2.5 rounded-lg border text-center ${riskScore >= 60 ? "bg-destructive/10 border-destructive/20" : "bg-muted/30 border-border"}`}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risiko</p>
              <p className={`text-xs font-semibold ${riskScore >= 60 ? "text-destructive" : ""}`}>{riskScore}%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/30 border border-border text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Impact</p>
              <p className="text-xs font-semibold">{impactScore}%</p>
            </div>
            <div className="p-2.5 rounded-lg bg-warning/10 border border-warning/20 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Delay-Kosten</p>
              <p className="text-xs font-semibold text-warning">{costOfDelay.toLocaleString("de-DE")}€/Wo</p>
            </div>
          </div>

          {/* Context */}
          {decision.context && (
            <div className="mb-4 p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-semibold mb-1">Kontext</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{decision.context}</p>
            </div>
          )}

          {/* Strategic Goal */}
          {strategicGoal && (
            <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-primary/5 border border-primary/20">
              <Target className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs">Strategisches Ziel: <strong>{strategicGoal}</strong></span>
            </div>
          )}

          {/* Owner */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Owner: {profileMap[decision.owner_id || decision.created_by] || "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Blockiert durch:
          </p>
          <div className="space-y-1">
            {blockers.map(b => (
              <div key={b.id} className="flex items-center gap-2 text-xs">
                <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
                <span>{b.title}</span>
                <Badge variant="outline" className="text-[9px]">
                  {b.type === "task" ? "Task" : "Decision"} · {statusLabels[b.status] || b.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voting */}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-sm font-medium">Abstimmung:</p>
        {([
          { value: "approve" as const, icon: ThumbsUp, label: "Genehmigen", color: "text-success hover:bg-success/10" },
          { value: "neutral" as const, icon: MinusIcon, label: "Zurückstellen", color: "text-warning hover:bg-warning/10" },
          { value: "reject" as const, icon: ThumbsDown, label: "Ablehnen", color: "text-destructive hover:bg-destructive/10" },
        ]).map(opt => (
          <Button
            key={opt.value}
            variant={vote === opt.value ? "default" : "outline"}
            size="sm"
            className={`gap-1.5 ${vote !== opt.value ? opt.color : ""}`}
            onClick={() => onVote(opt.value)}
          >
            <opt.icon className="w-3.5 h-3.5" /> {opt.label}
          </Button>
        ))}
      </div>

      {/* Impact after vote */}
      {impactAfterApprove && (
        <div className="mb-4 p-2.5 rounded-lg bg-success/10 border border-success/20">
          <p className="text-xs text-success font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Impact: {impactAfterApprove}
          </p>
        </div>
      )}

      {/* Structured Notes */}
      <div className="mb-6 space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Meeting-Notiz</label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            rows={2}
            placeholder="Anmerkungen, Entscheidungsbegründung..."
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Bedingungen</label>
            <textarea
              value={noteConditions}
              onChange={e => onConditionsChange(e.target.value)}
              rows={2}
              placeholder="z.B. Budgetlimit 500k, Review in Q3..."
              className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Follow-ups</label>
            <textarea
              value={noteFollowups}
              onChange={e => onFollowupsChange(e.target.value)}
              rows={2}
              placeholder="Verantwortliche, nächste Schritte..."
              className="flex min-h-[50px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => navigate(`/decisions/${decision.id}`)}>
          Details öffnen <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
        <Button onClick={onNext} className="gap-1.5">
          {currentIndex < total - 1 ? "Nächste" : "Zum Protokoll"} <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default DecisionReviewCard;

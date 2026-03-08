import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown, CreditCard, Receipt, ArrowRight, Sparkles, Check, Download,
  Calendar, Users, Brain, Shield, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const PLAN_DETAILS: Record<string, { label: string; price: string; color: string }> = {
  free: { label: "Free", price: "€0", color: "text-muted-foreground" },
  starter: { label: "Starter", price: "€49/Mo", color: "text-primary" },
  pro: { label: "Professional", price: "€149/Mo", color: "text-primary" },
  enterprise: { label: "Enterprise", price: "Individuell", color: "text-primary" },
};

const MOCK_INVOICES = [
  { id: "INV-2026-003", date: "01.03.2026", amount: "€149,00", status: "bezahlt" },
  { id: "INV-2026-002", date: "01.02.2026", amount: "€149,00", status: "bezahlt" },
  { id: "INV-2026-001", date: "01.01.2026", amount: "€149,00", status: "bezahlt" },
];

const BillingPanel = () => {
  const limits = useFreemiumLimits();
  const navigate = useNavigate();
  const planInfo = PLAN_DETAILS[limits.plan] || PLAN_DETAILS.free;

  const usageItems = [
    {
      label: "Entscheidungen",
      current: limits.decisionCount,
      max: limits.maxDecisions,
      icon: Brain,
    },
    {
      label: "Nutzer",
      current: 1, // would come from org member count
      max: limits.maxUsers,
      icon: Users,
    },
    {
      label: "Teams",
      current: 1,
      max: limits.maxTeams,
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <div className="settings-group">
        <h2>Aktueller Plan</h2>
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base">{planInfo.label}</span>
                <Badge variant="outline" className="text-[10px]">Aktiv</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{planInfo.price}</p>
            </div>
          </div>
          <Button
            variant={limits.isFree ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => navigate("/upgrade")}
          >
            {limits.isFree ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Upgraden
              </>
            ) : (
              <>
                Plan ändern
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>

        {/* Next billing info */}
        {!limits.isFree && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 px-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Nächste Abrechnung: 01.04.2026 · {planInfo.price}</span>
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="settings-group">
        <h2>Nutzung</h2>
        <div className="space-y-4">
          {usageItems.map((item) => {
            const pct = item.max ? Math.min(100, (item.current / item.max) * 100) : null;
            const isWarning = pct !== null && pct >= 80;
            const isLimit = pct !== null && pct >= 100;
            return (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </span>
                  <span className={cn("font-medium tabular-nums", isLimit && "text-destructive")}>
                    {item.current} / {item.max ?? "∞"}
                  </span>
                </div>
                {pct !== null && (
                  <Progress
                    value={pct}
                    className={cn("h-1.5", isLimit ? "[&>div]:bg-destructive" : isWarning ? "[&>div]:bg-warning" : "")}
                  />
                )}
                {isWarning && !isLimit && (
                  <p className="text-[11px] text-warning flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {Math.round(pct!)}% genutzt — Upgrade empfohlen
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Method */}
      <div className="settings-group">
        <h2>Zahlungsmethode</h2>
        {limits.isFree ? (
          <p className="text-sm text-muted-foreground">
            Im Free-Plan ist keine Zahlungsmethode erforderlich.
          </p>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                <p className="text-xs text-muted-foreground">Visa · Läuft ab 12/2027</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              Ändern
            </Button>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className="settings-group">
        <h2>Rechnungen</h2>
        {limits.isFree ? (
          <p className="text-sm text-muted-foreground">
            Keine Rechnungen im Free-Plan vorhanden.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Rechnung</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Datum</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Betrag</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-2.5 font-medium">{inv.id}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{inv.date}</td>
                    <td className="px-4 py-2.5 tabular-nums">{inv.amount}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-success/20">
                        <Check className="w-3 h-3 mr-1" />
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Download className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan comparison teaser */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5">
        <div>
          <p className="text-sm font-medium">Alle Pläne vergleichen</p>
          <p className="text-xs text-muted-foreground">Finde den passenden Plan für dein Team</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 text-primary" onClick={() => navigate("/upgrade")}>
          Pläne ansehen <ArrowRight className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default BillingPanel;

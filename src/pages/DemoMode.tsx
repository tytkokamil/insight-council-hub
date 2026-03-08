import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LayoutDashboard, FileText, BarChart3, ArrowRight, Play, Shield, Zap, Clock, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const DEMO_DECISIONS = [
  { id: 1, title: "Cloud-Migration AWS vs. Azure", status: "in_review", priority: "critical", daysOpen: 12, costPerDay: 2400, health: 45 },
  { id: 2, title: "Vendor-Evaluierung CRM-System", status: "draft", priority: "high", daysOpen: 8, costPerDay: 1800, health: 62 },
  { id: 3, title: "Hiring-Strategie Q3", status: "approved", priority: "medium", daysOpen: 3, costPerDay: 950, health: 88 },
  { id: 4, title: "DSGVO-Audit Maßnahmenplan", status: "in_review", priority: "high", daysOpen: 15, costPerDay: 3200, health: 32 },
  { id: 5, title: "Produktlaunch Feature X", status: "implemented", priority: "critical", daysOpen: 0, costPerDay: 0, health: 95 },
];

const DEMO_KPIS = {
  totalDecisions: 24,
  activeDecisions: 8,
  overdueDecisions: 3,
  avgDays: 6.2,
  implementedThisMonth: 5,
  totalCostOfDelay: 18_400,
};

type DemoTab = "dashboard" | "decisions" | "analytics";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  approved: "bg-primary/15 text-primary",
  implemented: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const priorityLabels: Record<string, string> = {
  critical: "Kritisch",
  high: "Hoch",
  medium: "Mittel",
};

const DemoMode = () => {
  const { t, i18n } = useTranslation();
  const isDE = i18n.language?.startsWith("de");
  const [tab, setTab] = useState<DemoTab>("dashboard");

  const tabs: { key: DemoTab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "decisions", label: isDE ? "Entscheidungen" : "Decisions", icon: FileText },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <>
      <Helmet>
        <title>Decivio Demo – {isDE ? "Interaktive Produktvorschau" : "Interactive Product Preview"}</title>
        <meta name="description" content={isDE ? "Erleben Sie Decivio ohne Registrierung. Interaktive Demo mit realistischen Business-Szenarien." : "Experience Decivio without registration. Interactive demo with realistic business scenarios."} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Demo Banner */}
        <div className="sticky top-0 z-50 bg-primary text-primary-foreground px-4 py-2.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span className="font-medium">{isDE ? "Demo-Modus" : "Demo Mode"}</span>
            <span className="hidden sm:inline text-primary-foreground/70">— {isDE ? "Keine echten Daten, keine Registrierung nötig" : "No real data, no registration required"}</span>
          </div>
          <Link to="/auth">
            <Button size="sm" variant="secondary" className="gap-1.5 h-7 text-xs">
              {isDE ? "Kostenlos starten" : "Start Free"}
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-6">
          {/* Tab bar */}
          <nav className="flex gap-1 border-b border-border/60 mb-6 pb-px">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative rounded-t-md ${
                  tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {tab === t.key && (
                  <motion.div
                    layoutId="demo-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Dashboard Tab */}
          {tab === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: isDE ? "Entscheidungen" : "Decisions", value: DEMO_KPIS.totalDecisions, icon: FileText },
                  { label: isDE ? "Aktiv" : "Active", value: DEMO_KPIS.activeDecisions, icon: Zap },
                  { label: isDE ? "Überfällig" : "Overdue", value: DEMO_KPIS.overdueDecisions, icon: AlertTriangle, alert: true },
                  { label: isDE ? "Ø Tage" : "Avg Days", value: DEMO_KPIS.avgDays, icon: Clock },
                  { label: isDE ? "Umgesetzt" : "Implemented", value: DEMO_KPIS.implementedThisMonth, icon: CheckCircle2 },
                  { label: "Cost of Delay", value: `€${(DEMO_KPIS.totalCostOfDelay / 1000).toFixed(1)}k`, icon: TrendingUp, alert: true },
                ].map((kpi, i) => (
                  <Card key={i} className="relative overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.alert ? "text-destructive" : "text-muted-foreground"}`} />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
                      </div>
                      <p className={`text-xl font-bold ${kpi.alert ? "text-destructive" : "text-foreground"}`}>{kpi.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isDE ? "Aktuelle Entscheidungen" : "Current Decisions"}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {DEMO_DECISIONS.filter(d => d.status !== "implemented").map((d) => (
                      <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-[10px] ${statusColors[d.status]}`}>
                              {d.status.replace("_", " ")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{d.daysOpen}d</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Progress value={d.health} className="w-16 h-1.5" />
                            <span className={`text-xs font-medium ${d.health < 50 ? "text-destructive" : d.health < 70 ? "text-yellow-600" : "text-emerald-600"}`}>{d.health}%</span>
                          </div>
                          <p className="text-[10px] text-destructive mt-0.5">€{d.costPerDay.toLocaleString()}/d</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Decisions Tab */}
          {tab === "decisions" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {DEMO_DECISIONS.map((d) => (
                <Card key={d.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{d.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className={statusColors[d.status]}>{d.status.replace("_", " ")}</Badge>
                        <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority]}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={d.health} className="w-20 h-1.5 mb-1" />
                      <p className="text-xs text-muted-foreground">Health: {d.health}%</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          )}

          {/* Analytics Tab */}
          {tab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-6 text-center">
                    <Shield className="w-8 h-8 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{isDE ? "Decision Quality Index" : "Decision Quality Index"}</h3>
                    <p className="text-4xl font-bold text-primary">78<span className="text-lg text-muted-foreground">/100</span></p>
                    <p className="text-xs text-muted-foreground mt-2">{isDE ? "+12 Punkte vs. letzter Monat" : "+12 points vs. last month"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto text-emerald-500 mb-3" />
                    <h3 className="font-semibold mb-1">{isDE ? "Velocity Score" : "Velocity Score"}</h3>
                    <p className="text-4xl font-bold text-emerald-600">6.2<span className="text-lg text-muted-foreground"> {isDE ? "Tage" : "days"}</span></p>
                    <p className="text-xs text-muted-foreground mt-2">{isDE ? "Ø Zeit bis zur Umsetzung" : "Avg time to implementation"}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {isDE ? "Vollständige Analytics mit KI-Insights, Heatmaps und Benchmarking verfügbar nach Registrierung." : "Full analytics with AI insights, heatmaps and benchmarking available after sign-up."}
                  </p>
                  <Link to="/auth">
                    <Button variant="hero" className="gap-1.5">
                      {isDE ? "Jetzt kostenlos starten" : "Start Free Now"}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CTA Footer */}
          <div className="mt-12 text-center pb-8">
            <p className="text-muted-foreground text-sm mb-4">
              {isDE ? "Überzeugt? Starten Sie in unter 2 Minuten." : "Convinced? Get started in under 2 minutes."}
            </p>
            <Link to="/auth">
              <Button variant="hero" size="xl" className="gap-2">
                {isDE ? "Kostenlos registrieren" : "Sign Up Free"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoMode;

import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, BarChart3, ArrowRight, Play, Shield, Zap, Clock, TrendingUp, AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { DEMO_DECISIONS as AUTO_D, DEMO_ORG as AUTO_O, DEMO_KPIS as AUTO_K } from "@/data/demo-automotive";
import { DEMO_DECISIONS as MASCH_D, DEMO_ORG as MASCH_O, DEMO_KPIS as MASCH_K } from "@/data/demo-maschinenbau";
import { DEMO_DECISIONS as PHARMA_D, DEMO_ORG as PHARMA_O, DEMO_KPIS as PHARMA_K } from "@/data/demo-pharma";
import { DEMO_DECISIONS as IT_D, DEMO_ORG as IT_O, DEMO_KPIS as IT_K } from "@/data/demo-it";
import { DEMO_DECISIONS as FIN_D, DEMO_ORG as FIN_O, DEMO_KPIS as FIN_K } from "@/data/demo-finance";

const INDUSTRIES: Record<string, { decisions: any[]; org: any; kpis: any }> = {
  automotive: { decisions: AUTO_D, org: AUTO_O, kpis: AUTO_K },
  maschinenbau: { decisions: MASCH_D, org: MASCH_O, kpis: MASCH_K },
  pharma: { decisions: PHARMA_D, org: PHARMA_O, kpis: PHARMA_K },
  it: { decisions: IT_D, org: IT_O, kpis: IT_K },
  finanzen: { decisions: FIN_D, org: FIN_O, kpis: FIN_K },
};

const INDUSTRY_PILLS = [
  { key: "automotive", label: "Automotive", icon: "🏭" },
  { key: "maschinenbau", label: "Maschinenbau", icon: "⚙️" },
  { key: "pharma", label: "Pharma", icon: "💊" },
  { key: "it", label: "IT", icon: "💻" },
  { key: "finanzen", label: "Finanzen", icon: "🏦" },
];

type DemoTab = "dashboard" | "decisions" | "analytics";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  approved: "bg-primary/15 text-primary",
  implemented: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
};

const statusLabels: Record<string, string> = { draft: "Entwurf", in_review: "In Prüfung", approved: "Genehmigt", implemented: "Umgesetzt" };
const priorityLabels: Record<string, string> = { critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" };

const DemoMode = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const industryParam = searchParams.get("industry") || "automotive";
  const [industry, setIndustry] = useState(INDUSTRIES[industryParam] ? industryParam : "automotive");
  const [tab, setTab] = useState<DemoTab>("dashboard");
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const { decisions: rawDecisions, org, kpis } = INDUSTRIES[industry];
  const decisions = useMemo(() => rawDecisions.map(d => ({ ...d, status: localStatuses[d.id] || d.status })), [rawDecisions, localStatuses]);

  const switchIndustry = (key: string) => {
    setIndustry(key);
    setLocalStatuses({});
    setSearchParams({ industry: key }, { replace: true });
  };

  const updateStatus = (id: string, newStatus: string) => {
    setLocalStatuses(prev => ({ ...prev, [id]: newStatus }));
  };

  const tabs: { key: DemoTab; label: string; icon: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "decisions", label: "Entscheidungen", icon: FileText },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const totalCod = decisions.filter(d => d.status !== "approved" && d.status !== "implemented").reduce((s, d) => s + d.costPerDay, 0);

  return (
    <>
      <Helmet>
        <title>Decivio Demo – Interaktive Produktvorschau | {org.industry}</title>
        <meta name="description" content={`Erleben Sie Decivio für ${org.industry} ohne Registrierung. Interaktive Demo mit realistischen Business-Szenarien.`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Demo Banner */}
        <div className="sticky top-0 z-50 px-4 py-2.5 flex items-center justify-between text-sm" style={{ background: "#F59E0B", color: "#1E293B" }}>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">Demo-Modus</span>
            <span className="hidden sm:inline opacity-70">— {org.name} ({org.industry})</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5">
            {INDUSTRY_PILLS.map(p => (
              <button
                key={p.key}
                onClick={() => switchIndustry(p.key)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${industry === p.key ? "bg-[#1E293B] text-white" : "bg-white/50 hover:bg-white/80 text-[#1E293B]"}`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>

          <Link to="/auth">
            <Button size="sm" className="gap-1.5 h-7 text-xs" style={{ background: "#1E3A5F", color: "white" }}>
              Mit eigenen Daten starten — kostenlos
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        {/* Mobile industry selector */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto px-4 py-2 bg-muted/30">
          {INDUSTRY_PILLS.map(p => (
            <button key={p.key} onClick={() => switchIndustry(p.key)} className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${industry === p.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-6">
          {/* CoD Ticker */}
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-destructive font-medium uppercase tracking-wider">Cost of Delay — diese Woche</p>
                <p className="text-3xl font-bold text-destructive tabular-nums mt-1">€{totalCod.toLocaleString("de-DE")}<span className="text-sm font-normal text-destructive/60">/Woche</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{decisions.filter(d => d.status !== "approved" && d.status !== "implemented").length} offene Entscheidungen</p>
                <p className="text-xs text-destructive font-medium">€{(totalCod * 52).toLocaleString("de-DE")}/Jahr</p>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <nav className="flex gap-1 border-b border-border/60 mb-6 pb-px">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative rounded-t-md ${tab === t.key ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-4 h-4" />
                {t.label}
                {tab === t.key && <motion.div layoutId="demo-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />}
              </button>
            ))}
          </nav>

          <AnimatePresence mode="wait">
            {/* Dashboard Tab */}
            {tab === "dashboard" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: "Entscheidungen", value: kpis.openDecisions + kpis.implementedThisMonth, icon: FileText },
                    { label: "Aktiv", value: kpis.openDecisions, icon: Zap },
                    { label: "Überfällig", value: kpis.overdue, icon: AlertTriangle, alert: true },
                    { label: "Ø Tage", value: kpis.avgDecisionDays, icon: Clock },
                    { label: "Quality Score", value: `${kpis.qualityScore}/100`, icon: Shield },
                    { label: "Velocity", value: `${kpis.velocityScore}/100`, icon: TrendingUp },
                  ].map((kpi, i) => (
                    <Card key={i}><CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <kpi.icon className={`w-3.5 h-3.5 ${kpi.alert ? "text-destructive" : "text-muted-foreground"}`} />
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
                      </div>
                      <p className={`text-xl font-bold ${kpi.alert ? "text-destructive" : "text-foreground"}`}>{kpi.value}</p>
                    </CardContent></Card>
                  ))}
                </div>

                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Aktuelle Entscheidungen</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border">
                      {decisions.filter(d => d.status !== "implemented").map(d => (
                        <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setTab("decisions")}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`text-[10px] ${statusColors[d.status]}`}>{statusLabels[d.status] || d.status}</Badge>
                              <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority]}</Badge>
                              <span className="text-[10px] text-muted-foreground">{d.daysOpen}d offen</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="flex items-center gap-1.5">
                              <Progress value={d.health} className="w-16 h-1.5" />
                              <span className={`text-xs font-medium ${d.health < 50 ? "text-destructive" : d.health < 70 ? "text-yellow-600" : "text-emerald-600"}`}>{d.health}%</span>
                            </div>
                            {d.costPerDay > 0 && <p className="text-[10px] text-destructive mt-0.5">€{d.costPerDay.toLocaleString("de-DE")}/Tag</p>}
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
              <motion.div key="dec" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {decisions.map(d => (
                  <Card key={d.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-sm font-semibold">{d.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={statusColors[d.status]}>{statusLabels[d.status] || d.status}</Badge>
                            <Badge variant="outline" className="text-[10px]">{priorityLabels[d.priority]}</Badge>
                            <Badge variant="outline" className="text-[10px]">{d.category}</Badge>
                          </div>
                        </div>
                        <div className="text-right shrink-0 space-y-1">
                          <Progress value={d.health} className="w-20 h-1.5" />
                          <p className="text-[10px] text-muted-foreground">Health: {d.health}%</p>
                          {d.costPerDay > 0 && <p className="text-[10px] text-destructive font-medium">€{d.costPerDay.toLocaleString("de-DE")}/Tag</p>}
                        </div>
                      </div>
                      {/* Status change buttons */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground mr-1">Status ändern:</span>
                        {["draft", "in_review", "approved", "implemented"].map(s => (
                          <button key={s} onClick={() => updateStatus(d.id, s)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${d.status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                            {statusLabels[s]}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Blocked action: New Decision */}
                <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
                  <CardContent className="p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-3">Im Demo-Modus können keine neuen Entscheidungen angelegt werden.</p>
                    <Link to="/auth">
                      <Button className="gap-1.5">Mit echten Daten starten <ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Analytics Tab */}
            {tab === "analytics" && (
              <motion.div key="ana" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card><CardContent className="p-6 text-center">
                    <Shield className="w-8 h-8 mx-auto text-primary mb-3" />
                    <h3 className="font-semibold mb-1">Decision Quality Index</h3>
                    <p className="text-4xl font-bold text-primary">{kpis.qualityScore}<span className="text-lg text-muted-foreground">/100</span></p>
                  </CardContent></Card>
                  <Card><CardContent className="p-6 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto text-emerald-500 mb-3" />
                    <h3 className="font-semibold mb-1">Velocity Score</h3>
                    <p className="text-4xl font-bold text-emerald-600">{kpis.velocityScore}<span className="text-lg text-muted-foreground">/100</span></p>
                  </CardContent></Card>
                  <Card><CardContent className="p-6 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto text-destructive mb-3" />
                    <h3 className="font-semibold mb-1">Cost of Delay</h3>
                    <p className="text-4xl font-bold text-destructive">€{totalCod.toLocaleString("de-DE")}<span className="text-lg text-muted-foreground">/Wo</span></p>
                  </CardContent></Card>
                </div>

                <Card className="border-dashed border-primary/30 bg-primary/[0.02]">
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground mb-4">Vollständige Analytics mit KI-Insights, Heatmaps und Benchmarking verfügbar nach Registrierung.</p>
                    <Link to="/auth">
                      <Button className="gap-1.5">Jetzt kostenlos starten <ArrowRight className="w-4 h-4" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA Footer */}
          <div className="mt-12 text-center pb-8">
            <p className="text-muted-foreground text-sm mb-4">Überzeugt? Starten Sie in unter 2 Minuten.</p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">Kostenlos registrieren <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default DemoMode;

import { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Eye, FileText, AlertTriangle, Clock, TrendingUp,
  Shield, Zap, Brain, ChevronRight, Users, Check, X as XIcon,
  BarChart3, Sparkles, Target, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { DEMO_DECISIONS, DEMO_ORG, DEMO_KPIS, type DemoDecision } from "@/data/demo-showcase";

/* ── Live CoD Ticker ── */
const useLiveCod = (baseDailyCod: number) => {
  const [extra, setExtra] = useState(0);
  const startRef = useRef(Date.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const costPerSecond = baseDailyCod / (8 * 3600); // 8h workday
      setExtra(elapsed * costPerSecond);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [baseDailyCod]);

  return extra;
};

/* ── Status / Priority helpers ── */
const statusStyles: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  implemented: "bg-primary/15 text-primary",
};
const priorityStyles: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  medium: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  low: "bg-muted text-muted-foreground",
};
const priorityLabels: Record<string, string> = { critical: "Kritisch", high: "Hoch", medium: "Mittel", low: "Niedrig" };

/* ── Decision Detail Modal ── */
const DecisionDetailModal = ({ decision, open, onClose }: { decision: DemoDecision | null; open: boolean; onClose: () => void }) => {
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const triggerAi = useCallback(() => {
    setAiLoading(true);
    setTimeout(() => { setAiLoading(false); setShowAi(true); }, 1500);
  }, []);

  if (!decision) return null;
  const d = decision;
  const ai = d.aiAnalysis;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={priorityStyles[d.priority]}>{priorityLabels[d.priority]}</Badge>
            <Badge className={statusStyles[d.status]}>{d.statusLabel}</Badge>
            {d.dueDate && (
              <Badge variant="outline" className={d.dueStatus.includes("überfällig") ? "text-destructive border-destructive/40" : ""}>
                <Clock className="w-3 h-3 mr-1" />{d.dueStatus}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg mt-2">{d.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm text-muted-foreground">{d.description}</p>
            {d.context && <p className="text-xs text-muted-foreground/70 mt-2 italic">{d.context}</p>}
          </div>

          {/* KPIs row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CoD / Tag</p>
              <p className="text-lg font-bold text-destructive">€{d.costPerDay.toLocaleString("de-DE")}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tage offen</p>
              <p className="text-lg font-bold">{d.daysOpen}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={d.health} className="flex-1 h-2" />
                <span className={`text-sm font-bold ${d.health < 50 ? "text-destructive" : d.health < 70 ? "text-amber-600" : "text-emerald-600"}`}>{d.health}%</span>
              </div>
            </div>
          </div>

          {/* Reviewers */}
          {d.reviewers.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Reviewer</p>
              <div className="space-y-2">
                {d.reviewers.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary">{r.avatar}</div>
                    <div className="flex-1">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground">{r.role}</p>
                    </div>
                    {r.status === "approved" ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><Check className="w-3 h-3 mr-1" />Genehmigt</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Ausstehend</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          {!showAi && !aiLoading && (
            <Button onClick={triggerAi} variant="outline" className="w-full gap-2">
              <Brain className="w-4 h-4" />
              KI-Analyse starten
              <Sparkles className="w-3 h-3 text-primary" />
            </Button>
          )}

          {aiLoading && (
            <div className="p-6 rounded-lg border border-primary/20 bg-primary/[0.02] text-center">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">KI analysiert Entscheidung…</p>
            </div>
          )}

          <AnimatePresence>
            {showAi && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                {/* AI Summary */}
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/[0.02]">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">KI-Analyse</span>
                  </div>
                  <p className="text-sm text-foreground">{ai.summary}</p>
                  <div className="flex gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs">Risiko: <strong>{ai.riskScore}/100</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs">Impact: <strong>{ai.impactScore}/100</strong></span>
                    </div>
                  </div>
                </div>

                {/* Risks */}
                <div>
                  <p className="text-xs font-semibold text-destructive mb-2 uppercase tracking-wider">Identifizierte Risiken</p>
                  <ul className="space-y-1.5">
                    {ai.risks.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-2 uppercase tracking-wider">Empfehlungen</p>
                  <ul className="space-y-1.5">
                    {ai.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Options */}
                <div>
                  <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Handlungsoptionen</p>
                  <div className="grid gap-3">
                    {ai.options.map((opt, i) => (
                      <div key={i} className="p-3 rounded-lg border border-border/60 bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold">Option {i + 1}: {opt.title}</p>
                          <Badge variant="outline" className="text-[10px]">{opt.roi}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="font-medium text-emerald-600 mb-1">Pro</p>
                            {opt.pros.map((p, j) => <p key={j} className="text-muted-foreground">+ {p}</p>)}
                          </div>
                          <div>
                            <p className="font-medium text-destructive mb-1">Contra</p>
                            {opt.cons.map((c, j) => <p key={j} className="text-muted-foreground">– {c}</p>)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground/50 text-center pt-2">
                  Demo-Analyse — In der echten App powered by Gemini & GPT-5
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ════════════════════════════════════════════
   MAIN DEMO PAGE
   ════════════════════════════════════════════ */
const DemoMode = () => {
  const totalDailyCod = DEMO_DECISIONS.filter(d => d.status !== "approved" && d.status !== "implemented")
    .reduce((s, d) => s + d.costPerDay, 0);
  const liveExtra = useLiveCod(totalDailyCod);
  const [selectedDecision, setSelectedDecision] = useState<DemoDecision | null>(null);

  const kpis = DEMO_KPIS;
  const openDecisions = DEMO_DECISIONS.filter(d => d.status !== "implemented");

  return (
    <>
      <Helmet>
        <title>Decivio Demo — Interaktive Produktvorschau | Maschinenbau</title>
        <meta name="description" content="Erleben Sie Decivio live mit realistischen Business-Daten. Keine Registrierung nötig. Interaktive Demo für Maschinenbau." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ── Sticky Demo Banner ── */}
        <div className="sticky top-0 z-50 bg-amber-500 text-slate-900 px-4 py-2.5 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="font-semibold">Demo-Modus</span>
            <span className="hidden sm:inline opacity-70">— Echte Daten nach Registrierung</span>
          </div>
          <Link to="/auth">
            <Button size="sm" className="gap-1.5 h-7 text-xs bg-slate-900 text-white hover:bg-slate-800">
              Kostenlos starten
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-6">
          {/* ── Org Header ── */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-bold">{DEMO_ORG.name}</h1>
              <p className="text-xs text-muted-foreground">{DEMO_ORG.industry} · {DEMO_ORG.employees} Mitarbeiter</p>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30">Professional Plan</Badge>
          </div>

          {/* ── Live CoD Hero Ticker ── */}
          <Card className="border-destructive/30 bg-destructive/[0.04]">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] text-destructive font-semibold uppercase tracking-wider mb-1">Economic Exposure — Live</p>
                  <p className="text-4xl md:text-5xl font-bold text-destructive tabular-nums">
                    €{(kpis.economicExposure + liveExtra).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-destructive/60 mt-1">
                    +€{liveExtra.toFixed(2)} seit Seitenaufruf · €{totalDailyCod.toLocaleString("de-DE")}/Tag
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-muted-foreground">{openDecisions.length} offene Entscheidungen</p>
                  <p className="text-xs text-destructive font-medium">€{(totalDailyCod * 365).toLocaleString("de-DE")}/Jahr potenzielle Kosten</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── KPI Grid ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Offene Entscheidungen", value: kpis.openDecisions, icon: FileText, color: "text-foreground" },
              { label: "SLA-Einhaltung", value: `${kpis.slaCompliance}%`, icon: Shield, color: kpis.slaCompliance < 80 ? "text-amber-600" : "text-emerald-600" },
              { label: "Ausstehende Reviews", value: kpis.pendingReviews, icon: Users, color: "text-foreground" },
              { label: "Ø Entscheidungszeit", value: `${kpis.avgDecisionDays}d`, icon: Clock, color: "text-foreground" },
            ].map((kpi, i) => (
              <Card key={i}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{kpi.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Decisions Table ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Aktive Entscheidungen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {DEMO_DECISIONS.map(d => {
                  const isOverdue = d.dueStatus.includes("überfällig");
                  return (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDecision(d)}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${isOverdue ? "border-l-[3px] border-l-destructive" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge className={`text-[10px] ${statusStyles[d.status]}`}>{d.statusLabel}</Badge>
                          <Badge className={`text-[10px] ${priorityStyles[d.priority]}`}>{priorityLabels[d.priority]}</Badge>
                          <span className="text-[10px] text-muted-foreground">{d.owner}</span>
                          {isOverdue && <span className="text-[10px] text-destructive font-medium">{d.dueStatus}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        {d.costPerDay > 0 && (
                          <p className="text-xs text-destructive font-semibold">€{d.costPerDay.toLocaleString("de-DE")}/Tag</p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 justify-end">
                          <Progress value={d.health} className="w-16 h-1.5" />
                          <span className={`text-[10px] font-medium ${d.health < 50 ? "text-destructive" : d.health < 70 ? "text-amber-600" : "text-emerald-600"}`}>{d.health}%</span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Analytics Teaser ── */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5 text-center">
                <Shield className="w-7 h-7 mx-auto text-primary mb-2" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Decision Quality</p>
                <p className="text-3xl font-bold text-primary">{kpis.qualityScore}<span className="text-sm text-muted-foreground">/100</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <TrendingUp className="w-7 h-7 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Velocity Score</p>
                <p className="text-3xl font-bold text-emerald-600">{kpis.velocityScore}<span className="text-sm text-muted-foreground">/100</span></p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <BarChart3 className="w-7 h-7 mx-auto text-amber-500 mb-2" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Diesen Monat umgesetzt</p>
                <p className="text-3xl font-bold">{kpis.implementedThisMonth}</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Feature Highlights ── */}
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-6">
              <h2 className="text-base font-semibold mb-4">Was Sie gerade gesehen haben</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Live Cost-of-Delay Ticker", desc: "Sehen Sie in Echtzeit, was verzögerte Entscheidungen kosten" },
                  { icon: Brain, label: "KI-Analyse & Copilot", desc: "Automatische Risikobewertung und Handlungsoptionen" },
                  { icon: Users, label: "Review-Workflows", desc: "Multi-Step Genehmigungsprozesse mit Deadline-Tracking" },
                  { icon: Star, label: "Decision Quality Score", desc: "Objektive Bewertung jeder Entscheidung" },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border/40">
                    <f.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── CTA Footer ── */}
          <div className="py-12 text-center space-y-4">
            <h2 className="text-xl font-bold">Bereit für echte Daten?</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Erstellen Sie Ihr Konto in unter 2 Minuten. 14 Tage kostenlos testen — keine Kreditkarte nötig.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Kostenlos registrieren
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground/50">Ihre Demo-Daten werden nicht gespeichert</p>
          </div>
        </div>
      </div>

      {/* Decision Detail Modal */}
      <DecisionDetailModal
        decision={selectedDecision}
        open={!!selectedDecision}
        onClose={() => setSelectedDecision(null)}
      />
    </>
  );
};

export default DemoMode;

import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, ChevronDown, ChevronRight, ArrowRight,
  Rocket, ExternalLink, Lock, Share2, PartyPopper, Sparkles,
} from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { useLaunchProgress, LAUNCH_PHASES, TOTAL_ITEMS } from "@/hooks/useLaunchProgress";
import type { LaunchPhase, LaunchItem } from "@/hooks/useLaunchProgress";
import { cn } from "@/lib/utils";

const LaunchChecklist = () => {
  const navigate = useNavigate();
  const {
    completedItems, completedCount, percent, isComplete,
    isLoading, toggleItem, getPhaseProgress, currentPhaseIndex, orgName,
  } = useLaunchProgress();

  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    // Auto-expand current phase
    if (currentPhaseIndex < LAUNCH_PHASES.length) {
      return new Set([LAUNCH_PHASES[currentPhaseIndex].id]);
    }
    return new Set<string>();
  });

  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const togglePhase = (id: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Check if completion just happened
  const handleToggle = (itemId: string) => {
    toggleItem.mutate(itemId, {
      onSuccess: () => {
        // Check if this was the last item
        const newCount = completedItems.has(itemId) ? completedCount - 1 : completedCount + 1;
        if (newCount >= TOTAL_ITEMS) {
          setTimeout(() => setShowCompletionModal(true), 500);
        }
      },
    });
  };

  if (isLoading) {
    return (
      <>
        <Helmet><title>Go-Live Prozess | Decivio</title></Helmet>
        <PageHeader title="Go-Live Prozess" subtitle="Wird geladen..." role="system" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>Go-Live Prozess | Decivio</title></Helmet>

      {/* ═══ COMPLETION MODAL ═══ */}
      <AnimatePresence>
        {(showCompletionModal || isComplete) && (
          <CompletionOverlay orgName={orgName} onDismiss={() => setShowCompletionModal(false)} />
        )}
      </AnimatePresence>

      <PageHeader
        title="Go-Live Prozess"
        subtitle="Von der Registrierung zur produktiven Nutzung in 5 Phasen."
        role="system"
      />

      {/* ═══ PROGRESS HERO ═══ */}
      <Card className="mb-8 overflow-hidden">
        <CardContent className="p-0">
          <div className="relative p-6 pb-5">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.04] to-transparent pointer-events-none" />

            <div className="relative flex items-center gap-6">
              {/* Circular progress */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted/40"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <motion.path
                    className={percent >= 100 ? "text-emerald-500" : "text-primary"}
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0 -31.831"
                    initial={{ strokeDasharray: "0, 100" }}
                    animate={{ strokeDasharray: `${percent}, 100` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">{percent}%</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold mb-1">
                  {isComplete ? "🎉 Go Live abgeschlossen!" : `${completedCount} von ${TOTAL_ITEMS} Schritten erledigt`}
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                  {isComplete
                    ? "Decivio ist einsatzbereit. Dein Team kann loslegen."
                    : `Phase ${Math.min(currentPhaseIndex + 1, LAUNCH_PHASES.length)}: ${currentPhaseIndex < LAUNCH_PHASES.length ? LAUNCH_PHASES[currentPhaseIndex].title : "Abgeschlossen"}`
                  }
                </p>

                {/* Phase indicators */}
                <div className="flex items-center gap-1">
                  {LAUNCH_PHASES.map((phase, i) => {
                    const { isComplete: phaseDone } = getPhaseProgress(phase);
                    const isCurrent = i === currentPhaseIndex;
                    return (
                      <div key={phase.id} className="flex items-center gap-1">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-500",
                            phaseDone ? "bg-emerald-500 w-8" :
                            isCurrent ? "bg-primary w-12 animate-pulse" :
                            "bg-muted w-6"
                          )}
                          title={phase.title}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ PHASES ═══ */}
      <div className="space-y-4">
        {LAUNCH_PHASES.map((phase, phaseIndex) => {
          const { done, total, isComplete: phaseDone } = getPhaseProgress(phase);
          const isExpanded = expandedPhases.has(phase.id);
          const isLocked = phaseIndex > 0 && !getPhaseProgress(LAUNCH_PHASES[phaseIndex - 1]).isComplete;
          const isCurrent = phaseIndex === currentPhaseIndex;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.08 }}
            >
              <Card className={cn(
                "transition-all duration-300",
                phaseDone && "border-emerald-500/30 bg-emerald-500/[0.02]",
                isCurrent && !phaseDone && "border-primary/30 bg-primary/[0.02] shadow-sm shadow-primary/5",
                isLocked && "opacity-60",
              )}>
                <button
                  className="w-full p-5 flex items-center gap-4 text-left"
                  onClick={() => !isLocked && togglePhase(phase.id)}
                  disabled={isLocked}
                >
                  {/* Phase number */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors",
                    phaseDone ? "bg-emerald-500/10 text-emerald-600" :
                    isCurrent ? "bg-primary/10 text-primary" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {phaseDone ? <CheckCircle2 className="w-5 h-5" /> : isLocked ? <Lock className="w-4 h-4" /> : <span>{phaseIndex + 1}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base">{phase.emoji}</span>
                      <h3 className="text-sm font-semibold">{phase.title}</h3>
                      <Badge variant="outline" className="text-[10px] h-5 font-normal">{phase.duration}</Badge>
                      {isCurrent && !phaseDone && (
                        <Badge className="text-[10px] h-5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">Aktuell</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(done / total) * 100} className="h-1.5 flex-1 max-w-[120px]" />
                      <span className="text-xs text-muted-foreground">{done}/{total}</span>
                    </div>
                  </div>

                  {!isLocked && (
                    isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && !isLocked && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 space-y-1.5">
                        {phase.items.map(item => {
                          const checked = completedItems.has(item.id);
                          return (
                            <div
                              key={item.id}
                              className={cn(
                                "flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
                                checked ? "bg-emerald-500/[0.04]" : "hover:bg-muted/40"
                              )}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => handleToggle(item.id)}
                                className="mt-0.5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "text-sm",
                                    checked ? "line-through text-muted-foreground" : "text-foreground font-medium"
                                  )}>
                                    {item.title}
                                  </p>
                                  {item.optional && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Optional</span>
                                  )}
                                </div>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
                                )}
                              </div>
                              {item.link && !checked && (
                                <Link
                                  to={item.link}
                                  className="shrink-0 text-xs text-primary hover:text-primary/80 flex items-center gap-1 mt-0.5 font-medium"
                                >
                                  Jetzt erledigen <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                              {checked && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};

/* ─── COMPLETION OVERLAY ─── */
const CompletionOverlay = ({ orgName, onDismiss }: { orgName: string; onDismiss: () => void }) => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("launch-complete-seen") === "true");

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("launch-complete-seen", "true");
    setDismissed(true);
    onDismiss();
  };

  const shareText = encodeURIComponent(`Wir haben Decivio erfolgreich implementiert! 🚀 Decision Governance ist jetzt Standard bei ${orgName || "uns"}. #DecisionGovernance #Decivio`);
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://decivio.com")}&summary=${shareText}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={handleDismiss}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Confetti emojis */}
        <div className="text-5xl mb-4 flex justify-center gap-2">
          <motion.span animate={{ rotate: [-15, 15, -15] }} transition={{ repeat: Infinity, duration: 1.5 }}>🎉</motion.span>
          <motion.span animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 1 }}>🚀</motion.span>
          <motion.span animate={{ rotate: [15, -15, 15] }} transition={{ repeat: Infinity, duration: 1.5 }}>🎊</motion.span>
        </div>

        <h2 className="text-2xl font-bold mb-2">
          Decivio ist live bei {orgName || "euch"}!
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Alle Go-Live-Schritte sind abgeschlossen. Euer Team kann jetzt strukturiert Entscheidungen treffen, tracken und auswerten.
        </p>

        {/* Shareable LinkedIn card */}
        <div className="border border-border rounded-xl p-4 mb-6 bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teile deinen Erfolg</span>
          </div>
          <p className="text-sm text-foreground mb-3">
            „{orgName || "Unser Team"} hat Decivio implementiert — Decision Governance ist jetzt Standard."
          </p>
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Auf LinkedIn teilen
          </a>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleDismiss}>
            Schließen
          </Button>
          <Button className="flex-1 gap-1.5" onClick={handleDismiss}>
            Zum Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LaunchChecklist;

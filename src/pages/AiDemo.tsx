import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Brain, Zap, AlertTriangle, TrendingUp, ArrowRight, CheckCircle2, Clock, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

/** Prompt 40 — Autonomous AI Decision Analysis Demo */

const ease = [0.16, 1, 0.3, 1] as const;

interface AnalysisStep {
  icon: typeof Brain;
  title: string;
  detail: string;
  duration: number; // ms to display
}

const steps: AnalysisStep[] = [
  { icon: Brain, title: "Entscheidung erfassen", detail: "KI liest Titel, Kontext und Stakeholder...", duration: 1200 },
  { icon: Zap, title: "Risiko-Scan", detail: "3 Risikofaktoren identifiziert: Zeitdruck, fehlende Daten, Stakeholder-Konflikt", duration: 1500 },
  { icon: AlertTriangle, title: "Cost-of-Delay berechnet", detail: "€2.340 / Tag — basierend auf Team-Größe und Projekt-Impact", duration: 1300 },
  { icon: TrendingUp, title: "Handlungsempfehlung", detail: "Sofort eskalieren: 72h SLA setzen, 2 fehlende Stakeholder einladen, Risiko dokumentieren", duration: 1800 },
  { icon: Shield, title: "Compliance-Check", detail: "ISO 9001 §7.1 — Dokumentationsanforderung erfüllt ✓", duration: 1000 },
  { icon: CheckCircle2, title: "Analyse abgeschlossen", detail: "Decision Health Score: 72/100 — Handlungsbedarf: Mittel", duration: 0 },
];

const AiDemo = () => {
  const [activeStep, setActiveStep] = useState(-1);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const advance = () => {
      setActiveStep(idx);
      if (idx < steps.length - 1) {
        timeout = setTimeout(() => { idx++; advance(); }, steps[idx].duration);
      } else {
        setCompleted(true);
      }
    };

    advance();
    return () => clearTimeout(timeout);
  }, [started]);

  return (
    <>
      <Helmet>
        <title>KI Decision Intelligence Demo — Decivio</title>
        <meta name="description" content="Erleben Sie live, wie Decivios KI eine Entscheidung in unter 10 Sekunden analysiert: Risiken, Kosten, Compliance und Handlungsempfehlungen." />
      </Helmet>

      <div className="min-h-screen" style={{ background: "#030712" }}>
        <Navbar />

        <section className="pt-32 pb-20 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

          <div className="container relative z-10 mx-auto px-4 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <Brain className="w-3.5 h-3.5" style={{ color: "#EF4444" }} />
                <span style={{ color: "#EF4444", fontSize: "11px", letterSpacing: "0.12em", fontWeight: 600 }}>LIVE KI-DEMO</span>
              </div>
              <h1 className="text-[clamp(1.8rem,4vw,3rem)] font-semibold tracking-[-0.02em] leading-[1.15] mb-4" style={{ color: "rgba(255,255,255,0.95)" }}>
                So analysiert die KI
                <br />
                <span style={{ color: "#EF4444" }}>Ihre Entscheidung in 8 Sekunden.</span>
              </h1>
              <p className="text-[15px] max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
                Klicken Sie „Demo starten" und sehen Sie der KI live bei der Arbeit zu.
              </p>
            </motion.div>

            {/* Demo card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease }}
              className="rounded-2xl p-6 md:p-8 max-w-2xl mx-auto"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Sample decision */}
              <div className="mb-6 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <p className="text-[11px] font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: "#EF4444" }}>BEISPIEL-ENTSCHEIDUNG</p>
                <h3 className="text-[15px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                  Investitionsfreigabe CNC-5-Achs-Fräsmaschine — €340.000
                </h3>
                <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Kategorie: Investition · Priorität: Hoch · Fällig: 5 Tage · 3 Stakeholder
                </p>
              </div>

              {!started && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStarted(true)}
                  className="w-full py-4 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                  style={{ background: "#EF4444" }}
                >
                  <Brain className="w-4 h-4" /> KI-Analyse starten
                </motion.button>
              )}

              {started && (
                <div className="space-y-3">
                  {steps.map((step, i) => {
                    const isActive = i === activeStep;
                    const isDone = i < activeStep || completed;
                    const isVisible = i <= activeStep;

                    if (!isVisible) return null;

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{
                          background: isActive && !completed ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isActive && !completed ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)"}`,
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: isDone ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" }}>
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" style={{ color: "#22C55E" }} />
                          ) : (
                            <step.icon className="w-4 h-4 animate-pulse" style={{ color: "#EF4444" }} />
                          )}
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>{step.title}</p>
                          <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>{step.detail}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {completed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5, ease }}
                  className="mt-6 text-center"
                >
                  <p className="text-[13px] mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Das war die KI von Decivio. In Ihrem Account — mit Ihren echten Entscheidungen.
                  </p>
                  <Link
                    to="/auth"
                    className="group inline-flex items-center justify-center gap-2 text-[14px] font-semibold text-white px-8 py-4 rounded-xl transition-all duration-300 hover:opacity-90"
                    style={{ background: "#EF4444" }}
                  >
                    Jetzt mit eigenen Daten testen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Features grid */}
            <div className="grid md:grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto">
              {[
                { icon: Clock, title: "< 10 Sekunden", desc: "Vollständige Analyse inkl. Risiken und Compliance" },
                { icon: Shield, title: "Compliance-ready", desc: "Automatische Prüfung gegen aktive Frameworks" },
                { icon: TrendingUp, title: "Handlungsempfehlung", desc: "Konkrete nächste Schritte, nicht nur Daten" },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  className="rounded-xl p-5 text-center"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <f.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#EF4444" }} />
                  <p className="text-[13px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.85)" }}>{f.title}</p>
                  <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.4)" }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default AiDemo;

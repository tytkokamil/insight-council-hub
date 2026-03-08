import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Maximize, Minimize, Mail, Clock, AlertTriangle,
  CheckCircle2, Shield, FileText, Brain, Sparkles, ArrowRight, Calendar,
  TrendingUp, DollarSign, Users, BarChart3, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import decivioLogo from "@/assets/decivio-logo.png";

/* ════════════════════════════════════════════════════════════
 *  ACCESS GUARD — only accessible with ?key=DECIVIO2026
 * ════════════════════════════════════════════════════════════ */
const VALID_KEYS = ["DECIVIO2026", "DEMO2026", "SALES2026"];
const TOTAL_SCENES = 5;

/* ── Typing animation hook ── */
const useTypingAnimation = (text: string, speed = 40, startDelay = 0, active = false) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay, active]);
  return { displayed, done };
};

/* ── Animated CoD counter ── */
const AnimatedCod = ({ target, running, label }: { target: number; running: boolean; label?: string }) => {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const dur = 3000;
    const animate = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, running]);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-5xl sm:text-6xl font-bold text-destructive tabular-nums tracking-tight">
        €{value.toLocaleString("de-DE")}
      </span>
      {label && <span className="text-sm text-destructive/70">{label}</span>}
    </div>
  );
};

/* ── Animated score bar ── */
const ScoreBar = ({ score, active }: { score: number; active: boolean }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!active) { setCurrent(0); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / 2000, 1);
      setCurrent(Math.round(p * score));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score, active]);

  const color = current >= 80 ? "bg-success" : current >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Decision Quality Score</span>
        <span className="font-bold tabular-nums">{current}/100</span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} style={{ width: `${current}%` }} />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
 *  SCENE COMPONENTS
 * ══════════════════════════════════════════════════════════════ */

const Scene1 = ({ active }: { active: boolean }) => {
  const emails = [
    { from: "T. Becker (Einkauf)", subject: "CNC-Investition: Angebote verglichen?", time: "Vor 12 Tagen", unread: true },
    { from: "M. Krämer (CFO)", subject: "Re: Budget für CNC — warten auf Entscheidung", time: "Vor 9 Tagen", unread: true },
    { from: "J. Hartmann (Produktion)", subject: "Ausfallzeiten steigen — CNC dringend!", time: "Vor 8 Tagen", unread: true },
    { from: "DMG Mori (Lieferant)", subject: "Angebot gültig bis 28.02 — Reminder", time: "Vor 7 Tagen", unread: true },
    { from: "T. Becker (Einkauf)", subject: "Wer entscheidet das eigentlich?", time: "Vor 5 Tagen", unread: true },
    { from: "M. Krämer (CFO)", subject: "CNC: Auditor fragt nach Dokumentation", time: "Vor 3 Tagen", unread: true },
    { from: "J. Hartmann (Produktion)", subject: "2. Maschinenausfall diese Woche!", time: "Vor 1 Tag", unread: true },
  ];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl mx-auto">
      {/* Company header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Fiktives Unternehmen</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Müller Maschinenbau GmbH</h2>
        <p className="text-sm text-muted-foreground mt-1">ISO 9001 zertifiziert • 280 Mitarbeiter • Augsburg</p>
      </motion.div>

      {/* Email inbox */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 0.4 }}
        className="w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
      >
        <div className="flex items-center gap-2 p-3 border-b border-border bg-muted/50">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Posteingang</span>
          <span className="ml-auto text-xs bg-destructive text-white rounded-full px-2 py-0.5 font-semibold">7 ungelesen</span>
        </div>
        <div className="divide-y divide-border">
          {emails.map((e, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.12 }}
              className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{e.from}</p>
                <p className="text-xs text-muted-foreground truncate">{e.subject}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">{e.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CoD ticker */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={active ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.5 }}
        className="text-center space-y-2"
      >
        <div className="flex items-center gap-2 justify-center text-xs text-destructive/70">
          <Clock className="w-3.5 h-3.5" />
          <span>12 Tage ohne Entscheidung</span>
        </div>
        <AnimatedCod target={48240} running={active} label="Cost of Delay — bisher aufgelaufen" />
        <p className="text-xs text-muted-foreground animate-pulse">Ticker läuft weiter…</p>
      </motion.div>

      {/* Narration */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: 2.5 }}
        className="text-center text-lg text-muted-foreground italic max-w-md"
      >
        „Das ist gerade Realität in vielen Unternehmen."
      </motion.p>
    </div>
  );
};

const Scene2 = ({ active }: { active: boolean }) => {
  const title = useTypingAnimation("CNC-Bearbeitungszentrum 5-Achs Investition", 35, 800, active);
  const desc = useTypingAnimation("Evaluierung und Beschaffung eines neuen 5-Achs CNC-Zentrums zur Kapazitätserweiterung. Amortisation innerhalb 18 Monaten erwartet.", 25, 2500, active);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2500);
    const t3 = setTimeout(() => setPhase(3), 4500);
    const t4 = setTimeout(() => setPhase(4), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [active]);

  const fields = [
    { label: "Kategorie", value: "Investition", icon: BarChart3, delay: 3.8 },
    { label: "Priorität", value: "Kritisch", icon: AlertTriangle, delay: 4.0 },
    { label: "Frist", value: "28. Februar 2026", icon: Calendar, delay: 4.2 },
    { label: "CoD / Tag", value: "€4.020", icon: DollarSign, delay: 4.4 },
    { label: "Reviewer", value: "M. Krämer (CFO)", icon: Users, delay: 4.6 },
  ];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} className="text-center">
        <div className="inline-flex items-center gap-2 text-xs bg-primary/10 text-primary rounded-full px-3 py-1 mb-3">
          <Sparkles className="w-3 h-3" />
          KI füllt automatisch aus
        </div>
        <h2 className="text-2xl font-bold text-foreground">Neue Entscheidung anlegen</h2>
      </motion.div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5 }}
        className="w-full rounded-xl border border-border bg-card shadow-lg p-5 space-y-4"
      >
        {/* Title field */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Titel</label>
          <div className="h-11 rounded-lg border border-border bg-background px-3 flex items-center text-sm text-foreground">
            {title.displayed}<span className={`inline-block w-0.5 h-4 bg-primary ml-0.5 ${title.done ? "opacity-0" : "animate-pulse"}`} />
          </div>
        </div>

        {/* Description field */}
        {phase >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Beschreibung</label>
            <div className="min-h-[60px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground leading-relaxed">
              {desc.displayed}<span className={`inline-block w-0.5 h-4 bg-primary ml-0.5 ${desc.done ? "opacity-0" : "animate-pulse"}`} />
            </div>
          </motion.div>
        )}

        {/* Auto-filled fields */}
        {phase >= 3 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {fields.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (i * 0.15) }}
                className="rounded-lg border border-primary/20 bg-primary/5 p-2.5"
              >
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </div>
                <p className="text-sm font-semibold text-foreground">{f.value}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Quality Score */}
        {phase >= 4 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ScoreBar score={87} active={phase >= 4} />
          </motion.div>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={active && phase >= 4 ? { opacity: 1 } : { opacity: 0 }}
        className="text-center text-muted-foreground italic"
      >
        „Von E-Mail-Chaos zu strukturierter Entscheidung — in 30 Sekunden."
      </motion.p>
    </div>
  );
};

const Scene3 = ({ active }: { active: boolean }) => {
  const [approved, setApproved] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) { setApproved(false); setPhase(0); return; }
    const t1 = setTimeout(() => setPhase(1), 500);
    return () => clearTimeout(t1);
  }, [active]);

  const handleApprove = () => {
    setApproved(true);
    try { navigator?.vibrate?.(50); } catch {}
    setTimeout(() => setPhase(2), 600);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} className="text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Reviewer-Perspektive</p>
        <h2 className="text-2xl font-bold text-foreground">One-Click Approval</h2>
        <p className="text-sm text-muted-foreground mt-1">So sieht es auf dem Handy des CFOs aus:</p>
      </motion.div>

      {/* Phone mockup */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3 }}
        className="w-full max-w-[320px] rounded-[2rem] border-4 border-foreground/10 bg-card shadow-2xl overflow-hidden"
      >
        {/* Phone status bar */}
        <div className="flex items-center justify-between px-5 py-2 bg-muted/50 text-[10px] text-muted-foreground">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3.5 h-2 rounded-sm border border-muted-foreground/50 relative">
              <div className="absolute inset-0.5 bg-success rounded-[1px]" />
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <img src={decivioLogo} alt="Decivio" className="h-4 opacity-50" />

          <AnimatePresence mode="wait">
            {!approved ? (
              <motion.div key="pending" exit={{ opacity: 0, scale: 0.9 }} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-destructive/10 text-destructive rounded-full px-2 py-0.5 font-semibold">
                    🔴 Kritisch
                  </span>
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    CNC-Bearbeitungszentrum 5-Achs Investition
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Evaluierung 5-Achs CNC-Zentrum zur Kapazitätserweiterung. Amortisation 18 Monate.
                  </p>
                </div>

                {phase >= 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <DollarSign className="w-4 h-4 text-destructive animate-pulse" />
                    <div>
                      <p className="text-lg font-bold text-destructive tabular-nums">€48.240</p>
                      <p className="text-[10px] text-destructive/70">Cost of Delay — bisher</p>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={handleApprove}
                    className="w-full h-14 text-base font-semibold bg-success hover:bg-success/90 text-white shadow-lg shadow-success/20 active:scale-[0.97] transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    ✓ Genehmigen
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-14 text-base font-semibold border-destructive/30 text-destructive hover:bg-destructive/5"
                    disabled
                  >
                    ✗ Ablehnen
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="approved"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>
                <p className="text-lg font-bold text-foreground">Genehmigt!</p>
                <p className="text-xs text-muted-foreground text-center">
                  Ihre Genehmigung wurde gespeichert und dokumentiert.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Dashboard update indicator */}
      {approved && phase >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <div className="inline-flex items-center gap-2 text-sm bg-success/10 text-success rounded-full px-4 py-2 font-semibold">
            <TrendingUp className="w-4 h-4" />
            CoD gestoppt — Gespart: €48.240
          </div>
          <p className="text-xs text-muted-foreground">Live im Dashboard aktualisiert</p>
        </motion.div>
      )}
    </div>
  );
};

const Scene4 = ({ active }: { active: boolean }) => {
  const [exported, setExported] = useState(false);

  useEffect(() => { if (!active) setExported(false); }, [active]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Compliance auf Knopfdruck</h2>
        <p className="text-sm text-muted-foreground mt-1">ISO 9001 • SOX • GxP — alles dokumentiert</p>
      </motion.div>

      {/* Audit trail card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={active ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4 }}
        className="w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
      >
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Audit Trail</span>
          <span className="ml-auto text-[10px] bg-success/10 text-success rounded-full px-2 py-0.5 font-medium">
            ✓ Integrität verifiziert
          </span>
        </div>

        <div className="divide-y divide-border">
          {[
            { action: "Entscheidung erstellt", user: "A. Müller", time: "01.03.2026, 09:14", icon: "📝" },
            { action: "KI-Analyse ausgeführt", user: "System", time: "01.03.2026, 09:14", icon: "🤖" },
            { action: "Reviewer zugewiesen", user: "A. Müller", time: "01.03.2026, 09:15", icon: "👤" },
            { action: "Review-Anfrage gesendet", user: "System", time: "01.03.2026, 09:15", icon: "📧" },
            { action: "Genehmigt", user: "M. Krämer (CFO)", time: "01.03.2026, 10:32", icon: "✅" },
            { action: "Status → Implementierung", user: "System", time: "01.03.2026, 10:32", icon: "🚀" },
          ].map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="flex items-center gap-3 p-3 text-sm"
            >
              <span className="text-base">{entry.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{entry.action}</p>
                <p className="text-[10px] text-muted-foreground">{entry.user}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{entry.time}</span>
            </motion.div>
          ))}
        </div>

        <div className="p-4 bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">HMAC-256 Hashkette verifiziert</p>
          <Button
            size="sm"
            onClick={() => setExported(true)}
            className="gap-1.5"
            variant={exported ? "outline" : "default"}
          >
            <FileText className="w-3.5 h-3.5" />
            {exported ? "✓ PDF exportiert" : "Audit PDF exportieren"}
          </Button>
        </div>
      </motion.div>

      {exported && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-muted-foreground italic"
        >
          „Das ist, was Ihr Auditor bekommt — lückenlos und fälschungssicher."
        </motion.p>
      )}
    </div>
  );
};

const Scene5 = ({ active }: { active: boolean }) => (
  <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
    <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : {}} className="text-center">
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground">KI Daily Brief</h2>
      <p className="text-sm text-muted-foreground mt-1">Jeden Morgen um 07:30 — automatisch</p>
    </motion.div>

    {/* Email mockup */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.3 }}
      className="w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
    >
      <div className="p-4 bg-muted/50 border-b border-border space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3.5 h-3.5" />
          Von: <span className="font-medium text-foreground">brief@decivio.com</span>
        </div>
        <div className="text-xs text-muted-foreground">
          An: <span className="font-medium text-foreground">a.mueller@mueller-maschinenbau.de</span>
        </div>
        <p className="text-sm font-semibold text-foreground">Ihr Decivio Briefing — Montag, 3. März 2026</p>
      </div>

      <div className="p-5 space-y-5">
        {/* Momentum */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-success/5 border border-success/20"
        >
          <div className="text-3xl font-bold text-success tabular-nums">78</div>
          <div>
            <p className="text-sm font-semibold text-foreground">Momentum Score</p>
            <p className="text-xs text-muted-foreground">+5 seit letzter Woche</p>
          </div>
        </motion.div>

        {/* Top 3 decisions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top 3 Prioritäten heute</p>
          {[
            { title: "ERP-Migration Phase 2", cod: "€2.100/Tag", status: "Review ausstehend", urgency: "critical" },
            { title: "Qualitätszertifizierung EN 1090", cod: "€890/Tag", status: "Frist in 3 Tagen", urgency: "high" },
            { title: "Lieferantenwechsel Hydraulik", cod: "€450/Tag", status: "KI-Analyse verfügbar", urgency: "medium" },
          ].map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={active ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.9 + i * 0.15 }}
              className="flex items-center gap-3 p-3 rounded-lg border border-border"
            >
              <div className={`w-1.5 h-8 rounded-full flex-shrink-0 ${
                d.urgency === "critical" ? "bg-destructive" : d.urgency === "high" ? "bg-warning" : "bg-primary"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{d.title}</p>
                <p className="text-[10px] text-muted-foreground">{d.status}</p>
              </div>
              <span className="text-xs font-semibold text-destructive whitespace-nowrap">{d.cod}</span>
            </motion.div>
          ))}
        </div>

        {/* AI insight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 1 } : {}}
          transition={{ delay: 1.5 }}
          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-1.5 text-xs text-primary mb-1">
            <Brain className="w-3 h-3" />
            KI-Empfehlung
          </div>
          <p className="text-sm text-foreground">
            Die ERP-Migration blockiert 3 nachgelagerte Entscheidungen. Priorisierung könnte €6.300/Tag CoD einsparen.
          </p>
        </motion.div>
      </div>
    </motion.div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : {}}
      transition={{ delay: 2 }}
      className="text-center text-muted-foreground italic"
    >
      „Keine Überraschungen mehr — Ihr Team startet jeden Tag fokussiert."
    </motion.p>
  </div>
);

/* ══════════════════════════════════════════════════════════════
 *  CTA FINALE
 * ══════════════════════════════════════════════════════════════ */
const FinalCTA = ({ active }: { active: boolean }) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : {}}
      className="flex flex-col items-center gap-6 text-center max-w-lg mx-auto py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={active ? { scale: 1 } : {}}
        transition={{ type: "spring", delay: 0.3 }}
        className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
      >
        <Sparkles className="w-10 h-10 text-primary" />
      </motion.div>
      <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
        Bereit für Ihre<br />echten Daten?
      </h2>
      <p className="text-muted-foreground">
        Starten Sie in 2 Minuten — keine Kreditkarte, kein Setup.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button
          size="lg"
          onClick={() => navigate("/auth")}
          className="flex-1 h-14 text-base gap-2 shadow-lg shadow-primary/20"
        >
          Kostenlos starten <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          asChild
          className="flex-1 h-14 text-base gap-2"
        >
          <a href="mailto:sales@decivio.com?subject=Demo%20anfragen">
            <Calendar className="w-4 h-4" /> Demo buchen
          </a>
        </Button>
      </div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════ */
const SCENE_TITLES = [
  "Das Problem",
  "Entscheidung anlegen",
  "One-Click Approval",
  "Compliance",
  "KI Daily Brief",
];

const LiveDemo = () => {
  const [params] = useSearchParams();
  const key = params.get("key") || "";
  const [scene, setScene] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const authorized = useMemo(() => VALID_KEYS.includes(key.toUpperCase()), [key]);

  const goNext = useCallback(() => {
    if (showCTA) return;
    if (scene < TOTAL_SCENES - 1) setScene(s => s + 1);
    else setShowCTA(true);
  }, [scene, showCTA]);

  const goPrev = useCallback(() => {
    if (showCTA) { setShowCTA(false); return; }
    if (scene > 0) setScene(s => s - 1);
  }, [scene, showCTA]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "f" || e.key === "F") { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === "Escape" && showCTA) setShowCTA(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, toggleFullscreen, showCTA]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Not authorized
  if (!authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Zugriff verweigert</h1>
          <p className="text-sm text-muted-foreground">
            Diese Demo ist nur mit einem gültigen Zugangsschlüssel verfügbar.
          </p>
          <p className="text-xs text-muted-foreground">
            Kontaktieren Sie <a href="mailto:sales@decivio.com" className="text-primary underline">sales@decivio.com</a> für Zugang.
          </p>
        </div>
      </div>
    );
  }

  const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5];
  const CurrentScene = scenes[scene];
  const currentIdx = showCTA ? TOTAL_SCENES : scene;

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background flex flex-col select-none"
      onClick={goNext}
    >
      {/* Content area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {showCTA ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FinalCTA active={true} />
            </motion.div>
          ) : (
            <motion.div
              key={`scene-${scene}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <CurrentScene active={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Presenter bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-8 py-3 border-t border-border bg-card/80 backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <img src={decivioLogo} alt="Decivio" className="h-4 opacity-40" />
          <span className="text-xs text-muted-foreground hidden sm:inline">Live Demo</span>
        </div>

        {/* Scene dots */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goPrev} disabled={scene === 0 && !showCTA} className="h-8 w-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1.5">
            {SCENE_TITLES.map((title, i) => (
              <button
                key={i}
                onClick={() => { setShowCTA(false); setScene(i); }}
                title={title}
                className={`transition-all rounded-full ${
                  i === scene && !showCTA
                    ? "w-6 h-2 bg-primary"
                    : i < currentIdx
                      ? "w-2 h-2 bg-primary/40"
                      : "w-2 h-2 bg-muted-foreground/20"
                }`}
              />
            ))}
            {/* CTA dot */}
            <button
              onClick={() => setShowCTA(true)}
              className={`transition-all rounded-full ${
                showCTA ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/20"
              }`}
            />
          </div>

          <Button variant="ghost" size="sm" onClick={goNext} className="h-8 w-8 p-0">
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="text-xs text-muted-foreground tabular-nums hidden sm:inline w-12 text-center">
            {showCTA ? "CTA" : `${scene + 1}/${TOTAL_SCENES}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!showCTA && (
            <span className="text-[10px] text-muted-foreground hidden md:inline">{SCENE_TITLES[scene]}</span>
          )}
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-8 w-8 p-0">
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveDemo;

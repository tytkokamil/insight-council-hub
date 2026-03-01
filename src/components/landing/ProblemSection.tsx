import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;

const DAILY_RATE = 1960;
const PER_SECOND_RATE = DAILY_RATE / 86400;

const problems = [
  { icon: "⏳", title: "Reviewer reagieren nicht", desc: "Im Durchschnitt warten Entscheidungen 4,2 Tage auf eine einfache Genehmigung — niemand misst das." },
  { icon: "📧", title: "Entscheidungen per E-Mail", desc: "Kein Audit Trail, kein SLA, kein Verantwortlicher. E-Mails verschwinden im Posteingang." },
  { icon: "🔍", title: "Compliance-Lücken", desc: "NIS2, ISO 9001, IATF 16949 — all das erfordert dokumentierte Entscheidungsprozesse. Die meisten haben sie nicht." },
  { icon: "💸", title: "Unsichtbare Kosten", desc: "Eine Entscheidung die 5 Personen à €120/h blockiert kostet €4.800 pro Woche. Das sieht keiner." },
];

const dashboardItems = [
  { title: "Cloud-Migration AWS → Azure", priority: "bg-destructive", status: "Eskaliert", statusColor: "text-destructive", cost: 10240, live: true },
  { title: "Investitionsfreigabe CNC-Maschine", priority: "bg-warning", status: "SLA läuft heute ab", statusColor: "text-warning", cost: 285000, live: false },
  { title: "Lieferantenwechsel Hydraulik", priority: "bg-warning", status: "Überfällig", statusColor: "text-warning", cost: 6800, live: true },
  { title: "Make-or-Buy Steuerungsplatine", priority: "bg-muted-foreground/40", status: "Offen", statusColor: "text-muted-foreground", cost: null, live: false },
];

const LiveCost = ({ base, live }: { base: number; live: boolean }) => {
  const [value, setValue] = useState(base);
  const start = useRef(Date.now());

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const elapsed = (Date.now() - start.current) / 1000;
      setValue(base + elapsed * PER_SECOND_RATE);
    }, 100);
    return () => clearInterval(id);
  }, [base, live]);

  if (!live && base === null) return <span className="text-muted-foreground">–</span>;
  const formatted = value >= 100000
    ? `€${(value / 1000).toFixed(0)}k`
    : `€${value.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;

  return <span className="text-warning">{formatted}</span>;
};

const ProblemSection = () => {
  const [totalExposure, setTotalExposure] = useState(17040);
  const start = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - start.current) / 1000;
      setTotalExposure(17040 + elapsed * (DAILY_RATE / 86400) * 2);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="problem" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-semibold text-primary mb-4 tracking-[0.2em] uppercase">Das Problem</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            Was in jedem Mittelständler täglich passiert — unbemerkt.
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Entscheidungen bleiben offen. Reviewer reagieren nicht. Projekte warten. Niemand sieht was es kostet.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Problem cards */}
          <div className="space-y-3">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease }}
                className="group flex items-start gap-4 p-5 rounded-xl border border-destructive/20 bg-destructive/[0.03] hover:translate-x-1 transition-transform duration-200 cursor-default"
              >
                <span className="text-2xl shrink-0 mt-0.5">{p.icon}</span>
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right: Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.8, ease }}
            className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg"
          >
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-warning/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-success/40" />
              </div>
              <div className="flex-1 flex justify-center">
                <span className="text-[11px] text-muted-foreground font-mono px-3 py-0.5 rounded bg-muted">
                  Offene Entscheidungen
                </span>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {dashboardItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className={`w-1 h-8 rounded-full ${item.priority}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className={`text-[11px] ${item.statusColor}`}>{item.status}</p>
                  </div>
                  <div className="text-sm font-bold tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {item.cost !== null ? <LiveCost base={item.cost} live={item.live} /> : <span className="text-muted-foreground">–</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Economic Exposure</span>
              <span className="text-lg font-bold text-warning tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                €{totalExposure.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

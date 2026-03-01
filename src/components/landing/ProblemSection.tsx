import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, Search, TrendingDown } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const DAILY_RATE = 5 * 120 * 8 * 3 / 5;
const PER_SECOND_RATE = DAILY_RATE / 86400;

const problems = [
  { icon: Clock, title: "Reviewer reagieren nicht", desc: "Im Durchschnitt warten Entscheidungen 4,2 Tage auf eine einfache Genehmigung — niemand misst das." },
  { icon: Mail, title: "Entscheidungen per E-Mail", desc: "Kein Audit Trail, kein SLA, kein Verantwortlicher. E-Mails verschwinden im Posteingang." },
  { icon: Search, title: "Compliance-Lücken", desc: "NIS2, ISO 9001, IATF 16949 — all das erfordert dokumentierte Entscheidungsprozesse." },
  { icon: TrendingDown, title: "Unsichtbare Kosten", desc: "Eine Entscheidung die 5 Personen à €120/h blockiert kostet €4.800 pro Woche." },
];

const dashboardItems = [
  { title: "Cloud-Migration AWS → Azure", status: "Eskaliert", statusColor: "text-destructive", cost: 10240, live: true, priority: "bg-destructive" },
  { title: "Investitionsfreigabe CNC-Maschine", status: "SLA läuft ab", statusColor: "text-warning", cost: 28500, live: false, priority: "bg-warning" },
  { title: "Lieferantenwechsel Hydraulik", status: "Überfällig", statusColor: "text-warning", cost: 6800, live: true, priority: "bg-warning" },
  { title: "Make-or-Buy Steuerungsplatine", status: "Offen", statusColor: "text-muted-foreground", cost: null, live: false, priority: "bg-muted-foreground/30" },
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

  return <span className="text-warning font-mono text-sm">{formatted}</span>;
};

const ProblemSection = () => {
  const [totalExposure, setTotalExposure] = useState(45300);
  const start = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = (Date.now() - start.current) / 1000;
      setTotalExposure(45300 + elapsed * (DAILY_RATE / 86400) * 2);
    }, 100);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="problem" className="py-24 relative bg-muted/20">
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
            Entscheidungen bleiben offen. Reviewer reagieren nicht. Niemand sieht was es kostet.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Problem cards */}
          <div className="space-y-3">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease }}
                className="flex items-start gap-4 p-5 rounded-xl border border-destructive/10 bg-white/60 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-destructive/8 flex items-center justify-center shrink-0">
                  <p.icon className="w-4 h-4 text-destructive/70" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-foreground mb-1">{p.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7, ease }}
            className="rounded-2xl border border-border/60 bg-white overflow-hidden shadow-sm"
          >
            <div className="px-5 py-3 border-b border-border/40 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive/30" />
                <div className="w-2 h-2 rounded-full bg-warning/30" />
                <div className="w-2 h-2 rounded-full bg-success/30" />
              </div>
              <span className="text-[11px] text-muted-foreground/60 font-mono mx-auto">Offene Entscheidungen</span>
            </div>

            <div className="p-4 space-y-2">
              {dashboardItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/20"
                >
                  <div className={`w-1 h-8 rounded-full ${item.priority}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{item.title}</p>
                    <p className={`text-[11px] ${item.statusColor}`}>{item.status}</p>
                  </div>
                  <div className="tabular-nums">
                    {item.cost !== null ? <LiveCost base={item.cost} live={item.live} /> : <span className="text-muted-foreground/40 text-sm">–</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60">Economic Exposure</span>
              <span className="text-base font-bold text-warning tabular-nums font-mono">
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

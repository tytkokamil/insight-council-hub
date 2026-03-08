import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Clock, Mail, Search, TrendingDown } from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

const DAILY_RATE = 5 * 120 * 8 * 3 / 5;
const PER_SECOND_RATE = DAILY_RATE / 86400;

const problems = [
  { icon: Clock, title: "Reviewer reagieren nicht", desc: "Im Durchschnitt warten Entscheidungen 4,2 Tage auf eine einfache Genehmigung — niemand misst das.", stat: "4,2 Tage" },
  { icon: Mail, title: "Entscheidungen per E-Mail", desc: "Kein Audit Trail, kein SLA, kein Verantwortlicher. E-Mails verschwinden im Posteingang.", stat: "0% Transparenz" },
  { icon: Search, title: "Compliance-Lücken", desc: "NIS2, ISO 9001, IATF 16949 — all das erfordert dokumentierte Entscheidungsprozesse.", stat: "73% nicht bereit" },
  { icon: TrendingDown, title: "Unsichtbare Kosten", desc: "Eine Entscheidung die 5 Personen à €120/h blockiert kostet €4.800 pro Woche.", stat: "€47k/Monat" },
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

  return <span className="font-mono text-sm text-primary">{formatted}</span>;
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
    <section id="problem" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <p className="text-xs font-semibold mb-4 tracking-[0.2em] uppercase text-primary">Das Problem</p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Was in jedem Mittelständler täglich passiert — unbemerkt.
          </h2>
          <p className="leading-relaxed text-muted-foreground">
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
                whileHover={{ x: 4 }}
                className="flex items-start gap-4 p-5 rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm hover:bg-card/90 hover:border-border/50 transition-all duration-300"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/5">
                  <p.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[14px] font-semibold">{p.title}</h3>
                    <span className="text-[11px] font-bold text-destructive/80 tabular-nums">{p.stat}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">{p.desc}</p>
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
            className="rounded-2xl border border-border/40 bg-card overflow-hidden shadow-card"
          >
            <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-destructive/50" />
                <div className="w-2 h-2 rounded-full bg-warning/50" />
                <div className="w-2 h-2 rounded-full bg-success/50" />
              </div>
              <span className="text-[11px] font-mono mx-auto text-muted-foreground/60">Offene Entscheidungen</span>
            </div>

            <div className="p-4 space-y-2">
              {dashboardItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-muted/15 hover:bg-muted/25 transition-colors duration-200"
                >
                  <div className={`w-1 h-8 rounded-full ${item.priority}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{item.title}</p>
                    <p className={`text-[11px] ${item.statusColor}`}>{item.status}</p>
                  </div>
                  <div className="tabular-nums">
                    {item.cost !== null ? <LiveCost base={item.cost} live={item.live} /> : <span className="text-muted-foreground/40 text-sm">–</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground/60">Economic Exposure</span>
              <motion.span
                className="text-base font-bold tabular-nums font-mono text-primary"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                €{totalExposure.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Lightbulb, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

type Status = "done" | "in_progress" | "planned" | "exploring";

interface RoadmapItem {
  title: string;
  description: string;
  status: Status;
  quarter: string;
}

const statusConfig: Record<Status, { label: string; icon: React.ReactNode; color: string }> = {
  done: { label: "Fertig", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "text-accent-teal bg-accent-teal/10 border-accent-teal/20" },
  in_progress: { label: "In Arbeit", icon: <Clock className="w-3.5 h-3.5" />, color: "text-primary bg-primary/10 border-primary/20" },
  planned: { label: "Geplant", icon: <Clock className="w-3.5 h-3.5" />, color: "text-warning bg-warning/10 border-warning/20" },
  exploring: { label: "Erkunden", icon: <Lightbulb className="w-3.5 h-3.5" />, color: "text-muted-foreground bg-muted border-border" },
};

const items: RoadmapItem[] = [
  // Q1 2026 - Done
  { title: "Decision Hub mit Lifecycle-Management", description: "Kernprodukt: Entscheidungen erfassen, priorisieren, tracken.", status: "done", quarter: "Q1 2026" },
  { title: "KI-Analyse & Co-Pilot", description: "Risiko-Scores, Impact-Analyse, Optionsgenerierung per KI.", status: "done", quarter: "Q1 2026" },
  { title: "Team-Management & RBAC", description: "Rollenbasierter Zugriff, Team-Hierarchien, Delegationen.", status: "done", quarter: "Q1 2026" },
  { title: "Intelligence Center", description: "Pattern Engine, Bottleneck-Analyse, Friction Map, Health Heatmap.", status: "done", quarter: "Q1 2026" },
  { title: "Executive Hub & Board Reports", description: "CEO-Briefings, DQI, Portfolio-Risiko, PDF-Board-Reports.", status: "done", quarter: "Q1 2026" },
  
  // Q2 2026 - In Progress / Planned
  { title: "Stripe-Integration & Subscription Management", description: "Checkout, Plan-Verwaltung, automatische Feature-Aktivierung.", status: "in_progress", quarter: "Q2 2026" },
  { title: "Custom Auth-E-Mails", description: "Gebrandete Willkommens-, Verifizierungs- und Passwort-Reset-E-Mails.", status: "in_progress", quarter: "Q2 2026" },
  { title: "API & Webhooks", description: "REST-API für Entscheidungen, Tasks und Risiken. Webhooks für externe Systeme.", status: "planned", quarter: "Q2 2026" },
  { title: "Slack-Integration", description: "Entscheidungs-Benachrichtigungen, Abstimmungen und Quick-Actions direkt in Slack.", status: "planned", quarter: "Q2 2026" },
  { title: "Jira / Linear Sync", description: "Bidirektionale Synchronisation von Tasks mit bestehenden Projektmanagement-Tools.", status: "planned", quarter: "Q2 2026" },

  // Q3 2026 - Exploring
  { title: "SSO (SAML / OIDC)", description: "Enterprise Single Sign-On mit Azure AD, Okta, Google Workspace.", status: "exploring", quarter: "Q3 2026" },
  { title: "Custom LLM / On-Premise KI", description: "Eigene KI-Modelle für Unternehmen mit strikten Datenschutzanforderungen.", status: "exploring", quarter: "Q3 2026" },
  { title: "Mobile App (PWA)", description: "Entscheidungen unterwegs erfassen und tracken — optimiert für Mobilgeräte.", status: "exploring", quarter: "Q3 2026" },
  { title: "Decision Intelligence Benchmarks", description: "Anonymisierter Branchenvergleich der Entscheidungsqualität.", status: "exploring", quarter: "Q3 2026" },
];

const groupedByQuarter = items.reduce<Record<string, RoadmapItem[]>>((acc, item) => {
  (acc[item.quarter] ??= []).push(item);
  return acc;
}, {});

const Roadmap = () => (
  <>
    <Helmet>
      <title>Roadmap — Decivio</title>
      <meta name="description" content="Was wir als nächstes bauen. Unsere öffentliche Produkt-Roadmap." />
    </Helmet>

    <div className="min-h-screen bg-background">
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Roadmap</h1>
              <p className="text-xs text-muted-foreground">Wohin wir gehen — transparent & offen.</p>
            </div>
          </div>
          <a href="mailto:feedback@decivio.com">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <MessageSquare className="w-3.5 h-3.5" />
              Feature vorschlagen
            </Button>
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="space-y-14">
          {Object.entries(groupedByQuarter).map(([quarter, qItems], qi) => (
            <section key={quarter}>
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-sm font-semibold text-primary mb-5 flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-primary" />
                {quarter}
              </motion.h2>

              <div className="space-y-4">
                {qItems.map((item, i) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04, duration: 0.4 }}
                      className="border border-border/40 rounded-xl p-4 bg-card hover:border-foreground/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold mb-1">{item.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap shrink-0 ${cfg.color}`}>
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center p-8 border border-border/40 rounded-2xl bg-card"
        >
          <h3 className="text-lg font-bold mb-2">Feature-Wunsch?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Unsere Roadmap wird von Kundenfeedback gesteuert. Sag uns, was du brauchst.
          </p>
          <a href="mailto:feedback@decivio.com">
            <Button variant="default" size="lg" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Feature vorschlagen
            </Button>
          </a>
        </motion.div>
      </main>
    </div>
  </>
);

export default Roadmap;

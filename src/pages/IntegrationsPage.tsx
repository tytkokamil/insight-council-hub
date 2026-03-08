import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Webhook, Zap, ArrowUpRight, CheckCircle2, Code2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/shared/PageHeader";
import AppLayout from "@/components/layout/AppLayout";

const PLATFORMS = [
  {
    name: "Zapier",
    logo: "https://cdn.worldvectorlogo.com/logos/zapier-1.svg",
    description: "Verbinden Sie Decivio mit 6.000+ Apps ohne Code. Trigger-basierte Automationen per Webhook.",
    color: "#FF4A00",
    ctaUrl: "https://zapier.com/app/editor",
    ctaLabel: "In Zapier öffnen",
  },
  {
    name: "Make (Integromat)",
    logo: "https://cdn.worldvectorlogo.com/logos/make-1.svg",
    description: "Visuelle Workflow-Automatisierung mit Decivio-Webhooks als Trigger oder Action.",
    color: "#6D00CC",
    ctaUrl: "https://www.make.com/en/hq/app-invitation/",
    ctaLabel: "In Make öffnen",
  },
  {
    name: "n8n",
    logo: "https://cdn.worldvectorlogo.com/logos/n8n.svg",
    description: "Open-Source Workflow-Automatisierung. Self-hosted oder Cloud. Perfekt für Enterprise.",
    color: "#EA4B71",
    ctaUrl: "https://n8n.io",
    ctaLabel: "n8n einrichten",
  },
];

const EXAMPLE_ZAPS = [
  {
    trigger: "Entscheidung genehmigt",
    event: "decision.approved",
    action: "Slack-Nachricht an #decisions senden",
    tool: "Slack",
    icon: "💬",
  },
  {
    trigger: "SLA überschritten",
    event: "decision.sla_violated",
    action: "Jira-Ticket automatisch erstellen",
    tool: "Jira",
    icon: "🎫",
  },
  {
    trigger: "Neue Entscheidung erstellt",
    event: "decision.created",
    action: "Zeile in Google Sheet hinzufügen",
    tool: "Google Sheets",
    icon: "📊",
  },
  {
    trigger: "Aufgabe abgeschlossen",
    event: "task.completed",
    action: "Asana-Task als erledigt markieren",
    tool: "Asana",
    icon: "✅",
  },
  {
    trigger: "Eskalation ausgelöst",
    event: "escalation.triggered",
    action: "SMS an Entscheider senden",
    tool: "Twilio",
    icon: "📱",
  },
  {
    trigger: "Review angefordert",
    event: "review.requested",
    action: "Microsoft Teams Nachricht senden",
    tool: "MS Teams",
    icon: "💼",
  },
];

const SETUP_STEPS = [
  { step: 1, title: "Webhook erstellen", desc: "Gehen Sie zu Einstellungen → Integrationen → Outbound Webhooks" },
  { step: 2, title: "URL einfügen", desc: "Kopieren Sie die Webhook-URL von Zapier/Make/n8n" },
  { step: 3, title: "Events wählen", desc: "Wählen Sie die Events, die den Workflow auslösen" },
  { step: 4, title: "Testen & Live", desc: "Senden Sie einen Test-Payload und aktivieren Sie den Webhook" },
];

const IntegrationsPage = () => {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-12">
        <PageHeader
          title="Integrationen & Automationen"
          subtitle="Verbinden Sie Decivio mit Ihren bestehenden Tools über Webhooks"
          role="system"
        />

        {/* Platforms */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLATFORMS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: p.color + "15" }}>
                  <img src={p.logo} alt={p.name} className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{p.name}</h3>
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex-1">{p.description}</p>
              <a href={p.ctaUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                  {p.ctaLabel} <ExternalLink className="w-3 h-3" />
                </Button>
              </a>
            </motion.div>
          ))}
        </section>

        {/* Setup Steps */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">In 4 Schritten verbunden</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SETUP_STEPS.map((s) => (
              <div key={s.step} className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {s.step}
                </div>
                <h4 className="text-sm font-medium text-foreground">{s.title}</h4>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link to="/settings">
              <Button className="gap-1.5">
                <Webhook className="w-4 h-4" /> Webhook einrichten <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Example Automations */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-1">Beispiel-Automationen</h2>
          <p className="text-sm text-muted-foreground mb-4">Beliebte Workflows, die unsere Kunden nutzen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {EXAMPLE_ZAPS.map((z) => (
              <div key={z.event} className="rounded-lg border border-border/60 bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{z.icon}</span>
                  <Badge variant="outline" className="font-mono text-[9px]">{z.event}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-foreground font-medium">Wenn:</span>
                    <span className="text-muted-foreground">{z.trigger}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-foreground font-medium">Dann:</span>
                    <span className="text-muted-foreground">{z.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payload Format */}
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Payload-Format</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Jeder Webhook-Aufruf enthält HMAC-SHA256-Signatur und standardisiertes JSON-Format.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-medium text-foreground mb-2">HTTP-Header</h4>
              <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 text-muted-foreground whitespace-pre-wrap">{`Content-Type: application/json
X-Decivio-Signature: sha256=<hmac>
X-Decivio-Event: decision.approved
X-Decivio-Delivery: <uuid>
User-Agent: Decivio-Webhook/1.0`}</pre>
            </div>
            <div>
              <h4 className="text-xs font-medium text-foreground mb-2">JSON-Body</h4>
              <pre className="text-[10px] font-mono bg-muted/50 rounded-lg p-3 text-muted-foreground whitespace-pre-wrap">{`{
  "event": "decision.approved",
  "timestamp": "2026-03-08T10:30:00Z",
  "org_id": "uuid",
  "data": {
    "decision": {
      "id": "uuid",
      "title": "Neues CRM einführen",
      "status": "approved",
      "priority": "high",
      "cost_of_delay": 12500,
      "approved_by": "Max Mustermann"
    }
  }
}`}</pre>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              HMAC-SHA256 Signatur-Verifizierung
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Bis zu 3 Retry-Versuche bei Fehler
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Delivery Log mit Status & Latenz
            </div>
          </div>
        </section>

        {/* Available Events */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Verfügbare Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { event: "decision.created", desc: "Neue Entscheidung erstellt" },
              { event: "decision.approved", desc: "Entscheidung genehmigt" },
              { event: "decision.rejected", desc: "Entscheidung abgelehnt" },
              { event: "decision.overdue", desc: "Entscheidung überfällig" },
              { event: "decision.escalated", desc: "Entscheidung eskaliert" },
              { event: "decision.sla_violated", desc: "SLA-Frist verletzt" },
              { event: "task.created", desc: "Neue Aufgabe erstellt" },
              { event: "task.completed", desc: "Aufgabe abgeschlossen" },
              { event: "review.requested", desc: "Review angefordert" },
              { event: "escalation.triggered", desc: "Eskalation ausgelöst" },
              { event: "reviewer.assigned", desc: "Reviewer zugewiesen" },
              { event: "daily.brief.generated", desc: "Daily Brief generiert" },
            ].map((e) => (
              <div key={e.event} className="flex items-center gap-2 text-xs py-1.5 px-3 rounded-md border border-border/50 bg-card">
                <code className="font-mono text-[10px] text-primary">{e.event}</code>
                <span className="text-muted-foreground">— {e.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default IntegrationsPage;

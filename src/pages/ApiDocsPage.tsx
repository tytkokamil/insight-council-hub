import AppLayout from "@/components/layout/AppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Code, Copy, ExternalLink, Key, Lock, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

const copyCode = (text: string) => {
  navigator.clipboard.writeText(text);
};

const CodeBlock = ({ code, language = "bash" }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="p-4 rounded-lg bg-muted/40 border border-border/40 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => { copyCode(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-muted border border-border/60 hover:bg-muted/80"
      >
        <Copy className="w-3 h-3" />
      </button>
      {copied && <span className="absolute top-2 right-12 text-[10px] text-success">Kopiert!</span>}
    </div>
  );
};

const ApiDocsPage = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <PageHeader
          title="API Dokumentation"
          subtitle="Integriere Decivio in deine bestehenden Systeme und Workflows."
          role="system"
        />

        <div className="space-y-8 pb-12">
          {/* Authentication */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">Authentifizierung</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Alle API-Anfragen müssen einen gültigen API Key als Bearer Token im Authorization Header enthalten.
              API Keys können in den <a href="/settings" className="text-primary hover:underline">Einstellungen → API</a> generiert werden.
            </p>
            <CodeBlock code={`curl -H "Authorization: Bearer dk_live_DEIN_API_KEY" \\
  ${BASE_URL}/decisions`} />
            <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/30 bg-warning/5">
              <Lock className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <strong className="text-warning">Sicherheit:</strong> API Keys sind an deine Organisation gebunden.
                Gib sie niemals im Frontend-Code oder öffentlichen Repositories preis.
                Rate Limit: <strong>100 Anfragen/Stunde</strong> pro API Key.
              </div>
            </div>
          </section>

          {/* Endpoints */}
          <section className="space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">Endpoints</h2>
            </div>

            {/* GET /decisions */}
            <div className="space-y-3 p-4 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">GET</span>
                <code className="text-sm font-mono">/decisions</code>
              </div>
              <p className="text-sm text-muted-foreground">Listet alle nicht-vertraulichen Entscheidungen deiner Organisation auf.</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Query Parameter:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><code className="text-foreground">status</code> — Filter nach Status (draft, proposed, review, approved, implemented, …)</li>
                  <li><code className="text-foreground">limit</code> — Anzahl Ergebnisse (Standard: 50, Max: 100)</li>
                  <li><code className="text-foreground">offset</code> — Paginierung</li>
                </ul>
              </div>
              <CodeBlock code={`curl -H "Authorization: Bearer dk_live_DEIN_API_KEY" \\
  "${BASE_URL}/decisions?status=review&limit=10"`} />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                <CodeBlock language="json" code={`{
  "decisions": [
    {
      "id": "uuid",
      "title": "ERP System Migration",
      "status": "review",
      "priority": "high",
      "category": "strategic",
      "due_date": "2026-04-01",
      "cost_per_day": 850,
      "ai_risk_score": 72,
      "created_at": "2026-03-01T10:00:00Z",
      "updated_at": "2026-03-07T14:30:00Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}`} />
              </div>
            </div>

            {/* GET /decisions/:id */}
            <div className="space-y-3 p-4 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">GET</span>
                <code className="text-sm font-mono">/decisions/:id</code>
              </div>
              <p className="text-sm text-muted-foreground">Gibt eine einzelne Entscheidung mit allen Details zurück.</p>
              <CodeBlock code={`curl -H "Authorization: Bearer dk_live_DEIN_API_KEY" \\
  "${BASE_URL}/decisions/DECISION_UUID"`} />
            </div>

            {/* GET /decisions/:id/cod */}
            <div className="space-y-3 p-4 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">GET</span>
                <code className="text-sm font-mono">/decisions/:id/cod</code>
              </div>
              <p className="text-sm text-muted-foreground">Gibt die Cost-of-Delay Berechnung für eine Entscheidung zurück.</p>
              <CodeBlock code={`curl -H "Authorization: Bearer dk_live_DEIN_API_KEY" \\
  "${BASE_URL}/decisions/DECISION_UUID/cod"`} />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Response:</p>
                <CodeBlock language="json" code={`{
  "decision_id": "uuid",
  "title": "ERP System Migration",
  "status": "review",
  "cost_per_day": 850,
  "days_open": 14,
  "total_cost_of_delay": 11900,
  "currency": "EUR"
}`} />
              </div>
            </div>

            {/* POST /decisions */}
            <div className="space-y-3 p-4 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">POST</span>
                <code className="text-sm font-mono">/decisions</code>
              </div>
              <p className="text-sm text-muted-foreground">Erstellt eine neue Entscheidung.</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Body (JSON):</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><code className="text-foreground">title</code> <span className="text-destructive">*</span> — Titel (max. 500 Zeichen)</li>
                  <li><code className="text-foreground">description</code> — Beschreibung (max. 5000 Zeichen)</li>
                  <li><code className="text-foreground">category</code> — strategic, operational, financial, technical, hr, legal, compliance</li>
                  <li><code className="text-foreground">priority</code> — low, medium, high, critical (Standard: medium)</li>
                  <li><code className="text-foreground">due_date</code> — Fälligkeitsdatum (ISO 8601)</li>
                </ul>
              </div>
              <CodeBlock code={`curl -X POST \\
  -H "Authorization: Bearer dk_live_DEIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Cloud Migration bewerten", "priority": "high", "category": "strategic"}' \\
  "${BASE_URL}/decisions"`} />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Response (201):</p>
                <CodeBlock language="json" code={`{
  "decision": {
    "id": "new-uuid",
    "title": "Cloud Migration bewerten",
    "status": "draft",
    "priority": "high",
    "category": "strategic",
    "created_at": "2026-03-08T15:00:00Z"
  }
}`} />
              </div>
            </div>

            {/* PATCH /decisions/:id */}
            <div className="space-y-3 p-4 rounded-lg border border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">PATCH</span>
                <code className="text-sm font-mono">/decisions/:id</code>
              </div>
              <p className="text-sm text-muted-foreground">Aktualisiert eine bestehende Entscheidung (z.B. Status ändern).</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Body (JSON):</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                  <li><code className="text-foreground">status</code> — draft, proposed, review, approved, rejected, implemented, archived, cancelled</li>
                  <li><code className="text-foreground">priority</code> — low, medium, high, critical</li>
                  <li><code className="text-foreground">title</code> — Neuer Titel</li>
                  <li><code className="text-foreground">description</code> — Neue Beschreibung</li>
                </ul>
              </div>
              <CodeBlock code={`curl -X PATCH \\
  -H "Authorization: Bearer dk_live_DEIN_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"status": "approved"}' \\
  "${BASE_URL}/decisions/DECISION_UUID"`} />
            </div>
          </section>

          {/* Error Handling */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-semibold">Fehlerbehandlung</h2>
            </div>
            <div className="border border-border/40 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20">
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status Code</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Bedeutung</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-border/20"><td className="py-2 px-3 font-mono">200</td><td className="py-2 px-3 text-muted-foreground">Erfolg</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2 px-3 font-mono">201</td><td className="py-2 px-3 text-muted-foreground">Ressource erstellt</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2 px-3 font-mono">400</td><td className="py-2 px-3 text-muted-foreground">Ungültige Anfrage (fehlende/falsche Felder)</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2 px-3 font-mono">401</td><td className="py-2 px-3 text-muted-foreground">Ungültiger oder fehlender API Key</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2 px-3 font-mono">404</td><td className="py-2 px-3 text-muted-foreground">Ressource nicht gefunden</td></tr>
                  <tr className="border-b border-border/20"><td className="py-2 px-3 font-mono">405</td><td className="py-2 px-3 text-muted-foreground">Methode nicht erlaubt</td></tr>
                  <tr><td className="py-2 px-3 font-mono">429</td><td className="py-2 px-3 text-muted-foreground">Rate Limit überschritten (100 Req/h)</td></tr>
                </tbody>
              </table>
            </div>
            <CodeBlock language="json" code={`{
  "error": "Beschreibung des Fehlers"
}`} />
          </section>

          {/* Integration Examples */}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Integrationsbeispiele</h2>
            <div className="p-4 rounded-lg border border-border/40 space-y-2">
              <h3 className="text-sm font-medium">JavaScript / Node.js</h3>
              <CodeBlock language="javascript" code={`const response = await fetch("${BASE_URL}/decisions", {
  headers: {
    "Authorization": "Bearer dk_live_DEIN_API_KEY",
    "Content-Type": "application/json"
  }
});
const data = await response.json();
console.log(data.decisions);`} />
            </div>

            <div className="p-4 rounded-lg border border-border/40 space-y-2">
              <h3 className="text-sm font-medium">Python</h3>
              <CodeBlock language="python" code={`import requests

response = requests.get(
    "${BASE_URL}/decisions",
    headers={"Authorization": "Bearer dk_live_DEIN_API_KEY"}
)
decisions = response.json()["decisions"]`} />
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default ApiDocsPage;

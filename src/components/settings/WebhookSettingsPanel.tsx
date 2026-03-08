import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Webhook, Plus, Trash2, Loader2, CheckCircle2, AlertTriangle, Eye, EyeOff,
  RefreshCw, ChevronDown, ChevronUp, Copy, ExternalLink, Clock
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { de, enUS } from "date-fns/locale";

const AVAILABLE_EVENTS = [
  { key: "decision.created", label: "Entscheidung erstellt" },
  { key: "decision.approved", label: "Entscheidung genehmigt" },
  { key: "decision.rejected", label: "Entscheidung abgelehnt" },
  { key: "decision.overdue", label: "Entscheidung überfällig" },
  { key: "decision.escalated", label: "Entscheidung eskaliert" },
  { key: "decision.sla_violated", label: "SLA verletzt" },
  { key: "task.created", label: "Aufgabe erstellt" },
  { key: "task.completed", label: "Aufgabe abgeschlossen" },
  { key: "review.requested", label: "Review angefordert" },
  { key: "escalation.triggered", label: "Eskalation ausgelöst" },
  { key: "reviewer.assigned", label: "Reviewer zugewiesen" },
  { key: "daily.brief.generated", label: "Daily Brief generiert" },
];

interface WebhookEndpoint {
  id: string;
  url: string;
  secret_token: string;
  description: string | null;
  enabled: boolean;
  events: string[];
  created_at: string;
}

interface DeliveryLog {
  id: string;
  event: string;
  response_status: number | null;
  status: string;
  attempt: number;
  duration_ms: number | null;
  error_message: string | null;
  created_at: string;
}

const WebhookSettingsPanel = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<Record<string, DeliveryLog[]>>({});

  // Form state
  const [formUrl, setFormUrl] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("org_id")
      .eq("user_id", user!.id)
      .single();

    if (profile?.org_id) {
      setOrgId(profile.org_id);
      const { data } = await supabase
        .from("webhook_endpoints")
        .select("*")
        .eq("org_id", profile.org_id)
        .order("created_at", { ascending: false });
      setEndpoints((data as WebhookEndpoint[]) || []);
    }
    setLoading(false);
  };

  const generateSecret = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return "whsec_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const createEndpoint = async () => {
    if (!orgId || !formUrl.trim()) return;
    if (formEvents.length === 0) {
      toast.error(t("settings.webhookSelectEvents"));
      return;
    }
    setSaving(true);
    const secret = generateSecret();
    const { data, error } = await supabase
      .from("webhook_endpoints")
      .insert({
        org_id: orgId,
        url: formUrl.trim(),
        secret_token: secret,
        description: formDesc.trim() || null,
        events: formEvents,
      })
      .select("*")
      .single();

    if (error) {
      toast.error(t("settings.webhookCreateFailed"));
    } else if (data) {
      setEndpoints([data as WebhookEndpoint, ...endpoints]);
      setShowForm(false);
      setFormUrl("");
      setFormDesc("");
      setFormEvents([]);
      toast.success(t("settings.webhookCreated"));
    }
    setSaving(false);
  };

  const deleteEndpoint = async (id: string) => {
    await supabase.from("webhook_endpoints").delete().eq("id", id);
    setEndpoints(endpoints.filter(e => e.id !== id));
    toast.success(t("settings.webhookDeleted"));
  };

  const toggleEndpoint = async (id: string, enabled: boolean) => {
    await supabase.from("webhook_endpoints").update({ enabled }).eq("id", id);
    setEndpoints(endpoints.map(e => e.id === id ? { ...e, enabled } : e));
  };

  const loadDeliveries = async (webhookId: string) => {
    const { data } = await supabase
      .from("webhook_deliveries")
      .select("id, event, response_status, status, attempt, duration_ms, error_message, created_at")
      .eq("webhook_id", webhookId)
      .order("created_at", { ascending: false })
      .limit(50);
    setDeliveries(prev => ({ ...prev, [webhookId]: (data as DeliveryLog[]) || [] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadDeliveries(id);
    }
  };

  const testWebhook = async (endpoint: WebhookEndpoint) => {
    if (!orgId) return;
    setTesting(endpoint.id);
    try {
      const { error } = await supabase.functions.invoke("dispatch-webhook", {
        body: { event: "test.ping", org_id: orgId, test: true },
      });
      if (error) throw error;
      toast.success(t("settings.webhookTestSent"));
      // Reload deliveries
      setTimeout(() => loadDeliveries(endpoint.id), 1500);
    } catch {
      toast.error(t("settings.webhookTestFailed"));
    }
    setTesting(null);
  };

  const toggleEvent = (eventKey: string) => {
    setFormEvents(prev =>
      prev.includes(eventKey) ? prev.filter(e => e !== eventKey) : [...prev, eventKey]
    );
  };

  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  if (loading) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-1">
        <Webhook className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-medium">{t("settings.webhookTitle")}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">{t("settings.webhookDesc")}</p>

      {/* Existing endpoints */}
      {endpoints.length > 0 && (
        <div className="space-y-2 mb-4">
          {endpoints.map(ep => (
            <div key={ep.id} className="border border-border/60 rounded-lg overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-2 p-3">
                <Switch checked={ep.enabled} onCheckedChange={(v) => toggleEndpoint(ep.id, v)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono truncate">{ep.url}</p>
                  {ep.description && <p className="text-[10px] text-muted-foreground">{ep.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px]">{ep.events.length} events</Badge>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleExpand(ep.id)}>
                    {expandedId === ep.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* Expanded details */}
              {expandedId === ep.id && (
                <div className="border-t border-border/60 p-3 space-y-3 bg-muted/20">
                  {/* Secret */}
                  <SecretDisplay secret={ep.secret_token} t={t} />

                  {/* Events */}
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground mb-1">{t("settings.webhookEvents")}</p>
                    <div className="flex flex-wrap gap-1">
                      {ep.events.map(ev => (
                        <Badge key={ev} variant="secondary" className="text-[9px] font-mono">{ev}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => testWebhook(ep)} disabled={testing === ep.id} className="gap-1.5 text-xs">
                      {testing === ep.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                      {t("settings.webhookTest")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => loadDeliveries(ep.id)} className="gap-1.5 text-xs">
                      <RefreshCw className="w-3 h-3" /> {t("settings.webhookRefreshLog")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteEndpoint(ep.id)} className="gap-1.5 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="w-3 h-3" /> {t("settings.webhookDelete")}
                    </Button>
                  </div>

                  {/* Delivery log */}
                  <DeliveryLogTable deliveries={deliveries[ep.id] || []} t={t} locale={dateFnsLocale} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new webhook form */}
      {showForm ? (
        <div className="border border-primary/30 rounded-lg p-4 space-y-3 bg-primary/5">
          <h3 className="text-xs font-medium">{t("settings.webhookNew")}</h3>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">URL</label>
            <Input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://your-service.com/webhooks/decivio"
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t("settings.webhookDescription")}</label>
            <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder={t("settings.webhookDescPlaceholder")} />
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-2 block">{t("settings.webhookEvents")}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {AVAILABLE_EVENTS.map(ev => (
                <label key={ev.key} className="flex items-center gap-2 text-xs cursor-pointer py-0.5">
                  <Checkbox
                    checked={formEvents.includes(ev.key)}
                    onCheckedChange={() => toggleEvent(ev.key)}
                  />
                  <code className="text-[10px] font-mono">{ev.key}</code>
                  <span className="text-muted-foreground text-[10px]">— {ev.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={createEndpoint} disabled={saving || !formUrl.trim()} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {t("settings.webhookCreate")}
            </Button>
            <Button variant="ghost" onClick={() => { setShowForm(false); setFormUrl(""); setFormDesc(""); setFormEvents([]); }}>
              {t("settings.webhookCancel")}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)} className="w-full gap-1.5">
          <Plus className="w-3.5 h-3.5" /> {t("settings.webhookAdd")}
        </Button>
      )}

      {/* Payload info — collapsible */}
      <PayloadInfoCollapsible t={t} />
    </section>
  );
};

// ── Payload collapsible ──

const PayloadInfoCollapsible = ({ t }: { t: any }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {t("settings.webhookPayloadToggle", "Payload-Format anzeigen")}
      </button>
      {open && (
        <div className="mt-2 p-3 rounded-lg border border-border/60 bg-muted/30">
          <pre className="text-[9px] font-mono text-muted-foreground whitespace-pre-wrap">{`{
  "event": "decision.approved",
  "timestamp": "2026-03-08T10:30:00Z",
  "org_id": "...",
  "data": {
    "decision": {
      "id": "...",
      "title": "...",
      "status": "approved",
      "priority": "high",
      "cost_of_delay": 12500,
      "approved_by": "...",
      "approved_at": "..."
    }
  }
}`}</pre>
          <p className="text-[9px] text-muted-foreground mt-1.5">
            <strong>Header:</strong> X-Decivio-Signature: sha256=HMAC · X-Decivio-Event: decision.approved
          </p>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──

const SecretDisplay = ({ secret, t }: { secret: string; t: any }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground mb-1">Secret Token</p>
      <div className="flex items-center gap-1.5">
        <code className="text-[10px] font-mono bg-muted px-2 py-1 rounded flex-1 truncate">
          {visible ? secret : "••••••••••••••••••••••••"}
        </code>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setVisible(!visible)}>
          {visible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </Button>
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copy}>
          {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>
    </div>
  );
};

const DeliveryLogTable = ({ deliveries, t, locale }: { deliveries: DeliveryLog[]; t: any; locale: any }) => {
  if (deliveries.length === 0) {
    return <p className="text-[10px] text-muted-foreground italic">{t("settings.webhookNoDeliveries")}</p>;
  }

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground mb-1.5">{t("settings.webhookDeliveryLog")}</p>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {deliveries.map(d => (
          <div key={d.id} className="flex items-center gap-2 text-[10px] py-1 border-b border-border/50 last:border-0">
            {d.status === "success" ? (
              <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
            ) : d.status === "retrying" ? (
              <RefreshCw className="w-3 h-3 text-warning shrink-0" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
            )}
            <code className="font-mono text-muted-foreground">{d.event}</code>
            <span className="text-muted-foreground">
              {d.response_status ? `${d.response_status}` : "—"}
            </span>
            {d.duration_ms != null && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" /> {d.duration_ms}ms
              </span>
            )}
            {d.attempt > 1 && <Badge variant="outline" className="text-[8px]">#{d.attempt}</Badge>}
            <span className="text-muted-foreground ml-auto">
              {formatDistanceToNow(new Date(d.created_at), { addSuffix: true, locale })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebhookSettingsPanel;

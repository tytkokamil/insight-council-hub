import { useState, useCallback } from "react";
import { Calendar, RefreshCw, Copy, ExternalLink, Link2, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const CalendarSyncPanel = () => {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [icsToken, setIcsToken] = useState("cal_tk_" + Math.random().toString(36).slice(2, 14));
  const [copied, setCopied] = useState(false);

  const icsFeedUrl = `${window.location.origin}/api/calendar/${icsToken}.ics`;

  const handleConnectGoogle = () => {
    // OAuth flow would go here
    toast.info("Google Calendar OAuth wird in Kürze verfügbar sein", {
      description: "Nutzen Sie in der Zwischenzeit den ICS-Feed für die Synchronisierung.",
    });
  };

  const handleRegenerateToken = () => {
    const newToken = "cal_tk_" + Math.random().toString(36).slice(2, 14);
    setIcsToken(newToken);
    toast.success("Neuer Kalender-Token generiert", {
      description: "Der alte Token ist ab sofort ungültig.",
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(icsFeedUrl);
    setCopied(true);
    toast.success("ICS-Feed URL kopiert");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Google Calendar Sync */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Google Calendar Sync</h3>
          <Badge variant="outline" className="text-[10px]">One-Way</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Synchronisiert Entscheidungs-Deadlines und SLA-Warnungen als Events in Ihren Google Calendar. 
          Jedes Event enthält einen Link zurück zu Decivio.
        </p>

        {!googleConnected ? (
          <Button variant="outline" onClick={handleConnectGoogle} className="gap-2 text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Mit Google Calendar verbinden
          </Button>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/5 border border-success/20">
            <Check className="w-4 h-4 text-success" />
            <span className="text-sm text-foreground">Google Calendar verbunden</span>
            <Button variant="ghost" size="sm" className="ml-auto text-xs h-7" onClick={() => setGoogleConnected(false)}>
              Trennen
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">SLA-Warnungen als Reminder (24h Vorlauf)</span>
          </div>
          <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} />
        </div>
      </div>

      {/* ICS Feed */}
      <div className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">ICS-Feed (Outlook, Apple Calendar)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Abonnierbarer Kalender-Feed für Outlook, Apple Calendar und andere. 
          Token-basiert — kein Login nötig für die Kalender-App.
        </p>

        <div className="flex gap-2">
          <Input
            value={icsFeedUrl}
            readOnly
            className="text-xs font-mono flex-1"
          />
          <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-1.5 flex-shrink-0">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Kopiert" : "Kopieren"}
          </Button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button onClick={handleRegenerateToken} className="flex items-center gap-1 text-primary hover:underline">
            <RefreshCw className="w-3 h-3" />
            Token erneuern
          </button>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Token-basiert, kein Login nötig
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-muted/50 space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground">Anleitung:</p>
          <ol className="text-[10px] text-muted-foreground space-y-0.5 list-decimal list-inside">
            <li>ICS-Feed URL kopieren</li>
            <li>In Outlook: Datei → Konto hinzufügen → Internetkalender</li>
            <li>In Apple Calendar: Ablage → Neues Kalenderabonnement</li>
            <li>URL einfügen — Kalender aktualisiert sich automatisch</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CalendarSyncPanel;

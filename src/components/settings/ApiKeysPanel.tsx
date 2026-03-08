import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Copy, Trash2, Plus, Loader2, AlertTriangle, Eye, EyeOff, ExternalLink } from "lucide-react";

interface ApiKeyEntry {
  id: string;
  name: string;
  key_preview: string | null;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  is_active: boolean;
}

const EXPIRY_OPTIONS = [
  { label: "Nie", value: "never" },
  { label: "30 Tage", value: "30" },
  { label: "90 Tage", value: "90" },
  { label: "1 Jahr", value: "365" },
];

const ApiKeysPanel = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("never");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("api_keys")
      .select("id, name, key_preview, created_at, expires_at, last_used_at, is_active")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });
    setKeys((data as ApiKeyEntry[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!user || !newKeyName.trim()) {
      toast.error("Bitte gib einen Namen für den API Key ein.");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("api-keys", {
        body: { action: "create", name: newKeyName.trim(), expiry: newKeyExpiry },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setRevealedKey(data.key);
      setNewKeyName("");
      setNewKeyExpiry("never");
      setShowCreate(false);
      fetchKeys();
      toast.success("API Key erstellt");
    } catch (e: any) {
      toast.error(e.message || "Fehler beim Erstellen");
    }
    setCreating(false);
  };

  const handleRevoke = async (keyId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("api-keys", {
        body: { action: "revoke", keyId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("API Key widerrufen");
      fetchKeys();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const copyKey = () => {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

  const inputClass = "w-full h-9 px-3 rounded-md bg-background border border-input text-sm focus:border-foreground focus:outline-none focus:ring-1 focus:ring-ring/20 transition-colors";

  return (
    <div className="space-y-6">
      {/* Revealed Key Banner */}
      {revealedKey && (
        <div className="p-4 rounded-lg border border-warning/40 bg-warning/5">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-warning">Dieser Key wird nur einmal angezeigt!</p>
              <p className="text-xs text-muted-foreground mt-1">Kopiere ihn jetzt und speichere ihn sicher. Du kannst ihn danach nicht mehr einsehen.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 rounded bg-muted text-xs font-mono break-all select-all">{revealedKey}</code>
            <Button size="sm" variant="outline" onClick={copyKey} className="shrink-0 gap-1.5">
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Kopiert!" : "Kopieren"}
            </Button>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setRevealedKey(null)} className="mt-2 text-xs">
            Verstanden, schließen
          </Button>
        </div>
      )}

      {/* Create Form */}
      {showCreate ? (
        <div className="p-4 rounded-lg border border-border/60 bg-muted/20 space-y-3">
          <h3 className="text-sm font-medium">Neuen API Key generieren</h3>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name / Beschreibung</label>
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="z.B. Zapier Integration"
              className={inputClass}
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Ablaufdatum</label>
            <select value={newKeyExpiry} onChange={(e) => setNewKeyExpiry(e.target.value)} className={inputClass}>
              {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={creating} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
              Generieren
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Neuen API Key generieren
        </Button>
      )}

      {/* Keys List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Aktive API Keys</h3>
          <a href="/docs/api" target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            API Dokumentation <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : keys.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Keine API Keys vorhanden. Erstelle einen um loszulegen.</p>
        ) : (
          <div className="border border-border/40 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Key</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Erstellt</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Ablaufdatum</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Letzte Nutzung</th>
                  <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map(k => (
                  <tr key={k.id} className="border-b border-border/20 last:border-0">
                    <td className="py-2.5 px-3 font-medium">{k.name}</td>
                    <td className="py-2.5 px-3">
                      <code className="text-xs text-muted-foreground font-mono">{k.key_preview || "dk_live_•••"}</code>
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(k.created_at)}</td>
                    <td className="py-2.5 px-3 text-xs">
                      {k.expires_at ? (
                        new Date(k.expires_at) < new Date() 
                          ? <Badge variant="destructive" className="text-[10px]">Abgelaufen</Badge>
                          : <span className="text-muted-foreground">{formatDate(k.expires_at)}</span>
                      ) : (
                        <span className="text-muted-foreground">Nie</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground text-xs">{formatDate(k.last_used_at)}</td>
                    <td className="py-2.5 px-3 text-right">
                      {k.is_active ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevoke(k.id)}
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Widerrufen
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Widerrufen</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiKeysPanel;

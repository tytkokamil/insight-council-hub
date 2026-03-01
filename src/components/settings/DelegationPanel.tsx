import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Plus, Trash2, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface Delegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  active: boolean;
  created_at: string;
}

const DelegationPanel = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [incomingDelegations, setIncomingDelegations] = useState<Delegation[]>([]);
  const [profiles, setProfiles] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [delegateId, setDelegateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: myDelegations }, { data: incoming }, { data: allProfiles }] = await Promise.all([
      supabase.from("review_delegations").select("*").eq("delegator_id", user.id).order("created_at", { ascending: false }),
      supabase.from("review_delegations").select("*").eq("delegate_id", user.id).eq("active", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
    ]);
    if (myDelegations) setDelegations(myDelegations);
    if (incoming) setIncomingDelegations(incoming);
    if (allProfiles) setProfiles(allProfiles.filter(p => p.user_id !== user.id));
  };

  useEffect(() => { fetchData(); }, [user]);

  const getName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || "Unbekannt";

  const isActive = (d: Delegation) => {
    const today = new Date().toISOString().split("T")[0];
    return d.active && d.start_date <= today && d.end_date >= today;
  };

  const handleCreate = async () => {
    if (!user || !delegateId || !startDate || !endDate) return;
    setLoading(true);
    await supabase.from("review_delegations").insert({
      delegator_id: user.id,
      delegate_id: delegateId,
      start_date: startDate,
      end_date: endDate,
      reason: reason.trim() || null,
    });
    setDelegateId(""); setStartDate(""); setEndDate(""); setReason("");
    setShowForm(false);
    await fetchData();
    setLoading(false);
  };

  const handleDeactivate = async (id: string) => {
    setLoading(true);
    await supabase.from("review_delegations").update({ active: false }).eq("id", id);
    await fetchData();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await supabase.from("review_delegations").delete().eq("id", id);
    await fetchData();
    setLoading(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all text-sm";

  return (
    <div className="space-y-6">
      {/* Incoming delegations */}
      {incomingDelegations.length > 0 && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-primary" />
            Du vertrittst aktuell
          </h4>
          <div className="space-y-2">
            {incomingDelegations.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <span className="font-medium">{getName(d.delegator_id)}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {format(new Date(d.start_date), "dd.MM.yyyy")} – {format(new Date(d.end_date), "dd.MM.yyyy")}
                </span>
                {d.reason && <span className="text-xs text-muted-foreground">({d.reason})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My delegations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold">Meine Vertretungen</h4>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> Vertretung einrichten
          </Button>
        </div>

        {showForm && (
          <div className="p-4 rounded-lg bg-muted/30 border border-border/60 space-y-3 mb-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Vertreter*in</label>
              <select value={delegateId} onChange={e => setDelegateId(e.target.value)} className={inputClass}>
                <option value="" className="bg-card">Person auswählen...</option>
                {profiles.map(p => (
                  <option key={p.user_id} value={p.user_id} className="bg-card">{p.full_name || p.user_id}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Von</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Bis</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Grund (optional)</label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="z.B. Urlaub, Konferenz..." className={inputClass} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Button>
              <Button size="sm" onClick={handleCreate} disabled={!delegateId || !startDate || !endDate || loading}>
                Vertretung erstellen
              </Button>
            </div>
          </div>
        )}

        {delegations.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground text-center py-6">Keine Vertretungen eingerichtet.</p>
        ) : (
          <div className="space-y-2">
            {delegations.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <UserCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getName(d.delegate_id)}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(d.start_date), "dd.MM.yyyy")} – {format(new Date(d.end_date), "dd.MM.yyyy")}
                    {d.reason && <span className="ml-1">• {d.reason}</span>}
                  </p>
                </div>
                {isActive(d) ? (
                  <>
                    <Badge className="text-[10px] bg-success/10 text-success border-success/20">Aktiv</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDeactivate(d.id)} disabled={loading}>
                      Deaktivieren
                    </Button>
                  </>
                ) : d.active ? (
                  <>
                    <Badge variant="outline" className="text-[10px]">Geplant</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(d.id)} disabled={loading}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="text-[10px]">Beendet</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleDelete(d.id)} disabled={loading}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DelegationPanel;

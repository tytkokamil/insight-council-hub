import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { UserCheck, Plus, Trash2, Calendar as CalendarIcon, ArrowRight, Search, X, Shield } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Delegation {
  id: string;
  delegator_id: string;
  delegate_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  active: boolean;
  scope: string;
  scope_value: string | null;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
}

interface Team {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: "strategic", label: "Strategisch" },
  { value: "operational", label: "Operativ" },
  { value: "financial", label: "Finanzen" },
  { value: "technical", label: "Technisch" },
  { value: "hr", label: "Personal" },
  { value: "compliance", label: "Compliance" },
];

const DelegationPanel = () => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [incomingDelegations, setIncomingDelegations] = useState<Delegation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [delegateId, setDelegateId] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState("all");
  const [scopeValue, setScopeValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [{ data: myDelegations }, { data: incoming }, { data: allProfiles }, { data: allTeams }] = await Promise.all([
      supabase.from("review_delegations").select("*").eq("delegator_id", user.id).order("created_at", { ascending: false }),
      supabase.from("review_delegations").select("*").eq("delegate_id", user.id).eq("active", true).order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("teams").select("id, name"),
    ]);
    if (myDelegations) setDelegations(myDelegations as any);
    if (incoming) setIncomingDelegations(incoming as any);
    if (allProfiles) setProfiles(allProfiles.filter(p => p.user_id !== user.id));
    if (allTeams) setTeams(allTeams);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name || "Unbekannt";

  const filteredProfiles = useMemo(() => {
    if (!searchQuery.trim()) return profiles;
    const q = searchQuery.toLowerCase();
    return profiles.filter(p => p.full_name?.toLowerCase().includes(q) || p.user_id.includes(q));
  }, [profiles, searchQuery]);

  const isActive = (d: Delegation) => {
    const today = new Date().toISOString().split("T")[0];
    return d.active && d.start_date <= today && d.end_date >= today;
  };

  const getScopeLabel = (d: Delegation) => {
    if (d.scope === "all") return "Alle Reviews";
    if (d.scope === "category") {
      const cat = CATEGORIES.find(c => c.value === d.scope_value);
      return `Kategorie: ${cat?.label || d.scope_value}`;
    }
    if (d.scope === "team") {
      const team = teams.find(t => t.id === d.scope_value);
      return `Team: ${team?.name || d.scope_value}`;
    }
    return d.scope;
  };

  const handleCreate = async () => {
    if (!user || !delegateId || !startDate || !endDate) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }
    if (endDate <= startDate) {
      toast.error("Das Enddatum muss nach dem Startdatum liegen.");
      return;
    }
    if (scope !== "all" && !scopeValue) {
      toast.error("Bitte wählen Sie einen Umfang aus.");
      return;
    }

    setLoading(true);

    // Get org_id
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("user_id", user.id).single();

    const { error } = await supabase.from("review_delegations").insert({
      delegator_id: user.id,
      delegate_id: delegateId,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      reason: reason.trim() || null,
      scope,
      scope_value: scope === "all" ? null : scopeValue,
      org_id: profile?.org_id || null,
    } as any);

    if (error) {
      toast.error("Fehler beim Erstellen der Vertretung.");
      setLoading(false);
      return;
    }

    toast.success("Vertretung eingerichtet.");
    resetForm();
    await fetchData();
    setLoading(false);
  };

  const resetForm = () => {
    setDelegateId("");
    setStartDate(undefined);
    setEndDate(undefined);
    setReason("");
    setScope("all");
    setScopeValue("");
    setSearchQuery("");
    setShowForm(false);
  };

  const handleDeactivate = async (id: string) => {
    setLoading(true);
    await supabase.from("review_delegations").update({ active: false } as any).eq("id", id);
    toast.success("Vertretung beendet.");
    await fetchData();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await supabase.from("review_delegations").delete().eq("id", id);
    toast.success("Vertretung gelöscht.");
    await fetchData();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Incoming delegations */}
      {incomingDelegations.length > 0 && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-primary" />
            Sie vertreten aktuell
          </h4>
          <div className="space-y-2">
            {incomingDelegations.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm flex-wrap">
                <span className="font-medium">{getName(d.delegator_id)}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">
                  {format(new Date(d.start_date), "dd.MM.yyyy", { locale: de })} – {format(new Date(d.end_date), "dd.MM.yyyy", { locale: de })}
                </span>
                <Badge variant="outline" className="text-[10px]">{getScopeLabel(d)}</Badge>
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
          {!showForm && (
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Vertretung einrichten
            </Button>
          )}
        </div>

        {showForm && (
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-4 mb-4">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium">Abwesenheitsvertretung einrichten</h5>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Delegate selector with search */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Vertretung *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Kollegen suchen..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery && filteredProfiles.length > 0 && !delegateId && (
                <div className="mt-1 border border-border rounded-lg max-h-32 overflow-auto bg-popover">
                  {filteredProfiles.slice(0, 5).map(p => (
                    <button
                      key={p.user_id}
                      onClick={() => { setDelegateId(p.user_id); setSearchQuery(p.full_name || ""); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                    >
                      {p.full_name || p.user_id}
                    </button>
                  ))}
                </div>
              )}
              {delegateId && (
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <UserCheck className="w-3 h-3" />
                    {getName(delegateId)}
                    <button onClick={() => { setDelegateId(""); setSearchQuery(""); }} className="ml-1 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Von *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : "Startdatum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={date => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bis *</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : "Enddatum"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={date => date < (startDate || new Date())}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Umfang</label>
              <Select value={scope} onValueChange={v => { setScope(v); setScopeValue(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Reviews</SelectItem>
                  <SelectItem value="category">Nur bestimmte Kategorie</SelectItem>
                  <SelectItem value="team">Nur bestimmtes Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scope === "category" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Kategorie *</label>
                <Select value={scopeValue} onValueChange={setScopeValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {scope === "team" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Team *</label>
                <Select value={scopeValue} onValueChange={setScopeValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Team wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notiz für Vertreter (optional)</label>
              <Input
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="z.B. Urlaub, Konferenz, Elternzeit..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <Button size="sm" variant="ghost" onClick={resetForm}>Abbrechen</Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!delegateId || !startDate || !endDate || loading}
              >
                Vertretung erstellen
              </Button>
            </div>
          </div>
        )}

        {delegations.length === 0 && !showForm ? (
          <div className="text-center py-8">
            <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">Keine Vertretung aktiv</p>
            <p className="text-xs text-muted-foreground mt-1">Richten Sie eine Vertretung ein, damit Reviews in Ihrer Abwesenheit bearbeitet werden.</p>
            <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-xs" onClick={() => setShowForm(true)}>
              <Plus className="w-3 h-3" /> Vertretung einrichten
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {delegations.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <UserCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{getName(d.delegate_id)}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(d.start_date), "dd.MM.yyyy", { locale: de })} – {format(new Date(d.end_date), "dd.MM.yyyy", { locale: de })}
                    </p>
                    <Badge variant="outline" className="text-[10px]">{getScopeLabel(d)}</Badge>
                    {d.reason && <span className="text-[10px] text-muted-foreground">• {d.reason}</span>}
                  </div>
                </div>
                {isActive(d) ? (
                  <>
                    <Badge className="text-[10px] bg-accent-teal/10 text-accent-teal border-accent-teal/20">Aktiv</Badge>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleDeactivate(d.id)} disabled={loading}>
                      Beenden
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

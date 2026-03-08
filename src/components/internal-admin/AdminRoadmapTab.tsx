import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/edgeFunctionHelper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Download, ThumbsUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { kpiCard, kpiCardStyle, kpiLabel, kpiValue } from "./adminStyles";

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string | null;
  vote_count: number;
  planned_quarter: string | null;
  released_at: string | null;
  created_at: string;
}

const STATUSES = ["considering", "planned", "in_progress", "released", "rejected"] as const;
const CATEGORIES = ["feature", "improvement", "integration", "compliance"] as const;

const statusLabels: Record<string, string> = {
  considering: "Erwägt",
  planned: "Geplant",
  in_progress: "In Entwicklung",
  released: "Veröffentlicht",
  rejected: "Abgelehnt",
};

const statusColors: Record<string, string> = {
  considering: "#94A3B8",
  planned: "#3B82F6",
  in_progress: "#EAB308",
  released: "#22C55E",
  rejected: "#EF4444",
};

const AdminRoadmapTab = () => {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<Partial<RoadmapItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [voterEmails, setVoterEmails] = useState<{ item_id: string; emails: string[] } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase
      .from("roadmap_items" as any)
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setItems(data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Status summary counts
  const statusCounts = {
    planned: items.filter(i => i.status === "planned").length,
    in_progress: items.filter(i => i.status === "in_progress").length,
    released: items.filter(i => i.status === "released").length,
    total: items.length,
  };

  const filteredItems = statusFilter === "all" ? items : items.filter(i => i.status === statusFilter);

  const save = async () => {
    if (!editItem?.title?.trim()) { toast.error("Titel erforderlich"); return; }
    setSaving(true);
    const wasReleased = editItem.id ? items.find(i => i.id === editItem.id)?.status : null;
    const isNowReleased = editItem.status === "released";
    const payload = {
      title: editItem.title.trim(),
      description: editItem.description?.trim() || null,
      status: editItem.status || "planned",
      category: editItem.category || null,
      planned_quarter: editItem.planned_quarter?.trim() || null,
      released_at: editItem.status === "released" ? (editItem.released_at || new Date().toISOString()) : null,
    };

    if (editItem.id) {
      await supabase.from("roadmap_items" as any).update(payload as any).eq("id", editItem.id);
    } else {
      await supabase.from("roadmap_items" as any).insert(payload as any);
    }

    if (editItem.id && isNowReleased && wasReleased !== "released") {
      invokeWithTimeout("roadmap-release-notify", { item_id: editItem.id })
        .then(({ data, error }) => {
          if (error) console.error("Release notify error:", error);
          else toast.info(`${(data as any)?.voters_notified || 0} Voter benachrichtigt`);
        });
    }

    toast.success("Gespeichert");
    setEditItem(null);
    setSaving(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Roadmap-Item löschen?")) return;
    await supabase.from("roadmap_items" as any).delete().eq("id", id);
    toast.success("Gelöscht");
    load();
  };

  const loadVoters = async (itemId: string) => {
    const { data } = await supabase
      .from("roadmap_votes" as any)
      .select("voter_email")
      .eq("item_id", itemId)
      .order("voted_at", { ascending: false });
    setVoterEmails({ item_id: itemId, emails: (data || []).map((v: any) => v.voter_email) });
  };

  const exportVoters = (emails: string[]) => {
    const blob = new Blob([emails.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voter-emails.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-neutral-500" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Roadmap verwalten</h2>
        <Button
          size="sm"
          onClick={() => setEditItem({ title: "", status: "planned", category: "feature" })}
          className="gap-1.5"
          style={{ background: "#EF4444" }}
        >
          <Plus className="w-3.5 h-3.5" /> Neues Item
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>Gesamt</div>
          <div className={kpiValue}>{statusCounts.total}</div>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>Geplant</div>
          <div className={kpiValue} style={{ color: "#3B82F6" }}>{statusCounts.planned}</div>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>In Entwicklung</div>
          <div className={kpiValue} style={{ color: "#EAB308" }}>{statusCounts.in_progress}</div>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>Released</div>
          <div className={kpiValue} style={{ color: "#22C55E" }}>{statusCounts.released}</div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1 mb-4">
        {["all", ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${statusFilter === s ? "bg-red-500/20 text-red-400" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {s === "all" ? "Alle" : statusLabels[s]}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredItems.map(item => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: "#1e293b", background: "#0A0F1A" }}>
            <div className="w-1.5 h-8 rounded-full shrink-0" style={{ background: statusColors[item.status] || "#94A3B8" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-medium text-white truncate">{item.title}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{statusLabels[item.status]}</Badge>
                {item.category && <Badge variant="secondary" className="text-[10px] shrink-0">{item.category}</Badge>}
              </div>
              {item.planned_quarter && <span className="text-[10px] text-neutral-500">{item.planned_quarter}</span>}
            </div>
            <button onClick={() => loadVoters(item.id)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors">
              <ThumbsUp className="w-3 h-3" /> {item.vote_count}
            </button>
            <Button variant="ghost" size="sm" onClick={() => setEditItem(item)} className="text-neutral-400 hover:text-white h-7 w-7 p-0">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => remove(item.id)} className="text-neutral-400 hover:text-red-400 h-7 w-7 p-0">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="text-xs text-neutral-500 py-8 text-center">Keine Items in dieser Kategorie</p>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editItem} onOpenChange={o => !o && setEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem?.id ? "Item bearbeiten" : "Neues Roadmap-Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titel" value={editItem?.title || ""} onChange={e => setEditItem(prev => prev ? { ...prev, title: e.target.value } : prev)} />
            <Textarea placeholder="Beschreibung" rows={3} value={editItem?.description || ""} onChange={e => setEditItem(prev => prev ? { ...prev, description: e.target.value } : prev)} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={editItem?.status || "planned"} onValueChange={v => setEditItem(prev => prev ? { ...prev, status: v } : prev)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={editItem?.category || "feature"} onValueChange={v => setEditItem(prev => prev ? { ...prev, category: v } : prev)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Input placeholder="Quartal (z.B. Q2 2026)" value={editItem?.planned_quarter || ""} onChange={e => setEditItem(prev => prev ? { ...prev, planned_quarter: e.target.value } : prev)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Abbrechen</Button>
            <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Voters Dialog */}
      <Dialog open={!!voterEmails} onOpenChange={o => !o && setVoterEmails(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Voter ({voterEmails?.emails.length || 0})</DialogTitle>
          </DialogHeader>
          {voterEmails?.emails.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Noch keine Stimmen.</p>
          ) : (
            <div className="max-h-60 overflow-auto space-y-1">
              {voterEmails?.emails.map((e, i) => <p key={i} className="text-xs text-muted-foreground font-mono">{e}</p>)}
            </div>
          )}
          {(voterEmails?.emails.length || 0) > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => exportVoters(voterEmails!.emails)}>
              <Download className="w-3.5 h-3.5" /> CSV exportieren
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRoadmapTab;

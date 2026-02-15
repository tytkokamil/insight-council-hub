import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UserAvatar from "@/components/shared/UserAvatar";
import { ClipboardList, User, Clock, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";
import EditDecisionDialog from "@/components/decisions/EditDecisionDialog";
import DeleteDecisionDialog from "@/components/decisions/DeleteDecisionDialog";

interface Props {
  teamId: string;
}

const statusLabels: Record<string, string> = {
  draft: "Entwurf",
  review: "Review",
  approved: "Genehmigt",
  implemented: "Umgesetzt",
  rejected: "Abgelehnt",
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: "bg-destructive/20 text-destructive", label: "Kritisch" },
  high: { color: "bg-warning/20 text-warning", label: "Hoch" },
  medium: { color: "bg-primary/20 text-primary", label: "Mittel" },
  low: { color: "bg-muted text-muted-foreground", label: "Niedrig" },
};

const TeamTasksTab = ({ teamId }: Props) => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDecision, setEditDecision] = useState<any>(null);
  const [deleteDecision, setDeleteDecision] = useState<any>(null);

  const fetchData = async () => {
    const [{ data: decs }, { data: mems }] = await Promise.all([
      supabase
        .from("decisions")
        .select("*")
        .eq("team_id", teamId)
        .not("status", "in", '("implemented","rejected")')
        .order("priority", { ascending: true }),
      supabase
        .from("team_members")
        .select("*, profiles!team_members_user_id_fkey(full_name, avatar_url, user_id)")
        .eq("team_id", teamId),
    ]);
    setDecisions(decs || []);
    setMembers(mems || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [teamId]);

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = { unassigned: [] };
    members.forEach((m) => { map[m.user_id] = []; });
    decisions.forEach((d) => {
      if (d.assignee_id && map[d.assignee_id]) {
        map[d.assignee_id].push(d);
      } else {
        map.unassigned.push(d);
      }
    });
    return map;
  }, [decisions, members]);

  const memberMap = useMemo(() => {
    const m: Record<string, { name: string; avatar: string | null }> = {};
    members.forEach((mem) => {
      m[mem.user_id] = {
        name: mem.profiles?.full_name || "Unbekannt",
        avatar: mem.profiles?.avatar_url || null,
      };
    });
    return m;
  }, [members]);

  const assignDecision = async (decisionId: string, assigneeId: string | null) => {
    const { error } = await supabase
      .from("decisions")
      .update({ assignee_id: assigneeId, updated_at: new Date().toISOString() })
      .eq("id", decisionId);
    if (error) {
      toast.error("Zuweisung fehlgeschlagen");
      return;
    }
    toast.success("Zuweisung aktualisiert");
    fetchData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="text-center py-16">
        <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Keine offenen Aufgaben</p>
        <p className="text-xs text-muted-foreground mt-1">
          Erstelle Entscheidungen und weise sie Teammitgliedern zu
        </p>
      </div>
    );
  }

  const renderDecision = (d: any) => {
    const pc = priorityConfig[d.priority] || priorityConfig.medium;
    const isOverdue = d.due_date && new Date(d.due_date) < new Date();

    return (
      <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium truncate">{d.title}</span>
            <Badge variant="outline" className={`text-[10px] shrink-0 ${pc.color}`}>{pc.label}</Badge>
            {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span>{statusLabels[d.status] || d.status}</span>
            {d.due_date && (
              <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                <Clock className="w-3 h-3" />
                {format(new Date(d.due_date), "dd.MM.yy", { locale: de })}
              </span>
            )}
          </div>
        </div>
        <Select
          value={d.assignee_id || "unassigned"}
          onValueChange={(v) => assignDecision(d.id, v === "unassigned" ? null : v)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Zuweisen..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.user_id} value={m.user_id}>
                {m.profiles?.full_name || "Unbekannt"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditDecision(d)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={() => setDeleteDecision(d)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Unassigned */}
      {grouped.unassigned.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <ClipboardList className="w-3.5 h-3.5" />
            Nicht zugewiesen ({grouped.unassigned.length})
          </h3>
          <div className="space-y-2">
            {grouped.unassigned.map(renderDecision)}
          </div>
        </div>
      )}

      {/* Per member */}
      {members.map((m) => {
        const memberDecs = grouped[m.user_id] || [];
        if (memberDecs.length === 0) return null;
        return (
          <div key={m.user_id}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <UserAvatar avatarUrl={m.profiles?.avatar_url} fullName={m.profiles?.full_name} size="sm" />
              {m.profiles?.full_name || "Unbekannt"} ({memberDecs.length})
            </h3>
            <div className="space-y-2">
              {memberDecs.map(renderDecision)}
            </div>
          </div>
        );
      })}

      {/* Members without tasks */}
      {members.filter((m) => (grouped[m.user_id] || []).length === 0).length > 0 && (
        <div className="rounded-lg border border-dashed border-border p-4">
          <p className="text-xs text-muted-foreground text-center">
            {members.filter((m) => (grouped[m.user_id] || []).length === 0).map((m) => m.profiles?.full_name).join(", ")} – keine zugewiesenen Aufgaben
          </p>
        </div>
      )}

      {editDecision && (
        <EditDecisionDialog
          decision={editDecision}
          open={!!editDecision}
          onOpenChange={(open) => !open && setEditDecision(null)}
          onUpdated={fetchData}
        />
      )}
      {deleteDecision && (
        <DeleteDecisionDialog
          decision={deleteDecision}
          open={!!deleteDecision}
          onOpenChange={(open) => !open && setDeleteDecision(null)}
          onDeleted={fetchData}
        />
      )}
    </div>
  );
};

export default TeamTasksTab;

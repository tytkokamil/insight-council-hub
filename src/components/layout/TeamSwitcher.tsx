import { useEffect, useState, useCallback, useRef, memo } from "react";
import { Building2, ChevronDown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";


interface Team {
  id: string;
  name: string;
}

const TeamSwitcher = memo(({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuth();
  const { selectedTeamId, setSelectedTeamId } = useTeamContext();
  const [teams, setTeams] = useState<Team[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  const teamsLoaded = useRef(false);

  useEffect(() => {
    if (!user) return;
    const fetchTeams = async () => {
      const { data: memberTeams } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("user_id", user.id);
      const memberTeamIds = memberTeams?.map((t) => t.team_id) || [];

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      const isAdminUser = (roleData?.length ?? 0) > 0;
      setIsAdmin(isAdminUser);

      let query = supabase.from("teams").select("id, name").order("name");
      if (!isAdminUser && memberTeamIds.length > 0) {
        query = query.in("id", memberTeamIds);
      } else if (!isAdminUser) {
        teamsLoaded.current = true;
        setTeams([]);
        return;
      }

      const { data } = await query;
      teamsLoaded.current = true;
      setTeams(data || []);
    };
    if (!teamsLoaded.current) {
      fetchTeams();
    }
  }, [user?.id]);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user || teams.length === 0) return;

    const { data: reads } = await supabase
      .from("team_chat_reads")
      .select("team_id, last_read_at")
      .eq("user_id", user.id);

    const readMap: Record<string, string> = {};
    reads?.forEach((r) => { readMap[r.team_id] = r.last_read_at; });

    const counts: Record<string, number> = {};
    for (const team of teams) {
      const lastRead = readMap[team.id];
      let query = supabase
        .from("team_messages")
        .select("id", { count: "exact", head: true })
        .eq("team_id", team.id)
        .neq("user_id", user.id);
      if (lastRead) {
        query = query.gt("created_at", lastRead);
      }
      const { count } = await query;
      if (count && count > 0) counts[team.id] = count;
    }
    setUnreadCounts(counts);
  }, [user?.id, teams]);

  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Listen for new messages in real-time to update badges
  useEffect(() => {
    if (teams.length === 0) return;
    const channel = supabase
      .channel("team-chat-unread")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "team_messages",
      }, () => {
        fetchUnreadCounts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teams, fetchUnreadCounts]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);
  const label = selectedTeam ? selectedTeam.name : "Persönlich";
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (teamsLoaded.current && teams.length === 0 && !isAdmin) return null;

  return (
    <div className="relative px-3 py-2 border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium hover:bg-muted/50 transition-colors"
        title={collapsed ? label : undefined}
      >
        <div className="relative w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          {selectedTeamId ? (
            <Building2 className="w-3.5 h-3.5 text-primary" />
          ) : (
            <User className="w-3.5 h-3.5 text-primary" />
          )}
          {collapsed && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-0.5">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="truncate text-foreground">{label}</span>
            <div className="flex items-center gap-1.5">
              {totalUnread > 0 && (
                <span className="min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </div>
        )}
      </button>

      {open && (
        <div
          className="fixed z-[100] w-56 mt-1 rounded-lg border border-border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100"
          style={{ left: collapsed ? 64 : 12, marginTop: 4 }}
        >
          <div className="py-1">
            <button
              onClick={() => { setSelectedTeamId(null); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-muted/50 ${
                !selectedTeamId ? "bg-primary/10 text-primary font-medium" : "text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Persönlich
            </button>
            {teams.length > 0 && (
              <div className="border-t border-border/50 my-1" />
            )}
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => { setSelectedTeamId(team.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors hover:bg-muted/50 ${
                  selectedTeamId === team.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate flex-1 text-left">{team.name}</span>
                {unreadCounts[team.id] > 0 && (
                  <span className="min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                    {unreadCounts[team.id] > 99 ? "99+" : unreadCounts[team.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default TeamSwitcher;

import { useEffect, useState, useCallback, useRef, memo } from "react";
import { Building2, ChevronDown, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamContext } from "@/hooks/useTeamContext";
import { useTranslation } from "react-i18next";

interface Team {
  id: string;
  name: string;
}

const TeamSwitcher = memo(({ collapsed }: { collapsed: boolean }) => {
  const { user } = useAuth();
  const { selectedTeamId, setSelectedTeamId } = useTeamContext();
  const { t } = useTranslation();
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
        .single();
      const isAdminUser = roleData?.role === "org_owner" || roleData?.role === "org_admin";
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

  const selectedTeam = teams.find((tm) => tm.id === selectedTeamId);
  const label = selectedTeam ? selectedTeam.name : t("teamSwitcher.personal");
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (teamsLoaded.current && teams.length === 0 && !isAdmin) return null;

  return (
    <div className="relative px-2 py-1.5 border-b border-border/40">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 h-8 rounded-md text-[13px] font-medium hover:bg-foreground/[0.04] transition-colors"
        title={collapsed ? label : undefined}
      >
        <div className="relative w-5 h-5 rounded bg-foreground/[0.06] flex items-center justify-center shrink-0">
          {selectedTeamId ? (
            <Building2 className="w-3 h-3 text-muted-foreground" />
          ) : (
            <User className="w-3 h-3 text-muted-foreground" />
          )}
          {collapsed && totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[12px] h-[12px] rounded-full bg-foreground text-background text-[8px] font-bold flex items-center justify-center px-0.5">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="truncate text-foreground/80">{label}</span>
            <div className="flex items-center gap-1">
              {totalUnread > 0 && (
                <span className="min-w-[16px] h-[16px] rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center px-0.5">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 text-muted-foreground/50 transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </div>
        )}
      </button>

      {open && (
        <div
          className="fixed z-[100] w-52 mt-1 rounded-lg border border-border/60 bg-popover shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100"
          style={{ left: collapsed ? 64 : 12, marginTop: 4 }}
        >
          <div className="py-1">
            <button
              onClick={() => { setSelectedTeamId(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] transition-colors hover:bg-foreground/[0.04] ${
                !selectedTeamId ? "text-foreground font-medium" : "text-muted-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5 opacity-60" />
              {t("teamSwitcher.personal")}
            </button>
            {teams.length > 0 && (
              <div className="border-t border-border/30 my-0.5" />
            )}
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => { setSelectedTeamId(team.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[13px] transition-colors hover:bg-foreground/[0.04] ${
                  selectedTeamId === team.id ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                <Building2 className="w-3.5 h-3.5 opacity-60" />
                <span className="truncate flex-1 text-left">{team.name}</span>
                {unreadCounts[team.id] > 0 && (
                  <span className="min-w-[16px] h-[16px] rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center px-0.5">
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

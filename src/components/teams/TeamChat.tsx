import { useState, useEffect, useRef } from "react";
import { Send, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface TeamMessage {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  decision_id: string | null;
  created_at: string;
}

interface TeamChatProps {
  teamId: string;
  teamName: string;
}

const TeamChat = ({ teamId, teamName }: TeamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("team_messages")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((p) => { map[p.user_id] = p.full_name || "Unbekannt"; });
      setProfiles(map);
    }
  };

  const fetchDecisions = async () => {
    const { data } = await supabase.from("decisions").select("id, title").eq("team_id", teamId);
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((d) => { map[d.id] = d.title; });
      setDecisions(map);
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    const now = new Date().toISOString();
    // Upsert last_read_at
    const { data: existing } = await supabase
      .from("team_chat_reads")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("team_chat_reads").update({ last_read_at: now }).eq("id", existing.id);
    } else {
      await supabase.from("team_chat_reads").insert({ team_id: teamId, user_id: user.id, last_read_at: now });
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchProfiles();
    fetchDecisions();
    markAsRead();

    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "team_messages",
        filter: `team_id=eq.${teamId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as TeamMessage]);
        markAsRead(); // auto-mark as read when chat is open
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "team_messages",
        filter: `team_id=eq.${teamId}`,
      }, (payload) => {
        setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [teamId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    await supabase.from("team_messages").insert({
      team_id: teamId,
      user_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("team_messages").delete().eq("id", id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (userId: string) => {
    const name = profiles[userId];
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Noch keine Nachrichten in {teamName}.</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Starte die Konversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : ""}`}>
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary">{getInitials(msg.user_id)}</span>
                </div>
                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium">{profiles[msg.user_id] || "Unbekannt"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), "HH:mm", { locale: de })}
                    </span>
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className={`inline-block px-3 py-2 rounded-xl text-sm ${
                    isOwn ? "bg-primary text-primary-foreground" : "bg-muted/60"
                  }`}>
                    {msg.content}
                  </div>
                  {msg.decision_id && decisions[msg.decision_id] && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                      <FileText className="w-3 h-3" />
                      <span>{decisions[msg.decision_id]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;

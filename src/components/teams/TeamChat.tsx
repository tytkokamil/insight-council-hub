import { useState, useEffect, useRef } from "react";
import { Send, FileText, Trash2, Paperclip, Image, File, X, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { toast } from "sonner";

interface TeamMessage {
  id: string;
  team_id: string;
  user_id: string;
  content: string;
  decision_id: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
}

interface TeamChatProps {
  teamId: string;
  teamName: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const TeamChat = ({ teamId, teamName }: TeamChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("team_messages")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })
      .limit(200);
    if (data) setMessages(data as TeamMessage[]);
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
        markAsRead();
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Datei zu groß (max. 10 MB)");
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File): Promise<{ url: string; name: string; type: string } | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${teamId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) {
      toast.error("Datei-Upload fehlgeschlagen");
      return null;
    }
    const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name, type: file.type };
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile) || !user) return;
    setSending(true);

    let fileData: { url: string; name: string; type: string } | null = null;
    if (selectedFile) {
      fileData = await uploadFile(selectedFile);
      if (!fileData && !newMessage.trim()) {
        setSending(false);
        return;
      }
    }

    await supabase.from("team_messages").insert({
      team_id: teamId,
      user_id: user.id,
      content: newMessage.trim() || (fileData ? fileData.name : ""),
      file_url: fileData?.url ?? null,
      file_name: fileData?.name ?? null,
      file_type: fileData?.type ?? null,
    });

    setNewMessage("");
    clearFile();
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

  const isImage = (type: string | null) => type?.startsWith("image/");

  const renderAttachment = (msg: TeamMessage) => {
    if (!msg.file_url) return null;
    if (isImage(msg.file_type)) {
      return (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
          <img
            src={msg.file_url}
            alt={msg.file_name || "Bild"}
            className="max-w-[240px] max-h-[180px] rounded-lg object-cover border border-border"
          />
        </a>
      );
    }
    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg bg-muted/40 border border-border hover:bg-muted/60 transition-colors max-w-[240px]"
      >
        <File className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs truncate">{msg.file_name || "Datei"}</span>
        <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-auto" />
      </a>
    );
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
                  {msg.content && !(msg.file_url && msg.content === msg.file_name) && (
                    <div className={`inline-block px-3 py-2 rounded-xl text-sm ${
                      isOwn ? "bg-primary text-primary-foreground" : "bg-muted/60"
                    }`}>
                      {msg.content}
                    </div>
                  )}
                  {renderAttachment(msg)}
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

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-border bg-muted/30 flex items-center gap-2">
          {filePreview ? (
            <img src={filePreview} alt="Vorschau" className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
              <File className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <span className="text-xs truncate flex-1">{selectedFile.name}</span>
          <button onClick={clearFile} className="text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Datei anhängen"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
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
            disabled={(!newMessage.trim() && !selectedFile) || sending}
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

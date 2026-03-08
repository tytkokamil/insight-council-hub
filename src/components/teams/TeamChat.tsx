import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, FileText, Trash2, Paperclip, File, X, Download, Link2, AtSign } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  initialLinkedDecisionId?: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** Renders message content with highlighted @mentions */
const RenderMentionContent = ({ content, isOwn }: { content: string; isOwn: boolean }) => {
  const parts = content.split(/(@\[([^\]]+)\]\([a-f0-9\-]{36}\))/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (i % 3 === 1) return null;
        if (i % 3 === 2) {
          return (
            <span key={i} className={cn(
              "inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-xs font-medium",
              isOwn ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
            )}>
              <AtSign className="w-3 h-3" />
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

const TeamChat = ({ teamId, teamName, initialLinkedDecisionId }: TeamChatProps) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar: string | null }>>({});
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [linkedDecisionId, setLinkedDecisionId] = useState<string | null>(null);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [linkFilter, setLinkFilter] = useState("");
  const [linkMenuIndex, setLinkMenuIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const linkMenuRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const linkMatch = newMessage.match(/\/link\s*(.*)/i);
  const isLinkMode = !!linkMatch;

  useEffect(() => {
    if (isLinkMode) {
      setShowLinkMenu(true);
      setLinkFilter(linkMatch![1] || "");
      setLinkMenuIndex(0);
    } else {
      setShowLinkMenu(false);
      setLinkFilter("");
    }
  }, [newMessage]);

  const filteredDecisions = useMemo(() => {
    const entries = Object.entries(decisions);
    if (!linkFilter) return entries;
    const lower = linkFilter.toLowerCase();
    return entries.filter(([, title]) => title.toLowerCase().includes(lower));
  }, [decisions, linkFilter]);

  const profilesList = useMemo(() => Object.entries(profiles).map(([id, p]) => ({ user_id: id, full_name: p.name, avatar: p.avatar })), [profiles]);

  const filteredMentionProfiles = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return profilesList
      .filter(p => p.user_id !== user?.id && p.full_name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, profilesList, user?.id]);

  const insertMention = useCallback((profile: { user_id: string; full_name: string }) => {
    const textBefore = newMessage.slice(0, mentionCursorPos);
    const textAfter = newMessage.slice(mentionCursorPos);
    const atStart = textBefore.lastIndexOf("@");
    const mention = `@[${profile.full_name}](${profile.user_id}) `;
    const result = textBefore.slice(0, atStart) + mention + textAfter;
    setNewMessage(result);
    setMentionQuery(null);
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = atStart + mention.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  }, [newMessage, mentionCursorPos]);

  const selectDecision = (id: string, title: string) => {
    setLinkedDecisionId(id);
    setNewMessage(newMessage.replace(/\/link\s*.*/i, "").trimEnd());
    setShowLinkMenu(false);
    toast.success(t("teamChat.decisionLinked", { title }));
    inputRef.current?.focus();
  };

  const clearLinkedDecision = () => {
    setLinkedDecisionId(null);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("teamChat.fileTooLarge"));
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setFilePreview(URL.createObjectURL(file));
    } else {
      setFilePreview(null);
    }
  };

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
    const { data } = await supabase.from("profiles").select("user_id, full_name, avatar_url");
    if (data) {
      const map: Record<string, { name: string; avatar: string | null }> = {};
      data.forEach((p) => { map[p.user_id] = { name: p.full_name || t("team.unknown"), avatar: p.avatar_url }; });
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

  // Apply initial linked decision from URL param
  useEffect(() => {
    if (initialLinkedDecisionId && Object.keys(decisions).length > 0) {
      setLinkedDecisionId(initialLinkedDecisionId);
      if (decisions[initialLinkedDecisionId]) {
        toast.success(t("teamChat.decisionLinked", { title: decisions[initialLinkedDecisionId] }));
      }
      // Focus the input
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [initialLinkedDecisionId, decisions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t("teamChat.fileTooLarge"));
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

  const uploadFile = async (file: globalThis.File): Promise<{ url: string; name: string; type: string } | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${teamId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (error) {
      toast.error(t("teamChat.uploadFailed"));
      return null;
    }
    const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    return { url: urlData.publicUrl, name: file.name, type: file.type };
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !selectedFile && !linkedDecisionId) || !user) return;
    setSending(true);

    let fileData: { url: string; name: string; type: string } | null = null;
    if (selectedFile) {
      fileData = await uploadFile(selectedFile);
      if (!fileData && !newMessage.trim() && !linkedDecisionId) {
        setSending(false);
        return;
      }
    }

    const content = newMessage.trim() || (fileData ? fileData.name : (linkedDecisionId ? `📋 ${decisions[linkedDecisionId] || t("teamChat.decision")}` : ""));

    await supabase.from("team_messages").insert({
      team_id: teamId,
      user_id: user.id,
      content,
      decision_id: linkedDecisionId,
      file_url: fileData?.url ?? null,
      file_name: fileData?.name ?? null,
      file_type: fileData?.type ?? null,
    });

    setNewMessage("");
    setLinkedDecisionId(null);
    clearFile();
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("team_messages").delete().eq("id", id);
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setNewMessage(val);
    setMentionCursorPos(pos);
    if (!val.match(/\/link\s*/i)) {
      const textBefore = val.slice(0, pos);
      const atMatch = textBefore.match(/@(\w*)$/);
      if (atMatch) {
        setMentionQuery(atMatch[1]);
        setMentionIndex(0);
      } else {
        setMentionQuery(null);
      }
    } else {
      setMentionQuery(null);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mentionQuery !== null && filteredMentionProfiles.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredMentionProfiles.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredMentionProfiles[mentionIndex]); return; }
      if (e.key === "Escape") { setMentionQuery(null); return; }
    }
    if (showLinkMenu && filteredDecisions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setLinkMenuIndex((i) => Math.min(i + 1, filteredDecisions.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setLinkMenuIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter") { e.preventDefault(); const [id, title] = filteredDecisions[linkMenuIndex]; selectDecision(id, title); return; }
      if (e.key === "Escape") { e.preventDefault(); setShowLinkMenu(false); setNewMessage(newMessage.replace(/\/link\s*.*/i, "")); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getProfileName = (userId: string) => profiles[userId]?.name || t("team.unknown");

  const isImage = (type: string | null) => type?.startsWith("image/");

  const renderAttachment = (msg: TeamMessage) => {
    if (!msg.file_url) return null;
    if (isImage(msg.file_type)) {
      return (
        <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
          <img
            src={msg.file_url}
            alt={msg.file_name || t("teamChat.image")}
            className="max-w-[240px] max-h-[180px] rounded-lg object-cover border border-border/60"
          />
        </a>
      );
    }
    return (
      <a
        href={msg.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors max-w-[240px]"
      >
        <File className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs truncate">{msg.file_name || t("teamChat.file")}</span>
        <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-auto" />
      </a>
    );
  };

  return (
    <div
      className="flex flex-col h-[500px] relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center backdrop-blur-sm">
          <div className="text-center">
            <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">{t("teamChat.dropFile")}</p>
          </div>
        </div>
      )}
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t("teamChat.noMessages", { team: teamName })}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t("teamChat.startConversation")}</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex gap-2.5 group ${isOwn ? "flex-row-reverse" : ""}`}>
                {!isOwn && <UserAvatar avatarUrl={profiles[msg.user_id]?.avatar} fullName={profiles[msg.user_id]?.name} size="sm" />}
                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 mb-0.5 ${isOwn ? "justify-end" : ""}`}>
                    {!isOwn && <span className="text-[11px] font-medium">{getProfileName(msg.user_id)}</span>}
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(msg.created_at), "HH:mm", { locale: dateFnsLocale })}
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
                      isOwn ? "text-white" : ""
                    } ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <RenderMentionContent content={msg.content} isOwn={isOwn} />
                    </div>
                  )}
                  {renderAttachment(msg)}
                  {msg.decision_id && decisions[msg.decision_id] && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-primary bg-primary/5 border border-primary/20 rounded-md px-2 py-1 inline-flex">
                      <Link2 className="w-3 h-3" />
                      <span className="font-medium">{decisions[msg.decision_id]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Linked decision preview */}
      {linkedDecisionId && (
        <div className="px-4 py-2 border-t border-border/60 bg-primary/5 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-medium text-primary truncate flex-1">
            {decisions[linkedDecisionId] || t("teamChat.decision")}
          </span>
          <button onClick={clearLinkedDecision} className="text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="px-4 py-2 border-t border-border/60 bg-muted/30 flex items-center gap-2">
          {filePreview ? (
            <img src={filePreview} alt={t("teamChat.preview")} className="w-10 h-10 rounded object-cover" />
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
      <div className="border-t border-border/60 px-4 py-3 relative">
        {showLinkMenu && (
          <div
            ref={linkMenuRef}
            className="absolute bottom-full left-4 right-4 mb-1 bg-popover border border-border/60 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50"
          >
            {filteredDecisions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {t("teamChat.noDecisionsFound")}
              </div>
            ) : (
              filteredDecisions.map(([id, title], i) => (
                <button
                  key={id}
                  onClick={() => selectDecision(id, title)}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                    i === linkMenuIndex ? "bg-accent" : ""
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{title}</span>
                </button>
              ))
            )}
            <div className="px-3 py-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
              {t("teamChat.navHint")}
            </div>
          </div>
        )}
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
            title={t("teamChat.attachFile")}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          {mentionQuery !== null && filteredMentionProfiles.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border/60 rounded-lg shadow-lg overflow-hidden z-50">
              <p className="text-[10px] text-muted-foreground px-3 pt-2 pb-1 font-semibold uppercase tracking-wider">{t("teamChat.mentionPeople")}</p>
              {filteredMentionProfiles.map((p, i) => (
                <button
                  key={p.user_id}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                    i === mentionIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                  )}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(p); }}
                  onMouseEnter={() => setMentionIndex(i)}
                >
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground shrink-0">
                    {(p.full_name || "?")[0].toUpperCase()}
                  </div>
                  <span className="truncate">{p.full_name}</span>
                </button>
              ))}
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben... @ erwähnen · /entscheidung verknüpfen · /aufgabe erstellen"
            className="flex-1 h-10 px-3 rounded-lg bg-muted/50 border border-border/60 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-xs"
          />
          <Button
            onClick={handleSend}
            disabled={(!newMessage.trim() && !selectedFile && !linkedDecisionId) || sending}
            size="icon"
            className="h-10 w-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamChat;

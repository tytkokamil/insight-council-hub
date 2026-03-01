import { useState, useEffect, useRef, useMemo } from "react";
import { Bell, Check, CheckCheck, FileText, Zap, Calendar, X, AtSign, MessageSquare, Settings, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast as sonnerToast } from "sonner";
import { useTranslation } from "react-i18next";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: string;
  read: boolean;
  created_at: string;
  decision_id: string | null;
}

const typeIcon: Record<string, typeof Bell> = {
  escalation: Zap,
  status_change: FileText,
  review: FileText,
  deadline: Calendar,
  mention: AtSign,
  system: Settings,
};

const typeColor: Record<string, string> = {
  escalation: "bg-destructive/10 text-destructive",
  status_change: "bg-primary/10 text-primary",
  review: "bg-warning/10 text-warning",
  deadline: "bg-accent/10 text-accent-foreground",
  mention: "bg-primary/10 text-primary",
  system: "bg-muted text-muted-foreground",
};

type FilterType = "all" | "mentions" | "reviews" | "escalations" | "system";

const filterMatch = (type: string, filter: FilterType): boolean => {
  if (filter === "all") return true;
  if (filter === "mentions") return type === "mention";
  if (filter === "reviews") return type === "review";
  if (filter === "escalations") return type === "escalation";
  if (filter === "system") return type === "system" || type === "status_change";
  return true;
};

interface GroupedNotifications {
  label: string;
  items: Notification[];
}

const NotificationCenter = ({ collapsed, position = "sidebar" }: { collapsed: boolean; position?: "sidebar" | "topbar" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const { t, i18n } = useTranslation();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const filters: { key: FilterType; label: string; icon: typeof Bell }[] = [
    { key: "all", label: t("notif.all"), icon: Bell },
    { key: "mentions", label: t("notif.mentions"), icon: AtSign },
    { key: "reviews", label: t("notif.reviews"), icon: FileText },
    { key: "escalations", label: t("notif.escalations"), icon: Zap },
    { key: "system", label: t("notif.system"), icon: Settings },
  ];

  const groupByDate = (notifications: Notification[]): GroupedNotifications[] => {
    const groups: GroupedNotifications[] = [];
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const older: Notification[] = [];

    notifications.forEach((n) => {
      const d = new Date(n.created_at);
      if (isToday(d)) today.push(n);
      else if (isYesterday(d)) yesterday.push(n);
      else if (isThisWeek(d)) thisWeek.push(n);
      else older.push(n);
    });

    if (today.length > 0) groups.push({ label: t("notif.today"), items: today });
    if (yesterday.length > 0) groups.push({ label: t("notif.yesterday"), items: yesterday });
    if (thisWeek.length > 0) groups.push({ label: t("notif.thisWeek"), items: thisWeek });
    if (older.length > 0) groups.push({ label: t("notif.older"), items: older });

    return groups;
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = useMemo(
    () => notifications.filter((n) => filterMatch(n.type, activeFilter)),
    [notifications, activeFilter]
  );

  const grouped = useMemo(() => groupByDate(filteredNotifications), [filteredNotifications, t]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setNotifications(data);
    };
    fetchNotifs();

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev].slice(0, 50));
            sonnerToast(newNotif.title, {
              description: newNotif.message || undefined,
              duration: 6000,
              action: newNotif.decision_id
                ? {
                    label: t("notif.show"),
                    onClick: () => navigateRef.current(`/decisions/${newNotif.decision_id}`),
                  }
                : undefined,
            });
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotifClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
    if (n.decision_id) {
      setOpen(false);
      navigate(`/decisions/${n.decision_id}`);
    }
  };

  return (
    <div ref={ref} className="relative px-2" role="region" aria-label={t("notif.title")}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${t("notif.title")}${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 text-muted-foreground hover:bg-muted/50 hover:text-foreground relative"
        title={collapsed ? `${t("notif.title")} (${unreadCount})` : undefined}
      >
        <div className="relative shrink-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap flex-1 text-left">
              {t("notif.title")}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            role="dialog"
            aria-label={t("notif.title")}
            className={`absolute z-[100] w-96 max-h-[520px] rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col ${
              position === "topbar" ? "top-full right-0 mt-2" : "bottom-full left-0 mb-2"
            }`}
            style={{ boxShadow: 'var(--shadow-elevated, 0 8px 30px rgba(0,0,0,0.12))' }}
          >
            <div className="px-4 py-3 border-b border-border/60 bg-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{t("notif.title")}</h3>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:underline flex items-center gap-1" title={t("notif.markAllRead")}>
                      <CheckCheck className="w-3.5 h-3.5" />
                      {t("notif.markAllRead")}
                    </button>
                  )}
                  <button onClick={() => { setOpen(false); navigate("/settings"); }} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground" title={t("notif.settings")}>
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setOpen(false)} className="w-6 h-6 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 overflow-x-auto">
                {filters.map((f) => {
                  const count = f.key === "all" ? notifications.length : notifications.filter((n) => filterMatch(n.type, f.key)).length;
                  return (
                    <button
                      key={f.key}
                      onClick={() => setActiveFilter(f.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                        activeFilter === f.key
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <f.icon className="w-3 h-3" />
                      {f.label}
                      {count > 0 && <span className="text-[9px] opacity-70">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredNotifications.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("notif.noNotifications")}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {activeFilter !== "all" ? t("notif.changeFilter") : t("notif.upToDate")}
                  </p>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 py-1.5 bg-muted/30 border-b border-border/50">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{group.label}</p>
                    </div>
                    {group.items.map((n) => {
                      const Icon = typeIcon[n.type] || Bell;
                      const colorClass = typeColor[n.type] || "bg-muted text-muted-foreground";
                      return (
                        <div
                          key={n.id}
                          role="button"
                          tabIndex={0}
                          aria-label={`${n.title}${!n.read ? " (unread)" : ""}`}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors cursor-pointer hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            !n.read ? "bg-primary/5" : ""
                          }`}
                          onClick={() => handleNotifClick(n)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNotifClick(n); } }}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-relaxed ${!n.read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {n.title}
                            </p>
                            {n.message && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-[10px] text-muted-foreground/60">
                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: dateFnsLocale })}
                              </p>
                              <span className="text-[9px] text-muted-foreground/40 uppercase">{n.type}</span>
                            </div>
                          </div>
                          {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;

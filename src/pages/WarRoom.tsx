import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useDecisions, useFilteredDependencies, useFilteredNotifications } from "@/hooks/useDecisions";
import { useNavigate } from "react-router-dom";
import { formatCost } from "@/lib/formatters";
import { differenceInDays, differenceInCalendarDays, differenceInHours, differenceInSeconds, format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap, Clock, AlertTriangle, Users, Bell, X,
  ArrowUpRight, Flame, Activity, MessageSquare, Shield,
  CalendarPlus, ChevronUp, ExternalLink, ArrowRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

const PRIORITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const HOURLY_RATE = 85;
const PERSONS = 3;
const HOURS_PER_DAY = 2;

const WarRoom = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const dateFnsLocale = i18n.language === "de" ? de : enUS;

  const { data: allDecisions = [], isLoading: loadingDec } = useDecisions();
  const { data: allNotifications = [], isLoading: loadingNotif } = useFilteredNotifications();

  const { data: latestComments = [] } = useQuery({
    queryKey: ["war-room-comments"],
    queryFn: async () => {
      const { data } = await supabase.from("comments").select("decision_id, content, created_at, user_id").order("created_at", { ascending: false }).limit(200);
      return data ?? [];
    },
    staleTime: 15_000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-map"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name");
      return data ?? [];
    },
    staleTime: 120_000,
  });

  const profileMap = useMemo(() => {
    const m: Record<string, string> = {};
    profiles.forEach(p => { m[p.user_id] = p.full_name || "Unbekannt"; });
    return m;
  }, [profiles]);

  const loading = loadingDec || loadingNotif;
  const now = new Date();
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem("war-room-seen"));
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock
  useEffect(() => {
    const iv = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Intro animation
  useEffect(() => {
    if (showIntro) {
      const timer = setTimeout(() => {
        setShowIntro(false);
        sessionStorage.setItem("war-room-seen", "1");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [showIntro]);

  // Escalated decisions
  const escalated = useMemo(() => {
    const open = allDecisions.filter(d =>
      !["implemented", "rejected", "cancelled", "archived"].includes(d.status) &&
      (d.escalation_level || 0) >= 1
    );
    return open.map(d => {
      const daysOpen = differenceInDays(now, new Date(d.created_at));
      const overdue = d.due_date ? new Date(d.due_date) < now : false;
      const daysOverdue = overdue && d.due_date ? differenceInCalendarDays(now, new Date(d.due_date)) : 0;
      const hoursOpen = differenceInHours(now, new Date(d.last_escalated_at || d.created_at));
      const cod = overdue ? daysOverdue * PERSONS * HOURS_PER_DAY * HOURLY_RATE * (PRIORITY_WEIGHT[d.priority] || 1) : (d.cost_per_day || 0) * daysOpen;
      const urgencyScore =
        (PRIORITY_WEIGHT[d.priority] || 1) * 20 +
        (overdue ? 30 : 0) +
        Math.min(daysOpen, 30) * 1.5 +
        ((d.ai_risk_score || 0) / 20) * 15 +
        (d.escalation_level || 0) * 20;
      const lastComment = latestComments.find(c => c.decision_id === d.id);
      return { ...d, daysOpen, overdue, daysOverdue, hoursOpen, cod, urgencyScore, lastComment };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore);
  }, [allDecisions, latestComments, now]);

  // SLA expiring in next 24h
  const slaExpiring = useMemo(() => {
    return allDecisions
      .filter(d => {
        if (!d.due_date || ["implemented", "rejected", "cancelled", "archived"].includes(d.status)) return false;
        const due = new Date(d.due_date);
        const hoursLeft = differenceInHours(due, now);
        return hoursLeft > 0 && hoursLeft <= 24;
      })
      .map(d => {
        const due = new Date(d.due_date!);
        const secsLeft = differenceInSeconds(due, currentTime);
        return { ...d, secsLeft, due };
      })
      .sort((a, b) => a.secsLeft - b.secsLeft);
  }, [allDecisions, now, currentTime]);

  // Activity feed
  const activityFeed = useMemo(() => {
    return allNotifications
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8);
  }, [allNotifications]);

  // Live CoD ticker
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 100);
    return () => clearInterval(iv);
  }, []);

  const totalCod = useMemo(() => {
    return escalated.reduce((s, d) => s + d.cod, 0) + tick * 0.003;
  }, [escalated, tick]);

  const todayCod = useMemo(() => Math.round(totalCod * 0.14), [totalCod]);

  // Actions
  const handleEscalate = async (decisionId: string) => {
    const dec = escalated.find(d => d.id === decisionId);
    if (!dec) return;
    await supabase.from("decisions").update({
      escalation_level: (dec.escalation_level || 0) + 1,
      last_escalated_at: new Date().toISOString(),
    }).eq("id", decisionId);
    qc.invalidateQueries({ queryKey: ["decisions"] });
    toast.success("Eskalationsstufe erhöht");
  };

  const handleResolve = async (decisionId: string) => {
    await supabase.from("decisions").update({ escalation_level: 0 }).eq("id", decisionId);
    qc.invalidateQueries({ queryKey: ["decisions"] });
    toast.success("Eskalation aufgelöst");
  };

  const handleExtendSla = async (decisionId: string) => {
    const newDue = new Date();
    newDue.setDate(newDue.getDate() + 3);
    await supabase.from("decisions").update({ due_date: newDue.toISOString().split("T")[0] }).eq("id", decisionId);
    qc.invalidateQueries({ queryKey: ["decisions"] });
    toast.success("SLA um 3 Tage verlängert");
  };

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Intro overlay
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0A0F1E] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <img src="/favicon.png" alt="Decivio" className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <p className="text-[#F1F5F9] text-2xl font-bold tracking-tight">WAR ROOM</p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-pulse text-[#94A3B8]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0F1E] text-[#F1F5F9] overflow-auto">
      {/* ═══ WAR ROOM NAV ═══ */}
      <div className="sticky top-0 z-50 h-[60px] bg-[#0F172A] border-b border-[#1E293B] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] animate-pulse" />
          <span className="text-sm font-bold tracking-widest uppercase text-[#F1F5F9]">WAR ROOM — LIVE</span>
        </div>
        <div className="text-center">
          <span className="text-xs text-[#94A3B8] font-mono tabular-nums">
            {format(currentTime, "dd.MM.yyyy • HH:mm:ss")}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B] gap-1.5"
          onClick={() => navigate("/dashboard")}
        >
          War Room verlassen <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ═══ 4-PANEL GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-6">

        {/* PANEL 1 — MISSION CRITICAL */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-5 lg:row-span-1"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${escalated.length > 0 ? "bg-[#EF4444] animate-pulse" : "bg-[#10B981]"}`} />
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#EF4444]">
              {escalated.length > 0 ? `🔴 ESKALATIONEN — JETZT HANDELN` : `Keine aktiven Eskalationen 🟢`}
            </h2>
          </div>

          {escalated.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Shield className="w-10 h-10 text-[#10B981]/40 mb-3" />
              <p className="text-sm text-[#94A3B8]">Alle Systeme normal.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(50vh-120px)] min-h-[200px]">
              <div className="space-y-3 pr-2">
                {escalated.map(d => (
                  <div key={d.id} className="rounded-lg border border-[#1E293B] bg-[#0A0F1E] p-4 hover:border-[#EF4444]/30 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[#EF4444] text-xs font-mono tabular-nums mb-1">
                          {d.hoursOpen} Stunden offen
                        </p>
                        <p className="text-base font-semibold text-[#F1F5F9] cursor-pointer hover:text-[#38BDF8] transition-colors"
                          onClick={() => navigate(`/decisions/${d.id}`)}>
                          {d.title}
                        </p>
                        {d.description && (
                          <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">{d.description}</p>
                        )}
                      </div>
                      <p className="text-xl font-bold text-[#EF4444] tabular-nums font-mono shrink-0">
                        {formatCost(Math.round(d.cod))}€
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" className="h-7 text-[10px] bg-[#10B981] hover:bg-[#10B981]/80 text-white gap-1"
                        onClick={() => handleResolve(d.id)}>
                        Übernehmen
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] border-[#1E293B] text-[#94A3B8] hover:text-[#F1F5F9] gap-1"
                        onClick={() => handleEscalate(d.id)}>
                        Weiterleiten
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </motion.div>

        {/* PANEL 2 — LIVE COD COUNTER */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-5 flex flex-col items-center justify-center text-center"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#94A3B8] mb-4">
            GESAMTE VERZÖGERUNGSKOSTEN
          </p>
          <p className="text-[clamp(2rem,6vw,4.5rem)] font-bold text-[#EF4444] tabular-nums font-mono leading-none">
            {formatCost(Math.round(totalCod))}€
          </p>
          <p className="text-xs text-[#94A3B8] mt-2">
            seit {format(new Date(allDecisions[0]?.created_at || now), "dd.MM.yyyy HH:mm")}
          </p>
          <div className="flex items-center gap-4 mt-4 text-xs text-[#94A3B8]">
            <span>Heute: <span className="text-[#F59E0B] font-semibold">+{formatCost(todayCod)}€</span></span>
          </div>
          <div className="w-full h-16 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Array.from({ length: 24 }, (_, i) => ({
                h: `${i}:00`,
                v: Math.round(totalCod * (0.02 + Math.random() * 0.06)),
              }))}>
                <Area type="monotone" dataKey="v" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* PANEL 3 — SLA COUNTDOWN */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-5"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-4">
            SLA-ABLAUF IN DEN NÄCHSTEN 24H
          </h2>
          {slaExpiring.length === 0 ? (
            <div className="text-center py-6">
              <Clock className="w-8 h-8 text-[#10B981]/30 mx-auto mb-2" />
              <p className="text-xs text-[#94A3B8]">Keine SLAs in den nächsten 24h</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(50vh-160px)] min-h-[150px]">
              <div className="space-y-2 pr-2">
                {slaExpiring.map(d => {
                  const secs = Math.max(0, d.secsLeft);
                  const urgencyColor = secs < 4 * 3600 ? "text-[#EF4444]" : secs < 12 * 3600 ? "text-[#F59E0B]" : "text-[#FBBF24]";
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#1E293B] bg-[#0A0F1E]">
                      <span className={`text-lg font-mono font-bold tabular-nums ${urgencyColor}`}>
                        {formatTimer(secs)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F1F5F9] truncate">{d.title}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-6 text-[9px] border-[#1E293B] text-[#94A3B8]"
                        onClick={() => handleExtendSla(d.id)}>
                        SLA verlängern
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </motion.div>

        {/* PANEL 4 — LIVE ACTIVITY FEED */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="rounded-xl border border-[#1E293B] bg-[#0F172A] p-5"
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#94A3B8] mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            LIVE AKTIVITÄT
          </h2>
          <ScrollArea className="h-[calc(50vh-160px)] min-h-[150px]">
            <div className="space-y-1 pr-2">
              <AnimatePresence>
                {activityFeed.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] text-center py-4">Keine Aktivität</p>
                ) : (
                  activityFeed.map((n, i) => {
                    const secsAgo = differenceInSeconds(currentTime, new Date(n.created_at));
                    const timeAgo = secsAgo < 60 ? `${secsAgo}s` : secsAgo < 3600 ? `${Math.floor(secsAgo / 60)}m` : `${Math.floor(secsAgo / 3600)}h`;
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="flex items-start gap-2.5 py-2 border-b border-[#1E293B]/50 last:border-0"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#1E293B] flex items-center justify-center text-[9px] font-bold text-[#94A3B8] shrink-0 mt-0.5">
                          {(n.title || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#F1F5F9]/80 leading-relaxed truncate">
                            {n.message || n.title}
                          </p>
                        </div>
                        <span className="text-[9px] text-[#94A3B8]/60 tabular-nums font-mono shrink-0">
                          {timeAgo}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
};

export default WarRoom;

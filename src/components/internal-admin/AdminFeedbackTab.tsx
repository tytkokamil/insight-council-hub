import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminCard, adminCardStyle, adminSectionTitle, kpiCard, kpiCardStyle, kpiLabel, kpiValue } from "./adminStyles";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, Filter, Download } from "lucide-react";
import { format, subDays, startOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { toast } from "sonner";

interface NpsResponse {
  id: string;
  score: number;
  comment: string | null;
  created_at: string;
  callback_requested: boolean;
  user_id: string;
}

interface FeatureFeedback {
  id: string;
  feature: string;
  sentiment: string | null;
  comment: string | null;
  rating: number | null;
  created_at: string;
  user_id: string;
}

const SENTIMENT_COLORS = { positive: "#22C55E", neutral: "#94A3B8", negative: "#EF4444" };

const AdminFeedbackTab = () => {
  const [npsResponses, setNpsResponses] = useState<NpsResponse[]>([]);
  const [featureFeedback, setFeatureFeedback] = useState<FeatureFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState<"all" | "detractor" | "passive" | "promoter">("all");
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = subDays(new Date(), periodDays).toISOString();
      const [npsRes, ffRes] = await Promise.all([
        supabase.from("nps_responses").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
        supabase.from("feature_feedback").select("*").gte("created_at", since).order("created_at", { ascending: false }).limit(500),
      ]);
      if (npsRes.data) setNpsResponses(npsRes.data);
      if (ffRes.data) setFeatureFeedback(ffRes.data);
      setLoading(false);
    };
    load();
  }, [periodDays]);

  const npsStats = useMemo(() => {
    if (npsResponses.length === 0) return { score: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
    const promoters = npsResponses.filter(r => r.score >= 9).length;
    const detractors = npsResponses.filter(r => r.score <= 6).length;
    const passives = npsResponses.length - promoters - detractors;
    const score = Math.round(((promoters - detractors) / npsResponses.length) * 100);
    return { score, promoters, passives, detractors, total: npsResponses.length };
  }, [npsResponses]);

  const filteredNps = useMemo(() => {
    if (scoreFilter === "all") return npsResponses;
    return npsResponses.filter(r => {
      if (scoreFilter === "detractor") return r.score <= 6;
      if (scoreFilter === "passive") return r.score >= 7 && r.score <= 8;
      return r.score >= 9;
    });
  }, [npsResponses, scoreFilter]);

  const feedbackStats = useMemo(() => {
    const positive = featureFeedback.filter(f => f.sentiment === "positive").length;
    const negative = featureFeedback.filter(f => f.sentiment === "negative").length;
    const neutral = featureFeedback.length - positive - negative;
    return { positive, negative, neutral, total: featureFeedback.length };
  }, [featureFeedback]);

  // Unique feature names for filter
  const featureNames = useMemo(() => {
    const names = new Set(featureFeedback.map(f => f.feature));
    return Array.from(names).sort();
  }, [featureFeedback]);

  // Filtered feature feedback
  const filteredFeedback = useMemo(() => {
    if (featureFilter === "all") return featureFeedback;
    return featureFeedback.filter(f => f.feature === featureFilter);
  }, [featureFeedback, featureFilter]);

  // Avg rating per feature (bar chart data)
  const avgRatingPerFeature = useMemo(() => {
    const map: Record<string, { sum: number; count: number }> = {};
    featureFeedback.forEach(f => {
      if (f.rating != null) {
        if (!map[f.feature]) map[f.feature] = { sum: 0, count: 0 };
        map[f.feature].sum += f.rating;
        map[f.feature].count++;
      }
    });
    return Object.entries(map)
      .map(([feature, { sum, count }]) => ({ feature, avg: Math.round((sum / count) * 10) / 10, count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 10);
  }, [featureFeedback]);

  // Sentiment pie data
  const sentimentPie = useMemo(() => [
    { name: "Positiv", value: feedbackStats.positive, color: SENTIMENT_COLORS.positive },
    { name: "Neutral", value: feedbackStats.neutral, color: SENTIMENT_COLORS.neutral },
    { name: "Negativ", value: feedbackStats.negative, color: SENTIMENT_COLORS.negative },
  ].filter(d => d.value > 0), [feedbackStats]);

  // Weekly trend (line chart)
  const weeklyTrend = useMemo(() => {
    const weeks: Record<string, { positive: number; negative: number; neutral: number }> = {};
    featureFeedback.forEach(f => {
      const week = format(startOfWeek(new Date(f.created_at), { weekStartsOn: 1 }), "dd.MM");
      if (!weeks[week]) weeks[week] = { positive: 0, negative: 0, neutral: 0 };
      const s = f.sentiment || "neutral";
      if (s === "positive") weeks[week].positive++;
      else if (s === "negative") weeks[week].negative++;
      else weeks[week].neutral++;
    });
    return Object.entries(weeks)
      .map(([week, data]) => ({ week, ...data }))
      .slice(-8);
  }, [featureFeedback]);

  // CSV export
  const exportCsv = () => {
    const rows = [["Feature", "Rating", "Sentiment", "Kommentar", "Datum"].join(";")];
    filteredFeedback.forEach(f => {
      rows.push([
        f.feature,
        f.rating?.toString() || "",
        f.sentiment || "",
        `"${(f.comment || "").replace(/"/g, '""')}"`,
        format(new Date(f.created_at), "dd.MM.yyyy HH:mm"),
      ].join(";"));
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredFeedback.length} Einträge exportiert`);
  };

  const getScoreColor = (score: number) => score <= 6 ? "#EF4444" : score <= 8 ? "#EAB308" : "#22C55E";
  const getGroupLabel = (score: number) => score <= 6 ? "Detractor" : score <= 8 ? "Passive" : "Promoter";

  if (loading) return <div className="text-sm text-neutral-400">Lade Feedback-Daten…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={adminSectionTitle}>
          <MessageSquare className="w-4 h-4" /> Feedback & NPS
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={periodDays}
            onChange={e => setPeriodDays(Number(e.target.value))}
            className="h-7 px-2 rounded text-xs border"
            style={{ background: "#0A0F1A", borderColor: "#1e293b", color: "#e2e8f0" }}
          >
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
            <option value={365}>1 Jahr</option>
          </select>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-neutral-400 hover:text-white transition-colors"
            style={{ border: "1px solid #1e293b" }}
          >
            <Download className="w-3 h-3" /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>NPS Score</div>
          <div className={kpiValue} style={{ color: npsStats.score >= 50 ? "#22C55E" : npsStats.score >= 0 ? "#EAB308" : "#EF4444" }}>
            {npsStats.score}
          </div>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>NPS Antworten</div>
          <div className={kpiValue}>{npsStats.total}</div>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>Feature Feedback</div>
          <div className={kpiValue}>{feedbackStats.total}</div>
        </div>
        <div className={kpiCard} style={kpiCardStyle}>
          <div className={kpiLabel}>Positiv / Negativ</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 text-sm" style={{ color: "#22C55E" }}>
              <ThumbsUp className="w-3.5 h-3.5" /> {feedbackStats.positive}
            </span>
            <span className="flex items-center gap-1 text-sm" style={{ color: "#EF4444" }}>
              <ThumbsDown className="w-3.5 h-3.5" /> {feedbackStats.negative}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Avg Rating per Feature */}
        <div className={adminCard} style={{ ...adminCardStyle, gridColumn: "span 1" }}>
          <h3 className="text-xs font-semibold text-white mb-3">Ø Rating pro Feature</h3>
          {avgRatingPerFeature.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={avgRatingPerFeature} layout="vertical" margin={{ left: 60, right: 10 }}>
                <XAxis type="number" domain={[0, 5]} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <YAxis type="category" dataKey="feature" tick={{ fill: "#94A3B8", fontSize: 10 }} width={55} />
                <Tooltip
                  contentStyle={{ background: "#0A0F1A", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`${v} ★`, "Ø Rating"]}
                />
                <Bar dataKey="avg" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-8">Keine Rating-Daten</p>
          )}
        </div>

        {/* Sentiment Distribution */}
        <div className={adminCard} style={adminCardStyle}>
          <h3 className="text-xs font-semibold text-white mb-3">Sentimentverteilung</h3>
          {sentimentPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sentimentPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2}>
                  {sentimentPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0A0F1A", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-8">Keine Daten</p>
          )}
          <div className="flex justify-center gap-3 text-[10px] text-neutral-400 mt-1">
            {sentimentPie.map(s => (
              <span key={s.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: s.color }} /> {s.name} ({s.value})
              </span>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className={adminCard} style={adminCardStyle}>
          <h3 className="text-xs font-semibold text-white mb-3">Wöchentlicher Trend</h3>
          {weeklyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="week" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#0A0F1A", border: "1px solid #1e293b", borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="positive" stroke="#22C55E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="negative" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="neutral" stroke="#94A3B8" strokeWidth={1} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-neutral-500 text-center py-8">Keine Trend-Daten</p>
          )}
        </div>
      </div>

      {/* NPS Breakdown */}
      <div className={adminCard} style={adminCardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">NPS Verteilung</h3>
        </div>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-2">
          {npsStats.total > 0 && (
            <>
              <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(npsStats.detractors / npsStats.total) * 100}%`, background: "#EF4444", minWidth: npsStats.detractors > 0 ? 30 : 0 }}>
                {npsStats.detractors > 0 && `${npsStats.detractors}`}
              </div>
              <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(npsStats.passives / npsStats.total) * 100}%`, background: "#EAB308", minWidth: npsStats.passives > 0 ? 30 : 0 }}>
                {npsStats.passives > 0 && `${npsStats.passives}`}
              </div>
              <div className="flex items-center justify-center text-[10px] font-bold text-white" style={{ width: `${(npsStats.promoters / npsStats.total) * 100}%`, background: "#22C55E", minWidth: npsStats.promoters > 0 ? 30 : 0 }}>
                {npsStats.promoters > 0 && `${npsStats.promoters}`}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-4 text-[10px] text-neutral-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} /> Detractors (0-6)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#EAB308" }} /> Passives (7-8)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#22C55E" }} /> Promoters (9-10)</span>
        </div>
      </div>

      {/* NPS Comments */}
      <div className={adminCard} style={adminCardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">NPS Kommentare</h3>
          <div className="flex gap-1">
            {(["all", "detractor", "passive", "promoter"] as const).map(f => (
              <button key={f} onClick={() => setScoreFilter(f)} className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${scoreFilter === f ? "bg-red-500/20 text-red-400" : "text-neutral-500 hover:text-neutral-300"}`}>
                {f === "all" ? "Alle" : f === "detractor" ? "Detractors" : f === "passive" ? "Passives" : "Promoters"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredNps.length === 0 && <p className="text-xs text-neutral-500 py-4 text-center">Keine NPS-Antworten in dieser Kategorie</p>}
          {filteredNps.map(r => (
            <div key={r.id} className="flex gap-3 p-3 rounded-lg" style={{ background: "#0D1117" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: getScoreColor(r.score) }}>
                {r.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium" style={{ color: getScoreColor(r.score) }}>{getGroupLabel(r.score)}</span>
                  <span className="text-[10px] text-neutral-500">{format(new Date(r.created_at!), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                  {r.callback_requested && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#EF4444", color: "#fff" }}>📞 Rückruf</span>}
                </div>
                {r.comment ? <p className="text-xs text-neutral-300 leading-relaxed">"{r.comment}"</p> : <p className="text-xs text-neutral-500 italic">Kein Kommentar</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Feedback */}
      <div className={adminCard} style={adminCardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Feature-Feedback (Micro)</h3>
          <select
            value={featureFilter}
            onChange={e => setFeatureFilter(e.target.value)}
            className="h-7 px-2 rounded text-xs border"
            style={{ background: "#0A0F1A", borderColor: "#1e293b", color: "#e2e8f0" }}
          >
            <option value="all">Alle Features</option>
            {featureNames.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredFeedback.length === 0 && <p className="text-xs text-neutral-500 py-4 text-center">Noch kein Feature-Feedback</p>}
          {filteredFeedback.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#0D1117" }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${f.sentiment === "positive" ? "bg-emerald-500/20" : f.sentiment === "negative" ? "bg-red-500/20" : "bg-neutral-500/20"}`}>
                {f.sentiment === "positive" ? <ThumbsUp className="w-3 h-3 text-emerald-400" /> : f.sentiment === "negative" ? <ThumbsDown className="w-3 h-3 text-red-400" /> : <span className="text-[10px] text-neutral-400">—</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-medium text-neutral-300">{f.feature}</span>
                  {f.rating && <span className="text-[10px] text-yellow-400">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>}
                  <span className="text-[10px] text-neutral-500">{format(new Date(f.created_at!), "dd.MM.yyyy", { locale: de })}</span>
                </div>
                {f.comment && <p className="text-xs text-neutral-400">"{f.comment}"</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminFeedbackTab;

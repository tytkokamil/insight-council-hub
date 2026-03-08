import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminCard, adminCardStyle, adminSectionTitle, kpiCard, kpiCardStyle, kpiLabel, kpiValue } from "./adminStyles";
import { MessageSquare, TrendingUp, ThumbsUp, ThumbsDown, Filter } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

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

const AdminFeedbackTab = () => {
  const [npsResponses, setNpsResponses] = useState<NpsResponse[]>([]);
  const [featureFeedback, setFeatureFeedback] = useState<FeatureFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreFilter, setScoreFilter] = useState<"all" | "detractor" | "passive" | "promoter">("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [npsRes, ffRes] = await Promise.all([
        supabase.from("nps_responses").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("feature_feedback").select("*").order("created_at", { ascending: false }).limit(200),
      ]);
      if (npsRes.data) setNpsResponses(npsRes.data);
      if (ffRes.data) setFeatureFeedback(ffRes.data);
      setLoading(false);
    };
    load();
  }, []);

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
    return { positive, negative, total: featureFeedback.length };
  }, [featureFeedback]);

  const getScoreColor = (score: number) => {
    if (score <= 6) return "#EF4444";
    if (score <= 8) return "#EAB308";
    return "#22C55E";
  };

  const getGroupLabel = (score: number) => {
    if (score <= 6) return "Detractor";
    if (score <= 8) return "Passive";
    return "Promoter";
  };

  if (loading) {
    return <div className="text-sm text-neutral-400">Lade Feedback-Daten…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className={adminSectionTitle}>
        <MessageSquare className="w-4 h-4" /> Feedback & NPS
      </h2>

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

      {/* NPS Breakdown */}
      <div className={adminCard} style={adminCardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">NPS Verteilung</h3>
        </div>
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden mb-2">
          {npsStats.total > 0 && (
            <>
              <div
                className="flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${(npsStats.detractors / npsStats.total) * 100}%`, background: "#EF4444", minWidth: npsStats.detractors > 0 ? 30 : 0 }}
              >
                {npsStats.detractors > 0 && `${npsStats.detractors}`}
              </div>
              <div
                className="flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${(npsStats.passives / npsStats.total) * 100}%`, background: "#EAB308", minWidth: npsStats.passives > 0 ? 30 : 0 }}
              >
                {npsStats.passives > 0 && `${npsStats.passives}`}
              </div>
              <div
                className="flex items-center justify-center text-[10px] font-bold text-white"
                style={{ width: `${(npsStats.promoters / npsStats.total) * 100}%`, background: "#22C55E", minWidth: npsStats.promoters > 0 ? 30 : 0 }}
              >
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
              <button
                key={f}
                onClick={() => setScoreFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  scoreFilter === f ? "bg-red-500/20 text-red-400" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {f === "all" ? "Alle" : f === "detractor" ? "Detractors" : f === "passive" ? "Passives" : "Promoters"}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredNps.length === 0 && (
            <p className="text-xs text-neutral-500 py-4 text-center">Keine NPS-Antworten in dieser Kategorie</p>
          )}
          {filteredNps.map(r => (
            <div key={r.id} className="flex gap-3 p-3 rounded-lg" style={{ background: "#0D1117" }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: getScoreColor(r.score) }}
              >
                {r.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium" style={{ color: getScoreColor(r.score) }}>
                    {getGroupLabel(r.score)}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {format(new Date(r.created_at!), "dd.MM.yyyy HH:mm", { locale: de })}
                  </span>
                  {r.callback_requested && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "#EF4444", color: "#fff" }}>
                      📞 Rückruf
                    </span>
                  )}
                </div>
                {r.comment ? (
                  <p className="text-xs text-neutral-300 leading-relaxed">"{r.comment}"</p>
                ) : (
                  <p className="text-xs text-neutral-500 italic">Kein Kommentar</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Feedback */}
      <div className={adminCard} style={adminCardStyle}>
        <h3 className="text-sm font-semibold text-white mb-4">Feature-Feedback (Micro)</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {featureFeedback.length === 0 && (
            <p className="text-xs text-neutral-500 py-4 text-center">Noch kein Feature-Feedback</p>
          )}
          {featureFeedback.map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "#0D1117" }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                f.sentiment === "positive" ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}>
                {f.sentiment === "positive" ? (
                  <ThumbsUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ThumbsDown className="w-3 h-3 text-red-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-medium text-neutral-300">{f.feature}</span>
                  {f.rating && <span className="text-[10px] text-yellow-400">{"★".repeat(f.rating)}</span>}
                  <span className="text-[10px] text-neutral-500">
                    {format(new Date(f.created_at!), "dd.MM.yyyy", { locale: de })}
                  </span>
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

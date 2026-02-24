import { useMemo, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/shared/UserAvatar";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  category: string;
  onSelect: (userId: string) => void;
  excludeUserId?: string;
  teamId?: string | null;
}

interface Suggestion {
  userId: string;
  name: string;
  avatarUrl?: string;
  score: number;
  reason: string;
}

const SmartReviewerSuggestions = ({ category, onSelect, excludeUserId, teamId }: Props) => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const compute = async () => {
      setLoading(true);
      const [dRes, rRes, pRes, mRes] = await Promise.all([
        supabase.from("decisions").select("id, created_by, owner_id, category, status").is("deleted_at", null),
        supabase.from("decision_reviews").select("reviewer_id, status, reviewed_at, decision_id"),
        supabase.from("profiles").select("user_id, full_name, avatar_url"),
        teamId ? supabase.from("team_members").select("user_id").eq("team_id", teamId) : Promise.resolve({ data: null }),
      ]);

      const decisions = dRes.data ?? [];
      const reviews = rRes.data ?? [];
      const profiles = pRes.data ?? [];
      const teamMembers = mRes.data ? new Set(mRes.data.map((m: any) => m.user_id)) : null;

      const profileMap: Record<string, any> = {};
      profiles.forEach(p => { profileMap[p.user_id] = p; });

      const scores = new Map<string, { categoryExp: number; totalReviews: number; completedReviews: number }>();

      reviews.forEach(r => {
        if (!scores.has(r.reviewer_id)) {
          scores.set(r.reviewer_id, { categoryExp: 0, totalReviews: 0, completedReviews: 0 });
        }
        const s = scores.get(r.reviewer_id)!;
        s.totalReviews++;
        if (r.reviewed_at) s.completedReviews++;

        const dec = decisions.find(d => d.id === r.decision_id);
        if (dec && dec.category === category) s.categoryExp++;
      });

      const result: Suggestion[] = [];
      scores.forEach((s, userId) => {
        if (userId === excludeUserId) return;
        if (teamMembers && !teamMembers.has(userId)) return;

        const completionRate = s.totalReviews > 0 ? s.completedReviews / s.totalReviews : 0;
        const score = s.categoryExp * 30 + s.completedReviews * 5 + Math.round(completionRate * 20);

        if (score < 5) return;

        const p = profileMap[userId];
        const reasons: string[] = [];
        if (s.categoryExp > 0) reasons.push(`${s.categoryExp}x ${category} reviewed`);
        if (completionRate >= 0.8) reasons.push(`${Math.round(completionRate * 100)}% Completion`);

        result.push({
          userId,
          name: p?.full_name || t("smartReviewer.unknown"),
          avatarUrl: p?.avatar_url,
          score,
          reason: reasons.join(" · ") || t("smartReviewer.reviews", { count: s.completedReviews }),
        });
      });

      result.sort((a, b) => b.score - a.score);
      setSuggestions(result.slice(0, 3));
      setLoading(false);
    };

    if (category) compute();
  }, [category, excludeUserId, teamId, t]);

  if (loading || suggestions.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <p className="text-[10px] font-semibold text-primary flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3 h-3" />
        {t("smartReviewer.title")}
      </p>
      <div className="space-y-1.5">
        {suggestions.map(s => (
          <button
            key={s.userId}
            type="button"
            onClick={() => onSelect(s.userId)}
            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 transition-colors text-left"
          >
            <UserAvatar fullName={s.name} avatarUrl={s.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{s.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.reason}</p>
            </div>
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{s.score}</Badge>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SmartReviewerSuggestions;

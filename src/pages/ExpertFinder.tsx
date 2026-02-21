import { useState, useEffect, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfiles, buildProfileMap } from "@/hooks/useDecisions";
import UserAvatar from "@/components/shared/UserAvatar";
import PageHelpButton from "@/components/shared/PageHelpButton";
import {
  Trophy, Star, Target, CheckCircle, TrendingUp, Award,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryLabels: Record<string, string> = {
  strategic: "Strategisch", budget: "Budget", hr: "Personal",
  technical: "Technisch", operational: "Operativ", marketing: "Marketing",
};

interface ExpertScore {
  userId: string;
  name: string;
  avatarUrl?: string;
  totalDecisions: number;
  implemented: number;
  successRate: number;
  reviewsCompleted: number;
  lessonsCreated: number;
  contributionScore: number;
  topCategories: string[];
}

const ExpertFinder = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  useEffect(() => {
    const fetch = async () => {
      const [dRes, rRes, lRes, pRes] = await Promise.all([
        supabase.from("decisions").select("id, created_by, owner_id, category, status").is("deleted_at", null),
        supabase.from("decision_reviews").select("reviewer_id, status, reviewed_at"),
        supabase.from("lessons_learned").select("created_by"),
        supabase.from("profiles").select("user_id, full_name, avatar_url"),
      ]);
      setDecisions(dRes.data ?? []);
      setReviews(rRes.data ?? []);
      setLessons(lRes.data ?? []);
      setProfiles(pRes.data ?? []);
    };
    fetch();
  }, []);

  const experts = useMemo(() => {
    const map = new Map<string, ExpertScore>();
    const profileMap: Record<string, any> = {};
    profiles.forEach(p => { profileMap[p.user_id] = p; });

    const filteredDecisions = categoryFilter === "all"
      ? decisions
      : decisions.filter(d => d.category === categoryFilter);

    // Count decisions by user
    filteredDecisions.forEach(d => {
      const uid = d.owner_id || d.created_by;
      if (!map.has(uid)) {
        const p = profileMap[uid];
        map.set(uid, {
          userId: uid,
          name: p?.full_name || "Unbekannt",
          avatarUrl: p?.avatar_url,
          totalDecisions: 0, implemented: 0, successRate: 0,
          reviewsCompleted: 0, lessonsCreated: 0, contributionScore: 0,
          topCategories: [],
        });
      }
      const e = map.get(uid)!;
      e.totalDecisions++;
      if (d.status === "implemented") e.implemented++;
      if (!e.topCategories.includes(d.category)) e.topCategories.push(d.category);
    });

    // Count reviews
    reviews.forEach(r => {
      if (r.reviewed_at) {
        if (!map.has(r.reviewer_id)) {
          const p = profileMap[r.reviewer_id];
          map.set(r.reviewer_id, {
            userId: r.reviewer_id,
            name: p?.full_name || "Unbekannt",
            avatarUrl: p?.avatar_url,
            totalDecisions: 0, implemented: 0, successRate: 0,
            reviewsCompleted: 0, lessonsCreated: 0, contributionScore: 0,
            topCategories: [],
          });
        }
        map.get(r.reviewer_id)!.reviewsCompleted++;
      }
    });

    // Count lessons
    lessons.forEach(l => {
      if (map.has(l.created_by)) {
        map.get(l.created_by)!.lessonsCreated++;
      }
    });

    // Calculate scores
    map.forEach(e => {
      e.successRate = e.totalDecisions > 0 ? Math.round((e.implemented / e.totalDecisions) * 100) : 0;
      e.contributionScore = Math.round(
        e.totalDecisions * 10 +
        e.implemented * 20 +
        e.reviewsCompleted * 5 +
        e.lessonsCreated * 15
      );
    });

    return Array.from(map.values())
      .filter(e => e.contributionScore > 0)
      .sort((a, b) => b.contributionScore - a.contributionScore);
  }, [decisions, reviews, lessons, profiles, categoryFilter]);

  const getLevelLabel = (score: number) => {
    if (score >= 200) return { label: "Expert", color: "border-amber-500 text-amber-500" };
    if (score >= 100) return { label: "Senior", color: "border-primary text-primary" };
    if (score >= 40) return { label: "Active", color: "border-emerald-500 text-emerald-500" };
    return { label: "Starter", color: "border-muted-foreground text-muted-foreground" };
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.15em] mb-1">Collaboration</p>
          <h1 className="font-display text-xl font-bold">Experten-Finder</h1>
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PageHelpButton
            title="Experten-Finder"
            description="Finde die besten Experten basierend auf Entscheidungserfahrung, Erfolgsrate und Beiträgen."
          />
        </div>
      </div>

      {experts.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Noch keine Daten für den Experten-Finder vorhanden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {experts.slice(0, 20).map((expert, i) => {
            const level = getLevelLabel(expert.contributionScore);
            return (
              <Card key={expert.userId}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {i < 3 && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] font-bold text-white z-10">
                          {i + 1}
                        </div>
                      )}
                      <UserAvatar fullName={expert.name} avatarUrl={expert.avatarUrl} size="md" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{expert.name}</span>
                        <Badge variant="outline" className={`text-[10px] ${level.color}`}>{level.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {expert.topCategories.slice(0, 3).map(c => (
                          <Badge key={c} variant="secondary" className="text-[10px]">
                            {categoryLabels[c] || c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-5 text-center">
                      <div>
                        <p className="text-lg font-bold">{expert.totalDecisions}</p>
                        <p className="text-[10px] text-muted-foreground">Decisions</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{expert.successRate}%</p>
                        <p className="text-[10px] text-muted-foreground">Erfolgsrate</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{expert.reviewsCompleted}</p>
                        <p className="text-[10px] text-muted-foreground">Reviews</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{expert.contributionScore}</p>
                        <p className="text-[10px] text-muted-foreground">Score</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default ExpertFinder;

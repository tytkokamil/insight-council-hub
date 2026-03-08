import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X, Clock, MessageSquare, AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays } from "date-fns";
import { useNavigate } from "react-router-dom";

interface MissedActivity {
  newComments: number;
  overdueSlas: number;
  codIncrease: number;
}

const WelcomeBackBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [daysAway, setDaysAway] = useState(0);
  const [missed, setMissed] = useState<MissedActivity>({ newComments: 0, overdueSlas: 0, codIncrease: 0 });

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const dismissed = sessionStorage.getItem("welcome-back-dismissed");
      if (dismissed) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("last_seen_at")
        .eq("user_id", user.id)
        .single();

      if (!profile?.last_seen_at) return;

      const daysSince = differenceInDays(new Date(), new Date(profile.last_seen_at));
      if (daysSince < 7) return;

      setDaysAway(daysSince);

      // Fetch missed activity
      const since = new Date(profile.last_seen_at).toISOString();

      const [commentsRes, overdueRes, codRes] = await Promise.all([
        supabase.from("comments").select("id", { count: "exact", head: true }).gt("created_at", since),
        supabase.from("decisions").select("id", { count: "exact", head: true })
          .not("due_date", "is", null)
          .lt("due_date", new Date().toISOString())
          .in("status", ["draft", "review"])
          .is("deleted_at", null),
        supabase.from("decisions").select("cost_per_day")
          .in("status", ["draft", "review"])
          .is("deleted_at", null)
          .not("cost_per_day", "is", null),
      ]);

      const totalCod = (codRes.data || []).reduce((s, d) => s + (d.cost_per_day || 0), 0);

      setMissed({
        newComments: commentsRes.count || 0,
        overdueSlas: overdueRes.count || 0,
        codIncrease: totalCod,
      });

      setVisible(true);

      // Update last_seen_at
      await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", user.id);
    };

    check();
  }, [user]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("welcome-back-dismissed", "true");
  };

  const items = [
    missed.newComments > 0 && { icon: MessageSquare, text: `${missed.newComments} neue Kommentare` },
    missed.overdueSlas > 0 && { icon: AlertTriangle, text: `${missed.overdueSlas} überfällige SLAs` },
    missed.codIncrease > 0 && { icon: TrendingUp, text: `${missed.codIncrease.toLocaleString("de-DE")} € Verzögerungskosten` },
  ].filter(Boolean) as { icon: any; text: string }[];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className="mb-6 p-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/[0.04] to-primary/[0.02] relative"
        >
          <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground/40 hover:text-muted-foreground">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Willkommen zurück! 👋
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Seit Ihrem letzten Besuch vor {daysAway} Tagen hat sich einiges getan:
              </p>

              {items.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs bg-background border border-border rounded-lg px-2.5 py-1.5">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-foreground font-medium">{item.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { dismiss(); navigate("/decisions"); }}>
                Entscheidungen ansehen <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeBackBanner;

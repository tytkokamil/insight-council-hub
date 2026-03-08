import { useState, useEffect } from "react";
import { X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const FALLBACK_CLAIMED = 17;
const TOTAL_SLOTS = 20;

const ScarcityBar = () => {
  const [claimed, setClaimed] = useState(FALLBACK_CLAIMED);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem("scarcity_closed") === "true");

  useEffect(() => {
    if (dismissed) return;
    const fetchSlots = async () => {
      try {
        const { data } = await supabase
          .from("founding_customer_slots")
          .select("claimed_slots, total_slots")
          .limit(1)
          .single();
        if (data) setClaimed(data.claimed_slots ?? FALLBACK_CLAIMED);
      } catch {}
    };
    fetchSlots();

    const channel = supabase
      .channel("scarcity_bar_rt")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "founding_customer_slots" }, (payload) => {
        const row = payload.new as any;
        if (typeof row?.claimed_slots === "number") setClaimed(row.claimed_slots);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("scarcity_closed", "true");
  };

  const remaining = TOTAL_SLOTS - claimed;
  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-[44px] flex items-center justify-center px-4 bg-destructive">
      <div className="flex items-center gap-2 text-destructive-foreground text-xs sm:text-sm font-medium">
        <Zap className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="hidden sm:inline">
          Founding Program: Noch {remaining} von {TOTAL_SLOTS} Plätzen — Professional €89/Mo statt €149, lebenslang fixiert
        </span>
        <span className="sm:hidden">
          Noch {remaining}/{TOTAL_SLOTS} Founding-Plätze — €89/Mo
        </span>
        <Link
          to="/auth?founding=true"
          className="ml-2 px-3 py-1 bg-white text-destructive text-xs font-semibold rounded-md hover:bg-white/90 transition-colors"
        >
          Platz sichern →
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 p-1 text-destructive-foreground/80 hover:text-destructive-foreground transition-colors"
        aria-label="Schließen"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ScarcityBar;

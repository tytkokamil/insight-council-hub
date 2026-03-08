import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Flame, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const FALLBACK_DEADLINE = "2026-04-30T23:59:59+02:00";
const FALLBACK_CLAIMED = 17;
const TOTAL_SLOTS = 20;

function getTimeLeft(deadline: Date) {
  const diff = Math.max(0, deadline.getTime() - Date.now());
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s, total: diff };
}

const ScarcityBar = () => {
  const [deadline, setDeadline] = useState(() => new Date(FALLBACK_DEADLINE));
  const [time, setTime] = useState(() => getTimeLeft(new Date(FALLBACK_DEADLINE)));
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState<number>(FALLBACK_CLAIMED);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const deadlineRef = useRef(deadline);

  // Keep ref in sync
  useEffect(() => { deadlineRef.current = deadline; }, [deadline]);

  // Fetch live slot data + deadline from DB
  useEffect(() => {
    const fetchSlots = async () => {
      const { data } = await supabase
        .from("founding_customer_slots")
        .select("claimed_slots, total_slots, deadline")
        .limit(1)
        .single();
      if (data) {
        setClaimed(data.claimed_slots ?? FALLBACK_CLAIMED);
        if (data.deadline) {
          const dbDeadline = new Date(data.deadline);
          setDeadline(dbDeadline);
          setTime(getTimeLeft(dbDeadline));
        }
      }
    };
    fetchSlots();

    // Realtime subscription
    const channel = supabase
      .channel("founding_slots_realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "founding_customer_slots" },
        (payload) => {
          const row = payload.new as any;
          if (typeof row?.claimed_slots === "number") setClaimed(row.claimed_slots);
          if (row?.deadline) {
            const dbDeadline = new Date(row.deadline);
            setDeadline(dbDeadline);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setTime(getTimeLeft(deadlineRef.current)), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const remaining = TOTAL_SLOTS - claimed;
  const soldOut = remaining <= 0;

  if (dismissed || time.total <= 0) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] hidden md:block"
        >
          <div
            className="flex items-center justify-center gap-6 py-2 px-4 text-[12px] font-medium"
            style={{
              background: soldOut
                ? "linear-gradient(90deg, hsl(220 15% 30%), hsl(220 15% 22%))"
                : "linear-gradient(90deg, hsl(0 84% 60%), hsl(0 84% 50%))",
              color: "white",
            }}
          >
            {soldOut ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Founding Program ausgebucht
                </span>
                <span className="w-px h-3.5 bg-white/30" />
                <Link to="/founding" className="underline underline-offset-2 hover:text-white/80 transition-colors">
                  Warteliste beitreten →
                </Link>
              </>
            ) : (
              <>
                {/* Countdown — persistent, from DB deadline */}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Early-Access endet in{" "}
                  <span className="font-mono font-bold tabular-nums">
                    {time.d}T {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:{String(time.s).padStart(2, "0")}
                  </span>
                </span>

                <span className="w-px h-3.5 bg-white/30" />

                {/* Limited spots — live from DB */}
                <span className="inline-flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Nur noch <span className="font-bold">{remaining} von {TOTAL_SLOTS}</span> Founding-Plätze frei
                </span>
              </>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="ml-4 p-0.5 rounded hover:bg-white/20 transition-colors"
              aria-label="Schließen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScarcityBar;

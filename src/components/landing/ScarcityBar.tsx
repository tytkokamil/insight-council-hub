import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, Flame, X } from "lucide-react";

/** Prompt 34 — Scarcity / Urgency UI elements */

const LAUNCH_DATE = new Date("2026-04-01T00:00:00+02:00");

function getTimeLeft() {
  const diff = Math.max(0, LAUNCH_DATE.getTime() - Date.now());
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return { d, h, m, s, total: diff };
}

function fakeViewers() {
  // Deterministic-ish based on minute to avoid jumps
  const base = 14;
  const minute = new Date().getMinutes();
  return base + (minute % 7);
}

const ScarcityBar = () => {
  const [time, setTime] = useState(getTimeLeft);
  const [viewers] = useState(fakeViewers);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

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
              background: "linear-gradient(90deg, hsl(0 84% 60%), hsl(0 84% 50%))",
              color: "white",
            }}
          >
            {/* Countdown */}
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Early-Access endet in{" "}
              <span className="font-mono font-bold tabular-nums">
                {time.d}T {String(time.h).padStart(2, "0")}:{String(time.m).padStart(2, "0")}:{String(time.s).padStart(2, "0")}
              </span>
            </span>

            <span className="w-px h-3.5 bg-white/30" />

            {/* Live viewers */}
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span className="font-bold">{viewers}</span> sehen sich gerade Decivio an
            </span>

            <span className="w-px h-3.5 bg-white/30" />

            {/* Limited spots */}
            <span className="inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" />
              Nur noch <span className="font-bold">20 von 20</span> Founding-Plätze frei
            </span>

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

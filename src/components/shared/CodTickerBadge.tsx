import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CodTickerBadgeProps {
  collapsed: boolean;
}

const CodTickerBadge = ({ collapsed }: CodTickerBadgeProps) => {
  const { user } = useAuth();
  const [weeklyCod, setWeeklyCod] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [tickerOffset, setTickerOffset] = useState(0);
  const startTimeRef = useRef(Date.now());
  const animRef = useRef<number>(0);

  // Fetch CoD data
  useEffect(() => {
    if (!user) return;
    const fetchCod = async () => {
      const { data } = await supabase
        .from("decisions")
        .select("cost_per_day, status")
        .is("deleted_at", null)
        .not("status", "in", '("implemented","rejected","archived","cancelled")');

      if (data) {
        const totalDaily = data.reduce((sum, d) => sum + (Number(d.cost_per_day) || 0), 0);
        setWeeklyCod(totalDaily * 7);
        setOpenCount(data.length);
      }
    };
    fetchCod();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("cod-ticker-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "decisions" }, () => {
        fetchCod();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Smooth ticker animation
  const dailyCod = weeklyCod / 7;
  const costPerSecond = dailyCod / 86400;

  useEffect(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setTickerOffset(elapsed * costPerSecond);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [costPerSecond]);

  const isAllDone = openCount === 0;
  const displayValue = isAllDone ? 0 : Math.floor(weeklyCod + tickerOffset);
  const formatted = displayValue.toLocaleString("de-DE");

  const color = isAllDone
    ? "text-success"
    : weeklyCod > 5000
      ? "text-destructive"
      : weeklyCod > 1000
        ? "text-warning"
        : "text-muted-foreground";

  const bgColor = isAllDone
    ? "bg-success/10"
    : weeklyCod > 5000
      ? "bg-destructive/10"
      : weeklyCod > 1000
        ? "bg-warning/10"
        : "bg-muted/50";

  if (!user) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`mx-2 mb-1 flex items-center gap-2 px-2.5 py-2 rounded-lg ${bgColor} transition-colors cursor-default`}
        >
          <div className="relative shrink-0">
            <DollarSign className={`w-4 h-4 ${color}`} />
            {!isAllDone && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            )}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                {isAllDone ? (
                  <p className="text-xs font-semibold text-success">
                    0€ — Alles entschieden ✓
                  </p>
                ) : (
                  <>
                    <p className={`text-sm font-bold tabular-nums ${color} leading-none`}>
                      {formatted}€
                      <span className="text-[10px] font-normal text-muted-foreground ml-1">/Woche</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {openCount} offene Entscheidungen
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipTrigger>
      <TooltipContent side={collapsed ? "right" : "top"} className="text-xs">
        <p className="font-semibold">Cost of Delay: {formatted}€/Woche</p>
        <p className="text-muted-foreground">{openCount} offene Entscheidungen</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default CodTickerBadge;

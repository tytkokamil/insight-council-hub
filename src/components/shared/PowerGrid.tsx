import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown, BarChart3 } from "lucide-react";

export interface PowerGridItem {
  label: string;
  value: string | number;
  sentiment?: "positive" | "neutral" | "warning" | "critical";
  icon?: React.ElementType;
}

interface PowerGridProps {
  items: PowerGridItem[];
  columns?: 3 | 4 | 6;
  title?: string;
  defaultOpen?: boolean;
}

const sentimentValue: Record<string, string> = {
  positive: "text-success",
  neutral: "text-foreground",
  warning: "text-warning",
  critical: "text-destructive",
};

const sentimentDot: Record<string, string> = {
  positive: "bg-success",
  neutral: "bg-muted-foreground/20",
  warning: "bg-warning",
  critical: "bg-destructive",
};

const PowerGrid = ({ items, columns = 4, title, defaultOpen = false }: PowerGridProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const gridCols = columns === 3 ? "lg:grid-cols-3" : columns === 6 ? "lg:grid-cols-6" : "lg:grid-cols-4";

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full py-2 group"
      >
        <BarChart3 className="w-3.5 h-3.5 text-muted-foreground/40" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
          {title || "Alle Metriken"}
        </span>
        <span className="text-[10px] text-muted-foreground/40 ml-1">{items.length}</span>
        <div className="flex-1 h-px bg-border/30 mx-2" />
        <ChevronDown className={cn(
          "w-3.5 h-3.5 text-muted-foreground/40 transition-transform duration-300",
          open && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-px bg-border/30 rounded-xl overflow-hidden mt-2", gridCols)}>
              {items.map((item) => {
                const sentiment = item.sentiment || "neutral";
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="bg-card px-4 py-3.5 cursor-default group hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {Icon && <Icon className="w-3 h-3 text-muted-foreground/40" />}
                      <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-[0.04em] truncate">
                        {item.label}
                      </span>
                      <div className={cn("w-1 h-1 rounded-full ml-auto", sentimentDot[sentiment])} />
                    </div>
                    <p className={cn("hero-number text-lg", sentimentValue[sentiment])}>
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PowerGrid;

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
}

const sentimentValue: Record<string, string> = {
  positive: "text-success",
  neutral: "text-foreground",
  warning: "text-warning",
  critical: "text-destructive",
};

const PowerGrid = ({ items, columns = 4, title }: PowerGridProps) => {
  const gridCols = columns === 3 ? "lg:grid-cols-3" : columns === 6 ? "lg:grid-cols-6" : "lg:grid-cols-4";

  return (
    <section>
      {title && (
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground mb-4">{title}</h2>
      )}
      <div className={cn("grid grid-cols-2 sm:grid-cols-3 gap-3", gridCols)}>
        {items.map((item, i) => {
          const sentiment = item.sentiment || "neutral";
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
              className="cmd-card p-4 cursor-default"
            >
              <div className="flex items-center gap-1.5 mb-2">
                {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/60" />}
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.06em] truncate">
                  {item.label}
                </span>
              </div>
              <p className={cn("hero-number text-xl", sentimentValue[sentiment])}>
                {item.value}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default PowerGrid;

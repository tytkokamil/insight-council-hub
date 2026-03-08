import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SubNavItem<T extends string = string> {
  key: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface SubNavProps<T extends string = string> {
  items: SubNavItem<T>[];
  active: T;
  onChange: (key: T) => void;
  layoutId?: string;
}

/**
 * Unified sub-navigation / tab bar used across all pages.
 * Wraps instead of scrolling so all items are always visible.
 */
const SubNav = <T extends string>({ items, active, onChange, layoutId = "subnav" }: SubNavProps<T>) => {
  return (
    <nav className="flex flex-wrap items-center gap-0.5 border-b border-border/50 mb-6 pb-px sticky top-12 z-20 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all relative whitespace-nowrap rounded-md",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {item.icon && <item.icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "")} />}
            {item.label}
            {item.badge !== undefined && item.badge > 0 && (
              <span className="ml-1 min-w-[16px] h-4 rounded-full bg-destructive/10 text-destructive text-[10px] font-semibold flex items-center justify-center px-1">
                {item.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default SubNav;

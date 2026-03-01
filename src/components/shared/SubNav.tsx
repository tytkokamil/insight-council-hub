import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface SubNavItem<T extends string = string> {
  key: T;
  label: string;
  icon?: LucideIcon;
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
    <nav className="flex flex-wrap items-center gap-1 border-b border-border/60 mb-6 pb-px sticky top-0 z-30 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
      {items.map((item) => {
        const isActive = active === item.key;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-colors relative whitespace-nowrap rounded-t-md ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.icon && <item.icon className="w-3.5 h-3.5" />}
            {item.label}
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
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

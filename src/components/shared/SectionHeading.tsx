import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Consistent section heading used across all pages.
 * Replaces ad-hoc <h2> usage with a uniform look.
 */
const SectionHeading = ({ title, subtitle, icon, action, className, size = "sm" }: SectionHeadingProps) => (
  <div className={cn("flex items-center justify-between gap-3 mb-4", className)}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
      <div className="min-w-0">
        <h2 className={cn(
          "font-semibold tracking-tight",
          size === "sm" ? "text-sm" : "text-base"
        )}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export default SectionHeading;

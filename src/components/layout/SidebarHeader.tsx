import { memo } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Sun, Moon, ChevronLeft } from "lucide-react";

interface SidebarHeaderProps {
  collapsed: boolean;
  theme: string;
  toggleTheme: () => void;
  onCollapse: () => void;
  onNavigate?: () => void;
}

const SidebarHeader = memo(({
  collapsed,
  theme,
  toggleTheme,
  onCollapse,
  onNavigate,
}: SidebarHeaderProps) => (
  <div className="flex items-center justify-between px-3 h-14 border-b border-border">
    <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden" onClick={onNavigate}>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <LayoutDashboard className="w-4 h-4 text-primary" />
      </div>
      {!collapsed && (
        <span className="font-display font-semibold text-sm tracking-tight whitespace-nowrap">
          DecisionOS
        </span>
      )}
    </Link>
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
        title={theme === "dark" ? "Light Mode" : "Dark Mode"}
      >
        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={onCollapse}
        className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
      >
        <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
      </button>
    </div>
  </div>
));

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;

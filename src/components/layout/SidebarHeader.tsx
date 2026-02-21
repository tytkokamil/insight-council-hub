import { memo } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, PanelLeftClose, PanelLeft } from "lucide-react";

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
  <div className="flex items-center justify-between px-3 h-12 border-b border-border/40">
    <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden" onClick={onNavigate}>
      <span className="w-6 h-6 rounded bg-foreground/10 flex items-center justify-center shrink-0 text-[11px] font-bold text-foreground/70">
        D
      </span>
      {!collapsed && (
        <span className="font-medium text-[13px] tracking-tight whitespace-nowrap text-foreground">
          DecisionOS
        </span>
      )}
    </Link>
    <div className="flex items-center gap-0.5 shrink-0">
      <button
        onClick={toggleTheme}
        className="w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
        title={theme === "dark" ? "Light Mode" : "Dark Mode"}
      >
        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={onCollapse}
        className="w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hidden md:flex"
        title={collapsed ? "Sidebar erweitern" : "Sidebar einklappen"}
      >
        {collapsed ? <PanelLeft className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
      </button>
    </div>
  </div>
));

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;

import { Link } from "react-router-dom";
import { LayoutDashboard, Sun, Moon, Menu } from "lucide-react";

interface MobileHeaderProps {
  theme: string;
  toggleTheme: () => void;
  onMenuOpen: () => void;
}

const MobileHeader = ({
  theme,
  toggleTheme,
  onMenuOpen,
}: MobileHeaderProps) => (
  <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-card border-b border-border flex items-center justify-between px-4" role="banner">
    <button
      onClick={onMenuOpen}
      className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-foreground"
      aria-label="Navigation öffnen"
    >
      <Menu className="w-5 h-5" />
    </button>
    <Link to="/dashboard" className="flex items-center gap-2" aria-label="DecisionOS Startseite">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
        <LayoutDashboard className="w-3.5 h-3.5 text-primary" />
      </div>
      <span className="font-display font-semibold text-sm">DecisionOS</span>
    </Link>
    <button
      onClick={toggleTheme}
      className="w-9 h-9 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground"
      aria-label={theme === "dark" ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  </header>
);

export default MobileHeader;

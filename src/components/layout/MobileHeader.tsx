import { Link } from "react-router-dom";
import { Sun, Moon, Menu } from "lucide-react";
import decivioLogo from "@/assets/decivio-logo.png";
import { useTranslation } from "react-i18next";

interface MobileHeaderProps {
  theme: string;
  toggleTheme: () => void;
  onMenuOpen: () => void;
}

const MobileHeader = ({ theme, toggleTheme, onMenuOpen }: MobileHeaderProps) => {
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-12 bg-background border-b border-border/40 flex items-center justify-between px-3" role="banner">
      <button
        onClick={onMenuOpen}
        className="w-8 h-8 rounded-md hover:bg-foreground/[0.04] flex items-center justify-center transition-colors text-foreground"
        aria-label={t("common.openNav")}
      >
        <Menu className="w-4 h-4" />
      </button>
      <Link to="/dashboard" className="flex items-center gap-2" aria-label={t("common.home")}>
        <img src={decivioLogo} alt="Decivio" className="w-6 h-6 rounded" />
        <span className="font-medium text-[13px] text-foreground">Decivio</span>
      </Link>
      <button
        onClick={toggleTheme}
        className="w-8 h-8 rounded-md hover:bg-foreground/[0.04] flex items-center justify-center transition-colors text-muted-foreground"
        aria-label={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
      >
        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
    </header>
  );
};

export default MobileHeader;

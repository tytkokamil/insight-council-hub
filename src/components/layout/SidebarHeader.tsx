import { memo } from "react";
import { Link } from "react-router-dom";
import { Sun, Moon, PanelLeftClose, PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import decivioLogo from "@/assets/decivio-logo.png";
import { useTranslation } from "react-i18next";
import { useBranding } from "@/hooks/useBranding";

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
}: SidebarHeaderProps) => {
  const { t } = useTranslation();
  const branding = useBranding();
  const logoSrc = branding.logoUrl || decivioLogo;
  const appName = branding.companyName || "Decivio";

  return (
    <div className={`flex items-center ${collapsed ? "flex-col gap-1 px-1.5 py-2" : "justify-between px-3"} h-auto min-h-[48px] border-b border-border/40`}>
      <Link to="/dashboard" className={`flex items-center gap-2 overflow-hidden ${collapsed ? "justify-center" : ""}`} onClick={onNavigate}>
        <img src={logoSrc} alt={appName} className="w-6 h-6 rounded shrink-0 object-contain" />
        {!collapsed && (
          <span className="font-medium text-[13px] tracking-tight whitespace-nowrap text-foreground">
            {appName}
          </span>
        )}
      </Link>
      <div className={`flex ${collapsed ? "flex-col" : ""} items-center gap-0.5 shrink-0`}>
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground relative overflow-hidden"
          title={theme === "dark" ? "Light Mode" : "Dark Mode"}
          aria-label={theme === "dark" ? t("common.switchToLight") : t("common.switchToDark")}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ y: -14, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 14, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </motion.span>
          </AnimatePresence>
        </button>
        <button
          onClick={onCollapse}
          className={`rounded-md hover:bg-muted/60 flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground hidden md:flex ${
            collapsed ? "w-8 h-8 bg-muted/40 hover:bg-primary/10 hover:text-primary" : "w-7 h-7"
          }`}
          title={collapsed ? t("common.expandSidebar") : t("common.collapseSidebar")}
        >
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
});

SidebarHeader.displayName = "SidebarHeader";

export default SidebarHeader;

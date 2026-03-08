import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FileText, ListTodo, Users, MoreHorizontal, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
  { icon: FileText, labelKey: "nav.decisions", path: "/decisions" },
  { icon: ListTodo, labelKey: "nav.tasks", path: "/tasks" },
  { icon: Users, labelKey: "nav.teams", path: "/teams" },
] as const;

const MORE_ITEMS = [
  { labelKey: "nav.calendar", path: "/calendar" },
  { labelKey: "nav.analytics", path: "/analytics" },
  { labelKey: "nav.briefing", path: "/briefing" },
  { labelKey: "nav.settings", path: "/settings" },
] as const;

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      {/* FAB - New Decision */}
      <Link
        to="/decisions?new=1"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label={t("decisions.newDecision")}
      >
        <Plus className="w-6 h-6" />
      </Link>

      {/* More menu overlay */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed bottom-16 left-2 right-2 z-50 bg-background border border-border rounded-xl shadow-xl p-2"
            >
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMoreOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-background/95 backdrop-blur-lg border-t border-border/40 flex items-center justify-around px-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">{t(item.labelKey)}</span>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute top-0 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px] ${
            moreOpen ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-tight">{t("common.more")}</span>
        </button>
      </nav>
    </>
  );
};

export default MobileBottomNav;

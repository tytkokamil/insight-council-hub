import { ReactNode, useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import TeamSwitcher from "./TeamSwitcher";
import CommandPalette from "./CommandPalette";
import KeyboardShortcutsModal, { useKeyboardShortcuts } from "./KeyboardShortcutsModal";
import OnboardingTour from "@/components/onboarding/OnboardingTour";
import { motion, AnimatePresence } from "framer-motion";
import { usePrefetchOnHover } from "@/hooks/usePrefetch";

import SidebarHeader from "./SidebarHeader";
import SidebarNav from "./SidebarNav";
import SidebarFooter from "./SidebarFooter";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";
import TopBar from "./TopBar";
import FreemiumWarningBar from "@/components/upgrade/FreemiumWarningBar";
import TrialBanner from "@/components/upgrade/TrialBanner";
import TrialExpiredModal from "@/components/upgrade/TrialExpiredModal";
import PastDueBanner from "@/components/upgrade/PastDueBanner";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import QuickCaptureButton from "@/components/shared/QuickCaptureButton";
import CodTickerBadge from "@/components/shared/CodTickerBadge";
import ImpersonationBanner from "@/components/internal-admin/ImpersonationBanner";
/* ── Composed sidebar content ── */
const SidebarContent = ({
  collapsed,
  isAdmin,
  isFeatureEnabled,
  pathname,
  user,
  avatarUrl,
  theme,
  toggleTheme,
  onCollapse,
  onSignOut,
  onNavigate,
  onPrefetch,
  userRole,
}: {
  collapsed: boolean;
  isAdmin: boolean;
  isFeatureEnabled: (key: string) => boolean;
  pathname: string;
  user: any;
  avatarUrl: string | null;
  theme: string;
  toggleTheme: () => void;
  onCollapse: () => void;
  onSignOut: () => void;
  onNavigate?: () => void;
  onPrefetch?: (path: string) => void;
  userRole?: import("@/hooks/usePermissions").OrgRoleKey;
}) => (
  <>
    <SidebarHeader collapsed={collapsed} theme={theme} toggleTheme={toggleTheme} onCollapse={onCollapse} onNavigate={onNavigate} />
    <TeamSwitcher collapsed={collapsed} />
    <SidebarNav collapsed={collapsed} isAdmin={isAdmin} isFeatureEnabled={isFeatureEnabled} pathname={pathname} onNavigate={onNavigate} onPrefetch={onPrefetch} userRole={userRole} />
    <CodTickerBadge collapsed={collapsed} />
    <SidebarFooter collapsed={collapsed} user={user} avatarUrl={avatarUrl} onSignOut={onSignOut} />
  </>
);

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isEnabled } = useFeatureFlags();
  const isMobile = useIsMobile();
  const prefetch = usePrefetchOnHover();
  const { role: userRole, isAdmin } = usePermissions();
  const { shortcutsOpen, setShortcutsOpen } = useKeyboardShortcuts();
  const { isTrialing, isTrialExpired, trialDaysLeft, isPastDue, pastDueDaysLeft } = useTrialStatus();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [trialModalDismissed, setTrialModalDismissed] = useState(false);

  useEffect(() => {
    if (user && !localStorage.getItem(`onboarding_done_${user.id}`)) {
      setShowOnboarding(true);
    }
  }, [user]);

  const completeOnboarding = () => {
    if (user) localStorage.setItem(`onboarding_done_${user.id}`, "true");
    setShowOnboarding(false);
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single().then(({ data }) => {
        setAvatarUrl(data?.avatar_url || null);
      });
    }
  }, [user]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const sidebarProps = {
    isAdmin,
    isFeatureEnabled: isEnabled,
    pathname: location.pathname,
    user,
    avatarUrl,
    theme,
    toggleTheme,
    onSignOut: handleSignOut,
    userRole,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium"
      >
        {t("common.skipToContent")}
      </a>

      {isMobile && (
        <MobileHeader theme={theme} toggleTheme={toggleTheme} onMenuOpen={() => setMobileOpen(true)} />
      )}

      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-background border-r border-border/40 flex flex-col"
              role="navigation"
              aria-label={t("common.openNav")}
            >
              <div className="absolute top-3 right-3 z-10">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                  aria-label={t("common.closeNav")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SidebarContent
                collapsed={false}
                {...sidebarProps}
                onCollapse={() => {}}
                onNavigate={() => setMobileOpen(false)}
                onPrefetch={prefetch}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {!isMobile && (
        <aside
          style={{ width: collapsed ? 52 : 240 }}
          className="relative border-r border-border/40 bg-background flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-out"
          role="navigation"
          aria-label={t("common.openNav")}
        >
          <SidebarContent
            collapsed={collapsed}
            {...sidebarProps}
            onCollapse={() => setCollapsed(!collapsed)}
            onPrefetch={prefetch}
          />
        </aside>
      )}

      <main id="main-content" className={`flex-1 overflow-auto flex flex-col ${isMobile ? "pt-14 pb-20" : ""}`} role="main">
        {!isMobile && <TopBar collapsed={collapsed} />}
        <ImpersonationBanner />
        {isTrialing && <TrialBanner daysLeft={trialDaysLeft} />}
        {isPastDue && (userRole === "org_owner" || userRole === "org_admin") && (
          <PastDueBanner daysUntilSuspension={pastDueDaysLeft} />
        )}
        <FreemiumWarningBar />
        <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              className="page-content"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {isMobile && <MobileBottomNav />}
      <QuickCaptureButton />
      <CommandPalette />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <OnboardingTour open={showOnboarding} onComplete={completeOnboarding} />
      <TrialExpiredModal open={isTrialExpired && !trialModalDismissed} onDismiss={() => setTrialModalDismissed(true)} />
    </div>
  );
};

export default AppLayout;

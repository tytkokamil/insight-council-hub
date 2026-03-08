import { memo, useMemo, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import NotificationCenter from "./NotificationCenter";

/* ── Breadcrumb map ── */
const BREADCRUMB_MAP: Record<string, { area: string; areaKey: string }> = {
  "/dashboard": { area: "workspace", areaKey: "nav.workspace" },
  "/decisions": { area: "workspace", areaKey: "nav.workspace" },
  "/tasks": { area: "workspace", areaKey: "nav.workspace" },
  "/calendar": { area: "workspace", areaKey: "nav.workspace" },
  "/executive": { area: "intelligence", areaKey: "nav.intelligence" },
  "/analytics": { area: "intelligence", areaKey: "nav.intelligence" },
  "/process": { area: "intelligence", areaKey: "nav.intelligence" },
  "/decision-graph": { area: "intelligence", areaKey: "nav.intelligence" },
  "/engine": { area: "governance", areaKey: "nav.governance" },
  "/risks": { area: "governance", areaKey: "nav.governance" },
  "/automation-rules": { area: "governance", areaKey: "nav.governance" },
  "/audit-trail": { area: "governance", areaKey: "nav.governance" },
  "/teams": { area: "teams", areaKey: "nav.teamsNav" },
  "/meeting": { area: "teams", areaKey: "nav.teamsNav" },
  "/settings": { area: "system", areaKey: "nav.system" },
  "/template-editor": { area: "system", areaKey: "nav.system" },
  "/strategy": { area: "system", areaKey: "nav.system" },
  "/archive": { area: "system", areaKey: "nav.system" },
  "/knowledge-base": { area: "system", areaKey: "nav.system" },
  "/search": { area: "workspace", areaKey: "nav.workspace" },
  "/admin/users": { area: "system", areaKey: "nav.system" },
};

/* ── Page title map ── */
const PAGE_TITLE_MAP: Record<string, string> = {
  "/dashboard": "nav.dashboard",
  "/decisions": "nav.decisions",
  "/tasks": "nav.tasks",
  "/calendar": "nav.calendar",
  "/executive": "nav.executiveHub",
  "/analytics": "nav.analyticsHub",
  "/analytics/friction-map": "nav.frictionMap",
  "/analytics/health-heatmap": "nav.healthHeatmap",
  "/analytics/bottleneck-intelligence": "nav.bottleneckIntelligence",
  "/analytics/decision-dna": "nav.decisionDna",
  "/analytics/decision-benchmarking": "nav.benchmarking",
  "/analytics/pattern-engine": "nav.patternEngine",
  "/analytics/opportunity-cost-radar": "nav.opportunityCost",
  "/analytics/predictive-timeline": "nav.predictiveTimeline",
  "/analytics/team-performance": "nav.teamPerformance",
  "/analytics/scenario-engine": "nav.scenarios",
  "/process": "nav.processHub",
  "/decision-graph": "nav.decisionGraph",
  "/engine": "nav.escalationCenter",
  "/risks": "nav.riskRegister",
  "/automation-rules": "nav.automations",
  "/audit-trail": "nav.auditTrail",
  "/teams": "nav.teamsNav",
  "/meeting": "nav.meeting",
  "/settings": "nav.settings",
  "/template-editor": "nav.templates",
  "/strategy": "nav.strategy",
  "/archive": "nav.archive",
  "/knowledge-base": "nav.knowledgeBase",
  "/search": "nav.search",
  "/admin/users": "nav.users",
};

/* ── Primary action per page ── */
const PAGE_ACTIONS: Record<string, { labelKey: string; path?: string; event?: string }> = {
  "/decisions": { labelKey: "decisions.createNew", event: "new-decision" },
  "/tasks": { labelKey: "tasks.createNew", event: "new-task" },
  "/teams": { labelKey: "teams.createTeam", event: "new-team" },
};

interface TopBarProps {
  collapsed: boolean;
}

const TopBar = memo(({ collapsed }: TopBarProps) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Don't render on mobile (mobile has its own header)
  if (isMobile) return null;

  const pathname = location.pathname;

  // Resolve breadcrumb
  const matchedPath = Object.keys(BREADCRUMB_MAP)
    .sort((a, b) => b.length - a.length)
    .find(p => pathname.startsWith(p));

  const breadcrumb = matchedPath ? BREADCRUMB_MAP[matchedPath] : null;
  const pageTitle = matchedPath ? PAGE_TITLE_MAP[matchedPath] : null;
  const action = PAGE_ACTIONS[pathname];

  const handleSearch = () => {
    if (searchOpen) {
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      setTimeout(() => searchRef.current?.focus(), 100);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = searchRef.current?.value?.trim();
    if (val) {
      navigate(`/search?q=${encodeURIComponent(val)}`);
      setSearchOpen(false);
    }
  };

  const handleAction = () => {
    if (action?.event) {
      window.dispatchEvent(new CustomEvent(action.event));
    }
  };

  return (
    <header className="sticky top-0 z-30 h-12 bg-background/80 backdrop-blur-md border-b border-border/30 flex items-center justify-between px-6 shrink-0">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1.5 min-w-0 text-[13px]">
        {breadcrumb && (
          <>
            <span className="text-muted-foreground/50 capitalize">{t(breadcrumb.areaKey, { defaultValue: breadcrumb.area })}</span>
            {pageTitle && (
              <>
                <span className="text-muted-foreground/30">/</span>
                <span className="font-medium text-foreground truncate">{t(pageTitle)}</span>
              </>
            )}
          </>
        )}
      </div>

      {/* Right: Search + Notifications + Action */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          {searchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center">
              <input
                ref={searchRef}
                type="text"
                placeholder={t("topBar.searchPlaceholder", { defaultValue: "Entscheidung suchen..." })}
                className="w-56 h-8 px-3 pr-8 rounded-lg bg-muted/50 border border-border/60 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                onBlur={() => {
                  setTimeout(() => setSearchOpen(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setSearchOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <button
              onClick={handleSearch}
              className="h-8 px-2.5 rounded-lg hover:bg-muted/50 flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title={t("topBar.searchPlaceholder", { defaultValue: "Entscheidung suchen..." })}
            >
              <Search className="w-4 h-4" />
              <span className="text-[11px] text-muted-foreground/50 hidden lg:inline">⌘K</span>
            </button>
          )}
        </div>

        {/* Notifications */}
        <NotificationCenter collapsed={false} position="topbar" />

        {/* Contextual Action */}
        {action && (
          <Button size="sm" onClick={handleAction} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t(action.labelKey, { defaultValue: "Neu" })}</span>
          </Button>
        )}
      </div>
    </header>
  );
});

TopBar.displayName = "TopBar";

export default TopBar;

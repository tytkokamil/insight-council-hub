import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TeamProvider } from "@/hooks/useTeamContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { FeatureFlagsProvider } from "@/hooks/useFeatureFlags";
import { GuidedModeProvider } from "@/hooks/useGuidedMode";
import { TerminologyProvider } from "@/hooks/useTerminology";
import { PermissionsProvider } from "@/hooks/usePermissions";
import GlobalErrorBoundary from "@/components/shared/GlobalErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import OfflineIndicator from "@/components/shared/OfflineIndicator";
import CookieBanner from "@/components/shared/CookieBanner";
import { publicRoutes, protectedRoutes, catchAllRoute } from "@/routes";
import { toast } from "sonner";
import i18n from "@/i18n";

const MAX_MUTATION_RETRIES = 2;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,       // 5 min — data stays fresh, no refetch on tab switch
      gcTime: 10 * 60_000,         // 10 min in cache
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry auth or validation errors
        const status = error?.status ?? error?.code;
        if (status === 401 || status === 403 || status === 422) return false;
        return failureCount < MAX_MUTATION_RETRIES;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      onError: (error) => {
        console.error("[Mutation Error]", error);
        toast.error(i18n.t("common.saveFailed"), {
          description: i18n.t("common.tryAgainLater"),
          action: {
            label: i18n.t("common.retry"),
            onClick: () => {}, // individual mutations handle retry
          },
        });
      },
    },
  },
});

// Global query error handler
queryClient.getQueryCache().config.onError = (error) => {
  console.error("[Query Error]", error);
};

const App = () => (
  <GlobalErrorBoundary>
  <HelmetProvider>
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <FeatureFlagsProvider>
            <PermissionsProvider>
            <GuidedModeProvider>
            <TeamProvider>
            <TerminologyProvider>
            <Routes>
              {publicRoutes}
              {protectedRoutes}
              {catchAllRoute}
            </Routes>
            </TerminologyProvider>
            </TeamProvider>
            </GuidedModeProvider>
            </PermissionsProvider>
            </FeatureFlagsProvider>
            <CookieBanner />
          </AuthProvider>
          <OfflineIndicator />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
  </GlobalErrorBoundary>
);

export default App;

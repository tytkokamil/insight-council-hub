import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TeamProvider } from "@/hooks/useTeamContext";
import { ThemeProvider } from "@/hooks/useTheme";
import { FeatureFlagsProvider } from "@/hooks/useFeatureFlags";
import { GuidedModeProvider } from "@/hooks/useGuidedMode";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import { lazy, Suspense } from "react";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import GlobalErrorBoundary from "@/components/shared/GlobalErrorBoundary";
import { HelmetProvider } from "react-helmet-async";
import OfflineIndicator from "@/components/shared/OfflineIndicator";
import CookieBanner from "@/components/shared/CookieBanner";

// Eagerly loaded (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Decisions = lazy(() => import("./pages/Decisions"));
const Teams = lazy(() => import("./pages/Teams"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Briefing = lazy(() => import("./pages/Briefing"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DecisionGraph = lazy(() => import("./pages/DecisionGraph"));
const BottleneckIntelligence = lazy(() => import("./pages/BottleneckIntelligence"));
const OpportunityCostRadar = lazy(() => import("./pages/OpportunityCostRadar"));
// WarRoom removed – integrated into EscalationEngine
const PredictiveTimeline = lazy(() => import("./pages/PredictiveTimeline"));
const Strategy = lazy(() => import("./pages/Strategy"));
const FrictionMap = lazy(() => import("./pages/FrictionMap"));
const HealthHeatmap = lazy(() => import("./pages/HealthHeatmap"));
const DecisionDNA = lazy(() => import("./pages/DecisionDNA"));
const EscalationEngine = lazy(() => import("./pages/EscalationEngine"));
const DecisionBenchmarking = lazy(() => import("./pages/DecisionBenchmarking"));
const ScenarioEngine = lazy(() => import("./pages/ScenarioEngine"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const PilotSettings = lazy(() => import("./pages/PilotSettings"));
const DecisionCalendar = lazy(() => import("./pages/DecisionCalendar"));
const PatternEngine = lazy(() => import("./pages/PatternEngine"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const TasksPage = lazy(() => import("./pages/Tasks"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
// Templates page removed – integrated into TemplateEditor
const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const DecisionDetail = lazy(() => import("./pages/DecisionDetail"));
const AutomationRules = lazy(() => import("./pages/AutomationRules"));
const ArchivePage = lazy(() => import("./pages/ArchivePage"));
const RiskRegister = lazy(() => import("./pages/RiskRegister"));
const TeamPerformance = lazy(() => import("./pages/TeamPerformance"));
const GlobalSearch = lazy(() => import("./pages/GlobalSearch"));
const MeetingMode = lazy(() => import("./pages/MeetingMode"));

const AnalyticsHub = lazy(() => import("./pages/AnalyticsHub"));
const ProcessHub = lazy(() => import("./pages/ProcessHub"));
const ExecutiveHub = lazy(() => import("./pages/ExecutiveHub"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Imprint = lazy(() => import("./pages/Imprint"));

const queryClient = new QueryClient();

const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <WidgetErrorBoundary label="Seite">
      <Suspense fallback={<PageLoadingFallback />}>
        {children}
      </Suspense>
    </WidgetErrorBoundary>
  </ProtectedRoute>
);

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
            <GuidedModeProvider>
            <TeamProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/privacy" element={<Suspense fallback={<PageLoadingFallback />}><PrivacyPolicy /></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={<PageLoadingFallback />}><TermsOfService /></Suspense>} />
              <Route path="/imprint" element={<Suspense fallback={<PageLoadingFallback />}><Imprint /></Suspense>} />
              <Route path="/reset-password" element={<Suspense fallback={<PageLoadingFallback />}><ResetPassword /></Suspense>} />
              <Route path="/dashboard" element={<P><Dashboard /></P>} />
              <Route path="/decisions" element={<P><Decisions /></P>} />
              <Route path="/decisions/:id" element={<P><DecisionDetail /></P>} />
              <Route path="/teams" element={<P><Teams /></P>} />
              <Route path="/teams/:teamId" element={<P><TeamDetail /></P>} />
              <Route path="/tasks" element={<P><TasksPage /></P>} />
              <Route path="/tasks/:id" element={<P><TaskDetail /></P>} />
              <Route path="/analytics" element={<P><AnalyticsHub /></P>} />
              <Route path="/briefing" element={<P><Briefing /></P>} />
              <Route path="/graph" element={<P><DecisionGraph /></P>} />
              <Route path="/bottlenecks" element={<P><BottleneckIntelligence /></P>} />
              <Route path="/costs" element={<P><OpportunityCostRadar /></P>} />
              {/* /warroom removed – integrated into /engine */}
              <Route path="/timeline" element={<P><PredictiveTimeline /></P>} />
              <Route path="/strategy" element={<P><Strategy /></P>} />
              <Route path="/friction" element={<P><FrictionMap /></P>} />
              <Route path="/health" element={<P><HealthHeatmap /></P>} />
              <Route path="/dna" element={<P><DecisionDNA /></P>} />
              <Route path="/engine" element={<P><EscalationEngine /></P>} />
              <Route path="/benchmarking" element={<P><DecisionBenchmarking /></P>} />
              <Route path="/scenarios" element={<P><ScenarioEngine /></P>} />
              <Route path="/executive" element={<P><ExecutiveHub /></P>} />
              <Route path="/settings" element={<P><SettingsPage /></P>} />
              <Route path="/admin/users" element={<P><AdminUsers /></P>} />
              <Route path="/audit" element={<P><AuditTrail /></P>} />
              <Route path="/pilot" element={<P><PilotSettings /></P>} />
              <Route path="/calendar" element={<P><DecisionCalendar /></P>} />
              <Route path="/patterns" element={<P><PatternEngine /></P>} />
              <Route path="/templates" element={<P><TemplateEditor /></P>} />
              <Route path="/template-editor" element={<P><TemplateEditor /></P>} />
              <Route path="/unified-timeline" element={<P><TimelinePage /></P>} />
              <Route path="/knowledge" element={<P><KnowledgeBase /></P>} />
              <Route path="/automations" element={<P><AutomationRules /></P>} />
              <Route path="/archive" element={<P><ArchivePage /></P>} />
              <Route path="/risks" element={<P><RiskRegister /></P>} />
              <Route path="/team-performance" element={<P><TeamPerformance /></P>} />
              <Route path="/search" element={<P><GlobalSearch /></P>} />
              <Route path="/meeting" element={<P><MeetingMode /></P>} />
              <Route path="/process" element={<P><ProcessHub /></P>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            </TeamProvider>
            </GuidedModeProvider>
            </FeatureFlagsProvider>
          </AuthProvider>
          <OfflineIndicator />
          <CookieBanner />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </HelmetProvider>
  </GlobalErrorBoundary>
);

export default App;

import { lazy, Suspense } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import WidgetErrorBoundary from "@/components/shared/WidgetErrorBoundary";
import PageLoadingFallback from "@/components/shared/PageLoadingFallback";

// Eagerly loaded (critical path)
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// ── Lazy loaded pages ──────────────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Decisions = lazy(() => import("./pages/Decisions"));
const Teams = lazy(() => import("./pages/Teams"));
const Briefing = lazy(() => import("./pages/Briefing"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const DecisionGraph = lazy(() => import("./pages/DecisionGraph"));
const Templates = lazy(() => import("./pages/Templates"));
const BottleneckIntelligence = lazy(() => import("./pages/BottleneckIntelligence"));
const OpportunityCostRadar = lazy(() => import("./pages/OpportunityCostRadar"));
const PredictiveTimeline = lazy(() => import("./pages/PredictiveTimeline"));
const Strategy = lazy(() => import("./pages/Strategy"));
const FrictionMap = lazy(() => import("./pages/FrictionMap"));
const HealthHeatmap = lazy(() => import("./pages/HealthHeatmap"));
const DecisionDNA = lazy(() => import("./pages/DecisionDNA"));
const EscalationEngine = lazy(() => import("./pages/EscalationEngine"));
const DecisionBenchmarking = lazy(() => import("./pages/DecisionBenchmarking"));
const ScenarioEngine = lazy(() => import("./pages/ScenarioEngine"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const PilotSettings = lazy(() => import("./pages/PilotSettings"));
const DecisionCalendar = lazy(() => import("./pages/DecisionCalendar"));
const PatternEngine = lazy(() => import("./pages/PatternEngine"));
const TeamDetail = lazy(() => import("./pages/TeamDetail"));
const TasksPage = lazy(() => import("./pages/Tasks"));
const TaskDetail = lazy(() => import("./pages/TaskDetail"));
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
const DataProcessingAgreement = lazy(() => import("./pages/DataProcessingAgreement"));
const AiDataPolicy = lazy(() => import("./pages/AiDataPolicy"));
const SubProcessors = lazy(() => import("./pages/SubProcessors"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Contact = lazy(() => import("./pages/Contact"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const EmailAction = lazy(() => import("./pages/EmailAction"));
const ExternalReview = lazy(() => import("./pages/ExternalReview"));
const InternalAdmin = lazy(() => import("./pages/InternalAdmin"));
const Welcome = lazy(() => import("./pages/Welcome"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const WarRoom = lazy(() => import("./pages/WarRoom"));
const IndustryLandingPage = lazy(() => import("./pages/IndustryLandingPage"));
const DemoMode = lazy(() => import("./pages/DemoMode"));
const PainOnboarding = lazy(() => import("./pages/PainOnboarding"));
const CodCalculatorWidget = lazy(() => import("./pages/CodCalculatorWidget"));
const BadgeVerification = lazy(() => import("./pages/BadgeVerification"));
// ── Wrappers ───────────────────────────────────────────

/** Protected + Suspense + Error Boundary wrapper */
const P = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <WidgetErrorBoundary label="Seite">
      <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
    </WidgetErrorBoundary>
  </ProtectedRoute>
);

/** Public lazy wrapper */
const L = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>
);

// ── Route definitions ──────────────────────────────────

export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/privacy" element={<L><PrivacyPolicy /></L>} />
    <Route path="/terms" element={<L><TermsOfService /></L>} />
    <Route path="/imprint" element={<L><Imprint /></L>} />
    <Route path="/avv" element={<L><DataProcessingAgreement /></L>} />
    <Route path="/ai-policy" element={<L><AiDataPolicy /></L>} />
    <Route path="/sub-processors" element={<L><SubProcessors /></L>} />
    <Route path="/changelog" element={<L><Changelog /></L>} />
    <Route path="/roadmap" element={<L><Roadmap /></L>} />
    <Route path="/reset-password" element={<L><ResetPassword /></L>} />
    <Route path="/action" element={<L><EmailAction /></L>} />
    <Route path="/approve/:token" element={<L><EmailAction /></L>} />
    <Route path="/reject/:token" element={<L><EmailAction /></L>} />
    <Route path="/review/external" element={<L><ExternalReview /></L>} />
    <Route path="/review/:token" element={<L><ExternalReview /></L>} />
    <Route path="/contact" element={<L><Contact /></L>} />
    <Route path="/docs" element={<L><HelpCenter /></L>} />
    <Route path="/branchen/:slug" element={<L><IndustryLandingPage /></L>} />
    <Route path="/demo" element={<L><DemoMode /></L>} />
    <Route path="/internal-admin" element={<L><InternalAdmin /></L>} />
    <Route path="/widget/cod-calculator" element={<L><CodCalculatorWidget /></L>} />
    <Route path="/badge/:token" element={<L><BadgeVerification /></L>} />
);

export const protectedRoutes = (
  <>
    <Route path="/onboarding/pain" element={<P><PainOnboarding /></P>} />
    <Route path="/welcome" element={<P><Welcome /></P>} />
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
    <Route path="/timeline" element={<P><PredictiveTimeline /></P>} />
    <Route path="/strategy" element={<P><Strategy /></P>} />
    <Route path="/friction" element={<P><FrictionMap /></P>} />
    <Route path="/health" element={<P><HealthHeatmap /></P>} />
    <Route path="/dna" element={<P><DecisionDNA /></P>} />
    <Route path="/engine" element={<P><EscalationEngine /></P>} />
    <Route path="/governance" element={<P><EscalationEngine /></P>} />
    <Route path="/benchmarking" element={<P><DecisionBenchmarking /></P>} />
    <Route path="/scenarios" element={<P><ScenarioEngine /></P>} />
    <Route path="/executive" element={<P><ExecutiveHub /></P>} />
    <Route path="/settings" element={<P><SettingsPage /></P>} />
    <Route path="/admin/users" element={<P><AdminUsers /></P>} />
    <Route path="/audit" element={<P><AuditTrail /></P>} />
    <Route path="/pilot" element={<P><PilotSettings /></P>} />
    <Route path="/feature-management" element={<P><PilotSettings /></P>} />
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
    <Route path="/upgrade" element={<P><UpgradePage /></P>} />
    <Route path="/war-room" element={<P><WarRoom /></P>} />
  </>
);

export const catchAllRoute = <Route path="*" element={<NotFound />} />;

import { lazy, Suspense } from "react";
import { Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import PlatformAdminGuard from "@/components/layout/PlatformAdminGuard";
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

const CodCalculatorWidget = lazy(() => import("./pages/CodCalculatorWidget"));
const BadgeVerification = lazy(() => import("./pages/BadgeVerification"));
const LaunchChecklist = lazy(() => import("./pages/LaunchChecklist"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const CompetitorComparison = lazy(() => import("./pages/CompetitorComparison"));
const FoundingProgram = lazy(() => import("./pages/FoundingProgram"));
const AiDemo = lazy(() => import("./pages/AiDemo"));
const IntegrationsPage = lazy(() => import("./pages/IntegrationsPage"));
const LiveDemo = lazy(() => import("./pages/LiveDemo"));
const RoiReport = lazy(() => import("./pages/RoiReport"));
const ApiDocsPage = lazy(() => import("./pages/ApiDocsPage"));
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

/*
 * ══════════════════════════════════════════════════════════
 *  ROUTE OVERVIEW (Stand: 2026-03-08)
 * ══════════════════════════════════════════════════════════
 *
 *  PUBLIC ROUTES (no auth required):
 *  ─────────────────────────────────
 *  /                         Landing Page
 *  /auth, /login             Authentication (Email, Google, Magic Link)
 *  /reset-password           Password reset form
 *  /privacy                  Datenschutzerklärung
 *  /terms                    AGB / Terms of Service
 *  /imprint                  Impressum
 *  /dpa                      Auftragsverarbeitungsvertrag (AVV)
 *  /ai-data-policy           KI-Datenrichtlinie
 *  /sub-processors           Sub-Processors Liste
 *  /changelog                Changelog
 *  /roadmap                  Product Roadmap
 *  /contact                  Kontaktseite
 *  /docs                     Help Center
 *  /demo                     Demo Mode (read-only)
 *  /founding                 Founding Customer Programm
 *  /leaderboard              Branchenreport (öffentlich, keine Nutzerdaten)
 *  /ai-demo                  KI-Analyse Demo
 *  /badge/:token             Badge-Verifizierung (öffentlich, token-basiert)
 *  /widget/cod-calculator    Einbettbares CoD-Widget
 *  /vs/:slug                 Vergleichsseiten (monday, jira, excel, sap, kissflow)
 *  /branchen/:slug           Branchenspezifische Landing Pages
 *  /action                   E-Mail One-Click Actions
 *  /approve/:token           E-Mail Approval
 *  /reject/:token            E-Mail Rejection
 *  /review/external          Externes Review
 *  /review/:token            Externes Review (token)
 *
 *  PROTECTED ROUTES (auth required):
 *  ──────────────────────────────────
 *  /welcome                  Onboarding Wizard (5 Schritte)
 *  /dashboard                Haupt-Dashboard
 *  /decisions                Entscheidungsliste
 *  /decisions/:id            Entscheidungs-Detail
 *  /teams                    Teams-Übersicht
 *  /teams/:teamId            Team-Detail
 *  /tasks                    Aufgaben-Übersicht
 *  /tasks/:id                Aufgaben-Detail
 *  /executive                Executive Hub
 *  /briefing                 KI Daily Brief
 *  /decision-graph           Entscheidungsgraph
 *  /strategy                 Strategische Ziele
 *  /settings                 Einstellungen
 *  /admin/users              Benutzerverwaltung
 *  /audit-trail              Audit Trail
 *  /calendar                 Entscheidungskalender
 *  /templates                Template Editor
 *  /knowledge-base           Wissensdatenbank
 *  /automation-rules         Automatisierungsregeln
 *  /archive                  Archiv
 *  /risks                    Risikoregister
 *  /search                   Globale Suche
 *  /meeting                  Meeting-Modus
 *  /process                  Process Hub
 *  /upgrade                  Upgrade-Seite
 *  /war-room                 War Room
 *  /launch-checklist         Launch Checklist
 *  /unified-timeline         Unified Timeline
 *  /engine                   Escalation Engine
 *  /pilot                    Pilot / Feature Management
 *  /internal-admin           Plattform-Admin (Guard)
 *
 *  ANALYTICS (nested under /analytics):
 *  ─────────────────────────────────────
 *  /analytics                Analytics Hub Übersicht
 *  /analytics/bottleneck-intelligence
 *  /analytics/opportunity-cost-radar
 *  /analytics/predictive-timeline
 *  /analytics/friction-map
 *  /analytics/health-heatmap
 *  /analytics/decision-dna
 *  /analytics/decision-benchmarking
 *  /analytics/scenario-engine
 *  /analytics/pattern-engine
 *  /analytics/team-performance
 *
 *  REDIRECTS (legacy → canonical):
 *  ────────────────────────────────
 *  /avv → /dpa
 *  /ai-policy → /ai-data-policy
 *  /graph → /decision-graph
 *  /audit → /audit-trail
 *  /knowledge → /knowledge-base
 *  /automations → /automation-rules
 *  /onboarding/pain → /welcome
 *  /executive-dashboard → /executive
 *  /bottlenecks → /analytics/bottleneck-intelligence
 *  /costs → /analytics/opportunity-cost-radar
 *  /timeline → /analytics/predictive-timeline
 *  /friction → /analytics/friction-map
 *  /health → /analytics/health-heatmap
 *  /dna → /analytics/decision-dna
 *  /benchmarking → /analytics/decision-benchmarking
 *  /scenarios → /analytics/scenario-engine
 *  /patterns → /analytics/pattern-engine
 *  /team-performance → /analytics/team-performance
 * ══════════════════════════════════════════════════════════
 */


export const publicRoutes = (
  <>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/login" element={<Auth />} />
    <Route path="/privacy" element={<L><PrivacyPolicy /></L>} />
    <Route path="/terms" element={<L><TermsOfService /></L>} />
    <Route path="/imprint" element={<L><Imprint /></L>} />
    <Route path="/dpa" element={<L><DataProcessingAgreement /></L>} />
    <Route path="/ai-data-policy" element={<L><AiDataPolicy /></L>} />
    <Route path="/avv" element={<Navigate to="/dpa" replace />} />
    <Route path="/ai-policy" element={<Navigate to="/ai-data-policy" replace />} />
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
    <Route path="/demo/live" element={<L><LiveDemo /></L>} />
    <Route path="/roi-report" element={<P><RoiReport /></P>} />
    
    <Route path="/widget/cod-calculator" element={<L><CodCalculatorWidget /></L>} />
    <Route path="/badge/:token" element={<L><BadgeVerification /></L>} />
    <Route path="/leaderboard" element={<L><Leaderboard /></L>} />
    <Route path="/vs/:slug" element={<L><CompetitorComparison /></L>} />
    <Route path="/founding" element={<L><FoundingProgram /></L>} />
    <Route path="/ai-demo" element={<L><AiDemo /></L>} />
  </>
);

export const protectedRoutes = (
  <>
    <Route path="/onboarding/pain" element={<Navigate to="/welcome" replace />} />
    <Route path="/welcome" element={<P><Welcome /></P>} />
    <Route path="/executive-dashboard" element={<Navigate to="/executive" replace />} />
    <Route path="/dashboard" element={<P><Dashboard /></P>} />
    <Route path="/decisions" element={<P><Decisions /></P>} />
    <Route path="/decisions/:id" element={<P><DecisionDetail /></P>} />
    <Route path="/teams" element={<P><Teams /></P>} />
    <Route path="/teams/:teamId" element={<P><TeamDetail /></P>} />
    <Route path="/tasks" element={<P><TasksPage /></P>} />
    <Route path="/tasks/:id" element={<P><TaskDetail /></P>} />
    <Route path="/analytics" element={<P><AnalyticsHub /></P>} />
    <Route path="/briefing" element={<P><Briefing /></P>} />
    <Route path="/decision-graph" element={<P><DecisionGraph /></P>} />
    <Route path="/graph" element={<Navigate to="/decision-graph" replace />} />
    <Route path="/analytics/bottleneck-intelligence" element={<P><BottleneckIntelligence /></P>} />
    <Route path="/bottlenecks" element={<Navigate to="/analytics/bottleneck-intelligence" replace />} />
    <Route path="/analytics/opportunity-cost-radar" element={<P><OpportunityCostRadar /></P>} />
    <Route path="/costs" element={<Navigate to="/analytics/opportunity-cost-radar" replace />} />
    <Route path="/analytics/predictive-timeline" element={<P><PredictiveTimeline /></P>} />
    <Route path="/timeline" element={<Navigate to="/analytics/predictive-timeline" replace />} />
    <Route path="/strategy" element={<P><Strategy /></P>} />
    <Route path="/analytics/friction-map" element={<P><FrictionMap /></P>} />
    <Route path="/friction" element={<Navigate to="/analytics/friction-map" replace />} />
    <Route path="/analytics/health-heatmap" element={<P><HealthHeatmap /></P>} />
    <Route path="/health" element={<Navigate to="/analytics/health-heatmap" replace />} />
    <Route path="/analytics/decision-dna" element={<P><DecisionDNA /></P>} />
    <Route path="/dna" element={<Navigate to="/analytics/decision-dna" replace />} />
    <Route path="/engine" element={<P><EscalationEngine /></P>} />
    <Route path="/governance" element={<P><EscalationEngine /></P>} />
    <Route path="/analytics/decision-benchmarking" element={<P><DecisionBenchmarking /></P>} />
    <Route path="/benchmarking" element={<Navigate to="/analytics/decision-benchmarking" replace />} />
    <Route path="/analytics/scenario-engine" element={<P><ScenarioEngine /></P>} />
    <Route path="/scenarios" element={<Navigate to="/analytics/scenario-engine" replace />} />
    <Route path="/executive" element={<P><ExecutiveHub /></P>} />
    <Route path="/settings" element={<P><SettingsPage /></P>} />
    <Route path="/admin/users" element={<P><AdminUsers /></P>} />
    <Route path="/audit-trail" element={<P><AuditTrail /></P>} />
    <Route path="/audit" element={<Navigate to="/audit-trail" replace />} />
    <Route path="/pilot" element={<P><PilotSettings /></P>} />
    <Route path="/feature-management" element={<P><PilotSettings /></P>} />
    <Route path="/calendar" element={<P><DecisionCalendar /></P>} />
    <Route path="/analytics/pattern-engine" element={<P><PatternEngine /></P>} />
    <Route path="/patterns" element={<Navigate to="/analytics/pattern-engine" replace />} />
    <Route path="/templates" element={<P><TemplateEditor /></P>} />
    <Route path="/template-editor" element={<P><TemplateEditor /></P>} />
    <Route path="/unified-timeline" element={<P><TimelinePage /></P>} />
    <Route path="/knowledge-base" element={<P><KnowledgeBase /></P>} />
    <Route path="/knowledge" element={<Navigate to="/knowledge-base" replace />} />
    <Route path="/automation-rules" element={<P><AutomationRules /></P>} />
    <Route path="/automations" element={<Navigate to="/automation-rules" replace />} />
    <Route path="/archive" element={<P><ArchivePage /></P>} />
    <Route path="/risks" element={<P><RiskRegister /></P>} />
    <Route path="/analytics/team-performance" element={<P><TeamPerformance /></P>} />
    <Route path="/team-performance" element={<Navigate to="/analytics/team-performance" replace />} />
    <Route path="/search" element={<P><GlobalSearch /></P>} />
    <Route path="/meeting" element={<P><MeetingMode /></P>} />
    <Route path="/process" element={<P><ProcessHub /></P>} />
    <Route path="/upgrade" element={<P><UpgradePage /></P>} />
    <Route path="/war-room" element={<P><WarRoom /></P>} />
    <Route path="/launch-checklist" element={<P><LaunchChecklist /></P>} />
    <Route path="/integrations" element={<P><IntegrationsPage /></P>} />
    <Route path="/docs/api" element={<P><ApiDocsPage /></P>} />
    <Route path="/internal-admin" element={<P><PlatformAdminGuard><InternalAdmin /></PlatformAdminGuard></P>} />
  </>
);

export const catchAllRoute = <Route path="*" element={<NotFound />} />;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TeamProvider } from "@/hooks/useTeamContext";
import { ThemeProvider } from "@/hooks/useTheme";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Decisions from "./pages/Decisions";
import Teams from "./pages/Teams";
import Analytics from "./pages/Analytics";
import Briefing from "./pages/Briefing";
import SettingsPage from "./pages/SettingsPage";
import DecisionGraph from "./pages/DecisionGraph";
import BottleneckIntelligence from "./pages/BottleneckIntelligence";
import OpportunityCostRadar from "./pages/OpportunityCostRadar";
import WarRoom from "./pages/WarRoom";
import PredictiveTimeline from "./pages/PredictiveTimeline";
import Strategy from "./pages/Strategy";
import FrictionMap from "./pages/FrictionMap";
import HealthHeatmap from "./pages/HealthHeatmap";
import DecisionDNA from "./pages/DecisionDNA";
import EscalationEngine from "./pages/EscalationEngine";
import DecisionBenchmarking from "./pages/DecisionBenchmarking";
import ScenarioEngine from "./pages/ScenarioEngine";
import ExecutiveDashboard from "./pages/ExecutiveDashboard";
import ResetPassword from "./pages/ResetPassword";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <TeamProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/decisions" element={<ProtectedRoute><Decisions /></ProtectedRoute>} />
              <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/briefing" element={<ProtectedRoute><Briefing /></ProtectedRoute>} />
              <Route path="/graph" element={<ProtectedRoute><DecisionGraph /></ProtectedRoute>} />
              <Route path="/bottlenecks" element={<ProtectedRoute><BottleneckIntelligence /></ProtectedRoute>} />
              <Route path="/costs" element={<ProtectedRoute><OpportunityCostRadar /></ProtectedRoute>} />
              <Route path="/warroom" element={<ProtectedRoute><WarRoom /></ProtectedRoute>} />
              <Route path="/timeline" element={<ProtectedRoute><PredictiveTimeline /></ProtectedRoute>} />
              <Route path="/strategy" element={<ProtectedRoute><Strategy /></ProtectedRoute>} />
              <Route path="/friction" element={<ProtectedRoute><FrictionMap /></ProtectedRoute>} />
              <Route path="/health" element={<ProtectedRoute><HealthHeatmap /></ProtectedRoute>} />
              <Route path="/dna" element={<ProtectedRoute><DecisionDNA /></ProtectedRoute>} />
              <Route path="/engine" element={<ProtectedRoute><EscalationEngine /></ProtectedRoute>} />
              <Route path="/benchmarking" element={<ProtectedRoute><DecisionBenchmarking /></ProtectedRoute>} />
              <Route path="/scenarios" element={<ProtectedRoute><ScenarioEngine /></ProtectedRoute>} />
              <Route path="/executive" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </TeamProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

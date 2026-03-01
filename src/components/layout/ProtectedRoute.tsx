import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import IndustrySelectionScreen from "@/components/onboarding/IndustrySelectionScreen";
import ComplianceOnboarding from "@/components/onboarding/ComplianceOnboarding";

const REGULATED_INDUSTRIES = ["pharma", "finanzen", "energie", "healthcare", "automotive", "versicherungen", "lebensmittel", "maschinenbau"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsIndustry, setNeedsIndustry] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfileChecked(true);
      return;
    }
    supabase
      .from("profiles")
      .select("industry, onboarding_completed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setNeedsIndustry(!data?.industry);
        setNeedsOnboarding(data?.industry ? !data?.onboarding_completed : false);
        setProfileChecked(true);
      });
  }, [user]);

  if (loading || !profileChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Redirect to /welcome if onboarding not completed (but not if already on /welcome)
  if (needsOnboarding && location.pathname !== "/welcome") {
    return <Navigate to="/welcome" replace />;
  }

  if (needsIndustry) {
    return (
      <IndustrySelectionScreen
        onComplete={(industryId) => {
          setSelectedIndustry(industryId);
          if (REGULATED_INDUSTRIES.includes(industryId)) {
            setShowCompliance(true);
          }
          setNeedsIndustry(false);
          // After industry selection, they still need onboarding
          setNeedsOnboarding(true);
        }}
      />
    );
  }

  if (showCompliance && selectedIndustry) {
    return (
      <ComplianceOnboarding
        industry={selectedIndustry}
        onComplete={() => setShowCompliance(false)}
        onSkip={() => setShowCompliance(false)}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

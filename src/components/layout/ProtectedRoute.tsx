import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import IndustrySelectionScreen from "@/components/onboarding/IndustrySelectionScreen";
import ComplianceOnboarding from "@/components/onboarding/ComplianceOnboarding";

const REGULATED_INDUSTRIES = ["pharma", "finanzen", "energie", "healthcare", "automotive", "versicherungen", "lebensmittel", "maschinenbau"];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [industryChecked, setIndustryChecked] = useState(false);
  const [needsIndustry, setNeedsIndustry] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIndustryChecked(true);
      return;
    }
    supabase
      .from("profiles")
      .select("industry")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setNeedsIndustry(!data?.industry);
        setIndustryChecked(true);
      });
  }, [user]);

  if (loading || !industryChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (needsIndustry) {
    return (
      <IndustrySelectionScreen
        onComplete={(industryId) => {
          setSelectedIndustry(industryId);
          // Show compliance step for regulated industries
          if (REGULATED_INDUSTRIES.includes(industryId)) {
            setShowCompliance(true);
          }
          setNeedsIndustry(false);
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

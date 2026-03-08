import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfileChecked(true);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setNeedsOnboarding(!data?.onboarding_completed);
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

  // Redirect to pain onboarding first, then /welcome
  const onboardingPaths = ["/welcome", "/onboarding/pain"];
  if (needsOnboarding && !onboardingPaths.includes(location.pathname)) {
    // Check if pain onboarding is already done
    const painDone = localStorage.getItem("pain_hourly_rate");
    if (!painDone) {
      return <Navigate to="/onboarding/pain" replace />;
    }
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

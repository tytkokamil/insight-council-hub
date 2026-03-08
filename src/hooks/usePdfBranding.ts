import { useFreemiumLimits } from "@/hooks/useFreemiumLimits";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { PdfBrandingOptions } from "@/lib/pdfBranding";

/**
 * Returns PdfBrandingOptions based on plan + user settings.
 * 
 * Free: always branded (prominent, non-removable)
 * Starter/Professional: branded by default, toggle in settings
 * Enterprise: fully removable
 */
export const usePdfBranding = (): PdfBrandingOptions => {
  const { plan, isFree } = useFreemiumLimits();
  const { user } = useAuth();

  const { data: brandingDisabled } = useQuery({
    queryKey: ["branding-setting", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("profiles")
        .select("hide_pdf_branding")
        .eq("user_id", user.id)
        .single();
      return (data as any)?.hide_pdf_branding ?? false;
    },
    enabled: !!user && !isFree,
    staleTime: 5 * 60_000,
  });

  // Free plan: always show branding
  if (isFree) return { showBranding: true };

  // Starter/Professional: respect setting
  if (plan === "starter" || plan === "professional" || plan === "business") {
    return { showBranding: !brandingDisabled };
  }

  // Enterprise: respect setting (default off)
  if (plan === "enterprise") {
    return { showBranding: !brandingDisabled };
  }

  return { showBranding: true };
};

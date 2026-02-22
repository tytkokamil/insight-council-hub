import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export async function exportAllDataAsJSON() {
  const [decisions, tasks, deps, reviews, auditLogs, comments, teams, profiles] = await Promise.all([
    supabase.from("decisions").select("*").order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
    supabase.from("decision_dependencies").select("*"),
    supabase.from("decision_reviews").select("*"),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }),
    supabase.from("comments").select("*").order("created_at", { ascending: false }),
    supabase.from("teams").select("*"),
    supabase.from("profiles").select("user_id, full_name"),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    decisions: decisions.data || [],
    tasks: tasks.data || [],
    dependencies: deps.data || [],
    reviews: reviews.data || [],
    audit_logs: auditLogs.data || [],
    comments: comments.data || [],
    teams: teams.data || [],
    profiles: profiles.data || [],
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `decivio-export-${format(new Date(), "yyyy-MM-dd", { locale: de })}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

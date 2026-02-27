/**
 * Shared query functions used by both hooks and prefetch logic.
 * Single source of truth – no more duplicated fetch logic.
 */
import { supabase } from "@/integrations/supabase/client";

export const fetchDecisions = async (selectedTeamId: string | null) => {
  let query = supabase
    .from("decisions")
    .select("*")
    .order("created_at", { ascending: false });

  if (selectedTeamId) {
    query = query.eq("team_id", selectedTeamId);
  } else {
    query = query.is("team_id", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

export const fetchTeams = async () => {
  const { data, error } = await supabase.from("teams").select("*");
  if (error) throw error;
  return data ?? [];
};

export const fetchProfiles = async () => {
  const { data, error } = await supabase.from("profiles").select("user_id, full_name");
  if (error) throw error;
  return data ?? [];
};

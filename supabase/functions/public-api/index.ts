import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateApiKey } from "../_shared/api-key-auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Authenticate via API key
    const authHeader = req.headers.get("Authorization");
    const auth = await authenticateApiKey(authHeader);
    if (!auth) {
      return json({ error: "Unauthorized. Provide a valid API key as Bearer token." }, 401);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const url = new URL(req.url);
    
    // Parse path: /api/decisions, /api/decisions/:id, /api/decisions/:id/cod
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Edge function path is /api/... so pathParts could be ["api", "decisions", ...]
    // or just ["decisions", ...] depending on routing
    const resourceIndex = pathParts.findIndex(p => p === "decisions");
    
    if (resourceIndex === -1) {
      return json({ error: "Unknown endpoint. Available: /api/decisions" }, 404);
    }

    const decisionId = pathParts[resourceIndex + 1] || null;
    const subResource = pathParts[resourceIndex + 2] || null;

    switch (req.method) {
      // ─── GET /api/decisions ────────────────────
      case "GET": {
        if (decisionId && subResource === "cod") {
          // GET /api/decisions/:id/cod
          const { data: decision, error } = await supabase
            .from("decisions")
            .select("id, title, cost_per_day, created_at, status")
            .eq("id", decisionId)
            .eq("org_id", auth.org_id)
            .is("deleted_at", null)
            .single();

          if (error || !decision) return json({ error: "Decision not found" }, 404);

          const daysOpen = Math.floor((Date.now() - new Date(decision.created_at).getTime()) / 86400000);
          const totalCod = (decision.cost_per_day || 0) * daysOpen;

          return json({
            decision_id: decision.id,
            title: decision.title,
            status: decision.status,
            cost_per_day: decision.cost_per_day || 0,
            days_open: daysOpen,
            total_cost_of_delay: totalCod,
            currency: "EUR",
          });
        }

        if (decisionId) {
          // GET /api/decisions/:id
          const { data: decision, error } = await supabase
            .from("decisions")
            .select("id, title, description, status, priority, category, due_date, cost_per_day, ai_risk_score, ai_impact_score, created_at, updated_at, implemented_at")
            .eq("id", decisionId)
            .eq("org_id", auth.org_id)
            .eq("confidential", false)
            .is("deleted_at", null)
            .single();

          if (error || !decision) return json({ error: "Decision not found" }, 404);
          return json({ decision });
        }

        // GET /api/decisions (list)
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const status = url.searchParams.get("status");

        let query = supabase
          .from("decisions")
          .select("id, title, status, priority, category, due_date, cost_per_day, ai_risk_score, created_at, updated_at", { count: "exact" })
          .eq("org_id", auth.org_id)
          .eq("confidential", false)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) query = query.eq("status", status);

        const { data: decisions, count, error } = await query;
        if (error) return json({ error: error.message }, 500);

        return json({
          decisions: decisions || [],
          total: count || 0,
          limit,
          offset,
        });
      }

      // ─── POST /api/decisions ───────────────────
      case "POST": {
        if (decisionId) return json({ error: "POST not allowed on specific decision" }, 405);

        const body = await req.json();
        const { title, description, category, priority, due_date } = body;

        if (!title || typeof title !== "string" || title.trim().length === 0) {
          return json({ error: "title is required (string, non-empty)" }, 400);
        }
        if (title.length > 500) return json({ error: "title too long (max 500 chars)" }, 400);
        if (description && typeof description !== "string") return json({ error: "description must be a string" }, 400);
        if (description && description.length > 5000) return json({ error: "description too long (max 5000 chars)" }, 400);

        const validStatuses = ["draft", "proposed"];
        const validPriorities = ["low", "medium", "high", "critical"];
        const validCategories = ["strategic", "operational", "financial", "technical", "hr", "legal", "compliance"];

        const insertData: Record<string, any> = {
          title: title.trim(),
          description: description?.trim() || null,
          created_by: auth.user_id,
          owner_id: auth.user_id,
          org_id: auth.org_id,
          status: "draft",
          priority: validPriorities.includes(priority) ? priority : "medium",
        };

        if (category && validCategories.includes(category)) insertData.category = category;
        if (due_date) {
          const d = new Date(due_date);
          if (!isNaN(d.getTime())) insertData.due_date = d.toISOString().split("T")[0];
        }

        const { data: newDecision, error } = await supabase
          .from("decisions")
          .insert(insertData)
          .select("id, title, status, priority, category, created_at")
          .single();

        if (error) return json({ error: error.message }, 500);
        return json({ decision: newDecision }, 201);
      }

      // ─── PATCH /api/decisions/:id ──────────────
      case "PATCH": {
        if (!decisionId) return json({ error: "Decision ID required for PATCH" }, 400);

        const body = await req.json();
        const updates: Record<string, any> = {};

        if (body.status) {
          const validStatuses = ["draft", "proposed", "review", "approved", "rejected", "implemented", "archived", "cancelled"];
          if (!validStatuses.includes(body.status)) return json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, 400);
          updates.status = body.status;
          if (body.status === "implemented") updates.implemented_at = new Date().toISOString();
        }

        if (body.priority) {
          const validPriorities = ["low", "medium", "high", "critical"];
          if (!validPriorities.includes(body.priority)) return json({ error: "Invalid priority" }, 400);
          updates.priority = body.priority;
        }

        if (body.title && typeof body.title === "string") updates.title = body.title.trim().substring(0, 500);
        if (body.description !== undefined) updates.description = typeof body.description === "string" ? body.description.trim().substring(0, 5000) : null;

        if (Object.keys(updates).length === 0) return json({ error: "No valid fields to update" }, 400);

        const { data: updated, error } = await supabase
          .from("decisions")
          .update(updates)
          .eq("id", decisionId)
          .eq("org_id", auth.org_id)
          .eq("confidential", false)
          .is("deleted_at", null)
          .select("id, title, status, priority, updated_at")
          .single();

        if (error || !updated) return json({ error: "Decision not found or update failed" }, 404);
        return json({ decision: updated });
      }

      default:
        return json({ error: `Method ${req.method} not allowed` }, 405);
    }
  } catch (error) {
    console.error("public-api error:", error);
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

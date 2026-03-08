import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    const { org_id } = await req.json().catch(() => ({}));

    // Get decisions without summaries
    let query = supabase
      .from("decisions")
      .select("id, title, description, status, priority, due_date, cost_per_day")
      .is("ai_summary", null)
      .not("description", "is", null)
      .is("deleted_at", null)
      .limit(20);

    if (org_id) {
      query = query.eq("org_id", org_id);
    }

    const { data: decisions, error } = await query;
    if (error) throw error;
    if (!decisions || decisions.length === 0) {
      return new Response(JSON.stringify({ generated: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let generated = 0;

    for (const decision of decisions) {
      if (!decision.description || decision.description.length < 20) continue;

      try {
        // Use Lovable AI proxy
        const prompt = `Fasse diese Entscheidung in EINEM deutschen Satz zusammen. Maximal 15 Worte. Kein 'Es geht um' oder 'Die Entscheidung betrifft'. Direkt und konkret.\nTitel: ${decision.title}\nBeschreibung: ${decision.description.substring(0, 300)}\nAntworte NUR mit dem einen Satz, ohne Anführungszeichen.`;

        const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-proxy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 80,
          }),
        });

        if (!aiResponse.ok) {
          console.error(`AI proxy error for ${decision.id}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        const summary = aiData?.choices?.[0]?.message?.content?.trim() ||
                        aiData?.content?.[0]?.text?.trim() ||
                        aiData?.text?.trim();

        if (summary && summary.length > 5 && summary.length < 200) {
          await supabase
            .from("decisions")
            .update({
              ai_summary: summary,
              ai_summary_generated_at: new Date().toISOString(),
            })
            .eq("id", decision.id);
          generated++;
        }
      } catch (err) {
        console.error(`Failed to generate summary for ${decision.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ generated, total: decisions.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-summaries error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

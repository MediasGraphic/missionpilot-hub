import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Mode "generate" = structured planning output via tool calling
    if (mode === "generate") {
      const systemPrompt = `Tu es un expert en gestion de projet d'études et concertation publique.
L'utilisateur te décrit son projet. Tu dois générer un planning structuré avec des phases et des tâches.
Utilise la fonction generate_planning pour retourner le résultat.
Règles :
- Chaque phase contient des tâches séquentielles.
- Les durées sont en jours ouvrés.
- Inclus des livrables clés quand pertinent.
- Sois réaliste sur les durées.
- Réponds en français.`;

      const response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "generate_planning",
                  description: "Génère un planning structuré avec phases et tâches",
                  parameters: {
                    type: "object",
                    properties: {
                      summary: {
                        type: "string",
                        description: "Résumé court du planning proposé (1-2 phrases)",
                      },
                      phases: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string", description: "Nom de la phase" },
                            tasks: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  name: { type: "string", description: "Nom de la tâche" },
                                  duration: { type: "number", description: "Durée en jours ouvrés" },
                                  deliverable: { type: "string", description: "Livrable associé (optionnel)" },
                                },
                                required: ["name", "duration"],
                                additionalProperties: false,
                              },
                            },
                          },
                          required: ["name", "tasks"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["summary", "phases"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "generate_planning" } },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required" }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "No structured response from AI" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const planning = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(planning), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default mode: streaming text advice
    const systemPrompt = `Tu es un assistant IA expert en gestion de projet d'études et concertation publique.
Tu analyses les plannings, les contraintes et les risques pour proposer des ajustements concrets.

Règles :
- Tu PROPOSES des modifications, tu ne les appliques JAMAIS directement.
- Chaque proposition doit inclure : le changement suggéré, l'impact estimé, le niveau de risque (faible/moyen/élevé).
- Tu dois raisonner sur les dépendances entre tâches, les charges ressources et les échéances contractuelles.
- Sois concis, structuré et pragmatique.
- Réponds en français.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("adaptive-planning error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un expert en analyse de changements pour des missions d'études, concertation et communication publique.

On te fournit :
1. Un NOUVEAU DOCUMENT (email client, CR, nouvelle version CCTP, note de cadrage, etc.)
2. Les EXIGENCES EXISTANTES du projet (requirements)

Tu dois :
1. Comparer le nouveau document aux exigences existantes
2. Identifier les CHANGEMENTS : nouveau livrable, délai modifié, périmètre élargi, nouvelle zone géographique, nouvelle cible, nouvelle contrainte réglementaire, budget modifié
3. Pour chaque changement, créer un "ChangeRequest" et proposer les "ChangeImpacts"
4. Proposer une mise à jour du planning en expliquant les deltas

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide sans markdown. Structure exacte :
{
  "change_requests": [
    {
      "title": "Titre court du changement",
      "description": "Description détaillée",
      "source": "Référence au passage du document source",
      "impacts": [
        {
          "impact_type": "délai|coût|ressource|livrable|risque",
          "description": "Description de l'impact",
          "severity": "faible|moyen|élevé|critique"
        }
      ],
      "planning_changes": [
        {
          "element": "Nom de la tâche/phase/livrable impacté",
          "element_type": "phase|task|deliverable",
          "change_description": "Ce qui change",
          "before": "État avant (dates, durée, etc.)",
          "after": "État proposé après",
          "delta_days": 0,
          "dependencies_affected": ["Liste des dépendances impactées"]
        }
      ]
    }
  ],
  "summary": "Résumé global des changements détectés",
  "risk_assessment": "faible|moyen|élevé|critique"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { newDocument, existingRequirements } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `## NOUVEAU DOCUMENT :
${newDocument.name ? `### ${newDocument.name}\n` : ""}${newDocument.content}

## EXIGENCES EXISTANTES DU PROJET :
${existingRequirements && existingRequirements.length > 0
  ? existingRequirements.map((r: any, i: number) =>
      `${i + 1}. [${r.category || "N/A"}] ${r.title} — ${r.description || ""} ${r.due_date ? `(échéance: ${r.due_date})` : ""}`
    ).join("\n")
  : "Aucune exigence existante. Identifie les éléments qui constitueraient de nouvelles exigences."}

Analyse ce document et identifie tous les changements par rapport aux exigences existantes.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";

    let jsonContent = rawContent.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error("Failed to parse AI response:", jsonContent);
      parsed = { change_requests: [], summary: "Erreur de parsing", risk_assessment: "moyen" };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-changes error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

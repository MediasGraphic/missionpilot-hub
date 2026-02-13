import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un assistant expert en pilotage de missions d'études, concertation et communication publique.

À partir des sources fournies (documents, textes, comptes-rendus, emails), tu dois extraire et structurer :

1. **EXIGENCES** : Liste d'exigences structurées avec :
   - title: titre court
   - category: une parmi (Technique, Organisationnelle, Réglementaire, Calendaire, Budgétaire, Qualité, Communication)
   - priority: haute/moyenne/basse
   - description: description détaillée
   - due_date: date contrainte si mentionnée (format YYYY-MM-DD) ou null
   - deliverable: livrable attendu associé ou null
   - source_ref: référence au document/passage source
   - confidence: faible/moyen/fort

2. **PLANNING** : Proposition de phases, tâches et livrables selon le template choisi :
   - phases: liste de phases avec name, start_offset_weeks, duration_weeks, tasks[]
   - Chaque task: name, duration_days, deliverable (nom du livrable associé ou null)
   - source_ref et confidence pour chaque élément

3. **KPI** : Indicateurs de pilotage adaptés au projet :
   - name: nom du KPI
   - definition: ce que mesure l'indicateur
   - formula: formule de calcul
   - target: valeur cible suggérée
   - frequency: fréquence de mesure
   - source_ref: justification
   - confidence: faible/moyen/fort

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans markdown, sans backticks. Le JSON doit avoir exactement cette structure :
{
  "requirements": [...],
  "planning": { "phases": [...] },
  "kpis": [...]
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sources, template } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const templateDescriptions: Record<string, string> = {
      "etude-enquete": "Étude + enquête terrain : phases Cadrage → Diagnostic → Enquête terrain → Analyse → Restitution",
      "concertation-multi": "Concertation publique multi-événements : Préparation → Information → Concertation (ateliers, réunions publiques, permanences) → Synthèse → Bilan",
      "communication-multicanal": "Communication multicanal : Stratégie → Création contenus → Déploiement (print, digital, événementiel) → Évaluation",
      "mixte": "Mixte (étude + concertation + comm) : Cadrage → Diagnostic/Étude → Concertation → Communication → Synthèse → Restitution finale",
    };

    const userPrompt = `## Sources fournies :
${sources.map((s: { name: string; content: string }, i: number) => `### Source ${i + 1} : ${s.name}\n${s.content}`).join("\n\n")}

## Template de planning choisi : ${templateDescriptions[template] || template}

Analyse ces sources et produis le JSON structuré demandé.`;

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
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du service IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "{}";

    // Clean potential markdown fences
    let jsonContent = rawContent.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error("Failed to parse AI response:", jsonContent);
      parsed = { requirements: [], planning: { phases: [] }, kpis: [], raw: jsonContent };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

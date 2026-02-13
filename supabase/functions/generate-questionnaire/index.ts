import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es un concepteur expert en formulaires et questionnaires de concertation publique.

À partir d'une description en langage naturel, tu dois générer un questionnaire structuré COMPLET.

Tu dois TOUJOURS générer :
1. Un **titre** court et clair pour le questionnaire (max 80 caractères)
2. Une **description** d'introduction qui sera affichée en début de formulaire (2-4 phrases max, contexte + anonymat + durée estimée si pertinent). Cette description ne doit PAS reprendre le prompt brut de l'utilisateur.
3. Des **sections** logiques regroupant les questions
4. Des **questions** variées avec les bons types de champs

Structure JSON attendue :
{
  "title": "Titre suggéré du questionnaire",
  "description": "Description d'introduction pour le répondant...",
  "sections": [
    { "id": "s1", "title": "Nom de la section", "description": "Description optionnelle" }
  ],
  "questions": [
    {
      "id": "q1",
      "sectionId": "s1",
      "type": "text|long_text|single_choice|multiple_choice|dropdown|scale|date|consent",
      "label": "Intitulé de la question",
      "description": "Sous-titre optionnel",
      "required": true,
      "options": [{ "id": "o1", "label": "Option 1" }],
      "scaleMin": 1,
      "scaleMax": 5,
      "conditionalOn": { "questionId": "q1", "value": "Oui" }
    }
  ]
}

Règles :
- Formulation simple, accessible au grand public
- Varier les types de questions (pas que du texte)
- Inclure un consentement RGPD en fin de questionnaire
- Les IDs doivent être uniques (s1, s2... pour sections, q1, q2... pour questions, o1, o2... pour options)
- Inclure "Ne sait pas" quand pertinent dans les options
- IMPORTANT : Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans backticks.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Le champ 'prompt' est requis." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans quelques instants." }), {
          status: 429,
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

    let jsonContent = rawContent.trim();
    if (jsonContent.startsWith("```")) {
      jsonContent = jsonContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      console.error("Failed to parse AI response:", jsonContent);
      parsed = { title: "Questionnaire généré", description: "", sections: [], questions: [], raw: jsonContent };
    }

    // Ensure required fields exist
    if (!parsed.title) parsed.title = "Questionnaire généré par IA";
    if (!parsed.description) parsed.description = "";
    if (!parsed.sections) parsed.sections = [];
    if (!parsed.questions) parsed.questions = [];

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-questionnaire error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

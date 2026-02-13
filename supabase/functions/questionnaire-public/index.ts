import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  // Expected: /questionnaire-public?token=xxx&action=get|submit|verify-pin
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action") || "get";

  if (!token) {
    return json({ success: false, error: "Token manquant" }, 400);
  }

  // Fetch share + questionnaire
  const { data: share, error: shareErr } = await supabase
    .from("questionnaire_shares")
    .select("*, questionnaires(*)")
    .eq("token", token)
    .single();

  if (shareErr || !share) {
    return json({ success: false, error: "Lien invalide ou expiré" }, 404);
  }

  const questionnaire = (share as any).questionnaires;
  if (!questionnaire || questionnaire.status === "draft") {
    return json({ success: false, error: "Ce questionnaire n'est pas encore publié" }, 403);
  }

  if (questionnaire.status === "closed") {
    return json({ success: false, error: "Ce questionnaire est fermé, les réponses ne sont plus acceptées" }, 403);
  }

  // Check time window
  const now = new Date();
  if (share.starts_at && new Date(share.starts_at) > now) {
    return json({ success: false, error: "Ce questionnaire n'est pas encore ouvert" }, 403);
  }
  if (share.ends_at && new Date(share.ends_at) < now) {
    return json({ success: false, error: "La période de collecte est terminée" }, 403);
  }

  // Check max responses
  if (share.max_responses) {
    const { count } = await supabase
      .from("questionnaire_responses")
      .select("id", { count: "exact", head: true })
      .eq("share_id", share.id);
    if ((count || 0) >= share.max_responses) {
      return json({ success: false, error: "Le nombre maximum de réponses a été atteint" }, 403);
    }
  }

  // GET - return questionnaire data
  if (req.method === "GET" && action === "get") {
    // If pin mode and no pin provided, signal pin required
    if (share.access_mode === "pin") {
      return json({
        success: true,
        data: {
          requiresPin: true,
          title: questionnaire.title,
          shareType: share.share_type,
        },
      });
    }

    return json({
      success: true,
      data: {
        requiresPin: false,
        id: questionnaire.id,
        title: questionnaire.title,
        description: questionnaire.description,
        sections: questionnaire.sections_json,
        questions: questionnaire.questions_json,
        collectIdentity: questionnaire.collect_identity,
        shareType: share.share_type,
      },
    });
  }

  // POST - verify pin
  if (req.method === "POST" && action === "verify-pin") {
    const body = await req.json();
    if (share.pin_code && body.pin === share.pin_code) {
      return json({
        success: true,
        data: {
          requiresPin: false,
          id: questionnaire.id,
          title: questionnaire.title,
          description: questionnaire.description,
          sections: questionnaire.sections_json,
          questions: questionnaire.questions_json,
          collectIdentity: questionnaire.collect_identity,
          shareType: share.share_type,
        },
      });
    }
    return json({ success: false, error: "Code PIN incorrect" }, 403);
  }

  // POST - submit response
  if (req.method === "POST" && action === "submit") {
    if (share.share_type === "preview") {
      return json({ success: false, error: "Ce lien est en mode aperçu uniquement" }, 403);
    }

    const body = await req.json();

    // Check restricted access
    if (share.access_mode === "restricted") {
      if (!body.email) {
        return json({ success: false, error: "Email requis pour ce questionnaire" }, 400);
      }
      const { data: invite } = await supabase
        .from("share_invites")
        .select("id")
        .eq("share_id", share.id)
        .eq("email", body.email.toLowerCase())
        .single();
      if (!invite) {
        return json({ success: false, error: "Vous n'êtes pas autorisé à répondre à ce questionnaire" }, 403);
      }
    }

    // Check one per device
    if (share.one_per_device && body.deviceHash) {
      const { data: existing } = await supabase
        .from("questionnaire_responses")
        .select("id")
        .eq("share_id", share.id)
        .eq("device_hash", body.deviceHash)
        .single();
      if (existing) {
        return json({ success: false, error: "Vous avez déjà répondu à ce questionnaire" }, 403);
      }
    }

    const { error: insertErr } = await supabase
      .from("questionnaire_responses")
      .insert({
        questionnaire_id: questionnaire.id,
        share_id: share.id,
        answers_json: body.answers || {},
        device_hash: body.deviceHash || null,
        respondent_email: body.email || null,
        completion_rate: body.completionRate || 100,
      });

    if (insertErr) {
      return json({ success: false, error: "Erreur lors de l'enregistrement" }, 500);
    }

    return json({ success: true, data: { message: "Réponse enregistrée avec succès !" } });
  }

  return json({ success: false, error: "Action non reconnue" }, 400);
});

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type Payload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const DEFAULT_FROM = Deno.env.get("EMAIL_FROM") || "onboarding@resend.dev";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true }, 200);

  try {
    if (req.method !== "POST") return json({ error: "Use POST" }, 405);
    if (!RESEND_API_KEY) return json({ error: "Missing RESEND_API_KEY" }, 500);

    // Note: verify_jwt est désactivé dans config.toml pour cette fonction
    // car supabase.functions.invoke() n'inclut pas toujours le token correctement.
    // Pour sécuriser cette fonction en production, vous pouvez :
    // 1. Utiliser une clé API secrète dans le payload
    // 2. Réactiver verify_jwt et s'assurer que le token est bien inclus dans les requêtes

    const payload = (await req.json()) as Payload;

    if (!payload?.to || !payload?.subject) {
      return json({ error: "`to` and `subject` are required" }, 400);
    }
    if (!payload.html && !payload.text) {
      return json({ error: "Provide `html` or `text`" }, 400);
    }

    // Utiliser onboarding@resend.dev pour les tests (domaine de test de Resend)
    // Si EMAIL_FROM est configuré et valide, on l'utilise, sinon on force onboarding@resend.dev
    let from = payload.from ?? DEFAULT_FROM;
    
    // S'assurer qu'on utilise onboarding@resend.dev si le domaine n'est pas vérifié
    if (from.includes('ton-domaine.com') || (!from.includes('@resend.dev') && !payload.from)) {
      from = "onboarding@resend.dev";
      console.log("Using default test sender: onboarding@resend.dev");
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("Resend API error:", {
        status: resp.status,
        statusText: resp.statusText,
        data,
        from,
        to: payload.to,
      });
      return json(
        { 
          error: "Resend error", 
          details: data,
          message: data.message || data.error?.message || `HTTP ${resp.status}`,
          status: resp.status 
        },
        502,
      );
    }

    return json({ ok: true, result: data }, 200);
  } catch (e) {
    return json({ error: "Unhandled error", message: String(e) }, 500);
  }
});

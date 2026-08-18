import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InvitationRequest = {
  organizationId: string;
  email: string;
  roleKey: "admin" | "program_manager" | "teacher" | "supervisor" | "student";
  programId?: string;
  cohortId?: string;
  expiresInDays?: number;
  locale?: "fr" | "en";
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);

    const input = (await request.json()) as InvitationRequest;
    if (!input.organizationId || !/^\S+@\S+\.\S+$/.test(input.email || "")) {
      return json({ error: "Invalid invitation request" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });

    const { data, error } = await userClient.rpc("create_organization_invitation", {
      target_organization_id: input.organizationId,
      target_email: input.email.trim().toLowerCase(),
      target_role_key: input.roleKey,
      target_program_id: input.programId || null,
      target_cohort_id: input.cohortId || null,
      expires_in_days: Math.min(30, Math.max(1, Number(input.expiresInDays || 14))),
    });
    if (error) return json({ error: error.message }, 403);

    const payload = (data || {}) as Record<string, unknown>;
    const token = String(payload.token || payload.invitation_token || "");
    const siteUrl = (Deno.env.get("SITE_URL") || "http://localhost:3000").replace(/\/$/, "");
    const locale = input.locale === "en" ? "en" : "fr";
    const invitationUrl = `${siteUrl}/${locale}/invite/${encodeURIComponent(token)}`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const sender = Deno.env.get("INVITATION_FROM_EMAIL") || "Practicora <noreply@practicora.app>";
    let delivered = false;
    let deliveryError = "";

    if (resendKey) {
      const french = locale === "fr";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [input.email],
          subject: french ? "Invitation à rejoindre Practicora" : "Invitation to join Practicora",
          html: emailTemplate({ french, invitationUrl, roleKey: input.roleKey }),
        }),
      });
      delivered = response.ok;
      if (!response.ok) deliveryError = await response.text();
    }

    return json({
      ...payload,
      token,
      invitation_url: invitationUrl,
      delivered,
      delivery_error: deliveryError || null,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

function emailTemplate({ french, invitationUrl, roleKey }: { french: boolean; invitationUrl: string; roleKey: string }) {
  const title = french ? "Vous êtes invité·e sur Practicora" : "You are invited to Practicora";
  const intro = french
    ? `Une organisation vous a attribué le rôle « ${roleKey} ». Votre rôle sera reconnu automatiquement après connexion avec cette adresse courriel.`
    : `An organization assigned you the “${roleKey}” role. Your role will be resolved automatically after signing in with this email address.`;
  const action = french ? "Accepter l’invitation" : "Accept invitation";
  const note = french
    ? "Le lien est personnel et expire automatiquement. Ne le transférez pas."
    : "This link is personal and expires automatically. Do not forward it.";
  return `<!doctype html><html><body style="margin:0;background:#f3f7fa;font-family:Arial,sans-serif;color:#172432"><div style="max-width:580px;margin:0 auto;padding:32px 16px"><div style="background:#fff;border:1px solid #d8e2ea;border-radius:18px;padding:30px"><div style="font-weight:800;color:#2f6f9f">Practicora</div><h1 style="font-size:24px;margin:18px 0 10px">${title}</h1><p style="font-size:15px;line-height:1.7;color:#536273">${intro}</p><p style="margin:26px 0"><a href="${invitationUrl}" style="display:inline-block;background:#2f6f9f;color:#fff;text-decoration:none;font-weight:700;padding:13px 18px;border-radius:10px">${action}</a></p><p style="font-size:12px;line-height:1.6;color:#788594">${note}</p></div></div></body></html>`;
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

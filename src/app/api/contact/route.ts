import { NextResponse } from "next/server";

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const message = String(body?.message || "").trim();
  if (name.length < 2 || !EMAIL_PATTERN.test(email) || message.length < 20) {
    return NextResponse.json({ ok: false, code: "invalid_payload" }, { status: 400 });
  }

  const endpoint = process.env.CONTACT_FORM_ENDPOINT;
  if (!endpoint) {
    return NextResponse.json({ ok: false, code: "contact_endpoint_not_configured" }, { status: 503 });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name,
      email,
      organization: String(body?.organization || "").trim(),
      topic: String(body?.topic || "product"),
      message,
      source: "practicora-contact",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, code: "delivery_failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

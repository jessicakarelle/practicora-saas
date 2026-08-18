"use client";

import { useState } from "react";
import { Building2, Mail, MapPin, MessageSquareText, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { translate as t } from "@/i18n";

export function ContactExperience({ locale, contactEmail }: { locale: string; contactEmail: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [topic, setTopic] = useState("product");
  const mapUrl = process.env.NEXT_PUBLIC_CONTACT_MAP_EMBED_URL || "https://www.openstreetmap.org/export/embed.html?bbox=-79.8%2C44.8%2C-70.0%2C49.0&layer=mapnik";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setStatus(response.ok ? "sent" : "error");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
      <Card>
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <MessageSquareText className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-extrabold">{t(locale, "marketing.contact.form_title")}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-strong">{t(locale, "marketing.contact.form_description")}</p>
          </div>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>{t(locale, "marketing.contact.full_name")}</FieldLabel>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <Input name="name" required className="ps-10" />
                </div>
              </div>
              <div>
                <FieldLabel>{t(locale, "marketing.contact.email")}</FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <Input name="email" type="email" required className="ps-10" />
                </div>
              </div>
            </div>
            <div>
              <FieldLabel>{t(locale, "marketing.contact.organization")}</FieldLabel>
              <div className="relative">
                <Building2 className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input name="organization" className="ps-10" />
              </div>
            </div>
            <div>
              <FieldLabel>{t(locale, "marketing.contact.topic")}</FieldLabel>
              <Select
                value={topic}
                onValueChange={setTopic}
                options={[
                  { value: "product", label: t(locale, "marketing.contact.topic_product") },
                  { value: "institution", label: t(locale, "marketing.contact.topic_institution") },
                  { value: "support", label: t(locale, "marketing.contact.topic_support") },
                  { value: "partnership", label: t(locale, "marketing.contact.topic_partnership") },
                ]}
              />
              <input type="hidden" name="topic" value={topic} />
            </div>
            <div>
              <FieldLabel>{t(locale, "marketing.contact.message")}</FieldLabel>
              <Textarea name="message" required minLength={20} rows={7} />
            </div>
            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted">{t(locale, "marketing.contact.privacy_notice")}</p>
              <Button type="submit" disabled={status === "sending"}>
                <Send className="size-4" />
                {status === "sending" ? t(locale, "marketing.contact.sending") : t(locale, "marketing.contact.send_message")}
              </Button>
            </div>
            {status === "sent" ? <p className="rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">{t(locale, "marketing.contact.sent")}</p> : null}
            {status === "error" ? (
              <p className="rounded-xl bg-warning/10 px-4 py-3 text-sm text-warning">
                {t(locale, "marketing.contact.send_error")} <a className="font-bold underline" href={`mailto:${contactEmail}`}>{contactEmail}</a>
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="relative h-64 bg-surface-muted">
            <iframe
              src={mapUrl}
              title={t(locale, "marketing.contact.map_title")}
              className="absolute inset-0 size-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <MapPin className="size-5" />
              </span>
              <div>
                <h2 className="font-extrabold">{t(locale, "marketing.contact.location_title")}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-strong">{t(locale, "marketing.contact.location_description")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <h2 className="font-extrabold">{t(locale, "marketing.contact.direct_contact")}</h2>
            <a href={`mailto:${contactEmail}`} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-strong">
              <Mail className="size-4" />{contactEmail}
            </a>
            <p className="mt-3 text-xs leading-5 text-muted">{t(locale, "marketing.contact.response_time")}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

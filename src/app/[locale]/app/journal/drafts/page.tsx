"use client";

import { use, useEffect, useMemo, useState } from "react";
import { CalendarClock, FilePenLine, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { localeTag, translate as t } from "@/i18n";
import { deleteJournalDraft, listJournalDrafts, type JournalDraft } from "@/lib/journal-drafts";

export default function DraftsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const dialog = useDialog();
  const [drafts, setDrafts] = useState<JournalDraft[]>([]);

  useEffect(() => setDrafts(listJournalDrafts()), []);

  const formatter = useMemo(
    () => new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "medium", timeStyle: "short" }),
    [locale],
  );

  async function remove(draft: JournalDraft) {
    const accepted = await dialog.confirm({
      title: t(locale, "app.drafts.delete_title"),
      description: t(locale, "app.drafts.delete_description"),
      confirmLabel: t(locale, "app.drafts.delete"),
      cancelLabel: t(locale, "app.drafts.cancel"),
      tone: "danger",
    });
    if (!accepted) return;
    await deleteJournalDraft(draft.id);
    setDrafts(listJournalDrafts());
  }

  return (
    <>
      <PageHeader
        title={t(locale, "app.drafts.title")}
        description={t(locale, "app.drafts.description")}
        actions={<ButtonLink href={`/${locale}/app/journal/new`}><Plus className="size-4" />{t(locale, "app.drafts.new")}</ButtonLink>}
      />

      {drafts.length ? (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {drafts.map((draft) => {
            const values = draft.values;
            const date = typeof values.date === "string" ? values.date : "";
            const project = typeof values.project === "string" ? values.project.trim() : "";
            const workDone = typeof values.workDone === "string" ? values.workDone.trim() : "";
            const attachmentCount = Array.isArray(values.attachments) ? values.attachments.length : 0;
            return (
              <Card key={draft.id} className="overflow-hidden">
                <CardContent className="flex h-full flex-col">
                  <div className="flex items-start gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><FilePenLine className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-extrabold text-foreground">{project || t(locale, "app.drafts.untitled")}</h2>
                      <p className="mt-1 text-xs text-muted">{formatter.format(new Date(draft.updatedAt))}</p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 min-h-15 text-sm leading-5 text-muted-strong">{workDone || t(locale, "app.drafts.empty_summary")}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted">
                    {date ? <span className="rounded-full bg-surface-muted px-2.5 py-1">{date}</span> : null}
                    {attachmentCount ? <span className="rounded-full bg-surface-muted px-2.5 py-1">{t(locale, "app.drafts.attachments", { count: attachmentCount })}</span> : null}
                  </div>
                  <div className="mt-auto flex items-center justify-end gap-2 pt-5">
                    <Button type="button" variant="ghost" size="sm" onClick={() => void remove(draft)} aria-label={t(locale, "app.drafts.delete")}><Trash2 className="size-4 text-danger" /></Button>
                    <ButtonLink href={`/${locale}/app/journal/new?draft=${encodeURIComponent(draft.id)}`} variant="secondary" size="sm"><CalendarClock className="size-4" />{t(locale, "app.drafts.resume")}</ButtonLink>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={FilePenLine}
          title={t(locale, "app.drafts.empty_title")}
          description={t(locale, "app.drafts.empty_description")}
          action={<ButtonLink href={`/${locale}/app/journal/new`}>{t(locale, "app.drafts.create")}</ButtonLink>}
        />
      )}
    </>
  );
}

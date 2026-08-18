"use client";

import { translate as t } from "@/i18n";
import { use, useEffect, useState } from "react";
import { FilePenLine } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { JournalEntryForm } from "@/components/journal/entry-form";
import { Card, CardContent } from "@/components/ui/card";
import { uid } from "@/lib/utils";

export default function NewEntryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const existing = url.searchParams.get("draft");
    if (existing) {
      setDraftId(existing);
      return;
    }
    const created = uid("journal-draft");
    url.searchParams.set("draft", created);
    window.history.replaceState(window.history.state, "", url);
    setDraftId(created);
  }, []);

  return (
    <>
      <PageHeader
        title={t(locale, "app.journal.new_day")}
        description={t(locale, "app.journal.capture_important_facts_while_they_are_accurate_a_local_draft_is_kept_while_you_")}
      />
      {draftId ? (
        <JournalEntryForm locale={locale} draftId={draftId} />
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted">
            <FilePenLine className="size-5 animate-pulse text-primary" />
            {t(locale, "app.journal.preparing_draft")}
          </CardContent>
        </Card>
      )}
    </>
  );
}

"use client";

import { translate as t } from "@/i18n";

import { use } from "react";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { JournalEntryForm } from "@/components/journal/entry-form";
import { useStageLog } from "@/lib/store";

export default function EditEntryPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = use(params);
  const { data } = useStageLog();
  const entry = data.entries.find((item) => item.id === id);
  if (!entry) notFound();
  return <><PageHeader title={t(locale, "app.journal.edit_day")} description={t(locale, "app.journal.update_the_entry_while_preserving_its_history_and_calculated_hours")} /><JournalEntryForm locale={locale} entry={entry} /></>;
}

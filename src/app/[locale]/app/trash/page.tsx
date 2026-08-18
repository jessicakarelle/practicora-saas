"use client";

import { translate as t } from "@/i18n";

import { use } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { useStageLog } from "@/lib/store";

export default function TrashPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const dialog = useDialog();
  const { data, restoreTrashItem, permanentlyDeleteTrashItem } = useStageLog();

  async function removePermanently(id: string, title: string) {
    const accepted = await dialog.confirm({ title: t(locale, "app.trash.delete_permanently"), description: title, tone: "danger", confirmLabel: t(locale, "app.trash.delete_permanently_2"), cancelLabel: t(locale, "app.trash.keep") });
    if (accepted) permanentlyDeleteTrashItem(id);
  }

  return <>
    <PageHeader title={t(locale, "app.trash.trash")} description={t(locale, "app.trash.restore_accidentally_deleted_items_or_permanently_remove_them_with_a_clear_confi")} />
    {data.trash.length === 0 ? <Card><CardContent><EmptyState icon={Trash2} title={t(locale, "app.trash.trash_is_empty")} description={t(locale, "app.trash.deleted_entries_goals_and_notes_will_appear_here")} /></CardContent></Card> : <div className="space-y-3">{data.trash.map((item) => { const payload = item.payload as { title?: string; workDone?: string; date?: string }; const title = payload.title || payload.workDone?.slice(0, 70) || payload.date || item.type; return <Card key={item.id}><CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-bold uppercase tracking-[0.06em] text-muted-strong">{item.type}</span><span className="text-sm text-muted">{new Intl.DateTimeFormat(t(locale, "app.trash.en_ca"), { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.deletedAt))}</span></div><h2 className="mt-2 truncate font-bold">{title}</h2></div><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { restoreTrashItem(item.id); toast.success(t(locale, "app.trash.item_restored")); }}><RotateCcw className="size-4" />{t(locale, "app.trash.restore")}</Button><Button variant="danger" onClick={() => void removePermanently(item.id, title)}><Trash2 className="size-4" />{t(locale, "app.trash.delete")}</Button></div></CardContent></Card>; })}</div>}
  </>;
}

"use client";

import { translate as t } from "@/i18n";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, FileCheck2, MailPlus, MessageSquareText } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace";

export function NotificationCenter({ locale }: { locale: string }) {
  const { activeWorkspace } = useWorkspace();
  const organizationId = activeWorkspace?.kind === "organization" ? activeWorkspace.organizationId : null;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; title: string; body: string; href: string; read: boolean; type: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const query = supabase
        .from("notifications")
        .select("id,title,body,action_url,read_at,type")
        .order("created_at", { ascending: false })
        .limit(12);
      if (organizationId) query.eq("organization_id", organizationId);
      const { data } = await query;
      if (!cancelled && data) {
        setItems(data.map((row) => ({
          id: row.id,
          title: row.title,
          body: row.body || "",
          href: row.action_url || `/${locale}/app`,
          read: Boolean(row.read_at),
          type: row.type || "message",
        })));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [locale, organizationId]);

  const unread = items.filter((item) => !item.read).length;

  async function markAllRead() {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    const supabase = getSupabaseBrowserClient();
    if (supabase && unreadIds.length) await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", unreadIds);
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-muted-strong hover:bg-surface-muted hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
        aria-label={t(locale, "common.navigation.notifications")}
      >
        <Bell className="size-4.5" />
        {unread ? <span className="absolute -top-1 -right-1 flex min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-extrabold leading-4.5 text-white">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      <AnimatePresence>
        {open ? (
          <>
            <button className="fixed inset-0 z-[69] cursor-default" onClick={() => setOpen(false)} aria-label={t(locale, "common.navigation.close")} />
            <motion.div initial={{ opacity: 0, y: -5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.98 }} transition={{ duration: 0.14 }} className="fixed top-16 right-3 z-[70] w-[min(390px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:absolute sm:top-[calc(100%+8px)] sm:right-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div><div className="text-sm font-extrabold">{t(locale, "common.navigation.notifications")}</div><div className="text-[11px] text-muted">{unread ? `${unread} ${t(locale, "common.navigation.unread")}` : t(locale, "common.navigation.you_are_all_caught_up")}</div></div>
                {unread ? <button type="button" onClick={() => void markAllRead()} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold text-primary hover:bg-primary-softer"><CheckCheck className="size-3.5" />{t(locale, "common.navigation.mark_read")}</button> : null}
              </div>
              <div className="max-h-[420px] overflow-y-auto overscroll-contain p-2">
                {items.length ? items.map((item) => {
                  const Icon = item.type === "review" ? FileCheck2 : item.type === "invitation" ? MailPlus : MessageSquareText;
                  return <Link key={item.id} href={item.href} onClick={() => setOpen(false)} className={`flex gap-3 rounded-xl p-3 hover:bg-surface-muted ${item.read ? "opacity-65" : "bg-primary-softer/45"}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-primary shadow-sm"><Icon className="size-4" /></span><span className="min-w-0"><span className="block truncate text-sm font-bold">{item.title}</span><span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted">{item.body}</span></span></Link>;
                }) : <div className="px-5 py-10 text-center"><Bell className="mx-auto size-6 text-muted" /><p className="mt-3 text-sm font-semibold text-muted">{t(locale, "common.navigation.no_notifications_yet")}</p></div>}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, ImageIcon, Paperclip, Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog-provider";
import { localeTag, translate as t } from "@/i18n";
import { getAttachmentBlob, putAttachmentBlob, removeAttachmentBlob } from "@/lib/journal-attachments";
import type { JournalAttachment } from "@/lib/types";
import { uid } from "@/lib/utils";

const MAX_FILES = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

function formatBytes(value: number, locale: string) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value / 1024)} KB`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value / (1024 * 1024))} MB`;
}

export function AttachmentManager({
  locale,
  value,
  onChange,
}: {
  locale: string;
  value: JournalAttachment[];
  onChange: (value: JournalAttachment[]) => void;
}) {
  const dialog = useDialog();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const totalSize = useMemo(() => value.reduce((sum, attachment) => sum + attachment.size, 0), [value]);

  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    async function load() {
      const next: Record<string, string> = {};
      for (const attachment of value.filter((item) => item.kind === "image")) {
        const blob = await getAttachmentBlob(attachment.id).catch(() => undefined);
        if (!blob || cancelled) continue;
        const url = URL.createObjectURL(blob);
        urls.push(url);
        next[attachment.id] = url;
      }
      if (!cancelled) setPreviews(next);
    }
    void load();
    return () => {
      cancelled = true;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [value]);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const candidates = Array.from(files);
    const issues: string[] = [];
    if (value.length + candidates.length > MAX_FILES) {
      issues.push(t(locale, "app.journal.attachment_limit_files", { count: MAX_FILES }));
    }
    const accepted = candidates.slice(0, Math.max(0, MAX_FILES - value.length));
    let runningTotal = totalSize;
    const next: JournalAttachment[] = [];

    for (const file of accepted) {
      if (file.size > MAX_FILE_SIZE) {
        issues.push(t(locale, "app.journal.attachment_too_large", { name: file.name, size: 5 }));
        continue;
      }
      if (runningTotal + file.size > MAX_TOTAL_SIZE) {
        issues.push(t(locale, "app.journal.attachment_total_limit", { size: 20 }));
        break;
      }
      const id = uid("attachment");
      try {
        await putAttachmentBlob(id, file);
        next.push({
          id,
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          kind: file.type.startsWith("image/") ? "image" : "document",
          createdAt: new Date().toISOString(),
        });
        runningTotal += file.size;
      } catch {
        issues.push(t(locale, "app.journal.attachment_storage_error", { name: file.name }));
      }
    }

    if (next.length) onChange([...value, ...next]);
    if (issues.length) {
      await dialog.validation({
        title: t(locale, "app.journal.some_files_were_not_added"),
        details: issues,
        confirmLabel: t(locale, "common.dialog.close"),
      });
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(attachment: JournalAttachment) {
    await removeAttachmentBlob(attachment.id).catch(() => undefined);
    onChange(value.filter((item) => item.id !== attachment.id));
  }

  async function download(attachment: JournalAttachment) {
    const blob = await getAttachmentBlob(attachment.id).catch(() => undefined);
    if (!blob) {
      await dialog.alert({
        title: t(locale, "app.journal.attachment_unavailable"),
        description: t(locale, "app.journal.attachment_not_found_on_device"),
        tone: "warning",
      });
      return;
    }
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple
        accept={ACCEPTED_EXTENSIONS}
        onChange={(event) => void addFiles(event.target.files)}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary"><UploadCloud className="size-5" /></span>
          <div>
            <div className="text-sm font-extrabold text-foreground">{t(locale, "app.journal.attachments")}</div>
            <p className="mt-1 text-xs leading-5 text-muted">{t(locale, "app.journal.attachment_limits", { files: MAX_FILES, fileSize: 5, totalSize: 20 })}</p>
          </div>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={value.length >= MAX_FILES}>
          <Plus className="size-4" />{t(locale, "app.journal.add_files")}
        </Button>
      </div>

      {value.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {value.map((attachment) => (
            <article key={attachment.id} className="group overflow-hidden rounded-2xl border border-border bg-background">
              {attachment.kind === "image" && previews[attachment.id] ? (
                <div className="aspect-[16/9] overflow-hidden bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previews[attachment.id]} alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.015]" />
                </div>
              ) : (
                <div className="flex aspect-[16/9] items-center justify-center bg-surface-muted/65 text-primary">
                  {attachment.kind === "image" ? <ImageIcon className="size-8" /> : <FileText className="size-8" />}
                </div>
              )}
              <div className="p-3">
                <div className="flex items-start gap-2">
                  <Paperclip className="mt-0.5 size-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">{attachment.name}</div>
                    <div className="mt-1 text-xs text-muted">{formatBytes(attachment.size, localeTag(locale))}</div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => void download(attachment)} aria-label={t(locale, "app.journal.download_attachment")}><Download className="size-4" /></Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void remove(attachment)} aria-label={t(locale, "app.journal.delete_attachment")}><Trash2 className="size-4 text-danger" /></Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {value.length ? <p className="text-xs text-muted">{t(locale, "app.journal.attachment_usage", { count: value.length, size: formatBytes(totalSize, localeTag(locale)) })}</p> : null}
    </div>
  );
}

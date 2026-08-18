import { BRAND } from "@/lib/brand";
import type { JournalAttachment } from "@/lib/types";
import { removeAttachmentBlobs } from "@/lib/journal-attachments";

export type JournalDraft = {
  id: string;
  createdAt: string;
  updatedAt: string;
  values: Record<string, unknown>;
};

function key(id: string) {
  return `${BRAND.draftPrefix}${id}`;
}

export function saveJournalDraft(id: string, values: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const existing = loadJournalDraft(id);
  const now = new Date().toISOString();
  const draft: JournalDraft = {
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    values,
  };
  localStorage.setItem(key(id), JSON.stringify(draft));
}

export function loadJournalDraft(id: string): JournalDraft | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(key(id));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as JournalDraft | Record<string, unknown>;
    if ("values" in parsed && parsed.values && typeof parsed.values === "object") {
      return parsed as JournalDraft;
    }
    const now = new Date().toISOString();
    return { id, createdAt: now, updatedAt: now, values: parsed as Record<string, unknown> };
  } catch {
    localStorage.removeItem(key(id));
    return null;
  }
}

export function listJournalDrafts() {
  if (typeof window === "undefined") return [] as JournalDraft[];
  const drafts: JournalDraft[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const storageKey = localStorage.key(index);
    if (!storageKey?.startsWith(BRAND.draftPrefix)) continue;
    const id = storageKey.slice(BRAND.draftPrefix.length);
    if (!id || id.startsWith("entry")) continue;
    const draft = loadJournalDraft(id);
    if (draft) drafts.push(draft);
  }
  return drafts.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function deleteJournalDraft(id: string) {
  const draft = loadJournalDraft(id);
  const attachments = Array.isArray(draft?.values.attachments)
    ? (draft?.values.attachments as JournalAttachment[])
    : [];
  localStorage.removeItem(key(id));
  await removeAttachmentBlobs(attachments);
}

export function clearJournalDraft(id: string) {
  if (typeof window !== "undefined") localStorage.removeItem(key(id));
}

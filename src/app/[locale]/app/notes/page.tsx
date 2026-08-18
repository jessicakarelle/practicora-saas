"use client";

import { translate as t } from "@/i18n";

import { use, useMemo, useState } from "react";
import { CornerDownLeft, Pin, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDialog } from "@/components/ui/dialog-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldHint, FieldLabel, Input, Textarea } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { useStageLog } from "@/lib/store";
import type { Note } from "@/lib/types";

export default function NotesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const dialog = useDialog();
  const { activeInternship, activeNotes, addNote, updateNote, deleteNote } = useStageLog();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Note["category"]>("general");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [pinFilter, setPinFilter] = useState("all");

  const categories = [
    { value: "general", label: t(locale, "app.notes.general") },
    { value: "meeting", label: t(locale, "app.notes.meeting") },
    { value: "idea", label: t(locale, "app.notes.idea") },
    { value: "feedback", label: t(locale, "app.notes.feedback") },
    { value: "reference", label: t(locale, "app.notes.reference") },
  ];

  async function createNote() {
    if (!title.trim() && !content.trim()) {
      await dialog.validation({
        title: t(locale, "app.notes.empty_note"),
        description: t(locale, "app.notes.a_note_needs_at_least_a_title_or_content"),
        details: [t(locale, "app.notes.add_a_title_or_content")],
        confirmLabel: t(locale, "app.notes.review"),
      });
      return;
    }

    addNote({
      internshipId: activeInternship.id,
      title: title.trim() || (t(locale, "app.notes.untitled_note")),
      content: content.trim(),
      category,
      pinned: false,
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
    setTitle("");
    setContent("");
    setTags("");
    setCategory("general");
  }

  async function removeNote(note: Note) {
    const accepted = await dialog.confirm({
      title: t(locale, "app.notes.move_this_note_to_trash"),
      description: note.title,
      tone: "danger",
      confirmLabel: t(locale, "app.notes.move"),
      cancelLabel: t(locale, "app.notes.keep"),
    });
    if (accepted) deleteNote(note.id);
  }

  const filtered = useMemo(
    () => activeNotes
      .filter((note) => {
        const query = search.trim().toLowerCase();
        return (
          (!query || `${note.title} ${note.content} ${note.tags.join(" ")}`.toLowerCase().includes(query)) &&
          (categoryFilter === "all" || note.category === categoryFilter) &&
          (pinFilter === "all" || (pinFilter === "pinned" ? note.pinned : !note.pinned))
        );
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt)),
    [activeNotes, categoryFilter, pinFilter, search],
  );

  return (
    <>
      <PageHeader
        title={t(locale, "app.notes.notes")}
        description={t(locale, "app.notes.keep_decisions_references_ideas_and_feedback_that_do_not_belong_to_a_specific_da")}
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void createNote();
        }}
      >
        <Card>
          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[.8fr_1.4fr_190px]">
              <div>
                <FieldLabel htmlFor="new-note-title">{t(locale, "app.notes.title")}</FieldLabel>
                <Input id="new-note-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div>
                <FieldLabel htmlFor="new-note-content">{t(locale, "app.notes.content")}</FieldLabel>
                <Textarea id="new-note-content" rows={2} className="min-h-11" value={content} onChange={(event) => setContent(event.target.value)} />
              </div>
              <div>
                <FieldLabel>{t(locale, "app.notes.category")}</FieldLabel>
                <Select value={category} onValueChange={(value) => setCategory(value as Note["category"])} options={categories} />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div>
                <FieldLabel htmlFor="new-note-tags">{t(locale, "app.notes.tags")}</FieldLabel>
                <Input
                  id="new-note-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder={t(locale, "app.notes.architecture_meeting_follow_up")}
                />
                <FieldHint>{t(locale, "app.notes.separate_tags_with_commas")}</FieldHint>
              </div>
              <Button type="submit" className="h-11 self-start md:mt-[30px]">
                <Plus className="size-4" />{t(locale, "app.notes.add")}
              </Button>
            </div>

            <p className="flex items-center gap-2 text-xs text-muted">
              <CornerDownLeft className="size-3.5" />
              {t(locale, "app.notes.existing_notes_autosave_while_you_edit_them")}
            </p>
          </CardContent>
        </Card>
      </form>

      <Card className="mt-5">
        <CardContent className="grid gap-3 md:grid-cols-[1fr_190px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
            <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(locale, "app.notes.search_notes")} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter} options={[{ value: "all", label: t(locale, "app.notes.all_categories") }, ...categories]} />
          <Select value={pinFilter} onValueChange={setPinFilter} options={[{ value: "all", label: t(locale, "app.notes.all_notes") }, { value: "pinned", label: t(locale, "app.notes.pinned") }, { value: "normal", label: t(locale, "app.notes.not_pinned") }]} />
        </CardContent>
      </Card>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length ? filtered.map((note) => (
          <Card key={note.id} className={note.pinned ? "border-primary/30" : undefined}>
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary-softer px-2.5 py-1 text-xs font-bold text-primary">{categories.find((item) => item.value === note.category)?.label}</span>
                    {note.pinned ? <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning"><Pin className="size-3" />{t(locale, "app.notes.pinned_2")}</span> : null}
                  </div>
                  <Input className="h-auto border-0 bg-transparent px-0 text-base font-bold focus:ring-0" value={note.title} onChange={(event) => updateNote(note.id, { title: event.target.value })} />
                </div>
                <div className="flex">
                  <Button variant="ghost" size="sm" onClick={() => updateNote(note.id, { pinned: !note.pinned })} aria-label={t(locale, "app.notes.pin")}><Pin className={`size-4 ${note.pinned ? "text-warning" : "text-muted"}`} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => void removeNote(note)} aria-label={t(locale, "app.notes.delete")}><Trash2 className="size-4 text-danger" /></Button>
                </div>
              </div>
              <Textarea className="mt-3 min-h-40 border-0 bg-background focus:ring-0" value={note.content} onChange={(event) => updateNote(note.id, { content: event.target.value })} />
              <div className="mt-3"><FieldLabel>{t(locale, "app.notes.category")}</FieldLabel><Select value={note.category} onValueChange={(value) => updateNote(note.id, { category: value as Note["category"] })} options={categories} /></div>
              <div className="mt-3"><FieldLabel>{t(locale, "app.notes.tags")}</FieldLabel><Input value={note.tags.join(", ")} onChange={(event) => updateNote(note.id, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} /><FieldHint>{t(locale, "app.notes.autosaved")}</FieldHint></div>
            </CardContent>
          </Card>
        )) : (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState icon={StickyNote} title={t(locale, "app.notes.no_matching_notes")} description={t(locale, "app.notes.add_a_note_or_change_the_filters")} />
          </div>
        )}
      </div>
    </>
  );
}

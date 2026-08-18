"use client";

import { localeTag, translate as t } from "@/i18n";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Check,
  ChevronLeft,
  ExternalLink,
  MessageCircle,
  MessageSquarePlus,
  Pencil,
  Paperclip,
  FileText,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { uid } from "@/lib/utils";

type GuideMessage = {
  id: string;
  role: "user" | "guide";
  text: string;
  createdAt: string;
  href?: string;
  linkLabel?: string;
};

type GuideConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: GuideMessage[];
};

const STORAGE_KEY = "practicora:guide-conversations:v1";

export function PracticoraGuide({ locale }: { locale: string }) {
  const [open, setOpen] = useState(false);
  const [showList, setShowList] = useState(false);
  const [conversations, setConversations] = useState<GuideConversation[]>([]);
  const [activeId, setActiveId] = useState("");
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      ) as GuideConversation[];
      if (Array.isArray(stored) && stored.length) {
        setConversations(stored);
        setActiveId(stored[0].id);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!conversations.length) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (showList) return;
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [activeId, conversations, showList, typing]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  const activeConversation = useMemo(
    () =>
      conversations.find((conversation) => conversation.id === activeId) ||
      null,
    [activeId, conversations],
  );

  function createConversation() {
    const now = new Date().toISOString();
    const conversation: GuideConversation = {
      id: uid("guide"),
      title: t(locale, "assistant.guide.new_conversation"),
      updatedAt: now,
      messages: [
        {
          id: uid("message"),
          role: "guide",
          text: t(locale, "assistant.guide.welcome"),
          createdAt: now,
        },
      ],
    };
    setConversations((current) => [conversation, ...current]);
    setActiveId(conversation.id);
    setShowList(false);
    return conversation.id;
  }

  function ensureConversation() {
    return activeConversation?.id || createConversation();
  }

  function removeConversation(id: string) {
    setConversations((current) => {
      const next = current.filter((conversation) => conversation.id !== id);
      setActiveId((selected) =>
        selected === id ? next[0]?.id || "" : selected,
      );
      return next;
    });
    if (editingId === id) {
      setEditingId("");
      setEditingTitle("");
    }
  }

  function beginRename(conversation: GuideConversation) {
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  }

  function saveRename() {
    const nextTitle = editingTitle.trim();
    if (!editingId || !nextTitle) return;
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === editingId
          ? {
              ...conversation,
              title: nextTitle.slice(0, 64),
              updatedAt: new Date().toISOString(),
            }
          : conversation,
      ),
    );
    setEditingId("");
    setEditingTitle("");
  }

  function guideAnswer(
    query: string,
  ): Pick<GuideMessage, "text" | "href" | "linkLabel"> {
    const normalized = query.toLocaleLowerCase(
      localeTag(locale),
    );
    const routes: Array<{
      terms: string[];
      text: string;
      href: string;
      label: string;
    }> = [
      {
        terms: ["brouillon", "draft", "sauvegarde", "save"],
        text: t(locale, "assistant.guide.answer_drafts"),
        href: `/${locale}/app/journal/drafts`,
        label: t(locale, "assistant.guide.open_drafts"),
      },
      {
        terms: ["calendrier", "calendar", "férié", "holiday"],
        text: t(locale, "assistant.guide.answer_calendar"),
        href: `/${locale}/app/calendar`,
        label: t(locale, "assistant.guide.open_calendar"),
      },
      {
        terms: [
          "google",
          "github",
          "microsoft",
          "apple",
          "connexion",
          "oauth",
          "login",
        ],
        text: t(locale, "assistant.guide.answer_oauth"),
        href: `/${locale}/login`,
        label: t(locale, "assistant.guide.open_login"),
      },
      {
        terms: ["profil", "profile", "nom", "bio", "linkedin"],
        text: t(locale, "assistant.guide.answer_profile"),
        href: `/${locale}/app/account`,
        label: t(locale, "assistant.guide.open_profile"),
      },
      {
        terms: [
          "paramètre",
          "setting",
          "thème",
          "theme",
          "devise",
          "timezone",
          "fuseau",
        ],
        text: t(locale, "assistant.guide.answer_settings"),
        href: `/${locale}/app/settings`,
        label: t(locale, "assistant.guide.open_settings"),
      },
      {
        terms: [
          "institution",
          "école",
          "school",
          "invitation",
          "teacher",
          "professeur",
        ],
        text: t(locale, "assistant.guide.answer_institutions"),
        href: `/${locale}/institutions`,
        label: t(locale, "assistant.guide.open_institutions"),
      },
      {
        terms: ["rapport", "report", "export", "pdf"],
        text: t(locale, "assistant.guide.answer_reports"),
        href: `/${locale}/app/reports`,
        label: t(locale, "assistant.guide.open_reports"),
      },
      {
        terms: ["heure", "hours", "journée", "day", "journal"],
        text: t(locale, "assistant.guide.answer_journal"),
        href: `/${locale}/app/journal/new`,
        label: t(locale, "assistant.guide.open_new_day"),
      },
    ];
    const match = routes.find((route) =>
      route.terms.some((term) => normalized.includes(term)),
    );
    return (
      match || {
        text: t(locale, "assistant.guide.answer_default"),
        href: `/${locale}/contact`,
        linkLabel: t(locale, "assistant.guide.contact_support"),
      }
    );
  }

  function send() {
    const text = value.trim() || t(locale, "assistant.guide.attachments_only");
    if ((!value.trim() && !attachments.length) || typing) return;
    const conversationId = ensureConversation();
    const now = new Date().toISOString();
    const attachmentNames = attachments.map((file) => file.name);
    const userMessage: GuideMessage = {
      id: uid("message"),
      role: "user",
      text: attachmentNames.length
        ? `${text}\n\n${attachmentNames.map((name) => `📎 ${name}`).join("\n")}`
        : text,
      createdAt: now,
    };
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title:
                conversation.messages.length <= 1
                  ? text.slice(0, 46)
                  : conversation.title,
              updatedAt: now,
              messages: [...conversation.messages, userMessage],
            }
          : conversation,
      ),
    );
    setValue("");
    setAttachments([]);
    setTyping(true);
    window.setTimeout(() => {
      const answer = guideAnswer(text);
      const answerTime = new Date().toISOString();
      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: answerTime,
                messages: [
                  ...conversation.messages,
                  {
                    id: uid("message"),
                    role: "guide",
                    createdAt: answerTime,
                    ...answer,
                  },
                ],
              }
            : conversation,
        ),
      );
      setTyping(false);
    }, 520);
  }

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(localeTag(locale), {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  function toggleOpen() {
    setOpen((current) => {
      const next = !current;
      if (next && !activeId && !conversations.length) createConversation();
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={
          open
            ? t(locale, "assistant.guide.close")
            : t(locale, "assistant.guide.open")
        }
        data-tooltip={
          open
            ? t(locale, "assistant.guide.close")
            : t(locale, "assistant.guide.open")
        }
        className="practicora-guide-launcher fixed right-4 bottom-4 z-[10030] flex size-12 items-center justify-center rounded-xl border border-primary/20 bg-primary text-white shadow-[var(--shadow-float)] transition-[background-color,box-shadow] duration-150 hover:bg-primary-strong sm:right-6 sm:bottom-6"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.section
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            transition={{ duration: 0.17, ease: [0.22, 1, 0.36, 1] }}
            className={`practicora-guide-panel fixed right-3 bottom-20 z-[10025] flex w-[min(390px,calc(100vw-24px))] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-float)] sm:right-6 sm:bottom-22 ${showList ? "h-[min(520px,calc(100dvh-104px))]" : "h-[min(540px,calc(100dvh-96px))]"}`}
          >
            <header className="flex items-center gap-3 border-b border-border bg-surface-muted/30 px-4 py-3">
              {showList ? (
                <button
                  type="button"
                  onClick={() => setShowList(false)}
                  aria-label={t(locale, "assistant.guide.back")}
                  className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                >
                  <ChevronLeft className="size-4" />
                </button>
              ) : (
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary-softer text-primary">
                  <Bot className="size-4" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold text-foreground">
                  {showList
                    ? t(locale, "assistant.guide.conversations")
                    : activeConversation?.title ||
                      t(locale, "assistant.guide.title")}
                </h2>
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {t(locale, "assistant.guide.local_notice")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowList((current) => !current)}
                aria-label={t(locale, "assistant.guide.conversations")}
                className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                <MessageSquarePlus className="size-4" />
              </button>
            </header>

            {showList ? (
              <div className="practicora-scroll flex-1 overflow-y-auto p-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mb-3 w-full"
                  onClick={createConversation}
                >
                  <MessageSquarePlus className="size-4" />
                  {t(locale, "assistant.guide.new_conversation")}
                </Button>
                <div className="space-y-2">
                  {conversations.map((conversation) => {
                    const editing = editingId === conversation.id;
                    return (
                      <div
                        key={conversation.id}
                        className="rounded-xl border border-border bg-background p-2"
                      >
                        {editing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingTitle}
                              onChange={(event) =>
                                setEditingTitle(event.target.value)
                              }
                              onKeyDown={(event) => {
                                if (event.key === "Enter") saveRename();
                                if (event.key === "Escape") {
                                  setEditingId("");
                                  setEditingTitle("");
                                }
                              }}
                              autoFocus
                              maxLength={64}
                              aria-label={t(
                                locale,
                                "assistant.guide.conversation_name",
                              )}
                            />
                            <button
                              type="button"
                              onClick={saveRename}
                              aria-label={t(
                                locale,
                                "assistant.guide.save_name",
                              )}
                              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-success transition-colors hover:bg-success/10"
                            >
                              <Check className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveId(conversation.id);
                                setShowList(false);
                              }}
                              className="min-w-0 flex-1 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-muted"
                            >
                              <div className="truncate text-sm font-bold text-foreground">
                                {conversation.title}
                              </div>
                              <div className="mt-1 text-[11px] text-muted">
                                {timeFormatter.format(
                                  new Date(conversation.updatedAt),
                                )}
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => beginRename(conversation)}
                              aria-label={t(
                                locale,
                                "assistant.guide.rename_conversation",
                              )}
                              className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary-softer hover:text-primary"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                removeConversation(conversation.id)
                              }
                              aria-label={t(
                                locale,
                                "assistant.guide.delete_conversation",
                              )}
                              className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/8 hover:text-danger"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={listRef}
                  className="practicora-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4"
                >
                  {(activeConversation?.messages || []).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-sm leading-5 ${message.role === "user" ? "rounded-br-md bg-primary text-white" : "rounded-bl-md border border-border bg-background text-muted-strong"}`}
                      >
                        <p>{message.text}</p>
                        {message.href && message.linkLabel ? (
                          <Link
                            href={message.href}
                            className={`mt-2 inline-flex items-center gap-1 text-xs font-extrabold ${message.role === "user" ? "text-white" : "text-primary"}`}
                          >
                            {message.linkLabel}
                            <ExternalLink className="size-3" />
                          </Link>
                        ) : null}
                        <div
                          className={`mt-1.5 text-[10px] ${message.role === "user" ? "text-white/65" : "text-muted"}`}
                        >
                          {timeFormatter.format(new Date(message.createdAt))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {typing ? (
                    <div className="flex justify-start">
                      <div
                        className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3"
                        aria-label={t(locale, "assistant.guide.typing")}
                      >
                        <span className="size-1.5 animate-bounce rounded-full bg-muted" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
                      </div>
                    </div>
                  ) : null}
                </div>
                <footer className="border-t border-border bg-surface p-3">
                  {attachments.length ? <div className="mb-2 flex flex-wrap gap-1.5">{attachments.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary-softer px-2 py-1 text-[11px] font-bold text-primary"><FileText className="size-3"/><span className="max-w-44 truncate">{file.name}</span><button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded p-0.5 hover:bg-primary-soft" aria-label={t(locale, "assistant.guide.remove_attachment")}><X className="size-3"/></button></span>)}</div> : null}
                  <input ref={attachmentInputRef} type="file" multiple accept="image/*,.pdf,.txt,.doc,.docx" className="hidden" onChange={(event) => { const next = Array.from(event.target.files || []).filter((file) => file.size <= 5 * 1024 * 1024).slice(0, 3); setAttachments(next); event.currentTarget.value = ""; }} />
                  <div className="flex items-end gap-2">
                    <button type="button" onClick={() => attachmentInputRef.current?.click()} className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted transition-colors hover:border-primary/35 hover:bg-primary-softer hover:text-primary" aria-label={t(locale, "assistant.guide.attach_files")}><Paperclip className="size-4"/></button>
                    <Input
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          send();
                        }
                      }}
                      placeholder={t(locale, "assistant.guide.placeholder")}
                      aria-label={t(locale, "assistant.guide.placeholder")}
                    />
                    <Button
                      type="button"
                      size="md"
                      className="size-11 shrink-0 px-0"
                      disabled={(!value.trim() && !attachments.length) || typing}
                      onClick={send}
                      aria-label={t(locale, "assistant.guide.send")}
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-[10px] leading-4 text-muted">
                    {t(locale, "assistant.guide.scope_notice")}
                  </p>
                </footer>
              </>
            )}
          </motion.section>
        ) : null}
      </AnimatePresence>
    </>
  );
}

"use client";

import { normalizeLocale, translate as t, type AppLocale } from "@/i18n";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import { ALL_PROTECTED_SECTIONS, DEFAULT_PROTECTED_SECTIONS, normalizeCustomProtectedPath } from "@/lib/security";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type {
  Evaluation,
  EvaluationDimensions,
  Internship,
  InternshipStatus,
  JournalCategory,
  JournalEntry,
  Note,
  NoteCategory,
  Objective,
  ObjectiveCategory,
  ObjectivePriority,
  ProtectedSectionId,
  SalarySettings,
  StageLogData,
  SyncStatus,
  TrashItem,
  UserSettings,
  WorkMode,
} from "@/lib/types";
import { toDateInputValue, uid } from "@/lib/utils";

const STORAGE_KEY = BRAND.storageKey;
const LEGACY_KEYS = ["stagelog:v4", "stagelog-pro-v3", "stagelog-pro", "stagelogData"];

const workModes: WorkMode[] = ["onsite", "remote", "hybrid"];
const internshipStatuses: InternshipStatus[] = ["planned", "active", "paused", "completed"];
const journalCategories: JournalCategory[] = [
  "development",
  "design",
  "analysis",
  "testing",
  "support",
  "meeting",
  "learning",
  "administration",
  "other",
];
const objectiveCategories: ObjectiveCategory[] = [
  "technical",
  "communication",
  "organization",
  "autonomy",
  "career",
  "other",
];
const noteCategories: NoteCategory[] = ["general", "meeting", "idea", "feedback", "reference"];
const priorities: ObjectivePriority[] = ["low", "medium", "high"];

function createDefaultInternship(): Internship {
  const now = new Date().toISOString();
  return {
    id: uid("internship"),
    name: t(currentInterfaceLocale(), "common.misc.default_internship_name"),
    company: "",
    role: "",
    department: "",
    industry: "",
    location: "",
    workMode: "onsite",
    status: "active",
    supervisor: "",
    supervisorEmail: "",
    supervisorPhone: "",
    school: "",
    teacher: "",
    teacherEmail: "",
    description: "",
    startDate: toDateInputValue(),
    endDate: "",
    goalHours: 240,
    weeklyGoalHours: 35,
    createdAt: now,
  };
}

const defaultDimensions: EvaluationDimensions = {
  technical: 0,
  communication: 0,
  autonomy: 0,
  organization: 0,
  collaboration: 0,
  problemSolving: 0,
};

export function currentInterfaceLocale(): AppLocale {
  if (typeof window === "undefined") return "fr";
  const locale = window.location.pathname.split("/").filter(Boolean)[0];
  return normalizeLocale(locale);
}

function createDefaultData(): StageLogData {
  const internship = createDefaultInternship();
  return {
    version: 7,
    updatedAt: new Date().toISOString(),
    internships: [internship],
    activeInternshipId: internship.id,
    entries: [],
    objectives: [],
    notes: [],
    trash: [],
    settings: {
      name: "",
      program: "",
      email: "",
      phone: "",
      school: "",
      graduationYear: "",
      bio: "",
      careerGoal: "",
      portfolioUrl: "",
      linkedinUrl: "",
      timezone: "America/Toronto",
      emailUpdates: true,
      weeklyDigest: true,
      securityAlerts: true,
      theme: "system",
      themePreset: "ocean",
      accentColor: "#2f6f9f",
      compactMode: false,
      currency: "CAD",
      country: "CA",
      region: "QC",
      dateFormat: "yyyy-MM-dd",
      weekStartsOn: 1,
      defaultPageSize: 10,
      holidayCalendar: true,
      remindersEnabled: true,
      locale: "fr",
      security: {
        enabled: false,
        pinHash: "",
        pinLength: 4,
        protectedSections: [...DEFAULT_PROTECTED_SECTIONS],
        customProtectedPaths: [],
        autoLockMinutes: 15,
      },
    },
    salary: {
      rate: 15,
      type: "hourly",
      dailyRate: 120,
      incomeTaxPercent: 14,
      pensionPercent: 5.95,
      employmentInsurancePercent: 1.66,
      otherDeductionPercent: 0,
      vacationPayPercent: 0,
      from: "",
      to: "",
    },
    evaluation: {
      stars: 0,
      comments: "",
      skills: [],
      grade: "",
      strengths: "",
      improvements: "",
      supervisorFeedback: "",
      dimensions: { ...defaultDimensions },
    },
  };
}

function finiteNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function boundedRating(value: unknown, fallback = 3) {
  return Math.min(5, Math.max(1, finiteNumber(value, fallback))) as 1 | 2 | 3 | 4 | 5;
}

function boundedScore(value: unknown, fallback = 0) {
  return Math.min(5, Math.max(0, finiteNumber(value, fallback)));
}

function enumValue<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

export function normalizePracticoraData(input: unknown): StageLogData {
  const fallback = createDefaultData();
  if (!input || typeof input !== "object") return fallback;

  const source = input as Record<string, unknown>;
  const rawInternships = Array.isArray(source.internships)
    ? source.internships
    : Array.isArray(source.stages)
      ? source.stages
      : [];

  const internships: Internship[] = rawInternships.map((item, index) => {
    const stage = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(stage.id || uid(`internship-${index}`)),
      name: String(stage.name || stage.title || `Stage ${index + 1}`),
      company: String(stage.company || ""),
      role: String(stage.role || ""),
      department: String(stage.department || ""),
      industry: String(stage.industry || ""),
      location: String(stage.location || ""),
      workMode: enumValue(stage.workMode, workModes, "onsite"),
      status: enumValue(stage.status, internshipStatuses, "active"),
      supervisor: String(stage.supervisor || ""),
      supervisorEmail: String(stage.supervisorEmail || ""),
      supervisorPhone: String(stage.supervisorPhone || ""),
      school: String(stage.school || ""),
      teacher: String(stage.teacher || ""),
      teacherEmail: String(stage.teacherEmail || ""),
      description: String(stage.description || ""),
      startDate: String(stage.startDate || ""),
      endDate: String(stage.endDate || ""),
      goalHours: finiteNumber(stage.goalHours ?? stage.goal, 240),
      weeklyGoalHours: finiteNumber(stage.weeklyGoalHours ?? stage.weeklyGoal, 35),
      createdAt: String(stage.createdAt || new Date().toISOString()),
    };
  });

  if (internships.length === 0) internships.push(fallback.internships[0]);

  const activeInternshipId = String(
    source.activeInternshipId || source.activeStageId || internships[0].id,
  );

  const entries: JournalEntry[] = (Array.isArray(source.entries) ? source.entries : []).map(
    (item, index) => {
      const entry = (item ?? {}) as Record<string, unknown>;
      const todos = Array.isArray(entry.todos) ? entry.todos : [];
      const evidenceLinks = Array.isArray(entry.evidenceLinks) ? entry.evidenceLinks : [];
      const attachments = Array.isArray(entry.attachments) ? entry.attachments : [];
      return {
        id: String(entry.id || uid(`entry-${index}`)),
        internshipId: String(entry.internshipId || entry.stageId || activeInternshipId),
        date: String(entry.date || toDateInputValue()),
        start: String(entry.start || "09:00"),
        end: String(entry.end || "17:00"),
        breakMinutes: finiteNumber(entry.breakMinutes ?? entry.breakMin, 60),
        hours: finiteNumber(entry.hours, 0),
        location: String(entry.location || ""),
        workMode: enumValue(entry.workMode, workModes, "onsite"),
        project: String(entry.project || ""),
        category: enumValue(entry.category, journalCategories, "development"),
        workDone: String(entry.workDone || entry.done || ""),
        achievements: String(entry.achievements || ""),
        learned: String(entry.learned || ""),
        difficulties: String(entry.difficulties || ""),
        blockers: String(entry.blockers || ""),
        feedback: String(entry.feedback || ""),
        nextSteps: String(entry.nextSteps || ""),
        notes: String(entry.notes || ""),
        mood: boundedRating(entry.mood, 3),
        energy: boundedRating(entry.energy, 3),
        focus: boundedRating(entry.focus, 3),
        satisfaction: boundedRating(entry.satisfaction, 3),
        todos: todos.map((todo, todoIndex) => {
          const value = (todo ?? {}) as Record<string, unknown>;
          return {
            id: String(value.id || uid(`todo-${todoIndex}`)),
            text: String(value.text || value.label || ""),
            done: Boolean(value.done),
            priority: enumValue(value.priority, priorities, "medium"),
            type:
              value.type === "communication" ||
              value.type === "research" ||
              value.type === "meeting" ||
              value.type === "admin" ||
              value.type === "other"
                ? value.type
                : "development",
          };
        }),
        tags: stringArray(entry.tags),
        evidenceLinks: evidenceLinks.map((link, linkIndex) => {
          const value = (link ?? {}) as Record<string, unknown>;
          return {
            id: String(value.id || uid(`evidence-${linkIndex}`)),
            label: String(value.label || value.title || "Lien"),
            url: String(value.url || ""),
          };
        }),
        attachments: attachments.map((attachment, attachmentIndex) => {
          const value = (attachment ?? {}) as Record<string, unknown>;
          const mimeType = String(value.mimeType || value.type || "application/octet-stream");
          return {
            id: String(value.id || uid(`attachment-${attachmentIndex}`)),
            name: String(value.name || `attachment-${attachmentIndex + 1}`),
            mimeType,
            size: Math.max(0, finiteNumber(value.size, 0)),
            kind: value.kind === "image" || mimeType.startsWith("image/") ? "image" : "document",
            createdAt: String(value.createdAt || new Date().toISOString()),
          };
        }),
        createdAt: String(entry.createdAt || new Date().toISOString()),
        updatedAt: String(entry.updatedAt || new Date().toISOString()),
      };
    },
  );

  const objectives: Objective[] = (
    Array.isArray(source.objectives)
      ? source.objectives
      : Array.isArray(source.objectifs)
        ? source.objectifs
        : []
  ).map((item, index) => {
    const objective = (item ?? {}) as Record<string, unknown>;
    const completed = Boolean(objective.completed ?? objective.done);
    return {
      id: String(objective.id || uid(`objective-${index}`)),
      internshipId: String(objective.internshipId || objective.stageId || activeInternshipId),
      title: String(objective.title || objective.name || "Objectif"),
      description: String(objective.description || ""),
      category: enumValue(objective.category, objectiveCategories, "technical"),
      priority: enumValue(objective.priority, priorities, "medium"),
      progress: Math.min(100, Math.max(0, finiteNumber(objective.progress, completed ? 100 : 0))),
      successMetric: String(objective.successMetric || ""),
      deadline: String(objective.deadline || ""),
      completed,
      createdAt: String(objective.createdAt || new Date().toISOString()),
    };
  });

  const notes: Note[] = (Array.isArray(source.notes) ? source.notes : []).map((item, index) => {
    const note = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(note.id || uid(`note-${index}`)),
      internshipId: String(note.internshipId || note.stageId || activeInternshipId),
      title: String(note.title || `Note ${index + 1}`),
      content: String(note.content || note.text || ""),
      category: enumValue(note.category, noteCategories, "general"),
      pinned: Boolean(note.pinned),
      tags: stringArray(note.tags),
      createdAt: String(note.createdAt || new Date().toISOString()),
      updatedAt: String(note.updatedAt || new Date().toISOString()),
    };
  });

  const rawSettings = (source.settings ?? {}) as Partial<UserSettings> & Record<string, unknown>;
  const rawSecurity = (rawSettings.security ?? {}) as Record<string, unknown>;
  const rawSalary = (source.salary ?? {}) as Partial<SalarySettings> & Record<string, unknown>;
  const rawEvaluation = (source.evaluation ?? {}) as Partial<Evaluation> & Record<string, unknown>;
  const rawDimensions = (rawEvaluation.dimensions ?? {}) as Record<string, unknown>;
  const allowedProtectedSections: ProtectedSectionId[] = [...ALL_PROTECTED_SECTIONS];
  const protectedSections = Array.isArray(rawSecurity.protectedSections)
    ? rawSecurity.protectedSections
        .map(String)
        .filter((section): section is ProtectedSectionId =>
          allowedProtectedSections.includes(section as ProtectedSectionId),
        )
    : [...DEFAULT_PROTECTED_SECTIONS];
  const customProtectedPaths = Array.isArray(rawSecurity.customProtectedPaths)
    ? rawSecurity.customProtectedPaths
        .map(String)
        .map(normalizeCustomProtectedPath)
        .filter((path): path is string => Boolean(path))
    : [];
  const rawAutoLockMinutes = finiteNumber(rawSecurity.autoLockMinutes, 15);
  const autoLockMinutes = ([5, 15, 30, 60, 9999] as const).includes(
    rawAutoLockMinutes as 5 | 15 | 30 | 60 | 9999,
  )
    ? (rawAutoLockMinutes as 5 | 15 | 30 | 60 | 9999)
    : 15;

  return {
    version: 7,
    updatedAt: String(source.updatedAt || new Date().toISOString()),
    internships,
    activeInternshipId: internships.some((stage) => stage.id === activeInternshipId)
      ? activeInternshipId
      : internships[0].id,
    entries,
    objectives,
    notes,
    trash: Array.isArray(source.trash) ? (source.trash as TrashItem[]) : [],
    settings: {
      ...fallback.settings,
      name: String(rawSettings.name || ""),
      program: String(rawSettings.program || ""),
      email: String(rawSettings.email || ""),
      phone: String(rawSettings.phone || ""),
      school: String(rawSettings.school || ""),
      graduationYear: String(rawSettings.graduationYear || ""),
      bio: String(rawSettings.bio || ""),
      careerGoal: String(rawSettings.careerGoal || ""),
      portfolioUrl: String(rawSettings.portfolioUrl || ""),
      linkedinUrl: String(rawSettings.linkedinUrl || ""),
      timezone: String(rawSettings.timezone || "America/Toronto"),
      emailUpdates: rawSettings.emailUpdates !== false,
      weeklyDigest: rawSettings.weeklyDigest !== false,
      securityAlerts: rawSettings.securityAlerts !== false,
      theme:
        rawSettings.theme === "light" || rawSettings.theme === "dark"
          ? rawSettings.theme
          : rawSettings.darkMode
            ? "dark"
            : "system",
      themePreset:
        rawSettings.themePreset === "slate" ||
        rawSettings.themePreset === "forest" ||
        rawSettings.themePreset === "plum" ||
        rawSettings.themePreset === "sunrise"
          ? rawSettings.themePreset
          : "ocean",
      accentColor: String(rawSettings.accentColor || fallback.settings.accentColor),
      compactMode: Boolean(rawSettings.compactMode),
      currency:
        rawSettings.currency === "USD" ||
        rawSettings.currency === "EUR" ||
        rawSettings.currency === "GBP" ||
        rawSettings.currency === "XAF" ||
        rawSettings.currency === "CHF" ||
        rawSettings.currency === "JPY"
          ? rawSettings.currency
          : "CAD",
      country:
        rawSettings.country === "US" || rawSettings.country === "FR" || rawSettings.country === "CM"
          ? rawSettings.country
          : "CA",
      region: String(rawSettings.region || "QC"),
      dateFormat:
        rawSettings.dateFormat === "dd/MM/yyyy" || rawSettings.dateFormat === "MM/dd/yyyy"
          ? rawSettings.dateFormat
          : "yyyy-MM-dd",
      weekStartsOn: rawSettings.weekStartsOn === 0 ? 0 : 1,
      defaultPageSize:
        rawSettings.defaultPageSize === 25 ||
        rawSettings.defaultPageSize === 50 ||
        rawSettings.defaultPageSize === 100
          ? rawSettings.defaultPageSize
          : 10,
      holidayCalendar: rawSettings.holidayCalendar !== false,
      remindersEnabled: rawSettings.remindersEnabled !== false,
      locale: (["fr", "en", "es", "pt", "de", "it", "ar"] as const).includes(rawSettings.locale as never)
        ? (rawSettings.locale as UserSettings["locale"])
        : "fr",
      security: {
        enabled: Boolean(rawSecurity.enabled && rawSecurity.pinHash),
        pinHash: String(rawSecurity.pinHash || ""),
        pinLength: Math.min(8, Math.max(4, finiteNumber(rawSecurity.pinLength, 4))),
        protectedSections: protectedSections.length
          ? protectedSections
          : [...DEFAULT_PROTECTED_SECTIONS],
        customProtectedPaths: [...new Set(customProtectedPaths)],
        autoLockMinutes,
      },
    },
    salary: {
      rate: finiteNumber(rawSalary.rate, 15),
      type: rawSalary.type === "daily" ? "daily" : "hourly",
      dailyRate: finiteNumber(rawSalary.dailyRate ?? rawSalary.daily, 120),
      incomeTaxPercent: finiteNumber(
        rawSalary.incomeTaxPercent ?? rawSalary.deductionPercent ?? rawSalary.deduct,
        14,
      ),
      pensionPercent: finiteNumber(rawSalary.pensionPercent, 5.95),
      employmentInsurancePercent: finiteNumber(rawSalary.employmentInsurancePercent, 1.66),
      otherDeductionPercent: finiteNumber(rawSalary.otherDeductionPercent, 0),
      vacationPayPercent: finiteNumber(rawSalary.vacationPayPercent, 0),
      from: String(rawSalary.from || ""),
      to: String(rawSalary.to || ""),
    },
    evaluation: {
      stars: boundedScore(rawEvaluation.stars ?? rawSettings.evalStar, 0),
      comments: String(rawEvaluation.comments ?? rawSettings.evalComments ?? ""),
      skills: Array.isArray(rawEvaluation.skills)
        ? rawEvaluation.skills.map(String)
        : Array.isArray(rawSettings.evalSkills)
          ? rawSettings.evalSkills.map(String)
          : [],
      grade: String(rawEvaluation.grade ?? rawSettings.evalGrade ?? ""),
      strengths: String(rawEvaluation.strengths || ""),
      improvements: String(rawEvaluation.improvements || ""),
      supervisorFeedback: String(rawEvaluation.supervisorFeedback || ""),
      dimensions: {
        technical: boundedScore(rawDimensions.technical),
        communication: boundedScore(rawDimensions.communication),
        autonomy: boundedScore(rawDimensions.autonomy),
        organization: boundedScore(rawDimensions.organization),
        collaboration: boundedScore(rawDimensions.collaboration),
        problemSolving: boundedScore(rawDimensions.problemSolving),
      },
    },
  };
}

type StageLogContextValue = {
  data: StageLogData;
  ready: boolean;
  syncStatus: SyncStatus;
  lastSavedAt: string | null;
  cloudEnabled: boolean;
  activeInternship: Internship;
  activeEntries: JournalEntry[];
  activeObjectives: Objective[];
  activeNotes: Note[];
  replaceData: (next: StageLogData) => void;
  importLegacy: (payload: unknown) => void;
  setActiveInternship: (id: string) => void;
  addInternship: (input: Omit<Internship, "id" | "createdAt">) => string;
  updateInternship: (id: string, input: Partial<Internship>) => void;
  deleteInternship: (id: string) => void;
  addEntry: (input: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">) => string;
  updateEntry: (id: string, input: Partial<JournalEntry>) => void;
  deleteEntry: (id: string) => void;
  addObjective: (input: Omit<Objective, "id" | "createdAt">) => string;
  updateObjective: (id: string, input: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  addNote: (input: Omit<Note, "id" | "createdAt" | "updatedAt">) => string;
  updateNote: (id: string, input: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  restoreTrashItem: (id: string) => void;
  permanentlyDeleteTrashItem: (id: string) => void;
  updateSettings: (input: Partial<UserSettings>) => void;
  updateSalary: (input: Partial<SalarySettings>) => void;
  updateEvaluation: (input: Partial<Evaluation>) => void;
  resetAllData: () => void;
};

const StageLogContext = createContext<StageLogContextValue | null>(null);

async function upsertCloudSnapshot(userId: string, payload: StageLogData) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: new Error("Supabase unavailable") };
  const row = { user_id: userId, payload, updated_at: new Date().toISOString() };
  const primary = await supabase.from(BRAND.snapshotTable).upsert(row);
  if (!primary.error) return primary;
  return supabase.from(BRAND.legacySnapshotTable).upsert(row);
}

async function readCloudSnapshot(userId: string) {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const primary = await supabase
    .from(BRAND.snapshotTable)
    .select("payload, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (!primary.error && primary.data?.payload) return primary.data;
  const legacy = await supabase
    .from(BRAND.legacySnapshotTable)
    .select("payload, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  return legacy.error ? null : legacy.data;
}

export function StageLogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StageLogData>(() => createDefaultData());
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("local");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const cloudEnabled = isSupabaseConfigured();
  const skipNextPersist = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudLoaded = useRef(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      let parsed: StageLogData | null = null;
      try {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) parsed = normalizePracticoraData(JSON.parse(current));
        if (!parsed) {
          for (const key of LEGACY_KEYS) {
            const legacy = localStorage.getItem(key);
            if (!legacy) continue;
            parsed = normalizePracticoraData(JSON.parse(legacy));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            break;
          }
        }
      } catch (error) {
        console.error("Unable to restore Practicora data", error);
      }

      if (parsed) {
        skipNextPersist.current = true;
        setData(parsed);
        setLastSavedAt(parsed.updatedAt);
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    const persistTimer = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const next = { ...data, version: 7 as const, updatedAt: savedAt };
      setSyncStatus("saving");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setLastSavedAt(savedAt);
        setSyncStatus(cloudEnabled ? "syncing" : "local");
      } catch (error) {
        console.error("Unable to save Practicora data locally", error);
        setSyncStatus("error");
        return;
      }

      if (!cloudEnabled) return;

      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(async () => {
        const supabase = getSupabaseBrowserClient();
        if (!supabase) return;
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) {
          setSyncStatus("local");
          return;
        }

        setSyncStatus("syncing");
        const result = await upsertCloudSnapshot(user.id, next);
        setSyncStatus(result.error ? "error" : "synced");
        if (!result.error) setLastSavedAt(savedAt);
      }, 750);
    }, 0);

    return () => {
      window.clearTimeout(persistTimer);
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [cloudEnabled, data, ready]);

  useEffect(() => {
    if (!ready || !cloudEnabled || cloudLoaded.current) return;
    cloudLoaded.current = true;
    let cancelled = false;

    async function loadCloud() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) return;

      const snapshot = await readCloudSnapshot(user.id);
      if (cancelled || !snapshot?.payload) return;
      const remote = normalizePracticoraData(snapshot.payload);
      const localTimestamp = new Date(data.updatedAt).getTime();
      const remoteTimestamp = new Date(snapshot.updated_at || remote.updatedAt).getTime();
      if (remoteTimestamp > localTimestamp) {
        skipNextPersist.current = true;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
        setData(remote);
        setLastSavedAt(remote.updatedAt);
      }
      setSyncStatus("synced");
    }

    void loadCloud();
    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, data.updatedAt, ready]);

  const commit = useCallback((recipe: (current: StageLogData) => StageLogData) => {
    setData((current) => ({
      ...recipe(current),
      version: 7,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const activeInternship =
    data.internships.find((stage) => stage.id === data.activeInternshipId) ?? data.internships[0];
  const activeEntries = useMemo(
    () => data.entries.filter((entry) => entry.internshipId === activeInternship.id),
    [activeInternship.id, data.entries],
  );
  const activeObjectives = useMemo(
    () => data.objectives.filter((objective) => objective.internshipId === activeInternship.id),
    [activeInternship.id, data.objectives],
  );
  const activeNotes = useMemo(
    () => data.notes.filter((note) => note.internshipId === activeInternship.id),
    [activeInternship.id, data.notes],
  );

  const value = useMemo<StageLogContextValue>(
    () => ({
      data,
      ready,
      syncStatus,
      lastSavedAt,
      cloudEnabled,
      activeInternship,
      activeEntries,
      activeObjectives,
      activeNotes,
      replaceData: (next) => setData(normalizePracticoraData(next)),
      importLegacy: (payload) => {
        setData(normalizePracticoraData(payload));
        toast.success(t(currentInterfaceLocale(), "common.misc.import_success"));
      },
      setActiveInternship: (id) =>
        commit((current) => ({ ...current, activeInternshipId: id })),
      addInternship: (input) => {
        const id = uid("internship");
        commit((current) => ({
          ...current,
          activeInternshipId: id,
          internships: [
            ...current.internships,
            { ...input, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },
      updateInternship: (id, input) =>
        commit((current) => ({
          ...current,
          internships: current.internships.map((stage) =>
            stage.id === id ? { ...stage, ...input } : stage,
          ),
        })),
      deleteInternship: (id) =>
        commit((current) => {
          if (current.internships.length <= 1) return current;
          const remaining = current.internships.filter((stage) => stage.id !== id);
          return {
            ...current,
            internships: remaining,
            activeInternshipId:
              current.activeInternshipId === id ? remaining[0].id : current.activeInternshipId,
            entries: current.entries.filter((entry) => entry.internshipId !== id),
            objectives: current.objectives.filter((objective) => objective.internshipId !== id),
            notes: current.notes.filter((note) => note.internshipId !== id),
          };
        }),
      addEntry: (input) => {
        const id = uid("entry");
        const timestamp = new Date().toISOString();
        commit((current) => ({
          ...current,
          entries: [
            ...current.entries,
            { ...input, id, createdAt: timestamp, updatedAt: timestamp },
          ],
        }));
        return id;
      },
      updateEntry: (id, input) =>
        commit((current) => ({
          ...current,
          entries: current.entries.map((entry) =>
            entry.id === id
              ? { ...entry, ...input, updatedAt: new Date().toISOString() }
              : entry,
          ),
        })),
      deleteEntry: (id) =>
        commit((current) => {
          const entry = current.entries.find((item) => item.id === id);
          if (!entry) return current;
          return {
            ...current,
            entries: current.entries.filter((item) => item.id !== id),
            trash: [
              {
                id: uid("trash"),
                type: "entry",
                deletedAt: new Date().toISOString(),
                payload: entry,
              },
              ...current.trash,
            ],
          };
        }),
      addObjective: (input) => {
        const id = uid("objective");
        commit((current) => ({
          ...current,
          objectives: [
            ...current.objectives,
            { ...input, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },
      updateObjective: (id, input) =>
        commit((current) => ({
          ...current,
          objectives: current.objectives.map((objective) =>
            objective.id === id ? { ...objective, ...input } : objective,
          ),
        })),
      deleteObjective: (id) =>
        commit((current) => {
          const objective = current.objectives.find((item) => item.id === id);
          if (!objective) return current;
          return {
            ...current,
            objectives: current.objectives.filter((item) => item.id !== id),
            trash: [
              {
                id: uid("trash"),
                type: "objective",
                deletedAt: new Date().toISOString(),
                payload: objective,
              },
              ...current.trash,
            ],
          };
        }),
      addNote: (input) => {
        const id = uid("note");
        const timestamp = new Date().toISOString();
        commit((current) => ({
          ...current,
          notes: [
            ...current.notes,
            { ...input, id, createdAt: timestamp, updatedAt: timestamp },
          ],
        }));
        return id;
      },
      updateNote: (id, input) =>
        commit((current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === id
              ? { ...note, ...input, updatedAt: new Date().toISOString() }
              : note,
          ),
        })),
      deleteNote: (id) =>
        commit((current) => {
          const note = current.notes.find((item) => item.id === id);
          if (!note) return current;
          return {
            ...current,
            notes: current.notes.filter((item) => item.id !== id),
            trash: [
              {
                id: uid("trash"),
                type: "note",
                deletedAt: new Date().toISOString(),
                payload: note,
              },
              ...current.trash,
            ],
          };
        }),
      restoreTrashItem: (id) =>
        commit((current) => {
          const item = current.trash.find((entry) => entry.id === id);
          if (!item) return current;
          return {
            ...current,
            entries:
              item.type === "entry"
                ? [...current.entries, item.payload as JournalEntry]
                : current.entries,
            objectives:
              item.type === "objective"
                ? [...current.objectives, item.payload as Objective]
                : current.objectives,
            notes:
              item.type === "note"
                ? [...current.notes, item.payload as Note]
                : current.notes,
            trash: current.trash.filter((entry) => entry.id !== id),
          };
        }),
      permanentlyDeleteTrashItem: (id) =>
        commit((current) => ({
          ...current,
          trash: current.trash.filter((entry) => entry.id !== id),
        })),
      updateSettings: (input) =>
        commit((current) => ({
          ...current,
          settings: { ...current.settings, ...input },
        })),
      updateSalary: (input) =>
        commit((current) => ({
          ...current,
          salary: { ...current.salary, ...input },
        })),
      updateEvaluation: (input) =>
        commit((current) => ({
          ...current,
          evaluation: {
            ...current.evaluation,
            ...input,
            dimensions: input.dimensions
              ? { ...current.evaluation.dimensions, ...input.dimensions }
              : current.evaluation.dimensions,
          },
        })),
      resetAllData: () => {
        const next = createDefaultData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setData(next);
        setLastSavedAt(next.updatedAt);
      },
    }),
    [
      activeEntries,
      activeInternship,
      activeNotes,
      activeObjectives,
      cloudEnabled,
      commit,
      data,
      lastSavedAt,
      ready,
      syncStatus,
    ],
  );

  return <StageLogContext.Provider value={value}>{children}</StageLogContext.Provider>;
}

export function useStageLog() {
  const context = useContext(StageLogContext);
  if (!context) throw new Error("useStageLog must be used within StageLogProvider");
  return context;
}

/** Preferred product-facing alias kept alongside the legacy hook name. */
export const usePracticora = useStageLog;

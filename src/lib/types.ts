export type Locale = "fr" | "en" | "es" | "pt" | "de" | "it" | "ar";
export type ThemeMode = "light" | "dark" | "system";
export type ThemePreset = "ocean" | "slate" | "forest" | "plum" | "sunrise";
export type CountryCode = "CA" | "US" | "FR" | "CM";
export type CurrencyCode = "CAD" | "USD" | "EUR" | "GBP" | "XAF" | "CHF" | "JPY";
export type DateFormat = "yyyy-MM-dd" | "dd/MM/yyyy" | "MM/dd/yyyy";
export type SyncStatus = "local" | "saving" | "syncing" | "synced" | "error";
export type ProtectedSectionId =
  | "dashboard"
  | "week"
  | "calendar"
  | "journal"
  | "history"
  | "notes"
  | "objectives"
  | "skills"
  | "evaluation"
  | "analytics"
  | "internships"
  | "compensation"
  | "reports"
  | "account"
  | "settings"
  | "trash";
export type WorkMode = "onsite" | "remote" | "hybrid";
export type InternshipStatus = "planned" | "active" | "paused" | "completed";
export type JournalCategory =
  | "development"
  | "design"
  | "analysis"
  | "testing"
  | "support"
  | "meeting"
  | "learning"
  | "administration"
  | "other";
export type ObjectivePriority = "low" | "medium" | "high";
export type ObjectiveCategory =
  | "technical"
  | "communication"
  | "organization"
  | "autonomy"
  | "career"
  | "other";
export type NoteCategory = "general" | "meeting" | "idea" | "feedback" | "reference";

export type SecuritySettings = {
  enabled: boolean;
  pinHash: string;
  pinLength: number;
  protectedSections: ProtectedSectionId[];
  customProtectedPaths: string[];
  autoLockMinutes: 5 | 15 | 30 | 60 | 9999;
};

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  priority: ObjectivePriority;
  type: "development" | "communication" | "research" | "meeting" | "admin" | "other";
};

export type EvidenceLink = {
  id: string;
  label: string;
  url: string;
};

export type JournalAttachment = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: "image" | "document";
  createdAt: string;
};

export type Internship = {
  id: string;
  name: string;
  company: string;
  role: string;
  department: string;
  industry: string;
  location: string;
  workMode: WorkMode;
  status: InternshipStatus;
  supervisor: string;
  supervisorEmail: string;
  supervisorPhone: string;
  school: string;
  teacher: string;
  teacherEmail: string;
  description: string;
  startDate: string;
  endDate: string;
  goalHours: number;
  weeklyGoalHours: number;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  internshipId: string;
  date: string;
  start: string;
  end: string;
  breakMinutes: number;
  hours: number;
  location: string;
  workMode: WorkMode;
  project: string;
  category: JournalCategory;
  workDone: string;
  achievements: string;
  learned: string;
  difficulties: string;
  blockers: string;
  feedback: string;
  nextSteps: string;
  notes: string;
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  focus: 1 | 2 | 3 | 4 | 5;
  satisfaction: 1 | 2 | 3 | 4 | 5;
  todos: TodoItem[];
  tags: string[];
  evidenceLinks: EvidenceLink[];
  attachments: JournalAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type Objective = {
  id: string;
  internshipId: string;
  title: string;
  description: string;
  category: ObjectiveCategory;
  priority: ObjectivePriority;
  progress: number;
  successMetric: string;
  deadline: string;
  completed: boolean;
  createdAt: string;
};

export type Note = {
  id: string;
  internshipId: string;
  title: string;
  content: string;
  category: NoteCategory;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SalarySettings = {
  rate: number;
  type: "hourly" | "daily";
  dailyRate: number;
  incomeTaxPercent: number;
  pensionPercent: number;
  employmentInsurancePercent: number;
  otherDeductionPercent: number;
  vacationPayPercent: number;
  from: string;
  to: string;
};

export type EvaluationDimensions = {
  technical: number;
  communication: number;
  autonomy: number;
  organization: number;
  collaboration: number;
  problemSolving: number;
};

export type Evaluation = {
  stars: number;
  comments: string;
  skills: string[];
  grade: string;
  strengths: string;
  improvements: string;
  supervisorFeedback: string;
  dimensions: EvaluationDimensions;
};

export type UserSettings = {
  name: string;
  program: string;
  email: string;
  phone: string;
  school: string;
  graduationYear: string;
  bio: string;
  careerGoal: string;
  portfolioUrl: string;
  linkedinUrl: string;
  timezone: string;
  emailUpdates: boolean;
  weeklyDigest: boolean;
  securityAlerts: boolean;
  theme: ThemeMode;
  themePreset: ThemePreset;
  accentColor: string;
  compactMode: boolean;
  currency: CurrencyCode;
  country: CountryCode;
  region: string;
  dateFormat: DateFormat;
  weekStartsOn: 0 | 1;
  defaultPageSize: 10 | 25 | 50 | 100;
  holidayCalendar: boolean;
  remindersEnabled: boolean;
  locale: Locale;
  security: SecuritySettings;
};

export type TrashItem = {
  id: string;
  type: "entry" | "objective" | "note";
  deletedAt: string;
  payload: JournalEntry | Objective | Note;
};

export type StageLogData = {
  version: 7;
  updatedAt: string;
  internships: Internship[];
  activeInternshipId: string;
  entries: JournalEntry[];
  objectives: Objective[];
  notes: Note[];
  trash: TrashItem[];
  settings: UserSettings;
  salary: SalarySettings;
  evaluation: Evaluation;
};

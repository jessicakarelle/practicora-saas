import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  const value = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${value}`;
}

export function toDateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function calculateHours(start: string, end: string, breakMinutes: number) {
  if (!start || !end) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute) - breakMinutes;
  return Math.max(0, Math.round((minutes / 60) * 100) / 100);
}

export function formatHours(value: number) {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const totalMinutes = Math.round(safeValue * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}

export function downloadText(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

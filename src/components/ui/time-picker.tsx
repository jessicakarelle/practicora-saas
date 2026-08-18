"use client";

import { translate as t } from "@/i18n";

import { Clock3 } from "lucide-react";
import { Select, type SelectOption } from "@/components/ui/select";

function buildTimeOptions(value: string, locale: string): SelectOption[] {
  const values = new Set<string>();
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      values.add(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  if (/^\d{2}:\d{2}$/.test(value)) values.add(value);

  return [...values]
    .sort()
    .map((time) => {
      const [hour, minute] = time.split(":").map(Number);
      const date = new Date(2026, 0, 1, hour, minute);
      return {
        value: time,
        label: new Intl.DateTimeFormat(t(locale, "common.time-picker.en_ca"), {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(date),
      };
    });
}

type TimePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  locale?: string;
  ariaLabel?: string;
  className?: string;
};

export function TimePicker({ id, value, onChange, locale = "fr", ariaLabel, className }: TimePickerProps) {
  return (
    <Select
      id={id}
      value={value}
      onValueChange={onChange}
      options={buildTimeOptions(value, locale)}
      placeholder={t(locale, "common.time-picker.choose_a_time")}
      ariaLabel={ariaLabel}
      startIcon={<Clock3 className="size-4.5" />}
      className={className}
    />
  );
}

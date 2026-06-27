"use client";

import * as React from "react";
import { DatePicker } from "noa-jalali-datepicker";
import { toJalali, toGregorian, toPersianDigits, JALALI_MONTHS } from "@/lib/jalali";
import "noa-jalali-datepicker/dist/index.css";

/* ------------------------------------------------------------------ */
/*  Gregorian ↔ Jalali "YYYY/MM/DD" conversion helpers                */
/* ------------------------------------------------------------------ */

/** Gregorian ISO "2025-01-15" or "2025-01-15T10:30:00Z" → Jalali "1403/10/25" */
function gregorianToJalaliStr(gregorian: string | null | undefined): string | null {
  if (!gregorian) return null;
  const d = new Date(gregorian);
  if (isNaN(d.getTime())) return null;
  const [jy, jm, jd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

/** Jalali "1403/10/25" → Gregorian ISO "2025-01-15T00:00:00.000Z" */
function jalaliStrToGregorian(jalali: string): string {
  const [jy, jm, jd] = jalali.split("/").map(Number);
  const [gy, gm, gd] = toGregorian(jy, jm, jd);
  // Return YYYY-MM-DD for date-only fields
  return `${gy}-${String(gm).padStart(2, "0")}-${String(gd).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface JalaliDatePickerProps {
  /** Gregorian ISO date string, e.g. "2025-01-15" or "2025-01-15T10:30:00Z" */
  value: string;
  /** Called with Gregorian ISO "YYYY-MM-DD" when user picks a date */
  onChange: (gregorianDate: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Disabled state */
  disabled?: boolean;
  /** Additional class for the container */
  className?: string;
  /** Additional class for the input */
  inputClassName?: string;
}

/**
 * Wrapper around noa-jalali-datepicker that handles
 * Gregorian ↔ Jalali conversion transparently.
 */
export function JalaliDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  size = "md",
  disabled = false,
  className,
  inputClassName,
}: JalaliDatePickerProps) {
  // Convert incoming Gregorian value to Jalali string for the picker
  const jalaliValue = React.useMemo(() => gregorianToJalaliStr(value), [value]);

  function handleChange(jalaliDate: string) {
    const gregorian = jalaliStrToGregorian(jalaliDate);
    onChange(gregorian);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <style>{`
        /* Dark mode overrides for the datepicker */
        .dark .datepicker-popup {
          background-color: hsl(var(--popover)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--popover-foreground)) !important;
        }
        .dark .datepicker-dropdown {
          background-color: hsl(var(--popover)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--popover-foreground)) !important;
        }
        .dark .datepicker-day:hover {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        .dark .datepicker-month:hover,
        .dark .datepicker-year:hover {
          background-color: hsl(var(--accent)) !important;
        }
        .dark .datepicker-input {
          background-color: transparent !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .dark .datepicker-month,
        .dark .datepicker-year {
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--popover-foreground)) !important;
        }
        /* Light mode border/bg fixes */
        .datepicker-input {
          background-color: transparent !important;
          border-color: hsl(var(--border)) !important;
          border-radius: var(--radius) !important;
          padding: 0.5rem 0.75rem !important;
          font-size: 0.875rem !important;
          width: 100% !important;
          box-sizing: border-box !important;
          outline: none !important;
          margin-bottom: 0 !important;
        }
        .datepicker-input:focus {
          border-color: hsl(var(--ring)) !important;
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2) !important;
        }
        .datepicker-popup {
          border-radius: var(--radius) !important;
          background-color: hsl(var(--popover)) !important;
          border-color: hsl(var(--border)) !important;
          color: hsl(var(--popover-foreground)) !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        .datepicker-day {
          border-radius: 50% !important;
          font-size: 0.8rem !important;
        }
        .datepicker-week {
          font-size: 0.7rem !important;
        }
        .datepicker-arrow {
          border-radius: 50% !important;
        }
        .datepicker-arrow:hover {
          background-color: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        .datepicker-header-month:hover,
        .datepicker-header-year:hover {
          opacity: 0.7;
        }
      `}</style>
      <DatePicker
        value={jalaliValue}
        onChange={handleChange}
        placeholderText={placeholder}
        size={size}
        dir="rtl"
        inputClassName={inputClassName}
      />
    </div>
  );
}
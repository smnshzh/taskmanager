"use client";

import * as React from "react";
import { DatePicker } from "noa-jalali-datepicker";
import { toGregorian } from "@/lib/jalali";
import "noa-jalali-datepicker/dist/index.css";

/* ------------------------------------------------------------------ */
/*  Jalali "1403/10/25" → Gregorian ISO "2025-01-15"                   */
/* ------------------------------------------------------------------ */

function jalaliStrToGregorian(jalali: string): string {
  const [jy, jm, jd] = jalali.split("/").map(Number);
  const [gy, gm, gd] = toGregorian(jy, jm, jd);
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
 *
 * The underlying component uses moment-jalaali internally.
 * It can parse Gregorian ISO strings correctly, but NOT bare
 * Jalali strings like "1405/04/10".  So we pass the raw
 * Gregorian value through — moment-jalaali converts it for
 * display automatically.  On selection we convert the returned
 * Jalali string back to Gregorian for the caller.
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
  // Pass the Gregorian ISO string directly — moment-jalaali will
  // display it as Jalali.  Only convert empty → null.
  const pickerValue = value ? value.slice(0, 10) : null;

  function handleChange(jalaliDate: string) {
    const gregorian = jalaliStrToGregorian(jalaliDate);
    onChange(gregorian);
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <style>{`
        /* Dark mode overrides */
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
        /* Shared overrides */
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
        value={pickerValue}
        onChange={handleChange}
        placeholderText={placeholder}
        size={size}
        dir="rtl"
        inputClassName={inputClassName}
      />
    </div>
  );
}
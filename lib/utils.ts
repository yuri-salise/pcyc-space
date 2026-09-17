import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names cleanly with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric currency value into Philippine Peso (PHP).
 * @example formatPHP(1500) => "₱1,500.00"
 */
export function formatPHP(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num || 0);
}

export const formatCurrency = formatPHP;

/**
 * Safely parses any date input into a Date object anchored to Philippine Standard Time (UTC+8).
 * Prevents host/client environment timezone drift (e.g. UTC, US Pacific) from shifting day or hour boundaries.
 */
export function parsePhilippineDateObject(d: Date | string): Date {
  if (d instanceof Date) return d;
  if (typeof d !== 'string') return new Date(NaN);
  const trimmed = d.trim();
  if (!trimmed) return new Date(NaN);

  // Date-only string (YYYY-MM-DD): anchor to midnight in Manila (+08:00)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00+08:00`);
  }

  // If already contains timezone offset (Z or +/-HH:MM after a time component)
  if (trimmed.endsWith('Z') || /[T ]\d{2}:\d{2}.*(?:[+-]\d{2}(?::?\d{2})?)$/.test(trimmed)) {
    return new Date(trimmed);
  }

  // ISO or space-separated date & time without offset: append +08:00
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)$/);
  if (match) {
    const time = match[2].length === 5 ? `${match[2]}:00` : match[2];
    return new Date(`${match[1]}T${time}+08:00`);
  }

  return new Date(trimmed);
}

/**
 * Formats a Date object or ISO string into a human-readable Philippine date & time format.
 */
export function formatDate(date: Date | string): string {
  const d = parsePhilippineDateObject(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Formats only the date portion (e.g. "Aug 15, 2026").
 */
export function formatDateOnly(date: Date | string): string {
  const d = parsePhilippineDateObject(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
  }).format(d);
}

/**
 * Formats only the time portion (e.g. "8:00 AM").
 */
export function formatTimeOnly(date: Date | string): string {
  const d = parsePhilippineDateObject(date);
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Formats a full event schedule with start and end times cleanly in Philippine timezone.
 * @example Same day: "Aug 15, 2026 • 8:00 AM – 5:00 PM"
 * @example Multi day: "Aug 15, 2026, 8:00 AM – Aug 17, 2026, 5:00 PM"
 */
export function formatEventSchedule(startDate: Date | string, endDate: Date | string): string {
  const s = parsePhilippineDateObject(startDate);
  const e = parsePhilippineDateObject(endDate);

  if (isNaN(s.getTime()) || isNaN(e.getTime())) return '';

  const sDateStr = formatDateForDateInput(s);
  const eDateStr = formatDateForDateInput(e);
  const isSameDay = sDateStr === eDateStr;

  if (isSameDay) {
    const sTime = formatTimeOnly(s);
    const eTime = formatTimeOnly(e);
    if (sTime === eTime) {
      return `${formatDateOnly(s)} • ${sTime}`;
    }
    return `${formatDateOnly(s)} • ${sTime} – ${eTime}`;
  }

  return `${formatDate(s)} – ${formatDate(e)}`;
}

/**
 * Helper for HTML date inputs (YYYY-MM-DD) in Philippine Timezone
 */
export function formatDateForDateInput(d: Date | string): string {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) {
    return d.trim();
  }
  const date = parsePhilippineDateObject(d);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Helper for HTML time inputs (HH:mm) in Philippine Timezone
 */
export function formatTimeForTimeInput(d: Date | string): string {
  if (!d) return '08:00';
  if (typeof d === 'string') {
    const trimmed = d.trim();
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const parts = trimmed.split(':');
      return `${parts[0].padStart(2, '0')}:${parts[1]}`;
    }
  }

  const date = parsePhilippineDateObject(d);
  if (isNaN(date.getTime())) return '08:00';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

/**
 * Formats a Date into a human-friendly relative time string (e.g. "just now", "5m ago", "2h ago", "3d ago").
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return formatDateOnly(d);
}


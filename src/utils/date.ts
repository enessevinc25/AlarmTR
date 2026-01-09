/**
 * Date formatting utilities for Firestore Timestamps
 * 
 * Handles multiple timestamp formats:
 * - Firestore Timestamp objects ({ toDate(): Date })
 * - Unix timestamps (number in milliseconds)
 * - null/undefined values
 */

export type TimestampLike = number | { toDate(): Date } | null | undefined;

/**
 * Converts a TimestampLike value to a Date object
 * @param value - Timestamp value (number, Firestore Timestamp, null, or undefined)
 * @returns Date object or null if value is invalid
 */
export function timestampToDate(value: TimestampLike): Date | null {
  if (!value) {
    return null;
  }
  
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  return null;
}

/**
 * Formats a TimestampLike value to a localized date string
 * @param value - Timestamp value (number, Firestore Timestamp, null, or undefined)
 * @param locale - Locale string (default: 'tr-TR')
 * @param options - Intl.DateTimeFormatOptions (default: date + time)
 * @returns Formatted date string or '-' if value is invalid
 */
export function formatDate(
  value: TimestampLike,
  locale: string = 'tr-TR',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = timestampToDate(value);
  if (!date) {
    return '-';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return date.toLocaleString(locale, options ?? defaultOptions);
}

/**
 * Formats a TimestampLike value to a date-only string (no time)
 * @param value - Timestamp value
 * @param locale - Locale string (default: 'tr-TR')
 * @returns Formatted date string or '-' if value is invalid
 */
export function formatDateOnly(value: TimestampLike, locale: string = 'tr-TR'): string {
  const date = timestampToDate(value);
  if (!date) {
    return '-';
  }
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formats a TimestampLike value to a time-only string (no date)
 * @param value - Timestamp value
 * @param locale - Locale string (default: 'tr-TR')
 * @returns Formatted time string or '-' if value is invalid
 */
export function formatTimeOnly(value: TimestampLike, locale: string = 'tr-TR'): string {
  const date = timestampToDate(value);
  if (!date) {
    return '-';
  }
  
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}


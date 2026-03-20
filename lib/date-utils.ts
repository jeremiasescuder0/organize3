/**
 * Converts a date string in YYYY-MM-DD format to a Date object in local timezone
 * This prevents the common issue where new Date("2025-10-23") creates a UTC date
 * that may display as the previous day in local timezone
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// Alias for consistency
export const parseDateLocal = parseLocalDate

/**
 * Formats a date string (YYYY-MM-DD) to a simple localized string
 */
export function formatDateLocal(dateString: string): string {
  const [year, month, day] = dateString.split("-")
  return `${day}/${month}/${year}`
}

/**
 * Formats a date string (YYYY-MM-DD) to a localized string
 */
export function formatLocalDate(dateString: string, options: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDate(dateString)
  return date.toLocaleDateString("es-ES", options)
}

/**
 * Calculates days between today and a target date string
 */
export function getDaysUntil(dateString: string): number {
  const targetDate = parseLocalDate(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  targetDate.setHours(0, 0, 0, 0)
  const diffTime = targetDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Checks if a date string is before today
 */
export function isBeforeToday(dateString: string): boolean {
  return getDaysUntil(dateString) < 0
}

/**
 * Utility functions for academic year management
 * Academic year format: YYYY-YYYY+1 (e.g., 2025-2026)
 */

/**
 * Get current academic year based on current date
 * Academic year starts from September (month 8, 0-indexed)
 * If current month >= September, academic year is currentYear-currentYear+1
 * Otherwise, academic year is previousYear-currentYear
 */
export function getCurrentAcademicYear(): string {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed (0 = January, 8 = September)

  // Academic year starts from September
  if (currentMonth >= 8) {
    // September onwards: current year to next year
    return `${currentYear}-${currentYear + 1}`
  } else {
    // Before September: previous year to current year
    return `${currentYear - 1}-${currentYear}`
  }
}

/**
 * Get academic year for a specific date
 */
export function getAcademicYearForDate(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() // 0-indexed

  if (month >= 8) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

/**
 * Parse academic year string to get start and end years
 */
export function parseAcademicYear(academicYear: string): { startYear: number; endYear: number } | null {
  const match = academicYear.match(/^(\d{4})-(\d{4})$/)
  if (!match) {
    return null
  }

  const startYear = parseInt(match[1], 10)
  const endYear = parseInt(match[2], 10)

  if (endYear !== startYear + 1) {
    return null
  }

  return { startYear, endYear }
}

/**
 * Get list of academic years (from oldest to newest)
 */
export function getAcademicYearRange(startYear: number, endYear: number): string[] {
  const years: string[] = []
  for (let year = startYear; year < endYear; year++) {
    years.push(`${year}-${year + 1}`)
  }
  return years
}


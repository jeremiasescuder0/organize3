import type { RawCommission, RawCommissionSemester, ScheduleBlock, SubjectLegend } from "./types"

/**
 * Parse a time string "HH:MM" to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

/**
 * Check if two time slots are adjacent (end of one equals start of next,
 * or there's a short break of <= 10 minutes between them)
 */
function isAdjacent(endTime: string, startTime: string): boolean {
  const end = timeToMinutes(endTime)
  const start = timeToMinutes(startTime)
  return start - end <= 10 && start >= end
}

/**
 * Normalize a commission semester grid into merged schedule blocks.
 * Consecutive cells with the same subject on the same day get merged.
 */
export function normalizeSemester(
  semester: RawCommissionSemester,
  commissionCode: string,
  year: number,
  legend: SubjectLegend
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = []
  const { slots, grid } = semester
  const numDays = grid[0]?.length ?? 5

  for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
    const dayOfWeek = dayIdx + 1 // 1=Mon

    let currentCode = ""
    let blockStart = ""
    let blockEnd = ""

    for (let rowIdx = 0; rowIdx < grid.length; rowIdx++) {
      const cellCode = (grid[rowIdx]?.[dayIdx] ?? "").trim()
      const [slotStart, slotEnd] = slots[rowIdx] ?? ["", ""]

      if (!cellCode) {
        // Empty cell - flush current block
        if (currentCode) {
          blocks.push({
            subjectCode: currentCode,
            subjectName: legend[currentCode] ?? currentCode,
            dayOfWeek,
            startTime: blockStart,
            endTime: blockEnd,
            year,
            commissionCode,
          })
          currentCode = ""
        }
        continue
      }

      if (cellCode === currentCode && isAdjacent(blockEnd, slotStart)) {
        // Same subject, adjacent slot - extend block
        blockEnd = slotEnd
      } else {
        // Different subject or gap - flush previous and start new
        if (currentCode) {
          blocks.push({
            subjectCode: currentCode,
            subjectName: legend[currentCode] ?? currentCode,
            dayOfWeek,
            startTime: blockStart,
            endTime: blockEnd,
            year,
            commissionCode,
          })
        }
        currentCode = cellCode
        blockStart = slotStart
        blockEnd = slotEnd
      }
    }

    // Flush last block for this day
    if (currentCode) {
      blocks.push({
        subjectCode: currentCode,
        subjectName: legend[currentCode] ?? currentCode,
        dayOfWeek,
        startTime: blockStart,
        endTime: blockEnd,
        year,
        commissionCode,
      })
    }
  }

  return blocks
}

/**
 * Normalize a full commission (both semesters) into schedule blocks
 */
export function normalizeCommission(
  commission: RawCommission,
  legend: SubjectLegend
): { s1: ScheduleBlock[]; s2: ScheduleBlock[] } {
  return {
    s1: normalizeSemester(commission.s1, commission.code, commission.year, legend),
    s2: normalizeSemester(commission.s2, commission.code, commission.year, legend),
  }
}

/**
 * Detect time conflicts between schedule blocks
 */
export function detectConflicts(blocks: ScheduleBlock[]): [ScheduleBlock, ScheduleBlock][] {
  const conflicts: [ScheduleBlock, ScheduleBlock][] = []

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const b = blocks[j]

      if (a.dayOfWeek !== b.dayOfWeek) continue

      const aStart = timeToMinutes(a.startTime)
      const aEnd = timeToMinutes(a.endTime)
      const bStart = timeToMinutes(b.startTime)
      const bEnd = timeToMinutes(b.endTime)

      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push([a, b])
      }
    }
  }

  return conflicts
}

/**
 * Get the time range (earliest start, latest end) from a set of blocks
 */
export function getTimeRange(blocks: ScheduleBlock[]): { earliest: string; latest: string } {
  if (blocks.length === 0) return { earliest: "08:00", latest: "18:00" }

  let minMinutes = Infinity
  let maxMinutes = -Infinity

  for (const b of blocks) {
    const start = timeToMinutes(b.startTime)
    const end = timeToMinutes(b.endTime)
    if (start < minMinutes) minMinutes = start
    if (end > maxMinutes) maxMinutes = end
  }

  const earliest = `${String(Math.floor(minMinutes / 60)).padStart(2, "0")}:${String(minMinutes % 60).padStart(2, "0")}`
  const latest = `${String(Math.floor(maxMinutes / 60)).padStart(2, "0")}:${String(maxMinutes % 60).padStart(2, "0")}`

  return { earliest, latest }
}

export { timeToMinutes }

import type { RawCommission, SubjectLegend } from "../types"
import { year1Commissions } from "./year1"
import { year2Commissions } from "./year2"
import { year3Commissions } from "./year3"
import { year4Commissions } from "./year4"
import { year5Commissions } from "./year5"
import {
  LEGEND_1,
  LEGEND_2,
  LEGEND_3,
  LEGEND_4,
  LEGEND_5,
  ALL_LEGENDS,
} from "./legends"

export const ALL_COMMISSIONS: RawCommission[] = [
  ...year1Commissions,
  ...year2Commissions,
  ...year3Commissions,
  ...year4Commissions,
  ...year5Commissions,
]

export const LEGENDS_BY_YEAR: Record<number, SubjectLegend> = {
  1: LEGEND_1,
  2: LEGEND_2,
  3: LEGEND_3,
  4: LEGEND_4,
  5: LEGEND_5,
}

export { ALL_LEGENDS }

/** Get commissions filtered by year */
export function getCommissionsByYear(year: number): RawCommission[] {
  return ALL_COMMISSIONS.filter(c => c.year === year)
}

/** Get unique shifts for a given year */
export function getShiftsByYear(year: number): string[] {
  const shifts = new Set(getCommissionsByYear(year).map(c => c.shift))
  return Array.from(shifts)
}

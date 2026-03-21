// Schedule system types

export type TimeSlot = [string, string] // [startTime, endTime] e.g. ["08:00", "08:45"]

export interface RawCommissionSemester {
  slots: TimeSlot[]
  grid: string[][] // grid[row][col] - subject code or "" for empty
  days?: string[] // defaults to ["Lunes","Martes","Miércoles","Jueves","Viernes"]
}

export interface RawCommission {
  code: string
  year: number
  shift: string
  s1: RawCommissionSemester
  s2: RawCommissionSemester
}

export interface ScheduleBlock {
  subjectCode: string
  subjectName: string
  dayOfWeek: number // 1=Lunes, 2=Martes, ..., 6=Sábado
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
  year: number
  commissionCode: string
}

export interface Commission {
  code: string
  year: number
  shift: string
}

export interface SubjectLegend {
  [code: string]: string
}

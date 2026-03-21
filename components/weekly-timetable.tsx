"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Calendar, Settings2, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ALL_COMMISSIONS, LEGENDS_BY_YEAR } from "@/lib/schedule/data"
import { normalizeSemester, detectConflicts, getTimeRange, timeToMinutes } from "@/lib/schedule/normalize"
import type { ScheduleBlock } from "@/lib/schedule/types"
import { CommissionSelectorDialog } from "@/components/commission-selector-dialog"

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const PASTEL_COLORS = [
  "bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900",
  "bg-violet-100 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900",
  "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
  "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900",
  "bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900",
  "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900",
  "bg-pink-100 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-900",
  "bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-900",
  "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900",
  "bg-lime-100 dark:bg-lime-950/40 text-lime-800 dark:text-lime-300 border-lime-200 dark:border-lime-900",
]

function getColorForSubject(code: string, colorMap: Map<string, string>): string {
  if (!colorMap.has(code)) {
    colorMap.set(code, PASTEL_COLORS[colorMap.size % PASTEL_COLORS.length])
  }
  return colorMap.get(code)!
}

interface StudentCommission {
  commission_code: string
  year: number
  semester: number
}

export function WeeklyTimetable() {
  const [commission, setCommission] = useState<StudentCommission | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [semester, setSemester] = useState<1 | 2>(1)
  const supabase = createClient()

  useEffect(() => {
    loadCommission()
  }, [])

  async function loadCommission() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from("student_commissions")
      .select("commission_code, year, semester")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (data) {
      setCommission(data)
      setSemester(data.semester as 1 | 2)
    }
    setLoading(false)
  }

  async function saveCommission(code: string, year: number, sem: number) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Upsert - delete existing then insert
    await supabase.from("student_commissions").delete().eq("user_id", user.id)
    await supabase.from("student_commissions").insert({
      user_id: user.id,
      commission_code: code,
      year,
      semester: sem,
    })

    setCommission({ commission_code: code, year, semester: sem })
    setSemester(sem as 1 | 2)
    setSelectorOpen(false)
  }

  // Compute schedule blocks from static data
  const { blocks, conflicts, timeRange } = useMemo(() => {
    if (!commission) return { blocks: [], conflicts: [], timeRange: { earliest: "08:00", latest: "22:00" } }

    const raw = ALL_COMMISSIONS.find(c => c.code === commission.commission_code && c.year === commission.year)
    if (!raw) return { blocks: [], conflicts: [], timeRange: { earliest: "08:00", latest: "22:00" } }

    const legend = LEGENDS_BY_YEAR[commission.year] ?? {}
    const semData = semester === 1 ? raw.s1 : raw.s2
    const blocks = normalizeSemester(semData, raw.code, raw.year, legend)
    const conflicts = detectConflicts(blocks)
    const timeRange = getTimeRange(blocks)

    return { blocks, conflicts, timeRange }
  }, [commission, semester])

  // Build time grid
  const { hours, pixelsPerMinute, totalHeight } = useMemo(() => {
    const startHour = Math.floor(timeToMinutes(timeRange.earliest) / 60)
    const endHour = Math.ceil(timeToMinutes(timeRange.latest) / 60)
    const hours: number[] = []
    for (let h = startHour; h <= endHour; h++) hours.push(h)
    const totalHeight = hours.length * 60 * 1.2
    return { hours, pixelsPerMinute: 1.2, totalHeight }
  }, [timeRange])

  const colorMap = useMemo(() => new Map<string, string>(), [commission, semester])

  // Determine which days have blocks
  const activeDays = useMemo(() => {
    const days = new Set(blocks.map(b => b.dayOfWeek))
    // Always show Mon-Fri minimum
    for (let d = 1; d <= 5; d++) days.add(d)
    return Array.from(days).sort()
  }, [blocks])

  const conflictSet = useMemo(() => {
    const set = new Set<ScheduleBlock>()
    for (const [a, b] of conflicts) { set.add(a); set.add(b) }
    return set
  }, [conflicts])

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardContent className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!commission) {
    return (
      <>
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">No tenés una comisión seleccionada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Elegí tu comisión para ver tu horario semanal
              </p>
            </div>
            <Button onClick={() => setSelectorOpen(true)} className="gap-2">
              <Settings2 className="h-4 w-4" />
              Elegir comisión
            </Button>
          </CardContent>
        </Card>
        <CommissionSelectorDialog
          open={selectorOpen}
          onOpenChange={setSelectorOpen}
          onSelect={saveCommission}
        />
      </>
    )
  }

  const gridStartMinutes = hours[0] * 60

  return (
    <>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold">Horario Semanal</CardTitle>
              <Badge variant="outline" className="text-xs font-normal">
                {commission.commission_code} · {commission.year}° año
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(semester)}
                onValueChange={v => setSemester(Number(v) as 1 | 2)}
              >
                <SelectTrigger className="h-8 w-[160px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° Cuatrimestre</SelectItem>
                  <SelectItem value="2">2° Cuatrimestre</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => setSelectorOpen(true)}>
                <Settings2 className="h-3.5 w-3.5" />
                Cambiar
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          {/* Conflicts warning */}
          {conflicts.length > 0 && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>
                {conflicts.length === 1 ? "Hay 1 superposición" : `Hay ${conflicts.length} superposiciones`} en tu horario.
              </span>
            </div>
          )}

          {blocks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay materias cargadas para este cuatrimestre.
            </p>
          ) : (
            <div className="min-w-[700px]">
              {/* Day headers row */}
              <div className="flex mb-1">
                <div className="w-14 shrink-0" />
                {activeDays.map(dayNum => (
                  <div key={dayNum} className="flex-1 text-center text-xs font-medium text-muted-foreground py-2">
                    {DAY_NAMES[dayNum - 1]}
                  </div>
                ))}
              </div>

              {/* Timetable grid */}
              <div className="flex">
                {/* Time column */}
                <div className="w-14 shrink-0" style={{ height: `${totalHeight}px` }}>
                  {hours.map(h => (
                    <div
                      key={h}
                      className="text-[11px] text-muted-foreground/60 text-right pr-2 -translate-y-2"
                      style={{ height: `${60 * pixelsPerMinute}px` }}
                    >
                      {String(h).padStart(2, "0")}:00
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {activeDays.map(dayNum => {
                  const dayBlocks = blocks.filter(b => b.dayOfWeek === dayNum)
                  return (
                    <div key={dayNum} className="flex-1 min-w-0">
                      {/* Column body */}
                      <div
                        className="relative border-l border-border/30"
                        style={{ height: `${totalHeight}px` }}
                      >
                        {/* Hour lines */}
                        {hours.map((_, i) => (
                          <div
                            key={i}
                            className="absolute w-full border-t border-border/30"
                            style={{ top: `${i * 60 * pixelsPerMinute}px` }}
                          />
                        ))}

                        {/* Blocks */}
                        {dayBlocks.map((block, idx) => {
                          const startMin = timeToMinutes(block.startTime) - gridStartMinutes
                          const endMin = timeToMinutes(block.endTime) - gridStartMinutes
                          const top = startMin * pixelsPerMinute
                          const height = (endMin - startMin) * pixelsPerMinute
                          const isConflict = conflictSet.has(block)
                          const color = getColorForSubject(block.subjectCode, colorMap)

                          return (
                            <div
                              key={idx}
                              className="absolute left-0.5 right-0.5"
                              style={{ top: `${top}px`, height: `${height}px` }}
                            >
                              <div
                                className={`h-full rounded-md border px-2 py-1 overflow-hidden transition-all hover:shadow-md ${color} ${
                                  isConflict ? "ring-2 ring-amber-400 dark:ring-amber-500" : ""
                                }`}
                                title={`${block.subjectName}\n${block.startTime} - ${block.endTime}`}
                              >
                                <p className="text-[11px] font-semibold leading-tight truncate">
                                  {block.subjectCode}
                                </p>
                                {height > 40 && (
                                  <p className="text-[10px] opacity-75 leading-tight truncate mt-0.5">
                                    {block.subjectName}
                                  </p>
                                )}
                                {height > 55 && (
                                  <p className="text-[10px] opacity-60 mt-0.5">
                                    {block.startTime} – {block.endTime}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-border/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Referencias</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(blocks.map(b => b.subjectCode))).map(code => {
                    const name = blocks.find(b => b.subjectCode === code)?.subjectName ?? code
                    const color = getColorForSubject(code, colorMap)
                    return (
                      <div
                        key={code}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] ${color}`}
                      >
                        <span className="font-semibold">{code}</span>
                        <span className="opacity-75">{name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CommissionSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={saveCommission}
      />
    </>
  )
}

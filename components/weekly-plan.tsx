"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight, BookOpen, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ── Types ────────────────────────────────────────────────

interface WeeklyPlanItem {
  id: string
  title: string
  type: "task" | "exam"
  subject?: string
  dueAt?: string
  completed?: boolean
}

interface WeeklyPlanDay {
  date: string
  label: string
  dayNumber: number
  isToday: boolean
  tasksCount: number
  examsCount: number
  totalCount: number
  items: WeeklyPlanItem[]
}

// ── Helpers ──────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function getWeekDates(offset: number): Date[] {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatWeekRange(dates: Date[]): string {
  const first = dates[0]
  const last = dates[6]
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${first.toLocaleDateString("es-AR", opts)} — ${last.toLocaleDateString("es-AR", opts)}`
}

function formatDayHeader(date: Date): string {
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

// ── Component ────────────────────────────────────────────

export function WeeklyPlan() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [items, setItems] = useState<WeeklyPlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const supabase = createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const isCurrentWeek = weekOffset === 0

  const loadData = useCallback(async () => {
    setLoading(true)

    const mondayStr = toDateStr(weekDates[0])
    const sundayStr = toDateStr(weekDates[6])

    const [tasksResult, examsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, subject, due_date, completed, priority")
        .eq("completed", false)
        .gte("due_date", mondayStr)
        .lte("due_date", sundayStr),
      supabase
        .from("exams")
        .select("id, subject, date, time")
        .gte("date", mondayStr)
        .lte("date", sundayStr),
    ])

    const result: WeeklyPlanItem[] = []

    tasksResult.data?.forEach(t => {
      result.push({
        id: t.id,
        title: t.title,
        type: "task",
        subject: t.subject || undefined,
        dueAt: t.due_date || undefined,
        completed: false,
      })
    })

    examsResult.data?.forEach(e => {
      result.push({
        id: e.id,
        title: e.subject,
        type: "exam",
        subject: e.subject || undefined,
        dueAt: e.date || undefined,
      })
    })

    setItems(result)
    setLoading(false)
  }, [weekOffset])

  useEffect(() => { loadData() }, [loadData])

  // Build day data
  const days: WeeklyPlanDay[] = useMemo(() => {
    return weekDates.map((date, i) => {
      const dateStr = toDateStr(date)
      const dayItems = items.filter(item => item.dueAt === dateStr)
      const tasksCount = dayItems.filter(item => item.type === "task").length
      const examsCount = dayItems.filter(item => item.type === "exam").length

      return {
        date: dateStr,
        label: DAY_LABELS[i],
        dayNumber: date.getDate(),
        isToday: isSameDate(date, today),
        tasksCount,
        examsCount,
        totalCount: tasksCount + examsCount,
        items: dayItems,
      }
    })
  }, [weekDates, items])

  // Set default selected date
  useEffect(() => {
    const todayDay = days.find(d => d.isToday)
    setSelectedDate(todayDay ? todayDay.date : days[0]?.date ?? "")
  }, [weekOffset])

  const selectedDay = days.find(d => d.date === selectedDate) ?? days[0]
  const weekTotal = days.reduce((sum, d) => sum + d.totalCount, 0)

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Plan Semanal</CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setWeekOffset(o => o - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[130px] text-center">
              {isCurrentWeek ? "Esta semana" : formatWeekRange(weekDates)}
            </span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setWeekOffset(o => o + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Day cards */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(day => {
            const isSelected = day.date === selectedDate
            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  text-center rounded-lg border p-2.5 transition-all cursor-pointer
                  ${isSelected
                    ? day.isToday
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-accent border-primary/40 shadow-sm"
                    : day.isToday
                      ? "bg-primary/10 border-primary/30 hover:border-primary/50"
                      : "bg-secondary/40 border-border/40 hover:border-border hover:bg-secondary/60"
                  }
                `}
              >
                <p className={`text-[11px] font-medium ${
                  isSelected && day.isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}>
                  {day.label}
                </p>
                <p className={`text-base font-semibold mt-0.5 ${
                  isSelected && day.isToday ? "" : "text-foreground"
                }`}>
                  {day.dayNumber}
                </p>

                {loading ? (
                  <div className="mt-1.5 h-4" />
                ) : day.totalCount > 0 ? (
                  <p className={`text-[10px] mt-1 leading-tight ${
                    isSelected && day.isToday
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}>
                    {day.totalCount === 1
                      ? day.examsCount === 1 ? "1 examen" : "1 tarea"
                      : `${day.totalCount} pend.`
                    }
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 leading-tight ${
                    isSelected && day.isToday
                      ? "text-primary-foreground/50"
                      : "text-muted-foreground/40"
                  }`}>
                    Libre
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selectedDay && (
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
            <p className="text-sm font-medium capitalize mb-3">
              {formatDayHeader(new Date(selectedDay.date + "T12:00:00"))}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedDay.items.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 py-3">
                No tenés pendientes para este día
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDay.items.slice(0, 4).map(item => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 py-1.5"
                  >
                    <div className={`p-1 rounded ${
                      item.type === "exam"
                        ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                        : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                    }`}>
                      {item.type === "exam"
                        ? <BookOpen className="h-3 w-3" />
                        : <ClipboardList className="h-3 w-3" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.title}</p>
                      <div className="flex items-center gap-1.5">
                        {item.subject && item.type === "task" && (
                          <span className="text-[11px] text-muted-foreground">{item.subject} ·</span>
                        )}
                        <span className={`text-[11px] ${
                          item.type === "exam"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground/60"
                        }`}>
                          {item.type === "exam" ? "examen" : "tarea"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedDay.items.length > 4 && (
                  <p className="text-[11px] text-muted-foreground/50 pl-8">
                    +{selectedDay.items.length - 4} más
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Week summary */}
        {!loading && (
          <p className="text-xs text-muted-foreground pt-1">
            {weekTotal === 0
              ? "Semana libre"
              : `${weekTotal} pendiente${weekTotal !== 1 ? "s" : ""} esta semana`
            }
          </p>
        )}
      </CardContent>
    </Card>
  )
}

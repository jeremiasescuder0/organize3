"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ClipboardList,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ── Types ─────────────────────────────────────────────────

interface CalEvent {
  id: string
  type: "task" | "exam"
  title: string
  subject?: string
  date: string
  time?: string
  priority?: "high" | "medium" | "low"
  completed?: boolean
  topics?: string[]
}

type ViewMode = "day" | "week" | "month"

// ── Helpers ───────────────────────────────────────────────

const DAY_LABELS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const DAY_LABELS_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getWeekDates(anchor: Date): Date[] {
  const monday = getMonday(anchor)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatRelative(dateStr: string): string {
  const days = getDaysUntil(dateStr)
  if (days < 0) return "Vencido"
  if (days === 0) return "Hoy"
  if (days === 1) return "Mañana"
  return `Faltan ${days} días`
}

const priorityLabels: Record<string, string> = { high: "Alta", medium: "Media", low: "Baja" }
const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
}

// ── Component ─────────────────────────────────────────────

export function HomeCalendar() {
  const [view, setView] = useState<ViewMode>("week")
  const [anchor, setAnchor] = useState(() => new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const supabase = createClient()

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])

  // ── Data fetching ───────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const [tasksResult, examsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, subject, due_date, priority, completed")
        .not("due_date", "is", null),
      supabase
        .from("exams")
        .select("id, subject, date, time, topics"),
    ])

    const result: CalEvent[] = []

    tasksResult.data?.forEach(t => {
      if (t.due_date) {
        result.push({
          id: t.id, type: "task", title: t.title, subject: t.subject || undefined,
          date: t.due_date, priority: t.priority, completed: t.completed,
        })
      }
    })

    examsResult.data?.forEach(e => {
      result.push({
        id: e.id, type: "exam", title: e.subject, subject: e.subject || undefined,
        date: e.date, time: e.time || undefined, topics: e.topics || undefined,
      })
    })

    setEvents(result)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── Navigation ──────────────────────────────────────────

  function navigate(dir: -1 | 1) {
    setAnchor(prev => {
      const d = new Date(prev)
      if (view === "day") d.setDate(d.getDate() + dir)
      else if (view === "week") d.setDate(d.getDate() + dir * 7)
      else d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  function goToday() {
    setAnchor(new Date())
  }

  // ── Context label ───────────────────────────────────────

  function getContextLabel(): string {
    if (view === "day") {
      if (isSameDate(anchor, today)) return "Hoy"
      return anchor.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
    }
    if (view === "week") {
      const week = getWeekDates(anchor)
      if (isSameDate(getMonday(today), getMonday(anchor))) return "Esta semana"
      const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
      return `${week[0].toLocaleDateString("es-AR", opts)} — ${week[6].toLocaleDateString("es-AR", opts)}`
    }
    return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
  }

  // ── Events by date ──────────────────────────────────────

  function eventsForDate(dateStr: string): CalEvent[] {
    return events.filter(e => e.date === dateStr)
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Calendario</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex rounded-lg border border-border/50 overflow-hidden">
              {(["day", "week", "month"] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={goToday}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors min-w-[100px] text-center"
              >
                {getContextLabel()}
              </button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="transition-opacity duration-150">
            {view === "month" && (
              <MonthView
                anchor={anchor}
                today={today}
                events={events}
                onSelectDay={(d) => { setAnchor(d); setView("day") }}
                onSelectEvent={setSelectedEvent}
              />
            )}
            {view === "week" && (
              <WeekView
                anchor={anchor}
                today={today}
                eventsForDate={eventsForDate}
                onSelectEvent={setSelectedEvent}
              />
            )}
            {view === "day" && (
              <DayView
                anchor={anchor}
                today={today}
                events={eventsForDate(toDateStr(anchor))}
                onSelectEvent={setSelectedEvent}
              />
            )}
          </div>
        )}
      </CardContent>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) setSelectedEvent(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent?.type === "exam" ? (
                <BookOpen className="h-4 w-4 text-amber-500" />
              ) : (
                <ClipboardList className="h-4 w-4 text-blue-500" />
              )}
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventDetail event={selectedEvent} />}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ── Month View ────────────────────────────────────────────

function MonthView({
  anchor, today, events, onSelectDay, onSelectEvent,
}: {
  anchor: Date
  today: Date
  events: CalEvent[]
  onSelectDay: (d: Date) => void
  onSelectEvent: (e: CalEvent) => void
}) {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Monday-based
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  function eventsForDay(day: number): CalEvent[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter(e => e.date === dateStr)
  }

  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS_SHORT.map(d => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} className="min-h-[52px]" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dayDate = new Date(year, month, day)
          const isToday = isSameDate(dayDate, today)
          const dayEvents = eventsForDay(day)
          const hasExam = dayEvents.some(e => e.type === "exam")
          const hasTask = dayEvents.some(e => e.type === "task")

          return (
            <button
              key={day}
              onClick={() => onSelectDay(dayDate)}
              className={`min-h-[52px] p-1.5 rounded-lg text-left transition-all ${
                isToday
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary/60"
              }`}
            >
              <span className={`text-xs font-medium block ${isToday ? "" : "text-foreground"}`}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-[3px] mt-1 flex-wrap">
                  {dayEvents.slice(0, 3).map((ev, idx) => (
                    <div
                      key={idx}
                      className={`w-[5px] h-[5px] rounded-full ${
                        isToday
                          ? "bg-primary-foreground/70"
                          : ev.type === "exam"
                            ? "bg-amber-400 dark:bg-amber-500"
                            : "bg-blue-400 dark:bg-blue-500"
                      }`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className={`text-[8px] leading-none ${isToday ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Minimal legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-[5px] h-[5px] rounded-full bg-amber-400 dark:bg-amber-500" />
          Examen
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[5px] h-[5px] rounded-full bg-blue-400 dark:bg-blue-500" />
          Tarea
        </div>
      </div>
    </div>
  )
}

// ── Week View ─────────────────────────────────────────────

function WeekView({
  anchor, today, eventsForDate, onSelectEvent,
}: {
  anchor: Date
  today: Date
  eventsForDate: (dateStr: string) => CalEvent[]
  onSelectEvent: (e: CalEvent) => void
}) {
  const weekDates = useMemo(() => getWeekDates(anchor), [anchor])

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDates.map((date, i) => {
        const dateStr = toDateStr(date)
        const isToday = isSameDate(date, today)
        const dayEvents = eventsForDate(dateStr)

        return (
          <div key={dateStr} className="min-w-0">
            {/* Day header */}
            <div className={`text-center rounded-t-lg py-1.5 px-1 ${
              isToday ? "bg-primary text-primary-foreground" : "bg-secondary/40"
            }`}>
              <p className={`text-[11px] font-medium ${isToday ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {DAY_LABELS_SHORT[i]}
              </p>
              <p className={`text-sm font-semibold ${isToday ? "" : "text-foreground"}`}>
                {date.getDate()}
              </p>
            </div>

            {/* Events column */}
            <div className="space-y-0.5 mt-0.5 min-h-[60px]">
              {dayEvents.length === 0 ? (
                <p className="text-[10px] text-muted-foreground/30 text-center pt-3">—</p>
              ) : (
                dayEvents.slice(0, 3).map(ev => (
                  <button
                    key={`${ev.type}-${ev.id}`}
                    onClick={() => onSelectEvent(ev)}
                    className={`w-full text-left px-1.5 py-1 rounded text-[10px] leading-tight truncate transition-colors ${
                      ev.type === "exam"
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-400 dark:hover:bg-blue-950/50"
                    }`}
                  >
                    {ev.title}
                  </button>
                ))
              )}
              {dayEvents.length > 3 && (
                <p className="text-[9px] text-muted-foreground text-center">
                  +{dayEvents.length - 3}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Day View ──────────────────────────────────────────────

function DayView({
  anchor, today, events, onSelectEvent,
}: {
  anchor: Date
  today: Date
  events: CalEvent[]
  onSelectEvent: (e: CalEvent) => void
}) {
  const isToday = isSameDate(anchor, today)
  const dayLabel = anchor.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-medium capitalize">{dayLabel}</p>
        {isToday && (
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
            Hoy
          </Badge>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 py-6 text-center">
          No tenés pendientes para este día
        </p>
      ) : (
        <div className="space-y-2">
          {events.map(ev => {
            const isExam = ev.type === "exam"
            return (
              <button
                key={`${ev.type}-${ev.id}`}
                onClick={() => onSelectEvent(ev)}
                className={`w-full text-left rounded-lg border p-3 transition-all hover:shadow-sm ${
                  isExam
                    ? "border-amber-200/50 bg-amber-50/50 hover:bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                    : "border-border/50 bg-secondary/30 hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded ${
                    isExam
                      ? "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400"
                      : "bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                  }`}>
                    {isExam ? <BookOpen className="h-3.5 w-3.5" /> : <ClipboardList className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${ev.completed ? "line-through text-muted-foreground" : ""}`}>
                      {ev.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {ev.subject && !isExam && (
                        <span className="text-[11px] text-muted-foreground">{ev.subject} ·</span>
                      )}
                      <span className={`text-[11px] ${
                        isExam ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"
                      }`}>
                        {isExam ? "examen" : "tarea"}
                      </span>
                      {ev.time && (
                        <span className="text-[11px] text-muted-foreground">· {ev.time}</span>
                      )}
                    </div>
                  </div>
                  {ev.type === "task" && ev.priority && (
                    <Badge variant="secondary" className={`text-[10px] shrink-0 ${priorityColors[ev.priority]}`}>
                      {priorityLabels[ev.priority]}
                    </Badge>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Event Detail ──────────────────────────────────────────

function EventDetail({ event }: { event: CalEvent }) {
  const isExam = event.type === "exam"
  const dateLabel = new Date(event.date + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <div className="space-y-3 pt-1">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={`text-xs ${
            isExam
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
          }`}>
            {isExam ? "Examen" : "Tarea"}
          </Badge>
          {event.priority && (
            <Badge variant="secondary" className={`text-xs ${priorityColors[event.priority]}`}>
              {priorityLabels[event.priority]}
            </Badge>
          )}
          {event.completed && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400">
              Completada
            </Badge>
          )}
        </div>

        <div className="space-y-1.5 text-sm">
          {event.subject && !isExam && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Materia:</span> {event.subject}
            </p>
          )}
          <p className="text-muted-foreground capitalize">
            <span className="font-medium text-foreground">Fecha:</span> {dateLabel}
          </p>
          {event.time && (
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Hora:</span> {event.time}
            </p>
          )}
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Estado:</span> {formatRelative(event.date)}
          </p>
        </div>

        {event.topics && event.topics.length > 0 && (
          <div className="pt-1">
            <p className="text-sm font-medium mb-1.5">Temas</p>
            <div className="flex flex-wrap gap-1">
              {event.topics.map((t, i) => (
                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

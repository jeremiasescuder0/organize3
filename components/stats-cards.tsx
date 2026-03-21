"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, CalendarDays, ClipboardList } from "lucide-react"
import { format, parseISO, isToday, isTomorrow, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"

interface UpcomingEvent {
  id: string
  title: string
  type: "exam" | "task"
  date: string
}

function formatRelativeDate(dateStr: string) {
  const date = parseISO(dateStr)
  if (isToday(date)) return "Hoy"
  if (isTomorrow(date)) return "Mañana"
  const diff = differenceInDays(date, new Date())
  if (diff <= 6) return `En ${diff} días`
  return format(date, "d MMM", { locale: es })
}

function EventRow({ event }: { event: UpcomingEvent }) {
  const isExam = event.type === "exam"
  return (
    <div className="flex items-center gap-3 py-2.5 group">
      <div className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-xl transition-colors ${
        isExam
          ? "bg-sky-500/10 text-sky-500"
          : "bg-amber-500/10 text-amber-500"
      }`}>
        {isExam
          ? <CalendarDays className="w-4 h-4" />
          : <ClipboardList className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate leading-tight">{event.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isExam ? "Examen" : "Tarea"}
        </p>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
        isExam
          ? "bg-sky-500/10 text-sky-500"
          : "bg-amber-500/10 text-amber-500"
      }`}>
        {formatRelativeDate(event.date)}
      </span>
    </div>
  )
}

export function StatsCards() {
  const [subjects, setSubjects] = useState<number | null>(null)
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split("T")[0]

    const [{ count: subjectsCount }, { data: exams }, { data: tasks }] = await Promise.all([
      supabase
        .from("subjects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("exams")
        .select("id, subject, date")
        .eq("user_id", user.id)
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(5),
      supabase
        .from("tasks")
        .select("id, title, due_date")
        .eq("user_id", user.id)
        .eq("completed", false)
        .not("due_date", "is", null)
        .gte("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5),
    ])

    const combined: UpcomingEvent[] = [
      ...(exams ?? []).map((e) => ({
        id: e.id,
        title: e.subject,
        type: "exam" as const,
        date: e.date,
      })),
      ...(tasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        type: "task" as const,
        date: t.due_date,
      })),
    ]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 2)

    setSubjects(subjectsCount ?? 0)
    setEvents(combined)
    setLoading(false)
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-stretch">

        {/* Upcoming events card */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Próximos eventos
          </p>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                    <div className="h-2.5 w-1/4 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <CalendarDays className="w-7 h-7 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Sin eventos próximos</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Subjects card */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 flex flex-col items-center justify-center gap-2 sm:min-w-[140px]">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-4xl font-bold tracking-tight text-foreground">
            {loading ? <span className="text-muted-foreground text-2xl">—</span> : subjects}
          </p>
          <p className="text-xs font-medium text-muted-foreground text-center leading-tight">
            Materias<br />inscripto
          </p>
        </div>

      </div>
    </div>
  )
}

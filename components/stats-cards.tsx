"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, ClipboardList, CalendarDays } from "lucide-react"
import { differenceInDays, parseISO } from "date-fns"
import { EVENTS } from "@/lib/events"

interface ExamInfo {
  subject: string
  date: string
  daysUntil: number
}

interface Stats {
  subjects: number
  pendingTasks: number
  upcomingExams: ExamInfo[]
}

function formatRelative(days: number): string {
  if (days <= 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days} días`
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const load = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0]

    const [{ count: subjectsCount }, { count: tasksCount }, { data: exams }] = await Promise.all([
      supabase
        .from("subjects")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("completed", false),
      supabase
        .from("exams")
        .select("id, subject, date")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(10),
    ])

    const upcomingExams: ExamInfo[] = (exams ?? []).map(e => ({
      subject: e.subject,
      date: e.date,
      daysUntil: differenceInDays(parseISO(e.date), new Date()),
    }))

    setStats({
      subjects: subjectsCount ?? 0,
      pendingTasks: tasksCount ?? 0,
      upcomingExams,
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Auto-refresh when tasks/exams change
  useEffect(() => {
    const refresh = () => load()
    window.addEventListener(EVENTS.TASK_ADDED, refresh)
    window.addEventListener(EVENTS.TASK_COMPLETED, refresh)
    window.addEventListener(EVENTS.EXAM_ADDED, refresh)
    return () => {
      window.removeEventListener(EVENTS.TASK_ADDED, refresh)
      window.removeEventListener(EVENTS.TASK_COMPLETED, refresh)
      window.removeEventListener(EVENTS.EXAM_ADDED, refresh)
    }
  }, [load])

  const examCount = stats?.upcomingExams.length ?? 0
  const nearest = stats?.upcomingExams[0]

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl grid grid-cols-3 gap-4">

        {/* Subjects */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-violet-500" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {loading ? <span className="text-muted-foreground text-2xl">—</span> : stats?.subjects}
          </p>
          <p className="text-xs font-medium text-muted-foreground text-center leading-tight">
            Materias
          </p>
        </div>

        {/* Pending tasks */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {loading ? <span className="text-muted-foreground text-2xl">—</span> : stats?.pendingTasks}
          </p>
          <p className="text-xs font-medium text-muted-foreground text-center leading-tight">
            Tareas pendientes
          </p>
        </div>

        {/* Upcoming exams */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 flex flex-col items-center justify-center gap-2 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-amber-500" />
          </div>
          {loading ? (
            <p className="text-2xl text-muted-foreground">—</p>
          ) : examCount === 0 ? (
            <>
              <p className="text-3xl font-bold tracking-tight text-foreground">0</p>
              <p className="text-xs font-medium text-muted-foreground text-center leading-tight">
                Exámenes próximos
              </p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {examCount}
              </p>
              <p className="text-xs font-medium text-muted-foreground text-center leading-tight">
                {examCount === 1 ? "Examen próximo" : "Exámenes próximos"}
              </p>
              <p className="text-[11px] text-muted-foreground/70 text-center w-full leading-snug">
                {nearest!.subject}
                <br />
                {formatRelative(nearest!.daysUntil)}
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

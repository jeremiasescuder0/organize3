"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BookOpen, ClipboardList, CalendarDays } from "lucide-react"
import { differenceInDays, parseISO, format } from "date-fns"
import { es } from "date-fns/locale"

interface Stats {
  subjects: number
  pendingTasks: number
  nextExam: { subject: string; date: string; daysUntil: number } | null
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { load() }, [])

  async function load() {
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
        .limit(1),
    ])

    const nextExam = exams?.[0]
      ? {
          subject: exams[0].subject,
          date: exams[0].date,
          daysUntil: differenceInDays(parseISO(exams[0].date), new Date()),
        }
      : null

    setStats({
      subjects: subjectsCount ?? 0,
      pendingTasks: tasksCount ?? 0,
      nextExam,
    })
    setLoading(false)
  }

  function formatNextExam(exam: Stats["nextExam"]) {
    if (!exam) return null
    if (exam.daysUntil <= 0) return "Hoy"
    if (exam.daysUntil === 1) return "Mañana"
    return format(parseISO(exam.date), "d MMM", { locale: es })
  }

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

        {/* Next exam */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm p-5 flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-amber-500" />
          </div>
          {loading ? (
            <p className="text-2xl text-muted-foreground">—</p>
          ) : stats?.nextExam ? (
            <>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {formatNextExam(stats.nextExam)}
              </p>
              <p className="text-xs font-medium text-muted-foreground text-center leading-tight truncate max-w-full">
                {stats.nextExam.subject}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-muted-foreground/60">—</p>
              <p className="text-xs font-medium text-muted-foreground text-center leading-tight">
                Sin exámenes
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EVENTS } from "@/lib/events"

interface Exam {
  id: string
  subject: string
  date: string
  time?: string
  topics: string[]
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDaysUntil(days: number): string {
  if (days === 0) return "Hoy"
  if (days === 1) return "Mañana"
  return `Faltan ${days} días`
}

function getUrgencyColor(days: number): string {
  if (days <= 1) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
  if (days <= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
  return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
}

export function ExamFocus() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(10)
    if (data) {
      const currentIds = new Set(exams.map(e => e.id))
      const newIds = new Set<string>()
      data.forEach(e => {
        if (!currentIds.has(e.id)) newIds.add(e.id)
      })
      setExams(data)
      if (newIds.size > 0 && !loading) {
        setEnteringIds(newIds)
        setTimeout(() => setEnteringIds(new Set()), 500)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Listen for cross-component events
  useEffect(() => {
    const onExamAdded = () => loadData()
    window.addEventListener(EVENTS.EXAM_ADDED, onExamAdded)
    return () => window.removeEventListener(EVENTS.EXAM_ADDED, onExamAdded)
  }, [loadData])

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Exámenes</CardTitle>
        <p className="text-[11px] text-muted-foreground/70 mt-0.5">Próximas fechas de evaluación</p>
      </CardHeader>
      <CardContent><div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div></CardContent>
    </Card>
  )

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Exámenes</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 ml-6">Próximas fechas de evaluación</p>
          </div>
          <span className="text-sm text-muted-foreground">{exams.length}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay exámenes próximos.</p>
        ) : exams.map(exam => {
          const days = getDaysUntil(exam.date)
          const isEntering = enteringIds.has(exam.id)

          return (
            <div key={exam.id}
              className={`rounded-lg border bg-secondary/50 border-border/50 hover:border-border transition-all duration-300 ${
                isEntering ? "animate-in fade-in slide-in-from-top-2 duration-300" : ""
              }`}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="p-1 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <BookOpen className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exam.subject}</p>
                  {exam.time && (
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.time}</p>
                  )}
                </div>
                <Badge variant="secondary" className={`text-xs shrink-0 ${getUrgencyColor(days)}`}>
                  {formatDaysUntil(days)}
                </Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

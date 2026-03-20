"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, ArrowRight, AlertTriangle, TrendingDown, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Recommendation {
  type: string
  icon: React.ElementType
  title: string
  content: string
  color: string
  bg: string
}

interface Exam {
  subject: string
  date: string
  progress?: number
}

interface Task {
  title: string
  subject: string
  priority: "high" | "medium" | "low"
  due_date?: string
}

function getDaysUntil(dateStr: string) {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const todayStr = new Date().toISOString().split("T")[0]

    const [examsResult, tasksResult] = await Promise.all([
      supabase
        .from("exams")
        .select("subject, date, progress")
        .eq("user_id", user.id)
        .gte("date", todayStr)
        .order("date", { ascending: true })
        .limit(10),
      supabase
        .from("tasks")
        .select("title, subject, priority, due_date")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("priority", { ascending: true })
        .limit(10),
    ])

    const recs: Recommendation[] = []
    const exams: Exam[] = examsResult.data || []
    const tasks: Task[] = tasksResult.data || []

    // 1. Urgent exams (≤ 3 days)
    const urgentExam = exams.find((e) => getDaysUntil(e.date) <= 3)
    if (urgentExam) {
      const days = getDaysUntil(urgentExam.date)
      recs.push({
        type: "urgent",
        icon: AlertTriangle,
        title: "Atención urgente",
        content: `${urgentExam.subject} — examen ${days === 0 ? "hoy" : days === 1 ? "mañana" : `en ${days} días`}. Considerá una sesión de estudio intensiva.`,
        color: "text-red-600 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-950/30",
      })
    }

    // 2. Exam coming soon (4-7 days) with low progress
    const soonExam = exams.find((e) => {
      const days = getDaysUntil(e.date)
      return days > 3 && days <= 7
    })
    if (soonExam) {
      const days = getDaysUntil(soonExam.date)
      const progress = soonExam.progress || 0
      recs.push({
        type: "soon",
        icon: TrendingDown,
        title: progress < 50 ? "Materia con poco avance" : "Próximo examen",
        content: `${soonExam.subject} — en ${days} días${progress > 0 ? ` · ${progress}% preparado` : ""}. Aprovechá para repasar.`,
        color: "text-amber-600 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-950/30",
      })
    }

    // 3. Next high-priority task
    const highTask = tasks.find((t) => t.priority === "high")
    if (highTask) {
      const duePart = highTask.due_date
        ? ` — vence ${getDaysUntil(highTask.due_date) === 0 ? "hoy" : getDaysUntil(highTask.due_date) === 1 ? "mañana" : `en ${getDaysUntil(highTask.due_date)} días`}`
        : ""
      recs.push({
        type: "next",
        icon: ArrowRight,
        title: "Tarea de alta prioridad",
        content: `${highTask.title}${highTask.subject ? ` (${highTask.subject})` : ""}${duePart}.`,
        color: "text-blue-600 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-950/30",
      })
    } else {
      // Fallback: next pending task regardless of priority
      const nextTask = tasks[0]
      if (nextTask) {
        recs.push({
          type: "next",
          icon: ArrowRight,
          title: "Mejor siguiente tarea",
          content: `${nextTask.title}${nextTask.subject ? ` (${nextTask.subject})` : ""}.`,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-950/30",
        })
      }
    }

    // 4. No recs → everything is fine
    if (recs.length === 0) {
      recs.push({
        type: "ok",
        icon: CheckCircle,
        title: "¡Todo en orden!",
        content: "No tenés exámenes próximos ni tareas urgentes. Buen momento para adelantar contenido.",
        color: "text-emerald-600 dark:text-emerald-400",
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
      })
    }

    setRecommendations(recs)
    setLoading(false)
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-base font-semibold">Recomendaciones</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          recommendations.map((rec, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border border-transparent ${rec.bg} hover:border-border/50 transition-all`}
            >
              <div className="flex items-start gap-2">
                <rec.icon className={`h-4 w-4 mt-0.5 shrink-0 ${rec.color}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${rec.color}`}>{rec.title}</p>
                  <p className="text-sm text-foreground mt-0.5">{rec.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

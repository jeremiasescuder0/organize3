"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  if (days < 0) return "Vencido"
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
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(5)
    if (data) setExams(data)
    setLoading(false)
  }

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Exámenes</CardTitle></CardHeader>
      <CardContent><div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div></CardContent>
    </Card>
  )

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Exámenes</CardTitle>
          </div>
          <span className="text-sm text-muted-foreground">{exams.length} próximo{exams.length !== 1 ? "s" : ""}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay exámenes próximos.</p>
        ) : exams.map(exam => {
          const days = getDaysUntil(exam.date)
          return (
            <div key={exam.id}
              className="rounded-lg border bg-secondary/50 border-border/50 hover:border-border transition-all"
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

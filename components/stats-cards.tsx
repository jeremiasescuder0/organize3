"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, CheckSquare, Clock, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StatsData {
  upcomingExams: number
  pendingTasks: number
  studyHours: number
  thesisProgress: number
}

export function StatsCards() {
  const [stats, setStats] = useState<StatsData>({
    upcomingExams: 0,
    pendingTasks: 0,
    studyHours: 0,
    thesisProgress: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count: examsCount } = await supabase
      .from("exams")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", new Date().toISOString().split("T")[0])

    const { count: tasksCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("completed", false)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("duration_minutes")
      .eq("user_id", user.id)
      .gte("date", weekAgo.toISOString().split("T")[0])

    const totalMinutes = sessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0
    const studyHours = Math.round((totalMinutes / 60) * 10) / 10

    const { data: thesis } = await supabase
      .from("thesis")
      .select("progress")
      .eq("user_id", user.id)
      .single()

    setStats({
      upcomingExams: examsCount || 0,
      pendingTasks: tasksCount || 0,
      studyHours,
      thesisProgress: thesis?.progress || 0,
    })
    setLoading(false)
  }

  const cards = [
    {
      title: "Examenes Proximos",
      value: loading ? "-" : stats.upcomingExams,
      subtitle: "Por rendir",
      icon: CalendarDays,
      gradient: "from-sky-500/20 to-sky-500/5 dark:from-sky-500/10 dark:to-sky-500/5",
      iconBg: "bg-sky-500/15 dark:bg-sky-500/20",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      title: "Tareas Pendientes",
      value: loading ? "-" : stats.pendingTasks,
      subtitle: "Por completar",
      icon: CheckSquare,
      gradient: "from-amber-500/20 to-amber-500/5 dark:from-amber-500/10 dark:to-amber-500/5",
      iconBg: "bg-amber-500/15 dark:bg-amber-500/20",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Horas de Estudio",
      value: loading ? "-" : stats.studyHours,
      subtitle: "Esta semana",
      icon: Clock,
      gradient: "from-emerald-500/20 to-emerald-500/5 dark:from-emerald-500/10 dark:to-emerald-500/5",
      iconBg: "bg-emerald-500/15 dark:bg-emerald-500/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Progreso Tesis",
      value: loading ? "-" : `${stats.thesisProgress}%`,
      subtitle: "Completado",
      icon: FileText,
      gradient: "from-violet-500/20 to-violet-500/5 dark:from-violet-500/10 dark:to-violet-500/5",
      iconBg: "bg-violet-500/15 dark:bg-violet-500/20",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className="relative overflow-hidden border-border/50 bg-card hover:shadow-lg transition-shadow duration-300"
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} pointer-events-none`} />
          
          <CardContent className="relative p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground tracking-tight">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

"use client"

import { Card } from "@/components/ui/card"
import { BookOpen, CheckCircle2, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { getDaysUntil } from "@/lib/date-utils"

interface Stats {
  upcomingExams: number
  completedTasks: number
  studyHours: number
}

export function StatsOverview() {
  const [stats, setStats] = useState<Stats>({
    upcomingExams: 0,
    completedTasks: 0,
    studyHours: 0,
  })

  useEffect(() => {
    const calculateStats = () => {
      // Get tasks from localStorage
      const tasksData = localStorage.getItem("study-organizer-tasks")
      const tasks = tasksData ? JSON.parse(tasksData) : []

      // Get exams from localStorage
      const examsData = localStorage.getItem("study-organizer-exams")
      const exams = examsData ? JSON.parse(examsData) : []

      const sessionsData = localStorage.getItem("study-organizer-sessions")
      let sessions = []
      if (sessionsData) {
        try {
          const parsedData = JSON.parse(sessionsData)
          // Check if it's an array (new format) or number (old format)
          sessions = Array.isArray(parsedData) ? parsedData : []
        } catch (error) {
          sessions = []
        }
      }

      // Calculate completed tasks this week
      const completedTasks = tasks.filter((task: any) => task.completed).length

      // Calculate upcoming exams (next 2 weeks)
      const upcomingExams = exams.filter((exam: any) => {
        const daysUntil = getDaysUntil(exam.date)
        return daysUntil >= 0 && daysUntil <= 14
      }).length

      // Calculate study hours this month
      const thisMonth = new Date().getMonth()
      const thisYear = new Date().getFullYear()
      const studyHours =
        sessions
          .filter((session: any) => {
            const sessionDate = new Date(session.date)
            return sessionDate.getMonth() === thisMonth && sessionDate.getFullYear() === thisYear
          })
          .reduce((total: number, session: any) => total + (session.duration || 0), 0) / 60 // Convert minutes to hours

      setStats({
        upcomingExams,
        completedTasks,
        studyHours: Math.round(studyHours * 10) / 10, // Round to 1 decimal
      })
    }

    calculateStats()

    // Listen for storage changes to update stats in real-time
    const handleStorageChange = () => {
      calculateStats()
    }

    window.addEventListener("storage", handleStorageChange)

    // Also listen for custom events from the same tab
    window.addEventListener("localStorageUpdate", handleStorageChange)

    // Poll every 2 seconds to catch same-tab updates
    const interval = setInterval(calculateStats, 2000)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("localStorageUpdate", handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const statsConfig = [
    {
      label: "Exámenes Próximos",
      value: stats.upcomingExams.toString(),
      icon: BookOpen,
      description: "En las próximas 2 semanas",
      color: "text-chart-1",
    },
    {
      label: "Tareas Completadas",
      value: stats.completedTasks.toString(),
      icon: CheckCircle2,
      description: "Total completadas",
      color: "text-chart-2",
    },
    {
      label: "Horas de Estudio",
      value: stats.studyHours.toFixed(1),
      icon: Clock,
      description: "Este mes",
      color: "text-chart-3",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statsConfig.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </div>
              <div className={`${stat.color} opacity-80`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

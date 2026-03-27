"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface UpcomingItem {
  type: "exam" | "task"
  title: string
  subject: string
  date: string
  daysUntil: number
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function urgencyLabel(days: number): string {
  if (days < 0) return "Vencido"
  if (days === 0) return "Hoy"
  if (days === 1) return "Mañana"
  return `En ${days} días`
}

function urgencyType(days: number): "error" | "warning" | "info" {
  if (days <= 1) return "error"
  if (days <= 3) return "warning"
  return "info"
}

export function UpcomingAlerts() {
  const hasRun = useRef(false)
  const supabase = createClient()

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const KEY = "organize_alerts_session"
    if (sessionStorage.getItem(KEY)) return

    checkUpcoming()

    async function checkUpcoming() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const todayStr = today.toISOString().split("T")[0]
      const nextWeekStr = nextWeek.toISOString().split("T")[0]

      const [examsRes, tasksRes] = await Promise.all([
        supabase.from("exams").select("id, subject, date")
          .eq("user_id", user.id)
          .gte("date", todayStr)
          .lte("date", nextWeekStr),
        supabase.from("tasks").select("id, title, subject, due_date")
          .eq("user_id", user.id)
          .eq("completed", false)
          .gte("due_date", todayStr)
          .lte("due_date", nextWeekStr),
      ])

      const items: UpcomingItem[] = []

      if (examsRes.data) {
        for (const exam of examsRes.data) {
          items.push({
            type: "exam",
            title: "Examen",
            subject: exam.subject,
            date: exam.date,
            daysUntil: daysUntil(exam.date),
          })
        }
      }

      if (tasksRes.data) {
        for (const task of tasksRes.data) {
          if (!task.due_date) continue
          items.push({
            type: "task",
            title: task.title,
            subject: task.subject,
            date: task.due_date,
            daysUntil: daysUntil(task.due_date),
          })
        }
      }

      if (items.length === 0) return

      items.sort((a, b) => a.daysUntil - b.daysUntil)

      sessionStorage.setItem(KEY, "1")

      // Show toasts with staggered delay
      items.forEach((item, i) => {
        setTimeout(() => {
          const type = urgencyType(item.daysUntil)
          const label = urgencyLabel(item.daysUntil)
          const icon = item.type === "exam" ? "📝" : "📋"
          const typeLabel = item.type === "exam" ? "Examen" : "Entrega"

          const message = `${item.subject} · ${label}`
          const description = item.type === "exam"
            ? `${typeLabel} — ${formatDate(item.date)}`
            : `${item.title} — ${formatDate(item.date)}`

          if (type === "error") {
            toast.error(`${icon} ${message}`, { description, duration: 6000 })
          } else if (type === "warning") {
            toast.warning(`${icon} ${message}`, { description, duration: 5000 })
          } else {
            toast.info(`${icon} ${message}`, { description, duration: 4000 })
          }
        }, i * 800)
      })
    }
  }, [])

  return null
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

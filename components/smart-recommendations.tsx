"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface Exam { subject: string; date: string }
interface Task { title: string; subject: string; priority: "high" | "medium" | "low"; due_date?: string }

function getDaysUntil(dateStr: string) {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function daysLabel(days: number) {
  if (days === 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days} días`
}

interface Note { text: string; urgent: boolean }

export function SmartRecommendations() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const todayStr = new Date().toISOString().split("T")[0]
    const [examsRes, tasksRes] = await Promise.all([
      supabase.from("exams").select("subject, date").eq("user_id", user.id).gte("date", todayStr).order("date").limit(5),
      supabase.from("tasks").select("title, subject, priority, due_date").eq("user_id", user.id).eq("completed", false).limit(5),
    ])
    const exams: Exam[] = examsRes.data || []
    const tasks: Task[] = tasksRes.data || []
    const result: Note[] = []

    const urgentExam = exams.find(e => getDaysUntil(e.date) <= 3)
    if (urgentExam) {
      const d = getDaysUntil(urgentExam.date)
      result.push({ text: `${urgentExam.subject} tiene examen ${daysLabel(d)}.`, urgent: d <= 1 })
    }

    const soonExam = exams.find(e => { const d = getDaysUntil(e.date); return d > 3 && d <= 7 })
    if (soonExam) {
      result.push({ text: `${soonExam.subject} — examen en ${getDaysUntil(soonExam.date)} días.`, urgent: false })
    }

    const highTask = tasks.find(t => t.priority === "high")
    if (highTask) {
      const duePart = highTask.due_date ? ` Vence ${daysLabel(getDaysUntil(highTask.due_date))}.` : ""
      result.push({ text: `${highTask.title}${duePart}`, urgent: false })
    } else if (tasks[0]) {
      result.push({ text: tasks[0].title, urgent: false })
    }

    if (result.length === 0) {
      result.push({ text: "Sin exámenes ni tareas urgentes. Buen momento para adelantar.", urgent: false })
    }

    setNotes(result)
    setLoading(false)
  }

  return (
    <div>
      <div className="mb-3">
        <span className="text-sm text-muted-foreground">Sugerencias</span>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground/40">—</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note, i) => (
            <p key={i} className={`text-sm ${note.urgent ? "text-foreground" : "text-muted-foreground"}`}>
              {note.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface DayData {
  tasks: number
  hours: number
}

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon...
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

// Maps JS getDay() (0=Sun) to our index (0=Mon...6=Sun)
function jsDayToIndex(jsDay: number) {
  return jsDay === 0 ? 6 : jsDay - 1
}

export function WeeklyPlan() {
  const [weekData, setWeekData] = useState<DayData[]>(
    Array.from({ length: 7 }, () => ({ tasks: 0, hours: 0 }))
  )
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const today = new Date()
  const todayIndex = jsDayToIndex(today.getDay())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { monday, sunday } = getWeekBounds()
    const mondayStr = toDateStr(monday)
    const sundayStr = toDateStr(sunday)

    const [tasksResult, sessionsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("due_date")
        .eq("user_id", user.id)
        .eq("completed", false)
        .gte("due_date", mondayStr)
        .lte("due_date", sundayStr),
      supabase
        .from("study_sessions")
        .select("date, duration_minutes")
        .eq("user_id", user.id)
        .gte("date", mondayStr)
        .lte("date", sundayStr),
    ])

    const data: DayData[] = Array.from({ length: 7 }, () => ({ tasks: 0, hours: 0 }))

    tasksResult.data?.forEach((t) => {
      if (!t.due_date) return
      const d = new Date(t.due_date + "T12:00:00")
      const idx = jsDayToIndex(d.getDay())
      data[idx].tasks += 1
    })

    sessionsResult.data?.forEach((s) => {
      if (!s.date) return
      const d = new Date(s.date + "T12:00:00")
      const idx = jsDayToIndex(d.getDay())
      data[idx].hours += (s.duration_minutes || 0) / 60
    })

    // Round hours to 1 decimal
    data.forEach((d) => { d.hours = Math.round(d.hours * 10) / 10 })

    setWeekData(data)
    setLoading(false)
  }

  const totalTasks = weekData.reduce((a, d) => a + d.tasks, 0)
  const totalHours = Math.round(weekData.reduce((a, d) => a + d.hours, 0) * 10) / 10

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold">Plan Semanal</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {DAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={`text-center p-3 rounded-lg border transition-all ${
                index === todayIndex
                  ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                  : "bg-secondary/50 border-border/50 hover:border-border"
              }`}
            >
              <p className={`text-xs font-medium ${index === todayIndex ? "" : "text-muted-foreground"}`}>
                {label}
              </p>
              {loading ? (
                <div className="my-2 flex justify-center">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
                </div>
              ) : (
                <>
                  <p className={`text-lg font-semibold mt-1 ${index === todayIndex ? "" : "text-foreground"}`}>
                    {weekData[index].tasks}
                  </p>
                  <p className={`text-xs ${index === todayIndex ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                    {weekData[index].hours > 0 ? `${weekData[index].hours}h` : "-"}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Esta semana: </span>
            {loading ? (
              <span className="text-muted-foreground">Cargando...</span>
            ) : (
              <span className="font-medium">
                {totalTasks} tareas pendientes
                {totalHours > 0 ? ` · ${totalHours}h estudiadas` : ""}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

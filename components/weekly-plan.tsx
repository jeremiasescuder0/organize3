"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

interface DayData {
  tasks: number
  hours: number
}

function getWeekBounds(offset: number) {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0]
}

function jsDayToIndex(jsDay: number) {
  return jsDay === 0 ? 6 : jsDay - 1
}

function formatWeekLabel(monday: Date, sunday: Date) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  const m = monday.toLocaleDateString("es-AR", opts)
  const s = sunday.toLocaleDateString("es-AR", opts)
  return `${m} — ${s}`
}

export function WeeklyPlan() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekData, setWeekData] = useState<DayData[]>(
    Array.from({ length: 7 }, () => ({ tasks: 0, hours: 0 }))
  )
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const today = new Date()
  const todayIndex = jsDayToIndex(today.getDay())

  const { monday, sunday } = getWeekBounds(weekOffset)

  const loadData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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
        .select("date, duration")
        .eq("user_id", user.id)
        .gte("date", mondayStr)
        .lte("date", sundayStr),
    ])

    const data: DayData[] = Array.from({ length: 7 }, () => ({ tasks: 0, hours: 0 }))

    tasksResult.data?.forEach((t) => {
      if (!t.due_date) return
      const d = new Date(t.due_date + "T12:00:00")
      data[jsDayToIndex(d.getDay())].tasks += 1
    })

    sessionsResult.data?.forEach((s) => {
      if (!s.date) return
      const d = new Date(s.date)
      data[jsDayToIndex(d.getDay())].hours += (s.duration || 0) / 60
    })

    data.forEach((d) => { d.hours = Math.round(d.hours * 10) / 10 })

    setWeekData(data)
    setLoading(false)
  }, [weekOffset])

  useEffect(() => { loadData() }, [loadData])

  const totalTasks = weekData.reduce((a, d) => a + d.tasks, 0)
  const totalHours = Math.round(weekData.reduce((a, d) => a + d.hours, 0) * 10) / 10
  const isCurrentWeek = weekOffset === 0

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Plan Semanal</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setWeekOffset(o => o - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[120px] text-center">
              {isCurrentWeek ? "Esta semana" : formatWeekLabel(monday, sunday)}
            </span>
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => setWeekOffset(o => o + 1)}
              disabled={weekOffset >= 0}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {DAY_LABELS.map((label, index) => {
            const isToday = isCurrentWeek && index === todayIndex
            return (
              <div
                key={label}
                className={`text-center p-3 rounded-lg border transition-all ${
                  isToday
                    ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                    : "bg-secondary/50 border-border/50 hover:border-border"
                }`}
              >
                <p className={`text-xs font-medium ${isToday ? "" : "text-muted-foreground"}`}>
                  {label}
                </p>
                {loading ? (
                  <div className="my-2 flex justify-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
                  </div>
                ) : (
                  <>
                    <p className={`text-lg font-semibold mt-1 ${isToday ? "" : "text-foreground"}`}>
                      {weekData[index].tasks}
                    </p>
                    <p className={`text-xs ${isToday ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {weekData[index].hours > 0 ? `${weekData[index].hours}h` : "-"}
                    </p>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-border text-sm">
          <span className="text-muted-foreground">{isCurrentWeek ? "Esta semana" : "Esa semana"}: </span>
          {loading ? (
            <span className="text-muted-foreground">Cargando...</span>
          ) : (
            <span className="font-medium">
              {totalTasks} tarea{totalTasks !== 1 ? "s" : ""} pendiente{totalTasks !== 1 ? "s" : ""}
              {totalHours > 0 ? ` · ${totalHours}h estudiadas` : ""}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

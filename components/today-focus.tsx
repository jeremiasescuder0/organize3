"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Task {
  id: string
  title: string
  subject: string
  priority: "high" | "medium" | "low"
  completed: boolean
  due_date?: string
}

const priorityColors = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
}
const priorityLabel = { high: "Alta", medium: "Media", low: "Baja" }

export function TodayFocus() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id)
      .eq("completed", false).order("priority", { ascending: true }).limit(5)
    if (data) setTasks(data)
    setLoading(false)
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", id)
    if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const completedCount = tasks.filter(t => t.completed).length

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Tareas y TPs</CardTitle></CardHeader>
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
              <Sparkles className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Tareas y TPs</CardTitle>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 ml-6">Pendientes por completar</p>
          </div>
          <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay tareas pendientes.</p>
        ) : tasks.map(task => (
          <div key={task.id}
            className={`rounded-lg border transition-all ${
              task.completed ? "bg-muted/30 border-border/30" : "bg-secondary/50 border-border/50 hover:border-border"
            }`}
          >
            <div className="flex items-center gap-3 p-3">
              <Checkbox checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                  {task.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.subject}</p>
              </div>
              <Badge variant="secondary" className={`text-xs shrink-0 ${priorityColors[task.priority]}`}>
                {priorityLabel[task.priority]}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

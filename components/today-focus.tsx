"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles, Check, X, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EVENTS } from "@/lib/events"

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
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set())
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: raw } = await supabase.from("tasks").select("*").eq("user_id", user.id)
      .eq("completed", false).order("due_date", { ascending: true, nullsFirst: false })
    const priorityOrder = { high: 0, medium: 1, low: 2 } as const
    const data = (raw ?? []).sort((a, b) => {
      const pa = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2
      const pb = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2
      if (pa !== pb) return pa - pb
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    if (data) {
      const currentIds = new Set(tasks.map(t => t.id))
      const newIds = new Set<string>()
      data.forEach(t => {
        if (!currentIds.has(t.id)) newIds.add(t.id)
      })
      setTasks(data)
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
    const onTaskAdded = () => loadData()
    window.addEventListener(EVENTS.TASK_ADDED, onTaskAdded)
    return () => window.removeEventListener(EVENTS.TASK_ADDED, onTaskAdded)
  }, [loadData])

  const startComplete = (id: string) => {
    setConfirmingId(id)
    setCompletionNote("")
  }

  const cancelComplete = () => {
    setConfirmingId(null)
    setCompletionNote("")
  }

  const confirmComplete = async () => {
    if (!confirmingId) return
    const note = completionNote.trim()

    // Save note if provided
    if (note) {
      await supabase.from("tasks").update({
        completed: true,
        description: note,
      }).eq("id", confirmingId)
    } else {
      await supabase.from("tasks").update({ completed: true }).eq("id", confirmingId)
    }

    // Start fade-out
    setFadingIds(prev => new Set(prev).add(confirmingId))
    setConfirmingId(null)
    setCompletionNote("")

    // Remove from list after animation
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== confirmingId))
      setFadingIds(prev => {
        const next = new Set(prev)
        next.delete(confirmingId)
        return next
      })
      // Notify other components
      window.dispatchEvent(new CustomEvent(EVENTS.TASK_COMPLETED))
    }, 400)
  }

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Tareas y TPs</CardTitle></CardHeader>
      <CardContent><div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div></CardContent>
    </Card>
  )

  const activeCount = tasks.filter(t => !fadingIds.has(t.id)).length

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
          <span className="text-sm text-muted-foreground">{activeCount}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay tareas pendientes.</p>
        ) : tasks.map(task => {
          const isFading = fadingIds.has(task.id)
          const isEntering = enteringIds.has(task.id)
          const isConfirming = confirmingId === task.id

          return (
            <div key={task.id}
              className={`rounded-lg border transition-all duration-400 ${
                isFading
                  ? "opacity-0 scale-95 -translate-y-1"
                  : isEntering
                    ? "animate-in fade-in slide-in-from-top-2 duration-300"
                    : ""
              } ${
                isConfirming
                  ? "border-primary/40 bg-primary/5"
                  : "bg-secondary/50 border-border/50 hover:border-border"
              }`}
              style={isFading ? { maxHeight: 0, marginBottom: 0, padding: 0, overflow: "hidden", transition: "all 400ms ease-out" } : {}}
            >
              <div className="flex items-center gap-3 p-3">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => startComplete(task.id)}
                  className="mt-0.5 shrink-0"
                  disabled={isFading || isConfirming}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.subject}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {task.due_date && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(task.due_date + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <Badge variant="secondary" className={`text-xs ${priorityColors[task.priority]}`}>
                    {priorityLabel[task.priority]}
                  </Badge>
                </div>
              </div>

              {/* Confirmation panel */}
              {isConfirming && (
                <div className="px-3 pb-3 space-y-2.5 border-t border-border/40 pt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-medium text-muted-foreground">
                    ¿Completar esta tarea?
                  </p>
                  <Textarea
                    placeholder="Anotaciones (opcional)"
                    value={completionNote}
                    onChange={e => setCompletionNote(e.target.value)}
                    className="text-sm min-h-[60px] resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={cancelComplete}>
                      <X className="h-3 w-3" />Cancelar
                    </Button>
                    <Button size="sm" className="h-7 text-xs gap-1" onClick={confirmComplete}>
                      <Check className="h-3 w-3" />Completar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

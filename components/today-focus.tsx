"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Check, X, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EVENTS } from "@/lib/events"
import { TaskDialog } from "@/components/task-dialog"
import type { Task as DialogTask } from "@/components/today-tasks"

interface Task {
  id: string
  title: string
  subject: string
  priority: "high" | "medium" | "low"
  completed: boolean
  due_date?: string
  description?: string
}

function formatDue(dateStr: string): string {
  const days = Math.ceil(
    (new Date(dateStr + "T00:00:00").setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000
  )
  if (days < 0) return "vencida"
  if (days === 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days} días`
}

export function TodayFocus() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [completionNote, setCompletionNote] = useState("")
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set())
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
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
      data.forEach(t => { if (!currentIds.has(t.id)) newIds.add(t.id) })
      setTasks(data)
      if (newIds.size > 0 && !loading) {
        setEnteringIds(newIds)
        setTimeout(() => setEnteringIds(new Set()), 500)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const onTaskAdded = () => loadData()
    window.addEventListener(EVENTS.TASK_ADDED, onTaskAdded)
    return () => window.removeEventListener(EVENTS.TASK_ADDED, onTaskAdded)
  }, [loadData])

  const startComplete = (id: string) => {
    setConfirmingId(id)
    setDeletingId(null)
    setCompletionNote("")
  }

  const cancelComplete = () => {
    setConfirmingId(null)
    setCompletionNote("")
  }

  const confirmComplete = async () => {
    if (!confirmingId) return
    const note = completionNote.trim()
    if (note) {
      await supabase.from("tasks").update({ completed: true, description: note }).eq("id", confirmingId)
    } else {
      await supabase.from("tasks").update({ completed: true }).eq("id", confirmingId)
    }
    setFadingIds(prev => new Set(prev).add(confirmingId))
    const id = confirmingId
    setConfirmingId(null)
    setCompletionNote("")
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id))
      setFadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
      window.dispatchEvent(new CustomEvent(EVENTS.TASK_COMPLETED))
    }, 300)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    const id = deletingId
    setDeletingId(null)
    await supabase.from("tasks").delete().eq("id", id)
    setFadingIds(prev => new Set(prev).add(id))
    setTimeout(() => {
      setTasks(prev => prev.filter(t => t.id !== id))
      setFadingIds(prev => { const next = new Set(prev); next.delete(id); return next })
      window.dispatchEvent(new CustomEvent(EVENTS.TASK_COMPLETED))
    }, 300)
  }

  const handleEditSave = async (updated: Omit<DialogTask, "id">) => {
    if (!editingTask) return
    await supabase.from("tasks").update({
      title: updated.title,
      description: updated.description,
      subject: updated.subject,
      priority: updated.priority,
      due_date: updated.dueDate || null,
    }).eq("id", editingTask.id)
    setEditingTask(null)
    loadData()
    window.dispatchEvent(new CustomEvent(EVENTS.TASK_ADDED))
  }

  const activeCount = tasks.filter(t => !fadingIds.has(t.id)).length

  return (
    <>
      <div>
        {/* Section header */}
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm text-muted-foreground">Tareas y TPs</span>
          {!loading && <span className="text-xs text-muted-foreground/50">{activeCount}</span>}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground/40 py-4">—</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground/40 py-2">Sin tareas pendientes.</p>
        ) : (
          <div>
            {tasks.map(task => {
              const isFading = fadingIds.has(task.id)
              const isEntering = enteringIds.has(task.id)
              const isConfirming = confirmingId === task.id
              const isDeleting = deletingId === task.id

              return (
                <div
                  key={task.id}
                  className={`group border-b border-border/20 last:border-0 transition-all duration-300 ${
                    isFading ? "opacity-0 max-h-0 overflow-hidden" : "opacity-100"
                  } ${isEntering ? "animate-in fade-in duration-300" : ""}`}
                >
                  {/* Task row */}
                  <div className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-sm transition-colors ${
                    !isConfirming && !isDeleting ? "hover:bg-muted/30" : ""
                  }`}>
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => startComplete(task.id)}
                      className="shrink-0 h-3.5 w-3.5 rounded-sm border-border/50"
                      disabled={isFading || isConfirming || isDeleting}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground">{task.title}</span>
                      {task.subject && (
                        <span className="text-xs text-muted-foreground/60 ml-2">{task.subject}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-muted-foreground/50">
                        {task.priority === "high" && "Alta"}
                        {task.due_date && (
                          <>{task.priority === "high" ? " · " : ""}{formatDue(task.due_date)}</>
                        )}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingTask(task); setConfirmingId(null); setDeletingId(null) }}
                          disabled={isFading}
                          className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { setDeletingId(task.id); setConfirmingId(null) }}
                          disabled={isFading}
                          className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Completion panel */}
                  {isConfirming && (
                    <div className="pb-3 pl-6 space-y-2 animate-in fade-in duration-150">
                      <Textarea
                        placeholder="Anotaciones opcionales..."
                        value={completionNote}
                        onChange={e => setCompletionNote(e.target.value)}
                        className="text-xs min-h-[50px] resize-none bg-muted/20 border-border/30"
                      />
                      <div className="flex gap-2">
                        <button onClick={cancelComplete} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          <X className="h-3 w-3" /> Cancelar
                        </button>
                        <button onClick={confirmComplete} className="flex items-center gap-1 text-xs text-foreground hover:text-primary transition-colors">
                          <Check className="h-3 w-3" /> Completar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete panel */}
                  {isDeleting && (
                    <div className="pb-3 pl-6 animate-in fade-in duration-150">
                      <div className="flex gap-3 items-center">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <button onClick={() => setDeletingId(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                          No
                        </button>
                        <button onClick={confirmDelete} className="text-xs text-destructive hover:text-destructive/80 transition-colors">
                          Sí, eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <TaskDialog
        open={!!editingTask}
        onOpenChange={open => { if (!open) setEditingTask(null) }}
        onSave={handleEditSave}
        task={editingTask ? {
          id: editingTask.id,
          title: editingTask.title,
          subject: editingTask.subject,
          priority: editingTask.priority,
          completed: editingTask.completed,
          dueDate: editingTask.due_date,
          description: editingTask.description,
        } : undefined}
      />
    </>
  )
}

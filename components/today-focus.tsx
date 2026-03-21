"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sparkles, Plus, ChevronDown, ChevronUp, Save, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DateInput } from "@/components/ui/date-input"

interface Task {
  id: string
  title: string
  subject: string
  priority: "high" | "medium" | "low"
  completed: boolean
  due_date?: string
}

interface Subject {
  id: string
  name: string
  color: string
}

const priorityColors = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
}
const priorityLabel = { high: "Alta", medium: "Media", low: "Baja" }

export function TodayFocus() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState<{ title: string; subject: string; priority: "high" | "medium" | "low" }>({ title: "", subject: "", priority: "medium" })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [tasksResult, subjectsResult] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id)
        .eq("completed", false).order("priority", { ascending: true }).limit(5),
      supabase.from("subjects").select("*").eq("user_id", user.id).order("name"),
    ])
    if (tasksResult.data) setTasks(tasksResult.data)
    if (subjectsResult.data) setSubjects(subjectsResult.data)
    setLoading(false)
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", id)
    if (!error) setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }

  const addTask = async () => {
    if (!newTask.title || !newTask.subject) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data, error } = await supabase.from("tasks")
      .insert({ user_id: user.id, title: newTask.title, subject: newTask.subject,
        priority: newTask.priority, completed: false })
      .select().single()
    if (!error && data) {
      setTasks([...tasks, data])
      setNewTask({ title: "", subject: "", priority: "medium" })
      setDialogOpen(false)
    }
  }

  const saveEdit = async () => {
    if (!editDraft) return
    setSaving(true)
    const { error } = await supabase.from("tasks").update({
      title: editDraft.title,
      subject: editDraft.subject,
      priority: editDraft.priority,
      due_date: editDraft.due_date || null,
    }).eq("id", editDraft.id)
    if (!error) {
      setTasks(tasks.map(t => t.id === editDraft.id ? editDraft : t))
      setExpandedId(null)
      setEditDraft(null)
    }
    setSaving(false)
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id))
      setExpandedId(null)
    }
  }

  const toggleExpand = (task: Task) => {
    if (expandedId === task.id) {
      setExpandedId(null)
      setEditDraft(null)
    } else {
      setExpandedId(task.id)
      setEditDraft({ ...task })
    }
  }

  const completedCount = tasks.filter(t => t.completed).length

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Enfoque de Hoy</CardTitle></CardHeader>
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
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Enfoque de Hoy</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length} completadas</span>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Plus className="h-3 w-3" />Tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Título</label>
                    <Input placeholder="Ej: Estudiar capítulo 5" value={newTask.title}
                      onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Materia</label>
                    <Select value={newTask.subject} onValueChange={v => setNewTask({ ...newTask, subject: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccioná una materia" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.id} value={s.name}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Prioridad</label>
                    <Select value={newTask.priority}
                      onValueChange={(v: "high"|"medium"|"low") => setNewTask({ ...newTask, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="low">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={addTask} className="w-full">Agregar Tarea</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay tareas pendientes.</p>
        ) : tasks.map(task => {
          const isExpanded = expandedId === task.id
          return (
            <div key={task.id}
              className={`rounded-lg border transition-all ${
                task.completed ? "bg-muted/30 border-border/30" : "bg-secondary/50 border-border/50"
              } ${isExpanded ? "border-primary/50 bg-primary/5" : "hover:border-border"}`}
            >
              {/* Row */}
              <div className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleExpand(task)}>
                <Checkbox checked={task.completed}
                  onCheckedChange={() => toggleTask(task.id)}
                  onClick={e => e.stopPropagation()}
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
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>

              {/* Expanded edit panel */}
              {isExpanded && editDraft && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Título</label>
                    <Input value={editDraft.title}
                      onChange={e => setEditDraft({ ...editDraft, title: e.target.value })}
                      className="h-8 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Materia</label>
                      <Select value={editDraft.subject}
                        onValueChange={v => setEditDraft({ ...editDraft, subject: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.name}>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />{s.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Prioridad</label>
                      <Select value={editDraft.priority}
                        onValueChange={(v: "high"|"medium"|"low") => setEditDraft({ ...editDraft, priority: v })}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="low">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Fecha límite</label>
                    <DateInput
                      value={editDraft.due_date || ""}
                      onChange={v => setEditDraft({ ...editDraft, due_date: v })}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive h-8"
                      onClick={() => deleteTask(task.id)}>
                      <Trash2 className="h-3.5 w-3.5" />Eliminar
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8"
                        onClick={() => { setExpandedId(null); setEditDraft(null) }}>
                        Cancelar
                      </Button>
                      <Button size="sm" className="h-8 gap-1.5" onClick={saveEdit} disabled={saving}>
                        <Save className="h-3.5 w-3.5" />{saving ? "Guardando..." : "Guardar"}
                      </Button>
                    </div>
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

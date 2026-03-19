"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Pencil, Trash2, Filter } from "lucide-react"
import { useState, useEffect } from "react"
import { TaskDialog } from "./task-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatLocalDate, isBeforeToday } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"

export interface Task {
  id: string
  title: string
  subject: string
  completed: boolean
  priority: "high" | "medium" | "low"
  dueDate?: string
  description?: string
}

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Repasar algoritmos de ordenamiento",
    subject: "Algoritmos",
    completed: false,
    priority: "high",
    dueDate: "2025-10-23",
    description: "Revisar quicksort, mergesort y heapsort",
  },
  {
    id: "2",
    title: "Completar ejercicios de cálculo",
    subject: "Matemática",
    completed: false,
    priority: "high",
    dueDate: "2025-10-22",
    description: "Ejercicios del capítulo 7",
  },
  {
    id: "3",
    title: "Leer capítulo 5 de Base de Datos",
    subject: "Base de Datos",
    completed: true,
    priority: "medium",
    dueDate: "2025-10-21",
  },
  {
    id: "4",
    title: "Práctica de SQL queries",
    subject: "Base de Datos",
    completed: false,
    priority: "medium",
    dueDate: "2025-10-24",
  },
]

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-accent/10 text-accent border-accent/20",
  low: "bg-muted text-muted-foreground border-border",
}

type FilterType = "all" | "pending" | "completed"
type SortType = "priority" | "dueDate" | "subject"

export function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)
  const [filter, setFilter] = useState<FilterType>("all")
  const [sort, setSort] = useState<SortType>("priority")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading tasks:", error)
    } else {
      setTasks(
        data.map((task) => ({
          id: task.id,
          title: task.title,
          subject: task.subject,
          completed: task.completed,
          priority: task.priority,
          dueDate: task.due_date,
          description: task.description,
        })),
      )
    }
    setIsLoading(false)
  }

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const supabase = createClient()
    const { error } = await supabase.from("tasks").update({ completed: !task.completed }).eq("id", id)

    if (error) {
      console.error("[v0] Error updating task:", error)
    } else {
      setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
      window.dispatchEvent(new Event("supabaseUpdate"))
    }
  }

  const addTask = async (task: Omit<Task, "id">) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: task.title,
        subject: task.subject,
        completed: task.completed,
        priority: task.priority,
        due_date: task.dueDate,
        description: task.description,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding task:", error)
    } else {
      const newTask = {
        id: data.id,
        title: data.title,
        subject: data.subject,
        completed: data.completed,
        priority: data.priority,
        dueDate: data.due_date,
        description: data.description,
      }
      setTasks([...tasks, newTask])
      window.dispatchEvent(new Event("supabaseUpdate"))
    }
  }

  const updateTask = async (id: string, updatedTask: Omit<Task, "id">) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("tasks")
      .update({
        title: updatedTask.title,
        subject: updatedTask.subject,
        completed: updatedTask.completed,
        priority: updatedTask.priority,
        due_date: updatedTask.dueDate,
        description: updatedTask.description,
      })
      .eq("id", id)

    if (error) {
      console.error("[v0] Error updating task:", error)
    } else {
      setTasks(tasks.map((task) => (task.id === id ? { ...updatedTask, id } : task)))
      window.dispatchEvent(new Event("supabaseUpdate"))
    }
  }

  const deleteTask = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting task:", error)
    } else {
      setTasks(tasks.filter((task) => task.id !== id))
      window.dispatchEvent(new Event("supabaseUpdate"))
    }
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingTask(undefined)
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.completed
    if (filter === "completed") return task.completed
    return true
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sort === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    }
    if (sort === "dueDate") {
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (sort === "subject") {
      return a.subject.localeCompare(b.subject)
    }
    return 0
  })

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false
    return isBeforeToday(task.dueDate)
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center py-8 text-muted-foreground">
          <p>Cargando tareas...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Tareas de Hoy</h3>
          <p className="text-sm text-muted-foreground mt-1">{tasks.filter((t) => !t.completed).length} pendientes</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
                <DropdownMenuRadioItem value="all">Todas</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pendientes</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completadas</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sort} onValueChange={(value) => setSort(value as SortType)}>
                <DropdownMenuRadioItem value="priority">Prioridad</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dueDate">Fecha límite</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="subject">Materia</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors group"
          >
            <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="mt-1" />
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium leading-relaxed ${task.completed ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </p>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-md border font-medium ${priorityColors[task.priority]}`}>
                  {task.subject}
                </span>
                {task.dueDate && (
                  <span
                    className={`text-xs px-2 py-1 rounded-md border font-medium ${
                      isOverdue(task)
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {formatLocalDate(task.dueDate, {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(task)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => deleteTask(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {sortedTasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay tareas {filter === "pending" ? "pendientes" : filter === "completed" ? "completadas" : ""}</p>
          </div>
        )}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSave={(task) => {
          if (editingTask) {
            updateTask(editingTask.id, task)
          } else {
            addTask(task)
          }
          handleDialogClose()
        }}
        task={editingTask}
      />
    </Card>
  )
}

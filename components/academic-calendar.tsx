"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, BookOpen, CheckSquare, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DateInput } from "@/components/ui/date-input"

interface CalendarEvent {
  id: string
  type: "task" | "exam"
  title: string
  subject: string
  date: string
  time?: string
  priority?: "high" | "medium" | "low"
  completed?: boolean
}

interface Subject {
  id: string
  name: string
  color: string
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  low: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
}

export function AcademicCalendar() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addType, setAddType] = useState<"task" | "exam">("task")
  const [newEvent, setNewEvent] = useState({
    title: "",
    subject: "",
    date: "",
    time: "",
    priority: "medium" as "high" | "medium" | "low",
    topics: "",
  })
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [tasksResult, examsResult, subjectsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .not("due_date", "is", null),
      supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id),
      supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
    ])

    const calendarEvents: CalendarEvent[] = []

    if (tasksResult.data) {
      tasksResult.data.forEach((t) => {
        if (t.due_date) {
          calendarEvents.push({
            id: t.id,
            type: "task",
            title: t.title,
            subject: t.subject,
            date: t.due_date,
            priority: t.priority,
            completed: t.completed,
          })
        }
      })
    }

    if (examsResult.data) {
      examsResult.data.forEach((e) => {
        calendarEvents.push({
          id: e.id,
          type: "exam",
          title: e.subject,
          subject: e.subject,
          date: e.date,
        })
      })
    }

    if (subjectsResult.data) setSubjects(subjectsResult.data)
    setEvents(calendarEvents)
    setLoading(false)
  }

  const addEvent = async () => {
    if (!newEvent.date) return
    if (addType === "task" && !newEvent.title) return
    if (addType === "exam" && !newEvent.subject) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    if (addType === "task") {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: newEvent.title,
          subject: newEvent.subject,
          priority: newEvent.priority,
          due_date: newEvent.date,
          completed: false,
        })
        .select()
        .single()

      if (!error && data) {
        setEvents([...events, {
          id: data.id,
          type: "task",
          title: data.title,
          subject: data.subject,
          date: data.due_date,
          priority: data.priority,
          completed: false,
        }])
      }
    } else {
      const topicsArray = newEvent.topics
        ? newEvent.topics.split(",").map((t) => t.trim()).filter(Boolean)
        : []
      const { data, error } = await supabase
        .from("exams")
        .insert({
          user_id: user.id,
          subject: newEvent.subject,
          date: newEvent.date,
          topics: topicsArray,
        })
        .select()
        .single()

      if (!error && data) {
        setEvents([...events, {
          id: data.id,
          type: "exam",
          title: data.subject,
          subject: data.subject,
          date: data.date,
        }])
      }
    }

    setNewEvent({ title: "", subject: "", date: "", time: "", priority: "medium", topics: "" })
    setAddDialogOpen(false)
  }

  const deleteEvent = async (event: CalendarEvent) => {
    const table = event.type === "task" ? "tasks" : "exams"
    const { error } = await supabase.from(table).delete().eq("id", event.id)
    if (!error) {
      setEvents(events.filter((e) => e.id !== event.id))
    }
  }

  // Calendar grid helpers
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => e.date === dateStr)
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  const openAddForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setNewEvent({ title: "", subject: "", date: dateStr, time: "", priority: "medium", topics: "" })
    setAddType("task")
    setAddDialogOpen(true)
  }

  const selectedDayEvents = selectedDay
    ? events.filter((e) => {
        const d = selectedDay
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        return e.date === dateStr
      })
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {MONTHS[month]} {year}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
                  >
                    Hoy
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayEvents = getEventsForDate(day)
                  const isSelected =
                    selectedDay &&
                    selectedDay.getDate() === day &&
                    selectedDay.getMonth() === month &&
                    selectedDay.getFullYear() === year

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(new Date(year, month, day))}
                      onDoubleClick={() => openAddForDay(day)}
                      className={`min-h-[56px] p-1 rounded-lg border text-left transition-all group ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : isToday(day)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/30 hover:border-border hover:bg-secondary/50"
                      }`}
                    >
                      <span
                        className={`text-xs font-semibold block mb-1 ${
                          isSelected ? "text-primary" : isToday(day) ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              ev.type === "exam"
                                ? "bg-red-500"
                                : ev.priority === "high"
                                ? "bg-orange-500"
                                : "bg-primary"
                            }`}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">+{dayEvents.length - 3}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Examen
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  Tarea alta prioridad
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Tarea
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day detail panel */}
        <div>
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {selectedDay
                    ? selectedDay.toLocaleDateString("es-AR", { day: "numeric", month: "long" })
                    : "Seleccioná un día"}
                </CardTitle>
                {selectedDay && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 gap-1"
                    onClick={() => {
                      const d = selectedDay
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
                      setNewEvent({ title: "", subject: "", date: dateStr, time: "", priority: "medium", topics: "" })
                      setAddType("task")
                      setAddDialogOpen(true)
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Agregar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!selectedDay ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Hacé clic en un día para ver sus eventos. Doble clic para agregar uno nuevo.
                </p>
              ) : selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay eventos este día.
                </p>
              ) : (
                selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-lg border ${
                      ev.type === "exam"
                        ? "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20"
                        : "border-border/50 bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {ev.type === "exam" ? (
                          <BookOpen className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        ) : (
                          <CheckSquare className={`h-4 w-4 mt-0.5 shrink-0 ${ev.completed ? "text-muted-foreground" : "text-primary"}`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${ev.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {ev.title}
                          </p>
                          {ev.subject && ev.type === "task" && (
                            <p className="text-xs text-muted-foreground mt-0.5">{ev.subject}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {ev.type === "task" && ev.priority && (
                          <Badge variant="secondary" className={`text-xs ${priorityColors[ev.priority]}`}>
                            {ev.priority === "high" ? "Alta" : ev.priority === "medium" ? "Media" : "Baja"}
                          </Badge>
                        )}
                        {ev.type === "exam" && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                            Examen
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteEvent(ev)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add event dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Type selector */}
            <div className="flex gap-2">
              <Button
                variant={addType === "task" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setAddType("task")}
              >
                <CheckSquare className="h-4 w-4" />
                Tarea
              </Button>
              <Button
                variant={addType === "exam" ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={() => setAddType("exam")}
              >
                <BookOpen className="h-4 w-4" />
                Examen
              </Button>
            </div>

            {addType === "task" && (
              <div className="grid gap-2">
                <Label>Título de la tarea</Label>
                <Input
                  placeholder="Ej: Estudiar capítulo 5"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Materia</Label>
              <Select value={newEvent.subject} onValueChange={(v) => setNewEvent({ ...newEvent, subject: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una materia" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Fecha</Label>
                <DateInput
                  value={newEvent.date}
                  onChange={(v) => setNewEvent({ ...newEvent, date: v })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Hora (opcional)</Label>
                <Input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
            </div>

            {addType === "task" && (
              <div className="grid gap-2">
                <Label>Prioridad</Label>
                <Select
                  value={newEvent.priority}
                  onValueChange={(v: "high" | "medium" | "low") => setNewEvent({ ...newEvent, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {addType === "exam" && (
              <div className="grid gap-2">
                <Label>Temas (separados por coma)</Label>
                <Input
                  placeholder="Ej: Capítulo 1, Capítulo 2"
                  value={newEvent.topics}
                  onChange={(e) => setNewEvent({ ...newEvent, topics: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
            <Button onClick={addEvent}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

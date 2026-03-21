"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Zap, Plus, BookOpen, ClipboardList, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react"
import { parseDateLocal, formatDateLocal } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"
import { DateInput } from "@/components/ui/date-input"

// ── Types ────────────────────────────────────────────────

export interface Exam {
  id: string
  subject: string
  date: string
  time?: string
  type?: string
  location?: string
  notes?: string
  topics: string[]
}

interface UpcomingEvent {
  id: string
  title: string
  type: "task" | "exam"
  subject?: string
  date: string
  time?: string
}

interface Subject {
  id: string
  name: string
  color: string
}

// ── Helpers ──────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  const target = parseDateLocal(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function getTemporalLabel(days: number): string {
  if (days < 0) return "Vencido"
  if (days === 0) return "Hoy"
  if (days === 1) return "Mañana"
  return `En ${days} días`
}

function getTemporalColor(days: number): string {
  if (days <= 1) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
  if (days <= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
  return "bg-secondary text-muted-foreground"
}

// ── Component ────────────────────────────────────────────

export function UpcomingExams() {
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newExam, setNewExam] = useState({ subject: "", date: "", topics: "" })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Exam | null>(null)
  const [editTopics, setEditTopics] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const todayStr = new Date().toISOString().split("T")[0]

    const [tasksResult, examsResult, subjectsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, subject, due_date")
        .eq("completed", false)
        .gte("due_date", todayStr)
        .order("due_date", { ascending: true })
        .limit(10),
      supabase
        .from("exams")
        .select("*")
        .gte("date", todayStr)
        .order("date", { ascending: true })
        .limit(10),
      supabase
        .from("subjects")
        .select("*")
        .order("name"),
    ])

    // Build unified event list
    const all: UpcomingEvent[] = []

    tasksResult.data?.forEach(t => {
      if (t.due_date) {
        all.push({
          id: t.id,
          title: t.title,
          type: "task",
          subject: t.subject || undefined,
          date: t.due_date,
        })
      }
    })

    examsResult.data?.forEach(e => {
      all.push({
        id: e.id,
        title: e.subject,
        type: "exam",
        subject: e.subject || undefined,
        date: e.date,
        time: e.time || undefined,
      })
    })

    // Sort by date, take first 3
    all.sort((a, b) => a.date.localeCompare(b.date))

    setEvents(all.slice(0, 3))
    if (examsResult.data) setExams(examsResult.data)
    if (subjectsResult.data) setSubjects(subjectsResult.data)
    setLoading(false)
  }

  // ── Exam CRUD (preserved) ──────────────────────────────

  const addExam = async () => {
    if (!newExam.subject || !newExam.date) return
    const topicsArray = newExam.topics
      ? newExam.topics.split(",").map(t => t.trim()).filter(Boolean)
      : []
    const { data, error } = await supabase.from("exams")
      .insert({ subject: newExam.subject, date: newExam.date, topics: topicsArray })
      .select().single()
    if (!error && data) {
      setNewExam({ subject: "", date: "", topics: "" })
      setDialogOpen(false)
      loadData()
    }
  }

  const saveEdit = async () => {
    if (!editDraft) return
    setSaving(true)
    const topicsArray = editTopics.split(",").map(t => t.trim()).filter(Boolean)
    const { error } = await supabase.from("exams").update({
      subject: editDraft.subject,
      date: editDraft.date,
      topics: topicsArray,
    }).eq("id", editDraft.id)
    if (!error) {
      setExpandedId(null)
      setEditDraft(null)
      loadData()
    }
    setSaving(false)
  }

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id)
    if (!error) {
      setExpandedId(null)
      loadData()
    }
  }

  const toggleExpand = (event: UpcomingEvent) => {
    if (event.type !== "exam") return
    if (expandedId === event.id) {
      setExpandedId(null)
      setEditDraft(null)
    } else {
      const exam = exams.find(e => e.id === event.id)
      if (exam) {
        setExpandedId(event.id)
        setEditDraft({ ...exam })
        setEditTopics((exam.topics || []).join(", "))
      }
    }
  }

  // ── Render ─────────────────────────────────────────────

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Próximos Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Próximos Eventos</CardTitle>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Plus className="h-3 w-3" />Examen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Examen</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Materia</label>
                  <Select value={newExam.subject} onValueChange={v => setNewExam({ ...newExam, subject: v })}>
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
                  <label className="text-sm font-medium mb-1.5 block">Fecha del examen</label>
                  <DateInput
                    value={newExam.date}
                    onChange={v => setNewExam({ ...newExam, date: v })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Temas (separados por coma)</label>
                  <Input placeholder="Ej: Capítulo 1, Capítulo 2, Ejercicios"
                    value={newExam.topics} onChange={e => setNewExam({ ...newExam, topics: e.target.value })} />
                </div>
                <Button onClick={addExam} className="w-full">Agregar Examen</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground/60 text-center py-4">
            No tenés eventos próximos
          </p>
        ) : events.map(event => {
          const days = getDaysUntil(event.date)
          const isExpanded = expandedId === event.id
          const isExam = event.type === "exam"

          return (
            <div
              key={`${event.type}-${event.id}`}
              className={`rounded-lg border transition-all ${
                isExpanded ? "border-primary/50 bg-primary/5" : "bg-secondary/30 border-border/50 hover:border-border"
              }`}
            >
              <div
                className={`flex items-center gap-3 p-3 ${isExam ? "cursor-pointer" : ""}`}
                onClick={() => isExam && toggleExpand(event)}
              >
                <div className={`p-1.5 rounded ${
                  isExam
                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                    : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                }`}>
                  {isExam
                    ? <BookOpen className="h-3.5 w-3.5" />
                    : <ClipboardList className="h-3.5 w-3.5" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {event.subject && event.type === "task" && (
                      <span className="text-[11px] text-muted-foreground">{event.subject} ·</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {isExam ? "examen" : "tarea"}
                    </span>
                    {event.time && (
                      <span className="text-[11px] text-muted-foreground">· {event.time}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className={`text-[11px] shrink-0 ${getTemporalColor(days)}`}>
                  {getTemporalLabel(days)}
                </Badge>
                {isExam && (
                  isExpanded
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>

              {/* Expanded edit panel (exams only) */}
              {isExpanded && editDraft && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <label className="text-xs font-medium text-muted-foreground">Materia</label>
                      <Select value={editDraft.subject} onValueChange={v => setEditDraft({ ...editDraft, subject: v })}>
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
                      <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                      <DateInput
                        value={editDraft.date}
                        onChange={v => setEditDraft({ ...editDraft, date: v })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs font-medium text-muted-foreground">Temas (separados por coma)</label>
                    <Input value={editTopics} onChange={e => setEditTopics(e.target.value)}
                      className="h-8 text-sm" placeholder="Ej: Capítulo 1, Capítulo 2" />
                  </div>
                  {editTopics.trim() && (
                    <div className="flex flex-wrap gap-1">
                      {editTopics.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive h-8"
                      onClick={() => deleteExam(event.id)}>
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

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Plus, Trash2, ChevronDown, ChevronUp, Save } from "lucide-react"
import { parseDateLocal, formatDateLocal } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"
import { DateInput } from "@/components/ui/date-input"

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

interface Subject {
  id: string
  name: string
  color: string
}

export function UpcomingExams() {
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [examsResult, subjectsResult] = await Promise.all([
      supabase.from("exams").select("*").eq("user_id", user.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true }).limit(4),
      supabase.from("subjects").select("*").eq("user_id", user.id).order("name"),
    ])
    if (examsResult.data) setExams(examsResult.data)
    if (subjectsResult.data) setSubjects(subjectsResult.data)
    setLoading(false)
  }

  const addExam = async () => {
    if (!newExam.subject || !newExam.date) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const topicsArray = newExam.topics
      ? newExam.topics.split(",").map(t => t.trim()).filter(Boolean)
      : []
    const { data, error } = await supabase.from("exams")
      .insert({ user_id: user.id, subject: newExam.subject, date: newExam.date, topics: topicsArray })
      .select().single()
    if (!error && data) {
      setExams([...exams, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      setNewExam({ subject: "", date: "", topics: "" })
      setDialogOpen(false)
    }
  }

  const saveEdit = async () => {
    if (!editDraft) return
    setSaving(true)
    const topicsArray = editTopics.split(",").map(t => t.trim()).filter(Boolean)
    const updated = { ...editDraft, topics: topicsArray }
    const { error } = await supabase.from("exams").update({
      subject: updated.subject,
      date: updated.date,
      topics: updated.topics,
    }).eq("id", updated.id)
    if (!error) {
      setExams(exams.map(e => e.id === updated.id ? updated : e)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
      setExpandedId(null)
      setEditDraft(null)
    }
    setSaving(false)
  }

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from("exams").delete().eq("id", id)
    if (!error) {
      setExams(exams.filter(e => e.id !== id))
      setExpandedId(null)
    }
  }

  const toggleExpand = (exam: Exam) => {
    if (expandedId === exam.id) {
      setExpandedId(null)
      setEditDraft(null)
    } else {
      setExpandedId(exam.id)
      setEditDraft({ ...exam })
      setEditTopics((exam.topics || []).join(", "))
    }
  }

  const getDaysUntil = (dateStr: string) => {
    const examDate = parseDateLocal(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
    if (days <= 7) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
    return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
  }

  if (loading) return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Proximos Examenes</CardTitle></CardHeader>
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
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Proximos Examenes</CardTitle>
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
                    <SelectTrigger><SelectValue placeholder="Selecciona una materia" /></SelectTrigger>
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
                  <Input placeholder="Ej: Capitulo 1, Capitulo 2, Ejercicios"
                    value={newExam.topics} onChange={e => setNewExam({ ...newExam, topics: e.target.value })} />
                </div>
                <Button onClick={addExam} className="w-full">Agregar Examen</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay examenes programados.</p>
        ) : exams.map(exam => {
          const daysUntil = getDaysUntil(exam.date)
          const isExpanded = expandedId === exam.id
          return (
            <div key={exam.id}
              className={`rounded-lg border transition-all ${
                isExpanded ? "border-primary/50 bg-primary/5" : "bg-secondary/30 border-border/50 hover:border-border"
              }`}
            >
              {/* Row */}
              <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleExpand(exam)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{exam.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDateLocal(exam.date)}</p>
                </div>
                <Badge variant="secondary" className={`text-xs shrink-0 ${getUrgencyColor(daysUntil)}`}>
                  {daysUntil === 0 ? "Hoy" : daysUntil === 1 ? "Mañana" : `${daysUntil} días`}
                </Badge>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </div>

              {/* Expanded edit panel */}
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
                      className="h-8 text-sm" placeholder="Ej: Capitulo 1, Capitulo 2" />
                  </div>
                  {/* Topics preview */}
                  {editTopics.trim() && (
                    <div className="flex flex-wrap gap-1">
                      {editTopics.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive h-8"
                      onClick={() => deleteExam(exam.id)}>
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

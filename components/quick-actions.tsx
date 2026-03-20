"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, BookOpen, Clock, FolderOpen, Zap } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { DateInput } from "@/components/ui/date-input"

interface Subject {
  id: string
  name: string
  color: string
}

export function QuickActions() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [taskOpen, setTaskOpen] = useState(false)
  const [examOpen, setExamOpen] = useState(false)
  const [studyOpen, setStudyOpen] = useState(false)
  const [newTask, setNewTask] = useState({ title: "", subject: "", priority: "medium" as "high" | "medium" | "low", due_date: "" })
  const [newExam, setNewExam] = useState({ subject: "", date: "", topics: "" })
  const [newStudy, setNewStudy] = useState({ duration: "", subject: "" })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("name")
    if (data) setSubjects(data)
  }

  const addTask = async () => {
    if (!newTask.title) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTask.title,
      subject: newTask.subject,
      priority: newTask.priority,
      due_date: newTask.due_date || null,
      completed: false,
    })
    setNewTask({ title: "", subject: "", priority: "medium", due_date: "" })
    setTaskOpen(false)
    setSaving(false)
  }

  const addExam = async () => {
    if (!newExam.subject || !newExam.date) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    const topicsArray = newExam.topics
      ? newExam.topics.split(",").map((t) => t.trim()).filter(Boolean)
      : []
    await supabase.from("exams").insert({
      user_id: user.id,
      subject: newExam.subject,
      date: newExam.date,
      topics: topicsArray,
    })
    setNewExam({ subject: "", date: "", topics: "" })
    setExamOpen(false)
    setSaving(false)
  }

  const addStudySession = async () => {
    if (!newStudy.duration) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    await supabase.from("study_sessions").insert({
      user_id: user.id,
      duration_minutes: parseInt(newStudy.duration),
      subject: newStudy.subject || null,
      date: new Date().toISOString().split("T")[0],
    })
    setNewStudy({ duration: "", subject: "" })
    setStudyOpen(false)
    setSaving(false)
  }

  return (
    <>
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Acciones Rapidas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="default"
            className="w-full justify-start gap-2 h-9 text-sm"
            size="sm"
            onClick={() => setTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Agregar Tarea
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-9 text-sm"
            size="sm"
            onClick={() => setExamOpen(true)}
          >
            <BookOpen className="h-4 w-4" />
            Agregar Examen
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-9 text-sm"
            size="sm"
            onClick={() => setStudyOpen(true)}
          >
            <Clock className="h-4 w-4" />
            Registrar Estudio
          </Button>
          <Link href="/subjects" className="block">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 h-9 text-sm"
              size="sm"
            >
              <FolderOpen className="h-4 w-4" />
              Gestionar Materias
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Título</Label>
              <Input
                placeholder="Ej: Estudiar capítulo 5"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Materia</Label>
              <Select value={newTask.subject} onValueChange={(v) => setNewTask({ ...newTask, subject: v })}>
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
                <Label>Prioridad</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v: "high" | "medium" | "low") => setNewTask({ ...newTask, priority: v })}
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
              <div className="grid gap-2">
                <Label>Fecha límite</Label>
                <DateInput
                  value={newTask.due_date}
                  onChange={(v) => setNewTask({ ...newTask, due_date: v })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskOpen(false)}>Cancelar</Button>
            <Button onClick={addTask} disabled={saving}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exam Dialog */}
      <Dialog open={examOpen} onOpenChange={setExamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Examen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Materia</Label>
              <Select value={newExam.subject} onValueChange={(v) => setNewExam({ ...newExam, subject: v })}>
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
            <div className="grid gap-2">
              <Label>Fecha del examen</Label>
              <DateInput
                value={newExam.date}
                onChange={(v) => setNewExam({ ...newExam, date: v })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label>Temas (separados por coma)</Label>
              <Input
                placeholder="Ej: Capítulo 1, Capítulo 2"
                value={newExam.topics}
                onChange={(e) => setNewExam({ ...newExam, topics: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamOpen(false)}>Cancelar</Button>
            <Button onClick={addExam} disabled={saving}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Study Session Dialog */}
      <Dialog open={studyOpen} onOpenChange={setStudyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Sesión de Estudio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid gap-2">
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ej: 60"
                value={newStudy.duration}
                onChange={(e) => setNewStudy({ ...newStudy, duration: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Materia (opcional)</Label>
              <Select value={newStudy.subject} onValueChange={(v) => setNewStudy({ ...newStudy, subject: v })}>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudyOpen(false)}>Cancelar</Button>
            <Button onClick={addStudySession} disabled={saving}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

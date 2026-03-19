"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BookOpen, Plus, ChevronRight, Calendar } from "lucide-react"
import { parseDateLocal, formatDateLocal } from "@/lib/date-utils"
import { createClient } from "@/lib/supabase/client"

interface Exam {
  id: string
  subject: string
  date: string
  topics: string[]
  progress?: number
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
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [examsResult, subjectsResult] = await Promise.all([
      supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(4),
      supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })
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

    const { data, error } = await supabase
      .from("exams")
      .insert({
        user_id: user.id,
        subject: newExam.subject,
        date: newExam.date,
        topics: topicsArray
      })
      .select()
      .single()

    if (!error && data) {
      setExams([...exams, data].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ))
      setNewExam({ subject: "", date: "", topics: "" })
      setDialogOpen(false)
    }
  }

  const getDaysUntil = (dateStr: string) => {
    const examDate = parseDateLocal(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getUrgencyColor = (days: number) => {
    if (days <= 3) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
    if (days <= 7) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
    return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
  }

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Proximos Examenes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

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
                <Plus className="h-3 w-3" />
                Examen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Examen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Materia</label>
                  <Select
                    value={newExam.subject}
                    onValueChange={(value) => setNewExam({ ...newExam, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una materia" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.name}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: subject.color }}
                            />
                            {subject.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fecha del examen</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={newExam.date}
                      onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
                      className="pl-9"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Temas (separados por coma)</label>
                  <Input
                    placeholder="Ej: Capitulo 1, Capitulo 2, Ejercicios"
                    value={newExam.topics}
                    onChange={(e) => setNewExam({ ...newExam, topics: e.target.value })}
                  />
                </div>
                <Button onClick={addExam} className="w-full">
                  Agregar Examen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {exams.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay examenes programados. Agrega uno nuevo.
          </p>
        ) : (
          exams.map((exam) => {
            const daysUntil = getDaysUntil(exam.date)
            const progress = exam.progress || 0
            return (
              <div
                key={exam.id}
                className="p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 hover:border-border transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{exam.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateLocal(exam.date)}
                    </p>
                  </div>
                  <Badge variant="secondary" className={`text-xs ml-2 ${getUrgencyColor(daysUntil)}`}>
                    {daysUntil === 0 ? "Hoy" : daysUntil === 1 ? "Manana" : `${daysUntil} dias`}
                  </Badge>
                </div>
                {exam.topics && exam.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {exam.topics.slice(0, 3).map((topic, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {exam.topics.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{exam.topics.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progreso de estudio</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>
              </div>
            )
          })
        )}
        <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground gap-1">
          Ver todos los examenes
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

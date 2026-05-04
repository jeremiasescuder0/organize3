"use client"

import { useState, useEffect, useCallback } from "react"
import { Pencil, Trash2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EVENTS } from "@/lib/events"
import { ExamDialog } from "@/components/exam-dialog"
import type { Exam as DialogExam } from "@/components/exam-dialog"

interface Exam {
  id: string
  subject: string
  date: string
  time?: string
  type?: string
  location?: string
  notes?: string
  topics: string[]
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDays(days: number): string {
  if (days === 0) return "hoy"
  if (days === 1) return "mañana"
  return `en ${days} días`
}

function daysClass(days: number): string {
  if (days <= 1) return "text-foreground"
  if (days <= 3) return "text-muted-foreground"
  return "text-muted-foreground/50"
}

export function ExamFocus() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [enteringIds, setEnteringIds] = useState<Set<string>>(new Set())
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingExam, setEditingExam] = useState<Exam | null>(null)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(10)
    if (data) {
      const currentIds = new Set(exams.map(e => e.id))
      const newIds = new Set<string>()
      data.forEach(e => { if (!currentIds.has(e.id)) newIds.add(e.id) })
      setExams(data)
      if (newIds.size > 0 && !loading) {
        setEnteringIds(newIds)
        setTimeout(() => setEnteringIds(new Set()), 500)
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const onExamAdded = () => loadData()
    window.addEventListener(EVENTS.EXAM_ADDED, onExamAdded)
    return () => window.removeEventListener(EVENTS.EXAM_ADDED, onExamAdded)
  }, [loadData])

  const confirmDelete = async () => {
    if (!deletingId) return
    const id = deletingId
    setDeletingId(null)
    await supabase.from("exams").delete().eq("id", id)
    setExams(prev => prev.filter(e => e.id !== id))
    window.dispatchEvent(new CustomEvent(EVENTS.EXAM_ADDED))
  }

  const handleEditSave = async (updated: Omit<DialogExam, "id">) => {
    if (!editingExam) return
    await supabase.from("exams").update({
      subject: updated.subject,
      date: updated.date,
      time: updated.time,
      type: updated.type,
      location: updated.location,
      notes: updated.notes,
      topics: updated.topics,
    }).eq("id", editingExam.id)
    setEditingExam(null)
    loadData()
    window.dispatchEvent(new CustomEvent(EVENTS.EXAM_ADDED))
  }

  return (
    <>
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-sm text-muted-foreground">Exámenes</span>
          {!loading && <span className="text-xs text-muted-foreground/50">{exams.length}</span>}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground/40 py-4">—</p>
        ) : exams.length === 0 ? (
          <p className="text-sm text-muted-foreground/40 py-2">Sin exámenes próximos.</p>
        ) : (
          <div>
            {exams.map(exam => {
              const days = getDaysUntil(exam.date)
              const isEntering = enteringIds.has(exam.id)
              const isDeleting = deletingId === exam.id

              return (
                <div
                  key={exam.id}
                  className={`group border-b border-border/20 last:border-0 ${
                    isEntering ? "animate-in fade-in duration-300" : ""
                  }`}
                >
                  <div className={`flex items-center gap-3 py-2.5 -mx-2 px-2 rounded-sm transition-colors ${
                    !isDeleting ? "hover:bg-muted/30" : ""
                  }`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground">{exam.subject}</span>
                      {exam.type && exam.type !== "Parcial" && (
                        <span className="text-xs text-muted-foreground/50 ml-2">{exam.type}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs ${daysClass(days)}`}>{formatDays(days)}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingExam(exam); setDeletingId(null) }}
                          className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => { setDeletingId(exam.id); setEditingExam(null) }}
                          className="p-1 text-muted-foreground/40 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isDeleting && (
                    <div className="pb-3 pl-2 animate-in fade-in duration-150">
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

      <ExamDialog
        open={!!editingExam}
        onOpenChange={open => { if (!open) setEditingExam(null) }}
        onSave={handleEditSave}
        exam={editingExam ?? undefined}
      />
    </>
  )
}

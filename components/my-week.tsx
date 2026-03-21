"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar, ChevronLeft, ChevronRight, BookOpen, ClipboardList,
  Trash2, ChevronDown, ChevronUp, Save,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DateInput } from "@/components/ui/date-input"

// ── Types ────────────────────────────────────────────────

interface WeekItem {
  id: string
  title: string
  type: "task" | "exam"
  subject?: string
  date: string
  time?: string
  topics?: string[]
}

interface WeekDay {
  date: string
  label: string
  dayNumber: number
  isToday: boolean
  total: number
  items: WeekItem[]
}

interface SubjectOption {
  id: string
  name: string
  color: string
}

// ── Helpers ──────────────────────────────────────────────

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

function getWeekDates(offset: number): Date[] {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatWeekRange(dates: Date[]): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${dates[0].toLocaleDateString("es-AR", opts)} — ${dates[6].toLocaleDateString("es-AR", opts)}`
}

function formatDayFull(date: Date): string {
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

function getTemporalLabel(dateStr: string): string {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return "Vencido"
  if (diff === 0) return "Hoy"
  if (diff === 1) return "Mañana"
  return `En ${diff} días`
}

function getTemporalColor(dateStr: string): string {
  const target = new Date(dateStr + "T12:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diff <= 1) return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
  if (diff <= 3) return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
  return "bg-secondary text-muted-foreground"
}

// ── Component ────────────────────────────────────────────

export function MyWeek() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [items, setItems] = useState<WeekItem[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<WeekItem | null>(null)
  const [editTopics, setEditTopics] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const isCurrentWeek = weekOffset === 0

  const loadData = useCallback(async () => {
    setLoading(true)
    const mondayStr = toDateStr(weekDates[0])
    const sundayStr = toDateStr(weekDates[6])

    const [tasksResult, examsResult, subjectsResult] = await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, subject, due_date")
        .eq("completed", false)
        .gte("due_date", mondayStr)
        .lte("due_date", sundayStr),
      supabase
        .from("exams")
        .select("id, subject, date, time")
        .gte("date", mondayStr)
        .lte("date", sundayStr),
      supabase
        .from("subjects")
        .select("id, name, color")
        .order("name"),
    ])

    const result: WeekItem[] = []

    tasksResult.data?.forEach(t => {
      if (t.due_date) {
        result.push({ id: t.id, title: t.title, type: "task", subject: t.subject || undefined, date: t.due_date })
      }
    })

    examsResult.data?.forEach(e => {
      result.push({
        id: e.id, title: e.subject, type: "exam", subject: e.subject || undefined,
        date: e.date, time: e.time || undefined,
      })
    })

    setItems(result)
    if (subjectsResult.data) setSubjects(subjectsResult.data)
    setLoading(false)
  }, [weekOffset])

  useEffect(() => { loadData() }, [loadData])

  // Build days
  const days: WeekDay[] = useMemo(() => {
    return weekDates.map((date, i) => {
      const dateStr = toDateStr(date)
      const dayItems = items.filter(item => item.date === dateStr)
      return {
        date: dateStr,
        label: DAY_LABELS[i],
        dayNumber: date.getDate(),
        isToday: isSameDate(date, today),
        total: dayItems.length,
        items: dayItems,
      }
    })
  }, [weekDates, items])

  // Default selection
  useEffect(() => {
    const todayDay = days.find(d => d.isToday)
    setSelectedDate(todayDay ? todayDay.date : days[0]?.date ?? "")
    setExpandedId(null)
    setEditDraft(null)
  }, [weekOffset])

  const selectedDay = days.find(d => d.date === selectedDate) ?? days[0]
  const weekTotal = days.reduce((sum, d) => sum + d.total, 0)

  // ── Exam edit/delete ────────────────────────────────────

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
      setEditDraft(null)
      loadData()
    }
  }

  const toggleExpand = (item: WeekItem) => {
    if (item.type !== "exam") return
    if (expandedId === item.id) {
      setExpandedId(null)
      setEditDraft(null)
    } else {
      setExpandedId(item.id)
      setEditDraft({ ...item })
      setEditTopics((item.topics || []).join(", "))
    }
  }

  // ── Render ─────────────────────────────────────────────

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Mi Semana</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(o => o - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[130px] text-center">
              {isCurrentWeek ? "Esta semana" : formatWeekRange(weekDates)}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setWeekOffset(o => o + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Day cards ── */}
        <div className="grid grid-cols-7 gap-1.5">
          {days.map(day => {
            const isSelected = day.date === selectedDate
            return (
              <button
                key={day.date}
                onClick={() => { setSelectedDate(day.date); setExpandedId(null); setEditDraft(null) }}
                className={`
                  text-center rounded-lg border p-2.5 transition-all cursor-pointer
                  ${isSelected
                    ? day.isToday
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-accent border-primary/40 shadow-sm"
                    : day.isToday
                      ? "bg-primary/10 border-primary/30 hover:border-primary/50"
                      : "bg-secondary/40 border-border/40 hover:border-border hover:bg-secondary/60"
                  }
                `}
              >
                <p className={`text-[11px] font-medium ${
                  isSelected && day.isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}>
                  {day.label}
                </p>
                <p className={`text-base font-semibold mt-0.5 ${
                  isSelected && day.isToday ? "" : "text-foreground"
                }`}>
                  {day.dayNumber}
                </p>

                {/* Activity dots */}
                {!loading && (
                  <div className="flex justify-center gap-[3px] mt-1.5 h-[6px]">
                    {day.items.slice(0, 4).map((item, i) => (
                      <div
                        key={i}
                        className={`w-[5px] h-[5px] rounded-full ${
                          isSelected && day.isToday
                            ? "bg-primary-foreground/60"
                            : item.type === "exam"
                              ? "bg-amber-400 dark:bg-amber-500"
                              : "bg-blue-400 dark:bg-blue-500"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Day detail panel ── */}
        {selectedDate && selectedDay && (
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
            <button
              className="flex items-center justify-between w-full text-left cursor-pointer group"
              onClick={() => setSelectedDate("")}
            >
              <p className="text-sm font-medium capitalize">
                {formatDayFull(new Date(selectedDay.date + "T12:00:00"))}
              </p>
              <div className="flex items-center gap-1.5">
                {selectedDay.isToday && (
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                    Hoy
                  </Badge>
                )}
                <ChevronUp className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </div>
            </button>
            <div className="mt-3" />

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : selectedDay.items.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 py-3">
                No tenés pendientes para este día
              </p>
            ) : (
              <div className="space-y-1">
                {selectedDay.items.slice(0, 4).map(item => {
                  const isExam = item.type === "exam"
                  const isExpanded = expandedId === item.id

                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={`rounded-md transition-all ${
                        isExpanded ? "bg-primary/5 border border-primary/30" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-3 py-2 px-1 ${isExam ? "cursor-pointer" : ""}`}
                        onClick={() => isExam && toggleExpand(item)}
                      >
                        <div className={`p-1 rounded ${
                          isExam
                            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                            : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                        }`}>
                          {isExam
                            ? <BookOpen className="h-3 w-3" />
                            : <ClipboardList className="h-3 w-3" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{item.title}</p>
                          <div className="flex items-center gap-1.5">
                            {item.subject && !isExam && (
                              <span className="text-[11px] text-muted-foreground">{item.subject} ·</span>
                            )}
                            <span className={`text-[11px] ${
                              isExam ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"
                            }`}>
                              {isExam ? "examen" : "tarea"}
                            </span>
                            {item.time && (
                              <span className="text-[11px] text-muted-foreground">· {item.time}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${getTemporalColor(item.date)}`}>
                          {getTemporalLabel(item.date)}
                        </Badge>
                        {isExam && (
                          isExpanded
                            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                      </div>

                      {/* Inline exam edit */}
                      {isExpanded && editDraft && (
                        <div className="px-3 pb-3 space-y-3 border-t border-border/40 pt-3 mt-1">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Materia</label>
                              <Select value={editDraft.subject ?? ""} onValueChange={v => setEditDraft({ ...editDraft, subject: v })}>
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
                            <div className="grid gap-1.5">
                              <label className="text-xs font-medium text-muted-foreground">Fecha</label>
                              <DateInput value={editDraft.date} onChange={v => setEditDraft({ ...editDraft, date: v })} className="h-8 text-sm" />
                            </div>
                          </div>
                          <div className="grid gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Temas</label>
                            <Input value={editTopics} onChange={e => setEditTopics(e.target.value)} className="h-8 text-sm" placeholder="Separados por coma" />
                          </div>
                          {editTopics.trim() && (
                            <div className="flex flex-wrap gap-1">
                              {editTopics.split(",").map(t => t.trim()).filter(Boolean).map((t, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1">
                            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive h-7 text-xs"
                              onClick={() => deleteExam(item.id)}>
                              <Trash2 className="h-3 w-3" />Eliminar
                            </Button>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="h-7 text-xs"
                                onClick={() => { setExpandedId(null); setEditDraft(null) }}>Cancelar</Button>
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={saveEdit} disabled={saving}>
                                <Save className="h-3 w-3" />{saving ? "..." : "Guardar"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                {selectedDay.items.length > 4 && (
                  <p className="text-[11px] text-muted-foreground/50 pl-8 pt-1">
                    +{selectedDay.items.length - 4} más
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Footer: summary ── */}
        {!loading && (
          <p className="text-xs text-muted-foreground pt-1">
            {weekTotal === 0 ? "Semana libre" : `${weekTotal} pendiente${weekTotal !== 1 ? "s" : ""} esta semana`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft, Plus, Save, Search, StickyNote,
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, List, ListOrdered,
  Link, AlignLeft, AlignCenter, AlignRight, Eraser,
  Calendar, BookOpen, Trash2, Clock,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────
interface Note {
  id: string
  subjectId: string
  subjectName: string
  subjectColor: string
  title: string
  date: string        // YYYY-MM-DD
  content: string     // HTML
  createdAt: string
  updatedAt: string
}

interface Subject {
  id: string
  name: string
  color: string
}

// ── Helpers ────────────────────────────────────────────
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })
}

function groupLabel(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diff === 0) return "Hoy"
  if (diff === 1) return "Ayer"
  if (diff <= 7) return "Esta semana"
  if (diff <= 30) return "Este mes"
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" })
}

function groupOrder(label: string) {
  const order: Record<string, number> = { "Hoy": 0, "Ayer": 1, "Esta semana": 2, "Este mes": 3 }
  return order[label] ?? 99
}

// ── Main component ─────────────────────────────────────
export function SubjectNotes() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // List view filters
  const [search, setSearch] = useState("")
  const [filterSubject, setFilterSubject] = useState("all")
  const [groupBy, setGroupBy] = useState<"subject" | "date">("date")

  // Editor state
  const [editing, setEditing] = useState<Note | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saved, setSaved] = useState(true)
  const [linkUrl, setLinkUrl] = useState("")
  const [showLink, setShowLink] = useState(false)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const editorRef = useRef<HTMLDivElement>(null)

  const supabase = createClient()
  const storageKey = (uid: string) => `organize_notes_v2_${uid}`

  // ── Load ──────────────────────────────────────────────
  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: subs } = await supabase
      .from("subjects").select("*").eq("user_id", user.id).order("name")
    if (subs) setSubjects(subs)

    const raw = localStorage.getItem(storageKey(user.id))
    setNotes(raw ? JSON.parse(raw) : [])
    setLoading(false)
  }

  const persist = (updated: Note[], uid: string) => {
    localStorage.setItem(storageKey(uid), JSON.stringify(updated))
    setNotes(updated)
  }

  // ── Editor init ───────────────────────────────────────
  useEffect(() => {
    if (!editing || !editorRef.current) return
    editorRef.current.innerHTML = editing.content || ""
    editorRef.current.focus()
  }, [editing?.id])

  // ── Save ──────────────────────────────────────────────
  const saveNote = useCallback(() => {
    if (!editing || !userId || !editorRef.current) return
    const content = editorRef.current.innerHTML
    const updated = notes.map(n =>
      n.id === editing.id
        ? { ...n, title: editing.title, date: editing.date,
            subjectId: editing.subjectId, subjectName: editing.subjectName,
            subjectColor: editing.subjectColor, content, updatedAt: new Date().toISOString() }
        : n
    )
    // If new note not yet in array, add it
    if (!notes.find(n => n.id === editing.id)) {
      updated.push({ ...editing, content, updatedAt: new Date().toISOString() })
    }
    persist(updated.sort((a,b) => b.date.localeCompare(a.date)), userId)
    setSaved(true)
  }, [editing, userId, notes])

  useEffect(() => {
    if (saved || !editing) return
    const t = setTimeout(() => saveNote(), 2000)
    return () => clearTimeout(t)
  }, [saved, editing, saveNote])

  // ── New note ──────────────────────────────────────────
  const createNote = () => {
    const defaultSubject = subjects[0]
    const note: Note = {
      id: Date.now().toString(),
      subjectId: defaultSubject?.id || "",
      subjectName: defaultSubject?.name || "",
      subjectColor: defaultSubject?.color || "#6366f1",
      title: "",
      date: new Date().toISOString().split("T")[0],
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setEditing(note)
    setIsNew(true)
    setSaved(false)
  }

  const deleteNote = (id: string) => {
    if (!userId) return
    persist(notes.filter(n => n.id !== id), userId)
  }

  const changeSubject = (subjectId: string) => {
    const sub = subjects.find(s => s.id === subjectId)
    if (!sub || !editing) return
    setEditing({ ...editing, subjectId: sub.id, subjectName: sub.name, subjectColor: sub.color })
    setSaved(false)
  }

  // ── Rich text ─────────────────────────────────────────
  const updateFormats = () => {
    const f = new Set<string>()
    try {
      if (document.queryCommandState("bold")) f.add("bold")
      if (document.queryCommandState("italic")) f.add("italic")
      if (document.queryCommandState("underline")) f.add("underline")
      if (document.queryCommandState("strikeThrough")) f.add("strikeThrough")
    } catch {}
    setActiveFormats(f)
  }

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    editorRef.current?.focus()
    updateFormats()
    setSaved(false)
  }

  const insertLink = () => {
    if (!linkUrl) return
    exec("createLink", linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`)
    setLinkUrl(""); setShowLink(false)
  }

  // ── Filtered & grouped notes ──────────────────────────
  const filtered = notes.filter(n => {
    const matchSearch = search === "" ||
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      stripHtml(n.content).toLowerCase().includes(search.toLowerCase())
    const matchSubject = filterSubject === "all" || n.subjectId === filterSubject
    return matchSearch && matchSubject
  })

  const grouped: Record<string, Note[]> = {}
  filtered.forEach(n => {
    const key = groupBy === "subject" ? n.subjectName : groupLabel(n.date)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(n)
  })

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) =>
    groupBy === "date" ? groupOrder(a) - groupOrder(b) : a.localeCompare(b)
  )

  // ── Loading ───────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // ── Editor view ───────────────────────────────────────
  if (editing) return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" className="gap-2"
          onClick={() => { saveNote(); setEditing(null); setIsNew(false) }}>
          <ArrowLeft className="h-4 w-4" />
          Apuntes
        </Button>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="ghost" size="sm"
              className="text-muted-foreground hover:text-destructive gap-2"
              onClick={() => { deleteNote(editing.id); setEditing(null) }}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          )}
          <Button size="sm" variant={saved ? "outline" : "default"} className="gap-2"
            onClick={saveNote}>
            <Save className="h-3.5 w-3.5" />
            {saved ? "Guardado" : "Guardar"}
          </Button>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {/* Meta row: title, subject, date */}
          <div className="px-6 pt-5 pb-4 border-b border-border/50 space-y-3"
            style={{ borderLeft: `4px solid ${editing.subjectColor}` }}>
            <Input
              value={editing.title}
              onChange={e => { setEditing({ ...editing, title: e.target.value }); setSaved(false) }}
              placeholder="Título del apunte..."
              className="border-0 border-b border-border/50 rounded-none px-0 text-xl font-bold focus-visible:ring-0 bg-transparent"
            />
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <Select value={editing.subjectId} onValueChange={changeSubject}>
                  <SelectTrigger className="h-7 border-0 bg-transparent px-0 text-sm focus:ring-0 w-auto gap-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <input
                  type="date"
                  value={editing.date}
                  onChange={e => { setEditing({ ...editing, date: e.target.value }); setSaved(false) }}
                  className="bg-transparent border-0 text-sm text-muted-foreground focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-border/50 bg-secondary/30">
            <TB icon={Heading1} title="Título 1" onClick={() => exec("formatBlock","h1")} />
            <TB icon={Heading2} title="Título 2" onClick={() => exec("formatBlock","h2")} />
            <Sep />
            <TB icon={Bold} title="Negrita (Ctrl+B)" active={activeFormats.has("bold")} onClick={() => exec("bold")} />
            <TB icon={Italic} title="Itálica (Ctrl+I)" active={activeFormats.has("italic")} onClick={() => exec("italic")} />
            <TB icon={Underline} title="Subrayado (Ctrl+U)" active={activeFormats.has("underline")} onClick={() => exec("underline")} />
            <TB icon={Strikethrough} title="Tachado" active={activeFormats.has("strikeThrough")} onClick={() => exec("strikeThrough")} />
            <Sep />
            <TB icon={List} title="Lista con viñetas" onClick={() => exec("insertUnorderedList")} />
            <TB icon={ListOrdered} title="Lista numerada" onClick={() => exec("insertOrderedList")} />
            <Sep />
            <TB icon={AlignLeft} title="Izquierda" onClick={() => exec("justifyLeft")} />
            <TB icon={AlignCenter} title="Centro" onClick={() => exec("justifyCenter")} />
            <TB icon={AlignRight} title="Derecha" onClick={() => exec("justifyRight")} />
            <Sep />
            <TB icon={Link} title="Insertar enlace" onClick={() => setShowLink(!showLink)} />
            <TB icon={Eraser} title="Limpiar formato" onClick={() => exec("removeFormat")} />
          </div>

          {showLink && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-secondary/20">
              <Input placeholder="https://..." value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                className="h-8 text-sm" autoFocus
                onKeyDown={e => e.key === "Enter" && insertLink()} />
              <Button size="sm" className="h-8" onClick={insertLink}>Insertar</Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowLink(false)}>×</Button>
            </div>
          )}

          {/* Editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={() => { setSaved(false) }}
            onKeyUp={updateFormats}
            onMouseUp={updateFormats}
            className="min-h-[500px] px-8 py-6 focus:outline-none text-sm leading-relaxed text-foreground
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4
              [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
              [&_li]:my-1 [&_a]:text-primary [&_a]:underline
              [&_b]:font-bold [&_strong]:font-bold
              [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through"
            data-placeholder="Empezá a escribir..."
          />
        </CardContent>
      </Card>
    </div>
  )

  // ── List view ─────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Mis Apuntes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{notes.length} apunte{notes.length !== 1 ? "s" : ""} guardado{notes.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="gap-2" onClick={createNote} disabled={subjects.length === 0}>
          <Plus className="h-4 w-4" />
          Nuevo apunte
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar apuntes..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas las materias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las materias</SelectItem>
            {subjects.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Group by toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setGroupBy("date")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              groupBy === "date" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Por fecha
          </button>
          <button
            onClick={() => setGroupBy("subject")}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
              groupBy === "subject" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Por materia
          </button>
        </div>
      </div>

      {/* Empty state */}
      {notes.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <StickyNote className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="font-medium text-muted-foreground">No hay apuntes todavía.</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Creá tu primer apunte con el botón de arriba.</p>
            <Button className="mt-6 gap-2" onClick={createNote} disabled={subjects.length === 0}>
              <Plus className="h-4 w-4" />
              Crear apunte
            </Button>
            {subjects.length === 0 && (
              <p className="text-xs text-muted-foreground/50 mt-2">Primero agregá materias desde Gestionar Materias.</p>
            )}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No se encontraron apuntes.</p>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map(([groupKey, groupNotes]) => (
            <div key={groupKey}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                {groupBy === "subject" ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: groupNotes[0]?.subjectColor }} />
                    <h3 className="text-sm font-semibold text-foreground">{groupKey}</h3>
                  </>
                ) : (
                  <h3 className="text-sm font-semibold text-muted-foreground">{groupKey}</h3>
                )}
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">{groupNotes.length}</span>
              </div>

              {/* Notes grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {groupNotes.map(note => {
                  const preview = stripHtml(note.content)
                  return (
                    <div key={note.id}
                      className="group relative flex flex-col gap-2 p-4 rounded-lg border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all cursor-pointer"
                      style={{ borderLeft: `3px solid ${note.subjectColor}` }}
                      onClick={() => { setEditing(note); setIsNew(false); setSaved(true) }}
                    >
                      {/* Delete btn */}
                      <button
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                        onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex items-start justify-between gap-2 pr-6">
                        <h4 className="text-sm font-semibold text-foreground truncate">
                          {note.title || "Sin título"}
                        </h4>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {preview || "Apunte vacío"}
                      </p>

                      <div className="flex items-center gap-3 mt-1">
                        {groupBy === "date" && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: note.subjectColor }} />
                            {note.subjectName}
                          </span>
                        )}
                        {groupBy === "subject" && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                            <Calendar className="h-3 w-3" />
                            {formatDate(note.date)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Toolbar helpers ────────────────────────────────────
function TB({ icon: Icon, title, onClick, active = false }:
  { icon: React.ElementType; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button title={title}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={`p-1.5 rounded transition-colors ${active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
      <Icon className="h-4 w-4" />
    </button>
  )
}

function Sep() {
  return <div className="w-px h-5 bg-border mx-1" />
}

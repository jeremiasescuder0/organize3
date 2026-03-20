"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  ArrowLeft, BookOpen, Save,
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, List, ListOrdered,
  Link, AlignLeft, AlignCenter, AlignRight,
  Eraser, Upload, FileText, Download, Trash2,
  StickyNote, Paperclip,
} from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

interface StudyFile {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  data: string // base64
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SubjectNotes() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [activeTab, setActiveTab] = useState<"notes" | "files">("notes")
  const [saved, setSaved] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<StudyFile[]>([])
  const [linkUrl, setLinkUrl] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { loadSubjects() }, [])

  const loadSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase.from("subjects").select("*").eq("user_id", user.id).order("name")
    if (data) setSubjects(data)
    setLoading(false)
  }

  const noteKey = (subject: Subject) => `notes_html_${userId}_${subject.id}`
  const filesKey = (subject: Subject) => `files_${userId}_${subject.id}`

  const openSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setActiveTab("notes")
    setSaved(true)

    // Load files
    const savedFiles = localStorage.getItem(filesKey(subject))
    setFiles(savedFiles ? JSON.parse(savedFiles) : [])

    // Load note HTML — done after render via effect
  }

  // Initialize editor content when subject changes
  useEffect(() => {
    if (!selectedSubject || !editorRef.current) return
    const html = localStorage.getItem(noteKey(selectedSubject)) || ""
    editorRef.current.innerHTML = html
    editorRef.current.focus()
  }, [selectedSubject])

  const saveNote = useCallback(() => {
    if (!selectedSubject || !userId || !editorRef.current) return
    localStorage.setItem(noteKey(selectedSubject), editorRef.current.innerHTML)
    setSaved(true)
  }, [selectedSubject, userId])

  const handleInput = () => {
    setSaved(false)
  }

  // Autosave after 2s of inactivity
  useEffect(() => {
    if (saved || !selectedSubject) return
    const t = setTimeout(() => saveNote(), 2000)
    return () => clearTimeout(t)
  }, [saved, selectedSubject, saveNote])

  // Update active formats on selection change
  const updateFormats = () => {
    const formats = new Set<string>()
    try {
      if (document.queryCommandState("bold")) formats.add("bold")
      if (document.queryCommandState("italic")) formats.add("italic")
      if (document.queryCommandState("underline")) formats.add("underline")
      if (document.queryCommandState("strikeThrough")) formats.add("strikeThrough")
    } catch {}
    setActiveFormats(formats)
  }

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateFormats()
    setSaved(false)
  }

  const insertLink = () => {
    if (!linkUrl) return
    exec("createLink", linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`)
    setLinkUrl("")
    setShowLinkInput(false)
  }

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedSubject || !userId) return
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 10 MB.")
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const newFile: StudyFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        data: ev.target?.result as string,
      }
      const updated = [...files, newFile]
      setFiles(updated)
      localStorage.setItem(filesKey(selectedSubject), JSON.stringify(updated))
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const deleteFile = (id: string) => {
    if (!selectedSubject) return
    const updated = files.filter((f) => f.id !== id)
    setFiles(updated)
    localStorage.setItem(filesKey(selectedSubject), JSON.stringify(updated))
  }

  const downloadFile = (file: StudyFile) => {
    const a = document.createElement("a")
    a.href = file.data
    a.download = file.name
    a.click()
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── Note editor ──
  if (selectedSubject) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="gap-2"
              onClick={() => { saveNote(); setSelectedSubject(null) }}>
              <ArrowLeft className="h-4 w-4" />
              Materias
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
              <span className="font-semibold">{selectedSubject.name}</span>
            </div>
          </div>
          <Button size="sm" variant={saved ? "outline" : "default"} className="gap-2" onClick={saveNote}>
            <Save className="h-3.5 w-3.5" />
            {saved ? "Guardado" : "Guardar"}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setActiveTab("notes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "notes" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <StickyNote className="h-4 w-4" />
            Apuntes
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "files" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Paperclip className="h-4 w-4" />
            Material
            {files.length > 0 && (
              <span className="text-xs bg-primary-foreground/20 rounded-full px-1.5">{files.length}</span>
            )}
          </button>
        </div>

        {/* ── NOTES TAB ── */}
        {activeTab === "notes" && (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0">
              {/* Subject header on note */}
              <div className="px-6 pt-6 pb-3 border-b border-border/50"
                style={{ borderLeft: `4px solid ${selectedSubject.color}` }}>
                <h2 className="text-xl font-bold">{selectedSubject.name}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-border/50 bg-secondary/30">
                {/* Headings */}
                <ToolbarBtn icon={Heading1} title="Título 1" onClick={() => exec("formatBlock", "h1")} />
                <ToolbarBtn icon={Heading2} title="Título 2" onClick={() => exec("formatBlock", "h2")} />
                <Divider />

                {/* Inline formats */}
                <ToolbarBtn icon={Bold} title="Negrita (Ctrl+B)" active={activeFormats.has("bold")} onClick={() => exec("bold")} />
                <ToolbarBtn icon={Italic} title="Itálica (Ctrl+I)" active={activeFormats.has("italic")} onClick={() => exec("italic")} />
                <ToolbarBtn icon={Underline} title="Subrayado (Ctrl+U)" active={activeFormats.has("underline")} onClick={() => exec("underline")} />
                <ToolbarBtn icon={Strikethrough} title="Tachado" active={activeFormats.has("strikeThrough")} onClick={() => exec("strikeThrough")} />
                <Divider />

                {/* Lists */}
                <ToolbarBtn icon={List} title="Lista con viñetas" onClick={() => exec("insertUnorderedList")} />
                <ToolbarBtn icon={ListOrdered} title="Lista numerada" onClick={() => exec("insertOrderedList")} />
                <Divider />

                {/* Alignment */}
                <ToolbarBtn icon={AlignLeft} title="Alinear izquierda" onClick={() => exec("justifyLeft")} />
                <ToolbarBtn icon={AlignCenter} title="Centrar" onClick={() => exec("justifyCenter")} />
                <ToolbarBtn icon={AlignRight} title="Alinear derecha" onClick={() => exec("justifyRight")} />
                <Divider />

                {/* Link */}
                <ToolbarBtn icon={Link} title="Insertar enlace" onClick={() => setShowLinkInput(!showLinkInput)} />
                <Divider />

                {/* Clear */}
                <ToolbarBtn icon={Eraser} title="Limpiar formato" onClick={() => exec("removeFormat")} />
              </div>

              {/* Link input */}
              {showLinkInput && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-secondary/20">
                  <Input
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && insertLink()}
                    autoFocus
                  />
                  <Button size="sm" className="h-8" onClick={insertLink}>Insertar</Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowLinkInput(false)}>Cancelar</Button>
                </div>
              )}

              {/* Editor */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyUp={updateFormats}
                onMouseUp={updateFormats}
                className={`
                  min-h-[500px] px-8 py-6 focus:outline-none text-sm leading-relaxed text-foreground
                  [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:mt-4
                  [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2
                  [&_li]:my-1
                  [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer
                  [&_b]:font-bold [&_strong]:font-bold
                  [&_i]:italic [&_em]:italic
                  [&_u]:underline
                  [&_s]:line-through
                  empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40
                `}
                data-placeholder="Empezá a escribir tus apuntes aquí..."
              />
            </CardContent>
          </Card>
        )}

        {/* ── FILES TAB ── */}
        {activeTab === "files" && (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Material de estudio</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">PDFs, apuntes, imágenes — máx. 10 MB por archivo</p>
                </div>
                <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" />
                  Subir archivo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.pptx,.xlsx"
                  onChange={handleFileUpload}
                />
              </div>

              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Paperclip className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground">No hay archivos cargados.</p>
                  <p className="text-sm text-muted-foreground/60 mt-1">Subí PDFs, imágenes o documentos de estudio.</p>
                  <Button variant="outline" size="sm" className="mt-4 gap-2"
                    onClick={() => fileInputRef.current?.click()}>
                    <Upload className="h-4 w-4" />
                    Subir primer archivo
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatSize(file.size)} · {new Date(file.uploadDate).toLocaleDateString("es-AR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadFile(file)}
                          title="Descargar">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteFile(file.id)} title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ── Subject list ──
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Apuntes por Materia</h2>
        <p className="text-sm text-muted-foreground mt-1">Seleccioná una materia para ver o tomar apuntes</p>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay materias cargadas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const hasNote = userId
              ? (localStorage.getItem(`notes_html_${userId}_${subject.id}`) || "").replace(/<[^>]*>/g, "").trim().length > 0
              : false
            const fileCount = userId
              ? JSON.parse(localStorage.getItem(`files_${userId}_${subject.id}`) || "[]").length
              : 0

            return (
              <Card key={subject.id}
                className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-border"
                onClick={() => openSubject(subject)}
                style={{ borderLeft: `4px solid ${subject.color}` }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {subject.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <StickyNote className="h-3 w-3" />
                          {hasNote ? "Con apuntes" : "Sin apuntes"}
                        </span>
                        {fileCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Paperclip className="h-3 w-3" />
                            {fileCount} archivo{fileCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <BookOpen className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 ml-2" />
                  </div>
                  <div className="mt-4 h-1.5 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
                    style={{ backgroundColor: subject.color }} />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Toolbar helpers ──
function ToolbarBtn({
  icon: Icon, title, onClick, active = false,
}: { icon: React.ElementType; title: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />
}

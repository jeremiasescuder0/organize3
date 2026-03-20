"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, BookOpen, Save } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

export function SubjectNotes() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [noteContent, setNoteContent] = useState("")
  const [saved, setSaved] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true })
    if (data) setSubjects(data)
    setLoading(false)
  }

  const openNote = (subject: Subject) => {
    setSelectedSubject(subject)
    const key = `notes_${userId}_${subject.id}`
    const saved = localStorage.getItem(key) || ""
    setNoteContent(saved)
    setSaved(true)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  const saveNote = () => {
    if (!selectedSubject || !userId) return
    const key = `notes_${userId}_${selectedSubject.id}`
    localStorage.setItem(key, noteContent)
    setSaved(true)
  }

  const handleChange = (value: string) => {
    setNoteContent(value)
    setSaved(false)
  }

  // Auto-save every 2 seconds of inactivity
  useEffect(() => {
    if (saved || !selectedSubject) return
    const timer = setTimeout(() => saveNote(), 2000)
    return () => clearTimeout(timer)
  }, [noteContent, saved])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Note editor view
  if (selectedSubject) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Editor header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => { saveNote(); setSelectedSubject(null) }}
            >
              <ArrowLeft className="h-4 w-4" />
              Materias
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selectedSubject.color }}
              />
              <span className="font-semibold text-foreground">{selectedSubject.name}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant={saved ? "outline" : "default"}
            className="gap-2"
            onClick={saveNote}
          >
            <Save className="h-3.5 w-3.5" />
            {saved ? "Guardado" : "Guardar"}
          </Button>
        </div>

        {/* Note paper */}
        <Card className="border-border/50 shadow-sm min-h-[calc(100vh-280px)]">
          <CardContent className="p-0">
            {/* Subject name header on the note */}
            <div
              className="px-8 pt-8 pb-4 border-b border-border/50"
              style={{ borderLeft: `4px solid ${selectedSubject.color}` }}
            >
              <h2 className="text-2xl font-bold text-foreground">{selectedSubject.name}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date().toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            {/* Writing area */}
            <textarea
              ref={textareaRef}
              value={noteContent}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Empezá a escribir tus apuntes aquí..."
              className="w-full min-h-[calc(100vh-380px)] resize-none bg-transparent p-8 text-foreground placeholder:text-muted-foreground/50 focus:outline-none text-sm leading-relaxed font-mono"
              style={{ lineHeight: "1.8" }}
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Subject selection view
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Apuntes por Materia</h2>
        <p className="text-sm text-muted-foreground mt-1">Seleccioná una materia para ver o tomar apuntes</p>
      </div>

      {subjects.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No hay materias cargadas.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Gestioná tus materias desde el menú de usuario.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const hasNote = userId
              ? (localStorage.getItem(`notes_${userId}_${subject.id}`) || "").trim().length > 0
              : false
            return (
              <Card
                key={subject.id}
                className="border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-border"
                onClick={() => openNote(subject)}
                style={{ borderLeft: `4px solid ${subject.color}` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hasNote ? "Apuntes guardados" : "Sin apuntes aún"}
                      </p>
                    </div>
                    <BookOpen className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 ml-2" />
                  </div>
                  <div
                    className="mt-4 h-1.5 rounded-full opacity-30 group-hover:opacity-50 transition-opacity"
                    style={{ backgroundColor: subject.color }}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

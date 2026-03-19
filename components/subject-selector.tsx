"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { BookOpen, Check, Search, Sparkles } from "lucide-react"

interface DefaultSubject {
  id: string
  name: string
  category: string
}

interface SubjectSelectorProps {
  onComplete: () => void
}

const categoryColors: Record<string, string> = {
  "Ciencias Basicas": "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  "Formacion General": "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  "Programacion": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  "Infraestructura": "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20",
  "Gestion": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  "Sistemas": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  "Datos": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  "Redes": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
  "Ingenieria de Software": "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/20",
  "Seguridad": "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20",
  "Proyecto": "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/20",
}

export function SubjectSelector({ onComplete }: SubjectSelectorProps) {
  const [defaultSubjects, setDefaultSubjects] = useState<DefaultSubject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDefaultSubjects()
  }, [])

  async function loadDefaultSubjects() {
    const { data, error } = await supabase
      .from("default_subjects")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true })

    if (!error && data) {
      setDefaultSubjects(data)
    }
    setLoading(false)
  }

  function toggleSubject(subjectId: string) {
    const newSelected = new Set(selectedSubjects)
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId)
    } else {
      newSelected.add(subjectId)
    }
    setSelectedSubjects(newSelected)
  }

  async function saveSelectedSubjects() {
    if (selectedSubjects.size === 0) return
    
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setSaving(false)
      return
    }

    const subjectsToInsert = defaultSubjects
      .filter(s => selectedSubjects.has(s.id))
      .map(s => ({
        user_id: user.id,
        name: s.name,
        color: getCategoryColor(s.category),
      }))

    const { error } = await supabase
      .from("subjects")
      .insert(subjectsToInsert)

    if (!error) {
      onComplete()
    }
    setSaving(false)
  }

  function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      "Ciencias Basicas": "#0ea5e9",
      "Formacion General": "#8b5cf6",
      "Programacion": "#10b981",
      "Infraestructura": "#f97316",
      "Gestion": "#f59e0b",
      "Sistemas": "#6366f1",
      "Datos": "#06b6d4",
      "Redes": "#f43f5e",
      "Ingenieria de Software": "#ec4899",
      "Seguridad": "#ef4444",
      "Proyecto": "#14b8a6",
    }
    return colors[category] || "#6366f1"
  }

  const filteredSubjects = defaultSubjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  const groupedSubjects = filteredSubjects.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = []
    }
    acc[subject.category].push(subject)
    return acc
  }, {} as Record<string, DefaultSubject[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Cargando materias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header gradient */}
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      
      <div className="relative px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Welcome header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Bienvenido a Organize
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Selecciona las materias que estas cursando este cuatrimestre para personalizar tu experiencia
            </p>
          </div>

          {/* Main card */}
          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Materias disponibles</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedSubjects.size > 0 ? (
                      <span className="text-primary font-medium">{selectedSubjects.size} materias seleccionadas</span>
                    ) : (
                      "Selecciona tus materias del cuatrimestre"
                    )}
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar materia o categoria..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <div className="p-6 space-y-8">
                  {Object.entries(groupedSubjects).map(([category, subjects]) => (
                    <div key={category}>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge 
                          variant="outline" 
                          className={`${categoryColors[category] || "bg-muted text-muted-foreground"} border font-medium`}
                        >
                          {category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {subjects.length} materias
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subjects.map((subject) => {
                          const isSelected = selectedSubjects.has(subject.id)
                          return (
                            <button
                              key={subject.id}
                              onClick={() => toggleSubject(subject.id)}
                              className={`
                                group flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all duration-200
                                ${isSelected 
                                  ? "border-primary bg-primary/5 dark:bg-primary/10" 
                                  : "border-border/50 hover:border-primary/30 hover:bg-secondary/50"
                                }
                              `}
                            >
                              <div className={`
                                flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200
                                ${isSelected 
                                  ? "bg-primary border-primary text-primary-foreground" 
                                  : "border-muted-foreground/30 group-hover:border-primary/50"
                                }
                              `}>
                                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                              </div>
                              <span className={`text-sm font-medium truncate transition-colors ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                {subject.name}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-between items-center mt-6 gap-4">
            <Button
              variant="ghost"
              onClick={onComplete}
              className="text-muted-foreground hover:text-foreground"
            >
              Omitir por ahora
            </Button>
            <Button
              onClick={saveSelectedSubjects}
              disabled={selectedSubjects.size === 0 || saving}
              size="lg"
              className="px-8"
            >
              {saving ? (
                "Guardando..."
              ) : selectedSubjects.size > 0 ? (
                `Continuar con ${selectedSubjects.size} materia${selectedSubjects.size > 1 ? 's' : ''}`
              ) : (
                "Selecciona materias"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
  year?: number | null
  elective?: boolean | null
}

interface SubjectSelectorProps {
  onComplete: () => void
}

const yearColors: Record<number, string> = {
  1: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  2: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  3: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  4: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  5: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
}

const yearBorderColors: Record<number, string> = {
  1: "border-l-sky-400",
  2: "border-l-emerald-400",
  3: "border-l-violet-400",
  4: "border-l-amber-400",
  5: "border-l-rose-400",
}

export function SubjectSelector({ onComplete }: SubjectSelectorProps) {
  const [defaultSubjects, setDefaultSubjects] = useState<DefaultSubject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasYearData, setHasYearData] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadDefaultSubjects()
  }, [])

  async function loadDefaultSubjects() {
    const { data, error } = await supabase
      .from("default_subjects")
      .select("*")
      .order("year", { ascending: true })
      .order("name", { ascending: true })

    if (!error && data) {
      setDefaultSubjects(data)
      setHasYearData(data.some((s) => s.year != null))
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
      .filter((s) => selectedSubjects.has(s.id))
      .map((s) => ({
        user_id: user.id,
        name: s.name,
        color: getYearColor(s.year),
      }))

    const { error } = await supabase.from("subjects").insert(subjectsToInsert)

    if (!error) {
      onComplete()
    }
    setSaving(false)
  }

  function getYearColor(year?: number | null): string {
    const colors: Record<number, string> = {
      1: "#0ea5e9",
      2: "#10b981",
      3: "#8b5cf6",
      4: "#f59e0b",
      5: "#f43f5e",
    }
    return colors[year ?? 0] || "#6366f1"
  }

  const filteredSubjects = defaultSubjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category || "").toLowerCase().includes(search.toLowerCase())
  )

  // Group by year if data has year, otherwise fallback to category
  const grouped: Record<string, DefaultSubject[]> = filteredSubjects.reduce(
    (acc, subject) => {
      const key = hasYearData
        ? subject.year != null
          ? `${subject.year}`
          : "Sin año"
        : (subject.category || "General")
      if (!acc[key]) acc[key] = []
      acc[key].push(subject)
      return acc
    },
    {} as Record<string, DefaultSubject[]>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <BookOpen className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium">Cargando materias...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="relative px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 tracking-tight">
              Bienvenido a Organize
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Seleccioná las materias que estás cursando este cuatrimestre
            </p>
          </div>

          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="pb-4 border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">Materias disponibles</CardTitle>
                  <CardDescription className="mt-1">
                    {selectedSubjects.size > 0 ? (
                      <span className="text-primary font-medium">
                        {selectedSubjects.size} materia{selectedSubjects.size > 1 ? "s" : ""} seleccionada{selectedSubjects.size > 1 ? "s" : ""}
                      </span>
                    ) : (
                      "Seleccioná tus materias del cuatrimestre"
                    )}
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar materia..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="p-6 space-y-8">
                  {Object.entries(grouped)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([key, subjects]) => {
                      const yearNum = parseInt(key)
                      const isYearGroup = hasYearData && !isNaN(yearNum)
                      const mandatoryCount = subjects.filter((s) => !s.elective).length
                      const electiveCount = subjects.filter((s) => s.elective).length

                      return (
                        <div key={key}>
                          {/* Group header */}
                          <div className="flex items-center gap-3 mb-4">
                            {isYearGroup ? (
                              <Badge
                                variant="outline"
                                className={`${yearColors[yearNum] || "bg-muted text-muted-foreground border-muted"} border font-semibold px-3`}
                              >
                                {yearNum}° Año
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border font-medium">
                                {key}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {mandatoryCount > 0 && `${mandatoryCount} obligatoria${mandatoryCount > 1 ? "s" : ""}`}
                              {mandatoryCount > 0 && electiveCount > 0 && " · "}
                              {electiveCount > 0 && `${electiveCount} electiva${electiveCount > 1 ? "s" : ""}`}
                            </span>
                          </div>

                          {/* Subject grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {subjects.map((subject) => {
                              const isSelected = selectedSubjects.has(subject.id)
                              const borderColor = isYearGroup
                                ? yearBorderColors[yearNum] || "border-l-primary"
                                : "border-l-primary"

                              return (
                                <button
                                  key={subject.id}
                                  onClick={() => toggleSubject(subject.id)}
                                  className={`
                                    group flex items-center gap-3 p-3.5 rounded-lg border border-l-2 text-left transition-all duration-200
                                    ${isSelected
                                      ? `border-primary bg-primary/5 dark:bg-primary/10 ${borderColor}`
                                      : `border-border/50 hover:border-primary/30 hover:bg-secondary/50 ${borderColor} border-l-transparent hover:${borderColor}`
                                    }
                                  `}
                                >
                                  <div
                                    className={`
                                      flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200 shrink-0
                                      ${isSelected
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-muted-foreground/30 group-hover:border-primary/50"
                                      }
                                    `}
                                  >
                                    {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                                  </div>
                                  <span
                                    className={`text-sm font-medium flex-1 min-w-0 truncate transition-colors ${
                                      isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                    }`}
                                  >
                                    {subject.name}
                                  </span>
                                  {subject.elective && (
                                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                      Elec.
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
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
              {saving
                ? "Guardando..."
                : selectedSubjects.size > 0
                ? `Continuar con ${selectedSubjects.size} materia${selectedSubjects.size > 1 ? "s" : ""}`
                : "Seleccioná materias"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

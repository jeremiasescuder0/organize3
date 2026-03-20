"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FolderOpen, Plus, Trash2, Search, Check, BookOpen } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

interface DefaultSubject {
  id: string
  name: string
  year?: number | null
  elective?: boolean | null
}

const yearColors: Record<number, string> = {
  1: "#0ea5e9",
  2: "#10b981",
  3: "#8b5cf6",
  4: "#f59e0b",
  5: "#f43f5e",
}

const yearBadgeColors: Record<number, string> = {
  1: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20",
  2: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  3: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  4: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  5: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/20",
}

export function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [defaultSubjects, setDefaultSubjects] = useState<DefaultSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [subjectsResult, defaultResult] = await Promise.all([
      supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("name"),
      supabase
        .from("default_subjects")
        .select("id, name, year, elective")
        .order("year", { ascending: true })
        .order("name", { ascending: true }),
    ])

    if (subjectsResult.data) setSubjects(subjectsResult.data)
    if (defaultResult.data) setDefaultSubjects(defaultResult.data)
    setLoading(false)
  }

  const deleteSubject = async (id: string) => {
    const { error } = await supabase.from("subjects").delete().eq("id", id)
    if (!error) setSubjects(subjects.filter((s) => s.id !== id))
  }

  const addSubjects = async () => {
    if (!userId || selectedToAdd.size === 0) return
    setSaving(true)

    const toInsert = defaultSubjects
      .filter((ds) => selectedToAdd.has(ds.id))
      .map((ds) => ({
        user_id: userId,
        name: ds.name,
        color: yearColors[ds.year ?? 0] || "#6366f1",
      }))

    const { data, error } = await supabase
      .from("subjects")
      .insert(toInsert)
      .select()

    if (!error && data) {
      setSubjects([...subjects, ...data].sort((a, b) => a.name.localeCompare(b.name)))
    }

    setSelectedToAdd(new Set())
    setAddOpen(false)
    setSaving(false)
  }

  // Default subjects not yet enrolled
  const enrolledNames = new Set(subjects.map((s) => s.name))
  const availableToAdd = defaultSubjects.filter(
    (ds) => !enrolledNames.has(ds.name)
  )

  // Group available by year
  const grouped = availableToAdd.reduce((acc, ds) => {
    const key = ds.year != null ? `${ds.year}` : "Sin año"
    if (!acc[key]) acc[key] = []
    acc[key].push(ds)
    return acc
  }, {} as Record<string, DefaultSubject[]>)

  const filteredGrouped = Object.entries(grouped)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, items]) => ({
      year,
      items: items.filter((ds) =>
        ds.name.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(({ items }) => items.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Materias</CardTitle>
              <CardDescription>
                {subjects.length > 0
                  ? `${subjects.length} materia${subjects.length > 1 ? "s" : ""} inscripta${subjects.length > 1 ? "s" : ""}`
                  : "No tenés materias inscriptas aún"}
              </CardDescription>
            </div>
            <Button size="sm" className="gap-2" onClick={() => { setSearch(""); setAddOpen(true) }}>
              <Plus className="h-4 w-4" />
              Agregar materia
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No hay materias todavía.</p>
              <p className="text-sm mt-1">Agregá las que estás cursando desde el botón de arriba.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {subject.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add from plan dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar materia del plan</DialogTitle>
          </DialogHeader>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar materia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px] pr-2">
            {filteredGrouped.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>{search ? "No se encontraron materias." : "Ya estás inscripto en todas las materias del plan."}</p>
              </div>
            ) : (
              <div className="space-y-6 pb-2">
                {filteredGrouped.map(({ year, items }) => {
                  const yearNum = parseInt(year)
                  return (
                    <div key={year}>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge
                          variant="outline"
                          className={`${yearBadgeColors[yearNum] || "bg-muted text-muted-foreground"} border font-semibold px-3`}
                        >
                          {!isNaN(yearNum) ? `${yearNum}° Año` : year}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {items.map((ds) => {
                          const isSelected = selectedToAdd.has(ds.id)
                          return (
                            <button
                              key={ds.id}
                              onClick={() => {
                                const next = new Set(selectedToAdd)
                                if (next.has(ds.id)) next.delete(ds.id)
                                else next.add(ds.id)
                                setSelectedToAdd(next)
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                                isSelected
                                  ? "border-primary bg-primary/5"
                                  : "border-border/50 hover:border-primary/30 hover:bg-secondary/50"
                              }`}
                            >
                              <div
                                className={`flex items-center justify-center w-5 h-5 rounded-md border-2 shrink-0 transition-all ${
                                  isSelected
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                              </div>
                              <span className={`text-sm font-medium flex-1 min-w-0 truncate ${
                                isSelected ? "text-foreground" : "text-muted-foreground"
                              }`}>
                                {ds.name}
                              </span>
                              {ds.elective && (
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
            )}
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-sm text-muted-foreground">
              {selectedToAdd.size > 0
                ? `${selectedToAdd.size} seleccionada${selectedToAdd.size > 1 ? "s" : ""}`
                : "Seleccioná las materias a agregar"}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
              <Button onClick={addSubjects} disabled={selectedToAdd.size === 0 || saving}>
                {saving ? "Guardando..." : "Agregar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

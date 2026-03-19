"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, Calendar, CheckCircle2, Circle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ThesisData {
  title: string
  progress: number
  current_phase: string
  next_milestone: string
  advisor: string
}

const defaultThesis: ThesisData = {
  title: "Mi Proyecto de Tesis",
  progress: 0,
  current_phase: "research",
  next_milestone: "Definir tema de investigacion",
  advisor: "",
}

const phases = [
  { key: "research", label: "Investigacion", progress: 15 },
  { key: "proposal", label: "Propuesta", progress: 30 },
  { key: "development", label: "Desarrollo", progress: 60 },
  { key: "testing", label: "Pruebas", progress: 80 },
  { key: "documentation", label: "Documentacion", progress: 95 },
  { key: "defense", label: "Defensa", progress: 100 },
]

export function ThesisTracker() {
  const [thesis, setThesis] = useState<ThesisData>(defaultThesis)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadThesis()
  }, [])

  const loadThesis = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("thesis")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!error && data) {
      setThesis(data)
    } else {
      // Create default thesis entry
      const { data: newThesis } = await supabase
        .from("thesis")
        .insert({
          user_id: user.id,
          ...defaultThesis
        })
        .select()
        .single()
      
      if (newThesis) setThesis(newThesis)
    }
    setLoading(false)
  }

  const currentPhase = phases.find(p => p.key === thesis.current_phase) || phases[0]

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
        <CardHeader className="relative pb-3">
          <CardTitle className="text-base font-semibold">Seguimiento de Tesis</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="relative border-border/50 shadow-sm overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
      <CardHeader className="relative pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-500/10 dark:bg-violet-500/15">
            <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle className="text-base font-semibold">Seguimiento de Tesis</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">{thesis.title}</p>
          {thesis.advisor && (
            <p className="text-xs text-muted-foreground mt-1">Director: {thesis.advisor}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso general</span>
            <span className="font-semibold text-violet-600 dark:text-violet-400">{thesis.progress}%</span>
          </div>
          <Progress value={thesis.progress} className="h-2 bg-violet-100 dark:bg-violet-900/30" />
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 mb-2">
            <Badge variant="secondary" className="text-xs bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              Fase actual
            </Badge>
          </div>
          <p className="text-sm text-foreground">{currentPhase.label}</p>
        </div>

        {thesis.next_milestone && (
          <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Proximo hito</span>
            </div>
            <p className="text-sm text-foreground">{thesis.next_milestone}</p>
          </div>
        )}

        <div className="pt-2 border-t border-border">
          <span className="text-xs font-medium text-muted-foreground">Fases</span>
          <div className="flex items-center gap-1 mt-2">
            {phases.map((phase, index) => (
              <div
                key={phase.key}
                className={`flex-1 h-1.5 rounded-full ${
                  phases.indexOf(currentPhase) >= index
                    ? "bg-violet-500"
                    : "bg-violet-200 dark:bg-violet-900/50"
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

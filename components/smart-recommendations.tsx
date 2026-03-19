"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb, ArrowRight, AlertTriangle, TrendingDown } from "lucide-react"

const recommendations = [
  {
    type: "next",
    icon: ArrowRight,
    title: "Mejor siguiente tarea",
    content: "Completar ejercicios de Bases de Datos II - tienes examen en 8 días",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  {
    type: "weak",
    icon: TrendingDown,
    title: "Materia débil",
    content: "Redes de Computadoras tiene solo 25% de progreso con examen próximo",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
  },
  {
    type: "urgent",
    icon: AlertTriangle,
    title: "Atención urgente",
    content: "Sistemas Operativos - examen en 6 días, considera sesión de estudio intensiva",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
]

export function SmartRecommendations() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-base font-semibold">Recomendaciones</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border border-transparent ${rec.bg} cursor-pointer hover:border-border/50 transition-all`}
          >
            <div className="flex items-start gap-2">
              <rec.icon className={`h-4 w-4 mt-0.5 ${rec.color}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${rec.color}`}>{rec.title}</p>
                <p className="text-sm text-foreground mt-0.5">{rec.content}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

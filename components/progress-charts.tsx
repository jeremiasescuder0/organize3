"use client"

import { Card } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const weeklyStudyData = [
  { day: "Lun", hours: 3.5 },
  { day: "Mar", hours: 4.2 },
  { day: "Mié", hours: 2.8 },
  { day: "Jue", hours: 5.1 },
  { day: "Vie", hours: 3.9 },
  { day: "Sáb", hours: 6.2 },
  { day: "Dom", hours: 4.5 },
]

const taskCompletionData = [
  { week: "Sem 1", completed: 8, total: 12 },
  { week: "Sem 2", completed: 10, total: 14 },
  { week: "Sem 3", completed: 12, total: 15 },
  { week: "Sem 4", completed: 15, total: 16 },
]

const subjectProgressData = [
  { subject: "Algoritmos", progress: 75 },
  { subject: "Base de Datos", progress: 85 },
  { subject: "Matemática", progress: 60 },
  { subject: "POO", progress: 90 },
]

export function ProgressCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Weekly Study Hours */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Horas de Estudio Semanales</h3>
          <p className="text-sm text-muted-foreground">Últimos 7 días</p>
        </div>
        <ChartContainer
          config={{
            hours: {
              label: "Horas",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyStudyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Task Completion Trend */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Tendencia de Tareas</h3>
          <p className="text-sm text-muted-foreground">Últimas 4 semanas</p>
        </div>
        <ChartContainer
          config={{
            completed: {
              label: "Completadas",
              color: "hsl(var(--chart-2))",
            },
            total: {
              label: "Total",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={taskCompletionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="week" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} />
              <Line type="monotone" dataKey="total" stroke="var(--color-total)" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Subject Progress */}
      <Card className="p-6 md:col-span-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Progreso por Materia</h3>
          <p className="text-sm text-muted-foreground">Avance en cada asignatura</p>
        </div>
        <div className="space-y-4">
          {subjectProgressData.map((item) => (
            <div key={item.subject}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.subject}</span>
                <span className="text-sm text-muted-foreground">{item.progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Wand2 } from "lucide-react"

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

const weekData = [
  { day: "Lun", tasks: 3, hours: 4, color: "bg-primary/70" },
  { day: "Mar", tasks: 2, hours: 3, color: "bg-primary/50" },
  { day: "Mié", tasks: 4, hours: 5, color: "bg-primary/90" },
  { day: "Jue", tasks: 2, hours: 2, color: "bg-primary/40" },
  { day: "Vie", tasks: 1, hours: 2, color: "bg-primary/30" },
  { day: "Sáb", tasks: 3, hours: 4, color: "bg-primary/60" },
  { day: "Dom", tasks: 1, hours: 2, color: "bg-primary/20" },
]

export function WeeklyPlan() {
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-semibold">Plan Semanal</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <Wand2 className="h-3 w-3" />
            Auto-planificar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekData.map((day, index) => (
            <div
              key={day.day}
              className={`text-center p-3 rounded-lg border transition-all ${
                index === todayIndex
                  ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
                  : "bg-secondary/50 border-border/50 hover:border-border"
              }`}
            >
              <p className={`text-xs font-medium ${index === todayIndex ? "" : "text-muted-foreground"}`}>
                {day.day}
              </p>
              <p className={`text-lg font-semibold mt-1 ${index === todayIndex ? "" : "text-foreground"}`}>
                {day.tasks}
              </p>
              <p className={`text-xs ${index === todayIndex ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {day.hours}h
              </p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="text-sm">
            <span className="text-muted-foreground">Total semana: </span>
            <span className="font-medium">16 tareas · 22h planificadas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

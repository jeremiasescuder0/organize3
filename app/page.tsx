"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { DraggableDashboard } from "@/components/draggable-dashboard"
import { SubjectSelector } from "@/components/subject-selector"
import { FocusSession } from "@/components/focus-session"
import { SubjectNotes } from "@/components/subject-notes"
import { AcademicCalendar } from "@/components/academic-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DragHint } from "@/components/drag-hint"
import { UpcomingAlerts } from "@/components/upcoming-alerts"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [showSubjectSelector, setShowSubjectSelector] = useState(false)
  const [checkingSubjects, setCheckingSubjects] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    checkUserSubjects()
  }, [])

  async function checkUserSubjects() {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)

      if (!subjects || subjects.length === 0) {
        setShowSubjectSelector(true)
      }
    }
    setCheckingSubjects(false)
  }

  if (!mounted || checkingSubjects) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (showSubjectSelector) {
    return <SubjectSelector onComplete={() => setShowSubjectSelector(false)} />
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs defaultValue="inicio">
          <TabsList className="mb-8 h-auto bg-transparent border-b border-border/40 rounded-none p-0 w-full justify-start gap-0">
            <TabsTrigger value="inicio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-3 mr-7 h-auto text-muted-foreground data-[state=active]:text-foreground font-normal text-sm">
              Inicio
            </TabsTrigger>
            <TabsTrigger value="enfoque" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-3 mr-7 h-auto text-muted-foreground data-[state=active]:text-foreground font-normal text-sm">
              Sesión de Estudio
            </TabsTrigger>
            <TabsTrigger value="notas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-3 mr-7 h-auto text-muted-foreground data-[state=active]:text-foreground font-normal text-sm">
              Notas
            </TabsTrigger>
            <TabsTrigger value="calendario" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground/60 data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-3 h-auto text-muted-foreground data-[state=active]:text-foreground font-normal text-sm">
              Calendario
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="inicio" className="space-y-6 mt-0">
            <DraggableDashboard />
          </TabsContent>

          {/* Focus Session */}
          <TabsContent value="enfoque" className="mt-0">
            <FocusSession />
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notas" className="mt-0">
            <SubjectNotes />
          </TabsContent>

          {/* Calendar */}
          <TabsContent value="calendario" className="mt-0">
            <AcademicCalendar />
          </TabsContent>
        </Tabs>
      </main>

      <UpcomingAlerts />
      <DragHint />

      <footer className="mt-12 pb-6 text-center text-xs text-muted-foreground/50 space-x-3">
        <span>© {new Date().getFullYear()} Organize</span>
        <span>·</span>
        <a href="/terms" className="hover:text-muted-foreground transition-colors">
          Términos y condiciones
        </a>
      </footer>
    </div>
  )
}

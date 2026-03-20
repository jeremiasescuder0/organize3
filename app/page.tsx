"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { TodayFocus } from "@/components/today-focus"
import { WeeklyPlan } from "@/components/weekly-plan"
import { UpcomingExams } from "@/components/upcoming-exams"
import { SmartRecommendations } from "@/components/smart-recommendations"
import { QuickActions } from "@/components/quick-actions"
import { SubjectSelector } from "@/components/subject-selector"
import { FocusSession } from "@/components/focus-session"
import { SubjectNotes } from "@/components/subject-notes"
import { AcademicCalendar } from "@/components/academic-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Brain, StickyNote, CalendarDays } from "lucide-react"

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
        <div className="text-center">
          <BookOpen className="h-12 w-12 mx-auto text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
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
          <TabsList className="mb-6 h-10">
            <TabsTrigger value="inicio" className="gap-2 text-sm">
              <BookOpen className="h-4 w-4" />
              Inicio
            </TabsTrigger>
            <TabsTrigger value="enfoque" className="gap-2 text-sm">
              <Brain className="h-4 w-4" />
              Sesión de Enfoque
            </TabsTrigger>
            <TabsTrigger value="notas" className="gap-2 text-sm">
              <StickyNote className="h-4 w-4" />
              Notas
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2 text-sm">
              <CalendarDays className="h-4 w-4" />
              Calendario
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="inicio" className="space-y-6 mt-0">
            <StatsCards />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <TodayFocus />
                <WeeklyPlan />
                <UpcomingExams />
              </div>
              <div className="space-y-6">
                <SmartRecommendations />
                <QuickActions />
              </div>
            </div>
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
    </div>
  )
}

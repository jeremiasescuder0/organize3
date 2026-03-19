"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { TodayFocus } from "@/components/today-focus"
import { WeeklyPlan } from "@/components/weekly-plan"
import { UpcomingExams } from "@/components/upcoming-exams"
import { ThesisTracker } from "@/components/thesis-tracker"
import { SmartRecommendations } from "@/components/smart-recommendations"
import { QuickActions } from "@/components/quick-actions"
import { SubjectSelector } from "@/components/subject-selector"
import { BookOpen } from "lucide-react"

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
      <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        <StatsCards />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <TodayFocus />
            <WeeklyPlan />
            <UpcomingExams />
          </div>
          <div className="space-y-6">
            <ThesisTracker />
            <SmartRecommendations />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  )
}

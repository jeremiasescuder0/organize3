"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, BookOpen, Clock, FolderOpen, Zap } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base font-semibold">Acciones Rapidas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="default"
          className="w-full justify-start gap-2 h-9 text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          Agregar Tarea
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm"
          size="sm"
        >
          <BookOpen className="h-4 w-4" />
          Agregar Examen
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9 text-sm"
          size="sm"
        >
          <Clock className="h-4 w-4" />
          Registrar Estudio
        </Button>
        <Link href="/subjects" className="block">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-9 text-sm"
            size="sm"
          >
            <FolderOpen className="h-4 w-4" />
            Gestionar Materias
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

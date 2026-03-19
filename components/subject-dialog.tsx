"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Subject } from "@/components/subjects-manager"

interface SubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (subject: Omit<Subject, "id" | "files">) => void
  subject?: Subject | null
}

const PRESET_COLORS = [
  "#E8B4F9", // Pastel purple
  "#B4E8F9", // Pastel blue
  "#B4F9E8", // Pastel mint
  "#F9E8B4", // Pastel yellow
  "#F9B4E8", // Pastel pink
  "#E8F9B4", // Pastel lime
  "#F9D4B4", // Pastel orange
  "#D4B4F9", // Pastel lavender
]

export function SubjectDialog({ open, onOpenChange, onSave, subject }: SubjectDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])

  useEffect(() => {
    if (subject) {
      setName(subject.name)
      setDescription(subject.description)
      setColor(subject.color)
    } else {
      setName("")
      setDescription("")
      setColor(PRESET_COLORS[0])
    }
  }, [subject, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim(),
      color,
    })

    setName("")
    setDescription("")
    setColor(PRESET_COLORS[0])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Editar Materia" : "Nueva Materia"}</DialogTitle>
          <DialogDescription>
            {subject ? "Modifica los detalles de la materia" : "Agrega una nueva materia a tu organización"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la materia</Label>
            <Input
              id="name"
              placeholder="ej: Álgebra Lineal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="ej: Matemáticas avanzadas, Prof. García"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  className="w-10 h-10 rounded-full border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: presetColor,
                    borderColor: color === presetColor ? "#000" : "transparent",
                  }}
                  onClick={() => setColor(presetColor)}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{subject ? "Guardar cambios" : "Crear materia"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

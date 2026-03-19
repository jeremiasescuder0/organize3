"use client"

import type React from "react"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import type { Task } from "./today-tasks"

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (task: Omit<Task, "id">) => void
  task?: Task
}

export function TaskDialog({ open, onOpenChange, onSave, task }: TaskDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium")
  const [dueDate, setDueDate] = useState("")

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setSubject(task.subject)
      setPriority(task.priority)
      setDueDate(task.dueDate || "")
    } else {
      setTitle("")
      setDescription("")
      setSubject("")
      setPriority("medium")
      setDueDate("")
    }
  }, [task, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      description: description || undefined,
      subject,
      priority,
      dueDate: dueDate || undefined,
      completed: task?.completed || false,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{task ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
            <DialogDescription>
              {task ? "Modifica los detalles de tu tarea" : "Agrega una nueva tarea a tu lista"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ej: Completar ejercicios de cálculo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Agrega detalles adicionales sobre la tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Materia</Label>
              <Input
                id="subject"
                placeholder="Ej: Matemática, Algoritmos, Base de Datos"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as "high" | "medium" | "low")}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Fecha límite</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{task ? "Guardar Cambios" : "Crear Tarea"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState, useEffect } from "react"
export interface Exam {
  id: string
  subject: string
  date: string
  time?: string
  type?: string
  location?: string
  notes?: string
  topics: string[]
}

interface ExamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (exam: Omit<Exam, "id">) => void
  exam?: Exam
}

export function ExamDialog({ open, onOpenChange, onSave, exam }: ExamDialogProps) {
  const [subject, setSubject] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [type, setType] = useState("Parcial")
  const [location, setLocation] = useState("")
  const [notes, setNotes] = useState("")
  const [topics, setTopics] = useState<string[]>([])
  const [currentTopic, setCurrentTopic] = useState("")

  useEffect(() => {
    if (exam) {
      setSubject(exam.subject)
      setDate(exam.date)
      setTime(exam.time ?? "")
      setType(exam.type ?? "Parcial")
      setLocation(exam.location || "")
      setNotes(exam.notes || "")
      setTopics(exam.topics || [])
    } else {
      setSubject("")
      setDate("")
      setTime("")
      setType("Parcial")
      setLocation("")
      setNotes("")
      setTopics([])
    }
    setCurrentTopic("")
  }, [exam, open])

  const addTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()])
      setCurrentTopic("")
    }
  }

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter((topic) => topic !== topicToRemove))
  }

  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTopic()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      subject,
      date,
      time,
      type,
      location: location || undefined,
      notes: notes || undefined,
      topics: topics,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{exam ? "Editar Examen" : "Nuevo Examen"}</DialogTitle>
            <DialogDescription>
              {exam ? "Modifica los detalles de tu examen" : "Agrega un nuevo examen a tu calendario"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">Materia</Label>
              <Input
                id="subject"
                placeholder="Ej: Algoritmos y Estructuras de Datos"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Fecha</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Hora</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parcial">Parcial</SelectItem>
                    <SelectItem value="Final">Final</SelectItem>
                    <SelectItem value="Recuperatorio">Recuperatorio</SelectItem>
                    <SelectItem value="Quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Ubicación (opcional)</Label>
                <Input
                  id="location"
                  placeholder="Ej: Aula 301"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="topics">Temas del examen</Label>
              <div className="flex gap-2">
                <Input
                  id="topics"
                  placeholder="Ej: Árboles binarios"
                  value={currentTopic}
                  onChange={(e) => setCurrentTopic(e.target.value)}
                  onKeyDown={handleTopicKeyDown}
                />
                <Button type="button" variant="secondary" onClick={addTopic}>
                  Agregar
                </Button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {topics.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="gap-1 pr-1">
                      {topic}
                      <button
                        type="button"
                        onClick={() => removeTopic(topic)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agrega notas adicionales sobre el examen..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{exam ? "Guardar Cambios" : "Crear Examen"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

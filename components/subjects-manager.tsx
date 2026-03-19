"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FolderOpen, Trash2, Upload, FileText, Download, X } from "lucide-react"
import { SubjectDialog } from "@/components/subject-dialog"

export interface SubjectFile {
  id: string
  name: string
  size: number
  type: string
  uploadDate: string
  data: string // base64 encoded
}

export interface Subject {
  id: string
  name: string
  color: string
  description: string
  files: SubjectFile[]
}

export function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  // Load subjects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("study-subjects")
    if (saved) {
      setSubjects(JSON.parse(saved))
    }
  }, [])

  // Save subjects to localStorage
  useEffect(() => {
    if (subjects.length > 0 || localStorage.getItem("study-subjects")) {
      localStorage.setItem("study-subjects", JSON.stringify(subjects))
    }
  }, [subjects])

  const handleAddSubject = (subject: Omit<Subject, "id" | "files">) => {
    const newSubject: Subject = {
      ...subject,
      id: Date.now().toString(),
      files: [],
    }
    setSubjects([...subjects, newSubject])
    setIsDialogOpen(false)
  }

  const handleEditSubject = (subject: Omit<Subject, "id" | "files">) => {
    if (editingSubject) {
      setSubjects(subjects.map((s) => (s.id === editingSubject.id ? { ...s, ...subject } : s)))
      setEditingSubject(null)
      setIsDialogOpen(false)
    }
  }

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id))
    if (selectedSubject?.id === id) {
      setSelectedSubject(null)
    }
  }

  const handleFileUpload = (subjectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Limit file size to 5MB for localStorage
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. Máximo 5MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const newFile: SubjectFile = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        data: e.target?.result as string,
      }

      setSubjects(subjects.map((s) => (s.id === subjectId ? { ...s, files: [...s.files, newFile] } : s)))
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteFile = (subjectId: string, fileId: string) => {
    setSubjects(subjects.map((s) => (s.id === subjectId ? { ...s, files: s.files.filter((f) => f.id !== fileId) } : s)))
  }

  const handleDownloadFile = (file: SubjectFile) => {
    const link = document.createElement("a")
    link.href = file.data
    link.download = file.name
    link.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleViewFiles = (subject: Subject, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSubject(subject)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Materias</CardTitle>
              <CardDescription>Gestiona tus materias y archivos de estudio</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingSubject(null)
                setIsDialogOpen(true)
              }}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Materia
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay materias aún. Agrega tu primera materia para comenzar.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{subject.name}</CardTitle>
                        <CardDescription className="text-xs mt-1">{subject.description}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSubject(subject.id)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {subject.files.length} archivo{subject.files.length !== 1 ? "s" : ""}
                      </span>
                      <Button variant="outline" size="sm" onClick={(e) => handleViewFiles(subject, e)}>
                        Ver archivos
                      </Button>
                    </div>
                    <div>
                      <input
                        type="file"
                        id={`file-${subject.id}`}
                        className="hidden"
                        onChange={(e) => handleFileUpload(subject.id, e)}
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        onClick={() => document.getElementById(`file-${subject.id}`)?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Subir archivo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Archivos de {selectedSubject.name}</CardTitle>
                <CardDescription>
                  {selectedSubject.files.length} archivo{selectedSubject.files.length !== 1 ? "s" : ""} en total
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedSubject(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedSubject.files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No hay archivos en esta materia aún.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedSubject.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {new Date(file.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(selectedSubject.id, file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SubjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={editingSubject ? handleEditSubject : handleAddSubject}
        subject={editingSubject}
      />
    </div>
  )
}

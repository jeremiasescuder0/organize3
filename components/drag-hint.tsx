"use client"

import { useState, useEffect } from "react"
import { GripVertical, X } from "lucide-react"

const STORAGE_KEY = "drag_hint_dismissed"

export function DragHint() {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    const t = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    setExiting(true)
    setTimeout(() => {
      setVisible(false)
      localStorage.setItem(STORAGE_KEY, "1")
    }, 300)
  }

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 rounded-xl border bg-background/90 backdrop-blur-sm px-4 py-3 shadow-lg text-sm text-muted-foreground max-w-xs transition-all duration-300 ${
        exiting ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
      style={{ animation: exiting ? undefined : "slideUp 0.3s ease-out" }}
    >
      <GripVertical className="h-4 w-4 shrink-0 text-primary/60" />
      <span>Podés arrastrar los módulos para reorganizarlos.</span>
      <button
        onClick={dismiss}
        className="ml-1 shrink-0 rounded-md p-0.5 hover:bg-muted transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

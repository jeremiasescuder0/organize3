"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

interface DateInputProps {
  value: string // YYYY-MM-DD
  onChange: (value: string) => void // returns YYYY-MM-DD
  className?: string
  min?: string // YYYY-MM-DD
}

function toDisplay(iso: string): string {
  if (!iso) return ""
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

function toISO(display: string): string {
  const parts = display.replace(/[^0-9]/g, "")
  if (parts.length !== 8) return ""
  const d = parts.slice(0, 2)
  const m = parts.slice(2, 4)
  const y = parts.slice(4, 8)
  const day = parseInt(d), month = parseInt(m), year = parseInt(y)
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000) return ""
  return `${y}-${m}-${d}`
}

export function DateInput({ value, onChange, className, min }: DateInputProps) {
  const [text, setText] = useState(toDisplay(value))

  useEffect(() => {
    setText(toDisplay(value))
  }, [value])

  const handleChange = (raw: string) => {
    // Auto-insert slashes
    let digits = raw.replace(/[^0-9]/g, "")
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4, 8)
    setText(formatted)

    const iso = toISO(formatted)
    if (iso) {
      if (min && iso < min) return
      onChange(iso)
    }
  }

  return (
    <Input
      value={text}
      onChange={e => handleChange(e.target.value)}
      placeholder="DD/MM/AAAA"
      maxLength={10}
      className={className}
    />
  )
}

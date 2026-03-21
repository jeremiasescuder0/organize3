"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle2 } from "lucide-react"
import { ALL_COMMISSIONS } from "@/lib/schedule/data"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (code: string, year: number, semester: number) => void
}

export function CommissionSelectorDialog({ open, onOpenChange, onSelect }: Props) {
  const [year, setYear] = useState<string>("")
  const [shift, setShift] = useState<string>("")
  const [code, setCode] = useState<string>("")
  const [semester, setSemester] = useState<string>("1")

  const years = useMemo(() => {
    const set = new Set(ALL_COMMISSIONS.map(c => c.year))
    return Array.from(set).sort()
  }, [])

  const shifts = useMemo(() => {
    if (!year) return []
    const set = new Set(
      ALL_COMMISSIONS.filter(c => c.year === Number(year)).map(c => c.shift)
    )
    return Array.from(set).sort()
  }, [year])

  const commissions = useMemo(() => {
    if (!year || !shift) return []
    return ALL_COMMISSIONS.filter(
      c => c.year === Number(year) && c.shift === shift
    ).sort((a, b) => a.code.localeCompare(b.code))
  }, [year, shift])

  function handleYearChange(v: string) {
    setYear(v)
    setShift("")
    setCode("")
  }

  function handleShiftChange(v: string) {
    setShift(v)
    setCode("")
  }

  function handleConfirm() {
    if (!code || !year || !semester) return
    onSelect(code, Number(year), Number(semester))
    // Reset
    setYear("")
    setShift("")
    setCode("")
    setSemester("1")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Elegir comisión
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Year */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Año</label>
            <Select value={year} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná el año" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>
                    {y}° año
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift */}
          {year && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Turno</label>
              <Select value={shift} onValueChange={handleShiftChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná el turno" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Commission */}
          {shift && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Comisión</label>
              <div className="grid grid-cols-3 gap-2">
                {commissions.map(c => (
                  <Button
                    key={c.code}
                    variant={code === c.code ? "default" : "outline"}
                    size="sm"
                    className="h-9"
                    onClick={() => setCode(c.code)}
                  >
                    {c.code}
                    {code === c.code && (
                      <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Semester */}
          {code && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Cuatrimestre</label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1° Cuatrimestre</SelectItem>
                  <SelectItem value="2">2° Cuatrimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Summary */}
          {code && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border/50">
              <Badge variant="outline" className="text-xs">
                {code} · {year}° año · {semester === "1" ? "1°" : "2°"} cuatrimestre
              </Badge>
            </div>
          )}

          <Button
            onClick={handleConfirm}
            disabled={!code || !year || !semester}
            className="w-full"
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

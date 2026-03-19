"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface TimerSettings {
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

const ambientSounds = [
  { id: "none", name: "Sin sonido", url: "" },
  { id: "rain", name: "Lluvia", url: "https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112ce99.mp3" },
  { id: "cafe", name: "Cafetería", url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_4deafc2cb6.mp3" },
  { id: "forest", name: "Bosque", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c610232532.mp3" },
  { id: "ocean", name: "Océano", url: "https://cdn.pixabay.com/download/audio/2022/06/07/audio_9f2baae3f2.mp3" },
  { id: "fireplace", name: "Chimenea", url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_141b142c82.mp3" },
]

export function StudyTimer() {
  const [settings, setSettings] = useState<TimerSettings>({
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  })
  const [time, setTime] = useState(settings.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [mode, setMode] = useState<"focus" | "break" | "longBreak">("focus")
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)

  const [selectedSound, setSelectedSound] = useState("none")
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const savedSettings = localStorage.getItem("study-organizer-timer-settings")
    const savedSessionsData = localStorage.getItem("study-organizer-sessions")
    const savedSound = localStorage.getItem("study-organizer-ambient-sound")
    const savedVolume = localStorage.getItem("study-organizer-ambient-volume")

    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      setSettings(parsedSettings)
      setTime(parsedSettings.focusDuration * 60)
      setTempSettings(parsedSettings)
    }

    if (savedSessionsData) {
      try {
        const parsedData = JSON.parse(savedSessionsData)
        // Check if it's an array (new format) or number (old format)
        const sessions = Array.isArray(parsedData) ? parsedData : []
        const today = new Date().toDateString()
        const todaySessions = sessions.filter((s: any) => new Date(s.date).toDateString() === today)
        setSessionsCompleted(todaySessions.length)
      } catch (error) {
        // If parsing fails, reset to empty array
        setSessionsCompleted(0)
        localStorage.setItem("study-organizer-sessions", JSON.stringify([]))
      }
    }

    if (savedSound) {
      setSelectedSound(savedSound)
    }

    if (savedVolume) {
      setVolume(JSON.parse(savedVolume))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("study-organizer-timer-settings", JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    localStorage.setItem("study-organizer-ambient-sound", selectedSound)
  }, [selectedSound])

  useEffect(() => {
    localStorage.setItem("study-organizer-ambient-volume", JSON.stringify(volume))
  }, [volume])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (selectedSound !== "none" && isRunning) {
      const sound = ambientSounds.find((s) => s.id === selectedSound)
      if (sound && sound.url) {
        audioRef.current = new Audio(sound.url)
        audioRef.current.loop = true
        audioRef.current.volume = isMuted ? 0 : volume / 100

        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("[v0] Audio playback requires user interaction")
          })
        }
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [selectedSound, isRunning])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  const totalTime =
    mode === "focus"
      ? settings.focusDuration * 60
      : mode === "break"
        ? settings.breakDuration * 60
        : settings.longBreakDuration * 60

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
    } else if (time === 0) {
      setIsRunning(false)

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pomodoro Timer", {
          body: mode === "focus" ? "¡Tiempo de descanso!" : "¡Hora de concentrarse!",
        })
      }

      if (mode === "focus") {
        const newSessionsCompleted = sessionsCompleted + 1
        setSessionsCompleted(newSessionsCompleted)

        // Save session to storage
        const sessionsData = localStorage.getItem("study-organizer-sessions")
        const sessions = sessionsData ? JSON.parse(sessionsData) : []
        sessions.push({
          date: new Date().toISOString(),
          duration: settings.focusDuration,
          type: "focus",
        })
        localStorage.setItem("study-organizer-sessions", JSON.stringify(sessions))
        window.dispatchEvent(new Event("localStorageUpdate"))

        if (newSessionsCompleted % settings.sessionsUntilLongBreak === 0) {
          setMode("longBreak")
          setTime(settings.longBreakDuration * 60)
        } else {
          setMode("break")
          setTime(settings.breakDuration * 60)
        }
      } else {
        setMode("focus")
        setTime(settings.focusDuration * 60)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, time, mode, sessionsCompleted, settings])

  const toggleTimer = () => {
    if (!isRunning && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTime(
      mode === "focus"
        ? settings.focusDuration * 60
        : mode === "break"
          ? settings.breakDuration * 60
          : settings.longBreakDuration * 60,
    )
  }

  const switchMode = (newMode: "focus" | "break" | "longBreak") => {
    setMode(newMode)
    setIsRunning(false)
    if (newMode === "focus") {
      setTime(settings.focusDuration * 60)
    } else if (newMode === "break") {
      setTime(settings.breakDuration * 60)
    } else {
      setTime(settings.longBreakDuration * 60)
    }
  }

  const saveSettings = () => {
    setSettings(tempSettings)
    setTime(tempSettings.focusDuration * 60)
    setMode("focus")
    setIsRunning(false)
    setIsSettingsOpen(false)
  }

  const minutes = Math.floor(time / 60)
  const seconds = time % 60
  const progress = ((totalTime - time) / totalTime) * 100

  return (
    <Card className="p-6">
      <div className="text-center">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-semibold">Temporizador Pomodoro</h3>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setTempSettings(settings)}>
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuración del Timer</DialogTitle>
                <DialogDescription>Personaliza las duraciones de tus sesiones de estudio</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="focus">Duración de concentración (minutos)</Label>
                  <Input
                    id="focus"
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.focusDuration}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, focusDuration: Number.parseInt(e.target.value) || 25 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="break">Duración de descanso corto (minutos)</Label>
                  <Input
                    id="break"
                    type="number"
                    min="1"
                    max="30"
                    value={tempSettings.breakDuration}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, breakDuration: Number.parseInt(e.target.value) || 5 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longBreak">Duración de descanso largo (minutos)</Label>
                  <Input
                    id="longBreak"
                    type="number"
                    min="1"
                    max="60"
                    value={tempSettings.longBreakDuration}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, longBreakDuration: Number.parseInt(e.target.value) || 15 })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sessions">Sesiones hasta descanso largo</Label>
                  <Input
                    id="sessions"
                    type="number"
                    min="2"
                    max="10"
                    value={tempSettings.sessionsUntilLongBreak}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, sessionsUntilLongBreak: Number.parseInt(e.target.value) || 4 })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveSettings}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "focus" ? "Tiempo de concentración" : mode === "break" ? "Descanso corto" : "Descanso largo"}
        </p>

        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="mb-8">
          <div className="text-6xl font-bold font-mono tracking-tight">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
        </div>

        <div className="flex gap-2 justify-center mb-6">
          <Button onClick={toggleTimer} size="lg" className="gap-2 flex-1">
            {isRunning ? (
              <>
                <Pause className="h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Iniciar
              </>
            )}
          </Button>
          <Button onClick={resetTimer} size="lg" variant="outline">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Sonido Ambiente</Label>
          </div>
          <div className="grid gap-3">
            <Select value={selectedSound} onValueChange={setSelectedSound}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un sonido" />
              </SelectTrigger>
              <SelectContent>
                {ambientSounds.map((sound) => (
                  <SelectItem key={sound.id} value={sound.id}>
                    {sound.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSound !== "none" && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  step={1}
                  className="flex-1"
                  disabled={isMuted}
                />
                <span className="text-xs text-muted-foreground w-8 text-right">{isMuted ? 0 : volume}%</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 border-t">
          <div className="flex gap-2 mb-4">
            <Button
              variant={mode === "focus" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => switchMode("focus")}
            >
              Concentración
            </Button>
            <Button
              variant={mode === "break" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => switchMode("break")}
            >
              Descanso
            </Button>
            <Button
              variant={mode === "longBreak" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => switchMode("longBreak")}
            >
              Descanso Largo
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Sesiones completadas hoy: {sessionsCompleted}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

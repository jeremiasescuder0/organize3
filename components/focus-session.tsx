"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Coffee,
  Brain,
  Moon,
} from "lucide-react"

interface TimerSettings {
  focusDuration: number
  breakDuration: number
  longBreakDuration: number
  sessionsUntilLongBreak: number
}

const ambientSounds = [
  { id: "none", name: "Sin sonido", emoji: "🔇" },
  { id: "rain", name: "Lluvia", emoji: "🌧️" },
  { id: "ocean", name: "Océano", emoji: "🌊" },
  { id: "wind", name: "Viento", emoji: "🍃" },
  { id: "whitenoise", name: "Ruido blanco", emoji: "📻" },
  { id: "brownnoise", name: "Ruido marrón", emoji: "🎵" },
  { id: "binaural", name: "Binaural", emoji: "🧠" },
]

// ── Web Audio API generators (no external URLs needed) ──

function createNoiseBuffer(ctx: AudioContext, type: "white" | "brown"): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  if (type === "white") {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
  } else {
    let last = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
  }
  return buffer
}

function startAmbientSound(
  soundId: string,
  volume: number,
): { ctx: AudioContext; gain: GainNode } | null {
  if (soundId === "none") return null

  const ctx = new AudioContext()
  const gain = ctx.createGain()
  gain.gain.value = volume / 100
  gain.connect(ctx.destination)

  if (soundId === "whitenoise" || soundId === "brownnoise") {
    const buffer = createNoiseBuffer(ctx, soundId === "whitenoise" ? "white" : "brown")
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true

    // Low-pass filter for smoother sound
    const filter = ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.value = soundId === "whitenoise" ? 8000 : 400
    source.connect(filter)
    filter.connect(gain)
    source.start()
  } else if (soundId === "rain") {
    // Rain = filtered white noise + occasional crackle
    const buffer = createNoiseBuffer(ctx, "white")
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = "bandpass"
    bp.frequency.value = 1500
    bp.Q.value = 0.5
    source.connect(bp)
    bp.connect(gain)
    source.start()

    // Add a second layer for low rumble
    const buffer2 = createNoiseBuffer(ctx, "brown")
    const source2 = ctx.createBufferSource()
    source2.buffer = buffer2
    source2.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 200
    source2.connect(lp)
    const rumbleGain = ctx.createGain()
    rumbleGain.gain.value = 0.3
    lp.connect(rumbleGain)
    rumbleGain.connect(gain)
    source2.start()
  } else if (soundId === "ocean") {
    // Ocean = modulated brown noise
    const buffer = createNoiseBuffer(ctx, "brown")
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const lp = ctx.createBiquadFilter()
    lp.type = "lowpass"
    lp.frequency.value = 500
    source.connect(lp)

    // LFO for wave-like volume modulation
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.08
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 0.3
    lfo.connect(lfoGain)
    const modGain = ctx.createGain()
    modGain.gain.value = 0.7
    lfoGain.connect(modGain.gain)
    lp.connect(modGain)
    modGain.connect(gain)
    lfo.start()
    source.start()
  } else if (soundId === "wind") {
    // Wind = filtered noise with slow modulation
    const buffer = createNoiseBuffer(ctx, "white")
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const bp = ctx.createBiquadFilter()
    bp.type = "bandpass"
    bp.frequency.value = 800
    bp.Q.value = 0.3
    source.connect(bp)

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.15
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 400
    lfo.connect(lfoGain)
    lfoGain.connect(bp.frequency)
    lfo.start()
    bp.connect(gain)
    source.start()
  } else if (soundId === "binaural") {
    // Binaural beat: 200Hz left, 210Hz right (10Hz alpha waves)
    const merger = ctx.createChannelMerger(2)
    const osc1 = ctx.createOscillator()
    osc1.frequency.value = 200
    osc1.type = "sine"
    const g1 = ctx.createGain()
    g1.gain.value = 0.3
    osc1.connect(g1)
    g1.connect(merger, 0, 0)

    const osc2 = ctx.createOscillator()
    osc2.frequency.value = 210
    osc2.type = "sine"
    const g2 = ctx.createGain()
    g2.gain.value = 0.3
    osc2.connect(g2)
    g2.connect(merger, 0, 1)

    merger.connect(gain)
    osc1.start()
    osc2.start()
  }

  return { ctx, gain }
}

const modeConfig = {
  focus: { label: "Concentración", icon: Brain, color: "text-primary", bg: "bg-primary/10" },
  break: { label: "Descanso", icon: Coffee, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
  longBreak: { label: "Descanso Largo", icon: Moon, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
}

export function FocusSession() {
  const [settings, setSettings] = useState<TimerSettings>({
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
  })
  const [tempSettings, setTempSettings] = useState(settings)
  const [mode, setMode] = useState<"focus" | "break" | "longBreak">("focus")
  const [time, setTime] = useState(settings.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [selectedSound, setSelectedSound] = useState("none")
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null)

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("focus-session-settings")
    const savedSound = localStorage.getItem("focus-session-sound")
    const savedVolume = localStorage.getItem("focus-session-volume")
    const savedSessions = localStorage.getItem("focus-session-sessions")

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      setTempSettings(parsed)
      setTime(parsed.focusDuration * 60)
    }
    if (savedSound) setSelectedSound(savedSound)
    if (savedVolume) setVolume(JSON.parse(savedVolume))
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions)
      const today = new Date().toDateString()
      const todayCount = Array.isArray(sessions)
        ? sessions.filter((s: { date: string }) => new Date(s.date).toDateString() === today).length
        : 0
      setSessionsCompleted(todayCount)
    }
  }, [])

  // Persist settings
  useEffect(() => {
    localStorage.setItem("focus-session-settings", JSON.stringify(settings))
  }, [settings])
  useEffect(() => {
    localStorage.setItem("focus-session-sound", selectedSound)
  }, [selectedSound])
  useEffect(() => {
    localStorage.setItem("focus-session-volume", JSON.stringify(volume))
  }, [volume])

  // Audio management
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.ctx.close()
      audioRef.current = null
    }
    if (selectedSound !== "none" && isRunning) {
      audioRef.current = startAmbientSound(selectedSound, isMuted ? 0 : volume)
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.ctx.close()
        audioRef.current = null
      }
    }
  }, [selectedSound, isRunning])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.gain.gain.value = isMuted ? 0 : volume / 100
    }
  }, [volume, isMuted])

  // Timer countdown
  const totalTime =
    mode === "focus"
      ? settings.focusDuration * 60
      : mode === "break"
      ? settings.breakDuration * 60
      : settings.longBreakDuration * 60

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning && time > 0) {
      interval = setInterval(() => setTime((t) => t - 1), 1000)
    } else if (time === 0) {
      setIsRunning(false)
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Organize", {
          body: mode === "focus" ? "¡Sesión completada! Hora de descansar." : "¡Hora de concentrarse!",
        })
      }
      if (mode === "focus") {
        const newCount = sessionsCompleted + 1
        setSessionsCompleted(newCount)
        const saved = localStorage.getItem("focus-session-sessions")
        const sessions = saved ? JSON.parse(saved) : []
        sessions.push({ date: new Date().toISOString(), duration: settings.focusDuration })
        localStorage.setItem("focus-session-sessions", JSON.stringify(sessions))
        if (newCount % settings.sessionsUntilLongBreak === 0) {
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
    return () => { if (interval) clearInterval(interval) }
  }, [isRunning, time, mode, sessionsCompleted, settings])

  const toggleTimer = () => {
    if (!isRunning && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setTime(totalTime)
  }

  const switchMode = (newMode: "focus" | "break" | "longBreak") => {
    setIsRunning(false)
    setMode(newMode)
    if (newMode === "focus") setTime(settings.focusDuration * 60)
    else if (newMode === "break") setTime(settings.breakDuration * 60)
    else setTime(settings.longBreakDuration * 60)
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
  const currentMode = modeConfig[mode]
  const ModeIcon = currentMode.icon

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Main timer card */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className={`h-1.5 w-full bg-gradient-to-r ${
          mode === "focus" ? "from-primary to-primary/50" :
          mode === "break" ? "from-emerald-500 to-emerald-500/50" :
          "from-violet-500 to-violet-500/50"
        }`} style={{ width: `${progress}%` }} />
        <CardContent className="p-8">
          {/* Mode label */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`p-2 rounded-lg ${currentMode.bg}`}>
              <ModeIcon className={`h-5 w-5 ${currentMode.color}`} />
            </div>
            <span className={`text-sm font-semibold ${currentMode.color}`}>{currentMode.label}</span>
          </div>

          {/* Timer display */}
          <div className="text-center mb-8">
            <div className="text-8xl font-bold font-mono tracking-tight tabular-nums text-foreground">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {sessionsCompleted} sesiones completadas hoy
            </p>
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-2 mb-8" />

          {/* Controls */}
          <div className="flex gap-3 justify-center mb-8">
            <Button onClick={toggleTimer} size="lg" className="gap-2 px-10 text-base h-12">
              {isRunning ? <><Pause className="h-5 w-5" />Pausar</> : <><Play className="h-5 w-5" />Iniciar</>}
            </Button>
            <Button onClick={resetTimer} size="lg" variant="outline" className="h-12 w-12 p-0">
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => { setTempSettings(settings); setIsSettingsOpen(true) }}
              size="lg"
              variant="outline"
              className="h-12 w-12 p-0"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Mode switcher */}
          <div className="flex gap-2">
            {(["focus", "break", "longBreak"] as const).map((m) => (
              <Button
                key={m}
                variant={mode === m ? "default" : "outline"}
                size="sm"
                className="flex-1 text-xs"
                onClick={() => switchMode(m)}
              >
                {modeConfig[m].label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ambient sounds card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Sonido Ambiente</Label>
          </div>

          {/* Sound grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {ambientSounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => setSelectedSound(sound.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all ${
                  selectedSound === sound.id
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-secondary/50 border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span className="text-xl">{sound.emoji}</span>
                <span>{sound.name}</span>
              </button>
            ))}
          </div>

          {/* Volume control */}
          {selectedSound !== "none" && (
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                max={100}
                step={1}
                className="flex-1"
                disabled={isMuted}
              />
              <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
                {isMuted ? 0 : volume}%
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración del Timer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Duración de concentración (min)</Label>
              <Input
                type="number" min="1" max="120"
                value={tempSettings.focusDuration}
                onChange={(e) => setTempSettings({ ...tempSettings, focusDuration: parseInt(e.target.value) || 25 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Descanso corto (min)</Label>
              <Input
                type="number" min="1" max="30"
                value={tempSettings.breakDuration}
                onChange={(e) => setTempSettings({ ...tempSettings, breakDuration: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Descanso largo (min)</Label>
              <Input
                type="number" min="1" max="60"
                value={tempSettings.longBreakDuration}
                onChange={(e) => setTempSettings({ ...tempSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sesiones hasta descanso largo</Label>
              <Input
                type="number" min="2" max="10"
                value={tempSettings.sessionsUntilLongBreak}
                onChange={(e) => setTempSettings({ ...tempSettings, sessionsUntilLongBreak: parseInt(e.target.value) || 4 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancelar</Button>
            <Button onClick={saveSettings}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

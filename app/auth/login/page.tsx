'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const router = useRouter()

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil
  const lockSecondsLeft = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked) return

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setAttempts(0)
      router.push('/')
      router.refresh()
    } catch (error: unknown) {
      const next = attempts + 1
      setAttempts(next)
      // After 5 failed attempts lock for 60 seconds
      if (next >= 5) {
        setLockedUntil(Date.now() + 60_000)
        setAttempts(0)
        setError('Demasiados intentos fallidos. Esperá 60 segundos.')
      } else {
        const msg = error instanceof Error ? error.message : 'Ocurrió un error'
        setError(`${msg} (${next}/5 intentos)`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-svh w-full flex items-center justify-center bg-background p-6 md:p-10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Organize</h1>
              <p className="text-sm text-muted-foreground">Organiza tu estudio universitario</p>
            </div>
          </div>

          {/* Login card */}
          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Iniciar Sesion</CardTitle>
              <CardDescription>
                Ingresa tu email para acceder a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contrasena</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                
                {isLocked && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Cuenta bloqueada temporalmente. Intentá en {lockSecondsLeft}s.
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || isLocked}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ingresando...
                    </>
                  ) : (
                    'Iniciar Sesion'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-2">
                  No tienes cuenta?{' '}
                  <Link 
                    href="/auth/sign-up" 
                    className="text-primary font-medium hover:underline underline-offset-4"
                  >
                    Registrate
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            Ing. en Sistemas de Informacion
          </p>
        </div>
      </div>
    </div>
  )
}

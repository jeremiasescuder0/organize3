'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { BookOpen, Loader2, UserPlus } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Las contraseñas no coinciden')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 
            `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : ''
      const translations: Record<string, string> = {
        'User already registered': 'Este email ya está registrado. Iniciá sesión.',
        'Email rate limit exceeded': 'Límite de emails excedido. Esperá unos minutos e intentá de nuevo.',
        'Invalid email': 'El email ingresado no es válido.',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
        'Signup is disabled': 'El registro está deshabilitado temporalmente.',
      }
      setError(translations[msg] ?? (msg || 'Ocurrió un error. Intentá de nuevo.'))
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

          {/* Sign up card */}
          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear Cuenta
              </CardTitle>
              <CardDescription>
                Registrate para comenzar a organizar tu estudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp} className="space-y-4">
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
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimo 6 caracteres"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeat-password">Confirmar Contraseña</Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
                
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground pt-2">
                  Ya tienes cuenta?{' '}
                  <Link 
                    href="/auth/login" 
                    className="text-primary font-medium hover:underline underline-offset-4"
                  >
                    Iniciar Sesion
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

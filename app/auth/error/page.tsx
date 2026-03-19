import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, BookOpen, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; error_description?: string }>
}) {
  const params = await searchParams
  const error = params?.error
  const errorDescription = params?.error_description

  const getErrorMessage = () => {
    if (error === 'otp_expired' || errorDescription?.includes('expired')) {
      return {
        title: 'Enlace Expirado',
        description: 'El enlace de confirmacion ha expirado o ya fue utilizado.',
        suggestion: 'Por favor, intenta registrarte nuevamente para recibir un nuevo enlace.'
      }
    }
    if (error === 'access_denied') {
      return {
        title: 'Acceso Denegado',
        description: 'No se pudo verificar tu cuenta.',
        suggestion: 'El enlace puede haber expirado. Intenta registrarte nuevamente.'
      }
    }
    return {
      title: 'Error de Autenticacion',
      description: errorDescription || 'Ocurrio un error durante la autenticacion.',
      suggestion: 'Por favor, intenta nuevamente o contacta soporte si el problema persiste.'
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="relative min-h-svh w-full flex items-center justify-center bg-background p-6 md:p-10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5 pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Organize</h1>
          </div>

          {/* Error card */}
          <Card className="border-destructive/20 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-xl text-destructive">
                {errorInfo.title}
              </CardTitle>
              <CardDescription className="text-base">
                {errorInfo.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {errorInfo.suggestion}
              </p>
              
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/auth/sign-up">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Registrarse Nuevamente
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login">
                    Ir a Iniciar Sesion
                  </Link>
                </Button>
              </div>

              {error && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Codigo: {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

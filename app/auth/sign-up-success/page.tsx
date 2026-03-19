import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
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

          {/* Success card */}
          <Card className="border-border/50 shadow-xl shadow-primary/5">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-xl">Cuenta creada exitosamente</CardTitle>
              <CardDescription className="text-base">
                Revisa tu email para confirmar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50">
                <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Te enviamos un email de confirmacion
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Haz clic en el enlace del email para activar tu cuenta y comenzar a usar Organize.
                  </p>
                </div>
              </div>
              
              <Button asChild className="w-full" size="lg">
                <Link href="/auth/login">
                  Ir a Iniciar Sesion
                </Link>
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                No recibiste el email? Revisa tu carpeta de spam
              </p>
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

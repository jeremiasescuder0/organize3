import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const metadata = {
  title: "Términos y Condiciones — Organize",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <h1 className="text-2xl font-semibold mb-1">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: marzo de 2026</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/80">

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">1. Descripción del servicio</h2>
            <p>
              Organize es una plataforma de organización académica diseñada para estudiantes universitarios.
              Permite gestionar tareas, exámenes, materias, sesiones de estudio y notas personales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">2. Uso permitido</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>El servicio está destinado exclusivamente a uso personal y académico.</li>
              <li>Cada usuario es responsable de mantener la confidencialidad de sus credenciales.</li>
              <li>Está prohibido compartir, revender o sublicenciar el acceso a la plataforma.</li>
              <li>No se permite el uso del servicio para actividades ilegales o que perjudiquen a terceros.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">3. Cuenta de usuario</h2>
            <p>
              Para acceder al servicio es necesario registrarse con una dirección de correo electrónico válida.
              Sos responsable de toda la actividad que ocurra bajo tu cuenta. Nos reservamos el derecho de
              suspender o eliminar cuentas que violen estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">4. Datos personales y privacidad</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Los datos ingresados (tareas, exámenes, materias) se almacenan en una base de datos segura con
                políticas de acceso a nivel de fila, garantizando que cada usuario solo accede a su propia información.
              </li>
              <li>Las notas se almacenan localmente en tu navegador y no se envían a ningún servidor.</li>
              <li>No compartimos información personal con terceros salvo requerimiento legal.</li>
              <li>Podemos recopilar datos de uso anónimos para mejorar la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">5. Disponibilidad del servicio</h2>
            <p>
              El servicio se ofrece "tal como está" sin garantías de disponibilidad continua. Podemos realizar
              tareas de mantenimiento que impliquen interrupciones temporales, y nos reservamos el derecho de
              modificar o discontinuar el servicio en cualquier momento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">6. Propiedad intelectual</h2>
            <p>
              El código fuente, diseño y contenido de Organize son propiedad de su autor. Queda prohibida
              la reproducción, distribución o uso comercial sin autorización expresa y por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">7. Limitación de responsabilidad</h2>
            <p>
              No nos hacemos responsables por pérdida de datos, interrupciones del servicio o daños derivados
              del uso de la plataforma. El usuario es el único responsable del contenido que ingresa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-medium text-foreground mb-2">8. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de actualizar estos términos en cualquier momento. Los cambios entrarán
              en vigor al ser publicados en esta página. El uso continuado del servicio implica la aceptación
              de los nuevos términos.
            </p>
          </section>

        </div>

        <p className="mt-12 text-xs text-muted-foreground/50 text-center">
          Al registrarte y utilizar Organize, confirmás haber leído y aceptado estos términos.
        </p>
      </div>
    </div>
  )
}

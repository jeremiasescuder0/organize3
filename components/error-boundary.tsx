"use client"

import React from "react"
import { BookOpen, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props { children: React.ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, message: "" }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you'd send this to Sentry / your logging service
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-destructive/70" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground">
              Ocurrió un error inesperado. Tu información está segura.
            </p>
            <Button
              onClick={() => { this.setState({ hasError: false, message: "" }); window.location.reload() }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun, LogOut, User, BookOpen, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function DashboardHeader() {
  const [darkMode, setDarkMode] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const saved = localStorage.getItem("darkMode")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    
    if (saved === "true" || (!saved && prefersDark)) {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || "")
      }
    })
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
    localStorage.setItem("darkMode", (!darkMode).toString())
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-none">Organize</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Ing. en Sistemas</p>
            </div>
          </Link>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-lg hover:bg-secondary"
            >
              {darkMode ? (
                <Sun className="h-[18px] w-[18px] text-amber-500" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-slate-600" />
              )}
              <span className="sr-only">Cambiar tema</span>
            </Button>
            
            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-lg hover:bg-secondary p-0">
                  <Avatar className="h-9 w-9 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                  <Avatar className="h-10 w-10 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{userEmail}</p>
                    <p className="text-xs text-muted-foreground">Estudiante</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                  <Link href="/subjects" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Gestionar Materias
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                  <button className="w-full flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Mi Perfil
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

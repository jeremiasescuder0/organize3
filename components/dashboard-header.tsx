"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Moon, Sun, LogOut, Settings } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

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
      if (user) setUserEmail(user.email || "")
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

  const getInitials = (email: string) => email.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border/50">
      <div className="container mx-auto px-6 py-3 max-w-7xl flex items-center justify-between">
        <Link href="/">
          <Image src="/logo-icon.png" alt="Focus" width={36} height={36} className="h-9 w-9 object-contain" priority />
        </Link>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                    {getInitials(userEmail)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/subjects" className="flex items-center gap-2 text-sm">
                  <Settings className="h-3.5 w-3.5" />
                  Gestionar Materias
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-sm text-destructive focus:text-destructive gap-2">
                <LogOut className="h-3.5 w-3.5" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

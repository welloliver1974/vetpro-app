'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { LogOut, Sun, Moon } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-end px-6 bg-slate-900/50 backdrop-blur-sm gap-2">
      {theme && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-slate-400 hover:text-amber-400 hover:bg-amber-950/30 gap-2"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === 'dark' ? 'Claro' : 'Escuro'}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-slate-400 hover:text-red-400 hover:bg-red-950/30 gap-2"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </header>
  )
}

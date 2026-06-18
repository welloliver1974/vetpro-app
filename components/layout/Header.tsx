'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-slate-800 flex items-center justify-end px-6 bg-slate-900/50 backdrop-blur-sm">
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

'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAcceptInvite } from '@/hooks/useClinic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Toaster } from 'sonner'
import { Loader2, CheckCircle2, XCircle, PawPrint } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function JoinClinicContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const acceptInvite = useAcceptInvite()
  const [status, setStatus] = useState<'checking' | 'ready' | 'done' | 'error'>(
    token ? 'checking' : 'error'
  )

  useEffect(() => {
    if (!token) return
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setStatus('ready')
      else router.push(`/auth/login?redirect=/auth/join-clinic?token=${token}`)
    })
  }, [token, router])

  async function handleAccept() {
    if (!token) return
    try {
      await acceptInvite.mutateAsync(token)
      setStatus('done')
      setTimeout(() => router.push('/'), 2000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800 w-full max-w-sm">
      <CardHeader className="text-center">
        <PawPrint className="h-10 w-10 text-indigo-500 mx-auto mb-2" />
        <CardTitle className="text-slate-200">Entrar na Clínica</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === 'checking' && (
          <Loader2 className="h-6 w-6 animate-spin text-slate-500 mx-auto" />
        )}

        {status === 'ready' && (
          <>
            <p className="text-sm text-slate-400">
              Você foi convidado a entrar em uma clínica no VetPro.
            </p>
            <Button onClick={handleAccept} disabled={acceptInvite.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-full">
              {acceptInvite.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Aceitar Convite
            </Button>
          </>
        )}

        {status === 'done' && (
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="text-sm text-slate-300">Você entrou na clínica!</p>
            <p className="text-xs text-slate-500">Redirecionando...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-2">
            <XCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-slate-400">
              {!token ? 'Link inválido' : 'Erro ao aceitar convite'}
            </p>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                Ir para o Dashboard
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function JoinClinicPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <Toaster richColors position="top-center" />
      <Suspense fallback={
        <Card className="bg-slate-900 border-slate-800 w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500 mx-auto" />
          </CardContent>
        </Card>
      }>
        <JoinClinicContent />
      </Suspense>
    </div>
  )
}

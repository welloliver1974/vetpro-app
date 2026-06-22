'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAcceptInvite } from '@/hooks/useClinic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    ;(async () => {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      if (data.user) setStatus('ready')
      else router.push(`/auth/login?redirect=/auth/join-clinic?token=${token}`)
    })()
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
    <Card className="bg-card border-border w-full max-w-sm">
      <CardHeader className="text-center">
        <PawPrint className="h-10 w-10 text-primary mx-auto mb-2" />
        <CardTitle className="text-card-foreground">Entrar na Clínica</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === 'checking' && (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
        )}

        {status === 'ready' && (
          <>
            <p className="text-sm text-muted-foreground">
              Você foi convidado a entrar em uma clínica no VetPro.
            </p>
            <Button onClick={handleAccept} disabled={acceptInvite.isPending}
              className="bg-primary hover:bg-primary/90 text-white w-full">
              {acceptInvite.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Aceitar Convite
            </Button>
          </>
        )}

        {status === 'done' && (
          <div className="text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <p className="text-sm text-foreground">Você entrou na clínica!</p>
            <p className="text-xs text-muted-foreground">Redirecionando...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center space-y-2">
            <XCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {token ? 'Erro ao aceitar convite' : 'Link inválido'}
            </p>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-border text-foreground">
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="bg-card border-border w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </CardContent>
        </Card>
      }>
        <JoinClinicContent />
      </Suspense>
    </div>
  )
}

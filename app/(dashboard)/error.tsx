'use client'

import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-4 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground">
          Ocorreu um erro ao carregar esta página. Tente novamente ou volte para o início.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono">
            Erro: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Início
            </Link>
          </Button>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  )
}

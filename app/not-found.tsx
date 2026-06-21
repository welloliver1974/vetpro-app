import Link from 'next/link'
import { PawPrint, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 flex items-center justify-center">
      <Card className="w-full max-w-xl border-border bg-card shadow-2xl shadow-black/20">
        <CardContent className="p-8 md:p-10 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <PawPrint className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">404</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-card-foreground">
              Página não encontrada
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              O endereço que você tentou abrir não existe, foi movido ou está indisponível agora.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="bg-primary hover:bg-primary/90 text-white gap-2 w-full sm:w-auto">
              <Link href="/">
                <Home className="h-4 w-4" />
                Ir para o dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild className="border-border text-foreground gap-2 w-full sm:w-auto">
              <Link href="/agenda">
                <Search className="h-4 w-4" />
                Ver agenda
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

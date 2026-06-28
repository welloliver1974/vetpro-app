'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useMyClinic, useClinicInvites, useClinicMembers, useCreateClinic, useCreateInvite } from '@/hooks/useClinic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import { Loader2, Building2, Copy, Check, Users, Mail } from 'lucide-react'

export default function ClinicaPage() {
  const { data: clinic, isLoading } = useMyClinic()
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [telefone, setTelefone] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
    })()
  }, [])

  const canManageInvites = Boolean(clinic && userId && clinic.owner_id === userId)
  const { data: invites } = useClinicInvites(canManageInvites)
  const { data: members } = useClinicMembers()
  const createClinic = useCreateClinic()
  const createInvite = useCreateInvite()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    await createClinic.mutateAsync({ nome: nome.trim(), endereco: endereco.trim() || undefined, telefone: telefone.trim() || undefined })
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    const invite = await createInvite.mutateAsync(inviteEmail.trim())
    if (invite) {
      const link = `${window.location.origin}/auth/join-clinic?token=${invite.token}`
      await navigator.clipboard.writeText(link)
      setCopiedToken(invite.id)
      setTimeout(() => setCopiedToken(null), 3000)
      toast.success('Link copiado! Envie para o veterinário.')
      setInviteEmail('')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-7 w-7 text-primary" />
          Clínica
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie sua clínica e convide outros veterinários
        </p>
      </div>

      {clinic ? (
        <div className="space-y-6 w-full max-w-2xl">
          {/* Clinic Info */}
          <Card className="bg-card border-border w-full">
            <CardHeader>
              <CardTitle className="text-card-foreground">{clinic.nome}</CardTitle>
              <CardDescription className="text-muted-foreground">
                {clinic.endereco && `${clinic.endereco}${clinic.telefone ? ' | ' : ''}`}
                {clinic.telefone}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Members */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Membros ({members?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {members?.length ? (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 text-sm">
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                        {(m.nome || '?')[0]}
                      </div>
                      <span className="text-card-foreground">{m.nome || 'Sem nome'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nenhum membro ainda"
                  description="Convide outros veterinários para compartilhar a clínica e dividir os dados do dia a dia."
                />
              )}
            </CardContent>
          </Card>

          {/* Invites */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Convidar Veterinário
              </CardTitle>
              {!canManageInvites && (
                <CardDescription className="text-muted-foreground">
                  Somente o dono da clínica pode criar e ver convites.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email do veterinário..."
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground flex-1"
                  required
                />
                <Button type="submit" disabled={!canManageInvites || createInvite.isPending}
                  className="bg-primary hover:bg-primary/90 text-white shrink-0">
                  {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convidar'}
                </Button>
              </form>

              {/* Invite history */}
              {invites && invites.length > 0 ? (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Convites enviados:</p>
                  {invites.map((inv) => {
                    const link = `${window.location.origin}/auth/join-clinic?token=${inv.token}`
                    return (
                      <div key={inv.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg p-2">
                        <span className="text-foreground">{inv.email}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded ${inv.usado ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
                            {inv.usado ? 'Aceito' : 'Pendente'}
                          </span>
                          {!inv.usado && (
                            <button
                              onClick={async () => {
                                await navigator.clipboard.writeText(link)
                                setCopiedToken(inv.id)
                                setTimeout(() => setCopiedToken(null), 3000)
                              }}
                              className="text-primary hover:text-primary/80"
                            >
                              {copiedToken === inv.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Mail}
                  title="Nenhum convite enviado"
                  description="Envie o primeiro convite para adicionar um colega à clínica."
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Criar clínica */
        <Card className="bg-card border-border max-w-lg">
          <CardHeader>
            <CardTitle className="text-card-foreground">Criar Clínica</CardTitle>
            <CardDescription className="text-muted-foreground">
              Crie uma clínica para compartilhar dados com outros veterinários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nome da Clínica *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required
                  className="bg-muted border-border text-card-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Endereço</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)}
                  className="bg-muted border-border text-card-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                  className="bg-muted border-border text-card-foreground" />
              </div>
              <Button type="submit" disabled={createClinic.isPending}
                className="bg-primary hover:bg-primary/90 text-white">
                {createClinic.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Clínica
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

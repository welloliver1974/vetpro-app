'use client'

import { useState } from 'react'
import { useMyClinic, useClinicInvites, useClinicMembers, useCreateClinic, useCreateInvite } from '@/hooks/useClinic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Toaster, toast } from 'sonner'
import { Loader2, Building2, Copy, Check, Users, Mail } from 'lucide-react'

export default function ClinicaPage() {
  const { data: clinic, isLoading } = useMyClinic()
  const { data: invites } = useClinicInvites()
  const { data: members } = useClinicMembers()
  const createClinic = useCreateClinic()
  const createInvite = useCreateInvite()

  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [telefone, setTelefone] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

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
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors position="top-center" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Building2 className="h-7 w-7 text-indigo-500" />
          Clínica
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Gerencie sua clínica e convide outros veterinários
        </p>
      </div>

      {!clinic ? (
        /* Criar clínica */
        <Card className="bg-slate-900 border-slate-800 max-w-lg">
          <CardHeader>
            <CardTitle className="text-slate-200">Criar Clínica</CardTitle>
            <CardDescription className="text-slate-500">
              Crie uma clínica para compartilhar dados com outros veterinários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome da Clínica *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} required
                  className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Endereço</Label>
                <Input value={endereco} onChange={(e) => setEndereco(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <Button type="submit" disabled={createClinic.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createClinic.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Criar Clínica
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 max-w-2xl">
          {/* Clinic Info */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-200">{clinic.nome}</CardTitle>
              <CardDescription className="text-slate-500">
                {clinic.endereco && `${clinic.endereco}${clinic.telefone ? ' | ' : ''}`}
                {clinic.telefone}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Members */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Users className="h-4 w-4" /> Membros ({members?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!members?.length ? (
                <p className="text-xs text-slate-500">Nenhum membro</p>
              ) : (
                <div className="space-y-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 text-sm">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {(m.nome || '?')[0]}
                      </div>
                      <span className="text-slate-200">{m.nome || 'Sem nome'}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invites */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Mail className="h-4 w-4" /> Convidar Veterinário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email do veterinário..."
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 flex-1"
                  required
                />
                <Button type="submit" disabled={createInvite.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">
                  {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Convidar'}
                </Button>
              </form>

              {/* Invite history */}
              {invites && invites.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500">Convites enviados:</p>
                  {invites.map((inv) => {
                    const link = `${window.location.origin}/auth/join-clinic?token=${inv.token}`
                    return (
                      <div key={inv.id} className="flex items-center justify-between text-xs bg-slate-800/50 rounded-lg p-2">
                        <span className="text-slate-300">{inv.email}</span>
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
                              className="text-indigo-400 hover:text-indigo-300"
                            >
                              {copiedToken === inv.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

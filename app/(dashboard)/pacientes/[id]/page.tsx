'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePatients } from '@/hooks/usePatients'
import { useSessionsByPatient, useCreateSession, useUpdateSession, uploadFile } from '@/hooks/useSessions'
import { useAppointments } from '@/hooks/useAppointments'
import { useProtocols } from '@/hooks/useProtocols'
import { ReportPDF } from '@/components/vet/ReportPDF'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { Toaster, toast } from 'sonner'
import {
  Loader2, Plus, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string

  const { data: patients } = usePatients()
  const patient = patients?.find((p) => p.id === patientId)
  const { data: appointments } = useAppointments()
  const { data: sessions, isLoading } = useSessionsByPatient(patientId)
  const createSession = useCreateSession()
  const updateSession = useUpdateSession()

  const { data: protocols } = useProtocols()
  const patientAppointments = appointments?.filter((a) => a.paciente_id === patientId) ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [selectedProtocol, setSelectedProtocol] = useState('')
  const [notas, setNotas] = useState('')
  const [notasEvolucao, setNotasEvolucao] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)

  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAppointment) {
      toast.error('Selecione um atendimento')
      return
    }
    setUploading(true)

    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const uploadedUrls: string[] = []

      for (const file of files) {
        const path = `${user?.id}/${patientId}/${Date.now()}-${file.name}`
        const url = await uploadFile(file, path)
        uploadedUrls.push(url)
      }

      const session = await createSession.mutateAsync({
        appointment_id: selectedAppointment,
        protocolo_id: selectedProtocol || undefined,
        notas: notas || undefined,
        notas_evolucao: notasEvolucao || undefined,
      })

      if (uploadedUrls.length > 0 && session?.id) {
        await updateSession.mutateAsync({
          id: session.id,
          data: { foto_urls: uploadedUrls },
        })
      }

      setDialogOpen(false)
      setNotas('')
      setNotasEvolucao('')
      setFiles([])
      setSelectedAppointment('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar sessão')
    } finally {
      setUploading(false)
    }
  }

  if (!patient) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors position="top-center" />

      <div className="mb-6">
        <Link href="/pacientes" className="text-sm text-slate-400 hover:text-indigo-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{patient.nome}</h1>
            <p className="text-sm text-slate-400">
              {patient.especie && `${patient.especie}${patient.raca ? ` - ${patient.raca}` : ''}`}
              {patient.tutor_nome && ` | Tutor: ${patient.tutor_nome}`}
              {patient.tutor_contato && ` | ${patient.tutor_contato}`}
            </p>
          </div>
          <div className="flex gap-2">
            <ReportPDF patient={patient} sessions={sessions || []} />
            <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nova Sessão
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sessoes" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="sessoes" className="text-slate-400 data-[state=active]:text-indigo-400">Sessões</TabsTrigger>
          <TabsTrigger value="galeria" className="text-slate-400 data-[state=active]:text-indigo-400">Galeria de Evolução</TabsTrigger>
        </TabsList>

        {/* Sessões Tab */}
        <TabsContent value="sessoes" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          ) : !sessions?.length ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8 text-center text-slate-500">
                Nenhuma sessão registrada ainda
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => {
              const app = patientAppointments.find((a) => a.id === session.appointment_id)
              return (
                <Card key={session.id} className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm text-slate-200">
                          {app ? format(parseISO(app.data), "d 'de' MMM 'às' HH:mm", { locale: ptBR }) : 'Data não encontrada'}
                        </CardTitle>
                        <p className="text-xs text-slate-500">
                          {app?.tipo === 'fisio' ? 'Fisioterapia' : app?.tipo === 'externo' ? 'Externo' : 'Clínico'}
                        </p>
                        {session.protocolo_id && protocols?.find((p) => p.id === session.protocolo_id) && (
                          <p className="text-xs text-indigo-400/70 mt-0.5">
                            Protocolo: {protocols.find((p) => p.id === session.protocolo_id)?.nome}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px]">
                        {session.foto_urls?.length || 0} mídias
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.notas && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Anotações da sessão:</p>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{session.notas}</p>
                      </div>
                    )}
                    {session.notas_evolucao && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Evolução:</p>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{session.notas_evolucao}</p>
                      </div>
                    )}
                    {session.foto_urls && session.foto_urls.length > 0 && (
                      <div>
                        <button
                          onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                          className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          {expandedSession === session.id ? 'Ocultar fotos' : `Ver ${session.foto_urls.length} foto(s)`}
                        </button>
                        {expandedSession === session.id && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                            {session.foto_urls.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noreferrer">
                                <img
                                  src={url}
                                  alt={`Foto ${i + 1}`}
                                  className="rounded-lg border border-slate-700 w-full h-24 object-cover hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* Galeria Tab */}
        <TabsContent value="galeria">
          {!sessions?.length ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-8 text-center text-slate-500">
                Nenhuma mídia registrada
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sessions
                .filter((s) => s.foto_urls?.length > 0)
                .flatMap((session) =>
                  session.foto_urls.map((url, i) => (
                    <a key={`${session.id}-${i}`} href={url} target="_blank" rel="noreferrer">
                      <div className="relative group">
                        <img
                          src={url}
                          alt={`Evolução - ${format(parseISO(session.created_at), 'dd/MM')}`}
                          className="rounded-lg border border-slate-700 w-full h-32 object-cover group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-slate-300 px-1.5 py-0.5 rounded">
                          {format(parseISO(session.created_at), 'dd/MM', { locale: ptBR })}
                        </div>
                      </div>
                    </a>
                  ))
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Nova Sessão Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Sessão - {patient.nome}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Atendimento</Label>
              <select
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 text-slate-100 px-3 py-2 text-sm"
                required
              >
                <option value="">Selecione um atendimento</option>
                {patientAppointments.map((app) => (
                  <option key={app.id} value={app.id}>
                    {format(parseISO(app.data), "dd/MM/yyyy HH:mm")} - {app.tipo}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Protocolo</Label>
              <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Selecione um protocolo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="">Nenhum</SelectItem>
                  {protocols?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Anotações da Sessão</Label>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Descreva o que foi feito, reações do paciente, etc."
                rows={3}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notas de Evolução</Label>
              <Textarea
                value={notasEvolucao}
                onChange={(e) => setNotasEvolucao(e.target.value)}
                placeholder="Comparação com sessões anteriores, progresso observado..."
                rows={3}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Fotos / Vídeos</Label>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="bg-slate-800 border-slate-700 text-slate-100 file:bg-indigo-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-medium"
              />
              {files.length > 0 && (
                <p className="text-xs text-slate-500">{files.length} arquivo(s) selecionado(s)</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={uploading || createSession.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {(uploading || createSession.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar Sessão
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

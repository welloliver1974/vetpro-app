'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { usePatients } from '@/hooks/usePatients'
import { useSessionsByPatient, useCreateSession, useUpdateSession, uploadFile } from '@/hooks/useSessions'
import { useAppointments } from '@/hooks/useAppointments'
import { useProtocols } from '@/hooks/useProtocols'
import { useChat, useTranscription, useImageAnalysis } from '@/hooks/useAi'
import { AudioRecorder } from '@/components/vet/AudioRecorder'
import { ReportPDF } from '@/components/vet/ReportPDF'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import { Toaster, toast } from 'sonner'
import {
  Loader2, Plus, ArrowLeft, Sparkles, ImageUp, ImageDown, ScanSearch, X,
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
  const chatAi = useChat()
  const transcribeAi = useTranscription()
  const visionAi = useImageAnalysis()

  const [slot1, setSlot1] = useState<{ url: string; date: string } | null>(null)
  const [slot2, setSlot2] = useState<{ url: string; date: string } | null>(null)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [previsao, setPrevisao] = useState<string | null>(null)
  const [loadingPrevisao, setLoadingPrevisao] = useState(false)
  const [previsaoOpen, setPrevisaoOpen] = useState(false)

  const { data: protocols } = useProtocols()
  const patientAppointments = appointments?.filter((a) => a.paciente_id === patientId) ?? []
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState('')
  const [selectedProtocol, setSelectedProtocol] = useState('')
  const [notas, setNotas] = useState('')
  const [notasEvolucao, setNotasEvolucao] = useState('')
  const [custo, setCusto] = useState('')
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
        custo: custo ? Number(custo) : undefined,
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
      setCusto('')
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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors position="top-center" />

      <div className="mb-6">
        <Link href="/pacientes" className="text-sm text-muted-foreground hover:text-indigo-400 flex items-center gap-1 mb-2">
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{patient.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {patient.especie && `${patient.especie}${patient.raca ? ` - ${patient.raca}` : ''}`}
              {patient.tutor_nome && ` | Tutor: ${patient.tutor_nome}`}
              {patient.tutor_contato && ` | ${patient.tutor_contato}`}
            </p>
            {patient.endereco && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                📍 {patient.endereco}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(patient.endereco)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 ml-1"
                >
                  [Ver no Maps]
                </a>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <ReportPDF
              patient={patient}
              sessions={sessions || []}
              assinaturaUrl={patientAppointments.find((a) => a.assinatura_url)?.assinatura_url}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={chatAi.loading || !sessions?.length}
              onClick={async () => {
                const evolNotes = sessions
                  ?.filter((s) => s.notas_evolucao)
                  .slice(0, 10)
                  .map((s, i) => `Sessão ${i + 1}: ${s.notas_evolucao}`)
                  .join('\n\n')
                if (!evolNotes) {
                  toast.error('Nenhuma nota de evolução para gerar relatório')
                  return
                }
                try {
                  const report = await chatAi.generate(
                    `Gere um relatório de evolução para o tutor do paciente veterinário abaixo:\n\n` +
                    `Paciente: ${patient.nome} (${patient.especie || ''} ${patient.raca || ''})\n` +
                    `Tutor: ${patient.tutor_nome || '---'}\n` +
                    `Total de sessões: ${sessions?.length || 0}\n\n` +
                    `Histórico de evolução:\n${evolNotes}\n\n` +
                    `Escreva em linguagem clara para o tutor, destacando progressos e próximos passos.`
                  )
                  toast.success('Relatório gerado!', { duration: 8000 })
                  setNotasEvolucao(report)
                  setDialogOpen(true)
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Erro ao gerar relatório')
                }
              }}
              className="border-indigo-700 text-indigo-400 hover:bg-indigo-950/30 gap-2"
            >
              {chatAi.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Relatório com IA
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loadingPrevisao || !sessions?.length}
              onClick={async () => {
                if (!sessions?.length) return
                setLoadingPrevisao(true)
                try {
                  const evol = sessions.filter((s) => s.notas_evolucao).slice(-5).map((s, i) => `Sessão ${i + 1}: ${s.notas_evolucao}`).join('\n\n')
                  const pred = await chatAi.generate(
                    `Paciente: ${patient.nome} (${patient.especie || ''})\n` +
                    `Total de sessões realizadas: ${sessions.length}\n` +
                    `Período: ${sessions.length > 1 ? `${format(parseISO(sessions[sessions.length - 1].created_at), 'dd/MM')} até ${format(parseISO(sessions[0].created_at), 'dd/MM')}` : 'apenas 1 sessão'}\n\n` +
                    `Notas de evolução:\n${evol || 'Nenhuma nota disponível'}\n\n` +
                    `Com base nesses dados, estime quantas sessões ainda são necessárias para concluir o tratamento e justifique.`,
                    'Você é um fisioterapeuta veterinário. Seja objetivo e realista.'
                  )
                  setPrevisao(pred)
                  setPrevisaoOpen(true)
                } catch {
                  toast.error('Erro ao gerar previsão')
                } finally {
                  setLoadingPrevisao(false)
                }
              }}
              className="border-amber-700 text-amber-400 hover:bg-amber-950/30 gap-2"
            >
              {loadingPrevisao ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Previsão de Sessões
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              <Plus className="h-4 w-4" /> Nova Sessão
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="sessoes" className="space-y-6">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="sessoes" className="text-muted-foreground data-[state=active]:text-indigo-400">Sessões</TabsTrigger>
          <TabsTrigger value="galeria" className="text-muted-foreground data-[state=active]:text-indigo-400">Galeria de Evolução</TabsTrigger>
        </TabsList>

        {/* Sessões Tab */}
        <TabsContent value="sessoes" className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !sessions?.length ? (
            <Card className="bg-card border-border">
              <CardContent className="p-8 text-center text-muted-foreground">
                Nenhuma sessão registrada ainda
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => {
              const app = patientAppointments.find((a) => a.id === session.appointment_id)
              return (
                <Card key={session.id} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm text-card-foreground">
                          {app ? format(parseISO(app.data), "d 'de' MMM 'às' HH:mm", { locale: ptBR }) : 'Data não encontrada'}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {app?.tipo === 'fisio' ? 'Fisioterapia' : app?.tipo === 'externo' ? 'Externo' : 'Clínico'}
                        </p>
                        {session.protocolo_id && protocols?.find((p) => p.id === session.protocolo_id) && (
                          <p className="text-xs text-indigo-400/70 mt-0.5">
                            Protocolo: {protocols.find((p) => p.id === session.protocolo_id)?.nome}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                    {session.foto_urls?.length || 0} mídias
                  </Badge>
                  <div className="text-right text-xs">
                    {session.custo && (
                      <p className="text-muted-foreground">Custo: R$ {Number(session.custo).toFixed(2)}</p>
                    )}
                    {session.custo && app?.valor && (
                      <p className={Number(app.valor) - Number(session.custo) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        Margem: R$ {(Number(app.valor) - Number(session.custo)).toFixed(2)}
                      </p>
                    )}
                  </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {session.notas && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Anotações da sessão:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{session.notas}</p>
                      </div>
                    )}
                    {session.notas_evolucao && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Evolução:</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{session.notas_evolucao}</p>
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
                                  className="rounded-lg border border-border w-full h-24 object-cover hover:opacity-80 transition-opacity"
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
          {(() => {
            const allPhotos = sessions
              ?.filter((s) => s.foto_urls?.length > 0)
              .flatMap((session) =>
                session.foto_urls.map((url) => ({
                  url,
                  date: format(parseISO(session.created_at), 'dd/MM/yyyy', { locale: ptBR }),
                  sessionId: session.id,
                }))
              ) ?? []

            if (!allPhotos.length) {
              return (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Nenhuma mídia registrada
                  </CardContent>
                </Card>
              )
            }

            function handleSelectPhoto(photo: { url: string; date: string }) {
              if (slot1?.url === photo.url) { setSlot1(null); return }
              if (slot2?.url === photo.url) { setSlot2(null); return }
              if (!slot1) setSlot1(photo)
              else if (!slot2) setSlot2(photo)
              else setSlot1(photo)
            }

            return (
              <div className="space-y-4">
                {/* Comparison toolbar */}
                <Card className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      {/* Slot 1 - Antes */}
                      <div className="flex-1 w-full">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <ImageUp className="h-3 w-3 text-emerald-400" /> Antes
                        </p>
                        {slot1 ? (
                          <div className="relative">
                            <img src={slot1.url} alt="Antes" className="w-full h-24 object-cover rounded-lg border border-border" />
                            <button onClick={() => setSlot1(null)} className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                              <X className="h-3 w-3 text-foreground" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-foreground px-1 py-0.5 rounded">{slot1.date}</span>
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-slate-600">
                            Clique numa foto
                          </div>
                        )}
                      </div>

                      {/* VS */}
                      <div className="hidden md:flex items-center justify-center">
                        <ScanSearch className="h-6 w-6 text-blue-500" />
                      </div>

                      {/* Slot 2 - Depois */}
                      <div className="flex-1 w-full">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <ImageDown className="h-3 w-3 text-indigo-400" /> Depois
                        </p>
                        {slot2 ? (
                          <div className="relative">
                            <img src={slot2.url} alt="Depois" className="w-full h-24 object-cover rounded-lg border border-border" />
                            <button onClick={() => setSlot2(null)} className="absolute top-1 right-1 bg-black/60 rounded p-0.5">
                              <X className="h-3 w-3 text-foreground" />
                            </button>
                            <span className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-foreground px-1 py-0.5 rounded">{slot2.date}</span>
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-lg border border-dashed border-border flex items-center justify-center text-xs text-slate-600">
                            Clique numa foto
                          </div>
                        )}
                      </div>

                      {/* Analyze button */}
                      <Button
                        disabled={!slot1 || !slot2 || visionAi.loading}
                        onClick={async () => {
                          if (!slot1 || !slot2) return
                          try {
                            const result = await visionAi.analyze(
                              slot1.url,
                              `Compare estas duas fotos de evolução de um paciente de fisioterapia veterinária.\n` +
                              `Foto 1 (ANTES - ${slot1.date}):\n` +
                              `Foto 2 (DEPOIS - ${slot2.date}):\n\n` +
                              `Analise: 1) Houve melhora, piora ou está estável? 2) O que mudou visivelmente? 3) Recomendações.\n` +
                              `Seja técnico mas claro, como um fisioterapeuta veterinário.`
                            )
                            setAnalysisResult(result)
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Erro ao analisar fotos')
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shrink-0"
                      >
                        {visionAi.loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ScanSearch className="h-4 w-4" />
                        )}
                        {visionAi.loading ? 'Analisando...' : 'Comparar com IA'}
                      </Button>
                    </div>

                    {/* Analysis result */}
                    {analysisResult && (
                      <div className="mt-4 p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/50">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-indigo-400 font-medium mb-1">🔍 Análise de Evolução</p>
                          <button onClick={() => setAnalysisResult(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm text-card-foreground whitespace-pre-wrap">{analysisResult}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Photo grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {allPhotos.map((photo, idx) => {
                    const isSlot1 = slot1?.url === photo.url
                    const isSlot2 = slot2?.url === photo.url
                    return (
                      <button
                        key={`${photo.sessionId}-${idx}`}
                        onClick={() => {
                          if (isSlot1 || isSlot2) {
                            if (isSlot1) setSlot1(null)
                            if (isSlot2) setSlot2(null)
                          } else {
                            handleSelectPhoto(photo)
                          }
                        }}
                        className="relative group text-left"
                      >
                        <img
                          src={photo.url}
                          alt={`Evolução ${photo.date}`}
                          className={`rounded-lg border w-full h-32 object-cover transition-all ${
                            isSlot1
                              ? 'border-emerald-500 ring-2 ring-emerald-500/50'
                              : isSlot2
                              ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                              : 'border-border group-hover:border-slate-500'
                          }`}
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 text-[10px] text-foreground px-1.5 py-0.5 rounded">
                          {photo.date}
                        </div>
                        {isSlot1 && (
                          <div className="absolute top-1 left-1 bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
                            Antes
                          </div>
                        )}
                        {isSlot2 && (
                          <div className="absolute top-1 right-1 bg-indigo-600 text-[10px] text-white px-1.5 py-0.5 rounded font-medium">
                            Depois
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </TabsContent>
      </Tabs>

      {/* Nova Sessão Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Sessão - {patient.nome}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Atendimento</Label>
              <select
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
                className="w-full rounded-lg border border-border bg-muted text-card-foreground px-3 py-2 text-sm"
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
              <Label className="text-foreground">Protocolo</Label>
              <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue placeholder="Selecione um protocolo" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  <SelectItem value="">Nenhum</SelectItem>
                  {protocols?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Anotações da Sessão</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                <AudioRecorder
                  transcribeFn={(blob) => transcribeAi.transcribe(blob)}
                  onTranscription={(text) => setNotas((prev) => prev + text)}
                />
                {notas && (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={chatAi.loading}
                    onClick={async () => {
                      try {
                        const analise = await chatAi.generate(
                          `Analise clinicamente estas anotações de fisioterapia veterinária e produza:\n\n` +
                          `1) RESUMO CLÍNICO (2-3 linhas sobre o caso)\n` +
                          `2) ACHADOS (listar pontos relevantes)\n` +
                          `3) CONDUTA (próximos passos sugeridos)\n\n` +
                          `Anotações:\n${notas}\n\n` +
                          `Formate com headers em MAIÚSCULO e use linhas separadas.`,
                          'Você é um fisioterapeuta veterinário especialista em reabilitação animal.'
                        )
                        // Split into session notes and evolution notes
                        const parts = analise.split(/CONDUTA|PRÓXIMOS PASSOS/i)
                        if (parts.length >= 2) {
                          setNotas('📋 ' + parts[0].trim())
                          setNotasEvolucao('🎯 Conduta: ' + parts.slice(1).join('').trim())
                        } else {
                          setNotas(analise)
                        }
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : 'Erro ao analisar')
                      }
                    }}
                    className="border-indigo-700 text-indigo-400 hover:bg-indigo-950/30 gap-1"
                  >
                    {chatAi.loading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Analisar Clínica
                  </Button>
                )}
              </div>
              <Textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Descreva o que foi feito, reações do paciente, etc."
                rows={3}
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Notas de Evolução</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={chatAi.loading || !notas}
                  onClick={async () => {
                    if (!notas) return
                    try {
                      const evol = await chatAi.generate(
                        `Com base nestas anotações de sessão de fisioterapia veterinária, escreva notas de evolução profissionais:\n\n${notas}`,
                        'Você é um fisioterapeuta veterinário especialista. Gere notas de evolução concisas e técnicas.'
                      )
                      setNotasEvolucao(evol)
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : 'Erro ao gerar evolução')
                    }
                  }}
                  className="text-indigo-400 hover:text-indigo-300 gap-1"
                >
                  {chatAi.loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Sugerir com IA
                </Button>
              </div>
              <Textarea
                value={notasEvolucao}
                onChange={(e) => setNotasEvolucao(e.target.value)}
                placeholder="Comparação com sessões anteriores, progresso observado..."
                rows={3}
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Custo da Sessão (R$)</Label>
              <Input
                type="number" step="0.01" min="0"
                value={custo}
                onChange={(e) => setCusto(e.target.value)}
                placeholder="0,00"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">Energia, material descartável, etc.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Fotos / Vídeos</Label>
              <Input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="bg-muted border-border text-card-foreground file:bg-indigo-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-medium"
              />
              {files.length > 0 && (
                <p className="text-xs text-muted-foreground">{files.length} arquivo(s) selecionado(s)</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-border text-foreground">
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

      <Dialog open={previsaoOpen} onOpenChange={setPrevisaoOpen}>
        <DialogContent className="bg-card border-border text-card-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Previsão de Sessões
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Estimativa baseada no histórico de evolução do paciente.
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-muted/60 border border-border">
            <p className="text-sm text-card-foreground whitespace-pre-wrap">{previsao}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

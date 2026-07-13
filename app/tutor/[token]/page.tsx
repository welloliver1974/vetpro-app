'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/EmptyState'
import {
  PawPrint, CalendarDays, Weight, Camera, ChevronDown, ChevronUp,
  Loader2, Download, Heart, AlertTriangle, Syringe,
} from 'lucide-react'
import { generateTutorReportPdf } from '@/lib/pdf/tutorReport'

// ─── Types ────────────────────────────────────────────────

type TutorAppointment = {
  id: string
  data: string
  tipo: string
  status: string
}

type TutorSession = {
  id: string
  notas_evolucao: string | null
  foto_urls: string[]
  peso: number | null
  created_at: string
  appointment: { data: string; tipo: string } | null
}

type TutorPatient = {
  id: string
  nome: string
  especie: string | null
  raca: string | null
  tutor_nome: string | null
  data_nascimento: string | null
  sexo: string | null
  peso: number | null
  cor_pelagem: string | null
}

type PortalData = {
  patient: TutorPatient
  upcomingAppointments: TutorAppointment[]
  sessions: TutorSession[]
  totalSessions: number
}

const tipoLabels: Record<string, string> = {
  fisio: 'Fisioterapia',
  clinico: 'Clínico',
  externo: 'Domiciliar',
}

const tipoColors: Record<string, string> = {
  fisio: 'bg-emerald-500/15 text-emerald-400 border-emerald-800',
  clinico: 'bg-blue-500/15 text-blue-400 border-blue-800',
  externo: 'bg-amber-500/15 text-amber-400 border-amber-800',
}

// ─── Skeleton ──────────────────────────────────────────────

function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border p-8">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-6 w-24 bg-muted rounded" />
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
        </div>
      </div>
      <div className="max-w-4xl mx-auto p-8 animate-pulse space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-muted rounded-lg" />
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────

function PortalError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full bg-card border-border text-center">
        <CardContent className="p-8 space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto" />
          <h1 className="text-xl font-bold text-card-foreground">
            Link inválido
          </h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground">
            Verifique com o veterinário se o link está correto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────

export default function TutorPortalPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(
    new Set(),
  )
  const [generatingPdf, setGeneratingPdf] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tutor/${token}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Link não encontrado ou expirado.')
          } else {
            setError('Erro ao carregar dados do paciente.')
          }
          return
        }
        const json = await res.json()
        setData(json)
      } catch {
        setError('Erro de conexão. Verifique sua internet.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const toggleSession = useCallback((id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDownloadPdf = useCallback(async () => {
    if (!data) return
    setGeneratingPdf(true)
    try {
      const { blob, filename } = await generateTutorReportPdf(
        data.patient,
        data.sessions,
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silent fail — PDF download é opcional
    } finally {
      setGeneratingPdf(false)
    }
  }, [data])

  // ── Loading ──────────────────────────────────────────
  if (loading) return <PortalSkeleton />

  // ── Error ────────────────────────────────────────────
  if (error || !data) {
    return <PortalError message={error || 'Erro inesperado.'} />
  }

  const { patient, upcomingAppointments, sessions } = data

  // Fotos de todas as sessões (para galeria)
  const allPhotos = sessions
    .filter((s) => s.foto_urls.length > 0)
    .flatMap((s) => s.foto_urls.map((url) => ({ url, date: s.created_at })))

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ HEADER ═══ */}
      <header className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <div className="flex items-center gap-2 mb-2">
            <PawPrint className="h-5 w-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              VetPro — Portal do Tutor
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-card-foreground">
            {patient.nome}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span>
              {[patient.especie, patient.raca].filter(Boolean).join(' — ')}
            </span>
            {patient.sexo && (
              <span className="text-xs">
                {patient.sexo === 'macho' ? 'Macho' : 'Fêmea'}
              </span>
            )}
            {patient.data_nascimento && (
              <span className="flex items-center gap-1 text-xs">
                <CalendarDays className="h-3 w-3" />
                {format(parseISO(patient.data_nascimento), 'dd/MM/yyyy')}
              </span>
            )}
            {patient.peso && (
              <span className="flex items-center gap-1 text-xs">
                <Weight className="h-3 w-3" />
                {patient.peso} kg
              </span>
            )}
            {patient.cor_pelagem && (
              <span className="text-xs">{patient.cor_pelagem}</span>
            )}
          </div>
          {patient.tutor_nome && (
            <p className="text-xs text-muted-foreground mt-2">
              Tutor: {patient.tutor_nome}
            </p>
          )}
        </div>
      </header>

      {/* ═══ MAIN ═══ */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8 space-y-8">
        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {data.totalSessions}
              </p>
              <p className="text-xs text-muted-foreground">Sessões</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {sessions.filter((s) => s.foto_urls.length > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">Com Fotos</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">
                {upcomingAppointments.length}
              </p>
              <p className="text-xs text-muted-foreground">Próximas</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Próximos Agendamentos ── */}
        <section>
          <h2 className="text-base font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Próximos Atendimentos
          </h2>
          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum agendamento futuro"
              description="Não há atendimentos agendados para este paciente."
            />
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((appt) => (
                <Card key={appt.id} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate">
                        {format(parseISO(appt.data), "d 'de' MMM 'de' yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(appt.data), 'HH:mm')}h —{' '}
                        {tipoLabels[appt.tipo] || appt.tipo}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${appt.status === 'agendado' ? 'border-primary text-primary' : ''}`}
                    >
                      {appt.status === 'agendado'
                        ? 'Agendado'
                        : appt.status === 'concluido'
                          ? 'Concluído'
                          : appt.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* ── Sessões ── */}
        <section>
          <h2 className="text-base font-semibold text-card-foreground mb-3 flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            Últimas Sessões
          </h2>
          {sessions.length === 0 ? (
            <EmptyState
              icon={Syringe}
              title="Nenhuma sessão registrada"
              description="As sessões aparecerão aqui conforme forem registradas pelo veterinário."
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => {
                const dateStr = session.appointment
                  ? format(parseISO(session.appointment.data), "d 'de' MMM", {
                      locale: ptBR,
                    })
                  : format(parseISO(session.created_at), "d 'de' MMM", {
                      locale: ptBR,
                    })
                const tipoLabel = session.appointment
                  ? tipoLabels[session.appointment.tipo] || '—'
                  : '—'
                const isExpanded = expandedSessions.has(session.id)
                const hasEvolucao =
                  !!session.notas_evolucao && session.notas_evolucao.length > 0

                return (
                  <Card key={session.id} className="bg-card border-border">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground">
                            {dateStr}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-[10px] border mt-0.5 ${tipoColors[session.appointment?.tipo || ''] || ''}`}
                          >
                            {tipoLabel}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {session.peso != null && (
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                              <Weight className="h-3 w-3" />
                              {session.peso} kg
                            </span>
                          )}
                          {session.foto_urls.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {session.foto_urls.length} 📸
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fotos */}
                      {session.foto_urls.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                          {session.foto_urls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0"
                            >
                              <Image
                                src={url}
                                alt={`Foto ${i + 1}`}
                                width={160}
                                height={120}
                                className="rounded-md border border-border w-20 h-16 object-cover hover:opacity-80 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Evolução */}
                      {hasEvolucao && (
                        <div>
                          <button
                            onClick={() => toggleSession(session.id)}
                            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                            {isExpanded
                              ? 'Ocultar evolução'
                              : 'Ver evolução'}
                          </button>
                          {isExpanded && (
                            <p className="text-sm text-card-foreground whitespace-pre-wrap mt-2 border-t border-border pt-2">
                              {session.notas_evolucao}
                            </p>
                          )}
                        </div>
                      )}

                      {!hasEvolucao && session.foto_urls.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          Sessão registrada sem anotações ou fotos.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* ── Galeria de Fotos ── */}
        {allPhotos.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-card-foreground mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Galeria de Fotos
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allPhotos.map((photo, i) => (
                <a
                  key={i}
                  href={photo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <Image
                    src={photo.url}
                    alt={`Foto ${i + 1}`}
                    width={400}
                    height={300}
                    className="rounded-lg border border-border w-full h-28 object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ── Download PDF ── */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleDownloadPdf}
            disabled={generatingPdf}
            variant="outline"
            className="gap-2 border-border"
          >
            {generatingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generatingPdf
              ? 'Gerando PDF…'
              : 'Baixar Relatório de Evolução (PDF)'}
          </Button>
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-muted-foreground pt-6 border-t border-border">
          <p>
            Informações fornecidas pelo VetPro App. Este link é pessoal e
            intransferível.
          </p>
          <p className="mt-1">
            Em caso de dúvidas, entre em contato com o veterinário
            responsável.
          </p>
        </footer>
      </main>
    </div>
  )
}

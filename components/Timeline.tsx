'use client'

import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Image from 'next/image'
import { ChevronDown, ChevronUp, Weight, Camera, PawPrint } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import type { Session } from '@/hooks/useSessions'
import type { Appointment } from '@/hooks/useAppointments'
import type { Protocol } from '@/hooks/useProtocols'

const typeLabels: Record<string, string> = {
  fisio: 'Fisioterapia',
  clinico: 'Clínico',
  externo: 'Externo (Domiciliar)',
}

const typeColors: Record<string, string> = {
  fisio: 'bg-emerald-500/15 text-emerald-400 border-emerald-800',
  clinico: 'bg-blue-500/15 text-blue-400 border-blue-800',
  externo: 'bg-amber-500/15 text-amber-400 border-amber-800',
}

type TimelineProps = {
  sessions: Session[]
  appointments: Appointment[]
  protocols: Protocol[]
}

export function Timeline({ sessions, appointments, protocols }: TimelineProps) {
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  const sorted = useMemo(() => {
    return [...sessions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [sessions])

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon={PawPrint}
        title="Nenhuma sessão registrada"
        description="As sessões aparecerão aqui em ordem cronológica com fotos e evolução."
      />
    )
  }

  return (
    <div className="relative pl-8 space-y-0">
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

      {sorted.map((session, idx) => {
        const app = appointments.find((a) => a.id === session.appointment_id)
        const protocol = session.protocolo_id
          ? protocols.find((p) => p.id === session.protocolo_id)
          : undefined

        const prevSession = sorted[idx + 1]
        const weightDiff = session.peso != null && prevSession?.peso != null
          ? Number((session.peso - prevSession.peso).toFixed(2))
          : null

        const hasNotes = !!session.notas_evolucao
        const isExpanded = expandedNotes === session.id

        return (
          <div key={session.id} className="relative pb-8 group">
            <div className={`absolute left-[-15px] top-[6px] w-3 h-3 rounded-full border-2 bg-card ${app?.tipo === 'fisio' ? 'border-emerald-500' : app?.tipo === 'externo' ? 'border-amber-500' : 'border-blue-500'} z-10`} />

            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-xs text-muted-foreground shrink-0">
                    {app ? format(parseISO(app.data), "d 'de' MMM", { locale: ptBR }) : '—'}
                  </span>
                  {app?.tipo && (
                    <Badge variant="outline" className={`text-[10px] border ${typeColors[app.tipo] || ''}`}>
                      {typeLabels[app.tipo] || app.tipo}
                    </Badge>
                  )}
                  {protocol && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {protocol.nome}
                    </span>
                  )}
                </div>
                {weightDiff !== null && (
                  <span className={`text-xs shrink-0 flex items-center gap-0.5 font-medium ${weightDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <Weight className="h-3 w-3" />
                    {weightDiff >= 0 ? '+' : ''}{weightDiff} kg
                  </span>
                )}
              </div>

              {session.foto_urls && session.foto_urls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                  {session.foto_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="shrink-0">
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

              {session.foto_urls && session.foto_urls.length === 0 && session.notas_evolucao && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Camera className="h-3 w-3" />
                  Sem fotos nesta sessão
                </div>
              )}

              {hasNotes && (
                <div>
                  <button
                    onClick={() => setExpandedNotes(isExpanded ? null : session.id)}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? 'Ocultar evolução' : 'Ver evolução'}
                  </button>
                  {isExpanded && (
                    <p className="text-sm text-foreground whitespace-pre-wrap mt-2 border-t border-border pt-2">
                      {session.notas_evolucao}
                    </p>
                  )}
                </div>
              )}

              {!hasNotes && session.foto_urls && session.foto_urls.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Sessão registrada sem anotações ou mídia</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

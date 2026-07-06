'use client'

import { format, parseISO } from 'date-fns'
import { MapPin, ExternalLink, Calendar, CheckCircle2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { generateIcsEvent, downloadIcs } from '@/lib/calendar'
import type { Appointment } from '@/hooks/useAppointments'

interface AppointmentCardProps {
  app: Appointment
  onFinish?: (app: Appointment) => void
  onDelete?: (id: string) => void
  showDetails?: boolean
}

const typeLabels: Record<string, string> = {
  fisio: 'Fisio',
  clinico: 'Clínico',
  externo: 'Externo',
}

export function AppointmentCard({ app, onFinish, onDelete, showDetails = false }: AppointmentCardProps) {
  const isCompleted = app.status === 'concluido'

  const borderColor = isCompleted
    ? 'border-l-border'
    : app.tipo === 'fisio'
    ? 'border-l-emerald-500'
    : app.tipo === 'externo'
    ? 'border-l-amber-500'
    : 'border-l-blue-500'

  const statusOpacity = isCompleted ? 'opacity-60' : ''

  function handleDownloadIcs() {
    const ics = generateIcsEvent(app)
    const name = (app.patients?.nome || 'paciente').replace(/\s+/g, '-').toLowerCase()
    downloadIcs(ics, `vetpro-${name}.ics`)
  }

  return (
    <Card className={`bg-card border-l-4 ${borderColor} ${statusOpacity}`}>
      <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Left section: time + patient info */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="text-lg font-bold text-primary min-w-[60px] shrink-0">
            {format(parseISO(app.data), 'HH:mm')}
          </div>
          <div className="min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-card-foreground truncate">
                {app.patients?.nome || '---'}
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${
                  app.tipo === 'fisio'
                    ? 'border-emerald-800 text-emerald-400'
                    : app.tipo === 'externo'
                    ? 'border-amber-800 text-amber-400'
                    : 'border-blue-800 text-blue-400'
                }`}
              >
                {typeLabels[app.tipo]}
              </Badge>
            </div>

            {/* External appointment address */}
            {app.tipo === 'externo' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 overflow-hidden">
                <MapPin className="h-3 w-3 shrink-0" />
                {app.patients?.endereco ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(app.patients.endereco)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:text-primary/80 flex items-center gap-0.5 truncate"
                  >
                    {app.patients.endereco} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  'Endereço externo'
                )}
              </div>
            )}

            {/* Value (only in details mode) */}
            {showDetails && app.valor && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                R$ {Number(app.valor).toFixed(2)}
                {app.forma_pagamento && ` • ${
                  app.forma_pagamento === 'pix' ? 'Pix' :
                  app.forma_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro'
                }`}
              </div>
            )}
          </div>
        </div>

        {/* Right section: actions */}
        <div className={`flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end ${showDetails ? '' : 'shrink-0'}`}>
          {/* Download .ics */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleDownloadIcs}
            className="text-muted-foreground hover:text-primary shrink-0"
            title="Adicionar ao calendário"
          >
            <Calendar className="h-3.5 w-3.5" />
          </Button>

          {/* Pending appointment actions */}
          {app.status === 'agendado' && onFinish && (
            <>
              <Button
                size="xs"
                onClick={() => onFinish(app)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0"
              >
                <CheckCircle2 className="h-3 w-3" /> Finalizar
              </Button>
            </>
          )}

          {/* Completed badge (only in details mode) */}
          {app.status === 'concluido' && showDetails && (
            <Badge className="bg-muted text-muted-foreground border-border shrink-0">
              Concluído
            </Badge>
          )}

          {/* Delete button (for all non-agendado, or always if onDelete provided) */}
          {(app.status !== 'agendado' || onDelete) && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete?.(app.id)}
              className="text-muted-foreground hover:text-red-400 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

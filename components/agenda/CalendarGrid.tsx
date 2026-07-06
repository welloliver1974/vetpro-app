'use client'

import { isSameDay, isSameMonth, isToday, parseISO, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import type { Appointment } from '@/hooks/useAppointments'

interface CalendarGridProps {
  visibleDays: Date[]
  currentDate: Date
  viewMode: 'week' | 'month' | 'day'
  appointments: Appointment[] | undefined
  typeColors: Record<string, string>
  typeLabels: Record<string, string>
  onDayClick: (date: Date) => void
}

export function CalendarGrid({
  visibleDays,
  currentDate,
  viewMode,
  appointments,
  typeColors,
  typeLabels,
  onDayClick,
}: CalendarGridProps) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 mb-6 ${
        viewMode === 'month' ? 'auto-rows-fr' : ''
      }`}
    >
      {visibleDays.map((day) => {
        const today = isToday(day)
        const dayApps = appointments?.filter((a) => isSameDay(parseISO(a.data), day)) ?? []
        const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true
        return (
          <Card
            key={day.toISOString()}
            className={`bg-card border-border min-h-[90px] cursor-pointer hover:border-border transition-colors ${
              today ? 'ring-1 ring-primary/50' : ''
            } ${!isCurrentMonth ? 'opacity-40' : ''}`}
            onClick={() => onDayClick(day)}
          >
            <CardContent className="p-1.5">
              <div className="text-center mb-1">
                {viewMode === 'week' && (
                  <div className="text-[10px] uppercase text-muted-foreground">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                )}
                <div className={`text-sm font-bold ${today ? 'text-primary' : 'text-card-foreground'}`}>
                  {format(day, 'd')}
                </div>
              </div>
              <div className="space-y-0.5">
                {dayApps.slice(0, viewMode === 'month' ? 2 : 3).map((app) => (
                  <div
                    key={app.id}
                    className={`text-[10px] px-1 py-0.5 rounded border ${typeColors[app.tipo] || ''} truncate leading-tight`}
                  >
                    {viewMode === 'month' ? (
                      <span>{typeLabels[app.tipo]}</span>
                    ) : (
                      <>{app.patients?.nome || '---'} ({typeLabels[app.tipo]})</>
                    )}
                  </div>
                ))}
                {dayApps.length > (viewMode === 'month' ? 2 : 3) && (
                  <div className="text-[10px] text-muted-foreground text-center">
                    +{dayApps.length - (viewMode === 'month' ? 2 : 3)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

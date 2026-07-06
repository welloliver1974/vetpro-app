'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, parseISO, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { generateRecurringDates } from '@/lib/calendar'

interface RecurrenceConfigProps {
  recorrenteAtivo: boolean
  onRecorrenteAtivoChange: (checked: boolean) => void
  diasSemana: number[]
  onDiasSemanaChange: (dias: number[]) => void
  numOcorrencias: number
  onNumOcorrenciasChange: (num: number) => void
  selectedDate: string
  hora: string
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function RecurrenceConfig({
  recorrenteAtivo,
  onRecorrenteAtivoChange,
  diasSemana,
  onDiasSemanaChange,
  numOcorrencias,
  onNumOcorrenciasChange,
  selectedDate,
  hora,
}: RecurrenceConfigProps) {
  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={recorrenteAtivo}
          onChange={(e) => onRecorrenteAtivoChange(e.target.checked)}
          className="rounded border-border accent-primary"
        />
        <span className="text-sm text-foreground font-medium">Repetir agendamento</span>
      </label>

      {recorrenteAtivo && (
        <div className="space-y-3 pl-6">
          <div>
            <Label className="text-foreground text-xs">Dias da semana</Label>
            <div className="flex gap-1 mt-1.5">
              {dayNames.map((name, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onDiasSemanaChange(
                      diasSemana.includes(idx)
                        ? diasSemana.filter((d) => d !== idx)
                        : [...diasSemana, idx]
                    )
                  }
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    diasSemana.includes(idx)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-foreground text-xs shrink-0">Nº de sessões:</Label>
            <Input
              type="number"
              min={2}
              max={30}
              value={numOcorrencias}
              onChange={(e) =>
                onNumOcorrenciasChange(Math.max(2, Math.min(30, Number(e.target.value))))
              }
              className="w-20 h-8 text-sm"
            />
          </div>

          {diasSemana.length > 0 && (() => {
            const [h, m] = hora.split(':').map(Number)
            const d = setHours(setMinutes(parseISO(selectedDate), m), h)
            const dates = generateRecurringDates(d, diasSemana, numOcorrencias)
            const list = dates.slice(0, 5).map((dt) =>
              format(dt, "dd/MM (EEE)", { locale: ptBR })
            )
            return (
              <p className="text-xs text-muted-foreground">
                Serão criados <strong>{dates.length}</strong> agendamentos:
                {' '}{list.join(', ')}{dates.length > 5 && ` e +${dates.length - 5}`}
              </p>
            )
          })()}
        </div>
      )}
    </div>
  )
}

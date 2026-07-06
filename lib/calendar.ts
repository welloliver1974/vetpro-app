import { parseISO, format, addHours } from 'date-fns'

/**
 * Generate recurring dates from a start date for given days of week and count.
 */
export function generateRecurringDates(start: Date, days: number[], count: number): Date[] {
  const dates: Date[] = []
  const current = new Date(start)
  let maxIter = 365
  while (dates.length < count && maxIter > 0) {
    if (days.includes(current.getDay())) {
      dates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
    maxIter--
  }
  return dates
}

type IcsAppointment = {
  id: string
  data: string
  tipo: string
  patients?: { nome: string; especie: string; endereco: string | null } | null
}

function formatIcsDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss")
}

export function generateIcsEvent(appointment: IcsAppointment): string {
  const startDate = parseISO(appointment.data)
  const endDate = addHours(startDate, 1)

  const tipoLabel =
    appointment.tipo === 'fisio' ? 'Fisioterapia'
    : appointment.tipo === 'externo' ? 'Externo (Domiciliar)'
    : 'Clínico'

  const patientName = appointment.patients?.nome || 'Paciente'
  const especie = appointment.patients?.especie || ''
  const endereco = appointment.tipo === 'externo' && appointment.patients?.endereco
    ? appointment.patients.endereco
    : ''

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VetPro//PT_BR',
    'BEGIN:VEVENT',
    `DTSTART:${formatIcsDate(startDate)}`,
    `DTEND:${formatIcsDate(endDate)}`,
    `SUMMARY:${tipoLabel} - ${patientName}`,
    `DESCRIPTION:Paciente: ${patientName}${especie ? `\\nEspécie: ${especie}` : ''}\\nTipo: ${tipoLabel}`,
    ...(endereco ? [`LOCATION:${endereco}`] : []),
    `UID:${appointment.id}@vetpro.app`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}

export function downloadIcs(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, setHours, setMinutes,
  startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, subDays, isToday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, type Appointment } from '@/hooks/useAppointments'
import { usePatients } from '@/hooks/usePatients'
import { useNotifications } from '@/hooks/useNotifications'
import { useChat } from '@/hooks/useAi'
import { generateIcsEvent, downloadIcs } from '@/lib/calendar'
import { SignaturePad } from '@/components/vet/SignaturePad'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, MapPin, ExternalLink, Loader2, Trash2, CheckCircle2, Filter, Bell, BellOff, CalendarDays, PawPrint, Sparkles, Calendar,
} from 'lucide-react'

const typeColors: Record<string, string> = {
  fisio: 'border-emerald-500/30 bg-emerald-950/30',
  clinico: 'border-blue-500/30 bg-blue-950/30',
  externo: 'border-amber-500/30 bg-amber-950/30',
}

const typeLabels: Record<string, string> = {
  fisio: 'Fisio',
  clinico: 'Clínico',
  externo: 'Externo',
}

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const { data: appointments, isLoading } = useAppointments()
  const { data: patients } = usePatients()
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()
  const deleteAppointment = useDeleteAppointment()
  const notif = useNotifications()

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [form, setForm] = useState<{ paciente_id: string; tipo: 'fisio' | 'clinico' | 'externo'; hora: string; valor: string }>({ paciente_id: '', tipo: 'clinico', hora: '08:00', valor: '' })
  const [notifGranted, setNotifGranted] = useState<'granted' | 'denied' | 'default'>(
    typeof window === 'undefined' ? 'default' : Notification.permission
  )

  // Filtros
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterPaciente, setFilterPaciente] = useState('')

  // Finalizar modal
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishingApp, setFinishingApp] = useState<Appointment | null>(null)
  const [finishValor, setFinishValor] = useState('')
  const [finishPayment, setFinishPayment] = useState('')
  const [assinaturaUrl, setAssinaturaUrl] = useState('')
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState('')
  const [suggestingPrice, setSuggestingPrice] = useState(false)

  // Recorrência
  const [recorrenteAtivo, setRecorrenteAtivo] = useState(false)
  const [diasSemana, setDiasSemana] = useState<number[]>([])
  const [numOcorrencias, setNumOcorrencias] = useState(6)

  const chatAi = useChat()

  type ViewMode = 'week' | 'month' | 'day'
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const monthDays = useMemo(() => {
    const mStart = startOfMonth(currentDate)
    const mEnd = endOfMonth(currentDate)
    return eachDayOfInterval({
      start: startOfWeek(mStart, { weekStartsOn: 0 }),
      end: endOfWeek(mEnd, { weekStartsOn: 0 }),
    })
  }, [currentDate])

  const visibleDays = useMemo(() => {
    if (viewMode === 'month') return monthDays
    if (viewMode === 'day') return [currentDate]
    return weekDays
  }, [viewMode, weekDays, monthDays, currentDate])

  const filteredAppointments = useMemo(() => {
    if (!appointments) return []
    return appointments
      .filter((a) => visibleDays.some((d) => isSameDay(parseISO(a.data), d)))
      .filter((a) => !filterTipo || a.tipo === filterTipo)
      .filter((a) => !filterStatus || a.status === filterStatus)
      .filter((a) => !filterPaciente || a.patients?.nome?.toLowerCase().includes(filterPaciente.toLowerCase()))
  }, [appointments, visibleDays, filterTipo, filterStatus, filterPaciente])

  function openCreateForDate(date: Date) {
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setForm({ paciente_id: '', tipo: 'clinico', hora: '08:00', valor: '' })
    setRecorrenteAtivo(false)
    setDiasSemana([date.getDay()])
    setNumOcorrencias(6)
    setCreateOpen(true)
  }

  function openFinishModal(app: Appointment) {
    setFinishingApp(app)
    setFinishValor(app.valor?.toString() || '')
    setFinishPayment(app.forma_pagamento || '')
    setAssinaturaUrl(app.assinatura_url || '')
    setAssinaturaDataUrl('')
    setFinishOpen(true)
  }

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  function generateRecurringDates(start: Date, days: number[], count: number): Date[] {
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

  const queryClient = useQueryClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const [hours, minutes] = form.hora.split(':').map(Number)
    const baseDate = setHours(setMinutes(parseISO(selectedDate), minutes), hours)
    const patientName = patients?.find((p) => p.id === form.paciente_id)?.nome || 'paciente'

    if (recorrenteAtivo && diasSemana.length > 0) {
      const datesToCreate = generateRecurringDates(baseDate, diasSemana, numOcorrencias)

      const sb = await createClient()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      const rows = datesToCreate.map((date) => ({
        paciente_id: form.paciente_id,
        data: date.toISOString(),
        tipo: form.tipo,
        vet_id: user.id,
        valor: form.valor ? Number(form.valor) : undefined,
      }))

      const { error } = await sb.from('appointments').insert(rows)
      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['appointments'] })

      for (const date of datesToCreate) {
        const reminder = new Date(date.getTime() - 15 * 60 * 1000)
        notif.scheduleReminder(
          'Atendimento em breve!',
          reminder,
          `${patientName} - ${form.tipo === 'fisio' ? 'Fisioterapia' : form.tipo === 'externo' ? 'Externo' : 'Clínico'} às ${format(date, 'HH:mm')}`
        )
      }

      toast.success(`${datesToCreate.length} atendimentos agendados!`)
      setCreateOpen(false)
      return
    }

    await createAppointment.mutateAsync({
      paciente_id: form.paciente_id,
      data: baseDate.toISOString(),
      tipo: form.tipo,
      valor: form.valor ? Number(form.valor) : undefined,
    })

    const reminder = new Date(baseDate.getTime() - 15 * 60 * 1000)
    notif.scheduleReminder(
      'Atendimento em breve!',
      reminder,
      `${patientName} - ${form.tipo === 'fisio' ? 'Fisioterapia' : form.tipo === 'externo' ? 'Externo' : 'Clínico'} às ${form.hora}`
    )

    // Send WhatsApp notification if configured
    const pendingPatient = patients?.find((p) => p.id === form.paciente_id)
    if (pendingPatient?.tutor_contato) {
      const { loadNotifyConfigAsync } = await import('@/lib/notification/config')
      const ncfg = await loadNotifyConfigAsync()
      if (ncfg?.enabled) {
        const { sendAppointmentNotification } = await import('@/lib/notification')
        const sb = await createClient()
        const { data: { user } } = await sb.auth.getUser()
        const { data: profile } = user ? await sb.from('profiles').select('nome').eq('id', user.id).single() : { data: null }
        sendAppointmentNotification({
          config: ncfg,
          appointmentId: '',
          tutorNome: pendingPatient.tutor_nome || '',
          tutorContato: pendingPatient.tutor_contato,
          pacienteNome: pendingPatient.nome,
          especie: pendingPatient.especie || '',
          tipo: form.tipo,
          dataISO: baseDate.toISOString(),
          vetNome: profile?.nome || 'Veterinário',
          vetId: user?.id || '',
          endereco: pendingPatient.endereco,
        }).then((res) => {
          if (!res.success) toast.error(`WhatsApp: ${res.error}`, { duration: 4000 })
        })
      }
    }

    setCreateOpen(false)
  }

  async function handleSuggestPrice() {
    if (!finishingApp) return
    setSuggestingPrice(true)

    try {
      const sameTypeCompleted = (appointments || [])
        .filter((a) => a.tipo === finishingApp.tipo && a.status === 'concluido' && a.valor != null && a.valor > 0)

      let avgPrice = 0
      if (sameTypeCompleted.length > 0) {
        avgPrice = sameTypeCompleted.reduce((sum, a) => sum + Number(a.valor), 0) / sameTypeCompleted.length
      }

      const tipoLabel = finishingApp.tipo === 'fisio' ? 'Fisioterapia' : finishingApp.tipo === 'externo' ? 'Externo (Domiciliar)' : 'Clínico'
      const especie = finishingApp.patients?.especie || 'não informada'
      const pacienteNome = finishingApp.patients?.nome || 'paciente'

      const prompt = `Sugira um preço justo para um atendimento veterinário no Brasil.

Dados do atendimento:
- Tipo: ${tipoLabel}
- Espécie do animal: ${especie}
- Paciente: ${pacienteNome}
${avgPrice > 0 ? `- Preço médio histórico para este tipo: R$ ${avgPrice.toFixed(2)}` : '- Sem histórico de preços para este tipo'}

Responda APENAS com o valor numérico em reais (R$), sem formatação, sem "R$", sem vírgula, sem explicações. Use ponto como separador decimal. Exemplo: 150.00`

      const suggestion = await chatAi.generate(prompt, 'Você é um assistente de precificação para clínicas veterinárias brasileiras. Responda apenas com o número do valor sugerido.')

      const cleaned = suggestion.replace(/[^0-9.,]/g, '').replace(',', '.')
      const price = parseFloat(cleaned)
      if (!isNaN(price) && price > 0) {
        setFinishValor(price.toFixed(2))
        toast.success(`Preço sugerido: R$ ${price.toFixed(2)}`)
      } else {
        toast.error('Não foi possível interpretar o valor sugerido pela IA.')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao sugerir preço'
      toast.error(msg)
    } finally {
      setSuggestingPrice(false)
    }
  }

  async function handleConfirmFinish() {
    if (!finishingApp) return

    let finalAssinaturaUrl = assinaturaUrl

    // Save new signature to storage
    if (assinaturaDataUrl && assinaturaDataUrl.startsWith('data:image')) {
      const blob = await (await fetch(assinaturaDataUrl)).blob()
      const path = `assinaturas/${finishingApp.id}.png`
      const supabase = await createClient()
      await supabase.storage.from('session-media').upload(path, blob, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('session-media').getPublicUrl(path)
      finalAssinaturaUrl = publicUrl
    }

    await updateAppointment.mutateAsync({
      id: finishingApp.id,
      data: {
        status: 'concluido',
        valor: finishValor ? Number(finishValor) : null,
        forma_pagamento: finishPayment || null,
        assinatura_url: finalAssinaturaUrl || null,
      } as Partial<Appointment>,
    })
    setFinishOpen(false)
    setFinishingApp(null)
  }

  async function handleDelete(id: string) {
    if (confirm('Remover este agendamento?')) {
      await deleteAppointment.mutateAsync(id)
    }
  }

  return (
    <div className="p-4 md:p-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Visualização {viewMode === 'week' ? 'semanal' : viewMode === 'month' ? 'mensal' : 'diária'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex gap-1 bg-muted rounded-lg p-1 mr-2">
            {(['week', 'month', 'day'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-card-foreground'
                }`}
              >
                {mode === 'week' ? 'Sem' : mode === 'month' ? 'Mês' : 'Dia'}
              </button>
            ))}
          </div>
          <Button variant="outline" size="icon-sm" onClick={() => {
            const fn = viewMode === 'month' ? subMonths : viewMode === 'day' ? subDays : subWeeks
            const amount = viewMode === 'day' ? 1 : 1
            setCurrentDate(fn(currentDate, amount))
          }}
            className="border-border text-muted-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-card-foreground min-w-[140px] text-center">
            {viewMode === 'week'
              ? `${format(weekStart, "d 'de' MMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "d 'de' MMM", { locale: ptBR })}`
              : viewMode === 'month'
              ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
              : format(currentDate, "d 'de' MMM", { locale: ptBR })
            }
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => {
            const fn = viewMode === 'month' ? addMonths : viewMode === 'day' ? addDays : addWeeks
            const amount = viewMode === 'day' ? 1 : 1
            setCurrentDate(fn(currentDate, amount))
          }}
            className="border-border text-muted-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}
            className="border-border text-muted-foreground ml-2">
            Hoje
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              const ok = await notif.requestPermission()
              setNotifGranted(ok ? 'granted' : 'denied')
            }}
            className={`ml-1 ${notifGranted === 'granted' ? 'text-emerald-400' : 'text-muted-foreground'}`}
            title={notifGranted === 'granted' ? 'Notificações ativas' : 'Ativar notificações'}
          >
            {notifGranted === 'granted' ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid gap-2 mb-4 sm:flex sm:flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" /> Filtros:
        </div>
        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5"
        >
          <option value="">Todos os tipos</option>
          <option value="fisio">Fisioterapia</option>
          <option value="clinico">Clínico</option>
          <option value="externo">Externo</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5"
        >
          <option value="">Todos os status</option>
          <option value="agendado">Agendado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluido">Concluído</option>
        </select>
        <input
          type="text"
          value={filterPaciente}
          onChange={(e) => setFilterPaciente(e.target.value)}
          placeholder="Buscar paciente..."
          className="bg-muted border border-border text-foreground text-xs rounded-lg px-2 py-1.5 w-full sm:w-40 placeholder:text-muted-foreground"
        />
        {(filterTipo || filterStatus || filterPaciente) && (
          <button
            onClick={() => { setFilterTipo(''); setFilterStatus(''); setFilterPaciente('') }}
            className="text-xs text-primary hover:text-primary/80 px-2"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Calendar Grid */}
      {viewMode === 'day' ? (
        <div className="space-y-3 mb-6">
          {filteredAppointments.length === 0 ? (
            <Card className="bg-card border-border cursor-pointer hover:border-border transition-colors" onClick={() => openCreateForDate(currentDate)}>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">Nenhum atendimento neste dia</p>
                <Button size="sm" variant="outline" className="border-border text-foreground gap-2">
                  <PawPrint className="h-4 w-4" /> Novo Atendimento
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAppointments
              .sort((a, b) => a.data.localeCompare(b.data))
              .map((app) => (
                <Card key={app.id} className={`bg-card border-l-4 ${app.status === 'concluido' ? 'border-l-border opacity-60' : app.tipo === 'fisio' ? 'border-l-emerald-500' : app.tipo === 'externo' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                  <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="text-lg font-bold text-primary min-w-[60px] shrink-0">
                        {format(parseISO(app.data), 'HH:mm')}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-card-foreground truncate">{app.patients?.nome || '---'}</span>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${app.tipo === 'fisio' ? 'border-emerald-800 text-emerald-400' : app.tipo === 'externo' ? 'border-amber-800 text-amber-400' : 'border-blue-800 text-blue-400'}`}>
                            {typeLabels[app.tipo]}
                          </Badge>
                        </div>
                        {app.tipo === 'externo' && app.patients?.endereco && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 overflow-hidden">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(app.patients.endereco)}`} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80 flex items-center gap-0.5 truncate">
                              {app.patients.endereco} <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="ghost" size="icon-xs" onClick={() => { const ics = generateIcsEvent(app); downloadIcs(ics, `vetpro-${(app.patients?.nome || 'paciente').replace(/\s+/g, '-').toLowerCase()}.ics`) }} className="text-muted-foreground hover:text-primary shrink-0" title="Adicionar ao calendário">
                        <Calendar className="h-3.5 w-3.5" />
                      </Button>
                      {app.status === 'agendado' && (
                        <>
                          <Button size="xs" onClick={() => openFinishModal(app)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Finalizar
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => handleDelete(app.id)} className="text-muted-foreground hover:text-red-400 shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2 mb-6 ${viewMode === 'month' ? 'auto-rows-fr' : ''}`}>
          {visibleDays.map((day) => {
            const today = isToday(day)
            const dayApps = appointments?.filter((a) => isSameDay(parseISO(a.data), day)) ?? []
            const isCurrentMonth = viewMode === 'month' ? isSameMonth(day, currentDate) : true
            return (
              <Card
                key={day.toISOString()}
                className={`bg-card border-border min-h-[90px] cursor-pointer hover:border-border transition-colors ${today ? 'ring-1 ring-primary/50' : ''} ${!isCurrentMonth ? 'opacity-40' : ''}`}
                onClick={() => openCreateForDate(day)}
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
      )}

      {/* Lista de Atendimentos */}
      {filteredAppointments.length > 0 && viewMode !== 'day' ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-card-foreground">
            Atendimentos {viewMode === 'week' ? 'da Semana' : 'do Mês'}
          </h2>
          {filteredAppointments.map((app) => (
            <Card key={app.id} className={`bg-card border-l-4 ${app.status === 'concluido' ? 'border-l-border opacity-60' : app.tipo === 'fisio' ? 'border-l-emerald-500' : app.tipo === 'externo' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                     <div className="flex items-center gap-4 min-w-0">
                       <div className="text-lg font-bold text-primary min-w-[60px] shrink-0">
                         {format(parseISO(app.data), 'HH:mm')}
                       </div>
                       <div className="min-w-0 overflow-hidden">
                         <div className="flex items-center gap-2">
                           <span className="font-semibold text-card-foreground truncate">{app.patients?.nome || '---'}</span>
                           <Badge variant="outline" className={`text-[10px] shrink-0 ${app.tipo === 'fisio' ? 'border-emerald-800 text-emerald-400' : app.tipo === 'externo' ? 'border-amber-800 text-amber-400' : 'border-blue-800 text-blue-400'}`}>
                             {typeLabels[app.tipo]}
                           </Badge>
                         </div>
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
                               ) : 'Endereço externo'}
                           </div>
                         )}
                         {app.valor && (
                           <div className="text-xs text-muted-foreground mt-1 truncate">
                             R$ {Number(app.valor).toFixed(2)}
                             {app.forma_pagamento && ` • ${app.forma_pagamento === 'pix' ? 'Pix' : app.forma_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro'}`}
                           </div>
                         )}
                       </div>
                     </div>

                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
                        <Button variant="ghost" size="icon-xs"
                          onClick={() => {
                            const ics = generateIcsEvent(app)
                            const patientName = app.patients?.nome || 'paciente'
                            downloadIcs(ics, `vetpro-${patientName.replace(/\s+/g, '-').toLowerCase()}.ics`)
                          }}
                          className="text-muted-foreground hover:text-primary shrink-0"
                          title="Adicionar ao calendário">
                          <Calendar className="h-3.5 w-3.5" />
                        </Button>
                        {app.status === 'agendado' && (
                         <>
                           <Button size="xs" onClick={() => openFinishModal(app)}
                             className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0">
                             <CheckCircle2 className="h-3 w-3" /> Finalizar
                           </Button>
                           <Button variant="ghost" size="icon-xs"
                             onClick={() => handleDelete(app.id)}
                             className="text-muted-foreground hover:text-red-400 shrink-0">
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         </>
                       )}
                       {app.status === 'concluido' && (
                         <>
                           <Badge className="bg-muted text-muted-foreground border-border shrink-0">Concluído</Badge>
                           <Button variant="ghost" size="icon-xs"
                             onClick={() => handleDelete(app.id)}
                             className="text-muted-foreground hover:text-red-400 shrink-0">
                             <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         </>
                       )}
                     </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading && viewMode !== 'day' && (
        <EmptyState
          icon={CalendarDays}
          title={viewMode === 'week' ? 'Nenhum atendimento nesta semana' : 'Nenhum atendimento neste mês'}
          description="Crie um novo atendimento tocando em um dia do calendário acima."
          action={(
            <Button onClick={() => openCreateForDate(new Date())} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <PawPrint className="h-4 w-4" /> Novo Atendimento
            </Button>
          )}
        />
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Paciente</Label>
              <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  {patients?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Data</Label>
                <Input type="date" value={selectedDate} disabled className="bg-muted border-border text-card-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Horário</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="bg-muted border-border text-card-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as 'fisio' | 'clinico' | 'externo' })}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  <SelectItem value="clinico">Clínico</SelectItem>
                  <SelectItem value="fisio">Fisioterapia</SelectItem>
                  <SelectItem value="externo">Externo (Domiciliar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="bg-muted border-border text-card-foreground" />
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recorrenteAtivo}
                  onChange={(e) => setRecorrenteAtivo(e.target.checked)}
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
                          onClick={() => setDiasSemana((prev) =>
                            prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
                          )}
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
                      onChange={(e) => setNumOcorrencias(Math.max(2, Math.min(30, Number(e.target.value))))}
                      className="w-20 h-8 text-sm"
                    />
                  </div>

                  {diasSemana.length > 0 && (() => {
                    const [h, m] = form.hora.split(':').map(Number)
                    const d = setHours(setMinutes(parseISO(selectedDate), m), h)
                    const dates = generateRecurringDates(d, diasSemana, numOcorrencias)
                    const list = dates.slice(0, 5).map((dt) => format(dt, "dd/MM (EEE)", { locale: ptBR }))
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

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-border text-foreground">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={createAppointment.isPending}
                className="bg-primary hover:bg-primary/90 text-white">
                {createAppointment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Agendar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Finalizar Dialog */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento</DialogTitle>
          </DialogHeader>
          {finishingApp && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paciente</span>
                  <span className="text-card-foreground font-medium">{finishingApp.patients?.nome || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <Badge variant="outline" className={
                    finishingApp.tipo === 'fisio' ? 'border-emerald-800 text-emerald-400' :
                    finishingApp.tipo === 'externo' ? 'border-amber-800 text-amber-400' :
                    'border-blue-800 text-blue-400'
                  }>{typeLabels[finishingApp.tipo]}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Horário</span>
                  <span className="text-card-foreground">{format(parseISO(finishingApp.data), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Valor Cobrado (R$)</Label>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" value={finishValor}
                    onChange={(e) => setFinishValor(e.target.value)}
                    placeholder="0,00"
                    className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground text-lg font-bold flex-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSuggestPrice}
                    disabled={suggestingPrice}
                    className="border-border text-muted-foreground hover:text-primary shrink-0 gap-1"
                    title="Sugerir preço com IA"
                  >
                    {suggestingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Sugerir
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Forma de Pagamento</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { value: 'pix', label: 'Pix', icon: '💳' },
                    { value: 'cartao', label: 'Cartão', icon: '💳' },
                    { value: 'dinheiro', label: 'Dinheiro', icon: '💰' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFinishPayment(finishPayment === option.value ? '' : option.value)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        finishPayment === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted text-muted-foreground hover:border-border'
                      }`}
                    >
                      <div className="text-lg mb-1">{option.icon}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Assinatura */}
              <SignaturePad
                existingUrl={assinaturaUrl}
                onSave={(dataUrl) => setAssinaturaDataUrl(dataUrl)}
              />

              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="border-border text-foreground">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button onClick={handleConfirmFinish} disabled={updateAppointment.isPending}
                className="bg-primary hover:bg-primary/90 text-white gap-2">
                  {updateAppointment.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <CheckCircle2 className="h-4 w-4" /> Confirmar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

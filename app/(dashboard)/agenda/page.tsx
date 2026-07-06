'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, setHours, setMinutes,
  startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, addMonths, subMonths, subDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, type Appointment } from '@/hooks/useAppointments'
import { usePatients } from '@/hooks/usePatients'
import { useNotifications } from '@/hooks/useNotifications'
import { useChat } from '@/hooks/useAi'
import { generateRecurringDates } from '@/lib/calendar'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/EmptyState'
import { toast } from 'sonner'
import {
  ChevronLeft, ChevronRight, Loader2, Bell, BellOff, CalendarDays, PawPrint,
} from 'lucide-react'
import { AgendaFilters } from '@/components/agenda/AgendaFilters'
import { CreateAppointmentDialog } from '@/components/agenda/CreateAppointmentDialog'
import { CalendarGrid } from '@/components/agenda/CalendarGrid'
import { FinishAppointmentDialog } from '@/components/agenda/FinishAppointmentDialog'
import { AppointmentCard } from '@/components/agenda/AppointmentCard'

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

      <AgendaFilters
        filterTipo={filterTipo}
        onFilterTipoChange={setFilterTipo}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterPaciente={filterPaciente}
        onFilterPacienteChange={setFilterPaciente}
        onClear={() => { setFilterTipo(''); setFilterStatus(''); setFilterPaciente('') }}
      />

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
                <AppointmentCard
                  key={app.id}
                  app={app}
                  onFinish={openFinishModal}
                  onDelete={handleDelete}
                />
              ))
          )}
        </div>
      ) : (
        <CalendarGrid
          visibleDays={visibleDays}
          currentDate={currentDate}
          viewMode={viewMode}
          appointments={appointments}
          typeColors={typeColors}
          typeLabels={typeLabels}
          onDayClick={openCreateForDate}
        />
      )}

      {/* Lista de Atendimentos */}
      {filteredAppointments.length > 0 && viewMode !== 'day' ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-card-foreground">
            Atendimentos {viewMode === 'week' ? 'da Semana' : 'do Mês'}
          </h2>
          {filteredAppointments.map((app) => (
            <AppointmentCard
              key={app.id}
              app={app}
              onFinish={openFinishModal}
              onDelete={handleDelete}
              showDetails
            />
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

      <CreateAppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultDate={selectedDate}
        patients={patients}
        isPending={createAppointment.isPending}
        onSubmit={handleCreate}
        form={form}
        onFormChange={setForm}
        recorrenteAtivo={recorrenteAtivo}
        onRecorrenteAtivoChange={setRecorrenteAtivo}
        diasSemana={diasSemana}
        onDiasSemanaChange={setDiasSemana}
        numOcorrencias={numOcorrencias}
        onNumOcorrenciasChange={setNumOcorrencias}
      />

      <FinishAppointmentDialog
        finishOpen={finishOpen}
        onFinishOpenChange={setFinishOpen}
        finishingApp={finishingApp}
        finishValor={finishValor}
        onFinishValorChange={setFinishValor}
        finishPayment={finishPayment}
        onFinishPaymentChange={setFinishPayment}
        existingAssinaturaUrl={assinaturaUrl}
        onAssinaturaSave={(dataUrl) => setAssinaturaDataUrl(dataUrl)}
        suggestingPrice={suggestingPrice}
        onSuggestPrice={handleSuggestPrice}
        onConfirmFinish={handleConfirmFinish}
        isPending={updateAppointment.isPending}
      />
    </div>
  )
}

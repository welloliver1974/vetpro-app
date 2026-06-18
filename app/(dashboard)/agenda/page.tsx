'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, setHours, setMinutes,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAppointments, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, type Appointment } from '@/hooks/useAppointments'
import { usePatients } from '@/hooks/usePatients'
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
import { Toaster } from 'sonner'
import {
  ChevronLeft, ChevronRight, MapPin, Loader2, Trash2, CheckCircle2,
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

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [form, setForm] = useState<{ paciente_id: string; tipo: 'fisio' | 'clinico' | 'externo'; hora: string; valor: string }>({ paciente_id: '', tipo: 'clinico', hora: '08:00', valor: '' })

  // Finalizar modal
  const [finishOpen, setFinishOpen] = useState(false)
  const [finishingApp, setFinishingApp] = useState<Appointment | null>(null)
  const [finishValor, setFinishValor] = useState('')
  const [finishPayment, setFinishPayment] = useState('')

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const weekAppointments = useMemo(() => {
    if (!appointments) return []
    return appointments.filter((a) =>
      weekDays.some((d) => isSameDay(parseISO(a.data), d))
    )
  }, [appointments, weekDays])

  function openCreateForDate(date: Date) {
    setSelectedDate(format(date, 'yyyy-MM-dd'))
    setForm({ paciente_id: '', tipo: 'clinico', hora: '08:00', valor: '' })
    setCreateOpen(true)
  }

  function openFinishModal(app: Appointment) {
    setFinishingApp(app)
    setFinishValor(app.valor?.toString() || '')
    setFinishPayment(app.forma_pagamento || '')
    setFinishOpen(true)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const [hours, minutes] = form.hora.split(':').map(Number)
    const date = setHours(setMinutes(parseISO(selectedDate), minutes), hours)
    await createAppointment.mutateAsync({
      paciente_id: form.paciente_id,
      data: date.toISOString(),
      tipo: form.tipo,
      valor: form.valor ? Number(form.valor) : undefined,
    })
    setCreateOpen(false)
  }

  async function handleConfirmFinish() {
    if (!finishingApp) return
    await updateAppointment.mutateAsync({
      id: finishingApp.id,
      data: {
        status: 'concluido',
        valor: finishValor ? Number(finishValor) : null,
        forma_pagamento: finishPayment || null,
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
      <Toaster richColors position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-sm text-slate-400">Visualização semanal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
            className="border-slate-700 text-slate-400">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-slate-200 min-w-[140px] text-center">
            {format(weekStart, "d 'de' MMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "d 'de' MMM", { locale: ptBR })}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="border-slate-700 text-slate-400">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}
            className="border-slate-700 text-slate-400 ml-2">
            Hoje
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date())
          const dayApps = appointments?.filter((a) => isSameDay(parseISO(a.data), day)) ?? []
          return (
            <Card
              key={day.toISOString()}
              className={`bg-slate-900 border-slate-800 min-h-[120px] cursor-pointer hover:border-slate-600 transition-colors ${isToday ? 'ring-1 ring-indigo-500/50' : ''}`}
              onClick={() => openCreateForDate(day)}
            >
              <CardContent className="p-2">
                <div className="text-center mb-2">
                  <div className="text-[10px] uppercase text-slate-500">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-bold ${isToday ? 'text-indigo-400' : 'text-slate-200'}`}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-1">
                  {dayApps.slice(0, 3).map((app) => (
                    <div
                      key={app.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColors[app.tipo] || ''} truncate`}
                    >
                      {app.patients?.nome || '---'} ({typeLabels[app.tipo]})
                    </div>
                  ))}
                  {dayApps.length > 3 && (
                    <div className="text-[10px] text-slate-500 text-center">
                      +{dayApps.length - 3} mais
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Lista da Semana */}
      {weekAppointments.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-200">Atendimentos da Semana</h2>
          {weekAppointments.map((app) => (
            <Card key={app.id} className={`bg-slate-900 border-l-4 ${app.status === 'concluido' ? 'border-l-slate-700 opacity-60' : app.tipo === 'fisio' ? 'border-l-emerald-500' : app.tipo === 'externo' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-indigo-400 min-w-[60px]">
                    {format(parseISO(app.data), 'HH:mm')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{app.patients?.nome || '---'}</span>
                      <Badge variant="outline" className={`text-[10px] ${app.tipo === 'fisio' ? 'border-emerald-800 text-emerald-400' : app.tipo === 'externo' ? 'border-amber-800 text-amber-400' : 'border-blue-800 text-blue-400'}`}>
                        {typeLabels[app.tipo]}
                      </Badge>
                    </div>
                    {app.tipo === 'externo' && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <MapPin className="h-3 w-3" /> Endereço externo
                      </div>
                    )}
                    {app.valor && (
                      <div className="text-xs text-slate-500 mt-1">
                        R$ {Number(app.valor).toFixed(2)}
                        {app.forma_pagamento && ` • ${app.forma_pagamento === 'pix' ? 'Pix' : app.forma_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro'}`}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {app.status === 'agendado' && (
                    <>
                      <Button size="xs" onClick={() => openFinishModal(app)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Finalizar
                      </Button>
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => handleDelete(app.id)}
                        className="text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                  {app.status === 'concluido' && (
                    <>
                      <Badge className="bg-slate-800 text-slate-400 border-slate-700">Concluído</Badge>
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => handleDelete(app.id)}
                        className="text-slate-500 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !isLoading && (
        <div className="text-center py-12 text-slate-500">
          Nenhum atendimento nesta semana
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Novo Atendimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Paciente</Label>
              <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {patients?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Data</Label>
                <Input type="date" value={selectedDate} disabled className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Horário</Label>
                <Input type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-slate-100" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as 'fisio' | 'clinico' | 'externo' })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  <SelectItem value="clinico">Clínico</SelectItem>
                  <SelectItem value="fisio">Fisioterapia</SelectItem>
                  <SelectItem value="externo">Externo (Domiciliar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Valor (R$)</Label>
              <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={createAppointment.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {createAppointment.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Agendar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Finalizar Dialog */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>Finalizar Atendimento</DialogTitle>
          </DialogHeader>
          {finishingApp && (
            <div className="space-y-4">
              {/* Resumo */}
              <div className="bg-slate-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Paciente</span>
                  <span className="text-slate-200 font-medium">{finishingApp.patients?.nome || '---'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tipo</span>
                  <Badge variant="outline" className={
                    finishingApp.tipo === 'fisio' ? 'border-emerald-800 text-emerald-400' :
                    finishingApp.tipo === 'externo' ? 'border-amber-800 text-amber-400' :
                    'border-blue-800 text-blue-400'
                  }>{typeLabels[finishingApp.tipo]}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Horário</span>
                  <span className="text-slate-200">{format(parseISO(finishingApp.data), "dd/MM/yyyy 'às' HH:mm")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Valor Cobrado (R$)</Label>
                <Input type="number" step="0.01" value={finishValor}
                  onChange={(e) => setFinishValor(e.target.value)}
                  placeholder="0,00"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 text-lg font-bold" />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Forma de Pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
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
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className="text-lg mb-1">{option.icon}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="border-slate-700 text-slate-300">
                    Cancelar
                  </Button>
                </DialogClose>
                <Button onClick={handleConfirmFinish} disabled={updateAppointment.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
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

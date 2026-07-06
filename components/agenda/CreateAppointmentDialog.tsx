'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { RecurrenceConfig } from '@/components/agenda/RecurrenceConfig'
import { Loader2 } from 'lucide-react'

export type CreateAppointmentForm = {
  paciente_id: string
  tipo: 'fisio' | 'clinico' | 'externo'
  hora: string
  valor: string
}

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate: string
  patients: Array<{ id: string; nome: string }> | undefined
  isPending: boolean
  onSubmit: (e: React.FormEvent) => Promise<void>
  form: CreateAppointmentForm
  onFormChange: (form: CreateAppointmentForm) => void
  recorrenteAtivo: boolean
  onRecorrenteAtivoChange: (checked: boolean) => void
  diasSemana: number[]
  onDiasSemanaChange: (dias: number[]) => void
  numOcorrencias: number
  onNumOcorrenciasChange: (num: number) => void
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultDate,
  patients,
  isPending,
  onSubmit,
  form,
  onFormChange,
  recorrenteAtivo,
  onRecorrenteAtivoChange,
  diasSemana,
  onDiasSemanaChange,
  numOcorrencias,
  onNumOcorrenciasChange,
}: CreateAppointmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle>Novo Atendimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Paciente</Label>
            <Select
              value={form.paciente_id}
              onValueChange={(v) => onFormChange({ ...form, paciente_id: v })}
            >
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
              <Input
                type="date"
                value={defaultDate}
                disabled
                className="bg-muted border-border text-card-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Horário</Label>
              <Input
                type="time"
                value={form.hora}
                onChange={(e) => onFormChange({ ...form, hora: e.target.value })}
                className="bg-muted border-border text-card-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Tipo</Label>
            <Select
              value={form.tipo}
              onValueChange={(v) =>
                onFormChange({ ...form, tipo: v as 'fisio' | 'clinico' | 'externo' })
              }
            >
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
            <Input
              type="number"
              step="0.01"
              value={form.valor}
              onChange={(e) => onFormChange({ ...form, valor: e.target.value })}
              className="bg-muted border-border text-card-foreground"
            />
          </div>

          <RecurrenceConfig
            recorrenteAtivo={recorrenteAtivo}
            onRecorrenteAtivoChange={onRecorrenteAtivoChange}
            diasSemana={diasSemana}
            onDiasSemanaChange={onDiasSemanaChange}
            numOcorrencias={numOcorrencias}
            onNumOcorrenciasChange={onNumOcorrenciasChange}
            selectedDate={defaultDate}
            hora={form.hora}
          />

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-border text-foreground">
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Agendar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { format, parseISO } from 'date-fns'
import { Loader2, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import { SignaturePad } from '@/components/vet/SignaturePad'
import type { Appointment } from '@/hooks/useAppointments'

interface FinishAppointmentDialogProps {
  finishOpen: boolean
  onFinishOpenChange: (open: boolean) => void
  finishingApp: Appointment | null
  finishValor: string
  onFinishValorChange: (valor: string) => void
  finishPayment: string
  onFinishPaymentChange: (payment: string) => void
  existingAssinaturaUrl: string
  onAssinaturaSave: (dataUrl: string) => void
  suggestingPrice: boolean
  onSuggestPrice: () => void
  onConfirmFinish: () => void
  isPending: boolean
}

const typeLabels: Record<string, string> = {
  fisio: 'Fisio',
  clinico: 'Clínico',
  externo: 'Externo',
}

const paymentOptions = [
  { value: 'pix', label: 'Pix', icon: '💳' },
  { value: 'cartao', label: 'Cartão', icon: '💳' },
  { value: 'dinheiro', label: 'Dinheiro', icon: '💰' },
]

export function FinishAppointmentDialog({
  finishOpen,
  onFinishOpenChange,
  finishingApp,
  finishValor,
  onFinishValorChange,
  finishPayment,
  onFinishPaymentChange,
  existingAssinaturaUrl,
  onAssinaturaSave,
  suggestingPrice,
  onSuggestPrice,
  onConfirmFinish,
  isPending,
}: FinishAppointmentDialogProps) {
  return (
    <Dialog open={finishOpen} onOpenChange={onFinishOpenChange}>
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
                <span className="text-card-foreground font-medium">
                  {finishingApp.patients?.nome || '---'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipo</span>
                <Badge
                  variant="outline"
                  className={
                    finishingApp.tipo === 'fisio'
                      ? 'border-emerald-800 text-emerald-400'
                      : finishingApp.tipo === 'externo'
                      ? 'border-amber-800 text-amber-400'
                      : 'border-blue-800 text-blue-400'
                  }
                >
                  {typeLabels[finishingApp.tipo] || finishingApp.tipo}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horário</span>
                <span className="text-card-foreground">
                  {format(parseISO(finishingApp.data), "dd/MM/yyyy 'às' HH:mm")}
                </span>
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label className="text-foreground">Valor Cobrado (R$)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={finishValor}
                  onChange={(e) => onFinishValorChange(e.target.value)}
                  placeholder="0,00"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground text-lg font-bold flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSuggestPrice}
                  disabled={suggestingPrice}
                  className="border-border text-muted-foreground hover:text-primary shrink-0 gap-1"
                  title="Sugerir preço com IA"
                >
                  {suggestingPrice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Sugerir
                </Button>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label className="text-foreground">Forma de Pagamento</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {paymentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onFinishPaymentChange(
                        finishPayment === option.value ? '' : option.value
                      )
                    }
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
              existingUrl={existingAssinaturaUrl}
              onSave={onAssinaturaSave}
            />

            {/* Ações */}
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="border-border text-foreground"
                >
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                onClick={onConfirmFinish}
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-white gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4" /> Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

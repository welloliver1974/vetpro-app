'use client'

import { useState } from 'react'
import { usePrescriptions, useCreatePrescription, useUpdatePrescription, useDeletePrescription, type Prescription, type PrescriptionItem, type PrescriptionInput } from '@/hooks/usePrescriptions'
import { usePatients } from '@/hooks/usePatients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, FileText, Printer } from 'lucide-react'
import { prescriptionSchema } from '@/lib/validations'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EmptyState } from '@/components/EmptyState'

const viaOptions = ['oral', 'tópico', 'injetável', 'subcutânea', 'intramuscular', 'intravenosa', 'oftálmica', 'otológica']

const emptyItem = (): PrescriptionItem => ({
  medicamento: '', dosagem: '', frequencia: '', duracao: '', via: '', observacoes: '',
})

export default function ReceituarioPage() {
  const { data: prescriptions, isLoading } = usePrescriptions()
  const createPrescription = useCreatePrescription()
  const updatePrescription = useUpdatePrescription()
  const deletePrescription = useDeletePrescription()
  const { data: patients } = usePatients()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Prescription | null>(null)
  const [form, setForm] = useState<PrescriptionInput>({ patient_id: '', items: [emptyItem()], observacoes: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [printPrescription, setPrintPrescription] = useState<Prescription | null>(null)

  function openCreate() {
    setEditing(null)
    setForm({ patient_id: '', items: [emptyItem()], observacoes: '' })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(p: Prescription) {
    setEditing(p)
    setForm({
      patient_id: p.patient_id,
      items: p.items.length > 0 ? p.items : [emptyItem()],
      observacoes: p.observacoes || '',
    })
    setErrors({})
    setDialogOpen(true)
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, emptyItem()] })
  }

  function removeItem(idx: number) {
    const items = form.items.filter((_, i) => i !== idx)
    setForm({ ...form, items: items.length > 0 ? items : [emptyItem()] })
  }

  function updateItem(idx: number, field: keyof PrescriptionItem, value: string) {
    const items = form.items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    )
    setForm({ ...form, items })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = prescriptionSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      if (!fieldErrors.patient_id && form.items.length === 0) {
        fieldErrors.items = 'Adicione pelo menos um medicamento'
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    if (editing) {
      await updatePrescription.mutateAsync({ id: editing.id, data: result.data })
    } else {
      await createPrescription.mutateAsync(result.data as PrescriptionInput)
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string) {
    if (confirm('Remover esta prescrição?')) {
      await deletePrescription.mutateAsync(id)
    }
  }

  const isPending = createPrescription.isPending || updatePrescription.isPending

  function handlePrint(p: Prescription) {
    setPrintPrescription(p)
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const printPatient = printPrescription
    ? patients?.find((pt) => pt.id === printPrescription.patient_id)
    : null

  return (
    <div className="p-4 md:p-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receituário</h1>
          <p className="text-sm text-muted-foreground">Prescrições e medicamentos para seus pacientes</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Nova Prescrição
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : prescriptions?.length ? (
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground">Paciente</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Medicamentos</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((p) => (
                <TableRow key={p.id} className="border-border hover:bg-muted/50">
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {p.patients?.nome || '---'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {p.items.length} medicamento(s)
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => handlePrint(p)}
                        className="text-muted-foreground hover:text-amber-400"
                        title="Imprimir">
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => openEdit(p)}
                        className="text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => handleDelete(p.id)}
                        className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={FileText}
                title="Nenhuma prescrição cadastrada"
                description="Crie prescrições e receitas para seus pacientes."
                action={
                  <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Nova Prescrição
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Prescrição' : 'Nova Prescrição'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Paciente *</Label>
              <Select value={form.patient_id} onValueChange={(v) => { setForm({ ...form, patient_id: v }); setErrors({ ...errors, patient_id: '' }) }}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue placeholder="Selecione o paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients?.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id}>
                      {pt.nome} {pt.especie ? `(${pt.especie})` : ''} - Tutor: {pt.tutor_nome || '---'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.patient_id && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.patient_id}</p>}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">Medicamentos *</Label>
                <Button type="button" variant="outline" size="xs" onClick={addItem}
                  className="border-border text-muted-foreground gap-1">
                  <Plus className="h-3 w-3" /> Adicionar
                </Button>
              </div>
              {errors.items && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.items}</p>}
              {form.items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Medicamento #{idx + 1}</span>
                    {form.items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon-xs"
                        onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-red-400">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Input value={item.medicamento} onChange={(e) => updateItem(idx, 'medicamento', e.target.value)}
                      placeholder="Nome do medicamento *"
                      className="bg-card border-border text-card-foreground placeholder:text-muted-foreground" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Input value={item.dosagem} onChange={(e) => updateItem(idx, 'dosagem', e.target.value)}
                      placeholder="Dosagem"
                      className="bg-card border-border text-card-foreground placeholder:text-muted-foreground" />
                    <Input value={item.frequencia} onChange={(e) => updateItem(idx, 'frequencia', e.target.value)}
                      placeholder="Frequência"
                      className="bg-card border-border text-card-foreground placeholder:text-muted-foreground" />
                    <Input value={item.duracao} onChange={(e) => updateItem(idx, 'duracao', e.target.value)}
                      placeholder="Duração"
                      className="bg-card border-border text-card-foreground placeholder:text-muted-foreground" />
                    <Select value={item.via} onValueChange={(v) => updateItem(idx, 'via', v)}>
                      <SelectTrigger className="bg-card border-border text-card-foreground">
                        <SelectValue placeholder="Via" />
                      </SelectTrigger>
                      <SelectContent>
                        {viaOptions.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input value={item.observacoes} onChange={(e) => updateItem(idx, 'observacoes', e.target.value)}
                    placeholder="Observações (opcional)"
                    className="bg-card border-border text-card-foreground placeholder:text-muted-foreground" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Observações da Prescrição</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Instruções gerais, orientações ao tutor..."
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground min-h-[80px]" />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-border text-foreground">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Print View */}
      {printPrescription && (
        <div className="only-print" onTransitionEnd={() => setPrintPrescription(null)}>
          <div className="max-w-[210mm] mx-auto p-8 bg-white text-black">
            <div className="text-center mb-8">
              <h1 className="text-xl font-bold">RECEITUÁRIO VETERINÁRIO</h1>
              <p className="text-sm text-gray-600">VetPro Clínica Veterinária</p>
            </div>

            <div className="mb-6 text-sm">
              <p><strong>Paciente:</strong> {printPatient?.nome || '---'} ({printPatient?.especie || ''} {printPatient?.raca || ''})</p>
              <p><strong>Tutor:</strong> {printPatient?.tutor_nome || '---'} {printPatient?.tutor_contato ? `| Contato: ${printPatient?.tutor_contato}` : ''}</p>
              <p><strong>Data:</strong> {format(parseISO(printPrescription.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            </div>

            <hr className="border-gray-300 mb-6" />

            <table className="w-full text-sm border-collapse mb-6">
              <thead>
                <tr className="border-b border-gray-400">
                  <th className="text-left py-2 px-1 font-semibold">Medicamento</th>
                  <th className="text-left py-2 px-1 font-semibold">Dosagem</th>
                  <th className="text-left py-2 px-1 font-semibold">Frequência</th>
                  <th className="text-left py-2 px-1 font-semibold">Duração</th>
                  <th className="text-left py-2 px-1 font-semibold">Via</th>
                </tr>
              </thead>
              <tbody>
                {printPrescription.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-1 font-medium">{item.medicamento}</td>
                    <td className="py-2 px-1">{item.dosagem || '-'}</td>
                    <td className="py-2 px-1">{item.frequencia || '-'}</td>
                    <td className="py-2 px-1">{item.duracao || '-'}</td>
                    <td className="py-2 px-1">{item.via || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {printPrescription.items.some((i) => i.observacoes) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-1">Observações dos Medicamentos:</h3>
                {printPrescription.items.filter((i) => i.observacoes).map((item, idx) => (
                  <p key={idx} className="text-sm text-gray-700 mb-1">
                    <strong>{item.medicamento}:</strong> {item.observacoes}
                  </p>
                ))}
              </div>
            )}

            {printPrescription.observacoes && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold mb-1">Orientações ao Tutor:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{printPrescription.observacoes}</p>
              </div>
            )}

            <hr className="border-gray-300 mb-8" />

            <div className="text-center mt-12">
              <div className="border-t border-gray-400 inline-block pt-1 px-12">
                <p className="text-sm font-medium">Assinatura do Médico Veterinário</p>
                <p className="text-xs text-gray-500">Carimbo e assinatura</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

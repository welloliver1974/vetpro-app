'use client'

import { useState } from 'react'
import { useEquipments, useCreateEquipment, useUpdateEquipment, useDeleteEquipment, type Equipment, type EquipmentInput } from '@/hooks/useEquipments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, Wrench, CalendarDays, AlertCircle } from 'lucide-react'
import { equipmentSchema } from '@/lib/validations'
import { format, parseISO } from 'date-fns'
import { EmptyState } from '@/components/EmptyState'

export default function EquipmentsPage() {
  const { data: equipments, isLoading } = useEquipments()
  const createEquipment = useCreateEquipment()
  const updateEquipment = useUpdateEquipment()
  const deleteEquipment = useDeleteEquipment()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState<EquipmentInput>({ nome: '', modelo: '', ultima_manutencao: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', modelo: '', ultima_manutencao: '' })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(eq: Equipment) {
    setEditing(eq)
    setForm({
      nome: eq.nome,
      modelo: eq.modelo || '',
      ultima_manutencao: eq.ultima_manutencao || '',
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = equipmentSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    const payload = {
      ...result.data,
      ultima_manutencao: result.data.ultima_manutencao || undefined,
    }
    if (editing) {
      await updateEquipment.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createEquipment.mutateAsync(payload as EquipmentInput)
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (confirm(`Remover ${nome}?`)) {
      await deleteEquipment.mutateAsync(id)
    }
  }

  const isPending = createEquipment.isPending || updateEquipment.isPending

  return (
    <div className="p-4 md:p-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus aparelhos de fisioterapia</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Equipamento
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : equipments?.length ? (
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Modelo</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Última Manutenção</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipments.map((eq) => (
                <TableRow key={eq.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-card-foreground">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-primary" />
                      {eq.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">{eq.modelo || '-'}</TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {eq.ultima_manutencao ? (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(parseISO(eq.ultima_manutencao), 'dd/MM/yyyy')}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => openEdit(eq)}
                        className="text-muted-foreground hover:text-primary">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-xs"
                        onClick={() => handleDelete(eq.id, eq.nome)}
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
                icon={Wrench}
                title="Nenhum equipamento cadastrado"
                description="Cadastre aparelhos de fisioterapia para associar aos protocolos e acompanhar a manutenção."
                action={
                  <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Equipamento
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nome *</Label>
              <Input value={form.nome} onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErrors({ ...errors, nome: '' }) }}
                placeholder="Ex: Laserterapia 808nm"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
              {errors.nome && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Modelo</Label>
              <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ex: DMC Laser Pulse"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Última Manutenção</Label>
              <Input type="date" value={form.ultima_manutencao}
                onChange={(e) => setForm({ ...form, ultima_manutencao: e.target.value })}
                className="bg-muted border-border text-card-foreground" />
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
    </div>
  )
}

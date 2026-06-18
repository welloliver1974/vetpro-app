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
import { Toaster } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Wrench, CalendarDays } from 'lucide-react'
import { format, parseISO } from 'date-fns'

export default function EquipmentsPage() {
  const { data: equipments, isLoading } = useEquipments()
  const createEquipment = useCreateEquipment()
  const updateEquipment = useUpdateEquipment()
  const deleteEquipment = useDeleteEquipment()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Equipment | null>(null)
  const [form, setForm] = useState<EquipmentInput>({ nome: '', modelo: '', ultima_manutencao: '' })

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', modelo: '', ultima_manutencao: '' })
    setDialogOpen(true)
  }

  function openEdit(eq: Equipment) {
    setEditing(eq)
    setForm({
      nome: eq.nome,
      modelo: eq.modelo || '',
      ultima_manutencao: eq.ultima_manutencao || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      ultima_manutencao: form.ultima_manutencao || undefined,
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
      <Toaster richColors position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipamentos</h1>
          <p className="text-sm text-slate-400">Gerencie seus aparelhos de fisioterapia</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo Equipamento
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Nome</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Modelo</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Última Manutenção</TableHead>
                <TableHead className="text-slate-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !equipments?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum equipamento cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                equipments.map((eq) => (
                  <TableRow key={eq.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-indigo-400" />
                        {eq.nome}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 hidden md:table-cell">{eq.modelo || '-'}</TableCell>
                    <TableCell className="text-slate-400 hidden md:table-cell">
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
                          className="text-slate-400 hover:text-indigo-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs"
                          onClick={() => handleDelete(eq.id, eq.nome)}
                          className="text-slate-400 hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required placeholder="Ex: Laserterapia 808nm"
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Modelo</Label>
              <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                placeholder="Ex: DMC Laser Pulse"
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Última Manutenção</Label>
              <Input type="date" value={form.ultima_manutencao}
                onChange={(e) => setForm({ ...form, ultima_manutencao: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-slate-700 text-slate-300">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
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

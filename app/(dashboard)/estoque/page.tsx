'use client'

import { useState } from 'react'
import { useSupplies, useCreateSupply, useUpdateSupply, useDeleteSupply, type Supply, type SupplyInput } from '@/hooks/useSupplies'
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Loader2, AlertCircle, Package, AlertTriangle } from 'lucide-react'
import { supplySchema } from '@/lib/validations'
import { format, parseISO } from 'date-fns'
import { EmptyState } from '@/components/EmptyState'

const unidades = ['un', 'ml', 'mg', 'cx', 'ampola', 'comprimido', 'frasco']

export default function SuppliesPage() {
  const { data: supplies, isLoading } = useSupplies()
  const createSupply = useCreateSupply()
  const updateSupply = useUpdateSupply()
  const deleteSupply = useDeleteSupply()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Supply | null>(null)
  const [form, setForm] = useState<SupplyInput>({
    nome: '', tipo: 'insumo', quantidade: 0, quantidade_minima: 0,
    unidade: 'un', lote: '', validade: '', fornecedor: '', observacoes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openCreate() {
    setEditing(null)
    setForm({
      nome: '', tipo: 'insumo', quantidade: 0, quantidade_minima: 0,
      unidade: 'un', lote: '', validade: '', fornecedor: '', observacoes: '',
    })
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(s: Supply) {
    setEditing(s)
    setForm({
      nome: s.nome,
      tipo: s.tipo,
      quantidade: s.quantidade,
      quantidade_minima: s.quantidade_minima,
      unidade: s.unidade,
      lote: s.lote || '',
      validade: s.validade || '',
      fornecedor: s.fornecedor || '',
      observacoes: s.observacoes || '',
    })
    setErrors({})
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = supplySchema.safeParse(form)
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
    if (editing) {
      await updateSupply.mutateAsync({ id: editing.id, data: result.data })
    } else {
      await createSupply.mutateAsync(result.data as SupplyInput)
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (confirm(`Remover ${nome} do estoque?`)) {
      await deleteSupply.mutateAsync(id)
    }
  }

  const isPending = createSupply.isPending || updateSupply.isPending

  return (
    <div className="p-4 md:p-8">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-sm text-muted-foreground">Gerencie insumos e medicamentos da clínica</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Item
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : supplies?.length ? (
          <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-muted-foreground text-right">Qtd</TableHead>
                <TableHead className="text-muted-foreground text-right hidden md:table-cell">Qtd. Mínima</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Unidade</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Validade</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supplies.map((s) => {
                const lowStock = s.quantidade <= s.quantidade_minima && s.quantidade_minima > 0
                return (
                  <TableRow key={s.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-card-foreground">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        {s.nome}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.tipo === 'medicamento' ? 'default' : 'secondary'}>
                        {s.tipo === 'medicamento' ? 'Medicamento' : 'Insumo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={lowStock ? 'text-destructive font-semibold flex items-center justify-end gap-1' : ''}>
                        {lowStock && <AlertTriangle className="h-3.5 w-3.5" />}
                        {s.quantidade}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground hidden md:table-cell">
                      {s.quantidade_minima || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{s.unidade}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {s.validade ? format(parseISO(s.validade), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs"
                          onClick={() => openEdit(s)}
                          className="text-muted-foreground hover:text-primary">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs"
                          onClick={() => handleDelete(s.id, s.nome)}
                          className="text-muted-foreground hover:text-red-400">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Package}
                title="Estoque vazio"
                description="Cadastre insumos e medicamentos para controlar o estoque da clínica."
                action={
                  <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Item
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Item' : 'Novo Item no Estoque'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nome *</Label>
              <Input value={form.nome} onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErrors({ ...errors, nome: '' }) }}
                placeholder="Ex: Dipirona 500mg"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
              {errors.nome && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.nome}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Tipo</Label>
              <Select value={form.tipo} onValueChange={(value: 'insumo' | 'medicamento') => setForm({ ...form, tipo: value })}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insumo">Insumo</SelectItem>
                  <SelectItem value="medicamento">Medicamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Quantidade</Label>
                <Input type="number" min={0} value={form.quantidade}
                  onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })}
                  className="bg-muted border-border text-card-foreground" />
                {errors.quantidade && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.quantidade}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Qtd. Mínima</Label>
                <Input type="number" min={0} value={form.quantidade_minima}
                  onChange={(e) => setForm({ ...form, quantidade_minima: Number(e.target.value) })}
                  className="bg-muted border-border text-card-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Unidade</Label>
                <Select value={form.unidade} onValueChange={(value) => setForm({ ...form, unidade: value })}>
                  <SelectTrigger className="bg-muted border-border text-card-foreground">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Lote</Label>
                <Input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })}
                  placeholder="Ex: Lote 12345"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Validade</Label>
                <Input type="date" value={form.validade}
                  onChange={(e) => setForm({ ...form, validade: e.target.value })}
                  className="bg-muted border-border text-card-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Fornecedor</Label>
              <Input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })}
                placeholder="Ex: Distribuidora ABC"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Observações</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Informações adicionais..."
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
    </div>
  )
}

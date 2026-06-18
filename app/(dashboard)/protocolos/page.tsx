'use client'

import { useState } from 'react'
import { useProtocols, useCreateProtocol, useUpdateProtocol, useDeleteProtocol, type Protocol, type ProtocolInput } from '@/hooks/useProtocols'
import { useEquipments } from '@/hooks/useEquipments'
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
import { Badge } from '@/components/ui/badge'
import { Toaster } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, FileText } from 'lucide-react'

export default function ProtocolsPage() {
  const { data: protocols, isLoading } = useProtocols()
  const { data: equipments } = useEquipments()
  const createProtocol = useCreateProtocol()
  const updateProtocol = useUpdateProtocol()
  const deleteProtocol = useDeleteProtocol()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Protocol | null>(null)
  const [form, setForm] = useState<ProtocolInput>({
    nome: '', descricao: '', equipamento_id: '', configuracoes_padrao: {},
  })
  const [configKey, setConfigKey] = useState('')
  const [configValue, setConfigValue] = useState('')

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', descricao: '', equipamento_id: '', configuracoes_padrao: {} })
    setDialogOpen(true)
  }

  function openEdit(protocol: Protocol) {
    setEditing(protocol)
    setForm({
      nome: protocol.nome,
      descricao: protocol.descricao || '',
      equipamento_id: protocol.equipamento_id || '',
      configuracoes_padrao: protocol.configuracoes_padrao || {},
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      equipamento_id: form.equipamento_id || undefined,
      configuracoes_padrao: Object.keys(form.configuracoes_padrao || {}).length > 0
        ? form.configuracoes_padrao : undefined,
    }
    if (editing) {
      await updateProtocol.mutateAsync({ id: editing.id, data: payload })
    } else {
      await createProtocol.mutateAsync(payload)
    }
    setDialogOpen(false)
  }

  function addConfig() {
    if (!configKey.trim()) return
    setForm({
      ...form,
      configuracoes_padrao: { ...form.configuracoes_padrao, [configKey]: configValue },
    })
    setConfigKey('')
    setConfigValue('')
  }

  function removeConfig(key: string) {
    const updated = { ...form.configuracoes_padrao }
    delete updated[key]
    setForm({ ...form, configuracoes_padrao: updated })
  }

  async function handleDelete(id: string, nome: string) {
    if (confirm(`Remover o protocolo "${nome}"?`)) {
      await deleteProtocol.mutateAsync(id)
    }
  }

  const isPending = createProtocol.isPending || updateProtocol.isPending

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Protocolos</h1>
          <p className="text-sm text-muted-foreground">Templates de tratamento fisioterápico</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo Protocolo
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Equipamento</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Configurações</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : !protocols?.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Nenhum protocolo cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                protocols.map((protocol) => (
                  <TableRow key={protocol.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-card-foreground">{protocol.nome}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {protocol.equipments?.nome || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {protocol.configuracoes_padrao ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(protocol.configuracoes_padrao).map(([key, val]) => (
                            <Badge key={key} variant="outline" className="border-border text-muted-foreground text-[10px]">
                              {key}: {val}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-xs"
                          onClick={() => openEdit(protocol)}
                          className="text-muted-foreground hover:text-indigo-400">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs"
                          onClick={() => handleDelete(protocol.id, protocol.nome)}
                          className="text-muted-foreground hover:text-red-400">
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
        <DialogContent className="bg-card border-border text-card-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Protocolo' : 'Novo Protocolo'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nome do Protocolo *</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required placeholder="Ex: Protocolo de Artrite"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Equipamento</Label>
              <Select value={form.equipamento_id || ''}
                onValueChange={(v) => setForm({ ...form, equipamento_id: v })}>
                <SelectTrigger className="bg-muted border-border text-card-foreground">
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border text-card-foreground">
                  <SelectItem value="">Nenhum</SelectItem>
                  {equipments?.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Descrição</Label>
              <Textarea value={form.descricao || ''}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva o protocolo, indicações, contraindicações..."
                rows={3}
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
            </div>

            <div className="space-y-3">
              <Label className="text-foreground">Configurações Padrão</Label>
              <div className="flex gap-2">
                <Input value={configKey}
                  onChange={(e) => setConfigKey(e.target.value)}
                  placeholder="Ex: intensidade"
                  className="flex-1 bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
                <Input value={configValue}
                  onChange={(e) => setConfigValue(e.target.value)}
                  placeholder="Ex: 5Hz"
                  className="flex-1 bg-muted border-border text-card-foreground placeholder:text-muted-foreground" />
                <Button type="button" variant="outline" size="sm" onClick={addConfig}
                  className="border-border text-foreground">
                  + 
                </Button>
              </div>
              {form.configuracoes_padrao && Object.keys(form.configuracoes_padrao).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(form.configuracoes_padrao).map(([key, val]) => (
                    <Badge key={key} variant="secondary"
                      className="bg-muted text-foreground border border-border gap-1 cursor-pointer"
                      onClick={() => removeConfig(key)}>
                      {key}: {val} <span className="text-red-400 ml-1">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="border-border text-foreground">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white">
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

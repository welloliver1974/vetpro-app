'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient, type Patient, type PatientInput } from '@/hooks/usePatients'
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
import { Badge } from '@/components/ui/badge'
import { Toaster } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react'

export default function PatientsPage() {
  const { data: patients, isLoading } = usePatients()
  const createPatient = useCreatePatient()
  const updatePatient = useUpdatePatient()
  const deletePatient = useDeletePatient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState<PatientInput>({
    nome: '', especie: '', raca: '', tutor_nome: '', tutor_contato: '', endereco: '',
  })

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', especie: '', raca: '', tutor_nome: '', tutor_contato: '', endereco: '' })
    setDialogOpen(true)
  }

  function openEdit(patient: Patient) {
    setEditing(patient)
    setForm({
      nome: patient.nome,
      especie: patient.especie || '',
      raca: patient.raca || '',
      tutor_nome: patient.tutor_nome || '',
      tutor_contato: patient.tutor_contato || '',
      endereco: patient.endereco || '',
    })
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      await updatePatient.mutateAsync({ id: editing.id, data: form })
    } else {
      await createPatient.mutateAsync(form)
    }
    setDialogOpen(false)
  }

  async function handleDelete(id: string, nome: string) {
    if (confirm(`Remover ${nome}? Esta ação não pode ser desfeita.`)) {
      await deletePatient.mutateAsync(id)
    }
  }

  const filtered = patients?.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.tutor_nome?.toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)

  const isPending = createPatient.isPending || updatePatient.isPending

  // Reset page on search
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    setPage(1)
  }

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus pacientes</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou tutor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border text-card-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Espécie</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Raça</TableHead>
                <TableHead className="text-muted-foreground">Tutor</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((patient) => (
                  <TableRow key={patient.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-medium text-card-foreground">
                    <Link href={`/pacientes/${patient.id}`} className="hover:text-blue-400 transition-colors">
                      {patient.nome}
                    </Link>
                  </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {patient.especie && (
                        <Badge variant="outline" className="border-border text-foreground">
                          {patient.especie}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">{patient.raca || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.tutor_nome || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon-xs"
                          onClick={() => openEdit(patient)}
                          className="text-muted-foreground hover:text-blue-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon-xs"
                          onClick={() => handleDelete(patient.id, patient.nome)}
                          className="text-muted-foreground hover:text-red-400"
                        >
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

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} de {filtered.length}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="border-border text-muted-foreground">
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="xs"
                onClick={() => setPage(p)}
                className={p === page ? 'bg-primary text-white' : 'border-border text-muted-foreground'}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="border-border text-muted-foreground">
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Nome do animal *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className="bg-muted border-border text-card-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Espécie</Label>
                <Input
                  value={form.especie}
                  onChange={(e) => setForm({ ...form, especie: e.target.value })}
                  placeholder="Ex: Canina"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Raça</Label>
                <Input
                  value={form.raca}
                  onChange={(e) => setForm({ ...form, raca: e.target.value })}
                  placeholder="Ex: Golden"
                  className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Nome do Tutor</Label>
              <Input
                value={form.tutor_nome}
                onChange={(e) => setForm({ ...form, tutor_nome: e.target.value })}
                className="bg-muted border-border text-card-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Contato do Tutor</Label>
              <Input
                value={form.tutor_contato}
                onChange={(e) => setForm({ ...form, tutor_contato: e.target.value })}
                className="bg-muted border-border text-card-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Endereço (para atendimento externo)</Label>
              <Input
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                placeholder="Rua, número, bairro, cidade..."
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
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

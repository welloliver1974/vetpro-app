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
import { EmptyState } from '@/components/EmptyState'
import { Plus, Pencil, Trash2, Loader2, Search, AlertCircle, PawPrint } from 'lucide-react'
import { patientSchema } from '@/lib/validations'

export default function PatientsPage() {
  const { data: patients, isLoading } = usePatients()
  const createPatient = useCreatePatient()
  const updatePatient = useUpdatePatient()
  const deletePatient = useDeletePatient()

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 10
  const tutorNames = [...new Set(patients?.map((p) => p.tutor_nome).filter((n): n is string => !!n) ?? [])]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState<PatientInput>({
    nome: '', especie: '', raca: '', tutor_nome: '', tutor_contato: '', endereco: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', especie: '', raca: '', tutor_nome: '', tutor_contato: '', endereco: '' })
    setErrors({})
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
    setErrors({})
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = patientSchema.safeParse(form)
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
      await updatePatient.mutateAsync({ id: editing.id, data: result.data })
    } else {
      await createPatient.mutateAsync(result.data)
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus pacientes</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
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
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={PawPrint}
                title={patients?.length ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
                description={
                  patients?.length
                    ? 'Tente ajustar a busca ou crie um novo paciente para continuar.'
                    : 'Cadastre o primeiro paciente para começar a montar a agenda e as sessões.'
                }
                action={
                  <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" /> Novo Paciente
                  </Button>
                }
              />
            </div>
          ) : (
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
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
              {paginated.map((patient) => (
                <TableRow key={patient.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-medium text-card-foreground">
                    <Link href={`/pacientes/${patient.id}`} className="hover:text-primary transition-colors">
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
                        className="text-muted-foreground hover:text-primary"
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
              ))}
            </TableBody>
          </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} de {filtered.length}
          </p>
          <div className="flex flex-wrap gap-1">
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
                onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErrors({ ...errors, nome: '' }) }}
                className="bg-muted border-border text-card-foreground"
              />
              {errors.nome && <p className="text-xs text-destructive flex items-center gap-1 mt-1"><AlertCircle className="h-3 w-3" />{errors.nome}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                list="tutor-names"
                placeholder="Digite ou selecione um tutor existente"
                className="bg-muted border-border text-card-foreground placeholder:text-muted-foreground"
              />
              <datalist id="tutor-names">
                {tutorNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
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

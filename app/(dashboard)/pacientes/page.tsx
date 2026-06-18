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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)
  const [form, setForm] = useState<PatientInput>({
    nome: '', especie: '', raca: '', tutor_nome: '', tutor_contato: '',
  })

  function openCreate() {
    setEditing(null)
    setForm({ nome: '', especie: '', raca: '', tutor_nome: '', tutor_contato: '' })
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

  const isPending = createPatient.isPending || updatePatient.isPending

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors position="top-center" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-slate-400">Gerencie seus pacientes</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Novo Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="Buscar por nome ou tutor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Nome</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Espécie</TableHead>
                <TableHead className="text-slate-400 hidden md:table-cell">Raça</TableHead>
                <TableHead className="text-slate-400">Tutor</TableHead>
                <TableHead className="text-slate-400 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Nenhum paciente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((patient) => (
                  <TableRow key={patient.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-200">
                    <Link href={`/pacientes/${patient.id}`} className="hover:text-indigo-400 transition-colors">
                      {patient.nome}
                    </Link>
                  </TableCell>
                    <TableCell className="text-slate-400 hidden md:table-cell">
                      {patient.especie && (
                        <Badge variant="outline" className="border-slate-700 text-slate-300">
                          {patient.especie}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-400 hidden md:table-cell">{patient.raca || '-'}</TableCell>
                    <TableCell className="text-slate-400">{patient.tutor_nome || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost" size="icon-xs"
                          onClick={() => openEdit(patient)}
                          className="text-slate-400 hover:text-indigo-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon-xs"
                          onClick={() => handleDelete(patient.id, patient.nome)}
                          className="text-slate-400 hover:text-red-400"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Nome do animal *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                required
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Espécie</Label>
                <Input
                  value={form.especie}
                  onChange={(e) => setForm({ ...form, especie: e.target.value })}
                  placeholder="Ex: Canina"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Raça</Label>
                <Input
                  value={form.raca}
                  onChange={(e) => setForm({ ...form, raca: e.target.value })}
                  placeholder="Ex: Golden"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Nome do Tutor</Label>
              <Input
                value={form.tutor_nome}
                onChange={(e) => setForm({ ...form, tutor_nome: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Contato do Tutor</Label>
              <Input
                value={form.tutor_contato}
                onChange={(e) => setForm({ ...form, tutor_contato: e.target.value })}
                className="bg-slate-800 border-slate-700 text-slate-100"
              />
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

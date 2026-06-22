'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

let _supabase: ReturnType<typeof createClient> | null = null
function getClient() {
  if (!_supabase) _supabase = createClient()
  return _supabase
}

export type PrescriptionItem = {
  medicamento: string
  dosagem?: string
  frequencia?: string
  duracao?: string
  via?: string
  observacoes?: string
}

export type Prescription = {
  id: string
  vet_id: string
  patient_id: string
  items: PrescriptionItem[]
  observacoes: string | null
  created_at: string
  patients?: { nome: string; especie: string | null; raca: string | null } | null
}

export type PrescriptionInput = {
  patient_id: string
  items: PrescriptionItem[]
  observacoes?: string
}

async function fetchPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await getClient()
    .from('prescriptions')
    .select('id, vet_id, patient_id, items, observacoes, created_at, patients(nome, especie, raca)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as Prescription[]
}

async function createPrescription(input: PrescriptionInput) {
  const { data: { user } } = await getClient().auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await getClient()
    .from('prescriptions')
    .insert([{ ...input, vet_id: user.id }])
    .select('id, vet_id, patient_id, items, observacoes, created_at, patients(nome, especie, raca)')
    .single()

  if (error) throw error
  return data as unknown as Prescription
}

async function updatePrescription(id: string, input: Partial<PrescriptionInput>) {
  const { data, error } = await getClient()
    .from('prescriptions')
    .update(input)
    .eq('id', id)
    .select('id, vet_id, patient_id, items, observacoes, created_at, patients(nome, especie, raca)')
    .single()

  if (error) throw error
  return data as unknown as Prescription
}

async function deletePrescription(id: string) {
  const { error } = await getClient()
    .from('prescriptions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function usePrescriptions() {
  return useQuery({
    queryKey: ['prescriptions'],
    queryFn: fetchPrescriptions,
  })
}

export function useCreatePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      toast.success('Prescrição cadastrada!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PrescriptionInput> }) =>
      updatePrescription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      toast.success('Prescrição atualizada!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePrescription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePrescription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      toast.success('Prescrição removida!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

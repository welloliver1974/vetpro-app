'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export type Patient = {
  id: string
  nome: string
  especie: string | null
  raca: string | null
  tutor_nome: string | null
  tutor_contato: string | null
  created_at: string
}

export type PatientInput = {
  nome: string
  especie?: string
  raca?: string
  tutor_nome?: string
  tutor_contato?: string
}

async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createPatient(input: PatientInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...input, vet_id: user.id }])
    .select()
    .single()

  if (error) throw error
  return data
}

async function updatePatient(id: string, input: Partial<PatientInput>) {
  const { data, error } = await supabase
    .from('patients')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deletePatient(id: string) {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: fetchPatients,
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente cadastrado com sucesso!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientInput> }) =>
      updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente removido!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

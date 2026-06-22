'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

let _supabase: ReturnType<typeof createClient> | null = null
function getClient() {
  if (!_supabase) _supabase = createClient()
  return _supabase
}

export type Patient = {
  id: string
  nome: string
  especie: string | null
  raca: string | null
  tutor_nome: string | null
  tutor_contato: string | null
  endereco: string | null
  data_nascimento: string | null
  sexo: string | null
  peso: number | null
  cor_pelagem: string | null
  microchip: string | null
  queixa_principal: string | null
  historico_doenca_atual: string | null
  doencas_preexistentes: string | null
  medicamentos_continuos: string | null
  historico_cirurgico: string | null
  alergias: string | null
  vacinacao: string | null
  observacoes: string | null
  created_at: string
}

export type PatientInput = {
  nome: string
  especie?: string
  raca?: string
  tutor_nome?: string
  tutor_contato?: string
  endereco?: string
  data_nascimento?: string
  sexo?: string
  peso?: number | null
  cor_pelagem?: string
  microchip?: string
  queixa_principal?: string
  historico_doenca_atual?: string
  doencas_preexistentes?: string
  medicamentos_continuos?: string
  historico_cirurgico?: string
  alergias?: string
  vacinacao?: string
  observacoes?: string
}

const patientSelect = 'id, nome, especie, raca, tutor_nome, tutor_contato, endereco, data_nascimento, sexo, peso, cor_pelagem, microchip, queixa_principal, historico_doenca_atual, doencas_preexistentes, medicamentos_continuos, historico_cirurgico, alergias, vacinacao, observacoes, created_at'

async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await getClient()
    .from('patients')
    .select(patientSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createPatient(input: PatientInput) {
  const { data: { user } } = await getClient().auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await getClient()
    .from('patients')
    .insert([{ ...input, vet_id: user.id }])
    .select(patientSelect)
    .single()

  if (error) throw error
  return data
}

async function updatePatient(id: string, input: Partial<PatientInput>) {
  const { data, error } = await getClient()
    .from('patients')
    .update(input)
    .eq('id', id)
    .select(patientSelect)
    .single()

  if (error) throw error
  return data
}

async function deletePatient(id: string) {
  const { error } = await getClient()
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

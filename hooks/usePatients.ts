'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { toast } from 'sonner'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
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
  const sb = await getClient()
  const { data, error } = await sb
    .from('patients')
    .select(patientSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createPatient(input: PatientInput) {
  const sb = await getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await sb
    .from('patients')
    .insert([{ ...input, vet_id: user.id }])
    .select(patientSelect)
    .single()

  if (error) throw error
  return data
}

async function updatePatient(id: string, input: Partial<PatientInput>) {
  const sb = await getClient()
  const { data, error } = await sb
    .from('patients')
    .update(input)
    .eq('id', id)
    .select(patientSelect)
    .single()

  if (error) throw error
  return data
}

async function deletePatient(id: string) {
  const sb = await getClient()
  const { error } = await sb
    .from('patients')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ─── Embedding ───

async function generatePatientEmbedding(patient: Patient) {
  try {
    const textForEmbedding = [
      patient.nome,
      patient.especie,
      patient.raca,
      patient.tutor_nome,
      patient.queixa_principal,
      patient.historico_doenca_atual,
      patient.observacoes,
    ]
      .filter(Boolean)
      .join(' | ')

    if (!textForEmbedding.trim()) return

    const embedding = await generateEmbedding(textForEmbedding)
    if (!embedding || embedding.length === 0) return

    const sb = await getClient()
    await sb.from('patients').update({ embedding } as never).eq('id', patient.id)
  } catch {
    // Falha silenciosa — não impede o fluxo principal
  }
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente cadastrado com sucesso!')
      generatePatientEmbedding(data)
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Paciente atualizado!')
      if (data) generatePatientEmbedding(data)
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

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export type Session = {
  id: string
  appointment_id: string
  protocolo_id: string | null
  notas: string | null
  notas_evolucao: string | null
  custo: number | null
  foto_urls: string[]
  created_at: string
  appointments?: {
    id: string
    data: string
    tipo: string
    valor: number | null
    patients?: { nome: string; especie: string } | null
  } | null
}

export type SessionInput = {
  appointment_id: string
  protocolo_id?: string
  notas?: string
  notas_evolucao?: string
  custo?: number
}

async function fetchSessionsByPatient(patientId: string): Promise<Session[]> {
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('paciente_id', patientId)

  if (!appointments?.length) return []

  const ids = appointments.map((a) => a.id)
  const { data, error } = await supabase
    .from('sessions')
    .select('id, appointment_id, protocolo_id, notas, notas_evolucao, custo, foto_urls, created_at, appointments!inner(id, data, tipo, valor, patients!inner(nome, especie))')
    .in('appointment_id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as unknown as Session[]
}

async function fetchSessionsByAppointment(appointmentId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, appointment_id, protocolo_id, notas, notas_evolucao, custo, foto_urls, created_at')
    .eq('appointment_id', appointmentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as unknown as Session[]
}

async function createSession(input: SessionInput) {
  const { data, error } = await supabase
    .from('sessions')
    .insert([input])
    .select('id, appointment_id, protocolo_id, notas, notas_evolucao, custo, foto_urls, created_at')
    .single()

  if (error) throw error
  return data as unknown as Session
}

async function updateSession(id: string, input: Partial<SessionInput & { foto_urls: string[] }>) {
  const { data, error } = await supabase
    .from('sessions')
    .update(input)
    .eq('id', id)
    .select('id, appointment_id, protocolo_id, notas, notas_evolucao, custo, foto_urls, created_at')
    .single()

  if (error) throw error
  return data as unknown as Session
}

export async function uploadFile(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from('session-media')
    .upload(path, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('session-media')
    .getPublicUrl(path)

  return publicUrl
}

export function useSessionsByPatient(patientId: string) {
  return useQuery({
    queryKey: ['sessions', 'patient', patientId],
    queryFn: () => fetchSessionsByPatient(patientId),
    enabled: !!patientId,
  })
}

export function useSessionsByAppointment(appointmentId: string) {
  return useQuery({
    queryKey: ['sessions', 'appointment', appointmentId],
    queryFn: () => fetchSessionsByAppointment(appointmentId),
    enabled: !!appointmentId,
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Sessão registrada!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SessionInput & { foto_urls: string[] }> }) =>
      updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Sessão atualizada!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

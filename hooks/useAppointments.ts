'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export type Appointment = {
  id: string
  paciente_id: string
  data: string
  tipo: 'fisio' | 'clinico' | 'externo'
  status: string
  valor: number | null
  forma_pagamento: string | null
  created_at: string
  patients?: { nome: string; especie: string } | null
}

export type AppointmentInput = {
  paciente_id: string
  data: string
  tipo: 'fisio' | 'clinico' | 'externo'
  status?: string
  valor?: number
}

async function fetchAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(nome, especie)')
    .order('data', { ascending: true })

  if (error) throw error
  return data
}

async function createAppointment(input: AppointmentInput) {
  const { data, error } = await supabase
    .from('appointments')
    .insert([input])
    .select('*, patients(nome, especie)')
    .single()

  if (error) throw error
  return data
}

async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('*, patients(nome, especie)')
    .single()

  if (error) throw error
  return data
}

async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useAppointments() {
  return useQuery({
    queryKey: ['appointments'],
    queryFn: fetchAppointments,
  })
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Atendimento agendado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Appointment> }) =>
      updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Atendimento atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Atendimento removido!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

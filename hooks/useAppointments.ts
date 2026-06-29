'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { loadNotifyConfigAsync } from '@/lib/notification/config'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
  return _supabase
}

export type Appointment = {
  id: string
  paciente_id: string
  data: string
  tipo: 'fisio' | 'clinico' | 'externo'
  status: string
  valor: number | null
  forma_pagamento: string | null
  assinatura_url: string | null
  created_at: string
  patients?: { nome: string; especie: string; endereco: string | null } | null
}

export type AppointmentInput = {
  paciente_id: string
  data: string
  tipo: 'fisio' | 'clinico' | 'externo'
  status?: string
  valor?: number
}

async function fetchAppointments(): Promise<Appointment[]> {
  const sb = await getClient()
  const { data, error } = await sb
    .from('appointments')
    .select('id, paciente_id, data, tipo, status, valor, forma_pagamento, assinatura_url, created_at, patients(nome, especie, endereco)')
    .order('data', { ascending: true })

  if (error) throw error
  return data as unknown as Appointment[]
}

async function createAppointment(input: AppointmentInput) {
  const sb = await getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await sb
    .from('appointments')
    .insert([{ ...input, vet_id: user.id }])
    .select('id, paciente_id, data, tipo, status, valor, forma_pagamento, assinatura_url, created_at, patients(nome, especie, endereco)')
    .single()

  if (error) throw error
  return data as unknown as Appointment
}

async function updateAppointment(id: string, updates: Partial<Appointment>) {
  const sb = await getClient()
  const { data, error } = await sb
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select('id, paciente_id, data, tipo, status, valor, forma_pagamento, assinatura_url, created_at, patients(nome, especie, endereco)')
    .single()

  if (error) throw error
  return data as unknown as Appointment
}

async function deleteAppointment(id: string) {
  const sb = await getClient()
  const { error } = await sb
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
    onSuccess: async (newAppt) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Atendimento agendado!')

      // Dispara Edge Function para enviar WhatsApp (fire-and-forget)
      try {
        const config = await loadNotifyConfigAsync()
        if (config?.enabled && config.provider === 'evolution') {
          const sb = await getClient()
          const { data: { session } } = await sb.auth.getSession()
          if (session?.access_token) {
            const supabaseUrl = (typeof window !== 'undefined' && (window as unknown as { __SUPABASE_URL__?: string }).__SUPABASE_URL__)
              || process.env.NEXT_PUBLIC_SUPABASE_URL
              || ''
            if (supabaseUrl) {
              fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ appointmentId: newAppt.id }),
                keepalive: true,
              }).catch(() => { /* silent fail */ })
            }
          }
        }
      } catch {
        // Silent fail — não bloqueia o agendamento
      }
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

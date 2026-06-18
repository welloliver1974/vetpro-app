'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export type CompletedAppointment = {
  id: string
  paciente_id: string
  data: string
  tipo: 'fisio' | 'clinico' | 'externo'
  valor: number | null
  forma_pagamento: string | null
  created_at: string
  patients?: { nome: string; especie: string } | null
}

async function fetchCompletedAppointments(): Promise<CompletedAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(nome, especie)')
    .eq('status', 'concluido')
    .order('data', { ascending: false })

  if (error) throw error
  return data
}

async function fetchTodaySummary() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('appointments')
    .select('valor, forma_pagamento')
    .eq('status', 'concluido')
    .gte('data', today.toISOString())
    .lt('data', tomorrow.toISOString())

  if (error) throw error

  const total = data.reduce((sum, a) => sum + (Number(a.valor) || 0), 0)
  const methods: Record<string, number> = {}
  data.forEach((a) => {
    const method = a.forma_pagamento || 'nao_informado'
    methods[method] = (methods[method] || 0) + (Number(a.valor) || 0)
  })

  return { total, count: data.length, methods }
}

async function fetchMonthSummary() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const { data, error } = await supabase
    .from('appointments')
    .select('valor, forma_pagamento')
    .eq('status', 'concluido')
    .gte('data', startOfMonth.toISOString())

  if (error) throw error

  const total = data.reduce((sum, a) => sum + (Number(a.valor) || 0), 0)
  return { total, count: data.length }
}

export function useCompletedAppointments() {
  return useQuery({
    queryKey: ['completed-appointments'],
    queryFn: fetchCompletedAppointments,
  })
}

export function useTodaySummary() {
  return useQuery({
    queryKey: ['finance-today'],
    queryFn: fetchTodaySummary,
  })
}

export function useMonthSummary() {
  return useQuery({
    queryKey: ['finance-month'],
    queryFn: fetchMonthSummary,
  })
}

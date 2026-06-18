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
  const methods: Record<string, number> = {}
  data.forEach((a) => {
    const m = a.forma_pagamento || 'nao_informado'
    methods[m] = (methods[m] || 0) + (Number(a.valor) || 0)
  })
  return { total, count: data.length, methods }
}

export async function fetchWeekSessions() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)

  const { data, error } = await supabase
    .from('appointments')
    .select('data, tipo')
    .eq('status', 'concluido')
    .gte('data', monday.toISOString())
    .lt('data', sunday.toISOString())

  if (error) throw error

  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const result: { day: string; count: number }[] = days.map((day) => ({ day, count: 0 }))

  data.forEach((a) => {
    const d = new Date(a.data)
    const idx = d.getDay()
    result[idx].count++
  })

  return result
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

export function useMonthPaymentMethods() {
  return useQuery({
    queryKey: ['finance-month-methods'],
    queryFn: async () => {
      const result = await fetchMonthSummary()
      return result.methods
    },
  })
}

export function useWeekSessions() {
  return useQuery({
    queryKey: ['week-sessions'],
    queryFn: fetchWeekSessions,
  })
}

type CostSummary = { custo_total: number; receita_total: number; margem_total: number }

async function fetchCostSummary(): Promise<CostSummary> {
  const { data, error } = await supabase
    .from('appointments')
    .select('valor, sessions!inner(custo)')
    .eq('status', 'concluido')

  if (error) throw error

  const receita_total = data.reduce((s, a) => s + (Number(a.valor) || 0), 0)
  const custo_total = data.reduce((s, a) => {
    const custos = Array.isArray(a.sessions) ? a.sessions : [a.sessions]
    return s + custos.reduce((s2, sess: { custo: number | null }) => s2 + (Number(sess.custo) || 0), 0)
  }, 0)

  return { custo_total, receita_total, margem_total: receita_total - custo_total }
}

export function useCostSummary() {
  return useQuery({
    queryKey: ['cost-summary'],
    queryFn: fetchCostSummary,
  })
}

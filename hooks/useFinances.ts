'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format, parseISO } from 'date-fns'

const supabase = createClient()

export type CompletedAppointment = {
  id: string
  paciente_id: string
  data: string
  tipo: 'fisio' | 'clinico' | 'externo'
  valor: number | null
  forma_pagamento: string | null
  assinatura_url: string | null
  created_at: string
  patients?: {
    nome: string
    especie: string
    tutor_nome: string | null
    tutor_contato: string | null
    endereco: string | null
  } | null
}

async function fetchCompletedAppointments(): Promise<CompletedAppointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('id, paciente_id, data, tipo, valor, forma_pagamento, assinatura_url, created_at, patients(nome, especie, tutor_nome, tutor_contato, endereco)')
    .eq('status', 'concluido')
    .order('data', { ascending: false })

  if (error) throw error
  return data as unknown as CompletedAppointment[]
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

async function fetchPeriodSummary(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('valor, forma_pagamento, tipo')
    .eq('status', 'concluido')
    .gte('data', startDate)
    .lte('data', endDate)

  if (error) throw error

  const total = data.reduce((sum, a) => sum + (Number(a.valor) || 0), 0)
  const fisioCount = data.filter((a) => a.tipo === 'fisio').length
  const methods: Record<string, number> = {}
  data.forEach((a) => {
    const method = a.forma_pagamento || 'nao_informado'
    methods[method] = (methods[method] || 0) + (Number(a.valor) || 0)
  })

  return { total, count: data.length, fisioCount, methods }
}

async function fetchPeriodSessions(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('data')
    .eq('status', 'concluido')
    .gte('data', startDate)
    .lte('data', endDate)

  if (error) throw error

  const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
  const result: { day: string; count: number }[] = days.map((day) => ({ day, count: 0 }))

  data.forEach((a) => {
    const d = new Date(a.data)
    result[d.getDay()].count++
  })

  return result
}

async function fetchPeriodDailyRevenue(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('appointments')
    .select('data, valor')
    .eq('status', 'concluido')
    .gte('data', startDate)
    .lte('data', endDate)
    .order('data', { ascending: true })

  if (error) throw error

  const dailyMap: Record<string, number> = {}
  data.forEach((a) => {
    const day = format(parseISO(a.data), 'dd/MM')
    dailyMap[day] = (dailyMap[day] || 0) + (Number(a.valor) || 0)
  })

  return Object.entries(dailyMap).map(([day, total]) => ({ day, total }))
}

export function usePeriodSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['finance-period', startDate, endDate],
    queryFn: () => fetchPeriodSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export function usePeriodSessions(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['period-sessions', startDate, endDate],
    queryFn: () => fetchPeriodSessions(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
}

export function usePeriodDailyRevenue(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['period-daily-revenue', startDate, endDate],
    queryFn: () => fetchPeriodDailyRevenue(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })
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

type MonthlyRevenue = { ano: number; mes: number; total: number }

async function fetchRevenueByMonth(): Promise<MonthlyRevenue[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('data, valor')
    .eq('status', 'concluido')

  if (error) throw error

  const monthlyMap: Record<string, number> = {}
  data.forEach((a) => {
    const d = parseISO(a.data)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`
    monthlyMap[key] = (monthlyMap[key] || 0) + (Number(a.valor) || 0)
  })

  return Object.entries(monthlyMap).map(([key, total]) => {
    const [ano, mes] = key.split('-').map(Number)
    return { ano, mes, total }
  }).sort((a, b) => b.ano - a.ano || b.mes - a.mes)
}

export function useRevenueByMonth() {
  return useQuery({
    queryKey: ['revenue-by-month'],
    queryFn: fetchRevenueByMonth,
  })
}

export function useCostSummary() {
  return useQuery({
    queryKey: ['cost-summary'],
    queryFn: fetchCostSummary,
  })
}

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { z } from 'zod'
import type { monthlyGoalSchema } from '@/lib/validations'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
  return _supabase
}

export type MonthlyGoal = {
  id: string
  vet_id: string
  mes: number
  ano: number
  valor_meta: number
  created_at: string
}

export type MonthlyGoalInput = z.infer<typeof monthlyGoalSchema>

async function fetchMonthlyGoals(): Promise<MonthlyGoal[]> {
  const sb = await getClient()
  const { data, error } = await sb
    .from('monthly_goals')
    .select('*')
    .order('ano', { ascending: false })
    .order('mes', { ascending: false })

  if (error) throw error
  return data
}

async function upsertMonthlyGoal(input: MonthlyGoalInput) {
  const sb = await getClient()
  const { data: user } = await sb.auth.getUser()
  if (!user.user) throw new Error('Usuário não autenticado')

  const { data, error } = await sb
    .from('monthly_goals')
    .upsert({
      vet_id: user.user.id,
      mes: input.mes,
      ano: input.ano,
      valor_meta: input.valor_meta,
    }, {
      onConflict: 'vet_id, mes, ano',
      ignoreDuplicates: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteMonthlyGoal(id: string) {
  const sb = await getClient()
  const { error } = await sb
    .from('monthly_goals')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useMonthlyGoals() {
  return useQuery({
    queryKey: ['monthly-goals'],
    queryFn: fetchMonthlyGoals,
  })
}

export function useUpsertMonthlyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertMonthlyGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monthly-goals'] })
      toast.success('Meta salva com sucesso')
    },
    onError: (err) => {
      toast.error('Erro ao salvar meta')
      console.error(err)
    },
  })
}

export function useDeleteMonthlyGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteMonthlyGoal,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['monthly-goals'] })
      toast.success('Meta removida')
    },
    onError: (err) => {
      toast.error('Erro ao remover meta')
      console.error(err)
    },
  })
}

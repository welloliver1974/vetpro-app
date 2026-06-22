'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
  return _supabase
}

export type Equipment = {
  id: string
  nome: string
  modelo: string | null
  ultima_manutencao: string | null
  created_at: string
}

export type EquipmentInput = {
  nome: string
  modelo?: string
  ultima_manutencao?: string
}

async function fetchEquipments(): Promise<Equipment[]> {
  const sb = await getClient()
  const { data, error } = await sb
    .from('equipments')
    .select('id, nome, modelo, ultima_manutencao, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createEquipment(input: EquipmentInput) {
  const sb = await getClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await sb
    .from('equipments')
    .insert([{ ...input, vet_id: user.id }])
    .select('id, nome, modelo, ultima_manutencao, created_at')
    .single()

  if (error) throw error
  return data
}

async function updateEquipment(id: string, input: Partial<EquipmentInput>) {
  const sb = await getClient()
  const { data, error } = await sb
    .from('equipments')
    .update(input)
    .eq('id', id)
    .select('id, nome, modelo, ultima_manutencao, created_at')
    .single()

  if (error) throw error
  return data
}

async function deleteEquipment(id: string) {
  const sb = await getClient()
  const { error } = await sb
    .from('equipments')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useEquipments() {
  return useQuery({
    queryKey: ['equipments'],
    queryFn: fetchEquipments,
  })
}

export function useCreateEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      toast.success('Equipamento cadastrado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EquipmentInput> }) =>
      updateEquipment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      toast.success('Equipamento atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['equipments'] })
      toast.success('Equipamento removido!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

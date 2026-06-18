'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

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
  const { data, error } = await supabase
    .from('equipments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createEquipment(input: EquipmentInput) {
  const { data, error } = await supabase
    .from('equipments')
    .insert([input])
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateEquipment(id: string, input: Partial<EquipmentInput>) {
  const { data, error } = await supabase
    .from('equipments')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteEquipment(id: string) {
  const { error } = await supabase
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

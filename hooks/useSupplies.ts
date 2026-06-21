'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export type Supply = {
  id: string
  nome: string
  tipo: 'insumo' | 'medicamento'
  quantidade: number
  quantidade_minima: number
  unidade: string
  lote: string | null
  validade: string | null
  fornecedor: string | null
  observacoes: string | null
  created_at: string
}

export type SupplyInput = {
  nome: string
  tipo: 'insumo' | 'medicamento'
  quantidade: number
  quantidade_minima: number
  unidade: string
  lote?: string
  validade?: string
  fornecedor?: string
  observacoes?: string
}

async function fetchSupplies(): Promise<Supply[]> {
  const { data, error } = await supabase
    .from('supplies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createSupply(input: SupplyInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('supplies')
    .insert([{ ...input, vet_id: user.id }])
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function updateSupply(id: string, input: Partial<SupplyInput>) {
  const { data, error } = await supabase
    .from('supplies')
    .update(input)
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw error
  return data
}

async function deleteSupply(id: string) {
  const { error } = await supabase
    .from('supplies')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useSupplies() {
  return useQuery({
    queryKey: ['supplies'],
    queryFn: fetchSupplies,
  })
}

export function useCreateSupply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSupply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Item cadastrado no estoque!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateSupply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SupplyInput> }) =>
      updateSupply(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Item atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteSupply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteSupply,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] })
      toast.success('Item removido do estoque!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

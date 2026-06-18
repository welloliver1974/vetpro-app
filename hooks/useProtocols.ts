'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export type Protocol = {
  id: string
  equipamento_id: string | null
  nome: string
  descricao: string | null
  configuracoes_padrao: Record<string, string> | null
  created_at: string
  equipments?: { nome: string; modelo: string | null } | null
}

export type ProtocolInput = {
  nome: string
  equipamento_id?: string
  descricao?: string
  configuracoes_padrao?: Record<string, string>
}

async function fetchProtocols(): Promise<Protocol[]> {
  const { data, error } = await supabase
    .from('protocols')
    .select('*, equipments(nome, modelo)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

async function createProtocol(input: ProtocolInput) {
  const { data, error } = await supabase
    .from('protocols')
    .insert([input])
    .select('*, equipments(nome, modelo)')
    .single()

  if (error) throw error
  return data
}

async function updateProtocol(id: string, input: Partial<ProtocolInput>) {
  const { data, error } = await supabase
    .from('protocols')
    .update(input)
    .eq('id', id)
    .select('*, equipments(nome, modelo)')
    .single()

  if (error) throw error
  return data
}

async function deleteProtocol(id: string) {
  const { error } = await supabase
    .from('protocols')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function useProtocols() {
  return useQuery({
    queryKey: ['protocols'],
    queryFn: fetchProtocols,
  })
}

export function useCreateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProtocol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      toast.success('Protocolo criado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProtocolInput> }) =>
      updateProtocol(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      toast.success('Protocolo atualizado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteProtocol() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProtocol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['protocols'] })
      toast.success('Protocolo removido!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

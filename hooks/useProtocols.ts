'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

let _supabase: ReturnType<typeof createClient> | null = null
function getClient() {
  if (!_supabase) _supabase = createClient()
  return _supabase
}

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
  const { data, error } = await getClient()
    .from('protocols')
    .select('id, equipamento_id, nome, descricao, configuracoes_padrao, created_at, equipments(nome, modelo)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as Protocol[]
}

async function createProtocol(input: ProtocolInput) {
  const { data: { user } } = await getClient().auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await getClient()
    .from('protocols')
    .insert([{ ...input, vet_id: user.id }])
    .select('id, equipamento_id, nome, descricao, configuracoes_padrao, created_at, equipments(nome, modelo)')
    .single()

  if (error) throw error
  return data as unknown as Protocol
}

async function updateProtocol(id: string, input: Partial<ProtocolInput>) {
  const { data, error } = await getClient()
    .from('protocols')
    .update(input)
    .eq('id', id)
    .select('id, equipamento_id, nome, descricao, configuracoes_padrao, created_at, equipments(nome, modelo)')
    .single()

  if (error) throw error
  return data as unknown as Protocol
}

async function deleteProtocol(id: string) {
  const { error } = await getClient()
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

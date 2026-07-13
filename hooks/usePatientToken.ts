'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
  return _supabase
}

async function fetchToken(patientId: string): Promise<string | null> {
  const sb = await getClient()
  const { data, error } = await sb
    .from('patient_tokens')
    .select('token')
    .eq('patient_id', patientId)
    .maybeSingle()

  if (error) throw error
  return data?.token ?? null
}

async function generateToken(patientId: string): Promise<string> {
  const sb = await getClient()
  const token = crypto.randomUUID()

  const { data, error } = await sb
    .from('patient_tokens')
    .insert([{ patient_id: patientId, token }])
    .select('token')
    .single()

  if (error) throw error
  return data.token
}

export function usePatientToken(patientId: string) {
  return useQuery({
    queryKey: ['patient-token', patientId],
    queryFn: () => fetchToken(patientId),
    enabled: !!patientId,
  })
}

export function useGeneratePatientToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateToken,
    onSuccess: (_token, patientId) => {
      queryClient.invalidateQueries({ queryKey: ['patient-token', patientId] })
      toast.success('Link do tutor gerado!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

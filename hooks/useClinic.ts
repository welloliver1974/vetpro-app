'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const supabase = createClient()

export type Clinic = {
  id: string
  owner_id: string
  nome: string
  endereco: string | null
  telefone: string | null
  created_at: string
}

export type ClinicInvite = {
  id: string
  clinic_id: string
  email: string
  token: string
  usado: boolean
  created_at: string
}

export type Profile = {
  id: string
  nome: string | null
  clinic_id: string | null
}

async function fetchMyClinic(): Promise<Clinic | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.clinic_id) return null

  const { data, error } = await supabase
    .from('clinics')
    .select('id, owner_id, nome, endereco, telefone, created_at')
    .eq('id', profile.clinic_id)
    .single()

  if (error) throw error
  return data as unknown as Clinic
}

async function fetchInvites(): Promise<ClinicInvite[]> {
  const { data, error } = await supabase
    .from('clinic_invites')
    .select('id, clinic_id, email, token, usado, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as ClinicInvite[]
}

async function fetchClinicMembers(): Promise<Profile[]> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.clinic_id) return []

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, clinic_id')
    .eq('clinic_id', profile.clinic_id)

  if (error) throw error
  return data as unknown as Profile[]
}

async function createClinic(input: { nome: string; endereco?: string; telefone?: string }) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Não autenticado')

  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert([{ owner_id: user.id, nome: input.nome, endereco: input.endereco, telefone: input.telefone }])
    .select('id, owner_id, nome, endereco, telefone, created_at')
    .single()

  if (clinicError) throw clinicError

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ clinic_id: clinic.id })
    .eq('id', user.id)

  if (profileError) throw profileError

  return clinic as unknown as Clinic
}

async function createInvite(email: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('clinic_id, id')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (!profile?.clinic_id) throw new Error('Você não possui uma clínica')

  const token = crypto.randomUUID()
  const { data, error } = await supabase
    .from('clinic_invites')
    .insert([{ clinic_id: profile.clinic_id, email, token, created_by: profile.id }])
    .select('id, clinic_id, email, token, usado, created_at')
    .single()

  if (error) throw error
  return data as unknown as ClinicInvite
}

async function acceptInvite(token: string) {
  const { data: invite, error: findError } = await supabase
    .from('clinic_invites')
    .select('id, clinic_id, email, token, usado, created_at')
    .eq('token', token)
    .eq('usado', false)
    .single()

  if (findError || !invite) throw new Error('Convite inválido ou já usado')

  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Faça login primeiro')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ clinic_id: invite.clinic_id })
    .eq('id', user.id)

  if (profileError) throw profileError

  const { error: usedError } = await supabase
    .from('clinic_invites')
    .update({ usado: true })
    .eq('id', invite.id)

  if (usedError) throw usedError

  return invite as unknown as ClinicInvite
}

export function useMyClinic() {
  return useQuery({
    queryKey: ['my-clinic'],
    queryFn: fetchMyClinic,
  })
}

export function useClinicInvites(enabled = true) {
  return useQuery({
    queryKey: ['clinic-invites'],
    queryFn: fetchInvites,
    enabled,
  })
}

export function useClinicMembers() {
  return useQuery({
    queryKey: ['clinic-members'],
    queryFn: fetchClinicMembers,
  })
}

export function useCreateClinic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClinic,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-clinic'] })
      queryClient.invalidateQueries({ queryKey: ['clinic-members'] })
      toast.success('Clínica criada!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useCreateInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-invites'] })
      toast.success('Convite gerado! Compartilhe o link com o veterinário.')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useAcceptInvite() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-clinic'] })
      queryClient.invalidateQueries({ queryKey: ['clinic-members'] })
      toast.success('Você entrou na clínica!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

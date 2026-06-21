import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    redirect('/auth/login')
  }

  return { isAuth: true, userId: data.user.id, user: data.user }
})

export const getProfile = cache(async () => {
  const session = await verifySession()

  const supabase = await createClient()
  const { data } = await supabase
    .from('profiles')
    .select('id, nome, especialidade, clinic_id, created_at')
    .eq('id', session.userId)
    .single()

  return data
})

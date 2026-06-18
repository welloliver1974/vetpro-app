import { createClient } from '@/lib/supabase/server'

export async function getPatients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPatient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getAppointments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('*, pacientes:nome, pacientes:especie')
    .order('data', { ascending: true })

  if (error) throw error
  return data
}

export async function getTodayAppointments() {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('appointments')
    .select('*, patients(nome, especie)')
    .gte('data', today.toISOString())
    .lt('data', tomorrow.toISOString())
    .order('data', { ascending: true })

  if (error) throw error
  return data
}

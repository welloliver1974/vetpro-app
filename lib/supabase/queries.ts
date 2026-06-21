import { createClient } from '@/lib/supabase/server'

const patientSelect = 'id, nome, especie, raca, tutor_nome, tutor_contato, endereco, data_nascimento, sexo, peso, cor_pelagem, microchip, queixa_principal, historico_doenca_atual, doencas_preexistentes, medicamentos_continuos, historico_cirurgico, alergias, vacinacao, observacoes, created_at'

export async function getPatients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select(patientSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getPatient(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('patients')
    .select(patientSelect)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getAppointments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('id, paciente_id, data, tipo, status, valor, forma_pagamento, assinatura_url, created_at, patients(nome, especie, endereco)')
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
    .select('id, paciente_id, data, tipo, status, valor, forma_pagamento, assinatura_url, created_at, patients(nome, especie, endereco)')
    .gte('data', today.toISOString())
    .lt('data', tomorrow.toISOString())
    .order('data', { ascending: true })

  if (error) throw error
  return data
}

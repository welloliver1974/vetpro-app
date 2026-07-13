import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

type TokenRecord = { patient_id: string; active: boolean }
type PatientRecord = {
  id: string
  nome: string
  especie: string | null
  raca: string | null
  tutor_nome: string | null
  data_nascimento: string | null
  sexo: string | null
  peso: number | null
  cor_pelagem: string | null
}
type ApptRecord = { id: string; data: string; tipo: string; status?: string }
type SessionRecord = {
  id: string
  notas_evolucao: string | null
  foto_urls: string[] | null
  peso: number | null
  created_at: string
  appointment_id: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  try {
    const supabase = getAdminClient()

    // 1. Validar token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('patient_tokens')
      .select('patient_id, active')
      .eq('token', token)
      .single()

    if (tokenError || !tokenRecord || !(tokenRecord as unknown as TokenRecord).active) {
      return NextResponse.json(
        { error: 'Link inválido ou expirado.' },
        { status: 404 }
      )
    }

    const patientId = (tokenRecord as unknown as TokenRecord).patient_id

    // 2. Buscar paciente (apenas campos não-clínicos)
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(
        'id, nome, especie, raca, tutor_nome, data_nascimento, sexo, peso, cor_pelagem'
      )
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Paciente não encontrado.' },
        { status: 404 }
      )
    }

    const patientData = patient as unknown as PatientRecord

    // 3. Buscar agendamentos futuros
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, data, tipo, status')
      .eq('paciente_id', patientId)
      .gte('data', new Date().toISOString())
      .neq('status', 'cancelado')
      .order('data', { ascending: true })
      .limit(10)

    const apptList = (appointments ?? []) as unknown as ApptRecord[]

    // 4. Buscar IDs de appointments do paciente
    const { data: patientAppts } = await supabase
      .from('appointments')
      .select('id, data, tipo')
      .eq('paciente_id', patientId)

    const allAppts = (patientAppts ?? []) as unknown as ApptRecord[]
    const appointmentIds = allAppts.map((a) => a.id)

    // 5. Buscar sessões com fotos
    const { data: sessions } = await supabase
      .from('sessions')
      .select(
        'id, notas_evolucao, foto_urls, peso, created_at, appointment_id'
      )
      .in('appointment_id', appointmentIds)
      .order('created_at', { ascending: false })
      .limit(20)

    const sessionList = (sessions ?? []) as unknown as SessionRecord[]

    // 6. Montar sessões com dados do appointment
    const sessionsWithAppt = sessionList.map((s) => {
      const appt = allAppts.find((a) => a.id === s.appointment_id)
      return {
        id: s.id,
        notas_evolucao: s.notas_evolucao,
        foto_urls: s.foto_urls ?? [],
        peso: s.peso,
        created_at: s.created_at,
        appointment: appt
          ? { data: appt.data, tipo: appt.tipo }
          : null,
      }
    })

    return NextResponse.json({
      patient: patientData,
      upcomingAppointments: apptList,
      sessions: sessionsWithAppt,
      totalSessions: sessionList.length,
    })
  } catch (err) {
    console.error('Erro no portal do tutor:', err)
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    )
  }
}

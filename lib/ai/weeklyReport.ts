import { chat } from '@/lib/ai'
import { createClient } from '@/lib/supabase/client'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
  return _supabase
}

export type WeeklyData = {
  totalAppointments: number
  totalRevenue: number
  fisioCount: number
  clinicoCount: number
  externoCount: number
  uniquePatients: number
  patientNames: string[]
  weekStart: string
  weekEnd: string
  weekNumber: number
  year: number
}

export async function fetchWeeklyData(): Promise<WeeklyData> {
  const sb = await getClient()

  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 7)

  const weekStart = monday.toISOString()
  const weekEnd = sunday.toISOString()

  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const diff = monday.getTime() - startOfYear.getTime()
  const weekNumber = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)

  const { data, error } = await sb
    .from('appointments')
    .select('id, tipo, valor, paciente_id, patients(nome, especie)')
    .eq('status', 'concluido')
    .gte('data', weekStart)
    .lt('data', weekEnd)

  if (error) throw error

  const rows = data as unknown as {
    id: string; tipo: string; valor: number | null; paciente_id: string;
    patients: { nome: string; especie: string } | null
  }[]

  const totalAppointments = rows.length
  const totalRevenue = rows.reduce((sum, a) => sum + (Number(a.valor) || 0), 0)
  const fisioCount = rows.filter((a) => a.tipo === 'fisio').length
  const clinicoCount = rows.filter((a) => a.tipo === 'clinico').length
  const externoCount = rows.filter((a) => a.tipo === 'externo').length

  const patientSet = new Set<string>()
  const patientNames: string[] = []
  rows.forEach((a) => {
    const name = a.patients?.nome
    if (name && !patientSet.has(a.paciente_id)) {
      patientSet.add(a.paciente_id)
      patientNames.push(name)
    }
  })

  return {
    totalAppointments,
    totalRevenue,
    fisioCount,
    clinicoCount,
    externoCount,
    uniquePatients: patientSet.size,
    patientNames,
    weekStart,
    weekEnd,
    weekNumber,
    year: now.getFullYear(),
  }
}

export function buildWeeklyPrompt(data: WeeklyData): string {
  const startStr = new Date(data.weekStart).toLocaleDateString('pt-BR')
  const endStr = new Date(data.weekEnd).toLocaleDateString('pt-BR')

  return `Relatório semanal da clínica veterinária:

Período: ${startStr} a ${endStr} (Semana ${data.weekNumber})

📊 Resumo:
- Total de atendimentos concluídos: ${data.totalAppointments}
- Faturamento total: R$ ${data.totalRevenue.toFixed(2)}
- Fisioterapia: ${data.fisioCount}
- Clínico: ${data.clinicoCount}
- Domiciliar: ${data.externoCount}
- Pacientes únicos: ${data.uniquePatients}
- Pacientes atendidos: ${data.patientNames.join(', ')}

Gere um relatório semanal profissional e motivador em português brasileiro para o veterinário. Destaque os principais números, dê insights sobre a semana e sugira um foco para a próxima semana. Seja objetivo — no máximo 3 parágrafos curtos.`
}

export async function generateWeeklyReport(): Promise<string> {
  const data = await fetchWeeklyData()
  const prompt = buildWeeklyPrompt(data)
  const systemPrompt = 'Você é um analista de clínica veterinária. Gere relatórios semanais objetivos, motivadores e em português brasileiro.'
  return chat(prompt, systemPrompt)
}

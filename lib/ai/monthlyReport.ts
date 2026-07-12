import { chat } from '@/lib/ai'
import { createClient } from '@/lib/supabase/client'

let _supabase: Awaited<ReturnType<typeof createClient>> | null = null
async function getClient() {
  if (!_supabase) _supabase = await createClient()
  return _supabase
}

export type MonthlyData = {
  monthLabel: string
  year: number
  month: number
  totalAppointments: number
  totalRevenue: number
  fisioCount: number
  clinicoCount: number
  externoCount: number
  uniquePatients: number
  patientNames: string[]
  monthStart: string
  monthEnd: string
}

/** Retorna o primeiro e último dia de um mês relativo a uma data de referência.
 *  offset 0 = mês da referência; offset 1 = mês anterior; etc. */
export function getMonthRange(ref: Date, offset = 1): { start: Date; end: Date } {
  const base = new Date(ref.getFullYear(), ref.getMonth() - offset, 1)
  const start = new Date(base.getFullYear(), base.getMonth(), 1, 0, 0, 0, 0)
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function fetchMonthlyData(ref: Date = new Date(), offset = 1): Promise<MonthlyData> {
  const sb = await getClient()
  const { start, end } = getMonthRange(ref, offset)

  const { data, error } = await sb
    .from('appointments')
    .select('id, tipo, valor, paciente_id, patients(nome, especie)')
    .eq('status', 'concluido')
    .gte('data', start.toISOString())
    .lt('data', end.toISOString())

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

  const monthLabel = start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return {
    monthLabel,
    year: start.getFullYear(),
    month: start.getMonth() + 1,
    totalAppointments,
    totalRevenue,
    fisioCount,
    clinicoCount,
    externoCount,
    uniquePatients: patientSet.size,
    patientNames,
    monthStart: start.toISOString(),
    monthEnd: end.toISOString(),
  }
}

export function buildMonthlyPrompt(data: MonthlyData): string {
  const startStr = new Date(data.monthStart).toLocaleDateString('pt-BR')
  const endStr = new Date(data.monthEnd).toLocaleDateString('pt-BR')

  return `Relatório mensal da clínica veterinária:

Período: ${startStr} a ${endStr} (${data.monthLabel})

📊 Resumo:
- Total de atendimentos concluídos: ${data.totalAppointments}
- Faturamento total: R$ ${data.totalRevenue.toFixed(2)}
- Fisioterapia: ${data.fisioCount}
- Clínico: ${data.clinicoCount}
- Domiciliar: ${data.externoCount}
- Pacientes únicos: ${data.uniquePatients}
- Pacientes atendidos: ${data.patientNames.join(', ')}

Gere um relatório mensal profissional e analítico em português brasileiro para o veterinário. Destaque os principais números, compare com a expectativa de um mês típico, dê insights sobre a sazonalidade e sugira um foco para o próximo mês. Seja objetivo — no máximo 4 parágrafos curtos.`
}

export async function generateMonthlyReport(ref: Date = new Date(), offset = 1): Promise<string> {
  const data = await fetchMonthlyData(ref, offset)
  const prompt = buildMonthlyPrompt(data)
  const systemPrompt = 'Você é um analista de clínica veterinária. Gere relatórios mensais objetivos, analíticos e em português brasileiro.'
  return chat(prompt, systemPrompt)
}

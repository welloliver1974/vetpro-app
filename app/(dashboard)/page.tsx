'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useAppointments } from '@/hooks/useAppointments'
import { usePeriodSummary, usePeriodSessions, usePeriodDailyRevenue } from '@/hooks/useFinances'
import { useChat } from '@/hooks/useAi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, CalendarDays, Activity, DollarSign, Plus, Loader2, Sparkles, Brain, PieChart, BarChart3, TrendingUp } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import Link from 'next/link'

const RePieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false })
const Pie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false })

type PeriodKey = '7d' | '30d' | 'custom'

const periods: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'custom', label: 'Personalizado' },
]

const typeLabels: Record<string, string> = {
  fisio: 'Fisioterapia',
  clinico: 'Clínico',
  externo: 'Externo',
}

const typeBadge = (tipo: string) => {
  const styles: Record<string, string> = {
    fisio: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    externo: 'bg-amber-950 text-amber-400 border border-amber-800',
    clinico: 'bg-blue-950 text-blue-400 border border-blue-800',
  }
  return styles[tipo] || ''
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']

const paymentLabels: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  nao_informado: 'Outros',
}

function useDateRange(period: PeriodKey): { start: string; end: string } {
  return useMemo(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    if (period === '7d') start.setDate(start.getDate() - 6)
    else if (period === '30d') start.setDate(start.getDate() - 29)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [period])
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>('7d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const { start, end } = useDateRange(period)

  const effectiveStart = period === 'custom' && customStart ? new Date(customStart).toISOString() : start
  const effectiveEnd = period === 'custom' && customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : end
  const hasCustomRange = period === 'custom' && !!customStart && !!customEnd

  const queryStart = hasCustomRange ? effectiveStart : start
  const queryEnd = hasCustomRange ? effectiveEnd : end

  const { data: appointments, isLoading: loadingApps } = useAppointments()
  const { data: periodSummary, isLoading: loadingFinance } = usePeriodSummary(queryStart, queryEnd)
  const { data: periodSessions, isLoading: loadingSessions } = usePeriodSessions(queryStart, queryEnd)
  const { data: dailyRevenue, isLoading: loadingRevenue } = usePeriodDailyRevenue(queryStart, queryEnd)
  const chatAi = useChat()
  const [aiInsight, setAiInsight] = useState<string | null>(null)

  const todayApps = appointments?.filter((a) =>
    isSameDay(parseISO(a.data), new Date())
  ) ?? []

  const pieData = periodSummary?.methods
    ? Object.entries(periodSummary.methods)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: paymentLabels[key] || key,
          value,
        }))
    : []

  const periodLabel = period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : 'Personalizado'

  async function generateInsight() {
    const resumo = todayApps.map((a) =>
      `- ${format(parseISO(a.data), 'HH:mm')} | ${a.patients?.nome || '---'} | ${a.tipo === 'fisio' ? 'Fisioterapia' : a.tipo === 'externo' ? 'Externo' : 'Clínico'} | ${a.status === 'concluido' ? 'Concluído' : a.status === 'em_andamento' ? 'Em andamento' : 'Agendado'}${a.valor ? ` | R$ ${a.valor}` : ''}`
    ).join('\n')

    try {
      const insight = await chatAi.generate(
        `Resumo do dia no consultório veterinário:\n\n${resumo}\n\nFaturamento: R$ ${periodSummary?.total.toFixed(2) || '0,00'}\n\nGere um insight curto e profissional sobre o dia, destacando padrões e sugestões.`,
        'Você é um analista de clínica veterinária. Seja objetivo e prático.'
      )
      setAiInsight(insight)
    } catch {
      // silent
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Painel VetPro</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de atendimentos e fisioterapia</p>
        </div>
        <Link href="/agenda">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full sm:w-auto items-center justify-center gap-2">
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </Link>
      </div>

      {/* Period Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <span className="text-xs font-medium text-muted-foreground">Período:</span>
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-card-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">De</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="h-8 w-36 bg-muted border-border text-card-foreground text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Até</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="h-8 w-36 bg-muted border-border text-card-foreground text-xs" />
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos ({periodLabel})</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loadingFinance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-card-foreground">{periodSummary?.count ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">concluído(s)</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões de Fisio ({periodLabel})</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingFinance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-card-foreground">{periodSummary?.fisioCount ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">no período</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento ({periodLabel})</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loadingFinance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-card-foreground">
                  R$ {periodSummary?.total.toFixed(2) ?? '0,00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{periodSummary?.count ?? 0} atendimento(s)</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Payment Methods Pie */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4 text-blue-500" /> Formas de Pagamento ({periodLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFinance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : pieData.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <PieChart className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Nenhum dado no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RePieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
            {pieData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {pieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    {item.name}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sessions Bar */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Sessões por Dia ({periodLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : !periodSessions || periodSessions.every((d) => d.count === 0) ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Nenhuma sessão no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={periodSessions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Line Chart */}
        <Card className="min-w-0 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Receita Diária ({periodLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : !dailyRevenue || dailyRevenue.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">Nenhuma receita no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }}
                    tickFormatter={(v) => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
                  />
                  <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2}
                    dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Card */}
      <Card className="mb-8 min-w-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-500" /> Insight do Dia
          </CardTitle>
          <Button
            variant="ghost"
            size="xs"
            disabled={chatAi.loading || todayApps.length === 0}
            onClick={generateInsight}
            className="text-blue-400 hover:text-blue-300 gap-1"
          >
            {chatAi.loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {chatAi.loading ? 'Analisando...' : 'Gerar Insight'}
          </Button>
        </CardHeader>
        <CardContent>
          {aiInsight ? (
            <p className="text-sm text-card-foreground whitespace-pre-wrap">{aiInsight}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {todayApps.length === 0
                ? 'Sem atendimentos hoje para analisar.'
                : 'Clique em "Gerar Insight" para um resumo inteligente do dia.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Today's Agenda */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-card-foreground">Agenda de Hoje</h2>
          <Link href="/agenda" className="text-sm text-blue-400 hover:text-blue-300 self-start sm:self-auto">
            Ver todas
          </Link>
        </div>

        {loadingApps ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : todayApps.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum atendimento hoje"
            description="Não há atendimentos agendados para hoje."
          />
        ) : (
          <div className="grid gap-3">
            {todayApps.map((app) => (
              <Card key={app.id} className="hover:border-border/80 transition-colors">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                     <div className="flex items-center gap-4 min-w-0">
                       <div className="text-lg font-bold text-blue-400 min-w-[50px] shrink-0">
                         {format(parseISO(app.data), 'HH:mm')}
                       </div>
                       <div className="min-w-0 overflow-hidden">
                         <div className="flex items-center gap-2">
                           <span className="font-semibold text-card-foreground truncate">{app.patients?.nome || '---'}</span>
                           <Badge variant="outline" className={`text-[10px] shrink-0 ${typeBadge(app.tipo)}`}>
                             {typeLabels[app.tipo]}
                           </Badge>
                         </div>
                         {app.valor && (
                           <p className="text-xs text-muted-foreground mt-1">R$ {Number(app.valor).toFixed(2)}</p>
                         )}
                       </div>
                     </div>

                     <span className={`text-xs px-2 py-1 rounded shrink-0 ${
                       app.status === 'concluido' ? 'bg-muted text-muted-foreground' :
                       app.status === 'agendado' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                       'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                     }`}>
                       {app.status === 'concluido' ? 'Concluído' :
                        app.status === 'em_andamento' ? 'Em Andamento' : 'Agendado'}
                     </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

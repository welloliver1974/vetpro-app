'use client'

import { useAppointments } from '@/hooks/useAppointments'
import { useTodaySummary, useMonthPaymentMethods, useWeekSessions } from '@/hooks/useFinances'
import { useChat } from '@/hooks/useAi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Activity, DollarSign, Plus, Loader2, Sparkles, Brain, PieChart, BarChart3 } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import { PieChart as RePieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

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

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b']

const paymentLabels: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  nao_informado: 'Outros',
}

export default function DashboardPage() {
  const { data: appointments, isLoading: loadingApps } = useAppointments()
  const { data: todaySummary, isLoading: loadingFinance } = useTodaySummary()
  const { data: monthMethods, isLoading: loadingMethods } = useMonthPaymentMethods()
  const { data: weekData, isLoading: loadingWeek } = useWeekSessions()
  const chatAi = useChat()
  const [aiInsight, setAiInsight] = useState<string | null>(null)

  const todayApps = appointments?.filter((a) =>
    isSameDay(parseISO(a.data), new Date())
  ) ?? []

  const todayFisio = todayApps.filter((a) => a.tipo === 'fisio').length

  const pieData = monthMethods
    ? Object.entries(monthMethods)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({
          name: paymentLabels[key] || key,
          value,
        }))
    : []

  async function generateInsight() {
    const resumo = todayApps.map((a) =>
      `- ${format(parseISO(a.data), 'HH:mm')} | ${a.patients?.nome || '---'} | ${a.tipo === 'fisio' ? 'Fisioterapia' : a.tipo === 'externo' ? 'Externo' : 'Clínico'} | ${a.status === 'concluido' ? 'Concluído' : a.status === 'em_andamento' ? 'Em andamento' : 'Agendado'}${a.valor ? ` | R$ ${a.valor}` : ''}`
    ).join('\n')

    try {
      const insight = await chatAi.generate(
        `Resumo do dia no consultório veterinário:\n\n${resumo}\n\nFaturamento: R$ ${todaySummary?.total.toFixed(2) || '0,00'}\n\nGere um insight curto e profissional sobre o dia, destacando padrões e sugestões.`,
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel VetPro</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de atendimentos e fisioterapia</p>
        </div>
        <Link href="/agenda">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos Hoje</CardTitle>
            <CalendarIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-card-foreground">{todayApps.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayApps.filter((a) => a.status === 'concluido').length} concluído(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sessões de Fisio</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-card-foreground">{todayFisio}</div>
                <p className="text-xs text-muted-foreground mt-1">hoje</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loadingFinance ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold text-card-foreground">
                  R$ {todaySummary?.total.toFixed(2) ?? '0,00'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{todaySummary?.count ?? 0} atendimento(s)</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        {/* Payment Methods Pie */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PieChart className="h-4 w-4 text-blue-500" /> Formas de Pagamento (Mês)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMethods ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : pieData.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhum dado no mês</p>
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

        {/* Weekly Sessions Bar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" /> Sessões por Dia (Semana)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingWeek ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : !weekData || weekData.every((d) => d.count === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma sessão esta semana</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekData}>
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
      </div>

      {/* AI Insight Card */}
      <Card className="mb-8">
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-card-foreground">Agenda de Hoje</h2>
          <Link href="/agenda" className="text-sm text-blue-400 hover:text-blue-300">
            Ver todas
          </Link>
        </div>

        {loadingApps ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : todayApps.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Nenhum atendimento agendado para hoje
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {todayApps.map((app) => (
              <Card key={app.id} className="hover:border-border/80 transition-colors">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-blue-400 min-w-[50px]">
                      {format(parseISO(app.data), 'HH:mm')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-card-foreground">{app.patients?.nome || '---'}</span>
                        <Badge variant="outline" className={`text-[10px] ${typeBadge(app.tipo)}`}>
                          {typeLabels[app.tipo]}
                        </Badge>
                      </div>
                      {app.valor && (
                        <p className="text-xs text-muted-foreground mt-1">R$ {Number(app.valor).toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${
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
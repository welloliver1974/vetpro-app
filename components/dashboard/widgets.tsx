'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import { CalendarDays, Activity, DollarSign, PieChart, BarChart3, TrendingUp, Brain, Sparkles, Loader2, CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import Link from 'next/link'

const RePieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false })
const RePie = dynamic(() => import('recharts').then((mod) => mod.Pie), { ssr: false })
const Cell = dynamic(() => import('recharts').then((mod) => mod.Cell), { ssr: false })
const ReTooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false })
const Bar = dynamic(() => import('recharts').then((mod) => mod.Bar), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false })
const LineChart = dynamic(() => import('recharts').then((mod) => mod.LineChart), { ssr: false })
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false })

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

/* ─── Summary ─── */

interface SummaryProps {
  periodSummary: { count: number; fisioCount: number; total: number } | undefined
  loadingFinance: boolean
}

export function SummaryWidget({ periodSummary, loadingFinance }: SummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Atendimentos</CardTitle>
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

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Sessões de Fisio</CardTitle>
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

      <Card className="min-w-0">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
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
  )
}

/* ─── Payment Methods Pie Chart ─── */

interface PaymentMethodsProps {
  pieData: { name: string; value: number }[]
  loadingFinance: boolean
}

export function PaymentMethodsChartWidget({ pieData, loadingFinance }: PaymentMethodsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <PieChart className="h-4 w-4 text-blue-500" /> Formas de Pagamento
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
              <RePie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </RePie>
              <ReTooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => `R$ ${Number(value ?? 0).toFixed(2)}`}
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
  )
}

/* ─── Sessions Bar Chart ─── */

interface SessionsProps {
  periodSessions: { day: string; count: number }[] | undefined
  loadingSessions: boolean
}

export function SessionsChartWidget({ periodSessions, loadingSessions }: SessionsProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-500" /> Sessões por Dia
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
              <ReTooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── Revenue Line Chart ─── */

interface RevenueProps {
  dailyRevenue: { day: string; total: number }[] | undefined
  loadingRevenue: boolean
}

export function RevenueChartWidget({ dailyRevenue, loadingRevenue }: RevenueProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" /> Receita Diária
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
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#334155' }}
                tickFormatter={(v: number) => `R$${v}`}
              />
              <ReTooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => `R$ ${Number(value ?? 0).toFixed(2)}`}
              />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/* ─── AI Insight ─── */

interface InsightProps {
  todayApps: { data: string; patients?: { nome: string } | null; tipo: string; status: string; valor: number | null }[]
  aiInsight: string | null
  chatAi: { loading: boolean; generate: (prompt: string, system?: string) => Promise<string> }
  onGenerate: () => void
}

export function InsightWidget({ todayApps, aiInsight, chatAi, onGenerate }: InsightProps) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Brain className="h-4 w-4 text-blue-500" /> Insight do Dia
        </CardTitle>
        <Button
          variant="ghost"
          size="xs"
          disabled={chatAi.loading || todayApps.length === 0}
          onClick={onGenerate}
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
  )
}

/* ─── Agenda Today ─── */

interface AgendaTodayProps {
  todayApps: {
    id: string
    data: string
    tipo: string
    status: string
    valor: number | null
    patients?: { nome: string } | null
  }[]
  loadingApps: boolean
}

export function AgendaTodayWidget({ todayApps, loadingApps }: AgendaTodayProps) {
  return (
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
  )
}

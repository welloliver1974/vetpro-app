'use client'

import { useAppointments } from '@/hooks/useAppointments'
import { useTodaySummary } from '@/hooks/useFinances'
import { useChat } from '@/hooks/useAi'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarIcon, Activity, DollarSign, Plus, Loader2, Sparkles, Brain } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'

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

export default function DashboardPage() {
  const { data: appointments, isLoading: loadingApps } = useAppointments()
  const { data: todaySummary, isLoading: loadingFinance } = useTodaySummary()
  const chatAi = useChat()
  const [aiInsight, setAiInsight] = useState<string | null>(null)

  const todayApps = appointments?.filter((a) =>
    isSameDay(parseISO(a.data), new Date())
  ) ?? []

  const todayFisio = todayApps.filter((a) => a.tipo === 'fisio').length

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
      // silent - user sees nothing
    }
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel VetPro</h1>
          <p className="text-sm text-slate-400">Gerenciamento de atendimentos e fisioterapia</p>
        </div>
        <Link href="/agenda">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo Atendimento
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Atendimentos Hoje</CardTitle>
            <CalendarIcon className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-100">{todayApps.length}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {todayApps.filter((a) => a.status === 'concluido').length} concluído(s)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Sessões de Fisio</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingApps ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-100">{todayFisio}</div>
                <p className="text-xs text-slate-500 mt-1">hoje</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-slate-400">Faturamento Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loadingFinance ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            ) : (
              <>
                <div className="text-2xl font-bold text-slate-100">
                  R$ {todaySummary?.total.toFixed(2) ?? '0,00'}
                </div>
                <p className="text-xs text-slate-500 mt-1">{todaySummary?.count ?? 0} atendimento(s)</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insight Card */}
      <Card className="bg-slate-900 border-slate-800 mb-8">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-500" /> Insight do Dia
          </CardTitle>
          <Button
            variant="ghost"
            size="xs"
            disabled={chatAi.loading || todayApps.length === 0}
            onClick={generateInsight}
            className="text-indigo-400 hover:text-indigo-300 gap-1"
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
            <p className="text-sm text-slate-200 whitespace-pre-wrap">{aiInsight}</p>
          ) : (
            <p className="text-xs text-slate-500">
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
          <h2 className="text-xl font-semibold tracking-tight text-slate-200">Agenda de Hoje</h2>
          <Link href="/agenda" className="text-sm text-indigo-400 hover:text-indigo-300">
            Ver todas
          </Link>
        </div>

        {loadingApps ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : todayApps.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center text-slate-500">
              Nenhum atendimento agendado para hoje
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {todayApps.map((app) => (
              <Card key={app.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold text-indigo-400 min-w-[50px]">
                      {format(parseISO(app.data), 'HH:mm')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{app.patients?.nome || '---'}</span>
                        <Badge variant="outline" className={`text-[10px] ${typeBadge(app.tipo)}`}>
                          {typeLabels[app.tipo]}
                        </Badge>
                      </div>
                      {app.valor && (
                        <p className="text-xs text-slate-500 mt-1">R$ {Number(app.valor).toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <span className={`text-xs px-2 py-1 rounded ${
                    app.status === 'concluido' ? 'bg-slate-800 text-slate-400' :
                    app.status === 'agendado' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
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

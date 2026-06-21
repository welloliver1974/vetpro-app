'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useCompletedAppointments, useTodaySummary, useMonthSummary, useCostSummary, usePeriodDailyRevenue, useRevenueByMonth } from '@/hooks/useFinances'
import { useMyClinic } from '@/hooks/useClinic'
import { useMonthlyGoals, useUpsertMonthlyGoal, useDeleteMonthlyGoal } from '@/hooks/useMonthlyGoals'
import { ReceiptPDF } from '@/components/vet/ReceiptPDF'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/EmptyState'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, DollarSign, TrendingUp, CalendarDays, Download, Receipt, Target, Pencil, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
)
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false })
const CartesianGrid = dynamic(() => import('recharts').then((mod) => mod.CartesianGrid), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(() => import('recharts').then((mod) => mod.ResponsiveContainer), { ssr: false })

const methodLabels: Record<string, string> = {
  pix: 'Pix',
  cartao: 'Cartão',
  dinheiro: 'Dinheiro',
  nao_informado: 'Não informado',
}

const methodColors: Record<string, string> = {
  pix: 'bg-green-950 text-green-400 border-green-800',
  cartao: 'bg-blue-950 text-blue-400 border-blue-800',
  dinheiro: 'bg-amber-950 text-amber-400 border-amber-800',
  nao_informado: 'bg-muted text-muted-foreground border-border',
}

export default function FinanceiroPage() {
  const { data: completed, isLoading } = useCompletedAppointments()
  const { data: today } = useTodaySummary()
  const { data: month } = useMonthSummary()
  const { data: costs } = useCostSummary()
  const { data: clinic } = useMyClinic()
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const chartRange = useMemo(() => {
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    if (chartPeriod === '7d') start.setDate(start.getDate() - 6)
    else if (chartPeriod === '30d') start.setDate(start.getDate() - 29)
    else start.setDate(start.getDate() - 89)
    return { start: start.toISOString(), end: end.toISOString() }
  }, [chartPeriod])

  const { data: dailyRevenue, isLoading: loadingRevenue } = usePeriodDailyRevenue(chartRange.start, chartRange.end)

  const { data: goals } = useMonthlyGoals()
  const { data: revenueByMonth } = useRevenueByMonth()
  const upsertGoal = useUpsertMonthlyGoal()
  const deleteGoal = useDeleteMonthlyGoal()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentGoal = goals?.find((g) => g.mes === currentMonth && g.ano === currentYear)

  function revenueForMonth(mes: number, ano: number) {
    return revenueByMonth?.find((r) => r.mes === mes && r.ano === ano)?.total ?? 0
  }

  function progressPct(mes: number, ano: number, goal: number) {
    if (!goal) return 0
    const rev = revenueForMonth(mes, ano)
    return Math.min(100, Math.round((rev / goal) * 100))
  }

  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [goalEdit, setGoalEdit] = useState({ mes: currentMonth, ano: currentYear, valor_meta: 0 })

  function openNewGoal() {
    setGoalEdit({ mes: currentMonth, ano: currentYear, valor_meta: currentGoal?.valor_meta ?? 0 })
    setGoalDialogOpen(true)
  }

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

  const [page, setPage] = useState(1)
  const perPage = 15

  const totalGeral = completed?.reduce((sum, a) => sum + (Number(a.valor) || 0), 0) ?? 0
  const totalPages = Math.max(1, Math.ceil((completed?.length || 0) / perPage))
  const paginated = completed?.slice((page - 1) * perPage, page * perPage) ?? []

  function exportCSV() {
    if (!completed?.length) return
    const headers = ['Data', 'Paciente', 'Tipo', 'Pagamento', 'Valor']
    const rows = completed.map((a) => [
      format(parseISO(a.data), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      a.patients?.nome || '---',
      a.tipo === 'fisio' ? 'Fisioterapia' : a.tipo === 'externo' ? 'Externo' : 'Clínico',
      a.forma_pagamento ? (a.forma_pagamento === 'pix' ? 'Pix' : a.forma_pagamento === 'cartao' ? 'Cartão' : 'Dinheiro') : '-',
      `R$ ${Number(a.valor || 0).toFixed(2)}`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `financeiro-vetpro-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Resumo de faturamento e histórico de pagamentos</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              R$ {today?.total.toFixed(2) ?? '0,00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{today?.count ?? 0} atendimento(s)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mês</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              R$ {month?.total.toFixed(2) ?? '0,00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{month?.count ?? 0} atendimento(s)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Geral</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              R$ {totalGeral.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{completed?.length ?? 0} atendimento(s)</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custos Totais</CardTitle>
            <Receipt className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              R$ {costs?.custo_total.toFixed(2) ?? '0,00'}
            </div>
            <p className="text-xs mt-1">
              <span className={costs && costs.margem_total >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                Margem: R$ {costs?.margem_total.toFixed(2) ?? '0,00'}
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Goals */}
      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Metas Mensais
            </CardTitle>
            <Button variant="outline" size="xs" onClick={openNewGoal}
              className="border-border text-muted-foreground gap-1.5">
              <Target className="h-3.5 w-3.5" /> Definir Meta
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current month */}
            {(() => {
              const goal = currentGoal?.valor_meta ?? 0
              const attained = month?.total ?? 0
              const pct = progressPct(currentMonth, currentYear, goal)
              return (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-card-foreground">
                      {monthNames[currentMonth - 1]} / {currentYear}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      R$ {attained.toFixed(2)} de R$ {goal.toFixed(2)}
                    </span>
                  </div>
                  {goal > 0 ? (
                    <>
                      <div className="w-full bg-muted rounded-full h-3 mb-1">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-primary' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className={pct >= 100 ? 'text-emerald-400' : 'text-muted-foreground'}>
                          {pct}%{pct >= 100 ? ' — Meta atingida! 🎉' : ''}
                        </span>
                        <span className="text-muted-foreground">100%</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground py-1">
                      Nenhuma meta definida para este mês.
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Past months with goals */}
            {goals && goals.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Metas Anteriores</p>
                <div className="space-y-2">
                  {goals
                    .filter((g) => g.ano < currentYear || (g.ano === currentYear && g.mes < currentMonth))
                    .slice(0, 6)
                    .map((g) => {
                      const attained = revenueForMonth(g.mes, g.ano)
                      const pct = progressPct(g.mes, g.ano, g.valor_meta)
                      return (
                        <div key={g.id} className="flex items-center gap-3 text-xs">
                          <span className="w-24 text-card-foreground">{monthNames[g.mes - 1]} / {g.ano}</span>
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-primary' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-muted-foreground">R$ {attained.toFixed(0)}</span>
                          <span className={`w-12 text-right ${pct >= 100 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                            {pct}%
                          </span>
                          <button
                            onClick={() => {
                              setGoalEdit({ mes: g.mes, ano: g.ano, valor_meta: g.valor_meta })
                              setGoalDialogOpen(true)
                            }}
                            className="text-muted-foreground hover:text-card-foreground"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteGoal.mutate(g.id)}
                            className="text-muted-foreground hover:text-red-400"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Line Chart */}
      <Card className="bg-card border-border mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" /> Receita ao Longo do Tempo
            </CardTitle>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['7d', '30d', '90d'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                    chartPeriod === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-card-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRevenue ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !dailyRevenue || dailyRevenue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nenhuma receita no período</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
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

      {/* Payment Methods Today */}
      {today && today.methods && Object.keys(today.methods).length > 0 ? (
        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Formas de Pagamento (Hoje)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(today.methods).map(([method, value]) => (
                <div key={method} className="flex items-center gap-2">
                  <Badge variant="outline" className={methodColors[method] || methodColors.nao_informado}>
                    {methodLabels[method] || method}
                  </Badge>
                  <span className="text-sm text-foreground">R$ {value.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="Nenhuma forma de pagamento hoje"
          description="Quando houver atendimentos concluídos hoje, as formas de pagamento aparecerão aqui."
          className="mb-8"
        />
      )}

      {/* History Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Histórico de Atendimentos</CardTitle>
            {completed && completed.length > 0 && (
              <Button variant="outline" size="xs" onClick={exportCSV}
                className="border-border text-muted-foreground gap-1.5">
                <Download className="h-3.5 w-3.5" /> Exportar CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : completed?.length ? (
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground">Paciente</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Pagamento</TableHead>
                <TableHead className="text-muted-foreground text-right">Valor</TableHead>
                <TableHead className="text-muted-foreground text-right w-20">Recibo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((app) => (
                <TableRow key={app.id} className="border-border hover:bg-muted/50">
                  <TableCell className="text-foreground">
                    {format(parseISO(app.data), "dd/MM/yyyy 'às' HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium text-card-foreground">
                    {app.patients?.nome || '---'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className={
                      app.tipo === 'fisio' ? 'border-emerald-800 text-emerald-400' :
                      app.tipo === 'externo' ? 'border-amber-800 text-amber-400' :
                      'border-blue-800 text-blue-400'
                    }>
                      {app.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {app.forma_pagamento ? (
                      <Badge variant="outline" className={methodColors[app.forma_pagamento]}>
                        {methodLabels[app.forma_pagamento]}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-card-foreground">
                    R$ {Number(app.valor || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReceiptPDF appointment={app} clinic={clinic ?? undefined} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Receipt}
                title="Nenhum atendimento concluído"
                description="Finalize atendimentos para gerar o histórico financeiro e acompanhar faturamento."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, completed?.length || 0)} de {completed?.length || 0}
          </p>
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage(page - 1)}
              className="border-border text-muted-foreground">
              Anterior
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="xs"
                onClick={() => setPage(p)}
                className={p === page ? 'bg-primary text-white' : 'border-border text-muted-foreground'}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
              className="border-border text-muted-foreground">
              Próximo
            </Button>
          </div>
        </div>
      )}

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Definir Meta Mensal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-muted-foreground text-xs">Mês</Label>
                <select
                  value={goalEdit.mes}
                  onChange={(e) => setGoalEdit({ ...goalEdit, mes: Number(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm text-card-foreground"
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx + 1}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-muted-foreground text-xs">Ano</Label>
                <select
                  value={goalEdit.ano}
                  onChange={(e) => setGoalEdit({ ...goalEdit, ano: Number(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm text-card-foreground"
                >
                  {Array.from({ length: 10 }, (_, i) => currentYear - 3 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-muted-foreground text-xs">Valor da Meta (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={goalEdit.valor_meta || ''}
                onChange={(e) => setGoalEdit({ ...goalEdit, valor_meta: Number(e.target.value) })}
                className="border-border text-card-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGoalDialogOpen(false)}
              className="border-border text-muted-foreground">
              Cancelar
            </Button>
            <Button size="sm" onClick={() => {
              upsertGoal.mutate(goalEdit, {
                onSuccess: () => setGoalDialogOpen(false),
              })
            }} disabled={upsertGoal.isPending}>
              {upsertGoal.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

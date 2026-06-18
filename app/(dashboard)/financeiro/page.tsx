'use client'

import { useState } from 'react'
import { useCompletedAppointments, useTodaySummary, useMonthSummary, useCostSummary } from '@/hooks/useFinances'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, TrendingUp, CalendarDays, Download, Receipt } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
      <div className="grid gap-4 md:grid-cols-4 mb-8">
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
            <CalendarDays className="h-4 w-4 text-indigo-500" />
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

      {/* Payment Methods Today */}
      {today && today.methods && Object.keys(today.methods).length > 0 && (
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
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground">Paciente</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Tipo</TableHead>
                <TableHead className="text-muted-foreground">Pagamento</TableHead>
                <TableHead className="text-muted-foreground text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : !completed?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum atendimento concluído
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((app) => (
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * perPage + 1}-{Math.min(page * perPage, completed?.length || 0)} de {completed?.length || 0}
          </p>
          <div className="flex gap-1">
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
    </div>
  )
}

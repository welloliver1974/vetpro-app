'use client'

import { useMemo, useState, useEffect } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { useAppointments } from '@/hooks/useAppointments'
import { usePeriodSummary, usePeriodSessions, usePeriodDailyRevenue } from '@/hooks/useFinances'
import { useChat } from '@/hooks/useAi'
import { useDashboardLayout, type WidgetId, WIDGET_LABELS } from '@/hooks/useDashboardLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WidgetWrapper } from '@/components/dashboard/WidgetWrapper'
import {
  SummaryWidget,
  PaymentMethodsChartWidget,
  SessionsChartWidget,
  RevenueChartWidget,
  InsightWidget,
  AgendaTodayWidget,
} from '@/components/dashboard/widgets'
import { Plus, Settings, RotateCcw } from 'lucide-react'
import { format, parseISO, isSameDay } from 'date-fns'
import Link from 'next/link'
import { useWeeklyReportTrigger } from '@/hooks/useWeeklyReport'
import { useMonthlyReportTrigger } from '@/hooks/useMonthlyReport'

type PeriodKey = '7d' | '30d' | 'custom'

const periods: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'custom', label: 'Personalizado' },
]

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

  const {
    visibleWidgets,
    hiddenWidgets,
    toggleWidget,
    moveWidget,
    resetLayout,
    isEditMode,
    setEditMode,
  } = useDashboardLayout()

  const { triggerCheck } = useWeeklyReportTrigger()
  const { triggerCheck: triggerMonthlyCheck } = useMonthlyReportTrigger()

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

  useEffect(() => {
    triggerCheck()
    triggerMonthlyCheck()
    const interval = setInterval(() => {
      triggerCheck()
      triggerMonthlyCheck()
    }, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      moveWidget(String(active.id), String(over.id))
    }
  }

  const widgetData: Record<WidgetId, object> = {
    summary: { periodSummary, loadingFinance },
    'payment-methods': { pieData, loadingFinance },
    sessions: { periodSessions, loadingSessions },
    revenue: { dailyRevenue, loadingRevenue },
    insight: { todayApps, aiInsight, chatAi, onGenerate: generateInsight },
    'agenda-today': { todayApps, loadingApps },
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Painel VetPro</h1>
          <p className="text-sm text-muted-foreground">Gerenciamento de atendimentos e fisioterapia</p>
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button variant="outline" size="sm" onClick={resetLayout} className="gap-1">
              <RotateCcw className="h-4 w-4" /> Restaurar
            </Button>
          )}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEditMode(!isEditMode)}
            className="gap-1"
          >
            <Settings className="h-4 w-4" /> {isEditMode ? 'Concluir' : 'Personalizar'}
          </Button>
          <Link href="/agenda">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 flex w-full sm:w-auto items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> Novo Atendimento
            </Button>
          </Link>
        </div>
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

      {/* Hidden Widgets Banner (edit mode) */}
      {isEditMode && hiddenWidgets.length > 0 && (
        <div className="mb-6 p-3 rounded-lg bg-muted border border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Widgets ocultos ({hiddenWidgets.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map((id) => (
              <button
                key={id}
                onClick={() => toggleWidget(id)}
                className="text-xs px-2 py-1 rounded bg-background border border-border text-muted-foreground hover:text-card-foreground hover:border-primary/50 transition-colors"
              >
                + {WIDGET_LABELS[id]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DnD Widget Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets} strategy={rectSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleWidgets.map((id) => {
              const Component = widgetComponents[id]
              return (
                <WidgetWrapper key={id} id={id} isEditMode={isEditMode} onToggle={toggleWidget}>
                  <Component {...widgetData[id]} />
                </WidgetWrapper>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const widgetComponents: Record<WidgetId, React.ComponentType<any>> = {
  summary: SummaryWidget,
  'payment-methods': PaymentMethodsChartWidget,
  sessions: SessionsChartWidget,
  revenue: RevenueChartWidget,
  insight: InsightWidget,
  'agenda-today': AgendaTodayWidget,
}

'use client'

import { useState, useCallback, useEffect } from 'react'

export type WidgetId =
  | 'summary'
  | 'payment-methods'
  | 'sessions'
  | 'revenue'
  | 'insight'
  | 'agenda-today'

export const DEFAULT_WIDGETS: WidgetId[] = [
  'summary',
  'payment-methods',
  'sessions',
  'revenue',
  'insight',
  'agenda-today',
]

export const WIDGET_LABELS: Record<WidgetId, string> = {
  summary: 'Resumo do Período',
  'payment-methods': 'Formas de Pagamento',
  sessions: 'Sessões por Dia',
  revenue: 'Receita Diária',
  insight: 'Insight do Dia',
  'agenda-today': 'Agenda de Hoje',
}

export const WIDGET_SPANS: Record<WidgetId, string> = {
  summary: 'md:col-span-2',
  'payment-methods': 'md:col-span-1',
  sessions: 'md:col-span-1',
  revenue: 'md:col-span-2',
  insight: 'md:col-span-2',
  'agenda-today': 'md:col-span-2',
}

interface DashboardLayout {
  order: WidgetId[]
  hidden: WidgetId[]
}

const STORAGE_KEY = 'vetpro-dashboard-layout'

function saveLayout(layout: DashboardLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch { /* noop */ }
}

function loadLayout(): DashboardLayout {
  if (typeof window === 'undefined') return { order: [...DEFAULT_WIDGETS], hidden: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DashboardLayout
  } catch { /* noop */ }
  return { order: [...DEFAULT_WIDGETS], hidden: [] }
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(() => {
    if (typeof window !== 'undefined') return loadLayout()
    return { order: [...DEFAULT_WIDGETS], hidden: [] }
  })
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    saveLayout(layout)
  }, [layout])

  const toggleWidget = useCallback((id: WidgetId) => {
    setLayout((prev) => {
      const hidden = prev.hidden.includes(id)
        ? prev.hidden.filter((h) => h !== id)
        : [...prev.hidden, id]
      return { ...prev, hidden }
    })
  }, [])

  const moveWidget = useCallback((activeId: string, overId: string) => {
    setLayout((prev) => {
      const oldIndex = prev.order.indexOf(activeId as WidgetId)
      const newIndex = prev.order.indexOf(overId as WidgetId)
      if (oldIndex === -1 || newIndex === -1) return prev
      const newOrder = [...prev.order]
      newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, activeId as WidgetId)
      return { ...prev, order: newOrder }
    })
  }, [])

  const resetLayout = useCallback(() => {
    setLayout({ order: [...DEFAULT_WIDGETS], hidden: [] })
  }, [])

  const visibleWidgets = layout.order.filter((id) => !layout.hidden.includes(id))
  const hiddenWidgets = layout.order.filter((id) => layout.hidden.includes(id))

  return {
    visibleWidgets,
    hiddenWidgets,
    toggleWidget,
    moveWidget,
    resetLayout,
    isEditMode,
    setEditMode: setIsEditMode,
    allWidgets: layout.order,
  }
}

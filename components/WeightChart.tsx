'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Weight } from 'lucide-react'
import { Session } from '@/hooks/useSessions'

const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
const Line = dynamic(() => import('recharts').then((mod) => mod.Line), { ssr: false })
const XAxis = dynamic(() => import('recharts').then((mod) => mod.XAxis), { ssr: false })
const YAxis = dynamic(() => import('recharts').then((mod) => mod.YAxis), { ssr: false })
const Tooltip = dynamic(() => import('recharts').then((mod) => mod.Tooltip), { ssr: false })
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
)

function ChartSkeleton() {
  return (
    <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
      A carregar gráfico...
    </div>
  )
}

interface WeightChartProps {
  sessions: Session[]
}

interface ChartDataPoint {
  data: string
  peso: number | null
}

export function WeightChart({ sessions }: WeightChartProps) {
  const sessionsWithWeight = sessions
    .filter((s) => s.peso != null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  if (sessionsWithWeight.length === 0) {
    return null
  }

  const data: ChartDataPoint[] = sessionsWithWeight.map((s) => ({
    data: new Date(s.created_at).toLocaleDateString('pt-BR'),
    peso: s.peso,
  }))

  const weights = sessionsWithWeight.map((s) => s.peso as number)
  const minPeso = Math.min(...weights)
  const maxPeso = Math.max(...weights)
  const padding = (maxPeso - minPeso) * 0.1 || 1

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Weight className="h-4 w-4" />
          Evolução do Peso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis
              dataKey="data"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minPeso - padding, maxPeso + padding]}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} kg`}
            />
            <Tooltip
              formatter={(value) => [`${value} kg`, 'Peso']}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e5e5',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="peso"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
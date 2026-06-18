import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      {/* Page title */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>

      {/* Content cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 bg-card border border-border rounded-xl" />
        <div className="h-28 bg-card border border-border rounded-xl" />
        <div className="h-28 bg-card border border-border rounded-xl" />
      </div>

      <div className="h-64 bg-card border border-border rounded-xl" />

      <div className="flex items-center justify-center pt-4 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span className="text-sm">Carregando...</span>
      </div>
    </div>
  )
}

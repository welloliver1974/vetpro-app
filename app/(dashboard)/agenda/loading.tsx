export default function AgendaLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="h-8 w-8 bg-muted rounded-lg" />
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="h-8 w-8 bg-muted rounded-lg" />
      </div>

      <div className="flex gap-2">
        <div className="h-9 w-28 bg-muted rounded-lg" />
        <div className="h-9 w-32 bg-muted rounded-lg" />
        <div className="h-9 w-40 bg-muted rounded-lg" />
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-24 bg-card border border-border rounded-lg" />
            <div className="h-20 bg-card border border-border rounded-lg" />
            <div className="h-16 bg-card border border-border rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

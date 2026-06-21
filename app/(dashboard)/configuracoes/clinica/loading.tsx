export default function ClinicaLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded-lg" />
        <div className="h-4 w-64 bg-muted rounded" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="h-6 w-40 bg-muted rounded-lg" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-9 w-full bg-muted rounded-lg" />
            </div>
          ))}
        </div>
        <div className="h-9 w-32 bg-muted rounded-lg" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-muted rounded-lg" />
          <div className="h-5 w-5 bg-muted rounded" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded-full" />
              <div className="space-y-1 flex-1">
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-3 w-24 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

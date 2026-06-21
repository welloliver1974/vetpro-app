export default function PatientDetailLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6 animate-pulse">
      <div className="h-5 w-32 bg-muted rounded-lg" />

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted rounded-full" />
          <div className="space-y-2">
            <div className="h-7 w-48 bg-muted rounded-lg" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 bg-muted rounded" />
              <div className="h-5 w-28 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-b border-border pb-px">
        {['Sessões', 'Galeria', 'IA'].map((t) => (
          <div key={t} className="h-9 w-24 bg-muted rounded-t-lg" />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="h-5 w-40 bg-muted rounded" />
        <div className="h-9 w-36 bg-muted rounded-lg" />
      </div>

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex justify-between">
              <div className="space-y-2 w-2/3">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

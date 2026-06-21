export default function Loading() {
  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-5 w-72 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="flex justify-end">
        <div className="h-10 w-36 bg-muted animate-pulse rounded-lg" />
      </div>
      <div className="rounded-xl border border-border bg-card">
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
